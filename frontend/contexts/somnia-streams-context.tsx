"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { SDK, SchemaEncoder } from "@somnia-chain/streams";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { somniaTestnet, initSomniaSDKPublic } from "@/lib/somnia/somnia-client";
import {
  JOB_POSTING_SCHEMA,
  MILESTONE_UPDATE_SCHEMA,
  ESCROW_STATUS_SCHEMA,
  APPLICATION_SCHEMA,
  DISPUTE_SCHEMA,
  RATING_SCHEMA,
  EVENT_SCHEMA_IDS,
} from "@/lib/somnia/schemas";
import { useWeb3 } from "./web3-context";

interface SomniaStreamsContextType {
  sdk: SDK | null;
  isInitialized: boolean;
  subscribeToJobPostings: (onData: (data: any) => void) => Promise<() => void>;
  subscribeToMilestoneUpdates: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToMilestoneSubmissions: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToMilestoneApprovals: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToMilestoneRejections: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToEscrowStatus: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToApplications: (
    jobId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToDisputes: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
  subscribeToRatings: (
    escrowId: string,
    onData: (data: any) => void
  ) => Promise<() => void>;
}

const SomniaStreamsContext = createContext<
  SomniaStreamsContextType | undefined
>(undefined);

export function SomniaStreamsProvider({ children }: { children: ReactNode }) {
  const { wallet } = useWeb3();
  const [sdk, setSdk] = useState<SDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [subscriptions, setSubscriptions] = useState<
    Map<string, { unsubscribe: () => void }>
  >(new Map());

  // Initialize SDK when wallet is connected and on Somnia network
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Check if connected to Somnia network
        const chainId = wallet.chainId;
        const chainIdStr = chainId?.toString();
        const isSomniaNetwork =
          chainId === 50312 || chainIdStr === "0xC4A8" || chainIdStr === "50312";

        if (isSomniaNetwork || !wallet.isConnected) {
          // Initialize with public client for reading/subscribing
          const initializedSDK = initSomniaSDKPublic();
          setSdk(initializedSDK);
          setIsInitialized(true);
          console.log("✅ Somnia Data Streams SDK initialized");
        }
      } catch (error) {
        console.error("Error initializing Somnia SDK:", error);
        setIsInitialized(false);
      }
    };

    initSDK();
  }, [wallet.isConnected, wallet.chainId]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      subscriptions.forEach((sub) => {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing:", error);
        }
      });
      subscriptions.clear();
    };
  }, []);

  const subscribeToJobPostings = useCallback(
    async (onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        // Register event schema if not already registered
        const eventSchemaId = EVENT_SCHEMA_IDS.JOB_POSTED;
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: eventSchemaId,
          ethCalls: [],
          onData,
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `job_postings_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to job postings:", error);
        // Fallback: return no-op function
        return () => {};
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToMilestoneUpdates = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const schemaId = await sdk.streams.computeSchemaId(
          MILESTONE_UPDATE_SCHEMA
        );
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.MILESTONE_UPDATED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            // Filter by escrowId
            const encoder = new SchemaEncoder(MILESTONE_UPDATE_SCHEMA);
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              if (escrowIdField?.value === escrowId) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `milestone_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to milestone updates:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToEscrowStatus = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.ESCROW_STATUS_CHANGED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            // Filter by escrowId
            const encoder = new SchemaEncoder(ESCROW_STATUS_SCHEMA);
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              if (escrowIdField?.value === escrowId) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `escrow_status_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to escrow status:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToApplications = useCallback(
    async (jobId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.APPLICATION_SUBMITTED,
          ethCalls: [],
          context: "topic1", // jobId in event
          onData: (data) => {
            // Filter by jobId
            const encoder = new SchemaEncoder(APPLICATION_SCHEMA);
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const jobIdField = fields.find((f: any) => f.name === "jobId");
              if (jobIdField?.value === jobId) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `applications_${jobId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to applications:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToDisputes = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.DISPUTE_CREATED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            // Filter by escrowId
            const encoder = new SchemaEncoder(DISPUTE_SCHEMA);
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              if (escrowIdField?.value === escrowId) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `disputes_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to disputes:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToRatings = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.FREELANCER_RATED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            // Filter by escrowId
            const encoder = new SchemaEncoder(RATING_SCHEMA);
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              if (escrowIdField?.value === escrowId) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `ratings_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to ratings:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToMilestoneSubmissions = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.MILESTONE_SUBMITTED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              // Convert escrowId to string for comparison
              const eventEscrowId = escrowIdField?.value?.toString();
              if (eventEscrowId === escrowId || eventEscrowId === escrowId.toString()) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Milestone submission subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `milestone_submissions_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to milestone submissions:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToMilestoneApprovals = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.MILESTONE_APPROVED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              const eventEscrowId = escrowIdField?.value?.toString();
              if (eventEscrowId === escrowId || eventEscrowId === escrowId.toString()) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Milestone approval subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `milestone_approvals_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to milestone approvals:", error);
      }

      return () => {};
    },
    [sdk]
  );

  const subscribeToMilestoneRejections = useCallback(
    async (escrowId: string, onData: (data: any) => void) => {
      if (!sdk) {
        throw new Error("Somnia SDK not initialized");
      }

      try {
        const subscription = await sdk.streams.subscribe({
          somniaStreamsEventId: EVENT_SCHEMA_IDS.MILESTONE_REJECTED,
          ethCalls: [],
          context: "topic1", // escrowId in event
          onData: (data) => {
            const decoded = Array.isArray(data) ? data : [data];
            decoded.forEach((item) => {
              const fields = item.data || item;
              const escrowIdField = fields.find(
                (f: any) => f.name === "escrowId"
              );
              const eventEscrowId = escrowIdField?.value?.toString();
              if (eventEscrowId === escrowId || eventEscrowId === escrowId.toString()) {
                onData(item);
              }
            });
          },
          onError: (error) => console.error("Milestone rejection subscription error:", error),
          onlyPushChanges: true,
        });

        if (subscription && !(subscription instanceof Error)) {
          const key = `milestone_rejections_${escrowId}_${Date.now()}`;
          setSubscriptions((prev) => new Map(prev.set(key, subscription)));
          return subscription.unsubscribe;
        }
      } catch (error) {
        console.error("Error subscribing to milestone rejections:", error);
      }

      return () => {};
    },
    [sdk]
  );

  return (
    <SomniaStreamsContext.Provider
      value={{
        sdk,
        isInitialized,
        subscribeToJobPostings,
        subscribeToMilestoneUpdates,
        subscribeToMilestoneSubmissions,
        subscribeToMilestoneApprovals,
        subscribeToMilestoneRejections,
        subscribeToEscrowStatus,
        subscribeToApplications,
        subscribeToDisputes,
        subscribeToRatings,
      }}
    >
      {children}
    </SomniaStreamsContext.Provider>
  );
}

export function useSomniaStreams() {
  const context = useContext(SomniaStreamsContext);
  if (context === undefined) {
    throw new Error(
      "useSomniaStreams must be used within a SomniaStreamsProvider"
    );
  }
  return context;
}
