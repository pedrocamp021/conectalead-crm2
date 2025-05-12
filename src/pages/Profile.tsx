import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Save, Upload, Loader2 } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';

export const Profile: React.FC = () => {
  const { client, user } = useAppStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    logo_url: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        email: client.email,
        logo_url: client.logo_url || ''
      });
      if (client.logo_url) {
        setPreviewUrl(client.logo_url);
      }
    }
  }, [client]);

  if (!user || !client) {
    return <Navigate to="/login" replace />;
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${client.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      setHasChanges(true);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          logo_url: formData.logo_url
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar seu perfil.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível enviar o email de redefinição.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações da Conta */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Informações da Conta
            </h2>

            <div className="space-y-4">
              <Input
                label="Nome da Empresa"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setHasChanges(true);
                }}
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo da Empresa
                </label>
                <div className="flex items-center space-x-4">
                  {previewUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={previewUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <div className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        <span>Upload Logo</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG até 2MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Segurança
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Para alterar sua senha, clique no botão abaixo. Você receberá um email com instruções para criar uma nova senha.
              </p>

              <Button
                variant="outline"
                onClick={handleResetPassword}
                fullWidth
              >
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};