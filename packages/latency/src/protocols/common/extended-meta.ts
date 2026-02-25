import { MessageMetaSchema, type MessageMeta } from './message-envelope.js';

/**
 * Extended metadata schema for Agency-Humancy schemas.
 *
 * Extends MessageMetaSchema with `.passthrough()` to allow plugin-specific
 * metadata fields while maintaining type safety for core fields.
 *
 * Core fields (from MessageMeta):
 * - correlationId: Request/response correlation
 * - replyTo: Reply channel for async responses
 * - ttl: Time-to-live in milliseconds
 * - timestamp: ISO 8601 timestamp
 *
 * @example
 * ```typescript
 * const meta: ExtendedMeta = {
 *   correlationId: 'req-123',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   // Plugin-specific fields are allowed via passthrough
 *   pluginVersion: '1.2.3',
 *   customField: { nested: 'value' },
 * };
 * ```
 */
export const ExtendedMetaSchema = MessageMetaSchema.passthrough();

/**
 * Extended metadata type allowing additional plugin-specific fields.
 *
 * Includes all MessageMeta fields plus any additional string-keyed properties.
 */
export type ExtendedMeta = MessageMeta & Record<string, unknown>;
