import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BulkScheduleModal } from '../components/followup/BulkScheduleModal';
import { useToast } from '../components/ui/use-toast';
import { 
  Loader2, Plus, Calendar, MessageSquare, Clock, Edit, 
  Trash2, CheckCircle, XCircle, Users, Search, Filter 
} from 'lucide-react';
import type { Followup, Lead, Column } from '../lib/types';

type StatusFilter = 'all' | 'scheduled' | 'sent' | 'cancelled';

interface FollowupWithLead extends Followup {
  leads: {
    name: string;
    phone: string;
    column_id: string;
  };
  columns?: {
    name: string;
  };
}

export const Followups: React.FC = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedLeadId = searchParams.get('lead');
  const { client } = useAppStore();
  
  const [followups, setFollowups] = useState<FollowupWithLead[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilter, setColumnFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchFollowups = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('followups')
        .select(`
          *,
          leads (
            name,
            phone,
            column_id
          ),
          columns:leads(
            columns (
              name
            )
          )
        `)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setFollowups(data);

      // Buscar colunas para o filtro
      const { data: columnsData } = await supabase
        .from('columns')
        .select('*')
        .eq('client_id', client.id)
        .order('order');

      if (columnsData) setColumns(columnsData);
    } catch (error) {
      console.error('Erro ao buscar follow-ups:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;

      setIsLoading(true);
      try {
        await fetchFollowups();

        if (selectedLeadId) {
          const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', selectedLeadId)
            .single();

          if (leadError) throw leadError;
          setSelectedLead(leadData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client, selectedLeadId]);

  const handleEditFollowup = async () => {
    if (!editingFollowup) return;

    try {
      const { error } = await supabase
        .from('followups')
        .update({
          message_template: editingFollowup.message_template,
          scheduled_for: editingFollowup.scheduled_for
        })
        .eq('id', editingFollowup.id);

      if (error) throw error;

      await fetchFollowups();
      setEditingFollowup(null);
      
      toast({
        title: "Mensagem atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar follow-up:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar a mensagem. Tente novamente.",
      });
    }
  };

  const handleCancelFollowup = async (followupId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja cancelar esta mensagem?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('followups')
        .update({ status: 'cancelled' })
        .eq('id', followupId);

      if (error) throw error;
      
      await fetchFollowups();
      
      toast({
        title: "Mensagem cancelada",
        description: "A mensagem foi cancelada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao cancelar follow-up:', error);
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a mensagem. Tente novamente.",
      });
    }
  };

  const handleDeleteFollowup = async (followupId: string) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este agendamento?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('followups')
        .delete()
        .eq('id', followupId);

      if (error) throw error;
      
      await fetchFollowups();
      
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir follow-up:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o agendamento. Tente novamente.",
      });
    }
  };

  const handleBulkSchedule = async (leads: Lead[], message: string, date: string) => {
    if (!client) return;

    try {
      const followups = leads.map(lead => ({
        lead_id: lead.id,
        client_id: client.id,
        message_template: message,
        scheduled_for: date,
        status: 'scheduled'
      }));

      const { error } = await supabase
        .from('followups')
        .insert(followups);

      if (error) throw error;
      
      await fetchFollowups();
      
      toast({
        title: "Mensagens agendadas",
        description: `${leads.length} mensagens foram agendadas com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao agendar mensagens em massa:', error);
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: "Não foi possível agendar as mensagens. Tente novamente.",
      });
    }
  };

  const filteredFollowups = followups.filter(followup => {
    const matchesSearch = followup.leads.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || followup.status === statusFilter;
    const matchesColumn = !columnFilter || followup.leads.column_id === columnFilter;
    const matchesDate = (!dateRange.start || new Date(followup.scheduled_for) >= new Date(dateRange.start)) &&
                       (!dateRange.end || new Date(followup.scheduled_for) <= new Date(dateRange.end));
    
    return matchesSearch && matchesStatus && matchesColumn && matchesDate;
  });

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFollowups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFollowups.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: { color: 'bg-green-100 text-green-800', icon: <Clock className="w-3 h-3 mr-1" />, text: 'Agendada' },
      sent: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, text: 'Enviada' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, text: 'Cancelada' }
    };

    const badge = badges[status as keyof typeof badges];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-136px)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Follow-up Messenger</h1>
          <p className="text-gray-600">Gerencie suas mensagens agendadas</p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsBulkModalOpen(true)}
          icon={<Users className="w-4 h-4" />}
        >
          Agendar em Massa
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por nome do lead..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Todos os status</option>
            <option value="scheduled">Agendadas</option>
            <option value="sent">Enviadas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={columnFilter}
            onChange={(e) => setColumnFilter(e.target.value)}
          >
            <option value="">Todas as colunas</option>
            {columns.map(column => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
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

      {/* Tabela de Follow-ups */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                Mensagem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data de Envio
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
            {currentItems.map((followup) => (
              <tr key={followup.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {followup.leads.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {followup.leads.phone}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {followup.columns?.[0]?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-md truncate">
                    {followup.message_template}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(followup.scheduled_for).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(followup.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    {followup.status === 'scheduled' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingFollowup(followup)}
                          icon={<Edit className="h-4 w-4" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelFollowup(followup.id)}
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {followup.status === 'cancelled' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteFollowup(followup.id)}
                        icon={<Trash2 className="h-4 w-4" />}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> até{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastItem, filteredFollowups.length)}
                </span>{' '}
                de <span className="font-medium">{filteredFollowups.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`
                      relative inline-flex items-center px-4 py-2 border text-sm font-medium
                      ${number === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }
                    `}
                  >
                    {number}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <Dialog open={!!editingFollowup} onOpenChange={() => setEditingFollowup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Input
              label="Data de envio"
              type="date"
              value={editingFollowup?.scheduled_for || ''}
              onChange={(e) => setEditingFollowup(prev => 
                prev ? { ...prev, scheduled_for: e.target.value } : null
              )}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                value={editingFollowup?.message_template || ''}
                onChange={(e) => setEditingFollowup(prev => 
                  prev ? { ...prev, message_template: e.target.value } : null
                )}
                placeholder="Digite sua mensagem..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setEditingFollowup(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleEditFollowup}
                disabled={!editingFollowup?.message_template || !editingFollowup?.scheduled_for}
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {client && (
        <BulkScheduleModal
          open={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          onSchedule={handleBulkSchedule}
          clientId={client.id}
        />
      )}
    </div>
  );
};