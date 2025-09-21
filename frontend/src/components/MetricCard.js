import React from 'react';
import { motion } from 'framer-motion';

const MetricCard = ({ title, value, icon: Icon, color = 'blue', change, subtitle }) => {
  const colorClasses = {
    blue: 'from-gray-700 to-gray-800',
    green: 'from-gray-600 to-gray-700',
    red: 'from-gray-800 to-black',
    purple: 'from-gray-700 to-gray-800',
    yellow: 'from-gray-600 to-gray-700',
    pink: 'from-gray-700 to-gray-800'
  };

  const changeColor = change?.startsWith('+') ? 'text-green-400' : 
                     change?.startsWith('-') ? 'text-red-400' : 'text-gray-400';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-black/40 border border-gray-700 rounded-xl p-6 hover:bg-black/60 hover:border-gray-600 transition-all duration-200 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-300 text-sm font-medium">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm mt-1 ${changeColor}`}>
              {change} from last period
            </p>
          )}
        </div>
        <div className={`p-3 bg-gradient-to-r ${colorClasses[color]} rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
