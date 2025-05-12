import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Search, Calendar, Loader2 } from 'lucide-react';
import type { Column, Lead } from '../../lib/types';

interface BulkScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (leads: Lead[], message: string, date: string) => Promise<void>;
  clientId: string;
}

export const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  open,
  onClose,
  onSchedule,
  clientId
}) => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [dateRange, setDateRange] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [step, setStep] = useState<'select' | 'schedule'>('select');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: columnsData } = await supabase
          .from('columns')
          .select('*')
          .eq('client_id', clientId)
          .order('order');

        const { data: leadsData } = await supabase
          .from('leads')
          .select('*')
          .eq('client_id', clientId);

        if (columnsData) setColumns(columnsData);
        if (leadsData) setLeads(leadsData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, clientId]);

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesColumn = !selectedColumn || lead.column_id === selectedColumn;
    const matchesDate = !dateRange || new Date(lead.created_at) >= new Date(dateRange);
    return matchesSearch && matchesColumn && matchesDate;
  });

  const handleLeadToggle = (lead: Lead) => {
    setSelectedLeads(prev => 
      prev.find(l => l.id === lead.id)
        ? prev.filter(l => l.id !== lead.id)
        : [...prev, lead]
    );
  };

  const handleSchedule = async () => {
    if (!message || !scheduledDate || selectedLeads.length === 0) return;
    await onSchedule(selectedLeads, message, scheduledDate);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 'select' ? 'Selecionar Leads' : 'Agendar Mensagem em Massa'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Coluna
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                >
                  <option value="">Todas as colunas</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de criação após
                </label>
                <Input
                  type="date"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar leads por nome..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-md max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <p className="text-center text-gray-500 p-4">
                  Nenhum lead encontrado
                </p>
              ) : (
                <div className="divide-y">
                  {filteredLeads.map(lead => (
                    <label
                      key={lead.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedLeads.some(l => l.id === lead.id)}
                        onChange={() => handleLeadToggle(lead)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="ml-3">{lead.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-600">
                {selectedLeads.length} leads selecionados
              </p>
              <div className="space-x-2">
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep('schedule')}
                  disabled={selectedLeads.length === 0}
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Data de envio"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              icon={<Calendar className="h-5 w-5 text-gray-400" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite a mensagem que será enviada para todos os leads selecionados..."
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button variant="ghost" onClick={() => setStep('select')}>
                Voltar
              </Button>
              <Button
                variant="primary"
                onClick={handleSchedule}
                disabled={!message || !scheduledDate}
              >
                Agendar para {selectedLeads.length} leads
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};