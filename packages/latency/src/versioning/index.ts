/**
 * Version Compatibility Module
 *
 * Provides utilities for version negotiation, capability management,
 * and compatibility across different component versions.
 *
 * @module version-compatibility
 *
 * @example
 * ```typescript
 * import {
 *   validateCapabilityDependencies,
 *   createVersionedSchema,
 *   collectDeprecationWarnings,
 * } from '@generacy-ai/latency/versioning';
 *
 * // Validate capability dependencies
 * const result = validateCapabilityDependencies([
 *   Capability.METRICS,
 *   Capability.TELEMETRY,
 * ]);
 *
 * // Create versioned schemas
 * const schemas = createVersionedSchema({
 *   '1.0': MySchemaV1,
 *   '2.0': MySchemaV2,
 * });
 *
 * // Collect deprecation warnings
 * const warnings = collectDeprecationWarnings(capabilities);
 * ```
 */

// Capability registry exports
export {
  /** Full capability configuration registry */
  CAPABILITY_CONFIG,
  /** Capability dependency map */
  CAPABILITY_DEPS,
  /** Validate capability dependencies are satisfied */
  validateCapabilityDependencies,
  /** Get configuration for a capability */
  getCapabilityConfig,
  /** Check if a capability is deprecated */
  isCapabilityDeprecated,
  /** Get deprecation info for a capability */
  getDeprecationInfo,
  /** Get all dependencies for a capability */
  getAllDependencies,
  /** Dependency validation result type */
  type DependencyValidationResult,
} from './capability-registry.js';

// Versioned schema exports
export {
  /** Create a versioned schema collection */
  createVersionedSchema,
  /** Get schema for a specific version */
  getSchemaForVersion,
  /** Configuration for a versioned schema */
  type VersionedSchemaConfig,
  /** Map of version strings to schemas */
  type SchemaVersionMap,
  /** Example versioned decision request schema namespace */
  VersionedDecisionRequest,
} from './versioned-schemas.js';

// Deprecation warning exports
export {
  /** Deprecation warning with full context */
  type DeprecationWarning,
  /** Zod schema for deprecation warnings */
  DeprecationWarningSchema,
  /** Collect deprecation warnings for capabilities */
  collectDeprecationWarnings,
  /** Format a single deprecation message */
  formatDeprecationMessage,
  /** Format multiple deprecation messages */
  formatDeprecationMessages,
  /** Check if any capabilities are deprecated */
  hasDeprecatedCapabilities,
  /** Get suggested replacements for deprecated capabilities */
  getDeprecationReplacements,
} from './deprecation-warnings.js';
