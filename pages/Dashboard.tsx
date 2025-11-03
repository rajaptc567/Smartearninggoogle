
import React from 'react';
import { Deposit, Status } from '../types';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';
import { useData } from '../hooks/useData';

const Dashboard: React.FC = () => {
    const { state } = useData();
    const { settings, users, deposits, withdrawals } = state;
    
    const totalDeposits = deposits.reduce((sum, d) => d.status === Status.Approved ? sum + d.amount : sum, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => w.status === Status.Paid ? sum + w.finalAmount : sum, 0);

    const recentDeposits = deposits.slice(0, 5);

    const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">{value}</p>
            </div>
            <div className="text-blue-500 bg-blue-100 dark:bg-gray-700 dark:text-blue-400 p-3 rounded-full">
                {icon}
            </div>
        </div>
    );

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Users" value={users.length} icon={<UsersIcon />} />
                <StatCard title="Total Deposits" value={`${settings.defaultCurrencySymbol}${totalDeposits.toFixed(2)}`} icon={<DepositIcon />} />
                <StatCard title="Total Withdrawals" value={`${settings.defaultCurrencySymbol}${totalWithdrawals.toFixed(2)}`} icon={<WithdrawalIcon />} />
                <StatCard title="Commissions Paid" value={`${settings.defaultCurrencySymbol}5,780.50`} icon={<CommissionIcon />} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Deposit Requests</h2>
                <Table headers={['User', 'Amount', 'Method', 'Status', 'Date']}>
                    {recentDeposits.map((deposit: Deposit) => (
                        <tr key={deposit.id} className="text-gray-700 dark:text-gray-400">
                            <td className="px-4 py-3">{deposit.userName}</td>
                            <td className="px-4 py-3">{settings.defaultCurrencySymbol}{deposit.amount.toFixed(2)}</td>
                            <td className="px-4 py-3">{deposit.method}</td>
                            <td className="px-4 py-3"><Badge status={deposit.status} /></td>
                            <td className="px-4 py-3 text-sm">{deposit.date}</td>
                        </tr>
                    ))}
                </Table>
            </div>
        </div>
    );
};


const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 1.803M15 21a9 9 0 00-9-8.627M15 21a9 9 0 003.75-1.465M12 12a4 4 0 100-8 4 4 0 000 8z"></path></svg>;
const DepositIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
const WithdrawalIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
const CommissionIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;


export default Dashboard;