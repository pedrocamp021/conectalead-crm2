import React, { useState } from 'react';
import { Lead } from '../../lib/types';
import { useAppStore } from '../../lib/store';
import { Phone, MessageSquare, Edit, Trash2, Clock, Tag, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface KanbanCardProps {
  lead: Lead & { labels?: Label[] };
  readOnly?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ 
  lead, 
  readOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone);
  const [interest, setInterest] = useState(lead.interest);
  const [notes, setNotes] = useState(lead.notes || '');
  const [isHovering, setIsHovering] = useState(false);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [labels, setLabels] = useState<Label[]>(lead.labels || []);
  const [newLabel, setNewLabel] = useState({ name: '', color: 'blue' });
  
  const { updateLead, deleteLead, client } = useAppStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPhone = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const getWhatsAppLink = () => {
    const formattedPhone = formatPhone(lead.phone);
    return `https://wa.me/${formattedPhone}`;
  };

  const handleSave = async () => {
    await updateLead(lead.id, {
      name,
      phone,
      interest,
      notes
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      await deleteLead(lead.id);
    }
  };

  const handleFollowupClick = () => {
    navigate(`/followups?lead=${lead.id}`);
  };

  const handleAddLabel = async () => {
    if (!client || !newLabel.name) return;

    try {
      // Create new label if it doesn't exist
      const { data: labelData, error: labelError } = await supabase
        .from('lead_labels')
        .insert({
          name: newLabel.name,
          color: newLabel.color,
          client_id: client.id
        })
        .select()
        .single();

      if (labelError) throw labelError;

      // Assign label to lead
      const { error: assignError } = await supabase
        .from('lead_label_assignments')
        .insert({
          lead_id: lead.id,
          label_id: labelData.id
        });

      if (assignError) throw assignError;

      setLabels([...labels, labelData]);
      setIsAddingLabel(false);
      setNewLabel({ name: '', color: 'blue' });

      toast({
        title: "Etiqueta adicionada",
        description: "A etiqueta foi criada e associada ao lead.",
      });
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar a etiqueta.",
      });
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const { error } = await supabase
        .from('lead_label_assignments')
        .delete()
        .eq('lead_id', lead.id)
        .eq('label_id', labelId);

      if (error) throw error;

      setLabels(labels.filter(l => l.id !== labelId));
      
      toast({
        title: "Etiqueta removida",
        description: "A etiqueta foi removida do lead.",
      });
    } catch (error) {
      console.error('Erro ao remover etiqueta:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a etiqueta.",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const formattedDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  if (isEditing && !readOnly) {
    return (
      <div 
        className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-2"
      >
        <div className="space-y-2">
          <Input
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Interesse"
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className={`
          bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-2 
          ${!readOnly ? 'cursor-grab hover:shadow-md transition-shadow duration-200' : ''}
        `}
        draggable={!readOnly}
        onDragStart={handleDragStart}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {labels.map(label => (
              <span
                key={label.id}
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white
                  bg-${label.color}-500
                `}
              >
                {label.name}
                {!readOnly && (
                  <button
                    onClick={() => handleRemoveLabel(label.id)}
                    className="ml-1 hover:text-${label.color}-200"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-start">
          <h3 className="font-medium text-gray-900">{lead.name}</h3>
          <div className="flex items-center space-x-2">
            {lead.has_followup && (
              <button
                onClick={handleFollowupClick}
                className="text-blue-500 hover:text-blue-600"
                title="Ver mensagens agendadas"
              >
                <Clock className="h-4 w-4" />
              </button>
            )}
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>
        </div>
        
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-1" />
          <span>{lead.phone}</span>
        </div>
        
        {lead.interest && (
          <div className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Interesse:</span> {lead.interest}
          </div>
        )}
        
        {notes && (
          <div 
            className={`
              mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 border-l-2 border-blue-500
              transition-opacity duration-200
              ${isHovering ? 'opacity-100' : 'opacity-80'}
            `}
          >
            <MessageSquare className="h-3.5 w-3.5 inline-block mr-1 text-blue-500" />
            {notes}
          </div>
        )}
        
        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between">
          <a 
            href={getWhatsAppLink()} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          {!readOnly && (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingLabel(true)}
                icon={<Tag className="h-4 w-4" />}
              >
                Etiqueta
              </Button>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button 
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-600 p-1 rounded-full hover:bg-gray-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAddingLabel} onOpenChange={setIsAddingLabel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Etiqueta</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Input
              label="Nome da Etiqueta"
              value={newLabel.name}
              onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
              placeholder="Ex: Urgente, VIP, etc"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newLabel.color}
                onChange={(e) => setNewLabel({ ...newLabel, color: e.target.value })}
              >
                <option value="blue">Azul</option>
                <option value="green">Verde</option>
                <option value="yellow">Amarelo</option>
                <option value="red">Vermelho</option>
                <option value="purple">Roxo</option>
                <option value="pink">Rosa</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsAddingLabel(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddLabel}
                disabled={!newLabel.name}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};