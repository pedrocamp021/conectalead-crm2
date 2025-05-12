import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Loader2, Plus } from 'lucide-react';

interface AddClientModalProps {
  onClientAdded: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  onClientAdded
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    plan_type: 'mensal',
    status: 'ativo',
    plan_expiry: new Date().toISOString().split('T')[0],
    billing_message: '',
    billing_automation_enabled: false,
    initial_fee: '0.00',
    monthly_fee: '0.00'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          email: formData.email,
          whatsapp: formData.whatsapp,
          plan_type: formData.plan_type,
          status: formData.status,
          plan_expiry: formData.plan_expiry,
          billing_message: formData.billing_message,
          billing_automation_enabled: formData.billing_automation_enabled,
          initial_fee: parseFloat(formData.initial_fee),
          monthly_fee: parseFloat(formData.monthly_fee),
          user_id: user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!data) throw new Error('Nenhum dado retornado após inserção');

      const defaultColumns = [
        { name: 'Novos Leads', order: 1, color: 'blue', client_id: data.id },
        { name: 'Em Contato', order: 2, color: 'yellow', client_id: data.id },
        { name: 'Reunião Agendada', order: 3, color: 'purple', client_id: data.id },
        { name: 'Fechado', order: 4, color: 'green', client_id: data.id }
      ];

      const { error: columnsError } = await supabase.from('columns').insert(defaultColumns);
      if (columnsError) throw columnsError;

      toast({
        title: "Cliente cadastrado com sucesso",
        description: "O cliente foi adicionado e as colunas padrão foram criadas."
      });

      onClientAdded();
      setIsModalOpen(false);

      setFormData({
        name: '',
        email: '',
        whatsapp: '',
        plan_type: 'mensal',
        status: 'ativo',
        plan_expiry: new Date().toISOString().split('T')[0],
        billing_message: '',
        billing_automation_enabled: false,
        initial_fee: '0.00',
        monthly_fee: '0.00'
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar o cliente."
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
    <>
      <Button
        variant="primary"
        onClick={() => setIsModalOpen(true)}
        icon={<Plus className="h-4 w-4" />}
      >
        Cadastrar Cliente
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0 py-4 px-6 border-b">
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Nome da Empresa" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="WhatsApp" type="tel" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="+5511999999999" />
                  <Input label="Data de Vencimento" type="date" value={formData.plan_expiry} onChange={(e) => setFormData({ ...formData, plan_expiry: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Plano</label>
                    <select value={formData.plan_type} onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="mensal">Mensal</option>
                      <option value="trimestral">Trimestral</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Valor da Primeira Mensalidade (R$)" type="text" value={formData.initial_fee} onChange={(e) => setFormData({ ...formData, initial_fee: formatCurrency(e.target.value) })} required />
                  <Input label="Valor da Mensalidade Recorrente (R$)" type="text" value={formData.monthly_fee} onChange={(e) => setFormData({ ...formData, monthly_fee: formatCurrency(e.target.value) })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem de Cobrança</label>
                  <textarea value={formData.billing_message} onChange={(e) => setFormData({ ...formData, billing_message: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={3} placeholder="Mensagem que será enviada nos avisos de cobrança..." />
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
                  <input type="checkbox" id="automation" checked={formData.billing_automation_enabled} onChange={(e) => setFormData({ ...formData, billing_automation_enabled: e.target.checked })} className="h-4 w-4 text-blue-600 rounded" />
                  <label htmlFor="automation" className="text-sm text-gray-700">Ativar automação de cobrança</label>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 border-t bg-white px-6 py-4">
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} type="button" disabled={isLoading}>Cancelar</Button>
                <Button variant="primary" type="submit" disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Cadastrando...</>) : ('Cadastrar Cliente')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};