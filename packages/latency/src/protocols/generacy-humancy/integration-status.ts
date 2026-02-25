import { z } from 'zod';
import { ISOTimestampSchema } from '../common/timestamps.js';

export const IntegrationStatusType = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  DEGRADED: 'degraded',
} as const;

export const IntegrationStatusTypeSchema = z.enum(['connected', 'disconnected', 'error', 'degraded']);
export type IntegrationStatusType = z.infer<typeof IntegrationStatusTypeSchema>;

export const IntegrationStatusSchema = z.object({
  service: z.string().min(1, 'Service name is required'),
  status: IntegrationStatusTypeSchema,
  lastSync: ISOTimestampSchema.optional(),
  errorMessage: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}).strip();

export type IntegrationStatus = z.infer<typeof IntegrationStatusSchema>;

export const parseIntegrationStatus = (data: unknown): IntegrationStatus =>
  IntegrationStatusSchema.parse(data);

export const safeParseIntegrationStatus = (data: unknown) =>
  IntegrationStatusSchema.safeParse(data);
