import { describe, it, expect } from 'vitest';
import {
  LearningEventSourceSchema,
  LearningEventResultSchema,
  LearningEventSchema,
  parseLearningEvent,
  safeParseLearningEvent,
} from '../learning-event.js';

describe('LearningEventSourceSchema', () => {
  describe('valid shapes', () => {
    it('accepts source with decisionId only', () => {
      const result = LearningEventSourceSchema.safeParse({
        decisionId: 'tld_abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('accepts source with coachingId only', () => {
      const result = LearningEventSourceSchema.safeParse({
        coachingId: 'coaching_abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('accepts source with patternId only', () => {
      const result = LearningEventSourceSchema.safeParse({
        patternId: 'pattern_abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('accepts source with multiple IDs', () => {
      const result = LearningEventSourceSchema.safeParse({
        decisionId: 'tld_abc12345',
        coachingId: 'coaching_xyz12345',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningEventSourceSchema.safeParse({
        decisionId: 'tld_abc12345',
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty decisionId', () => {
      const result = LearningEventSourceSchema.safeParse({
        decisionId: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('LearningEventResultSchema', () => {
  describe('valid shapes', () => {
    it('accepts empty knowledge updates', () => {
      const result = LearningEventResultSchema.safeParse({
        knowledgeUpdates: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts result with knowledge updates', () => {
      const result = LearningEventResultSchema.safeParse({
        knowledgeUpdates: [
          {
            id: 'update_abc12345',
            coachingId: 'coaching_xyz12345',
            timestamp: new Date(),
            type: 'new_principle',
            changes: [
              {
                targetType: 'principle',
                operation: 'create',
                after: { statement: 'Test' },
                reasoning: 'Test',
              },
            ],
            status: 'pending',
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('LearningEventSchema', () => {
  const validEvent = {
    id: 'event_abc12345',
    userId: 'user123',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    type: 'coaching_provided' as const,
    source: {
      decisionId: 'tld_abc12345',
      coachingId: 'coaching_xyz12345',
    },
    result: {
      knowledgeUpdates: [],
    },
  };

  describe('valid shapes', () => {
    it('accepts minimal valid event', () => {
      const result = LearningEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('accepts decision_made event type', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        type: 'decision_made',
        source: { decisionId: 'tld_abc12345' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts pattern_detected event type', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        type: 'pattern_detected',
        source: { patternId: 'pattern_abc12345' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts ISO string timestamp', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        timestamp: '2024-01-15T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        id: 'evt_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty userId', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        userId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid event type', () => {
      const result = LearningEventSchema.safeParse({
        ...validEvent,
        type: 'session_started',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing source', () => {
      const { source: _, ...withoutSource } = validEvent;
      const result = LearningEventSchema.safeParse(withoutSource);
      expect(result.success).toBe(false);
    });

    it('rejects missing result', () => {
      const { result: _, ...withoutResult } = validEvent;
      const result = LearningEventSchema.safeParse(withoutResult);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseLearningEvent returns valid data', () => {
      const result = parseLearningEvent(validEvent);
      expect(result.id).toBe(validEvent.id);
      expect(result.type).toBe('coaching_provided');
    });

    it('parseLearningEvent throws on invalid data', () => {
      expect(() => parseLearningEvent({ ...validEvent, id: 'invalid' })).toThrow();
    });

    it('safeParseLearningEvent returns success for valid data', () => {
      const result = safeParseLearningEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it('safeParseLearningEvent returns error for invalid data', () => {
      const result = safeParseLearningEvent({ ...validEvent, type: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
