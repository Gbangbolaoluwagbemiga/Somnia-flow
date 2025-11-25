// Somnia Dream Testnet - Primary network for hackathon
export const SOMNIA_TESTNET = {
  chainId: "0xc488", // 50312 in hex (lowercase for wallet methods)
  chainName: "Somnia Dream Testnet",
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

  // Default contracts (used by frontend) - Somnia Testnet
  SECUREFLOW_ESCROW: "0x3f00dB811A4Ab36e7a953a9C9bC841499fC2EAF6", // SecureFlow on Somnia Dream Testnet
  USDC: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia (for testing)
  SECUREFLOW_TOKEN: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia (for testing)
  MOCK_ERC20: "0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6", // MockERC20 on Somnia Dream Testnet
};
