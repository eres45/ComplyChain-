import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './components/Dashboard';
import AgentStatus from './components/AgentStatus';
import TransactionMonitor from './components/TransactionMonitor';
import ComplianceReports from './components/ComplianceReports';
import Settings from './components/Settings';
import PricingPage from './components/PricingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ApiProvider } from './contexts/ApiContext';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ApiProvider>
      <WebSocketProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                },
              }}
            />
            
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            
            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
              {/* Header */}
              <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              
              {/* Page content */}
              <main className="p-6">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/agents" element={<AgentStatus />} />
                  <Route path="/monitor" element={<TransactionMonitor />} />
                  <Route path="/reports" element={<ComplianceReports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/pricing" element={<PricingPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </WebSocketProvider>
    </ApiProvider>
  );
}

export default App;
