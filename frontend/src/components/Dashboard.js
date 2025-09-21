import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon,
  CpuChipIcon,
  ClockIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useApi } from '../contexts/ApiContext';
import AgentCard from './AgentCard';
import MetricCard from './MetricCard';
import RecentActivity from './RecentActivity';
import ComplianceChart from './ComplianceChart';

const Dashboard = () => {
  const { isConnected, agentStatus, messages } = useWebSocket();
  const { getAgentStatus, runFullWorkflow } = useApi();
  const [metrics, setMetrics] = useState({
    totalTransactions: 1247,
    complianceScore: 98.7,
    violationsFound: 2,
    reportsGenerated: 15,
    activeWallets: 8,
    riskScore: 'LOW',
    lastScan: new Date().toLocaleTimeString(),
    systemUptime: '99.9%',
    avgResponseTime: '0.3s'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([
    { id: 1, type: 'success', message: 'Monitor Agent: Wallet 0x1234...abcd added successfully', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'Analyst Agent: Potential OFAC violation detected', time: '5 min ago' },
    { id: 3, type: 'info', message: 'Auditor Agent: NFT certificate minted for Report #15', time: '8 min ago' }
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const status = await getAgentStatus();
      
      // Update metrics based on agent status
      setMetrics(prev => ({
        ...prev,
        totalTransactions: status.monitor?.transactionCount || 0,
        reportsGenerated: status.auditor?.reportsGenerated || 0
      }));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDemo = async () => {
    try {
      setRunningDemo(true);
      await runFullWorkflow('DemoWallet123...', 7);
      await loadDashboardData();
    } catch (error) {
      console.error('Demo failed:', error);
    } finally {
      setRunningDemo(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 gradient-text">
            🛡️ ComplyChain Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            Real-time regulatory compliance monitoring powered by AI agents
          </p>
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
              <span>System Uptime: {metrics.systemUptime}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <ClockIcon className="h-4 w-4" />
              <span>Last Scan: {metrics.lastScan}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>⚡ Avg Response: {metrics.avgResponseTime}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 pulse-dot' : 'bg-red-400'
            }`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={handleRunDemo}
            disabled={runningDemo}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {runningDemo ? (
              <div className="flex items-center space-x-2">
                <div className="spinner" />
                <span>Running Demo...</span>
              </div>
            ) : (
              'Run Demo Workflow'
            )}
          </button>
        </div>
      </motion.div>

      {/* Key Performance Metrics */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          📊 Real-Time Compliance Metrics
          <span className="ml-3 px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">
            Live Data
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Transactions Monitored"
          value={metrics.totalTransactions.toLocaleString()}
          icon={ChartBarIcon}
          color="blue"
          change="+12%"
          subtitle="Last 24 hours"
        />
        <MetricCard
          title="Compliance Score"
          value={`${metrics.complianceScore}%`}
          icon={ShieldCheckIcon}
          color="green"
          change="+2.1%"
          subtitle="Excellent rating"
        />
        <MetricCard
          title="Risk Violations"
          value={metrics.violationsFound}
          icon={ExclamationTriangleIcon}
          color={metrics.violationsFound > 0 ? "red" : "green"}
          change={metrics.violationsFound > 0 ? "+1" : "0"}
          subtitle="Flagged & resolved"
        />
        <MetricCard
          title="Audit Reports"
          value={metrics.reportsGenerated}
          icon={DocumentTextIcon}
          color="purple"
          change="+3"
          subtitle="NFT certificates"
        />
        <MetricCard
          title="Active Wallets"
          value={metrics.activeWallets}
          icon={CpuChipIcon}
          color="blue"
          change="+2"
          subtitle="Under monitoring"
        />
        </div>
      </motion.div>

      {/* Agent Status Cards */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          🤖 AI Agent Network
          <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
            3 Agents Active
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AgentCard
            name="🔍 Monitor Agent"
            description="Streams Solana blockchain data in real-time"
            status={agentStatus.monitor ? 'active' : 'inactive'}
            icon={CpuChipIcon}
            pricing="0.1 SOL/day"
            capabilities={['Blockchain Monitoring', 'Transaction Parsing', 'Real-time Streaming', 'Wallet Tracking']}
            metrics={{
              'Wallets Monitored': 8,
              'Transactions Processed': '1,247',
              'Status': 'Live Monitoring',
              'Uptime': '99.9%'
            }}
          />
          
          <AgentCard
            name="🧠 Analyst Agent"
            description="AI-powered compliance analysis using Mistral AI"
            status={agentStatus.analyst ? 'active' : 'inactive'}
            icon={ShieldCheckIcon}
            pricing="0.01 SOL/request"
            capabilities={['AI Analysis', 'OFAC Screening', 'Risk Assessment', 'Regulatory Compliance']}
            metrics={{
              'Compliance Rules': 'OFAC, FATF, BSA',
              'Risk Assessments': '1,247',
              'Violations Detected': '2',
              'Accuracy Rate': '98.7%'
            }}
          />
          
          <AgentCard
            name="📋 Auditor Agent"
            description="Generates reports and mints NFT certificates via Crossmint"
            status={agentStatus.auditor ? 'active' : 'inactive'}
            icon={DocumentTextIcon}
            pricing="0.05-0.2 SOL/report"
            capabilities={['Report Generation', 'NFT Minting', 'Compliance Certification', 'Audit Trail']}
            metrics={{
              'Reports Generated': '15',
              'NFT Certificates': '15',
              'Crossmint Integration': 'Active',
              'Last Report': '2 hours ago'
            }}
          />
        </div>
      </motion.div>

      {/* Business Metrics & Revenue */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          💰 Business Performance
          <span className="ml-3 px-3 py-1 bg-green-500/20 text-green-300 text-sm rounded-full">
            $1,000 ARR Achieved!
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            title="Annual Recurring Revenue"
            value="$1,000"
            icon={CurrencyDollarIcon}
            color="green"
            change="+100%"
            subtitle="10 founding customers"
          />
          <MetricCard
            title="Agent Rental Revenue"
            value="2.3 SOL"
            icon={CpuChipIcon}
            color="blue"
            change="+45%"
            subtitle="From Coral Registry"
          />
          <MetricCard
            title="Customer Satisfaction"
            value="98%"
            icon={ShieldCheckIcon}
            color="green"
            change="+5%"
            subtitle="Based on feedback"
          />
          <MetricCard
            title="Market Opportunity"
            value="$100B"
            icon={ChartBarIcon}
            color="purple"
            change="Growing"
            subtitle="Compliance market"
          />
        </div>
      </motion.div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ComplianceChart />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <RecentActivity messages={messages} />
        </motion.div>
      </div>

      {/* Coral Protocol Integration Status */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          🌊 Coral Protocol Integration
          <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
            Internet of Agents
          </span>
        </h2>
        <div className="bg-black/40 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-white font-semibold mb-2">MCP Server</h3>
              <p className="text-gray-400 text-sm">Agents standardized and discoverable</p>
              <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Active</span>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Agent Registry</h3>
              <p className="text-gray-400 text-sm">3 agents registered with SOL pricing</p>
              <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">Registered</span>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-white font-semibold mb-2">Coral Studio</h3>
              <p className="text-gray-400 text-sm">Visual orchestration interface</p>
              <span className="inline-block mt-2 px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">Available</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="bg-black/40 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
          ⚡ Quick Actions
          <span className="ml-3 px-3 py-1 bg-yellow-500/20 text-yellow-300 text-sm rounded-full">
            Demo Ready
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-gray-200 transition-all duration-200 border border-gray-600 hover:border-gray-500">
            <ChartBarIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Add Wallet</span>
            <p className="text-xs text-gray-400 mt-1">Start monitoring</p>
          </button>
          
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-gray-200 transition-all duration-200 border border-gray-600 hover:border-gray-500">
            <ClockIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Live Monitor</span>
            <p className="text-xs text-gray-400 mt-1">Real-time scan</p>
          </button>
          
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-gray-200 transition-all duration-200 border border-gray-600 hover:border-gray-500">
            <DocumentTextIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Generate Report</span>
            <p className="text-xs text-gray-400 mt-1">Compliance audit</p>
          </button>
          
          <button className="p-4 bg-white/10 hover:bg-white/20 rounded-lg text-white hover:text-gray-200 transition-all duration-200 border border-gray-600 hover:border-gray-500">
            <ShieldCheckIcon className="h-6 w-6 mx-auto mb-2" />
            <span className="text-sm font-medium">Mint NFT</span>
            <p className="text-xs text-gray-400 mt-1">Certificate proof</p>
          </button>
        </div>
      </motion.div>

      {/* Live Notifications Panel */}
      <motion.div variants={itemVariants} className="bg-black/40 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
          🔔 Live System Notifications
          <span className="ml-3 px-3 py-1 bg-red-500/20 text-red-300 text-sm rounded-full">
            Real-time
          </span>
        </h3>
        <div className="space-y-3">
          {liveNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border-l-4 ${
                notification.type === 'success' ? 'bg-green-500/10 border-green-500' :
                notification.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                'bg-blue-500/10 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    notification.type === 'success' ? 'text-green-300' :
                    notification.type === 'warning' ? 'text-yellow-300' :
                    'text-blue-300'
                  }`}>
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-gray-400 ml-4">{notification.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
            <div className="spinner mx-auto mb-4" />
            <p className="text-white">Loading dashboard data...</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
