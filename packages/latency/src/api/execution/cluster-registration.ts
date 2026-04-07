import { z } from 'zod';
import { ClusterIdSchema, OrganizationIdSchema, ProjectIdSchema, UserIdSchema } from '../../common/ids.js';
import { ISOTimestampSchema } from '../../common/timestamps.js';

/**
 * Cluster status enum.
 * - `connected`: Cluster is connected and available for work
 * - `disconnected`: Cluster has disconnected
 */
export const ClusterStatusSchema = z.enum(['connected', 'disconnected']);
export type ClusterStatus = z.infer<typeof ClusterStatusSchema>;

/**
 * Worker capacity schema.
 * Tracks total, busy, and idle worker counts for a cluster.
 */
export const WorkersSchema = z.object({
  /** Total number of workers */
  total: z.number().int().nonnegative('total must be non-negative'),

  /** Number of workers currently busy */
  busy: z.number().int().nonnegative('busy must be non-negative'),

  /** Number of workers currently idle */
  idle: z.number().int().nonnegative('idle must be non-negative'),
});

/** Semver format regex */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[\w.]+)?(?:\+[\w.]+)?$/;

/**
 * Versioned ClusterRegistration schema namespace.
 *
 * Represents a compute cluster's registration with the platform,
 * tracking connectivity and worker capacity.
 *
 * @example
 * ```typescript
 * const registration = ClusterRegistration.Latest.parse({
 *   id: '01HQVJ5KWXYZ1234567890ABCD',
 *   projectId: 'proj-789',
 *   status: 'connected',
 *   connectedAt: '2024-01-15T10:30:00Z',
 *   lastSeen: '2024-01-15T10:35:00Z',
 *   workers: { total: 10, busy: 3, idle: 5 },
 *   orchestratorVersion: '1.2.3',
 * });
 * ```
 */
export namespace ClusterRegistration {
  // Base shape shared between versions (before refinements)
  const v1Shape = {
    /** Cluster identity (ULID) */
    id: ClusterIdSchema,

    /** Owning project */
    projectId: ProjectIdSchema,

    /** Current cluster status */
    status: ClusterStatusSchema,

    /** ISO 8601 timestamp when cluster connected */
    connectedAt: ISOTimestampSchema,

    /** ISO 8601 timestamp of last activity signal */
    lastSeen: ISOTimestampSchema,

    /** Worker capacity */
    workers: WorkersSchema,

    /** Orchestrator version (semver format) */
    orchestratorVersion: z.string().regex(SEMVER_REGEX, 'Invalid semver format for orchestratorVersion'),
  };

  /**
   * V1: Original ClusterRegistration schema.
   * Cluster registrations with worker capacity tracking.
   */
  export const V1 = z.object(v1Shape).refine(
    (data) => data.workers.busy + data.workers.idle <= data.workers.total,
    {
      message: 'busy + idle workers cannot exceed total',
      path: ['workers'],
    }
  ).refine(
    (data) => new Date(data.lastSeen) >= new Date(data.connectedAt),
    {
      message: 'lastSeen must be >= connectedAt',
      path: ['lastSeen'],
    }
  );

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /**
   * V2: Adds userId and orgId fields for ownership tracking.
   */
  export const V2 = z.object({
    ...v1Shape,
    /** ID of the user who registered the cluster */
    userId: UserIdSchema,
    /** Organization the cluster belongs to */
    orgId: OrganizationIdSchema,
  }).refine(
    (data) => data.workers.busy + data.workers.idle <= data.workers.total,
    {
      message: 'busy + idle workers cannot exceed total',
      path: ['workers'],
    }
  ).refine(
    (data) => new Date(data.lastSeen) >= new Date(data.connectedAt),
    {
      message: 'lastSeen must be >= connectedAt',
      path: ['lastSeen'],
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

/** Backward-compatible alias for ClusterRegistration schema */
export const ClusterRegistrationSchema = ClusterRegistration.Latest;

/** Backward-compatible alias for ClusterRegistration type */
export type ClusterRegistration = ClusterRegistration.Latest;

// Validation functions
export const parseClusterRegistration = (data: unknown): ClusterRegistration =>
  ClusterRegistrationSchema.parse(data);

export const safeParseClusterRegistration = (data: unknown) =>
  ClusterRegistrationSchema.safeParse(data);
