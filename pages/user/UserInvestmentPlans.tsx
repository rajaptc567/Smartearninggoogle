import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import { InvestmentPlan, Status } from '../../types';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

const UserInvestmentPlans: React.FC = () => {
  const { state, dispatch } = useData();
  const { investmentPlans, currentUser, settings } = state;
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);

  const activePlans = investmentPlans.filter(p => p.status === Status.Active);

  if (!currentUser) {
    return <div>Loading user data...</div>;
  }
  
  const handlePurchaseClick = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  }

  const handleConfirmPurchase = () => {
    if (selectedPlan) {
        dispatch({ type: 'PURCHASE_PLAN', payload: { userId: currentUser.id, planId: selectedPlan.id } });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  }
  
  const getDirectCommissionDisplay = (plan: InvestmentPlan) => {
    if (!plan.directCommissions || plan.directCommissions.length === 0) {
      return 'N/A';
    }

    // Find the commission with the maximum value
    const maxCommission = plan.directCommissions.reduce((max, current) =>
      (current.value > max.value ? current : max), plan.directCommissions[0]
    );

    const displayValue = maxCommission.type === 'percentage' 
      ? `${maxCommission.value}%` 
      : `${settings.defaultCurrencySymbol}${maxCommission.value}`;
    
    return `${displayValue} per ref`;
  };


  return (
    <div className="space-y-6">
       <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Investment Plans</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a plan to start earning or upgrade your current one.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePlans.map((plan) => {
                const isCurrentPlan = currentUser.activePlans.includes(plan.name);

                return (
                     <div key={plan.id} className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col border-2 ${isCurrentPlan ? 'border-blue-500' : 'border-transparent'}`}>
                        {isCurrentPlan && <div className="absolute top-0 right-0 -mt-3 mr-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">Active</div>}
                        
                        <div className="flex justify-between items-start mb-4">
                           <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                        </div>

                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">{settings.defaultCurrencySymbol}{plan.price}</p>
                        
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">
                            <li><CheckIcon /> <span className="font-semibold">Duration:</span> {plan.durationDays === 0 ? 'Lifetime' : `${plan.durationDays} Days`}</li>
                            <li><CheckIcon /> <span className="font-semibold">Min. Withdraw:</span> {settings.defaultCurrencySymbol}{plan.minWithdraw}</li>
                            <li><CheckIcon /> <span className="font-semibold">Direct Referrals:</span> {plan.directReferralLimit === 0 ? 'Unlimited' : `Up to ${plan.directReferralLimit}`}</li>
                            <li><CheckIcon />
                                <span className="font-semibold">Direct Commission: </span> 
                                {getDirectCommissionDisplay(plan)}
                            </li>
                             <li><CheckIcon />
                                <span className="font-semibold">Indirect Levels: </span> 
                                {plan.indirectCommissions.length}
                            </li>
                        </ul>
                        <p className="text-xs text-gray-500 mt-4 h-10">{plan.description}</p>
                        <div className="mt-6">
                           <Button 
                                size="lg" 
                                className="w-full" 
                                onClick={() => handlePurchaseClick(plan)}
                                disabled={isCurrentPlan}
                            >
                                {isCurrentPlan ? 'Plan Active' : (plan.price > currentUser.walletBalance ? 'Deposit to Purchase' : 'Purchase Plan')}
                           </Button>
                        </div>
                    </div>
                )
            })}
        </div>

        {isModalOpen && selectedPlan && (
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <div className="p-4 text-center">
                    <h2 className="text-2xl font-bold">Confirm Purchase</h2>
                    <p className="my-2">You are about to purchase the <span className="font-bold">{selectedPlan.name}</span> for <span className="font-bold text-blue-500">{settings.defaultCurrencySymbol}{selectedPlan.price}</span>.</p>
                    
                    {currentUser.walletBalance >= selectedPlan.price ? (
                        <div>
                             <p className="text-sm text-gray-500">This amount will be deducted from your available balance.</p>
                             <p className="mt-4">Your balance will be: 
                                <span className="text-red-500 line-through mx-2">{settings.defaultCurrencySymbol}{currentUser.walletBalance.toFixed(2)}</span>
                                <span className="text-green-500 font-bold">{settings.defaultCurrencySymbol}{(currentUser.walletBalance - selectedPlan.price).toFixed(2)}</span>
                             </p>
                             <div className="mt-6 flex justify-center space-x-4">
                                <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="success" onClick={handleConfirmPurchase}>Confirm & Pay</Button>
                             </div>
                        </div>
                    ) : (
                         <div>
                            <p className="my-4 p-3 rounded-md bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm">
                                Your available balance of <span className="font-bold">{settings.defaultCurrencySymbol}{currentUser.walletBalance.toFixed(2)}</span> is insufficient. Please deposit at least <span className="font-bold">{settings.defaultCurrencySymbol}{(selectedPlan.price - currentUser.walletBalance).toFixed(2)}</span> to proceed.
                            </p>
                            <div className="mt-6 flex justify-center space-x-4">
                                <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="primary" onClick={() => navigate('/member/deposit')}>Go to Deposit</Button>
                            </div>
                         </div>
                    )}
                </div>
            </Modal>
        )}
    </div>
  );
};

const CheckIcon = () => <svg className="inline-block w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>;

export default UserInvestmentPlans;