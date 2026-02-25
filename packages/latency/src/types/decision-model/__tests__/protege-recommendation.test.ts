import { describe, it, expect } from 'vitest';
import {
  PrincipleReferenceSchema,
  ReasoningStepSchema,
  AppliedPrincipleSchema,
  ProtegeRecommendationSchema,
  parseProtegeRecommendation,
  safeParseProtegeRecommendation,
} from '../protege-recommendation.js';

describe('Protege Recommendation Schemas', () => {
  describe('PrincipleReferenceSchema', () => {
    it('should accept valid principle reference', () => {
      const ref = {
        principleId: 'pri_principle1',
        statement: 'Always prioritize user safety',
      };
      const result = PrincipleReferenceSchema.safeParse(ref);
      expect(result.success).toBe(true);
    });

    it('should reject invalid principleId', () => {
      const ref = {
        principleId: 'invalid_id',
        statement: 'Some statement',
      };
      const result = PrincipleReferenceSchema.safeParse(ref);
      expect(result.success).toBe(false);
    });

    it('should reject empty statement', () => {
      const ref = {
        principleId: 'pri_principle1',
        statement: '',
      };
      const result = PrincipleReferenceSchema.safeParse(ref);
      expect(result.success).toBe(false);
    });
  });

  describe('ReasoningStepSchema', () => {
    it('should accept valid step without principle', () => {
      const step = {
        step: 1,
        logic: 'Based on initial analysis',
      };
      const result = ReasoningStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    it('should accept valid step with principle', () => {
      const step = {
        step: 2,
        principle: {
          principleId: 'pri_principle1',
          statement: 'User safety first',
        },
        logic: 'Applying user safety principle',
      };
      const result = ReasoningStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    it('should reject step with non-positive number', () => {
      const step = { step: 0, logic: 'Some logic' };
      const result = ReasoningStepSchema.safeParse(step);
      expect(result.success).toBe(false);
    });

    it('should reject step with negative number', () => {
      const step = { step: -1, logic: 'Some logic' };
      const result = ReasoningStepSchema.safeParse(step);
      expect(result.success).toBe(false);
    });

    it('should reject empty logic', () => {
      const step = { step: 1, logic: '' };
      const result = ReasoningStepSchema.safeParse(step);
      expect(result.success).toBe(false);
    });
  });

  describe('AppliedPrincipleSchema', () => {
    const validPrinciple = {
      principleId: 'pri_principle1',
      principleText: 'Always prioritize user safety',
      relevance: 'This decision affects user data',
      weight: 0.9,
    };

    it('should accept valid applied principle', () => {
      const result = AppliedPrincipleSchema.safeParse(validPrinciple);
      expect(result.success).toBe(true);
    });

    it('should reject weight below 0', () => {
      const principle = { ...validPrinciple, weight: -0.1 };
      const result = AppliedPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(false);
    });

    it('should reject weight above 1', () => {
      const principle = { ...validPrinciple, weight: 1.1 };
      const result = AppliedPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(false);
    });

    it('should reject empty relevance', () => {
      const principle = { ...validPrinciple, relevance: '' };
      const result = AppliedPrincipleSchema.safeParse(principle);
      expect(result.success).toBe(false);
    });
  });

  describe('ProtegeRecommendationSchema', () => {
    const validRecommendation = {
      optionId: 'dopt_option0001',
      confidence: 85,
      reasoning: [{ step: 1, logic: 'Initial analysis' }],
      appliedPrinciples: [
        {
          principleId: 'pri_principle1',
          principleText: 'User safety',
          relevance: 'Affects users',
          weight: 0.8,
        },
      ],
      differsFromBaseline: false,
    };

    it('should accept valid recommendation that matches baseline', () => {
      const result = ProtegeRecommendationSchema.safeParse(validRecommendation);
      expect(result.success).toBe(true);
    });

    it('should accept recommendation that differs from baseline with explanation', () => {
      const recommendation = {
        ...validRecommendation,
        differsFromBaseline: true,
        differenceExplanation: 'User principles prioritize safety over cost',
      };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should reject recommendation that differs but has no explanation', () => {
      const recommendation = {
        ...validRecommendation,
        differsFromBaseline: true,
      };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should accept empty reasoning array', () => {
      const recommendation = { ...validRecommendation, reasoning: [] };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should accept empty appliedPrinciples array', () => {
      const recommendation = { ...validRecommendation, appliedPrinciples: [] };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should reject confidence below 0', () => {
      const recommendation = { ...validRecommendation, confidence: -1 };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should reject confidence above 100', () => {
      const recommendation = { ...validRecommendation, confidence: 101 };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should accept differenceExplanation when differsFromBaseline is false', () => {
      const recommendation = {
        ...validRecommendation,
        differsFromBaseline: false,
        differenceExplanation: 'Still providing explanation',
      };
      const result = ProtegeRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });
  });

  describe('Parse functions', () => {
    const validRecommendation = {
      optionId: 'dopt_option0001',
      confidence: 90,
      reasoning: [],
      appliedPrinciples: [],
      differsFromBaseline: false,
    };

    it('parseProtegeRecommendation should return parsed data', () => {
      const result = parseProtegeRecommendation(validRecommendation);
      expect(result.optionId).toBe('dopt_option0001');
      expect(result.confidence).toBe(90);
    });

    it('parseProtegeRecommendation should throw on invalid data', () => {
      expect(() => parseProtegeRecommendation({ invalid: 'data' })).toThrow();
    });

    it('safeParseProtegeRecommendation should return success result', () => {
      const result = safeParseProtegeRecommendation(validRecommendation);
      expect(result.success).toBe(true);
    });

    it('safeParseProtegeRecommendation should return error on missing explanation', () => {
      const invalid = { ...validRecommendation, differsFromBaseline: true };
      const result = safeParseProtegeRecommendation(invalid);
      expect(result.success).toBe(false);
    });
  });
});
