import { create } from 'zustand';
import { supabase } from './supabase';
import type { AuthState, Client, Column, Lead } from './types';

interface AppState extends AuthState {
  columns: Column[];
  leads: Lead[];
  clients: Client[];
  isLoadingData: boolean;
  setUser: (user: AuthState['user']) => void;
  setClient: (client: AuthState['client']) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setColumns: (columns: Column[]) => void;
  setLeads: (leads: Lead[]) => void;
  setClients: (clients: Client[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsLoadingData: (isLoadingData: boolean) => void;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  fetchClients: () => Promise<void>;
  fetchColumnsAndLeads: (clientId?: string) => Promise<void>;
  moveLead: (leadId: string, newColumnId: string) => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'created_at'>) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
}

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

    const { data: clientData, error: clientError
