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
  status: 'pending' | 'paid' | 'late';
  amount: number;
  reference_month: string;
  paid_early: boolean;
  clients?: {
    name: string;
    email: string;
  };
}

export default function AdminPagamentos() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            email
          )
        `)
        .order('due_date');

      if (error) throw error;
      setPayments(data || []);
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

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !paymentDate) return;

    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_date: paymentDate,
          paid_early: new Date(paymentDate) < new Date(selectedPayment.due_date)
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });

      setIsConfirmModalOpen(false);
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

  const getPaymentStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.due_date);
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear;
    });

    const received = monthlyPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const pending = monthlyPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const late = monthlyPayments
      .filter(p => p.status === 'late')
      .reduce((sum, p) => sum + p.amount, 0);

    return { received, pending, late };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesDate = (!dateRange.start || new Date(payment.due_date) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(payment.due_date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = getPaymentStats();

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-500" />
            <span className="text-sm font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
              Recebido
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.received)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">
              A Receber
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.pending)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
              Atrasado
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.late)}
          </div>
        </div>
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
            <option value="pending">Pendente</option>
            <option value="paid">Pago</option>
            <option value="late">Atrasado</option>
          </select>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {payment.clients?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.clients?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(payment.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                    {new Date(payment.due_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${payment.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                    ${payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${payment.status === 'late' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {payment.status === 'paid' && 'Pago'}
                    {payment.status === 'pending' && 'Pendente'}
                    {payment.status === 'late' && 'Atrasado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {payment.status !== 'paid' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setIsConfirmModalOpen(true);
                      }}
                      icon={<CheckCircle className="h-4 w-4" />}
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

      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Input
              label="Data do Pagamento"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPayment}
                disabled={!paymentDate}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { AdminPagamentos }