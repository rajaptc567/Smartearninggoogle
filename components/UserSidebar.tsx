
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../hooks/useData';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>;
const DepositIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>;
const WithdrawalIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
const TransferIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>;
const PlanIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>;
const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 1.803M15 21a9 9 0 00-9-8.627M15 21a9 9 0 003.75-1.465M12 12a4 4 0 100-8 4 4 0 000 8z"></path></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const AdminViewIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>;
const LogoutIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>;


const userNavLinks = [
  { to: '/member', label: 'Dashboard', icon: <HomeIcon />, condition: null },
  { to: '/member/deposit', label: 'Deposit Funds', icon: <DepositIcon />, condition: null },
  { to: '/member/withdraw', label: 'Withdraw Funds', icon: <WithdrawalIcon />, condition: null },
  { to: '/member/transfer', label: 'Transfer Funds', icon: <TransferIcon />, condition: 'isUserTransferEnabled' },
  { to: '/member/plans', label: 'Investment Plans', icon: <PlanIcon />, condition: null },
  { to: '/member/transactions', label: 'Transactions', icon: <WalletIcon />, condition: null },
  { to: '/member/referrals', label: 'My Network', icon: <UsersIcon />, condition: null },
  { to: '/member/profile', label: 'Profile Settings', icon: <SettingsIcon />, condition: null },
  { to: '/admin', label: 'Admin Panel', icon: <AdminViewIcon />, condition: null },
];

const UserSidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { state } = useData();

    const baseLinkClass = "flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200";
    const inactiveLinkClass = "text-gray-400 hover:bg-gray-700 hover:text-white";
    const activeLinkClass = "bg-blue-600 text-white";

    return (
        <>
            <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 onClick={() => setSidebarOpen(false)}>
            </div>
            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 dark:bg-gray-900 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col`}>
                <div className="flex items-center justify-center h-20 border-b border-gray-700 flex-shrink-0">
                    <h1 className="text-2xl font-bold text-white">Member Area</h1>
                </div>
                <nav className="mt-6 px-4 flex-grow">
                    {userNavLinks.map(({ to, label, icon, condition }) => {
                        // FIX: Check for feature flags within the `state.settings` object instead of the top-level state.
                        if (condition && !state.settings[condition as keyof typeof state.settings]) {
                          return null;
                        }
                        return (
                          <NavLink
                              key={label}
                              to={to}
                              end={to === '/member'} // `end` prop for exact match on dashboard link
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : inactiveLinkClass} mt-2`}
                          >
                              {icon}
                              <span className="mx-4 font-medium">{label}</span>
                          </NavLink>
                        )
                    })}
                </nav>
                <div className="px-4 pb-6">
                     <NavLink
                        to="/"
                        onClick={() => setSidebarOpen(false)}
                        className={`${baseLinkClass} ${inactiveLinkClass} mt-2`}
                    >
                        <LogoutIcon />
                        <span className="mx-4 font-medium">Logout</span>
                    </NavLink>
                </div>
            </div>
        </>
    );
};

export default UserSidebar;
