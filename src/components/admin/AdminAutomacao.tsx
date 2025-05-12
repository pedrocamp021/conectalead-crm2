import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Filter, Calendar, BellRing, MessageSquare, Loader2, CheckCircle, XCircle, Clock, Wheat as Whatsapp } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  plan_type: string;
  billing_day: number;
  whatsapp: string;
  billing_message: string;
  billing_automation_enabled: boolean;
}

export const AdminAutomacao: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [automationFilter, setAutomationFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [planFilter, setPlanFilter] = useState('');
  const [editingClient, setEditingClient] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('billing_day');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados dos clientes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleUpdateClient = async (
    clientId: string, 
    updates: Partial<Client>
  ) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Atualizado com sucesso",
        description: "As configurações de automação foram salvas.",
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar as configurações.",
      });
    }
  };

  const handleToggleAutomation = async (client: Client) => {
    await handleUpdateClient(client.id, {
      billing_automation_enabled: !client.billing_automation_enabled
    });
  };

  const handleSaveChanges = async (client: Client) => {
    await handleUpdateClient(client.id, {
      billing_day: client.billing_day,
      billing_message: client.billing_message,
      whatsapp: client.whatsapp
    });
    setEditingClient(null);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = !planFilter || client.plan_type === planFilter;
    const matchesAutomation = 
      automationFilter === 'all' || 
      (automationFilter === 'enabled' && client.billing_automation_enabled) ||
      (automationFilter === 'disabled' && !client.billing_automation_enabled);
    
    return matchesSearch && matchesPlan && matchesAutomation;
  });

  const isNearDueDate = (billingDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysUntilDue = billingDay - currentDay;
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  };

  const translatePlanType = (planType: string) => {
    const translations = {
      'mensal': 'Mensal',
      'trimestral': 'Trimestral',
      'anual': 'Anual'
    };
    return translations[planType as keyof typeof translations] || planType;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Automação de Cobrança</h2>
        <p className="text-gray-600 mt-1">Gerencie as notificações automáticas de cobrança para os clientes</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
            value={automationFilter}
            onChange={(e) => setAutomationFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
          >
            <option value="all">Todos os status</option>
            <option value="enabled">Automação ativada</option>
            <option value="disabled">Automação desativada</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                WhatsApp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mensagem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Automação
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr 
                key={client.id} 
                className={`
                  hover:bg-gray-50
                  ${isNearDueDate(client.billing_day) ? 'bg-yellow-50' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{translatePlanType(client.plan_type)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingClient === client.id ? (
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={client.billing_day}
                      onChange={(e) => {
                        const newClients = clients.map(c => 
                          c.id === client.id 
                            ? { ...c, billing_day: parseInt(e.target.value) }
                            : c
                        );
                        setClients(newClients);
                      }}
                      className="w-20"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      Dia {client.billing_day}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingClient === client.id ? (
                    <Input
                      value={client.whatsapp}
                      onChange={(e) => {
                        const newClients = clients.map(c => 
                          c.id === client.id 
                            ? { ...c, whatsapp: e.target.value }
                            : c
                        );
                        setClients(newClients);
                      }}
                      placeholder="+5511999999999"
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-900">
                      <Whatsapp className="h-4 w-4 text-green-500 mr-1" />
                      {client.whatsapp || 'Não configurado'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingClient === client.id ? (
                    <textarea
                      value={client.billing_message}
                      onChange={(e) => {
                        const newClients = clients.map(c => 
                          c.id === client.id 
                            ? { ...c, billing_message: e.target.value }
                            : c
                        );
                        setClients(newClients);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      rows={2}
                      placeholder="Digite a mensagem de cobrança..."
                    />
                  ) : (
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {client.billing_message || 'Mensagem padrão'}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleAutomation(client)}
                    className={`
                      relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full 
                      cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none 
                      ${client.billing_automation_enabled ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow 
                        transform ring-0 transition ease-in-out duration-200
                        ${client.billing_automation_enabled ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {editingClient === client.id ? (
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingClient(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSaveChanges(client)}
                        icon={<CheckCircle className="h-4 w-4" />}
                      >
                        Salvar
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingClient(client.id)}
                      icon={<MessageSquare className="h-4 w-4" />}
                    >
                      Editar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};