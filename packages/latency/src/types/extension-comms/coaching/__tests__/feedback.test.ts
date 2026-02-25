import { describe, it, expect } from 'vitest';
import {
  CoachingFeedbackIdSchema,
  CoachingFeedbackScopeSchema,
  CoachingFeedbackTimestampsSchema,
  FeedbackProviderSchema,
  CoachingFeedbackSchema,
  CoachingFeedback,
  parseCoachingFeedback,
  safeParseCoachingFeedback,
  generateCoachingFeedbackId,
  createCoachingFeedback,
} from '../feedback.js';
import type { ISOTimestamp } from '../../../../common/timestamps.js';

describe('CoachingFeedbackIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = CoachingFeedbackIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID format', () => {
    const result = CoachingFeedbackIdSchema.safeParse('invalid-id');
    expect(result.success).toBe(false);
  });

  it('rejects lowercase ULID', () => {
    const result = CoachingFeedbackIdSchema.safeParse('01arz3ndektsv4rrffq69g5fav');
    expect(result.success).toBe(false);
  });

  it('rejects too short ULID', () => {
    const result = CoachingFeedbackIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5');
    expect(result.success).toBe(false);
  });
});

describe('generateCoachingFeedbackId', () => {
  it('generates a valid ULID', () => {
    const id = generateCoachingFeedbackId();
    const result = CoachingFeedbackIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateCoachingFeedbackId());
    }
    expect(ids.size).toBe(100);
  });
});

describe('FeedbackProviderSchema', () => {
  it('accepts minimal valid provider', () => {
    const result = FeedbackProviderSchema.safeParse({
      userId: 'user_123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('human'); // default
    }
  });

  it('accepts full provider with all fields', () => {
    const result = FeedbackProviderSchema.safeParse({
      userId: 'user_123',
      displayName: 'John Doe',
      type: 'human',
    });
    expect(result.success).toBe(true);
  });

  it('accepts system type provider', () => {
    const result = FeedbackProviderSchema.safeParse({
      userId: 'system_auto',
      type: 'system',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty userId', () => {
    const result = FeedbackProviderSchema.safeParse({
      userId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = FeedbackProviderSchema.safeParse({
      userId: 'user_123',
      type: 'robot',
    });
    expect(result.success).toBe(false);
  });
});

describe('CoachingFeedbackScopeSchema', () => {
  describe('valid shapes', () => {
    it('accepts scope without domains for non-domain appliesTo', () => {
      expect(
        CoachingFeedbackScopeSchema.safeParse({ appliesTo: 'this_decision' }).success
      ).toBe(true);
      expect(CoachingFeedbackScopeSchema.safeParse({ appliesTo: 'general' }).success).toBe(
        true
      );
    });

    it('accepts this_project scope with projectId', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'this_project',
        projectId: 'proj_123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts this_domain scope with domains array', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'this_domain',
        domains: ['infrastructure', 'cloud'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects this_domain without domains array', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'this_domain',
      });
      expect(result.success).toBe(false);
    });

    it('rejects this_domain with empty domains array', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'this_domain',
        domains: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects this_project without projectId', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'this_project',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid appliesTo value', () => {
      const result = CoachingFeedbackScopeSchema.safeParse({
        appliesTo: 'everywhere',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('CoachingFeedbackTimestampsSchema', () => {
  it('accepts minimal timestamps with just createdAt', () => {
    const result = CoachingFeedbackTimestampsSchema.safeParse({
      createdAt: '2024-01-15T10:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts full timestamps', () => {
    const result = CoachingFeedbackTimestampsSchema.safeParse({
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      decisionAt: '2024-01-15T09:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid timestamp format', () => {
    const result = CoachingFeedbackTimestampsSchema.safeParse({
      createdAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing createdAt', () => {
    const result = CoachingFeedbackTimestampsSchema.safeParse({
      updatedAt: '2024-01-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('CoachingFeedbackSchema', () => {
  const validFeedback = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    decisionId: 'dec_01ARZ3NDEKTSV4RRFFQ69G5XYZ',
    overrideReason: 'missing_context' as const,
    explanation: 'The system did not account for the new security policy',
    scope: { appliesTo: 'general' as const },
    timestamps: { createdAt: '2024-01-15T10:30:00Z' },
    providedBy: { userId: 'user_123', type: 'human' as const },
  };

  describe('valid shapes', () => {
    it('accepts minimal valid feedback', () => {
      const result = CoachingFeedbackSchema.safeParse(validFeedback);
      expect(result.success).toBe(true);
    });

    it('accepts feedback with all override reasons', () => {
      const reasons = [
        'reasoning_incorrect',
        'missing_context',
        'priorities_changed',
        'exception_case',
        'other',
      ] as const;

      for (const reason of reasons) {
        const result = CoachingFeedbackSchema.safeParse({
          ...validFeedback,
          overrideReason: reason,
        });
        expect(result.success).toBe(true);
      }
    });

    it('accepts feedback without explanation', () => {
      const { explanation: _, ...withoutExplanation } = validFeedback;
      const result = CoachingFeedbackSchema.safeParse(withoutExplanation);
      expect(result.success).toBe(true);
    });

    it('accepts feedback with domain scope', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        scope: {
          appliesTo: 'this_domain',
          domains: ['security', 'compliance'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts feedback with project scope', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        scope: {
          appliesTo: 'this_project',
          projectId: 'proj_abc123',
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts feedback with metadata', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        metadata: {
          source: 'vscode_extension',
          version: '1.2.3',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id format', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        id: 'invalid-id',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty decisionId', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        decisionId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid overrideReason', () => {
      const result = CoachingFeedbackSchema.safeParse({
        ...validFeedback,
        overrideReason: 'invalid_reason',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing scope', () => {
      const { scope: _, ...withoutScope } = validFeedback;
      const result = CoachingFeedbackSchema.safeParse(withoutScope);
      expect(result.success).toBe(false);
    });

    it('rejects missing timestamps', () => {
      const { timestamps: _, ...withoutTimestamps } = validFeedback;
      const result = CoachingFeedbackSchema.safeParse(withoutTimestamps);
      expect(result.success).toBe(false);
    });

    it('rejects missing providedBy', () => {
      const { providedBy: _, ...withoutProvider } = validFeedback;
      const result = CoachingFeedbackSchema.safeParse(withoutProvider);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseCoachingFeedback returns valid data', () => {
      const result = parseCoachingFeedback(validFeedback);
      expect(result.id).toBe(validFeedback.id);
      expect(result.overrideReason).toBe('missing_context');
    });

    it('parseCoachingFeedback throws on invalid data', () => {
      expect(() =>
        parseCoachingFeedback({ ...validFeedback, id: 'invalid' })
      ).toThrow();
    });

    it('safeParseCoachingFeedback returns success for valid data', () => {
      const result = safeParseCoachingFeedback(validFeedback);
      expect(result.success).toBe(true);
    });

    it('safeParseCoachingFeedback returns error for invalid data', () => {
      const result = safeParseCoachingFeedback({ ...validFeedback, id: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});

describe('createCoachingFeedback', () => {
  it('creates feedback with generated ID and timestamp', () => {
    const feedback = createCoachingFeedback({
      decisionId: 'dec_123',
      overrideReason: 'missing_context',
      explanation: 'Test explanation',
      scope: { appliesTo: 'general' },
      providedBy: { userId: 'user_456', type: 'human' },
    });

    // ID should be a valid ULID
    expect(CoachingFeedbackIdSchema.safeParse(feedback.id).success).toBe(true);

    // Timestamp should be set
    expect(feedback.timestamps.createdAt).toBeDefined();

    // Other fields should match input
    expect(feedback.decisionId).toBe('dec_123');
    expect(feedback.overrideReason).toBe('missing_context');
  });

  it('allows partial timestamp override', () => {
    const customDecisionAt = '2024-01-15T09:00:00Z' as ISOTimestamp;
    const feedback = createCoachingFeedback({
      decisionId: 'dec_123',
      overrideReason: 'other',
      scope: { appliesTo: 'general' },
      providedBy: { userId: 'user_456', type: 'human' },
      timestamps: { decisionAt: customDecisionAt },
    });

    expect(feedback.timestamps.decisionAt).toBe(customDecisionAt);
    expect(feedback.timestamps.createdAt).toBeDefined();
  });
});

describe('CoachingFeedback namespace', () => {
  it('exposes V1 schema', () => {
    expect(CoachingFeedback.V1).toBeDefined();
  });

  it('Latest points to V1', () => {
    expect(CoachingFeedback.Latest).toBe(CoachingFeedback.V1);
  });

  it('getVersion returns correct schema', () => {
    expect(CoachingFeedback.getVersion('v1')).toBe(CoachingFeedback.V1);
  });

  it('VERSIONS contains all versions', () => {
    expect(CoachingFeedback.VERSIONS.v1).toBe(CoachingFeedback.V1);
  });
});
