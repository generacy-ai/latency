import { z } from 'zod';
import { LeaseIdSchema, ClusterIdSchema, QueueItemIdSchema, JobIdSchema, UserIdSchema, OrganizationIdSchema } from '../../common/ids.js';
import { ISOTimestampSchema } from '../../common/timestamps.js';

/**
 * Lease status enum.
 * - `active`: Lease is active and the cluster is executing work
 * - `releasing`: Lease is being released (graceful shutdown in progress)
 */
export const LeaseStatusSchema = z.enum(['active', 'releasing']);
export type LeaseStatus = z.infer<typeof LeaseStatusSchema>;

/**
 * Versioned ExecutionLease schema namespace.
 *
 * Represents an active execution grant given to a cluster for a specific
 * queue item/job. Leases are time-bounded with heartbeat-based renewal.
 *
 * @example
 * ```typescript
 * const lease = ExecutionLease.Latest.parse({
 *   id: '01HQVJ5KWXYZ1234567890ABCD',
 *   clusterId: '01HQVJ5KWXYZ1234567890EFGH',
 *   queueItemId: 'qi-123',
 *   jobId: 'job-456',
 *   status: 'active',
 *   grantedAt: '2024-01-15T10:30:00Z',
 *   lastHeartbeat: '2024-01-15T10:30:00Z',
 *   ttlSeconds: 90,
 * });
 * ```
 */
export namespace ExecutionLease {
  /** Shared V1 field definitions, reused by later versions */
  const v1Shape = {
    /** Unique lease identifier (ULID) */
    id: LeaseIdSchema,

    /** Cluster holding this lease (ULID) */
    clusterId: ClusterIdSchema,

    /** Queue item being executed */
    queueItemId: QueueItemIdSchema,

    /** Parent job */
    jobId: JobIdSchema,

    /** Current lease status */
    status: LeaseStatusSchema,

    /** ISO 8601 timestamp when the lease was granted */
    grantedAt: ISOTimestampSchema,

    /** ISO 8601 timestamp of last heartbeat from the cluster */
    lastHeartbeat: ISOTimestampSchema,

    /** Time-to-live in seconds (positive integer, default 90) */
    ttlSeconds: z.number().int().positive('ttlSeconds must be positive').default(90),
  };

  /**
   * V1: Original ExecutionLease schema.
   * Execution grants with heartbeat-based TTL renewal.
   */
  export const V1 = z.object(v1Shape).refine(
    (data) => new Date(data.lastHeartbeat) >= new Date(data.grantedAt),
    {
      message: 'lastHeartbeat must be >= grantedAt',
      path: ['lastHeartbeat'],
    }
  );

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /**
   * V2: Adds userId and orgId for ownership tracking.
   * Extends V1 fields with user and organization identifiers.
   */
  export const V2 = z.object({
    ...v1Shape,

    /** User who owns/initiated this lease */
    userId: UserIdSchema,

    /** Organization this lease belongs to */
    orgId: OrganizationIdSchema,
  }).refine(
    (data) => new Date(data.lastHeartbeat) >= new Date(data.grantedAt),
    {
      message: 'lastHeartbeat must be >= grantedAt',
      path: ['lastHeartbeat'],
    }
  );

  /** Type inference for V2 schema */
  export type V2 = z.infer<typeof V2>;

  /** Latest stable schema - always points to the newest version */
  export const Latest = V2;

  /** Type inference for latest schema */
  export type Latest = V2;

  /**
   * Version registry mapping version keys to their schemas.
   * Use this with getVersion() for dynamic version selection.
   */
  export const VERSIONS = {
    v1: V1,
    v2: V2,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1', 'v2')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for ExecutionLease schema */
export const ExecutionLeaseSchema = ExecutionLease.Latest;

/** Backward-compatible alias for ExecutionLease type */
export type ExecutionLease = ExecutionLease.Latest;

// Validation functions
export const parseExecutionLease = (data: unknown): ExecutionLease =>
  ExecutionLeaseSchema.parse(data);

export const safeParseExecutionLease = (data: unknown) =>
  ExecutionLeaseSchema.safeParse(data);
