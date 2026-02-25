import { describe, it, expect } from 'vitest';
import {
  WhoWasRightSchema,
  ValueAddedSchema,
  DecisionAttributionSchema,
  ThreeLayerDecisionSchema,
  parseThreeLayerDecision,
  safeParseThreeLayerDecision,
} from '../three-layer-decision.js';

describe('Three Layer Decision Schemas', () => {
  describe('WhoWasRightSchema', () => {
    it('should accept baseline', () => {
      expect(WhoWasRightSchema.safeParse('baseline').success).toBe(true);
    });

    it('should accept protege', () => {
      expect(WhoWasRightSchema.safeParse('protege').success).toBe(true);
    });

    it('should accept human_unique', () => {
      expect(WhoWasRightSchema.safeParse('human_unique').success).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(WhoWasRightSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('ValueAddedSchema', () => {
    it('should accept none', () => {
      expect(ValueAddedSchema.safeParse('none').success).toBe(true);
    });

    it('should accept protege', () => {
      expect(ValueAddedSchema.safeParse('protege').success).toBe(true);
    });

    it('should accept human', () => {
      expect(ValueAddedSchema.safeParse('human').success).toBe(true);
    });

    it('should accept both', () => {
      expect(ValueAddedSchema.safeParse('both').success).toBe(true);
    });

    it('should reject invalid value', () => {
      expect(ValueAddedSchema.safeParse('invalid').success).toBe(false);
    });
  });

  describe('DecisionAttributionSchema', () => {
    it('should accept valid attribution', () => {
      const attribution = {
        whoWasRight: 'baseline',
        valueAdded: 'none',
      };
      const result = DecisionAttributionSchema.safeParse(attribution);
      expect(result.success).toBe(true);
    });

    it('should accept all combinations of whoWasRight and valueAdded', () => {
      const whoValues = ['baseline', 'protege', 'human_unique'];
      const valueValues = ['none', 'protege', 'human', 'both'];

      whoValues.forEach((who) => {
        valueValues.forEach((value) => {
          const attribution = { whoWasRight: who, valueAdded: value };
          const result = DecisionAttributionSchema.safeParse(attribution);
          expect(result.success).toBe(true);
        });
      });
    });

    it('should reject invalid whoWasRight', () => {
      const attribution = { whoWasRight: 'invalid', valueAdded: 'none' };
      const result = DecisionAttributionSchema.safeParse(attribution);
      expect(result.success).toBe(false);
    });

    it('should reject invalid valueAdded', () => {
      const attribution = { whoWasRight: 'baseline', valueAdded: 'invalid' };
      const result = DecisionAttributionSchema.safeParse(attribution);
      expect(result.success).toBe(false);
    });
  });

  describe('ThreeLayerDecisionSchema', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createValidDecision = (): any => ({
      id: 'tld_decision01',
      request: {
        id: 'dreq_request01',
        timestamp: new Date().toISOString(),
        domain: 'infrastructure',
        context: {
          summary: 'Database choice',
          domain: ['infra'],
          constraints: [],
          stakeholders: ['team'],
        },
        question: 'Which database?',
        options: [
          {
            id: 'dopt_option0001',
            label: 'PostgreSQL',
            description: 'Use PostgreSQL',
            tradeoffs: { pros: ['Reliable'], cons: ['Complex'] },
          },
          {
            id: 'dopt_option0002',
            label: 'MySQL',
            description: 'Use MySQL',
            tradeoffs: { pros: ['Simple'], cons: ['Less features'] },
          },
        ],
        urgency: 'blocking_soon',
        relatedEntities: [],
      },
      baseline: {
        optionId: 'dopt_option0001',
        confidence: 75,
        reasoning: ['PostgreSQL is more feature-rich'],
        factors: [{ name: 'Features', weight: 0.8 }],
      },
      protege: {
        optionId: 'dopt_option0001',
        confidence: 80,
        reasoning: [{ step: 1, logic: 'Matches user preference for reliability' }],
        appliedPrinciples: [
          {
            principleId: 'pri_principle1',
            principleText: 'Prefer reliable solutions',
            relevance: 'Database needs to be reliable',
            weight: 0.9,
          },
        ],
        differsFromBaseline: false,
      },
      human: {
        optionId: 'dopt_option0001',
        timestamp: new Date().toISOString(),
        matchesBaseline: true,
        matchesProtege: true,
      },
      attribution: {
        whoWasRight: 'baseline',
        valueAdded: 'none',
      },
    });

    it('should accept complete valid decision record', () => {
      const decision = createValidDecision();
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it('should accept decision where protege differs from baseline', () => {
      const decision = createValidDecision();
      decision.protege.optionId = 'dopt_option0002';
      decision.protege.differsFromBaseline = true;
      decision.protege.differenceExplanation = 'User prefers simplicity';
      decision.human.optionId = 'dopt_option0002';
      decision.human.matchesBaseline = false;
      decision.human.matchesProtege = true;
      decision.attribution.whoWasRight = 'protege';
      decision.attribution.valueAdded = 'protege';

      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it('should accept decision where human chose unique option', () => {
      const decision = createValidDecision();
      // Add a third option that human chose
      decision.request.options.push({
        id: 'dopt_option0003',
        label: 'MongoDB',
        description: 'Use MongoDB',
        tradeoffs: { pros: ['Flexible'], cons: ['Different paradigm'] },
      });
      decision.human.optionId = 'dopt_option0003';
      decision.human.matchesBaseline = false;
      decision.human.matchesProtege = false;
      decision.human.coaching = {
        reasoningFeedback: {
          claimsRejected: [],
          claimsMissing: [{ logic: 'Consider document-based storage' }],
          weightsWrong: [],
        },
        scope: 'this_project',
      };
      decision.attribution.whoWasRight = 'human_unique';
      decision.attribution.valueAdded = 'human';

      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
    });

    it('should reject invalid decision ID', () => {
      const decision = createValidDecision();
      decision.id = 'invalid_id';
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject missing request', () => {
      const decision = createValidDecision();
      // @ts-ignore - intentionally testing invalid structure
      delete decision.request;
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject missing baseline', () => {
      const decision = createValidDecision();
      // @ts-ignore - intentionally testing invalid structure
      delete decision.baseline;
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject missing protege', () => {
      const decision = createValidDecision();
      // @ts-ignore - intentionally testing invalid structure
      delete decision.protege;
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject missing human', () => {
      const decision = createValidDecision();
      // @ts-ignore - intentionally testing invalid structure
      delete decision.human;
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject missing attribution', () => {
      const decision = createValidDecision();
      // @ts-ignore - intentionally testing invalid structure
      delete decision.attribution;
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should reject invalid nested schemas', () => {
      const decision = createValidDecision();
      decision.baseline.confidence = 150; // Invalid: above 100
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(false);
    });

    it('should support passthrough for additional fields', () => {
      const decision = createValidDecision();
      // @ts-ignore - adding extra field
      decision.customField = 'extra data';
      const result = ThreeLayerDecisionSchema.safeParse(decision);
      expect(result.success).toBe(true);
      if (result.success) {
        // @ts-ignore
        expect(result.data.customField).toBe('extra data');
      }
    });
  });

  describe('Parse functions', () => {
    const createValidDecision = () => ({
      id: 'tld_decision01',
      request: {
        id: 'dreq_request01',
        timestamp: new Date().toISOString(),
        domain: 'infrastructure',
        context: {
          summary: 'Test',
          domain: [],
          constraints: [],
          stakeholders: [],
        },
        question: 'Test?',
        options: [
          {
            id: 'dopt_option0001',
            label: 'A',
            description: 'Option A',
            tradeoffs: { pros: [], cons: [] },
          },
          {
            id: 'dopt_option0002',
            label: 'B',
            description: 'Option B',
            tradeoffs: { pros: [], cons: [] },
          },
        ],
        urgency: 'when_available',
        relatedEntities: [],
      },
      baseline: {
        optionId: 'dopt_option0001',
        confidence: 70,
        reasoning: [],
        factors: [],
      },
      protege: {
        optionId: 'dopt_option0001',
        confidence: 75,
        reasoning: [],
        appliedPrinciples: [],
        differsFromBaseline: false,
      },
      human: {
        optionId: 'dopt_option0001',
        timestamp: new Date().toISOString(),
        matchesBaseline: true,
        matchesProtege: true,
      },
      attribution: {
        whoWasRight: 'baseline',
        valueAdded: 'none',
      },
    });

    it('parseThreeLayerDecision should return parsed data', () => {
      const decision = createValidDecision();
      const result = parseThreeLayerDecision(decision);
      expect(result.id).toBe('tld_decision01');
      expect(result.attribution.whoWasRight).toBe('baseline');
    });

    it('parseThreeLayerDecision should throw on invalid data', () => {
      expect(() => parseThreeLayerDecision({ invalid: 'data' })).toThrow();
    });

    it('safeParseThreeLayerDecision should return success result', () => {
      const decision = createValidDecision();
      const result = safeParseThreeLayerDecision(decision);
      expect(result.success).toBe(true);
    });

    it('safeParseThreeLayerDecision should return error on invalid data', () => {
      const result = safeParseThreeLayerDecision({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
