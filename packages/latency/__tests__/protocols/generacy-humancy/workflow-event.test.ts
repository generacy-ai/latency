import { describe, it, expect } from 'vitest';
import {
  WorkflowEventSchema,
  WorkflowEventType,
  parseWorkflowEvent,
  safeParseWorkflowEvent,
} from '../../../src/protocols/generacy-humancy/workflow-event.js';

describe('WorkflowEventSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';

  const validFullEvent = {
    type: 'started',
    workflowId: 'wf-123',
    agentId: 'agent-456',
    issueNumber: 42,
    status: 'running',
    progress: 50,
    message: 'Processing step 2 of 4',
    timestamp: validTimestamp,
  };

  const validMinimalEvent = {
    type: 'started',
    workflowId: 'wf-123',
    status: 'running',
    timestamp: validTimestamp,
  };

  describe('Valid data parsing', () => {
    it('accepts full object with all fields', () => {
      const result = WorkflowEventSchema.safeParse(validFullEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validFullEvent);
      }
    });

    it('accepts minimal object with only required fields', () => {
      const result = WorkflowEventSchema.safeParse(validMinimalEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validMinimalEvent);
      }
    });

    it('accepts all valid event types', () => {
      const eventTypes = ['started', 'progress', 'completed', 'failed', 'paused', 'cancelled'];
      for (const eventType of eventTypes) {
        const event = { ...validMinimalEvent, type: eventType };
        const result = WorkflowEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Invalid data rejection - missing required fields', () => {
    it('rejects missing type', () => {
      const { type, ...eventWithoutType } = validMinimalEvent;
      const result = WorkflowEventSchema.safeParse(eventWithoutType);
      expect(result.success).toBe(false);
    });

    it('rejects missing workflowId', () => {
      const { workflowId, ...eventWithoutWorkflowId } = validMinimalEvent;
      const result = WorkflowEventSchema.safeParse(eventWithoutWorkflowId);
      expect(result.success).toBe(false);
    });

    it('rejects missing status', () => {
      const { status, ...eventWithoutStatus } = validMinimalEvent;
      const result = WorkflowEventSchema.safeParse(eventWithoutStatus);
      expect(result.success).toBe(false);
    });

    it('rejects missing timestamp', () => {
      const { timestamp, ...eventWithoutTimestamp } = validMinimalEvent;
      const result = WorkflowEventSchema.safeParse(eventWithoutTimestamp);
      expect(result.success).toBe(false);
    });

    it('rejects empty workflowId', () => {
      const event = { ...validMinimalEvent, workflowId: '' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects empty status', () => {
      const event = { ...validMinimalEvent, status: '' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('Invalid data rejection - wrong enum values', () => {
    it('rejects invalid event type', () => {
      const event = { ...validMinimalEvent, type: 'invalid-type' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects event type with wrong case', () => {
      const event = { ...validMinimalEvent, type: 'STARTED' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects numeric event type', () => {
      const event = { ...validMinimalEvent, type: 1 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('Strip behavior', () => {
    it('removes extra unknown properties', () => {
      const eventWithExtra = {
        ...validMinimalEvent,
        unknownField: 'should be removed',
        anotherExtra: 123,
      };
      const result = WorkflowEventSchema.safeParse(eventWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherExtra');
        expect(result.data).toEqual(validMinimalEvent);
      }
    });
  });

  describe('Optional field handling', () => {
    it('accepts undefined optional fields', () => {
      const event = {
        ...validMinimalEvent,
        agentId: undefined,
        issueNumber: undefined,
        progress: undefined,
        message: undefined,
      };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts omitted optional fields', () => {
      const result = WorkflowEventSchema.safeParse(validMinimalEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.agentId).toBeUndefined();
        expect(result.data.issueNumber).toBeUndefined();
        expect(result.data.progress).toBeUndefined();
        expect(result.data.message).toBeUndefined();
      }
    });

    it('accepts empty string for optional message', () => {
      const event = { ...validMinimalEvent, message: '' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts empty string for optional agentId', () => {
      const event = { ...validMinimalEvent, agentId: '' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('Progress field validation (0-100 range)', () => {
    it('accepts progress at minimum (0)', () => {
      const event = { ...validMinimalEvent, progress: 0 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progress).toBe(0);
      }
    });

    it('accepts progress at maximum (100)', () => {
      const event = { ...validMinimalEvent, progress: 100 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progress).toBe(100);
      }
    });

    it('accepts progress in middle range (50)', () => {
      const event = { ...validMinimalEvent, progress: 50 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progress).toBe(50);
      }
    });

    it('accepts decimal progress values', () => {
      const event = { ...validMinimalEvent, progress: 33.33 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.progress).toBe(33.33);
      }
    });

    it('rejects progress below minimum (-1)', () => {
      const event = { ...validMinimalEvent, progress: -1 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects progress above maximum (101)', () => {
      const event = { ...validMinimalEvent, progress: 101 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric progress', () => {
      const event = { ...validMinimalEvent, progress: '50' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('issueNumber field validation', () => {
    it('accepts positive integer', () => {
      const event = { ...validMinimalEvent, issueNumber: 1 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('rejects zero', () => {
      const event = { ...validMinimalEvent, issueNumber: 0 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects negative numbers', () => {
      const event = { ...validMinimalEvent, issueNumber: -1 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer numbers', () => {
      const event = { ...validMinimalEvent, issueNumber: 1.5 };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('timestamp validation', () => {
    it('accepts valid ISO timestamp', () => {
      const result = WorkflowEventSchema.safeParse(validMinimalEvent);
      expect(result.success).toBe(true);
    });

    it('rejects invalid timestamp format', () => {
      const event = { ...validMinimalEvent, timestamp: '2024-01-15' };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects non-string timestamp', () => {
      const event = { ...validMinimalEvent, timestamp: Date.now() };
      const result = WorkflowEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });
});

describe('WorkflowEventType constant', () => {
  it('has correct values', () => {
    expect(WorkflowEventType.STARTED).toBe('started');
    expect(WorkflowEventType.PROGRESS).toBe('progress');
    expect(WorkflowEventType.COMPLETED).toBe('completed');
    expect(WorkflowEventType.FAILED).toBe('failed');
    expect(WorkflowEventType.PAUSED).toBe('paused');
    expect(WorkflowEventType.CANCELLED).toBe('cancelled');
  });
});

describe('parseWorkflowEvent', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';
  const validEvent = {
    type: 'started',
    workflowId: 'wf-123',
    status: 'running',
    timestamp: validTimestamp,
  };

  it('returns parsed event for valid data', () => {
    const result = parseWorkflowEvent(validEvent);
    expect(result).toEqual(validEvent);
  });

  it('throws for invalid data', () => {
    expect(() => parseWorkflowEvent({ invalid: 'data' })).toThrow();
  });
});

describe('safeParseWorkflowEvent', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';
  const validEvent = {
    type: 'started',
    workflowId: 'wf-123',
    status: 'running',
    timestamp: validTimestamp,
  };

  it('returns success result for valid data', () => {
    const result = safeParseWorkflowEvent(validEvent);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validEvent);
    }
  });

  it('returns failure result for invalid data', () => {
    const result = safeParseWorkflowEvent({ invalid: 'data' });
    expect(result.success).toBe(false);
  });
});
