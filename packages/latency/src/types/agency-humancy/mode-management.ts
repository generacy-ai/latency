import { z } from 'zod';
import { ExtendedMetaSchema } from '../../common/extended-meta.js';

/**
 * Versioned mode definition schema namespace.
 *
 * Mode inheritance is additive - a child mode gets all parent tools plus its own.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const mode = ModeDefinition.Latest.parse({
 *   name: 'code-review',
 *   description: 'Mode for reviewing code changes',
 *   tools: ['file.read', 'git.diff'],
 * });
 *
 * // Use specific version
 * const v1Mode = ModeDefinition.getVersion('v1').parse(data);
 * ```
 */
export namespace ModeDefinition {
  /**
   * V1: Original mode definition schema.
   * Supports name, description, tools array, optional extends, and optional meta.
   */
  export const V1 = z
    .object({
      name: z.string().min(1, 'Mode name is required'),
      description: z.string().min(1, 'Mode description is required'),
      tools: z.array(
        z
          .string()
          .min(1)
          .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, 'Tool name must be lowercase with dots as namespace separators')
      ),
      extends: z.string().min(1).optional(),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough();

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   * Use this with getVersion() for dynamic version selection.
   */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for ModeDefinition schema */
export const ModeDefinitionSchema = ModeDefinition.Latest;

/** Backward-compatible alias for ModeDefinition type */
export type ModeDefinition = ModeDefinition.Latest;

/**
 * Versioned mode change request schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const request = ModeChangeRequest.Latest.parse({
 *   mode: 'code-review',
 *   reason: 'Switching to review workflow',
 * });
 *
 * // Use specific version
 * const v1Request = ModeChangeRequest.getVersion('v1').parse(data);
 * ```
 */
export namespace ModeChangeRequest {
  /**
   * V1: Original mode change request schema.
   * Supports mode name, optional reason, and optional meta.
   */
  export const V1 = z
    .object({
      mode: z.string().min(1, 'Mode name is required'),
      reason: z.string().optional(),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough();

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema - always point to the newest version */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /**
   * Version registry mapping version keys to their schemas.
   * Use this with getVersion() for dynamic version selection.
   */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /**
   * Get the schema for a specific version.
   * @param version - Version key (e.g., 'v1')
   * @returns The schema for that version
   */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for ModeChangeRequest schema */
export const ModeChangeRequestSchema = ModeChangeRequest.Latest;

/** Backward-compatible alias for ModeChangeRequest type */
export type ModeChangeRequest = ModeChangeRequest.Latest;

// Validation functions
export const parseModeDefinition = (data: unknown): ModeDefinition =>
  ModeDefinitionSchema.parse(data);

export const safeParseModeDefinition = (data: unknown) =>
  ModeDefinitionSchema.safeParse(data);

export const parseModeChangeRequest = (data: unknown): ModeChangeRequest =>
  ModeChangeRequestSchema.parse(data);

export const safeParseModeChangeRequest = (data: unknown) =>
  ModeChangeRequestSchema.safeParse(data);
