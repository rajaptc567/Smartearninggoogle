import React, { useState, useMemo } from 'react';
import { User, Status, Deposit, Withdrawal, Transaction } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import Modal from '../components/ui/Modal';

const Users: React.FC = () => {
    const { state, dispatch } = useData();
    const { users } = state;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [modalMode, setModalMode] = useState<'edit' | 'details'>('edit');
    const [searchTerm, setSearchTerm] = useState('');

    const handleOpenModal = (user: User | null = null, mode: 'edit' | 'details' = 'edit') => {
        setEditingUser(user);
        setModalMode(mode);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingUser(null);
        setIsModalOpen(false);
    };

    const handleSaveUser = (user: User) => {
        if (editingUser) {
            dispatch({ type: 'UPDATE_USER', payload: user });
        } else {
            // This is a simplified add user, a real one would need more fields
            const newUser = { ...user, id: Date.now(), walletBalance: 0, heldBalance: 0, activePlans: [], registrationDate: new Date().toISOString().split('T')[0], status: Status.Active };
            dispatch({ type: 'ADD_USER', payload: newUser });
        }
        handleCloseModal();
    };

    const handleToggleStatus = (userId: number) => {
        dispatch({ type: 'TOGGLE_USER_STATUS', payload: userId });
    }

    const filteredUsers = useMemo(() => users.filter(user => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            user.username.toLowerCase().includes(term) ||
            user.fullName.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            user.phone.includes(term) ||
            user.id.toString().includes(term)
        );
    }), [users, searchTerm]);

    const tableHeaders = ['User', 'Contact', 'Wallet Balance', 'Active Plan(s)', 'Status', 'Actions'];

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Members</h2>
                <div className="flex gap-2">
                    <input 
                        type="text"
                        placeholder="Filter by name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <Button onClick={() => handleOpenModal(null, 'edit')}>Add User</Button>
                </div>
            </div>
             <Table headers={tableHeaders}>
                {filteredUsers.map((user: User) => (
                    <tr key={user.id} className="text-gray-700 dark:text-gray-400">
                        <td className="px-4 py-3">
                            <div className="flex items-center text-sm">
                                <div>
                                    <p className="font-semibold">{user.fullName}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">@{user.username} (ID: {user.id})</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {user.email}<br/>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{user.phone}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">${user.walletBalance.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{user.activePlans.join(', ') || 'None'}</td>
                        <td className="px-4 py-3 text-xs">
                           <Badge status={user.status} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                            <div className="flex items-center space-x-2">
                                <Button size="sm" variant="secondary" onClick={() => handleOpenModal(user, 'details')}>Details</Button>
                                <Button size="sm" variant={user.status === Status.Blocked ? 'success' : 'danger'} onClick={() => handleToggleStatus(user.id)}>
                                    {user.status === Status.Blocked ? 'Unblock' : 'Block'}
                                </Button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>
            {isModalOpen && (
                <UserFormModal 
                    user={editingUser}
                    mode={modalMode}
                    onClose={handleCloseModal}
                    onSave={handleSaveUser}
                    onSwitchToEdit={() => setModalMode('edit')}
                />
            )}
        </div>
    );
};


// UserFormModal Component
interface UserFormModalProps {
    user: User | null;
    mode: 'edit' | 'details';
    onClose: () => void;
    onSave: (user: User) => void;
    onSwitchToEdit: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, mode, onClose, onSave, onSwitchToEdit }) => {
    const { state } = useData();
    const [formData, setFormData] = useState<Partial<User>>(
        user || { fullName: '', username: '', email: '', phone: '' }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as User);
    };

    if (mode === 'details' && user) {
        return <UserDetailsModal user={user} onClose={onClose} onSwitchToEdit={onSwitchToEdit} />;
    }

    return (
        <Modal isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-4">
                <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Add New User'}</h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="fullName" className="block text-sm font-medium">Full Name</label>
                        <input type="text" name="fullName" value={formData.fullName || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium">Username</label>
                        <input type="text" name="username" value={formData.username || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
                        <input type="text" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        </Modal>
    )
}

// UserDetailsModal Component
const UserDetailsModal: React.FC<{ user: User; onClose: () => void; onSwitchToEdit: () => void;}> = ({ user, onClose, onSwitchToEdit }) => {
    const { state } = useData();
    const { users, deposits, withdrawals, transactions } = state;
    
    const userDeposits = useMemo(() => deposits.filter(d => d.userId === user.id), [deposits, user.id]);
    const userWithdrawals = useMemo(() => withdrawals.filter(w => w.userId === user.id), [withdrawals, user.id]);
    const userTransactions = useMemo(() => transactions.filter(t => t.userId === user.id), [transactions, user.id]);

    const buildGenealogy = (userId: number, allUsers: User[]): { user: User, children: any[] }[] => {
        const directReferrals = allUsers.filter(u => u.sponsor === users.find(mainUser => mainUser.id === userId)?.username);
        if (!directReferrals.length) return [];
        return directReferrals.map(child => ({
            user: child,
            children: buildGenealogy(child.id, allUsers),
        }));
    };
    const genealogyTree = useMemo(() => buildGenealogy(user.id, users), [user.id, users]);

    const renderTree = (nodes: { user: User, children: any[] }[]) => (
        <ul className="pl-4 border-l border-gray-200 dark:border-gray-700">
            {nodes.map(node => (
                <li key={node.user.id} className="mt-2">
                    <p className="text-sm">
                        <span className="font-semibold">{node.user.fullName}</span> (@{node.user.username}) - <Badge status={node.user.status} />
                    </p>
                    {node.children.length > 0 && renderTree(node.children)}
                </li>
            ))}
        </ul>
    );

    const HistoryTable = ({data, type}: {data: any[], type: 'deposits' | 'withdrawals' | 'transactions'}) => (
        <div className="overflow-x-auto max-h-60">
            <table className="w-full text-sm">
                {type === 'deposits' && <thead><tr className="text-left text-xs uppercase"><th className="p-2">ID</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Date</th></tr></thead>}
                {type === 'withdrawals' && <thead><tr className="text-left text-xs uppercase"><th className="p-2">ID</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Date</th></tr></thead>}
                {type === 'transactions' && <thead><tr className="text-left text-xs uppercase"><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Desc</th><th className="p-2">Date</th></tr></thead>}
                <tbody>
                    {data.map((item: any) => (
                         <tr key={item.id} className="border-b dark:border-gray-700">
                            {type !== 'transactions' && <td className="p-2">{item.id}</td>}
                            {type === 'transactions' && <td className="p-2">{item.type}</td>}
                            <td className={`p-2 font-semibold ${item.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>${item.amount?.toFixed(2)}</td>
                            
                            {type !== 'transactions' ? 
                                <td className="p-2"><Badge status={item.status} /></td>
                                : 
                                <td className="p-2"><Badge status={item.status as Status || Status.Approved} /></td>
                            }
                            
                            {type === 'transactions' && <td className="p-2">{item.description}</td>}
                            <td className="p-2">{item.date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
             {data.length === 0 && <p className="p-2 text-xs text-gray-500">No records found.</p>}
        </div>
    );

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="p-4 w-[90vw] max-w-4xl">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">User Details: {user.fullName}</h2>
                    <Button onClick={onSwitchToEdit}>Edit User</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Personal Information</h3>
                            <p className="text-sm"><strong>Username:</strong> @{user.username}</p>
                            <p className="text-sm"><strong>Email:</strong> {user.email}</p>
                            <p className="text-sm"><strong>Phone:</strong> {user.phone}</p>
                            <p className="text-sm"><strong>Sponsor:</strong> @{user.sponsor || 'N/A'}</p>
                            <p className="text-sm"><strong>Registered:</strong> {user.registrationDate}</p>
                        </div>
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Wallet & Plan</h3>
                            <p className="text-sm"><strong>Available Balance:</strong> <span className="font-bold text-green-600">${user.walletBalance.toFixed(2)}</span></p>
                            <p className="text-sm"><strong>Held for Upgrade:</strong> <span className="font-bold text-yellow-600">${user.heldBalance.toFixed(2)}</span></p>
                            <p className="text-sm"><strong>Current Plan(s):</strong> {user.activePlans.join(', ') || 'None'}</p>
                            <p className="text-sm"><strong>Status:</strong> <Badge status={user.status} /></p>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><h3 className="font-semibold mb-2">Deposit History</h3><HistoryTable data={userDeposits} type="deposits"/></div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><h3 className="font-semibold mb-2">Withdrawal History</h3><HistoryTable data={userWithdrawals} type="withdrawals"/></div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg"><h3 className="font-semibold mb-2">All Transactions</h3><HistoryTable data={userTransactions} type="transactions"/></div>
                    </div>
                </div>
                 <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Genealogy Tree</h3>
                    {genealogyTree.length > 0 ? renderTree(genealogyTree) : <p className="text-sm text-gray-500">This user has no referrals.</p>}
                </div>
            </div>
        </Modal>
    );
}


export default Users;
