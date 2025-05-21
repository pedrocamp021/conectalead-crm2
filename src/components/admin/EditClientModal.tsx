import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { useToast } from '../ui/use-toast';

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  client: {
    id: string;
    name: string;
    email: string;
    plan_type: string;
    plan_expiry: string;
    status: string;
    whatsapp: string;
    billing_message: string;
    initial_fee: number;
    monthly_fee: number;
    data_base_cliente: string;
    valor_mensal: number;
  } | null;
  onUpdate: () => void;
}

export const EditClientModal: React.FC<EditClientModalProps> = ({ 
  open, 
  onClose, 
  client, 
  onUpdate 
}) => {
  const { isAdmin } = useAppStore();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan_type: 'mensal',
    plan_expiry: '',
    status: 'ativo',
    whatsapp: '',
    billing_message: '',
    initial_fee: '0.00',
    monthly_fee: '0.00',
    data_base_cliente: '',
    valor_mensal: '0.00'
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        plan_type: client.plan_type,
        plan_expiry: client.plan_expiry,
        status: client.status,
        whatsapp: client.whatsapp || '',
        billing_message: client.billing_message || '',
        initial_fee: client.initial_fee.toFixed(2),
        monthly_fee: client.monthly_fee.toFixed(2),
        data_base_cliente: client.data_base_cliente || new Date().toISOString().split('T')[0],
        valor_mensal: client.valor_mensal.toFixed(2)
      });
    }
  }, [client]);

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toFixed(2);
  };

  const handleSave = async () => {
    if (!client) return;
    setLoading(true);

    try {
      const updates = {
        name: formData.name,
        email: formData.email,
        plan_type: formData.plan_type,
        plan_expiry: formData.plan_expiry,
        status: formData.status,
        whatsapp: formData.whatsapp,
        billing_message: formData.billing_message,
        initial_fee: parseFloat(formData.initial_fee),
        monthly_fee: parseFloat(formData.monthly_fee),
        data_base_cliente: formData.data_base_cliente,
        valor_mensal: parseFloat(formData.valor_mensal)
      };

      const { error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client.id);

      if (updateError) throw updateError;

      // Generate or update payment record if client is active and has monthly fee
      if (formData.status === 'ativo' && parseFloat(formData.valor_mensal) > 0) {
        const dueDate = new Date(formData.data_base_cliente);
        
        // Check for existing pending payment
        const { data: existingPayment, error: checkError } = await supabase
          .from('payments')
          .select('*')
          .eq('client_id', client.id)
          .eq('status', 'pending')
          .single();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingPayment) {
          // Update existing payment
          const { error: updatePaymentError } = await supabase
            .from('payments')
            .update({
              due_date: dueDate.toISOString(),
              amount: parseFloat(formData.valor_mensal),
              reference_month: dueDate.toISOString()
            })
            .eq('id', existingPayment.id);

          if (updatePaymentError) throw updatePaymentError;
        } else {
          // Create new payment
          const { error: createPaymentError } = await supabase
            .from('payments')
            .insert([{
              client_id: client.id,
              due_date: dueDate.toISOString(),
              reference_month: dueDate.toISOString(),
              status: 'pending',
              amount: parseFloat(formData.valor_mensal),
              created_at: new Date().toISOString()
            }]);

          if (createPaymentError) throw createPaymentError;
        }
      }

      toast({
        title: "Cliente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o cliente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input 
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <Input 
            label="WhatsApp"
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            placeholder="+5511999999999"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Plano
              </label>
              <select
                value={formData.plan_type}
                onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Primeira Mensalidade (R$)"
                type="text"
                value={formData.initial_fee}
                onChange={(e) => setFormData({ ...formData, initial_fee: formatCurrency(e.target.value) })}
                placeholder="Ex: R$ 297,00"
                required
              />
              <Input
                label="Mensalidade Recorrente (R$)"
                type="text"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: formatCurrency(e.target.value), valor_mensal: formatCurrency(e.target.value) })}
                placeholder="Ex: R$ 157,00"
                required
              />
            </div>
          )}

          <Input
            label="Data Base de Cobrança"
            type="date"
            value={formData.data_base_cliente}
            onChange={(e) => setFormData({ ...formData, data_base_cliente: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem de Cobrança
            </label>
            <textarea
              value={formData.billing_message}
              onChange={(e) => setFormData({ ...formData, billing_message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Mensagem que será enviada nos avisos de cobrança..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};