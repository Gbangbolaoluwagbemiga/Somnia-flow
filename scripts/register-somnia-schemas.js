/**
 * Script to register SecureFlow schemas on Somnia Data Streams
 * 
 * Run this script once to register all schemas on-chain:
 * node scripts/register-somnia-schemas.js
 */

require("dotenv").config();
const { registerSecureFlowSchemas } = require("../frontend/lib/somnia/somnia-client");

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";

  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    console.log("Please add your private key to .env:");
    console.log("PRIVATE_KEY=0x...");
    process.exit(1);
  }

  console.log("🚀 Registering SecureFlow schemas on Somnia Data Streams...");
  console.log("RPC URL:", rpcUrl);

  try {
    await registerSecureFlowSchemas(privateKey, rpcUrl);
    console.log("✅ All schemas registered successfully!");
  } catch (error) {
    console.error("❌ Error registering schemas:", error);
    process.exit(1);
  }
}

main();

