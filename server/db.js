// server/db.js
import { JSONFilePreset } from 'lowdb/node';

// Default data structure if db.json doesn't exist
const defaultData = {
    users: [
      { id: 1, username: 'john.doe', fullName: 'John Doe', email: 'john.doe@example.com', phone: '123-456-7890', whatsapp: '1234567890', country: 'USA', walletBalance: 221.00, heldBalance: 0, activePlans: ['Gold Plan', 'Bronze Plan'], registrationDate: '2023-10-26', status: 'Active', sponsor: 'admin' },
      { id: 2, username: 'jane.smith', fullName: 'Jane Smith', email: 'jane.smith@example.com', phone: '234-567-8901', whatsapp: '2345678901', country: 'Canada', walletBalance: 50.00, heldBalance: 15.00, activePlans: ['Silver Plan'], registrationDate: '2023-10-25', status: 'Active', sponsor: 'john.doe' },
      { id: 3, username: 'sam.wilson', fullName: 'Sam Wilson', email: 'sam.wilson@example.com', phone: '345-678-9012', whatsapp: '3456789012', country: 'UK', walletBalance: 0, heldBalance: 0, activePlans: [], registrationDate: '2023-10-24', status: 'Pending', sponsor: 'jane.smith' },
      { id: 4, username: 'chris.green', fullName: 'Chris Green', email: 'chris.green@example.com', phone: '456-789-0123', whatsapp: '4567890123', country: 'Australia', walletBalance: 55.20, heldBalance: 0, activePlans: ['Bronze Plan'], registrationDate: '2023-10-23', status: 'Blocked', sponsor: 'john.doe' },
    ],
    deposits: [
      { id: 'DEP1001', userId: 2, userName: 'jane.smith', method: 'USDT', amount: 250, transactionId: 'TXN-ABC-123', receiptUrl: 'https://picsum.photos/200/300', status: 'Pending', date: '2023-10-27' },
      { id: 'DEP1002', userId: 1, userName: 'john.doe', method: 'Easypaisa', amount: 250, transactionId: 'TXN-DEF-456', status: 'Approved', date: '2023-10-26', adminNotes: 'Verified' },
      { id: 'DEP1003', userId: 4, userName: 'chris.green', method: 'BTC', amount: 500, transactionId: 'TXN-GHI-789', status: 'Rejected', date: '2023-10-25', adminNotes: 'Invalid transaction hash' },
      { id: 'DEP1004', userId: 2, userName: 'jane.smith', method: 'JazzCash', amount: 50, transactionId: 'TXN-JKL-101', status: 'Approved', date: '2023-10-24', userNotes: 'Urgent deposit for plan upgrade.' },
    ],
    withdrawals: [
        { id: 'WDR2001', userId: 1, userName: 'john.doe', method: 'Easypaisa', amount: 50, fee: 2.5, finalAmount: 47.5, status: 'Paid', date: '2023-10-26', accountTitle: 'John Doe', accountNumber: '03001234567' },
        { id: 'WDR2002', userId: 2, userName: 'jane.smith', method: 'Bank Transfer', amount: 100, fee: 5, finalAmount: 95, status: 'Pending', date: '2023-10-27', accountTitle: 'Jane Smith', accountNumber: '1234-5678-9012-3456', userNotes: 'Please process this quickly, thanks!' },
        { id: 'WDR2003', userId: 1, userName: 'john.doe', method: 'BTC', amount: 75, fee: 3.75, finalAmount: 71.25, status: 'Approved', date: '2023-10-25', accountTitle: 'John Doe BTC', accountNumber: 'bc1q...' },
        { id: 'WDR2004', userId: 4, userName: 'chris.green', method: 'Easypaisa', amount: 50, fee: 2.5, finalAmount: 47.5, status: 'Matching', date: '2023-10-28', accountTitle: 'Chris Green', accountNumber: '03129876543', matchRemainingAmount: 50 },
    ],
    paymentMethods: [
        { id: 1, name: 'Easypaisa', type: 'Deposit', accountTitle: 'John Doe', accountNumber: '03001234567', instructions: 'Send to this account and upload receipt.', minAmount: 10, maxAmount: 1000, feePercent: 0, status: 'Enabled' },
        { id: 2, name: 'JazzCash', type: 'Deposit', accountTitle: 'Jane Smith', accountNumber: '03017654321', instructions: 'Send and mention your username in reference.', minAmount: 10, maxAmount: 1000, feePercent: 0, status: 'Enabled' },
        { id: 3, name: 'USDT (TRC20)', type: 'Withdrawal', accountTitle: 'Company Wallet', accountNumber: 'TXYZ...', instructions: 'Withdrawals are processed within 24 hours.', minAmount: 50, maxAmount: 5000, feePercent: 2, status: 'Enabled' },
        { id: 4, name: 'Bank Transfer', type: 'Withdrawal', accountTitle: 'N/A', accountNumber: 'N/A', instructions: 'Provide your bank details in the form.', minAmount: 100, maxAmount: 10000, feePercent: 5, status: 'Disabled' },
    ],
    investmentPlans: [
        { id: 1, name: 'Bronze Plan', price: 50, durationDays: 30, minWithdraw: 10, description: 'A great starting plan.', status: 'Active', directReferralLimit: 10, directCommissions: Array(10).fill(null).map((_, i) => ({ type: 'percentage', value: i < 5 ? 10 : 8 })), indirectCommissions: [ { type: 'percentage', value: 5 }, { type: 'percentage', value: 2 }, ], commissionDeductions: { afterMaxPayout: { type: 'fixed', value: 10 }, afterMaxEarning: { type: 'fixed', value: 10 }, afterMaxDirect: { type: 'fixed', value: 5 }, }, autoUpgrade: { enabled: true, toPlanId: 2 }, holdPosition: { enabled: true, slots: [9, 10] }, },
        { id: 2, name: 'Silver Plan', price: 100, durationDays: 60, minWithdraw: 25, description: 'Balanced plan for steady growth.', status: 'Active', directReferralLimit: 20, directCommissions: Array(20).fill({ type: 'fixed', value: 25 }), indirectCommissions: [ { type: 'fixed', value: 10 }, { type: 'fixed', value: 5 }, { type: 'fixed', value: 2 }, ], commissionDeductions: { afterMaxPayout: { type: 'percentage', value: 5 }, afterMaxEarning: { type: 'percentage', value: 5 }, afterMaxDirect: { type: 'percentage', value: 2 }, }, autoUpgrade: { enabled: true, toPlanId: 3 }, holdPosition: { enabled: false, slots: [] }, },
        { id: 3, name: 'Gold Plan', price: 200, durationDays: 0, minWithdraw: 100, description: 'Premium plan for maximum returns. Never expires.', status: 'Active', directReferralLimit: 0, directCommissions: [{ type: 'percentage', value: 15 }], indirectCommissions: [ { type: 'percentage', value: 7 }, { type: 'percentage', value: 3 }, { type: 'percentage', value: 1 }, { type: 'percentage', value: 0.5 }, ], commissionDeductions: { afterMaxPayout: { type: 'fixed', value: 0 }, afterMaxEarning: { type: 'fixed', value: 0 }, afterMaxDirect: { type: 'fixed', value: 0 }, }, autoUpgrade: { enabled: false }, holdPosition: { enabled: false, slots: [] }, },
        { id: 4, name: 'Starter (Old)', price: 25, durationDays: 15, minWithdraw: 5, description: 'This plan is no longer available.', status: 'Disabled', directReferralLimit: 5, directCommissions: Array(5).fill({ type: 'fixed', value: 5 }), indirectCommissions: [], commissionDeductions: { afterMaxPayout: { type: 'fixed', value: 0 }, afterMaxEarning: { type: 'fixed', value: 0 }, afterMaxDirect: { type: 'fixed', value: 0 }, }, autoUpgrade: { enabled: false }, holdPosition: { enabled: false, slots: [] }, },
    ],
    transfers: [
        { id: 'TRF4001', senderId: 1, senderName: 'john.doe', recipientId: 2, recipientName: 'jane.smith', amount: 25, status: 'Pending', date: '2023-10-28' },
        { id: 'TRF4002', senderId: 2, senderName: 'jane.smith', recipientId: 4, recipientName: 'chris.green', amount: 50, status: 'Approved', date: '2023-10-27', adminNotes: 'Approved' },
    ],
    transactions: [
        { id: 'TRN3001', userId: 1, userName: 'john.doe', type: 'Deposit', amount: 250, date: '2023-10-26', description: 'Approved Deposit #DEP1002', status: 'Approved' },
        { id: 'TRN3002', userId: 2, userName: 'jane.smith', type: 'Withdrawal Request', amount: -100, date: '2023-10-27', description: 'Pending Withdrawal #WDR2002', status: 'Pending' },
        { id: 'TRN3003', userId: 1, userName: 'john.doe', type: 'Commission', amount: 20, date: '2023-10-26', description: 'From jane.smith', level: 1, status: 'Approved' },
        { id: 'TRN3005', userId: 1, userName: 'john.doe', type: 'Commission', amount: 1, date: '2023-10-25', description: 'From sam.wilson', level: 2, status: 'Approved' },
        { id: 'TRN3004', userId: 4, userName: 'chris.green', type: 'Manual Debit', amount: -20, date: '2023-10-25', description: 'Correction for incorrect bonus.', status: 'Approved' },
        { id: 'TRN3006', userId: 1, userName: 'john.doe', type: 'Transfer Request', amount: -25, date: '2023-10-28', description: 'Transfer to jane.smith #TRF4001', status: 'Pending' },
        { id: 'TRN3007', userId: 2, userName: 'jane.smith', type: 'Transfer Sent', amount: -50, date: '2023-10-27', description: 'Transfer to chris.green #TRF4002', status: 'Approved' },
        { id: 'TRN3008', userId: 4, userName: 'chris.green', type: 'Transfer Received', amount: 50, date: '2023-10-27', description: 'From jane.smith #TRF4002', status: 'Approved' },
        { id: 'TRN3009', userId: 1, userName: 'john.doe', type: 'Withdrawal Request', amount: -50, date: '2023-10-26', description: 'Withdrawal #WDR2001', status: 'Approved' },
        { id: 'TRN_PENDING_COMM', userId: 1, userName: 'john.doe', type: 'Commission', amount: 37.5, date: '2023-10-27', description: 'From jane.smith (Deposit #DEP1001)', level: 1, status: 'Pending' },
    ],
    rules: [
        { id: 1, fromPlan: 'Bronze Plan', toPlan: 'Silver Plan', requiredEarnings: 500 },
        { id: 2, fromPlan: 'Silver Plan', toPlan: 'Gold Plan', requiredEarnings: 2000 },
    ],
    notifications: [
        { id: 1, userId: 1, message: "Your withdrawal request #WDR2001 for $50.00 has been paid.", date: "2023-10-26", read: true },
        { id: 2, userId: 1, message: "You have received a Level 1 commission of $20.00 from jane.smith.", date: "2023-10-26", read: true },
        { id: 3, userId: 1, message: "Your transfer request to jane.smith for $25.00 is pending.", date: "2023-10-28", read: false },
        { id: 4, userId: 2, message: "Your deposit #DEP1004 for $50.00 has been approved.", date: "2023-10-24", read: false },
    ],
    settings: {
        isUserTransferEnabled: true,
        restrictWithdrawalAmount: false,
        defaultCurrencySymbol: '$',
        siteWideMinWithdrawal: 10,
    },
};

// Create a new file-based database
const db = await JSONFilePreset('server/db.json', defaultData);

export default db;
