import React from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../hooks/useData';
import NotificationBell from './ui/NotificationBell';

interface UserHeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ setSidebarOpen }) => {
  const location = useLocation();
  const { state } = useData();
  const { currentUser, notifications } = state;

  const getTitle = () => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    switch (path) {
        case 'deposit': return 'Deposit Funds';
        case 'withdraw': return 'Withdraw Funds';
        case 'plans': return 'Investment Plans';
        case 'referrals': return 'My Network';
        case 'profile': return 'Profile Settings';
        default: return path.charAt(0).toUpperCase() + path.slice(1);
    }
  };

  const userNotifications = notifications.filter(n => n.userId === currentUser?.id);

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white ml-2 lg:ml-0">{getTitle()}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationBell notifications={userNotifications} userId={currentUser?.id} />
        <div className="relative">
          <button className="flex items-center focus:outline-none">
            <span className="mr-2 hidden md:inline">{currentUser?.fullName || 'Member'}</span>
            <img className="h-8 w-8 rounded-full object-cover" src="https://picsum.photos/101" alt="User avatar" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;