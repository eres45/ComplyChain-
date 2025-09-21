import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { 
  DocumentTextIcon, 
  ShieldCheckIcon, 
  CalendarIcon,
  ArrowDownTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const ComplianceReports = () => {
  const { getReports, generateReport, mintCertificate } = useApi();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [minting, setMinting] = useState({});

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await generateReport(startDate, endDate);
      await loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleMintCertificate = async (reportId) => {
    try {
      setMinting(prev => ({ ...prev, [reportId]: true }));
      await mintCertificate(reportId, 'DemoWallet123...');
    } catch (error) {
      console.error('Failed to mint certificate:', error);
    } finally {
      setMinting(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 gradient-text">
            📋 Compliance Reports
          </h1>
          <p className="text-gray-300 text-lg">Generate and manage regulatory compliance reports with NFT certificates</p>
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot"></div>
              <span>Audit Trail: Active</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>🔗 Crossmint Integration: Ready</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
        >
          <DocumentTextIcon className="h-4 w-4" />
          <span>{generating ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="bg-black/40 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
          📊 Generated Reports
          <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full">
            {reports.length} Reports
          </span>
        </h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 mb-2">No reports generated yet</p>
            <p className="text-gray-500 text-sm">Click "Generate Report" to create your first compliance report</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-black/40 border border-gray-700 rounded-lg hover:bg-black/60 hover:border-gray-600 transition-all duration-200 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h4 className="text-white font-semibold">Report {report.id}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(report.summary?.riskLevel)}`}>
                        {report.summary?.riskLevel || 'Unknown'} Risk
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Period</p>
                        <p className="text-white font-medium">
                          {new Date(report.period?.startDate).toLocaleDateString()} - {new Date(report.period?.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Transactions</p>
                        <p className="text-white font-medium">{report.summary?.totalTransactions || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Compliance Score</p>
                        <p className="text-white font-medium">{report.summary?.complianceScore?.toFixed(1) || 0}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Violations</p>
                        <p className="text-white font-medium">{report.summary?.violationsFound || 0}</p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm">
                      Generated on {new Date(report.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMintCertificate(report.id)}
                      disabled={minting[report.id]}
                      className="px-3 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      <span>{minting[report.id] ? 'Minting...' : 'Mint NFT'}</span>
                    </button>
                  </div>
                </div>
                
                {/* Executive Summary */}
                {report.executiveSummary && (
                  <div className="mt-4 p-4 bg-black/40 border border-gray-700 rounded-lg backdrop-blur-sm">
                    <h5 className="text-white font-medium mb-2">Executive Summary</h5>
                    <p className="text-gray-300 text-sm mb-2">{report.executiveSummary.overview}</p>
                    <div className="flex flex-wrap gap-2">
                      {report.executiveSummary.keyFindings?.map((finding, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 border border-gray-600 text-gray-300 rounded text-xs">
                          {finding}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 border border-gray-700 rounded-xl p-6 text-center backdrop-blur-sm hover:bg-black/60 hover:border-gray-600 transition-all duration-200">
          <DocumentTextIcon className="h-8 w-8 text-purple-400 mx-auto mb-3" />
          <p className="text-2xl font-bold text-white">{reports.length}</p>
          <p className="text-gray-400">Total Reports</p>
        </div>
        
        <div className="bg-black/40 border border-gray-700 rounded-xl p-6 text-center backdrop-blur-sm hover:bg-black/60 hover:border-gray-600 transition-all duration-200">
          <ShieldCheckIcon className="h-8 w-8 text-green-400 mx-auto mb-3" />
          <p className="text-2xl font-bold text-white">
            {reports.length > 0 ? (reports.reduce((sum, r) => sum + (r.summary?.complianceScore || 0), 0) / reports.length).toFixed(1) : 0}%
          </p>
          <p className="text-gray-400">Avg Compliance</p>
        </div>
        
        <div className="bg-black/40 border border-gray-700 rounded-xl p-6 text-center backdrop-blur-sm hover:bg-black/60 hover:border-gray-600 transition-all duration-200">
          <CalendarIcon className="h-8 w-8 text-blue-400 mx-auto mb-3" />
          <p className="text-2xl font-bold text-white">
            {reports.reduce((sum, r) => sum + (r.summary?.totalTransactions || 0), 0)}
          </p>
          <p className="text-gray-400">Total Transactions</p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReports;
