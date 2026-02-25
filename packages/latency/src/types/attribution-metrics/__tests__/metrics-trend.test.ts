import { describe, it, expect } from 'vitest';
import {
  MetricsTrendSchema,
  parseMetricsTrend,
  safeParseMetricsTrend,
} from '../metrics-trend.js';

describe('MetricsTrendSchema', () => {
  const validTrend = {
    direction: 'improving' as const,
    changePercent: 15.5,
    comparedToPeriod: {
      type: 'month' as const,
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-31'),
    },
  };

  describe('valid shapes', () => {
    it('accepts valid trend', () => {
      const result = MetricsTrendSchema.safeParse(validTrend);
      expect(result.success).toBe(true);
    });

    it('accepts all direction values', () => {
      const directions = ['improving', 'stable', 'declining'] as const;
      for (const direction of directions) {
        const result = MetricsTrendSchema.safeParse({ ...validTrend, direction });
        expect(result.success).toBe(true);
      }
    });

    it('accepts positive changePercent', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        changePercent: 100,
      });
      expect(result.success).toBe(true);
    });

    it('accepts negative changePercent for decline', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        direction: 'declining',
        changePercent: -25.5,
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero changePercent for stable', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        direction: 'stable',
        changePercent: 0,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string dates in comparedToPeriod', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        comparedToPeriod: {
          type: 'week',
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-07T23:59:59Z',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.comparedToPeriod.startDate).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid direction', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        direction: 'unknown',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric changePercent', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        changePercent: 'high',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid comparedToPeriod', () => {
      const result = MetricsTrendSchema.safeParse({
        ...validTrend,
        comparedToPeriod: {
          type: 'invalid',
          startDate: new Date(),
          endDate: new Date(),
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing direction', () => {
      const { direction, ...withoutDirection } = validTrend;
      const result = MetricsTrendSchema.safeParse(withoutDirection);
      expect(result.success).toBe(false);
    });

    it('rejects missing comparedToPeriod', () => {
      const { comparedToPeriod, ...withoutPeriod } = validTrend;
      const result = MetricsTrendSchema.safeParse(withoutPeriod);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseMetricsTrend returns parsed data', () => {
      const result = parseMetricsTrend(validTrend);
      expect(result.direction).toBe('improving');
      expect(result.changePercent).toBe(15.5);
    });

    it('parseMetricsTrend throws on invalid data', () => {
      expect(() => parseMetricsTrend({ direction: 'invalid' })).toThrow();
    });

    it('safeParseMetricsTrend returns success result', () => {
      const result = safeParseMetricsTrend(validTrend);
      expect(result.success).toBe(true);
    });

    it('safeParseMetricsTrend returns error result for invalid data', () => {
      const result = safeParseMetricsTrend({ direction: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
