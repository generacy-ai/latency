import { describe, it, expect } from 'vitest';
import {
  ThreeLayerDecisionContextSchema,
  ThreeLayerDecisionOptionSchema,
  ThreeLayerDecisionRequestSchema,
  TradeoffsSchema,
  parseThreeLayerDecisionRequest,
  safeParseThreeLayerDecisionRequest,
} from '../decision-request.js';

describe('Decision Request Schemas', () => {
  describe('TradeoffsSchema', () => {
    it('should accept valid tradeoffs', () => {
      const tradeoffs = {
        pros: ['Easy to implement', 'Low cost'],
        cons: ['May not scale'],
      };
      expect(TradeoffsSchema.safeParse(tradeoffs).success).toBe(true);
    });

    it('should accept empty arrays', () => {
      const tradeoffs = { pros: [], cons: [] };
      expect(TradeoffsSchema.safeParse(tradeoffs).success).toBe(true);
    });

    it('should reject missing pros', () => {
      const tradeoffs = { cons: ['Some con'] };
      expect(TradeoffsSchema.safeParse(tradeoffs).success).toBe(false);
    });

    it('should reject missing cons', () => {
      const tradeoffs = { pros: ['Some pro'] };
      expect(TradeoffsSchema.safeParse(tradeoffs).success).toBe(false);
    });
  });

  describe('ThreeLayerDecisionContextSchema', () => {
    const validContext = {
      summary: 'Database migration decision',
      domain: ['infrastructure'],
      constraints: ['budget limit'],
      stakeholders: ['platform team'],
    };

    it('should accept valid minimal context', () => {
      const result = ThreeLayerDecisionContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
    });

    it('should accept context with all optional fields', () => {
      const fullContext = {
        ...validContext,
        timeline: 'Q1 2024',
        expandedContext: 'Detailed context about the migration...',
      };
      const result = ThreeLayerDecisionContextSchema.safeParse(fullContext);
      expect(result.success).toBe(true);
    });

    it('should accept empty arrays for domain, constraints, stakeholders', () => {
      const context = {
        summary: 'Test summary',
        domain: [],
        constraints: [],
        stakeholders: [],
      };
      const result = ThreeLayerDecisionContextSchema.safeParse(context);
      expect(result.success).toBe(true);
    });

    it('should reject empty summary', () => {
      const context = { ...validContext, summary: '' };
      const result = ThreeLayerDecisionContextSchema.safeParse(context);
      expect(result.success).toBe(false);
    });

    it('should reject missing summary', () => {
      const { summary, ...rest } = validContext;
      const result = ThreeLayerDecisionContextSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });

  describe('ThreeLayerDecisionOptionSchema', () => {
    const validOption = {
      id: 'dopt_abc12345',
      label: 'Option A',
      description: 'Use PostgreSQL',
      tradeoffs: {
        pros: ['Reliable', 'Well-known'],
        cons: ['Expensive'],
      },
    };

    it('should accept valid option', () => {
      const result = ThreeLayerDecisionOptionSchema.safeParse(validOption);
      expect(result.success).toBe(true);
    });

    it('should reject invalid option ID', () => {
      const option = { ...validOption, id: 'invalid_id' };
      const result = ThreeLayerDecisionOptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should reject empty label', () => {
      const option = { ...validOption, label: '' };
      const result = ThreeLayerDecisionOptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });

    it('should reject empty description', () => {
      const option = { ...validOption, description: '' };
      const result = ThreeLayerDecisionOptionSchema.safeParse(option);
      expect(result.success).toBe(false);
    });
  });

  describe('ThreeLayerDecisionRequestSchema', () => {
    const validOption1 = {
      id: 'dopt_option0001',
      label: 'Option A',
      description: 'First option',
      tradeoffs: { pros: ['Pro 1'], cons: ['Con 1'] },
    };

    const validOption2 = {
      id: 'dopt_option0002',
      label: 'Option B',
      description: 'Second option',
      tradeoffs: { pros: ['Pro 2'], cons: ['Con 2'] },
    };

    const validRequest = {
      id: 'dreq_request01',
      timestamp: new Date().toISOString(),
      domain: 'infrastructure',
      context: {
        summary: 'Choose database',
        domain: ['infra'],
        constraints: [],
        stakeholders: ['team'],
      },
      question: 'Which database should we use?',
      options: [validOption1, validOption2],
      urgency: 'blocking_soon',
      relatedEntities: [],
    };

    it('should accept valid minimal request', () => {
      const result = ThreeLayerDecisionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should accept valid complete request with related entities', () => {
      const fullRequest = {
        ...validRequest,
        relatedEntities: [
          { type: 'issue', number: 123 },
          { type: 'pr', number: 456 },
          { type: 'file', path: 'src/db.ts' },
        ],
      };
      const result = ThreeLayerDecisionRequestSchema.safeParse(fullRequest);
      expect(result.success).toBe(true);
    });

    it('should require minimum 2 options', () => {
      const request = { ...validRequest, options: [validOption1] };
      const result = ThreeLayerDecisionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should accept 3 or more options', () => {
      const option3 = {
        id: 'dopt_option0003',
        label: 'Option C',
        description: 'Third option',
        tradeoffs: { pros: [], cons: [] },
      };
      const request = { ...validRequest, options: [validOption1, validOption2, option3] };
      const result = ThreeLayerDecisionRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should validate urgency enum', () => {
      expect(
        ThreeLayerDecisionRequestSchema.safeParse({ ...validRequest, urgency: 'blocking_now' })
          .success
      ).toBe(true);
      expect(
        ThreeLayerDecisionRequestSchema.safeParse({ ...validRequest, urgency: 'when_available' })
          .success
      ).toBe(true);
      expect(
        ThreeLayerDecisionRequestSchema.safeParse({ ...validRequest, urgency: 'invalid_urgency' })
          .success
      ).toBe(false);
    });

    it('should reject missing required fields', () => {
      const { question, ...rest } = validRequest;
      const result = ThreeLayerDecisionRequestSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });

    it('should reject empty question', () => {
      const request = { ...validRequest, question: '' };
      const result = ThreeLayerDecisionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid request ID', () => {
      const request = { ...validRequest, id: 'invalid_id' };
      const result = ThreeLayerDecisionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    const validRequest = {
      id: 'dreq_request01',
      timestamp: new Date().toISOString(),
      domain: 'infrastructure',
      context: {
        summary: 'Test',
        domain: [],
        constraints: [],
        stakeholders: [],
      },
      question: 'Test question?',
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
    };

    it('parseThreeLayerDecisionRequest should return parsed data', () => {
      const result = parseThreeLayerDecisionRequest(validRequest);
      expect(result.id).toBe('dreq_request01');
    });

    it('parseThreeLayerDecisionRequest should throw on invalid data', () => {
      expect(() => parseThreeLayerDecisionRequest({ invalid: 'data' })).toThrow();
    });

    it('safeParseThreeLayerDecisionRequest should return success result', () => {
      const result = safeParseThreeLayerDecisionRequest(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('dreq_request01');
      }
    });

    it('safeParseThreeLayerDecisionRequest should return error result on invalid data', () => {
      const result = safeParseThreeLayerDecisionRequest({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
