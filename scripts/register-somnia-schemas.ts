/**
 * Script to register SecureFlow schemas on Somnia Data Streams
 *
 * Run this script once to register all schemas on-chain:
 * npx ts-node scripts/register-somnia-schemas.ts
 *
 * Or compile and run:
 * npx hardhat run scripts/register-somnia-schemas.ts
 */

import { config } from "dotenv";
import { registerSecureFlowSchemas } from "../frontend/lib/somnia/somnia-client";

config();

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
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
    await registerSecureFlowSchemas(privateKey, rpcUrl);
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
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
