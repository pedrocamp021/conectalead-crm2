import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { AdminClientes } from '../components/admin/AdminClientes';
import { AdminKanban } from '../components/admin/AdminKanban';
import { AdminAutomacao } from '../components/admin/AdminAutomacao';
import { AdminPrevisao } from '../components/admin/AdminPrevisao';
import { Button } from '../components/ui/Button';
import { Users, LayoutDashboard, BellRing, Calendar } from 'lucide-react';

type AdminView = 'clients' | 'kanban' | 'automation' | 'forecast';

export const Admin: React.FC = () => {
  const { isAdmin } = useAppStore();
  const [view, setView] = useState<AdminView>('clients');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {view === 'clients' && 'Gestão de Clientes'}
          {view === 'kanban' && 'Visão Geral do Kanban'}
          {view === 'automation' && 'Automação de Cobrança'}
          {view === 'forecast' && 'Previsão de Cobranças'}
        </h2>
        
        <div className="flex space-x-2">
          <Button
            variant={view === 'clients' ? 'primary' : 'ghost'}
            onClick={() => setView('clients')}
            icon={<Users className="h-4 w-4" />}
          >
            Clientes
          </Button>
          <Button
            variant={view === 'kanban' ? 'primary' : 'ghost'}
            onClick={() => setView('kanban')}
            icon={<LayoutDashboard className="h-4 w-4" />}
          >
            Kanban
          </Button>
          <Button
            variant={view === 'automation' ? 'primary' : 'ghost'}
            onClick={() => setView('automation')}
            icon={<BellRing className="h-4 w-4" />}
          >
            Automação
          </Button>
          <Button
            variant={view === 'forecast' ? 'primary' : 'ghost'}
            onClick={() => setView('forecast')}
            icon={<Calendar className="h-4 w-4" />}
          >
            Previsão
          </Button>
        </div>
      </div>

      {view === 'clients' && <AdminClientes />}
      {view === 'kanban' && <AdminKanban />}
      {view === 'automation' && <AdminAutomacao />}
      {view === 'forecast' && <AdminPrevisao />}
    </div>
  );
};