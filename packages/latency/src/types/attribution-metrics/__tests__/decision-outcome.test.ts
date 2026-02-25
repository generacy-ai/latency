import { describe, it, expect } from 'vitest';
import {
  OutcomeAttributionSchema,
  DecisionOutcomeSchema,
  parseOutcomeAttribution,
  safeParseOutcomeAttribution,
  parseDecisionOutcome,
  safeParseDecisionOutcome,
} from '../decision-outcome.js';

describe('OutcomeAttributionSchema', () => {
  const validAttribution = {
    whoWasRight: 'human_unique' as const,
    valueSource: 'human_judgment' as const,
  };

  describe('valid shapes', () => {
    it('accepts minimal valid attribution', () => {
      const result = OutcomeAttributionSchema.safeParse(validAttribution);
      expect(result.success).toBe(true);
    });

    it('accepts all whoWasRight values', () => {
      const values = ['baseline', 'protege', 'human_unique', 'all_aligned', 'unknown'] as const;
      for (const whoWasRight of values) {
        const result = OutcomeAttributionSchema.safeParse({ ...validAttribution, whoWasRight });
        expect(result.success).toBe(true);
      }
    });

    it('accepts all valueSource values', () => {
      const values = ['system', 'protege_wisdom', 'human_judgment', 'collaboration', 'none'] as const;
      for (const valueSource of values) {
        const result = OutcomeAttributionSchema.safeParse({ ...validAttribution, valueSource });
        expect(result.success).toBe(true);
      }
    });

    it('accepts optional counterfactual analysis', () => {
      const result = OutcomeAttributionSchema.safeParse({
        ...validAttribution,
        baselineAlternativeOutcome: 'Would have approved, leading to default',
        protegeAlternativeOutcome: 'Also recommended approval',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = OutcomeAttributionSchema.safeParse({
        ...validAttribution,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid whoWasRight value', () => {
      const result = OutcomeAttributionSchema.safeParse({
        ...validAttribution,
        whoWasRight: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid valueSource value', () => {
      const result = OutcomeAttributionSchema.safeParse({
        ...validAttribution,
        valueSource: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = OutcomeAttributionSchema.safeParse({
        whoWasRight: 'human_unique',
        // missing valueSource
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('DecisionOutcomeSchema', () => {
  const validOutcome = {
    id: 'outcome_abc12345',
    decisionId: 'tld_xyz12345',
    outcome: 'success' as const,
    validatedAt: new Date(),
    baselineWouldHaveWorked: false,
    protegeWouldHaveWorked: false,
    humanDecisionWorked: true,
    attribution: {
      whoWasRight: 'human_unique' as const,
      valueSource: 'human_judgment' as const,
    },
  };

  describe('valid shapes', () => {
    it('accepts valid outcome', () => {
      const result = DecisionOutcomeSchema.safeParse(validOutcome);
      expect(result.success).toBe(true);
    });

    it('accepts all outcome types', () => {
      const types = ['success', 'partial_success', 'failure', 'unknown'] as const;
      for (const outcome of types) {
        const result = DecisionOutcomeSchema.safeParse({ ...validOutcome, outcome });
        expect(result.success).toBe(true);
      }
    });

    it('accepts optional outcomeDetails', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        outcomeDetails: 'Loan was repaid on schedule',
      });
      expect(result.success).toBe(true);
    });

    it('accepts null values for counterfactual booleans', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        baselineWouldHaveWorked: null,
        protegeWouldHaveWorked: null,
        humanDecisionWorked: null,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string date to Date object', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        validatedAt: '2024-01-15T12:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.validatedAt).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        id: 'wrong_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid decisionId prefix', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        decisionId: 'wrong_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid outcome type', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        outcome: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing attribution', () => {
      const { attribution, ...withoutAttribution } = validOutcome;
      const result = DecisionOutcomeSchema.safeParse(withoutAttribution);
      expect(result.success).toBe(false);
    });

    it('rejects invalid attribution', () => {
      const result = DecisionOutcomeSchema.safeParse({
        ...validOutcome,
        attribution: { whoWasRight: 'invalid' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseOutcomeAttribution returns parsed data', () => {
      const result = parseOutcomeAttribution({
        whoWasRight: 'all_aligned',
        valueSource: 'system',
      });
      expect(result.whoWasRight).toBe('all_aligned');
      expect(result.valueSource).toBe('system');
    });

    it('safeParseOutcomeAttribution returns success result', () => {
      const result = safeParseOutcomeAttribution({
        whoWasRight: 'all_aligned',
        valueSource: 'system',
      });
      expect(result.success).toBe(true);
    });

    it('parseDecisionOutcome returns parsed data', () => {
      const result = parseDecisionOutcome(validOutcome);
      expect(result.id).toBe('outcome_abc12345');
      expect(result.outcome).toBe('success');
    });

    it('parseDecisionOutcome throws on invalid data', () => {
      expect(() => parseDecisionOutcome({ id: 'invalid' })).toThrow();
    });

    it('safeParseDecisionOutcome returns success result', () => {
      const result = safeParseDecisionOutcome(validOutcome);
      expect(result.success).toBe(true);
    });

    it('safeParseDecisionOutcome returns error result for invalid data', () => {
      const result = safeParseDecisionOutcome({ id: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
