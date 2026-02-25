import { describe, it, expect } from 'vitest';
import {
  InviteSchema,
  Invite,
  InviteIdSchema,
  InviteStatusSchema,
  generateInviteId,
  parseInvite,
  safeParseInvite,
} from '../invite.js';

describe('InviteIdSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  it('accepts valid ULID', () => {
    const result = InviteIdSchema.safeParse(validUlid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid ULID', () => {
    const result = InviteIdSchema.safeParse('not-a-ulid');
    expect(result.success).toBe(false);
  });
});

describe('generateInviteId', () => {
  it('generates valid ULID', () => {
    const id = generateInviteId();
    const result = InviteIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set([generateInviteId(), generateInviteId(), generateInviteId()]);
    expect(ids.size).toBe(3);
  });
});

describe('InviteStatusSchema', () => {
  describe('valid statuses', () => {
    it('accepts pending status', () => {
      expect(InviteStatusSchema.safeParse('pending').success).toBe(true);
    });

    it('accepts accepted status', () => {
      expect(InviteStatusSchema.safeParse('accepted').success).toBe(true);
    });

    it('accepts expired status', () => {
      expect(InviteStatusSchema.safeParse('expired').success).toBe(true);
    });

    it('accepts revoked status', () => {
      expect(InviteStatusSchema.safeParse('revoked').success).toBe(true);
    });
  });

  describe('invalid statuses', () => {
    it('rejects unknown status', () => {
      expect(InviteStatusSchema.safeParse('cancelled').success).toBe(false);
    });

    it('rejects uppercase status', () => {
      expect(InviteStatusSchema.safeParse('PENDING').success).toBe(false);
    });

    it('rejects empty string', () => {
      expect(InviteStatusSchema.safeParse('').success).toBe(false);
    });
  });
});

describe('InviteSchema', () => {
  const validInvite = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    organizationId: '01BRZ3NDEKTSV4RRFFQ69G5FAV',
    email: 'user@example.com',
    role: 'member',
    status: 'pending',
    invitedById: '01CRZ3NDEKTSV4RRFFQ69G5FAV',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-01-22T10:30:00Z',
  };

  describe('valid invites', () => {
    it('accepts valid invite', () => {
      const result = InviteSchema.safeParse(validInvite);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.status).toBe('pending');
      }
    });

    it('accepts all statuses', () => {
      for (const status of ['pending', 'accepted', 'expired', 'revoked']) {
        const invite = { ...validInvite, status };
        expect(InviteSchema.safeParse(invite).success).toBe(true);
      }
    });

    it('accepts all roles', () => {
      for (const role of ['owner', 'admin', 'member', 'viewer']) {
        const invite = { ...validInvite, role };
        expect(InviteSchema.safeParse(invite).success).toBe(true);
      }
    });

    it('accepts invite with optional message', () => {
      const invite = { ...validInvite, message: 'Welcome to the team!' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });

    it('accepts invite with acceptedAt timestamp', () => {
      const invite = {
        ...validInvite,
        status: 'accepted',
        acceptedAt: '2024-01-16T10:30:00Z',
      };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });

    it('accepts invite with revokedAt timestamp', () => {
      const invite = {
        ...validInvite,
        status: 'revoked',
        revokedAt: '2024-01-16T10:30:00Z',
      };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });

    it('accepts invite with acceptedById', () => {
      const invite = {
        ...validInvite,
        status: 'accepted',
        acceptedById: '01DRZ3NDEKTSV4RRFFQ69G5FAV',
      };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(true);
    });

    it('accepts various valid email formats', () => {
      const emails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
      ];
      for (const email of emails) {
        const invite = { ...validInvite, email };
        expect(InviteSchema.safeParse(invite).success).toBe(true);
      }
    });
  });

  describe('invalid invites', () => {
    it('rejects invalid invite id', () => {
      const invite = { ...validInvite, id: 'not-a-ulid' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid organizationId', () => {
      const invite = { ...validInvite, organizationId: 'not-a-ulid' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const invite = { ...validInvite, email: 'not-an-email' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email missing domain', () => {
      const invite = { ...validInvite, email: 'user@' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid role', () => {
      const invite = { ...validInvite, role: 'superuser' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const invite = { ...validInvite, status: 'cancelled' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid invitedById', () => {
      const invite = { ...validInvite, invitedById: 'not-a-ulid' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects message too long (>500 chars)', () => {
      const invite = { ...validInvite, message: 'a'.repeat(501) };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const invite = { ...validInvite, createdAt: '2024-01-15' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects invalid acceptedById', () => {
      const invite = { ...validInvite, acceptedById: 'not-a-ulid' };
      const result = InviteSchema.safeParse(invite);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(InviteSchema.safeParse({}).success).toBe(false);
      expect(InviteSchema.safeParse({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = Invite.V1.safeParse(validInvite);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = Invite.getVersion('v1');
      const result = schema.safeParse(validInvite);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(Invite.Latest).toBe(Invite.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseInvite returns valid invite', () => {
      const invite = parseInvite(validInvite);
      expect(invite.email).toBe(validInvite.email);
    });

    it('parseInvite throws on invalid data', () => {
      expect(() => parseInvite({})).toThrow();
    });

    it('safeParseInvite returns success result', () => {
      const result = safeParseInvite(validInvite);
      expect(result.success).toBe(true);
    });

    it('safeParseInvite returns failure result', () => {
      const result = safeParseInvite({});
      expect(result.success).toBe(false);
    });
  });
});
