import React, { useState } from 'react';
import { useData } from '../../hooks/useData';
import Button from '../../components/ui/Button';
import { User } from '../../types';

const Profile: React.FC = () => {
    const { state, actions } = useData();
    const { currentUser } = state;
    
    const [formData, setFormData] = useState<Partial<User>>(currentUser || {});
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [infoMessage, setInfoMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');


    if (!currentUser) {
        return <div>Loading...</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInfoMessage('');
        await actions.updateUser({ ...currentUser, ...formData } as User);
        setInfoMessage('Profile information updated successfully!');
        setTimeout(() => setInfoMessage(''), 3000);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (passwords.new !== passwords.confirm) {
            setPasswordError("New passwords do not match.");
            setTimeout(() => setPasswordError(''), 3000);
            return;
        }
        if (passwords.new.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            setTimeout(() => setPasswordError(''), 3000);
            return;
        }
        // In a real app, you would verify the current password here via an API call
        // For now, we simulate success
        setPasswordMessage('Password changed successfully! (Simulation)');
        setPasswords({ current: '', new: '', confirm: '' });
        setTimeout(() => setPasswordMessage(''), 3000);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">Personal Information</h2>
                <form onSubmit={handleInfoSubmit} className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Full Name</label>
                            <input type="text" value={formData.fullName || ''} onChange={handleChange} name="fullName" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Username</label>
                            <input type="text" value={currentUser.username} disabled className="mt-1 block w-full rounded-md sm:text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Email Address</label>
                            <input type="email" value={formData.email || ''} onChange={handleChange} name="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium">Sponsor</label>
                            <input type="text" value={currentUser.sponsor || 'N/A'} disabled className="mt-1 block w-full rounded-md sm:text-sm bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Contact Number</label>
                            <input type="text" value={formData.phone || ''} onChange={handleChange} name="phone" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">WhatsApp Number</label>
                            <input type="text" value={formData.whatsapp || ''} onChange={handleChange} name="whatsapp" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                        </div>
                    </div>
                    <div className="text-right pt-2 flex items-center justify-end">
                        {infoMessage && <span className="text-green-500 text-sm mr-4 transition-opacity duration-300">{infoMessage}</span>}
                        <Button type="submit">Save Information</Button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-4">Change Password</h2>
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Current Password</label>
                        <input type="password" name="current" value={passwords.current} onChange={handlePasswordChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">New Password</label>
                        <input type="password" name="new" value={passwords.new} onChange={handlePasswordChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Confirm New Password</label>
                        <input type="password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div className="text-right pt-2 flex items-center justify-end">
                        {passwordMessage && <span className="text-green-500 text-sm mr-4 transition-opacity duration-300">{passwordMessage}</span>}
                        {passwordError && <span className="text-red-500 text-sm mr-4 transition-opacity duration-300">{passwordError}</span>}
                        <Button type="submit">Update Password</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;