
import React from 'react';
import Table from '../components/ui/Table';

const Logs: React.FC = () => {
    const mockLogs = [
        { id: 1, timestamp: '2023-10-27 10:05:14', action: 'Deposit Approved', user: 'jane.smith', details: 'Approved deposit #DEP1002 for $100.00', admin: 'admin' },
        { id: 2, timestamp: '2023-10-27 09:30:00', action: 'User Login', user: 'admin', details: 'Admin logged in from IP 127.0.0.1', admin: 'system' },
        { id: 3, timestamp: '2023-10-26 15:45:21', action: 'Settings Changed', user: 'admin', details: 'Updated default currency to USD', admin: 'admin' },
    ];
    const tableHeaders = ['Timestamp', 'Action', 'Affected User', 'Details', 'Performed By'];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">System Logs</h2>
            <Table headers={tableHeaders}>
                {mockLogs.map(log => (
                     <tr key={log.id} className="text-gray-700 dark:text-gray-400">
                        <td className="px-4 py-3 text-sm">{log.timestamp}</td>
                        <td className="px-4 py-3 text-sm">{log.action}</td>
                        <td className="px-4 py-3 text-sm">{log.user}</td>
                        <td className="px-4 py-3 text-sm">{log.details}</td>
                        <td className="px-4 py-3 text-sm">{log.admin}</td>
                    </tr>
                ))}
            </Table>
        </div>
    );
};

export default Logs;
