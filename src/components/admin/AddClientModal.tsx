import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  open,
  onClose,
  onClientAdded
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    plan_type: 'mensal',
    status: 'ativo',
    expiration_date: '',
    billing_message: '',
    billing_automation_enabled: false,
    initial_fee: '0.00',
    monthly_fee: '0.00'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.expiration_date) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create auth user with random password
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert([{
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          whatsapp: formData.phone,
          plan_type: formData.plan_type,
          status: formData.status,
          expiration_date: formData.expiration_date,
          billing_message: formData.billing_message,
          billing_automation_enabled: formData.billing_automation_enabled,
          initial_fee: parseFloat(formData.initial_fee),
          monthly_fee: parseFloat(formData.monthly_fee),
          cnpj: formData.cnpj
        }]);

      if (clientError) throw clientError;

      // Create default columns
      const defaultColumns = [
        { name: 'Novos Leads', order: 1, color: 'blue', client_id: authData.user.id },
        { name: 'Em Contato', order: 2, color: 'yellow', client_id: authData.user.id },
        { name: 'Reunião Agendada', order: 3, color: 'purple', client_id: authData.user.id },
        { name: 'Fechado', order: 4, color: 'green', client_id: authData.user.id }
      ];

      const { error: columnsError } = await supabase
        .from('columns')
        .insert(defaultColumns);

      if (columnsError) throw columnsError;

      // Send password reset email
      await supabase.auth.resetPasswordForEmail(formData.email);

      toast({
        title: "Cliente cadastrado",
        description: "Um email de redefinição de senha foi enviado.",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        cnpj: '',
        plan_type: 'mensal',
        status: 'ativo',
        expiration_date: '',
        billing_message: '',
        billing_automation_enabled: false,
        initial_fee: '0.00',
        monthly_fee: '0.00'
      });

      onClientAdded();
      onClose();
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar o cliente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    const floatValue = parseFloat(numericValue) / 100;
    return floatValue.toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-1 py-4 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome da Empresa *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefone *"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+5511999999999"
                required
              />

              <Input
                label="CNPJ"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Plano
                </label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
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
                  required
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Valor da Primeira Mensalidade (R$)"
                type="text"
                value={formData.initial_fee}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  initial_fee: formatCurrency(e.target.value)
                })}
                required
              />

              <Input
                label="Valor da Mensalidade Recorrente (R$)"
                type="text"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  monthly_fee: formatCurrency(e.target.value)
                })}
                required
              />
            </div>

            <Input
              label="Data de Vencimento *"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
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

            <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
              <input
                type="checkbox"
                id="automation"
                checked={formData.billing_automation_enabled}
                onChange={(e) => setFormData({
                  ...formData,
                  billing_automation_enabled: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="automation" className="text-sm text-gray-700">
                Ativar automação de cobrança
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-gray-200 bg-white sticky bottom-0">
            <Button
              variant="ghost"
              onClick={onClose}
              type="button"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Cliente'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};