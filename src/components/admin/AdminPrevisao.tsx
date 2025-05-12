import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Calendar, Filter, Download, Loader2, AlertCircle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  plan_type: string;
  billing_day: number;
  status: string;
}

interface BillingGroup {
  day: number;
  clients: Client[];
}

export const AdminPrevisao: React.FC = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('billing_day');

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
    const matchesPlan = !planFilter || client.plan_type === planFilter;
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesPlan && matchesStatus;
  });

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const nextMonth = new Date(today.getFullYear(), currentMonth + 1, 1);

  const groupClientsByDay = (clients: Client[]): BillingGroup[] => {
    const groups: { [key: number]: Client[] } = {};
    
    clients.forEach(client => {
      const day = client.billing_day || 1;
      if (!groups[day]) groups[day] = [];
      groups[day].push(client);
    });

    return Object.entries(groups)
      .map(([day, clients]) => ({
        day: parseInt(day),
        clients
      }))
      .sort((a, b) => a.day - b.day);
  };

  const dueTodayCount = filteredClients.filter(c => c.billing_day === currentDay).length;
  const dueThisMonthCount = filteredClients.length;
  const dueNextMonthCount = filteredClients.length;
  const next7DaysClients = filteredClients.filter(c => {
    const daysUntilDue = c.billing_day - currentDay;
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  const handleExportCSV = () => {
    const headers = ['Nome', 'Plano', 'Dia do Vencimento', 'Status'];
    const rows = filteredClients.map(client => [
      client.name,
      client.plan_type,
      client.billing_day,
      client.status
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

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4">
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            icon={<Download className="h-4 w-4" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencimentos Hoje</p>
              <h3 className="text-2xl font-bold text-gray-900">{dueTodayCount}</h3>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Próximos 7 dias</p>
              <h3 className="text-2xl font-bold text-gray-900">{next7DaysClients.length}</h3>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total este mês</p>
              <h3 className="text-2xl font-bold text-gray-900">{dueThisMonthCount}</h3>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Previsão próximo mês</p>
              <h3 className="text-2xl font-bold text-gray-900">{dueNextMonthCount}</h3>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
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
            <div 
              key={group.day}
              className={`p-6 ${group.day === currentDay ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <h4 className="text-lg font-medium text-gray-900">
                    Dia {group.day}
                  </h4>
                </div>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  {group.clients.length} clientes
                </span>
              </div>

              <div className="space-y-3">
                {group.clients.map(client => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">
                        Plano {client.plan_type} • Status: {client.status}
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