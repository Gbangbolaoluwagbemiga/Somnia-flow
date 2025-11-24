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
# Option 1: Using ts-node (if installed)
npx ts-node scripts/register-somnia-schemas.ts

# Option 2: Using hardhat
npx hardhat run scripts/register-somnia-schemas.ts --network somniaTestnet
```

This registers 5 schemas:

- `secureflow_job_posting` - For job posting events
- `secureflow_milestone_update` - For milestone status changes
- `secureflow_escrow_status` - For escrow status updates
- `secureflow_application` - For job applications
- `secureflow_dispute` - For dispute events

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

## 🌊 Somnia Data Streams Integration

SecureFlow leverages **Somnia Data Streams** to provide real-time, reactive updates across the platform. Instead of polling the blockchain, the app subscribes to live data streams for instant notifications.

### How We Use Somnia Data Streams

#### 1. **Real-Time Job Postings**

- New job postings are published to Somnia Data Streams
- Freelancers receive instant notifications when jobs matching their skills are posted
- No need to refresh the page - updates appear automatically

#### 2. **Live Milestone Updates**

- Milestone submissions, approvals, and rejections are streamed in real-time
- Both clients and freelancers see status changes instantly
- Enables collaborative workflows with immediate feedback

#### 3. **Escrow Status Changes**

- Escrow creation, funding, and completion events are streamed
- All parties are notified immediately when escrow status changes
- Enables real-time dashboards and notifications

#### 4. **Application Submissions**

- When freelancers apply to jobs, the event is published to streams
- Job creators receive instant notifications of new applications
- Enables faster hiring decisions

#### 5. **Dispute Notifications**

- Dispute creation and resolution events are streamed
- Arbiters and parties are notified in real-time
- Enables faster dispute resolution

### Technical Implementation

#### Schemas Defined

We've created 5 data schemas for different event types:

```typescript
// Job Posting Schema
"uint64 timestamp, bytes32 jobId, address creator, string title, string description, uint256 budget, uint8 status";

// Milestone Update Schema
"uint64 timestamp, bytes32 escrowId, uint8 milestoneIndex, uint8 status, address submitter, string description";

// Escrow Status Schema
"uint64 timestamp, bytes32 escrowId, uint8 oldStatus, uint8 newStatus, address initiator";

// Application Schema
"uint64 timestamp, bytes32 jobId, bytes32 applicationId, address applicant, string coverLetter, string proposedTimeline";

// Dispute Schema
"uint64 timestamp, bytes32 escrowId, bytes32 disputeId, uint8 milestoneIndex, address initiator, uint8 status";
```

#### Publishing Data

When events occur (e.g., job posted, milestone submitted), we publish to Somnia Data Streams:

```typescript
import { publishJobPosting } from "@/lib/somnia/publisher";

// Publish job posting
await publishJobPosting(
  jobId,
  creatorAddress,
  title,
  description,
  budget,
  status
);
```

#### Subscribing to Updates

The frontend subscribes to relevant streams for real-time updates:

```typescript
import { useSomniaStreams } from "@/contexts/somnia-streams-context";

const { subscribeToJobPostings } = useSomniaStreams();

// Subscribe to new job postings
const unsubscribe = await subscribeToJobPostings((data) => {
  console.log("New job posted!", data);
  // Update UI in real-time
});
```

### Real-Time UX Benefits

- **Instant Notifications**: Users see updates as they happen, no page refresh needed
- **Live Dashboards**: Escrow status, milestone progress, and job listings update automatically
- **Collaborative Workflows**: Multiple users can see the same updates simultaneously
- **Better UX**: No polling, no delays, truly reactive interface

### Files Structure

```
frontend/
├── lib/somnia/
│   ├── schemas.ts          # Data schema definitions
│   ├── somnia-client.ts    # SDK initialization
│   └── publisher.ts        # Functions to publish data
├── contexts/
│   └── somnia-streams-context.tsx  # React context for subscriptions
```

### Registering Schemas

Before using the app, register all schemas on Somnia Testnet:

```bash
node scripts/register-somnia-schemas.js
```

This registers all 5 schemas on-chain, making them discoverable and enabling automatic decoding.

## 🔄 Gasless Transaction Flow

1. **User connects MetaMask** → Smart Account initializes
2. **Transaction request** → Delegation system activates
3. **Gasless execution** → Paymaster sponsors gas fees
4. **Blockchain confirmation** → Transaction completed
5. **Data Streamed** → Event published to Somnia Data Streams
6. **Real-time Update** → Subscribers receive instant notification

## 🛡️ Security Features

- **Reentrancy Protection**: All external functions protected
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Role-based permissions
- **Emergency Pause**: Admin-controlled pause functionality
- **Gas Optimization**: Efficient contract design

## 🎯 Hackathon Submission

### Somnia Data Streams Mini Hackathon (Nov 4-15, 2025)

This project is tailored for the **Somnia Data Streams Mini Hackathon** and demonstrates:

✅ **Technical Excellence**: Fully functional dApp with comprehensive SDS integration  
✅ **Real-Time UX**: Leverages Somnia Data Streams for instant, reactive updates  
✅ **Somnia Integration**: Deployed on Somnia Dream Testnet  
✅ **Potential Impact**: Production-ready platform with real-world use case

### Submission Requirements Met

- ✅ **Public GitHub Repo**: [Your repo link]
- ✅ **Working Web3 dApp**: Deployed on Somnia Testnet
- ✅ **Demo Video**: [Link to 3-5 min demo video]
- ✅ **README**: Comprehensive documentation explaining SDS usage

### How Somnia Data Streams is Used

1. **Data Publishing**: All major events (job postings, milestones, applications) are published to Somnia Data Streams
2. **Real-Time Subscriptions**: Frontend subscribes to relevant streams for instant updates
3. **Reactive UI**: No polling needed - UI updates automatically when events occur
4. **Composable Data**: Schemas enable interoperability with other Somnia-based apps

### Key Integration Points

- **Job Marketplace**: Real-time job posting notifications
- **Milestone Tracking**: Live updates on milestone status changes
- **Application System**: Instant notifications when freelancers apply
- **Escrow Management**: Real-time escrow status updates
- **Dispute Resolution**: Live dispute notifications

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
- [x] **Somnia Data Streams integration** 🎯

### Phase 3: Optimization

- [ ] Enhanced real-time features with WebSocket subscriptions
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

## 📚 Resources

### Somnia Data Streams

- **Official Docs**: https://docs.somnia.network
- **Data Streams Info**: https://datastreams.somnia.network
- **SDK Package**: https://www.npmjs.com/package/@somnia-chain/streams
- **Quickstart Guide**: https://docs.somnia.network/somnia-data-streams/getting-started/quickstart

### Somnia Network

- **Testnet RPC**: https://dream-rpc.somnia.network
- **Testnet Explorer**: https://dream.somnia.network
- **Telegram**: https://t.me/+XHq0F0JXMyhmMzM0
- **X (Twitter)**: https://x.com/SomniaEco

## 🆘 Support

- **GitHub Issues**: [Report bugs](https://github.com/your-org/secureflow/issues)
- **Documentation**: See project docs for detailed guides
- **Hackathon Support**: Join [Somnia Telegram](https://t.me/+XHq0F0JXMyhmMzM0) for hackathon queries

---

**Built with ❤️ for the decentralized future of work**

_SecureFlow - Where trust meets technology, powered by Somnia Data Streams_ 🚀
