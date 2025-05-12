import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Expired } from './pages/Expired';
import { NotFound } from './pages/NotFound';
import { Followups } from './pages/Followups';
import { Layout } from './components/layout/Layout';
import { useAppStore } from './lib/store';
import { supabase } from './lib/supabase';

function App() {
  const { fetchUserData, setUser, setIsAdmin, setClient } = useAppStore();

  useEffect(() => {
    // Initial fetch of user data
    fetchUserData();

    // Set up auth state listener
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

    // Cleanup
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/expired" element={<Expired />} />
        </Route>
        
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}