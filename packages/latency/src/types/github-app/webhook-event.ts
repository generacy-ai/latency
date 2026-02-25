import { z } from 'zod';
import { ulid } from 'ulid';
import { ISOTimestampSchema } from '../../common/timestamps.js';

// ULID regex: 26 characters, Crockford Base32
const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

// Branded type for webhook event IDs
export type WebhookEventId = string & { readonly __brand: 'WebhookEventId' };

// Zod schema with ULID validation for WebhookEventId
export const WebhookEventIdSchema = z
  .string()
  .regex(ULID_REGEX, 'Invalid ULID format for WebhookEventId')
  .transform((val) => val as WebhookEventId);

// ID generation utility
export function generateWebhookEventId(): WebhookEventId {
  return ulid() as WebhookEventId;
}

/**
 * GitHub webhook event types.
 * Common events from GitHub App webhooks.
 */
export const WebhookEventTypeSchema = z.enum([
  // Repository events
  'push',
  'create',
  'delete',
  'fork',
  'release',
  'repository',
  'repository_dispatch',

  // Issue events
  'issues',
  'issue_comment',
  'label',
  'milestone',

  // Pull request events
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'pull_request_review_thread',

  // Actions events
  'workflow_run',
  'workflow_job',
  'workflow_dispatch',
  'check_run',
  'check_suite',

  // Branch/deployment events
  'branch_protection_rule',
  'deployment',
  'deployment_status',

  // Discussion events
  'discussion',
  'discussion_comment',

  // Organization events
  'organization',
  'membership',
  'team',
  'team_add',

  // App events
  'installation',
  'installation_repositories',
  'installation_target',

  // Other events
  'star',
  'watch',
  'ping',
  'status',
  'project',
  'project_card',
  'project_column',
  'public',
  'security_advisory',
  'code_scanning_alert',
  'dependabot_alert',
  'secret_scanning_alert',
]);
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

/**
 * Schema for the sender of a webhook event.
 * Represents the GitHub user/bot that triggered the event.
 */
export const WebhookSenderSchema = z.object({
  /** GitHub user ID */
  id: z.number().int().positive(),

  /** GitHub login/username */
  login: z.string().min(1),

  /** Type of account: User, Bot, Organization */
  type: z.enum(['User', 'Bot', 'Organization']),

  /** URL to the user's avatar */
  avatarUrl: z.string().url().optional(),

  /** URL to the user's GitHub profile */
  htmlUrl: z.string().url().optional(),
});
export type WebhookSender = z.infer<typeof WebhookSenderSchema>;

/**
 * Versioned WebhookEvent schema namespace.
 *
 * Represents a GitHub App webhook event.
 * Generic over the payload type for type-safe event handling.
 *
 * @example
 * ```typescript
 * const event = WebhookEvent.Latest.parse({
 *   id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
 *   type: 'push',
 *   action: null,
 *   payload: { ref: 'refs/heads/main', commits: [...] },
 *   sender: {
 *     id: 12345,
 *     login: 'octocat',
 *     type: 'User',
 *   },
 *   receivedAt: '2024-01-15T10:30:00Z',
 *   deliveryId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
 * });
 * ```
 */
export namespace WebhookEvent {
  /**
   * V1: Original webhook event schema.
   * Uses a generic payload structure.
   */
  export const V1 = z.object({
    /** Unique identifier for this webhook event (internal) */
    id: WebhookEventIdSchema,

    /** GitHub webhook event type */
    type: WebhookEventTypeSchema,

    /** Action within the event type (e.g., "opened", "closed" for issues) */
    action: z.string().nullable(),

    /** The event payload (structure varies by event type) */
    payload: z.record(z.unknown()),

    /** Information about who triggered the event */
    sender: WebhookSenderSchema,

    /** When we received this webhook event */
    receivedAt: ISOTimestampSchema,

    /** GitHub's delivery ID for this webhook (X-GitHub-Delivery header) */
    deliveryId: z.string().uuid('Delivery ID must be a valid UUID'),

    /** GitHub's hook ID (X-GitHub-Hook-ID header) */
    hookId: z.string().optional(),

    /** GitHub's hook installation target ID (X-GitHub-Hook-Installation-Target-ID header) */
    installationId: z.string().optional(),

    /** Whether we've processed this event */
    processed: z.boolean().default(false),

    /** Error message if processing failed */
    processingError: z.string().optional(),

    /** When processing completed (or failed) */
    processedAt: ISOTimestampSchema.optional(),
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

/** Backward-compatible alias for WebhookEvent schema */
export const WebhookEventSchema = WebhookEvent.Latest;

/** Backward-compatible alias for WebhookEvent type */
export type WebhookEvent = WebhookEvent.Latest;

// Validation functions
export const parseWebhookEvent = (data: unknown): WebhookEvent =>
  WebhookEventSchema.parse(data);

export const safeParseWebhookEvent = (data: unknown) =>
  WebhookEventSchema.safeParse(data);

/**
 * Type-safe webhook event with strongly-typed payload.
 * Use this when you know the specific event type.
 */
export type TypedWebhookEvent<T extends WebhookEventType, P = unknown> = Omit<WebhookEvent, 'type' | 'payload'> & {
  type: T;
  payload: P;
};
