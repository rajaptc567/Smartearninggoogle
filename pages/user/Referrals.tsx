import React, { useState, useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { User, Status } from '../../types';
import Badge from '../../components/ui/Badge';

interface GenealogyNode {
    user: User;
    children: GenealogyNode[];
    level: number;
}

const Referrals: React.FC = () => {
    const { state } = useData();
    const { currentUser, users, transactions, investmentPlans, settings } = state;

    // State for filters
    const [planFilter, setPlanFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [commissionFilter, setCommissionFilter] = useState<string>('');

    // Commission calculation helpers
    const getCommissionFromReferral = (referralUsername: string, commissionStatus: 'Approved' | 'Pending'): number => {
        if (!currentUser) return 0;
        return transactions
            .filter(t => 
                t.userId === currentUser.id && 
                t.type === 'Commission' && 
                t.status === commissionStatus &&
                t.description.includes(`From ${referralUsername}`)
            )
            .reduce((sum, t) => sum + t.amount, 0);
    };

    // Filter the users based on selected criteria before building the tree
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // Always include the current user in the base set for tree building
            if (user.id === currentUser?.id) return true;

            // Filter by active plan
            if (planFilter && !user.activePlans.includes(planFilter)) {
                return false;
            }
            // Filter by user status
            if (statusFilter && user.status !== statusFilter) {
                return false;
            }
            // Filter by commission status
            if (commissionFilter) {
                const hasPaid = getCommissionFromReferral(user.username, 'Approved') > 0;
                const hasPending = getCommissionFromReferral(user.username, 'Pending') > 0;
                if (commissionFilter === 'paid' && !hasPaid) return false;
                if (commissionFilter === 'pending' && !hasPending) return false;
            }
            return true;
        });
    }, [users, planFilter, statusFilter, commissionFilter, currentUser?.id, transactions]);


    // This function recursively builds the user's referral tree from the filtered list
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
        return currentUser ? build(currentUser.username, filteredUsers, 1) : [];
    }, [currentUser, filteredUsers]);

    // This gets the direct referrals for the table view from the filtered tree
    const directReferrals = useMemo(() => {
        return buildGenealogy.map(node => node.user);
    }, [buildGenealogy]);

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    const PlanBadges = ({ plans }: { plans: string[] }) => {
        if (plans.length === 0) {
            return <span className="text-xs text-gray-500">No Active Plan</span>;
        }
        return (
            <div className="flex flex-wrap gap-1">
                {plans.map(plan => (
                    <span key={plan} className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                        {plan}
                    </span>
                ))}
            </div>
        );
    };

    // Renders the nested tree view of referrals
    const renderTree = (nodes: GenealogyNode[]) => (
        <ul className="space-y-3">
            {nodes.map(node => {
                const paidCommission = getCommissionFromReferral(node.user.username, 'Approved');
                const pendingCommission = getCommissionFromReferral(node.user.username, 'Pending');
                return (
                    <li key={node.user.id} className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 space-y-2">
                            <div className="flex items-center justify-between space-x-3">
                                <div className="flex items-center space-x-3">
                                    <span className="text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex-shrink-0">
                                    {node.level}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">{node.user.fullName} <span className="text-xs font-normal text-gray-500">@{node.user.username}</span></p>
                                        <p className="text-xs text-gray-500">{node.user.email}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400" title="Paid Commission">{settings.defaultCurrencySymbol}{paidCommission.toFixed(2)}</p>
                                    {pendingCommission > 0 && <p className="text-xs font-semibold text-yellow-500" title="Pending Commission">({settings.defaultCurrencySymbol}{pendingCommission.toFixed(2)})</p>}
                                    <Badge status={node.user.status} />
                                </div>
                            </div>
                            <div>
                                <PlanBadges plans={node.user.activePlans} />
                            </div>
                        </div>
                        {node.children.length > 0 && <div className="mt-3">{renderTree(node.children)}</div>}
                    </li>
                )
            })}
        </ul>
    );

    return (
        <div className="space-y-6">
             <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Filter Network</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="planFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">By Active Plan</label>
                        <select id="planFilter" value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Plans</option>
                            {investmentPlans.filter(p => p.status === Status.Active).map(plan => (
                                <option key={plan.id} value={plan.name}>{plan.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">By User Status</label>
                        <select id="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All Statuses</option>
                            <option value={Status.Active}>Active</option>
                            <option value={Status.Blocked}>Blocked</option>
                            <option value={Status.Pending}>Pending</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="commissionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">By Commission</label>
                        <select id="commissionFilter" value={commissionFilter} onChange={e => setCommissionFilter(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value="">All</option>
                            <option value="paid">Has Paid Commission</option>
                            <option value="pending">Has Pending Commission</option>
                        </select>
                    </div>
                </div>
            </div>
             <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Direct Referrals ({directReferrals.length})</h2>
                {directReferrals.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-2">Full Name</th>
                                    <th className="px-4 py-2">Active Plan(s)</th>
                                    <th className="px-4 py-2">Paid Commission</th>
                                    <th className="px-4 py-2">Pending Commission</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Registration Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {directReferrals.map(user => {
                                    const paidCommission = getCommissionFromReferral(user.username, 'Approved');
                                    const pendingCommission = getCommissionFromReferral(user.username, 'Pending');
                                    return (
                                        <tr key={user.id} className="border-b dark:border-gray-700">
                                            <td className="px-4 py-3 font-medium">
                                                <div>{user.fullName}</div>
                                                <div className="text-xs text-gray-500">@{user.username}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <PlanBadges plans={user.activePlans} />
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">{settings.defaultCurrencySymbol}{paidCommission.toFixed(2)}</td>
                                            <td className="px-4 py-3 font-semibold text-yellow-600 dark:text-yellow-400">{settings.defaultCurrencySymbol}{pendingCommission.toFixed(2)}</td>
                                            <td className="px-4 py-3"><Badge status={user.status} /></td>
                                            <td className="px-4 py-3">{user.registrationDate}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-500">No direct referrals match your current filters.</p>}
             </div>
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Referral Network Tree</h2>
                {buildGenealogy.length > 0 ? renderTree(buildGenealogy) : <p className="text-gray-500">No referrals match your current filters.</p>}
            </div>
        </div>
    );
};

export default Referrals;