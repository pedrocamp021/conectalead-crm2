import { create } from 'zustand';
import { supabase } from './supabase';
import type { AuthState, Client, Column, Lead } from './types';

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  client: null,
  isAdmin: false,
  isLoading: true,
  isLoadingData: false,
  columns: [],
  leads: [],
  clients: [],

  setUser: (user) => set({ user }),
  setClient: (client) => set({ client }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setColumns: (columns) => set({ columns }),
  setLeads: (leads) => set({ leads }),
  setClients: (clients) => set({ clients }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoadingData: (isLoadingData) => set({ isLoadingData }),

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      client: null,
      isAdmin: false,
      columns: [],
      leads: [],
      clients: []
    });
  },

  fetchUserData: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      set({ isLoading: false });
      return;
    }

    const isAdmin = user.email?.includes('admin') || false;

    if (isAdmin) {
      set({
        user: { id: user.id, email: user.email!, role: 'admin' },
        isAdmin: true,
        isLoading: false
      });
      return;
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', user.id)
      .single();

    if (clientError || !clientData) {
      console.warn('⚠️ Cliente não encontrado para o usuário:', user.email);
      set({
        user: { id: user.id, email: user.email!, role: 'client' },
        client: null,
        isLoading: false
      });
      return;
    }

    set({
      user: { id: user.id, email: user.email!, role: 'client' },
      client: clientData,
      isLoading: false
    });
  },

  fetchClients: async () => {
    const { isAdmin } = get();
    if (!isAdmin) return;

    set({ isLoadingData: true });

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      set({ isLoadingData: false });
      return;
    }

    set({ clients: data, isLoadingData: false });
  },

  fetchColumnsAndLeads: async (clientId) => {
    const { client, isAdmin } = get();
    const targetClientId = clientId || client?.id;

    if (!targetClientId && !isAdmin) {
      console.warn('❌ Nenhum clientId disponível para buscar colunas.');
      set({ isLoadingData: false });
      return;
    }

    set({ isLoadingData: true });

    try {
      let columnQuery = supabase.from('columns').select('*');
      if (!isAdmin) columnQuery = columnQuery.eq('client_id', targetClientId);
      columnQuery = columnQuery.order('order');

      const { data: columnsData, error: columnsError } = await columnQuery;
      if (columnsError) throw columnsError;

      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`*, followups!inner ( id, status )`)
        .eq('followups.status', 'scheduled');

      if (leadsError) throw leadsError;

      const { data: allLeads, error: allLeadsError } = await supabase
        .from('leads')
        .select('*');

      if (allLeadsError) throw allLeadsError;

      const leadsWithFollowups = new Set(leadsData?.map(l => l.id) || []);
      const processedLeads = allLeads?.map(lead => ({
        ...lead,
        has_followup: leadsWithFollowups.has(lead.id)
      }));

      const columns = columnsData?.map(column => ({
        ...column,
        leads: processedLeads?.filter(lead => lead.column_id === column.id)
      }));

      set({
        columns: columns || [],
        leads: processedLeads || [],
        isLoadingData: false
      });
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      set({ isLoadingData: false });
    }
  },

  moveLead: async (leadId, newColumnId) => {
    const { leads } = get();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const { error } = await supabase
      .from('leads')
      .update({ column_id: newColumnId })
      .eq('id', leadId);

    if (error) {
      console.error('❌ Erro ao mover lead:', error);
      return;
    }

    const updatedLeads = leads.map(l =>
      l.id === leadId ? { ...l, column_id: newColumnId } : l
    );

    const { columns } = get();
    const updatedColumns = columns.map(column => ({
      ...column,
      leads: updatedLeads.filter(lead => lead.column_id === column.id)
    }));

    set({ leads: updatedLeads, columns: updatedColumns });
  },

  addLead: async (lead) => {
    const { error, data } = await supabase
      .from('leads')
      .insert([lead])
      .select();

    if (error) {
      console.error('❌ Erro ao adicionar lead:', error);
      return;
    }

    if (data && data.length > 0) {
      const newLead = data[0];
      const { leads, columns } = get();

      const updatedLeads = [...leads, newLead];
      const updatedColumns = columns.map(column =>
        column.id === newLead.column_id
          ? { ...column, leads: [...(column.leads || []), newLead] }
          : column
      );

      set({ leads: updatedLeads, columns: updatedColumns });
    }
  },

  updateLead: async (leadId, updates) => {
    const { leads } = get();
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId);

    if (error) {
      console.error('❌ Erro ao atualizar lead:', error);
      return;
    }

    const updatedLeads = leads.map(l =>
      l.id === leadId ? { ...l, ...updates } : l
    );

    set({ leads: updatedLeads });
  },

  deleteLead: async (leadId) => {
    const { leads } = get();
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (error) {
      console.error('❌ Erro ao excluir lead:', error);
      return;
    }
    const updatedLeads = leads.filter(l => l.id !== leadId);
    set({ leads: updatedLeads });
  },

  deleteFollowup: async (followupId) => {
    try {
      const { error } = await supabase
        .from('followups')
        .delete()
        .eq('id', followupId);

      if (error) {
        console.error('❌ Erro ao excluir follow-up:', error);
        return;
      }

      console.log('✅ Agendamento excluído com sucesso:', followupId);
      await get().fetchColumnsAndLeads();
    } catch (error) {
      console.error('❌ Erro inesperado ao excluir follow-up:', error);
    }
  }
}));