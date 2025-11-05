import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import 'dotenv/config';
import { nanoid } from 'nanoid';
import {
    connectDB,
    User, Deposit, Withdrawal, PaymentMethod,
    InvestmentPlan, Transfer, Transaction, Rule,
    Settings, Notification
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// --- Helper Functions ---
const createNotification = async (userId, message) => {
    await Notification.create({
        userId,
        message,
        date: new Date().toISOString().split('T')[0],
        read: false,
    });
};

// --- API Read Routes (GET) ---
app.get('/', (req, res) => {
    res.send('SmartEarning Backend Server is running with MongoDB!');
});

app.get('/api/users', async (req, res) => res.json(await User.find({})));
app.get('/api/deposits', async (req, res) => res.json(await Deposit.find({}).sort({ date: -1 })));
app.get('/api/withdrawals', async (req, res) => res.json(await Withdrawal.find({}).sort({ date: -1 })));
app.get('/api/transfers', async (req, res) => res.json(await Transfer.find({}).sort({ date: -1 })));
app.get('/api/paymentmethods', async (req, res) => res.json(await PaymentMethod.find({})));
app.get('/api/investmentplans', async (req, res) => res.json(await InvestmentPlan.find({})));
app.get('/api/transactions', async (req, res) => res.json(await Transaction.find({}).sort({ date: -1 })));
app.get('/api/rules', async (req, res) => res.json(await Rule.find({})));
app.get('/api/notifications', async (req, res) => res.json(await Notification.find({}).sort({ _id: -1 })));
app.get('/api/settings', async (req, res) => res.json(await Settings.findOne({ singletonId: 'main_settings' })));


// --- API Write Routes (POST, PUT, DELETE) ---

// USERS
app.post('/api/users', async (req, res) => {
    const newUser = new User(req.body);
    await newUser.save();
    if (newUser.sponsor) {
        const sponsor = await User.findOne({ username: newUser.sponsor });
        if (sponsor) {
            await createNotification(sponsor._id, `Congratulations! You have a new direct referral: ${newUser.fullName} (@${newUser.username}).`);
        }
    }
    res.status(201).json(newUser);
});

app.put('/api/users/:id', async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).send('User not found');
    res.json(user);
});

app.put('/api/users/:id/toggle-status', async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    user.status = user.status === 'Active' ? 'Blocked' : 'Active';
    await user.save();
    res.json(user);
});

// DEPOSITS
app.post('/api/deposits', async (req, res) => {
    const newDeposit = new Deposit({ ...req.body, depositId: `DEP-${nanoid(8)}` });
    await newDeposit.save();
    const settings = await Settings.findOne({ singletonId: 'main_settings' });
    await createNotification(newDeposit.userId, `Your deposit request #${newDeposit.depositId} for ${settings.defaultCurrencySymbol}${newDeposit.amount.toFixed(2)} is pending.`);
    res.status(201).json(newDeposit);
});

app.put('/api/deposits/:id', async (req, res) => {
    const depositId = req.params.id; // This is the depositId like 'DEP-...'
    const updatedDepositData = req.body;
    
    const originalDeposit = await Deposit.findOne({ depositId });
    if (!originalDeposit) return res.status(404).send('Deposit not found');
    
    // Update the deposit
    const finalDeposit = await Deposit.findOneAndUpdate({ depositId }, updatedDepositData, { new: true });
    
    if (originalDeposit.status !== 'Approved' && finalDeposit.status === 'Approved') {
        const settings = await Settings.findOne({ singletonId: 'main_settings' });
        // 1. Update user balance
        const user = await User.findByIdAndUpdate(finalDeposit.userId, { $inc: { walletBalance: finalDeposit.amount } });

        // 2. Create transaction record
        await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId: finalDeposit.userId, userName: finalDeposit.userName, type: 'Deposit', amount: finalDeposit.amount, description: `Approved Deposit #${finalDeposit.depositId}`, status: 'Approved' });

        // 3. Handle P2P Match
        if (finalDeposit.matchedWithdrawalId) {
            const withdrawal = await Withdrawal.findOne({ withdrawalId: finalDeposit.matchedWithdrawalId });
            if (withdrawal) {
                withdrawal.matchRemainingAmount = Math.max(0, (withdrawal.matchRemainingAmount || 0) - finalDeposit.amount);
                if (withdrawal.matchRemainingAmount === 0) {
                    withdrawal.status = 'Paid';
                    await createNotification(withdrawal.userId, `Your P2P withdrawal #${withdrawal.withdrawalId} has been fully paid.`);
                }
                await withdrawal.save();
            }
        } else {
             // 4. Calculate & Add Pending Commissions
            const depositor = await User.findById(finalDeposit.userId);
            let currentSponsorUsername = depositor?.sponsor;
            let level = 1;

            while (currentSponsorUsername) {
                const sponsor = await User.findOne({ username: currentSponsorUsername });
                if (!sponsor) break;

                const sponsorActivePlans = await InvestmentPlan.find({ name: { $in: sponsor.activePlans } });
                const sponsorPlan = sponsorActivePlans.reduce((highest, p) => p.price > (highest.price || 0) ? p : highest, {price:0});
                
                if (!sponsorPlan || !sponsorPlan.name) break;

                let commissionConfig;
                if (level === 1) {
                    const directReferralCount = await User.countDocuments({ sponsor: sponsor.username });
                    const slotIndex = directReferralCount - 1;
                    commissionConfig = sponsorPlan.directCommissions?.[slotIndex];
                } else {
                    commissionConfig = sponsorPlan.indirectCommissions?.[level - 2];
                }

                if (commissionConfig && commissionConfig.value > 0) {
                    const commissionValue = commissionConfig.type === 'percentage' ? (finalDeposit.amount * commissionConfig.value) / 100 : commissionConfig.value;
                    
                    const isHeldPosition = sponsorPlan.holdPosition?.enabled && sponsorPlan.holdPosition.slots.includes(await User.countDocuments({ sponsor: sponsor.username }));
                    
                    if (isHeldPosition) {
                        sponsor.heldBalance += commissionValue;
                        await createNotification(sponsor._id, `A commission of ${settings.defaultCurrencySymbol}${commissionValue.toFixed(2)} was held for upgrade.`);
                    } else {
                        sponsor.walletBalance += commissionValue;
                        await createNotification(sponsor._id, `You received a commission of ${settings.defaultCurrencySymbol}${commissionValue.toFixed(2)} from ${depositor.username}.`);
                    }
                    await sponsor.save();

                    await Transaction.create({
                        transactionId: `TRN-${nanoid(8)}`, userId: sponsor._id, userName: sponsor.username, 
                        type: isHeldPosition ? 'Held Commission' : 'Commission', amount: commissionValue,
                        description: `From ${depositor.username} (Deposit #${finalDeposit.depositId})`, level, status: 'Approved'
                    });
                }
                currentSponsorUsername = sponsor.sponsor;
                level++;
            }
        }
    } else if (originalDeposit.status === 'Approved' && finalDeposit.status !== 'Approved') {
        await User.findByIdAndUpdate(finalDeposit.userId, { $inc: { walletBalance: -finalDeposit.amount } });
    }

    await createNotification(finalDeposit.userId, `Your deposit #${finalDeposit.depositId} has been updated to ${finalDeposit.status}.`);
    res.json(finalDeposit);
});


// WITHDRAWALS
app.post('/api/withdrawals', async (req, res) => {
    const newWithdrawalData = { ...req.body, withdrawalId: `WDR-${nanoid(8)}` };
    const user = await User.findById(newWithdrawalData.userId);
    if (!user || user.walletBalance < newWithdrawalData.amount) {
        return res.status(400).send('Insufficient balance');
    }
    user.walletBalance -= newWithdrawalData.amount;
    await user.save();
    
    const newWithdrawal = new Withdrawal(newWithdrawalData);
    await newWithdrawal.save();

    await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId: newWithdrawal.userId, userName: newWithdrawal.userName, type: 'Withdrawal Request', amount: -newWithdrawal.amount, description: `Pending Withdrawal #${newWithdrawal.withdrawalId}`, status: 'Pending' });
    const settings = await Settings.findOne({ singletonId: 'main_settings' });
    await createNotification(newWithdrawal.userId, `Your withdrawal request for ${settings.defaultCurrencySymbol}${newWithdrawal.amount.toFixed(2)} is pending.`);
    res.status(201).json(newWithdrawal);
});

app.put('/api/withdrawals/:id', async (req, res) => {
    const withdrawalId = req.params.id; // e.g. WDR-xxxx
    const updatedData = req.body;
    
    const original = await Withdrawal.findOne({ withdrawalId });
    if (!original) return res.status(404).send('Withdrawal not found');

    if (original.status !== 'Rejected' && updatedData.status === 'Rejected') {
        await User.findByIdAndUpdate(original.userId, { $inc: { walletBalance: original.amount } });
        await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId: original.userId, userName: original.userName, type: 'Withdrawal Refund', amount: original.amount, description: `Refund for Rejected Withdrawal #${original.withdrawalId}`, status: 'Approved' });
    }

    if (updatedData.status === 'Matching' && original.status !== 'Matching') {
        updatedData.matchRemainingAmount = original.finalAmount;
    }

    const final = await Withdrawal.findOneAndUpdate({ withdrawalId }, updatedData, { new: true });
    await createNotification(final.userId, `Your withdrawal #${final.withdrawalId} has been updated to ${final.status}.`);
    res.json(final);
});

// TRANSFERS
app.post('/api/transfers', async (req, res) => {
    const newTransferData = { ...req.body, transferId: `TRF-${nanoid(8)}`, status: 'Pending', date: new Date().toISOString().split('T')[0] };
    const sender = await User.findById(newTransferData.senderId);
    if (!sender || sender.walletBalance < newTransferData.amount) {
        return res.status(400).send('Insufficient balance');
    }
    sender.walletBalance -= newTransferData.amount;
    await sender.save();
    
    const newTransfer = new Transfer(newTransferData);
    await newTransfer.save();

    await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId: sender._id, userName: sender.username, type: 'Transfer Request', amount: -newTransfer.amount, date: newTransfer.date, description: `Transfer to ${newTransfer.recipientName} #${newTransfer.transferId}`, status: 'Pending' });
    await createNotification(sender._id, `Your transfer request to ${newTransfer.recipientName} is pending.`);
    res.status(201).json(newTransfer);
});

app.put('/api/transfers/:id', async (req, res) => {
    const transferId = req.params.id;
    const updatedData = req.body;
    
    const original = await Transfer.findOne({ transferId });
    if (!original) return res.status(404).send('Transfer not found');

    if (original.status === 'Pending' && updatedData.status === 'Approved') {
        const recipient = await User.findByIdAndUpdate(original.recipientId, { $inc: { walletBalance: original.amount } });
        await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId: recipient._id, userName: recipient.username, type: 'Transfer Received', amount: original.amount, description: `From ${original.senderName} #${original.transferId}`, status: 'Approved' });
        const settings = await Settings.findOne({ singletonId: 'main_settings' });
        await createNotification(recipient._id, `You received ${settings.defaultCurrencySymbol}${original.amount.toFixed(2)} from ${original.senderName}.`);
        await createNotification(original.senderId, `Your transfer to ${original.recipientName} was approved.`);
    } else if (original.status === 'Pending' && updatedData.status === 'Rejected') {
        await User.findByIdAndUpdate(original.senderId, { $inc: { walletBalance: original.amount } });
        await createNotification(original.senderId, `Your transfer to ${original.recipientName} was rejected.`);
    }
    
    const final = await Transfer.findOneAndUpdate({transferId}, updatedData, { new: true });
    res.json(final);
});


// PAYMENT METHODS
app.post('/api/payment-methods', async (req, res) => res.status(201).json(await PaymentMethod.create(req.body)));
app.put('/api/payment-methods/:id', async (req, res) => res.json(await PaymentMethod.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/payment-methods/:id', async (req, res) => { await PaymentMethod.findByIdAndDelete(req.params.id); res.status(204).send(); });

// INVESTMENT PLANS
app.post('/api/investment-plans', async (req, res) => res.status(201).json(await InvestmentPlan.create(req.body)));
app.put('/api/investment-plans/:id', async (req, res) => res.json(await InvestmentPlan.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/investment-plans/:id', async (req, res) => { await InvestmentPlan.findByIdAndDelete(req.params.id); res.status(204).send(); });

// PLAN PURCHASE
app.post('/api/users/:userId/purchase-plan', async (req, res) => {
    const { userId } = req.params;
    const { planId } = req.body;
    const user = await User.findById(userId);
    const plan = await InvestmentPlan.findById(planId);
    if (!user || !plan) return res.status(404).send('User or Plan not found');
    if (user.walletBalance < plan.price) return res.status(400).send('Insufficient funds');

    user.walletBalance -= plan.price;
    user.activePlans = [...new Set([...user.activePlans, plan.name])];
    await user.save();
    
    await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId, userName: user.username, type: 'Plan Purchase', amount: -plan.price, description: `Purchased ${plan.name}`, status: 'Approved' });
    await createNotification(userId, `You purchased the ${plan.name} plan.`);
    res.json(user);
});

// RULES
app.post('/api/rules', async (req, res) => res.status(201).json(await Rule.create(req.body)));
app.delete('/api/rules/:id', async (req, res) => { await Rule.findByIdAndDelete(req.params.id); res.status(204).send(); });

// SETTINGS
app.put('/api/settings', async (req, res) => {
    const settings = await Settings.findOneAndUpdate({ singletonId: 'main_settings' }, req.body, { new: true, upsert: true });
    res.json(settings);
});

// WALLET ADJUSTMENT
app.post('/api/wallet/adjust', async (req, res) => {
    const { userId, amount, description } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }, { new: true });
    if (!user) return res.status(404).send('User not found');
    await Transaction.create({ transactionId: `TRN-${nanoid(8)}`, userId, userName: user.username, type: amount > 0 ? 'Manual Credit' : 'Manual Debit', amount, description, status: 'Approved' });
    const settings = await Settings.findOne({ singletonId: 'main_settings' });
    await createNotification(userId, `Admin adjusted your wallet by ${settings.defaultCurrencySymbol}${amount.toFixed(2)}.`);
    res.json(user);
});

// NOTIFICATIONS
app.put('/api/notifications/read/:userId', async (req, res) => {
    await Notification.updateMany({ userId: req.params.userId, read: false }, { $set: { read: true } });
    res.status(204).send();
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
