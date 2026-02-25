import { z } from 'zod';
import { CorrelationIdSchema, type CorrelationId } from './ids.js';
import { ISOTimestampSchema, type ISOTimestamp } from './timestamps.js';

// Message metadata for tracking and routing
export const MessageMetaSchema = z.object({
  correlationId: CorrelationIdSchema.optional(),
  replyTo: z.string().optional(),
  ttl: z.number().int().min(0).optional(), // Milliseconds
  timestamp: ISOTimestampSchema.optional(),
});

export type MessageMeta = {
  correlationId?: CorrelationId;
  replyTo?: string;
  ttl?: number;
  timestamp?: ISOTimestamp;
};

// Generic message envelope factory
export const MessageEnvelopeSchema = <T extends z.ZodTypeAny>(payloadSchema: T) =>
  z.object({
    channel: z.string().min(1),
    type: z.string().min(1),
    payload: payloadSchema,
    meta: MessageMetaSchema.optional(),
  });

// Base type for envelope (with unknown payload)
export const BaseMessageEnvelopeSchema = z.object({
  channel: z.string().min(1),
  type: z.string().min(1),
  payload: z.unknown(),
  meta: MessageMetaSchema.optional(),
});

export type MessageEnvelope<T = unknown> = {
  channel: string;
  type: string;
  payload: T;
  meta?: MessageMeta;
};
