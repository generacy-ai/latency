import { describe, it, expect } from 'vitest';
import {
  DecisionQueueFilterSchema,
  DecisionQueueFilter,
  DecisionUrgencySchema,
  DecisionStatusSchema,
  DateRangeSchema,
  parseDecisionQueueFilter,
  safeParseDecisionQueueFilter,
} from '../decision-queue/filter.js';

describe('DecisionUrgencySchema', () => {
  it('accepts valid urgency levels', () => {
    expect(DecisionUrgencySchema.safeParse('critical').success).toBe(true);
    expect(DecisionUrgencySchema.safeParse('high').success).toBe(true);
    expect(DecisionUrgencySchema.safeParse('normal').success).toBe(true);
    expect(DecisionUrgencySchema.safeParse('low').success).toBe(true);
  });

  it('rejects invalid urgency levels', () => {
    expect(DecisionUrgencySchema.safeParse('urgent').success).toBe(false);
    expect(DecisionUrgencySchema.safeParse('CRITICAL').success).toBe(false);
    expect(DecisionUrgencySchema.safeParse('').success).toBe(false);
  });
});

describe('DecisionStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(DecisionStatusSchema.safeParse('pending').success).toBe(true);
    expect(DecisionStatusSchema.safeParse('in_progress').success).toBe(true);
    expect(DecisionStatusSchema.safeParse('resolved').success).toBe(true);
    expect(DecisionStatusSchema.safeParse('deferred').success).toBe(true);
    expect(DecisionStatusSchema.safeParse('expired').success).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(DecisionStatusSchema.safeParse('open').success).toBe(false);
    expect(DecisionStatusSchema.safeParse('closed').success).toBe(false);
    expect(DecisionStatusSchema.safeParse('PENDING').success).toBe(false);
  });
});

describe('DateRangeSchema', () => {
  const validTimestamp = '2024-01-15T10:30:00Z';
  const laterTimestamp = '2024-01-20T10:30:00Z';

  it('accepts valid date range', () => {
    const result = DateRangeSchema.safeParse({
      from: validTimestamp,
      to: laterTimestamp,
    });
    expect(result.success).toBe(true);
  });

  it('accepts from-only range', () => {
    const result = DateRangeSchema.safeParse({
      from: validTimestamp,
    });
    expect(result.success).toBe(true);
  });

  it('accepts to-only range', () => {
    const result = DateRangeSchema.safeParse({
      to: laterTimestamp,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty range', () => {
    const result = DateRangeSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts same from and to', () => {
    const result = DateRangeSchema.safeParse({
      from: validTimestamp,
      to: validTimestamp,
    });
    expect(result.success).toBe(true);
  });

  it('rejects from after to', () => {
    const result = DateRangeSchema.safeParse({
      from: laterTimestamp,
      to: validTimestamp,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp format', () => {
    const result = DateRangeSchema.safeParse({
      from: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('DecisionQueueFilterSchema', () => {
  describe('valid filters', () => {
    it('accepts empty filter (all defaults)', () => {
      const result = DecisionQueueFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('accepts filter with projectId', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        projectId: 'proj_abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with single urgency', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        urgency: ['critical'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with multiple urgencies', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        urgency: ['critical', 'high', 'normal'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with domains', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        domains: ['architecture', 'security', 'performance'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with assignedTo', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        assignedTo: 'user_abc123',
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with statuses', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        status: ['pending', 'in_progress'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with date range', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        dateRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-12-31T23:59:59Z',
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts filter with custom pagination', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        limit: 25,
        offset: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(50);
      }
    });

    it('accepts complex filter with all fields', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        projectId: 'proj_abc12345',
        urgency: ['critical', 'high'],
        domains: ['architecture', 'security'],
        assignedTo: 'user_abc123',
        status: ['pending'],
        dateRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-06-30T23:59:59Z',
        },
        limit: 10,
        offset: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid filters', () => {
    it('rejects empty projectId', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        projectId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid urgency value', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        urgency: ['invalid'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty domain string', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        domains: [''],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status value', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        status: ['open'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects limit below 1', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        limit: 0,
      });
      expect(result.success).toBe(false);
    });

    it('rejects limit above 100', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative offset', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        offset: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date range', () => {
      const result = DecisionQueueFilterSchema.safeParse({
        dateRange: {
          from: '2024-12-31T23:59:59Z',
          to: '2024-01-01T00:00:00Z',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = DecisionQueueFilter.V1.safeParse({ urgency: ['critical'] });
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = DecisionQueueFilter.getVersion('v1');
      const result = schema.safeParse({ status: ['pending'] });
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(DecisionQueueFilter.Latest).toBe(DecisionQueueFilter.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseDecisionQueueFilter returns valid filter', () => {
      const filter = parseDecisionQueueFilter({ projectId: 'proj_123' });
      expect(filter.projectId).toBe('proj_123');
    });

    it('parseDecisionQueueFilter throws on invalid data', () => {
      expect(() => parseDecisionQueueFilter({ limit: 0 })).toThrow();
    });

    it('safeParseDecisionQueueFilter returns success result', () => {
      const result = safeParseDecisionQueueFilter({ domains: ['test'] });
      expect(result.success).toBe(true);
    });

    it('safeParseDecisionQueueFilter returns failure result', () => {
      const result = safeParseDecisionQueueFilter({ urgency: ['invalid'] });
      expect(result.success).toBe(false);
    });
  });
});
