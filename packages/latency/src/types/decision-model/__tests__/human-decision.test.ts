import { describe, it, expect } from 'vitest';
import {
  ClaimRejectedSchema,
  ClaimMissingSchema,
  WeightWrongSchema,
  ReasoningFeedbackSchema,
  PriorityChangeSchema,
  CoachingDataSchema,
  HumanDecisionSchema,
  parseHumanDecision,
  safeParseHumanDecision,
} from '../human-decision.js';

describe('Human Decision Schemas', () => {
  describe('ClaimRejectedSchema', () => {
    it('should accept valid rejected claim', () => {
      const claim = {
        claimId: 'step-1',
        issue: 'This reasoning is outdated',
      };
      const result = ClaimRejectedSchema.safeParse(claim);
      expect(result.success).toBe(true);
    });

    it('should reject empty claimId', () => {
      const claim = { claimId: '', issue: 'Some issue' };
      const result = ClaimRejectedSchema.safeParse(claim);
      expect(result.success).toBe(false);
    });

    it('should reject empty issue', () => {
      const claim = { claimId: 'step-1', issue: '' };
      const result = ClaimRejectedSchema.safeParse(claim);
      expect(result.success).toBe(false);
    });
  });

  describe('ClaimMissingSchema', () => {
    it('should accept claim without principle', () => {
      const claim = {
        logic: 'Consider the regulatory requirements',
      };
      const result = ClaimMissingSchema.safeParse(claim);
      expect(result.success).toBe(true);
    });

    it('should accept claim with principle', () => {
      const claim = {
        logic: 'Apply user safety principle',
        principle: {
          principleId: 'pri_principle1',
          statement: 'User safety first',
        },
      };
      const result = ClaimMissingSchema.safeParse(claim);
      expect(result.success).toBe(true);
    });

    it('should reject empty logic', () => {
      const claim = { logic: '' };
      const result = ClaimMissingSchema.safeParse(claim);
      expect(result.success).toBe(false);
    });
  });

  describe('WeightWrongSchema', () => {
    it('should accept weight should be higher', () => {
      const weight = { claimId: 'step-1', shouldBe: 'higher' };
      const result = WeightWrongSchema.safeParse(weight);
      expect(result.success).toBe(true);
    });

    it('should accept weight should be lower', () => {
      const weight = { claimId: 'step-2', shouldBe: 'lower' };
      const result = WeightWrongSchema.safeParse(weight);
      expect(result.success).toBe(true);
    });

    it('should reject invalid shouldBe value', () => {
      const weight = { claimId: 'step-1', shouldBe: 'much_higher' };
      const result = WeightWrongSchema.safeParse(weight);
      expect(result.success).toBe(false);
    });

    it('should reject empty claimId', () => {
      const weight = { claimId: '', shouldBe: 'higher' };
      const result = WeightWrongSchema.safeParse(weight);
      expect(result.success).toBe(false);
    });
  });

  describe('ReasoningFeedbackSchema', () => {
    it('should accept valid feedback with all arrays', () => {
      const feedback = {
        claimsRejected: [{ claimId: 'step-1', issue: 'Outdated' }],
        claimsMissing: [{ logic: 'Missing consideration' }],
        weightsWrong: [{ claimId: 'step-2', shouldBe: 'higher' }],
      };
      const result = ReasoningFeedbackSchema.safeParse(feedback);
      expect(result.success).toBe(true);
    });

    it('should accept feedback with empty arrays', () => {
      const feedback = {
        claimsRejected: [],
        claimsMissing: [],
        weightsWrong: [],
      };
      const result = ReasoningFeedbackSchema.safeParse(feedback);
      expect(result.success).toBe(true);
    });

    it('should reject missing arrays', () => {
      const feedback = { claimsRejected: [] };
      const result = ReasoningFeedbackSchema.safeParse(feedback);
      expect(result.success).toBe(false);
    });
  });

  describe('PriorityChangeSchema', () => {
    it('should accept valid priority change', () => {
      const change = { from: 'cost optimization', to: 'user safety' };
      const result = PriorityChangeSchema.safeParse(change);
      expect(result.success).toBe(true);
    });

    it('should reject empty from', () => {
      const change = { from: '', to: 'user safety' };
      const result = PriorityChangeSchema.safeParse(change);
      expect(result.success).toBe(false);
    });

    it('should reject empty to', () => {
      const change = { from: 'cost', to: '' };
      const result = PriorityChangeSchema.safeParse(change);
      expect(result.success).toBe(false);
    });
  });

  describe('CoachingDataSchema', () => {
    const validCoaching = {
      reasoningFeedback: {
        claimsRejected: [],
        claimsMissing: [],
        weightsWrong: [],
      },
      scope: 'this_decision',
    };

    it('should accept minimal coaching data', () => {
      const result = CoachingDataSchema.safeParse(validCoaching);
      expect(result.success).toBe(true);
    });

    it('should accept coaching with all optional fields', () => {
      const coaching = {
        ...validCoaching,
        contextMissing: 'Regulatory changes not considered',
        priorityChange: { from: 'cost', to: 'compliance' },
      };
      const result = CoachingDataSchema.safeParse(coaching);
      expect(result.success).toBe(true);
    });

    it('should validate scope values', () => {
      expect(
        CoachingDataSchema.safeParse({ ...validCoaching, scope: 'this_decision' }).success
      ).toBe(true);
      expect(
        CoachingDataSchema.safeParse({ ...validCoaching, scope: 'this_project' }).success
      ).toBe(true);
      expect(
        CoachingDataSchema.safeParse({ ...validCoaching, scope: 'general_principle' }).success
      ).toBe(true);
      expect(
        CoachingDataSchema.safeParse({ ...validCoaching, scope: 'invalid_scope' }).success
      ).toBe(false);
    });

    it('should reject missing scope', () => {
      const { scope, ...rest } = validCoaching;
      const result = CoachingDataSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('HumanDecisionSchema', () => {
    const validDecision = {
      optionId: 'dopt_option0001',
      timestamp: new Date().toISOString(),
      matchesBaseline: true,
      matchesProtege: true,
    };

    it('should accept valid decision without coaching', () => {
      const result = HumanDecisionSchema.safeParse(validDecision);
      expect(result.success).toBe(true);
    });

    it('should accept valid decision with full coaching data', () => {
      const decision = {
        ...validDecision,
        matchesBaseline: false,
        matchesProtege: false,
        coaching: {
          reasoningFeedback: {
            claimsRejected: [{ claimId: 'step-1', issue: 'Wrong assumption' }],
            claimsMissing: [{ logic: 'Missing regulation consideration' }],
            weightsWrong: [{ claimId: 'step-2', shouldBe: 'higher' }],
          },
          contextMissing: 'Recent policy changes',
          priorityChange: { from: 'speed', to: 'quality' },
          scope: 'general_principle',
        },
      };
      const result = HumanDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it('should accept Date object for timestamp', () => {
      const decision = { ...validDecision, timestamp: new Date() };
      const result = HumanDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it('should reject invalid optionId', () => {
      const decision = { ...validDecision, optionId: 'invalid_id' };
      const result = HumanDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject invalid coaching scope', () => {
      const decision = {
        ...validDecision,
        coaching: {
          reasoningFeedback: {
            claimsRejected: [],
            claimsMissing: [],
            weightsWrong: [],
          },
          scope: 'invalid_scope',
        },
      };
      const result = HumanDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should validate boolean types for matches flags', () => {
      const decision = { ...validDecision, matchesBaseline: 'true' };
      const result = HumanDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    const validDecision = {
      optionId: 'dopt_option0001',
      timestamp: new Date().toISOString(),
      matchesBaseline: false,
      matchesProtege: true,
    };

    it('parseHumanDecision should return parsed data', () => {
      const result = parseHumanDecision(validDecision);
      expect(result.optionId).toBe('dopt_option0001');
      expect(result.matchesProtege).toBe(true);
    });

    it('parseHumanDecision should throw on invalid data', () => {
      expect(() => parseHumanDecision({ invalid: 'data' })).toThrow();
    });

    it('safeParseHumanDecision should return success result', () => {
      const result = safeParseHumanDecision(validDecision);
      expect(result.success).toBe(true);
    });

    it('safeParseHumanDecision should return error result on invalid data', () => {
      const result = safeParseHumanDecision({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
