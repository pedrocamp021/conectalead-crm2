import React from 'react';
import { useAppStore } from '../lib/store';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Expired: React.FC = () => {
  const { client, logout } = useAppStore();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-136px)]">
      <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
        
        <p className="text-gray-600 mb-6">
          Your subscription has expired. Please contact your administrator to renew your plan.
        </p>
        
        {client && (
          <div className="mb-6 px-4 py-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Plan:</span>
              <span>{client.plan}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="font-medium">Expired on:</span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {new Date(client.expiration_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}
        
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => logout()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
};