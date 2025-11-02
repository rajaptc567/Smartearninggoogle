import React, { useState, useEffect } from 'react';
import { Deposit, Status } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useData } from '../hooks/useData';

const Deposits: React.FC = () => {
    const { state, dispatch } = useData();
    const { deposits, settings } = state;

    const tableHeaders = ['User', 'Amount', 'Method', 'Transaction ID', 'Receipt', 'Status', 'Date'];
    
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState<Deposit['status']>(Status.Pending);

    useEffect(() => {
        if (selectedDeposit) {
            setAdminNotes(selectedDeposit.adminNotes || '');
            setCurrentStatus(selectedDeposit.status);
        }
    }, [selectedDeposit]);

    const handleSaveChanges = () => {
        if (selectedDeposit) {
            const updatedDeposit = {
                ...selectedDeposit,
                status: currentStatus,
                adminNotes: adminNotes,
            };
            dispatch({ type: 'UPDATE_DEPOSIT', payload: updatedDeposit });
            handleCloseDetailModal();
        }
    };

    const handleViewReceipt = (e: React.MouseEvent, receiptUrl: string) => {
        e.stopPropagation(); 
        setSelectedReceipt(receiptUrl);
        setIsImageModalOpen(true);
    };
    
    const handleRowClick = (deposit: Deposit) => {
        setSelectedDeposit(deposit);
        setIsDetailModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedReceipt(null);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedDeposit(null);
        setAdminNotes('');
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Deposit Requests</h2>
            <Table headers={tableHeaders}>
                {deposits.map((deposit: Deposit) => (
                    <tr 
                      key={deposit.id} 
                      className="text-gray-700 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      onClick={() => handleRowClick(deposit)}
                    >
                        <td className="px-4 py-3">{deposit.userName}</td>
                        <td className="px-4 py-3">{settings.defaultCurrencySymbol}{deposit.amount.toFixed(2)}</td>
                        <td className="px-4 py-3">{deposit.method}</td>
                        <td className="px-4 py-3 text-xs font-mono">{deposit.transactionId}</td>
                        <td className="px-4 py-3">
                            {deposit.receiptUrl ? (
                                <button onClick={(e) => handleViewReceipt(e, deposit.receiptUrl!)} className="focus:outline-none rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    <img src={deposit.receiptUrl} alt="Receipt thumbnail" className="h-10 w-16 object-cover rounded-md cursor-pointer hover:opacity-75 transition-opacity" />
                                </button>
                            ) : (
                                'N/A'
                            )}
                        </td>
                        <td className="px-4 py-3"><Badge status={deposit.status} /></td>
                        <td className="px-4 py-3 text-sm">{deposit.date}</td>
                    </tr>
                ))}
            </Table>

            <Modal isOpen={isImageModalOpen} onClose={handleCloseImageModal}>
                {selectedReceipt && (
                    <img src={selectedReceipt} alt="Full-size receipt" className="rounded-md" />
                )}
            </Modal>

            {selectedDeposit && (
                 <Modal isOpen={isDetailModalOpen} onClose={handleCloseDetailModal}>
                    <div className="p-2 sm:p-4 text-gray-800 dark:text-gray-200">
                        <h3 className="text-xl font-bold mb-4">Deposit Details - <span className="text-blue-600 dark:text-blue-400">{selectedDeposit.id}</span></h3>
                        
                        {selectedDeposit.matchedWithdrawalId && (
                            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm">
                                This deposit was automatically matched to fulfill withdrawal request <strong>#{selectedDeposit.matchedWithdrawalId}</strong>. Approving this will pay that user.
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div><span className="font-semibold">User:</span> {selectedDeposit.userName} (ID: {selectedDeposit.userId})</div>
                            <div><span className="font-semibold">Amount:</span> {settings.defaultCurrencySymbol}{selectedDeposit.amount.toFixed(2)}</div>
                            <div><span className="font-semibold">Method:</span> {selectedDeposit.method}</div>
                            <div><span className="font-semibold">Date:</span> {selectedDeposit.date}</div>
                            <div className="md:col-span-2"><span className="font-semibold">Transaction ID:</span> <span className="font-mono">{selectedDeposit.transactionId}</span></div>
                        </div>

                         {selectedDeposit.userNotes && (
                             <div className="mt-6">
                                <h4 className="font-semibold mb-2">User Notes:</h4>
                                <p className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">{selectedDeposit.userNotes}</p>
                            </div>
                         )}

                         <div className="mt-6">
                            <label htmlFor="status" className="block text-sm font-semibold mb-2">Status</label>
                            <select 
                                id="status" 
                                value={currentStatus} 
                                onChange={(e) => setCurrentStatus(e.target.value as Deposit['status'])}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value={Status.Pending}>Pending</option>
                                <option value={Status.Approved}>Approved</option>
                                <option value={Status.Rejected}>Rejected</option>
                            </select>
                        </div>

                         <div className="mt-6">
                            <label htmlFor="adminNotes" className="block text-sm font-semibold mb-2">Admin Notes</label>
                            <textarea
                                id="adminNotes"
                                rows={3}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add remarks for this transaction..."
                            />
                        </div>

                        {selectedDeposit.receiptUrl && (
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2">Receipt</h4>
                                <img src={selectedDeposit.receiptUrl} alt="Deposit receipt" className="rounded-lg w-full max-w-lg mx-auto shadow-md" />
                            </div>
                        )}

                        <div className="mt-8 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
                            <Button variant="secondary" onClick={handleCloseDetailModal}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Deposits;