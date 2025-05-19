import React, { useState, useRef, useEffect } from 'react';
import { Column, Lead } from '../../lib/types';
import { KanbanCard } from './KanbanCard';
import { useAppStore } from '../../lib/store';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';

interface KanbanColumnProps {
  column: Column;
  index: number;
  onDelete?: (columnId: string) => void;
  readOnly?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  index,
  onDelete,
  readOnly = false
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { fetchColumnsAndLeads, addLead, client } = useAppStore();
  const { toast } = useToast();
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    interest: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSaveColumnName = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setColumnName(column.name);
      setIsEditing(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('columns')
        .update({ name: columnName })
        .eq('id', column.id);

      if (error) throw error;

      toast({
        title: "Coluna atualizada",
        description: "O nome da coluna foi alterado com sucesso.",
      });

      fetchColumnsAndLeads(client?.id);
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a coluna.",
      });
      setColumnName(column.name);
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveColumnName();
    } else if (e.key === 'Escape') {
      setColumnName(column.name);
      setIsEditing(false);
    }
  };

  const handleAddLead = async () => {
    if (!newLead.name || !newLead.phone) return;
    
    await addLead({
      ...newLead,
      column_id: column.id,
      client_id: client!.id
    });
    
    setNewLead({
      name: '',
      phone: '',
      interest: '',
      notes: ''
    });
    
    setIsAddingCard(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-gray-50');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-50');
    
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({ column_id: column.id })
        .eq('id', leadId);

      if (error) throw error;
      
      await fetchColumnsAndLeads(client?.id);
      console.log("✅ Lead moved successfully!");
    } catch (error) {
      console.error('Error moving lead:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível mover o lead.",
      });
    }
  };

  const getColumnHeaderColor = () => {
    const colorClasses: Record<string, string> = {
      'blue': 'bg-blue-500',
      'green': 'bg-green-500',
      'yellow': 'bg-yellow-500',
      'purple': 'bg-purple-500',
      'red': 'bg-red-500',
      'pink': 'bg-pink-500',
      'indigo': 'bg-indigo-500',
      'teal': 'bg-teal-500',
      'orange': 'bg-orange-500',
      'gray': 'bg-gray-500',
    };
    
    return colorClasses[column.color] || 'bg-blue-500';
  };

  return (
    <div className="min-w-[300px] w-[300px] bg-gray-100 rounded-md shadow flex flex-col max-h-full">
      <div 
        className={`p-2 rounded-t-md ${getColumnHeaderColor()} text-white relative`}
      >
        <div className="flex justify-between items-center">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onBlur={handleSaveColumnName}
              onKeyDown={handleKeyPress}
              className="bg-white bg-opacity-20 px-2 py-1 rounded text-white placeholder-white w-full mr-2 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              placeholder="Nome da coluna"
            />
          ) : (
            <h3 className="font-semibold">{column.name}</h3>
          )}
          <div className="flex items-center space-x-1">
            <span className="text-sm bg-white bg-opacity-25 px-2 py-0.5 rounded-full">
              {column.leads?.length || 0}
            </span>
            {!readOnly && (
              <div className="relative">
                <button 
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                    <button
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setShowMenu(false);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Nome
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete?.(column.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Coluna
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div 
        className="p-2 flex-1 overflow-y-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {column.leads?.map((lead, index) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            readOnly={readOnly}
          />
        ))}
        
        {!readOnly && isAddingCard ? (
          <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 mb-2">
            <div className="space-y-2">
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.name}
                onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                placeholder="Nome *"
              />
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                placeholder="Telefone *"
              />
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.interest}
                onChange={(e) => setNewLead({...newLead, interest: e.target.value})}
                placeholder="Interesse"
              />
              <textarea
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.notes}
                onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                placeholder="Observações"
                rows={2}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingCard(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleAddLead}
                  disabled={!newLead.name || !newLead.phone}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        ) : !readOnly && (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full p-2 mt-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Lead
          </button>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;