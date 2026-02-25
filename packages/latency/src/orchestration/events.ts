import { z } from 'zod';
import { AgentIdSchema } from '../common/ids.js';
import { ISOTimestampSchema } from '../common/timestamps.js';
import { WorkItemSchema } from './work-item.js';
import { AgentInfoSchema } from './agent-info.js';

export const OrchestratorEventType = {
  // Work events
  WORK_QUEUED: 'work:queued',
  WORK_CLAIMED: 'work:claimed',
  WORK_COMPLETED: 'work:completed',
  WORK_FAILED: 'work:failed',
  WORK_REASSIGNED: 'work:reassigned',
  WORK_PROGRESS: 'work:progress',
  // Agent events
  AGENT_REGISTERED: 'agent:registered',
  AGENT_HEARTBEAT: 'agent:heartbeat',
  AGENT_OFFLINE: 'agent:offline',
  AGENT_DEREGISTERED: 'agent:deregistered',
} as const;

// Work events
export const WorkQueuedEventSchema = z
  .object({
    type: z.literal('work:queued'),
    work: WorkItemSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const WorkClaimedEventSchema = z
  .object({
    type: z.literal('work:claimed'),
    work: WorkItemSchema,
    agent: AgentIdSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const WorkCompletedEventSchema = z
  .object({
    type: z.literal('work:completed'),
    work: WorkItemSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const WorkFailedEventSchema = z
  .object({
    type: z.literal('work:failed'),
    work: WorkItemSchema,
    error: z.string(),
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const WorkReassignedEventSchema = z
  .object({
    type: z.literal('work:reassigned'),
    work: WorkItemSchema,
    fromAgent: AgentIdSchema,
    toAgent: AgentIdSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const WorkProgressEventSchema = z
  .object({
    type: z.literal('work:progress'),
    work: WorkItemSchema,
    progress: z.number().min(0).max(100),
    message: z.string().optional(),
    timestamp: ISOTimestampSchema,
  })
  .strip();

// Agent events
export const AgentRegisteredEventSchema = z
  .object({
    type: z.literal('agent:registered'),
    agent: AgentInfoSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const AgentHeartbeatEventSchema = z
  .object({
    type: z.literal('agent:heartbeat'),
    agentId: AgentIdSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const AgentOfflineEventSchema = z
  .object({
    type: z.literal('agent:offline'),
    agentId: AgentIdSchema,
    timestamp: ISOTimestampSchema,
  })
  .strip();

export const AgentDeregisteredEventSchema = z
  .object({
    type: z.literal('agent:deregistered'),
    agentId: AgentIdSchema,
    reason: z.string().optional(),
    timestamp: ISOTimestampSchema,
  })
  .strip();

// Discriminated union of all events
export const OrchestratorEventSchema = z.discriminatedUnion('type', [
  WorkQueuedEventSchema,
  WorkClaimedEventSchema,
  WorkCompletedEventSchema,
  WorkFailedEventSchema,
  WorkReassignedEventSchema,
  WorkProgressEventSchema,
  AgentRegisteredEventSchema,
  AgentHeartbeatEventSchema,
  AgentOfflineEventSchema,
  AgentDeregisteredEventSchema,
]);

export type OrchestratorEvent = z.infer<typeof OrchestratorEventSchema>;

// Individual event types
export type WorkQueuedEvent = z.infer<typeof WorkQueuedEventSchema>;
export type WorkClaimedEvent = z.infer<typeof WorkClaimedEventSchema>;
export type WorkCompletedEvent = z.infer<typeof WorkCompletedEventSchema>;
export type WorkFailedEvent = z.infer<typeof WorkFailedEventSchema>;
export type WorkReassignedEvent = z.infer<typeof WorkReassignedEventSchema>;
export type WorkProgressEvent = z.infer<typeof WorkProgressEventSchema>;
export type AgentRegisteredEvent = z.infer<typeof AgentRegisteredEventSchema>;
export type AgentHeartbeatEvent = z.infer<typeof AgentHeartbeatEventSchema>;
export type AgentOfflineEvent = z.infer<typeof AgentOfflineEventSchema>;
export type AgentDeregisteredEvent = z.infer<typeof AgentDeregisteredEventSchema>;

export const parseOrchestratorEvent = (data: unknown): OrchestratorEvent =>
  OrchestratorEventSchema.parse(data);

export const safeParseOrchestratorEvent = (data: unknown) =>
  OrchestratorEventSchema.safeParse(data);
