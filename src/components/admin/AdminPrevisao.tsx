import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Calendar, Filter, Download, Loader2, AlertCircle, DollarSign } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  plan_type: string;
  status: string;
  initial_fee: number;
  monthly_fee: number;
  proxima_data_pagamento: string | null;
  data_pagamento_real: string | null;
  pagamento_confirmado: boolean;
}

interface BillingGroup {
  day: number;
  clients: Client[];
  totalAmount: number;
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

  const filteredClients = clients.filter(client => {
    const matchesName = client.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesStatus = !filters.status || getClientStatus(client) === filters.status;
    const matchesDateRange = (!filters.dateRange.start || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) >= new Date(filters.dateRange.start)) &&
      (!filters.dateRange.end || !client.proxima_data_pagamento || 
      new Date(client.proxima_data_pagamento) <= new Date(filters.dateRange.end));
    const matchesBillingType = filters.billingType === 'all' || 
      (filters.billingType === 'initial' && !client.data_pagamento_real) ||
      (filters.billingType === 'recurring' && client.data_pagamento_real);

    return matchesName && matchesStatus && matchesDateRange && matchesBillingType;
  });

  const getClientStatus = (client: Client): string => {
    if (client.pagamento_confirmado) return 'pago';
    if (!client.proxima_data_pagamento) return 'pendente';
    
    const today = new Date();
    const dueDate = new Date(client.proxima_data_pagamento);
    const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDays > 4 ? 'inativo' : 'pendente';
  };

  const getCurrentMonthStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthlyClients = clients.filter(client => {
      if (!client.proxima_data_pagamento) return false;
      const dueDate = new Date(client.proxima_data_pagamento);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });

    const paidAmount = monthlyClients
      .filter(client => client.pagamento_confirmado)
      .reduce((sum, client) => sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee), 0);

    const pendingAmount = monthlyClients
      .filter(client => !client.pagamento_confirmado)
      .reduce((sum, client) => sum + (client.data_pagamento_real ? client.monthly_fee : client.initial_fee), 0);

    return {
      totalPaid: paidAmount,
      totalPending: pendingAmount,
      total: paidAmount + pendingAmount
    };
  };

  const groupClientsByDay = (clients: Client[]): BillingGroup[] => {
    const groups: { [key: number]: { clients: Client[], totalAmount: number } } = {};
    
    clients.forEach(client => {
      if (!client.proxima_data_pagamento) return;
      
      const dueDate = new Date(client.proxima_data_pagamento);
      const day = dueDate.getDate();
      
      if (!groups[day]) {
        groups[day] = { clients: [], totalAmount: 0 };
      }
      
      const amount = client.data_pagamento_real ? client.monthly_fee : client.initial_fee;
      groups[day].clients.push(client);
      groups[day].totalAmount += amount;
    });

    return Object.entries(groups)
      .map(([day, data]) => ({
        day: parseInt(day),
        clients: data.clients,
        totalAmount: data.totalAmount
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
      getClientStatus(client),
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
                {formatCurrency(monthlyStats.totalPaid)}
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
                {formatCurrency(monthlyStats.totalPending)}
              </h3>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Previsto (Mês Atual)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency(monthlyStats.total)}
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
            <option value="pago">Pago</option>
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
          {groupClientsByDay(filteredClients).map(group => (
            <div key={group.day} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
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
                          ${getClientStatus(client) === 'pago' ? 'bg-green-100 text-green-800' : 
                            getClientStatus(client) === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}
                        `}>
                          {getClientStatus(client)}
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