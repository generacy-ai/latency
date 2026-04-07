import { describe, it, expect } from 'vitest';
import {
  GeneracySubscriptionTierSchema,
  GeneracySubscriptionTier,
  GeneracyTierSchema,
  GeneracySubscriptionIdSchema,
  generateGeneracySubscriptionId,
  BillingIntervalSchema,
  parseGeneracySubscriptionTier,
  safeParseGeneracySubscriptionTier,
  GENERACY_TIER_DEFAULTS,
  GENERACY_TIER_FEATURES,
} from '../generacy-tier.js';
import { PlanFeatureSchema } from '../feature-entitlement.js';

describe('GeneracyTierSchema', () => {
  it('accepts valid tier values', () => {
    expect(GeneracyTierSchema.safeParse('free').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('basic').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('standard').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('professional').success).toBe(true);
    expect(GeneracyTierSchema.safeParse('enterprise').success).toBe(true);
  });

  it('rejects invalid tier values', () => {
    expect(GeneracyTierSchema.safeParse('pro').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('starter').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('team').success).toBe(false);
    expect(GeneracyTierSchema.safeParse('BASIC').success).toBe(false);
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
    tier: 'standard',
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
        expect(result.data.tier).toBe('standard');
        expect(result.data.seatCount).toBe(50);
        expect(result.data.usedSeats).toBe(35);
        expect(result.data.entitlements).toHaveLength(2);
      }
    });

    it('accepts basic tier subscription', () => {
      const subscription = { ...validSubscription, tier: 'basic', seatCount: 5, usedSeats: 3 };
      const result = GeneracySubscriptionTierSchema.safeParse(subscription);
      expect(result.success).toBe(true);
    });

    it('accepts professional tier subscription', () => {
      const subscription = { ...validSubscription, tier: 'professional', seatCount: 20, usedSeats: 10 };
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

  describe('V2 acceptance', () => {
    it('accepts valid interval: month', () => {
      const subscription = { ...validSubscription, interval: 'month' };
      const result = GeneracySubscriptionTier.V2.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interval).toBe('month');
      }
    });

    it('accepts valid interval: year', () => {
      const subscription = { ...validSubscription, interval: 'year' };
      const result = GeneracySubscriptionTier.V2.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interval).toBe('year');
      }
    });

    it('accepts valid priceId string', () => {
      const subscription = { ...validSubscription, priceId: 'price_1Abc123' };
      const result = GeneracySubscriptionTier.V2.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceId).toBe('price_1Abc123');
      }
    });

    it('accepts omitted interval and priceId (backward compat)', () => {
      const result = GeneracySubscriptionTier.V2.safeParse(validSubscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interval).toBeUndefined();
        expect(result.data.priceId).toBeUndefined();
      }
    });

    it('rejects invalid interval values', () => {
      expect(GeneracySubscriptionTier.V2.safeParse({ ...validSubscription, interval: 'week' }).success).toBe(false);
      expect(GeneracySubscriptionTier.V2.safeParse({ ...validSubscription, interval: 'daily' }).success).toBe(false);
      expect(GeneracySubscriptionTier.V2.safeParse({ ...validSubscription, interval: '' }).success).toBe(false);
    });

    it('rejects non-string priceId', () => {
      expect(GeneracySubscriptionTier.V2.safeParse({ ...validSubscription, priceId: 123 }).success).toBe(false);
      expect(GeneracySubscriptionTier.V2.safeParse({ ...validSubscription, priceId: true }).success).toBe(false);
    });

    it('preserves usedSeats <= seatCount refinement', () => {
      const subscription = { ...validSubscription, interval: 'month', priceId: 'price_1Abc123', seatCount: 5, usedSeats: 10 };
      const result = GeneracySubscriptionTier.V2.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('preserves periodStart < periodEnd refinement', () => {
      const subscription = {
        ...validSubscription,
        interval: 'year',
        currentPeriodStart: '2024-03-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      const result = GeneracySubscriptionTier.V2.safeParse(subscription);
      expect(result.success).toBe(false);
    });
  });

  describe('V3 acceptance', () => {
    it('accepts valid maxConcurrentWorkflows', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: 10 };
      const result = GeneracySubscriptionTier.V3.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxConcurrentWorkflows).toBe(10);
      }
    });

    it('accepts null maxConcurrentWorkflows (unlimited)', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: null };
      const result = GeneracySubscriptionTier.V3.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxConcurrentWorkflows).toBeNull();
      }
    });

    it('accepts omitted maxConcurrentWorkflows (backward compat)', () => {
      const result = GeneracySubscriptionTier.V3.safeParse(validSubscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.maxConcurrentWorkflows).toBeUndefined();
      }
    });

    it('rejects invalid maxConcurrentWorkflows values', () => {
      expect(GeneracySubscriptionTier.V3.safeParse({ ...validSubscription, maxConcurrentWorkflows: 0 }).success).toBe(false);
      expect(GeneracySubscriptionTier.V3.safeParse({ ...validSubscription, maxConcurrentWorkflows: -1 }).success).toBe(false);
      expect(GeneracySubscriptionTier.V3.safeParse({ ...validSubscription, maxConcurrentWorkflows: 1.5 }).success).toBe(false);
    });

    it('accepts V2 fields (interval, priceId) alongside maxConcurrentWorkflows', () => {
      const subscription = { ...validSubscription, interval: 'month', priceId: 'price_123', maxConcurrentWorkflows: 5 };
      const result = GeneracySubscriptionTier.V3.safeParse(subscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.interval).toBe('month');
        expect(result.data.priceId).toBe('price_123');
        expect(result.data.maxConcurrentWorkflows).toBe(5);
      }
    });

    it('preserves usedSeats <= seatCount refinement', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: 10, seatCount: 5, usedSeats: 10 };
      const result = GeneracySubscriptionTier.V3.safeParse(subscription);
      expect(result.success).toBe(false);
    });

    it('preserves periodStart < periodEnd refinement', () => {
      const subscription = {
        ...validSubscription,
        maxConcurrentWorkflows: 10,
        currentPeriodStart: '2024-03-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      };
      const result = GeneracySubscriptionTier.V3.safeParse(subscription);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = GeneracySubscriptionTier.V1.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper for v1', () => {
      const schema = GeneracySubscriptionTier.getVersion('v1');
      const result = schema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('Latest points to V3', () => {
      expect(GeneracySubscriptionTier.Latest).toBe(GeneracySubscriptionTier.V3);
    });

    it('getVersion returns V2 schema', () => {
      const schema = GeneracySubscriptionTier.getVersion('v2');
      const result = schema.safeParse({ ...validSubscription, interval: 'month', priceId: 'price_test' });
      expect(result.success).toBe(true);
    });

    it('getVersion returns V3 schema', () => {
      const schema = GeneracySubscriptionTier.getVersion('v3');
      const result = schema.safeParse({ ...validSubscription, maxConcurrentWorkflows: 5 });
      expect(result.success).toBe(true);
    });

    it('V1 still accessible and unchanged', () => {
      const result = GeneracySubscriptionTier.V1.safeParse(validSubscription);
      expect(result.success).toBe(true);
      // V1 should not accept interval/priceId as known fields (they pass through as excess but are stripped)
      expect(GeneracySubscriptionTier.V1).not.toBe(GeneracySubscriptionTier.V2);
    });

    it('BillingIntervalSchema accepts month and year', () => {
      expect(BillingIntervalSchema.safeParse('month').success).toBe(true);
      expect(BillingIntervalSchema.safeParse('year').success).toBe(true);
    });

    it('BillingIntervalSchema rejects invalid values', () => {
      expect(BillingIntervalSchema.safeParse('week').success).toBe(false);
      expect(BillingIntervalSchema.safeParse('daily').success).toBe(false);
      expect(BillingIntervalSchema.safeParse('').success).toBe(false);
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

  describe('clusterLimit field', () => {
    it('accepts valid integer clusterLimit', () => {
      const subscription = { ...validSubscription, clusterLimit: 5 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts null clusterLimit (unlimited)', () => {
      const subscription = { ...validSubscription, clusterLimit: null };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts omitted clusterLimit (backward compat)', () => {
      const result = GeneracySubscriptionTierSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('accepts zero clusterLimit', () => {
      const subscription = { ...validSubscription, clusterLimit: 0 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('rejects negative clusterLimit', () => {
      const subscription = { ...validSubscription, clusterLimit: -1 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });

    it('rejects non-integer clusterLimit', () => {
      const subscription = { ...validSubscription, clusterLimit: 2.5 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });
  });

  describe('maxConcurrentExecutions field', () => {
    it('accepts valid positive integer', () => {
      const subscription = { ...validSubscription, maxConcurrentExecutions: 10 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts null (unlimited)', () => {
      const subscription = { ...validSubscription, maxConcurrentExecutions: null };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts omitted (backward compat)', () => {
      const result = GeneracySubscriptionTierSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('rejects zero', () => {
      const subscription = { ...validSubscription, maxConcurrentExecutions: 0 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });

    it('rejects negative', () => {
      const subscription = { ...validSubscription, maxConcurrentExecutions: -3 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });

    it('rejects non-integer', () => {
      const subscription = { ...validSubscription, maxConcurrentExecutions: 1.5 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });
  });

  describe('maxConcurrentWorkflows field', () => {
    it('accepts valid positive integer', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: 10 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts null (unlimited)', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: null };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(true);
    });

    it('accepts omitted (backward compat)', () => {
      const result = GeneracySubscriptionTierSchema.safeParse(validSubscription);
      expect(result.success).toBe(true);
    });

    it('rejects zero', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: 0 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });

    it('rejects negative', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: -3 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });

    it('rejects non-integer', () => {
      const subscription = { ...validSubscription, maxConcurrentWorkflows: 1.5 };
      expect(GeneracySubscriptionTierSchema.safeParse(subscription).success).toBe(false);
    });
  });

  describe('GENERACY_TIER_DEFAULTS', () => {
    it('has entries for all five tiers', () => {
      expect(Object.keys(GENERACY_TIER_DEFAULTS)).toEqual(['free', 'basic', 'standard', 'professional', 'enterprise']);
    });

    it('each entry has clusterLimit, maxConcurrentWorkflows, and cloudUiEnabled', () => {
      for (const tier of Object.values(GENERACY_TIER_DEFAULTS)) {
        expect(tier).toHaveProperty('clusterLimit');
        expect(tier).toHaveProperty('maxConcurrentWorkflows');
        expect(tier).toHaveProperty('cloudUiEnabled');
      }
    });

    it('free tier has correct defaults', () => {
      expect(GENERACY_TIER_DEFAULTS.free).toEqual({ clusterLimit: 1, maxConcurrentWorkflows: 1, cloudUiEnabled: false });
    });

    it('basic tier has correct defaults', () => {
      expect(GENERACY_TIER_DEFAULTS.basic).toEqual({ clusterLimit: 2, maxConcurrentWorkflows: 2, cloudUiEnabled: true });
    });

    it('standard tier has correct defaults', () => {
      expect(GENERACY_TIER_DEFAULTS.standard).toEqual({ clusterLimit: 3, maxConcurrentWorkflows: 5, cloudUiEnabled: true });
    });

    it('professional tier has correct defaults', () => {
      expect(GENERACY_TIER_DEFAULTS.professional).toEqual({ clusterLimit: 4, maxConcurrentWorkflows: 10, cloudUiEnabled: true });
    });

    it('enterprise tier has unlimited defaults', () => {
      expect(GENERACY_TIER_DEFAULTS.enterprise).toEqual({ clusterLimit: null, maxConcurrentWorkflows: null, cloudUiEnabled: true });
    });

    it('only free tier has cloudUiEnabled: false', () => {
      expect(GENERACY_TIER_DEFAULTS.free.cloudUiEnabled).toBe(false);
      expect(GENERACY_TIER_DEFAULTS.basic.cloudUiEnabled).toBe(true);
      expect(GENERACY_TIER_DEFAULTS.standard.cloudUiEnabled).toBe(true);
      expect(GENERACY_TIER_DEFAULTS.professional.cloudUiEnabled).toBe(true);
      expect(GENERACY_TIER_DEFAULTS.enterprise.cloudUiEnabled).toBe(true);
    });
  });

  describe('GENERACY_TIER_FEATURES', () => {
    it('has entries for all five tiers', () => {
      expect(Object.keys(GENERACY_TIER_FEATURES)).toEqual(['free', 'basic', 'standard', 'professional', 'enterprise']);
    });

    it('free tier contains only github_integration', () => {
      expect(GENERACY_TIER_FEATURES.free).toEqual(['github_integration']);
    });

    it('basic tier contains all six features', () => {
      expect(GENERACY_TIER_FEATURES.basic).toHaveLength(6);
      expect(GENERACY_TIER_FEATURES.basic).toEqual(PlanFeatureSchema.options);
    });

    it('standard tier contains all six features', () => {
      expect(GENERACY_TIER_FEATURES.standard).toHaveLength(6);
      expect(GENERACY_TIER_FEATURES.standard).toEqual(PlanFeatureSchema.options);
    });

    it('professional tier contains all six features', () => {
      expect(GENERACY_TIER_FEATURES.professional).toHaveLength(6);
      expect(GENERACY_TIER_FEATURES.professional).toEqual(PlanFeatureSchema.options);
    });

    it('enterprise tier contains all six features', () => {
      expect(GENERACY_TIER_FEATURES.enterprise).toHaveLength(6);
      expect(GENERACY_TIER_FEATURES.enterprise).toEqual(PlanFeatureSchema.options);
    });

    it('every value in the mapping is a valid PlanFeature', () => {
      for (const features of Object.values(GENERACY_TIER_FEATURES)) {
        for (const feature of features) {
          expect(PlanFeatureSchema.safeParse(feature).success).toBe(true);
        }
      }
    });
  });

  describe('free tier subscription', () => {
    it('accepts a full subscription object with tier: free', () => {
      const freeSubscription = {
        ...validSubscription,
        tier: 'free',
        seatCount: 1,
        usedSeats: 1,
        clusterLimit: 1,
        maxConcurrentWorkflows: 1,
        entitlements: [],
      };
      const result = GeneracySubscriptionTierSchema.safeParse(freeSubscription);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tier).toBe('free');
        expect(result.data.clusterLimit).toBe(1);
        expect(result.data.maxConcurrentWorkflows).toBe(1);
      }
    });
  });
});
