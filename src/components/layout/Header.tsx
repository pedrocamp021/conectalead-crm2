import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const { user, client, isAdmin, logout } = useAppStore();
  
  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/kanban': 'Kanban de Leads',
      '/followups': 'Follow-up',
      '/reports': 'Relatórios',
      '/preferences': 'Minhas Preferências',
      '/profile': 'Perfil',
      '/support': 'Suporte'
    };
    return titles[path] || 'ConectaLead';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-10">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden md:block ml-6 text-lg text-gray-600 font-medium">
            {getPageTitle()}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center">
              <div className="text-right mr-4">
                <p className="text-sm font-medium text-gray-900">
                  {isAdmin ? 'Administrador' : client?.name}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => logout()}
                icon={<LogOut className="h-4 w-4" />}
              >
                <span className="hidden md:inline">Sair</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};