import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../ui/use-toast';
import { Search, Edit, Trash2, User, Calendar, CheckCircle, XCircle, Clock, Filter, Plus, Wheat as Whatsapp, MessageSquare, BellRing } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddClientModal } from './AddClientModal';

interface EditClientForm {
  id: string;
  name: string;
  email: string;
  plan_type: string;
  status: string;
  billing_day: number;
  whatsapp: string;
  billing_message: string;
  billing_automation_enabled: boolean;
}

const AdminClientes: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<EditClientForm | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleEditClient = (client: any) => {
    setEditingClient({
      id: client.id,
      name: client.name,
      email: client.email,
      plan_type: client.plan_type,
      status: client.status,
      billing_day: client.billing_day || 1,
      whatsapp: client.whatsapp || '',
      billing_message: client.billing_message || '',
      billing_automation_enabled: client.billing_automation_enabled || false,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: editingClient.name,
          email: editingClient.email,
          plan_type: editingClient.plan_type,
          status: editingClient.status,
          billing_day: editingClient.billing_day,
          whatsapp: editingClient.whatsapp,
          billing_message: editingClient.billing_message,
          billing_automation_enabled: editingClient.billing_automation_enabled,
        })
        .eq('id', editingClient.id);

      if (error) throw error;

      toast({
        title: "Cliente atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

      setIsEditModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o cliente.",
      });
    }
  };

  const handleToggleStatus = async (client: any) => {
    const newStatus = client.status === 'ativo' ? 'inativo' : 'ativo';

    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Cliente marcado como ${newStatus}.`,
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do cliente.",
      });
    }
  };

  const handleDeleteClient = async (client: any) => {
    const confirmed = window.confirm(
      "ATENÇÃO: Esta ação irá excluir permanentemente o cliente e todos os seus dados. Esta ação não pode ser desfeita. Digite CONFIRMAR para prosseguir."
    );

    if (!confirmed || prompt("Digite CONFIRMAR para excluir permanentemente") !== "CONFIRMAR") {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "O cliente foi removido permanentemente.",
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o cliente.",
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = (
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesPlan = !planFilter || client.plan_type === planFilter;
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      inativo: { color: 'bg-yellow-100 text-yellow-800', icon: <XCircle className="w-3 h-3 mr-1" /> },
      vencido: { color: 'bg-red-100 text-red-800', icon: <Clock className="w-3 h-3 mr-1" /> }
    };

    const badge = badges[status as keyof typeof badges] || badges.inativo;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes</h2>
          <p className="text-gray-600 mt-1">Gerencie os clientes e suas configurações</p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="h-4 w-4" />}
        >
          Cadastrar Cliente
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="">Todos os planos</option>
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                WhatsApp
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.plan_type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(client.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    Dia {client.billing_day || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.whatsapp ? (
                    <div className="flex items-center text-sm text-gray-900">
                      <Whatsapp className="h-4 w-4 text-green-500 mr-1" />
                      {client.whatsapp}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Não cadastrado</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClient(client)}
                      icon={<Edit className="h-4 w-4" />}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={client.status === 'ativo' ? 'danger' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(client)}
                    >
                      {client.status === 'ativo' ? 'Inativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClient(client)}
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          
          {editingClient && (
            <div className="flex-1 overflow-y-auto px-1 -mx-1">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="WhatsApp"
                    type="tel"
                    value={editingClient.whatsapp}
                    onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                    placeholder="+5511999999999"
                  />

                  <Input
                    label="Dia do Vencimento"
                    type="number"
                    min="1"
                    max="31"
                    value={editingClient.billing_day}
                    onChange={(e) => setEditingClient({ 
                      ...editingClient, 
                      billing_day: parseInt(e.target.value) 
                    })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Plano
                    </label>
                    <select
                      value={editingClient.plan_type}
                      onChange={(e) => setEditingClient({ ...editingClient, plan_type: e.target.value })}
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
                      value={editingClient.status}
                      onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem de Cobrança
                  </label>
                  <textarea
                    value={editingClient.billing_message}
                    onChange={(e) => setEditingClient({ 
                      ...editingClient, 
                      billing_message: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Mensagem que será enviada nos avisos de cobrança..."
                  />
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
                  <input
                    type="checkbox"
                    id="automation"
                    checked={editingClient.billing_automation_enabled}
                    onChange={(e) => setEditingClient({
                      ...editingClient,
                      billing_automation_enabled: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="automation" className="text-sm text-gray-700">
                    Ativar automação de cobrança
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-gray-200 flex-shrink-0">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveClient}
              icon={<CheckCircle className="h-4 w-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddClientModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClientAdded={fetchClients}
      />
    </div>
  );
};

export default AdminClientes;

export { AdminClientes };