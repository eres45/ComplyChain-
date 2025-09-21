#!/usr/bin/env node

/**
 * ComplyChain Analyst Agent - MCP Compatible
 * AI-powered compliance analysis using Mistral AI for regulatory screening
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

class AnalystAgentMCP {
  constructor() {
    this.mistralApiKey = process.env.MISTRAL_API_KEY;
    this.mistralModel = 'mistral-small-latest';
    this.coralServerUrl = process.env.CORAL_SERVER_URL || 'http://localhost:5555';
    
    // Initialize compliance rules and thresholds
    this.complianceRules = {
      ofac: {
        name: 'Office of Foreign Assets Control',
        description: 'US sanctions and blocked persons list',
        severity: 'critical'
      },
      fatf: {
        name: 'Financial Action Task Force',
        description: 'International AML/CFT standards',
        severity: 'high'
      },
      bsa: {
        name: 'Bank Secrecy Act',
        description: 'US financial reporting requirements',
        severity: 'high'
      }
    };

    this.riskThresholds = {
      low: 0.1,
      medium: 0.3,
      high: 0.7
    };

    // Mock sanctioned addresses for demo
    this.sanctionedAddresses = new Set([
      '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    ]);
  }

  /**
   * Initialize MCP server
   */
  async initialize() {
    const server = new Server(
      {
        name: "complychain-analyst-agent",
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
          name: "analyze_transaction",
          description: "Analyze a blockchain transaction for compliance violations",
          inputSchema: {
            type: "object",
            properties: {
              transactionData: {
                type: "object",
                description: "Transaction data to analyze",
                properties: {
                  signature: { type: "string" },
                  wallet: { type: "string" },
                  balanceChanges: { type: "array" },
                  instructions: { type: "array" },
                  timestamp: { type: "string" }
                }
              },
              context: {
                type: "object",
                description: "Additional context for analysis",
                properties: {
                  recentTransactionCount: { type: "number" }
                }
              }
            },
            required: ["transactionData"]
          }
        },
        {
          name: "screen_address",
          description: "Screen an address against sanctions lists",
          inputSchema: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "Blockchain address to screen"
              }
            },
            required: ["address"]
          }
        },
        {
          name: "generate_risk_report",
          description: "Generate a risk assessment report",
          inputSchema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                description: "Array of transactions to analyze"
              },
              timeframe: {
                type: "string",
                description: "Time period for the report"
              }
            },
            required: ["transactions"]
          }
        },
        {
          name: "get_compliance_rules",
          description: "Get current compliance rules and thresholds",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_status",
          description: "Get agent status and configuration",
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
          case "analyze_transaction":
            return await this.analyzeTransaction(args.transactionData, args.context);
          
          case "screen_address":
            return await this.screenAddress(args.address);
          
          case "generate_risk_report":
            return await this.generateRiskReport(args.transactions, args.timeframe);
          
          case "get_compliance_rules":
            return this.getComplianceRules();
          
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
    
    console.error("🔍 ComplyChain Analyst Agent MCP started");
  }

  /**
   * Analyze a transaction for compliance violations
   */
  async analyzeTransaction(transactionData, context = {}) {
    console.error(`🔍 Analyzing transaction: ${transactionData.signature?.substring(0, 8)}...`);

    const analysis = {
      transactionId: transactionData.signature,
      timestamp: new Date().toISOString(),
      riskScore: 0,
      violations: [],
      warnings: [],
      recommendations: [],
      complianceStatus: 'pending'
    };

    try {
      // 1. OFAC Sanctions Check
      const sanctionsCheck = await this.checkSanctions(transactionData);
      analysis.violations.push(...sanctionsCheck.violations);
      analysis.warnings.push(...sanctionsCheck.warnings);
      analysis.riskScore += sanctionsCheck.riskScore;

      // 2. Pattern Analysis
      const patternAnalysis = await this.analyzePatterns(transactionData, context);
      analysis.violations.push(...patternAnalysis.violations);
      analysis.warnings.push(...patternAnalysis.warnings);
      analysis.riskScore += patternAnalysis.riskScore;

      // 3. AI-Powered Risk Assessment
      const aiAnalysis = await this.performAIAnalysis(transactionData, context);
      analysis.violations.push(...aiAnalysis.violations);
      analysis.warnings.push(...aiAnalysis.warnings);
      analysis.riskScore += aiAnalysis.riskScore;
      analysis.aiExplanation = aiAnalysis.explanation;

      // 4. Determine final compliance status
      analysis.complianceStatus = this.determineComplianceStatus(analysis);
      analysis.riskLevel = this.determineRiskLevel(analysis.riskScore);

      // 5. Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      // Notify Coral Protocol
      await this.notifyCoralProtocol('analysis_complete', analysis);

      return {
        content: [
          {
            type: "text",
            text: `📊 Analysis Complete - Risk: ${analysis.riskLevel}, Status: ${analysis.complianceStatus}`
          },
          {
            type: "text",
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Analysis failed: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * Screen address against sanctions lists
   */
  async screenAddress(address) {
    const isSanctioned = this.sanctionedAddresses.has(address);
    
    const result = {
      address,
      sanctioned: isSanctioned,
      timestamp: new Date().toISOString(),
      source: isSanctioned ? 'OFAC' : null,
      riskLevel: isSanctioned ? 'critical' : 'low'
    };

    return {
      content: [
        {
          type: "text",
          text: isSanctioned 
            ? `🚨 SANCTIONED ADDRESS: ${address}` 
            : `✅ Address clean: ${address}`
        },
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  /**
   * Generate risk assessment report
   */
  async generateRiskReport(transactions, timeframe = '24h') {
    const report = {
      id: `risk_report_${Date.now()}`,
      timeframe,
      generatedAt: new Date().toISOString(),
      transactionCount: transactions.length,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      topRisks: [],
      recommendations: []
    };

    // Analyze each transaction
    for (const tx of transactions) {
      const analysis = await this.analyzeTransaction(tx);
      const riskLevel = this.determineRiskLevel(analysis.riskScore || 0);
      report.riskDistribution[riskLevel]++;
      
      if (analysis.riskScore > 0.5) {
        report.topRisks.push({
          transactionId: tx.signature,
          riskScore: analysis.riskScore,
          violations: analysis.violations?.length || 0
        });
      }
    }

    // Generate recommendations
    if (report.riskDistribution.critical > 0) {
      report.recommendations.push('Immediate regulatory reporting required');
    }
    if (report.riskDistribution.high > 5) {
      report.recommendations.push('Enhanced monitoring recommended');
    }

    return {
      content: [
        {
          type: "text",
          text: `📊 Risk Report Generated: ${report.transactionCount} transactions analyzed`
        },
        {
          type: "text",
          text: JSON.stringify(report, null, 2)
        }
      ]
    };
  }

  /**
   * Get compliance rules
   */
  getComplianceRules() {
    return {
      content: [
        {
          type: "text",
          text: "📋 Current Compliance Rules:"
        },
        {
          type: "text",
          text: JSON.stringify({
            rules: this.complianceRules,
            thresholds: this.riskThresholds,
            sanctionedAddressCount: this.sanctionedAddresses.size
          }, null, 2)
        }
      ]
    };
  }

  /**
   * Get agent status
   */
  getStatus() {
    const status = {
      agentId: 'complychain-analyst-agent',
      complianceRules: Object.keys(this.complianceRules),
      sanctionedAddressCount: this.sanctionedAddresses.size,
      riskThresholds: this.riskThresholds,
      mistralConfigured: !!this.mistralApiKey,
      lastUpdate: new Date().toISOString()
    };

    return {
      content: [
        {
          type: "text",
          text: "📊 Analyst Agent Status:"
        },
        {
          type: "text",
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  /**
   * Check transaction against sanctions lists
   */
  async checkSanctions(transactionData) {
    const result = {
      violations: [],
      warnings: [],
      riskScore: 0
    };

    // Check wallet address
    if (this.sanctionedAddresses.has(transactionData.wallet)) {
      result.violations.push({
        type: 'OFAC_VIOLATION',
        severity: 'critical',
        address: transactionData.wallet,
        message: `Transaction involves OFAC sanctioned address: ${transactionData.wallet}`,
        regulation: 'OFAC'
      });
      result.riskScore += 0.9;
    }

    // Check balance change addresses
    transactionData.balanceChanges?.forEach(change => {
      if (this.sanctionedAddresses.has(change.account)) {
        result.violations.push({
          type: 'OFAC_VIOLATION',
          severity: 'critical',
          address: change.account,
          message: `Transaction involves OFAC sanctioned address: ${change.account}`,
          regulation: 'OFAC'
        });
        result.riskScore += 0.9;
      }
    });

    return result;
  }

  /**
   * Analyze transaction patterns
   */
  async analyzePatterns(transactionData, context) {
    const result = {
      violations: [],
      warnings: [],
      riskScore: 0
    };

    // High-frequency pattern
    if (context.recentTransactionCount > 100) {
      result.warnings.push({
        type: 'HIGH_FREQUENCY_PATTERN',
        severity: 'medium',
        message: 'Unusually high transaction frequency detected',
        count: context.recentTransactionCount
      });
      result.riskScore += 0.3;
    }

    // Large transaction amounts
    const totalAmount = transactionData.balanceChanges?.reduce((sum, change) => 
      sum + Math.abs(change.change), 0) || 0;
    
    if (totalAmount > 1000000000) { // 1 SOL = 1e9 lamports
      result.warnings.push({
        type: 'LARGE_TRANSACTION',
        severity: 'medium',
        message: 'Large transaction amount detected',
        amount: totalAmount / 1000000000 + ' SOL'
      });
      result.riskScore += 0.2;
    }

    return result;
  }

  /**
   * Perform AI-powered analysis using Mistral
   */
  async performAIAnalysis(transactionData, context) {
    if (!this.mistralApiKey) {
      return {
        violations: [],
        warnings: [{
          type: 'AI_ANALYSIS_UNAVAILABLE',
          severity: 'low',
          message: 'Mistral API key not configured'
        }],
        riskScore: 0,
        explanation: 'AI analysis unavailable - API key not configured'
      };
    }

    try {
      const prompt = this.buildAnalysisPrompt(transactionData, context);
      
      const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
        model: this.mistralModel,
        messages: [
          {
            role: 'system',
            content: 'You are a regulatory compliance expert specializing in blockchain transaction analysis. Analyze transactions for potential violations of OFAC, FATF, and BSA regulations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${this.mistralApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse);

    } catch (error) {
      return {
        violations: [],
        warnings: [{
          type: 'AI_ANALYSIS_FAILED',
          severity: 'low',
          message: 'AI analysis unavailable'
        }],
        riskScore: 0,
        explanation: `AI analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Build analysis prompt for Mistral AI
   */
  buildAnalysisPrompt(transactionData, context) {
    return `
Analyze this Solana blockchain transaction for regulatory compliance:

TRANSACTION DETAILS:
- Signature: ${transactionData.signature}
- Wallet: ${transactionData.wallet}
- Amount: ${transactionData.balanceChanges?.map(c => `${c.change / 1000000000} SOL`).join(', ')}
- Instructions: ${transactionData.instructions?.length || 0}

CONTEXT:
- Recent transaction count: ${context.recentTransactionCount || 0}
- Time: ${transactionData.timestamp}

COMPLIANCE FRAMEWORKS TO CONSIDER:
1. OFAC (sanctions screening)
2. FATF (anti-money laundering)
3. BSA (suspicious activity reporting)

Please provide:
1. Risk assessment (0-1 scale)
2. Any potential violations
3. Recommended actions
4. Explanation of reasoning

Format your response as JSON with fields: riskScore, violations, warnings, explanation.
    `;
  }

  /**
   * Parse AI response
   */
  parseAIResponse(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          violations: parsed.violations || [],
          warnings: parsed.warnings || [],
          riskScore: parsed.riskScore || 0,
          explanation: parsed.explanation || aiResponse
        };
      }
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
    }

    return {
      violations: [],
      warnings: [],
      riskScore: 0.1,
      explanation: aiResponse
    };
  }

  /**
   * Determine compliance status
   */
  determineComplianceStatus(analysis) {
    if (analysis.violations.some(v => v.severity === 'critical')) {
      return 'violation';
    }
    if (analysis.violations.length > 0) {
      return 'warning';
    }
    if (analysis.warnings.some(w => w.severity === 'high')) {
      return 'review_required';
    }
    return 'compliant';
  }

  /**
   * Determine risk level
   */
  determineRiskLevel(riskScore) {
    if (riskScore >= this.riskThresholds.high) return 'high';
    if (riskScore >= this.riskThresholds.medium) return 'medium';
    if (riskScore >= this.riskThresholds.low) return 'low';
    return 'minimal';
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (analysis.complianceStatus === 'violation') {
      recommendations.push('Immediately freeze related accounts and report to authorities');
      recommendations.push('Conduct enhanced due diligence on all involved parties');
    }

    if (analysis.riskLevel === 'high') {
      recommendations.push('File Suspicious Activity Report (SAR)');
      recommendations.push('Enhanced monitoring of wallet activity');
    }

    if (analysis.warnings.some(w => w.type === 'LARGE_TRANSACTION')) {
      recommendations.push('Verify source of funds documentation');
      recommendations.push('Consider Currency Transaction Report (CTR) filing');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue standard monitoring procedures');
    }

    return recommendations;
  }

  /**
   * Notify Coral Protocol
   */
  async notifyCoralProtocol(eventType, data) {
    try {
      await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
        from: 'complychain-analyst-agent',
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
const agent = new AnalystAgentMCP();
agent.initialize().catch(console.error);
