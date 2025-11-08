import React, { createContext, useReducer, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { User, Deposit, Withdrawal, PaymentMethod, InvestmentPlan, Transaction, Rule, Transfer, Settings, Notification, Status } from '../../types';
import { db, auth } from '../firebase/config';
import { 
    collection, getDocs, doc, setDoc, updateDoc, addDoc, deleteDoc, runTransaction, query, where, documentId, writeBatch, getDoc
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

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
    currentUser: User | null; // The app's user object from Firestore
    firebaseUser: FirebaseUser | null; // The user object from Firebase Auth
    isLoading: boolean; // Combined loading state
    error: string | null;
}

export interface ApiActions {
    updateUser: (user: Partial<User>) => Promise<void>;
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
    deleteInvestmentPlan: (planIdplanIdplanId: number) => Promise<void>;
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
    firebaseUser: null,
    isLoading: true,
    error: null,
};

type Action =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_AUTH_USER'; payload: { firebaseUser: FirebaseUser | null; currentUser: User | null } }
    | { type: 'SET_DATA'; payload: Omit<AppState, 'currentUser' | 'firebaseUser' | 'isLoading' | 'error'> }
    | { type: 'CLEAR_STATE' };

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_AUTH_USER':
            return { ...state, firebaseUser: action.payload.firebaseUser, currentUser: action.payload.currentUser };
        case 'SET_DATA':
             // Ensure currentUser is kept up-to-date if the users array is part of the payload
            const updatedCurrentUser = action.payload.users && state.currentUser 
                ? action.payload.users.find(u => u.id === state.currentUser!.id) || state.currentUser
                : state.currentUser;
            return { ...state, ...action.payload, currentUser: updatedCurrentUser, isLoading: false, error: null };
        case 'CLEAR_STATE':
            return { ...initialState, isLoading: false };
        default:
            return state;
    }
};

export const DataContext = createContext<{ state: AppState; actions: ApiActions }>({
    state: initialState,
    actions: {} as ApiActions,
});

const generateId = (prefix: string) => `${prefix.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

// Helper to fetch all documents from a collection and map IDs
async function fetchCollection<T>(collectionName: string): Promise<T[]> {
    const querySnapshot = await getDocs(collection(db, collectionName));
    // The spread operator after `id: doc.id` ensures that if the document's data
    // already contains an `id` field (like the numeric ID for users), it will
    // overwrite the default document ID, preserving the correct data structure.
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
}

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(dataReducer, initialState);

    const loadInitialData = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const [users, deposits, withdrawals, transfers, paymentMethods, investmentPlans, transactions, rules, notifications, settingsCollection] = await Promise.all([
                fetchCollection<User>('users'),
                fetchCollection<Deposit>('deposits'),
                fetchCollection<Withdrawal>('withdrawals'),
                fetchCollection<Transfer>('transfers'),
                fetchCollection<PaymentMethod>('paymentMethods'),
                fetchCollection<InvestmentPlan>('investmentPlans'),
                fetchCollection<Transaction>('transactions'),
                fetchCollection<Rule>('rules'),
                fetchCollection<Notification>('notifications'),
                getDocs(collection(db, 'settings'))
            ]);

            const settings = settingsCollection.docs[0] ? settingsCollection.docs[0].data() as Settings : initialState.settings;
            
            dispatch({ type: 'SET_DATA', payload: { users, deposits, withdrawals, transfers, paymentMethods, investmentPlans, transactions, rules, notifications, settings } });
        
        } catch (error: any) {
            console.error("Firebase fetch error:", error);
            dispatch({ type: 'SET_ERROR', payload: `Failed to connect to the database. Ensure your firebase/config.ts is correct. (${error.code})` });
        }
    }, []);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                dispatch({ type: 'SET_LOADING', payload: true });
                // User is signed in, fetch their data from Firestore
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const usersQuery = query(collection(db, "users"), where("uid", "==", firebaseUser.uid));
                const userSnapshot = await getDocs(usersQuery);

                if (!userSnapshot.empty) {
                    const currentUser = { id: userSnapshot.docs[0].data().id, ...userSnapshot.docs[0].data() } as User;
                    dispatch({ type: 'SET_AUTH_USER', payload: { firebaseUser, currentUser } });
                    await loadInitialData(); // Load all app data after user is confirmed
                } else {
                    // This case can happen if auth record exists but firestore doc was deleted.
                     dispatch({ type: 'SET_AUTH_USER', payload: { firebaseUser, currentUser: null } });
                     dispatch({ type: 'SET_LOADING', payload: false });
                }

            } else {
                // User is signed out
                dispatch({ type: 'CLEAR_STATE' });
            }
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, [loadInitialData]);
    
    const actions: ApiActions = useMemo(() => ({
        reloadData: loadInitialData,
        updateUser: async (userUpdate) => {
            if (!userUpdate.id) return;
            const userQuery = query(collection(db, "users"), where("id", "==", userUpdate.id));
            const userSnapshot = await getDocs(userQuery);
            if (userSnapshot.empty) return;
            const userDocRef = userSnapshot.docs[0].ref;
            await updateDoc(userDocRef, userUpdate);
            await loadInitialData();
        },
        toggleUserStatus: async (userId) => {
            const user = state.users.find(u => u.id === userId);
            if (!user) return;
            const userQuery = query(collection(db, "users"), where("id", "==", userId));
            const userSnapshot = await getDocs(userQuery);
            if (userSnapshot.empty) return;
            const userDocRef = userSnapshot.docs[0].ref;

            await updateDoc(userDocRef, { status: user.status === Status.Active ? Status.Blocked : Status.Active });
            await loadInitialData();
        },
        addDeposit: async (deposit) => {
            const newDeposit = { ...deposit, id: generateId('dep') };
            await setDoc(doc(db, 'deposits', newDeposit.id), newDeposit);
            await loadInitialData();
        },
        updateDeposit: async (deposit) => {
            try {
                await runTransaction(db, async (transaction) => {
                    const depositRef = doc(db, "deposits", deposit.id);
                    const originalDepositDoc = await transaction.get(depositRef);
                    if (!originalDepositDoc.exists()) throw "Deposit not found!";
                    const originalDeposit = originalDepositDoc.data() as Deposit;
                    
                    const userQuery = query(collection(db, "users"), where("id", "==", originalDeposit.userId));
                    const userSnapshot = await getDocs(userQuery);
                    if(userSnapshot.empty) throw "User not found";

                    const userRef = userSnapshot.docs[0].ref;
                    let user = userSnapshot.docs[0].data() as User;

                    if (originalDeposit.status !== Status.Approved && deposit.status === Status.Approved) {
                        // 1. Update user balance
                        transaction.update(userRef, { walletBalance: user.walletBalance + deposit.amount });

                        // 2. Add transaction record
                        const transRef = doc(collection(db, "transactions"));
                        transaction.set(transRef, { id: transRef.id, userId: deposit.userId, userName: deposit.userName, type: 'Deposit', amount: deposit.amount, date: new Date().toISOString().split('T')[0], description: `Approved Deposit #${deposit.id}`, status: Status.Approved });

                        // 3. Simplified commission logic
                         if (user.sponsor) {
                            const sponsorQuery = query(collection(db, "users"), where("username", "==", user.sponsor));
                            const sponsorDocs = await getDocs(sponsorQuery);
                            if(!sponsorDocs.empty) {
                                const sponsorRef = sponsorDocs.docs[0].ref;
                                const sponsor = sponsorDocs.docs[0].data() as User;
                                const sponsorPlan = state.investmentPlans.find(p => sponsor.activePlans.includes(p.name));
                                if (sponsorPlan && sponsorPlan.directCommissions.length > 0) {
                                    const commissionConfig = sponsorPlan.directCommissions[0];
                                    const commissionValue = commissionConfig.type === 'percentage' ? (deposit.amount * commissionConfig.value) / 100 : commissionConfig.value;
                                    
                                    transaction.update(sponsorRef, { walletBalance: sponsor.walletBalance + commissionValue });
                                    
                                    const sponsorTransRef = doc(collection(db, "transactions"));
                                    transaction.set(sponsorTransRef, {id: sponsorTransRef.id, userId: sponsor.id, userName: sponsor.username, type: 'Commission', amount: commissionValue, date: new Date().toISOString().split('T')[0], description: `From ${user.username}`, level: 1, status: Status.Approved });
                                    
                                    const notifRef = doc(collection(db, "notifications"));
                                    transaction.set(notifRef, { id: notifRef.id, userId: sponsor.id, message: `You received a commission of ${state.settings.defaultCurrencySymbol}${commissionValue.toFixed(2)}`, date: new Date().toISOString().split('T')[0], read: false});
                                }
                            }
                        }
                    }
                    
                    // Update the deposit itself
                    transaction.update(depositRef, deposit);
                });
            } catch (e) {
                console.error("Transaction failed: ", e);
            }
            await loadInitialData();
        },

        addWithdrawal: async (withdrawal) => {
            const newWithdrawal = { ...withdrawal, id: generateId('wdr'), status: Status.Pending, date: new Date().toISOString().split('T')[0] } as Withdrawal;
            const userQuery = query(collection(db, "users"), where("id", "==", newWithdrawal.userId));

            await runTransaction(db, async(transaction) => {
                const userSnapshot = await getDocs(userQuery);
                if(userSnapshot.empty) throw "User not found";
                const userRef = userSnapshot.docs[0].ref;
                const user = userSnapshot.docs[0].data();

                if (user.walletBalance < newWithdrawal.amount) throw "Insufficient balance";
                
                transaction.update(userRef, { walletBalance: user.walletBalance - newWithdrawal.amount });
                
                const wdrRef = doc(db, 'withdrawals', newWithdrawal.id);
                transaction.set(wdrRef, newWithdrawal);
                
                const transRef = doc(collection(db, "transactions"));
                transaction.set(transRef, { id: transRef.id, userId: newWithdrawal.userId, userName: newWithdrawal.userName, type: 'Withdrawal Request', amount: -newWithdrawal.amount, description: `Pending Withdrawal #${newWithdrawal.id}`, status: Status.Pending, date: newWithdrawal.date });
            });
            await loadInitialData();
        },
        updateWithdrawal: async (withdrawal) => {
            const original = state.withdrawals.find(w => w.id === withdrawal.id);
             if (!original) return;
            const withdrawalRef = doc(db, 'withdrawals', withdrawal.id);
            if (original.status !== Status.Rejected && withdrawal.status === Status.Rejected) {
                const userToRefund = state.users.find(u => u.id === original.userId);
                if (userToRefund) {
                    const userQuery = query(collection(db, "users"), where("id", "==", original.userId));
                    const userSnapshot = await getDocs(userQuery);
                    if (!userSnapshot.empty) {
                        const userRef = userSnapshot.docs[0].ref;
                        await updateDoc(userRef, { walletBalance: userToRefund.walletBalance + original.amount });
                    }
                }
            }
            await updateDoc(withdrawalRef, withdrawal);
            await loadInitialData();
        },
        addTransfer: async (transfer) => {
            const newTransfer = { ...transfer, id: generateId('trf'), status: Status.Pending, date: new Date().toISOString().split('T')[0] };
            await setDoc(doc(db, 'transfers', newTransfer.id), newTransfer);
            await loadInitialData();
        },
        updateTransfer: async (transfer) => {
            const ref = doc(db, 'transfers', transfer.id);
            await updateDoc(ref, transfer);
            await loadInitialData();
        },
        addPaymentMethod: async (method) => {
             const newMethodRef = doc(collection(db, "paymentMethods"));
             await setDoc(newMethodRef, { ...method, id: newMethodRef.id });
             await loadInitialData();
        },
        updatePaymentMethod: async (method) => {
             const ref = doc(db, 'paymentMethods', method.id.toString());
             await updateDoc(ref, method);
             await loadInitialData();
        },
        deletePaymentMethod: async (methodId) => {
             await deleteDoc(doc(db, 'paymentMethods', methodId.toString()));
             await loadInitialData();
        },
        addInvestmentPlan: async (plan) => {
            const newPlanRef = doc(collection(db, "investmentPlans"));
            await setDoc(newPlanRef, { ...plan, id: newPlanRef.id });
            await loadInitialData();
        },
        updateInvestmentPlan: async (plan) => {
            const ref = doc(db, 'investmentPlans', plan.id.toString());
            await updateDoc(ref, plan);
            await loadInitialData();
        },
        deleteInvestmentPlan: async (planId) => {
            await deleteDoc(doc(db, 'investmentPlans', planId.toString()));
            await loadInitialData();
        },
        purchasePlan: async ({ userId, planId }) => {
            const plan = state.investmentPlans.find(p => p.id === planId);
            const user = state.users.find(u => u.id === userId);
            if (!user || !plan || user.walletBalance < plan.price) return;

            const userQuery = query(collection(db, "users"), where("id", "==", userId));
            const userSnapshot = await getDocs(userQuery);
            if(userSnapshot.empty) return;
            const userRef = userSnapshot.docs[0].ref;

            await runTransaction(db, async(transaction) => {
                const updatedUser = { walletBalance: user.walletBalance - plan.price, activePlans: [...new Set([...user.activePlans, plan.name])] };
                transaction.update(userRef, updatedUser);

                const transRef = doc(collection(db, 'transactions'));
                transaction.set(transRef, { id: transRef.id, userId, userName: user.username, type: 'Plan Purchase', amount: -plan.price, description: `Purchased ${plan.name}`, status: Status.Approved, date: new Date().toISOString().split('T')[0] });
            });

            await loadInitialData();
        },
        addRule: async (rule) => {
            await addDoc(collection(db, 'rules'), rule);
            await loadInitialData();
        },
        deleteRule: async (ruleId) => {
            await deleteDoc(doc(db, 'rules', ruleId.toString()));
            await loadInitialData();
        },
        manualWalletAdjustment: async ({ userId, amount, description }) => {
            const user = state.users.find(u => u.id === userId);
            if (!user) return;
            
            const userQuery = query(collection(db, "users"), where("id", "==", userId));

            await runTransaction(db, async(transaction) => {
                const userSnapshot = await getDocs(userQuery);
                if (userSnapshot.empty) throw "User not found";
                const userRef = userSnapshot.docs[0].ref;

                transaction.update(userRef, { walletBalance: user.walletBalance + amount });
                const transRef = doc(collection(db, 'transactions'));
                transaction.set(transRef, { id: transRef.id, userId, userName: user.username, type: amount > 0 ? 'Manual Credit' : 'Manual Debit', amount, description, status: Status.Approved, date: new Date().toISOString().split('T')[0] });
            });
            await loadInitialData();
        },
        updateSettings: async (settingsUpdate) => {
            const settingsRef = doc(db, 'settings', 'main_settings');
            await setDoc(settingsRef, settingsUpdate, { merge: true }); // Use set with merge to create if not exists
            await loadInitialData();
        },
        markNotificationsAsRead: async (userId) => {
             const q = query(collection(db, "notifications"), where("userId", "==", userId), where("read", "==", false));
             const unreadNotifs = await getDocs(q);
             const batch = writeBatch(db);
             unreadNotifs.forEach(d => {
                batch.update(d.ref, { read: true });
             });
             await batch.commit();
             await loadInitialData();
        },

    }), [state, loadInitialData]);

    return (
        <DataContext.Provider value={{ state, actions }}>
            {children}
        </DataContext.Provider>
    );
};