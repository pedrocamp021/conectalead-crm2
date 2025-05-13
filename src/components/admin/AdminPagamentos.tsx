import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Search, Filter, Calendar, DollarSign, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  status: string;
  data_pagamento_atual: string | null;
  proxima_data_pagamento: string | null;
  pagamento_confirmado: boolean;
  monthly_fee: number;
}

export const AdminPagamentos: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;

      // Update status based on payment date
      const updatedClients = (data || []).map(client => {
        const today = new Date();
        const nextPayment = client.proxima_data_pagamento ? new Date(client.proxima_data_pagamento) : null;
        
        if (nextPayment && !client.pagamento_confirmado) {
          const diffDays = Math.floor((today.getTime() - nextPayment.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 4) {
            return { ...client, status: 'inativo' };
          }
        }
        return client;
      });

      // Update any status changes in the database
      const statusUpdates = updatedClients.filter(client => 
        client.status !== (data?.find(c => c.id === client.id)?.status)
      );

      if (statusUpdates.length > 0) {
        await Promise.all(
          statusUpdates.map(client =>
            supabase
              .from('clients')
              .update({ status: client.status })
              .eq('id', client.id)
          )
        );
      }

      setClients(updatedClients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
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

  const handlePaymentToggle = async (client: Client) => {
    try {
      const today = new Date();
      const updates = client.pagamento_confirmado
        ? {
            data_pagamento_atual: null,
            proxima_data_pagamento: null,
            pagamento_confirmado: false,
            status: 'inativo'
          }
        : {
            data_pagamento_atual: today.toISOString(),
            proxima_data_pagamento: new Date(today.setDate(today.getDate() + 30)).toISOString(),
            pagamento_confirmado: true,
            status: 'ativo'
          };

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: client.pagamento_confirmado ? "Pagamento desmarcado" : "Pagamento confirmado",
        description: client.pagamento_confirmado 
          ? "O registro de pagamento foi removido."
          : "O pagamento foi registrado com sucesso.",
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do pagamento.",
      });
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    const matchesPayment = !paymentFilter || 
      (paymentFilter === 'paid' && client.pagamento_confirmado) ||
      (paymentFilter === 'unpaid' && !client.pagamento_confirmado);
    const matchesDate = (!dateFilter.start || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) >= new Date(dateFilter.start)) &&
      (!dateFilter.end || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) <= new Date(dateFilter.end));

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, text: 'Ativo' },
      inativo: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, text: 'Inativo' },
      pendente: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1" />, text: 'Pendente' }
    };

    const badge = badges[status as keyof typeof badges] || badges.pendente;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
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
        <h2 className="text-2xl font-bold text-gray-800">Controle de Pagamentos</h2>
        <p className="text-gray-600 mt-1">Gerencie os pagamentos dos clientes</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="pendente">Pendente</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">Todos os pagamentos</option>
            <option value="paid">Pagos</option>
            <option value="unpaid">Não pagos</option>
          </select>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              placeholder="Data final"
            />
          </div>
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
                Último Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Próximo Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
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
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.data_pagamento_atual 
                      ? new Date(client.data_pagamento_atual).toLocaleDateString()
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.proxima_data_pagamento
                      ? new Date(client.proxima_data_pagamento).toLocaleDateString()
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(client.monthly_fee || 0)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(client.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <Button
                    variant={client.pagamento_confirmado ? "outline" : "primary"}
                    size="sm"
                    onClick={() => handlePaymentToggle(client)}
                    icon={client.pagamento_confirmado 
                      ? <XCircle className="h-4 w-4" />
                      : <CheckCircle className="h-4 w-4" />
                    }
                  >
                    {client.pagamento_confirmado ? 'Desmarcar pagamento' : 'Marcar como Pago'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};