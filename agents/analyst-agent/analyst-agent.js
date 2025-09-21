/**
 * ComplyChain Analyst Agent
 * Powered by Mistral AI for advanced compliance reasoning and risk assessment
 */

const axios = require('axios');

class AnalystAgent {
    constructor(config) {
        this.config = config;
        this.mistralApiKey = config.mistralApiKey;
        this.mistralModel = config.mistralModel || 'mistral-large-latest';
        this.coralServerUrl = config.coralServerUrl;
        this.complianceRules = this.loadComplianceRules();
        this.riskThresholds = {
            low: 0.3,
            medium: 0.6,
            high: 0.8
        };
    }

    /**
     * Initialize the analyst agent and register with Coral Protocol
     */
    async initialize() {
        console.log('🧠 Initializing Analyst Agent...');
        
        await this.registerWithCoral();
        await this.loadOFACList();
        
        console.log('✅ Analyst Agent initialized successfully');
    }

    /**
     * Register this agent with Coral Protocol server
     */
    async registerWithCoral() {
        try {
            const agentConfig = {
                agentId: 'analyst-agent',
                agentDescription: 'Analyzes transactions for regulatory compliance using advanced AI reasoning',
                capabilities: [
                    'compliance-analysis',
                    'risk-assessment',
                    'regulatory-interpretation',
                    'sanctions-screening',
                    'pattern-detection'
                ],
                tools: [
                    {
                        name: 'analyzeTransaction',
                        description: 'Analyze a transaction for compliance violations',
                        parameters: {
                            type: 'object',
                            properties: {
                                transaction: { type: 'object', description: 'Transaction data to analyze' },
                                context: { type: 'object', description: 'Additional context for analysis' }
                            },
                            required: ['transaction']
                        }
                    },
                    {
                        name: 'assessRisk',
                        description: 'Assess risk level of a wallet or transaction pattern',
                        parameters: {
                            type: 'object',
                            properties: {
                                data: { type: 'object', description: 'Data to assess' },
                                type: { type: 'string', enum: ['wallet', 'transaction', 'pattern'] }
                            },
                            required: ['data', 'type']
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
     * Load compliance rules and frameworks
     */
    loadComplianceRules() {
        return {
            ofac: {
                name: 'Office of Foreign Assets Control',
                description: 'US sanctions and blocked persons list',
                severity: 'critical',
                rules: [
                    'No transactions with OFAC sanctioned addresses',
                    'Report suspicious activity patterns',
                    'Monitor for sanctions evasion attempts'
                ]
            },
            fatf: {
                name: 'Financial Action Task Force',
                description: 'International AML/CFT standards',
                severity: 'high',
                rules: [
                    'Know Your Customer (KYC) requirements',
                    'Suspicious transaction reporting',
                    'Record keeping requirements'
                ]
            },
            bsa: {
                name: 'Bank Secrecy Act',
                description: 'US financial reporting requirements',
                severity: 'high',
                rules: [
                    'Currency Transaction Reports (CTR) for $10k+',
                    'Suspicious Activity Reports (SAR)',
                    'Customer identification programs'
                ]
            }
        };
    }

    /**
     * Load OFAC sanctioned addresses list
     */
    async loadOFACList() {
        try {
            // In production, this would fetch from official OFAC API
            // For demo, using mock sanctioned addresses
            this.sanctionedAddresses = new Set([
                '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Example sanctioned address
                '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',  // Example sanctioned address
                // Add more mock addresses for demo
            ]);
            
            console.log(`📋 Loaded ${this.sanctionedAddresses.size} sanctioned addresses`);
        } catch (error) {
            console.error('❌ Failed to load OFAC list:', error.message);
            this.sanctionedAddresses = new Set();
        }
    }

    /**
     * Analyze a transaction for compliance violations
     */
    async analyzeTransaction(transactionData, context = {}) {
        console.log(`🔍 Analyzing transaction: ${transactionData.signature.substring(0, 8)}...`);

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

            console.log(`📊 Analysis complete - Risk: ${analysis.riskLevel}, Status: ${analysis.complianceStatus}`);

            // Notify other agents
            await this.notifyAgents('analysis_complete', analysis);

            return analysis;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            analysis.complianceStatus = 'error';
            analysis.error = error.message;
            return analysis;
        }
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

        // Check all involved addresses
        const addresses = new Set();
        
        // Add wallet address
        addresses.add(transactionData.wallet);
        
        // Add addresses from balance changes
        transactionData.balanceChanges?.forEach(change => {
            addresses.add(change.account);
        });

        for (const address of addresses) {
            if (this.sanctionedAddresses.has(address)) {
                result.violations.push({
                    type: 'OFAC_VIOLATION',
                    severity: 'critical',
                    address: address,
                    message: `Transaction involves OFAC sanctioned address: ${address}`,
                    regulation: 'OFAC'
                });
                result.riskScore += 0.9;
            }
        }

        return result;
    }

    /**
     * Analyze transaction patterns for suspicious activity
     */
    async analyzePatterns(transactionData, context) {
        const result = {
            violations: [],
            warnings: [],
            riskScore: 0
        };

        // High-frequency trading pattern
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

        // Round-trip transactions (potential layering)
        if (this.detectRoundTrip(transactionData, context)) {
            result.warnings.push({
                type: 'ROUND_TRIP_PATTERN',
                severity: 'high',
                message: 'Potential layering pattern detected'
            });
            result.riskScore += 0.4;
        }

        return result;
    }

    /**
     * Perform AI-powered analysis using Mistral
     */
    async performAIAnalysis(transactionData, context) {
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
            console.error('❌ AI analysis failed:', error.message);
            return {
                violations: [],
                warnings: [{
                    type: 'AI_ANALYSIS_FAILED',
                    severity: 'low',
                    message: 'AI analysis unavailable'
                }],
                riskScore: 0,
                explanation: 'AI analysis failed'
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
- Fee: ${transactionData.fee / 1000000000} SOL
- Status: ${transactionData.status}
- Instructions: ${transactionData.instructions?.length || 0}

CONTEXT:
- Recent transaction count: ${context.recentTransactionCount || 0}
- Wallet label: ${transactionData.walletLabel || 'Unknown'}
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
     * Parse AI response into structured format
     */
    parseAIResponse(aiResponse) {
        try {
            // Try to extract JSON from response
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

        // Fallback: parse text response
        return {
            violations: [],
            warnings: [],
            riskScore: 0.1,
            explanation: aiResponse
        };
    }

    /**
     * Detect round-trip transaction patterns
     */
    detectRoundTrip(transactionData, context) {
        // Simple heuristic - in production would use more sophisticated pattern matching
        return context.recentTransactionCount > 5 && 
               transactionData.balanceChanges?.some(change => Math.abs(change.change) < 1000000); // Small amounts
    }

    /**
     * Determine overall compliance status
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
     * Determine risk level based on score
     */
    determineRiskLevel(riskScore) {
        if (riskScore >= this.riskThresholds.high) return 'high';
        if (riskScore >= this.riskThresholds.medium) return 'medium';
        if (riskScore >= this.riskThresholds.low) return 'low';
        return 'minimal';
    }

    /**
     * Generate compliance recommendations
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
     * Notify other agents via Coral Protocol
     */
    async notifyAgents(eventType, data) {
        try {
            await axios.post(`${this.coralServerUrl}/threads/broadcast`, {
                from: 'analyst-agent',
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
            agentId: 'analyst-agent',
            complianceRules: Object.keys(this.complianceRules),
            sanctionedAddressCount: this.sanctionedAddresses?.size || 0,
            riskThresholds: this.riskThresholds,
            lastUpdate: new Date().toISOString()
        };
    }
}

module.exports = AnalystAgent;
