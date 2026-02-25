import { describe, it, expect } from 'vitest';
import {
  MembershipSchema,
  Membership,
  MembershipIdSchema,
  MemberRoleSchema,
  generateMembershipId,
  parseMembership,
  safeParseMembership,
} from '../membership.js';

describe('MembershipIdSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  it('accepts valid ULID', () => {
    const result = MembershipIdSchema.safeParse(validUlid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID', () => {
    const result = MembershipIdSchema.safeParse('not-a-ulid');
    expect(result.success).toBe(false);
  });
});

describe('generateMembershipId', () => {
  it('generates valid ULID', () => {
    const id = generateMembershipId();
    const result = MembershipIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set([
      generateMembershipId(),
      generateMembershipId(),
      generateMembershipId(),
    ]);
    expect(ids.size).toBe(3);
  });
});

describe('MemberRoleSchema', () => {
  describe('valid roles', () => {
    it('accepts owner role', () => {
      expect(MemberRoleSchema.safeParse('owner').success).toBe(true);
    });

    it('accepts admin role', () => {
      expect(MemberRoleSchema.safeParse('admin').success).toBe(true);
    });

    it('accepts member role', () => {
      expect(MemberRoleSchema.safeParse('member').success).toBe(true);
    });

    it('accepts viewer role', () => {
      expect(MemberRoleSchema.safeParse('viewer').success).toBe(true);
    });
  });

  describe('invalid roles', () => {
    it('rejects unknown role', () => {
      expect(MemberRoleSchema.safeParse('superuser').success).toBe(false);
    });

    it('rejects uppercase role', () => {
      expect(MemberRoleSchema.safeParse('ADMIN').success).toBe(false);
    });

    it('rejects empty string', () => {
      expect(MemberRoleSchema.safeParse('').success).toBe(false);
    });
  });
});

describe('MembershipSchema', () => {
  const validMembership = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    organizationId: '01BRZ3NDEKTSV4RRFFQ69G5FAV',
    userId: '01CRZ3NDEKTSV4RRFFQ69G5FAV',
    role: 'admin',
    joinedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid memberships', () => {
    it('accepts valid membership', () => {
      const result = MembershipSchema.safeParse(validMembership);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('admin');
      }
    });

    it('accepts all roles', () => {
      for (const role of ['owner', 'admin', 'member', 'viewer']) {
        const membership = { ...validMembership, role };
        expect(MembershipSchema.safeParse(membership).success).toBe(true);
      }
    });

    it('accepts membership with optional displayName', () => {
      const membership = { ...validMembership, displayName: 'John Doe' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(true);
    });

    it('accepts membership with optional updatedAt', () => {
      const membership = { ...validMembership, updatedAt: '2024-02-15T10:30:00Z' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(true);
    });

    it('accepts membership with revokedAt (soft delete)', () => {
      const membership = { ...validMembership, revokedAt: '2024-06-15T10:30:00Z' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid memberships', () => {
    it('rejects invalid membership id', () => {
      const membership = { ...validMembership, id: 'not-a-ulid' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects invalid organizationId', () => {
      const membership = { ...validMembership, organizationId: 'not-a-ulid' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects invalid userId', () => {
      const membership = { ...validMembership, userId: 'not-a-ulid' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const membership = { ...validMembership, role: 'superuser' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects displayName too long (>100 chars)', () => {
      const membership = { ...validMembership, displayName: 'a'.repeat(101) };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const membership = { ...validMembership, joinedAt: '2024-01-15' };
      const result = MembershipSchema.safeParse(membership);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(MembershipSchema.safeParse({}).success).toBe(false);
      expect(MembershipSchema.safeParse({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = Membership.V1.safeParse(validMembership);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = Membership.getVersion('v1');
      const result = schema.safeParse(validMembership);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(Membership.Latest).toBe(Membership.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseMembership returns valid membership', () => {
      const membership = parseMembership(validMembership);
      expect(membership.role).toBe(validMembership.role);
    });

    it('parseMembership throws on invalid data', () => {
      expect(() => parseMembership({})).toThrow();
    });

    it('safeParseMembership returns success result', () => {
      const result = safeParseMembership(validMembership);
      expect(result.success).toBe(true);
    });

    it('safeParseMembership returns failure result', () => {
      const result = safeParseMembership({});
      expect(result.success).toBe(false);
    });
  });
});
