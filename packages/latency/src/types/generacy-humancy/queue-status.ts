import { z } from 'zod';
import { ISOTimestampSchema } from '../../common/timestamps.js';

export const QueueStatusSchema = z.object({
  blockingNow: z.number().int().nonnegative(),
  blockingSoon: z.number().int().nonnegative(),
  whenAvailable: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  oldestPending: ISOTimestampSchema.optional(),
  averageWaitTime: z.number().nonnegative().optional(),
}).strip();

export type QueueStatus = z.infer<typeof QueueStatusSchema>;

export const parseQueueStatus = (data: unknown): QueueStatus =>
  QueueStatusSchema.parse(data);

export const safeParseQueueStatus = (data: unknown) =>
  QueueStatusSchema.safeParse(data);
