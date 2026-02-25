import { z } from 'zod';
import { ExtendedMetaSchema } from '../common/extended-meta.js';

/**
 * Versioned tool parameter schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const param = ToolParameterSchema.Latest.parse({
 *   name: 'userId',
 *   schema: { type: 'string' },
 * });
 *
 * // Use specific version
 * const v1Param = ToolParameterSchema.getVersion('v1').parse(data);
 * ```
 */
export namespace ToolParameterSchema {
  /**
   * V1: Original tool parameter schema.
   * Uses JSON Schema format for interoperability.
   */
  export const V1 = z
    .object({
      name: z.string().min(1, 'Parameter name is required'),
      schema: z.record(z.unknown()).describe('JSON Schema definition for the parameter'),
      description: z.string().optional(),
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

/** Backward-compatible alias for ToolParameterSchema schema */
export const ToolParameterSchemaSchema = ToolParameterSchema.Latest;

/** Backward-compatible alias for ToolParameterSchema type */
export type ToolParameterSchema = ToolParameterSchema.Latest;

/**
 * Versioned return schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const returnSchema = ReturnSchema.Latest.parse({
 *   schema: { type: 'object' },
 * });
 *
 * // Use specific version
 * const v1Return = ReturnSchema.getVersion('v1').parse(data);
 * ```
 */
export namespace ReturnSchema {
  /**
   * V1: Original return schema.
   * Uses JSON Schema format for interoperability.
   */
  export const V1 = z
    .object({
      schema: z.record(z.unknown()).describe('JSON Schema definition for the return type'),
      description: z.string().optional(),
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

/** Backward-compatible alias for ReturnSchema schema */
export const ReturnSchemaSchema = ReturnSchema.Latest;

/** Backward-compatible alias for ReturnSchema type */
export type ReturnSchema = ReturnSchema.Latest;

/**
 * Versioned tool registration schema namespace.
 *
 * @example
 * ```typescript
 * // Use latest version
 * const registration = ToolRegistration.Latest.parse({
 *   name: 'plugin.tool_name',
 *   server: 'my-server',
 *   description: 'A useful tool',
 *   parameters: [],
 *   returns: { schema: { type: 'object' } },
 *   modes: ['default'],
 * });
 *
 * // Use specific version
 * const v1Registration = ToolRegistration.getVersion('v1').parse(data);
 * ```
 */
export namespace ToolRegistration {
  /**
   * V1: Original tool registration schema.
   * Includes optional meta field for extensible metadata.
   */
  export const V1 = z
    .object({
      name: z
        .string()
        .min(1, 'Tool name is required')
        .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/, 'Tool name must be lowercase with dots as namespace separators'),
      server: z.string().min(1, 'Server name is required'),
      description: z.string().min(1, 'Description is required'),
      parameters: z.array(ToolParameterSchema.V1),
      returns: ReturnSchema.V1,
      modes: z.array(z.string().min(1)).min(1, 'At least one mode is required'),
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

/** Backward-compatible alias for ToolRegistration schema */
export const ToolRegistrationSchema = ToolRegistration.Latest;

/** Backward-compatible alias for ToolRegistration type */
export type ToolRegistration = ToolRegistration.Latest;

// Validation functions
export const parseToolParameterSchema = (data: unknown): ToolParameterSchema =>
  ToolParameterSchemaSchema.parse(data);

export const safeParseToolParameterSchema = (data: unknown) =>
  ToolParameterSchemaSchema.safeParse(data);

export const parseReturnSchema = (data: unknown): ReturnSchema =>
  ReturnSchemaSchema.parse(data);

export const safeParseReturnSchema = (data: unknown) =>
  ReturnSchemaSchema.safeParse(data);

export const parseToolRegistration = (data: unknown): ToolRegistration =>
  ToolRegistrationSchema.parse(data);

export const safeParseToolRegistration = (data: unknown) =>
  ToolRegistrationSchema.safeParse(data);
