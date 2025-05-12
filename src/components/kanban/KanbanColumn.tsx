import React, { useState } from 'react';
import { Column, Lead } from '../../lib/types';
import { KanbanCard } from './KanbanCard';
import { useAppStore } from '../../lib/store';
import { Plus, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';

interface KanbanColumnProps {
  column: Column;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, leadId: string) => void;
  readOnly?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  onDragOver,
  onDrop,
  onDragStart,
  readOnly = false
}) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    interest: '',
    notes: ''
  });
  
  const { addLead, client } = useAppStore();

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
      <div className={`p-2 rounded-t-md ${getColumnHeaderColor()} text-white`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{column.name}</h3>
          <div className="flex items-center space-x-1">
            <span className="text-sm bg-white bg-opacity-25 px-2 py-0.5 rounded-full">
              {column.leads?.length || 0}
            </span>
            {!readOnly && (
              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <MoreVertical className="h-4 w-4" />
              </button>
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
                placeholder="Name *"
              />
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.phone}
                onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                placeholder="Phone *"
              />
              <input
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.interest}
                onChange={(e) => setNewLead({...newLead, interest: e.target.value})}
                placeholder="Interest"
              />
              <textarea
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={newLead.notes}
                onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                placeholder="Notes"
                rows={2}
              />
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingCard(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleAddLead}
                  disabled={!newLead.name || !newLead.phone}
                >
                  Save
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
            Add Lead
          </button>
        )}
      </div>
    </div>
  );
};