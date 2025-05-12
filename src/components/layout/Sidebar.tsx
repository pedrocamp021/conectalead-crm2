import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { 
  LayoutDashboard, 
  Users, 
  LogOut,
  X,
  MessageSquare,
  Calendar,
  DollarSign,
  CreditCard,
  LayoutKanban
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, logout } = useAppStore();
  
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      show: true,
    },
    {
      name: 'Follow-up Messenger',
      path: '/followups',
      icon: <MessageSquare className="w-5 h-5" />,
      show: !isAdmin,
    },
    {
      group: 'Administração',
      show: isAdmin,
      items: [
        {
          name: 'Gestão de Clientes',
          path: '/admin/clients',
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: 'Visualizar Kanban',
          path: '/admin/kanban',
          icon: <LayoutKanban className="w-5 h-5" />,
        }
      ]
    },
    {
      group: 'Financeiro',
      show: isAdmin,
      items: [
        {
          name: 'Previsão de Cobranças',
          path: '/admin/forecast',
          icon: <Calendar className="w-5 h-5" />,
        },
        {
          name: 'Controle de Pagamentos',
          path: '/admin/payments',
          icon: <DollarSign className="w-5 h-5" />,
        },
        {
          name: 'Automação de Cobrança',
          path: '/admin/billing',
          icon: <CreditCard className="w-5 h-5" />,
        }
      ]
    }
  ];

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 w-64 h-full bg-gray-800 text-white transition-transform duration-300 transform
          pt-16 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-4">
          <nav className="space-y-1">
            {navigationItems.filter(item => item.show).map((item, index) => {
              if ('group' in item) {
                return (
                  <div key={index} className="pt-4">
                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {item.group}
                    </h3>
                    <div className="space-y-1">
                      {item.items.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`
                            flex items-center px-4 py-3 text-sm rounded-md transition-colors
                            ${location.pathname === subItem.path
                              ? 'bg-gray-700 text-white'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }
                          `}
                          onClick={onClose}
                        >
                          <span className="mr-3">{subItem.icon}</span>
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`
                    flex items-center px-4 py-3 text-sm rounded-md transition-colors
                    ${location.pathname === item.path
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                  onClick={onClose}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center w-full px-4 py-3 text-sm text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};