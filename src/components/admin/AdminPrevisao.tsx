import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Calendar, Download, Filter, Loader2, DollarSign } from 'lucide-react';

interface ForecastDay {
  date: string;
  clients: string[];
  total: number;
}

export const AdminPrevisao: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [monthFilter, setMonthFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchForecast = async () => {
    try {
      const [year, month] = monthFilter.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);

      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          due_date,
          amount,
          status,
          clients (
            id,
            name,
            status
          )
        `)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .eq('status', 'pending')
        .order('due_date');

      if (error) throw error;

      const forecastMap = new Map<string, ForecastDay>();

      payments?.forEach(payment => {
        if (!payment.clients?.status || payment.clients.status === 'inativo') return;

        const date = new Date(payment.due_date).toISOString().split('T')[0];
        const existing = forecastMap.get(date) || { date, clients: [], total: 0 };

        existing.clients.push(payment.clients.name);
        existing.total += payment.amount || 0;

        forecastMap.set(date, existing);
      });

      const sortedForecast = Array.from(forecastMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setForecast(sortedForecast);
    } catch (error) {
      console.error('Erro ao carregar previsão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar a previsão de cobranças.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [monthFilter]);

  const handleExportCSV = () => {
    const headers = ['Data', 'Clientes', 'Total'];
    const rows = forecast.map(day => [
      new Date(day.date).toLocaleDateString(),
      day.clients.join(', '),
      day.total.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `previsao-${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalMonth = forecast.reduce((sum, day) => sum + day.total, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Previsão de Cobranças</h2>
          <p className="text-gray-600">
            {forecast.length} dias com cobranças previstas
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />

          <Button
            variant="outline"
            onClick={handleExportCSV}
            icon={<Download className="h-4 w-4" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800">
              Calendário de Cobranças
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="h-5 w-5" />
            <span className="font-medium">
              Total do Mês: {formatCurrency(totalMonth)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {forecast.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhuma cobrança prevista para este período
            </div>
          ) : (
            forecast.map((day) => (
              <div
                key={day.date}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {day.clients.length} cliente{day.clients.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(day.total)}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {day.clients.map((client, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {client}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};