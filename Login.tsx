import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('john.doe@example.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in DataContext will handle navigation
            navigate('/member');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SmartEarning</h1>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">Welcome Back!</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Sign in to continue to your dashboard.</p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div>
                        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Sign up
                    </Link>
                </p>
                 <p className="text-xs text-center text-gray-500">
                    <Link to="/secure-admin-login" className="hover:underline">Admin Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
