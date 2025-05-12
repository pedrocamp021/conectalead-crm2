import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Loader2 } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

export const Profile: React.FC = () => {
  const { client, user } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (client) {
      setFormData(prev => ({
        ...prev,
        name: client.name,
        email: client.email,
        whatsapp: client.whatsapp || ''
      }));
    }
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setIsLoading(true);

    try {
      const updates = {
        name: formData.name,
        whatsapp: formData.whatsapp
      };

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi alterada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar sua senha.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome da Empresa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-50"
            />

            <Input
              label="WhatsApp"
              type="tel"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="+5511999999999"
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isLoading}
              icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Alterar Senha
            </h2>

            <div className="space-y-4">
              <Input
                label="Nova Senha"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handlePasswordChange}
                  disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
                >
                  Alterar Senha
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};