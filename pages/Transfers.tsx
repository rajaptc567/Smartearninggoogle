import React, { useState, useEffect } from 'react';
import { Transfer, Status } from '../types';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useData } from '../hooks/useData';

const Transfers: React.FC = () => {
    const { state, actions } = useData();
    const { transfers } = state;

    const tableHeaders = ['Sender', 'Recipient', 'Amount', 'Status', 'Date'];
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [currentStatus, setCurrentStatus] = useState<Transfer['status']>(Status.Pending);

    useEffect(() => {
        if (selectedTransfer) {
            setAdminNotes(selectedTransfer.adminNotes || '');
            setCurrentStatus(selectedTransfer.status);
        }
    }, [selectedTransfer]);

    const handleSaveChanges = async () => {
        if (selectedTransfer) {
            const updatedTransfer = {
                ...selectedTransfer,
                status: currentStatus,
                adminNotes: adminNotes,
            };
            await actions.updateTransfer(updatedTransfer);
            handleCloseDetailModal();
        }
    };
    
    const handleRowClick = (transfer: Transfer) => {
        setSelectedTransfer(transfer);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTransfer(null);
        setAdminNotes('');
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">User to User Transfers</h2>
            <Table headers={tableHeaders}>
                {transfers.map((transfer: Transfer) => (
                    <tr 
                      key={transfer.id} 
                      className="text-gray-700 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                      onClick={() => handleRowClick(transfer)}
                    >
                        <td className="px-4 py-3">{transfer.senderName}</td>
                        <td className="px-4 py-3">{transfer.recipientName}</td>
                        <td className="px-4 py-3">${transfer.amount.toFixed(2)}</td>
                        <td className="px-4 py-3"><Badge status={transfer.status} /></td>
                        <td className="px-4 py-3 text-sm">{transfer.date}</td>
                    </tr>
                ))}
            </Table>

            {selectedTransfer && (
                 <Modal isOpen={isDetailModalOpen} onClose={handleCloseDetailModal}>
                    <div className="p-2 sm:p-4 text-gray-800 dark:text-gray-200">
                        <h3 className="text-xl font-bold mb-4">Transfer Details - <span className="text-blue-600 dark:text-blue-400">{selectedTransfer.id}</span></h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                            <div><span className="font-semibold">From:</span> {selectedTransfer.senderName} (ID: {selectedTransfer.senderId})</div>
                            <div><span className="font-semibold">To:</span> {selectedTransfer.recipientName} (ID: {selectedTransfer.recipientId})</div>
                            <div><span className="font-semibold">Amount:</span> ${selectedTransfer.amount.toFixed(2)}</div>
                            <div><span className="font-semibold">Date:</span> {selectedTransfer.date}</div>
                        </div>

                         <div className="mt-6">
                            <label htmlFor="status" className="block text-sm font-semibold mb-2">Status</label>
                            <select 
                                id="status" 
                                value={currentStatus} 
                                onChange={(e) => setCurrentStatus(e.target.value as Transfer['status'])}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                disabled={selectedTransfer.status !== Status.Pending}
                            >
                                <option value={Status.Pending}>Pending</option>
                                <option value={Status.Approved}>Approved</option>
                                <option value={Status.Rejected}>Rejected</option>
                            </select>
                            {selectedTransfer.status !== Status.Pending && <p className="text-xs text-yellow-500 mt-1">This transfer has already been processed and cannot be changed.</p>}
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

                        <div className="mt-8 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
                            <Button variant="secondary" onClick={handleCloseDetailModal}>Cancel</Button>
                            <Button variant="primary" onClick={handleSaveChanges} disabled={selectedTransfer.status !== Status.Pending}>Save Changes</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Transfers;