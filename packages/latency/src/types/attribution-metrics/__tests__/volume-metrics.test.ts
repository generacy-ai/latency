import { describe, it, expect } from 'vitest';
import {
  VolumeMetricsSchema,
  parseVolumeMetrics,
  safeParseVolumeMetrics,
} from '../volume-metrics.js';

describe('VolumeMetricsSchema', () => {
  const validVolumeMetrics = {
    decisionsPerHour: 12.5,
    decisionsPerDay: 95,
    averageResponseTime: 45.2,
    peakThroughput: 22,
  };

  describe('valid shapes', () => {
    it('accepts valid volume metrics', () => {
      const result = VolumeMetricsSchema.safeParse(validVolumeMetrics);
      expect(result.success).toBe(true);
    });

    it('accepts zero values', () => {
      const result = VolumeMetricsSchema.safeParse({
        decisionsPerHour: 0,
        decisionsPerDay: 0,
        averageResponseTime: 0,
        peakThroughput: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts integer values', () => {
      const result = VolumeMetricsSchema.safeParse({
        decisionsPerHour: 10,
        decisionsPerDay: 80,
        averageResponseTime: 30,
        peakThroughput: 15,
      });
      expect(result.success).toBe(true);
    });

    it('accepts decimal values', () => {
      const result = VolumeMetricsSchema.safeParse({
        decisionsPerHour: 12.75,
        decisionsPerDay: 95.5,
        averageResponseTime: 45.123,
        peakThroughput: 22.8,
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects negative decisionsPerHour', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        decisionsPerHour: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative decisionsPerDay', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        decisionsPerDay: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative averageResponseTime', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        averageResponseTime: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative peakThroughput', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        peakThroughput: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { decisionsPerHour, ...withoutField } = validVolumeMetrics;
      const result = VolumeMetricsSchema.safeParse(withoutField);
      expect(result.success).toBe(false);
    });

    it('rejects non-numeric values', () => {
      const result = VolumeMetricsSchema.safeParse({
        ...validVolumeMetrics,
        decisionsPerHour: 'fast',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseVolumeMetrics returns parsed data', () => {
      const result = parseVolumeMetrics(validVolumeMetrics);
      expect(result.decisionsPerHour).toBe(12.5);
      expect(result.decisionsPerDay).toBe(95);
    });

    it('parseVolumeMetrics throws on invalid data', () => {
      expect(() => parseVolumeMetrics({ decisionsPerHour: -1 })).toThrow();
    });

    it('safeParseVolumeMetrics returns success result', () => {
      const result = safeParseVolumeMetrics(validVolumeMetrics);
      expect(result.success).toBe(true);
    });

    it('safeParseVolumeMetrics returns error result for invalid data', () => {
      const result = safeParseVolumeMetrics({ decisionsPerHour: -1 });
      expect(result.success).toBe(false);
    });
  });
});
