import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  DocumentTextIcon,
  EyeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const RecentActivity = ({ messages = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_transaction':
        return EyeIcon;
      case 'analysis_complete':
        return ShieldCheckIcon;
      case 'report_generated':
        return DocumentTextIcon;
      case 'certificate_minted':
        return CheckCircleIcon;
      case 'wallet_added':
        return EyeIcon;
      default:
        return ShieldCheckIcon;
    }
  };

  const getActivityColor = (type, data) => {
    switch (type) {
      case 'analysis_complete':
        if (data?.complianceStatus === 'violation') return 'text-red-400';
        if (data?.complianceStatus === 'warning') return 'text-yellow-400';
        return 'text-green-400';
      case 'new_transaction':
        return 'text-blue-400';
      case 'report_generated':
        return 'text-purple-400';
      case 'certificate_minted':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getActivityMessage = (message) => {
    switch (message.type) {
      case 'new_transaction':
        return `New transaction detected: ${message.data?.signature?.substring(0, 8)}...`;
      case 'analysis_complete':
        return `Analysis complete - Status: ${message.data?.complianceStatus}`;
      case 'report_generated':
        return `Compliance report generated: ${message.data?.reportId}`;
      case 'certificate_minted':
        return `NFT certificate minted: ${message.data?.certificateId}`;
      case 'wallet_added':
        return `Wallet added to monitoring: ${message.data?.address?.substring(0, 8)}...`;
      case 'monitoring_started':
        return 'Real-time monitoring started';
      case 'workflow_complete':
        return 'Full compliance workflow completed';
      default:
        return message.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const recentMessages = messages.slice(-10).reverse();

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {recentMessages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <ShieldCheckIcon className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-gray-400">No recent activity</p>
            <p className="text-gray-500 text-sm">Agent activities will appear here</p>
          </div>
        ) : (
          recentMessages.map((message, index) => {
            const Icon = getActivityIcon(message.type);
            const color = getActivityColor(message.type, message.data);
            const activityMessage = getActivityMessage(message);
            
            return (
              <motion.div
                key={`${message.timestamp}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className={`p-2 rounded-lg bg-white/10 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    {activityMessage}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </p>
                  
                  {/* Additional details for specific message types */}
                  {message.type === 'analysis_complete' && message.data?.riskLevel && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        message.data.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' :
                        message.data.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        Risk: {message.data.riskLevel}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      
      {recentMessages.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
