import { describe, it, expect } from 'vitest';
import {
  CorrelationIdSchema,
  RequestIdSchema,
  SessionIdSchema,
  generateCorrelationId,
  generateRequestId,
  generateSessionId,
} from '../../../src/protocols/common/ids.js';

describe('ID Schemas', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  describe('CorrelationIdSchema', () => {
    it('accepts valid ULID', () => {
      const result = CorrelationIdSchema.safeParse(validUlid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid ULID (too short)', () => {
      const result = CorrelationIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FA');
      expect(result.success).toBe(false);
    });

    it('rejects invalid ULID (invalid characters)', () => {
      const result = CorrelationIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAL'); // L is invalid
      expect(result.success).toBe(false);
    });

    it('rejects non-string values', () => {
      const result = CorrelationIdSchema.safeParse(12345);
      expect(result.success).toBe(false);
    });
  });

  describe('RequestIdSchema', () => {
    it('accepts valid ULID', () => {
      const result = RequestIdSchema.safeParse(validUlid);
      expect(result.success).toBe(true);
    });
  });

  describe('SessionIdSchema', () => {
    it('accepts valid ULID', () => {
      const result = SessionIdSchema.safeParse(validUlid);
      expect(result.success).toBe(true);
    });
  });
});

describe('ID Generation', () => {
  describe('generateCorrelationId', () => {
    it('generates valid ULID', () => {
      const id = generateCorrelationId();
      const result = CorrelationIdSchema.safeParse(id);
      expect(result.success).toBe(true);
    });

    it('generates unique IDs', () => {
      const ids = new Set([
        generateCorrelationId(),
        generateCorrelationId(),
        generateCorrelationId(),
      ]);
      expect(ids.size).toBe(3);
    });
  });

  describe('generateRequestId', () => {
    it('generates valid ULID', () => {
      const id = generateRequestId();
      const result = RequestIdSchema.safeParse(id);
      expect(result.success).toBe(true);
    });
  });

  describe('generateSessionId', () => {
    it('generates valid ULID', () => {
      const id = generateSessionId();
      const result = SessionIdSchema.safeParse(id);
      expect(result.success).toBe(true);
    });
  });
});
