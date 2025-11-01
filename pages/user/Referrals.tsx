import React, { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { User, Status, Transaction } from '../../types';
import Badge from '../../components/ui/Badge';

interface GenealogyNode {
    user: User;
    children: GenealogyNode[];
    level: number;
}

const Referrals: React.FC = () => {
    const { state } = useData();
    const { currentUser, users, transactions } = state;

    const buildGenealogy = useMemo(() => {
        const build = (sponsorUsername: string, allUsers: User[], level: number): GenealogyNode[] => {
            const directReferrals = allUsers.filter(u => u.sponsor === sponsorUsername);
            if (!directReferrals.length) return [];
            return directReferrals.map(child => ({
                user: child,
                children: build(child.username, allUsers, level + 1),
                level: level,
            }));
        };
        return currentUser ? build(currentUser.username, users, 1) : [];
    }, [currentUser, users]);

    const directReferrals = useMemo(() => {
        return buildGenealogy.map(node => node.user);
    }, [buildGenealogy]);

    if (!currentUser) {
        return <div>Loading...</div>;
    }
    
    const getCommissionFromReferral = (referralUsername: string): number => {
        if (!currentUser) return 0;
        return transactions
            .filter(t => t.userId === currentUser.id && t.type === 'Commission' && t.description.includes(`From ${referralUsername}`))
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const renderTree = (nodes: GenealogyNode[]) => (
        <ul className="space-y-2">
            {nodes.map(node => (
                <li key={node.user.id} className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex-shrink-0">
                           <span className="text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {node.level}
                           </span>
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm font-semibold">{node.user.fullName} <span className="text-xs font-normal text-gray-500">@{node.user.username}</span></p>
                            <p className="text-xs text-gray-500">{node.user.email}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-semibold text-green-600 dark:text-green-400">${getCommissionFromReferral(node.user.username).toFixed(2)}</p>
                           <Badge status={node.user.status} />
                        </div>
                    </div>
                    {node.children.length > 0 && <div className="mt-2">{renderTree(node.children)}</div>}
                </li>
            ))}
        </ul>
    );

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Direct Referrals ({directReferrals.length})</h2>
                {directReferrals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-2">Full Name</th>
                                    <th className="px-4 py-2">Username</th>
                                    <th className="px-4 py-2">Email</th>
                                    <th className="px-4 py-2">Commission Earned</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {directReferrals.map(user => (
                                    <tr key={user.id} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-2 font-medium">{user.fullName}</td>
                                        <td className="px-4 py-2">@{user.username}</td>
                                        <td className="px-4 py-2">{user.email}</td>
                                        <td className="px-4 py-2 font-semibold text-green-600 dark:text-green-400">${getCommissionFromReferral(user.username).toFixed(2)}</td>
                                        <td className="px-4 py-2"><Badge status={user.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-500">You have no direct referrals yet.</p>}
             </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Referral Network Tree</h2>
                {buildGenealogy.length > 0 ? renderTree(buildGenealogy) : <p className="text-gray-500">Your referral network is empty.</p>}
            </div>
        </div>
    );
};

export default Referrals;