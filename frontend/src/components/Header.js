import React, { useState, useRef, useEffect } from 'react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { isConnected } = useWebSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const notificationRef = useRef(null);
  
  // Initialize notifications on component mount
  useEffect(() => {
    setNotificationList([
    {
      id: 1,
      type: 'success',
      title: 'Monitor Agent Active',
      message: 'Wallet 0x1234...abcd added successfully to monitoring',
      time: '2 min ago',
      icon: '🔍',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'OFAC Violation Detected',
      message: 'Potential sanctioned address interaction flagged for review',
      time: '5 min ago',
      icon: '⚠️',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'NFT Certificate Minted',
      message: 'Compliance certificate #CERT-001 successfully minted via Crossmint',
      time: '8 min ago',
      icon: '🎫',
      read: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Coral Protocol Connected',
      message: 'All 3 agents registered and active on Internet of Agents',
      time: '12 min ago',
      icon: '🌊',
      read: true
    },
    {
      id: 5,
      type: 'info',
      title: 'New Customer Signup',
      message: 'Founding customer #11 joined - $1,100 ARR achieved!',
      time: '15 min ago',
      icon: '💰',
      read: true
    }
    ]);
  }, []);

  const unreadCount = notificationList.filter(n => !n.read).length;

  const markAsRead = (notificationId) => {
    setNotificationList(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-white">
              AI Compliance Dashboard
            </h2>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-500/20 text-green-300' 
              : 'bg-red-500/20 text-red-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 pulse-dot' : 'bg-red-400'
            }`} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors relative"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-dot">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 bg-black/90 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl z-50"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-lg">🔔 Notifications</h3>
                      <div className="flex items-center space-x-2">
                        {unreadCount > 0 && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notificationList.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer ${
                          !notification.read ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{notification.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-white' : 'text-gray-300'
                              }`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-3 border-t border-gray-700 bg-black/50">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={markAllAsRead}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Mark all as read
                      </button>
                      <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <div className="w-8 h-8 bg-gradient-to-r from-white to-gray-300 rounded-full flex items-center justify-center">
            <span className="text-black text-sm font-medium">CC</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
