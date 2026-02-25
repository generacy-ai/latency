import { z } from 'zod';
import { WorkItemIdSchema, AgentIdSchema } from '../common/ids.js';
import { ISOTimestampSchema } from '../common/timestamps.js';

export const WorkItemType = {
  GITHUB_ISSUE: 'github-issue',
  TASK: 'task',
  REVIEW: 'review',
} as const;

export const WorkItemTypeSchema = z.enum(['github-issue', 'task', 'review']);
export type WorkItemTypeValue = z.infer<typeof WorkItemTypeSchema>;

export const WorkItemStatus = {
  PENDING: 'pending',
  CLAIMED: 'claimed',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const WorkItemStatusSchema = z.enum([
  'pending',
  'claimed',
  'in-progress',
  'completed',
  'failed',
]);
export type WorkItemStatusValue = z.infer<typeof WorkItemStatusSchema>;

export const WorkItemSchema = z
  .object({
    id: WorkItemIdSchema,
    type: WorkItemTypeSchema,
    priority: z.number().int().min(0),
    status: WorkItemStatusSchema,
    payload: z.record(z.string(), z.unknown()),
    assignedAgent: AgentIdSchema.optional(),
    createdAt: ISOTimestampSchema,
    updatedAt: ISOTimestampSchema,
  })
  .strip();

export type WorkItem = z.infer<typeof WorkItemSchema>;

export const parseWorkItem = (data: unknown): WorkItem =>
  WorkItemSchema.parse(data);

export const safeParseWorkItem = (data: unknown) =>
  WorkItemSchema.safeParse(data);
