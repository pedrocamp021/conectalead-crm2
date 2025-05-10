import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useAppStore } from '../../lib/store';
import { Loader2 } from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const { columns, isLoadingData, fetchColumnsAndLeads, moveLead, client } = useAppStore();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      console.log("✅ ID do cliente detectado no KanbanBoard:", client.id); // <-- linha de debug
      fetchColumnsAndLeads();
    } else {
      console.warn("⚠️ Nenhum cliente detectado no KanbanBoard.");
    }
  }, [client, fetchColumnsAndLeads]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    
    if (draggedLeadId) {
      moveLead(draggedLeadId, columnId);
      setDraggedLeadId(null);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-136px)]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Loading your leads...</p>
        </div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-136px)]">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Columns Available</h3>
          <p className="text-gray-600">
            Your board doesn't have any columns yet. Please contact your administrator to set up your workflow.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-136px)] overflow-hidden">
      <div className="flex h-full space-x-4 overflow-x-auto pb-4 pr-4">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
          />
        ))}
      </div>
    </div>
  );
};
