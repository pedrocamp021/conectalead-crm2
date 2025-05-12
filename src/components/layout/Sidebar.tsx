import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { 
  LayoutDashboard, Users, LogOut, X, MessageSquare, 
  BarChart2, Settings, HelpCircle, User, Kanban,
  Eye, Phone, Plug
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAdmin, logout } = useAppStore();

  const clientNavigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Kanban de Leads',
      path: '/kanban',
      icon: <Kanban className="w-5 h-5" />,
    },
    {
      name: 'Follow-up',
      path: '/followups',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      name: 'Relatórios',
      path: '/reports',
      icon: <BarChart2 className="w-5 h-5" />,
    },
    {
      name: 'Conectar WhatsApp',
      path: '/conectar-whatsapp',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      name: 'Webhook N8N',
      path: '/webhook',
      icon: <Plug className="w-5 h-5" />,
    },
    {
      name: 'Minha Visualização',
      path: '/preferences',
      icon: <Eye className="w-5 h-5" />,
    },
    {
      group: 'Configurações',
      items: [
        {
          name: 'Perfil',
          path: '/profile',
          icon: <User className="w-5 h-5" />,
        },
        {
          name: 'Suporte',
          path: '/support',
          icon: <HelpCircle className="w-5 h-5" />,
        }
      ]
    }
  ];

  const adminNavigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      group: 'Administração',
      items: [
        {
          name: 'Gestão de Clientes',
          path: '/admin/clients',
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: 'Visualizar Kanban',
          path: '/admin/kanban',
          icon: <Kanban className="w-5 h-5" />,
        }
      ]
    },
    {
      group: 'Financeiro',
      items: [
        {
          name: 'Previsão de Cobranças',
          path: '/admin/forecast',
          icon: <BarChart2 className="w-5 h-5" />,
        },
        {
          name: 'Controle de Pagamentos',
          path: '/admin/payments',
          icon: <Settings className="w-5 h-5" />,
        }
      ]
    }
  ];

  const navigation = isAdmin ? adminNavigation : clientNavigation;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 w-64 h-full bg-gray-800 text-white transition-transform duration-300
          lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo and Close Button */}
        <div className="h-16 flex items-center justify-between px-4 lg:justify-center">
          <Link to="/dashboard" className="flex items-center">
            <div className="rounded-md bg-blue-600 text-white p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="ml-2 text-xl font-semibold">ConectaLead</span>
          </Link>
          
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          <nav className="px-4 py-4 space-y-1">
            {navigation.map((item, index) => {
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
        
        {/* Logout Button */}
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