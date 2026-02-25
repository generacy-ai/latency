import { describe, it, expect } from 'vitest';
import {
  DisclosedIdentitySchema,
  LeaderboardEntrySchema,
  parseDisclosedIdentity,
  safeParseDisclosedIdentity,
  parseLeaderboardEntry,
  safeParseLeaderboardEntry,
} from '../leaderboard-entry.js';

describe('DisclosedIdentitySchema', () => {
  describe('valid shapes', () => {
    it('accepts empty object', () => {
      const result = DisclosedIdentitySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('accepts name only', () => {
      const result = DisclosedIdentitySchema.safeParse({
        name: 'Jane Doe',
      });
      expect(result.success).toBe(true);
    });

    it('accepts all fields', () => {
      const result = DisclosedIdentitySchema.safeParse({
        name: 'Jane Doe',
        linkedIn: 'https://linkedin.com/in/janedoe',
        portfolio: 'https://janedoe.dev',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = DisclosedIdentitySchema.safeParse({
        name: 'Jane',
        twitter: '@jane', // unknown but allowed
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['twitter']).toBe('@jane');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty name', () => {
      const result = DisclosedIdentitySchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid linkedIn URL', () => {
      const result = DisclosedIdentitySchema.safeParse({
        linkedIn: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid portfolio URL', () => {
      const result = DisclosedIdentitySchema.safeParse({
        portfolio: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('LeaderboardEntrySchema', () => {
  const validEntry = {
    anonymousId: 'anon_hash_abc123',
    domain: 'content_moderation',
    protegeAccuracy: 0.92,
    decisionsProcessed: 1250,
    percentile: 87.5,
  };

  describe('valid shapes', () => {
    it('accepts valid entry without disclosure', () => {
      const result = LeaderboardEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('accepts valid entry with disclosure', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        disclosed: {
          name: 'Jane Doe',
          linkedIn: 'https://linkedin.com/in/janedoe',
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts boundary protegeAccuracy values', () => {
      expect(LeaderboardEntrySchema.safeParse({ ...validEntry, protegeAccuracy: 0 }).success).toBe(true);
      expect(LeaderboardEntrySchema.safeParse({ ...validEntry, protegeAccuracy: 1 }).success).toBe(true);
    });

    it('accepts boundary percentile values', () => {
      expect(LeaderboardEntrySchema.safeParse({ ...validEntry, percentile: 0 }).success).toBe(true);
      expect(LeaderboardEntrySchema.safeParse({ ...validEntry, percentile: 100 }).success).toBe(true);
    });

    it('accepts zero decisions processed', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        decisionsProcessed: 0,
      });
      expect(result.success).toBe(true);
    });

    it('accepts decimal percentile', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        percentile: 87.5,
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty anonymousId', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        anonymousId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty domain', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        domain: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects protegeAccuracy below 0', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        protegeAccuracy: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects protegeAccuracy above 1', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        protegeAccuracy: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative decisionsProcessed', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        decisionsProcessed: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer decisionsProcessed', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        decisionsProcessed: 1250.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects percentile below 0', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        percentile: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects percentile above 100', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        percentile: 101,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid disclosed identity', () => {
      const result = LeaderboardEntrySchema.safeParse({
        ...validEntry,
        disclosed: {
          linkedIn: 'not-a-url',
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseDisclosedIdentity returns parsed data', () => {
      const result = parseDisclosedIdentity({
        name: 'Jane',
        linkedIn: 'https://linkedin.com/in/jane',
      });
      expect(result.name).toBe('Jane');
    });

    it('safeParseDisclosedIdentity handles invalid data', () => {
      const result = safeParseDisclosedIdentity({ linkedIn: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('parseLeaderboardEntry returns parsed data', () => {
      const result = parseLeaderboardEntry(validEntry);
      expect(result.anonymousId).toBe('anon_hash_abc123');
      expect(result.percentile).toBe(87.5);
    });

    it('parseLeaderboardEntry throws on invalid data', () => {
      expect(() => parseLeaderboardEntry({ anonymousId: '' })).toThrow();
    });

    it('safeParseLeaderboardEntry returns success result', () => {
      const result = safeParseLeaderboardEntry(validEntry);
      expect(result.success).toBe(true);
    });

    it('safeParseLeaderboardEntry returns error result for invalid data', () => {
      const result = safeParseLeaderboardEntry({ anonymousId: '' });
      expect(result.success).toBe(false);
    });
  });
});
