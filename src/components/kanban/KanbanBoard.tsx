import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import type { Column } from '../../lib/types';

interface KanbanBoardProps {
  readOnly?: boolean;
  clientId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ readOnly = false, clientId }) => {
  const { columns, isLoadingData, fetchColumnsAndLeads, moveLead, client } = useAppStore();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ name: '', color: 'blue' });
  const { toast } = useToast();

  useEffect(() => {
    const targetClientId = clientId || client?.id;
    if (targetClientId) {
      console.log("✅ Client ID detected:", targetClientId);
      fetchColumnsAndLeads(targetClientId);
    } else {
      console.warn("⚠️ No client detected in KanbanBoard.");
    }
  }, [clientId, client, fetchColumnsAndLeads]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || readOnly) return;

    const { source, destination, draggableId, type } = result;

    if (type === 'column') {
      const newColumns = Array.from(columns);
      const [removed] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, removed);

      try {
        await Promise.all(
          newColumns.map((column, index) =>
            supabase
              .from('columns')
              .update({ order: index })
              .eq('id', column.id)
          )
        );

        await fetchColumnsAndLeads(client?.id);

        toast({
          title: "Colunas reordenadas",
          description: "A ordem das colunas foi atualizada com sucesso.",
        });
      } catch (error) {
        console.error('Erro ao reordenar colunas:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível reordenar as colunas.",
        });
      }
    } else if (type === 'LEAD') {
      if (source.droppableId !== destination.droppableId) {
        await moveLead(draggableId, destination.droppableId);
      }
    }
  };

  const handleAddColumn = async () => {
    if (!client || !newColumn.name) return;

    try {
      const { data, error } = await supabase
        .from('columns')
        .insert([{
          name: newColumn.name,
          color: newColumn.color,
          client_id: client.id,
          order: columns.length
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Coluna criada",
        description: "A nova coluna foi adicionada com sucesso.",
      });

      fetchColumnsAndLeads(client.id);
      setIsAddingColumn(false);
      setNewColumn({ name: '', color: 'blue' });
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a coluna.",
      });
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!client || columns.length <= 1) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não é possível excluir a última coluna.",
      });
      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta coluna? Os leads serão movidos para a primeira coluna."
    );

    if (!confirmed) return;

    try {
      // Move leads to first column
      const firstColumn = columns[0];
      const { error: moveError } = await supabase
        .from('leads')
        .update({ column_id: firstColumn.id })
        .eq('column_id', columnId);

      if (moveError) throw moveError;

      // Delete the column
      const { error: deleteError } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (deleteError) throw deleteError;

      toast({
        title: "Coluna excluída",
        description: "A coluna foi removida e os leads foram realocados.",
      });

      fetchColumnsAndLeads(client.id);
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir a coluna.",
      });
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-136px)]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Carregando quadro...</p>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-136px)]">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Nenhuma Coluna Encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando sua primeira coluna para organizar seus leads.
          </p>
          {!readOnly && (
            <Button
              variant="primary"
              onClick={() => setIsAddingColumn(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Criar Primeira Coluna
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-136px)] overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="column">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex h-full space-x-4 overflow-x-auto pb-4 pr-4"
              >
                {columns.map((column, index) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    index={index}
                    onDelete={handleDeleteColumn}
                    readOnly={readOnly}
                  />
                ))}
                {provided.placeholder}

                {!readOnly && (
                  <div className="flex-shrink-0 w-80 flex items-start pt-12">
                    <button
                      onClick={() => setIsAddingColumn(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Nova Coluna
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Dialog open={isAddingColumn} onOpenChange={setIsAddingColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Coluna</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input
              label="Nome da Coluna"
              value={newColumn.name}
              onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
              placeholder="Ex: Leads Qualificados"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor da Coluna
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newColumn.color}
                onChange={(e) => setNewColumn({ ...newColumn, color: e.target.value })}
              >
                <option value="blue">Azul</option>
                <option value="green">Verde</option>
                <option value="yellow">Amarelo</option>
                <option value="purple">Roxo</option>
                <option value="red">Vermelho</option>
                <option value="pink">Rosa</option>
                <option value="indigo">Índigo</option>
                <option value="teal">Turquesa</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsAddingColumn(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleAddColumn}
                disabled={!newColumn.name}
              >
                Criar Coluna
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};