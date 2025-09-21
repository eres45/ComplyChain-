import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cog6ToothIcon, 
  KeyIcon, 
  ServerIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [settings, setSettings] = useState({
    coralServerUrl: 'http://localhost:5555',
    solanaRpcUrl: 'https://api.mainnet-beta.solana.com',
    mistralApiKey: '',
    crossmintApiKey: '',
    crossmintProjectId: '',
    notifications: {
      violations: true,
      reports: true,
      certificates: true,
      monitoring: false
    },
    monitoring: {
      checkInterval: 60000,
      maxTransactionHistory: 10000,
      autoGenerateReports: false
    }
  });

  const handleInputChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to backend/localStorage
    console.log('Settings saved:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-300">Configure your ComplyChain environment</p>
      </div>

      {/* API Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <KeyIcon className="h-6 w-6 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">API Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Coral Server URL
            </label>
            <input
              type="text"
              value={settings.coralServerUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, coralServerUrl: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Solana RPC URL
            </label>
            <input
              type="text"
              value={settings.solanaRpcUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, solanaRpcUrl: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mistral AI API Key
            </label>
            <input
              type="password"
              value={settings.mistralApiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, mistralApiKey: e.target.value }))}
              placeholder="Enter your Mistral API key"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Crossmint API Key
            </label>
            <input
              type="password"
              value={settings.crossmintApiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, crossmintApiKey: e.target.value }))}
              placeholder="Enter your Crossmint API key"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </motion.div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <BellIcon className="h-6 w-6 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Notifications</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <button
                onClick={() => handleInputChange('notifications', key, !value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  value ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Monitoring Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <ServerIcon className="h-6 w-6 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Monitoring</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Check Interval (ms)
            </label>
            <input
              type="number"
              value={settings.monitoring.checkInterval}
              onChange={(e) => handleInputChange('monitoring', 'checkInterval', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Transaction History
            </label>
            <input
              type="number"
              value={settings.monitoring.maxTransactionHistory}
              onChange={(e) => handleInputChange('monitoring', 'maxTransactionHistory', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-300">Auto-generate Daily Reports</label>
            <button
              onClick={() => handleInputChange('monitoring', 'autoGenerateReports', !settings.monitoring.autoGenerateReports)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.monitoring.autoGenerateReports ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.monitoring.autoGenerateReports ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
        >
          <ShieldCheckIcon className="h-5 w-5" />
          <span>Save Settings</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;
