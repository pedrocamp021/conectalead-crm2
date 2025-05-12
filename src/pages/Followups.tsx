import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, Plus, Calendar, MessageSquare, Clock } from 'lucide-react';
import type { Followup } from '../lib/types';

export const Followups: React.FC = () => {
  const [searchParams] = useSearchParams();
  const selectedLeadId = searchParams.get('lead');
  const { client } = useAppStore();
  
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newFollowup, setNewFollowup] = useState({
    message: '',
    scheduledFor: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;

      setIsLoading(true);
      try {
        // Fetch followups
        const { data: followupsData, error: followupsError } = await supabase
          .from('followups')
          .select(`
            *,
            leads (
              name,
              phone
            )
          `)
          .order('scheduled_for', { ascending: true });

        if (followupsError) throw followupsError;

        setFollowups(followupsData);

        // If a lead is selected, fetch its details
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
        console.error('Error fetching data:', error);
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
        }]);

      if (error) throw error;

      // Refresh followups
      const { data: followupsData } = await supabase
        .from('followups')
        .select('*')
        .order('scheduled_for', { ascending: true });

      if (followupsData) {
        setFollowups(followupsData);
      }

      setNewFollowup({ message: '', scheduledFor: '' });
    } catch (error) {
      console.error('Error adding followup:', error);
    }
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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Follow-up Messenger</h1>
        <p className="text-gray-600">Gerencie suas mensagens agendadas</p>
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
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Mensagens Agendadas
        </h2>

        {followups.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma mensagem agendada
          </p>
        ) : (
          <div className="space-y-4">
            {followups.map((followup) => (
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
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">Agendado</span>
                    </div>
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
    </div>
  );
};