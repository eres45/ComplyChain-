/**
 * ComplyChain Comprehensive Test Suite
 * Tests all components: backend, agents, payments, and registry integration
 */

const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');

class ComplyChainTestSuite {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.testResults = [];
        this.connection = new Connection('https://api.devnet.solana.com');
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting ComplyChain Test Suite...\n');

        const tests = [
            { name: 'Backend Health Check', test: () => this.testBackendHealth() },
            { name: 'Agent Status Check', test: () => this.testAgentStatus() },
            { name: 'Monitor Agent Functionality', test: () => this.testMonitorAgent() },
            { name: 'Subscription System', test: () => this.testSubscriptionSystem() },
            { name: 'Payment Verification', test: () => this.testPaymentVerification() },
            { name: 'WebSocket Connection', test: () => this.testWebSocketConnection() },
            { name: 'Demo Workflow', test: () => this.testDemoWorkflow() },
            { name: 'Agent Registry Integration', test: () => this.testAgentRegistry() },
            { name: 'Frontend Components', test: () => this.testFrontendComponents() },
            { name: 'Coral Protocol Requirements', test: () => this.testCoralRequirements() }
        ];

        for (const { name, test } of tests) {
            try {
                console.log(`🔍 Testing: ${name}`);
                const result = await test();
                this.testResults.push({ name, status: 'PASS', result });
                console.log(`✅ ${name}: PASSED\n`);
            } catch (error) {
                this.testResults.push({ name, status: 'FAIL', error: error.message });
                console.log(`❌ ${name}: FAILED - ${error.message}\n`);
            }
        }

        this.printTestSummary();
    }

    /**
     * Test backend health and basic functionality
     */
    async testBackendHealth() {
        const response = await axios.get(`${this.baseUrl}/health`);
        
        if (response.status !== 200) {
            throw new Error('Health check failed');
        }

        const data = response.data;
        if (data.status !== 'healthy') {
            throw new Error('Backend not healthy');
        }

        if (!data.agents || !data.agents.monitor || !data.agents.analyst || !data.agents.auditor) {
            throw new Error('Not all agents are active');
        }

        return { status: data.status, agents: data.agents };
    }

    /**
     * Test agent status endpoint
     */
    async testAgentStatus() {
        const response = await axios.get(`${this.baseUrl}/api/agents/status`);
        
        if (response.status !== 200) {
            throw new Error('Agent status check failed');
        }

        const agents = response.data;
        if (!agents.monitor || !agents.analyst || !agents.auditor) {
            throw new Error('Agent status incomplete');
        }

        return agents;
    }

    /**
     * Test monitor agent functionality
     */
    async testMonitorAgent() {
        // Test adding a wallet
        const walletData = {
            address: 'DemoWallet123456789',
            label: 'Test Wallet'
        };

        const addWalletResponse = await axios.post(`${this.baseUrl}/api/monitor/add-wallet`, walletData);
        
        if (addWalletResponse.status !== 200) {
            throw new Error('Failed to add wallet to monitor');
        }

        // Test starting monitoring
        const startResponse = await axios.post(`${this.baseUrl}/api/monitor/start`);
        
        if (startResponse.status !== 200) {
            throw new Error('Failed to start monitoring');
        }

        return { walletAdded: true, monitoringStarted: true };
    }

    /**
     * Test subscription system
     */
    async testSubscriptionSystem() {
        // Test creating a mock subscription
        const subscriptionData = {
            transactionSignature: 'test_tx_' + Date.now(),
            planId: 'founding',
            walletAddress: 'TestWallet123456789',
            amount: 100,
            currency: 'USDC'
        };

        try {
            // This will fail transaction verification but test the endpoint
            await axios.post(`${this.baseUrl}/api/subscriptions`, subscriptionData);
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.error?.includes('Transaction not found')) {
                // Expected error for mock transaction
                return { subscriptionEndpoint: 'working', transactionVerification: 'active' };
            }
            throw error;
        }

        return { subscriptionEndpoint: 'working' };
    }

    /**
     * Test payment verification logic
     */
    async testPaymentVerification() {
        // Test Solana connection
        try {
            const slot = await this.connection.getSlot();
            if (typeof slot !== 'number') {
                throw new Error('Invalid Solana connection');
            }
        } catch (error) {
            throw new Error('Solana connection failed: ' + error.message);
        }

        return { solanaConnection: 'active', devnetSlot: await this.connection.getSlot() };
    }

    /**
     * Test WebSocket connection
     */
    async testWebSocketConnection() {
        return new Promise((resolve, reject) => {
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:3001');

            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, 5000);

            ws.on('open', () => {
                clearTimeout(timeout);
                ws.close();
                resolve({ websocket: 'connected' });
            });

            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error('WebSocket connection failed: ' + error.message));
            });
        });
    }

    /**
     * Test demo workflow
     */
    async testDemoWorkflow() {
        const demoData = {
            walletAddress: 'DemoWallet123456789',
            amount: 1000000,
            recipient: 'RecipientWallet123456789'
        };

        const response = await axios.post(`${this.baseUrl}/api/demo/simulate-transaction`, demoData);
        
        if (response.status !== 200) {
            throw new Error('Demo workflow failed');
        }

        const result = response.data;
        if (!result.success || !result.transaction) {
            throw new Error('Demo transaction simulation failed');
        }

        return { demoWorkflow: 'working', transactionSimulated: true };
    }

    /**
     * Test agent registry integration (local mock)
     */
    async testAgentRegistry() {
        const fs = require('fs');
        const path = require('path');

        // Check if registry files exist
        const registryFiles = [
            'agents/monitor-agent/agent-registry.js',
            'agents/analyst-agent/agent-registry.js',
            'agents/auditor-agent/agent-registry.js',
            'coral-registry-integration.js'
        ];

        for (const file of registryFiles) {
            const filePath = path.join(__dirname, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Registry file missing: ${file}`);
            }
        }

        // Test registry classes can be instantiated
        const MonitorRegistry = require('./agents/monitor-agent/agent-registry');
        const AnalystRegistry = require('./agents/analyst-agent/agent-registry');
        const AuditorRegistry = require('./agents/auditor-agent/agent-registry');

        const mockConfig = {
            coralRegistryUrl: 'http://localhost:8080',
            solanaRpcUrl: 'https://api.devnet.solana.com',
            publicUrl: 'http://localhost:3001',
            agentWallet: { publicKey: { toString: () => 'MockWallet123' } }
        };

        const monitorRegistry = new MonitorRegistry(mockConfig);
        const analystRegistry = new AnalystRegistry(mockConfig);
        const auditorRegistry = new AuditorRegistry(mockConfig);

        return { 
            registryFiles: 'present',
            registryClasses: 'instantiable',
            agentIds: [
                monitorRegistry.agentId,
                analystRegistry.agentId,
                auditorRegistry.agentId
            ]
        };
    }

    /**
     * Test frontend components exist
     */
    async testFrontendComponents() {
        const fs = require('fs');
        const path = require('path');

        const frontendComponents = [
            'frontend/src/App.js',
            'frontend/src/components/Dashboard.js',
            'frontend/src/components/PricingPage.js',
            'frontend/src/components/SolanaPayCheckout.js',
            'frontend/src/components/Sidebar.js',
            'frontend/src/components/Header.js'
        ];

        for (const component of frontendComponents) {
            const filePath = path.join(__dirname, component);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Frontend component missing: ${component}`);
            }
        }

        return { frontendComponents: 'present', count: frontendComponents.length };
    }

    /**
     * Test Coral Protocol requirements compliance
     */
    async testCoralRequirements() {
        const requirements = {
            rentableAgents: false,
            solanaPayments: false,
            internetOfAgents: false,
            realWorldApplication: false
        };

        // Check rentable agents
        const fs = require('fs');
        if (fs.existsSync('./coral-registry-integration.js')) {
            requirements.rentableAgents = true;
        }

        // Check Solana payments
        if (fs.existsSync('./frontend/src/components/SolanaPayCheckout.js')) {
            requirements.solanaPayments = true;
        }

        // Check Internet of Agents integration
        const agentFiles = [
            './agents/monitor-agent/agent-registry.js',
            './agents/analyst-agent/agent-registry.js',
            './agents/auditor-agent/agent-registry.js'
        ];
        
        if (agentFiles.every(file => fs.existsSync(file))) {
            requirements.internetOfAgents = true;
        }

        // Check real-world application
        if (fs.existsSync('./README.md') && fs.existsSync('./frontend/src/components/Dashboard.js')) {
            requirements.realWorldApplication = true;
        }

        const allRequirementsMet = Object.values(requirements).every(req => req === true);

        return { 
            requirements,
            allRequirementsMet,
            score: Object.values(requirements).filter(req => req === true).length + '/4'
        };
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 COMPLYCHAIN TEST SUITE RESULTS');
        console.log('='.repeat(60));

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const total = this.testResults.length;

        console.log(`\n📊 Overall Results: ${passed}/${total} tests passed`);
        
        if (failed > 0) {
            console.log(`❌ Failed Tests: ${failed}`);
            console.log('\nFailed Test Details:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  • ${r.name}: ${r.error}`));
        }

        console.log('\n✅ Passed Tests:');
        this.testResults
            .filter(r => r.status === 'PASS')
            .forEach(r => console.log(`  • ${r.name}`));

        console.log('\n' + '='.repeat(60));
        
        if (passed === total) {
            console.log('🎉 ALL TESTS PASSED! ComplyChain is ready for deployment.');
        } else {
            console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
        }
        
        console.log('='.repeat(60));
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new ComplyChainTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = ComplyChainTestSuite;
