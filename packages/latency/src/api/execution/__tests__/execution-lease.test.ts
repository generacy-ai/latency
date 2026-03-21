import { describe, it, expect } from 'vitest';
import {
  ExecutionLeaseSchema,
  ExecutionLease,
  LeaseStatusSchema,
  parseExecutionLease,
  safeParseExecutionLease,
} from '../execution-lease.js';

describe('LeaseStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(LeaseStatusSchema.safeParse('active').success).toBe(true);
    expect(LeaseStatusSchema.safeParse('releasing').success).toBe(true);
  });

  it('rejects invalid status values', () => {
    expect(LeaseStatusSchema.safeParse('expired').success).toBe(false);
    expect(LeaseStatusSchema.safeParse('ACTIVE').success).toBe(false);
    expect(LeaseStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('ExecutionLeaseSchema', () => {
  const validLease = {
    id: '01HQVJ5KWXYZ1234567890ABCD',
    clusterId: '01HQVJ5KWXYZ1234567890EFGH',
    queueItemId: 'qi-123',
    jobId: 'job-456',
    status: 'active',
    grantedAt: '2024-01-15T10:30:00Z',
    lastHeartbeat: '2024-01-15T10:35:00Z',
    ttlSeconds: 90,
  };

  describe('valid leases', () => {
    it('accepts valid lease with all required fields', () => {
      const result = ExecutionLeaseSchema.safeParse(validLease);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
        expect(result.data.ttlSeconds).toBe(90);
      }
    });

    it('accepts lease with releasing status', () => {
      const lease = { ...validLease, status: 'releasing' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(true);
    });

    it('accepts lease where lastHeartbeat equals grantedAt', () => {
      const lease = { ...validLease, lastHeartbeat: '2024-01-15T10:30:00Z' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(true);
    });

    it('defaults ttlSeconds to 90 when omitted', () => {
      const { ttlSeconds, ...leaseWithoutTtl } = validLease;
      const result = ExecutionLeaseSchema.safeParse(leaseWithoutTtl);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ttlSeconds).toBe(90);
      }
    });
  });

  describe('invalid fields', () => {
    it('rejects empty queueItemId', () => {
      const lease = { ...validLease, queueItemId: '' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects empty jobId', () => {
      const lease = { ...validLease, jobId: '' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ULID for id', () => {
      const lease = { ...validLease, id: 'invalid-id' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ULID for clusterId', () => {
      const lease = { ...validLease, clusterId: 'invalid-cluster' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const lease = { ...validLease, grantedAt: '2024-01-15' };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects non-positive ttlSeconds', () => {
      const lease = { ...validLease, ttlSeconds: 0 };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects negative ttlSeconds', () => {
      const lease = { ...validLease, ttlSeconds: -10 };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer ttlSeconds', () => {
      const lease = { ...validLease, ttlSeconds: 90.5 };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(ExecutionLeaseSchema.safeParse({}).success).toBe(false);
      expect(ExecutionLeaseSchema.safeParse({ id: validLease.id }).success).toBe(false);
    });
  });

  describe('cross-field validation', () => {
    it('rejects lastHeartbeat before grantedAt', () => {
      const lease = {
        ...validLease,
        grantedAt: '2024-01-15T10:35:00Z',
        lastHeartbeat: '2024-01-15T10:30:00Z',
      };
      const result = ExecutionLeaseSchema.safeParse(lease);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('lastHeartbeat must be >= grantedAt');
      }
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = ExecutionLease.V1.safeParse(validLease);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = ExecutionLease.getVersion('v1');
      const result = schema.safeParse(validLease);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(ExecutionLease.Latest).toBe(ExecutionLease.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseExecutionLease returns valid lease', () => {
      const lease = parseExecutionLease(validLease);
      expect(lease.status).toBe(validLease.status);
    });

    it('parseExecutionLease throws on invalid data', () => {
      expect(() => parseExecutionLease({})).toThrow();
    });

    it('safeParseExecutionLease returns success result', () => {
      const result = safeParseExecutionLease(validLease);
      expect(result.success).toBe(true);
    });

    it('safeParseExecutionLease returns failure result', () => {
      const result = safeParseExecutionLease({});
      expect(result.success).toBe(false);
    });
  });
});
