import React, { useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Mail, Lock, Loader2 } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fetchUserData = useAppStore(state => state.fetchUserData);

  const createInitialClient = async (user: any) => {
    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingClient) {
        console.log('Cliente já existe:', existingClient.id);
        return;
      }

      const { error: insertError } = await supabase
        .from('clients')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || 'Novo Cliente',
          email: user.email,
          is_active: true,
          is_admin: false,
          plan_type: 'mensal',
          plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pendente',
          initial_fee: 0,
          monthly_fee: 0
        });

      if (insertError) throw insertError;
      console.log('Novo cliente criado:', user.email);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await createInitialClient(data.user);
      }

      await fetchUserData();

    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      setError(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : 'Ocorreu um erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ConectaLead</h1>
        <p className="text-gray-600">Faça login para acessar sua conta</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="w-5 h-5 text-gray-400" />}
            className="pl-10"
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            className="pl-10"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          disabled={isLoading}
          className="py-2.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
    </div>
  );
};