/**
 * Somnia Data Streams Client
 * 
 * Handles initialization and management of Somnia Data Streams SDK
 * for publishing and subscribing to real-time data.
 */

import { SDK, SchemaEncoder, zeroBytes32 } from '@somnia-chain/streams';
import { createPublicClient, createWalletClient, http, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

// Define Somnia Dream Testnet
export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Dream',
  network: 'somnia-dream',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network'] },
    public: { http: ['https://dream-rpc.somnia.network'] },
  },
});

let sdkInstance: SDK | null = null;
let publicClientInstance: ReturnType<typeof createPublicClient> | null = null;
let walletClientInstance: ReturnType<typeof createWalletClient> | null = null;

/**
 * Initialize Somnia SDK with public client (for reading/subscribing)
 */
export function initSomniaSDKPublic(rpcUrl?: string): SDK {
  if (sdkInstance && publicClientInstance) {
    return sdkInstance;
  }

  const rpc = rpcUrl || 'https://dream-rpc.somnia.network';
  publicClientInstance = createPublicClient({
    chain: somniaTestnet,
    transport: http(rpc),
  });

  sdkInstance = new SDK({
    public: publicClientInstance,
  });

  return sdkInstance;
}

/**
 * Initialize Somnia SDK with wallet client (for writing)
 * Note: Only use in server-side or secure environments
 */
export function initSomniaSDKWithWallet(
  privateKey: `0x${string}`,
  rpcUrl?: string
): SDK {
  const rpc = rpcUrl || 'https://dream-rpc.somnia.network';
  const account = privateKeyToAccount(privateKey);

  walletClientInstance = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(rpc),
  });

  publicClientInstance = createPublicClient({
    chain: somniaTestnet,
    transport: http(rpc),
  });

  sdkInstance = new SDK({
    public: publicClientInstance,
    wallet: walletClientInstance,
  });

  return sdkInstance;
}

/**
 * Get the current SDK instance
 */
export function getSomniaSDK(): SDK {
  if (!sdkInstance) {
    return initSomniaSDKPublic();
  }
  return sdkInstance;
}

/**
 * Create a schema encoder for a given schema string
 */
export function createSchemaEncoder(schema: string): SchemaEncoder {
  return new SchemaEncoder(schema);
}

/**
 * Register all SecureFlow schemas on-chain
 * This should be called once during setup
 */
export async function registerSecureFlowSchemas(
  privateKey?: `0x${string}`,
  rpcUrl?: string
): Promise<void> {
  const sdk = privateKey
    ? initSomniaSDKWithWallet(privateKey, rpcUrl)
    : getSomniaSDK();

  const {
    JOB_POSTING_SCHEMA,
    MILESTONE_UPDATE_SCHEMA,
    ESCROW_STATUS_SCHEMA,
    APPLICATION_SCHEMA,
    DISPUTE_SCHEMA,
  } = await import('./schemas');
  const { SCHEMA_NAMES } = await import('./schemas');

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

  try {
    const txHash = await sdk.streams.registerDataSchemas(schemas, true);
    if (txHash) {
      console.log('✅ SecureFlow schemas registered:', txHash);
    } else {
      console.log('ℹ️ Schemas already registered');
    }
  } catch (error) {
    console.error('Error registering schemas:', error);
    throw error;
  }
}

export { somniaTestnet };

