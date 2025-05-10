import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../lib/types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { X, Loader2 } from 'lucide-react';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onClientUpdated: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ 
  isOpen, 
  onClose,
  client,
  onClientUpdated
}) => {
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [plan, setPlan] = useState(client.plan);
  const [expiration, setExpiration] = useState(
    new Date(client.expiration_date).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState(client.status);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          name,
          email,
          plan,
          expiration_date: expiration,
          status,
        })
        .eq('id', client.id);

      if (updateError) throw updateError;

      onClientUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update client');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Edit Client</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Client Name"
              required
            />
            
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Basic">Basic</option>
                <option value="Professional">Professional</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
            
            <Input
              label="Expiration Date"
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="ghost"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                  Updating...
                </>
              ) : (
                'Update Client'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};