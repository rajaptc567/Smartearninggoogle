import React from 'react';
import { useData } from '../../hooks/useData';
import Table from '../../components/ui/Table';
import { Status, Transaction } from '../../types';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const Transactions: React.FC = () => {
    const { state } = useData();
    const { currentUser, transactions, settings } = state;
    
    if (!currentUser) {
        return <div>Loading...</div>;
    }

    const userTransactions = transactions
        .filter(t => t.userId === currentUser.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const tableHeaders = ['ID', 'Type', 'Amount', 'Status', 'Date', 'Description'];
    
    const downloadCSV = () => {
        if (userTransactions.length === 0) return;
        
        const headers = ['Transaction ID', 'Type', 'Amount', 'Status', 'Date', 'Description'];
        const csvContent = [
            headers.join(','),
            ...userTransactions.map(tx => [
                `"${tx.id}"`,
                `"${tx.type}"`,
                tx.amount,
                `"${tx.status || 'Approved'}"`,
                `"${tx.date}"`,
                `"${tx.description.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions-statement-${currentUser.username}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Transaction History</h2>
                <Button onClick={downloadCSV} disabled={userTransactions.length === 0}>Download Statement (CSV)</Button>
            </div>
            {userTransactions.length > 0 ? (
                <Table headers={tableHeaders}>
                    {userTransactions.map((tx: Transaction) => (
                         <tr key={tx.id} className="text-gray-700 dark:text-gray-400">
                            <td className="px-4 py-3 text-sm font-mono">{tx.id}</td>
                            <td className="px-4 py-3 text-sm">{tx.type}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount > 0 ? '+' : ''}{settings.defaultCurrencySymbol}{tx.amount.toFixed(2)}
                            </td>
                             <td className="px-4 py-3 text-xs">
                                <Badge status={tx.status as Status || Status.Approved} />
                            </td>
                            <td className="px-4 py-3 text-sm">{tx.date}</td>
                            <td className="px-4 py-3 text-sm">
                                {tx.description}
                                {tx.type === 'Commission' && tx.level && ` (Level ${tx.level})`}
                            </td>
                        </tr>
                    ))}
                </Table>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">You have no transactions yet.</p>
            )}
        </div>
    );
};

export default Transactions;