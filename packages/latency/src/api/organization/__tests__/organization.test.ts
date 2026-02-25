import { describe, it, expect } from 'vitest';
import {
  OrganizationSchema,
  Organization,
  OrganizationIdSchema,
  OrganizationSlugSchema,
  OrganizationSubscriptionTierSchema,
  generateOrganizationId,
  parseOrganization,
  safeParseOrganization,
} from '../organization.js';

describe('OrganizationIdSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  it('accepts valid ULID', () => {
    const result = OrganizationIdSchema.safeParse(validUlid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID', () => {
    const result = OrganizationIdSchema.safeParse('not-a-ulid');
    expect(result.success).toBe(false);
  });
});

describe('generateOrganizationId', () => {
  it('generates valid ULID', () => {
    const id = generateOrganizationId();
    const result = OrganizationIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set([
      generateOrganizationId(),
      generateOrganizationId(),
      generateOrganizationId(),
    ]);
    expect(ids.size).toBe(3);
  });
});

describe('OrganizationSlugSchema', () => {
  describe('valid slugs', () => {
    it('accepts lowercase alphanumeric', () => {
      expect(OrganizationSlugSchema.safeParse('acme').success).toBe(true);
    });

    it('accepts slug with hyphens', () => {
      expect(OrganizationSlugSchema.safeParse('acme-corp').success).toBe(true);
    });

    it('accepts slug with numbers', () => {
      expect(OrganizationSlugSchema.safeParse('acme123').success).toBe(true);
    });

    it('accepts minimum length (3 chars)', () => {
      expect(OrganizationSlugSchema.safeParse('abc').success).toBe(true);
    });

    it('accepts maximum length (50 chars)', () => {
      expect(OrganizationSlugSchema.safeParse('a'.repeat(50)).success).toBe(true);
    });

    it('accepts complex valid slug', () => {
      expect(OrganizationSlugSchema.safeParse('my-awesome-company-2024').success).toBe(true);
    });
  });

  describe('invalid slugs', () => {
    it('rejects uppercase letters', () => {
      expect(OrganizationSlugSchema.safeParse('ACME').success).toBe(false);
    });

    it('rejects leading hyphen', () => {
      expect(OrganizationSlugSchema.safeParse('-acme').success).toBe(false);
    });

    it('rejects trailing hyphen', () => {
      expect(OrganizationSlugSchema.safeParse('acme-').success).toBe(false);
    });

    it('rejects consecutive hyphens', () => {
      expect(OrganizationSlugSchema.safeParse('acme--corp').success).toBe(false);
    });

    it('rejects too short (2 chars)', () => {
      expect(OrganizationSlugSchema.safeParse('ab').success).toBe(false);
    });

    it('rejects too long (51 chars)', () => {
      expect(OrganizationSlugSchema.safeParse('a'.repeat(51)).success).toBe(false);
    });

    it('rejects spaces', () => {
      expect(OrganizationSlugSchema.safeParse('acme corp').success).toBe(false);
    });

    it('rejects special characters', () => {
      expect(OrganizationSlugSchema.safeParse('acme_corp').success).toBe(false);
    });
  });
});

describe('OrganizationSubscriptionTierSchema', () => {
  it('accepts starter tier', () => {
    expect(OrganizationSubscriptionTierSchema.safeParse('starter').success).toBe(true);
  });

  it('accepts team tier', () => {
    expect(OrganizationSubscriptionTierSchema.safeParse('team').success).toBe(true);
  });

  it('accepts enterprise tier', () => {
    expect(OrganizationSubscriptionTierSchema.safeParse('enterprise').success).toBe(true);
  });

  it('rejects invalid tier', () => {
    expect(OrganizationSubscriptionTierSchema.safeParse('free').success).toBe(false);
    expect(OrganizationSubscriptionTierSchema.safeParse('pro').success).toBe(false);
  });
});

describe('OrganizationSchema', () => {
  const validOrganization = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    name: 'Acme Corporation',
    slug: 'acme-corp',
    ownerId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    subscriptionTier: 'team',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid organizations', () => {
    it('accepts valid organization', () => {
      const result = OrganizationSchema.safeParse(validOrganization);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Acme Corporation');
        expect(result.data.subscriptionTier).toBe('team');
      }
    });

    it('accepts organization with optional description', () => {
      const org = { ...validOrganization, description: 'A great company' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(true);
    });

    it('accepts organization with optional avatarUrl', () => {
      const org = { ...validOrganization, avatarUrl: 'https://example.com/avatar.png' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(true);
    });

    it('accepts organization with archivedAt (soft delete)', () => {
      const org = { ...validOrganization, archivedAt: '2024-06-15T10:30:00Z' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(true);
    });

    it('accepts all subscription tiers', () => {
      for (const tier of ['starter', 'team', 'enterprise']) {
        const org = { ...validOrganization, subscriptionTier: tier };
        expect(OrganizationSchema.safeParse(org).success).toBe(true);
      }
    });
  });

  describe('invalid organizations', () => {
    it('rejects invalid organization id', () => {
      const org = { ...validOrganization, id: 'not-a-ulid' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const org = { ...validOrganization, name: '' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects name too long (>100 chars)', () => {
      const org = { ...validOrganization, name: 'a'.repeat(101) };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects invalid slug', () => {
      const org = { ...validOrganization, slug: 'INVALID_SLUG' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ownerId', () => {
      const org = { ...validOrganization, ownerId: 'not-a-ulid' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects invalid subscription tier', () => {
      const org = { ...validOrganization, subscriptionTier: 'free' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects description too long (>500 chars)', () => {
      const org = { ...validOrganization, description: 'a'.repeat(501) };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects invalid avatarUrl', () => {
      const org = { ...validOrganization, avatarUrl: 'not-a-url' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const org = { ...validOrganization, createdAt: '2024-01-15' };
      const result = OrganizationSchema.safeParse(org);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(OrganizationSchema.safeParse({}).success).toBe(false);
      expect(OrganizationSchema.safeParse({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = Organization.V1.safeParse(validOrganization);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = Organization.getVersion('v1');
      const result = schema.safeParse(validOrganization);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(Organization.Latest).toBe(Organization.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseOrganization returns valid organization', () => {
      const org = parseOrganization(validOrganization);
      expect(org.name).toBe(validOrganization.name);
    });

    it('parseOrganization throws on invalid data', () => {
      expect(() => parseOrganization({})).toThrow();
    });

    it('safeParseOrganization returns success result', () => {
      const result = safeParseOrganization(validOrganization);
      expect(result.success).toBe(true);
    });

    it('safeParseOrganization returns failure result', () => {
      const result = safeParseOrganization({});
      expect(result.success).toBe(false);
    });
  });
});
