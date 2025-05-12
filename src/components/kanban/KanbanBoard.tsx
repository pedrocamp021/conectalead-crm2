import React, { useState, useEffect } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { useAppStore } from '../../lib/store';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  readOnly?: boolean;
  clientId?: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ readOnly = false, clientId }) => {
  const { columns, isLoadingData, fetchColumnsAndLeads, moveLead, client } = useAppStore();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const targetClientId = clientId || client?.id;
    if (targetClientId) {
      console.log("✅ Client ID detected:", targetClientId);
      fetchColumnsAndLeads(targetClientId);
    } else {
      console.warn("⚠️ No client detected in KanbanBoard.");
    }
  }, [clientId, client, fetchColumnsAndLeads]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, leadId: string) => {
    if (readOnly) return;
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    if (readOnly) return;
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
          <p className="mt-4 text-gray-600">Loading leads...</p>
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
            This board doesn't have any columns yet. Please contact your administrator to set up the workflow.
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
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
};