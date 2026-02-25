import { describe, it, expect } from 'vitest';
import {
  PatternSchema,
  StatisticalBasisSchema,
  parsePattern,
  safeParsePattern,
  parseStatisticalBasis,
} from '../pattern.js';

describe('StatisticalBasisSchema', () => {
  const validStats = {
    sampleSize: 15,
    consistency: 0.87,
  };

  describe('valid shapes', () => {
    it('accepts valid statistical basis', () => {
      const result = StatisticalBasisSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('accepts zero sample size', () => {
      const result = StatisticalBasisSchema.safeParse({
        sampleSize: 0,
        consistency: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it('accepts boundary consistency values', () => {
      expect(StatisticalBasisSchema.safeParse({ sampleSize: 10, consistency: 0 }).success).toBe(true);
      expect(StatisticalBasisSchema.safeParse({ sampleSize: 10, consistency: 1 }).success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects negative sample size', () => {
      const result = StatisticalBasisSchema.safeParse({
        sampleSize: -1,
        consistency: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer sample size', () => {
      const result = StatisticalBasisSchema.safeParse({
        sampleSize: 15.5,
        consistency: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects consistency outside range', () => {
      expect(StatisticalBasisSchema.safeParse({ sampleSize: 10, consistency: -0.1 }).success).toBe(false);
      expect(StatisticalBasisSchema.safeParse({ sampleSize: 10, consistency: 1.1 }).success).toBe(false);
    });
  });
});

describe('PatternSchema', () => {
  const validPattern = {
    id: 'pat_abc12345',
    userId: 'user_123',
    observation: 'When team < 5, prefers monorepo structure',
    frequency: 8,
    contexts: ['startup', 'side_project', 'small_team'],
    statisticalBasis: {
      sampleSize: 10,
      consistency: 0.8,
    },
    status: 'observed' as const,
    createdAt: new Date(),
    lastObserved: new Date(),
  };

  describe('valid shapes', () => {
    it('accepts valid pattern', () => {
      const result = PatternSchema.safeParse(validPattern);
      expect(result.success).toBe(true);
    });

    it('accepts all status values', () => {
      const statuses = ['observed', 'proposed_principle', 'rejected', 'promoted'] as const;
      for (const status of statuses) {
        if (status === 'promoted') {
          const result = PatternSchema.safeParse({
            ...validPattern,
            status,
            promotedToPrincipleId: 'pri_abc12345',
          });
          expect(result.success).toBe(true);
        } else {
          const result = PatternSchema.safeParse({ ...validPattern, status });
          expect(result.success).toBe(true);
        }
      }
    });

    it('accepts promoted pattern with principle id', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        status: 'promoted',
        promotedToPrincipleId: 'pri_xyz12345',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });

    it('coerces string dates to Date objects', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        createdAt: '2024-01-01T00:00:00Z',
        lastObserved: '2024-01-02T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.lastObserved).toBeInstanceOf(Date);
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        id: 'pri_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects promoted status without principle id', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        status: 'promoted',
        // missing promotedToPrincipleId
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative frequency', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        frequency: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer frequency', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        frequency: 8.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty observation', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        observation: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty context strings', () => {
      const result = PatternSchema.safeParse({
        ...validPattern,
        contexts: ['valid', ''],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parsePattern returns parsed data', () => {
      const result = parsePattern(validPattern);
      expect(result.id).toBe('pat_abc12345');
      expect(result.observation).toBe('When team < 5, prefers monorepo structure');
    });

    it('parsePattern throws on invalid data', () => {
      expect(() => parsePattern({ id: 'invalid' })).toThrow();
    });

    it('safeParsePattern returns success result', () => {
      const result = safeParsePattern(validPattern);
      expect(result.success).toBe(true);
    });

    it('safeParsePattern returns error result for invalid data', () => {
      const result = safeParsePattern({ id: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('parseStatisticalBasis works correctly', () => {
      const stats = parseStatisticalBasis({
        sampleSize: 15,
        consistency: 0.87,
      });
      expect(stats.sampleSize).toBe(15);
      expect(stats.consistency).toBe(0.87);
    });
  });
});
