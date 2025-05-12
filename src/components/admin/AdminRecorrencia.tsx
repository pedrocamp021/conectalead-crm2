import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Search, Filter, Download, Loader2, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  plan_type: string;
  status: string;
  created_at: string;
}

interface PaymentStats {
  client_id: string;
  total_payments: number;
  first_payment: string;
  last_payment: string;
}

interface ClientWithStats extends Client {
  stats: {
    total_payments: number;
    first_payment: string | null;
    last_payment: string | null;
    months_active: number;
  };
}

export const AdminRecorrencia: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [sortBy, setSortBy] = useState<'months' | 'payments'>('months');

  const fetchData = async () => {
    try {
      // Fetch clients with their payment stats
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          payments (
            id,
            payment_date,
            status
          )
        `)
        .order('name');

      if (clientsError) throw clientsError;

      // Process client data with stats
      const processedClients: ClientWithStats[] = (clientsData || []).map(client => {
        const payments = client.payments || [];
        const paidPayments = payments.filter(p => p.status === 'paid');
        const firstPayment = paidPayments.length > 0 
          ? new Date(Math.min(...paidPayments.map(p => new Date(p.payment_date).getTime())))
          : null;
        const lastPayment = paidPayments.length > 0
          ? new Date(Math.max(...paidPayments.map(p => new Date(p.payment_date).getTime())))
          : null;
        
        const createdAt = new Date(client.created_at);
        const now = new Date();
        const monthsActive = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
        );

        return {
          ...client,
          stats: {
            total_payments: paidPayments.length,
            first_payment: firstPayment?.toISOString(),
            last_payment: lastPayment?.toISOString(),
            months_active: monthsActive
          }
        };
      });

      setClients(processedClients);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados do relatório.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || client.status === statusFilter;
      const matchesPlan = !planFilter || client.plan_type === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      if (sortBy === 'months') {
        return b.stats.months_active - a.stats.months_active;
      }
      return b.stats.total_payments - a.stats.total_payments;
    });

  const handleExportCSV = () => {
    const headers = [
      'Nome do Cliente',
      'Total de Pagamentos',
      'Primeiro Pagamento',
      'Último Pagamento',
      'Meses Ativo',
      'Status',
      'Plano'
    ];

    const rows = filteredClients.map(client => [
      client.name,
      client.stats.total_payments,
      client.stats.first_payment ? new Date(client.stats.first_payment).toLocaleDateString() : '-',
      client.stats.last_payment ? new Date(client.stats.last_payment).toLocaleDateString() : '-',
      client.stats.months_active,
      client.status,
      client.plan_type
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio-recorrencia.csv');
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Relatório de Recorrência</h2>
        <p className="text-gray-600 mt-1">
          Análise de pagamentos e tempo de permanência dos clientes
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
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
            <option value="vencido">Vencido</option>
          </select>

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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'months' | 'payments')}
          >
            <option value="months">Ordenar por tempo ativo</option>
            <option value="payments">Ordenar por total de pagamentos</option>
          </select>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            icon={<Download className="h-4 w-4" />}
          >
            Exportar CSV
          </Button>
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
                Total de Pagamentos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Primeiro Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Último Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tempo Ativo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">Plano {client.plan_type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.stats.total_payments} pagamentos
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {client.stats.first_payment 
                      ? new Date(client.stats.first_payment).toLocaleDateString()
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {client.stats.last_payment
                      ? new Date(client.stats.last_payment).toLocaleDateString()
                      : '-'
                    }
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    {client.stats.months_active} meses
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${client.status === 'ativo' ? 'bg-green-100 text-green-800' : ''}
                    ${client.status === 'inativo' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${client.status === 'vencido' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {client.status === 'ativo' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {client.status === 'inativo' && <XCircle className="w-3 h-3 mr-1" />}
                    {client.status === 'vencido' && <Clock className="w-3 h-3 mr-1" />}
                    {client.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};