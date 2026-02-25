import { z } from 'zod';

/**
 * All capabilities that can be negotiated between components.
 *
 * Capabilities represent features that may or may not be available
 * in a given session, depending on the protocol version and
 * component implementations.
 */
export enum Capability {
  // Core capabilities
  TOOLS = 'tools',
  MODES = 'modes',
  CHANNELS = 'channels',

  // Decision capabilities
  URGENCY = 'urgency',
  BATCH_DECISIONS = 'batch_decisions',
  DECISION_OPTIONS = 'decision_options',

  // Telemetry capabilities
  TELEMETRY = 'telemetry',
  METRICS = 'metrics',
}

/**
 * Zod schema for validating capability strings.
 */
export const CapabilitySchema = z.enum([
  'tools',
  'modes',
  'channels',
  'urgency',
  'batch_decisions',
  'decision_options',
  'telemetry',
  'metrics',
]);

export type CapabilityString = z.infer<typeof CapabilitySchema>;

/**
 * Deprecation information for a capability that is being phased out.
 */
export interface DeprecationInfo {
  /** Version when the capability was deprecated */
  since: string;
  /** The capability that replaces this one, if any */
  replacement?: Capability;
  /** Custom message explaining the deprecation */
  message?: string;
}

/**
 * Zod schema for deprecation info.
 */
export const DeprecationInfoSchema = z.object({
  since: z.string(),
  replacement: CapabilitySchema.optional(),
  message: z.string().optional(),
});

/**
 * Configuration metadata for a capability.
 */
export interface CapabilityConfig {
  /** Other capabilities that must be available for this one to function */
  dependsOn?: Capability[];
  /** Deprecation information if this capability is being phased out */
  deprecated?: DeprecationInfo;
}

/**
 * Zod schema for capability configuration.
 */
export const CapabilityConfigSchema = z.object({
  dependsOn: z.array(CapabilitySchema).optional(),
  deprecated: DeprecationInfoSchema.optional(),
});

/**
 * Error thrown when a required capability is not available.
 */
export class CapabilityMissingError extends Error {
  readonly code = 'CAPABILITY_MISSING' as const;
  readonly capability: Capability;
  readonly availableCapabilities: Capability[];
  readonly suggestion: string | undefined;

  constructor(
    capability: Capability,
    availableCapabilities: Capability[],
    suggestion?: string | undefined
  ) {
    const suggestionText = suggestion !== undefined ? ` ${suggestion}` : '';
    super(
      `Capability '${capability}' is not available. ` +
      `Available capabilities: [${availableCapabilities.join(', ')}].${suggestionText}`
    );
    this.name = 'CapabilityMissingError';
    this.capability = capability;
    this.availableCapabilities = availableCapabilities;
    this.suggestion = suggestion;
  }
}

/**
 * Result of a non-throwing capability requirement check.
 */
export interface CapabilityResult {
  success: boolean;
  error?: CapabilityMissingError;
}

/**
 * Interface for querying capability availability at runtime.
 */
export interface CapabilityQuery {
  /**
   * Check if a capability is available.
   * @param cap - The capability to check
   * @returns true if the capability is available
   */
  hasCapability(cap: Capability): boolean;

  /**
   * Get all available capabilities.
   * @returns Array of available capabilities
   */
  getCapabilities(): Capability[];

  /**
   * Require a capability or throw an error.
   * @param cap - The capability to require
   * @throws CapabilityMissingError if the capability is not available
   */
  requireCapability(cap: Capability): void;

  /**
   * Try to require a capability without throwing.
   * @param cap - The capability to check
   * @returns Result object with success status and optional error
   */
  tryRequireCapability(cap: Capability): CapabilityResult;
}

/**
 * Create a capability query instance from a list of available capabilities.
 *
 * @param capabilities - The capabilities available in this session
 * @returns A CapabilityQuery instance
 *
 * @example
 * ```typescript
 * const query = createCapabilityQuery([Capability.TOOLS, Capability.MODES]);
 *
 * if (query.hasCapability(Capability.URGENCY)) {
 *   // Use urgency features
 * }
 *
 * // Or require it (throws if missing)
 * query.requireCapability(Capability.TOOLS);
 * ```
 */
export function createCapabilityQuery(capabilities: Capability[]): CapabilityQuery {
  // Deduplicate capabilities
  const capabilitySet = new Set(capabilities);
  const dedupedCapabilities = [...capabilitySet];

  return {
    hasCapability(cap: Capability): boolean {
      return capabilitySet.has(cap);
    },

    getCapabilities(): Capability[] {
      return [...dedupedCapabilities];
    },

    requireCapability(cap: Capability): void {
      if (!capabilitySet.has(cap)) {
        throw new CapabilityMissingError(cap, dedupedCapabilities);
      }
    },

    tryRequireCapability(cap: Capability): CapabilityResult {
      if (capabilitySet.has(cap)) {
        return { success: true };
      }
      return {
        success: false,
        error: new CapabilityMissingError(cap, dedupedCapabilities),
      };
    },
  };
}
