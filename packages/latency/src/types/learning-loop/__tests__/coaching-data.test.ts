import { describe, it, expect } from 'vitest';
import {
  LearningScopeSchema,
  LearningCoachingDataSchema,
  parseLearningCoachingData,
  safeParseLearningCoachingData,
} from '../coaching-data.js';

describe('LearningScopeSchema', () => {
  describe('valid shapes', () => {
    it('accepts scope without domain for non-domain appliesTo', () => {
      expect(LearningScopeSchema.safeParse({ appliesTo: 'this_decision' }).success).toBe(true);
      expect(LearningScopeSchema.safeParse({ appliesTo: 'this_project' }).success).toBe(true);
      expect(LearningScopeSchema.safeParse({ appliesTo: 'general' }).success).toBe(true);
    });

    it('accepts scope with domain for this_domain', () => {
      const result = LearningScopeSchema.safeParse({
        appliesTo: 'this_domain',
        domain: ['infrastructure', 'cloud'],
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningScopeSchema.safeParse({
        appliesTo: 'general',
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects this_domain without domain array', () => {
      const result = LearningScopeSchema.safeParse({
        appliesTo: 'this_domain',
      });
      expect(result.success).toBe(false);
    });

    it('rejects this_domain with empty domain array', () => {
      const result = LearningScopeSchema.safeParse({
        appliesTo: 'this_domain',
        domain: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid appliesTo value', () => {
      const result = LearningScopeSchema.safeParse({
        appliesTo: 'everywhere',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('LearningCoachingDataSchema', () => {
  const validCoachingData = {
    id: 'coaching_abc12345',
    decisionId: 'tld_xyz12345',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    overrideReason: 'missing_context' as const,
    scope: {
      appliesTo: 'general' as const,
    },
  };

  describe('valid shapes', () => {
    it('accepts minimal valid coaching data', () => {
      const result = LearningCoachingDataSchema.safeParse(validCoachingData);
      expect(result.success).toBe(true);
    });

    it('accepts coaching data with explanation', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        explanation: 'The protégé did not know about the recent policy change',
      });
      expect(result.success).toBe(true);
    });

    it('accepts coaching data with domain scope', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        scope: {
          appliesTo: 'this_domain',
          domain: ['infrastructure'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts ISO string timestamp', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        timestamp: '2024-01-15T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        id: 'coach_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty decisionId', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        decisionId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid override reason', () => {
      const result = LearningCoachingDataSchema.safeParse({
        ...validCoachingData,
        overrideReason: 'invalid_reason',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing scope', () => {
      const { scope: _, ...withoutScope } = validCoachingData;
      const result = LearningCoachingDataSchema.safeParse(withoutScope);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseLearningCoachingData returns valid data', () => {
      const result = parseLearningCoachingData(validCoachingData);
      expect(result.id).toBe(validCoachingData.id);
      expect(result.overrideReason).toBe('missing_context');
    });

    it('parseLearningCoachingData throws on invalid data', () => {
      expect(() =>
        parseLearningCoachingData({ ...validCoachingData, id: 'invalid' })
      ).toThrow();
    });

    it('safeParseLearningCoachingData returns success for valid data', () => {
      const result = safeParseLearningCoachingData(validCoachingData);
      expect(result.success).toBe(true);
    });

    it('safeParseLearningCoachingData returns error for invalid data', () => {
      const result = safeParseLearningCoachingData({ ...validCoachingData, id: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
