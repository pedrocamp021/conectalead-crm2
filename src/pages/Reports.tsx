import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Filter, Search, Loader2 } from 'lucide-react';
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

export const Reports: React.FC = () => {
  const { client } = useAppStore();
  const [leads, setLeads] = useState<LeadWithColumn[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        // Fetch leads with columns
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

        // Fetch columns
        const { data: columnsData, error: columnsError } = await supabase
          .from('columns')
          .select('*')
          .eq('client_id', client.id)
          .order('order');

        if (columnsError) throw columnsError;

        // Fetch labels
        const { data: labelsData, error: labelsError } = await supabase
          .from('lead_labels')
          .select('*')
          .eq('client_id', client.id);

        if (labelsError) throw labelsError;

        setLeads(leadsData || []);
        setColumns(columnsData || []);
        setLabels(labelsData || []);
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
    const stats = columns.map(column => ({
      name: column.name,
      value: filteredLeads.filter(lead => lead.column_id === column.id).length,
      color: column.color
    }));

    return stats;
  };

  const getLabelStats = () => {
    const stats = labels.map(label => ({
      name: label.name,
      value: filteredLeads.filter(lead => 
        lead.lead_label_assignments?.some(
          (assignment: any) => assignment.lead_labels.id === label.id
        )
      ).length,
      color: label.color
    }));

    return stats;
  };

  const handleExportCSV = () => {
    const headers = [
      'Nome',
      'Telefone',
      'Coluna',
      'Etiquetas',
      'Data de Criação',
      'Interesse',
      'Observações'
    ];

    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.columns?.name || '',
      lead.lead_label_assignments?.map((a: any) => a.lead_labels.name).join(', ') || '',
      new Date(lead.created_at).toLocaleDateString(),
      lead.interest || '',
      lead.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-leads-${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Relatórios e Análise de Leads</h1>
          <p className="text-gray-600">
            {filteredLeads.length} leads encontrados
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleExportCSV}
          icon={<Download className="h-4 w-4" />}
        >
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Distribuição por Coluna
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getColumnStats()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getColumnStats().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`var(--${entry.color}-500, #3b82f6)`}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Leads por Etiqueta
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getLabelStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Leads" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Leads */}
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
                    <span className="text-sm text-gray-900">
                      {lead.columns?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {lead.lead_label_assignments?.map((assignment: any) => (
                        <span
                          key={assignment.lead_labels.id}
                          className={`
                            inline-flex items-center px-2 py-0.5 rounded-full 
                            text-xs font-medium text-white
                            bg-${assignment.lead_labels.color}-500
                          `}
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