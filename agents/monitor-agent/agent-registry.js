/**
 * ComplyChain Monitor Agent - Coral Registry Integration
 * Makes the Monitor Agent discoverable and rentable via Coral Protocol
 */

const axios = require('axios');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');

class MonitorAgentRegistry {
    constructor(config) {
        this.config = config;
        this.agentId = 'complychain-monitor-agent';
        this.coralRegistryUrl = config.coralRegistryUrl || 'https://registry.coral.ai';
        this.solanaConnection = new Connection(config.solanaRpcUrl);
        this.agentWallet = config.agentWallet; // Agent's Solana wallet for payments
    }

    /**
     * Register agent in Coral Registry as rentable service
     */
    async registerAsRentableAgent() {
        try {
            const agentMetadata = {
                agentId: this.agentId,
                name: 'ComplyChain Monitor Agent',
                description: 'Real-time Solana blockchain transaction monitoring for compliance',
                version: '1.0.0',
                category: 'compliance',
                tags: ['blockchain', 'monitoring', 'compliance', 'solana', 'transactions'],
                
                // Rental Configuration
                rental: {
                    enabled: true,
                    pricing: {
                        model: 'usage-based',
                        basePrice: 0.1, // 0.1 SOL per day
                        currency: 'SOL',
                        billingCycle: 'daily'
                    },
                    paymentAddress: this.agentWallet.publicKey.toString(),
                    maxConcurrentRentals: 10
                },

                // Agent Capabilities
                capabilities: [
                    {
                        name: 'addWallet',
                        description: 'Add a Solana wallet address to monitoring list',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                address: { type: 'string', description: 'Solana wallet address to monitor' },
                                label: { type: 'string', description: 'Human-readable label for the wallet' }
                            },
                            required: ['address']
                        },
                        outputSchema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                walletId: { type: 'string' },
                                message: { type: 'string' }
                            }
                        }
                    },
                    {
                        name: 'getTransactions',
                        description: 'Retrieve recent transactions for monitored wallets',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                walletId: { type: 'string', description: 'Wallet ID to get transactions for' },
                                limit: { type: 'number', description: 'Number of transactions to return', default: 50 },
                                since: { type: 'string', description: 'ISO timestamp to filter from' }
                            }
                        },
                        outputSchema: {
                            type: 'object',
                            properties: {
                                transactions: { type: 'array' },
                                count: { type: 'number' },
                                hasMore: { type: 'boolean' }
                            }
                        }
                    },
                    {
                        name: 'startMonitoring',
                        description: 'Start real-time monitoring for added wallets',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                webhookUrl: { type: 'string', description: 'URL to receive transaction notifications' }
                            }
                        },
                        outputSchema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                monitoringId: { type: 'string' },
                                status: { type: 'string' }
                            }
                        }
                    }
                ],

                // Technical Requirements
                requirements: {
                    minRentalDuration: '1 day',
                    maxRentalDuration: '30 days',
                    supportedNetworks: ['solana-mainnet', 'solana-devnet'],
                    apiEndpoint: `${this.config.publicUrl}/api/agents/monitor`,
                    healthCheck: `${this.config.publicUrl}/api/agents/monitor/health`
                },

                // Contact and Support
                contact: {
                    developer: 'ComplyChain Team',
                    email: 'agents@complychain.ai',
                    documentation: 'https://docs.complychain.ai/agents/monitor',
                    support: 'https://support.complychain.ai'
                },

                // Performance Metrics
                metrics: {
                    averageResponseTime: '< 100ms',
                    uptime: '99.9%',
                    maxTransactionsPerSecond: 1000,
                    dataRetention: '90 days'
                }
            };

            // Register with Coral Registry
            const response = await axios.post(`${this.coralRegistryUrl}/agents/register`, agentMetadata, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Signature': await this.signAgentMetadata(agentMetadata)
                }
            });

            console.log('✅ Monitor Agent registered in Coral Registry');
            console.log(`📋 Agent ID: ${this.agentId}`);
            console.log(`💰 Rental Price: ${agentMetadata.rental.pricing.basePrice} SOL/day`);
            
            return response.data;

        } catch (error) {
            console.error('❌ Failed to register agent in Coral Registry:', error.message);
            throw error;
        }
    }

    /**
     * Handle rental payment verification
     */
    async verifyRentalPayment(transactionSignature, renterAddress, rentalDuration) {
        try {
            // Verify payment transaction on Solana
            const transaction = await this.solanaConnection.getTransaction(transactionSignature, {
                commitment: 'confirmed'
            });

            if (!transaction) {
                throw new Error('Transaction not found or not confirmed');
            }

            // Calculate expected payment amount
            const dailyRate = 0.1; // 0.1 SOL per day
            const expectedAmount = dailyRate * rentalDuration;
            const actualAmount = transaction.meta.postBalances[1] - transaction.meta.preBalances[1];

            if (actualAmount < expectedAmount * 1e9) { // Convert to lamports
                throw new Error(`Insufficient payment. Expected: ${expectedAmount} SOL, Received: ${actualAmount / 1e9} SOL`);
            }

            // Create rental session
            const rentalSession = {
                sessionId: `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                renterAddress,
                transactionSignature,
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + (rentalDuration * 24 * 60 * 60 * 1000)).toISOString(),
                status: 'active',
                capabilities: ['addWallet', 'getTransactions', 'startMonitoring']
            };

            console.log(`🎉 Rental session created: ${rentalSession.sessionId}`);
            console.log(`👤 Renter: ${renterAddress}`);
            console.log(`⏰ Duration: ${rentalDuration} days`);

            return rentalSession;

        } catch (error) {
            console.error('❌ Rental payment verification failed:', error.message);
            throw error;
        }
    }

    /**
     * Sign agent metadata for registry verification
     */
    async signAgentMetadata(metadata) {
        // In production, use proper cryptographic signing
        // For demo, return a mock signature
        const dataString = JSON.stringify(metadata);
        return Buffer.from(dataString).toString('base64').slice(0, 64);
    }

    /**
     * Update agent status in registry
     */
    async updateAgentStatus(status, metrics = {}) {
        try {
            const statusUpdate = {
                agentId: this.agentId,
                status, // 'online', 'offline', 'maintenance'
                timestamp: new Date().toISOString(),
                metrics: {
                    activeRentals: metrics.activeRentals || 0,
                    totalRequests: metrics.totalRequests || 0,
                    averageResponseTime: metrics.averageResponseTime || 0,
                    uptime: metrics.uptime || '99.9%'
                }
            };

            await axios.put(`${this.coralRegistryUrl}/agents/${this.agentId}/status`, statusUpdate);
            console.log(`📊 Agent status updated: ${status}`);

        } catch (error) {
            console.error('❌ Failed to update agent status:', error.message);
        }
    }

    /**
     * Get agent rental statistics
     */
    async getRentalStats() {
        try {
            const response = await axios.get(`${this.coralRegistryUrl}/agents/${this.agentId}/stats`);
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get rental stats:', error.message);
            return null;
        }
    }
}

module.exports = MonitorAgentRegistry;
