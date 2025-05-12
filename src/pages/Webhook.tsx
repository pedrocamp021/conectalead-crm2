import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/use-toast';
import { Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const Webhook: React.FC = () => {
  const { client } = useAppStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!client) {
    return <Navigate to="/login" replace />;
  }

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(client.webhook_url);
      setCopied(true);
      toast({
        title: "URL copiada",
        description: "O webhook foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar webhook:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível copiar o webhook.",
      });
    }
  };

  const getStatusBadge = () => {
    const status = client.webhook_status || 'aguardando';
    const badges = {
      ativo: {
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-4 h-4 mr-1" />,
        text: 'Ativo'
      },
      aguardando: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="w-4 h-4 mr-1" />,
        text: 'Aguardando'
      },
      erro: {
        color: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-4 h-4 mr-1" />,
        text: 'Erro'
      }
    };

    const badge = badges[status as keyof typeof badges] || badges.aguardando;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Integração com N8N</h1>
        <p className="text-gray-600">
          Configure seu fluxo do N8N para enviar leads automaticamente para o ConectaLead
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seu Webhook Pessoal
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex flex-grow items-stretch">
                  <input
                    type="text"
                    value={client.webhook_url}
                    readOnly
                    className="block w-full rounded-l-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <Button
                    variant="primary"
                    className="rounded-l-none"
                    onClick={handleCopyWebhook}
                    icon={copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Status da Integração</span>
              {getStatusBadge()}
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Cole esse link no final do seu fluxo no N8N. Quando um lead for qualificado pela IA, 
                    ele será enviado automaticamente para o seu Kanban.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Como configurar:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Abra seu fluxo no N8N</li>
                <li>Adicione um nó "HTTP Request" no final do fluxo</li>
                <li>Configure o método como "POST"</li>
                <li>Cole o webhook acima no campo "URL"</li>
                <li>No corpo da requisição, inclua os campos: name, phone, interest (opcional)</li>
                <li>Ative o fluxo e teste o envio de um lead</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};