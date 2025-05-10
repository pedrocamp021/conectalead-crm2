import React from 'react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Lead Management</h1>
        <p className="text-gray-600">Manage your leads by dragging cards between columns</p>
      </div>
      <KanbanBoard />
    </div>
  );
};