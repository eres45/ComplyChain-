import React, { createContext, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error);
    
    const message = error.response?.data?.error || error.message || 'An error occurred';
    toast.error(`API Error: ${message}`);
    
    return Promise.reject(error);
  }
);

export const ApiProvider = ({ children }) => {
  // Agent Status APIs
  const getAgentStatus = async () => {
    try {
      const response = await api.get('/agents/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get agent status: ${error.message}`);
    }
  };

  // Monitor Agent APIs
  const addWallet = async (address, label = '') => {
    try {
      const response = await api.post('/monitor/add-wallet', { address, label });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add wallet: ${error.message}`);
    }
  };

  const startMonitoring = async () => {
    try {
      const response = await api.post('/monitor/start');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to start monitoring: ${error.message}`);
    }
  };

  const stopMonitoring = async () => {
    try {
      const response = await api.post('/monitor/stop');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to stop monitoring: ${error.message}`);
    }
  };

  const getTransactions = async (limit = 50, since = null) => {
    try {
      const params = { limit };
      if (since) params.since = since;
      
      const response = await api.get('/monitor/transactions', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  };

  // Analyst Agent APIs
  const analyzeTransaction = async (transactionData, context = {}) => {
    try {
      const response = await api.post('/analyst/analyze', { transactionData, context });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to analyze transaction: ${error.message}`);
    }
  };

  // Auditor Agent APIs
  const generateReport = async (startDate, endDate, walletAddress = null) => {
    try {
      const response = await api.post('/auditor/generate-report', {
        startDate,
        endDate,
        walletAddress
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate report: ${error.message}`);
    }
  };

  const mintCertificate = async (reportId, recipientAddress) => {
    try {
      const response = await api.post('/auditor/mint-certificate', {
        reportId,
        recipientAddress
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to mint certificate: ${error.message}`);
    }
  };

  const getReports = async () => {
    try {
      const response = await api.get('/auditor/reports');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get reports: ${error.message}`);
    }
  };

  const getReport = async (reportId) => {
    try {
      const response = await api.get(`/auditor/reports/${reportId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get report: ${error.message}`);
    }
  };

  // Demo APIs
  const simulateTransaction = async (walletAddress, walletLabel = '') => {
    try {
      const response = await api.post('/demo/simulate-transaction', {
        walletAddress,
        walletLabel
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to simulate transaction: ${error.message}`);
    }
  };

  const runFullWorkflow = async (walletAddress = 'DemoWallet123...', days = 7) => {
    try {
      const response = await api.post('/demo/full-workflow', {
        walletAddress,
        days
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to run full workflow: ${error.message}`);
    }
  };

  // Health check
  const getHealth = async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  };

  const value = {
    // Agent Status
    getAgentStatus,
    
    // Monitor Agent
    addWallet,
    startMonitoring,
    stopMonitoring,
    getTransactions,
    
    // Analyst Agent
    analyzeTransaction,
    
    // Auditor Agent
    generateReport,
    mintCertificate,
    getReports,
    getReport,
    
    // Demo
    simulateTransaction,
    runFullWorkflow,
    
    // Health
    getHealth,
    
    // Raw API instance for custom requests
    api
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
