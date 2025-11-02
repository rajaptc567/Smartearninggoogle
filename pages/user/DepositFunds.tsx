import React, { useState, useMemo, useEffect } from 'react';
import { Deposit, PaymentMethod, Status, Withdrawal } from '../../types';
import Button from '../../components/ui/Button';
import { useData } from '../../hooks/useData';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const DepositFunds: React.FC = () => {
    const { state, dispatch } = useData();
    const { paymentMethods, currentUser, withdrawals, settings } = state;

    const [selectedMethodId, setSelectedMethodId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [userNotes, setUserNotes] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [matchedWithdrawal, setMatchedWithdrawal] = useState<Withdrawal | null>(null);

    const depositMethods = useMemo(() =>
        paymentMethods.filter(method => method.type === 'Deposit' && method.status === 'Enabled'),
        [paymentMethods]
    );

    const selectedMethod: PaymentMethod | undefined = useMemo(() =>
        depositMethods.find(method => method.id.toString() === selectedMethodId),
        [selectedMethodId, depositMethods]
    );

    useEffect(() => {
      const numericAmount = parseFloat(amount);
      if (selectedMethod && !isNaN(numericAmount) && numericAmount > 0) {
        // Find the oldest matching withdrawal
        const match = withdrawals
          .filter(w => 
            w.status === Status.Matching && 
            w.method === selectedMethod.name && 
            (w.matchRemainingAmount || 0) >= numericAmount
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        
        setMatchedWithdrawal(match || null);
      } else {
        // FIX: The `match` variable is not in scope here. Set to null when conditions aren't met.
        setMatchedWithdrawal(null);
      }
    }, [amount, selectedMethod, withdrawals]);

    const paymentDetails = useMemo(() => {
        if (matchedWithdrawal && selectedMethod) {
            return {
                ...selectedMethod,
                name: selectedMethod.name,
                accountTitle: matchedWithdrawal.accountTitle,
                accountNumber: matchedWithdrawal.accountNumber,
                instructions: `This is a P2P payment. Send funds directly to the user account shown. Your deposit will be approved once the user confirms receipt.`,
            };
        }
        return selectedMethod;
    }, [selectedMethod, matchedWithdrawal]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMethod || !amount || !transactionId || !receipt || !currentUser) {
            alert('Please fill all fields and upload a receipt.');
            return;
        }
        
        const receiptUrl = await fileToBase64(receipt);

        const newDeposit: Deposit = {
            id: `DEP${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.username,
            method: selectedMethod.name,
            amount: parseFloat(amount),
            transactionId: transactionId,
            receiptUrl: receiptUrl,
            status: Status.Pending,
            date: new Date().toISOString().split('T')[0],
            userNotes: userNotes,
            matchedWithdrawalId: matchedWithdrawal ? matchedWithdrawal.id : undefined,
        };

        dispatch({ type: 'ADD_DEPOSIT', payload: newDeposit });
        
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                 <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full h-16 w-16 flex items-center justify-center">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mt-4 text-gray-800 dark:text-white">Deposit Submitted!</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Your deposit request has been received and is now pending admin approval.</p>
                <Button onClick={() => window.location.reload()} className="mt-6">Make Another Deposit</Button>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-1">Deposit Funds</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Follow the steps below to add funds to your wallet.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="depositMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Select Deposit Method</label>
                    <select
                        id="depositMethod"
                        value={selectedMethodId}
                        onChange={(e) => setSelectedMethodId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                    >
                        <option value="">-- Choose a method --</option>
                        {depositMethods.map(method => (
                            <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                    </select>
                </div>

                {selectedMethod && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ease-in-out">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">2. Send Payment To:</h3>
                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <p><span className="font-medium text-gray-700 dark:text-gray-200">Method:</span> {paymentDetails?.name}</p>
                                <p><span className="font-medium text-gray-700 dark:text-gray-200">Account Title:</span> {paymentDetails?.accountTitle}</p>
                                <p><span className="font-medium text-gray-700 dark:text-gray-200">Account Number:</span> {paymentDetails?.accountNumber}</p>
                                <div className="pt-2">
                                    <p className="font-medium text-gray-700 dark:text-gray-200">Instructions:</p>
                                    <p className="text-xs italic">{paymentDetails?.instructions}</p>
                                </div>
                            </div>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">Limits: {settings.defaultCurrencySymbol}{selectedMethod.minAmount} - {settings.defaultCurrencySymbol}{selectedMethod.maxAmount}</p>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">3. Enter Amount</label>
                                <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min ${selectedMethod.minAmount}, Max ${selectedMethod.maxAmount}`} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div>
                                <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">4. Payment Reference / Transaction ID</label>
                                <input type="text" id="transactionId" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                            </div>
                            <div>
                                <label htmlFor="userNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">5. Notes (Optional)</label>
                                <textarea id="userNotes" value={userNotes} onChange={(e) => setUserNotes(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600" placeholder="Add any extra details for the admin..."></textarea>
                            </div>
                             <div>
                                <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">6. Upload Receipt / Screenshot</label>
                                <input type="file" id="receipt" onChange={(e) => e.target.files && setReceipt(e.target.files[0])} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900" required />
                                {receipt && <p className="text-xs text-gray-500 mt-1">{receipt.name}</p>}
                            </div>
                        </div>
                    </div>
                )}
                 {selectedMethod && (
                    <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                        <Button type="submit">Submit Deposit Request</Button>
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


export default DepositFunds;