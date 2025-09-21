/**
 * Coral Protocol Client Integration
 * Connects ComplyChain frontend to Coral Protocol MCP agents
 */

import axios from 'axios';

class CoralProtocolClient {
  constructor(coralServerUrl = 'http://localhost:5555') {
    this.coralServerUrl = coralServerUrl;
    this.agents = {
      monitor: 'complychain-monitor-agent',
      analyst: 'complychain-analyst-agent',
      auditor: 'complychain-auditor-agent'
    };
  }

  /**
   * Initialize connection to Coral Protocol
   */
  async initialize() {
    try {
      const response = await axios.get(`${this.coralServerUrl}/health`);
      console.log('✅ Connected to Coral Protocol Server');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to connect to Coral Protocol:', error.message);
      throw error;
    }
  }

  /**
   * Call a tool on a specific agent
   */
  async callAgentTool(agentId, toolName, args = {}) {
    try {
      const response = await axios.post(`${this.coralServerUrl}/agents/${agentId}/tools/${toolName}`, {
        arguments: args
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to call ${toolName} on ${agentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Monitor Agent Methods
   */
  async addWallet(address, label = '') {
    return this.callAgentTool(this.agents.monitor, 'add_wallet', {
      address,
      label
    });
  }

  async startMonitoring() {
    return this.callAgentTool(this.agents.monitor, 'start_monitoring');
  }

  async stopMonitoring() {
    return this.callAgentTool(this.agents.monitor, 'stop_monitoring');
  }

  async getTransactions(limit = 20, since = null) {
    return this.callAgentTool(this.agents.monitor, 'get_transactions', {
      limit,
      since
    });
  }

  async getMonitorStatus() {
    return this.callAgentTool(this.agents.monitor, 'get_status');
  }

  /**
   * Analyst Agent Methods
   */
  async analyzeTransaction(transactionData, context = {}) {
    return this.callAgentTool(this.agents.analyst, 'analyze_transaction', {
      transactionData,
      context
    });
  }

  async screenAddress(address) {
    return this.callAgentTool(this.agents.analyst, 'screen_address', {
      address
    });
  }

  async generateRiskReport(transactions, timeframe = '24h') {
    return this.callAgentTool(this.agents.analyst, 'generate_risk_report', {
      transactions,
      timeframe
    });
  }

  async getComplianceRules() {
    return this.callAgentTool(this.agents.analyst, 'get_compliance_rules');
  }

  async getAnalystStatus() {
    return this.callAgentTool(this.agents.analyst, 'get_status');
  }

  /**
   * Auditor Agent Methods
   */
  async generateComplianceReport(options = {}) {
    return this.callAgentTool(this.agents.auditor, 'generate_compliance_report', options);
  }

  async mintComplianceCertificate(reportId, recipientAddress) {
    return this.callAgentTool(this.agents.auditor, 'mint_compliance_certificate', {
      reportId,
      recipientAddress
    });
  }

  async calculateComplianceMetrics(transactions, analysisResults = []) {
    return this.callAgentTool(this.agents.auditor, 'calculate_compliance_metrics', {
      transactions,
      analysisResults
    });
  }

  async getReports(limit = 50) {
    return this.callAgentTool(this.agents.auditor, 'get_reports', {
      limit
    });
  }

  async getReport(reportId) {
    return this.callAgentTool(this.agents.auditor, 'get_report', {
      reportId
    });
  }

  async getAuditorStatus() {
    return this.callAgentTool(this.agents.auditor, 'get_status');
  }

  /**
   * Multi-Agent Workflows
   */
  async runFullComplianceWorkflow(walletAddress = 'DemoWallet123456789') {
    try {
      console.log('🚀 Starting full compliance workflow...');

      // Step 1: Add wallet to monitoring
      const walletResult = await this.addWallet(walletAddress, 'Demo Wallet');
      console.log('✅ Wallet added:', walletResult);

      // Step 2: Start monitoring
      const monitorResult = await this.startMonitoring();
      console.log('✅ Monitoring started:', monitorResult);

      // Step 3: Get recent transactions
      const transactions = await this.getTransactions(5);
      console.log('✅ Transactions retrieved:', transactions);

      // Step 4: Analyze transactions
      const analysisResults = [];
      if (transactions.content && transactions.content[1]) {
        const txData = JSON.parse(transactions.content[1].text);
        for (const tx of txData.slice(0, 3)) {
          const analysis = await this.analyzeTransaction(tx, {
            recentTransactionCount: txData.length
          });
          analysisResults.push(analysis);
        }
      }

      // Step 5: Generate compliance report
      const reportResult = await this.generateComplianceReport({
        transactions: transactions.content ? JSON.parse(transactions.content[1].text) : [],
        period: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        walletAddress
      });

      // Step 6: Mint compliance certificate (demo)
      if (reportResult.content && reportResult.content[1]) {
        const reportData = JSON.parse(reportResult.content[1].text);
        const certificateResult = await this.mintComplianceCertificate(
          reportData.id,
          walletAddress
        );
        console.log('✅ Certificate minted:', certificateResult);
      }

      return {
        success: true,
        results: {
          wallet: walletResult,
          monitoring: monitorResult,
          transactions,
          analyses: analysisResults,
          report: reportResult
        }
      };

    } catch (error) {
      console.error('❌ Workflow failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all agent statuses
   */
  async getAllAgentStatuses() {
    try {
      const [monitorStatus, analystStatus, auditorStatus] = await Promise.all([
        this.getMonitorStatus(),
        this.getAnalystStatus(),
        this.getAuditorStatus()
      ]);

      return {
        monitor: monitorStatus,
        analyst: analystStatus,
        auditor: auditorStatus
      };
    } catch (error) {
      console.error('❌ Failed to get agent statuses:', error.message);
      return {
        monitor: { error: error.message },
        analyst: { error: error.message },
        auditor: { error: error.message }
      };
    }
  }

  /**
   * Create a new thread for agent communication
   */
  async createThread(title, description = '') {
    try {
      const response = await axios.post(`${this.coralServerUrl}/threads`, {
        title,
        description,
        participants: Object.values(this.agents)
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create thread:', error.message);
      throw error;
    }
  }

  /**
   * Send message to thread
   */
  async sendMessage(threadId, message, mentions = []) {
    try {
      const response = await axios.post(`${this.coralServerUrl}/threads/${threadId}/messages`, {
        content: message,
        mentions,
        from: 'complychain-frontend'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
      throw error;
    }
  }

  /**
   * Get thread messages
   */
  async getThreadMessages(threadId, limit = 50) {
    try {
      const response = await axios.get(`${this.coralServerUrl}/threads/${threadId}/messages?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get thread messages:', error.message);
      throw error;
    }
  }

  /**
   * Register ComplyChain as an agent in the system
   */
  async registerComplyChainApp() {
    try {
      const response = await axios.post(`${this.coralServerUrl}/agents/register`, {
        agentId: 'complychain-frontend',
        name: 'ComplyChain Frontend',
        description: 'Web interface for ComplyChain compliance monitoring system',
        capabilities: [
          'user-interface',
          'workflow-orchestration',
          'payment-processing',
          'subscription-management'
        ],
        version: '1.0.0'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to register ComplyChain app:', error.message);
      throw error;
    }
  }
}

export default CoralProtocolClient;
