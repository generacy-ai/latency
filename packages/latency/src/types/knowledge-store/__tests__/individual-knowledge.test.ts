import { describe, it, expect } from 'vitest';
import {
  IndividualKnowledgeSchema,
  parseIndividualKnowledge,
  safeParseIndividualKnowledge,
} from '../individual-knowledge.js';

describe('IndividualKnowledgeSchema', () => {
  // Create a complete valid IndividualKnowledge object
  const validKnowledge = {
    userId: 'user_123',
    philosophy: {
      id: 'phi_abc12345',
      userId: 'user_123',
      values: [
        {
          id: 'val_abc12345',
          name: 'simplicity',
          description: 'Prefer simple solutions',
          weight: 0.8,
        },
      ],
      metaPreferences: [
        {
          id: 'mpf_abc12345',
          category: 'decision_style',
          preference: 'Prefer quick decisions',
          strength: 0.7,
        },
      ],
      boundaries: [
        {
          id: 'bnd_abc12345',
          description: 'Never compromise user privacy',
          type: 'absolute' as const,
        },
      ],
      riskProfile: {
        overall: 'moderate' as const,
        domains: {},
      },
      timeHorizon: {
        defaultHorizon: 'medium' as const,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    principles: [
      {
        id: 'pri_abc12345',
        userId: 'user_123',
        domain: ['architecture'],
        statement: 'Prefer fewer services',
        rationale: 'Reduces complexity',
        applicability: {
          when: ['small team'],
          unless: ['scaling requirements'],
        },
        evidence: [],
        confidence: 0.85,
        learnedWeight: 0.9,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    patterns: [
      {
        id: 'pat_abc12345',
        userId: 'user_123',
        observation: 'Prefers monorepo for small teams',
        frequency: 8,
        contexts: ['startup'],
        statisticalBasis: {
          sampleSize: 10,
          consistency: 0.8,
        },
        status: 'observed' as const,
        createdAt: new Date(),
        lastObserved: new Date(),
      },
    ],
    context: {
      id: 'ctx_abc12345',
      userId: 'user_123',
      currentPriorities: [],
      upcomingChanges: [],
      constraints: [],
      energyLevel: 'medium' as const,
      decisionFatigue: 30,
      updatedAt: new Date(),
    },
    version: 1,
    lastSyncedAt: new Date(),
    portabilityLevel: 'full' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid individual knowledge', () => {
      const result = IndividualKnowledgeSchema.safeParse(validKnowledge);
      expect(result.success).toBe(true);
    });

    it('accepts all portability levels', () => {
      const levels = ['full', 'redacted', 'abstracted'] as const;
      for (const portabilityLevel of levels) {
        const result = IndividualKnowledgeSchema.safeParse({
          ...validKnowledge,
          portabilityLevel,
        });
        expect(result.success).toBe(true);
      }
    });

    it('accepts empty principle and pattern arrays', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        principles: [],
        patterns: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts knowledge with version 0', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        version: 0,
      });
      expect(result.success).toBe(true);
    });

    it('coerces string dates to Date objects', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        lastSyncedAt: '2024-01-01T00:00:00Z',
        philosophy: {
          ...validKnowledge.philosophy,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        context: {
          ...validKnowledge.context,
          updatedAt: '2024-01-01T00:00:00Z',
        },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lastSyncedAt).toBeInstanceOf(Date);
        expect(result.data.philosophy.createdAt).toBeInstanceOf(Date);
        expect(result.data.context.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('allows passthrough of unknown fields', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        customField: 'allowed',
        metadata: { exportedBy: 'test' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>)['customField']).toBe('allowed');
        expect((result.data as Record<string, unknown>)['metadata']).toEqual({ exportedBy: 'test' });
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid portability level', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        portabilityLevel: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative version', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        version: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer version', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        version: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty userId', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        userId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing philosophy', () => {
      const { philosophy, ...withoutPhilosophy } = validKnowledge;
      const result = IndividualKnowledgeSchema.safeParse(withoutPhilosophy);
      expect(result.success).toBe(false);
    });

    it('rejects invalid nested philosophy', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        philosophy: {
          ...validKnowledge.philosophy,
          id: 'invalid_id', // wrong format
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid nested principle', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        principles: [
          {
            ...validKnowledge.principles[0],
            confidence: 2.0, // out of range
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid nested pattern', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        patterns: [
          {
            ...validKnowledge.patterns[0],
            frequency: -1, // invalid
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid nested context', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        context: {
          ...validKnowledge.context,
          decisionFatigue: 150, // out of range
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseIndividualKnowledge returns parsed data', () => {
      const result = parseIndividualKnowledge(validKnowledge);
      expect(result.userId).toBe('user_123');
      expect(result.version).toBe(1);
      expect(result.portabilityLevel).toBe('full');
    });

    it('parseIndividualKnowledge throws on invalid data', () => {
      expect(() => parseIndividualKnowledge({ userId: '' })).toThrow();
    });

    it('safeParseIndividualKnowledge returns success result', () => {
      const result = safeParseIndividualKnowledge(validKnowledge);
      expect(result.success).toBe(true);
    });

    it('safeParseIndividualKnowledge returns error result for invalid data', () => {
      const result = safeParseIndividualKnowledge({ userId: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('layer relationships', () => {
    it('validates philosophy layer values correctly', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        philosophy: {
          ...validKnowledge.philosophy,
          values: [
            {
              id: 'val_abc12345',
              name: 'simplicity',
              description: 'Simple solutions',
              weight: 0.9,
              inTensionWith: ['val_flexibility1'],
            },
            {
              id: 'val_flexibility1',
              name: 'flexibility',
              description: 'Adaptable solutions',
              weight: 0.6,
              inTensionWith: ['val_abc12345'],
            },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts patterns with promoted status linking to principles', () => {
      const result = IndividualKnowledgeSchema.safeParse({
        ...validKnowledge,
        patterns: [
          {
            ...validKnowledge.patterns[0],
            status: 'promoted',
            promotedToPrincipleId: 'pri_abc12345',
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('type inference', () => {
  it('infers correct type for IndividualKnowledge', () => {
    // This test verifies TypeScript type inference works correctly
    const validData = {
      userId: 'user_123',
      philosophy: {
        id: 'phi_abc12345',
        userId: 'user_123',
        values: [],
        metaPreferences: [],
        boundaries: [],
        riskProfile: { overall: 'moderate' as const, domains: {} },
        timeHorizon: { defaultHorizon: 'medium' as const },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      principles: [],
      patterns: [],
      context: {
        id: 'ctx_abc12345',
        userId: 'user_123',
        currentPriorities: [],
        upcomingChanges: [],
        constraints: [],
        energyLevel: 'medium' as const,
        decisionFatigue: 0,
        updatedAt: new Date(),
      },
      version: 1,
      lastSyncedAt: new Date(),
      portabilityLevel: 'full' as const,
    };

    const result = IndividualKnowledgeSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      // TypeScript should infer these types correctly
      const userId: string = result.data.userId;
      const version: number = result.data.version;
      const portability: 'full' | 'redacted' | 'abstracted' = result.data.portabilityLevel;

      expect(userId).toBe('user_123');
      expect(version).toBe(1);
      expect(portability).toBe('full');
    }
  });
});
