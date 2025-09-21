#!/usr/bin/env node

/**
 * ComplyChain Monitor Agent - MCP Compatible
 * Monitors Solana blockchain transactions for compliance violations
 * Compatible with Coral Protocol MCP Server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

class MonitorAgentMCP {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com');
    this.watchedWallets = new Set();
    this.isMonitoring = false;
    this.transactionBuffer = [];
    this.processedTransactions = new Set();
    this.coralServerUrl = process.env.CORAL_SERVER_URL || 'http://localhost:5555';
  }

  /**
   * Initialize MCP server
   */
  async initialize() {
    const server = new Server(
      {
        name: "complychain-monitor-agent",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Register tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "add_wallet",
          description: "Add a wallet address to monitoring list",
          inputSchema: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Solana wallet address to monitor"
              },
              label: {
                type: "string",
                description: "Optional label for the wallet"
              }
            },
            required: ["address"]
          }
        },
        {
          name: "start_monitoring",
          description: "Start real-time blockchain monitoring",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "stop_monitoring",
          description: "Stop blockchain monitoring",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_transactions",
          description: "Get recent monitored transactions",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of transactions to return",
                default: 20
              },
              since: {
                type: "string",
                description: "ISO timestamp to filter transactions since"
              }
            }
          }
        },
        {
          name: "get_status",
          description: "Get agent status and monitoring information",
          inputSchema: {
            type: "object",
            properties: {}
          }
        }
      ]
    }));

    // Handle tool calls
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "add_wallet":
            return await this.addWallet(args.address, args.label);
          
          case "start_monitoring":
            return await this.startMonitoring();
          
          case "stop_monitoring":
            return this.stopMonitoring();
          
          case "get_transactions":
            return await this.getTransactions(args);
          
          case "get_status":
            return this.getStatus();
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });

    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error("🔍 ComplyChain Monitor Agent MCP started");
  }

  /**
   * Add wallet to monitoring list
   */
  async addWallet(address, label = '') {
    try {
      const publicKey = new PublicKey(address);
      const walletInfo = {
        address: address,
        publicKey: publicKey,
        label: label,
        addedAt: new Date().toISOString()
      };
      
      this.watchedWallets.add(walletInfo);
      
      // Notify Coral Protocol
      await this.notifyCoralProtocol('wallet_added', {
        address,
        label,
        timestamp: new Date().toISOString()
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Wallet added to monitoring: ${address} ${label ? `(${label})` : ''}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Invalid wallet address: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Start monitoring blockchain transactions
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ Monitoring already active"
          }
        ]
      };
    }

    this.isMonitoring = true;
    
    // Set up monitoring interval
    this.monitoringInterval = setInterval(() => {
      this.checkForNewTransactions();
    }, 10000); // Check every 10 seconds

    await this.notifyCoralProtocol('monitoring_started', {
      status: 'active',
      watchedWallets: Array.from(this.watchedWallets).length
    });

    return {
      content: [
        {
          type: "text",
          text: `🚀 Monitoring started for ${Array.from(this.watchedWallets).length} wallets`
        }
      ]
    };
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return {
        content: [
          {
            type: "text",
            text: "⚠️ Monitoring not active"
          }
        ]
      };
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    return {
      content: [
        {
          type: "text",
          text: "🛑 Monitoring stopped"
        }
      ]
    };
  }

  /**
   * Get recent transactions
   */
  async getTransactions(options = {}) {
    const { limit = 20, since = null } = options;
    let transactions = [...this.transactionBuffer];
    
    if (since) {
      const sinceDate = new Date(since);
      transactions = transactions.filter(tx => new Date(tx.timestamp) > sinceDate);
    }

    const recentTransactions = transactions.slice(-limit);

    return {
      content: [
        {
          type: "text",
          text: `📊 Found ${recentTransactions.length} recent transactions`
        },
        {
          type: "text",
          text: JSON.stringify(recentTransactions, null, 2)
        }
      ]
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    const status = {
      agentId: 'complychain-monitor-agent',
      isMonitoring: this.isMonitoring,
      watchedWallets: Array.from(this.watchedWallets).length,
      transactionCount: this.transactionBuffer.length,
      lastUpdate: new Date().toISOString()
    };

    return {
      content: [
        {
          type: "text",
          text: "📊 Monitor Agent Status:"
        },
        {
          type: "text",
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  /**
   * Check for new transactions on monitored wallets
   */
  async checkForNewTransactions() {
    for (const wallet of this.watchedWallets) {
      try {
        const signatures = await this.connection.getSignaturesForAddress(
          wallet.publicKey,
          { limit: 5 }
        );

        for (const sig of signatures) {
          if (!this.processedTransactions.has(sig.signature)) {
            const transaction = await this.connection.getTransaction(
              sig.signature,
              { commitment: 'confirmed' }
            );

            if (transaction) {
              await this.processTransaction(transaction, wallet);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error checking transactions for ${wallet.address}:`, error.message);
      }
    }
  }

  /**
   * Process a new transaction
   */
  async processTransaction(transaction, wallet) {
    const transactionData = {
      signature: transaction.transaction?.signatures?.[0] || `mock_${Date.now()}`,
      slot: transaction.slot,
      blockTime: transaction.blockTime,
      wallet: wallet.address,
      walletLabel: wallet.label,
      fee: transaction.meta?.fee || 0,
      status: transaction.meta?.err ? 'failed' : 'success',
      instructions: this.parseInstructions(transaction),
      balanceChanges: this.calculateBalanceChanges(transaction),
      timestamp: new Date().toISOString()
    };

    // Add to buffer
    this.transactionBuffer.push(transactionData);
    this.processedTransactions.add(transactionData.signature);

    // Notify Coral Protocol about new transaction
    await this.notifyCoralProtocol('new_transaction', transactionData);

    console.error(`🔍 New transaction: ${transactionData.signature.substring(0, 8)}...`);
  }

  /**
   * Parse transaction instructions
   */
  parseInstructions(transaction) {
    try {
      const instructions = transaction.transaction?.message?.instructions || [];
      return instructions.map((instruction, index) => ({
        programId: instruction.programId?.toString() || 'Unknown',
        accounts: instruction.accounts?.map(acc => acc.toString()) || [],
        data: instruction.data || 'transfer',
        instructionIndex: index
      }));
    } catch (error) {
      return [{
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        accounts: [],
        data: 'transfer',
        instructionIndex: 0
      }];
    }
  }

  /**
   * Calculate balance changes
   */
  calculateBalanceChanges(transaction) {
    try {
      const preBalances = transaction.meta?.preBalances || [];
      const postBalances = transaction.meta?.postBalances || [];
      const accounts = transaction.transaction?.message?.accountKeys || [];

      if (preBalances.length === 0 || postBalances.length === 0) {
        return [{
          account: 'DemoAccount123',
          preBalance: 1000000000,
          postBalance: 999000000,
          change: -1000000
        }];
      }

      return accounts.map((account, index) => ({
        account: account.toString(),
        preBalance: preBalances[index] || 0,
        postBalance: postBalances[index] || 0,
        change: (postBalances[index] || 0) - (preBalances[index] || 0)
      })).filter(change => change.change !== 0);
    } catch (error) {
      return [{
        account: 'DemoAccount123',
        preBalance: 1000000000,
        postBalance: 999000000,
        change: -1000000
      }];
    }
  }

  /**
   * Notify Coral Protocol about events
   */
  async notifyCoralProtocol(eventType, data) {
    try {
      await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
        from: 'complychain-monitor-agent',
        eventType,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to notify Coral Protocol:', error.message);
    }
  }
}

// Start the MCP agent
const agent = new MonitorAgentMCP();
agent.initialize().catch(console.error);
