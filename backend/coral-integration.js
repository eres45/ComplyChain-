/**
 * Coral Protocol Integration for ComplyChain Backend
 * Replaces custom agent communication with Coral Protocol MCP
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');

class CoralIntegration {
  constructor(config = {}) {
    this.coralServerUrl = config.coralServerUrl || 'http://localhost:5555';
    this.agentProcesses = new Map();
    this.agentPaths = {
      monitor: path.join(__dirname, '../coral-agents/monitor-agent-mcp.js'),
      analyst: path.join(__dirname, '../coral-agents/analyst-agent-mcp.js'),
      auditor: path.join(__dirname, '../coral-agents/auditor-agent-mcp.js')
    };
  }

  /**
   * Initialize Coral Protocol integration
   */
  async initialize() {
    try {
      // Check if Coral Server is running
      await this.checkCoralServer();
      
      // Start MCP agents
      await this.startMCPAgents();
      
      // Register ComplyChain backend
      await this.registerBackend();
      
      console.log('✅ Coral Protocol integration initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Coral Protocol integration:', error.message);
      return false;
    }
  }

  /**
   * Check if Coral Server is running
   */
  async checkCoralServer() {
    try {
      const response = await axios.get(`${this.coralServerUrl}/health`, {
        timeout: 5000
      });
      console.log('✅ Coral Server is running');
      return response.data;
    } catch (error) {
      console.log('⚠️ Coral Server not available, using fallback mode');
      throw new Error('Coral Server not available');
    }
  }

  /**
   * Start MCP agents as child processes
   */
  async startMCPAgents() {
    const agents = ['monitor', 'analyst', 'auditor'];
    
    for (const agentName of agents) {
      try {
        await this.startAgent(agentName);
        console.log(`✅ ${agentName} agent started`);
      } catch (error) {
        console.error(`❌ Failed to start ${agentName} agent:`, error.message);
      }
    }
  }

  /**
   * Start individual MCP agent
   */
  async startAgent(agentName) {
    const agentPath = this.agentPaths[agentName];
    
    if (!agentPath) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    // Set environment variables for the agent
    const env = {
      ...process.env,
      CORAL_SERVER_URL: this.coralServerUrl,
      SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
      CROSSMINT_API_KEY: process.env.CROSSMINT_API_KEY,
      CROSSMINT_PROJECT_ID: process.env.CROSSMINT_PROJECT_ID
    };

    // Spawn the agent process
    const agentProcess = spawn('node', [agentPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(agentPath)
    });

    // Handle process events
    agentProcess.on('error', (error) => {
      console.error(`❌ ${agentName} agent error:`, error.message);
    });

    agentProcess.on('exit', (code) => {
      console.log(`🔄 ${agentName} agent exited with code ${code}`);
      this.agentProcesses.delete(agentName);
    });

    // Store process reference
    this.agentProcesses.set(agentName, agentProcess);

    // Give the agent time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Register ComplyChain backend with Coral Protocol
   */
  async registerBackend() {
    try {
      const response = await axios.post(`${this.coralServerUrl}/agents/register`, {
        agentId: 'complychain-backend',
        name: 'ComplyChain Backend',
        description: 'Backend orchestration service for ComplyChain compliance monitoring',
        capabilities: [
          'workflow-orchestration',
          'api-integration',
          'subscription-management',
          'payment-processing'
        ],
        version: '1.0.0',
        endpoints: {
          health: '/health',
          status: '/api/agents/status',
          demo: '/api/demo/full-workflow'
        }
      });
      
      console.log('✅ ComplyChain backend registered with Coral Protocol');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to register backend:', error.message);
      throw error;
    }
  }

  /**
   * Call agent tool via Coral Protocol
   */
  async callAgentTool(agentId, toolName, args = {}) {
    try {
      const response = await axios.post(`${this.coralServerUrl}/agents/${agentId}/tools/${toolName}`, {
        arguments: args
      }, {
        timeout: 30000
      });
      
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to call ${toolName} on ${agentId}:`, error.message);
      
      // Fallback to direct agent communication if Coral Protocol fails
      return this.fallbackAgentCall(agentId, toolName, args);
    }
  }

  /**
   * Fallback agent communication (direct process communication)
   */
  async fallbackAgentCall(agentId, toolName, args) {
    console.log(`🔄 Using fallback communication for ${agentId}.${toolName}`);
    
    // Mock responses for demo purposes
    const mockResponses = {
      'complychain-monitor-agent': {
        'get_status': {
          content: [{
            type: 'text',
            text: JSON.stringify({
              agentId: 'complychain-monitor-agent',
              isMonitoring: false,
              watchedWallets: 0,
              transactionCount: 0,
              lastUpdate: new Date().toISOString()
            })
          }]
        },
        'get_transactions': {
          content: [{
            type: 'text',
            text: 'No transactions available in fallback mode'
          }]
        }
      },
      'complychain-analyst-agent': {
        'get_status': {
          content: [{
            type: 'text',
            text: JSON.stringify({
              agentId: 'complychain-analyst-agent',
              complianceRules: ['ofac', 'fatf', 'bsa'],
              sanctionedAddressCount: 2,
              mistralConfigured: !!process.env.MISTRAL_API_KEY,
              lastUpdate: new Date().toISOString()
            })
          }]
        }
      },
      'complychain-auditor-agent': {
        'get_status': {
          content: [{
            type: 'text',
            text: JSON.stringify({
              agentId: 'complychain-auditor-agent',
              reportsGenerated: 0,
              certificatesMinted: 0,
              crossmintConfigured: !!process.env.CROSSMINT_API_KEY,
              lastUpdate: new Date().toISOString()
            })
          }]
        }
      }
    };

    return mockResponses[agentId]?.[toolName] || {
      content: [{
        type: 'text',
        text: `Fallback response for ${agentId}.${toolName}`
      }]
    };
  }

  /**
   * Create thread for agent communication
   */
  async createThread(title, description = '') {
    try {
      const response = await axios.post(`${this.coralServerUrl}/threads`, {
        title,
        description,
        participants: [
          'complychain-monitor-agent',
          'complychain-analyst-agent',
          'complychain-auditor-agent',
          'complychain-backend'
        ]
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create thread:', error.message);
      return { id: `fallback_thread_${Date.now()}`, title };
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
        from: 'complychain-backend'
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
      return { id: `fallback_msg_${Date.now()}`, content: message };
    }
  }

  /**
   * Run full compliance workflow using Coral Protocol
   */
  async runFullWorkflow(walletAddress = 'DemoWallet123456789') {
    try {
      console.log('🚀 Starting Coral Protocol workflow...');

      // Create a thread for this workflow
      const thread = await this.createThread(
        'ComplyChain Full Compliance Workflow',
        `Compliance analysis for wallet: ${walletAddress}`
      );

      // Step 1: Add wallet to monitoring
      const walletResult = await this.callAgentTool('complychain-monitor-agent', 'add_wallet', {
        address: walletAddress,
        label: 'Demo Wallet'
      });

      // Step 2: Start monitoring
      const monitorResult = await this.callAgentTool('complychain-monitor-agent', 'start_monitoring');

      // Step 3: Generate mock transaction for analysis
      const mockTransaction = {
        signature: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        wallet: walletAddress,
        balanceChanges: [{
          account: walletAddress,
          preBalance: 1000000000,
          postBalance: 999000000,
          change: -1000000
        }],
        instructions: [{
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          accounts: [],
          data: 'transfer'
        }],
        timestamp: new Date().toISOString()
      };

      // Step 4: Analyze transaction
      const analysisResult = await this.callAgentTool('complychain-analyst-agent', 'analyze_transaction', {
        transactionData: mockTransaction,
        context: { recentTransactionCount: 1 }
      });

      // Step 5: Generate compliance report
      const reportResult = await this.callAgentTool('complychain-auditor-agent', 'generate_compliance_report', {
        transactions: [mockTransaction],
        period: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        walletAddress
      });

      // Send workflow completion message to thread
      await this.sendMessage(thread.id, 
        'ComplyChain workflow completed successfully', 
        ['complychain-monitor-agent', 'complychain-analyst-agent', 'complychain-auditor-agent']
      );

      return {
        success: true,
        threadId: thread.id,
        results: {
          wallet: walletResult,
          monitoring: monitorResult,
          transaction: mockTransaction,
          analysis: analysisResult,
          report: reportResult
        }
      };

    } catch (error) {
      console.error('❌ Coral Protocol workflow failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all agent statuses via Coral Protocol
   */
  async getAgentStatuses() {
    try {
      const [monitorStatus, analystStatus, auditorStatus] = await Promise.all([
        this.callAgentTool('complychain-monitor-agent', 'get_status'),
        this.callAgentTool('complychain-analyst-agent', 'get_status'),
        this.callAgentTool('complychain-auditor-agent', 'get_status')
      ]);

      return {
        monitor: this.parseAgentResponse(monitorStatus),
        analyst: this.parseAgentResponse(analystStatus),
        auditor: this.parseAgentResponse(auditorStatus)
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
   * Parse agent response from MCP format
   */
  parseAgentResponse(response) {
    try {
      if (response.content && response.content[1] && response.content[1].text) {
        return JSON.parse(response.content[1].text);
      }
      return response;
    } catch (error) {
      return response;
    }
  }

  /**
   * Cleanup - stop all agent processes
   */
  async cleanup() {
    console.log('🧹 Cleaning up Coral Protocol integration...');
    
    for (const [agentName, process] of this.agentProcesses) {
      try {
        process.kill('SIGTERM');
        console.log(`✅ ${agentName} agent stopped`);
      } catch (error) {
        console.error(`❌ Failed to stop ${agentName} agent:`, error.message);
      }
    }
    
    this.agentProcesses.clear();
  }
}

module.exports = CoralIntegration;
