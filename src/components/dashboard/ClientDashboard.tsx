import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Users, UserCheck, UserMinus, Clock, Plus, Kanban as LayoutKanban, MessageSquare, Loader2, ChevronRight } from 'lucide-react';
import type { Lead, Followup } from '../../lib/types';

interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  followupLeads: number;
  canceledLeads: number;
  weeklyQualified: number;
  upcomingFollowups: Followup[];
}

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { client } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    qualifiedLeads: 0,
    followupLeads: 0,
    canceledLeads: 0,
    weeklyQualified: 0,
    upcomingFollowups: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!client) return;

      try {
        // Fetch leads statistics
        const { data: leads, error: leadsError } = await supabase
          .from('leads')
          .select('*, columns(*)')
          .eq('client_id', client.id);

        if (leadsError) throw leadsError;

        // Fetch upcoming followups
        const { data: followups, error: followupsError } = await supabase
          .from('followups')
          .select(`
            *,
            leads (
              name,
              phone
            )
          `)
          .eq('client_id', client.id)
          .eq('status', 'scheduled')
          .order('scheduled_for')
          .limit(5);

        if (followupsError) throw followupsError;

        // Calculate weekly qualified leads
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyQualified = leads?.filter(lead => {
          const column = lead.columns;
          const isQualified = column?.name.toLowerCase().includes('qualificado');
          const createdAt = new Date(lead.created_at);
          return isQualified && createdAt >= oneWeekAgo;
        }).length || 0;

        // Calculate other stats
        const qualifiedLeads = leads?.filter(lead => 
          lead.columns?.name.toLowerCase().includes('qualificado')
        ).length || 0;

        const canceledLeads = leads?.filter(lead =>
          lead.columns?.name.toLowerCase().includes('cancelado')
        ).length || 0;

        setStats({
          totalLeads: leads?.length || 0,
          qualifiedLeads,
          followupLeads: followups?.length || 0,
          canceledLeads,
          weeklyQualified,
          upcomingFollowups: followups || []
        });
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [client]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const getMotivationalMessage = () => {
    if (stats.weeklyQualified > 0) {
      return `Parabéns! Você qualificou ${stats.weeklyQualified} leads nesta semana. Continue assim!`;
    }
    return 'Comece a qualificar seus leads e acompanhe seu progresso aqui!';
  };

  const cards = [
    {
      title: 'Leads Totais',
      value: stats.totalLeads,
      icon: <Users className="h-8 w-8" />,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50'
    },
    {
      title: 'Leads Qualificados',
      value: stats.qualifiedLeads,
      icon: <UserCheck className="h-8 w-8" />,
      color: 'bg-green-500',
      bgLight: 'bg-green-50'
    },
    {
      title: 'Com Follow-up',
      value: stats.followupLeads,
      icon: <MessageSquare className="h-8 w-8" />,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50'
    },
    {
      title: 'Leads Cancelados',
      value: stats.canceledLeads,
      icon: <UserMinus className="h-8 w-8" />,
      color: 'bg-red-500',
      bgLight: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Greeting and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bem-vindo, {client?.name}!
          </h1>
          <p className="mt-1 text-gray-600">
            Gerencie seus leads e acompanhe seu progresso
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => navigate('/kanban')}
            icon={<Plus className="h-4 w-4" />}
          >
            Novo Lead
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/kanban')}
            icon={<LayoutKanban className="h-4 w-4" />}
          >
            Ver Kanban
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/followups')}
            icon={<MessageSquare className="h-4 w-4" />}
          >
            Follow-ups
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgLight} rounded-lg shadow-sm overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`text-${card.color.replace('bg-', '')}`}>
                  {card.icon}
                </div>
                <div className={`${card.color} text-white text-sm font-medium px-2.5 py-0.5 rounded-full`}>
                  {card.title}
                </div>
              </div>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {card.value}
                </div>
                <div className="ml-2 text-sm text-gray-500">leads</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <p className="text-lg font-medium">
          {getMotivationalMessage()}
        </p>
      </div>

      {/* Upcoming Follow-ups */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Próximos Follow-ups
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {stats.upcomingFollowups.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum follow-up agendado
            </div>
          ) : (
            stats.upcomingFollowups.map((followup) => (
              <div key={followup.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {followup.leads?.name}
                    </p>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(followup.scheduled_for).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/followups?lead=${followup.lead_id}`)}
                    icon={<ChevronRight className="h-4 w-4" />}
                  >
                    Ver detalhes
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};