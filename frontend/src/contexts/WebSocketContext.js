import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}`
        : 'ws://localhost:3001';
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setSocket(ws);
        reconnectAttemptsRef.current = 0;
        toast.success('Connected to ComplyChain agents');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);
          
          setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
          
          handleMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast.error('Connection lost. Please refresh the page.');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        toast.error('Connection error occurred');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      toast.error('Failed to connect to server');
    }
  };

  const handleMessage = (message) => {
    switch (message.type) {
      case 'connection_established':
        setAgentStatus(message.agents || {});
        break;
        
      case 'status_update':
        setAgentStatus(message.data || {});
        break;
        
      case 'new_transaction':
        toast.success(`New transaction detected: ${message.data.signature?.substring(0, 8)}...`);
        break;
        
      case 'analysis_complete':
        const analysis = message.data;
        if (analysis.complianceStatus === 'violation') {
          toast.error(`Compliance violation detected: ${analysis.violations[0]?.message}`);
        } else if (analysis.complianceStatus === 'warning') {
          toast.error(`Compliance warning: ${analysis.warnings[0]?.message}`);
        } else {
          toast.success(`Transaction analysis complete - Status: ${analysis.complianceStatus}`);
        }
        break;
        
      case 'report_generated':
        toast.success(`Compliance report generated: ${message.data.reportId}`);
        break;
        
      case 'certificate_minted':
        toast.success(`Compliance certificate minted: ${message.data.certificateId}`);
        break;
        
      case 'wallet_added':
        toast.success(`Wallet added to monitoring: ${message.data.address?.substring(0, 8)}...`);
        break;
        
      case 'monitoring_started':
        toast.success('Real-time monitoring started');
        break;
        
      case 'workflow_complete':
        toast.success('Full compliance workflow completed successfully');
        break;
        
      case 'error':
        toast.error(`Error: ${message.message}`);
        break;
        
      default:
        console.log('📨 Unhandled message type:', message.type);
    }
  };

  const sendMessage = (type, data = {}) => {
    if (socket && isConnected) {
      const message = { type, data, timestamp: new Date().toISOString() };
      socket.send(JSON.stringify(message));
      return true;
    } else {
      toast.error('Not connected to server');
      return false;
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.close(1000, 'User disconnected');
    }
  };

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    messages,
    agentStatus,
    sendMessage,
    connect,
    disconnect
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
