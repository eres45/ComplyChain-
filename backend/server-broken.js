/**
 * ComplyChain Backend API Server
 * Coordinates AI agents and provides REST API for frontend
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

// Import agents
const MonitorAgent = require('../agents/monitor-agent/monitor-agent');
const AnalystAgent = require('../agents/analyst-agent/analyst-agent');
const AuditorAgent = require('../agents/auditor-agent/auditor-agent');

class ComplyChainServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = process.env.PORT || 3001;
        
        // Initialize agents
        this.agents = {};
        this.initializeAgents();
        
        // Setup middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup WebSocket
        this.setupWebSocket();
    }

    /**
     * Initialize AI agents
     */
    async initializeAgents() {
        const agentConfig = {
            coralServerUrl: process.env.CORAL_SERVER_URL || 'http://localhost:5555',
            solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
            mistralApiKey: process.env.MISTRAL_API_KEY,
            crossmintApiKey: process.env.CROSSMINT_API_KEY,
            crossmintProjectId: process.env.CROSSMINT_PROJECT_ID
        };

        try {
            console.log('🚀 Initializing ComplyChain agents...');
            
            this.agents.monitor = new MonitorAgent(agentConfig);
            this.agents.analyst = new AnalystAgent(agentConfig);
            this.agents.auditor = new AuditorAgent(agentConfig);

            // Initialize all agents
            await Promise.all([
                this.agents.monitor.initialize(),
                this.agents.analyst.initialize(),
                this.agents.auditor.initialize()
            ]);

            console.log('✅ All agents initialized successfully');
        } catch (error) {
            console.error('❌ Agent initialization failed:', error.message);
        }
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                agents: {
                    monitor: this.agents.monitor ? 'active' : 'inactive',
                    analyst: this.agents.analyst ? 'active' : 'inactive',
                    auditor: this.agents.auditor ? 'active' : 'inactive'
                }
            });
        });

        // Agent status endpoints
        this.app.get('/api/agents/status', async (req, res) => {
            try {
                const status = {
                    monitor: this.agents.monitor?.getStatus(),
                    analyst: this.agents.analyst?.getStatus(),
                    auditor: this.agents.auditor?.getStatus()
                };
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Monitor Agent endpoints
        this.app.post('/api/monitor/add-wallet', async (req, res) => {
            try {
                const { address, label } = req.body;
                const result = await this.agents.monitor.addWallet(address, label);
                
                // Broadcast to WebSocket clients
                this.broadcast('wallet_added', result);
                
                res.json(result);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        this.app.post('/api/monitor/start', async (req, res) => {
            try {
                await this.agents.monitor.startMonitoring();
                res.json({ message: 'Monitoring started', status: 'active' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/monitor/stop', async (req, res) => {
            try {
                this.agents.monitor.stopMonitoring();
                res.json({ message: 'Monitoring stopped', status: 'inactive' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/monitor/transactions', async (req, res) => {
            try {
                const { limit = 50, since } = req.query;
                const transactions = this.agents.monitor.getRecentTransactions(
                    parseInt(limit), 
                    since
                );
                res.json(transactions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Analyst Agent endpoints
        this.app.post('/api/analyst/analyze', async (req, res) => {
            try {
                const { transactionData, context } = req.body;
                const analysis = await this.agents.analyst.analyzeTransaction(
                    transactionData, 
                    context
                );
                
                // Broadcast analysis result
                this.broadcast('analysis_complete', analysis);
                
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Auditor Agent endpoints
        this.app.post('/api/auditor/generate-report', async (req, res) => {
            try {
                const { startDate, endDate, walletAddress } = req.body;
                const report = await this.agents.auditor.generateReport(
                    startDate, 
                    endDate, 
                    walletAddress
                );
                
                // Broadcast report generation
                this.broadcast('report_generated', { 
                    reportId: report.id, 
                    summary: report.summary 
                });
                
                res.json(report);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/auditor/mint-certificate', async (req, res) => {
            try {
                const { reportId, recipientAddress } = req.body;
                const certificate = await this.agents.auditor.mintCertificate(
                    reportId, 
                    recipientAddress
                );
                
                // Broadcast certificate minting
                this.broadcast('certificate_minted', certificate);
                
                res.json(certificate);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/auditor/reports', async (req, res) => {
            try {
                const reports = this.agents.auditor.getAllReports();
                res.json(reports);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/auditor/reports/:reportId', async (req, res) => {
            try {
                const { reportId } = req.params;
                const report = this.agents.auditor.getReport(reportId);
                
                if (!report) {
                    return res.status(404).json({ error: 'Report not found' });
                }
                
                res.json(report);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Demo endpoints for hackathon presentation
        this.app.post('/api/demo/simulate-transaction', async (req, res) => {
            try {
                const { walletAddress, amount, recipient } = req.body;
                
                // Simulate transaction data
                const mockTransaction = {
                    signature: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    slot: Math.floor(Math.random() * 1000000),
                    blockTime: Math.floor(Date.now() / 1000),
                    transaction: {
                        message: {
                            accountKeys: [walletAddress, recipient],
                            instructions: [{
                                programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
                                accounts: [0, 1],
                                data: 'transfer'
                            }]
                        }
                    },
                    meta: {
                        fee: 5000,
                        preBalances: [1000000000, 500000000],
                        postBalances: [1000000000 - amount - 5000, 500000000 + amount],
                        logMessages: ['Program log: Transfer complete']
                    }
                };

                // Process through agents
                await this.agents.monitor.processTransaction(mockTransaction);
                
                this.broadcast('demo_transaction', mockTransaction);
                res.json({ success: true, transaction: mockTransaction });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/demo/full-workflow', async (req, res) => {
            try {
                // Simulate complete workflow for demo
                const { walletAddress = 'DemoWallet123...', days = 7 } = req.body;
                
                // 1. Add wallet to monitoring
                await this.agents.monitor.addWallet(walletAddress, 'Demo Wallet');
                
                // 2. Generate report for past period
                const endDate = new Date().toISOString();
                const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();
                
                const report = await this.agents.auditor.generateReport(startDate, endDate, walletAddress);
                
                // 3. Mint compliance certificate
                const certificate = await this.agents.auditor.mintCertificate(report.id, walletAddress);
                
                // Broadcast workflow completion
                this.broadcast('workflow_complete', {
                    walletAddress,
                    report: report.summary,
                    certificate: certificate
                });

                res.json({
                    message: 'Full workflow completed',
                    walletAddress,
                    report: report.summary,
                    certificate: certificate
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Subscription endpoints for Phase 2 monetization
        this.setupSubscriptionRoutes();

        // Serve static files (for frontend)
        this.app.use(express.static('public'));

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });

        // Get all subscriptions (admin)
        this.app.get('/api/subscriptions', async (req, res) => {
            try {
                const allSubscriptions = Array.from(this.subscriptions.values());
                const stats = {
                    total: allSubscriptions.length,
                    active: allSubscriptions.filter(s => s.status === 'active').length,
                    founding: allSubscriptions.filter(s => s.planId === 'founding').length,
                    revenue: allSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)
                };

                res.json({
                    subscriptions: allSubscriptions,
                    stats
                });

            } catch (error) {
                console.error('Get all subscriptions error:', error);
                res.status(500).json({ error: 'Failed to get subscriptions' });
            }
        });
    }

    getPlanFeatures(planId) {
        const features = {
            founding: [
                'wallet_monitoring',
                'real_time_analysis',
                'ai_compliance_checks',
                'monthly_reports',
                'nft_certificates',
                'priority_support',
                'beta_access',
                'lifetime_access',
                'post_launch_free_months'
            ],
            pro: [
                'wallet_monitoring',
                'real_time_analysis',
                'ai_compliance_checks',
                'weekly_reports',
                'nft_certificates',
                'email_support'
            ],
            enterprise: [
                'unlimited_wallets',
                'custom_compliance_rules',
                'white_label',
                'dedicated_support',
                'custom_integrations',
                'sla_guarantees'
            ]
        };

        return features[planId] || [];
    }

    /**
     * Setup WebSocket server
     */
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('📡 New WebSocket connection established');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log('📨 WebSocket message received:', data.type);
                    
                    // Handle WebSocket commands
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error.message);
                }
            });

            ws.on('close', () => {
                console.log('📡 WebSocket connection closed');
            });

            // Send initial status
            ws.send(JSON.stringify({
                type: 'connection_established',
                timestamp: new Date().toISOString(),
                agents: {
                    monitor: this.agents.monitor ? 'active' : 'inactive',
                    analyst: this.agents.analyst ? 'active' : 'inactive',
                    auditor: this.agents.auditor ? 'active' : 'inactive'
                }
            }));
        });
    }

    /**
     * Handle WebSocket messages
     */
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_status':
                const status = {
                    monitor: this.agents.monitor?.getStatus(),
                    analyst: this.agents.analyst?.getStatus(),
                    auditor: this.agents.auditor?.getStatus()
                };
                ws.send(JSON.stringify({ type: 'status_update', data: status }));
                break;
                
            case 'start_monitoring':
                try {
                    await this.agents.monitor.startMonitoring();
                    this.broadcast('monitoring_started', { status: 'active' });
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', message: error.message }));
                }
                break;
                
            default:
                ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
    }

    /**
     * Broadcast message to all WebSocket clients
     */
    broadcast(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    /**
     * Start the server
     */
    async start() {
        try {
            this.server.listen(this.port, () => {
                console.log(`🚀 ComplyChain server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
            });
        } catch (error) {
            console.error('❌ Failed to start server:', error.message);
            process.exit(1);
        }
    }
}

// Start the server
const server = new ComplyChainServer();
server.start();

module.exports = ComplyChainServer;
