import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Settings, Save, AlertCircle, Loader2 } from 'lucide-react';

interface BillingSettings {
  id: string;
  default_message: string;
  days_before: number;
  send_on_due_date: boolean;
}

export const AdminConfiguracao: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<BillingSettings>({
    id: '',
    default_message: '',
    days_before: 3,
    send_on_due_date: true
  });

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .single();

      if (error) throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('billing_settings')
        .update({
          default_message: settings.default_message,
          days_before: settings.days_before,
          send_on_due_date: settings.send_on_due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
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
        <h2 className="text-2xl font-bold text-gray-800">Configuração Geral de Cobrança</h2>
        <p className="text-gray-600 mt-1">
          Defina as configurações padrão para notificações de cobrança
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-6">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Estas configurações serão aplicadas a todos os clientes que não possuem
                configurações personalizadas.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem Padrão de Cobrança
            </label>
            <textarea
              value={settings.default_message}
              onChange={(e) => setSettings({ ...settings, default_message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Digite a mensagem padrão que será enviada aos clientes..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Dias de Antecedência"
                type="number"
                min="1"
                max="30"
                value={settings.days_before}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  days_before: parseInt(e.target.value) 
                })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Quantos dias antes do vencimento a mensagem será enviada
              </p>
            </div>

            <div className="flex items-start pt-8">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={settings.send_on_due_date}
                  onChange={(e) => setSettings({
                    ...settings,
                    send_on_due_date: e.target.checked
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="font-medium text-gray-700">
                  Enviar no dia do vencimento
                </label>
                <p className="text-gray-500">
                  Uma mensagem adicional será enviada no próprio dia do vencimento
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={handleSave}
            icon={<Save className="h-4 w-4" />}
          >
            Salvar Configurações
          </Button>
        </div>
      </div>
    </div>
  );
};