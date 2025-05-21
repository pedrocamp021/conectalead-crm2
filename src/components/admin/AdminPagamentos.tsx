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

  useEffect(() => {
    fetchClients();
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
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payment',
        variant: 'destructive',
      });
    }
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
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            className="border rounded p-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="border rounded p-2"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <div
                key={client.id}
                className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{client.name}</h3>
                  <p className="text-sm text-gray-500">
                    Status: {client.status}
                  </p>
                  <p className="text-sm text-gray-500">
                    Monthly Value: ${client.valor_mensal}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {client.pagamento_confirmado ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Paid
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="w-5 h-5 mr-2" />
                      Pending
                    </div>
                  )}
                  <Button
                    onClick={() => handlePaymentConfirmation(client)}
                    disabled={client.pagamento_confirmado}
                  >
                    Confirm Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label>Payment Date</label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label>Reference Month</label>
              <Input
                type="month"
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPayment}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};