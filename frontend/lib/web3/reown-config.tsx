"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

// Get projectId from environment
const projectId =
  process.env.NEXT_PUBLIC_REOWN_ID || "1db88bda17adf26df9ab7799871788c4";

// Create metadata
const metadata = {
  name: "SecureFlow",
  description: "Secure Escrow Platform powered by Somnia Data Streams",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://secureflow.app",
  icons: ["/secureflow-logo.svg"],
};

// Somnia Dream Testnet configuration - AppKit simplified format
const somniaTestnet = {
  id: 50312,
  name: "Somnia Dream Testnet",
  currency: "STT",
  explorerUrl: "https://dream.somnia.network",
  rpcUrl: "https://dream-rpc.somnia.network",
} as const;

// Log initialization
if (typeof window !== "undefined") {
  console.log("[AppKit] Initializing AppKit with Somnia Dream Testnet only");
}

// Create the AppKit instance - ONLY Somnia Testnet
// Note: localhost:8545 errors are expected when no wallet is connected
// They will stop once you connect your wallet
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks: [somniaTestnet as any], // Only Somnia - using 'as any' to bypass strict type checking
  projectId,
  features: {
    analytics: false,
  },
  enableEIP6963: true,
  enableCoinbase: true,
});

console.log("[AppKit] AppKit initialized with Somnia Dream Testnet");

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
