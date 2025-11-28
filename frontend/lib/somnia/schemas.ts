/**
 * Somnia Data Streams Schemas for SecureFlow
 *
 * These schemas define the structure of data published to Somnia Data Streams
 * for real-time updates across the platform.
 */

// Job Posting Schema - Published when a new job is created
export const JOB_POSTING_SCHEMA =
  "uint64 timestamp, bytes32 jobId, address creator, string title, string description, uint256 budget, uint8 status";

// Milestone Update Schema - Published when milestones are submitted, approved, or rejected
export const MILESTONE_UPDATE_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, uint8 milestoneIndex, uint8 status, address submitter, string description";

// Escrow Status Schema - Published when escrow status changes
export const ESCROW_STATUS_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, uint8 oldStatus, uint8 newStatus, address initiator";

// Application Schema - Published when freelancers apply to jobs
export const APPLICATION_SCHEMA =
  "uint64 timestamp, bytes32 jobId, bytes32 applicationId, address applicant, string coverLetter, string proposedTimeline";

// Dispute Schema - Published when disputes are created or resolved
export const DISPUTE_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, bytes32 disputeId, uint8 milestoneIndex, address initiator, uint8 status";

// Rating Schema - Published when freelancers are rated
export const RATING_SCHEMA =
  "uint64 timestamp, bytes32 escrowId, address freelancer, address rater, uint8 rating, uint256 averageRating";

// Schema names for registration
export const SCHEMA_NAMES = {
  JOB_POSTING: "secureflow_job_posting",
  MILESTONE_UPDATE: "secureflow_milestone_update",
  ESCROW_STATUS: "secureflow_escrow_status",
  APPLICATION: "secureflow_application",
  DISPUTE: "secureflow_dispute",
  RATING: "secureflow_rating",
} as const;

// Event schema IDs for subscriptions
export const EVENT_SCHEMA_IDS = {
  JOB_POSTED: "JobPosted",
  MILESTONE_UPDATED: "MilestoneUpdated",
  MILESTONE_SUBMITTED: "MilestoneSubmitted",
  MILESTONE_APPROVED: "MilestoneApproved",
  MILESTONE_REJECTED: "MilestoneRejected",
  MILESTONE_RESUBMITTED: "MilestoneResubmitted",
  ESCROW_STATUS_CHANGED: "EscrowStatusChanged",
  APPLICATION_SUBMITTED: "ApplicationSubmitted",
  DISPUTE_CREATED: "DisputeCreated",
  FREELANCER_RATED: "FreelancerRated",
} as const;

