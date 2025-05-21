import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Search, Filter, Calendar, DollarSign, CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from 'lucide-react';

interface Payment {
  id: string;
  client_id: string;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'late';
  amount: number;
  reference_month: string;
  payment_type: 'primeira' | 'mensalidade';
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
  const [editingPayment, setEditingPayment] = useState<{id: string, field: string, value: any} | null>(null);

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

  const handleConfirmPayment = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado",
        description: "O status do pagamento foi atualizado com sucesso.",
      });

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

  const handleRevertPayment = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'pending',
          payment_date: null
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Pagamento revertido",
        description: "O status do pagamento foi revertido com sucesso.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error reverting payment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reverter o pagamento.",
      });
    }
  };

  const handleUpdateField = async (payment: Payment, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Pagamento atualizado",
        description: "O pagamento foi atualizado com sucesso.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o pagamento.",
      });
    } finally {
      setEditingPayment(null);
    }
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
                  <span className="text-sm text-gray-900 capitalize">
                    {payment.payment_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingPayment?.id === payment.id && editingPayment?.field === 'amount' ? (
                    <input
                      type="number"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      value={editingPayment.value}
                      onChange={(e) => setEditingPayment({
                        ...editingPayment,
                        value: parseFloat(e.target.value)
                      })}
                      onBlur={() => handleUpdateField(payment, 'amount', editingPayment.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateField(payment, 'amount', editingPayment.value);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => setEditingPayment({
                        id: payment.id,
                        field: 'amount',
                        value: payment.amount
                      })}
                    >
                      {formatCurrency(payment.amount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingPayment?.id === payment.id && editingPayment?.field === 'due_date' ? (
                    <input
                      type="date"
                      className="w-40 px-2 py-1 border border-gray-300 rounded text-sm"
                      value={editingPayment.value}
                      onChange={(e) => setEditingPayment({
                        ...editingPayment,
                        value: e.target.value
                      })}
                      onBlur={() => handleUpdateField(payment, 'due_date', editingPayment.value)}
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="flex items-center text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                      onClick={() => setEditingPayment({
                        id: payment.id,
                        field: 'due_date',
                        value: payment.due_date.split('T')[0]
                      })}
                    >
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {new Date(payment.due_date).toLocaleDateString()}
                    </div>
                  )}
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
                  <div className="flex justify-end space-x-2">
                    {payment.status === 'pending' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConfirmPayment(payment)}
                        icon={<CheckCircle className="h-4 w-4" />}
                      >
                        Confirmar
                      </Button>
                    ) : payment.status === 'paid' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevertPayment(payment)}
                        icon={<ArrowLeft className="h-4 w-4" />}
                      >
                        Reverter
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { AdminPagamentos }