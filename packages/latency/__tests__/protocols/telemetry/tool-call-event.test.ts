import { describe, it, expect } from 'vitest';
import {
  ToolCallEventSchema,
  EventIdSchema,
  generateEventId,
  type ToolCallEvent,
} from '../../../src/protocols/telemetry/tool-call-event.js';
import { ulid } from 'ulid';

describe('EventIdSchema', () => {
  it('accepts valid ULID', () => {
    const validUlid = ulid();
    const result = EventIdSchema.safeParse(validUlid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID format', () => {
    const result = EventIdSchema.safeParse('not-a-ulid');
    expect(result.success).toBe(false);
  });

  it('rejects lowercase ULID', () => {
    const result = EventIdSchema.safeParse(ulid().toLowerCase());
    expect(result.success).toBe(false);
  });
});

describe('generateEventId', () => {
  it('generates valid event ID', () => {
    const id = generateEventId();
    const result = EventIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateEventId();
    const id2 = generateEventId();
    expect(id1).not.toBe(id2);
  });
});

describe('ToolCallEventSchema', () => {
  const validEvent: ToolCallEvent = {
    id: ulid() as ToolCallEvent['id'],
    version: '1.0.0',
    timestamp: '2024-01-15T10:30:00.000Z',
    sessionId: ulid(),
    server: 'mcp-server-test',
    tool: 'test_tool',
    inputs: { foo: 'bar' },
    durationMs: 150,
    success: true,
  };

  it('accepts valid event with required fields', () => {
    const result = ToolCallEventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it('accepts event with all optional fields', () => {
    const fullEvent = {
      ...validEvent,
      outputs: { result: 'ok' },
      errorCategory: 'validation',
      errorType: 'InvalidInput',
      errorMessage: 'Input was invalid',
      workflowId: 'workflow-123',
      issueNumber: 42,
      phase: 'implement',
    };
    const result = ToolCallEventSchema.safeParse(fullEvent);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { id, ...eventWithoutId } = validEvent;
    const result = ToolCallEventSchema.safeParse(eventWithoutId);
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp format', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      timestamp: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('accepts ISO 8601 timestamp with timezone offset', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      timestamp: '2024-01-15T10:30:00.000+05:30',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative durationMs', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      durationMs: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer durationMs', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      durationMs: 150.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty server name', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      server: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty tool name', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      tool: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid sessionId format', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      sessionId: 'not-a-ulid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid errorCategory', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      errorCategory: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive issueNumber', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      issueNumber: 0,
    });
    expect(result.success).toBe(false);

    const result2 = ToolCallEventSchema.safeParse({
      ...validEvent,
      issueNumber: -1,
    });
    expect(result2.success).toBe(false);
  });

  it('accepts zero durationMs', () => {
    const result = ToolCallEventSchema.safeParse({
      ...validEvent,
      durationMs: 0,
    });
    expect(result.success).toBe(true);
  });
});
