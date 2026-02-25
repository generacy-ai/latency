import { describe, it, expect } from 'vitest';
import {
  ProgressivePermissionRequest,
  ProgressivePermissionRequestSchema,
  PermissionRequestIdSchema,
  InstallationIdSchema,
  PermissionRequestStatusSchema,
  generatePermissionRequestId,
  parseProgressivePermissionRequest,
  safeParseProgressivePermissionRequest,
  type PermissionRequestId,
} from '../progressive-permission.js';

describe('PermissionRequestIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = PermissionRequestIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(PermissionRequestIdSchema.safeParse('invalid').success).toBe(false);
    expect(PermissionRequestIdSchema.safeParse('').success).toBe(false);
    expect(PermissionRequestIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FA').success).toBe(false); // too short
    expect(PermissionRequestIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAVO').success).toBe(false); // too long
  });
});

describe('generatePermissionRequestId', () => {
  it('generates valid ULID', () => {
    const id = generatePermissionRequestId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    // Should be parseable
    const result = PermissionRequestIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generatePermissionRequestId();
    const id2 = generatePermissionRequestId();
    expect(id1).not.toBe(id2);
  });
});

describe('InstallationIdSchema', () => {
  it('accepts valid numeric string', () => {
    expect(InstallationIdSchema.safeParse('12345678').success).toBe(true);
    expect(InstallationIdSchema.safeParse('1').success).toBe(true);
    expect(InstallationIdSchema.safeParse('999999999').success).toBe(true);
  });

  it('rejects non-numeric strings', () => {
    expect(InstallationIdSchema.safeParse('abc').success).toBe(false);
    expect(InstallationIdSchema.safeParse('12.34').success).toBe(false);
    expect(InstallationIdSchema.safeParse('').success).toBe(false);
    expect(InstallationIdSchema.safeParse('12 34').success).toBe(false);
  });
});

describe('PermissionRequestStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(PermissionRequestStatusSchema.safeParse('pending').success).toBe(true);
    expect(PermissionRequestStatusSchema.safeParse('approved').success).toBe(true);
    expect(PermissionRequestStatusSchema.safeParse('denied').success).toBe(true);
    expect(PermissionRequestStatusSchema.safeParse('expired').success).toBe(true);
    expect(PermissionRequestStatusSchema.safeParse('revoked').success).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(PermissionRequestStatusSchema.safeParse('invalid').success).toBe(false);
    expect(PermissionRequestStatusSchema.safeParse('PENDING').success).toBe(false);
    expect(PermissionRequestStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('ProgressivePermissionRequestSchema', () => {
  const validRequest = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    installationId: '12345678',
    scopes: [
      { category: 'repo', level: 'write' },
      { category: 'actions', level: 'write' },
    ],
    reason: 'Required for automated workflow creation',
    featureUnlocked: 'workflow-automation',
    status: 'pending',
    requestedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid requests', () => {
    it('accepts valid permission request', () => {
      const result = ProgressivePermissionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.installationId).toBe('12345678');
        expect(result.data.scopes).toHaveLength(2);
        expect(result.data.status).toBe('pending');
      }
    });

    it('accepts approved request with resolution details', () => {
      const approvedRequest = {
        ...validRequest,
        status: 'approved',
        resolvedAt: '2024-01-15T11:30:00Z',
        resolvedBy: 'user123',
        notes: 'Approved after security review',
      };
      const result = ProgressivePermissionRequestSchema.safeParse(approvedRequest);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resolvedAt).toBe('2024-01-15T11:30:00Z');
        expect(result.data.resolvedBy).toBe('user123');
      }
    });

    it('accepts request with single scope', () => {
      const singleScopeRequest = {
        ...validRequest,
        scopes: [{ category: 'repo', level: 'read' }],
      };
      const result = ProgressivePermissionRequestSchema.safeParse(singleScopeRequest);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid requests', () => {
    it('rejects empty scopes array', () => {
      const request = { ...validRequest, scopes: [] };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects empty reason', () => {
      const request = { ...validRequest, reason: '' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects reason that is too long', () => {
      const request = { ...validRequest, reason: 'x'.repeat(501) };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects empty featureUnlocked', () => {
      const request = { ...validRequest, featureUnlocked: '' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const request = { ...validRequest, status: 'invalid' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ID format', () => {
      const request = { ...validRequest, id: 'invalid' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects invalid installation ID', () => {
      const request = { ...validRequest, installationId: 'not-a-number' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
      const request = { ...validRequest, requestedAt: 'invalid' };
      const result = ProgressivePermissionRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(ProgressivePermissionRequestSchema.safeParse({}).success).toBe(false);
      expect(ProgressivePermissionRequestSchema.safeParse({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = ProgressivePermissionRequest.V1.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = ProgressivePermissionRequest.getVersion('v1');
      const result = schema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(ProgressivePermissionRequest.Latest).toBe(ProgressivePermissionRequest.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseProgressivePermissionRequest returns valid request', () => {
      const request = parseProgressivePermissionRequest(validRequest);
      expect(request.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseProgressivePermissionRequest throws on invalid data', () => {
      expect(() => parseProgressivePermissionRequest({})).toThrow();
    });

    it('safeParseProgressivePermissionRequest returns success result', () => {
      const result = safeParseProgressivePermissionRequest(validRequest);
      expect(result.success).toBe(true);
    });

    it('safeParseProgressivePermissionRequest returns failure result', () => {
      const result = safeParseProgressivePermissionRequest({});
      expect(result.success).toBe(false);
    });
  });
});
