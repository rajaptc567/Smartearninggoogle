import React, { useState } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import { PaymentMethod } from '../types';
import Modal from '../components/ui/Modal';

const PaymentMethods: React.FC = () => {
    const { state, dispatch } = useData();
    const { paymentMethods, settings } = state;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

    const handleOpenModal = (method: PaymentMethod | null = null) => {
        setEditingMethod(method);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingMethod(null);
        setIsModalOpen(false);
    };

    const handleSave = (method: PaymentMethod) => {
        if (editingMethod) {
            dispatch({ type: 'UPDATE_PAYMENT_METHOD', payload: method });
        } else {
            const newMethod = { ...method, id: Date.now() };
            dispatch({ type: 'ADD_PAYMENT_METHOD', payload: newMethod });
        }
        handleCloseModal();
    };
    
    const handleDelete = (methodId: number) => {
        if (window.confirm('Are you sure you want to delete this method? This action cannot be undone.')) {
            dispatch({ type: 'DELETE_PAYMENT_METHOD', payload: methodId });
            alert('Payment method deleted successfully.');
        }
    };

    return (
        <div>
          <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Payment Methods</h2>
                <Button onClick={() => handleOpenModal()}>Add New Method</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentMethods.map(method => (
                    <div key={method.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{method.name}</h3>
                                <p className={`text-sm font-medium ${method.type === 'Deposit' ? 'text-green-500' : 'text-blue-500'}`}>{method.type}</p>
                            </div>
                            <Badge status={method.status as 'Enabled' | 'Disabled'} />
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p><span className="font-semibold">Account:</span> {method.accountTitle} ({method.accountNumber})</p>
                            <p><span className="font-semibold">Limits:</span> {settings.defaultCurrencySymbol}{method.minAmount} - {settings.defaultCurrencySymbol}{method.maxAmount}</p>
                            <p><span className="font-semibold">Fee:</span> {method.feePercent}%</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                           <Button size="sm" variant="secondary" onClick={() => handleOpenModal(method)}>Edit</Button>
                           <Button size="sm" variant="danger" onClick={() => handleDelete(method.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <PaymentMethodFormModal
                    method={editingMethod}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

// Form Modal Component
interface PaymentMethodFormModalProps {
    method: PaymentMethod | null;
    onClose: () => void;
    onSave: (method: PaymentMethod) => void;
}

const PaymentMethodFormModal: React.FC<PaymentMethodFormModalProps> = ({ method, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<PaymentMethod>>(
        method || { name: '', type: 'Deposit', status: 'Enabled', minAmount: 0, maxAmount: 1000, feePercent: 0 }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numValue = ['minAmount', 'maxAmount', 'feePercent'].includes(name) ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as PaymentMethod);
    };
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                 <h2 className="text-xl font-bold">{method ? 'Edit Payment Method' : 'Add New Method'}</h2>
                 {/* Form fields here */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Method Name" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="Deposit">Deposit</option>
                        <option value="Withdrawal">Withdrawal</option>
                    </select>
                    <input name="accountTitle" value={formData.accountTitle || ''} onChange={handleChange} placeholder="Account Title" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <input name="accountNumber" value={formData.accountNumber || ''} onChange={handleChange} placeholder="Account Number" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="number" name="minAmount" value={formData.minAmount || ''} onChange={handleChange} placeholder="Min Amount" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    <input type="number" name="maxAmount" value={formData.maxAmount || ''} onChange={handleChange} placeholder="Max Amount" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                     <input type="number" name="feePercent" value={formData.feePercent || ''} onChange={handleChange} placeholder="Fee %" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                     <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <option value="Enabled">Enabled</option>
                        <option value="Disabled">Disabled</option>
                    </select>
                    <textarea name="instructions" value={formData.instructions || ''} onChange={handleChange} placeholder="Instructions" className="md:col-span-2 w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                 </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Method</Button>
                </div>
            </form>
        </Modal>
    )
};

export default PaymentMethods;