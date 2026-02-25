import { z } from 'zod';

// Semantic version interface
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export interface ParseVersionOptions {
  loose?: boolean; // Allow partial versions (1, 1.0)
}

// Strict semver regex: MAJOR.MINOR.PATCH[-prerelease][+build]
const STRICT_SEMVER_REGEX =
  /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

// Loose semver regex: allows MAJOR or MAJOR.MINOR
const LOOSE_SEMVER_REGEX =
  /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

/**
 * Parse a version string into a SemVer object.
 *
 * @param version - The version string to parse
 * @param opts - Options for parsing (loose mode allows partial versions)
 * @returns Parsed SemVer object
 * @throws Error if the version string is invalid
 */
export function parseVersion(version: string, opts?: ParseVersionOptions): SemVer {
  const regex = opts?.loose ? LOOSE_SEMVER_REGEX : STRICT_SEMVER_REGEX;
  const match = version.match(regex);

  if (!match) {
    throw new Error(
      `Invalid version format: "${version}"${opts?.loose ? '' : '. Expected format: MAJOR.MINOR.PATCH'}`
    );
  }

  // match[1] is guaranteed to exist if the regex matched
  const result: SemVer = {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2] ?? '0', 10),
    patch: parseInt(match[3] ?? '0', 10),
  };

  if (match[4]) {
    result.prerelease = match[4];
  }
  if (match[5]) {
    result.build = match[5];
  }

  return result;
}

/**
 * Compare two version strings.
 *
 * @param a - First version string
 * @param b - Second version string
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const vA = parseVersion(a, { loose: true });
  const vB = parseVersion(b, { loose: true });

  // Compare major, minor, patch
  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if (vA.patch !== vB.patch) return vA.patch < vB.patch ? -1 : 1;

  // Prerelease versions have lower precedence than normal versions
  // E.g., 1.0.0-alpha < 1.0.0
  if (vA.prerelease && !vB.prerelease) return -1;
  if (!vA.prerelease && vB.prerelease) return 1;

  // Compare prerelease strings lexicographically if both exist
  if (vA.prerelease && vB.prerelease) {
    const comparison = vA.prerelease.localeCompare(vB.prerelease);
    if (comparison !== 0) return comparison < 0 ? -1 : 1;
  }

  return 0;
}

/**
 * Check if an actual version satisfies a required version range.
 *
 * Supports:
 * - Exact match: "1.2.3"
 * - Caret (compatible): "^1.2.3" - allows 1.x.x where x >= 2.3
 * - Tilde (patch): "~1.2.3" - allows 1.2.x where x >= 3
 * - Range operators: ">=1.2.3", ">1.2.3", "<=1.2.3", "<1.2.3"
 *
 * @param required - The required version specification
 * @param actual - The actual version to check
 * @returns true if actual satisfies required
 */
export function isVersionCompatible(required: string, actual: string): boolean {
  const actualVer = parseVersion(actual, { loose: true });

  // Handle caret (^) - compatible with version
  if (required.startsWith('^')) {
    const reqVer = parseVersion(required.slice(1), { loose: true });
    // Major must match, actual must be >= required
    if (actualVer.major !== reqVer.major) return false;
    return compareVersions(actual, required.slice(1)) >= 0;
  }

  // Handle tilde (~) - patch-level changes only
  if (required.startsWith('~')) {
    const reqVer = parseVersion(required.slice(1), { loose: true });
    // Major and minor must match, actual must be >= required
    if (actualVer.major !== reqVer.major) return false;
    if (actualVer.minor !== reqVer.minor) return false;
    return compareVersions(actual, required.slice(1)) >= 0;
  }

  // Handle comparison operators
  if (required.startsWith('>=')) {
    return compareVersions(actual, required.slice(2)) >= 0;
  }
  if (required.startsWith('>')) {
    return compareVersions(actual, required.slice(1)) > 0;
  }
  if (required.startsWith('<=')) {
    return compareVersions(actual, required.slice(2)) <= 0;
  }
  if (required.startsWith('<')) {
    return compareVersions(actual, required.slice(1)) < 0;
  }

  // Exact match
  return compareVersions(actual, required) === 0;
}

// Zod schema for version strings
export const SemVerStringSchema = z.string().refine(
  (val) => {
    try {
      parseVersion(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid semver format' }
);

// Zod schema for version ranges (includes operators)
export const VersionRangeSchema = z.string().refine(
  (val) => {
    // Extract the version part after any operator
    const versionPart = val.replace(/^[\^~><]+=?/, '');
    try {
      parseVersion(versionPart, { loose: true });
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid version range format' }
);
