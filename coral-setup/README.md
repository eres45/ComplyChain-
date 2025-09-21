# Coral Protocol Setup for ComplyChain

This directory contains the setup and configuration for integrating Coral Protocol with ComplyChain.

## Prerequisites

- Java 11+ (for Coral Server)
- Node.js 18+ (for Coral Studio)
- Git

## Quick Setup

1. **Clone Coral Protocol repositories:**
```bash
# From the coral-setup directory
git clone -b stabletutorial https://github.com/Coral-Protocol/coral-server server
git clone -b stabletutorial https://github.com/Coral-Protocol/coral-studio studio
```

2. **Launch Coral Server:**
```bash
cd server
./gradlew run
```

3. **Launch Coral Studio:**
```bash
cd studio
npm install -g corepack
yarn dev
```

4. **Access Coral Studio:**
Open http://localhost:3000 in your browser

## Agent Configuration

The ComplyChain agents are configured in the `agents/` directory:

- `monitor-agent/` - Transaction monitoring agent
- `analyst-agent/` - Compliance analysis agent  
- `auditor-agent/` - Report generation and NFT minting agent

## Integration Points

- **Coral Server**: Runs on port 5555
- **Agent Communication**: Thread-based collaboration
- **Session Management**: Configured for compliance workflows
- **Data Flow**: Real-time transaction → analysis → reporting

## Troubleshooting

If you encounter issues:

1. Check Coral Server is running on port 5555
2. Verify agent configurations in `application.yaml`
3. Ensure all environment variables are set
4. Check the [Coral Protocol docs](https://docs.coralprotocol.org/help/troubleshooting)

## Next Steps

After setup:
1. Configure your wallet addresses to monitor
2. Set up Mistral AI and Crossmint API keys
3. Run the ComplyChain application
4. Test the agent collaboration workflow
