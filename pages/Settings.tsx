import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { useData } from '../hooks/useData';
import { Settings as SettingsType } from '../types';

const Settings: React.FC = () => {
  const { state, actions } = useData();
  const { settings } = state;

  const [localSettings, setLocalSettings] = useState<SettingsType>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      await actions.updateSettings(localSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">General Settings</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 border-b dark:border-gray-700 pb-6">
            <h3 className="text-lg font-medium">Company Details</h3>
             <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
              <input type="text" id="companyName" defaultValue="SmartEarning" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
                <label htmlFor="defaultCurrencySymbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Currency Symbol</label>
                <input 
                    type="text" 
                    id="defaultCurrencySymbol" 
                    name="defaultCurrencySymbol"
                    value={localSettings.defaultCurrencySymbol}
                    onChange={handleTextChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>
        </div>
        
        <div className="space-y-4 border-b dark:border-gray-700 pb-6">
            <h3 className="text-lg font-medium">Financial Settings</h3>
            <div>
              <label htmlFor="siteWideMinWithdrawal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Site-wide Minimum Withdrawal</label>
              <input 
                type="number" 
                id="siteWideMinWithdrawal" 
                name="siteWideMinWithdrawal"
                value={localSettings.siteWideMinWithdrawal}
                onChange={handleTextChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
            </div>
        </div>

        <div className="space-y-4">
             <h3 className="text-lg font-medium">Feature Toggles</h3>
            <div className="flex items-center">
              <input 
                id="isUserTransferEnabled"
                name="isUserTransferEnabled"
                type="checkbox" 
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={localSettings.isUserTransferEnabled}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="isUserTransferEnabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Enable user-to-user balance transfers (requires admin approval)</label>
            </div>
            <div className="flex items-center">
              <input 
                id="restrictWithdrawalAmount"
                name="restrictWithdrawalAmount"
                type="checkbox" 
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={localSettings.restrictWithdrawalAmount}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="restrictWithdrawalAmount" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Restrict withdrawal amounts to active plan prices (for P2P)</label>
            </div>
        </div>
       
        <div className="pt-4 border-t dark:border-gray-700 flex items-center justify-end space-x-4">
           {saveSuccess && (
            <span className="text-green-500 text-sm transition-opacity duration-300">
                Settings saved successfully!
            </span>
           )}
           <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;