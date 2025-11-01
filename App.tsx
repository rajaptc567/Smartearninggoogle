import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Deposits from './pages/Deposits';
import Withdrawals from './pages/Withdrawals';
import PaymentMethods from './pages/PaymentMethods';
import InvestmentPlans from './pages/InvestmentPlans';
import Wallet from './pages/Wallet';
import Rules from './pages/Rules';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Transfers from './pages/Transfers';

// Public facing components
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';

// User facing components
import UserLayout from './components/UserLayout';
import UserDashboard from './pages/UserDashboard';
import DepositFunds from './pages/user/DepositFunds';
import WithdrawFunds from './pages/user/WithdrawFunds';
import UserInvestmentPlans from './pages/user/UserInvestmentPlans';
import Transactions from './pages/user/Transactions';
import Referrals from './pages/user/Referrals';
import Profile from './pages/user/Profile';
import TransferFunds from './pages/user/TransferFunds';


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/secure-admin-login" element={<AdminLogin />} />

        {/* Admin Panel Routes */}
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="deposits" element={<Deposits />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="payment-methods" element={<PaymentMethods />} />
          <Route path="investment-plans" element={<InvestmentPlans />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="rules" element={<Rules />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="logs" element={<Logs />} />
        </Route>

        {/* User Member Area Routes */}
        <Route path="/member" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="deposit" element={<DepositFunds />} />
          <Route path="withdraw" element={<WithdrawFunds />} />
          <Route path="transfer" element={<TransferFunds />} />
          <Route path="plans" element={<UserInvestmentPlans />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;