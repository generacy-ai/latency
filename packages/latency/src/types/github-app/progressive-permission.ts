import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema } from '../../common/timestamps.js';
import { PermissionScopeSchema } from './permission-scope.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// Branded type for permission request IDs
export type PermissionRequestId = string & { readonly __brand: 'PermissionRequestId' };

// Zod schema with ULID validation for PermissionRequestId
export const PermissionRequestIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for PermissionRequestId')
  .transform((val) => val as PermissionRequestId);

// ID generation utility
export function generatePermissionRequestId(): PermissionRequestId {
  return ulid() as PermissionRequestId;
}

// Branded type for installation IDs (GitHub App installation)
export type InstallationId = string & { readonly __brand: 'InstallationId' };

// Installation IDs from GitHub are numeric but stored as strings
export const InstallationIdSchema = z
  .string()
  .regex(/^\d+$/, 'Installation ID must be a numeric string')
  .transform((val) => val as InstallationId);

/**
 * Status of a progressive permission request.
 */
export const PermissionRequestStatusSchema = z.enum([
  'pending',    // Request submitted, awaiting user approval
  'approved',   // User approved the permission request
  'denied',     // User denied the permission request
  'expired',    // Request expired without user action
  'revoked',    // Previously approved, now revoked
]);
export type PermissionRequestStatus = z.infer<typeof PermissionRequestStatusSchema>;

/**
 * Versioned ProgressivePermissionRequest schema namespace.
 *
 * Represents a request for additional GitHub App permissions.
 * Used for progressive permission escalation based on feature usage.
 *
 * @example
 * ```typescript
 * const request = ProgressivePermissionRequest.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   installationId: '12345678',
 *   scopes: [
 *     { category: 'repo', level: 'write' },
 *     { category: 'actions', level: 'write' },
 *   ],
 *   reason: 'Required for automated workflow creation',
 *   featureUnlocked: 'workflow-automation',
 *   status: 'pending',
 *   requestedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace ProgressivePermissionRequest {
  /**
   * V1: Original progressive permission request schema.
   */
  export const V1 = z.object({
    /** Unique identifier for this permission request */
    id: PermissionRequestIdSchema,

    /** GitHub App installation ID this request is for */
    installationId: InstallationIdSchema,

    /** Permission scopes being requested */
    scopes: z.array(PermissionScopeSchema).min(1, 'At least one scope is required'),

    /** Human-readable reason why these permissions are needed */
    reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),

    /** Feature that will be unlocked when permissions are granted */
    featureUnlocked: z.string().min(1, 'Feature identifier is required'),

    /** Current status of the request */
    status: PermissionRequestStatusSchema,

    /** When the permission request was created */
    requestedAt: ISOTimestampSchema,

    /** When the request was resolved (approved/denied/expired) */
    resolvedAt: ISOTimestampSchema.optional(),

    /** User ID who resolved the request (if resolved) */
    resolvedBy: z.string().optional(),

    /** Additional context or notes */
    notes: z.string().max(1000).optional(),
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for ProgressivePermissionRequest schema */
export const ProgressivePermissionRequestSchema = ProgressivePermissionRequest.Latest;

/** Backward-compatible alias for ProgressivePermissionRequest type */
export type ProgressivePermissionRequest = ProgressivePermissionRequest.Latest;

// Validation functions
export const parseProgressivePermissionRequest = (data: unknown): ProgressivePermissionRequest =>
  ProgressivePermissionRequestSchema.parse(data);

export const safeParseProgressivePermissionRequest = (data: unknown) =>
  ProgressivePermissionRequestSchema.safeParse(data);
