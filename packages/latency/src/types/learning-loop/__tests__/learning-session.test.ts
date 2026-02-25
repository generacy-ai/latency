import { describe, it, expect } from 'vitest';
import {
  LearningSessionSummarySchema,
  LearningSessionSchema,
  parseLearningSession,
  safeParseLearningSession,
} from '../learning-session.js';

describe('LearningSessionSummarySchema', () => {
  const validSummary = {
    decisionsReviewed: 10,
    overrides: 3,
    coachingProvided: 2,
    patternsDetected: 1,
    principlesUpdated: 1,
  };

  describe('valid shapes', () => {
    it('accepts valid summary', () => {
      const result = LearningSessionSummarySchema.safeParse(validSummary);
      expect(result.success).toBe(true);
    });

    it('accepts all zeros', () => {
      const result = LearningSessionSummarySchema.safeParse({
        decisionsReviewed: 0,
        overrides: 0,
        coachingProvided: 0,
        patternsDetected: 0,
        principlesUpdated: 0,
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningSessionSummarySchema.safeParse({
        ...validSummary,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects negative values', () => {
      expect(
        LearningSessionSummarySchema.safeParse({ ...validSummary, decisionsReviewed: -1 }).success
      ).toBe(false);
      expect(
        LearningSessionSummarySchema.safeParse({ ...validSummary, overrides: -1 }).success
      ).toBe(false);
    });

    it('rejects non-integer values', () => {
      expect(
        LearningSessionSummarySchema.safeParse({ ...validSummary, decisionsReviewed: 1.5 }).success
      ).toBe(false);
    });
  });
});

describe('LearningSessionSchema', () => {
  const validSession = {
    id: 'session_abc12345',
    userId: 'user123',
    startedAt: new Date('2024-01-15T10:00:00Z'),
    decisions: ['tld_abc12345', 'tld_def67890'],
    events: [],
  };

  const validEvent = {
    id: 'event_xyz12345',
    userId: 'user123',
    timestamp: new Date('2024-01-15T10:30:00Z'),
    type: 'decision_made' as const,
    source: { decisionId: 'tld_abc12345' },
    result: { knowledgeUpdates: [] },
  };

  describe('valid shapes', () => {
    it('accepts minimal valid session (active)', () => {
      const result = LearningSessionSchema.safeParse(validSession);
      expect(result.success).toBe(true);
    });

    it('accepts completed session with endedAt after startedAt', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        endedAt: new Date('2024-01-15T11:30:00Z'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts session with events', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        events: [validEvent],
      });
      expect(result.success).toBe(true);
    });

    it('accepts completed session with summary', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        endedAt: new Date('2024-01-15T11:30:00Z'),
        summary: {
          decisionsReviewed: 2,
          overrides: 1,
          coachingProvided: 1,
          patternsDetected: 0,
          principlesUpdated: 1,
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts empty decisions array', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        decisions: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts ISO string timestamps', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        startedAt: '2024-01-15T10:00:00Z',
        endedAt: '2024-01-15T11:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects endedAt before startedAt', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        endedAt: new Date('2024-01-15T09:00:00Z'), // before startedAt
      });
      expect(result.success).toBe(false);
    });

    it('rejects endedAt equal to startedAt', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        endedAt: new Date('2024-01-15T10:00:00Z'), // same as startedAt
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid id prefix', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        id: 'sess_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty userId', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        userId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid event in events array', () => {
      const result = LearningSessionSchema.safeParse({
        ...validSession,
        events: [{ ...validEvent, id: 'invalid' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseLearningSession returns valid data', () => {
      const result = parseLearningSession(validSession);
      expect(result.id).toBe(validSession.id);
      expect(result.decisions).toHaveLength(2);
    });

    it('parseLearningSession throws on invalid data', () => {
      expect(() =>
        parseLearningSession({
          ...validSession,
          endedAt: new Date('2024-01-15T09:00:00Z'),
        })
      ).toThrow();
    });

    it('safeParseLearningSession returns success for valid data', () => {
      const result = safeParseLearningSession(validSession);
      expect(result.success).toBe(true);
    });

    it('safeParseLearningSession returns error for invalid data', () => {
      const result = safeParseLearningSession({
        ...validSession,
        id: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('session workflow', () => {
    it('supports active session without endedAt', () => {
      const activeSession = {
        ...validSession,
        events: [validEvent],
      };
      const result = LearningSessionSchema.safeParse(activeSession);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endedAt).toBeUndefined();
        expect(result.data.summary).toBeUndefined();
      }
    });

    it('supports completed session with all fields', () => {
      const completedSession = {
        ...validSession,
        endedAt: new Date('2024-01-15T11:30:00Z'),
        events: [validEvent],
        summary: {
          decisionsReviewed: 2,
          overrides: 0,
          coachingProvided: 0,
          patternsDetected: 0,
          principlesUpdated: 0,
        },
      };
      const result = LearningSessionSchema.safeParse(completedSession);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.endedAt).toBeDefined();
        expect(result.data.summary).toBeDefined();
        expect(result.data.summary?.decisionsReviewed).toBe(2);
      }
    });
  });
});
