/**
 * Somnia Data Streams Publisher
 * 
 * Functions to publish data to Somnia Data Streams for real-time updates.
 * These functions should be called from server-side or secure wallet contexts.
 */

import { SDK, SchemaEncoder } from "@somnia-chain/streams";
import { toHex, type Hex } from "viem";
import {
  JOB_POSTING_SCHEMA,
  MILESTONE_UPDATE_SCHEMA,
  ESCROW_STATUS_SCHEMA,
  APPLICATION_SCHEMA,
  DISPUTE_SCHEMA,
  EVENT_SCHEMA_IDS,
} from "./schemas";
import { getSomniaSDK, initSomniaSDKWithWallet } from "./somnia-client";

/**
 * Publish a job posting to Somnia Data Streams
 */
export async function publishJobPosting(
  jobId: string,
  creator: string,
  title: string,
  description: string,
  budget: bigint,
  status: number,
  walletPrivateKey?: `0x${string}`
): Promise<Hex | null> {
  const sdk = walletPrivateKey
    ? initSomniaSDKWithWallet(walletPrivateKey)
    : getSomniaSDK();

  const schemaId = await sdk.streams.computeSchemaId(JOB_POSTING_SCHEMA);
  const encoder = new SchemaEncoder(JOB_POSTING_SCHEMA);

  const encodedData = encoder.encodeData([
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "jobId", value: toHex(jobId, { size: 32 }), type: "bytes32" },
    { name: "creator", value: creator, type: "address" },
    { name: "title", value: title, type: "string" },
    { name: "description", value: description, type: "string" },
    { name: "budget", value: budget.toString(), type: "uint256" },
    { name: "status", value: status.toString(), type: "uint8" },
  ]);

  const dataId = toHex(`job_${jobId}`, { size: 32 });

  try {
    // Publish data and emit event
    const txHash = await sdk.streams.setAndEmitEvents(
      [{ id: dataId, schemaId, data: encodedData }],
      [
        {
          id: EVENT_SCHEMA_IDS.JOB_POSTED,
          argumentTopics: [toHex(jobId, { size: 32 })],
          data: "0x",
        },
      ]
    );

    return txHash;
  } catch (error) {
    console.error("Error publishing job posting:", error);
    return null;
  }
}

/**
 * Publish a milestone update to Somnia Data Streams
 */
export async function publishMilestoneUpdate(
  escrowId: string,
  milestoneIndex: number,
  status: number,
  submitter: string,
  description: string,
  walletPrivateKey?: `0x${string}`
): Promise<Hex | null> {
  const sdk = walletPrivateKey
    ? initSomniaSDKWithWallet(walletPrivateKey)
    : getSomniaSDK();

  const schemaId = await sdk.streams.computeSchemaId(MILESTONE_UPDATE_SCHEMA);
  const encoder = new SchemaEncoder(MILESTONE_UPDATE_SCHEMA);

  const encodedData = encoder.encodeData([
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "escrowId", value: toHex(escrowId, { size: 32 }), type: "bytes32" },
    { name: "milestoneIndex", value: milestoneIndex.toString(), type: "uint8" },
    { name: "status", value: status.toString(), type: "uint8" },
    { name: "submitter", value: submitter, type: "address" },
    { name: "description", value: description, type: "string" },
  ]);

  const dataId = toHex(`milestone_${escrowId}_${milestoneIndex}`, {
    size: 32,
  });

  try {
    const txHash = await sdk.streams.setAndEmitEvents(
      [{ id: dataId, schemaId, data: encodedData }],
      [
        {
          id: EVENT_SCHEMA_IDS.MILESTONE_UPDATED,
          argumentTopics: [toHex(escrowId, { size: 32 })],
          data: "0x",
        },
      ]
    );

    return txHash;
  } catch (error) {
    console.error("Error publishing milestone update:", error);
    return null;
  }
}

/**
 * Publish an escrow status change to Somnia Data Streams
 */
export async function publishEscrowStatusChange(
  escrowId: string,
  oldStatus: number,
  newStatus: number,
  initiator: string,
  walletPrivateKey?: `0x${string}`
): Promise<Hex | null> {
  const sdk = walletPrivateKey
    ? initSomniaSDKWithWallet(walletPrivateKey)
    : getSomniaSDK();

  const schemaId = await sdk.streams.computeSchemaId(ESCROW_STATUS_SCHEMA);
  const encoder = new SchemaEncoder(ESCROW_STATUS_SCHEMA);

  const encodedData = encoder.encodeData([
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "escrowId", value: toHex(escrowId, { size: 32 }), type: "bytes32" },
    { name: "oldStatus", value: oldStatus.toString(), type: "uint8" },
    { name: "newStatus", value: newStatus.toString(), type: "uint8" },
    { name: "initiator", value: initiator, type: "address" },
  ]);

  const dataId = toHex(`escrow_status_${escrowId}`, { size: 32 });

  try {
    const txHash = await sdk.streams.setAndEmitEvents(
      [{ id: dataId, schemaId, data: encodedData }],
      [
        {
          id: EVENT_SCHEMA_IDS.ESCROW_STATUS_CHANGED,
          argumentTopics: [toHex(escrowId, { size: 32 })],
          data: "0x",
        },
      ]
    );

    return txHash;
  } catch (error) {
    console.error("Error publishing escrow status change:", error);
    return null;
  }
}

/**
 * Publish an application submission to Somnia Data Streams
 */
export async function publishApplication(
  jobId: string,
  applicationId: string,
  applicant: string,
  coverLetter: string,
  proposedTimeline: string,
  walletPrivateKey?: `0x${string}`
): Promise<Hex | null> {
  const sdk = walletPrivateKey
    ? initSomniaSDKWithWallet(walletPrivateKey)
    : getSomniaSDK();

  const schemaId = await sdk.streams.computeSchemaId(APPLICATION_SCHEMA);
  const encoder = new SchemaEncoder(APPLICATION_SCHEMA);

  const encodedData = encoder.encodeData([
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "jobId", value: toHex(jobId, { size: 32 }), type: "bytes32" },
    {
      name: "applicationId",
      value: toHex(applicationId, { size: 32 }),
      type: "bytes32",
    },
    { name: "applicant", value: applicant, type: "address" },
    { name: "coverLetter", value: coverLetter, type: "string" },
    { name: "proposedTimeline", value: proposedTimeline, type: "string" },
  ]);

  const dataId = toHex(`application_${applicationId}`, { size: 32 });

  try {
    const txHash = await sdk.streams.setAndEmitEvents(
      [{ id: dataId, schemaId, data: encodedData }],
      [
        {
          id: EVENT_SCHEMA_IDS.APPLICATION_SUBMITTED,
          argumentTopics: [toHex(jobId, { size: 32 })],
          data: "0x",
        },
      ]
    );

    return txHash;
  } catch (error) {
    console.error("Error publishing application:", error);
    return null;
  }
}

/**
 * Publish a dispute creation to Somnia Data Streams
 */
export async function publishDispute(
  escrowId: string,
  disputeId: string,
  milestoneIndex: number,
  initiator: string,
  status: number,
  walletPrivateKey?: `0x${string}`
): Promise<Hex | null> {
  const sdk = walletPrivateKey
    ? initSomniaSDKWithWallet(walletPrivateKey)
    : getSomniaSDK();

  const schemaId = await sdk.streams.computeSchemaId(DISPUTE_SCHEMA);
  const encoder = new SchemaEncoder(DISPUTE_SCHEMA);

  const encodedData = encoder.encodeData([
    { name: "timestamp", value: Date.now().toString(), type: "uint64" },
    { name: "escrowId", value: toHex(escrowId, { size: 32 }), type: "bytes32" },
    { name: "disputeId", value: toHex(disputeId, { size: 32 }), type: "bytes32" },
    { name: "milestoneIndex", value: milestoneIndex.toString(), type: "uint8" },
    { name: "initiator", value: initiator, type: "address" },
    { name: "status", value: status.toString(), type: "uint8" },
  ]);

  const dataId = toHex(`dispute_${disputeId}`, { size: 32 });

  try {
    const txHash = await sdk.streams.setAndEmitEvents(
      [{ id: dataId, schemaId, data: encodedData }],
      [
        {
          id: EVENT_SCHEMA_IDS.DISPUTE_CREATED,
          argumentTopics: [toHex(escrowId, { size: 32 })],
          data: "0x",
        },
      ]
    );

    return txHash;
  } catch (error) {
    console.error("Error publishing dispute:", error);
    return null;
  }
}

