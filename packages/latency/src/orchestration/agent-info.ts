import { z } from 'zod';
import { AgentIdSchema, WorkItemIdSchema } from '../common/ids.js';
import { ISOTimestampSchema } from '../common/timestamps.js';

export const AgentStatus = {
  AVAILABLE: 'available',
  BUSY: 'busy',
  OFFLINE: 'offline',
} as const;

export const AgentStatusSchema = z.enum(['available', 'busy', 'offline']);
export type AgentStatusValue = z.infer<typeof AgentStatusSchema>;

export const AgentInfoSchema = z
  .object({
    id: AgentIdSchema,
    status: AgentStatusSchema,
    capabilities: z.array(z.string()),
    currentWork: WorkItemIdSchema.optional(),
    lastHeartbeat: ISOTimestampSchema,
    metadata: z.record(z.string(), z.unknown()),
  })
  .strip();

export type AgentInfo = z.infer<typeof AgentInfoSchema>;

export const parseAgentInfo = (data: unknown): AgentInfo =>
  AgentInfoSchema.parse(data);

export const safeParseAgentInfo = (data: unknown) =>
  AgentInfoSchema.safeParse(data);
