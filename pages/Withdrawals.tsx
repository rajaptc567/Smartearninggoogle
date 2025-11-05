import React, { useState, useEffect } from 'react';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Status, Withdrawal } from '../types';
import { useData } from '../hooks/useData';
import Modal from '../components/ui/Modal';

const Withdrawals: React.FC = () => {
  const { state, actions } = useData();
  const { withdrawals, settings } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<Withdrawal['status']>(Status.Pending);

  useEffect(() => {
    if (selectedWithdrawal) {
      setAdminNotes(selectedWithdrawal.adminNotes || '');
      setCurrentStatus(selectedWithdrawal.status);
    }
  }, [selectedWithdrawal]);

  const handleRowClick = (w: Withdrawal) => {
    setSelectedWithdrawal(w);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedWithdrawal(null);
  };

  const handleSaveChanges = async () => {
    if (selectedWithdrawal) {
      const updatedWithdrawal = {
        ...selectedWithdrawal,
        status: currentStatus,
        adminNotes: adminNotes,
      };
      await actions.updateWithdrawal(updatedWithdrawal);
      handleCloseModal();
    }
  };


  const tableHeaders = ['User', 'Amount', 'Final Amount', 'Method', 'Status', 'Match Rem.', 'Date'];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Withdrawal Requests</h2>
      <Table headers={tableHeaders}>
        {withdrawals.map((w: Withdrawal) => (
          <tr 
            key={w.id} 
            className="text-gray-700 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
            onClick={() => handleRowClick(w)}
          >
            <td className="px-4 py-3">{w.userName}</td>
            <td className="px-4 py-3">{settings.defaultCurrencySymbol}{w.amount.toFixed(2)}</td>
            <td className="px-4 py-3 font-semibold">{settings.defaultCurrencySymbol}{w.finalAmount.toFixed(2)}</td>
            <td className="px-4 py-3">{w.method}</td>
            <td className="px-4 py-3"><Badge status={w.status} /></td>
            <td className="px-4 py-3 text-sm">
                {w.status === Status.Matching ? `${settings.defaultCurrencySymbol}${w.matchRemainingAmount?.toFixed(2)}` : 'N/A'}
            </td>
            <td className="px-4 py-3 text-sm">{w.date}</td>
          </tr>
        ))}
      </Table>
      
      {selectedWithdrawal && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
           <div className="p-2 sm:p-4 text-gray-800 dark:text-gray-200">
              <h3 className="text-xl font-bold mb-4">Withdrawal Details - <span className="text-blue-600 dark:text-blue-400">{selectedWithdrawal.id}</span></h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div><span className="font-semibold">User:</span> {selectedWithdrawal.userName} (ID: {selectedWithdrawal.userId})</div>
                  <div><span className="font-semibold">Amount:</span> {settings.defaultCurrencySymbol}{selectedWithdrawal.amount.toFixed(2)}</div>
                  <div><span className="font-semibold">Method:</span> {selectedWithdrawal.method}</div>
                  <div><span className="font-semibold">Date:</span> {selectedWithdrawal.date}</div>
              </div>

              <div className="mt-4 border-t pt-4 dark:border-gray-700">
                <h4 className="font-semibold mb-2">User Payment Details:</h4>
                <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Account Title:</span> {selectedWithdrawal.accountTitle}</p>
                    <p><span className="font-semibold">Account Number:</span> {selectedWithdrawal.accountNumber}</p>
                </div>
              </div>
              
              {selectedWithdrawal.userNotes && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold mb-2">User Notes:</h4>
                    <p className="text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">{selectedWithdrawal.userNotes}</p>
                </div>
              )}


              <div className="mt-6">
                  <label htmlFor="status" className="block text-sm font-semibold mb-2">Status</label>
                  <select 
                      id="status" 
                      value={currentStatus} 
                      onChange={(e) => setCurrentStatus(e.target.value as Withdrawal['status'])}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                      <option value={Status.Pending}>Pending</option>
                      <option value={Status.Matching}>Matching (P2P)</option>
                      <option value={Status.Approved}>Approved</option>
                      <option value={Status.Paid}>Paid</option>
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

              <div className="mt-8 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
                  <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                  <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
              </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Withdrawals;