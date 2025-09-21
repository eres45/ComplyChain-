import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  PlusIcon, 
  EyeIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const TransactionMonitor = () => {
  const { addWallet, getTransactions, simulateTransaction } = useApi();
  const { messages } = useWebSocket();
  const [walletAddress, setWalletAddress] = useState('');
  const [walletLabel, setWalletLabel] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions(20);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    if (!walletAddress.trim()) return;

    try {
      setLoading(true);
      await addWallet(walletAddress, walletLabel);
      setWalletAddress('');
      setWalletLabel('');
    } catch (error) {
      console.error('Failed to add wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateTransaction = async () => {
    try {
      setLoading(true);
      await simulateTransaction('DemoWallet123...', 'Demo Transaction');
      await loadTransactions();
    } catch (error) {
      console.error('Failed to simulate transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'violation': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'compliant': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'violation': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Transaction Monitor</h1>
          <p className="text-gray-300">Real-time blockchain transaction monitoring and analysis</p>
        </div>
        
        <button
          onClick={handleSimulateTransaction}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Simulating...' : 'Simulate Transaction'}
        </button>
      </div>

      {/* Add Wallet Form */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add Wallet to Monitor</h3>
        <form onSubmit={handleAddWallet} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Wallet Address (e.g., 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa)"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <input
            type="text"
            placeholder="Label (optional)"
            value={walletLabel}
            onChange={(e) => setWalletLabel(e.target.value)}
            className="md:w-48 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !walletAddress.trim()}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Wallet</span>
          </button>
        </form>
      </div>

      {/* Transaction List */}
      <div className="glass rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
          <button
            onClick={loadTransactions}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 mb-2">No transactions to display</p>
            <p className="text-gray-500 text-sm">Add a wallet to start monitoring transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => {
              const StatusIcon = getStatusIcon(tx.complianceStatus);
              return (
                <motion.div
                  key={tx.signature || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getStatusColor(tx.complianceStatus)}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      
                      <div>
                        <p className="text-white font-medium">
                          {tx.signature?.substring(0, 16)}...
                        </p>
                        <p className="text-gray-400 text-sm">
                          {tx.wallet?.substring(0, 16)}... • {tx.walletLabel || 'Unlabeled'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {tx.balanceChanges?.[0]?.change 
                          ? `${(tx.balanceChanges[0].change / 1000000000).toFixed(4)} SOL`
                          : 'N/A'
                        }
                      </p>
                      <p className="text-gray-400 text-sm">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.complianceStatus)}`}>
                      {tx.complianceStatus || 'Pending'}
                    </span>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Fee: {(tx.fee / 1000000000).toFixed(6)} SOL</span>
                      <span>Status: {tx.status}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Activity Feed */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Live Activity Feed</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {messages.slice(-5).reverse().map((message, index) => (
            <div key={`${message.timestamp}-${index}`} className="flex items-center space-x-3 p-2 rounded-lg bg-white/5">
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
              <span className="text-white text-sm">
                {message.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionMonitor;
