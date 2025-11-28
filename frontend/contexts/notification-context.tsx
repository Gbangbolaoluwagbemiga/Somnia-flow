"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useWeb3 } from "./web3-context";
import { useToast } from "@/hooks/use-toast";
import { useSomniaStreams } from "./somnia-streams-context";
import { CONTRACTS } from "@/lib/web3/config";
import { SECUREFLOW_ABI } from "@/lib/web3/abis";
import { hexToString } from "viem";

export interface Notification {
  id: string;
  type: "milestone" | "dispute" | "escrow" | "application";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    targetAddresses?: string[],
    skipCurrentUser?: boolean
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  addCrossWalletNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    clientAddress?: string,
    freelancerAddress?: string
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const formatAddress = (address?: string) => {
  if (!address) return "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const normalizeIdValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      try {
        return BigInt(value).toString();
      } catch {
        return value;
      }
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "object" && "toString" in value) {
    try {
      return value.toString();
    } catch {
      return null;
    }
  }
  return null;
};

const decodeHexToString = (value?: string): string | null => {
  if (!value || typeof value !== "string" || !value.startsWith("0x")) {
    return null;
  }
  try {
    const decoded = hexToString(value as `0x${string}`).replace(/\0+$/, "");
    return decoded || null;
  } catch {
    return null;
  }
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { wallet, getContract } = useWeb3();
  const { subscribeToApplications, subscribeToEscrowStatus } =
    useSomniaStreams();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientJobIds, setClientJobIds] = useState<string[]>([]);
  const [jobMetadata, setJobMetadata] = useState<Record<string, string>>({});
  const [clientEscrowIds, setClientEscrowIds] = useState<string[]>([]);
  const [escrowMetadata, setEscrowMetadata] = useState<
    Record<
      string,
      {
        title: string;
        freelancer?: string;
      }
    >
  >({});
  const processedApplicationIds = useRef<Set<string>>(new Set());
  const processedEscrowStatusEvents = useRef<Set<string>>(new Set());
  const applicationSubscriptions = useRef<Record<string, () => void>>({});
  const escrowStatusSubscriptions = useRef<Record<string, () => void>>({});

  // Load notifications from localStorage on mount and when wallet changes
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      // Use lowercase address for consistency
      const addressKey = wallet.address.toLowerCase();
      const saved = localStorage.getItem(`notifications_${addressKey}`);
      if (saved) {
        const parsedNotifications = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsedNotifications.map(
          (notif: any) => ({
            ...notif,
            timestamp: new Date(notif.timestamp),
          })
        );
        setNotifications(notificationsWithDates);
      } else {
        // If no saved notifications, start with empty array
        setNotifications([]);
      }
    } else {
      // If wallet not connected, clear notifications
      setNotifications([]);
    }
  }, [wallet.isConnected, wallet.address]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (wallet.isConnected && wallet.address) {
      // Use lowercase address for consistency
      const addressKey = wallet.address.toLowerCase();
      localStorage.setItem(
        `notifications_${addressKey}`,
        JSON.stringify(notifications)
      );
    }
  }, [notifications, wallet.isConnected, wallet.address]);

  // Fetch client-owned open job IDs for application notifications
  useEffect(() => {
    let isMounted = true;

    const fetchClientJobs = async () => {
      if (!wallet.isConnected || !wallet.address) {
        if (isMounted) {
          setClientJobIds([]);
          setJobMetadata({});
        }
        return;
      }

      try {
        const contract = getContract(
          CONTRACTS.SECUREFLOW_ESCROW,
          SECUREFLOW_ABI
        );
        if (!contract) return;

        const totalEscrows = await contract.call("nextEscrowId");
        const total = Number(totalEscrows);
        const ownedJobIds: string[] = [];
        const titles: Record<string, string> = {};
        const lowerAddress = wallet.address.toLowerCase();

        for (let id = 1; id < total; id++) {
          try {
            const escrowSummary = await contract.call("getEscrowSummary", id);
            const payer = escrowSummary[0]?.toLowerCase?.();
            const beneficiary = escrowSummary[1];
            const isOpenJob = beneficiary === ZERO_ADDRESS;

            if (payer === lowerAddress && isOpenJob) {
              const jobIdStr = id.toString();
              ownedJobIds.push(jobIdStr);
              titles[jobIdStr] =
                escrowSummary[13] || escrowSummary[14] || `Job #${jobIdStr}`;
            }
          } catch (jobError) {
            continue;
          }
        }

        if (isMounted) {
          setClientJobIds(ownedJobIds);
          setJobMetadata(titles);
        }
      } catch (error) {
        if (isMounted) {
          setClientJobIds([]);
          setJobMetadata({});
        }
      }
    };

    fetchClientJobs();

    return () => {
      isMounted = false;
    };
  }, [wallet.isConnected, wallet.address, getContract]);

  // Fetch all client-owned escrows (for status change notifications)
  useEffect(() => {
    let isMounted = true;

    const fetchClientEscrows = async () => {
      if (!wallet.isConnected || !wallet.address) {
        if (isMounted) {
          setClientEscrowIds([]);
          setEscrowMetadata({});
        }
        return;
      }

      try {
        const contract = getContract(
          CONTRACTS.SECUREFLOW_ESCROW,
          SECUREFLOW_ABI
        );
        if (!contract) return;

        const totalEscrows = await contract.call("nextEscrowId");
        const total = Number(totalEscrows);
        const escrows: string[] = [];
        const metadata: Record<string, { title: string; freelancer?: string }> =
          {};
        const lowerAddress = wallet.address.toLowerCase();

        for (let id = 1; id < total; id++) {
          try {
            const summary = await contract.call("getEscrowSummary", id);
            const payer = summary[0]?.toLowerCase?.();
            if (payer === lowerAddress) {
              const idStr = id.toString();
              escrows.push(idStr);
              metadata[idStr] = {
                title: summary[13] || summary[14] || `Project #${idStr}`,
                freelancer:
                  summary[1] && summary[1] !== ZERO_ADDRESS
                    ? summary[1]
                    : undefined,
              };
            }
          } catch (error) {
            continue;
          }
        }

        if (isMounted) {
          setClientEscrowIds(escrows);
          setEscrowMetadata(metadata);
        }
      } catch (error) {
        if (isMounted) {
          setClientEscrowIds([]);
          setEscrowMetadata({});
        }
      }
    };

    fetchClientEscrows();

    return () => {
      isMounted = false;
    };
  }, [wallet.isConnected, wallet.address, getContract]);

  // Subscribe to application events via Somnia Data Streams for client-owned jobs
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToApplications ||
      clientJobIds.length === 0
    ) {
      // Cleanup existing subscriptions if wallet disconnected
      Object.values(applicationSubscriptions.current).forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from job applications:", error);
        }
      });
      applicationSubscriptions.current = {};
      processedApplicationIds.current.clear();
      return;
    }

    const activeSubscriptions = applicationSubscriptions.current;
    const jobIdSet = new Set(clientJobIds);

    // Unsubscribe from jobs no longer relevant
    Object.keys(activeSubscriptions).forEach((jobId) => {
      if (!jobIdSet.has(jobId)) {
        try {
          activeSubscriptions[jobId]?.();
        } catch (error) {
          console.error("Error unsubscribing from job:", jobId, error);
        }
        delete activeSubscriptions[jobId];
      }
    });

    // Subscribe to new job IDs
    clientJobIds.forEach((jobId) => {
      if (activeSubscriptions[jobId]) {
        return;
      }

      subscribeToApplications(jobId, (data) => {
        try {
          const fields = data.data || data;
          const applicationIdField = fields.find(
            (f: any) => f.name === "applicationId"
          );
          const applicantField = fields.find(
            (f: any) => f.name === "applicant"
          );
          const coverLetterField = fields.find(
            (f: any) => f.name === "coverLetter"
          );
          const jobIdField = fields.find((f: any) => f.name === "jobId");
          if (!jobIdField) {
            return;
          }

          const applicationId = normalizeIdValue(applicationIdField?.value);

          if (
            applicationId &&
            processedApplicationIds.current.has(applicationId)
          ) {
            return;
          }

          if (applicationId) {
            processedApplicationIds.current.add(applicationId);
          }

          const applicantAddress =
            (applicantField?.value || applicantField)?.toString() || "";

          if (!applicantAddress) {
            return;
          }

          const eventJobId =
            normalizeIdValue(jobIdField?.value) ||
            decodeHexToString(jobIdField?.value) ||
            jobIdField?.value?.toString();

          if (
            !eventJobId ||
            (eventJobId !== jobId &&
              eventJobId !== jobId.toString() &&
              eventJobId.replace(/^0+/, "") !== jobId.replace(/^0+/, ""))
          ) {
            return;
          }

          const jobTitle =
            jobMetadata[jobId] ||
            jobMetadata[jobId]?.toString() ||
            `Job #${jobId}`;

          addNotification(
            createApplicationNotification(
              "submitted",
              Number(jobId),
              applicantAddress,
              {
                jobTitle,
                freelancerName: formatAddress(applicantAddress),
                coverLetterPreview:
                  typeof coverLetterField?.value === "string"
                    ? coverLetterField.value.slice(0, 120)
                    : undefined,
              }
            )
          );

          toast({
            title: "New Job Application",
            description: `${formatAddress(
              applicantAddress
            )} just applied to ${jobTitle}`,
          });
        } catch (error) {
          console.error("Error processing job application event:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[jobId] = unsubscribe;
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to applications for job:",
            jobId,
            error
          );
        });
    });

    return () => {
      // Cleanup handled separately when dependencies change or component unmounts
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToApplications,
    clientJobIds.join(","),
    JSON.stringify(jobMetadata),
  ]);

  // Subscribe to escrow status changes (e.g., work started) for client-owned escrows
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToEscrowStatus ||
      clientEscrowIds.length === 0
    ) {
      Object.values(escrowStatusSubscriptions.current).forEach(
        (unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing from escrow status:", error);
          }
        }
      );
      escrowStatusSubscriptions.current = {};
      processedEscrowStatusEvents.current.clear();
      return;
    }

    const activeSubscriptions = escrowStatusSubscriptions.current;
    const escrowIdSet = new Set(clientEscrowIds);

    Object.keys(activeSubscriptions).forEach((escrowId) => {
      if (!escrowIdSet.has(escrowId)) {
        try {
          activeSubscriptions[escrowId]?.();
        } catch (error) {
          console.error("Error unsubscribing from escrow status:", error);
        }
        delete activeSubscriptions[escrowId];
      }
    });

    const createdUnsubscribes: Array<{ id: string; unsubscribe: () => void }> =
      [];

    clientEscrowIds.forEach((escrowId) => {
      if (activeSubscriptions[escrowId]) {
        return;
      }

      subscribeToEscrowStatus(escrowId, (data) => {
        try {
          const fields = data.data || data;
          const newStatusField = fields.find(
            (f: any) => f.name === "newStatus"
          );
          const timestampField = fields.find(
            (f: any) => f.name === "timestamp"
          );

          const newStatus = Number(newStatusField?.value);
          const eventKey = `${escrowId}-${newStatus}-${
            timestampField?.value || Date.now()
          }`;

          if (processedEscrowStatusEvents.current.has(eventKey)) {
            return;
          }
          processedEscrowStatusEvents.current.add(eventKey);

          if (newStatus === 1) {
            const metadata = escrowMetadata[escrowId] || {
              title: `Project #${escrowId}`,
            };
            const freelancerName = metadata.freelancer
              ? formatAddress(metadata.freelancer)
              : "Freelancer";

            addNotification(
              createEscrowNotification("work_started", escrowId, {
                projectTitle: metadata.title,
                freelancerName,
              })
            );

            toast({
              title: "Freelancer Started Work",
              description: `${freelancerName} has started work on ${metadata.title}`,
            });
          }
        } catch (error) {
          console.error("Error processing escrow status update:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[escrowId] = unsubscribe;
            createdUnsubscribes.push({ id: escrowId, unsubscribe });
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to escrow status for escrow:",
            escrowId,
            error
          );
        });
    });

    return () => {
      createdUnsubscribes.forEach(({ id, unsubscribe }) => {
        try {
          unsubscribe();
          delete activeSubscriptions[id];
        } catch (error) {
          console.error("Error unsubscribing from escrow status:", error);
        }
      });
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToEscrowStatus,
    clientEscrowIds.join(","),
    JSON.stringify(escrowMetadata),
  ]);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    targetAddresses?: string[], // Optional: specific addresses to notify
    skipCurrentUser: boolean = false // If true, don't add to current user unless they're in targetAddresses
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Check if current user should receive this notification
    const currentUserAddress = wallet.address?.toLowerCase();
    const shouldNotifyCurrentUser =
      !skipCurrentUser ||
      (targetAddresses &&
        targetAddresses.some(
          (addr) => addr.toLowerCase() === currentUserAddress
        ));

    // Only add to current user's notifications if they should receive it
    if (shouldNotifyCurrentUser && currentUserAddress) {
      setNotifications((prev) => [newNotification, ...prev]);
    }

    // If target addresses are specified, also store for those addresses (cross-wallet notifications)
    if (targetAddresses && targetAddresses.length > 0) {
      targetAddresses.forEach((address) => {
        if (address) {
          const addressLower = address.toLowerCase();
          // Skip if it's the current user and we already added it above
          if (addressLower === currentUserAddress && shouldNotifyCurrentUser) {
            return;
          }

          const existingNotifications = JSON.parse(
            localStorage.getItem(`notifications_${addressLower}`) || "[]"
          );
          const updatedNotifications = [
            newNotification,
            ...existingNotifications,
          ];
          localStorage.setItem(
            `notifications_${addressLower}`,
            JSON.stringify(updatedNotifications)
          );
        }
      });
    }

    // Show toast for important notifications
    if (notification.type === "milestone" || notification.type === "dispute") {
      toast({
        title: notification.title,
        description: notification.message,
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const addCrossWalletNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    clientAddress?: string,
    freelancerAddress?: string
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Always add to current user's notifications
    setNotifications((prev) => [newNotification, ...prev]);

    // Collect all target addresses (both client and freelancer)
    const targetAddresses = [];
    if (
      clientAddress &&
      clientAddress.toLowerCase() !== wallet.address?.toLowerCase()
    ) {
      targetAddresses.push(clientAddress.toLowerCase());
    }
    if (
      freelancerAddress &&
      freelancerAddress.toLowerCase() !== wallet.address?.toLowerCase()
    ) {
      targetAddresses.push(freelancerAddress.toLowerCase());
    }

    // Send to all target addresses
    targetAddresses.forEach((address) => {
      const existingNotifications = JSON.parse(
        localStorage.getItem(`notifications_${address}`) || "[]"
      );
      const updatedNotifications = [newNotification, ...existingNotifications];
      localStorage.setItem(
        `notifications_${address}`,
        JSON.stringify(updatedNotifications)
      );
    });

    // Show toast for important notifications
    if (notification.type === "milestone" || notification.type === "dispute") {
      toast({
        title: notification.title,
        description: notification.message,
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        removeNotification,
        addCrossWalletNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}

// Helper functions for common notification types
export const createMilestoneNotification = (
  action: "submitted" | "approved" | "rejected" | "disputed",
  escrowId: string,
  milestoneIndex: number,
  additionalData?: Record<string, any>
): Omit<Notification, "id" | "timestamp" | "read"> => {
  const baseData = {
    escrowId,
    milestoneIndex,
    ...additionalData,
  };

  switch (action) {
    case "submitted":
      return {
        type: "milestone",
        title: "New Milestone Submitted",
        message: `Milestone ${
          milestoneIndex + 1
        } has been submitted for review`,
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
    case "approved":
      return {
        type: "milestone",
        title: "Milestone Approved!",
        message: `Milestone ${
          milestoneIndex + 1
        } has been approved and payment released`,
        actionUrl: `/freelancer?escrow=${escrowId}`,
        data: baseData,
      };
    case "rejected":
      return {
        type: "milestone",
        title: "Milestone Rejected",
        message: `Milestone ${
          milestoneIndex + 1
        } has been rejected. Please review and resubmit`,
        actionUrl: `/freelancer?escrow=${escrowId}`,
        data: baseData,
      };
    case "disputed":
      return {
        type: "dispute",
        title: "Milestone Disputed",
        message: `Milestone ${
          milestoneIndex + 1
        } is under dispute and requires admin review`,
        actionUrl: `/admin?escrow=${escrowId}`,
        data: baseData,
      };
    default:
      return {
        type: "milestone",
        title: "Milestone Update",
        message: `Milestone ${milestoneIndex + 1} status updated`,
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
  }
};

export const createEscrowNotification = (
  action: "created" | "completed" | "refunded" | "work_started",
  escrowId: string,
  additionalData?: Record<string, any>
): Omit<Notification, "id" | "timestamp" | "read"> => {
  const baseData = {
    escrowId,
    ...additionalData,
  };

  switch (action) {
    case "created":
      return {
        type: "escrow",
        title: "New Escrow Created",
        message: "A new escrow has been created and is ready for work",
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
    case "completed":
      return {
        type: "escrow",
        title: "Escrow Completed!",
        message: "All milestones have been completed and payments released",
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
    case "refunded":
      return {
        type: "escrow",
        title: "Escrow Refunded",
        message: "The escrow has been refunded due to project cancellation",
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
    case "work_started":
      return {
        type: "escrow",
        title: "Work Started!",
        message: `${
          additionalData?.freelancerName || "Freelancer"
        } has started work on ${
          additionalData?.projectTitle || `Project #${escrowId}`
        }`,
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
    default:
      return {
        type: "escrow",
        title: "Escrow Update",
        message: "Escrow status has been updated",
        actionUrl: `/dashboard?escrow=${escrowId}`,
        data: baseData,
      };
  }
};

export const createApplicationNotification = (
  action: "submitted" | "approved" | "rejected",
  jobId: number,
  freelancerAddress: string,
  additionalData?: Record<string, any>
): Omit<Notification, "id" | "timestamp" | "read"> => {
  const baseData = {
    jobId,
    freelancerAddress,
    ...additionalData,
  };

  switch (action) {
    case "submitted":
      return {
        type: "application",
        title: "New Job Application",
        message: `Someone applied to your job: ${
          additionalData?.jobTitle || `Job #${jobId}`
        }`,
        actionUrl: `/approvals?job=${jobId}`,
        data: baseData,
      };
    case "approved":
      return {
        type: "application",
        title: "Application Approved!",
        message: `Your application for ${
          additionalData?.jobTitle || `Job #${jobId}`
        } has been approved`,
        actionUrl: `/freelancer?job=${jobId}`,
        data: baseData,
      };
    case "rejected":
      return {
        type: "application",
        title: "Application Rejected",
        message: `Your application for ${
          additionalData?.jobTitle || `Job #${jobId}`
        } was not selected`,
        actionUrl: `/freelancer?job=${jobId}`,
        data: baseData,
      };
    default:
      return {
        type: "application",
        title: "Application Update",
        message: `Application status updated for ${
          additionalData?.jobTitle || `Job #${jobId}`
        }`,
        actionUrl: `/approvals?job=${jobId}`,
        data: baseData,
      };
  }
};
