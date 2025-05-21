import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Search, Filter, Calendar, DollarSign, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  status: string;
  data_pagamento_atual: string | null;
  data_pagamento_real: string | null;
  proxima_data_pagamento: string | null;
  pagamento_confirmado: boolean;
  valor_mensal: number;
}

export const AdminPagamentos: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [referenceMonth, setReferenceMonth] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Stats for top cards
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    pendingThisMonth: 0,
    nextMonthForecast: 0
  });

  useEffect(() => {
    fetchClients();
    calculateStats();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clients',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const lastDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      // Received this month
      const { data: received } = await supabase
        .from('payments')
        .select('amount')
        .gte('payment_date', firstDayOfMonth.toISOString())
        .lte('payment_date', lastDayOfMonth.toISOString())
        .eq('status', 'paid');

      // Pending this month
      const { data: pending } = await supabase
        .from('payments')
        .select('amount')
        .gte('due_date', firstDayOfMonth.toISOString())
        .lte('due_date', lastDayOfMonth.toISOString())
        .eq('status', 'pending');

      // Next month forecast
      const { data: forecast } = await supabase
        .from('payments')
        .select('amount')
        .gte('due_date', firstDayNextMonth.toISOString())
        .lte('due_date', lastDayNextMonth.toISOString())
        .eq('status', 'pending');

      setStats({
        receivedThisMonth: received?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        pendingThisMonth: pending?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        nextMonthForecast: forecast?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handlePaymentConfirmation = async (client: Client) => {
    setSelectedClient(client);
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedClient || !paymentDate || !referenceMonth) return;

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          data_pagamento_real: paymentDate,
          pagamento_confirmado: true,
          data_pagamento_atual: referenceMonth,
          proxima_data_pagamento: new Date(referenceMonth).setMonth(new Date(referenceMonth).getMonth() + 1),
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment confirmed successfully',
      });

      setIsPaymentModalOpen(false);
      setSelectedClient(null);
      setPaymentDate('');
      setReferenceMonth('');
      fetchClients();
      calculateStats();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payment',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    const matchesPayment = !paymentFilter || 
      (paymentFilter === 'paid' && client.pagamento_confirmado) ||
      (paymentFilter === 'pending' && !client.pagamento_confirmado);
    
    let matchesDate = true;
    if (dateFilter.start && dateFilter.end) {
      const paymentDate = new Date(client.data_pagamento_atual || '');
      const startDate = new Date(dateFilter.start);
      const endDate = new Date(dateFilter.end);
      matchesDate = paymentDate >= startDate && paymentDate <= endDate;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Controle de Pagamentos</h2>
        <p className="text-gray-600">Gerencie os pagamentos dos clientes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Valor Recebido</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.receivedThisMonth)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">A Receber (Mês Atual)</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.pendingThisMonth)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Previsão Próximo Mês</p>
                <h3 className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.nextMonthForecast)}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">Todos os Pagamentos</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
          </select>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
            />
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
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
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{client.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Primeira Mensalidade
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(client.valor_mensal)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {client.proxima_data_pagamento
                      ? new Date(client.proxima_data_pagamento).toLocaleDateString()
                      : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {client.pagamento_confirmado ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-4 h-4 mr-1" />
                      Pendente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handlePaymentConfirmation(client)}
                    disabled={client.pagamento_confirmado}
                  >
                    Confirmar Pagamento
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Confirmation Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Data do Pagamento</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label>Mês de Referência</label>
              <Input
                type="month"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPayment}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};