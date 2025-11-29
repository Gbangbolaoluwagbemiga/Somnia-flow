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
  const {
    subscribeToApplications,
    subscribeToEscrowStatus,
    subscribeToMilestoneSubmissions,
    subscribeToMilestoneApprovals,
    subscribeToMilestoneRejections,
    subscribeToDisputes,
  } = useSomniaStreams();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clientJobIds, setClientJobIds] = useState<string[]>([]);
  const [jobMetadata, setJobMetadata] = useState<Record<string, string>>({});
  const [clientEscrowIds, setClientEscrowIds] = useState<string[]>([]);
  const [freelancerEscrowIds, setFreelancerEscrowIds] = useState<string[]>([]);
  const [escrowMetadata, setEscrowMetadata] = useState<
    Record<
      string,
      {
        title: string;
        freelancer?: string;
        client?: string;
      }
    >
  >({});
  const processedApplicationIds = useRef<Set<string>>(new Set());
  const processedEscrowStatusEvents = useRef<Set<string>>(new Set());
  const processedMilestoneSubmissions = useRef<Set<string>>(new Set());
  const processedMilestoneApprovals = useRef<Set<string>>(new Set());
  const processedMilestoneRejections = useRef<Set<string>>(new Set());
  const processedDisputes = useRef<Set<string>>(new Set());
  const applicationSubscriptions = useRef<Record<string, () => void>>({});
  const escrowStatusSubscriptions = useRef<Record<string, () => void>>({});
  const milestoneSubmissionSubscriptions = useRef<Record<string, () => void>>(
    {}
  );
  const milestoneApprovalSubscriptions = useRef<Record<string, () => void>>({});
  const milestoneRejectionSubscriptions = useRef<Record<string, () => void>>(
    {}
  );
  const disputeSubscriptions = useRef<Record<string, () => void>>({});

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
        const metadata: Record<
          string,
          { title: string; client?: string; freelancer?: string }
        > = {};
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
                client: payer,
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
            const freelancerAddress = metadata.freelancer;
            const clientAddress = metadata.client;
            const freelancerName = freelancerAddress
              ? formatAddress(freelancerAddress)
              : "Freelancer";

            // Only notify the client, not the freelancer who started work
            // Verify current user is the client (recipient), not the freelancer (sender)
            const currentUserAddress = wallet.address?.toLowerCase();
            const isCurrentUserClient =
              clientAddress?.toLowerCase() === currentUserAddress;
            const isCurrentUserFreelancer =
              freelancerAddress?.toLowerCase() === currentUserAddress;

            if (
              clientAddress &&
              freelancerAddress &&
              clientAddress.toLowerCase() !== freelancerAddress.toLowerCase() &&
              isCurrentUserClient &&
              !isCurrentUserFreelancer
            ) {
              addNotification(
                createEscrowNotification("work_started", escrowId, {
                  projectTitle: metadata.title,
                  freelancerName,
                }),
                [clientAddress],
                false // Current user is the recipient (client)
              );

              toast({
                title: "Freelancer Started Work",
                description: `${freelancerName} has started work on ${metadata.title}`,
              });
            }
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

  // Fetch freelancer-owned escrows (for milestone approval/rejection notifications)
  useEffect(() => {
    let isMounted = true;

    const fetchFreelancerEscrows = async () => {
      if (!wallet.isConnected || !wallet.address) {
        if (isMounted) {
          setFreelancerEscrowIds([]);
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
        const metadata: Record<string, { title: string; client?: string }> = {};
        const lowerAddress = wallet.address.toLowerCase();

        for (let id = 1; id < total; id++) {
          try {
            const summary = await contract.call("getEscrowSummary", id);
            const beneficiary = summary[1]?.toLowerCase?.();
            if (beneficiary === lowerAddress) {
              const idStr = id.toString();
              escrows.push(idStr);
              metadata[idStr] = {
                title: summary[13] || summary[14] || `Project #${idStr}`,
                client: summary[0], // payer address
              };
            }
          } catch (error) {
            continue;
          }
        }

        if (isMounted) {
          setFreelancerEscrowIds(escrows);
          // Merge with existing metadata
          setEscrowMetadata((prev) => ({ ...prev, ...metadata }));
        }
      } catch (error) {
        if (isMounted) {
          setFreelancerEscrowIds([]);
        }
      }
    };

    fetchFreelancerEscrows();

    return () => {
      isMounted = false;
    };
  }, [wallet.isConnected, wallet.address, getContract]);

  // Subscribe to milestone submissions for client-owned escrows
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToMilestoneSubmissions ||
      clientEscrowIds.length === 0
    ) {
      Object.values(milestoneSubmissionSubscriptions.current).forEach(
        (unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error(
              "Error unsubscribing from milestone submissions:",
              error
            );
          }
        }
      );
      milestoneSubmissionSubscriptions.current = {};
      processedMilestoneSubmissions.current.clear();
      return;
    }

    const activeSubscriptions = milestoneSubmissionSubscriptions.current;
    const escrowIdSet = new Set(clientEscrowIds);

    // Unsubscribe from escrows no longer relevant
    Object.keys(activeSubscriptions).forEach((escrowId) => {
      if (!escrowIdSet.has(escrowId)) {
        try {
          activeSubscriptions[escrowId]?.();
        } catch (error) {
          console.error("Error unsubscribing from escrow:", escrowId, error);
        }
        delete activeSubscriptions[escrowId];
      }
    });

    // Subscribe to new escrow IDs
    clientEscrowIds.forEach((escrowId) => {
      if (activeSubscriptions[escrowId]) {
        return;
      }

      subscribeToMilestoneSubmissions(escrowId, (data) => {
        try {
          const fields = data.data || data;
          const milestoneIndexField = fields.find(
            (f: any) => f.name === "milestoneIndex"
          );
          const beneficiaryField = fields.find(
            (f: any) => f.name === "beneficiary"
          );
          const timestampField = fields.find(
            (f: any) => f.name === "submittedAt"
          );

          const milestoneIndex = Number(milestoneIndexField?.value || 0);
          const eventKey = `${escrowId}-${milestoneIndex}-${
            timestampField?.value || Date.now()
          }`;

          if (processedMilestoneSubmissions.current.has(eventKey)) {
            return;
          }
          processedMilestoneSubmissions.current.add(eventKey);

          const metadata = escrowMetadata[escrowId] || {
            title: `Project #${escrowId}`,
          };
          const freelancerAddress = beneficiaryField?.value?.toString() || "";
          const freelancerName = freelancerAddress
            ? formatAddress(freelancerAddress)
            : "Freelancer";
          const clientAddress = metadata.client;

          // Only notify the client, not the freelancer who submitted
          // Verify current user is the client (recipient), not the freelancer (sender)
          const currentUserAddress = wallet.address?.toLowerCase();
          const isCurrentUserClient =
            clientAddress?.toLowerCase() === currentUserAddress;
          const isCurrentUserFreelancer =
            freelancerAddress?.toLowerCase() === currentUserAddress;

          if (
            clientAddress &&
            clientAddress.toLowerCase() !== freelancerAddress.toLowerCase() &&
            isCurrentUserClient &&
            !isCurrentUserFreelancer
          ) {
            addNotification(
              createMilestoneNotification(
                "submitted",
                escrowId,
                milestoneIndex,
                {
                  projectTitle: metadata.title,
                  freelancerName,
                }
              ),
              [clientAddress],
              false // Current user is the recipient (client)
            );

            toast({
              title: "Milestone Submitted",
              description: `${freelancerName} submitted milestone ${
                milestoneIndex + 1
              } for ${metadata.title}`,
            });
          }
        } catch (error) {
          console.error("Error processing milestone submission event:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[escrowId] = unsubscribe;
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to milestone submissions for escrow:",
            escrowId,
            error
          );
        });
    });

    return () => {
      // Cleanup handled separately when dependencies change
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToMilestoneSubmissions,
    clientEscrowIds.join(","),
    JSON.stringify(escrowMetadata),
  ]);

  // Subscribe to milestone approvals for freelancer-owned escrows
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToMilestoneApprovals ||
      freelancerEscrowIds.length === 0
    ) {
      Object.values(milestoneApprovalSubscriptions.current).forEach(
        (unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error(
              "Error unsubscribing from milestone approvals:",
              error
            );
          }
        }
      );
      milestoneApprovalSubscriptions.current = {};
      processedMilestoneApprovals.current.clear();
      return;
    }

    const activeSubscriptions = milestoneApprovalSubscriptions.current;
    const escrowIdSet = new Set(freelancerEscrowIds);

    Object.keys(activeSubscriptions).forEach((escrowId) => {
      if (!escrowIdSet.has(escrowId)) {
        try {
          activeSubscriptions[escrowId]?.();
        } catch (error) {
          console.error("Error unsubscribing from escrow:", escrowId, error);
        }
        delete activeSubscriptions[escrowId];
      }
    });

    freelancerEscrowIds.forEach((escrowId) => {
      if (activeSubscriptions[escrowId]) {
        return;
      }

      subscribeToMilestoneApprovals(escrowId, (data) => {
        try {
          const fields = data.data || data;
          const milestoneIndexField = fields.find(
            (f: any) => f.name === "milestoneIndex"
          );
          const amountField = fields.find((f: any) => f.name === "amount");
          const timestampField = fields.find(
            (f: any) => f.name === "approvedAt"
          );

          const milestoneIndex = Number(milestoneIndexField?.value || 0);
          const eventKey = `${escrowId}-${milestoneIndex}-${
            timestampField?.value || Date.now()
          }`;

          if (processedMilestoneApprovals.current.has(eventKey)) {
            return;
          }
          processedMilestoneApprovals.current.add(eventKey);

          const metadata = escrowMetadata[escrowId] || {
            title: `Project #${escrowId}`,
          };
          const freelancerAddress = metadata.freelancer;
          const clientAddress = metadata.client;

          // Only notify the freelancer, not the client who approved
          // Verify current user is the freelancer (recipient), not the client (sender)
          const currentUserAddress = wallet.address?.toLowerCase();
          const isCurrentUserFreelancer =
            freelancerAddress?.toLowerCase() === currentUserAddress;
          const isCurrentUserClient =
            clientAddress?.toLowerCase() === currentUserAddress;

          if (
            freelancerAddress &&
            clientAddress &&
            freelancerAddress.toLowerCase() !== clientAddress.toLowerCase() &&
            isCurrentUserFreelancer &&
            !isCurrentUserClient
          ) {
            addNotification(
              createMilestoneNotification(
                "approved",
                escrowId,
                milestoneIndex,
                {
                  projectTitle: metadata.title,
                }
              ),
              [freelancerAddress],
              false // Current user is the recipient (freelancer)
            );

            toast({
              title: "Milestone Approved!",
              description: `Milestone ${milestoneIndex + 1} approved for ${
                metadata.title
              }`,
            });
          }
        } catch (error) {
          console.error("Error processing milestone approval event:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[escrowId] = unsubscribe;
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to milestone approvals for escrow:",
            escrowId,
            error
          );
        });
    });

    return () => {
      // Cleanup handled separately
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToMilestoneApprovals,
    freelancerEscrowIds.join(","),
    JSON.stringify(escrowMetadata),
  ]);

  // Subscribe to milestone rejections for freelancer-owned escrows
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToMilestoneRejections ||
      freelancerEscrowIds.length === 0
    ) {
      Object.values(milestoneRejectionSubscriptions.current).forEach(
        (unsubscribe) => {
          try {
            unsubscribe();
          } catch (error) {
            console.error(
              "Error unsubscribing from milestone rejections:",
              error
            );
          }
        }
      );
      milestoneRejectionSubscriptions.current = {};
      processedMilestoneRejections.current.clear();
      return;
    }

    const activeSubscriptions = milestoneRejectionSubscriptions.current;
    const escrowIdSet = new Set(freelancerEscrowIds);

    Object.keys(activeSubscriptions).forEach((escrowId) => {
      if (!escrowIdSet.has(escrowId)) {
        try {
          activeSubscriptions[escrowId]?.();
        } catch (error) {
          console.error("Error unsubscribing from escrow:", escrowId, error);
        }
        delete activeSubscriptions[escrowId];
      }
    });

    freelancerEscrowIds.forEach((escrowId) => {
      if (activeSubscriptions[escrowId]) {
        return;
      }

      subscribeToMilestoneRejections(escrowId, (data) => {
        try {
          const fields = data.data || data;
          const milestoneIndexField = fields.find(
            (f: any) => f.name === "milestoneIndex"
          );
          const reasonField = fields.find((f: any) => f.name === "reason");
          const timestampField = fields.find(
            (f: any) => f.name === "rejectedAt"
          );

          const milestoneIndex = Number(milestoneIndexField?.value || 0);
          const reason = reasonField?.value?.toString() || "No reason provided";
          const eventKey = `${escrowId}-${milestoneIndex}-${
            timestampField?.value || Date.now()
          }`;

          if (processedMilestoneRejections.current.has(eventKey)) {
            return;
          }
          processedMilestoneRejections.current.add(eventKey);

          const metadata = escrowMetadata[escrowId] || {
            title: `Project #${escrowId}`,
          };
          const freelancerAddress = metadata.freelancer;
          const clientAddress = metadata.client;

          // Only notify the freelancer, not the client who rejected
          // Verify current user is the freelancer (recipient), not the client (sender)
          const currentUserAddress = wallet.address?.toLowerCase();
          const isCurrentUserFreelancer =
            freelancerAddress?.toLowerCase() === currentUserAddress;
          const isCurrentUserClient =
            clientAddress?.toLowerCase() === currentUserAddress;

          if (
            freelancerAddress &&
            clientAddress &&
            freelancerAddress.toLowerCase() !== clientAddress.toLowerCase() &&
            isCurrentUserFreelancer &&
            !isCurrentUserClient
          ) {
            addNotification(
              createMilestoneNotification(
                "rejected",
                escrowId,
                milestoneIndex,
                {
                  reason,
                  projectTitle: metadata.title,
                }
              ),
              [freelancerAddress],
              false // Current user is the recipient (freelancer)
            );

            toast({
              title: "Milestone Rejected",
              description: `Milestone ${milestoneIndex + 1} rejected for ${
                metadata.title
              }`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error processing milestone rejection event:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[escrowId] = unsubscribe;
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to milestone rejections for escrow:",
            escrowId,
            error
          );
        });
    });

    return () => {
      // Cleanup handled separately
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToMilestoneRejections,
    freelancerEscrowIds.join(","),
    JSON.stringify(escrowMetadata),
  ]);

  // Subscribe to dispute events for all user's escrows (both client and freelancer owned)
  useEffect(() => {
    if (
      !wallet.isConnected ||
      !wallet.address ||
      !subscribeToDisputes ||
      (clientEscrowIds.length === 0 && freelancerEscrowIds.length === 0)
    ) {
      Object.values(disputeSubscriptions.current).forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from disputes:", error);
        }
      });
      disputeSubscriptions.current = {};
      processedDisputes.current.clear();
      return;
    }

    const activeSubscriptions = disputeSubscriptions.current;
    const allEscrowIds = [
      ...new Set([...clientEscrowIds, ...freelancerEscrowIds]),
    ];
    const escrowIdSet = new Set(allEscrowIds);

    // Unsubscribe from escrows no longer relevant
    Object.keys(activeSubscriptions).forEach((escrowId) => {
      if (!escrowIdSet.has(escrowId)) {
        try {
          activeSubscriptions[escrowId]?.();
        } catch (error) {
          console.error("Error unsubscribing from escrow:", escrowId, error);
        }
        delete activeSubscriptions[escrowId];
      }
    });

    // Subscribe to disputes for all user's escrows
    allEscrowIds.forEach((escrowId) => {
      if (activeSubscriptions[escrowId]) {
        return;
      }

      subscribeToDisputes(escrowId, (data) => {
        try {
          const fields = data.data || data;
          const milestoneIndexField = fields.find(
            (f: any) => f.name === "milestoneIndex"
          );
          const initiatorField = fields.find(
            (f: any) => f.name === "initiator"
          );
          const timestampField = fields.find(
            (f: any) => f.name === "timestamp"
          );

          const milestoneIndex = Number(milestoneIndexField?.value || 0);
          const initiatorAddress = initiatorField?.value?.toString() || "";
          const eventKey = `${escrowId}-${milestoneIndex}-${
            timestampField?.value || Date.now()
          }`;

          if (processedDisputes.current.has(eventKey)) {
            return;
          }
          processedDisputes.current.add(eventKey);

          const metadata = escrowMetadata[escrowId] || {
            title: `Project #${escrowId}`,
          };
          const freelancerAddress = metadata.freelancer;
          const clientAddress = metadata.client;
          const currentUserAddress = wallet.address?.toLowerCase();

          // Determine who should be notified (the party that didn't create the dispute)
          let recipientAddress: string | undefined;
          let isCurrentUserRecipient = false;

          if (initiatorAddress.toLowerCase() === clientAddress?.toLowerCase()) {
            // Client created the dispute, notify freelancer
            recipientAddress = freelancerAddress;
            isCurrentUserRecipient =
              freelancerAddress?.toLowerCase() === currentUserAddress;
          } else if (
            initiatorAddress.toLowerCase() === freelancerAddress?.toLowerCase()
          ) {
            // Freelancer created the dispute, notify client
            recipientAddress = clientAddress;
            isCurrentUserRecipient =
              clientAddress?.toLowerCase() === currentUserAddress;
          }

          // Only notify if current user is the recipient (not the initiator)
          if (
            recipientAddress &&
            isCurrentUserRecipient &&
            initiatorAddress.toLowerCase() !== currentUserAddress
          ) {
            addNotification(
              createMilestoneNotification(
                "disputed",
                escrowId,
                milestoneIndex,
                {
                  projectTitle: metadata.title,
                  reason: "A dispute has been opened for this milestone",
                }
              ),
              [recipientAddress],
              false // Current user is the recipient
            );

            toast({
              title: "Milestone Disputed",
              description: `Milestone ${
                milestoneIndex + 1
              } has been disputed for ${metadata.title}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error processing dispute event:", error);
        }
      })
        .then((unsubscribe) => {
          if (unsubscribe) {
            activeSubscriptions[escrowId] = unsubscribe;
          }
        })
        .catch((error) => {
          console.error(
            "Error subscribing to disputes for escrow:",
            escrowId,
            error
          );
        });
    });

    return () => {
      // Cleanup handled separately
    };
  }, [
    wallet.isConnected,
    wallet.address,
    subscribeToDisputes,
    [...clientEscrowIds, ...freelancerEscrowIds].join(","),
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

    // NOTE: Cross-wallet notifications are handled by Somnia Data Streams subscriptions.
    // The subscriptions automatically detect on-chain events and notify users regardless of
    // which wallet/browser they're using. No localStorage needed - events are indexed on-chain.
    //
    // When a user performs an action (e.g., approves a milestone), the blockchain event is
    // indexed by Somnia Data Streams. The subscription for the recipient (e.g., freelancer
    // subscribed to milestone approvals) will automatically detect the event and notify them,
    // even if they're using a different wallet/browser.

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

    const currentUserAddress = wallet.address?.toLowerCase();

    // Collect all target addresses (both client and freelancer)
    // Only include addresses that are NOT the current user (the one performing the action)
    const targetAddresses = [];
    if (clientAddress && clientAddress.toLowerCase() !== currentUserAddress) {
      targetAddresses.push(clientAddress.toLowerCase());
    }
    if (
      freelancerAddress &&
      freelancerAddress.toLowerCase() !== currentUserAddress
    ) {
      targetAddresses.push(freelancerAddress.toLowerCase());
    }

    // Only add to current user's notifications if they're a target (recipient), not the sender
    const isCurrentUserRecipient = targetAddresses.some(
      (addr) => addr === currentUserAddress
    );

    if (isCurrentUserRecipient && currentUserAddress) {
      setNotifications((prev) => [newNotification, ...prev]);

      // Show toast only if current user is a recipient (not the sender)
      if (
        notification.type === "milestone" ||
        notification.type === "dispute"
      ) {
        toast({
          title: notification.title,
          description: notification.message,
        });
      }
    }

    // NOTE: Cross-wallet notifications are handled by Somnia Data Streams subscriptions.
    // The subscriptions automatically detect on-chain events and notify users regardless of
    // which wallet/browser they're using. No localStorage needed - events are indexed on-chain.
    //
    // Active subscriptions:
    // - subscribeToMilestoneSubmissions: Notifies clients when freelancers submit milestones
    // - subscribeToMilestoneApprovals: Notifies freelancers when clients approve milestones
    // - subscribeToMilestoneRejections: Notifies freelancers when clients reject milestones
    // - subscribeToEscrowStatus: Notifies clients when escrow status changes (e.g., work started)
    // - subscribeToApplications: Notifies clients when freelancers apply for jobs
    // - subscribeToDisputes: Notifies the other party when a dispute is created (client or freelancer)
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
