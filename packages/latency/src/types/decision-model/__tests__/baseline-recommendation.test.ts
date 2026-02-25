import { describe, it, expect } from 'vitest';
import {
  ConsiderationFactorSchema,
  BaselineRecommendationSchema,
  parseBaselineRecommendation,
  safeParseBaselineRecommendation,
} from '../baseline-recommendation.js';

describe('Baseline Recommendation Schemas', () => {
  describe('ConsiderationFactorSchema', () => {
    it('should accept valid factor with all fields', () => {
      const factor = {
        name: 'Cost efficiency',
        weight: 0.8,
        evidence: 'Based on market analysis',
      };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(true);
    });

    it('should accept valid factor without evidence', () => {
      const factor = {
        name: 'Scalability',
        weight: 0.5,
      };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(true);
    });

    it('should accept weight at boundary 0', () => {
      const factor = { name: 'Low priority', weight: 0 };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(true);
    });

    it('should accept weight at boundary 1', () => {
      const factor = { name: 'High priority', weight: 1 };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(true);
    });

    it('should reject weight below 0', () => {
      const factor = { name: 'Invalid', weight: -0.1 };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(false);
    });

    it('should reject weight above 1', () => {
      const factor = { name: 'Invalid', weight: 1.1 };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const factor = { name: '', weight: 0.5 };
      const result = ConsiderationFactorSchema.safeParse(factor);
      expect(result.success).toBe(false);
    });
  });

  describe('BaselineRecommendationSchema', () => {
    const validRecommendation = {
      optionId: 'dopt_option0001',
      confidence: 75,
      reasoning: ['First reason', 'Second reason'],
      factors: [
        { name: 'Factor 1', weight: 0.6 },
        { name: 'Factor 2', weight: 0.4, evidence: 'Some evidence' },
      ],
    };

    it('should accept valid recommendation', () => {
      const result = BaselineRecommendationSchema.safeParse(validRecommendation);
      expect(result.success).toBe(true);
    });

    it('should accept recommendation with empty arrays', () => {
      const recommendation = {
        optionId: 'dopt_option0001',
        confidence: 50,
        reasoning: [],
        factors: [],
      };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should accept confidence at boundary 0', () => {
      const recommendation = { ...validRecommendation, confidence: 0 };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should accept confidence at boundary 100', () => {
      const recommendation = { ...validRecommendation, confidence: 100 };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(true);
    });

    it('should reject confidence below 0', () => {
      const recommendation = { ...validRecommendation, confidence: -1 };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should reject confidence above 100', () => {
      const recommendation = { ...validRecommendation, confidence: 101 };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer confidence', () => {
      const recommendation = { ...validRecommendation, confidence: 75.5 };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should reject invalid optionId', () => {
      const recommendation = { ...validRecommendation, optionId: 'invalid_id' };
      const result = BaselineRecommendationSchema.safeParse(recommendation);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const { confidence, ...rest } = validRecommendation;
      const result = BaselineRecommendationSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    const validRecommendation = {
      optionId: 'dopt_option0001',
      confidence: 80,
      reasoning: ['Reason'],
      factors: [],
    };

    it('parseBaselineRecommendation should return parsed data', () => {
      const result = parseBaselineRecommendation(validRecommendation);
      expect(result.optionId).toBe('dopt_option0001');
      expect(result.confidence).toBe(80);
    });

    it('parseBaselineRecommendation should throw on invalid data', () => {
      expect(() => parseBaselineRecommendation({ invalid: 'data' })).toThrow();
    });

    it('safeParseBaselineRecommendation should return success result', () => {
      const result = safeParseBaselineRecommendation(validRecommendation);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence).toBe(80);
      }
    });

    it('safeParseBaselineRecommendation should return error result on invalid data', () => {
      const result = safeParseBaselineRecommendation({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
