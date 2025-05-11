import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    plan: string;
    status: string;
    expiration: string;
  } | null;
  onUpdate: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ open, onClose, client, onUpdate }) => {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [expiration, setExpiration] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setPlan(client.plan);
      setStatus(client.status);
      setExpiration(client.expiration);
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setLoading(true);

    const { error } = await supabase
      .from('clients')
      .update({ name, plan, status, expiration })
      .eq('id', client.id);

    setLoading(false);

    if (!error) {
      onUpdate();
      onClose();
    } else {
      alert('Error saving changes.');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input 
            label="Name"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Name" 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="free">Free</option>
              <option value="trial">Trial</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Input
            label="Expiration Date"
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};