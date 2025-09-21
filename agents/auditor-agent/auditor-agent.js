/**
 * ComplyChain Auditor Agent
 * Generates compliance reports and mints NFT certificates via Crossmint
 */

const axios = require('axios');
const crypto = require('crypto');

class AuditorAgent {
    constructor(config) {
        this.config = config;
        this.crossmintApiKey = config.crossmintApiKey;
        this.crossmintProjectId = config.crossmintProjectId;
        this.coralServerUrl = config.coralServerUrl;
        this.complianceReports = [];
        this.certificateCount = 0;
    }

    /**
     * Initialize the auditor agent and register with Coral Protocol
     */
    async initialize() {
        console.log('📋 Initializing Auditor Agent...');
        
        await this.registerWithCoral();
        await this.setupCrossmint();
        
        console.log('✅ Auditor Agent initialized successfully');
    }

    /**
     * Register this agent with Coral Protocol server
     */
    async registerWithCoral() {
        try {
            const agentConfig = {
                agentId: 'auditor-agent',
                agentDescription: 'Generates compliance reports and mints immutable NFT certificates',
                capabilities: [
                    'report-generation',
                    'nft-minting',
                    'compliance-certification',
                    'audit-trail-creation',
                    'regulatory-documentation'
                ],
                tools: [
                    {
                        name: 'generateReport',
                        description: 'Generate a compliance report for a time period',
                        parameters: {
                            type: 'object',
                            properties: {
                                startDate: { type: 'string', description: 'Start date for report (ISO string)' },
                                endDate: { type: 'string', description: 'End date for report (ISO string)' },
                                walletAddress: { type: 'string', description: 'Optional wallet to focus on' }
                            },
                            required: ['startDate', 'endDate']
                        }
                    },
                    {
                        name: 'mintCertificate',
                        description: 'Mint an NFT compliance certificate',
                        parameters: {
                            type: 'object',
                            properties: {
                                reportId: { type: 'string', description: 'ID of the compliance report' },
                                recipientAddress: { type: 'string', description: 'Address to receive the NFT' }
                            },
                            required: ['reportId', 'recipientAddress']
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
     * Setup Crossmint API connection
     */
    async setupCrossmint() {
        try {
            // Verify Crossmint API connection
            const response = await axios.get(`https://www.crossmint.com/api/2022-06-09/collections`, {
                headers: {
                    'X-API-KEY': this.crossmintApiKey,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('🎨 Connected to Crossmint API');
        } catch (error) {
            console.error('❌ Failed to connect to Crossmint:', error.message);
            // Continue without Crossmint for demo purposes
        }
    }

    /**
     * Generate a comprehensive compliance report
     */
    async generateReport(startDate, endDate, walletAddress = null) {
        console.log(`📊 Generating compliance report: ${startDate} to ${endDate}`);

        const reportId = this.generateReportId();
        const report = {
            id: reportId,
            generatedAt: new Date().toISOString(),
            period: {
                startDate,
                endDate
            },
            walletAddress,
            summary: {
                totalTransactions: 0,
                totalVolume: 0,
                violationsFound: 0,
                warningsIssued: 0,
                complianceScore: 0
            },
            transactions: [],
            violations: [],
            warnings: [],
            recommendations: [],
            certificationHash: null
        };

        try {
            // Collect transaction data from Monitor Agent
            const transactionData = await this.collectTransactionData(startDate, endDate, walletAddress);
            report.transactions = transactionData.transactions;
            report.summary.totalTransactions = transactionData.transactions.length;

            // Collect analysis results from Analyst Agent
            const analysisData = await this.collectAnalysisData(startDate, endDate);
            report.violations = analysisData.violations;
            report.warnings = analysisData.warnings;
            report.summary.violationsFound = analysisData.violations.length;
            report.summary.warningsIssued = analysisData.warnings.length;

            // Calculate compliance metrics
            report.summary = this.calculateComplianceMetrics(report);

            // Generate executive summary
            report.executiveSummary = this.generateExecutiveSummary(report);

            // Generate regulatory summary
            report.regulatorySummary = this.generateRegulatorySummary(report);

            // Create certification hash
            report.certificationHash = this.generateCertificationHash(report);

            // Store report
            this.complianceReports.push(report);

            console.log(`✅ Report generated: ${reportId} (${report.summary.totalTransactions} transactions)`);

            // Notify other agents
            await this.notifyAgents('report_generated', {
                reportId,
                summary: report.summary,
                timestamp: report.generatedAt
            });

            return report;

        } catch (error) {
            console.error('❌ Report generation failed:', error.message);
            report.error = error.message;
            return report;
        }
    }

    /**
     * Collect transaction data from Monitor Agent
     */
    async collectTransactionData(startDate, endDate, walletAddress) {
        try {
            // In a real implementation, this would query the Monitor Agent via Coral Protocol
            // For demo, we'll simulate transaction data
            const mockTransactions = this.generateMockTransactionData(startDate, endDate, walletAddress);
            
            return {
                transactions: mockTransactions,
                totalVolume: mockTransactions.reduce((sum, tx) => 
                    sum + (tx.balanceChanges?.reduce((txSum, change) => 
                        txSum + Math.abs(change.change), 0) || 0), 0)
            };
        } catch (error) {
            console.error('❌ Failed to collect transaction data:', error.message);
            return { transactions: [], totalVolume: 0 };
        }
    }

    /**
     * Collect analysis data from Analyst Agent
     */
    async collectAnalysisData(startDate, endDate) {
        try {
            // In a real implementation, this would query the Analyst Agent via Coral Protocol
            // For demo, we'll simulate analysis data
            return {
                violations: [
                    {
                        type: 'OFAC_VIOLATION',
                        severity: 'critical',
                        transactionId: 'demo_tx_001',
                        message: 'Transaction with sanctioned address detected',
                        timestamp: new Date().toISOString()
                    }
                ],
                warnings: [
                    {
                        type: 'HIGH_FREQUENCY_PATTERN',
                        severity: 'medium',
                        message: 'Unusual transaction frequency detected',
                        count: 150,
                        timestamp: new Date().toISOString()
                    }
                ]
            };
        } catch (error) {
            console.error('❌ Failed to collect analysis data:', error.message);
            return { violations: [], warnings: [] };
        }
    }

    /**
     * Generate mock transaction data for demo
     */
    generateMockTransactionData(startDate, endDate, walletAddress) {
        const transactions = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

        for (let i = 0; i < Math.min(daysDiff * 5, 50); i++) {
            const randomDate = new Date(start.getTime() + Math.random() * (end - start));
            transactions.push({
                signature: `demo_tx_${i.toString().padStart(3, '0')}`,
                timestamp: randomDate.toISOString(),
                wallet: walletAddress || 'DemoWallet123...',
                status: 'success',
                balanceChanges: [{
                    account: 'DemoAccount123...',
                    change: Math.floor(Math.random() * 1000000000) // Random amount in lamports
                }],
                complianceStatus: Math.random() > 0.9 ? 'warning' : 'compliant'
            });
        }

        return transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Calculate compliance metrics
     */
    calculateComplianceMetrics(report) {
        const summary = { ...report.summary };
        
        // Calculate total volume
        summary.totalVolume = report.transactions.reduce((sum, tx) => 
            sum + (tx.balanceChanges?.reduce((txSum, change) => 
                txSum + Math.abs(change.change), 0) || 0), 0);

        // Calculate compliance score (0-100)
        const totalIssues = report.violations.length + report.warnings.length;
        const transactionCount = report.transactions.length || 1;
        const issueRate = totalIssues / transactionCount;
        summary.complianceScore = Math.max(0, Math.min(100, 100 - (issueRate * 100)));

        // Risk assessment
        summary.riskLevel = this.assessOverallRisk(report);

        return summary;
    }

    /**
     * Assess overall risk level
     */
    assessOverallRisk(report) {
        const criticalViolations = report.violations.filter(v => v.severity === 'critical').length;
        const highWarnings = report.warnings.filter(w => w.severity === 'high').length;

        if (criticalViolations > 0) return 'critical';
        if (highWarnings > 2) return 'high';
        if (report.warnings.length > 5) return 'medium';
        return 'low';
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary(report) {
        const { summary } = report;
        
        return {
            overview: `Compliance analysis for ${summary.totalTransactions} transactions from ${report.period.startDate} to ${report.period.endDate}.`,
            keyFindings: [
                `${summary.violationsFound} critical violations identified`,
                `${summary.warningsIssued} warnings flagged for review`,
                `Overall compliance score: ${summary.complianceScore.toFixed(1)}/100`,
                `Risk level assessed as: ${summary.riskLevel}`
            ],
            immediateActions: report.violations.length > 0 
                ? ['Immediate regulatory reporting required', 'Enhanced monitoring recommended']
                : ['Continue standard monitoring procedures'],
            complianceStatus: summary.violationsFound === 0 ? 'COMPLIANT' : 'VIOLATIONS_DETECTED'
        };
    }

    /**
     * Generate regulatory summary
     */
    generateRegulatorySummary(report) {
        return {
            reportingPeriod: `${report.period.startDate} to ${report.period.endDate}`,
            entityInformation: {
                walletAddress: report.walletAddress || 'Multiple wallets monitored',
                monitoringSystem: 'ComplyChain Automated Compliance System',
                reportGeneratedBy: 'AI Agent Network'
            },
            complianceFrameworks: ['OFAC', 'FATF', 'BSA'],
            findings: {
                sanctionsViolations: report.violations.filter(v => v.type.includes('OFAC')).length,
                suspiciousPatterns: report.warnings.filter(w => w.type.includes('PATTERN')).length,
                largeTransactions: report.warnings.filter(w => w.type.includes('LARGE')).length
            },
            certificationStatement: 'This report was generated by an automated AI compliance system and represents a good faith effort to identify potential regulatory violations.',
            auditTrail: {
                reportHash: report.certificationHash,
                generatedAt: report.generatedAt,
                systemVersion: '1.0.0'
            }
        };
    }

    /**
     * Generate certification hash for report integrity
     */
    generateCertificationHash(report) {
        const reportData = {
            id: report.id,
            period: report.period,
            summary: report.summary,
            transactionCount: report.transactions.length,
            violationCount: report.violations.length,
            warningCount: report.warnings.length
        };

        return crypto.createHash('sha256')
            .update(JSON.stringify(reportData))
            .digest('hex');
    }

    /**
     * Mint NFT compliance certificate
     */
    async mintCertificate(reportId, recipientAddress) {
        console.log(`🎨 Minting compliance certificate for report: ${reportId}`);

        const report = this.complianceReports.find(r => r.id === reportId);
        if (!report) {
            throw new Error(`Report not found: ${reportId}`);
        }

        const certificate = {
            id: `cert_${this.certificateCount++}`,
            reportId,
            recipientAddress,
            mintedAt: new Date().toISOString(),
            blockchainTxId: null,
            metadata: this.generateCertificateMetadata(report)
        };

        try {
            // Mint NFT via Crossmint
            const nftResponse = await this.mintViaCrossmint(certificate);
            certificate.blockchainTxId = nftResponse.transactionId;
            certificate.nftId = nftResponse.nftId;

            console.log(`✅ Certificate minted: ${certificate.id}`);

            // Notify other agents
            await this.notifyAgents('certificate_minted', {
                certificateId: certificate.id,
                reportId,
                recipientAddress,
                blockchainTxId: certificate.blockchainTxId
            });

            return certificate;

        } catch (error) {
            console.error('❌ Certificate minting failed:', error.message);
            
            // For demo purposes, create a mock certificate
            certificate.blockchainTxId = `demo_tx_${Date.now()}`;
            certificate.nftId = `demo_nft_${certificate.id}`;
            certificate.status = 'demo_minted';

            console.log(`📝 Demo certificate created: ${certificate.id}`);
            return certificate;
        }
    }

    /**
     * Generate NFT metadata for compliance certificate
     */
    generateCertificateMetadata(report) {
        return {
            name: `ComplyChain Compliance Certificate #${this.certificateCount}`,
            description: `Automated compliance certificate for blockchain transactions monitored from ${report.period.startDate} to ${report.period.endDate}`,
            image: 'https://example.com/compliance-certificate-image.png', // Would be actual image URL
            attributes: [
                {
                    trait_type: 'Report Period Start',
                    value: report.period.startDate
                },
                {
                    trait_type: 'Report Period End',
                    value: report.period.endDate
                },
                {
                    trait_type: 'Transactions Monitored',
                    value: report.summary.totalTransactions
                },
                {
                    trait_type: 'Compliance Score',
                    value: `${report.summary.complianceScore.toFixed(1)}/100`
                },
                {
                    trait_type: 'Risk Level',
                    value: report.summary.riskLevel
                },
                {
                    trait_type: 'Violations Found',
                    value: report.summary.violationsFound
                },
                {
                    trait_type: 'Report Hash',
                    value: report.certificationHash
                },
                {
                    trait_type: 'Generated By',
                    value: 'ComplyChain AI Agent Network'
                }
            ],
            external_url: `https://complychain.com/certificates/${report.id}`,
            certification_data: {
                reportId: report.id,
                reportHash: report.certificationHash,
                complianceFrameworks: ['OFAC', 'FATF', 'BSA'],
                auditTrail: true,
                immutable: true
            }
        };
    }

    /**
     * Mint NFT via Crossmint API
     */
    async mintViaCrossmint(certificate) {
        const mintData = {
            recipient: `solana:${certificate.recipientAddress}`,
            metadata: certificate.metadata
        };

        const response = await axios.post(
            `https://www.crossmint.com/api/2022-06-09/collections/${this.crossmintProjectId}/nfts`,
            mintData,
            {
                headers: {
                    'X-API-KEY': this.crossmintApiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return {
            transactionId: response.data.onChain?.txId || `demo_tx_${Date.now()}`,
            nftId: response.data.id
        };
    }

    /**
     * Generate unique report ID
     */
    generateReportId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `RPT_${timestamp}_${random}`;
    }

    /**
     * Generate compliance report (main API method)
     */
    async generateComplianceReport(options = {}) {
        const { transactions = [], period = {}, walletAddress = null } = options;
        
        const reportId = this.generateReportId();
        const startDate = period.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = period.endDate || new Date().toISOString();
        
        console.log(`📋 Generating compliance report: ${reportId}`);
        
        // Use provided transactions or generate mock data
        const reportTransactions = transactions.length > 0 
            ? transactions 
            : this.generateMockTransactionData(startDate, endDate, walletAddress);
        
        // Collect analysis data
        const analysisData = await this.collectAnalysisData(startDate, endDate);
        
        // Build report
        const report = {
            id: reportId,
            generatedAt: new Date().toISOString(),
            period: { startDate, endDate },
            walletAddress,
            transactions: reportTransactions,
            violations: analysisData.violations,
            warnings: analysisData.warnings,
            summary: {
                totalTransactions: reportTransactions.length,
                violationsFound: analysisData.violations.length,
                warningsIssued: analysisData.warnings.length,
                complianceScore: 0, // Will be calculated
                riskLevel: 'low' // Will be assessed
            }
        };
        
        // Calculate metrics and generate summaries
        report.summary = this.calculateComplianceMetrics(report);
        report.executiveSummary = this.generateExecutiveSummary(report);
        report.regulatorySummary = this.generateRegulatorySummary(report);
        report.certificationHash = this.generateCertificationHash(report);
        
        // Store report
        this.complianceReports.push(report);
        
        console.log(`✅ Compliance report generated: ${reportId}`);
        
        // Notify other agents
        await this.notifyAgents('report_generated', {
            reportId,
            complianceScore: report.summary.complianceScore,
            riskLevel: report.summary.riskLevel,
            violationsFound: report.summary.violationsFound
        });
        
        return report;
    }

    /**
     * Get report by ID
     */
    getReport(reportId) {
        return this.complianceReports.find(r => r.id === reportId);
    }

    /**
     * Get all reports
     */
    getAllReports() {
        return this.complianceReports;
    }

    /**
     * Notify other agents via Coral Protocol
     */
    async notifyAgents(eventType, data) {
        try {
            await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
                from: 'auditor-agent',
                eventType,
                data,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('❌ Failed to notify agents:', error.message);
        }
    }

    /**
     * Get agent status
     */
    getStatus() {
        return {
            agentId: 'auditor-agent',
            reportsGenerated: this.complianceReports.length,
            certificatesMinted: this.certificateCount,
            lastReportGenerated: this.complianceReports.length > 0 
                ? this.complianceReports[this.complianceReports.length - 1].generatedAt 
                : null,
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = AuditorAgent;
