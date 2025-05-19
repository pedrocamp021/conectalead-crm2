import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Filter, Search, Loader2, Users, UserCheck, TrendingUp, Target } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Lead, Column } from '../lib/types';

interface LeadWithColumn extends Lead {
  columns: Column;
}

interface FilterState {
  startDate: string;
  endDate: string;
  columnId: string;
  status: string;
  labelId: string;
  searchTerm: string;
}

interface LeadStats {
  total: number;
  qualified: number;
  mediumInterest: number;
  lowInterest: number;
  converted: number;
}

const CHART_COLORS = {
  newLead: '#3B82F6',    // blue-500
  lowInterest: '#EF4444', // red-500
  mediumInterest: '#F59E0B', // yellow-500
  qualified: '#10B981',   // green-500
  closing: '#8B5CF6'     // purple-500
};

export const Reports: React.FC = () => {
  const { client } = useAppStore();
  const [leads, setLeads] = useState<LeadWithColumn[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    qualified: 0,
    mediumInterest: 0,
    lowInterest: 0,
    converted: 0
  });
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    columnId: '',
    status: '',
    labelId: '',
    searchTerm: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;

      try {
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select(`
            *,
            columns (*),
            lead_label_assignments (
              lead_labels (*)
            )
          `)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        if (leadsError) throw leadsError;

        const { data: columnsData } = await supabase
          .from('columns')
          .select('*')
          .eq('client_id', client.id)
          .order('order');

        const { data: labelsData } = await supabase
          .from('lead_labels')
          .select('*')
          .eq('client_id', client.id);

        if (leadsData) {
          setLeads(leadsData);
          
          const total = leadsData.length;
          const qualified = leadsData.filter(lead => {
            const interest = parseInt(lead.interest || '0');
            return interest >= 9;
          }).length;
          
          const mediumInterest = leadsData.filter(lead => {
            const interest = parseInt(lead.interest || '0');
            return interest >= 5 && interest <= 8;
          }).length;
          
          const lowInterest = leadsData.filter(lead => {
            const interest = parseInt(lead.interest || '0');
            return interest < 5;
          }).length;
          
          const converted = leadsData.filter(lead => 
            lead.columns?.name.toLowerCase().includes('fechado') || 
            lead.columns?.name.toLowerCase().includes('fechando')
          ).length;

          setStats({
            total,
            qualified,
            mediumInterest,
            lowInterest,
            converted
          });
        }

        if (columnsData) setColumns(columnsData);
        if (labelsData) setLabels(labelsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                         lead.phone.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesColumn = !filters.columnId || lead.column_id === filters.columnId;
    const matchesDate = (!filters.startDate || new Date(lead.created_at) >= new Date(filters.startDate)) &&
                       (!filters.endDate || new Date(lead.created_at) <= new Date(filters.endDate));
    const matchesLabel = !filters.labelId || lead.lead_label_assignments?.some(
      (assignment: any) => assignment.lead_labels.id === filters.labelId
    );
    
    return matchesSearch && matchesColumn && matchesDate && matchesLabel;
  });

  const getColumnStats = () => {
    return columns.map(column => {
      const count = filteredLeads.filter(lead => lead.column_id === column.id).length;
      const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      
      let color = CHART_COLORS.newLead;
      if (column.name.toLowerCase().includes('baixo')) color = CHART_COLORS.lowInterest;
      else if (column.name.toLowerCase().includes('médio')) color = CHART_COLORS.mediumInterest;
      else if (column.name.toLowerCase().includes('qualificado')) color = CHART_COLORS.qualified;
      else if (column.name.toLowerCase().includes('fechando') || column.name.toLowerCase().includes('fechado')) color = CHART_COLORS.closing;

      return {
        name: column.name,
        value: count,
        percentage,
        color
      };
    });
  };

  const customLegendRenderer = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4 px-2 py-2 max-w-[90%] mx-auto">
        {payload.map((entry: any, index: number) => (
          <div
            key={`legend-${index}`}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white break-words"
            style={{ backgroundColor: entry.color }}
          >
            <span className="truncate">{entry.value}</span>
            <span className="ml-1 opacity-75">({entry.payload.value})</span>
          </div>
        ))}
      </div>
    );
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    total: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, total, icon, color }) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-sm font-medium text-gray-500">{percentage}%</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios e Análise de Leads</h1>
          <p className="text-gray-600">
            {filteredLeads.length} leads encontrados
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            const headers = ['Nome', 'Telefone', 'Coluna', 'Etiquetas', 'Data', 'Interesse'];
            const rows = filteredLeads.map(lead => [
              lead.name,
              lead.phone,
              lead.columns?.name || '',
              lead.lead_label_assignments?.map((a: any) => a.lead_labels.name).join(', ') || '',
              new Date(lead.created_at).toLocaleDateString(),
              lead.interest || ''
            ]);

            const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'leads.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          icon={<Download className="h-4 w-4" />}
        >
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Leads"
          value={stats.total}
          total={stats.total}
          icon={<Users className="h-6 w-6" />}
          color={CHART_COLORS.newLead}
        />
        <StatCard
          title="Leads Qualificados"
          value={stats.qualified}
          total={stats.total}
          icon={<UserCheck className="h-6 w-6" />}
          color={CHART_COLORS.qualified}
        />
        <StatCard
          title="Interesse Médio"
          value={stats.mediumInterest}
          total={stats.total}
          icon={<Target className="h-6 w-6" />}
          color={CHART_COLORS.mediumInterest}
        />
        <StatCard
          title="Taxa de Conversão"
          value={stats.converted}
          total={stats.total}
          icon={<TrendingUp className="h-6 w-6" />}
          color={CHART_COLORS.closing}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filters.columnId}
            onChange={(e) => setFilters({ ...filters, columnId: e.target.value })}
          >
            <option value="">Todas as colunas</option>
            {columns.map(column => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={filters.labelId}
            onChange={(e) => setFilters({ ...filters, labelId: e.target.value })}
          >
            <option value="">Todas as etiquetas</option>
            {labels.map(label => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>

          <div className="flex space-x-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              placeholder="Data final"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            Distribuição por Coluna
          </h3>
          <div className="w-full max-w-full overflow-hidden">
            <div className="h-[300px] sm:h-[400px] w-[90%] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getColumnStats()}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getColumnStats().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              {data.value} leads ({data.percentage}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend content={customLegendRenderer} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Leads por Etiqueta
          </h3>
          <div className="h-[300px]">
            {labels.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={labels} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 shadow-lg rounded-lg border">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-gray-600">
                              {data.value} leads ({((data.value / stats.total) * 100).toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value">
                    {labels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.newLead} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Nenhum lead com etiqueta ainda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Lista Detalhada de Leads
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coluna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etiquetas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interesse
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {lead.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: CHART_COLORS.newLead }}
                    >
                      {lead.columns?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {lead.lead_label_assignments?.map((assignment: any, index) => (
                        <span
                          key={assignment.lead_labels.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: CHART_COLORS.newLead }}
                        >
                          {assignment.lead_labels.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {lead.interest || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};