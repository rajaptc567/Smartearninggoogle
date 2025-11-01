import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd have authentication logic here.
        navigate('/admin');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SmartEarning</h1>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">Admin Panel Login</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please enter your administrator credentials.</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            defaultValue="admin"
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            defaultValue="adminpass"
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <Button type="submit" size="lg" className="w-full">
                            Sign In
                        </Button>
                    </div>
                </form>
                 <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    <Link to="/login" className="font-medium text-gray-500 hover:text-gray-400">
                        Return to user login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;