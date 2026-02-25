import { describe, it, expect } from 'vitest';
import {
  DomainMetricsSchema,
  parseDomainMetrics,
  safeParseDomainMetrics,
} from '../domain-metrics.js';

describe('DomainMetricsSchema', () => {
  const validDomainMetrics = {
    domain: 'content_moderation',
    decisionsCount: 150,
    interventionRate: 0.12,
    successRate: 0.94,
    valueAdded: 0.23,
  };

  describe('valid shapes', () => {
    it('accepts valid domain metrics', () => {
      const result = DomainMetricsSchema.safeParse(validDomainMetrics);
      expect(result.success).toBe(true);
    });

    it('accepts zero values for rates', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        interventionRate: 0,
        successRate: 0,
        valueAdded: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts max values for rates', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        interventionRate: 1,
        successRate: 1,
        valueAdded: 1,
      });
      expect(result.success).toBe(true);
    });

    it('accepts zero decisions count', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        decisionsCount: 0,
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty domain', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        domain: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative decisions count', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        decisionsCount: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer decisions count', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        decisionsCount: 150.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rates below 0', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        interventionRate: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rates above 1', () => {
      const result = DomainMetricsSchema.safeParse({
        ...validDomainMetrics,
        successRate: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { domain, ...withoutDomain } = validDomainMetrics;
      const result = DomainMetricsSchema.safeParse(withoutDomain);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseDomainMetrics returns parsed data', () => {
      const result = parseDomainMetrics(validDomainMetrics);
      expect(result.domain).toBe('content_moderation');
      expect(result.decisionsCount).toBe(150);
    });

    it('parseDomainMetrics throws on invalid data', () => {
      expect(() => parseDomainMetrics({ domain: '' })).toThrow();
    });

    it('safeParseDomainMetrics returns success result', () => {
      const result = safeParseDomainMetrics(validDomainMetrics);
      expect(result.success).toBe(true);
    });

    it('safeParseDomainMetrics returns error result for invalid data', () => {
      const result = safeParseDomainMetrics({ domain: '' });
      expect(result.success).toBe(false);
    });
  });
});
