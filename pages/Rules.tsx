import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import Table from '../components/ui/Table';

const Rules: React.FC = () => {
    const { state, dispatch } = useData();
    const { rules, investmentPlans, settings } = state;
    
    const [fromPlan, setFromPlan] = useState('');
    const [toPlan, setToPlan] = useState('');
    const [requiredEarnings, setRequiredEarnings] = useState('');

    const activePlans = investmentPlans.filter(p => p.status === 'Active');

    const handleAddRule = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromPlan || !toPlan || !requiredEarnings) {
            alert('Please fill all fields');
            return;
        }
        const newRule = {
            id: Date.now(),
            fromPlan,
            toPlan,
            requiredEarnings: parseFloat(requiredEarnings),
        };
        dispatch({ type: 'ADD_RULE', payload: newRule });
        setFromPlan('');
        setToPlan('');
        setRequiredEarnings('');
    };
    
    const handleDeleteRule = (ruleId: number) => {
        if(window.confirm('Are you sure you want to delete this rule?')) {
            dispatch({ type: 'DELETE_RULE', payload: ruleId });
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Company & Upgrade Rules</h2>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">New Upgrade Rule</h3>
                    <form onSubmit={handleAddRule} className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div>
                            <label htmlFor="fromPlan" className="block text-sm font-medium">From Plan</label>
                            <select id="fromPlan" value={fromPlan} onChange={e => setFromPlan(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select Plan</option>
                                {activePlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="toPlan" className="block text-sm font-medium">To Plan</label>
                            <select id="toPlan" value={toPlan} onChange={e => setToPlan(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select Plan</option>
                                {activePlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="requiredEarnings" className="block text-sm font-medium">Required Earnings ({settings.defaultCurrencySymbol})</label>
                            <input type="number" id="requiredEarnings" value={requiredEarnings} onChange={e => setRequiredEarnings(e.target.value)} className="mt-1 block w-full rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div className="">
                           <Button type="submit">Add Rule</Button>
                         </div>
                    </form>
                </div>
                 <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Existing Rules</h3>
                     <div className="mt-4">
                        <Table headers={['From Plan', 'To Plan', 'Required Earnings', 'Actions']}>
                            {rules.map(rule => (
                                <tr key={rule.id} className="text-gray-700 dark:text-gray-400">
                                    <td className="px-4 py-3">{rule.fromPlan}</td>
                                    <td className="px-4 py-3">{rule.toPlan}</td>
                                    <td className="px-4 py-3">{settings.defaultCurrencySymbol}{rule.requiredEarnings.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteRule(rule.id)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Rules;