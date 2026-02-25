import { describe, it, expect } from 'vitest';
import {
  QueueStatusSchema,
  parseQueueStatus,
  safeParseQueueStatus,
} from '../queue-status.js';

describe('QueueStatusSchema', () => {
  describe('valid data parsing', () => {
    it('accepts full object with all fields', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        oldestPending: '2024-01-15T10:30:00Z',
        averageWaitTime: 45.5,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('accepts minimal object with only required fields', () => {
      const data = {
        blockingNow: 0,
        blockingSoon: 0,
        whenAvailable: 0,
        total: 0,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(data);
      }
    });

    it('accepts zero values for all integer fields', () => {
      const data = {
        blockingNow: 0,
        blockingSoon: 0,
        whenAvailable: 0,
        total: 0,
        averageWaitTime: 0,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data rejection', () => {
    it('rejects missing blockingNow', () => {
      const data = {
        blockingSoon: 10,
        whenAvailable: 3,
        total: 13,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing blockingSoon', () => {
      const data = {
        blockingNow: 5,
        whenAvailable: 3,
        total: 8,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing whenAvailable', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        total: 15,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects missing total', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative blockingNow', () => {
      const data = {
        blockingNow: -1,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 12,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative blockingSoon', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: -5,
        whenAvailable: 3,
        total: 3,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative whenAvailable', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: -2,
        total: 13,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative total', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: -18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative averageWaitTime', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        averageWaitTime: -10.5,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer blockingNow', () => {
      const data = {
        blockingNow: 5.5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer blockingSoon', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10.7,
        whenAvailable: 3,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer whenAvailable', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3.14,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-integer total', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18.999,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-number values for counts', () => {
      const data = {
        blockingNow: '5',
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid ISO timestamp for oldestPending', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        oldestPending: 'not-a-timestamp',
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects non-string oldestPending', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        oldestPending: 12345,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('strip behavior', () => {
    it('strips unknown properties', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        unknownField: 'should be removed',
        anotherExtra: 42,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('unknownField');
        expect(result.data).not.toHaveProperty('anotherExtra');
        expect(Object.keys(result.data)).toHaveLength(4);
      }
    });
  });

  describe('optional field handling', () => {
    it('accepts oldestPending when provided', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        oldestPending: '2024-01-15T10:30:00.123Z',
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.oldestPending).toBe('2024-01-15T10:30:00.123Z');
      }
    });

    it('accepts oldestPending with timezone offset', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        oldestPending: '2024-01-15T10:30:00+05:30',
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts averageWaitTime when provided', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
        averageWaitTime: 120.75,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.averageWaitTime).toBe(120.75);
      }
    });

    it('does not include oldestPending when omitted', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('oldestPending');
      }
    });

    it('does not include averageWaitTime when omitted', () => {
      const data = {
        blockingNow: 5,
        blockingSoon: 10,
        whenAvailable: 3,
        total: 18,
      };
      const result = QueueStatusSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty('averageWaitTime');
      }
    });
  });
});

describe('parseQueueStatus', () => {
  it('returns parsed data for valid input', () => {
    const data = {
      blockingNow: 5,
      blockingSoon: 10,
      whenAvailable: 3,
      total: 18,
    };
    const result = parseQueueStatus(data);
    expect(result).toEqual(data);
  });

  it('throws for invalid input', () => {
    const data = {
      blockingNow: -1,
      blockingSoon: 10,
      whenAvailable: 3,
      total: 12,
    };
    expect(() => parseQueueStatus(data)).toThrow();
  });
});

describe('safeParseQueueStatus', () => {
  it('returns success result for valid input', () => {
    const data = {
      blockingNow: 5,
      blockingSoon: 10,
      whenAvailable: 3,
      total: 18,
    };
    const result = safeParseQueueStatus(data);
    expect(result.success).toBe(true);
  });

  it('returns error result for invalid input', () => {
    const data = {
      blockingNow: 'not a number',
      blockingSoon: 10,
      whenAvailable: 3,
      total: 18,
    };
    const result = safeParseQueueStatus(data);
    expect(result.success).toBe(false);
  });
});
