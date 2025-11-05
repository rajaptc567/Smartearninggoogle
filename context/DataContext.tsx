import React, { createContext, useReducer, ReactNode, useEffect } from 'react';
import { User, Deposit, Withdrawal, PaymentMethod, InvestmentPlan, Transaction, Rule, Status, Transfer, Settings, Notification } from '../types';

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
    isLoadingUsers: boolean;
}

const initialState: AppState = {
    users: [],
    deposits: [],
    withdrawals: [],
    transfers: [],
    paymentMethods: [],
    investmentPlans: [],
    transactions: [],
    rules: [],
    settings: {
        isUserTransferEnabled: true,
        restrictWithdrawalAmount: false,
        defaultCurrencySymbol: '$',
        siteWideMinWithdrawal: 10,
    },
    notifications: [],
    currentUser: null,
    isLoadingUsers: true,
};

type Action =
    | { type: 'SET_INITIAL_DATA'; payload: Omit<AppState, 'currentUser' | 'isLoadingUsers'> }
    | { type: 'SET_USERS_LOADING'; payload: boolean }
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
        // DATA LOADING ACTIONS
        case 'SET_USERS_LOADING':
            return { ...state, isLoadingUsers: action.payload };
        case 'SET_INITIAL_DATA': {
            const { users } = action.payload;
            const currentUser = users.length > 0 ? users[0] : null; // Set first user as default
            return {
                ...state,
                ...action.payload,
                currentUser,
                isLoadingUsers: false,
            };
        }
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
                `Your deposit request #${newDeposit.id} for ${state.settings.defaultCurrencySymbol}${newDeposit.amount.toFixed(2)} is pending.`
            );

            if (!depositor || newDeposit.matchedWithdrawalId) {
                return { ...state, deposits: [action.payload, ...state.deposits], notifications: newNotifications };
            }

            let currentSponsorUsername = depositor.sponsor;
            let level = 1;
            
            while (currentSponsorUsername && level <= 10) { 
                const sponsor = state.users.find(u => u.username === currentSponsorUsername);
                if (!sponsor) break;

                const sponsorActivePlans = state.investmentPlans.filter(p => sponsor.activePlans.includes(p.name));
                const sponsorPlan = sponsorActivePlans.reduce((highest, p) => p.price > highest.price ? p : highest, sponsorActivePlans[0]);
                
                if (!sponsorPlan) break;

                let commissionConfig: { value: number, type: 'fixed' | 'percentage' } | undefined;

                if (level === 1) {
                    const directReferralCount = state.users.filter(u => u.sponsor === sponsor.username).length;
                    const slotIndex = directReferralCount -1;
                    
                    if (sponsorPlan.directReferralLimit > 0 && sponsorPlan.directCommissions.length > slotIndex) {
                        commissionConfig = sponsorPlan.directCommissions[slotIndex];
                    } else if (sponsorPlan.directReferralLimit === 0 && sponsorPlan.directCommissions.length > 0){
                        commissionConfig = sponsorPlan.directCommissions[0]; // Use first value for unlimited
                    }
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
                        `You have a new pending Level ${level} commission of ${state.settings.defaultCurrencySymbol}${commissionValue.toFixed(2)} from ${depositor.username}.`
                    );
                }
                
                currentSponsorUsername = sponsor.sponsor;
                level++;
            }
            
            return { ...state, deposits: [action.payload, ...state.deposits], transactions: newTransactions, notifications: newNotifications };
        }
        case 'UPDATE_DEPOSIT': {
            let updatedState = { ...state };
            const updatedDeposit = action.payload;
            const originalDeposit = updatedState.deposits.find(d => d.id === updatedDeposit.id);
            if (!originalDeposit || originalDeposit.status === updatedDeposit.status) return updatedState;
            
            updatedState.notifications = createNotification(
                updatedState.notifications,
                updatedDeposit.userId,
                `Your deposit #${updatedDeposit.id} for ${state.settings.defaultCurrencySymbol}${updatedDeposit.amount.toFixed(2)} has been ${updatedDeposit.status}.`
            );

            if (originalDeposit.status !== Status.Approved && updatedDeposit.status === Status.Approved) {
                updatedState.users = updatedState.users.map(u => u.id === updatedDeposit.userId ? { ...u, walletBalance: u.walletBalance + updatedDeposit.amount } : u);
                updatedState.transactions.unshift({ id: `TRN${Date.now()}`, userId: updatedDeposit.userId, userName: updatedDeposit.userName, type: 'Deposit', amount: updatedDeposit.amount, date: new Date().toISOString().split('T')[0], description: `Approved Deposit #${updatedDeposit.id}`, status: 'Approved' });
            
                if (updatedDeposit.matchedWithdrawalId) {
                    const matchedWithdrawal = updatedState.withdrawals.find(w => w.id === updatedDeposit.matchedWithdrawalId);
                    if (matchedWithdrawal) {
                        const remaining = (matchedWithdrawal.matchRemainingAmount || 0) - updatedDeposit.amount;
                        matchedWithdrawal.matchRemainingAmount = Math.max(0, remaining);
                        if (matchedWithdrawal.matchRemainingAmount === 0) {
                            matchedWithdrawal.status = Status.Paid;
                            updatedState.transactions.unshift({ id: `TRN_P2P_${matchedWithdrawal.id}`, userId: matchedWithdrawal.userId, userName: matchedWithdrawal.userName, type: 'Withdrawal', amount: -matchedWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `P2P Withdrawal #${matchedWithdrawal.id} Paid`, status: 'Approved' });
                            updatedState.notifications = createNotification(updatedState.notifications, matchedWithdrawal.userId, `Your P2P withdrawal #${matchedWithdrawal.id} has been fully paid.`);
                        }
                    }
                } else {
                    const pendingCommTxs = updatedState.transactions.filter(t => t.description.includes(updatedDeposit.id) && t.status === 'Pending');
                    for (const commTx of pendingCommTxs) {
                        commTx.status = 'Approved';
                        const sponsor = updatedState.users.find(u => u.id === commTx.userId);
                        const depositor = updatedState.users.find(u => u.id === updatedDeposit.userId);
                        if (!sponsor || !depositor) continue;

                        const sponsorActivePlans = state.investmentPlans.filter(p => sponsor.activePlans.includes(p.name));
                        const sponsorPlan = sponsorActivePlans.reduce((highest, p) => p.price > highest.price ? p : highest, sponsorActivePlans[0]);
                        
                        const directReferralCount = state.users.filter(u => u.sponsor === sponsor.username).length;
                        
                        const isHeldPosition = sponsorPlan?.holdPosition.enabled && sponsorPlan.holdPosition.slots.includes(directReferralCount);

                        if (isHeldPosition) {
                            sponsor.heldBalance += commTx.amount;
                            commTx.type = 'Held Commission';
                            updatedState.notifications = createNotification(updatedState.notifications, commTx.userId, `A commission of ${state.settings.defaultCurrencySymbol}${commTx.amount.toFixed(2)} from ${updatedDeposit.userName} was added to your held balance for upgrade.`);
                            
                            // Check for auto-upgrade
                            if (sponsorPlan.autoUpgrade.enabled && sponsorPlan.autoUpgrade.toPlanId) {
                                const upgradePlan = state.investmentPlans.find(p => p.id === sponsorPlan.autoUpgrade.toPlanId);
                                if (upgradePlan && sponsor.heldBalance >= upgradePlan.price) {
                                    sponsor.heldBalance -= upgradePlan.price;
                                    sponsor.activePlans = [...new Set([...sponsor.activePlans, upgradePlan.name])];
                                    updatedState.transactions.unshift({id: `TRN_UPG_${sponsor.id}`, userId: sponsor.id, userName: sponsor.username, type: 'Plan Upgrade', amount: -upgradePlan.price, date: new Date().toISOString().split('T')[0], description: `Auto-upgraded to ${upgradePlan.name} from held balance.`, status: 'Approved'});
                                    updatedState.notifications = createNotification(updatedState.notifications, sponsor.id, `Congratulations! You have been automatically upgraded to the ${upgradePlan.name}.`);
                                }
                            }
                        } else {
                             sponsor.walletBalance += commTx.amount;
                             updatedState.notifications = createNotification(updatedState.notifications, commTx.userId, `Your pending commission of ${state.settings.defaultCurrencySymbol}${commTx.amount.toFixed(2)} from ${updatedDeposit.userName} has been approved.`);
                        }
                    }
                }
            } 
            else if (originalDeposit.status === Status.Approved && updatedDeposit.status !== Status.Approved) {
                updatedState.users = state.users.map(u => u.id === updatedDeposit.userId ? { ...u, walletBalance: u.walletBalance - updatedDeposit.amount } : u);
            }
            
            updatedState.deposits = updatedState.deposits.map(d => d.id === updatedDeposit.id ? updatedDeposit : d);
            updatedState.currentUser = updatedState.users.find(u => u.id === state.currentUser?.id) || state.currentUser;
            return updatedState;
        }

        // WITHDRAWAL ACTIONS
        case 'ADD_WITHDRAWAL': {
             const newWithdrawal = action.payload;
             const updatedUsers = state.users.map(u => u.id === newWithdrawal.userId ? { ...u, walletBalance: u.walletBalance - newWithdrawal.amount } : u);
             const newTransaction: Transaction = { id: `TRN${Date.now()}`, userId: newWithdrawal.userId, userName: newWithdrawal.userName, type: 'Withdrawal Request', amount: -newWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `Pending Withdrawal #${newWithdrawal.id}`, status: 'Pending' };
             const newNotifications = createNotification(state.notifications, newWithdrawal.userId, `Your withdrawal request #${newWithdrawal.id} for ${state.settings.defaultCurrencySymbol}${newWithdrawal.amount.toFixed(2)} is pending.`);

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
                activePlans: [...new Set([...user.activePlans, plan.name])], // Add to array, ensuring uniqueness
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
            
            const newNotifications = createNotification(state.notifications, userId, `You successfully purchased the ${plan.name} for ${state.settings.defaultCurrencySymbol}${plan.price}.`);
            
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

            const newNotifications = createNotification(state.notifications, userId, `Admin Adjustment: Your wallet balance was changed by ${amount > 0 ? '+' : ''}${state.settings.defaultCurrencySymbol}${Math.abs(amount).toFixed(2)}. Reason: ${description}`);

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
            const newNotifications = createNotification(state.notifications, senderId, `Your transfer request of ${state.settings.defaultCurrencySymbol}${amount.toFixed(2)} to ${recipientName} is pending.`);

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
                newNotifications = createNotification(newNotifications, updatedTransfer.recipientId, `You received a transfer of ${state.settings.defaultCurrencySymbol}${updatedTransfer.amount.toFixed(2)} from ${updatedTransfer.senderName}.`);

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

    useEffect(() => {
        const fetchInitialData = async () => {
            dispatch({ type: 'SET_USERS_LOADING', payload: true });
            try {
                const endpoints = [
                    'users', 'deposits', 'withdrawals', 'transfers', 
                    'payment-methods', 'investment-plans', 'transactions', 
                    'rules', 'settings', 'notifications'
                ];
                
                const requests = endpoints.map(ep => fetch(`http://localhost:3001/api/${ep.replace(/_/g, '-')}`));
                const responses = await Promise.all(requests);

                for (const response of responses) {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} on ${response.url}`);
                    }
                }

                const dataPromises = responses.map(res => res.json());
                const [
                    users, deposits, withdrawals, transfers,
                    paymentMethods, investmentPlans, transactions,
                    rules, settings, notifications
                ] = await Promise.all(dataPromises);
                
                dispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        users, deposits, withdrawals, transfers,
                        paymentMethods, investmentPlans, transactions,
                        rules, settings, notifications,
                    }
                });

            } catch (error) {
                console.error("Failed to fetch initial data. Please ensure the backend server is running.", error);
                // On failure, stop loading, and the UI will show empty states.
                dispatch({ type: 'SET_USERS_LOADING', payload: false });
            }
        };

        fetchInitialData();
    }, []);

    return (
        <DataContext.Provider value={{ state, dispatch }}>
            {children}
        </DataContext.Provider>
    );
};
