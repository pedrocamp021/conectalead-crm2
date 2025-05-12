import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { AdminClientes } from '../components/admin/AdminClientes';
import { AdminKanban } from '../components/admin/AdminKanban';
import { Button } from '../components/ui/Button';
import { Users, LayoutDashboard } from 'lucide-react';

export const Admin: React.FC = () => {
  const { isAdmin } = useAppStore();
  const [view, setView] = useState<'clients' | 'kanban'>('clients');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {view === 'clients' ? 'Client Management' : 'Kanban Overview'}
        </h2>
        
        <div className="flex space-x-2">
          <Button
            variant={view === 'clients' ? 'primary' : 'ghost'}
            onClick={() => setView('clients')}
            icon={<Users className="h-4 w-4" />}
          >
            Clients
          </Button>
          <Button
            variant={view === 'kanban' ? 'primary' : 'ghost'}
            onClick={() => setView('kanban')}
            icon={<LayoutDashboard className="h-4 w-4" />}
          >
            Kanban
          </Button>
        </div>
      </div>

      {view === 'clients' ? <AdminClientes /> : <AdminKanban />}
    </div>
  );
};