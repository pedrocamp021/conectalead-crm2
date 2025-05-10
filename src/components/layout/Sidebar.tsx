import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../lib/store';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  LogOut,
  X
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
      name: 'Admin Panel',
      path: '/admin',
      icon: <Users className="w-5 h-5" />,
      show: isAdmin,
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-5 h-5" />,
      show: false, // Future feature
    },
  ];

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
            {navigationItems.filter(item => item.show).map((item) => (
              <Link
                key={item.path}
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
            ))}
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
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};