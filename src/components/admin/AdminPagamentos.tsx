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
  monthly_fee: number;
}

interface PaymentModalData {
  client: Client;
  referenceMonth: string;
  paymentDate: string;
}

export const AdminPagamentos: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [paymentModal, setPaymentModal] = useState<PaymentModalData | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    received: 0,
    pending: 0,
    nextMonth: 0
  });

  const calculateMonthlyStats = (clientsData: Client[]) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Received amount (paid this month)
    const received = clientsData
      .filter(client => {
        if (!client.data_pagamento_real) return false;
        const paymentDate = new Date(client.data_pagamento_real);
        const brazilDate = new Date(paymentDate.getTime() - (3 * 60 * 60 * 1000));
        return brazilDate.getMonth() === currentMonth && 
               brazilDate.getFullYear() === currentYear;
      })
      .reduce((sum, client) => sum + (client.monthly_fee || 0), 0);

    // Pending amount (due this month, not paid)
    const pending = clientsData
      .filter(client => {
        if (!client.proxima_data_pagamento || client.pagamento_confirmado) return false;
        if (client.status !== 'ativo') return false;
        
        const dueDate = new Date(client.proxima_data_pagamento);
        const brazilDate = new Date(dueDate.getTime() - (3 * 60 * 60 * 1000));
        
        return brazilDate.getMonth() === currentMonth && 
               brazilDate.getFullYear() === currentYear;
      })
      .reduce((sum, client) => sum + (client.monthly_fee || 0), 0);

    // Next month forecast
    const nextMonth = clientsData
      .filter(client => {
        if (!client.proxima_data_pagamento || client.status !== 'ativo') return false;
        
        const dueDate = new Date(client.proxima_data_pagamento);
        const brazilDate = new Date(dueDate.getTime() - (3 * 60 * 60 * 1000));
        const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
        
        return brazilDate.getMonth() === nextMonthDate.getMonth() && 
               !client.pagamento_confirmado;
      })
      .reduce((sum, client) => sum + (client.monthly_fee || 0), 0);

    setMonthlyStats({ received, pending, nextMonth });
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('proxima_data_pagamento');

      if (error) throw error;
      setClients(data || []);
      calculateMonthlyStats(data || []);
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

  const handleConfirmPayment = async () => {
    if (!paymentModal) return;

    try {
      const paymentDate = new Date(paymentModal.paymentDate);
      const dueDate = new Date(paymentModal.client.proxima_data_pagamento || '');
      const isPaidEarly = paymentDate < dueDate;

      const { error } = await supabase
        .from('payments')
        .insert({
          client_id: paymentModal.client.id,
          reference_month: paymentModal.referenceMonth,
          payment_date: paymentModal.paymentDate,
          paid_early: isPaidEarly,
          amount: paymentModal.client.monthly_fee,
          status: 'paid'
        });

      if (error) throw error;

      // Update client status
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          data_pagamento_real: paymentModal.paymentDate,
          pagamento_confirmado: true,
          status: 'ativo'
        })
        .eq('id', paymentModal.client.id);

      if (updateError) throw updateError;

      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi registrado com sucesso.",
      });

      setPaymentModal(null);
      fetchClients();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
      });
    }
  };

  const handleUnmarkPayment = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          data_pagamento_real: null,
          pagamento_confirmado: false,
          status: 'pendente'
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Pagamento desmarcado",
        description: "O registro de pagamento foi removido.",
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao desmarcar pagamento:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível desmarcar o pagamento.",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatReferenceMonth = (date: string) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const d = new Date(date);
    return `${months[d.getMonth()]}/${d.getFullYear()}`;
  };

  const getStatusBadge = (client: Client) => {
    if (client.pagamento_confirmado) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Pago
        </span>
      );
    }

    const dueDate = client.proxima_data_pagamento ? new Date(client.proxima_data_pagamento) : null;
    const today = new Date();
    
    if (dueDate && dueDate < today) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Atrasado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        Pendente
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="late">Atrasados</option>
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

      {/* Lista de Pagamentos */}
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
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {client.name}
                  </div>
                  {client.pagamento_confirmado && client.data_pagamento_real && (
                    <div className="text-xs text-gray-500 mt-1">
                      Referente a {formatReferenceMonth(client.data_pagamento_real)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                    {formatCurrency(client.monthly_fee || 0)}
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
                  {getStatusBadge(client)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  {client.pagamento_confirmado ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnmarkPayment(client)}
                      icon={<XCircle className="h-4 w-4" />}
                    >
                      Desmarcar pagamento
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        setPaymentModal({
                          client,
                          referenceMonth: today.toISOString().split('T')[0],
                          paymentDate: today.toISOString().split('T')[0]
                        });
                      }}
                      icon={<CheckCircle className="h-4 w-4" />}
                    >
                      Marcar como Pago
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Pagamento */}
      <Dialog open={!!paymentModal} onOpenChange={() => setPaymentModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mês de Referência
              </label>
              <Input
                type="month"
                value={paymentModal?.referenceMonth.substring(0, 7)}
                onChange={(e) => {
                  if (paymentModal) {
                    setPaymentModal({
                      ...paymentModal,
                      referenceMonth: `${e.target.value}-01`
                    });
                  }
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data do Pagamento
              </label>
              <Input
                type="date"
                value={paymentModal?.paymentDate}
                onChange={(e) => {
                  if (paymentModal) {
                    setPaymentModal({
                      ...paymentModal,
                      paymentDate: e.target.value
                    });
                  }
                }}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setPaymentModal(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPayment}
                disabled={!paymentModal?.referenceMonth || !paymentModal?.paymentDate}
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};