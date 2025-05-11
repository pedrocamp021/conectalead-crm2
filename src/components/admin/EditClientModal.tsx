import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { supabase } from '@/lib/supabase';

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
      alert('Erro ao salvar.');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Plano" />
          <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Status" />
          <Input
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            placeholder="Expiração"
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};