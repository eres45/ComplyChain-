/**
 * ComplyChain Monitor Agent
 * Streams Solana blockchain data and monitors wallet transactions in real-time
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const axios = require('axios');

class MonitorAgent {
    constructor(config) {
        this.config = config;
        this.connection = new Connection(config.solanaRpcUrl);
        this.watchedWallets = new Set();
        this.isMonitoring = false;
        this.transactionBuffer = [];
        this.coralServerUrl = config.coralServerUrl;
    }

    /**
     * Initialize the monitor agent and register with Coral Protocol
     */
    async initialize() {
        console.log('🔍 Initializing Monitor Agent...');
        
        // Register agent with Coral Protocol
        await this.registerWithCoral();
        
        // Set up blockchain connection
        await this.setupBlockchainConnection();
        
        console.log('✅ Monitor Agent initialized successfully');
    }

    /**
     * Register this agent with Coral Protocol server
     */
    async registerWithCoral() {
        try {
            const agentConfig = {
                agentId: 'monitor-agent',
                agentDescription: 'Monitors Solana blockchain transactions for compliance violations',
                capabilities: [
                    'blockchain-monitoring',
                    'transaction-parsing',
                    'real-time-streaming',
                    'wallet-tracking'
                ],
                tools: [
                    {
                        name: 'addWallet',
                        description: 'Add a wallet address to monitoring list',
                        parameters: {
                            type: 'object',
                            properties: {
                                address: { type: 'string', description: 'Solana wallet address' },
                                label: { type: 'string', description: 'Human-readable label for the wallet' }
                            },
                            required: ['address']
                        }
                    },
                    {
                        name: 'getTransactions',
                        description: 'Get recent transactions for monitored wallets',
                        parameters: {
                            type: 'object',
                            properties: {
                                limit: { type: 'number', description: 'Number of transactions to return' },
                                since: { type: 'string', description: 'ISO timestamp to filter from' }
                            }
                        }
                    }
                ]
            };

            await axios.post(`${this.coralServerUrl}/agents/register`, agentConfig);
            console.log('📡 Registered with Coral Protocol server');
        } catch (error) {
            console.error('❌ Failed to register with Coral:', error.message);
            throw error;
        }
    }

    /**
     * Set up Solana blockchain connection and verify
     */
    async setupBlockchainConnection() {
        try {
            const version = await this.connection.getVersion();
            console.log(`🔗 Connected to Solana cluster: ${version['solana-core']}`);
            
            const slot = await this.connection.getSlot();
            console.log(`📊 Current slot: ${slot}`);
        } catch (error) {
            console.error('❌ Failed to connect to Solana:', error.message);
            throw error;
        }
    }

    /**
     * Add a wallet address to the monitoring list
     */
    async addWallet(address, label = '') {
        try {
            const publicKey = new PublicKey(address);
            this.watchedWallets.add({
                address: address,
                publicKey: publicKey,
                label: label,
                addedAt: new Date().toISOString()
            });

            console.log(`👁️ Now monitoring wallet: ${address} ${label ? `(${label})` : ''}`);
            
            // Notify other agents via Coral Protocol
            await this.notifyAgents('wallet_added', {
                address,
                label,
                timestamp: new Date().toISOString()
            });

            return { success: true, address, label };
        } catch (error) {
            console.error('❌ Invalid wallet address:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start monitoring blockchain transactions
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ Monitoring already active');
            return;
        }

        console.log('🚀 Starting real-time transaction monitoring...');
        this.isMonitoring = true;

        // Set up WebSocket connection for real-time updates
        this.connection.onAccountChange(
            new PublicKey('11111111111111111111111111111112'), // System program
            this.handleAccountChange.bind(this),
            'confirmed'
        );

        // Poll for new transactions every 5 seconds
        this.monitoringInterval = setInterval(() => {
            this.checkForNewTransactions();
        }, 5000);

        console.log('✅ Real-time monitoring started');
    }

    /**
     * Handle account changes (new transactions)
     */
    async handleAccountChange(accountInfo, context) {
        console.log('📝 Account change detected:', context.slot);
        await this.checkForNewTransactions();
    }

    /**
     * Check for new transactions on monitored wallets
     */
    async checkForNewTransactions() {
        for (const wallet of this.watchedWallets) {
            try {
                const signatures = await this.connection.getSignaturesForAddress(
                    wallet.publicKey,
                    { limit: 10 }
                );

                for (const sig of signatures) {
                    if (!this.hasProcessedTransaction(sig.signature)) {
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
     * Process a new transaction and send to analyst agent
     */
    async processTransaction(transaction, wallet = null) {
        // Handle both real Solana transactions and mock demo transactions
        const signature = transaction.signature || 
                         (transaction.transaction?.signatures?.[0]) || 
                         `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const transactionData = {
            signature: signature,
            slot: transaction.slot || Math.floor(Math.random() * 1000000),
            blockTime: transaction.blockTime || Math.floor(Date.now() / 1000),
            wallet: wallet?.address || 'DemoWallet123456789',
            walletLabel: wallet?.label || 'Demo Wallet',
            fee: transaction.meta?.fee || 5000,
            status: transaction.meta?.err ? 'failed' : 'success',
            instructions: this.parseInstructions(transaction),
            balanceChanges: this.calculateBalanceChanges(transaction),
            timestamp: new Date().toISOString()
        };

        // Add to buffer
        this.transactionBuffer.push(transactionData);

        console.log(`🔍 New transaction detected: ${transactionData.signature.substring(0, 8)}...`);

        // Send to Analyst Agent via Coral Protocol
        await this.notifyAgents('new_transaction', transactionData);

        // Mark as processed
        this.markTransactionProcessed(transactionData.signature);
        
        return transactionData;
    }

    /**
     * Parse transaction instructions
     */
    parseInstructions(transaction) {
        try {
            const instructions = transaction.transaction?.message?.instructions || [];
            return instructions.map((instruction, index) => ({
                programId: instruction.programId?.toString() || instruction.programId || 'Unknown',
                accounts: instruction.accounts?.map(acc => acc.toString()) || [],
                data: instruction.data || 'transfer',
                instructionIndex: index
            }));
        } catch (error) {
            console.error('Error parsing instructions:', error);
            return [{
                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                accounts: [],
                data: 'transfer',
                instructionIndex: 0
            }];
        }
    }

    /**
     * Calculate balance changes from transaction
     */
    calculateBalanceChanges(transaction) {
        try {
            const preBalances = transaction.meta?.preBalances || [];
            const postBalances = transaction.meta?.postBalances || [];
            const accounts = transaction.transaction?.message?.accountKeys || [];

            if (preBalances.length === 0 || postBalances.length === 0) {
                return [{
                    account: 'DemoWallet123456789',
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
            console.error('Error calculating balance changes:', error);
            return [{
                account: 'DemoWallet123456789',
                preBalance: 1000000000,
                postBalance: 999000000,
                change: -1000000
            }];
        }
    }

    /**
     * Check if transaction has been processed
     */
    hasProcessedTransaction(signature) {
        // Simple in-memory cache - in production, use Redis or database
        return this.processedTransactions?.has(signature) || false;
    }

    /**
     * Mark transaction as processed
     */
    markTransactionProcessed(signature) {
        if (!this.processedTransactions) {
            this.processedTransactions = new Set();
        }
        this.processedTransactions.add(signature);
    }

    /**
     * Get recent transactions from buffer
     */
    getRecentTransactions(limit = 50, since = null) {
        let transactions = [...this.transactionBuffer];
        
        if (since) {
            const sinceDate = new Date(since);
            transactions = transactions.filter(tx => new Date(tx.timestamp) > sinceDate);
        }

        return transactions.slice(-limit);
    }

    /**
     * Get transactions (API endpoint method)
     */
    async getTransactions(options = {}) {
        const { limit = 20, since = null } = options;
        return this.getRecentTransactions(limit, since);
    }

    /**
     * Notify other agents via Coral Protocol
     */
    async notifyAgents(eventType, data) {
        try {
            await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
                from: 'monitor-agent',
                eventType,
                data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Failed to notify agents:', error.message);
        }
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;

        console.log('🛑 Stopping transaction monitoring...');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        console.log('✅ Monitoring stopped');
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: 'monitor-agent',
            isMonitoring: this.isMonitoring,
            watchedWallets: Array.from(this.watchedWallets),
            transactionCount: this.transactionBuffer.length,
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = MonitorAgent;
