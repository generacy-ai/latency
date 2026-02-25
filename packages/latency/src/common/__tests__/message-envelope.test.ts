import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  MessageMetaSchema,
  MessageEnvelopeSchema,
  BaseMessageEnvelopeSchema,
} from '../message-envelope.js';

describe('MessageMetaSchema', () => {
  it('accepts valid meta with all fields', () => {
    const result = MessageMetaSchema.safeParse({
      correlationId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      replyTo: 'response-channel',
      ttl: 30000,
      timestamp: '2024-01-15T10:30:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty meta object', () => {
    const result = MessageMetaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid correlationId', () => {
    const result = MessageMetaSchema.safeParse({
      correlationId: 'invalid-ulid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp', () => {
    const result = MessageMetaSchema.safeParse({
      timestamp: 'not-a-timestamp',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative ttl', () => {
    const result = MessageMetaSchema.safeParse({
      ttl: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('MessageEnvelopeSchema', () => {
  const StringPayloadEnvelope = MessageEnvelopeSchema(z.string());

  it('accepts valid envelope with string payload', () => {
    const result = StringPayloadEnvelope.safeParse({
      channel: 'test-channel',
      type: 'test-message',
      payload: 'hello world',
    });
    expect(result.success).toBe(true);
  });

  it('accepts envelope with meta', () => {
    const result = StringPayloadEnvelope.safeParse({
      channel: 'test-channel',
      type: 'test-message',
      payload: 'hello',
      meta: {
        correlationId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty channel', () => {
    const result = StringPayloadEnvelope.safeParse({
      channel: '',
      type: 'test',
      payload: 'hello',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty type', () => {
    const result = StringPayloadEnvelope.safeParse({
      channel: 'test-channel',
      type: '',
      payload: 'hello',
    });
    expect(result.success).toBe(false);
  });

  it('validates payload type', () => {
    const result = StringPayloadEnvelope.safeParse({
      channel: 'test-channel',
      type: 'test',
      payload: 123, // should be string
    });
    expect(result.success).toBe(false);
  });
});

describe('BaseMessageEnvelopeSchema', () => {
  it('accepts any payload type', () => {
    const result = BaseMessageEnvelopeSchema.safeParse({
      channel: 'test-channel',
      type: 'test-message',
      payload: { any: 'data', nested: { value: 123 } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts null payload', () => {
    const result = BaseMessageEnvelopeSchema.safeParse({
      channel: 'test-channel',
      type: 'test-message',
      payload: null,
    });
    expect(result.success).toBe(true);
  });
});
