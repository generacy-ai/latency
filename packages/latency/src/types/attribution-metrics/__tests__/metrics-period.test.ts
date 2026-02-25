import { describe, it, expect } from 'vitest';
import {
  MetricsPeriodSchema,
  parseMetricsPeriod,
  safeParseMetricsPeriod,
} from '../metrics-period.js';

describe('MetricsPeriodSchema', () => {
  const validPeriod = {
    type: 'month' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
  };

  describe('valid shapes', () => {
    it('accepts valid period', () => {
      const result = MetricsPeriodSchema.safeParse(validPeriod);
      expect(result.success).toBe(true);
    });

    it('accepts all period types', () => {
      const types = ['day', 'week', 'month', 'quarter', 'year', 'all_time'] as const;
      for (const type of types) {
        const result = MetricsPeriodSchema.safeParse({ ...validPeriod, type });
        expect(result.success).toBe(true);
      }
    });

    it('accepts same start and end date', () => {
      const date = new Date('2024-01-15');
      const result = MetricsPeriodSchema.safeParse({
        type: 'day',
        startDate: date,
        endDate: date,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string dates to Date objects', () => {
      const result = MetricsPeriodSchema.safeParse({
        type: 'week',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-07T23:59:59Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = MetricsPeriodSchema.safeParse({
        ...validPeriod,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid period type', () => {
      const result = MetricsPeriodSchema.safeParse({
        ...validPeriod,
        type: 'decade',
      });
      expect(result.success).toBe(false);
    });

    it('rejects end date before start date', () => {
      const result = MetricsPeriodSchema.safeParse({
        type: 'month',
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('endDate');
      }
    });

    it('rejects missing type', () => {
      const result = MetricsPeriodSchema.safeParse({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date strings', () => {
      const result = MetricsPeriodSchema.safeParse({
        type: 'month',
        startDate: 'not-a-date',
        endDate: '2024-01-31',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseMetricsPeriod returns parsed data', () => {
      const result = parseMetricsPeriod(validPeriod);
      expect(result.type).toBe('month');
      expect(result.startDate).toBeInstanceOf(Date);
    });

    it('parseMetricsPeriod throws on invalid data', () => {
      expect(() => parseMetricsPeriod({ type: 'invalid' })).toThrow();
    });

    it('safeParseMetricsPeriod returns success result', () => {
      const result = safeParseMetricsPeriod(validPeriod);
      expect(result.success).toBe(true);
    });

    it('safeParseMetricsPeriod returns error result for invalid data', () => {
      const result = safeParseMetricsPeriod({ type: 'invalid' });
      expect(result.success).toBe(false);
    });
  });
});
