"use client";

import React, { useEffect } from "react";
import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { ethers } from "ethers";

// Get projectId from environment
const projectId =
  process.env.NEXT_PUBLIC_REOWN_ID || "1db88bda17adf26df9ab7799871788c4";

// Create metadata
const metadata = {
  name: "SecureFlow",
  description: "Secure Escrow Platform for Freelancers",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://secureflow.app",
  icons: ["/secureflow-logo.svg"],
};

// Define networks - Somnia Testnet is first (primary network for hackathon)
const networks = [
  {
    id: 50312,
    name: "Somnia Dream Testnet",
    currency: "STT",
    explorerUrl: "https://dream.somnia.network",
    rpcUrl: "https://dream-rpc.somnia.network",
    iconUrl: "https://dream.somnia.network/favicon.ico", // Network icon
  },
  {
    id: 8453,
    name: "Base",
    currency: "ETH",
    explorerUrl: "https://basescan.org",
    rpcUrl: "https://mainnet.base.org",
  },
  {
    id: 84532,
    name: "Base Sepolia Testnet",
    currency: "ETH",
    explorerUrl: "https://sepolia.basescan.org",
    rpcUrl: "https://sepolia.base.org",
  },
];

// Log initialization
if (typeof window !== "undefined") {
  console.log("[AppKit Config] Initializing AppKit with networks:", networks);
}

// Create the AppKit instance
// Configure to work even if remote APIs fail
createAppKit({
  adapters: [new EthersAdapter()],
  metadata,
  networks,
  projectId,
  defaultChain: networks[0], // Set Somnia Testnet as default
  features: {
    analytics: false, // Disable analytics to reduce API calls
  },
  enableEIP6963: true,
  enableCoinbase: true,
  // Disable remote config fetching - use local defaults
  enableAccountView: true,
  enableNetworkView: true,
});

console.log("[AppKit Config] AppKit initialized");

// Log any errors that occur after initialization
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (event.message?.includes("localhost:8545")) {
      console.warn(
        "[AppKit] Ignoring localhost:8545 error (expected when no wallet connected):",
        event.message
      );
      event.preventDefault(); // Prevent error from showing in console
    }
  });

  // Also catch unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const reason = String(event.reason || "");
    if (
      reason.includes("localhost:8545") ||
      reason.includes("Connection refused")
    ) {
      console.warn(
        "[AppKit] Ignoring localhost:8545 promise rejection (expected when no wallet connected)"
      );
      event.preventDefault(); // Prevent error from showing in console
    }
  });
}

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
