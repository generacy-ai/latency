import {
  Capability,
  type CapabilityConfig,
  type DeprecationInfo,
} from '../common/capability.js';

/**
 * Capability dependency map.
 * Lists which capabilities depend on other capabilities.
 */
export const CAPABILITY_DEPS: ReadonlyMap<Capability, readonly Capability[]> = new Map([
  // Metrics depends on telemetry infrastructure
  [Capability.METRICS, [Capability.TELEMETRY]],
  // Batch decisions depends on having basic decision options
  [Capability.BATCH_DECISIONS, [Capability.DECISION_OPTIONS]],
]);

/**
 * Full capability configuration registry with dependency and deprecation metadata.
 */
export const CAPABILITY_CONFIG: ReadonlyMap<Capability, CapabilityConfig> = new Map([
  // Core capabilities - no dependencies
  [Capability.TOOLS, {}],
  [Capability.MODES, {}],
  [Capability.CHANNELS, {}],

  // Decision capabilities
  [Capability.URGENCY, {}],
  [Capability.DECISION_OPTIONS, {}],
  [Capability.BATCH_DECISIONS, {
    dependsOn: [Capability.DECISION_OPTIONS],
  }],

  // Telemetry capabilities
  [Capability.TELEMETRY, {}],
  [Capability.METRICS, {
    dependsOn: [Capability.TELEMETRY],
  }],
]);

/**
 * Result of capability dependency validation.
 */
export interface DependencyValidationResult {
  valid: boolean;
  missingDependencies: Map<Capability, Capability[]>;
}

/**
 * Validate that all capability dependencies are satisfied.
 *
 * @param capabilities - The set of capabilities to validate
 * @returns Validation result with any missing dependencies
 *
 * @example
 * ```typescript
 * const result = validateCapabilityDependencies([
 *   Capability.METRICS,
 *   Capability.TELEMETRY, // Required by METRICS
 * ]);
 * // result.valid === true
 *
 * const badResult = validateCapabilityDependencies([
 *   Capability.METRICS,
 *   // Missing TELEMETRY!
 * ]);
 * // badResult.valid === false
 * // badResult.missingDependencies.get(Capability.METRICS) === [Capability.TELEMETRY]
 * ```
 */
export function validateCapabilityDependencies(
  capabilities: Capability[]
): DependencyValidationResult {
  const capSet = new Set(capabilities);
  const missingDependencies = new Map<Capability, Capability[]>();

  for (const cap of capabilities) {
    const config = CAPABILITY_CONFIG.get(cap);
    if (config?.dependsOn) {
      const missing = config.dependsOn.filter((dep) => !capSet.has(dep));
      if (missing.length > 0) {
        missingDependencies.set(cap, missing);
      }
    }
  }

  return {
    valid: missingDependencies.size === 0,
    missingDependencies,
  };
}

/**
 * Get the configuration for a capability.
 *
 * @param capability - The capability to get config for
 * @returns The capability config, or undefined if not found
 */
export function getCapabilityConfig(capability: Capability): CapabilityConfig | undefined {
  return CAPABILITY_CONFIG.get(capability);
}

/**
 * Check if a capability is deprecated.
 *
 * @param capability - The capability to check
 * @returns true if the capability is deprecated
 */
export function isCapabilityDeprecated(capability: Capability): boolean {
  const config = CAPABILITY_CONFIG.get(capability);
  return config?.deprecated !== undefined;
}

/**
 * Get deprecation information for a capability.
 *
 * @param capability - The capability to get deprecation info for
 * @returns Deprecation info if deprecated, undefined otherwise
 */
export function getDeprecationInfo(capability: Capability): DeprecationInfo | undefined {
  const config = CAPABILITY_CONFIG.get(capability);
  return config?.deprecated;
}

/**
 * Get all dependencies for a capability, including transitive dependencies.
 *
 * @param capability - The capability to get dependencies for
 * @param visited - Set of already visited capabilities (for cycle detection)
 * @returns Array of all required capabilities
 */
export function getAllDependencies(
  capability: Capability,
  visited: Set<Capability> = new Set()
): Capability[] {
  if (visited.has(capability)) {
    return []; // Cycle detected, stop recursion
  }
  visited.add(capability);

  const config = CAPABILITY_CONFIG.get(capability);
  if (!config?.dependsOn || config.dependsOn.length === 0) {
    return [];
  }

  const allDeps: Capability[] = [];
  for (const dep of config.dependsOn) {
    allDeps.push(dep);
    allDeps.push(...getAllDependencies(dep, visited));
  }

  // Deduplicate
  return [...new Set(allDeps)];
}
