import { describe, it, expect } from 'vitest';
import {
  IndividualMetricsSchema,
  parseIndividualMetrics,
  safeParseIndividualMetrics,
} from '../individual-metrics.js';

describe('IndividualMetricsSchema', () => {
  const validMetrics = {
    id: 'metrics_abc12345',
    userId: 'user_123',
    period: {
      type: 'month' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    },
    calculatedAt: new Date(),
    interventionRate: 0.15,
    additiveValue: 0.42,
    protegeStandaloneValue: 0.35,
    uniqueHumanContribution: 0.07,
    domainBreakdown: [
      {
        domain: 'content_moderation',
        decisionsCount: 150,
        interventionRate: 0.12,
        successRate: 0.94,
        valueAdded: 0.23,
      },
    ],
    volumeCapacity: {
      decisionsPerHour: 12.5,
      decisionsPerDay: 95,
      averageResponseTime: 45.2,
      peakThroughput: 22,
    },
    trend: {
      direction: 'improving' as const,
      changePercent: 15.5,
      comparedToPeriod: {
        type: 'month' as const,
        startDate: new Date('2023-12-01'),
        endDate: new Date('2023-12-31'),
      },
    },
  };

  describe('valid shapes', () => {
    it('accepts valid individual metrics', () => {
      const result = IndividualMetricsSchema.safeParse(validMetrics);
      expect(result.success).toBe(true);
    });

    it('accepts empty domainBreakdown array', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        domainBreakdown: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts multiple domains in breakdown', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        domainBreakdown: [
          {
            domain: 'content_moderation',
            decisionsCount: 150,
            interventionRate: 0.12,
            successRate: 0.94,
            valueAdded: 0.23,
          },
          {
            domain: 'loan_approval',
            decisionsCount: 75,
            interventionRate: 0.08,
            successRate: 0.91,
            valueAdded: 0.18,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero values for all rates', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        interventionRate: 0,
        additiveValue: 0,
        protegeStandaloneValue: 0,
        uniqueHumanContribution: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts max values for all rates', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        interventionRate: 1,
        additiveValue: 1,
        protegeStandaloneValue: 1,
        uniqueHumanContribution: 1,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string dates', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        calculatedAt: '2024-01-31T12:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.calculatedAt).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
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
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        id: 'wrong_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects rates below 0', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        interventionRate: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rates above 1', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        additiveValue: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid period', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        period: {
          type: 'invalid',
          startDate: new Date(),
          endDate: new Date(),
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid domain in breakdown', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        domainBreakdown: [
          {
            domain: '', // invalid empty domain
            decisionsCount: 150,
            interventionRate: 0.12,
            successRate: 0.94,
            valueAdded: 0.23,
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid volumeCapacity', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        volumeCapacity: {
          decisionsPerHour: -1, // invalid negative
          decisionsPerDay: 95,
          averageResponseTime: 45.2,
          peakThroughput: 22,
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid trend direction', () => {
      const result = IndividualMetricsSchema.safeParse({
        ...validMetrics,
        trend: {
          ...validMetrics.trend,
          direction: 'unknown',
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { userId, ...withoutUserId } = validMetrics;
      const result = IndividualMetricsSchema.safeParse(withoutUserId);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseIndividualMetrics returns parsed data', () => {
      const result = parseIndividualMetrics(validMetrics);
      expect(result.id).toBe('metrics_abc12345');
      expect(result.interventionRate).toBe(0.15);
      expect(result.domainBreakdown).toHaveLength(1);
    });

    it('parseIndividualMetrics throws on invalid data', () => {
      expect(() => parseIndividualMetrics({ id: 'invalid' })).toThrow();
    });

    it('safeParseIndividualMetrics returns success result', () => {
      const result = safeParseIndividualMetrics(validMetrics);
      expect(result.success).toBe(true);
    });

    it('safeParseIndividualMetrics returns error result for invalid data', () => {
      const result = safeParseIndividualMetrics({ id: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
