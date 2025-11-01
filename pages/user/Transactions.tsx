import React from 'react';
import { useData } from '../../hooks/useData';
import Table from '../../components/ui/Table';
import { Status, Transaction } from '../../types';
import Badge from '../../components/ui/Badge';

const Transactions: React.FC = () => {
    const { state } = useData();
    const { currentUser, transactions } = state;
    
    if (!currentUser) {
        return <div>Loading...</div>;
    }

    const userTransactions = transactions.filter(t => t.userId === currentUser.id);
    const tableHeaders = ['ID', 'Type', 'Amount', 'Status', 'Date', 'Description'];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Transaction History</h2>
            {userTransactions.length > 0 ? (
                <Table headers={tableHeaders}>
                    {userTransactions.map((tx: Transaction) => (
                         <tr key={tx.id} className="text-gray-700 dark:text-gray-400">
                            <td className="px-4 py-3 text-sm font-mono">{tx.id}</td>
                            <td className="px-4 py-3 text-sm">{tx.type}</td>
                            <td className={`px-4 py-3 text-sm font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
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