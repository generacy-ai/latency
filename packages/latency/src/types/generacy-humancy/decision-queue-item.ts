import { z } from 'zod';
import { ISOTimestampSchema } from '../../common/timestamps.js';
import { ExtendedDecisionOptionSchema } from './decision-option.js';
import { UrgencyLevelSchema, DecisionTypeSchema } from '../agency-humancy/decision-request.js';

/**
 * Schema for a decision queue item.
 * Represents a pending human decision in the queue.
 */
export const DecisionQueueItemSchema = z.object({
  id: z.string().min(1, 'Queue item ID is required'),
  urgency: UrgencyLevelSchema,
  type: DecisionTypeSchema,
  content: z.string().min(1, 'Content is required'),
  context: z.string().optional(),
  options: z.array(ExtendedDecisionOptionSchema).optional(),
  workflowId: z.string().optional(),
  issueNumber: z.number().int().positive().optional(),
  agentId: z.string().optional(),
  createdAt: ISOTimestampSchema,
  expiresAt: ISOTimestampSchema.optional(),
}).strip();

export type DecisionQueueItem = z.infer<typeof DecisionQueueItemSchema>;

// Validation functions
export const parseDecisionQueueItem = (data: unknown): DecisionQueueItem =>
  DecisionQueueItemSchema.parse(data);

export const safeParseDecisionQueueItem = (data: unknown) =>
  DecisionQueueItemSchema.safeParse(data);
