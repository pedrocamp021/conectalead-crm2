import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Download, Filter, Search, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Lead, Column } from '../../lib/types';

interface Client {
  id: string;
  name: string;
  status: string;
  data_pagamento_atual: string | null;
  data_pagamento_real: string | null;
  proxima_data_pagamento: string | null;
  pagamento_confirmado: boolean;
  initial_fee: number;
  monthly_fee: number;
}

interface FilterState {
  status: string;
  name: string;
  dateRange: {
    start: string;
    end: string;
  };
  billingType: 'all' | 'initial' | 'recurring';
}

export const AdminPrevisao: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    name: '',
    dateRange: { start: '', end: '' },
    billingType: 'all'
  });

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('proxima_data_pagamento');

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

  const getCurrentMonthStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    const lastDayOfNextMonth = new Date(currentYear, currentMonth + 2, 0);

    // Received amount this month (already correct, keeping as is)
    const receivedAmount = clients
      .filter(client => {
        const paymentDate = client.data_pagamento_real || client.data_pagamento_atual;
        if (!paymentDate || !client.pagamento_confirmado) return false;
        const date = new Date(paymentDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, client) => {
        return sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee);
      }, 0);

    // Amount to receive this month (pending payments)
    const pendingAmount = clients
      .filter(client => {
        if (!client.proxima_data_pagamento || client.pagamento_confirmado) return false;
        const dueDate = new Date(client.proxima_data_pagamento);
        return dueDate >= firstDayOfMonth && dueDate <= lastDayOfMonth &&
               (client.status === 'pendente' || client.status === 'inadimplente');
      })
      .reduce((sum, client) => {
        return sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee);
      }, 0);

    // Next month forecast (including recurring payments)
    const nextMonthForecast = clients
      .filter(client => {
        if (client.status === 'cancelado') return false;
        if (!client.proxima_data_pagamento) return false;
        
        const dueDate = new Date(client.proxima_data_pagamento);
        const isNextMonth = dueDate >= nextMonth && dueDate <= lastDayOfNextMonth;
        
        // Include active clients with recurring payments
        const isActiveRecurring = client.status === 'ativo' && client.data_pagamento_real;
        
        return isNextMonth || isActiveRecurring;
      })
      .reduce((sum, client) => {
        // Use monthly_fee for recurring payments, initial_fee for new clients
        return sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee);
      }, 0);

    return {
      received: receivedAmount,
      pending: pendingAmount,
      nextMonth: nextMonthForecast
    };
  };

  const groupClientsByDay = () => {
    const groups: { [key: number]: Client[] } = {};
    
    clients.forEach(client => {
      if (!client.proxima_data_pagamento) return;
      
      const dueDate = new Date(client.proxima_data_pagamento);
      const day = dueDate.getDate();
      
      if (!groups[day]) {
        groups[day] = [];
      }
      
      groups[day].push(client);
    });

    return Object.entries(groups)
      .map(([day, clients]) => ({
        day: parseInt(day),
        clients,
        totalAmount: clients.reduce((sum, client) => {
          return sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee);
        }, 0)
      }))
      .sort((a, b) => a.day - b.day);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nome',
      'Tipo de Cobrança',
      'Próximo Vencimento',
      'Status',
      'Valor'
    ];

    const rows = filteredClients.map(client => [
      client.name,
      client.data_pagamento_real ? 'Recorrente' : 'Primeira Mensalidade',
      client.proxima_data_pagamento ? new Date(client.proxima_data_pagamento).toLocaleDateString() : '-',
      client.status,
      formatCurrency(client.data_pagamento_real ? client.monthly_fee : client.initial_fee)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'previsao-cobrancas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesStatus = !filters.status || client.status === filters.status;
    const matchesDate = (!filters.dateRange.start || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) <= new Date(filters.dateRange.end));
    const matchesBillingType = filters.billingType === 'all' || 
      (filters.billingType === 'initial' && !client.data_pagamento_real) ||
      (filters.billingType === 'recurring' && client.data_pagamento_real);

    return matchesSearch && matchesStatus && matchesDate && matchesBillingType;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const monthlyStats = getCurrentMonthStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Previsão de Cobranças</h2>
          <p className="text-gray-600">
            {filteredClients.length} clientes encontrados
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleExportCSV}
          icon={<Download className="h-4 w-4" />}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Recebido (Mês Atual)</p>
              <h3 className="text-2xl font-bold text-green-600">
                {formatCurrency(monthlyStats.received)}
              </h3>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">A Receber (Mês Atual)</p>
              <h3 className="text-2xl font-bold text-blue-600">
                {formatCurrency(monthlyStats.pending)}
              </h3>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Previsão (Próximo Mês)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(monthlyStats.nextMonth)}
              </h3>
            </div>
            <DollarSign className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por nome do cliente..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="inativo">Inativo</option>
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filters.billingType}
            onChange={(e) => setFilters({ ...filters, billingType: e.target.value as 'all' | 'initial' | 'recurring' })}
          >
            <option value="all">Todos os tipos</option>
            <option value="initial">Primeira Mensalidade</option>
            <option value="recurring">Mensalidade Recorrente</option>
          </select>

          <div className="flex space-x-2">
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.dateRange.start}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, start: e.target.value }
              })}
            />
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={filters.dateRange.end}
              onChange={(e) => setFilters({
                ...filters,
                dateRange: { ...filters.dateRange, end: e.target.value }
              })}
            />
          </div>
        </div>
      </div>

      {/* Lista de vencimentos */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Vencimentos por Dia
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {groupClientsByDay().map(group => (
            <div key={group.day} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">
                    Dia {group.day}
                  </h4>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {group.clients.length} clientes
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {formatCurrency(group.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {group.clients.map(client => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${client.data_pagamento_real ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                        `}>
                          {client.data_pagamento_real ? 'Mensalidade Recorrente' : 'Primeira Mensalidade'}
                        </span>
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${client.status === 'ativo' ? 'bg-green-100 text-green-800' : 
                            client.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}
                        `}>
                          {client.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(client.data_pagamento_real ? client.monthly_fee : client.initial_fee)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Vencimento: {new Date(client.proxima_data_pagamento!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};