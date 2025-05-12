import React, { useState } from 'react';
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
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
  onDelete: (columnId: string) => void;
  readOnly?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onDragOver,
  onDrop,
  onDragStart,
  onDelete,
  readOnly = false
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isEditingColumn, setIsEditingColumn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    interest: '',
    notes: ''
  });
  const [columnName, setColumnName] = useState(column.name);
  
  const { addLead, client } = useAppStore();
  const { toast } = useToast();

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

  const handleUpdateColumn = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setIsEditingColumn(false);
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

      setIsEditingColumn(false);
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a coluna.",
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
    <div 
      className="min-w-[300px] w-[300px] bg-gray-100 rounded-md shadow flex flex-col max-h-full"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className={`p-2 rounded-t-md ${getColumnHeaderColor()} text-white relative`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{column.name}</h3>
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
                        setIsEditingColumn(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Nome
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(column.id);
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
      
      <div className="p-2 flex-1 overflow-y-auto">
        {column.leads?.map((lead) => (
          <KanbanCard 
            key={lead.id} 
            lead={lead} 
            onDragStart={onDragStart}
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

      <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Input
              label="Nome da Coluna"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
            />

            <div className="flex justify-end space-x-2">
              <Button
                variant="ghost"
                onClick={() => setIsEditingColumn(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdateColumn}
                disabled={!columnName.trim() || columnName === column.name}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};