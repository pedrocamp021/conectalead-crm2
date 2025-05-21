import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Search, Filter, Calendar, DollarSign, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface Payment {
  id: string;
  client_id: string;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  amount: number;
  reference_month: string;
  client: {
    name: string;
    email: string;
  };
}

export const AdminPagamentos: React.FC = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentDate, setPaymentDate] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Stats for top cards
  const [stats, setStats] = useState({
    receivedThisMonth: 0,
    pendingThisMonth: 0,
    nextMonthForecast: 0
  });

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          client:clients(name, email)
        `)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os pagamentos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    const receivedThisMonth = paymentsData
      .filter(p => {
        if (!p.payment_date || p.status !== 'paid') return false;
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && 
               paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingThisMonth = paymentsData
      .filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.due_date);
        return dueDate.getMonth() === currentMonth && 
               dueDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const nextMonthForecast = paymentsData
      .filter(p => {
        if (p.status !== 'pending') return false;
        const dueDate = new Date(p.due_date);
        return dueDate.getMonth() === nextMonth && 
               dueDate.getFullYear() === nextYear;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      receivedThisMonth,
      pendingThisMonth,
      nextMonthForecast
    });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePaymentConfirmation = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = async () => {
    if (!selectedPayment || !paymentDate) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_date: paymentDate
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi registrado com sucesso.",
      });

      setIsPaymentModalOpen(false);
      setSelectedPayment(null);
      setPaymentDate('');
      fetchPayments();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível confirmar o pagamento.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesDate = (!dateFilter.start || new Date(payment.due_date) >= new Date(dateFilter.start)) &&
                       (!dateFilter.end || new Date(payment.due_date) <= new Date(dateFilter.end));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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
        <p className="text-gray-600">Gerencie os pagamentos dos clientes</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
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

        <div className="bg-white p-6 rounded-lg shadow-sm">
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

        <div className="bg-white p-6 rounded-lg shadow-sm">
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

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por cliente..."
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
            <option value="">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="cancelled">Cancelados</option>
          </select>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
              placeholder="Data final"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pagamento
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
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.client.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.client.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(payment.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(payment.due_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.payment_date
                      ? new Date(payment.payment_date).toLocaleDateString()
                      : '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {payment.status === 'paid' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Pago
                    </span>
                  ) : payment.status === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-4 h-4 mr-1" />
                      Pendente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {payment.status === 'pending' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePaymentConfirmation(payment)}
                    >
                      Confirmar Pagamento
                    </Button>
                  )}
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
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do Pagamento
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            
            <div className="mt-2 p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Cliente:</strong> {selectedPayment?.client.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Valor:</strong> {selectedPayment ? formatCurrency(selectedPayment.amount) : '-'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Vencimento:</strong> {selectedPayment ? new Date(selectedPayment.due_date).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmPayment}>
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};