import React, { createContext, useReducer, ReactNode } from 'react';
import { User, Deposit, Withdrawal, PaymentMethod, InvestmentPlan, Transaction, Rule, Status, Transfer, Settings, Notification } from '../types';
import { mockUsers, mockDeposits, mockWithdrawals, mockPaymentMethods, mockInvestmentPlans, mockTransactions, mockRules, mockTransfers, mockNotifications } from '../data/mockData';

interface AppState {
    users: User[];
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    transfers: Transfer[];
    paymentMethods: PaymentMethod[];
    investmentPlans: InvestmentPlan[];
    transactions: Transaction[];
    rules: Rule[];
    settings: Settings;
    notifications: Notification[];
    currentUser: User | null;
}

const initialState: AppState = {
    users: mockUsers,
    deposits: mockDeposits,
    withdrawals: mockWithdrawals,
    transfers: mockTransfers,
    paymentMethods: mockPaymentMethods,
    investmentPlans: mockInvestmentPlans,
    transactions: mockTransactions,
    rules: mockRules,
    settings: {
        isUserTransferEnabled: true,
        restrictWithdrawalAmount: false,
    },
    notifications: mockNotifications,
    currentUser: mockUsers[0] || null,
};

type Action =
    | { type: 'ADD_USER'; payload: User }
    | { type: 'UPDATE_USER'; payload: User }
    | { type: 'TOGGLE_USER_STATUS'; payload: number }
    | { type: 'UPDATE_DEPOSIT'; payload: Deposit }
    | { type: 'ADD_DEPOSIT'; payload: Deposit }
    | { type: 'UPDATE_WITHDRAWAL'; payload: Withdrawal }
    | { type: 'ADD_WITHDRAWAL'; payload: Withdrawal }
    | { type: 'ADD_PAYMENT_METHOD'; payload: PaymentMethod }
    | { type: 'UPDATE_PAYMENT_METHOD'; payload: PaymentMethod }
    | { type: 'DELETE_PAYMENT_METHOD'; payload: number }
    | { type: 'ADD_INVESTMENT_PLAN'; payload: InvestmentPlan }
    | { type: 'UPDATE_INVESTMENT_PLAN'; payload: InvestmentPlan }
    | { type: 'DELETE_INVESTMENT_PLAN'; payload: number }
    | { type: 'ADD_RULE'; payload: Rule }
    | { type: 'DELETE_RULE'; payload: number }
    | { type: 'ADD_TRANSACTION'; payload: Transaction }
    | { type: 'MANUAL_WALLET_ADJUSTMENT'; payload: { userId: number; amount: number; description: string }}
    | { type: 'PURCHASE_PLAN'; payload: { userId: number; planId: number } }
    | { type: 'UPDATE_SETTINGS', payload: Partial<Settings> }
    | { type: 'ADD_TRANSFER'; payload: Omit<Transfer, 'id' | 'status' | 'date'> }
    | { type: 'UPDATE_TRANSFER'; payload: Transfer }
    | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
    | { type: 'MARK_NOTIFICATIONS_AS_READ'; payload: number }; // userId


const dataReducer = (state: AppState, action: Action): AppState => {
    
    const createNotification = (
      notifications: Notification[], 
      userId: number, 
      message: string
    ): Notification[] => {
        const newNotification: Notification = {
            id: Date.now(),
            userId,
            message,
            date: new Date().toISOString().split('T')[0],
            read: false,
        };
        return [newNotification, ...notifications];
    };
    
    switch (action.type) {
        // NOTIFICATION ACTIONS
        case 'ADD_NOTIFICATION':
            const newNotification = { ...action.payload, id: Date.now() };
            return { ...state, notifications: [newNotification, ...state.notifications] };
        case 'MARK_NOTIFICATIONS_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(n => 
                    n.userId === action.payload ? { ...n, read: true } : n
                ),
            };

        // USER ACTIONS
        case 'ADD_USER': {
            const newUser = action.payload;
            let newNotifications = state.notifications;
            if(newUser.sponsor) {
                const sponsor = state.users.find(u => u.username === newUser.sponsor);
                if (sponsor) {
                    newNotifications = createNotification(
                        state.notifications, 
                        sponsor.id,
                        `Congratulations! You have a new direct referral: ${newUser.fullName} (@${newUser.username}).`
                    );
                }
            }
            return { ...state, users: [...state.users, newUser], notifications: newNotifications };
        }
        case 'UPDATE_USER': {
            const updatedUsers = state.users.map(u => u.id === action.payload.id ? action.payload : u);
            const updatedCurrentUser = state.currentUser?.id === action.payload.id ? action.payload : state.currentUser;
            return {
                ...state,
                users: updatedUsers,
                currentUser: updatedCurrentUser
            };
        }
        case 'TOGGLE_USER_STATUS': {
            return {
                ...state,
                users: state.users.map(u => u.id === action.payload ? { ...u, status: u.status === Status.Active ? Status.Blocked : Status.Active } : u)
            };
        }

        // DEPOSIT ACTIONS
        case 'ADD_DEPOSIT': {
            const newDeposit = action.payload;
            const depositor = state.users.find(u => u.id === newDeposit.userId);
            let newTransactions = [...state.transactions];
            let newNotifications = createNotification(
                state.notifications,
                newDeposit.userId,
                `Your deposit request #${newDeposit.id} for $${newDeposit.amount.toFixed(2)} is pending.`
            );

            if (!depositor || newDeposit.matchedWithdrawalId) {
                return { ...state, deposits: [action.payload, ...state.deposits], notifications: newNotifications };
            }

            let currentSponsorUsername = depositor.sponsor;
            let level = 1;
            
            while (currentSponsorUsername && level <= 10) { 
                const sponsor = state.users.find(u => u.username === currentSponsorUsername);
                if (!sponsor) break;

                const sponsorPlan = state.investmentPlans.find(p => p.name === sponsor.activePlan);
                if (!sponsorPlan) break;

                let commissionConfig: { value: number, type: 'fixed' | 'percentage' } | undefined;

                if (level === 1) {
                    commissionConfig = sponsorPlan.directCommission;
                } else if (sponsorPlan.indirectCommissions.length >= level - 1) {
                    commissionConfig = sponsorPlan.indirectCommissions[level - 2];
                }

                if (commissionConfig && commissionConfig.value > 0) {
                     const commissionValue = commissionConfig.type === 'percentage'
                        ? (newDeposit.amount * commissionConfig.value) / 100
                        : commissionConfig.value;
                    
                    const commissionTx: Transaction = {
                        id: `TRN_COMM_${newDeposit.id}_L${level}`,
                        userId: sponsor.id,
                        userName: sponsor.username,
                        type: 'Commission',
                        amount: commissionValue,
                        date: new Date().toISOString().split('T')[0],
                        description: `From ${depositor.username} (Deposit #${newDeposit.id})`,
                        level: level,
                        status: 'Pending'
                    };
                    newTransactions.unshift(commissionTx);
                    newNotifications = createNotification(
                        newNotifications,
                        sponsor.id,
                        `You have a new pending Level ${level} commission of $${commissionValue.toFixed(2)} from ${depositor.username}.`
                    );
                }
                
                currentSponsorUsername = sponsor.sponsor;
                level++;
            }
            
            return { ...state, deposits: [action.payload, ...state.deposits], transactions: newTransactions, notifications: newNotifications };
        }
        case 'UPDATE_DEPOSIT': {
            const updatedDeposit = action.payload;
            const originalDeposit = state.deposits.find(d => d.id === updatedDeposit.id);
            if (!originalDeposit || originalDeposit.status === updatedDeposit.status) return state;
            
            let newNotifications = createNotification(
                state.notifications,
                updatedDeposit.userId,
                `Your deposit #${updatedDeposit.id} for $${updatedDeposit.amount.toFixed(2)} has been ${updatedDeposit.status}.`
            );

            let newUsers = [...state.users];
            let newTransactions = [...state.transactions];
            let newWithdrawals = [...state.withdrawals];

            if (originalDeposit.status !== Status.Approved && updatedDeposit.status === Status.Approved) {
                newUsers = newUsers.map(u => u.id === updatedDeposit.userId ? { ...u, walletBalance: u.walletBalance + updatedDeposit.amount } : u);
                newTransactions.unshift({ id: `TRN${Date.now()}`, userId: updatedDeposit.userId, userName: updatedDeposit.userName, type: 'Deposit', amount: updatedDeposit.amount, date: new Date().toISOString().split('T')[0], description: `Approved Deposit #${updatedDeposit.id}`, status: 'Approved' });
            
                if (updatedDeposit.matchedWithdrawalId) {
                    const matchedWithdrawal = newWithdrawals.find(w => w.id === updatedDeposit.matchedWithdrawalId);
                    if (matchedWithdrawal) {
                        const remaining = (matchedWithdrawal.matchRemainingAmount || 0) - updatedDeposit.amount;
                        matchedWithdrawal.matchRemainingAmount = Math.max(0, remaining);
                        if (matchedWithdrawal.matchRemainingAmount === 0) {
                            matchedWithdrawal.status = Status.Paid;
                            newTransactions.unshift({ id: `TRN_P2P_${matchedWithdrawal.id}`, userId: matchedWithdrawal.userId, userName: matchedWithdrawal.userName, type: 'Withdrawal', amount: -matchedWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `P2P Withdrawal #${matchedWithdrawal.id} Paid`, status: 'Approved' });
                             newNotifications = createNotification(newNotifications, matchedWithdrawal.userId, `Your P2P withdrawal #${matchedWithdrawal.id} has been fully paid.`);
                        }
                    }
                } else {
                    const pendingCommTxs = newTransactions.filter(t => t.description.includes(updatedDeposit.id) && t.status === 'Pending');
                    for (const commTx of pendingCommTxs) {
                        commTx.status = 'Approved';
                        newUsers = newUsers.map(u => u.id === commTx.userId ? { ...u, walletBalance: u.walletBalance + commTx.amount } : u);
                        newNotifications = createNotification(newNotifications, commTx.userId, `Your pending commission of $${commTx.amount.toFixed(2)} from ${updatedDeposit.userName} has been approved.`);
                    }
                }
            } 
            else if (originalDeposit.status === Status.Approved && updatedDeposit.status !== Status.Approved) {
                newUsers = state.users.map(u => u.id === updatedDeposit.userId ? { ...u, walletBalance: u.walletBalance - updatedDeposit.amount } : u);
            }
            
            return {
                ...state,
                deposits: state.deposits.map(d => d.id === updatedDeposit.id ? updatedDeposit : d),
                withdrawals: newWithdrawals,
                users: newUsers,
                transactions: newTransactions,
                notifications: newNotifications,
                currentUser: newUsers.find(u => u.id === state.currentUser?.id) || state.currentUser
            };
        }

        // WITHDRAWAL ACTIONS
        case 'ADD_WITHDRAWAL': {
             const newWithdrawal = action.payload;
             const updatedUsers = state.users.map(u => u.id === newWithdrawal.userId ? { ...u, walletBalance: u.walletBalance - newWithdrawal.amount } : u);
             const newTransaction: Transaction = { id: `TRN${Date.now()}`, userId: newWithdrawal.userId, userName: newWithdrawal.userName, type: 'Withdrawal Request', amount: -newWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `Pending Withdrawal #${newWithdrawal.id}`, status: 'Pending' };
             const newNotifications = createNotification(state.notifications, newWithdrawal.userId, `Your withdrawal request #${newWithdrawal.id} for $${newWithdrawal.amount.toFixed(2)} is pending.`);

             return {
                 ...state,
                 withdrawals: [newWithdrawal, ...state.withdrawals],
                 users: updatedUsers,
                 transactions: [newTransaction, ...state.transactions],
                 notifications: newNotifications,
                 currentUser: updatedUsers.find(u => u.id === state.currentUser?.id) || state.currentUser
             }
        }
        case 'UPDATE_WITHDRAWAL': {
            const updatedWithdrawal = action.payload;
            const originalWithdrawal = state.withdrawals.find(w => w.id === updatedWithdrawal.id);
            if (!originalWithdrawal || originalWithdrawal.status === updatedWithdrawal.status) return state;

            let newNotifications = createNotification(state.notifications, updatedWithdrawal.userId, `Your withdrawal request #${updatedWithdrawal.id} has been updated to ${updatedWithdrawal.status}.`);

            let newUsers = [...state.users];
            let newTransactions = [...state.transactions];
            let finalWithdrawal = { ...updatedWithdrawal };

            if (updatedWithdrawal.status === Status.Matching && originalWithdrawal.status !== Status.Matching) {
                finalWithdrawal.matchRemainingAmount = updatedWithdrawal.finalAmount;
            }
            
            if (originalWithdrawal.status !== Status.Rejected && updatedWithdrawal.status === Status.Rejected) {
                newUsers = state.users.map(u => u.id === updatedWithdrawal.userId ? { ...u, walletBalance: u.walletBalance + updatedWithdrawal.amount } : u);
                newTransactions.unshift({ id: `TRN${Date.now()}`, userId: updatedWithdrawal.userId, userName: updatedWithdrawal.userName, type: 'Withdrawal Refund', amount: updatedWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `Refund for Rejected Withdrawal #${updatedWithdrawal.id}`, status: 'Approved' });
            }
             if (originalWithdrawal.status === Status.Rejected && updatedWithdrawal.status !== Status.Rejected) {
                newUsers = state.users.map(u => u.id === updatedWithdrawal.userId ? { ...u, walletBalance: u.walletBalance - updatedWithdrawal.amount } : u);
            }

            return {
                ...state,
                withdrawals: state.withdrawals.map(w => w.id === finalWithdrawal.id ? finalWithdrawal : w),
                users: newUsers,
                transactions: newTransactions,
                notifications: newNotifications,
                currentUser: newUsers.find(u => u.id === state.currentUser?.id) || state.currentUser
            };
        }

        // PAYMENT METHOD ACTIONS
        case 'ADD_PAYMENT_METHOD':
            return { ...state, paymentMethods: [action.payload, ...state.paymentMethods] };
        case 'UPDATE_PAYMENT_METHOD':
            return { ...state, paymentMethods: state.paymentMethods.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_PAYMENT_METHOD':
            return { ...state, paymentMethods: state.paymentMethods.filter(p => p.id !== action.payload) };

        // INVESTMENT PLAN ACTIONS
        case 'ADD_INVESTMENT_PLAN':
            return { ...state, investmentPlans: [action.payload, ...state.investmentPlans] };
        case 'UPDATE_INVESTMENT_PLAN':
            return { ...state, investmentPlans: state.investmentPlans.map(p => p.id === action.payload.id ? action.payload : p) };
        case 'DELETE_INVESTMENT_PLAN':
            return { ...state, investmentPlans: state.investmentPlans.filter(p => p.id !== action.payload) };
        case 'PURCHASE_PLAN': {
            const { userId, planId } = action.payload;
            const user = state.users.find(u => u.id === userId);
            const plan = state.investmentPlans.find(p => p.id === planId);

            if (!user || !plan || user.walletBalance < plan.price) {
                alert('Purchase failed. Insufficient funds or plan not found.');
                return state;
            }

            const updatedUser = {
                ...user,
                walletBalance: user.walletBalance - plan.price,
                activePlan: plan.name,
            };

            const newTransaction: Transaction = {
                id: `TRN${Date.now()}`,
                userId: userId,
                userName: user.username,
                type: 'Plan Purchase',
                amount: -plan.price,
                date: new Date().toISOString().split('T')[0],
                description: `Purchased ${plan.name}`,
                status: 'Approved'
            };

            const updatedUsers = state.users.map(u => u.id === userId ? updatedUser : u);
            const updatedCurrentUser = state.currentUser?.id === userId ? updatedUser : state.currentUser;
            
            const newNotifications = createNotification(state.notifications, userId, `You successfully purchased the ${plan.name} for $${plan.price}.`);
            
            alert(`${plan.name} purchased successfully!`);

            return {
                ...state,
                users: updatedUsers,
                transactions: [newTransaction, ...state.transactions],
                currentUser: updatedCurrentUser,
                notifications: newNotifications,
            };
        }

        // RULE ACTIONS
        case 'ADD_RULE':
            return { ...state, rules: [action.payload, ...state.rules] };
        case 'DELETE_RULE':
            return { ...state, rules: state.rules.filter(r => r.id !== action.payload) };
        
        // WALLET ACTIONS
        case 'MANUAL_WALLET_ADJUSTMENT': {
            const { userId, amount, description } = action.payload;
            const user = state.users.find(u => u.id === userId);
            if (!user) return state;

            const newUsers = state.users.map(u => 
                u.id === userId ? { ...u, walletBalance: u.walletBalance + amount } : u
            );

            const newTransaction: Transaction = {
                id: `TRN${Date.now()}`,
                userId: userId,
                userName: user.username,
                type: amount > 0 ? 'Manual Credit' : 'Manual Debit',
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: description,
                status: 'Approved'
            };

            const newNotifications = createNotification(state.notifications, userId, `An admin has adjusted your wallet by $${amount.toFixed(2)}. Reason: ${description}`);

            return {
                ...state,
                users: newUsers,
                transactions: [newTransaction, ...state.transactions],
                notifications: newNotifications,
                currentUser: newUsers.find(u => u.id === state.currentUser?.id) || state.currentUser,
            };
        }

        // SETTINGS ACTIONS
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: { ...state.settings, ...action.payload }
            };
        
        // TRANSFER ACTIONS
        case 'ADD_TRANSFER': {
            const { senderId, recipientId, amount, senderName, recipientName } = action.payload;
            const sender = state.users.find(u => u.id === senderId);
            
            if (!sender || sender.walletBalance < amount) {
                alert('Action failed: Sender not found or insufficient balance.');
                return state;
            }
            
            const newTransfer: Transfer = {
                ...action.payload,
                id: `TRF${Date.now()}`,
                status: Status.Pending,
                date: new Date().toISOString().split('T')[0],
            };

            const updatedUsers = state.users.map(u => u.id === senderId ? { ...u, walletBalance: u.walletBalance - amount } : u);
            const newTransaction: Transaction = {
                id: `TRN${Date.now()}`,
                userId: senderId,
                userName: sender.username,
                type: 'Transfer Request',
                amount: -amount,
                date: newTransfer.date,
                description: `Transfer to ${recipientName} #${newTransfer.id}`,
                status: 'Pending'
            };
            const newNotifications = createNotification(state.notifications, senderId, `Your transfer request of $${amount.toFixed(2)} to ${recipientName} is pending.`);

            return {
                ...state,
                transfers: [newTransfer, ...state.transfers],
                users: updatedUsers,
                transactions: [newTransaction, ...state.transactions],
                notifications: newNotifications,
                currentUser: updatedUsers.find(u => u.id === state.currentUser?.id) || state.currentUser,
            };
        }
        case 'UPDATE_TRANSFER': {
            const updatedTransfer = action.payload;
            const originalTransfer = state.transfers.find(t => t.id === updatedTransfer.id);
            if (!originalTransfer || originalTransfer.status !== Status.Pending) return state;

            let newUsers = [...state.users];
            let newTransactions = [...state.transactions];
            let newNotifications = state.notifications;
            const originalTx = newTransactions.find(tx => tx.description.includes(updatedTransfer.id));

            if (updatedTransfer.status === Status.Approved) {
                newUsers = newUsers.map(u => u.id === updatedTransfer.recipientId ? { ...u, walletBalance: u.walletBalance + updatedTransfer.amount } : u);
                newTransactions.unshift({ id: `TRN${Date.now()}`, userId: updatedTransfer.recipientId, userName: updatedTransfer.recipientName, type: 'Transfer Received', amount: updatedTransfer.amount, date: new Date().toISOString().split('T')[0], description: `From ${updatedTransfer.senderName} #${updatedTransfer.id}`, status: 'Approved' });
                if (originalTx) {
                    originalTx.type = 'Transfer Sent';
                    originalTx.status = 'Approved';
                }
                newNotifications = createNotification(newNotifications, updatedTransfer.senderId, `Your transfer to ${updatedTransfer.recipientName} was approved.`);
                newNotifications = createNotification(newNotifications, updatedTransfer.recipientId, `You received a transfer of $${updatedTransfer.amount.toFixed(2)} from ${updatedTransfer.senderName}.`);

            } else if (updatedTransfer.status === Status.Rejected) {
                newUsers = newUsers.map(u => u.id === updatedTransfer.senderId ? { ...u, walletBalance: u.walletBalance + updatedTransfer.amount } : u);
                if (originalTx) {
                    originalTx.type = 'Transfer Refund';
                    originalTx.amount = updatedTransfer.amount;
                    originalTx.status = 'Approved';
                }
                 newNotifications = createNotification(newNotifications, updatedTransfer.senderId, `Your transfer to ${updatedTransfer.recipientName} was rejected.`);
            }

            return {
                ...state,
                transfers: state.transfers.map(t => t.id === updatedTransfer.id ? updatedTransfer : t),
                users: newUsers,
                transactions: newTransactions,
                notifications: newNotifications,
                currentUser: newUsers.find(u => u.id === state.currentUser?.id) || state.currentUser,
            };
        }

        default:
            return state;
    }
};

export const DataContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> }>({
    state: initialState,
    dispatch: () => null,
});

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, initialState);

    return (
        <DataContext.Provider value={{ state, dispatch }}>
            {children}
        </DataContext.Provider>
    );
};