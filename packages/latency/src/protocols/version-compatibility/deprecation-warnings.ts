import { z } from 'zod';
import { Capability, type DeprecationInfo } from '../common/capability.js';
import { CAPABILITY_CONFIG } from './capability-registry.js';

/**
 * A deprecation warning with full context.
 */
export interface DeprecationWarning {
  /** The capability that is deprecated */
  capability: Capability;
  /** Version when the capability was deprecated */
  since: string;
  /** The capability that replaces this one, if any */
  replacement?: Capability;
  /** The formatted warning message */
  message: string;
}

/**
 * Zod schema for deprecation warnings.
 */
export const DeprecationWarningSchema = z.object({
  capability: z.nativeEnum(Capability),
  since: z.string(),
  replacement: z.nativeEnum(Capability).optional(),
  message: z.string(),
});

/**
 * Collect deprecation warnings for a set of capabilities.
 *
 * This function checks each capability against the capability registry
 * and returns warnings for any that are marked as deprecated.
 *
 * @param capabilities - The capabilities to check for deprecation
 * @returns Array of deprecation warnings
 *
 * @example
 * ```typescript
 * const warnings = collectDeprecationWarnings([
 *   Capability.TELEMETRY,
 *   Capability.METRICS,
 * ]);
 * // Returns warnings for any deprecated capabilities
 * ```
 */
export function collectDeprecationWarnings(
  capabilities: Capability[]
): DeprecationWarning[] {
  const warnings: DeprecationWarning[] = [];

  for (const capability of capabilities) {
    const config = CAPABILITY_CONFIG.get(capability);
    if (config?.deprecated) {
      const warning: DeprecationWarning = {
        capability,
        since: config.deprecated.since,
        message: formatDeprecationMessage(capability, config.deprecated),
      };
      if (config.deprecated.replacement !== undefined) {
        warning.replacement = config.deprecated.replacement;
      }
      warnings.push(warning);
    }
  }

  return warnings;
}

/**
 * Format a deprecation message for a capability.
 *
 * @param capability - The deprecated capability
 * @param info - The deprecation info
 * @returns Formatted deprecation message
 *
 * @example
 * ```typescript
 * const message = formatDeprecationMessage(Capability.OLD_FEATURE, {
 *   since: '2.0.0',
 *   replacement: Capability.NEW_FEATURE,
 *   message: 'Old feature has been replaced.',
 * });
 * // "Capability 'old_feature' is deprecated since 2.0.0. Old feature has been replaced. Use 'new_feature' instead."
 * ```
 */
export function formatDeprecationMessage(
  capability: Capability,
  info: DeprecationInfo
): string {
  let message = `Capability '${capability}' is deprecated since ${info.since}.`;

  if (info.message) {
    message += ` ${info.message}`;
  }

  if (info.replacement) {
    message += ` Use '${info.replacement}' instead.`;
  }

  return message;
}

/**
 * Format multiple deprecation warnings into an array of message strings.
 *
 * @param warnings - The deprecation warnings to format
 * @returns Array of formatted message strings
 *
 * @example
 * ```typescript
 * const warnings = collectDeprecationWarnings([...]);
 * const messages = formatDeprecationMessages(warnings);
 * // ['Warning 1...', 'Warning 2...']
 * ```
 */
export function formatDeprecationMessages(warnings: DeprecationWarning[]): string[] {
  return warnings.map((w) => w.message);
}

/**
 * Check if any capabilities in a list are deprecated.
 *
 * @param capabilities - The capabilities to check
 * @returns true if any capability is deprecated
 */
export function hasDeprecatedCapabilities(capabilities: Capability[]): boolean {
  return capabilities.some((cap) => {
    const config = CAPABILITY_CONFIG.get(cap);
    return config?.deprecated !== undefined;
  });
}

/**
 * Get suggested replacements for deprecated capabilities.
 *
 * @param capabilities - The capabilities to check
 * @returns Map of deprecated capabilities to their suggested replacements
 */
export function getDeprecationReplacements(
  capabilities: Capability[]
): Map<Capability, Capability | undefined> {
  const replacements = new Map<Capability, Capability | undefined>();

  for (const capability of capabilities) {
    const config = CAPABILITY_CONFIG.get(capability);
    if (config?.deprecated) {
      replacements.set(capability, config.deprecated.replacement);
    }
  }

  return replacements;
}
