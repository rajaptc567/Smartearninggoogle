import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { nanoid } from 'nanoid';
import db from './db.js';

const app = express();
const PORT = 3001;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Support larger request bodies for image uploads

// --- Helper Functions ---
const createNotification = (userId, message) => {
    const newNotification = {
        id: nanoid(),
        userId,
        message,
        date: new Date().toISOString().split('T')[0],
        read: false,
    };
    db.data.notifications.unshift(newNotification);
};


// --- API Read Routes (GET) ---
app.get('/', (req, res) => {
  res.send('SmartEarning Backend Server is running with a persistent DB!');
});

// Generic GET endpoint for all collections
const collections = ['users', 'deposits', 'withdrawals', 'paymentMethods', 'investmentPlans', 'transfers', 'transactions', 'rules', 'notifications', 'settings'];
collections.forEach(collection => {
    app.get(`/api/${collection.toLowerCase()}`, (req, res) => {
        // For settings, return the object, not an array
        if (collection === 'settings') {
            return res.json(db.data.settings);
        }
        res.json(db.data[collection] || []);
    });
});


// --- API Write Routes (POST, PUT, DELETE) ---

// USERS
app.post('/api/users', async (req, res) => {
    const newUser = { id: db.data.users.length + 1, ...req.body };
    db.data.users.push(newUser);
    if(newUser.sponsor) {
        const sponsor = db.data.users.find(u => u.username === newUser.sponsor);
        if (sponsor) {
            createNotification(sponsor.id, `Congratulations! You have a new direct referral: ${newUser.fullName} (@${newUser.username}).`);
        }
    }
    await db.write();
    res.status(201).json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = db.data.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).send('User not found');

    db.data.users[userIndex] = { ...db.data.users[userIndex], ...req.body };
    await db.write();
    res.json(db.data.users[userIndex]);
});

app.put('/api/users/:id/toggle-status', async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = db.data.users.find(u => u.id === userId);
    if (!user) return res.status(404).send('User not found');

    user.status = user.status === 'Active' ? 'Blocked' : 'Active';
    await db.write();
    res.json(user);
});

// DEPOSITS
app.post('/api/deposits', async (req, res) => {
    const newDeposit = { id: `DEP-${nanoid(8)}`, ...req.body };
    db.data.deposits.unshift(newDeposit);
    
    createNotification(newDeposit.userId, `Your deposit request #${newDeposit.id} for ${db.data.settings.defaultCurrencySymbol}${newDeposit.amount.toFixed(2)} is pending.`);

    // Note: Commission logic is now handled on approval (PUT request)
    await db.write();
    res.status(201).json(newDeposit);
});

app.put('/api/deposits/:id', async (req, res) => {
    const { id } = req.params;
    const updatedDepositData = req.body;
    const depositIndex = db.data.deposits.findIndex(d => d.id === id);

    if (depositIndex === -1) return res.status(404).send('Deposit not found');
    
    const originalDeposit = { ...db.data.deposits[depositIndex] };
    const finalDeposit = { ...originalDeposit, ...updatedDepositData };
    db.data.deposits[depositIndex] = finalDeposit;

    // --- Complex Business Logic on Status Change ---
    if (originalDeposit.status !== 'Approved' && finalDeposit.status === 'Approved') {
        // 1. Update user balance
        const user = db.data.users.find(u => u.id === finalDeposit.userId);
        if (user) user.walletBalance += finalDeposit.amount;

        // 2. Create transaction record
        db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId: finalDeposit.userId, userName: finalDeposit.userName, type: 'Deposit', amount: finalDeposit.amount, date: new Date().toISOString().split('T')[0], description: `Approved Deposit #${finalDeposit.id}`, status: 'Approved' });

        // 3. Handle P2P Match
        if (finalDeposit.matchedWithdrawalId) {
            const withdrawal = db.data.withdrawals.find(w => w.id === finalDeposit.matchedWithdrawalId);
            if (withdrawal) {
                withdrawal.matchRemainingAmount = Math.max(0, (withdrawal.matchRemainingAmount || 0) - finalDeposit.amount);
                if (withdrawal.matchRemainingAmount === 0) {
                    withdrawal.status = 'Paid';
                    createNotification(withdrawal.userId, `Your P2P withdrawal #${withdrawal.id} has been fully paid.`);
                }
            }
        } else {
            // 4. Calculate & Add Pending Commissions
            const depositor = db.data.users.find(u => u.id === finalDeposit.userId);
            let currentSponsorUsername = depositor?.sponsor;
            let level = 1;

            while (currentSponsorUsername && level <= 10) {
                const sponsor = db.data.users.find(u => u.username === currentSponsorUsername);
                if (!sponsor) break;

                const sponsorActivePlans = db.data.investmentPlans.filter(p => sponsor.activePlans.includes(p.name));
                const sponsorPlan = sponsorActivePlans.reduce((highest, p) => p.price > (highest.price || 0) ? p : highest, {price:0});
                
                if (!sponsorPlan || !sponsorPlan.id) break;

                let commissionConfig;
                if (level === 1) {
                    const directReferralCount = db.data.users.filter(u => u.sponsor === sponsor.username).length;
                    const slotIndex = directReferralCount - 1;
                    commissionConfig = sponsorPlan.directCommissions?.[slotIndex];
                } else {
                    commissionConfig = sponsorPlan.indirectCommissions?.[level - 2];
                }

                if (commissionConfig && commissionConfig.value > 0) {
                    const commissionValue = commissionConfig.type === 'percentage' ? (finalDeposit.amount * commissionConfig.value) / 100 : commissionConfig.value;
                    
                    const isHeldPosition = sponsorPlan.holdPosition?.enabled && sponsorPlan.holdPosition.slots.includes(db.data.users.filter(u => u.sponsor === sponsor.username).length);
                    
                    if (isHeldPosition) {
                        sponsor.heldBalance += commissionValue;
                        createNotification(sponsor.id, `A commission of ${db.data.settings.defaultCurrencySymbol}${commissionValue.toFixed(2)} was held for upgrade.`);
                    } else {
                        sponsor.walletBalance += commissionValue;
                        createNotification(sponsor.id, `You received a commission of ${db.data.settings.defaultCurrencySymbol}${commissionValue.toFixed(2)} from ${depositor.username}.`);
                    }

                    db.data.transactions.unshift({
                        id: `TRN-${nanoid(8)}`, userId: sponsor.id, userName: sponsor.username, 
                        type: isHeldPosition ? 'Held Commission' : 'Commission', amount: commissionValue, date: new Date().toISOString().split('T')[0],
                        description: `From ${depositor.username} (Deposit #${finalDeposit.id})`, level, status: 'Approved'
                    });
                }
                currentSponsorUsername = sponsor.sponsor;
                level++;
            }
        }
    } else if (originalDeposit.status === 'Approved' && finalDeposit.status !== 'Approved') {
        // Revert balance if changed from Approved to something else
        const user = db.data.users.find(u => u.id === finalDeposit.userId);
        if (user) user.walletBalance -= finalDeposit.amount;
        // Note: Reverting commissions is complex and often handled manually or with credit/debit.
    }

    createNotification(finalDeposit.userId, `Your deposit #${finalDeposit.id} has been updated to ${finalDeposit.status}.`);

    await db.write();
    res.json(finalDeposit);
});


// WITHDRAWALS
app.post('/api/withdrawals', async (req, res) => {
    const newWithdrawal = { id: `WDR-${nanoid(8)}`, ...req.body };
    const user = db.data.users.find(u => u.id === newWithdrawal.userId);
    if (!user || user.walletBalance < newWithdrawal.amount) {
        return res.status(400).send('Insufficient balance');
    }
    user.walletBalance -= newWithdrawal.amount;
    db.data.withdrawals.unshift(newWithdrawal);
    db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId: newWithdrawal.userId, userName: newWithdrawal.userName, type: 'Withdrawal Request', amount: -newWithdrawal.amount, date: new Date().toISOString().split('T')[0], description: `Pending Withdrawal #${newWithdrawal.id}`, status: 'Pending' });
    createNotification(newWithdrawal.userId, `Your withdrawal request for ${db.data.settings.defaultCurrencySymbol}${newWithdrawal.amount.toFixed(2)} is pending.`);
    await db.write();
    res.status(201).json(newWithdrawal);
});

app.put('/api/withdrawals/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const withdrawalIndex = db.data.withdrawals.findIndex(w => w.id === id);
    if (withdrawalIndex === -1) return res.status(404).send('Withdrawal not found');

    const original = db.data.withdrawals[withdrawalIndex];
    const final = { ...original, ...updatedData };

    if (original.status !== 'Rejected' && final.status === 'Rejected') {
        const user = db.data.users.find(u => u.id === final.userId);
        if (user) user.walletBalance += final.amount; // Refund amount
        db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId: final.userId, userName: final.userName, type: 'Withdrawal Refund', amount: final.amount, date: new Date().toISOString().split('T')[0], description: `Refund for Rejected Withdrawal #${final.id}`, status: 'Approved' });
    }
    
    if (final.status === 'Matching' && original.status !== 'Matching') {
        final.matchRemainingAmount = final.finalAmount;
    }

    db.data.withdrawals[withdrawalIndex] = final;
    createNotification(final.userId, `Your withdrawal #${final.id} has been updated to ${final.status}.`);
    await db.write();
    res.json(final);
});

// TRANSFERS
app.post('/api/transfers', async (req, res) => {
    const newTransfer = { id: `TRF-${nanoid(8)}`, status: 'Pending', date: new Date().toISOString().split('T')[0], ...req.body };
    const sender = db.data.users.find(u => u.id === newTransfer.senderId);
    if (!sender || sender.walletBalance < newTransfer.amount) {
        return res.status(400).send('Insufficient balance');
    }
    sender.walletBalance -= newTransfer.amount;
    db.data.transfers.unshift(newTransfer);
    db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId: sender.id, userName: sender.username, type: 'Transfer Request', amount: -newTransfer.amount, date: newTransfer.date, description: `Transfer to ${newTransfer.recipientName} #${newTransfer.id}`, status: 'Pending' });
    createNotification(sender.id, `Your transfer request to ${newTransfer.recipientName} is pending.`);
    await db.write();
    res.status(201).json(newTransfer);
});

app.put('/api/transfers/:id', async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const transferIndex = db.data.transfers.findIndex(t => t.id === id);
    if (transferIndex === -1) return res.status(404).send('Transfer not found');

    const original = db.data.transfers[transferIndex];
    const final = { ...original, ...updatedData };

    if (original.status === 'Pending' && final.status === 'Approved') {
        const recipient = db.data.users.find(u => u.id === final.recipientId);
        if (recipient) recipient.walletBalance += final.amount;
        db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId: recipient.id, userName: recipient.username, type: 'Transfer Received', amount: final.amount, date: new Date().toISOString().split('T')[0], description: `From ${final.senderName} #${final.id}`, status: 'Approved' });
        createNotification(recipient.id, `You received ${db.data.settings.defaultCurrencySymbol}${final.amount.toFixed(2)} from ${final.senderName}.`);
        createNotification(final.senderId, `Your transfer to ${final.recipientName} was approved.`);
    } else if (original.status === 'Pending' && final.status === 'Rejected') {
        const sender = db.data.users.find(u => u.id === final.senderId);
        if (sender) sender.walletBalance += final.amount; // Refund
        createNotification(sender.id, `Your transfer to ${final.recipientName} was rejected.`);
    }

    db.data.transfers[transferIndex] = final;
    await db.write();
    res.json(final);
});

// PAYMENT METHODS
app.post('/api/payment-methods', async (req, res) => {
    const newMethod = { id: db.data.paymentMethods.length + 1, ...req.body };
    db.data.paymentMethods.unshift(newMethod);
    await db.write();
    res.status(201).json(newMethod);
});
app.put('/api/payment-methods/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.data.paymentMethods.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('Method not found');
    db.data.paymentMethods[index] = { ...db.data.paymentMethods[index], ...req.body };
    await db.write();
    res.json(db.data.paymentMethods[index]);
});
app.delete('/api/payment-methods/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.paymentMethods = db.data.paymentMethods.filter(p => p.id !== id);
    await db.write();
    res.status(204).send();
});

// INVESTMENT PLANS
app.post('/api/investment-plans', async (req, res) => {
    const newPlan = { id: db.data.investmentPlans.length + 1, ...req.body };
    db.data.investmentPlans.unshift(newPlan);
    await db.write();
    res.status(201).json(newPlan);
});
app.put('/api/investment-plans/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const index = db.data.investmentPlans.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).send('Plan not found');
    db.data.investmentPlans[index] = { ...db.data.investmentPlans[index], ...req.body };
    await db.write();
    res.json(db.data.investmentPlans[index]);
});
app.delete('/api/investment-plans/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.investmentPlans = db.data.investmentPlans.filter(p => p.id !== id);
    await db.write();
    res.status(204).send();
});

// PLAN PURCHASE
app.post('/api/users/:userId/purchase-plan', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { planId } = req.body;
    const user = db.data.users.find(u => u.id === userId);
    const plan = db.data.investmentPlans.find(p => p.id === planId);
    if (!user || !plan) return res.status(404).send('User or Plan not found');
    if (user.walletBalance < plan.price) return res.status(400).send('Insufficient funds');

    user.walletBalance -= plan.price;
    user.activePlans = [...new Set([...user.activePlans, plan.name])];
    db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId, userName: user.username, type: 'Plan Purchase', amount: -plan.price, date: new Date().toISOString().split('T')[0], description: `Purchased ${plan.name}`, status: 'Approved' });
    createNotification(userId, `You purchased the ${plan.name} plan.`);
    await db.write();
    res.json(user);
});


// RULES
app.post('/api/rules', async (req, res) => {
    const newRule = { id: db.data.rules.length + 1, ...req.body };
    db.data.rules.unshift(newRule);
    await db.write();
    res.status(201).json(newRule);
});
app.delete('/api/rules/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    db.data.rules = db.data.rules.filter(r => r.id !== id);
    await db.write();
    res.status(204).send();
});

// SETTINGS
app.put('/api/settings', async (req, res) => {
    db.data.settings = { ...db.data.settings, ...req.body };
    await db.write();
    res.json(db.data.settings);
});

// WALLET ADJUSTMENT
app.post('/api/wallet/adjust', async (req, res) => {
    const { userId, amount, description } = req.body;
    const user = db.data.users.find(u => u.id === userId);
    if (!user) return res.status(404).send('User not found');
    user.walletBalance += amount;
    db.data.transactions.unshift({ id: `TRN-${nanoid(8)}`, userId, userName: user.username, type: amount > 0 ? 'Manual Credit' : 'Manual Debit', amount, date: new Date().toISOString().split('T')[0], description, status: 'Approved' });
    createNotification(userId, `Admin adjusted your wallet by ${db.data.settings.defaultCurrencySymbol}${amount.toFixed(2)}.`);
    await db.write();
    res.json(user);
});

// NOTIFICATIONS
app.put('/api/notifications/read/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    db.data.notifications.forEach(n => {
        if (n.userId === userId) {
            n.read = true;
        }
    });
    await db.write();
    res.status(204).send();
});


// --- Server Startup ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
