import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import { useData } from '../../hooks/useData';
import { Transfer } from '../../types';

const TransferFunds: React.FC = () => {
    const { state, actions } = useData();
    const { currentUser, users } = state;
    
    const [recipientIdentifier, setRecipientIdentifier] = useState('');
    const [amount, setAmount] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        
        if (!currentUser) {
            alert('Error: Current user not found. Please log in again.');
            return;
        }
        if (!recipientIdentifier || isNaN(numericAmount) || numericAmount <= 0) {
            alert('Validation Error: Please enter a valid recipient and a positive amount.');
            return;
        }

        const recipient = users.find(u =>
            u.id.toString() === recipientIdentifier ||
            u.username.toLowerCase() === recipientIdentifier.toLowerCase() ||
            u.email.toLowerCase() === recipientIdentifier.toLowerCase()
        );

        if (!recipient) {
            alert('Validation Error: Recipient user not found. Please check the ID, username, or email.');
            return;
        }
        if (recipient.id === currentUser.id) {
            alert('Validation Error: You cannot transfer funds to yourself.');
            return;
        }

        if (numericAmount > currentUser.walletBalance) {
            alert(`Validation Error: Transfer amount ($${numericAmount.toFixed(2)}) cannot exceed your wallet balance ($${currentUser.walletBalance.toFixed(2)}).`);
            return;
        }
        
        const newTransfer: Partial<Transfer> = {
            senderId: currentUser.id,
            senderName: currentUser.username,
            recipientId: recipient.id,
            recipientName: recipient.username,
            amount: numericAmount,
        };
        
        await actions.addTransfer(newTransfer);

        setIsSubmitted(true);
        // Reset form after submission
        setRecipientIdentifier('');
        setAmount('');
    };

    if (!currentUser) return <div>Loading...</div>;

    if (isSubmitted) {
        return (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                 <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full h-16 w-16 flex items-center justify-center">
                    <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">Transfer Request Submitted!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Your request has been sent and is now pending admin approval.</p>
                <Button onClick={() => setIsSubmitted(false)} className="mt-6">Make Another Transfer</Button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="text-center mb-6 border-b dark:border-gray-700 pb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Wallet Balance</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">${currentUser.walletBalance.toFixed(2)}</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Transfer Funds to Another User</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient (ID, Username, or Email)</label>
                    <input
                        type="text"
                        id="recipient"
                        value={recipientIdentifier}
                        onChange={(e) => setRecipientIdentifier(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount to Transfer</label>
                    <input
                        type="number"
                        id="amount"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    />
                </div>
                <div className="pt-4 flex justify-end">
                    <Button type="submit">Submit Transfer Request</Button>
                </div>
            </form>
        </div>
    );
}

export default TransferFunds;