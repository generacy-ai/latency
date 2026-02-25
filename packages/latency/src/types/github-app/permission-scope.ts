import { z } from 'zod';
import { ISOTimestampSchema } from '../../common/timestamps.js';

/**
 * GitHub App permission scope categories.
 * These align with GitHub App permission settings.
 */
export const PermissionCategorySchema = z.enum([
  'repo',
  'issues',
  'pull_requests',
  'actions',
  'contents',
  'metadata',
  'administration',
  'checks',
  'deployments',
  'discussions',
  'environments',
  'members',
  'organization_hooks',
  'organization_projects',
  'pages',
  'projects',
  'security_events',
  'secrets',
  'workflows',
]);
export type PermissionCategory = z.infer<typeof PermissionCategorySchema>;

/**
 * Permission access level.
 */
export const PermissionLevelSchema = z.enum(['read', 'write', 'admin', 'none']);
export type PermissionLevel = z.infer<typeof PermissionLevelSchema>;

/**
 * Versioned PermissionScope schema namespace.
 *
 * Represents a GitHub App permission scope.
 * Scopes follow the pattern: category:level (e.g., "repo:read", "issues:write")
 *
 * @example
 * ```typescript
 * const scope = PermissionScope.Latest.parse({
 *   category: 'repo',
 *   level: 'read',
 * });
 * ```
 */
export namespace PermissionScope {
  /**
   * V1: Original permission scope schema.
   */
  export const V1 = z.object({
    /** Permission category (e.g., repo, issues, actions) */
    category: PermissionCategorySchema,

    /** Access level for this category */
    level: PermissionLevelSchema,
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for PermissionScope schema */
export const PermissionScopeSchema = PermissionScope.Latest;

/** Backward-compatible alias for PermissionScope type */
export type PermissionScope = PermissionScope.Latest;

// Validation functions
export const parsePermissionScope = (data: unknown): PermissionScope =>
  PermissionScopeSchema.parse(data);

export const safeParsePermissionScope = (data: unknown) =>
  PermissionScopeSchema.safeParse(data);

/**
 * Convert a permission scope to its string representation.
 * @example "repo:read", "issues:write"
 */
export function formatPermissionScope(scope: PermissionScope): string {
  return `${scope.category}:${scope.level}`;
}

/**
 * Parse a string representation into a permission scope.
 * @example parsePermissionScopeString("repo:read") -> { category: "repo", level: "read" }
 */
export function parsePermissionScopeString(scopeString: string): PermissionScope {
  const [category, level] = scopeString.split(':');
  return PermissionScopeSchema.parse({ category, level });
}

/**
 * Versioned PermissionScopeDefinition schema namespace.
 *
 * Extended definition of a permission scope with metadata.
 *
 * @example
 * ```typescript
 * const scopeDef = PermissionScopeDefinition.Latest.parse({
 *   scope: { category: 'repo', level: 'read' },
 *   description: 'Read access to repository contents',
 *   required: true,
 *   createdAt: '2024-01-15T10:30:00Z',
 *   updatedAt: '2024-01-15T10:30:00Z',
 * });
 * ```
 */
export namespace PermissionScopeDefinition {
  /**
   * V1: Original permission scope definition schema.
   */
  export const V1 = z.object({
    /** The permission scope */
    scope: PermissionScopeSchema,

    /** Human-readable description of what this scope grants */
    description: z.string().min(1, 'Description is required'),

    /** Whether this scope is required for the app to function */
    required: z.boolean(),

    /** When this scope definition was created */
    createdAt: ISOTimestampSchema,

    /** When this scope definition was last updated */
    updatedAt: ISOTimestampSchema,
  });

  /** Type inference for V1 schema */
  export type V1 = z.infer<typeof V1>;

  /** Latest stable schema */
  export const Latest = V1;

  /** Type inference for latest schema */
  export type Latest = V1;

  /** Version registry */
  export const VERSIONS = {
    v1: V1,
  } as const;

  /** Get schema for a specific version */
  export function getVersion(version: keyof typeof VERSIONS) {
    return VERSIONS[version];
  }
}

/** Backward-compatible alias for PermissionScopeDefinition schema */
export const PermissionScopeDefinitionSchema = PermissionScopeDefinition.Latest;

/** Backward-compatible alias for PermissionScopeDefinition type */
export type PermissionScopeDefinition = PermissionScopeDefinition.Latest;

// Validation functions
export const parsePermissionScopeDefinition = (data: unknown): PermissionScopeDefinition =>
  PermissionScopeDefinitionSchema.parse(data);

export const safeParsePermissionScopeDefinition = (data: unknown) =>
  PermissionScopeDefinitionSchema.safeParse(data);
