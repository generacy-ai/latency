import { z } from 'zod';
import { compareVersions } from '../common/version.js';

/**
 * Configuration for a versioned schema.
 */
export interface VersionedSchemaConfig<T extends z.ZodTypeAny> {
  /** The version string (e.g., '1.0', '2.0') */
  version: string;
  /** The Zod schema for this version */
  schema: T;
}

/**
 * A map of version strings to their corresponding schemas.
 */
export type SchemaVersionMap<T extends z.ZodTypeAny = z.ZodTypeAny> = Record<string, T>;

/**
 * Create a versioned schema collection with utilities for version selection.
 *
 * @param versions - Map of version strings to schemas
 * @returns Object with version map and utility functions
 *
 * @example
 * ```typescript
 * const { versions, getSchema, latest } = createVersionedSchema({
 *   '1.0': z.object({ name: z.string() }),
 *   '2.0': z.object({ name: z.string(), email: z.string().optional() }),
 * });
 *
 * // Get schema for specific version
 * const v1Schema = getSchema('1.0');
 *
 * // Use latest schema
 * const data = latest.parse({ name: 'John' });
 * ```
 */
export function createVersionedSchema<T extends SchemaVersionMap>(versions: T) {
  const versionKeys = Object.keys(versions);

  if (versionKeys.length === 0) {
    throw new Error('At least one schema version must be provided');
  }

  // Sort versions descending to find latest
  const sortedVersions = [...versionKeys].sort((a, b) => compareVersions(b, a));
  const latestVersion = sortedVersions[0]!;

  return {
    /** All available versions and their schemas */
    versions,

    /** The latest/highest version schema */
    latest: versions[latestVersion]!,

    /** The latest version string */
    latestVersion,

    /** All available version strings, sorted descending */
    availableVersions: sortedVersions,

    /**
     * Get the schema for a specific version.
     * @param version - Version string to look up
     * @returns The schema for that version, or undefined if not found
     */
    getSchema<K extends keyof T>(version: K): T[K] | undefined {
      return versions[version];
    },

    /**
     * Check if a version is supported.
     * @param version - Version string to check
     * @returns true if the version exists
     */
    hasVersion(version: string): boolean {
      return version in versions;
    },
  };
}

/**
 * Get a schema for a specific protocol version from a version map.
 *
 * This function provides a standalone way to look up schemas by version,
 * useful when you don't need the full createVersionedSchema utilities.
 *
 * @param versions - Map of version strings to schemas
 * @param version - The version to look up
 * @returns The schema for that version, or undefined if not found
 *
 * @example
 * ```typescript
 * const schemas = {
 *   '1.0': DecisionRequest.V1,
 *   '2.0': DecisionRequest.V2,
 * };
 *
 * const schema = getSchemaForVersion(schemas, negotiatedVersion);
 * if (schema) {
 *   const parsed = schema.parse(data);
 * }
 * ```
 */
export function getSchemaForVersion<T extends z.ZodTypeAny>(
  versions: SchemaVersionMap<T>,
  version: string
): T | undefined {
  return versions[version];
}

// ============================================================================
// Example: VersionedDecisionRequest namespace showing the versioned schema pattern
// ============================================================================

/**
 * Versioned decision request schemas demonstrating the versioned schema pattern.
 *
 * This namespace shows how to evolve a schema across protocol versions
 * while maintaining backwards compatibility.
 *
 * Note: This is named VersionedDecisionRequest to avoid conflict with the
 * DecisionRequest type in agency-humancy module. It serves as an example
 * of how to implement versioned schemas.
 *
 * @example
 * ```typescript
 * // Use latest version by default
 * const request = VersionedDecisionRequest.Latest.parse({
 *   question: 'What should I do?',
 *   urgency: 'high',
 * });
 *
 * // Or use specific version based on negotiated protocol
 * const schema = VersionedDecisionRequest.VERSIONS['1.0'];
 * const v1Request = schema.parse({ question: 'What should I do?' });
 * ```
 */
export namespace VersionedDecisionRequest {
  /**
   * V1: Original decision request schema.
   * Supports basic question and optional context.
   */
  export const V1 = z.object({
    question: z.string().min(1),
    context: z.string().optional(),
  });

  /**
   * V2: Extended decision request schema.
   * Adds urgency and options support, building on V1.
   */
  export const V2 = V1.extend({
    urgency: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    options: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          description: z.string().optional(),
        })
      )
      .optional(),
  });

  /** Latest stable schema - always point to the newest version */
  export const Latest = V2;

  /** Type inference for V1 schema */
  export type V1Type = z.infer<typeof V1>;

  /** Type inference for V2 schema */
  export type V2Type = z.infer<typeof V2>;

  /** Type inference for latest schema */
  export type LatestType = z.infer<typeof Latest>;

  /**
   * Version registry mapping protocol versions to their schemas.
   * Use this with getSchemaForVersion() for dynamic schema selection.
   */
  export const VERSIONS = {
    '1.0': V1,
    '2.0': V2,
  } as const;

  /**
   * Get the schema for a specific protocol version.
   * @param version - Protocol version (e.g., '1.0', '2.0')
   * @returns The schema for that version, or undefined
   */
  export function getVersion(version: string) {
    return VERSIONS[version as keyof typeof VERSIONS];
  }
}
