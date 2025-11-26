"use client";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

// CRITICAL: Clear cached WalletConnect/AppKit storage to prevent localhost:8545 errors
// AppKit stores the last connected wallet and tries to restore it with invalid RPC
if (typeof window !== "undefined") {
  // Clear any existing WalletConnect/AppKit storage on load
  const wcKeys = Object.keys(localStorage).filter(
    (key) =>
      key.startsWith("wc@2") ||
      key.startsWith("@w3m") ||
      key.startsWith("@appkit") ||
      key.includes("WALLETCONNECT")
  );
  wcKeys.forEach((key) => localStorage.removeItem(key));
  if (wcKeys.length > 0) {
    console.log(
      `[AppKit] Cleared ${wcKeys.length} cached wallet connection keys`
    );
  }

  // Also clear IndexedDB if possible
  if (indexedDB.databases) {
    indexedDB.databases().then((databases) => {
      databases.forEach((db) => {
        if (
          db.name?.includes("WALLET_CONNECT") ||
          db.name?.includes("appkit")
        ) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    });
  }
}

const projectId =
  process.env.NEXT_PUBLIC_REOWN_ID || "1db88bda17adf26df9ab7799871788c4";

const metadata = {
  name: "SecureFlow",
  description: "Secure Escrow Platform powered by Somnia Data Streams",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://secureflow.app",
  icons: ["/secureflow-logo.svg"],
};

// Somnia Dream Testnet - proper Wagmi/Viem format for AppKit
const somniaTestnet = {
  id: 50312, // Use 'id' instead of 'chainId' for AppKit compatibility
  chainId: 50312, // Keep for compatibility
  name: "Somnia Dream Testnet",
  nativeCurrency: {
    name: "STT",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://dream-rpc.somnia.network"],
    },
    public: {
      http: ["https://dream-rpc.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://dream.somnia.network",
    },
  },
  testnet: true,
};

console.log("[AppKit] Initializing AppKit with Somnia Dream Testnet only");

// Singleton pattern to ensure createAppKit is only called once
let appKitInitialized = false;

// Create modal with proper config - must be called synchronously at module load
// Use a function to ensure it's called even if it fails during SSR
function initializeAppKit() {
  if (appKitInitialized) {
    return;
  }

  try {
    createAppKit({
      adapters: [new EthersAdapter()],
      metadata,
      networks: [somniaTestnet],
      projectId,
      defaultNetwork: somniaTestnet,
      features: {
        analytics: false,
        email: false, // Disable email wallet
        socials: [], // Disable social logins
      },
      // CRITICAL: Enable only necessary wallet options
      enableWalletConnect: true,
      enableInjected: true,
      enableEIP6963: true,
      enableCoinbase: false, // Disable Coinbase since it might cause localhost issues
    });

    appKitInitialized = true;
    if (typeof window !== "undefined") {
      console.log("[AppKit] AppKit initialized with Somnia Dream Testnet");
    }
  } catch (error) {
    // During SSR/build, this might fail - that's OK, we'll retry on client
    // Only log warnings on client side to avoid build errors
    if (typeof window !== "undefined") {
      console.warn("[AppKit] Initialization warning (can be ignored):", error);
    }
    // Don't set appKitInitialized to true if it failed, so we can retry
  }
}

// Initialize immediately
initializeAppKit();

// Also ensure initialization on client side if it failed during SSR
if (typeof window !== "undefined") {
  // Use a small delay to ensure window is fully available
  if (typeof window.requestIdleCallback !== "undefined") {
    window.requestIdleCallback(() => {
      if (!appKitInitialized) {
        initializeAppKit();
      }
    });
  } else {
    setTimeout(() => {
      if (!appKitInitialized) {
        initializeAppKit();
      }
    }, 0);
  }
}

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
