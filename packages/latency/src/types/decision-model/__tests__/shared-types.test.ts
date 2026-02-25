import { describe, it, expect } from 'vitest';
import {
  DecisionRequestIdSchema,
  DecisionOptionIdSchema,
  BaselineRecommendationIdSchema,
  ProtegeRecommendationIdSchema,
  HumanDecisionIdSchema,
  ThreeLayerDecisionIdSchema,
  CoachingDataIdSchema,
  RelatedEntitySchema,
  CoachingScopeSchema,
  DecisionDomainSchema,
} from '../shared-types.js';

describe('Shared Types', () => {
  describe('ID Schema Validation', () => {
    const idTestCases = [
      { schema: DecisionRequestIdSchema, prefix: 'dreq', name: 'DecisionRequestIdSchema' },
      { schema: DecisionOptionIdSchema, prefix: 'dopt', name: 'DecisionOptionIdSchema' },
      { schema: BaselineRecommendationIdSchema, prefix: 'brec', name: 'BaselineRecommendationIdSchema' },
      { schema: ProtegeRecommendationIdSchema, prefix: 'prec', name: 'ProtegeRecommendationIdSchema' },
      { schema: HumanDecisionIdSchema, prefix: 'hdec', name: 'HumanDecisionIdSchema' },
      { schema: ThreeLayerDecisionIdSchema, prefix: 'tld', name: 'ThreeLayerDecisionIdSchema' },
      { schema: CoachingDataIdSchema, prefix: 'coach', name: 'CoachingDataIdSchema' },
    ];

    idTestCases.forEach(({ schema, prefix, name }) => {
      describe(name, () => {
        it(`should accept valid ${prefix}_ prefixed IDs`, () => {
          const validId = `${prefix}_abc12345`;
          expect(schema.safeParse(validId).success).toBe(true);
        });

        it('should accept longer IDs', () => {
          const validId = `${prefix}_abcdefghij123456`;
          expect(schema.safeParse(validId).success).toBe(true);
        });

        it('should reject IDs with wrong prefix', () => {
          const invalidId = `wrong_abc12345`;
          expect(schema.safeParse(invalidId).success).toBe(false);
        });

        it('should reject IDs with short suffix (less than 8 chars)', () => {
          const invalidId = `${prefix}_abc1234`;
          expect(schema.safeParse(invalidId).success).toBe(false);
        });

        it('should reject IDs with uppercase characters', () => {
          const invalidId = `${prefix}_ABC12345`;
          expect(schema.safeParse(invalidId).success).toBe(false);
        });

        it('should reject non-string values', () => {
          expect(schema.safeParse(123).success).toBe(false);
          expect(schema.safeParse(null).success).toBe(false);
          expect(schema.safeParse(undefined).success).toBe(false);
        });
      });
    });
  });

  describe('RelatedEntitySchema', () => {
    it('should accept valid issue entity', () => {
      const entity = { type: 'issue', number: 123 };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });

    it('should accept valid PR entity', () => {
      const entity = { type: 'pr', number: 456 };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });

    it('should accept valid file entity', () => {
      const entity = { type: 'file', path: 'src/index.ts' };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(true);
    });

    it('should reject issue with non-positive number', () => {
      const entity = { type: 'issue', number: 0 };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(false);
    });

    it('should reject issue with negative number', () => {
      const entity = { type: 'issue', number: -1 };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(false);
    });

    it('should reject file with empty path', () => {
      const entity = { type: 'file', path: '' };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(false);
    });

    it('should reject unknown entity type', () => {
      const entity = { type: 'unknown', data: 'test' };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(false);
    });

    it('should reject missing type', () => {
      const entity = { number: 123 };
      const result = RelatedEntitySchema.safeParse(entity);
      expect(result.success).toBe(false);
    });
  });

  describe('CoachingScopeSchema', () => {
    it('should accept this_decision', () => {
      expect(CoachingScopeSchema.safeParse('this_decision').success).toBe(true);
    });

    it('should accept this_project', () => {
      expect(CoachingScopeSchema.safeParse('this_project').success).toBe(true);
    });

    it('should accept general_principle', () => {
      expect(CoachingScopeSchema.safeParse('general_principle').success).toBe(true);
    });

    it('should reject invalid scope', () => {
      expect(CoachingScopeSchema.safeParse('invalid_scope').success).toBe(false);
    });

    it('should reject empty string', () => {
      expect(CoachingScopeSchema.safeParse('').success).toBe(false);
    });
  });

  describe('DecisionDomainSchema', () => {
    it('should accept valid domain strings', () => {
      expect(DecisionDomainSchema.safeParse('infrastructure').success).toBe(true);
      expect(DecisionDomainSchema.safeParse('architecture').success).toBe(true);
      expect(DecisionDomainSchema.safeParse('team_design').success).toBe(true);
      expect(DecisionDomainSchema.safeParse('code_review').success).toBe(true);
    });

    it('should reject empty string', () => {
      expect(DecisionDomainSchema.safeParse('').success).toBe(false);
    });
  });
});
