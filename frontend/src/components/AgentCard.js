import React from 'react';
import { motion } from 'framer-motion';

const AgentCard = ({ name, description, status, icon: Icon, metrics = {}, pricing, capabilities = [] }) => {
  const statusColors = {
    active: 'from-green-500 to-green-600',
    inactive: 'from-gray-500 to-gray-600',
    warning: 'from-yellow-500 to-yellow-600',
    error: 'from-red-500 to-red-600'
  };

  const statusText = {
    active: 'Active',
    inactive: 'Inactive',
    warning: 'Warning',
    error: 'Error'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass rounded-xl p-6 hover:bg-white/5 transition-all duration-200 agent-active"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 bg-gradient-to-r ${statusColors[status]} rounded-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{name}</h3>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' ? 'bg-green-500/20 text-green-300' :
          status === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
          status === 'error' ? 'bg-red-500/20 text-red-300' :
          'bg-gray-500/20 text-gray-300'
        }`}>
          {statusText[status]}
        </span>
      </div>

      <div className="space-y-3">
        {/* Metrics */}
        <div className="space-y-2">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">{key}</span>
              <span className="text-white text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
        
        {/* Pricing */}
        {pricing && (
          <div className="pt-2 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Rental Price</span>
              <span className="text-green-300 text-sm font-bold">{pricing}</span>
            </div>
          </div>
        )}
        
        {/* Capabilities */}
        {capabilities.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {capabilities.slice(0, 3).map((capability, index) => (
                <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                  {capability}
                </span>
              ))}
              {capabilities.length > 3 && (
                <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                  +{capabilities.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AgentCard;
