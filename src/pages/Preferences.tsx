import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

export const Preferences: React.FC = () => {
  const { client } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    defaultView: 'kanban',
    showCanceledLeads: true,
    autoRefreshInterval: 5,
  });

  useEffect(() => {
    const loadPreferences = () => {
      const savedPrefs = localStorage.getItem(`preferences_${client?.id}`);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      setIsLoading(false);
    };

    loadPreferences();
  }, [client]);

  const handleSave = () => {
    try {
      localStorage.setItem(
        `preferences_${client?.id}`,
        JSON.stringify(preferences)
      );

      toast({
        title: "Preferências salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas preferências.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Minhas Preferências</h1>
        <p className="text-gray-600">Personalize sua experiência no sistema</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Visualização
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visualização Padrão
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={preferences.defaultView}
                onChange={(e) => setPreferences({
                  ...preferences,
                  defaultView: e.target.value
                })}
              >
                <option value="kanban">Kanban</option>
                <option value="list">Lista</option>
                <option value="table">Tabela</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showCanceled"
                checked={preferences.showCanceledLeads}
                onChange={(e) => setPreferences({
                  ...preferences,
                  showCanceledLeads: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="showCanceled" className="text-sm text-gray-700">
                Mostrar leads cancelados nas listagens
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo de Atualização (minutos)
              </label>
              <Input
                type="number"
                min="1"
                max="60"
                value={preferences.autoRefreshInterval}
                onChange={(e) => setPreferences({
                  ...preferences,
                  autoRefreshInterval: parseInt(e.target.value)
                })}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save className="h-4 w-4" />}
          >
            Salvar Preferências
          </Button>
        </div>
      </div>
    </div>
  );
};