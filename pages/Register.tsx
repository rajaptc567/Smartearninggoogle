import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Register: React.FC = () => {
    const navigate = useNavigate();

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you'd have registration logic here.
        // For this demo, we'll just navigate to the member dashboard.
        alert('Registration successful! Redirecting to your dashboard...');
        navigate('/member');
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 py-12">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">SmartEarning</h1>
                    <h2 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">Create Your Account</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Join us and start your earning journey today.</p>
                </div>
                <form className="space-y-4" onSubmit={handleRegister}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label htmlFor="fullName"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                           <input id="fullName" name="fullName" type="text" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                           <label htmlFor="username"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Name</label>
                           <input id="username" name="username" type="text" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                     </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                        <input id="email" name="email" type="email" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="mobile"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mobile Number</label>
                            <input id="mobile" name="mobile" type="tel" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                         <div>
                            <label htmlFor="whatsapp"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
                            <input id="whatsapp" name="whatsapp" type="tel" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                     </div>
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country (Optional)</label>
                        <input id="country" name="country" type="text" className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                     <div>
                        <label htmlFor="sponsor"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sponsor Username</label>
                        <input id="sponsor" name="sponsor" type="text" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input id="password" name="password" type="password" required className="w-full px-3 py-2 mt-1 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div className="pt-4">
                        <Button type="submit" size="lg" className="w-full">
                            Create Account
                        </Button>
                    </div>
                </form>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;