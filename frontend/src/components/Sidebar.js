import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  CpuChipIcon,
  EyeIcon,
  DocumentTextIcon,
  Cog6ToothIcon as CogIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, current: location.pathname === '/' },
    { name: 'Agent Status', href: '/agents', icon: CpuChipIcon, current: location.pathname === '/agents' },
    { name: 'Monitor', href: '/monitor', icon: EyeIcon, current: location.pathname === '/monitor' },
    { name: 'Reports', href: '/reports', icon: DocumentTextIcon, current: location.pathname === '/reports' },
    { name: 'Pricing', href: '/pricing', icon: CurrencyDollarIcon, current: location.pathname === '/pricing' },
    { name: 'Settings', href: '/settings', icon: CogIcon, current: location.pathname === '/settings' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: open ? 256 : 80,
          x: 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full bg-black/90 backdrop-blur-xl border-r border-gray-800 z-50 lg:z-30`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-300 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-black" />
              </div>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-white font-bold text-lg">ComplyChain</h1>
                </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  {open && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="ml-3 font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className={`flex items-center ${open ? 'space-x-3' : 'justify-center'}`}>
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
              {open && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-gray-300"
                >
                  Agents Active
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
