import { describe, it, expect } from 'vitest';
import {
  UsageLimitSchema,
  UsageLimit,
  OverageBehaviorSchema,
  parseUsageLimit,
  safeParseUsageLimit,
} from '../usage-limit.js';

describe('OverageBehaviorSchema', () => {
  it('accepts valid overage behaviors', () => {
    expect(OverageBehaviorSchema.safeParse('block').success).toBe(true);
    expect(OverageBehaviorSchema.safeParse('warn').success).toBe(true);
    expect(OverageBehaviorSchema.safeParse('charge').success).toBe(true);
    expect(OverageBehaviorSchema.safeParse('throttle').success).toBe(true);
  });

  it('rejects invalid overage behaviors', () => {
    expect(OverageBehaviorSchema.safeParse('ignore').success).toBe(false);
    expect(OverageBehaviorSchema.safeParse('BLOCK').success).toBe(false);
    expect(OverageBehaviorSchema.safeParse('').success).toBe(false);
  });
});

describe('UsageLimitSchema', () => {
  const validUsageLimit = {
    feature: 'api_calls',
    limit: 10000,
    used: 7500,
    resetAt: '2024-02-01T00:00:00Z',
    resetPeriod: 'monthly',
    overageBehavior: 'throttle',
  };

  describe('valid usage limits', () => {
    it('accepts valid usage limit with all fields', () => {
      const result = UsageLimitSchema.safeParse(validUsageLimit);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.feature).toBe('api_calls');
        expect(result.data.limit).toBe(10000);
        expect(result.data.used).toBe(7500);
        expect(result.data.overageBehavior).toBe('throttle');
      }
    });

    it('accepts usage at limit', () => {
      const usage = { ...validUsageLimit, used: 10000 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts zero usage', () => {
      const usage = { ...validUsageLimit, used: 0 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts usage over limit when not blocking', () => {
      const usage = { ...validUsageLimit, used: 12000, overageBehavior: 'warn' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts usage over limit with charge behavior', () => {
      const usage = { ...validUsageLimit, used: 15000, overageBehavior: 'charge' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts usage over limit with throttle behavior', () => {
      const usage = { ...validUsageLimit, used: 20000, overageBehavior: 'throttle' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts timestamp with milliseconds', () => {
      const usage = { ...validUsageLimit, resetAt: '2024-02-01T00:00:00.000Z' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });

    it('accepts timestamp with timezone offset', () => {
      const usage = { ...validUsageLimit, resetAt: '2024-02-01T00:00:00+05:30' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid usage limits', () => {
    it('rejects empty feature identifier', () => {
      const usage = { ...validUsageLimit, feature: '' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects negative limit', () => {
      const usage = { ...validUsageLimit, limit: -100 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects negative used count', () => {
      const usage = { ...validUsageLimit, used: -1 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects usage over limit when blocking', () => {
      const usage = { ...validUsageLimit, used: 12000, overageBehavior: 'block' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const usage = { ...validUsageLimit, resetAt: '2024-02-01' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects invalid reset period', () => {
      const usage = { ...validUsageLimit, resetPeriod: 'hourly' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects invalid overage behavior', () => {
      const usage = { ...validUsageLimit, overageBehavior: 'ignore' };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(UsageLimitSchema.safeParse({}).success).toBe(false);
      expect(UsageLimitSchema.safeParse({ feature: 'test' }).success).toBe(false);
    });

    it('rejects non-integer limit', () => {
      const usage = { ...validUsageLimit, limit: 100.5 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer used', () => {
      const usage = { ...validUsageLimit, used: 75.5 };
      const result = UsageLimitSchema.safeParse(usage);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = UsageLimit.V1.safeParse(validUsageLimit);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = UsageLimit.getVersion('v1');
      const result = schema.safeParse(validUsageLimit);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(UsageLimit.Latest).toBe(UsageLimit.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseUsageLimit returns valid usage limit', () => {
      const usage = parseUsageLimit(validUsageLimit);
      expect(usage.feature).toBe(validUsageLimit.feature);
    });

    it('parseUsageLimit throws on invalid data', () => {
      expect(() => parseUsageLimit({})).toThrow();
    });

    it('safeParseUsageLimit returns success result', () => {
      const result = safeParseUsageLimit(validUsageLimit);
      expect(result.success).toBe(true);
    });

    it('safeParseUsageLimit returns failure result', () => {
      const result = safeParseUsageLimit({});
      expect(result.success).toBe(false);
    });
  });
});
