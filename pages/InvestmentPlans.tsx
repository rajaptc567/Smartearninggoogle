import React, { useState, useMemo } from 'react';
import { InvestmentPlan, Status, CommissionType, Commission } from '../types';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import Modal from '../components/ui/Modal';

const InvestmentPlans: React.FC = () => {
    const { state, dispatch } = useData();
    const { investmentPlans } = state;
    
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
        if (window.confirm('Are you sure you want to delete this plan?')) {
            dispatch({ type: 'DELETE_INVESTMENT_PLAN', payload: planId });
        }
    };

    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Investment Plans</h2>
                <Button onClick={() => handleOpenModal()}>Create New Plan</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investmentPlans.map((plan: InvestmentPlan) => (
                    <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                           <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                           <Badge status={plan.status} />
                        </div>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">${plan.price}</p>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">
                            <li><span className="font-semibold">Duration:</span> {plan.durationDays === 0 ? 'Unlimited' : `${plan.durationDays} Days`}</li>
                            <li><span className="font-semibold">Min. Withdraw:</span> ${plan.minWithdraw}</li>
                            <li><span className="font-semibold">Direct Referrals:</span> {plan.directReferralLimit === 0 ? 'Unlimited' : `Up to ${plan.directReferralLimit}`}</li>
                            <li>
                                <span className="font-semibold">Direct Commission: </span> 
                                {plan.directCommission.type === 'percentage' ? `${plan.directCommission.value}%` : `$${plan.directCommission.value}`}
                            </li>
                             <li>
                                <span className="font-semibold">Indirect Levels: </span> 
                                {plan.indirectCommissions.length}
                            </li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-4">{plan.description}</p>
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

// Form Modal
interface PlanFormModalProps {
    plan: InvestmentPlan | null;
    onClose: () => void;
    onSave: (plan: InvestmentPlan) => void;
}

const defaultCommission: Commission = { type: 'percentage', value: 0 };
const defaultPlan: Partial<InvestmentPlan> = {
    name: '', price: 0, durationDays: 30, minWithdraw: 10, status: Status.Active,
    description: '',
    directReferralLimit: 0,
    directCommission: { ...defaultCommission },
    indirectCommissions: [],
    commissionDeductions: {
        afterMaxPayout: { ...defaultCommission },
        afterMaxEarning: { ...defaultCommission },
        afterMaxDirect: { ...defaultCommission },
    },
    autoUpgrade: { enabled: false, toPlanId: undefined },
    holdPosition: { enabled: false, slots: [] },
};

const PlanFormModal: React.FC<PlanFormModalProps> = ({ plan, onClose, onSave }) => {
    const { state } = useData();
    const [formData, setFormData] = useState<Partial<InvestmentPlan>>(
        plan || defaultPlan
    );

     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if(name === 'autoUpgrade.enabled') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, autoUpgrade: { ...prev!.autoUpgrade!, enabled: checked }}));
            return;
        }
         if(name === 'holdPosition.enabled') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, holdPosition: { ...prev!.holdPosition!, enabled: checked }}));
            return;
        }

        const numValue = ['price', 'durationDays', 'minWithdraw', 'directReferralLimit'].includes(name) ? parseFloat(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handleCommissionChange = (path: string, field: 'type' | 'value', value: string) => {
        const [main, sub] = path.split('.');
        setFormData(prev => {
            const newFormData = { ...prev };
            const commissionObject = (newFormData as any)[main][sub];
            
            if (field === 'value') {
                commissionObject.value = parseFloat(value) || 0;
            } else {
                commissionObject.type = value as CommissionType;
            }

            return newFormData;
        });
    };

    const handleDirectCommissionChange = (field: 'type' | 'value', value: string) => {
        setFormData(prev => ({
            ...prev,
            directCommission: {
                ...prev!.directCommission!,
                [field]: field === 'value' ? parseFloat(value) || 0 : value as CommissionType
            }
        }));
    };

    // FIX: Refactored to use .map() within the state updater callback.
    // This resolves a TypeScript type inference error where the commission object's type was being incorrectly widened.
    // It also prevents potential bugs from using stale state.
    const handleIndirectCommissionChange = (index: number, field: 'type' | 'value', value: string) => {
        setFormData(prev => {
            if (!prev) return prev;

            const updatedIndirectCommissions = (prev.indirectCommissions || []).map((commission, i) => {
                if (i === index) {
                    if (field === 'type') {
                        return { ...commission, type: value as CommissionType };
                    }
                    return { ...commission, value: parseFloat(value) || 0 };
                }
                return commission;
            });

            return { ...prev, indirectCommissions: updatedIndirectCommissions };
        });
    };

    // FIX: Refactored to use the state updater callback to avoid using stale state.
    const addIndirectLevel = () => {
        setFormData(prev => {
            if (!prev) return prev;
            // FIX: Explicitly type new object to prevent TypeScript from widening the type to `string`, which causes type errors in other handlers.
            const newCommission: Commission = { type: 'percentage', value: 0 };
            const newCommissions = [...(prev.indirectCommissions || []), newCommission];
            return { ...prev, indirectCommissions: newCommissions };
        });
    };

    // FIX: Refactored to use .filter() for immutability and the state updater callback to avoid stale state.
    const removeIndirectLevel = (index: number) => {
        setFormData(prev => {
            if (!prev) return prev;
            const newCommissions = (prev.indirectCommissions || []).filter((_, i) => i !== index);
            return { ...prev, indirectCommissions: newCommissions };
        });
    };

    const handleHoldSlotChange = (slotNumber: number, checked: boolean) => {
        let currentSlots = formData.holdPosition?.slots || [];
        if (checked) {
            currentSlots = [...currentSlots, slotNumber];
        } else {
            currentSlots = currentSlots.filter(s => s !== slotNumber);
        }
        setFormData(prev => ({ ...prev, holdPosition: { ...prev!.holdPosition!, slots: currentSlots } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as InvestmentPlan);
    }

    const CommissionInput: React.FC<{
        label: string; path: string;
        value: Commission;
        onChange: (path: string, field: 'type' | 'value', value: string) => void;
    }> = ({ label, path, value, onChange }) => (
        <div>
            <label className="block text-sm font-medium">{label}</label>
            <div className="flex gap-2 mt-1">
                <select value={value.type} onChange={(e) => onChange(path, 'type', e.target.value)} className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600">
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                </select>
                <input type="number" step="0.01" value={value.value} onChange={(e) => onChange(path, 'value', e.target.value)} placeholder="Value" className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600" />
            </div>
        </div>
    );
    
    return (
        <Modal isOpen={true} onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-h-[85vh] overflow-y-auto">
                <h2 className="text-xl font-bold">{plan ? 'Edit Plan' : 'Create New Plan'}</h2>
                
                {/* Basic Info */}
                <fieldset className="p-4 border rounded-md dark:border-gray-600">
                    <legend className="px-2 font-semibold">Basic Information</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Plan Name" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                        <input type="number" step="0.01" name="price" value={formData.price || ''} onChange={handleChange} placeholder="Price" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600" required/>
                        <input type="number" name="durationDays" value={formData.durationDays || ''} onChange={handleChange} placeholder="Duration (Days, 0=unlimited)" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="number" step="0.01" name="minWithdraw" value={formData.minWithdraw || ''} onChange={handleChange} placeholder="Min Withdraw" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <input type="number" name="directReferralLimit" value={formData.directReferralLimit || ''} onChange={handleChange} placeholder="Direct Referral Limit (0=unlimited)" className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                            <option value={Status.Active}>Active</option>
                            <option value={Status.Disabled}>Disabled</option>
                        </select>
                        <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Description" className="md:col-span-2 w-full rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </fieldset>

                {/* Commissions */}
                <fieldset className="p-4 border rounded-md dark:border-gray-600">
                    <legend className="px-2 font-semibold">Commissions</legend>
                    <div>
                        <label className="block text-sm font-medium">Direct Commission</label>
                        <div className="flex gap-2 mt-1">
                            <select value={formData.directCommission!.type} onChange={(e) => handleDirectCommissionChange('type', e.target.value)} className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="percentage">%</option>
                                <option value="fixed">Fixed</option>
                            </select>
                            <input type="number" step="0.01" value={formData.directCommission!.value} onChange={(e) => handleDirectCommissionChange('value', e.target.value)} placeholder="Value" className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h4 className="text-sm font-medium">Indirect Commissions (Levels)</h4>
                        {formData.indirectCommissions?.map((comm, index) => (
                            <div key={index} className="flex gap-2 items-end mt-2">
                                <span className="text-sm pt-2">Lvl {index+1}:</span>
                                <select value={comm.type} onChange={(e) => handleIndirectCommissionChange(index, 'type', e.target.value)} className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="percentage">%</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                                <input type="number" step="0.01" value={comm.value} onChange={(e) => handleIndirectCommissionChange(index, 'value', e.target.value)} placeholder="Value" className="w-1/2 rounded-md dark:bg-gray-700 dark:border-gray-600" />
                                <Button type="button" variant="danger" size="sm" onClick={() => removeIndirectLevel(index)}>X</Button>
                            </div>
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={addIndirectLevel} className="mt-2">+ Add Level</Button>
                    </div>
                </fieldset>

                {/* Deductions */}
                 <fieldset className="p-4 border rounded-md dark:border-gray-600">
                    <legend className="px-2 font-semibold">Commission Deductions</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <CommissionInput label="After Max Payout" path="commissionDeductions.afterMaxPayout" value={formData.commissionDeductions!.afterMaxPayout} onChange={handleCommissionChange} />
                        <CommissionInput label="After Max Earning" path="commissionDeductions.afterMaxEarning" value={formData.commissionDeductions!.afterMaxEarning} onChange={handleCommissionChange} />
                        <CommissionInput label="After Max Direct" path="commissionDeductions.afterMaxDirect" value={formData.commissionDeductions!.afterMaxDirect} onChange={handleCommissionChange} />
                    </div>
                </fieldset>

                {/* Advanced */}
                 <fieldset className="p-4 border rounded-md dark:border-gray-600">
                    <legend className="px-2 font-semibold">Advanced</legend>
                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center space-x-2"><input type="checkbox" name="autoUpgrade.enabled" checked={formData.autoUpgrade?.enabled} onChange={handleChange} /> <span>Enable Auto Upgrade</span></label>
                            {formData.autoUpgrade?.enabled && (
                                <select name="autoUpgrade.toPlanId" value={formData.autoUpgrade.toPlanId} onChange={(e) => setFormData(prev => ({...prev, autoUpgrade: {...prev!.autoUpgrade!, toPlanId: Number(e.target.value)}}))} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">- Select Plan -</option>
                                    {state.investmentPlans.filter(p => p.id !== plan?.id && p.status === Status.Active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}
                        </div>
                         <div>
                            <label className="flex items-center space-x-2"><input type="checkbox" name="holdPosition.enabled" checked={formData.holdPosition?.enabled} onChange={handleChange} /> <span>Hold Position Commission</span></label>
                            {formData.holdPosition?.enabled && formData.directReferralLimit! > 0 && (
                                <div className="mt-2 p-2 border rounded-md dark:border-gray-700">
                                    <p className="text-xs mb-2">Select referral slots whose commission will be held for upgrade:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from({ length: formData.directReferralLimit! }, (_, i) => i + 1).map(slot => (
                                            <label key={slot} className="flex items-center space-x-1 text-sm p-1 bg-gray-100 dark:bg-gray-900 rounded">
                                                <input type="checkbox" checked={formData.holdPosition?.slots?.includes(slot)} onChange={e => handleHoldSlotChange(slot, e.target.checked)} />
                                                <span>{slot}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                             {formData.holdPosition?.enabled && formData.directReferralLimit === 0 && <p className="text-xs text-red-500 mt-1">Set a Direct Referral Limit to enable hold positions.</p>}
                        </div>
                    </div>
                </fieldset>


                 <div className="mt-6 flex justify-end space-x-3">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Plan</Button>
                </div>
            </form>
        </Modal>
    )
}

export default InvestmentPlans;