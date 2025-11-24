/**
 * Script to register SecureFlow schemas on Somnia Data Streams
 *
 * Run this script once to register all schemas on-chain:
 * node scripts/register-somnia-schemas.js
 */

require("dotenv").config();
const { SDK, zeroBytes32 } = require("@somnia-chain/streams");
const { createPublicClient, createWalletClient, http } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { defineChain } = require("viem");

// Define Somnia Dream Testnet
const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Dream",
  network: "somnia-dream",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
    public: { http: ["https://dream-rpc.somnia.network"] },
  },
});

// Define schemas
const JOB_POSTING_SCHEMA =
  "uint64 timestamp, bytes32 jobId, address creator, string title, string description, uint256 budget, uint8 status";

const MILESTONE_UPDATE_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, uint8 milestoneIndex, uint8 status, address submitter, string description";

const ESCROW_STATUS_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, uint8 oldStatus, uint8 newStatus, address initiator";

const APPLICATION_SCHEMA =
  "uint64 timestamp, bytes32 jobId, bytes32 applicationId, address applicant, string coverLetter, string proposedTimeline";

const DISPUTE_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, bytes32 disputeId, uint8 milestoneIndex, address initiator, uint8 status";

const SCHEMA_NAMES = {
  JOB_POSTING: "secureflow_job_posting",
  MILESTONE_UPDATE: "secureflow_milestone_update",
  ESCROW_STATUS: "secureflow_escrow_status",
  APPLICATION: "secureflow_application",
  DISPUTE: "secureflow_dispute",
};

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl =
    process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";

  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    console.log("Please add your private key to .env:");
    console.log("PRIVATE_KEY=0x...");
    process.exit(1);
  }

  console.log("🚀 Registering SecureFlow schemas on Somnia Data Streams...");
  console.log("RPC URL:", rpcUrl);
  console.log("");

  try {
    // Initialize SDK with wallet
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: somniaTestnet,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain: somniaTestnet,
      transport: http(rpcUrl),
    });

    const sdk = new SDK({
      public: publicClient,
      wallet: walletClient,
    });

    const schemas = [
      {
        schemaName: SCHEMA_NAMES.JOB_POSTING,
        schema: JOB_POSTING_SCHEMA,
        parentSchemaId: zeroBytes32,
      },
      {
        schemaName: SCHEMA_NAMES.MILESTONE_UPDATE,
        schema: MILESTONE_UPDATE_SCHEMA,
        parentSchemaId: zeroBytes32,
      },
      {
        schemaName: SCHEMA_NAMES.ESCROW_STATUS,
        schema: ESCROW_STATUS_SCHEMA,
        parentSchemaId: zeroBytes32,
      },
      {
        schemaName: SCHEMA_NAMES.APPLICATION,
        schema: APPLICATION_SCHEMA,
        parentSchemaId: zeroBytes32,
      },
      {
        schemaName: SCHEMA_NAMES.DISPUTE,
        schema: DISPUTE_SCHEMA,
        parentSchemaId: zeroBytes32,
      },
    ];

    console.log("📝 Registering schemas...");
    const txHash = await sdk.streams.registerDataSchemas(schemas, true);

    if (txHash) {
      console.log("✅ SecureFlow schemas registered!");
      console.log("Transaction hash:", txHash);
      console.log("Explorer:", `https://dream.somnia.network/tx/${txHash}`);
    } else {
      console.log("ℹ️ Schemas already registered");
    }

    console.log("");
    console.log("✅ All schemas registered successfully!");
    console.log("");
    console.log("Registered schemas:");
    console.log("  - secureflow_job_posting");
    console.log("  - secureflow_milestone_update");
    console.log("  - secureflow_escrow_status");
    console.log("  - secureflow_application");
    console.log("  - secureflow_dispute");
  } catch (error) {
    console.error("❌ Error registering schemas:", error);
    if (error.message) {
      console.error("Error message:", error.message);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
