import { z } from 'zod';
import { ISOTimestampSchema } from '../../common/timestamps.js';

export const WorkflowEventType = {
  STARTED: 'started',
  PROGRESS: 'progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

export const WorkflowEventTypeSchema = z.enum(['started', 'progress', 'completed', 'failed', 'paused', 'cancelled']);
export type WorkflowEventType = z.infer<typeof WorkflowEventTypeSchema>;

export const WorkflowEventSchema = z.object({
  type: WorkflowEventTypeSchema,
  workflowId: z.string().min(1, 'Workflow ID is required'),
  agentId: z.string().optional(),
  issueNumber: z.number().int().positive().optional(),
  status: z.string().min(1, 'Status is required'),
  progress: z.number().min(0).max(100).optional(),
  message: z.string().optional(),
  timestamp: ISOTimestampSchema,
}).strip();

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

export const parseWorkflowEvent = (data: unknown): WorkflowEvent =>
  WorkflowEventSchema.parse(data);

export const safeParseWorkflowEvent = (data: unknown) =>
  WorkflowEventSchema.safeParse(data);
