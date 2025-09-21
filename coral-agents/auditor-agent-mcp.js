#!/usr/bin/env node

/**
 * ComplyChain Auditor Agent - MCP Compatible
 * Generates compliance reports and mints NFT certificates
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
import axios from 'axios';
import crypto from 'crypto';

class AuditorAgentMCP {
  constructor() {
    this.crossmintApiKey = process.env.CROSSMINT_API_KEY;
    this.crossmintProjectId = process.env.CROSSMINT_PROJECT_ID;
    this.coralServerUrl = process.env.CORAL_SERVER_URL || 'http://localhost:5555';
    this.complianceReports = [];
    this.certificateCount = 0;
  }

  /**
   * Initialize MCP server
   */
  async initialize() {
    const server = new Server(
      {
        name: "complychain-auditor-agent",
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
          name: "generate_compliance_report",
          description: "Generate a comprehensive compliance report",
          inputSchema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                description: "Array of transactions to include in report"
              },
              period: {
                type: "object",
                description: "Time period for the report",
                properties: {
                  startDate: { type: "string" },
                  endDate: { type: "string" }
                }
              },
              walletAddress: {
                type: "string",
                description: "Primary wallet address for the report"
              }
            },
            required: ["transactions", "period"]
          }
        },
        {
          name: "mint_compliance_certificate",
          description: "Mint an NFT compliance certificate",
          inputSchema: {
            type: "object",
            properties: {
              reportId: {
                type: "string",
                description: "ID of the compliance report"
              },
              recipientAddress: {
                type: "string",
                description: "Solana address to receive the NFT"
              }
            },
            required: ["reportId", "recipientAddress"]
          }
        },
        {
          name: "calculate_compliance_metrics",
          description: "Calculate compliance metrics for transactions",
          inputSchema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                description: "Array of transactions to analyze"
              },
              analysisResults: {
                type: "array",
                description: "Array of analysis results from analyst agent"
              }
            },
            required: ["transactions"]
          }
        },
        {
          name: "get_reports",
          description: "Get all generated compliance reports",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Maximum number of reports to return"
              }
            }
          }
        },
        {
          name: "get_report",
          description: "Get a specific compliance report by ID",
          inputSchema: {
            type: "object",
            properties: {
              reportId: {
                type: "string",
                description: "ID of the report to retrieve"
              }
            },
            required: ["reportId"]
          }
        },
        {
          name: "get_status",
          description: "Get agent status and statistics",
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
          case "generate_compliance_report":
            return await this.generateComplianceReport(args);
          
          case "mint_compliance_certificate":
            return await this.mintComplianceCertificate(args.reportId, args.recipientAddress);
          
          case "calculate_compliance_metrics":
            return await this.calculateComplianceMetrics(args.transactions, args.analysisResults);
          
          case "get_reports":
            return this.getReports(args.limit);
          
          case "get_report":
            return this.getReport(args.reportId);
          
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
    
    console.error("📋 ComplyChain Auditor Agent MCP started");
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(options = {}) {
    const { transactions = [], period = {}, walletAddress = null } = options;
    
    const reportId = this.generateReportId();
    const startDate = period.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = period.endDate || new Date().toISOString();
    
    console.error(`📋 Generating compliance report: ${reportId}`);
    
    // Use provided transactions or generate mock data
    const reportTransactions = transactions.length > 0 
      ? transactions 
      : this.generateMockTransactionData(startDate, endDate, walletAddress);
    
    // Collect analysis data (mock for now)
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
    report.summary = this.calculateComplianceMetricsInternal(report);
    report.executiveSummary = this.generateExecutiveSummary(report);
    report.regulatorySummary = this.generateRegulatorySummary(report);
    report.certificationHash = this.generateCertificationHash(report);
    
    // Store report
    this.complianceReports.push(report);
    
    // Notify Coral Protocol
    await this.notifyCoralProtocol('report_generated', {
      reportId,
      complianceScore: report.summary.complianceScore,
      riskLevel: report.summary.riskLevel,
      violationsFound: report.summary.violationsFound
    });

    return {
      content: [
        {
          type: "text",
          text: `✅ Compliance report generated: ${reportId}`
        },
        {
          type: "text",
          text: JSON.stringify({
            id: report.id,
            summary: report.summary,
            executiveSummary: report.executiveSummary
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Mint NFT compliance certificate
   */
  async mintComplianceCertificate(reportId, recipientAddress) {
    console.error(`🎨 Minting compliance certificate for report: ${reportId}`);

    const report = this.complianceReports.find(r => r.id === reportId);
    if (!report) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Report not found: ${reportId}`
          }
        ]
      };
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
      // Try to mint NFT via Crossmint (will fail without API key)
      const nftResponse = await this.mintViaCrossmint(certificate);
      certificate.blockchainTxId = nftResponse.transactionId;
      certificate.nftId = nftResponse.nftId;

      // Notify Coral Protocol
      await this.notifyCoralProtocol('certificate_minted', {
        certificateId: certificate.id,
        reportId,
        recipientAddress,
        blockchainTxId: certificate.blockchainTxId
      });

      return {
        content: [
          {
            type: "text",
            text: `✅ Certificate minted: ${certificate.id}`
          },
          {
            type: "text",
            text: JSON.stringify(certificate, null, 2)
          }
        ]
      };

    } catch (error) {
      // Create demo certificate
      certificate.blockchainTxId = `demo_tx_${Date.now()}`;
      certificate.nftId = `demo_nft_${certificate.id}`;
      certificate.status = 'demo_minted';

      return {
        content: [
          {
            type: "text",
            text: `📝 Demo certificate created: ${certificate.id}`
          },
          {
            type: "text",
            text: JSON.stringify(certificate, null, 2)
          }
        ]
      };
    }
  }

  /**
   * Calculate compliance metrics
   */
  async calculateComplianceMetrics(transactions, analysisResults = []) {
    const metrics = {
      totalTransactions: transactions.length,
      totalVolume: 0,
      violationCount: 0,
      warningCount: 0,
      complianceScore: 100,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    // Calculate total volume
    metrics.totalVolume = transactions.reduce((sum, tx) => 
      sum + (tx.balanceChanges?.reduce((txSum, change) => 
        txSum + Math.abs(change.change), 0) || 0), 0);

    // Process analysis results
    analysisResults.forEach(analysis => {
      metrics.violationCount += analysis.violations?.length || 0;
      metrics.warningCount += analysis.warnings?.length || 0;
      
      const riskLevel = analysis.riskLevel || 'low';
      metrics.riskDistribution[riskLevel]++;
    });

    // Calculate compliance score
    const totalIssues = metrics.violationCount + metrics.warningCount;
    const issueRate = totalIssues / Math.max(transactions.length, 1);
    metrics.complianceScore = Math.max(0, Math.min(100, 100 - (issueRate * 100)));

    return {
      content: [
        {
          type: "text",
          text: "📊 Compliance Metrics Calculated"
        },
        {
          type: "text",
          text: JSON.stringify(metrics, null, 2)
        }
      ]
    };
  }

  /**
   * Get all reports
   */
  getReports(limit = 50) {
    const reports = this.complianceReports.slice(-limit);
    
    return {
      content: [
        {
          type: "text",
          text: `📊 Found ${reports.length} compliance reports`
        },
        {
          type: "text",
          text: JSON.stringify(reports.map(r => ({
            id: r.id,
            generatedAt: r.generatedAt,
            summary: r.summary
          })), null, 2)
        }
      ]
    };
  }

  /**
   * Get specific report
   */
  getReport(reportId) {
    const report = this.complianceReports.find(r => r.id === reportId);
    
    if (!report) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Report not found: ${reportId}`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `📋 Compliance Report: ${reportId}`
        },
        {
          type: "text",
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    const status = {
      agentId: 'complychain-auditor-agent',
      reportsGenerated: this.complianceReports.length,
      certificatesMinted: this.certificateCount,
      lastReportGenerated: this.complianceReports.length > 0 
        ? this.complianceReports[this.complianceReports.length - 1].generatedAt 
        : null,
      crossmintConfigured: !!this.crossmintApiKey,
      lastUpdate: new Date().toISOString()
    };

    return {
      content: [
        {
          type: "text",
          text: "📊 Auditor Agent Status:"
        },
        {
          type: "text",
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  // Internal helper methods
  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `RPT_${timestamp}_${random}`;
  }

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
          change: Math.floor(Math.random() * 1000000000)
        }],
        complianceStatus: Math.random() > 0.9 ? 'warning' : 'compliant'
      });
    }

    return transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  async collectAnalysisData(startDate, endDate) {
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
  }

  calculateComplianceMetricsInternal(report) {
    const summary = { ...report.summary };
    
    // Calculate total volume
    summary.totalVolume = report.transactions.reduce((sum, tx) => 
      sum + (tx.balanceChanges?.reduce((txSum, change) => 
        txSum + Math.abs(change.change), 0) || 0), 0);

    // Calculate compliance score
    const totalIssues = report.violations.length + report.warnings.length;
    const transactionCount = report.transactions.length || 1;
    const issueRate = totalIssues / transactionCount;
    summary.complianceScore = Math.max(0, Math.min(100, 100 - (issueRate * 100)));

    // Risk assessment
    summary.riskLevel = this.assessOverallRisk(report);

    return summary;
  }

  assessOverallRisk(report) {
    const criticalViolations = report.violations.filter(v => v.severity === 'critical').length;
    const highWarnings = report.warnings.filter(w => w.severity === 'high').length;

    if (criticalViolations > 0) return 'critical';
    if (highWarnings > 2) return 'high';
    if (report.warnings.length > 5) return 'medium';
    return 'low';
  }

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
      certificationStatement: 'This report was generated by an automated AI compliance system.',
      auditTrail: {
        reportHash: report.certificationHash,
        generatedAt: report.generatedAt,
        systemVersion: '1.0.0'
      }
    };
  }

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

  generateCertificateMetadata(report) {
    return {
      name: `ComplyChain Compliance Certificate #${this.certificateCount}`,
      description: `Automated compliance certificate for blockchain transactions monitored from ${report.period.startDate} to ${report.period.endDate}`,
      image: 'https://example.com/compliance-certificate-image.png',
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
          trait_type: 'Report Hash',
          value: report.certificationHash
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

  async mintViaCrossmint(certificate) {
    if (!this.crossmintApiKey) {
      throw new Error('Crossmint API key not configured');
    }

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

  async notifyCoralProtocol(eventType, data) {
    try {
      await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
        from: 'complychain-auditor-agent',
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
const agent = new AuditorAgentMCP();
agent.initialize().catch(console.error);
