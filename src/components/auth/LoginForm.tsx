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
      // Check if client already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingClient) {
        console.log('Client already exists:', existingClient.id);
        return;
      }

      // Create new client
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
      console.log('New client created for:', user.email);
    } catch (error) {
      console.error('Error creating client:', error);
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

      // Create client if needed
      if (data.user) {
        await createInitialClient(data.user);
      }

      await fetchUserData();

    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-800">ConectaLead</h2>
        <p className="mt-2 text-gray-600">Sign in to access your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="w-5 h-5 text-gray-400" />}
            className="pl-10"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            className="pl-10"
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </div>
  );
};