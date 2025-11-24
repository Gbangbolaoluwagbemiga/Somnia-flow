export const BASE_MAINNET = {
  chainId: "0x2105", // 8453 in hex (Base Mainnet)
  chainName: "Base",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [
    "https://mainnet.base.org",
    "https://base-rpc.publicnode.com",
    "https://1rpc.io/base",
    "https://base.llamarpc.com",
  ],
  blockExplorerUrls: ["https://basescan.org"],
};

export const BASE_TESTNET = {
  chainId: "0x14A34", // 84532 in hex (Base Sepolia Testnet)
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

export const SOMNIA_TESTNET = {
  chainId: "0xC4A8", // 50312 in hex (Somnia Dream Testnet)
  chainName: "Somnia Dream",
  nativeCurrency: {
    name: "STT",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: ["https://dream-rpc.somnia.network"],
  blockExplorerUrls: ["https://dream.somnia.network"],
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const CONTRACTS = {
  // Somnia Dream Testnet - DEPLOYED ✅ (Hackathon Deployment)
  SECUREFLOW_ESCROW_SOMNIA: "0x3f00dB811A4Ab36e7a953a9C9bC841499fC2EAF6", // SecureFlow on Somnia Dream Testnet
  MOCK_ERC20_SOMNIA: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia Dream Testnet

  // Base Mainnet - DEPLOYED ✅ (Updated with Rating & Arbiter Features)
  SECUREFLOW_ESCROW_MAINNET: "0xf87ED6B0B54f6B47c59F7e7a0D3C9Bb0F4d236c7", // SecureFlow on Base Mainnet
  USDC_MAINNET: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  SECUREFLOW_TOKEN_MAINNET: "0xdc2D33270ACfC4D573440B9f5648B0C915F44126", // SecureFlow Token (STK) on Base Mainnet

  // Default contracts (used by frontend) - Somnia Testnet for hackathon
  SECUREFLOW_ESCROW: "0x3f00dB811A4Ab36e7a953a9C9bC841499fC2EAF6", // SecureFlow on Somnia Dream Testnet
  USDC: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia (for testing)
  SECUREFLOW_TOKEN: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia (for testing)
  MOCK_ERC20: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia Dream Testnet

  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY || "",
};
