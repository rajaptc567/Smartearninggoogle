import React, { useState, useMemo, useEffect } from 'react';
import { PaymentMethod, Status } from '../../types';
import Button from '../../components/ui/Button';
import { useData } from '../../hooks/useData';

const WithdrawFunds: React.FC = () => {
    const { state, dispatch } = useData();
    // FIX: Destructure restrictWithdrawalAmount from the nested settings object.
    const { currentUser, paymentMethods, investmentPlans, settings: { restrictWithdrawalAmount } } = state;

    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [accountTitle, setAccountTitle] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [userNotes, setUserNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const withdrawalMethods = useMemo(() =>
        paymentMethods.filter(method => method.type === 'Withdrawal' && method.status === 'Enabled'),
        [paymentMethods]
    );
    
    const activePlanPrices = useMemo(() => 
        [...new Set(investmentPlans.filter(p => p.status === Status.Active).map(p => p.price))]
        .sort((a,b) => a - b), 
    [investmentPlans]);

    const selectedMethod: PaymentMethod | undefined = useMemo(() =>
        withdrawalMethods.find(method => method.id.toString() === selectedMethodId),
        [selectedMethodId, withdrawalMethods]
    );

    const [fee, setFee] = useState(0);
    const [finalAmount, setFinalAmount] = useState(0);

    useEffect(() => {
        const numericAmount = parseFloat(amount);
        if (selectedMethod && !isNaN(numericAmount) && numericAmount > 0) {
            const calculatedFee = (numericAmount * selectedMethod.feePercent) / 100;
            setFee(calculatedFee);
            setFinalAmount(numericAmount - calculatedFee);
        } else {
            setFee(0);
            setFinalAmount(0);
        }
    }, [amount, selectedMethod]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);

        if (!currentUser) return alert('User not found.');
        if (!selectedMethod || isNaN(numericAmount) || !accountTitle || !accountNumber) {
            return alert('Please fill all required fields.');
        }
        if (numericAmount > currentUser.walletBalance) {
            return alert("Withdrawal amount cannot exceed your wallet balance.");
        }
        if (numericAmount < selectedMethod.minAmount || numericAmount > selectedMethod.maxAmount) {
            return alert(`Amount must be between $${selectedMethod.minAmount} and $${selectedMethod.maxAmount}.`);
        }

        const newWithdrawal = {
            id: `WDR${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.username,
            method: selectedMethod.name,
            amount: numericAmount,
            fee: fee,
            finalAmount: finalAmount,
            status: Status.Pending as Status.Pending,
            date: new Date().toISOString().split('T')[0],
            accountTitle: accountTitle,
            accountNumber: accountNumber,
            userNotes: userNotes,
        };
        
        dispatch({ type: 'ADD_WITHDRAWAL', payload: newWithdrawal });
        
        setIsSubmitted(true);
    };

    if (!currentUser) return <div>Loading...</div>;

    if (isSubmitted) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                 <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full h-16 w-16 flex items-center justify-center">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">Withdrawal Request Submitted!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Your request has been received and is now pending admin approval.</p>
                <Button onClick={() => window.location.reload()} className="mt-6">Make Another Withdrawal</Button>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="text-center mb-6 border-b dark:border-gray-700 pb-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Wallet Balance</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">${currentUser.walletBalance.toFixed(2)}</p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Request Withdrawal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="withdrawMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Withdrawal Method</label>
                    <select id="withdrawMethod" value={selectedMethodId} onChange={(e) => setSelectedMethodId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
                        <option value="">-- Choose a method --</option>
                        {withdrawalMethods.map(method => (
                            <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                    </select>
                </div>

                {selectedMethod && (
                    <div className="space-y-4 transition-all duration-500 ease-in-out">
                         <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount to Withdraw</label>
                            {restrictWithdrawalAmount ? (
                                <select id="amount" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" required>
                                    <option value="">-- Select amount --</option>
                                    {activePlanPrices.map(price => <option key={price} value={price}>${price.toFixed(2)}</option>)}
                                </select>
                            ) : (
                                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${selectedMethod.minAmount}, Max ${selectedMethod.maxAmount}`} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" required />
                            )}
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-300">Service Fee ({selectedMethod.feePercent}%):</span>
                                <span className="font-medium text-red-600 dark:text-red-400">-${fee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1 font-bold">
                                <span className="text-gray-800 dark:text-white">You Will Receive:</span>
                                <span className="text-green-600 dark:text-green-400">${finalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="accountTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Account Title</label>
                            <input type="text" id="accountTitle" value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} placeholder="e.g., John Doe" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" required />
                        </div>

                        <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Your Account Number / Wallet Address</label>
                            <input type="text" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" required />
                        </div>

                         <div>
                            <label htmlFor="userNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes / Instructions (Optional)</label>
                            <textarea id="userNotes" value={userNotes} onChange={(e) => setUserNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Add any special instructions for the admin..."></textarea>
                        </div>
                    </div>
                )}
                 {selectedMethod && (
                    <div className="pt-4 flex justify-end">
                        <Button type="submit">Submit Withdrawal Request</Button>
                    </div>
                 )}
            </form>
        </div>
    );
};

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


export default WithdrawFunds;