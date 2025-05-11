import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { X, Loader2 } from 'lucide-react';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ 
  isOpen, 
  onClose,
  onClientAdded
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('Basic');
  const [expiration, setExpiration] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;

      const { error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            name,
            email,
            plan,
            expiration_date: expiration,
            status: 'active',
            user_id: userId,
          },
        ]);

      if (clientError) throw clientError;

      const { data: clientData, error: fetchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!clientData) throw new Error('Failed to fetch client data');

      const defaultColumns = [
        { name: 'New Leads', order: 1, color: 'blue', client_id: clientData.id },
        { name: 'Contacted', order: 2, color: 'yellow', client_id: clientData.id },
        { name: 'Meeting Scheduled', order: 3, color: 'purple', client_id: clientData.id },
        { name: 'Closed', order: 4, color: 'green', client_id: clientData.id },
      ];

      const { error: columnsError } = await supabase
        .from('columns')
        .insert(defaultColumns);

      if (columnsError) throw columnsError;

      onClientAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add client');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Add New Client</h3>
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
            
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
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
                  Creating...
                </>
              ) : (
                'Create Client'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
