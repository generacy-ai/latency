import { describe, it, expect } from 'vitest';
import {
  PrincipleSchema,
  EvidenceRecordSchema,
  ApplicabilitySchema,
  parsePrinciple,
  safeParsePrinciple,
  parseEvidenceRecord,
} from '../principle.js';

describe('EvidenceRecordSchema', () => {
  const validEvidence = {
    id: 'evd_abc12345',
    decisionId: 'decision_xyz',
    outcome: 'confirmed' as const,
    context: 'Chose simpler architecture, worked well',
    timestamp: new Date(),
  };

  describe('valid shapes', () => {
    it('accepts valid evidence record', () => {
      const result = EvidenceRecordSchema.safeParse(validEvidence);
      expect(result.success).toBe(true);
    });

    it('coerces string dates to Date objects', () => {
      const result = EvidenceRecordSchema.safeParse({
        ...validEvidence,
        timestamp: '2024-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.timestamp).toBeInstanceOf(Date);
      }
    });

    it('accepts all outcome types', () => {
      const outcomes = ['confirmed', 'contradicted', 'neutral'] as const;
      for (const outcome of outcomes) {
        const result = EvidenceRecordSchema.safeParse({ ...validEvidence, outcome });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = EvidenceRecordSchema.safeParse({
        ...validEvidence,
        id: 'pri_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid outcome', () => {
      const result = EvidenceRecordSchema.safeParse({
        ...validEvidence,
        outcome: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty decisionId', () => {
      const result = EvidenceRecordSchema.safeParse({
        ...validEvidence,
        decisionId: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('ApplicabilitySchema', () => {
  const validApplicability = {
    when: ['team size < 5', 'tight deadline'],
    unless: ['external API requirements'],
  };

  it('accepts valid applicability', () => {
    const result = ApplicabilitySchema.safeParse(validApplicability);
    expect(result.success).toBe(true);
  });

  it('accepts empty arrays', () => {
    const result = ApplicabilitySchema.safeParse({
      when: [],
      unless: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('PrincipleSchema', () => {
  const validPrinciple = {
    id: 'pri_abc12345',
    userId: 'user_123',
    domain: ['architecture', 'backend'],
    statement: 'Prefer fewer services unless compelling reason',
    rationale: 'Reduces operational complexity',
    applicability: {
      when: ['team size < 5'],
      unless: ['clear scaling requirements'],
    },
    evidence: [
      {
        id: 'evd_abc12345',
        decisionId: 'decision_xyz',
        outcome: 'confirmed' as const,
        context: 'Chose simpler architecture, worked well',
        timestamp: new Date(),
      },
    ],
    confidence: 0.85,
    learnedWeight: 0.9,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('valid shapes', () => {
    it('accepts valid principle', () => {
      const result = PrincipleSchema.safeParse(validPrinciple);
      expect(result.success).toBe(true);
    });

    it('accepts principle with conflictsWith', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        conflictsWith: ['pri_xyz12345'],
      });
      expect(result.success).toBe(true);
    });

    it('accepts all status values', () => {
      const statuses = ['active', 'deprecated', 'under_review'] as const;
      for (const status of statuses) {
        const result = PrincipleSchema.safeParse({ ...validPrinciple, status });
        expect(result.success).toBe(true);
      }
    });

    it('accepts empty evidence array', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        evidence: [],
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        id: 'phi_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects confidence outside range', () => {
      expect(PrincipleSchema.safeParse({ ...validPrinciple, confidence: -0.1 }).success).toBe(false);
      expect(PrincipleSchema.safeParse({ ...validPrinciple, confidence: 1.1 }).success).toBe(false);
    });

    it('rejects learnedWeight outside range', () => {
      expect(PrincipleSchema.safeParse({ ...validPrinciple, learnedWeight: -0.1 }).success).toBe(false);
      expect(PrincipleSchema.safeParse({ ...validPrinciple, learnedWeight: 1.1 }).success).toBe(false);
    });

    it('rejects empty statement', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        statement: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty domain array items', () => {
      const result = PrincipleSchema.safeParse({
        ...validPrinciple,
        domain: ['valid', ''],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parsePrinciple returns parsed data', () => {
      const result = parsePrinciple(validPrinciple);
      expect(result.id).toBe('pri_abc12345');
      expect(result.statement).toBe('Prefer fewer services unless compelling reason');
    });

    it('parsePrinciple throws on invalid data', () => {
      expect(() => parsePrinciple({ id: 'invalid' })).toThrow();
    });

    it('safeParsePrinciple returns success result', () => {
      const result = safeParsePrinciple(validPrinciple);
      expect(result.success).toBe(true);
    });

    it('safeParsePrinciple returns error result for invalid data', () => {
      const result = safeParsePrinciple({ id: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('parseEvidenceRecord works correctly', () => {
      const evidence = parseEvidenceRecord({
        id: 'evd_abc12345',
        decisionId: 'decision_xyz',
        outcome: 'confirmed',
        context: 'test context',
        timestamp: new Date(),
      });
      expect(evidence.outcome).toBe('confirmed');
    });
  });
});
