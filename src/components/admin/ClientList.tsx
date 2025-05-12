import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { EditClientModal } from './EditClientModal';
import { Button } from '../ui/Button';
import { Edit, Trash2, Loader2, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Client } from '../../lib/types';
import { useToast } from '../ui/use-toast';

export const ClientList: React.FC = () => {
  const { clients, fetchClients, isLoadingData } = useAppStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('Esta ação irá excluir permanentemente o cliente e todos os seus dados. Deseja continuar?')) {
      return;
    }

    try {
      // Delete client's leads
      await supabase.from('leads').delete().eq('client_id', id);
      
      // Delete client's columns
      await supabase.from('columns').delete().eq('client_id', id);
      
      // Delete the client
      const { error } = await supabase.from('clients').delete().eq('id', id);
      
      if (error) throw error;

      toast({
        title: "Cliente excluído",
        description: "O cliente e seus dados foram removidos com sucesso.",
      });
      
      // Refresh the client list
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente. Tente novamente.",
      });
    }
  };

  const handleToggleStatus = async (client: Client, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `O cliente foi marcado como ${newStatus}.`,
      });

      fetchClients();
    } catch (error) {
      console.error('Error updating client status:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status do cliente.",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
        text: 'Ativo'
      },
      inativo: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <XCircle className="w-3 h-3 mr-1" />,
        text: 'Inativo'
      },
      vencido: {
        color: 'bg-red-100 text-red-800',
        icon: <Clock className="w-3 h-3 mr-1" />,
        text: 'Vencido'
      }
    };
    
    const badge = badges[status as keyof typeof badges] || badges.inativo;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
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
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {new Date(client.plan_expiry).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={client.status}
                    onChange={(e) => handleToggleStatus(client, e.target.value)}
                    className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="vencido">Vencido</option>
                  </select>
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
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDeleteClient(client.id)}
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
      
      <EditClientModal 
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={selectedClient}
        onUpdate={fetchClients}
      />
    </div>
  );
};