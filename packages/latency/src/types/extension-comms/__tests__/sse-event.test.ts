import { describe, it, expect } from 'vitest';
import {
  SSEEventSchema,
  SSEEvent,
  SSEEventTypeSchema,
  createSSEEventSchema,
  parseSSEEvent,
  safeParseSSEEvent,
} from '../sse/event.js';
import { z } from 'zod';

describe('SSEEventTypeSchema', () => {
  describe('decision events', () => {
    it('accepts decision.created', () => {
      expect(SSEEventTypeSchema.safeParse('decision.created').success).toBe(true);
    });

    it('accepts decision.updated', () => {
      expect(SSEEventTypeSchema.safeParse('decision.updated').success).toBe(true);
    });

    it('accepts decision.resolved', () => {
      expect(SSEEventTypeSchema.safeParse('decision.resolved').success).toBe(true);
    });
  });

  describe('workflow events', () => {
    it('accepts workflow.started', () => {
      expect(SSEEventTypeSchema.safeParse('workflow.started').success).toBe(true);
    });

    it('accepts workflow.step_completed', () => {
      expect(SSEEventTypeSchema.safeParse('workflow.step_completed').success).toBe(true);
    });

    it('accepts workflow.completed', () => {
      expect(SSEEventTypeSchema.safeParse('workflow.completed').success).toBe(true);
    });

    it('accepts workflow.failed', () => {
      expect(SSEEventTypeSchema.safeParse('workflow.failed').success).toBe(true);
    });

    it('accepts workflow.paused', () => {
      expect(SSEEventTypeSchema.safeParse('workflow.paused').success).toBe(true);
    });
  });

  describe('coaching events', () => {
    it('accepts coaching.received', () => {
      expect(SSEEventTypeSchema.safeParse('coaching.received').success).toBe(true);
    });
  });

  describe('invalid types', () => {
    it('rejects unknown event types', () => {
      expect(SSEEventTypeSchema.safeParse('unknown.event').success).toBe(false);
    });

    it('rejects partial event types', () => {
      expect(SSEEventTypeSchema.safeParse('decision').success).toBe(false);
    });

    it('rejects empty string', () => {
      expect(SSEEventTypeSchema.safeParse('').success).toBe(false);
    });

    it('rejects case variations', () => {
      expect(SSEEventTypeSchema.safeParse('DECISION.CREATED').success).toBe(false);
      expect(SSEEventTypeSchema.safeParse('Decision.Created').success).toBe(false);
    });
  });
});

describe('SSEEventSchema', () => {
  const validEvent = {
    id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
    type: 'decision.created',
    data: { decisionId: 'dec_123', title: 'API Design Decision' },
    timestamp: '2024-01-15T10:30:00Z',
  };

  describe('valid events', () => {
    it('accepts valid SSE event', () => {
      const result = SSEEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('evt_01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.type).toBe('decision.created');
      }
    });

    it('accepts event with retry field', () => {
      const event = { ...validEvent, retry: 3000 };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retry).toBe(3000);
      }
    });

    it('accepts event with null data', () => {
      const event = { ...validEvent, data: null };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts event with complex data object', () => {
      const event = {
        ...validEvent,
        type: 'workflow.step_completed',
        data: {
          executionId: 'exec_123',
          stepId: 'step_456',
          result: { output: 'success', metrics: [1, 2, 3] },
        },
      };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts all valid event types', () => {
      const types = [
        'decision.created',
        'decision.updated',
        'decision.resolved',
        'workflow.started',
        'workflow.step_completed',
        'workflow.completed',
        'workflow.failed',
        'workflow.paused',
        'coaching.received',
      ];

      for (const type of types) {
        const event = { ...validEvent, type };
        const result = SSEEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      }
    });

    it('accepts event with timestamp with milliseconds', () => {
      const event = { ...validEvent, timestamp: '2024-01-15T10:30:00.123Z' };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts event with timezone offset', () => {
      const event = { ...validEvent, timestamp: '2024-01-15T10:30:00+05:30' };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid events', () => {
    it('rejects empty id', () => {
      const event = { ...validEvent, id: '' };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects missing id', () => {
      const { id, ...eventWithoutId } = validEvent;
      const result = SSEEventSchema.safeParse(eventWithoutId);
      expect(result.success).toBe(false);
    });

    it('rejects invalid event type', () => {
      const event = { ...validEvent, type: 'invalid.type' };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects missing type', () => {
      const { type, ...eventWithoutType } = validEvent;
      const result = SSEEventSchema.safeParse(eventWithoutType);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const event = { ...validEvent, timestamp: '2024-01-15' };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects missing timestamp', () => {
      const { timestamp, ...eventWithoutTimestamp } = validEvent;
      const result = SSEEventSchema.safeParse(eventWithoutTimestamp);
      expect(result.success).toBe(false);
    });

    it('rejects negative retry value', () => {
      const event = { ...validEvent, retry: -1 };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer retry value', () => {
      const event = { ...validEvent, retry: 1.5 };
      const result = SSEEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = SSEEvent.V1.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = SSEEvent.getVersion('v1');
      const result = schema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(SSEEvent.Latest).toBe(SSEEvent.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseSSEEvent returns valid event', () => {
      const event = parseSSEEvent(validEvent);
      expect(event.id).toBe(validEvent.id);
      expect(event.type).toBe(validEvent.type);
    });

    it('parseSSEEvent throws on invalid data', () => {
      expect(() => parseSSEEvent({ id: '' })).toThrow();
    });

    it('safeParseSSEEvent returns success result', () => {
      const result = safeParseSSEEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it('safeParseSSEEvent returns failure result', () => {
      const result = safeParseSSEEvent({ type: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});

describe('createSSEEventSchema', () => {
  it('creates typed SSE event schema', () => {
    const DecisionDataSchema = z.object({
      decisionId: z.string(),
      title: z.string(),
    });

    const TypedEventSchema = createSSEEventSchema(DecisionDataSchema);

    const result = TypedEventSchema.safeParse({
      id: 'evt_123',
      type: 'decision.created',
      data: { decisionId: 'dec_456', title: 'Test Decision' },
      timestamp: '2024-01-15T10:30:00Z',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid data with typed schema', () => {
    const DecisionDataSchema = z.object({
      decisionId: z.string(),
      title: z.string(),
    });

    const TypedEventSchema = createSSEEventSchema(DecisionDataSchema);

    const result = TypedEventSchema.safeParse({
      id: 'evt_123',
      type: 'decision.created',
      data: { decisionId: 123, title: 'Test' }, // decisionId should be string
      timestamp: '2024-01-15T10:30:00Z',
    });

    expect(result.success).toBe(false);
  });

  it('preserves data type inference', () => {
    const NumberDataSchema = z.object({
      value: z.number(),
    });

    const TypedEventSchema = createSSEEventSchema(NumberDataSchema);
    type TypedEvent = z.infer<typeof TypedEventSchema>;

    const event: TypedEvent = {
      id: 'evt_123',
      type: 'workflow.completed',
      data: { value: 42 },
      timestamp: '2024-01-15T10:30:00Z' as any,
    };

    expect(event.data.value).toBe(42);
  });
});
