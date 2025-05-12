import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BulkScheduleModal } from '../components/followup/BulkScheduleModal';
import { Loader2, Plus, Calendar, MessageSquare, Clock, Edit, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import type { Followup, Lead } from '../lib/types';

type StatusFilter = 'all' | 'scheduled' | 'sent' | 'cancelled';

export const Followups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedLeadId = searchParams.get('lead');
  const { client } = useAppStore();
  
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingFollowup, setEditingFollowup] = useState<Followup | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    message: '',
    scheduledFor: '',
  });

  const fetchFollowups = async () => {
    if (!client) return;

    try {
      const { data, error } = await supabase
        .from('followups')
        .select(`
          *,
          leads (
            name,
            phone
          )
        `)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setFollowups(data);
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

  const handleAddFollowup = async () => {
    if (!selectedLead || !newFollowup.message || !newFollowup.scheduledFor) return;

    try {
      const { error } = await supabase
        .from('followups')
        .insert([{
          lead_id: selectedLead.id,
          message_template: newFollowup.message,
          scheduled_for: newFollowup.scheduledFor,
          status: 'scheduled'
        }]);

      if (error) throw error;

      await fetchFollowups();
      setNewFollowup({ message: '', scheduledFor: '' });
    } catch (error) {
      console.error('Erro ao adicionar follow-up:', error);
    }
  };

  const handleBulkSchedule = async (leads: Lead[], message: string, date: string) => {
    try {
      const followups = leads.map(lead => ({
        lead_id: lead.id,
        message_template: message,
        scheduled_for: date,
        status: 'scheduled'
      }));

      const { error } = await supabase
        .from('followups')
        .insert(followups);

      if (error) throw error;

      await fetchFollowups();
    } catch (error) {
      console.error('Erro ao agendar mensagens em massa:', error);
    }
  };

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
    } catch (error) {
      console.error('Erro ao editar follow-up:', error);
    }
  };

  const handleCancelFollowup = async (followupId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta mensagem?')) return;

    try {
      const { error } = await supabase
        .from('followups')
        .update({ status: 'cancelled' })
        .eq('id', followupId);

      if (error) throw error;

      await fetchFollowups();
    } catch (error) {
      console.error('Erro ao cancelar follow-up:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-3 h-3 mr-1" />, text: 'Agendado' },
      sent: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3 mr-1" />, text: 'Enviado' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3 mr-1" />, text: 'Cancelado' }
    };

    const badge = badges[status as keyof typeof badges];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const filteredFollowups = followups.filter(followup => 
    statusFilter === 'all' || followup.status === statusFilter
  );

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

      {selectedLead && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Agendar mensagem para {selectedLead.name}
          </h2>
          
          <div className="space-y-4">
            <Input
              label="Data de envio"
              type="date"
              value={newFollowup.scheduledFor}
              onChange={(e) => setNewFollowup({ ...newFollowup, scheduledFor: e.target.value })}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                value={newFollowup.message}
                onChange={(e) => setNewFollowup({ ...newFollowup, message: e.target.value })}
                placeholder="Digite sua mensagem..."
              />
            </div>
            
            <Button
              variant="primary"
              onClick={handleAddFollowup}
              disabled={!newFollowup.message || !newFollowup.scheduledFor}
              icon={<Plus className="w-4 h-4" />}
            >
              Agendar Mensagem
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Mensagens Agendadas
          </h2>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Filtrar por status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="scheduled">Agendados</option>
              <option value="sent">Enviados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>

        {filteredFollowups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma mensagem encontrada
          </p>
        ) : (
          <div className="space-y-4">
            {filteredFollowups.map((followup) => (
              <div
                key={followup.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {followup.leads?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {followup.leads?.phone}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="text-sm">
                        {new Date(followup.scheduled_for).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {getStatusBadge(followup.status)}
                    {followup.status === 'scheduled' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingFollowup(followup)}
                          className="text-gray-500 hover:text-blue-600"
                          title="Editar mensagem"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelFollowup(followup.id)}
                          className="text-gray-500 hover:text-red-600"
                          title="Cancelar mensagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-gray-600">
                  <MessageSquare className="w-4 h-4 inline-block mr-1" />
                  {followup.message_template}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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