import { describe, it, expect } from 'vitest';
import {
  GeneracySubscriptionTierSchema,
  GeneracySubscriptionTier,
  GeneracyTierSchema,
  GeneracySubscriptionIdSchema,
  generateGeneracySubscriptionId,
  parseGeneracySubscriptionTier,
  safeParseGeneracySubscriptionTier,
} from '../generacy-tier.js';

describe('GeneracyTierSchema', () => {
  it('accepts valid tier values', () => {
    expect(GeneracyTierSchema.safeParse('starter').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('team').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('enterprise').success).toBe(true);
  });

  it('rejects invalid tier values', () => {
    expect(GeneracyTierSchema.safeParse('free').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('pro').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('STARTER').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('').success).toBe(false);
  });
});

describe('GeneracySubscriptionIdSchema', () => {
  it('accepts valid ULID format', () => {
    const validId = '01KFH56GVE2NZA62CKMTEVX4JE';
    const result = GeneracySubscriptionIdSchema.safeParse(validId);
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID format', () => {
    expect(GeneracySubscriptionIdSchema.safeParse('invalid-id').success).toBe(false);
    expect(GeneracySubscriptionIdSchema.safeParse('123').success).toBe(false);
    expect(GeneracySubscriptionIdSchema.safeParse('').success).toBe(false);
  });
});

describe('generateGeneracySubscriptionId', () => {
  it('generates valid ULID', () => {
    const id = generateGeneracySubscriptionId();
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('generates unique IDs', () => {
    const id1 = generateGeneracySubscriptionId();
    const id2 = generateGeneracySubscriptionId();
    expect(id1).not.toBe(id2);
  });
});

describe('GeneracySubscriptionTierSchema', () => {
  const validSubscription = {
    id: '01KFH56GVE2NZA62CKMTEVX4JE',
    tier: 'team',
    orgId: '01KFH56GVK4GDF7DXV9A9S3KM1',
    status: 'active',
    seatCount: 50,
    usedSeats: 35,
    entitlements: [
      { feature: 'workflow_automation', enabled: true, limit: 100, resetPeriod: 'monthly' },
      { feature: 'advanced_analytics', enabled: true },
    ],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    currentPeriodStart: '2024-01-01T00:00:00Z',
    currentPeriodEnd: '2024-02-01T00:00:00Z',
  };

  describe('valid subscriptions', () => {
    it('accepts valid subscription with all required fields', () => {
      const result = GeneracySubscriptionTierSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('team');
        expect(result.data.seatCount).toBe(50);
        expect(result.data.usedSeats).toBe(35);
        expect(result.data.entitlements).toHaveLength(2);
      }
    });

    it('accepts starter tier subscription', () => {
      const subscription = { ...validSubscription, tier: 'starter', seatCount: 5, usedSeats: 3 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts enterprise tier subscription', () => {
      const subscription = { ...validSubscription, tier: 'enterprise', seatCount: 1000, usedSeats: 500 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts subscription with all seats used', () => {
      const subscription = { ...validSubscription, usedSeats: 50 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts subscription with no seats used', () => {
      const subscription = { ...validSubscription, usedSeats: 0 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts subscription with trial end', () => {
      const subscription = {
        ...validSubscription,
        status: 'trialing',
        trialEnd: '2024-01-31T00:00:00Z',
      };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts subscription with canceled at', () => {
      const subscription = {
        ...validSubscription,
        status: 'canceled',
        canceledAt: '2024-01-20T10:00:00Z',
      };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts empty entitlements array', () => {
      const subscription = { ...validSubscription, entitlements: [] };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts minimum seat count of 1', () => {
      const subscription = { ...validSubscription, seatCount: 1, usedSeats: 1 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });
  });

  describe('seat constraints', () => {
    it('rejects used seats exceeding seat count', () => {
      const subscription = { ...validSubscription, seatCount: 10, usedSeats: 15 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Used seats cannot exceed seat count');
      }
    });

    it('rejects zero seat count', () => {
      const subscription = { ...validSubscription, seatCount: 0 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects negative seat count', () => {
      const subscription = { ...validSubscription, seatCount: -5 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects negative used seats', () => {
      const subscription = { ...validSubscription, usedSeats: -1 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer seat count', () => {
      const subscription = { ...validSubscription, seatCount: 10.5 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer used seats', () => {
      const subscription = { ...validSubscription, usedSeats: 5.5 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });
  });

  describe('invalid subscriptions', () => {
    it('rejects invalid subscription ID format', () => {
      const subscription = { ...validSubscription, id: 'invalid-id' };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects invalid org ID format', () => {
      const subscription = { ...validSubscription, orgId: 'invalid-org-id' };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects invalid tier value', () => {
      const subscription = { ...validSubscription, tier: 'pro' };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status value', () => {
      const subscription = { ...validSubscription, status: 'pending' };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects period start after period end', () => {
      const subscription = {
        ...validSubscription,
        currentPeriodStart: '2024-03-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const subscription = { ...validSubscription, createdAt: '2024-01-15' };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects invalid entitlement in array', () => {
      const subscription = {
        ...validSubscription,
        entitlements: [{ feature: '', enabled: true }],
      };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(GeneracySubscriptionTierSchema.safeParse({}).success).toBe(false);
      expect(GeneracySubscriptionTierSchema.safeParse({ id: validSubscription.id }).success).toBe(
        false
      );
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = GeneracySubscriptionTier.V1.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = GeneracySubscriptionTier.getVersion('v1');
      const result = schema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(GeneracySubscriptionTier.Latest).toBe(GeneracySubscriptionTier.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseGeneracySubscriptionTier returns valid subscription', () => {
      const subscription = parseGeneracySubscriptionTier(validSubscription);
      expect(subscription.tier).toBe(validSubscription.tier);
    });

    it('parseGeneracySubscriptionTier throws on invalid data', () => {
      expect(() => parseGeneracySubscriptionTier({})).toThrow();
    });

    it('safeParseGeneracySubscriptionTier returns success result', () => {
      const result = safeParseGeneracySubscriptionTier(validSubscription);
      expect(result.success).toBe(true);
    });

    it('safeParseGeneracySubscriptionTier returns failure result', () => {
      const result = safeParseGeneracySubscriptionTier({});
      expect(result.success).toBe(false);
    });
  });
});
