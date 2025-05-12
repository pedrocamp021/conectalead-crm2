import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { supabase } from '../../lib/supabase';
import { Users, ChevronDown, Loader2 } from 'lucide-react';
import type { Client } from '../../lib/types';

export const AdminKanban: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { fetchColumnsAndLeads } = useAppStore();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');

        if (error) throw error;
        setClients(data || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleClientChange = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client || null);
    
    if (client) {
      await fetchColumnsAndLeads(client.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 mx-auto text-blue-600 animate-spin" />
          <p className="mt-2 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Client Kanban View</h2>
        <p className="text-gray-600 mt-1">Select a client to view their Kanban board</p>
      </div>

      <div className="relative">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-5 w-5 text-gray-400" />
          <select
            className="w-full md:w-80 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedClient?.id || ''}
            onChange={(e) => handleClientChange(e.target.value)}
          >
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <ChevronDown className="h-5 w-5 text-gray-400 absolute right-3 top-2 pointer-events-none" />
        </div>
      </div>

      {selectedClient ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {selectedClient.name}'s Kanban Board
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              View-only mode - Changes can only be made from the client's account
            </p>
          </div>

          <KanbanBoard readOnly clientId={selectedClient.id} />
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Client Selected
          </h3>
          <p className="text-gray-500">
            Select a client from the dropdown above to view their Kanban board
          </p>
        </div>
      )}
    </div>
  );
};