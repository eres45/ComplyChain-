import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import AgentCard from './AgentCard';
import { 
  CpuChipIcon, 
  ShieldCheckIcon, 
  DocumentTextIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';

const AgentStatus = () => {
  const { getAgentStatus, startMonitoring, stopMonitoring } = useApi();
  const { agentStatus, isConnected } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState({});

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const loadAgentStatus = async () => {
    try {
      setLoading(true);
      const status = await getAgentStatus();
      setAgents(status);
    } catch (error) {
      console.error('Failed to load agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await startMonitoring();
      await loadAgentStatus();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      await stopMonitoring();
      await loadAgentStatus();
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Status</h1>
          <p className="text-gray-300">Monitor and control your AI compliance agents</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleStartMonitoring}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Start Monitoring</span>
          </button>
          
          <button
            onClick={handleStopMonitoring}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <StopIcon className="h-4 w-4" />
            <span>Stop Monitoring</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="spinner" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AgentCard
            name="Monitor Agent"
            description="Streams Solana blockchain data and monitors wallet transactions in real-time"
            status={agents.monitor && isConnected ? 'active' : 'inactive'}
            icon={CpuChipIcon}
            metrics={{
              'Agent ID': 'monitor-agent',
              'Monitoring': agents.monitor?.isMonitoring ? 'Active' : 'Inactive',
              'Watched Wallets': agents.monitor?.watchedWallets?.length || 0,
              'Transactions': agents.monitor?.transactionCount || 0,
              'Last Update': agents.monitor?.lastUpdate ? 'Recent' : 'Never'
            }}
          />
          
          <AgentCard
            name="Analyst Agent"
            description="AI-powered compliance analysis using Mistral AI for advanced reasoning"
            status={agents.analyst && isConnected ? 'active' : 'inactive'}
            icon={ShieldCheckIcon}
            metrics={{
              'Agent ID': 'analyst-agent',
              'Compliance Rules': agents.analyst?.complianceRules?.length || 3,
              'Sanctioned Addresses': agents.analyst?.sanctionedAddressCount || 0,
              'Risk Thresholds': 'Configured',
              'Last Update': agents.analyst?.lastUpdate ? 'Recent' : 'Never'
            }}
          />
          
          <AgentCard
            name="Auditor Agent"
            description="Generates comprehensive reports and mints immutable NFT certificates"
            status={agents.auditor && isConnected ? 'active' : 'inactive'}
            icon={DocumentTextIcon}
            metrics={{
              'Agent ID': 'auditor-agent',
              'Reports Generated': agents.auditor?.reportsGenerated || 0,
              'Certificates Minted': agents.auditor?.certificatesMinted || 0,
              'Last Report': agents.auditor?.lastReportGenerated ? 'Recent' : 'None',
              'Last Update': agents.auditor?.lastUpdate ? 'Recent' : 'Never'
            }}
          />
        </motion.div>
      )}

      {/* Agent Communication Flow */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Agent Communication Flow</h3>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
              <CpuChipIcon className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-white font-medium">Monitor</p>
            <p className="text-gray-400 text-sm">Detects transactions</p>
          </div>
          
          <div className="flex-1 mx-4">
            <div className="h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 transaction-flow"></div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
              <ShieldCheckIcon className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-white font-medium">Analyst</p>
            <p className="text-gray-400 text-sm">Analyzes compliance</p>
          </div>
          
          <div className="flex-1 mx-4">
            <div className="h-0.5 bg-gradient-to-r from-purple-400 to-green-400 transaction-flow"></div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
              <DocumentTextIcon className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-white font-medium">Auditor</p>
            <p className="text-gray-400 text-sm">Generates reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentStatus;
