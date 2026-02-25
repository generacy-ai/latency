import { z } from 'zod';

export const OrchestratorStatusSchema = z
  .object({
    queueDepth: z.number().int().min(0),
    activeAgents: z.number().int().min(0),
    workInProgress: z.number().int().min(0),
    completedToday: z.number().int().min(0),
  })
  .strip();

export type OrchestratorStatus = z.infer<typeof OrchestratorStatusSchema>;

export const parseOrchestratorStatus = (data: unknown): OrchestratorStatus =>
  OrchestratorStatusSchema.parse(data);

export const safeParseOrchestratorStatus = (data: unknown) =>
  OrchestratorStatusSchema.safeParse(data);
