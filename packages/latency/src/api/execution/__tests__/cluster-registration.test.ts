import { describe, it, expect } from 'vitest';
import {
  ClusterRegistrationSchema,
  ClusterRegistration,
  ClusterStatusSchema,
  WorkersSchema,
  parseClusterRegistration,
  safeParseClusterRegistration,
} from '../cluster-registration.js';

describe('ClusterStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(ClusterStatusSchema.safeParse('connected').success).toBe(true);
    expect(ClusterStatusSchema.safeParse('disconnected').success).toBe(true);
  });

  it('rejects invalid status values', () => {
    expect(ClusterStatusSchema.safeParse('offline').success).toBe(false);
    expect(ClusterStatusSchema.safeParse('CONNECTED').success).toBe(false);
    expect(ClusterStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('WorkersSchema', () => {
  it('accepts valid worker counts', () => {
    const result = WorkersSchema.safeParse({ total: 10, busy: 3, idle: 5 });
    expect(result.success).toBe(true);
  });

  it('accepts zero workers', () => {
    const result = WorkersSchema.safeParse({ total: 0, busy: 0, idle: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects negative worker counts', () => {
    expect(WorkersSchema.safeParse({ total: -1, busy: 0, idle: 0 }).success).toBe(false);
    expect(WorkersSchema.safeParse({ total: 10, busy: -1, idle: 0 }).success).toBe(false);
    expect(WorkersSchema.safeParse({ total: 10, busy: 0, idle: -1 }).success).toBe(false);
  });

  it('rejects non-integer worker counts', () => {
    expect(WorkersSchema.safeParse({ total: 10.5, busy: 0, idle: 0 }).success).toBe(false);
  });
});

describe('ClusterRegistrationSchema', () => {
  const validRegistration = {
    id: '01HQVJ5KWXYZ1234567890ABCD',
    projectId: 'proj-789',
    status: 'connected',
    connectedAt: '2024-01-15T10:30:00Z',
    lastSeen: '2024-01-15T10:35:00Z',
    workers: { total: 10, busy: 3, idle: 5 },
    orchestratorVersion: '1.2.3',
  };

  describe('valid registrations', () => {
    it('accepts valid registration with all required fields', () => {
      const result = ClusterRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('connected');
        expect(result.data.workers.total).toBe(10);
      }
    });

    it('accepts disconnected status', () => {
      const registration = { ...validRegistration, status: 'disconnected' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    it('accepts registration where lastSeen equals connectedAt', () => {
      const registration = { ...validRegistration, lastSeen: '2024-01-15T10:30:00Z' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    it('accepts registration with all workers busy', () => {
      const registration = {
        ...validRegistration,
        workers: { total: 10, busy: 10, idle: 0 },
      };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    it('accepts registration with all workers idle', () => {
      const registration = {
        ...validRegistration,
        workers: { total: 10, busy: 0, idle: 10 },
      };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    it('accepts semver with prerelease tag', () => {
      const registration = { ...validRegistration, orchestratorVersion: '1.2.3-beta.1' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });

    it('accepts semver with build metadata', () => {
      const registration = { ...validRegistration, orchestratorVersion: '1.2.3+build.456' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });
  });

  describe('worker count cross-field validation', () => {
    it('rejects busy + idle exceeding total', () => {
      const registration = {
        ...validRegistration,
        workers: { total: 10, busy: 6, idle: 6 },
      };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('busy + idle workers cannot exceed total');
      }
    });

    it('accepts busy + idle equal to total', () => {
      const registration = {
        ...validRegistration,
        workers: { total: 10, busy: 4, idle: 6 },
      };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid fields', () => {
    it('rejects invalid ULID for id', () => {
      const registration = { ...validRegistration, id: 'invalid-id' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    it('rejects empty projectId', () => {
      const registration = { ...validRegistration, projectId: '' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const registration = { ...validRegistration, status: 'pending' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const registration = { ...validRegistration, connectedAt: '2024-01-15' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    it('rejects invalid semver format', () => {
      const registration = { ...validRegistration, orchestratorVersion: 'v1.2' };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(ClusterRegistrationSchema.safeParse({}).success).toBe(false);
      expect(ClusterRegistrationSchema.safeParse({ id: validRegistration.id }).success).toBe(false);
    });
  });

  describe('timestamp cross-field validation', () => {
    it('rejects lastSeen before connectedAt', () => {
      const registration = {
        ...validRegistration,
        connectedAt: '2024-01-15T10:35:00Z',
        lastSeen: '2024-01-15T10:30:00Z',
      };
      const result = ClusterRegistrationSchema.safeParse(registration);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('lastSeen must be >= connectedAt');
      }
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = ClusterRegistration.V1.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = ClusterRegistration.getVersion('v1');
      const result = schema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(ClusterRegistration.Latest).toBe(ClusterRegistration.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseClusterRegistration returns valid registration', () => {
      const registration = parseClusterRegistration(validRegistration);
      expect(registration.status).toBe(validRegistration.status);
    });

    it('parseClusterRegistration throws on invalid data', () => {
      expect(() => parseClusterRegistration({})).toThrow();
    });

    it('safeParseClusterRegistration returns success result', () => {
      const result = safeParseClusterRegistration(validRegistration);
      expect(result.success).toBe(true);
    });

    it('safeParseClusterRegistration returns failure result', () => {
      const result = safeParseClusterRegistration({});
      expect(result.success).toBe(false);
    });
  });
});
