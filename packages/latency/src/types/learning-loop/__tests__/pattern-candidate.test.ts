import { describe, it, expect } from 'vitest';
import {
  SuggestedPrincipleSchema,
  PatternCandidateSchema,
  parsePatternCandidate,
  safeParsePatternCandidate,
} from '../pattern-candidate.js';

describe('SuggestedPrincipleSchema', () => {
  const validPrinciple = {
    statement: 'Prefer managed services over self-hosted',
    domain: ['infrastructure', 'cloud'],
  };

  describe('valid shapes', () => {
    it('accepts valid suggested principle', () => {
      const result = SuggestedPrincipleSchema.safeParse(validPrinciple);
      expect(result.success).toBe(true);
    });

    it('accepts principle with single domain', () => {
      const result = SuggestedPrincipleSchema.safeParse({
        statement: 'Test principle',
        domain: ['testing'],
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = SuggestedPrincipleSchema.safeParse({
        ...validPrinciple,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty statement', () => {
      const result = SuggestedPrincipleSchema.safeParse({
        ...validPrinciple,
        statement: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty domain strings', () => {
      const result = SuggestedPrincipleSchema.safeParse({
        ...validPrinciple,
        domain: [''],
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('PatternCandidateSchema', () => {
  const validPattern = {
    id: 'pattern_abc12345',
    userId: 'user123',
    observation: 'Consistently chooses managed services',
    supportingDecisions: ['tld_abc12345', 'tld_def67890'],
    confidence: 0.85,
    status: 'detected' as const,
  };

  describe('valid shapes', () => {
    it('accepts minimal valid pattern', () => {
      const result = PatternCandidateSchema.safeParse(validPattern);
      expect(result.success).toBe(true);
    });

    it('accepts pattern with suggested principle', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        suggestedPrinciple: {
          statement: 'Prefer managed services',
          domain: ['infrastructure'],
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts pattern with user feedback when accepted', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        status: 'accepted',
        userFeedback: 'This accurately reflects my preference',
      });
      expect(result.success).toBe(true);
    });

    it('accepts confidence at boundaries', () => {
      expect(PatternCandidateSchema.safeParse({ ...validPattern, confidence: 0 }).success).toBe(
        true
      );
      expect(PatternCandidateSchema.safeParse({ ...validPattern, confidence: 1 }).success).toBe(
        true
      );
    });

    it('allows passthrough of unknown fields', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects fewer than 2 supporting decisions', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        supportingDecisions: ['tld_abc12345'],
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty supporting decisions', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        supportingDecisions: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence below 0', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        confidence: -0.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence above 1', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        confidence: 1.1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid id prefix', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        id: 'pat_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty observation', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        observation: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = PatternCandidateSchema.safeParse({
        ...validPattern,
        status: 'pending',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parsePatternCandidate returns valid data', () => {
      const result = parsePatternCandidate(validPattern);
      expect(result.id).toBe(validPattern.id);
      expect(result.confidence).toBe(0.85);
    });

    it('parsePatternCandidate throws on invalid data', () => {
      expect(() =>
        parsePatternCandidate({ ...validPattern, supportingDecisions: [] })
      ).toThrow();
    });

    it('safeParsePatternCandidate returns success for valid data', () => {
      const result = safeParsePatternCandidate(validPattern);
      expect(result.success).toBe(true);
    });

    it('safeParsePatternCandidate returns error for invalid data', () => {
      const result = safeParsePatternCandidate({
        ...validPattern,
        confidence: 2,
      });
      expect(result.success).toBe(false);
    });
  });
});
