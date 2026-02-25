import { describe, it, expect } from 'vitest';
import {
  IntegrationStatusSchema,
  IntegrationStatusTypeSchema,
  IntegrationStatusType,
  parseIntegrationStatus,
  safeParseIntegrationStatus,
} from '../../../src/protocols/generacy-humancy/integration-status.js';

describe('IntegrationStatusTypeSchema', () => {
  it('accepts "connected"', () => {
    const result = IntegrationStatusTypeSchema.safeParse('connected');
    expect(result.success).toBe(true);
  });

  it('accepts "disconnected"', () => {
    const result = IntegrationStatusTypeSchema.safeParse('disconnected');
    expect(result.success).toBe(true);
  });

  it('accepts "error"', () => {
    const result = IntegrationStatusTypeSchema.safeParse('error');
    expect(result.success).toBe(true);
  });

  it('accepts "degraded"', () => {
    const result = IntegrationStatusTypeSchema.safeParse('degraded');
    expect(result.success).toBe(true);
  });

  it('rejects invalid status value', () => {
    const result = IntegrationStatusTypeSchema.safeParse('unknown');
    expect(result.success).toBe(false);
  });

  it('rejects non-string values', () => {
    const result = IntegrationStatusTypeSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});

describe('IntegrationStatusSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00.000Z';

  describe('valid data parsing', () => {
    it('parses full object with all fields', () => {
      const data = {
        service: 'database',
        status: 'connected',
        lastSync: validTimestamp,
        errorMessage: 'Previous connection failed',
        metadata: { host: 'localhost', port: 5432 },
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.service).toBe('database');
        expect(result.data.status).toBe('connected');
        expect(result.data.lastSync).toBe(validTimestamp);
        expect(result.data.errorMessage).toBe('Previous connection failed');
        expect(result.data.metadata).toEqual({ host: 'localhost', port: 5432 });
      }
    });

    it('parses minimal object with only required fields', () => {
      const data = {
        service: 'api-gateway',
        status: 'disconnected',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.service).toBe('api-gateway');
        expect(result.data.status).toBe('disconnected');
        expect(result.data.lastSync).toBeUndefined();
        expect(result.data.errorMessage).toBeUndefined();
        expect(result.data.metadata).toBeUndefined();
      }
    });
  });

  describe('invalid data rejection', () => {
    it('rejects missing service field', () => {
      const data = {
        status: 'connected',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing status field', () => {
      const data = {
        service: 'database',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty service string', () => {
      const data = {
        service: '',
        status: 'connected',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects wrong enum value for status', () => {
      const data = {
        service: 'database',
        status: 'active',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format for lastSync', () => {
      const data = {
        service: 'database',
        status: 'connected',
        lastSync: 'not-a-timestamp',
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('strip behavior', () => {
    it('removes extra unknown properties', () => {
      const data = {
        service: 'cache',
        status: 'degraded',
        unknownField: 'should be stripped',
        anotherExtra: 12345,
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherExtra');
        expect(Object.keys(result.data)).toEqual(['service', 'status']);
      }
    });
  });

  describe('metadata passthrough', () => {
    it('accepts Record<string, unknown> with various value types', () => {
      const data = {
        service: 'message-queue',
        status: 'connected',
        metadata: {
          stringValue: 'test',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
          arrayValue: [1, 2, 3],
          nestedObject: { inner: 'value' },
        },
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({
          stringValue: 'test',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
          arrayValue: [1, 2, 3],
          nestedObject: { inner: 'value' },
        });
      }
    });

    it('accepts empty metadata object', () => {
      const data = {
        service: 'service',
        status: 'connected',
        metadata: {},
      };

      const result = IntegrationStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.metadata).toEqual({});
      }
    });
  });

  describe('optional field handling', () => {
    it('handles lastSync as optional', () => {
      const withLastSync = {
        service: 'db',
        status: 'connected',
        lastSync: validTimestamp,
      };

      const withoutLastSync = {
        service: 'db',
        status: 'connected',
      };

      const resultWith = IntegrationStatusSchema.safeParse(withLastSync);
      const resultWithout = IntegrationStatusSchema.safeParse(withoutLastSync);

      expect(resultWith.success).toBe(true);
      expect(resultWithout.success).toBe(true);
      if (resultWith.success && resultWithout.success) {
        expect(resultWith.data.lastSync).toBe(validTimestamp);
        expect(resultWithout.data.lastSync).toBeUndefined();
      }
    });

    it('handles errorMessage as optional', () => {
      const withError = {
        service: 'api',
        status: 'error',
        errorMessage: 'Connection timeout',
      };

      const withoutError = {
        service: 'api',
        status: 'error',
      };

      const resultWith = IntegrationStatusSchema.safeParse(withError);
      const resultWithout = IntegrationStatusSchema.safeParse(withoutError);

      expect(resultWith.success).toBe(true);
      expect(resultWithout.success).toBe(true);
      if (resultWith.success && resultWithout.success) {
        expect(resultWith.data.errorMessage).toBe('Connection timeout');
        expect(resultWithout.data.errorMessage).toBeUndefined();
      }
    });

    it('handles metadata as optional', () => {
      const withMetadata = {
        service: 'cache',
        status: 'degraded',
        metadata: { region: 'us-east-1' },
      };

      const withoutMetadata = {
        service: 'cache',
        status: 'degraded',
      };

      const resultWith = IntegrationStatusSchema.safeParse(withMetadata);
      const resultWithout = IntegrationStatusSchema.safeParse(withoutMetadata);

      expect(resultWith.success).toBe(true);
      expect(resultWithout.success).toBe(true);
      if (resultWith.success && resultWithout.success) {
        expect(resultWith.data.metadata).toEqual({ region: 'us-east-1' });
        expect(resultWithout.data.metadata).toBeUndefined();
      }
    });
  });
});

describe('parseIntegrationStatus', () => {
  it('returns parsed data for valid input', () => {
    const data = {
      service: 'database',
      status: 'connected',
    };

    const result = parseIntegrationStatus(data);
    expect(result.service).toBe('database');
    expect(result.status).toBe('connected');
  });

  it('throws error for invalid input', () => {
    const data = {
      service: 'database',
      status: 'invalid',
    };

    expect(() => parseIntegrationStatus(data)).toThrow();
  });
});

describe('safeParseIntegrationStatus', () => {
  it('returns success result for valid input', () => {
    const data = {
      service: 'api',
      status: 'disconnected',
    };

    const result = safeParseIntegrationStatus(data);
    expect(result.success).toBe(true);
  });

  it('returns failure result for invalid input', () => {
    const data = {
      service: '',
      status: 'connected',
    };

    const result = safeParseIntegrationStatus(data);
    expect(result.success).toBe(false);
  });
});

describe('IntegrationStatusType constant', () => {
  it('has correct enum values', () => {
    expect(IntegrationStatusType.CONNECTED).toBe('connected');
    expect(IntegrationStatusType.DISCONNECTED).toBe('disconnected');
    expect(IntegrationStatusType.ERROR).toBe('error');
    expect(IntegrationStatusType.DEGRADED).toBe('degraded');
  });
});
