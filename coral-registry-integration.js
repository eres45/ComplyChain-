/**
 * ComplyChain Coral Registry Integration
 * Registers all agents as rentable services in the Internet of Agents ecosystem
 */

const MonitorAgentRegistry = require('./agents/monitor-agent/agent-registry');
const AnalystAgentRegistry = require('./agents/analyst-agent/agent-registry');
const AuditorAgentRegistry = require('./agents/auditor-agent/agent-registry');
const { Keypair } = require('@solana/web3.js');

class ComplyChainRegistryManager {
    constructor() {
        this.config = {
            coralRegistryUrl: process.env.CORAL_REGISTRY_URL || 'https://registry.coral.ai',
            solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            publicUrl: process.env.PUBLIC_URL || 'https://complychain.ai',
            agentWallet: this.generateAgentWallet()
        };

        // Initialize agent registries
        this.monitorRegistry = new MonitorAgentRegistry(this.config);
        this.analystRegistry = new AnalystAgentRegistry(this.config);
        this.auditorRegistry = new AuditorAgentRegistry(this.config);
    }

    /**
     * Generate or load agent wallet for payments
     */
    generateAgentWallet() {
        // In production, load from secure storage
        // For demo, generate a new keypair
        return Keypair.generate();
    }

    /**
     * Register all ComplyChain agents in Coral Registry
     */
    async registerAllAgents() {
        console.log('🚀 Registering ComplyChain agents in Coral Registry...');
        
        try {
            // Register Monitor Agent
            console.log('\n📡 Registering Monitor Agent...');
            await this.monitorRegistry.registerAsRentableAgent();
            
            // Register Analyst Agent  
            console.log('\n🧠 Registering Analyst Agent...');
            await this.analystRegistry.registerAsRentableAgent();
            
            // Register Auditor Agent
            console.log('\n📊 Registering Auditor Agent...');
            await this.auditorRegistry.registerAsRentableAgent();

            console.log('\n✅ All ComplyChain agents successfully registered!');
            console.log('\n🎯 Agents are now discoverable and rentable via Coral Protocol');
            console.log(`💰 Payment wallet: ${this.config.agentWallet.publicKey.toString()}`);

            return {
                success: true,
                agents: [
                    { id: 'complychain-monitor-agent', pricing: '0.1 SOL/day' },
                    { id: 'complychain-analyst-agent', pricing: '0.01 SOL/request' },
                    { id: 'complychain-auditor-agent', pricing: '0.05-0.2 SOL/request' }
                ],
                paymentWallet: this.config.agentWallet.publicKey.toString()
            };

        } catch (error) {
            console.error('❌ Failed to register agents:', error.message);
            throw error;
        }
    }

    /**
     * Update agent status across all registries
     */
    async updateAllAgentStatus(status = 'online') {
        try {
            await Promise.all([
                this.monitorRegistry.updateAgentStatus(status),
                this.analystRegistry.updateAgentStatus ? this.analystRegistry.updateAgentStatus(status) : Promise.resolve(),
                this.auditorRegistry.updateAgentStatus ? this.auditorRegistry.updateAgentStatus(status) : Promise.resolve()
            ]);

            console.log(`📊 All agents status updated to: ${status}`);
        } catch (error) {
            console.error('❌ Failed to update agent status:', error.message);
        }
    }

    /**
     * Get rental statistics for all agents
     */
    async getAllRentalStats() {
        try {
            const [monitorStats, analystStats, auditorStats] = await Promise.all([
                this.monitorRegistry.getRentalStats(),
                this.analystRegistry.getRentalStats ? this.analystRegistry.getRentalStats() : null,
                this.auditorRegistry.getRentalStats ? this.auditorRegistry.getRentalStats() : null
            ]);

            return {
                monitor: monitorStats,
                analyst: analystStats,
                auditor: auditorStats,
                summary: {
                    totalRevenue: this.calculateTotalRevenue([monitorStats, analystStats, auditorStats]),
                    activeRentals: this.calculateActiveRentals([monitorStats, analystStats, auditorStats])
                }
            };
        } catch (error) {
            console.error('❌ Failed to get rental stats:', error.message);
            return null;
        }
    }

    calculateTotalRevenue(stats) {
        return stats.reduce((total, stat) => {
            return total + (stat?.totalRevenue || 0);
        }, 0);
    }

    calculateActiveRentals(stats) {
        return stats.reduce((total, stat) => {
            return total + (stat?.activeRentals || 0);
        }, 0);
    }

    /**
     * Handle incoming rental requests
     */
    async handleRentalRequest(agentId, transactionSignature, renterAddress, requestData) {
        try {
            let result;

            switch (agentId) {
                case 'complychain-monitor-agent':
                    result = await this.monitorRegistry.verifyRentalPayment(
                        transactionSignature, 
                        renterAddress, 
                        requestData.rentalDuration
                    );
                    break;

                case 'complychain-analyst-agent':
                    result = await this.analystRegistry.processRentalRequest(
                        transactionSignature,
                        renterAddress,
                        requestData.requestType,
                        requestData
                    );
                    break;

                case 'complychain-auditor-agent':
                    result = await this.auditorRegistry.processRentalRequest(
                        transactionSignature,
                        renterAddress,
                        requestData.serviceType,
                        requestData
                    );
                    break;

                default:
                    throw new Error(`Unknown agent ID: ${agentId}`);
            }

            console.log(`✅ Rental request processed for agent: ${agentId}`);
            return result;

        } catch (error) {
            console.error(`❌ Failed to process rental request for ${agentId}:`, error.message);
            throw error;
        }
    }
}

// Export for use in main application
module.exports = ComplyChainRegistryManager;

// CLI interface for registration
if (require.main === module) {
    const manager = new ComplyChainRegistryManager();
    
    manager.registerAllAgents()
        .then((result) => {
            console.log('\n🎉 Registration complete!');
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Registration failed:', error.message);
            process.exit(1);
        });
}
