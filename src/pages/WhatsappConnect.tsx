import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/use-toast';
import { QrCode, RefreshCw, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface QRCodeResponse {
  qrcode: string;
  error?: string;
}

interface StatusResponse {
  status: 'pending' | 'connected' | 'disconnected';
  error?: string;
}

export const WhatsappConnect: React.FC = () => {
  const { client } = useAppStore();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'pending' | 'connected' | 'disconnected'>('loading');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionName = client ? `client_${client.id}` : '';
  const N8N_BASE_URL = 'https://seun8n.com/webhook';

  const fetchQRCode = async () => {
    if (!sessionName) return;
    
    setIsRefreshing(true);
    try {
      const response = await fetch(`${N8N_BASE_URL}/gerar-qrcode?session=${sessionName}`);
      const data: QRCodeResponse = await response.json();

      if (data.error) throw new Error(data.error);
      setQrCode(data.qrcode);
      setStatus('pending');
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o QR Code. Tente novamente.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const checkStatus = async () => {
    if (!sessionName) return;

    try {
      const response = await fetch(`${N8N_BASE_URL}/status-sessao?session=${sessionName}`);
      const data: StatusResponse = await response.json();

      if (data.error) throw new Error(data.error);
      setStatus(data.status);

      if (data.status === 'connected' && status !== 'connected') {
        toast({
          title: "WhatsApp Conectado",
          description: "Seu WhatsApp foi conectado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    if (!client) return;
    fetchQRCode();

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [client]);

  if (!client) {
    return <Navigate to="/login" replace />;
  }

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center text-gray-600">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Carregando...
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center text-yellow-600">
            <QrCode className="h-5 w-5 mr-2" />
            Aguardando pareamento...
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-5 w-5 mr-2" />
            WhatsApp conectado
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center text-red-600">
            <XCircle className="h-5 w-5 mr-2" />
            Desconectado
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Conectar WhatsApp</h1>
        <p className="text-gray-600">
          Conecte seu WhatsApp ao ConectaLead para enviar mensagens automaticamente
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="text-lg font-semibold text-gray-800">
              Status da Conexão
            </div>
            {getStatusDisplay()}
          </div>

          {status === 'pending' && qrCode ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg flex flex-col items-center">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Aponte a câmera do WhatsApp Web para esse QR Code
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={fetchQRCode}
                  disabled={isRefreshing}
                  icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                >
                  {isRefreshing ? 'Atualizando...' : 'Atualizar QR Code'}
                </Button>
              </div>
            </div>
          ) : status === 'connected' ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <div className="flex">
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Seu WhatsApp está conectado e pronto para enviar mensagens.
                  </p>
                </div>
              </div>
            </div>
          ) : status === 'disconnected' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Seu WhatsApp está desconectado. Gere um novo QR Code para conectar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={fetchQRCode}
                  disabled={isRefreshing}
                  icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                >
                  Gerar Novo QR Code
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};