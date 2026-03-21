// Platform API Execution Schemas
// Re-exports all execution-related schemas

// Execution Lease
export {
  ExecutionLease,
  ExecutionLeaseSchema,
  type ExecutionLease as ExecutionLeaseType,
  LeaseStatusSchema,
  type LeaseStatus,
  parseExecutionLease,
  safeParseExecutionLease,
} from './execution-lease.js';

// Cluster Registration
export {
  ClusterRegistration,
  ClusterRegistrationSchema,
  type ClusterRegistration as ClusterRegistrationType,
  ClusterStatusSchema,
  type ClusterStatus,
  WorkersSchema,
  parseClusterRegistration,
  safeParseClusterRegistration,
} from './cluster-registration.js';

// Re-export ID types from common for convenience
export type { LeaseId, ClusterId, QueueItemId, JobId, ProjectId } from '../../common/ids.js';
export { generateLeaseId, generateClusterId } from '../../common/ids.js';
