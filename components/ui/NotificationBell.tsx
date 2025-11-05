import React, { useState, useMemo } from 'react';
import { Notification } from '../../types';
import { useData } from '../../hooks/useData';

interface NotificationBellProps {
  notifications: Notification[];
  userId?: number;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ notifications, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { actions } = useData();

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleToggle = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (nextIsOpen && unreadCount > 0 && userId) {
      // Mark as read when the panel is opened
      // This is a "fire and forget" action, we don't need to wait for it.
      // The state will update on the next global data refresh.
      actions.markNotificationsAsRead(userId);
    }
  };

  return (
    <div className="relative">
      <button onClick={handleToggle} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-20">
          <div className="p-4 font-semibold border-b dark:border-gray-700">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notif => (
                <div key={notif.id} className={`p-4 border-b dark:border-gray-700 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{notif.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.date}</p>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">No new notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;