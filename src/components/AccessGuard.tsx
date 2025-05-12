import React from 'react';
import { useAppStore } from '../lib/store';

export const AccessGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { client } = useAppStore();

  if (client && client.status !== 'ativo') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center px-6">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Inativo</h2>
        <p className="text-gray-700 mb-4">
          Seu acesso está temporariamente inativo. Para reativação, fale com nosso suporte.
        </p>
        <a
          href="https://wa.me/5561994142031"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
        >
          Falar com o Suporte no WhatsApp
        </a>
        <button
          onClick={async () => {
            const { supabase } = await import('../lib/supabase');
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          className="text-sm text-gray-600 underline hover:text-black"
        >
          Sair da Conta
        </button>
      </div>
    );
  }

  return <>{children}</>;
};