import React, { useState, useMemo, useEffect } from 'react';
import { InvestmentPlan, Status, CommissionType, Commission } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import Modal from '../components/ui/Modal';

const InvestmentPlans: React.FC = () => {
    const { state, dispatch } = useData();
    const { investmentPlans, settings } = state;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);

    const handleOpenModal = (plan: InvestmentPlan | null = null) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingPlan(null);
        setIsModalOpen(false);
    };

    const handleSave = (plan: InvestmentPlan) => {
        if (editingPlan) {
            dispatch({ type: 'UPDATE_INVESTMENT_PLAN', payload: plan });
        } else {
            const newPlan = { ...plan, id: Date.now() };
            dispatch({ type: 'ADD_INVESTMENT_PLAN', payload: newPlan });
        }
        handleCloseModal();
    };

    const handleDelete = (planId: number) => {
        if (window.confirm('Are you sure you want to delete this plan? This action is irreversible.')) {
            dispatch({ type: 'DELETE_INVESTMENT_PLAN', payload: planId });
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Investment Plans</h2>
                <Button onClick={() => handleOpenModal()}>Add New Plan</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investmentPlans.map(plan => (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                            <Badge status={plan.status} />
                        </div>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 my-2">{settings.defaultCurrencySymbol}{plan.price}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 h-10">{plan.description}</p>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 border-t pt-4 dark:border-gray-700 flex-grow">
                            <p><strong>Direct Referrals:</strong> {plan.directReferralLimit === 0 ? 'Unlimited' : plan.directReferralLimit}</p>
                            <p><strong>Indirect Levels:</strong> {plan.indirectCommissions.length}</p>
                            <p><strong>Min. Withdraw:</strong> {settings.defaultCurrencySymbol}{plan.minWithdraw}</p>
                            <p><strong>Duration:</strong> {plan.durationDays === 0 ? 'Unlimited' : `${plan.durationDays} days`}</p>
                            <p><strong>Auto Upgrade:</strong> {plan.autoUpgrade.enabled ? `Yes (to Plan ID ${plan.autoUpgrade.toPlanId})` : 'No'}</p>
                            <p><strong>Hold Position:</strong> {plan.holdPosition.enabled ? `Yes (Slots: ${plan.holdPosition.slots.join(', ')})` : 'No'}</p>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <Button size="sm" variant="secondary" onClick={() => handleOpenModal(plan)}>Edit</Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(plan.id)}>Delete</Button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <PlanFormModal
                    plan={editingPlan}
                    onClose={handleCloseModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

// PlanFormModal Component
interface PlanFormModalProps {
    plan: InvestmentPlan | null;
    onClose: () => void;
    onSave: (plan: InvestmentPlan) => void;
}

const defaultCommission: Commission = { type: 'percentage', value: 10 };

const PlanFormModal: React.FC<PlanFormModalProps> = ({ plan, onClose, onSave }) => {
    const { state } = useData();

    const emptyPlan: Omit<InvestmentPlan, 'id'> = {
        name: '', price: 0, durationDays: 30, minWithdraw: 10, description: '', status: Status.Active,
        directReferralLimit: 10, directCommissions: Array(10).fill(defaultCommission),
        indirectCommissions: [{ type: 'percentage', value: 5 }, { type: 'percentage', value: 2 }],
        commissionDeductions: { afterMaxPayout: {type:'fixed', value: 0}, afterMaxEarning: {type:'fixed', value: 0}, afterMaxDirect: {type:'fixed', value: 0}},
        autoUpgrade: { enabled: false },
        holdPosition: { enabled: false, slots: [] }
    };

    const [formData, setFormData] = useState<Omit<InvestmentPlan, 'id'>>(plan || emptyPlan);
    const [holdSlots, setHoldSlots] = useState(plan?.holdPosition.slots.join(', ') || '');

    useEffect(() => {
      const limit = Number(formData.directReferralLimit);
      if (limit > 0) {
        const currentCommissions = formData.directCommissions;
        if (currentCommissions.length !== limit) {
          const newCommissions = Array.from({ length: limit }, (_, i) => currentCommissions[i] || defaultCommission);
          setFormData(prev => ({...prev, directCommissions: newCommissions}));
        }
      }
    }, [formData.directReferralLimit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

        const keys = name.split('.');
        if (keys.length > 1) {
            setFormData(prev => {
                const newState = { ...prev };
                let current: any = newState;
                for (let i = 0; i < keys.length - 1; i++) {
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = isCheckbox ? checked : value;
                return newState;
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : value }));
        }
    };
    
    const handleCommissionChange = (index: number, field: 'type' | 'value', value: string | number) => {
        const newCommissions = [...formData.directCommissions];
        newCommissions[index] = { ...newCommissions[index], [field]: value };
        setFormData(prev => ({ ...prev, directCommissions: newCommissions }));
    };
    
    const handleIndirectCommissionChange = (index: number, field: 'type' | 'value', value: string | number) => {
        const newCommissions = [...formData.indirectCommissions];
        newCommissions[index] = { ...newCommissions[index], [field]: value };
        setFormData(prev => ({ ...prev, indirectCommissions: newCommissions }));
    };

    const addIndirectLevel = () => {
        setFormData(prev => ({ ...prev, indirectCommissions: [...prev.indirectCommissions, defaultCommission] }));
    }
    
    const removeIndirectLevel = (index: number) => {
        setFormData(prev => ({ ...prev, indirectCommissions: prev.indirectCommissions.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPlan = {
            ...formData,
            price: parseFloat(String(formData.price)),
            directReferralLimit: parseInt(String(formData.directReferralLimit)),
            holdPosition: {
                ...formData.holdPosition,
                slots: holdSlots.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0)
            }
        };
        onSave(finalPlan as InvestmentPlan);
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold">{plan ? 'Edit Investment Plan' : 'Add New Plan'}</h2>
                
                {/* Basic Details */}
                <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
                    <legend className="px-2 font-semibold text-sm">Basic Details</legend>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Plan Name" required className="dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                    <input name="price" type="number" value={formData.price} onChange={handleChange} placeholder="Price" required className="dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                    <input name="durationDays" type="number" value={formData.durationDays} onChange={handleChange} placeholder="Duration (days, 0=unlimited)" required className="dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                    <input name="minWithdraw" type="number" value={formData.minWithdraw} onChange={handleChange} placeholder="Min Withdraw" required className="dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="md:col-span-2 dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                     <select name="status" value={formData.status} onChange={handleChange} className="dark:bg-gray-700 dark:border-gray-600 rounded-md">
                        <option value={Status.Active}>Active</option>
                        <option value={Status.Disabled}>Disabled</option>
                    </select>
                </fieldset>
                
                {/* Direct Commissions */}
                <fieldset className="border p-4 rounded-md">
                     <legend className="px-2 font-semibold text-sm">Direct Commissions</legend>
                     <div className="mb-4">
                         <label className="block text-sm">Direct Referral Limit (0 for unlimited)</label>
                         <input name="directReferralLimit" type="number" value={formData.directReferralLimit} onChange={handleChange} className="dark:bg-gray-700 dark:border-gray-600 rounded-md" />
                     </div>
                     {formData.directReferralLimit > 0 && <div className="space-y-2 max-h-60 overflow-y-auto">
                        {formData.directCommissions.map((comm, index) => (
                           <div key={index} className="grid grid-cols-3 gap-2 items-center">
                               <label className="text-sm font-medium">Slot #{index + 1}</label>
                               <input type="number" value={comm.value} onChange={(e) => handleCommissionChange(index, 'value', e.target.value)} placeholder="Value" className="dark:bg-gray-700 dark:border-gray-600 rounded-md"/>
                               <select value={comm.type} onChange={(e) => handleCommissionChange(index, 'type', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                   <option value="percentage">%</option>
                                   <option value="fixed">Fixed ({state.settings.defaultCurrencySymbol})</option>
                               </select>
                           </div>
                        ))}
                     </div>}
                </fieldset>

                 {/* Indirect Commissions */}
                <fieldset className="border p-4 rounded-md">
                     <legend className="px-2 font-semibold text-sm">Indirect Commissions</legend>
                     <div className="space-y-2">
                        {formData.indirectCommissions.map((comm, index) => (
                             <div key={index} className="grid grid-cols-4 gap-2 items-center">
                               <label className="text-sm font-medium">Level {index + 2}</label>
                               <input type="number" value={comm.value} onChange={(e) => handleIndirectCommissionChange(index, 'value', e.target.value)} placeholder="Value" className="dark:bg-gray-700 dark:border-gray-600 rounded-md"/>
                               <select value={comm.type} onChange={(e) => handleIndirectCommissionChange(index, 'type', e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                   <option value="percentage">%</option>
                                   <option value="fixed">Fixed ({state.settings.defaultCurrencySymbol})</option>
                               </select>
                               <Button type="button" size="sm" variant="danger" onClick={() => removeIndirectLevel(index)}>Remove</Button>
                           </div>
                        ))}
                     </div>
                     <Button type="button" size="sm" variant="secondary" onClick={addIndirectLevel} className="mt-4">Add Indirect Level</Button>
                </fieldset>

                {/* Advanced Settings */}
                <fieldset className="border p-4 rounded-md space-y-4">
                     <legend className="px-2 font-semibold text-sm">Advanced Settings</legend>
                     <div>
                         <label className="flex items-center space-x-2">
                             <input type="checkbox" name="autoUpgrade.enabled" checked={formData.autoUpgrade.enabled} onChange={handleChange} />
                             <span>Enable Auto Upgrade</span>
                         </label>
                         {formData.autoUpgrade.enabled && (
                             <select name="autoUpgrade.toPlanId" value={formData.autoUpgrade.toPlanId || ''} onChange={handleChange} className="mt-2 w-full dark:bg-gray-700 dark:border-gray-600 rounded-md">
                                 <option value="">Select plan to upgrade to</option>
                                 {state.investmentPlans.filter(p => p.id !== plan?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </select>
                         )}
                     </div>
                     <div>
                         <label className="flex items-center space-x-2">
                             <input type="checkbox" name="holdPosition.enabled" checked={formData.holdPosition.enabled} onChange={handleChange} />
                             <span>Enable Hold Position</span>
                         </label>
                         {formData.holdPosition.enabled && (
                             <div className="mt-2">
                                <label className="block text-sm">Referral slots to hold (comma-separated)</label>
                                <input type="text" value={holdSlots} onChange={(e) => setHoldSlots(e.target.value)} placeholder="e.g., 5, 6, 10" className="w-full dark:bg-gray-700 dark:border-gray-600 rounded-md"/>
                             </div>
                         )}
                     </div>
                </fieldset>


                <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Plan</Button>
                </div>
            </form>
        </Modal>
    );
};

export default InvestmentPlans;