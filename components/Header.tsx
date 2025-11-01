import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationBell from './ui/NotificationBell';
import { useData } from '../hooks/useData';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const location = useLocation();
  const { state } = useData();

  const getTitle = () => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    if (path === 'payment-methods') return 'Payment Methods';
    if (path === 'investment-plans') return 'Investment Plans';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white ml-2 lg:ml-0">{getTitle()}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell notifications={state.notifications} />
        <div className="relative">
          <button className="flex items-center focus:outline-none">
            <span className="mr-2 hidden md:inline">Admin</span>
            <img className="h-8 w-8 rounded-full object-cover" src="https://picsum.photos/100" alt="Admin avatar" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;