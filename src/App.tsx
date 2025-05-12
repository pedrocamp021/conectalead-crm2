import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Expired } from './pages/Expired';
import { NotFound } from './pages/NotFound';
import { Followups } from './pages/Followups';
import { Layout } from './components/layout/Layout';
import { AdminClientes } from './components/admin/AdminClientes';
import { AdminKanban } from './components/admin/AdminKanban';
import { AdminAutomacao } from './components/admin/AdminAutomacao';
import { AdminPrevisao } from './components/admin/AdminPrevisao';
import { AdminPagamentos } from './components/admin/AdminPagamentos';
import { AdminConfiguracao } from './components/admin/AdminConfiguracao';
import { AdminRecorrencia } from './components/admin/AdminRecorrencia';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { Reports } from './pages/Reports';
import { Preferences } from './pages/Preferences';
import { Profile } from './pages/Profile';
import { Support } from './pages/Support';
import { WhatsappConnect } from './pages/WhatsappConnect';
import { Webhook } from './pages/Webhook';
import { useAppStore } from './lib/store';
import { supabase } from './lib/supabase';

function App() {
  const { fetchUserData, setUser, setIsAdmin, setClient } = useAppStore();

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          fetchUserData();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAdmin(false);
          setClient(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData, setUser, setIsAdmin, setClient]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<Layout />}>
          {/* Common routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kanban" element={<KanbanBoard />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/support" element={<Support />} />
          <Route path="/expired" element={<Expired />} />
          <Route path="/conectar-whatsapp" element={<WhatsappConnect />} />
          <Route path="/webhook" element={<Webhook />} />
          
          {/* Admin routes */}
          <Route path="/admin/clients" element={<AdminClientes />} />
          <Route path="/admin/kanban" element={<AdminKanban />} />
          <Route path="/admin/billing" element={<AdminAutomacao />} />
          <Route path="/admin/forecast" element={<AdminPrevisao />} />
          <Route path="/admin/payments" element={<AdminPagamentos />} />
          <Route path="/admin/config" element={<AdminConfiguracao />} />
          <Route path="/admin/recurrence" element={<AdminRecorrencia />} />
        </Route>
        
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;