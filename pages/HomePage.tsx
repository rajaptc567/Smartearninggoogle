import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const { state } = useData();
    const { settings } = state;

    const featuredPlans = state.investmentPlans.filter(p => p.status === 'Active').slice(0, 3);
    
    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SmartEarning</h1>
                        <nav className="space-x-2">
                            <Button variant="secondary" onClick={() => navigate('/login')}>Login</Button>
                            <Button onClick={() => navigate('/register')}>Register</Button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-4 sm:px-6 lg:px-8">
                <section className="text-center py-16 sm:py-24">
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                        <span className="block">Achieve Your Financial Goals</span>
                        <span className="block text-blue-600 dark:text-blue-400 mt-2">The Smart Way to Earn.</span>
                    </h2>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-500 dark:text-gray-400">
                        Join a community of forward-thinkers. With our tailored investment plans and powerful referral system, your path to lifetime earnings starts here. Work smart, not hard.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button size="lg" onClick={() => navigate('/register')}>Get Started for Free</Button>
                    </div>
                </section>

                {/* Featured Plans Section */}
                <section id="plans" className="py-16 sm:py-24">
                    <div className="text-center mb-12">
                         <h3 className="text-3xl sm:text-4xl font-bold">Our Most Popular Plans</h3>
                         <p className="mt-3 text-gray-500 dark:text-gray-400">Find the perfect fit to kickstart your earning journey.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredPlans.map(plan => (
                            <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 flex flex-col border border-gray-200 dark:border-gray-700">
                                <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">{plan.name}</h4>
                                <p className="text-4xl font-bold my-4">{settings.defaultCurrencySymbol}{plan.price}</p>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 flex-grow">
                                    <li className="flex items-center"><CheckIcon /> Duration: {plan.durationDays === 0 ? 'Unlimited' : `${plan.durationDays} Days`}</li>
                                    {/* FIX: Use `directCommissions` array instead of `directCommission`. Display the first commission as a representative value. */}
                                    <li className="flex items-center"><CheckIcon /> Direct Commission: {plan.directCommissions.length > 0 ? (plan.directCommissions[0].type === 'percentage' ? `${plan.directCommissions[0].value}%` : `${settings.defaultCurrencySymbol}${plan.directCommissions[0].value}`) : 'N/A'}</li>
                                    <li className="flex items-center"><CheckIcon /> {plan.indirectCommissions.length} Levels of Indirect Commission</li>
                                </ul>
                                <Button className="mt-6 w-full" onClick={() => navigate('/register')}>Choose Plan</Button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Income Chart Section */}
                <section className="py-16 sm:py-24">
                     <div className="text-center mb-12">
                         <h3 className="text-3xl sm:text-4xl font-bold">Visualize Your Growth</h3>
                         <p className="mt-3 text-gray-500 dark:text-gray-400">Our platform is designed for exponential, handsome income.</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8">
                        <div className="flex items-end h-64 space-x-2 sm:space-x-4">
                            <div className="w-full h-[20%] bg-blue-400 rounded-t-lg" title="Month 1"></div>
                            <div className="w-full h-[35%] bg-blue-500 rounded-t-lg" title="Month 2"></div>
                            <div className="w-full h-[50%] bg-blue-500 rounded-t-lg" title="Month 3"></div>
                            <div className="w-full h-[60%] bg-blue-600 rounded-t-lg" title="Month 4"></div>
                            <div className="w-full h-[85%] bg-blue-600 rounded-t-lg" title="Month 5"></div>
                            <div className="w-full h-full bg-blue-700 rounded-t-lg" title="Month 6"></div>
                        </div>
                         <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">Potential Earning Growth Over 6 Months</p>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} SmartEarning. All Rights Reserved.
                </div>
            </footer>
        </div>
    );
};

const CheckIcon = () => (
    <svg className="w-5 h-5 mr-2 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);


export default HomePage;