# 🚀 ComplyChain API Documentation

## 📋 **Overview**

ComplyChain provides a comprehensive RESTful API for blockchain compliance monitoring, powered by AI agents and Coral Protocol integration.

**Base URL**: `http://localhost:3001`
**API Version**: `v1`
**Authentication**: Bearer token (for protected endpoints)

---

## 🔐 **Authentication**

### Bearer Token Authentication
```bash
Authorization: Bearer <your-token>
```

### Wallet-based Authentication
```bash
X-Wallet-Address: <solana-wallet-address>
X-Wallet-Signature: <signed-message>
```

---

## 📊 **Core Endpoints**

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-20T01:00:00.000Z",
  "agents": {
    "monitor": "active",
    "analyst": "active",
    "auditor": "active"
  }
}
```

### **Agent Status**
```http
GET /api/agents/status
```

**Response:**
```json
{
  "monitor": {
    "agentId": "complychain-monitor-agent",
    "isMonitoring": true,
    "watchedWallets": 5,
    "transactionCount": 1247,
    "lastUpdate": "2025-09-20T01:00:00.000Z"
  },
  "analyst": {
    "agentId": "complychain-analyst-agent",
    "complianceRules": ["ofac", "fatf", "bsa"],
    "sanctionedAddressCount": 2,
    "mistralConfigured": true,
    "lastUpdate": "2025-09-20T01:00:00.000Z"
  },
  "auditor": {
    "agentId": "complychain-auditor-agent",
    "reportsGenerated": 42,
    "certificatesMinted": 15,
    "crossmintConfigured": true,
    "lastUpdate": "2025-09-20T01:00:00.000Z"
  },
  "coralProtocol": "active"
}
```

---

## 🔍 **Monitoring Endpoints**

### **Add Wallet to Monitoring**
```http
POST /api/monitor/add-wallet
```

**Request Body:**
```json
{
  "address": "DemoWallet123456789",
  "label": "My Demo Wallet"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet added to monitoring",
  "wallet": {
    "address": "DemoWallet123456789",
    "label": "My Demo Wallet",
    "addedAt": "2025-09-20T01:00:00.000Z"
  }
}
```

### **Get Monitored Transactions**
```http
GET /api/monitor/transactions?limit=20&since=2025-09-19T00:00:00.000Z
```

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 20, max: 100)
- `since` (optional): ISO timestamp to filter transactions since

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "signature": "demo_1234567890_abc123",
      "slot": 12345,
      "wallet": "DemoWallet123456789",
      "walletLabel": "My Demo Wallet",
      "fee": 5000,
      "status": "success",
      "balanceChanges": [
        {
          "account": "DemoWallet123456789",
          "preBalance": 1000000000,
          "postBalance": 999000000,
          "change": -1000000
        }
      ],
      "timestamp": "2025-09-20T01:00:00.000Z",
      "complianceStatus": "compliant"
    }
  ],
  "count": 1,
  "hasMore": false
}
```

---

## 🤖 **Analysis Endpoints**

### **Analyze Transaction**
```http
POST /api/analyst/analyze
```

**Request Body:**
```json
{
  "transactionData": {
    "signature": "demo_1234567890_abc123",
    "wallet": "DemoWallet123456789",
    "balanceChanges": [
      {
        "account": "DemoWallet123456789",
        "change": -1000000
      }
    ],
    "timestamp": "2025-09-20T01:00:00.000Z"
  },
  "context": {
    "recentTransactionCount": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "transactionId": "demo_1234567890_abc123",
    "riskScore": 0.1,
    "riskLevel": "low",
    "complianceStatus": "compliant",
    "violations": [],
    "warnings": [],
    "recommendations": [
      "Continue standard monitoring procedures"
    ],
    "aiExplanation": "Transaction appears normal with standard transfer pattern",
    "timestamp": "2025-09-20T01:00:00.000Z"
  }
}
```

### **Screen Address**
```http
POST /api/analyst/screen-address
```

**Request Body:**
```json
{
  "address": "DemoWallet123456789"
}
```

**Response:**
```json
{
  "success": true,
  "screening": {
    "address": "DemoWallet123456789",
    "sanctioned": false,
    "riskLevel": "low",
    "source": null,
    "timestamp": "2025-09-20T01:00:00.000Z"
  }
}
```

---

## 📋 **Reporting Endpoints**

### **Generate Compliance Report**
```http
POST /api/auditor/generate-report
```

**Request Body:**
```json
{
  "transactions": [],
  "period": {
    "startDate": "2025-09-19T00:00:00.000Z",
    "endDate": "2025-09-20T00:00:00.000Z"
  },
  "walletAddress": "DemoWallet123456789"
}
```

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "RPT_1726789200000_abc123",
    "generatedAt": "2025-09-20T01:00:00.000Z",
    "summary": {
      "totalTransactions": 10,
      "violationsFound": 0,
      "warningsIssued": 1,
      "complianceScore": 95.5,
      "riskLevel": "low"
    },
    "executiveSummary": {
      "overview": "Compliance analysis for 10 transactions...",
      "keyFindings": [
        "0 critical violations identified",
        "1 warnings flagged for review",
        "Overall compliance score: 95.5/100"
      ],
      "complianceStatus": "COMPLIANT"
    }
  }
}
```

### **Mint Compliance Certificate**
```http
POST /api/auditor/mint-certificate
```

**Request Body:**
```json
{
  "reportId": "RPT_1726789200000_abc123",
  "recipientAddress": "DemoWallet123456789"
}
```

**Response:**
```json
{
  "success": true,
  "certificate": {
    "id": "cert_001",
    "reportId": "RPT_1726789200000_abc123",
    "recipientAddress": "DemoWallet123456789",
    "blockchainTxId": "demo_tx_1726789200000",
    "nftId": "demo_nft_cert_001",
    "mintedAt": "2025-09-20T01:00:00.000Z",
    "metadata": {
      "name": "ComplyChain Compliance Certificate #1",
      "description": "Automated compliance certificate...",
      "attributes": [
        {
          "trait_type": "Compliance Score",
          "value": "95.5/100"
        }
      ]
    }
  }
}
```

---

## 🎬 **Demo Endpoints**

### **Full Workflow Demo**
```http
POST /api/demo/full-workflow
```

**Request Body:**
```json
{
  "walletAddress": "DemoWallet123456789"
}
```

**Response:**
```json
{
  "success": true,
  "coralProtocol": true,
  "threadId": "thread_1726789200000",
  "results": {
    "wallet": {
      "address": "DemoWallet123456789",
      "added": true
    },
    "monitoring": {
      "started": true,
      "watchedWallets": 1
    },
    "transaction": {
      "signature": "demo_1726789200000_xyz789",
      "processed": true
    },
    "analysis": {
      "riskScore": 0.1,
      "complianceStatus": "compliant"
    },
    "report": {
      "id": "RPT_1726789200000_demo",
      "complianceScore": 95.5
    }
  }
}
```

---

## 💳 **Payment Endpoints**

### **Create Subscription**
```http
POST /api/subscriptions/create
```

**Request Body:**
```json
{
  "walletAddress": "DemoWallet123456789",
  "plan": "lifetime",
  "transactionSignature": "payment_tx_signature_here"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_1726789200000",
    "walletAddress": "DemoWallet123456789",
    "plan": "lifetime",
    "status": "active",
    "createdAt": "2025-09-20T01:00:00.000Z",
    "expiresAt": null
  }
}
```

---

## 🌊 **Coral Protocol Endpoints**

### **Get Agent Registry**
```http
GET /api/coral/registry
```

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "id": "complychain-monitor-agent",
      "name": "ComplyChain Monitor Agent",
      "description": "Monitors Solana blockchain transactions for compliance violations",
      "capabilities": [
        "blockchain-monitoring",
        "transaction-parsing",
        "real-time-streaming"
      ],
      "pricing": {
        "model": "usage",
        "rate": 0.1,
        "currency": "SOL",
        "unit": "day"
      }
    }
  ]
}
```

---

## 🚨 **Error Responses**

### **Standard Error Format**
```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-09-20T01:00:00.000Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

### **Validation Error**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "walletAddress",
      "message": "Invalid Solana wallet address format"
    }
  ],
  "timestamp": "2025-09-20T01:00:00.000Z"
}
```

### **Rate Limit Error**
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "retryAfter": "15 minutes",
  "timestamp": "2025-09-20T01:00:00.000Z"
}
```

---

## 📈 **Rate Limits**

| Endpoint Category | Requests per Window | Window Duration |
|------------------|-------------------|-----------------|
| General API | 100 requests | 15 minutes |
| Demo Endpoints | 5 requests | 5 minutes |
| Payment Endpoints | 20 requests | 1 hour |
| Sensitive Operations | 10 requests | 15 minutes |

---

## 🔌 **WebSocket Events**

### **Connection**
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### **Events**
- `agent_status_update` - Agent status changes
- `new_transaction` - New monitored transaction
- `compliance_alert` - Compliance violation detected
- `report_generated` - New compliance report available
- `demo_workflow_complete` - Demo workflow finished

### **Example Event**
```json
{
  "type": "new_transaction",
  "data": {
    "signature": "demo_1726789200000_xyz789",
    "wallet": "DemoWallet123456789",
    "complianceStatus": "compliant",
    "timestamp": "2025-09-20T01:00:00.000Z"
  }
}
```

---

## 🛠️ **SDK Examples**

### **JavaScript/Node.js**
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add wallet to monitoring
const addWallet = async (address, label) => {
  const response = await client.post('/api/monitor/add-wallet', {
    address,
    label
  });
  return response.data;
};

// Run demo workflow
const runDemo = async (walletAddress) => {
  const response = await client.post('/api/demo/full-workflow', {
    walletAddress
  });
  return response.data;
};
```

### **Python**
```python
import requests

class ComplyChainClient:
    def __init__(self, base_url="http://localhost:3001"):
        self.base_url = base_url
        
    def add_wallet(self, address, label=""):
        response = requests.post(
            f"{self.base_url}/api/monitor/add-wallet",
            json={"address": address, "label": label}
        )
        return response.json()
        
    def run_demo(self, wallet_address):
        response = requests.post(
            f"{self.base_url}/api/demo/full-workflow",
            json={"walletAddress": wallet_address}
        )
        return response.json()
```

---

## 🔍 **Testing**

### **Health Check**
```bash
curl http://localhost:3001/health
```

### **Run Demo**
```bash
curl -X POST http://localhost:3001/api/demo/full-workflow \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "DemoWallet123456789"}'
```

### **Get Agent Status**
```bash
curl http://localhost:3001/api/agents/status
```

---

*This API documentation is automatically updated with each release. For the latest version, visit our GitHub repository.*
