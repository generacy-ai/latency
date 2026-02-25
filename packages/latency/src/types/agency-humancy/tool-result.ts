import { z } from 'zod';
import { ExtendedMetaSchema } from '../../common/extended-meta.js';

/**
 * Versioned tool error schema namespace.
 *
 * Error codes use namespaced string format (e.g., 'tool.not_found', 'auth.failed').
 *
 * @example
 * ```typescript
 * // Use latest version
 * const error = ToolError.Latest.parse({
 *   code: 'tool.not_found',
 *   message: 'Tool not found',
 * });
 *
 * // Use specific version
 * const v1Error = ToolError.getVersion('v1').parse(data);
 * ```
 */
export namespace ToolError {
  /**
   * V1: Original tool error schema.
   * Supports code, message, and optional details.
   */
  export const V1 = z
    .object({
      code: z
        .string()
        .min(1, 'Error code is required')
        .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, 'Error code must be namespaced (e.g., tool.not_found)'),
      message: z.string().min(1, 'Error message is required'),
      details: z.unknown().optional(),
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

/** Backward-compatible alias for ToolError schema */
export const ToolErrorSchema = ToolError.Latest;

/** Backward-compatible alias for ToolError type */
export type ToolError = ToolError.Latest;

/**
 * Versioned tool result schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const result = ToolResult.Latest.parse({
 *   invocationId: 'inv-123',
 *   success: true,
 *   durationMs: 150,
 * });
 *
 * // Use specific version
 * const v1Result = ToolResult.getVersion('v1').parse(data);
 * ```
 */
export namespace ToolResult {
  /**
   * V1: Original tool result schema.
   * Supports invocationId, success, output, error, durationMs, and optional meta.
   * Note: .refine() is applied before .passthrough() to validate error requirement.
   */
  export const V1 = z
    .object({
      invocationId: z.string().min(1, 'Invocation ID is required'),
      success: z.boolean(),
      output: z.unknown().optional(),
      error: ToolError.V1.optional(),
      durationMs: z.number().nonnegative('Duration must be non-negative'),
      meta: ExtendedMetaSchema.optional(),
    })
    .passthrough()
    .refine(
      (data) => {
        // If success is false, error should be present
        if (!data.success && !data.error) {
          return false;
        }
        return true;
      },
      {
        message: 'Error details are required when success is false',
        path: ['error'],
      }
    );

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

/** Backward-compatible alias for ToolResult schema */
export const ToolResultSchema = ToolResult.Latest;

/** Backward-compatible alias for ToolResult type */
export type ToolResult = ToolResult.Latest;

// Validation functions
export const parseToolError = (data: unknown): ToolError =>
  ToolErrorSchema.parse(data);

export const safeParseToolError = (data: unknown) =>
  ToolErrorSchema.safeParse(data);

export const parseToolResult = (data: unknown): ToolResult =>
  ToolResultSchema.parse(data);

export const safeParseToolResult = (data: unknown) =>
  ToolResultSchema.safeParse(data);
