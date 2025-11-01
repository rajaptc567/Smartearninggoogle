import React from 'react';
import { Status } from '../../types';

interface BadgeProps {
  status: Status | 'Enabled' | 'Disabled';
}

// FIX: Added 'Matching' status to support all possible Status enum values.
const statusColors: { [key in Status | 'Enabled' | 'Disabled']: string } = {
  [Status.Active]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [Status.Pending]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [Status.Blocked]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [Status.Approved]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [Status.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  [Status.Paid]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [Status.Disabled]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [Status.Matching]: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'Enabled': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const Badge: React.FC<BadgeProps> = ({ status }) => {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
      {status}
    </span>
  );
};

export default Badge;