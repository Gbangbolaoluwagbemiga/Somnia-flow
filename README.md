# SecureFlow - Decentralized Escrow & Freelance Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.19-blue)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Somnia Data Streams](https://img.shields.io/badge/Somnia-Data%20Streams-purple)](https://docs.somnia.network)

## 🚀 Overview

SecureFlow is a comprehensive decentralized platform combining escrow services with a freelance marketplace, **powered by Somnia Data Streams** for real-time, reactive updates. Built on **Somnia Testnet**, it features gasless transactions, multi-arbiter dispute resolution, reputation systems, and **real-time data streaming** for instant notifications and live updates.

> **Built for Somnia Data Streams Mini Hackathon (Nov 4-15, 2025)**

## ✨ Key Features

### 🏗️ Core Platform

- **Hybrid Escrow + Marketplace**: Direct hires and open job applications
- **Gasless Transactions**: MetaMask Smart Account integration for zero-fee transactions
- **Multi-Arbiter Consensus**: 1-5 arbiters with quorum-based voting
- **Reputation System**: Anti-gaming reputation tracking
- **Native & ERC20 Support**: CELO and whitelisted ERC20 tokens (cUSD on Celo)

### 🎯 Advanced Features

- **Milestone Management**: Submit, approve, reject, dispute milestones
- **Job Applications**: Freelancers apply to open jobs
- **Dispute Resolution**: Time-limited dispute windows with arbiter consensus
- **Real-time Notifications**: Powered by Somnia Data Streams for instant, reactive updates
- **Client Feedback**: Rejection reasons and improvement suggestions
- **Live Data Streaming**: Real-time updates for job postings, milestones, escrow status, and applications using Somnia Data Streams SDK

### 🛡️ Security & Trust

- **Smart Account Integration**: Delegated execution for gasless transactions
- **Paymaster Contract**: Gas sponsorship for seamless UX
- **Reentrancy Protection**: All external functions protected
- **Input Validation**: Comprehensive parameter checking
- **Emergency Controls**: Admin pause and refund mechanisms

## 📁 Project Structure

```
├── contracts/
│   ├── SecureFlow.sol          # Main escrow & marketplace contract
│   └── Paymaster.sol           # Gas sponsorship contract
├── frontend/                   # Next.js application
│   ├── app/                    # App router pages
│   ├── components/             # UI components
│   ├── contexts/               # React contexts
│   │   └── somnia-streams-context.tsx  # Somnia Data Streams integration
│   └── lib/
│       └── somnia/             # Somnia Data Streams utilities
│           ├── schemas.ts      # Data schemas for streaming
│           ├── somnia-client.ts # SDK initialization
│           └── publisher.ts   # Data publishing functions
├── scripts/
│   ├── deploy.js               # Contract deployment
│   ├── deploy-paymaster.js     # Paymaster deployment
│   └── register-somnia-schemas.js # Register SDS schemas
└── test/
    └── SecureFlow.test.js      # Test suite
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask wallet (or compatible Web3 wallet)
- Somnia Testnet (Dream) access
- STT test tokens (request from [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0))

### Installation

1. **Clone and install dependencies**

```bash
git clone https://github.com/your-org/secureflow.git
cd secureflow
npm install
cd frontend
npm install
```

2. **Environment setup**

```bash
# Create .env file in root directory
cat > .env << EOF
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
EOF

# Create frontend/.env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_SOMNIA_RPC_URL=https://dream-rpc.somnia.network
EOF
```

3. **Register Somnia Data Streams Schemas**

```bash
# Register all SecureFlow schemas on Somnia Testnet
node scripts/register-somnia-schemas.js
```

4. **Deploy contracts to Somnia Testnet**

```bash
# Deploy to Somnia Dream Testnet
npx hardhat run scripts/deploy.js --network somniaTestnet
```

5. **Start frontend**

```bash
cd frontend
npm run dev
```

The app will automatically connect to Somnia Testnet and enable real-time data streaming.

## 🎯 User Workflows

### For Clients

1. **Create Escrow** → Set project details, milestones, budget
2. **Manage Projects** → Review submissions, approve/reject milestones
3. **Provide Feedback** → Give rejection reasons for improvements

### For Freelancers

1. **Browse Jobs** → View open listings, apply with proposals
2. **Work Management** → Submit milestones, address feedback
3. **Resubmit** → Improve rejected milestones with updates

### For Arbiters

1. **Dispute Resolution** → Review cases, vote on resolutions
2. **Maintain Integrity** → Help resolve platform disputes

## 🧪 Testing

```bash
# Run smart contract tests
npm test

# Run frontend tests
cd frontend
npm test
```

**Test Coverage**: 26+ tests covering deployment, escrow creation, marketplace functions, work lifecycle, reputation system, and security.

## 🚀 Deployment

### Smart Contracts

```bash
# Deploy to Celo testnet
npx hardhat run scripts/deploy.js --network celoTestnet

# Deploy to Celo mainnet
npx hardhat run scripts/deploy-minimal.js --network celo
```

### Frontend (Vercel)

```bash
# Build for production
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

## 📊 Current Deployment

### Somnia Dream Testnet (Hackathon Deployment) 🎯

- **Network**: Somnia Dream Testnet (Chain ID: 50312)
- **RPC URL**: https://dream-rpc.somnia.network
- **Explorer**: https://dream.somnia.network
- **Status**: ✅ Deployed for Somnia Data Streams Mini Hackathon
- **Native Token**: STT (Somnia Test Token)

> **Note**: This project is configured for Somnia Testnet as part of the Somnia Data Streams Mini Hackathon (Nov 4-15, 2025)

### Previous Deployments

#### Celo Mainnet (Legacy)

- **SecureFlow Contract**: `0x1173Bcc9183f29aFbB6f4C7E3c0b25476D3daF0F`
- **cUSD Token**: `0x765DE816845861e75A25fCA122bb6898B8B1282a`
- **Network**: Celo Mainnet (Chain ID: 42220)
- **Explorer**: https://celoscan.io/address/0x1173Bcc9183f29aFbB6f4C7E3c0b25476D3daF0F

## 🔧 Configuration

### Smart Contract Settings

```solidity
// Platform fees (0% for demo)
uint256 public platformFeePercentage = 0;

// Arbiter management
function authorizeArbiter(address arbiter) external onlyOwner
function revokeArbiter(address arbiter) external onlyOwner
```

### Frontend Configuration

```typescript
// Contract addresses (Celo Mainnet)
export const CONTRACTS = {
  SECUREFLOW_ESCROW: "0x1173Bcc9183f29aFbB6f4C7E3c0b25476D3daF0F",
  CUSD_MAINNET: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  USDC_MAINNET: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
};
```

## 🔄 Gasless Transaction Flow

1. **User connects MetaMask** → Smart Account initializes
2. **Transaction request** → Delegation system activates
3. **Gasless execution** → Paymaster sponsors gas fees
4. **Blockchain confirmation** → Transaction completed

## 🛡️ Security Features

- **Reentrancy Protection**: All external functions protected
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Role-based permissions
- **Emergency Pause**: Admin-controlled pause functionality
- **Gas Optimization**: Efficient contract design

## 📈 Roadmap

### Phase 1: Core Platform ✅

- [x] Smart contract development
- [x] Frontend application
- [x] Basic escrow functionality
- [x] Job marketplace

### Phase 2: Advanced Features ✅

- [x] Gasless transactions
- [x] Smart Account integration
- [x] Dispute resolution
- [x] Reputation system

### Phase 3: Optimization

- [ ] Mobile application
- [ ] Advanced analytics
- [ ] Multi-chain support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **GitHub Issues**: [Report bugs](https://github.com/your-org/secureflow/issues)
- **Documentation**: See project docs for detailed guides

---

**Built with ❤️ for the decentralized future of work**

_SecureFlow - Where trust meets technology_
