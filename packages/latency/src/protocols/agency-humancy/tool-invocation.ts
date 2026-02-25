import { z } from 'zod';
import { ExtendedMetaSchema } from '../common/extended-meta.js';

/**
 * Versioned invocation context schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const context = InvocationContext.Latest.parse({
 *   sessionId: 'session-123',
 *   workflowId: 'workflow-456',
 * });
 *
 * // Use specific version
 * const v1Context = InvocationContext.getVersion('v1').parse(data);
 * ```
 */
export namespace InvocationContext {
  /**
   * V1: Original invocation context schema.
   * Optional metadata about the invocation.
   */
  export const V1 = z
    .object({
      workflowId: z.string().optional(),
      issueNumber: z.number().int().positive().optional(),
      sessionId: z.string().min(1, 'Session ID is required'),
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

/** Backward-compatible alias for InvocationContext schema */
export const InvocationContextSchema = InvocationContext.Latest;

/** Backward-compatible alias for InvocationContext type */
export type InvocationContext = InvocationContext.Latest;

/**
 * Versioned tool invocation schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const invocation = ToolInvocation.Latest.parse({
 *   id: 'inv-123',
 *   tool: 'namespace.tool_name',
 *   parameters: { key: 'value' },
 * });
 *
 * // Use specific version
 * const v1Invocation = ToolInvocation.getVersion('v1').parse(data);
 * ```
 */
export namespace ToolInvocation {
  /**
   * V1: Original tool invocation schema.
   * Includes optional meta field for extensibility.
   */
  export const V1 = z
    .object({
      id: z.string().min(1, 'Invocation ID is required'),
      tool: z
        .string()
        .min(1, 'Tool name is required')
        .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, 'Tool name must be lowercase with dots as namespace separators'),
      parameters: z.record(z.unknown()),
      context: InvocationContext.V1.optional(),
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

/** Backward-compatible alias for ToolInvocation schema */
export const ToolInvocationSchema = ToolInvocation.Latest;

/** Backward-compatible alias for ToolInvocation type */
export type ToolInvocation = ToolInvocation.Latest;

// Validation functions
export const parseInvocationContext = (data: unknown): InvocationContext =>
  InvocationContextSchema.parse(data);

export const safeParseInvocationContext = (data: unknown) =>
  InvocationContextSchema.safeParse(data);

export const parseToolInvocation = (data: unknown): ToolInvocation =>
  ToolInvocationSchema.parse(data);

export const safeParseToolInvocation = (data: unknown) =>
  ToolInvocationSchema.safeParse(data);
