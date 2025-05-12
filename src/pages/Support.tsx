import React from 'react';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import { MessageSquare, Mail, Phone } from 'lucide-react';

export const Support: React.FC = () => {
  const { client } = useAppStore();

  const supportPhone = "+5511999999999"; // Replace with actual support number
  const supportEmail = "suporte@conectalead.com.br"; // Replace with actual support email

  const handleWhatsAppClick = () => {
    window.open(`https://wa.me/${supportPhone}?text=Olá! Sou cliente ConectaLead (${client?.name}) e preciso de suporte.`);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${supportEmail}?subject=Suporte ConectaLead - ${client?.name}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Suporte</h1>
        <p className="text-gray-600">Entre em contato com nossa equipe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">WhatsApp</h2>
              <p className="text-gray-600">Atendimento rápido e direto</p>
            </div>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={handleWhatsAppClick}
            className="bg-green-600 hover:bg-green-700"
          >
            Iniciar Conversa
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Email</h2>
              <p className="text-gray-600">Para assuntos mais detalhados</p>
            </div>
          </div>
          <Button
            variant="primary"
            fullWidth
            onClick={handleEmailClick}
          >
            Enviar Email
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Horário de Atendimento
        </h2>
        
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Segunda a Sexta</span>
            <span className="font-medium">09:00 - 18:00</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Sábado</span>
            <span className="font-medium">09:00 - 13:00</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Domingo e Feriados</span>
            <span className="font-medium text-gray-500">Fechado</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-blue-900">Emergências</span>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            Para emergências fora do horário comercial, envie mensagem via WhatsApp
            e aguarde retorno do plantão.
          </p>
        </div>
      </div>
    </div>
  );
};