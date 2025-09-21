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
const { Connection } = require('@solana/web3.js');
require('dotenv').config();

// Import agents
const MonitorAgent = require('../agents/monitor-agent/monitor-agent');
const AnalystAgent = require('../agents/analyst-agent/analyst-agent');
const AuditorAgent = require('../agents/auditor-agent/auditor-agent');

// Import Coral Protocol integration
const CoralIntegration = require('./coral-integration');

class ComplyChainServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = process.env.PORT || 3001;
        
        // Initialize agents
        this.agents = {};
        this.initializeAgents();
        
        // Initialize Coral Protocol integration
        this.coralIntegration = new CoralIntegration({
            coralServerUrl: process.env.CORAL_SERVER_URL || 'http://localhost:5555'
        });
        
        // Initialize subscription storage
        this.subscriptions = new Map();
        this.users = new Map();
        
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
            this.agents.monitor = new MonitorAgent(agentConfig);
            this.agents.analyst = new AnalystAgent(agentConfig);
            this.agents.auditor = new AuditorAgent(agentConfig);

            console.log('✅ AI agents initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize agents:', error.message);
        }
    }

    /**
     * Setup middleware
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

        // Agent status endpoints - now using Coral Protocol
        this.app.get('/api/agents/status', async (req, res) => {
            try {
                // Try Coral Protocol first, fallback to direct agents
                const coralStatus = await this.coralIntegration.getAgentStatuses();
                
                if (coralStatus.monitor.error) {
                    // Fallback to direct agent communication
                    const status = {
                        monitor: this.agents.monitor?.getStatus(),
                        analyst: this.agents.analyst?.getStatus(),
                        auditor: this.agents.auditor?.getStatus(),
                        coralProtocol: 'unavailable'
                    };
                    res.json(status);
                } else {
                    res.json({
                        ...coralStatus,
                        coralProtocol: 'active'
                    });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Monitor Agent endpoints
        this.app.post('/api/monitor/add-wallet', async (req, res) => {
            try {
                const { address, label } = req.body;
                const result = await this.agents.monitor.addWallet(address, label);
                
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

        // Get transactions endpoint
        this.app.get('/api/monitor/transactions', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 20;
                const since = req.query.since;
                
                const transactions = await this.agents.monitor.getTransactions({ limit, since });
                res.json(transactions);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Auditor Agent endpoints
        this.app.get('/api/auditor/reports', async (req, res) => {
            try {
                // Mock reports data for demo
                const mockReports = [
                    {
                        id: 'RPT-001',
                        generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        period: {
                            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date().toISOString()
                        },
                        summary: {
                            totalTransactions: 1247,
                            complianceScore: 98.7,
                            violationsFound: 2,
                            riskLevel: 'low'
                        },
                        executiveSummary: {
                            overview: 'Comprehensive compliance analysis for the past 7 days shows excellent adherence to regulatory requirements.',
                            keyFindings: ['OFAC screening: 100% compliant', 'Risk assessment: Low risk profile', 'Transaction monitoring: Active']
                        },
                        nftCertificate: {
                            minted: true,
                            tokenId: 'CERT-001',
                            mintAddress: '0x1234...abcd'
                        }
                    },
                    {
                        id: 'RPT-002', 
                        generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        period: {
                            startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                        },
                        summary: {
                            totalTransactions: 892,
                            complianceScore: 97.3,
                            violationsFound: 1,
                            riskLevel: 'low'
                        },
                        executiveSummary: {
                            overview: 'Weekly compliance review demonstrates strong regulatory compliance with minor violations addressed.',
                            keyFindings: ['BSA compliance: 97% adherent', 'FATF guidelines: Fully compliant', 'Risk mitigation: Effective']
                        },
                        nftCertificate: {
                            minted: true,
                            tokenId: 'CERT-002',
                            mintAddress: '0x5678...efgh'
                        }
                    }
                ];
                
                res.json(mockReports);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/auditor/generate-report', async (req, res) => {
            try {
                const { startDate, endDate } = req.body;
                
                // Generate new report
                const newReport = {
                    id: `RPT-${String(Date.now()).slice(-3)}`,
                    generatedAt: new Date().toISOString(),
                    period: {
                        startDate: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        endDate: endDate || new Date().toISOString()
                    },
                    summary: {
                        totalTransactions: Math.floor(Math.random() * 1000) + 500,
                        complianceScore: 95 + Math.random() * 5,
                        violationsFound: Math.floor(Math.random() * 3),
                        riskLevel: ['low', 'medium'][Math.floor(Math.random() * 2)]
                    },
                    executiveSummary: {
                        overview: 'Automated compliance report generated successfully with comprehensive regulatory analysis.',
                        keyFindings: ['Real-time monitoring: Active', 'AI analysis: Operational', 'Compliance status: Excellent']
                    },
                    nftCertificate: {
                        minted: false,
                        tokenId: null,
                        mintAddress: null
                    }
                };

                this.broadcast('report_generated', newReport);
                res.json(newReport);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/auditor/mint-certificate', async (req, res) => {
            try {
                const { reportId, walletAddress } = req.body;
                
                // Mock NFT minting
                const certificate = {
                    reportId,
                    tokenId: `CERT-${Date.now()}`,
                    mintAddress: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
                    walletAddress,
                    mintedAt: new Date().toISOString(),
                    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
                };

                this.broadcast('certificate_minted', certificate);
                res.json(certificate);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Subscription endpoints for Phase 2 monetization
        this.setupSubscriptionRoutes();

        // Demo endpoints
        this.app.post('/api/demo/simulate-transaction', async (req, res) => {
            try {
                const { walletAddress, amount, recipient } = req.body;
                
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

                await this.agents.monitor.processTransaction(mockTransaction);
                this.broadcast('demo_transaction', mockTransaction);
                res.json({ success: true, transaction: mockTransaction });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Full workflow demo endpoint - now using Coral Protocol
        this.app.post('/api/demo/full-workflow', async (req, res) => {
            try {
                const { walletAddress } = req.body || {};
                const demoWallet = walletAddress || 'DemoWallet123456789';
                
                // Try Coral Protocol workflow first
                const coralResult = await this.coralIntegration.runFullWorkflow(demoWallet);
                
                if (coralResult.success) {
                    // Broadcast Coral Protocol results
                    this.broadcast('coral_workflow_complete', coralResult.results);
                    
                    res.json({
                        success: true,
                        coralProtocol: true,
                        threadId: coralResult.threadId,
                        results: coralResult.results
                    });
                } else {
                    // Fallback to direct agent workflow
                    console.log('🔄 Falling back to direct agent workflow');
                    
                    // Step 1: Add wallet to monitoring
                    await this.agents.monitor.addWallet(demoWallet, 'Demo Wallet');
                    
                    // Step 2: Generate mock transaction
                    const mockTransaction = {
                        signature: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        slot: Math.floor(Math.random() * 1000000),
                        blockTime: Math.floor(Date.now() / 1000),
                        transaction: {
                            message: {
                                accountKeys: [demoWallet, 'RecipientWallet123'],
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
                            postBalances: [999000000, 501000000],
                            logMessages: ['Program log: Transfer complete']
                        }
                    };

                    // Step 3: Process transaction through agents
                    await this.agents.monitor.processTransaction(mockTransaction);
                    
                    const analysisResult = await this.agents.analyst.analyzeTransaction(mockTransaction);
                    
                    const auditResult = await this.agents.auditor.generateComplianceReport({
                        transactions: [mockTransaction],
                        period: {
                            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                            endDate: new Date().toISOString()
                        }
                    });

                    // Broadcast results
                    this.broadcast('demo_workflow_complete', {
                        transaction: mockTransaction,
                        analysis: analysisResult,
                        audit: auditResult
                    });

                    res.json({
                        success: true,
                        coralProtocol: false,
                        results: {
                            transaction: mockTransaction,
                            analysis: analysisResult,
                            audit: auditResult
                        }
                    });
                }
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Serve static files
        this.app.use(express.static('public'));

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }

    /**
     * Setup subscription routes for Phase 2 monetization
     */
    setupSubscriptionRoutes() {
        // Create subscription after payment
        this.app.post('/api/subscriptions', async (req, res) => {
            try {
                const { transactionSignature, planId, walletAddress, amount, currency } = req.body;

                // Verify transaction on Solana
                const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
                
                const transaction = await connection.getTransaction(transactionSignature, {
                    commitment: 'confirmed'
                });

                if (!transaction) {
                    return res.status(400).json({ error: 'Transaction not found or not confirmed' });
                }

                // Create subscription record
                const subscription = {
                    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: walletAddress,
                    planId,
                    status: 'active',
                    amount,
                    currency,
                    transactionSignature,
                    createdAt: new Date().toISOString(),
                    expiresAt: planId === 'founding' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    features: this.getPlanFeatures(planId)
                };

                this.subscriptions.set(subscription.id, subscription);

                // Create or update user record
                const user = this.users.get(walletAddress) || {
                    id: walletAddress,
                    walletAddress,
                    email: null,
                    createdAt: new Date().toISOString(),
                    subscriptions: []
                };

                user.subscriptions.push(subscription.id);
                user.currentPlan = planId;
                this.users.set(walletAddress, user);

                // Broadcast to WebSocket clients
                this.broadcast('subscription_created', { subscription, user });

                res.json({
                    success: true,
                    subscription: {
                        id: subscription.id,
                        planId: subscription.planId,
                        status: subscription.status,
                        features: subscription.features,
                        expiresAt: subscription.expiresAt
                    }
                });

            } catch (error) {
                console.error('Subscription creation error:', error);
                res.status(500).json({ error: 'Failed to create subscription' });
            }
        });

        // Get user subscription
        this.app.get('/api/subscriptions/user/:walletAddress', async (req, res) => {
            try {
                const { walletAddress } = req.params;
                const user = this.users.get(walletAddress);

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                const userSubscriptions = user.subscriptions.map(subId => this.subscriptions.get(subId)).filter(Boolean);

                res.json({
                    user: {
                        id: user.id,
                        walletAddress: user.walletAddress,
                        currentPlan: user.currentPlan,
                        createdAt: user.createdAt
                    },
                    subscriptions: userSubscriptions
                });

            } catch (error) {
                console.error('Get subscription error:', error);
                res.status(500).json({ error: 'Failed to get subscription' });
            }
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
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error.message);
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
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
            // Initialize Coral Protocol integration
            const coralInitialized = await this.coralIntegration.initialize();
            
            this.server.listen(this.port, () => {
                console.log(`🚀 ComplyChain server running on port ${this.port}`);
                console.log(`📊 Dashboard: http://localhost:${this.port}`);
                console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
                
                if (coralInitialized) {
                    console.log(`🌊 Coral Protocol integration: ACTIVE`);
                    console.log(`🎛️ Coral Studio: http://localhost:3000`);
                } else {
                    console.log(`⚠️ Coral Protocol integration: FALLBACK MODE`);
                }
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
