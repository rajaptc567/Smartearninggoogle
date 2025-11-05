// FIX: Import `useMemo` from React to fix "Cannot find name 'useMemo'" error.
import React, { createContext, useReducer, ReactNode, useEffect, useCallback, useMemo } from 'react';
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

// Define the shape of our API actions
export interface ApiActions {
    addUser: (user: Partial<User>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    toggleUserStatus: (userId: number) => Promise<void>;
    addDeposit: (deposit: Partial<Deposit>) => Promise<void>;
    updateDeposit: (deposit: Deposit) => Promise<void>;
    addWithdrawal: (withdrawal: Partial<Withdrawal>) => Promise<void>;
    updateWithdrawal: (withdrawal: Withdrawal) => Promise<void>;
    addPaymentMethod: (method: Partial<PaymentMethod>) => Promise<void>;
    updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
    deletePaymentMethod: (methodId: number) => Promise<void>;
    addInvestmentPlan: (plan: Partial<InvestmentPlan>) => Promise<void>;
    updateInvestmentPlan: (plan: InvestmentPlan) => Promise<void>;
    deleteInvestmentPlan: (planId: number) => Promise<void>;
    purchasePlan: (payload: { userId: number; planId: number }) => Promise<void>;
    addRule: (rule: Partial<Rule>) => Promise<void>;
    deleteRule: (ruleId: number) => Promise<void>;
    manualWalletAdjustment: (payload: { userId: number; amount: number; description: string }) => Promise<void>;
    updateSettings: (settings: Partial<Settings>) => Promise<void>;
    addTransfer: (transfer: Partial<Transfer>) => Promise<void>;
    updateTransfer: (transfer: Transfer) => Promise<void>;
    markNotificationsAsRead: (userId: number) => Promise<void>;
    reloadData: () => Promise<void>;
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
    | { type: 'SET_LOADING'; payload: boolean };


const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoadingUsers: action.payload };
        case 'SET_INITIAL_DATA': {
            const { users } = action.payload;
            // Persist the currentUser if they exist in the new user list, otherwise default to first user.
            const newCurrentUser = users.find(u => u.id === state.currentUser?.id) || users[0] || null;
            return {
                ...state,
                ...action.payload,
                currentUser: newCurrentUser,
                isLoadingUsers: false,
            };
        }
        default:
            return state;
    }
};

export const DataContext = createContext<{ state: AppState; actions: ApiActions }>({
    state: initialState,
    actions: {} as ApiActions,
});

const API_BASE_URL = 'https://smtbackend.onrender.com/api';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, initialState);

    const fetchInitialData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const endpoints = [
                'users', 'deposits', 'withdrawals', 'transfers', 
                'payment-methods', 'investment-plans', 'transactions', 
                'rules', 'settings', 'notifications'
            ];
            
            const requests = endpoints.map(ep => fetch(`${API_BASE_URL}/${ep.replace(/_/g, '-')}`));
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
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);
    
    // --- API ACTION IMPLEMENTATIONS ---
    const actions: ApiActions = useMemo(() => ({
        reloadData: fetchInitialData,

        // Generic request handler
        _request: async function(endpoint: string, options: RequestInit) {
            try {
                const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error('API Error:', errorBody);
                    alert(`API Error: ${errorBody}`);
                    throw new Error(`API request failed: ${response.statusText}`);
                }
                await fetchInitialData(); // Automatically refresh data on any successful mutation
                return response.status !== 204 ? await response.json() : null;
            } catch (error) {
                console.error(`Error with ${options.method} request to ${endpoint}:`, error);
                alert(`An error occurred. See console for details.`); // Simple user feedback
                throw error;
            }
        },

        // Users
        addUser: async function(user) { await this._request('users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) }); },
        updateUser: async function(user) { await this._request(`users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user) }); },
        toggleUserStatus: async function(userId) { await this._request(`users/${userId}/toggle-status`, { method: 'PUT' }); },
        
        // Deposits
        addDeposit: async function(deposit) { await this._request('deposits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deposit) }); },
        updateDeposit: async function(deposit) { await this._request(`deposits/${deposit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(deposit) }); },

        // Withdrawals
        addWithdrawal: async function(withdrawal) { await this._request('withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withdrawal) }); },
        updateWithdrawal: async function(withdrawal) { await this._request(`withdrawals/${withdrawal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(withdrawal) }); },

        // Transfers
        addTransfer: async function(transfer) { await this._request('transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transfer) }); },
        updateTransfer: async function(transfer) { await this._request(`transfers/${transfer.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transfer) }); },

        // Payment Methods
        addPaymentMethod: async function(method) { await this._request('payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(method) }); },
        updatePaymentMethod: async function(method) { await this._request(`payment-methods/${method.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(method) }); },
        deletePaymentMethod: async function(methodId) { await this._request(`payment-methods/${methodId}`, { method: 'DELETE' }); },

        // Investment Plans
        addInvestmentPlan: async function(plan) { await this._request('investment-plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) }); },
        updateInvestmentPlan: async function(plan) { await this._request(`investment-plans/${plan.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) }); },
        deleteInvestmentPlan: async function(planId) { await this._request(`investment-plans/${planId}`, { method: 'DELETE' }); },
        purchasePlan: async function(payload) { await this._request(`users/${payload.userId}/purchase-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: payload.planId }) }); },

        // Rules
        addRule: async function(rule) { await this._request('rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) }); },
        deleteRule: async function(ruleId) { await this._request(`rules/${ruleId}`, { method: 'DELETE' }); },

        // Wallet & Settings
        manualWalletAdjustment: async function(payload) { await this._request('wallet/adjust', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); },
        updateSettings: async function(settings) { await this._request('settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); },
        
        // Notifications
        markNotificationsAsRead: async function(userId) { await this._request(`notifications/read/${userId}`, { method: 'PUT' }); },

    }), [fetchInitialData]);

    return (
        <DataContext.Provider value={{ state, actions }}>
            {children}
        </DataContext.Provider>
    );
};