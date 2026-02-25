import { describe, it, expect } from 'vitest';
import {
  PhilosophySchema,
  ValueSchema,
  BoundarySchema,
  MetaPreferenceSchema,
  RiskProfileSchema,
  TimeHorizonSchema,
  parsePhilosophy,
  safeParsePhilosophy,
  parseValue,
  parseBoundary,
} from '../philosophy.js';

describe('ValueSchema', () => {
  const validValue = {
    id: 'val_abc12345',
    name: 'simplicity',
    description: 'Prefer simple solutions',
    weight: 0.8,
  };

  describe('valid shapes', () => {
    it('accepts minimal valid value', () => {
      const result = ValueSchema.safeParse(validValue);
      expect(result.success).toBe(true);
    });

    it('accepts value with inTensionWith', () => {
      const result = ValueSchema.safeParse({
        ...validValue,
        inTensionWith: ['val_flexibility1'],
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = ValueSchema.safeParse({
        ...validValue,
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
      const result = ValueSchema.safeParse({
        ...validValue,
        id: 'phi_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects weight outside range', () => {
      expect(ValueSchema.safeParse({ ...validValue, weight: -0.1 }).success).toBe(false);
      expect(ValueSchema.safeParse({ ...validValue, weight: 1.1 }).success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = ValueSchema.safeParse({ ...validValue, name: '' });
      expect(result.success).toBe(false);
    });
  });
});

describe('BoundarySchema', () => {
  const validBoundary = {
    id: 'bnd_abc12345',
    description: 'Never compromise user privacy',
    type: 'absolute' as const,
  };

  describe('valid shapes', () => {
    it('accepts absolute boundary without context', () => {
      const result = BoundarySchema.safeParse(validBoundary);
      expect(result.success).toBe(true);
    });

    it('accepts contextual boundary with context', () => {
      const result = BoundarySchema.safeParse({
        ...validBoundary,
        type: 'contextual',
        context: 'When handling sensitive data',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects contextual boundary without context', () => {
      const result = BoundarySchema.safeParse({
        ...validBoundary,
        type: 'contextual',
        // missing context
      });
      expect(result.success).toBe(false);
    });

    it('rejects contextual boundary with empty context', () => {
      const result = BoundarySchema.safeParse({
        ...validBoundary,
        type: 'contextual',
        context: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('MetaPreferenceSchema', () => {
  const validMetaPref = {
    id: 'mpf_abc12345',
    category: 'decision_style',
    preference: 'Prefer quick decisions',
    strength: 0.7,
  };

  it('accepts valid meta preference', () => {
    const result = MetaPreferenceSchema.safeParse(validMetaPref);
    expect(result.success).toBe(true);
  });

  it('rejects strength outside range', () => {
    expect(MetaPreferenceSchema.safeParse({ ...validMetaPref, strength: -0.1 }).success).toBe(false);
    expect(MetaPreferenceSchema.safeParse({ ...validMetaPref, strength: 1.5 }).success).toBe(false);
  });
});

describe('RiskProfileSchema', () => {
  const validRiskProfile = {
    overall: 'moderate' as const,
    domains: {
      financial: 'conservative' as const,
      technology: 'aggressive' as const,
    },
  };

  it('accepts valid risk profile', () => {
    const result = RiskProfileSchema.safeParse(validRiskProfile);
    expect(result.success).toBe(true);
  });

  it('accepts risk profile with description', () => {
    const result = RiskProfileSchema.safeParse({
      ...validRiskProfile,
      description: 'Generally balanced',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid overall value', () => {
    const result = RiskProfileSchema.safeParse({
      ...validRiskProfile,
      overall: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('TimeHorizonSchema', () => {
  it('accepts minimal time horizon', () => {
    const result = TimeHorizonSchema.safeParse({
      defaultHorizon: 'medium',
    });
    expect(result.success).toBe(true);
  });

  it('accepts time horizon with domain specific', () => {
    const result = TimeHorizonSchema.safeParse({
      defaultHorizon: 'medium',
      domainSpecific: {
        career: 'long',
        projects: 'short',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('PhilosophySchema', () => {
  const validPhilosophy = {
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
  };

  describe('valid shapes', () => {
    it('accepts valid philosophy', () => {
      const result = PhilosophySchema.safeParse(validPhilosophy);
      expect(result.success).toBe(true);
    });

    it('coerces string dates to Date objects', () => {
      const result = PhilosophySchema.safeParse({
        ...validPhilosophy,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.createdAt).toBeInstanceOf(Date);
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('accepts empty arrays for collections', () => {
      const result = PhilosophySchema.safeParse({
        ...validPhilosophy,
        values: [],
        metaPreferences: [],
        boundaries: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid philosophy id prefix', () => {
      const result = PhilosophySchema.safeParse({
        ...validPhilosophy,
        id: 'val_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const { userId, ...withoutUserId } = validPhilosophy;
      const result = PhilosophySchema.safeParse(withoutUserId);
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parsePhilosophy returns parsed data', () => {
      const result = parsePhilosophy(validPhilosophy);
      expect(result.id).toBe('phi_abc12345');
      expect(result.userId).toBe('user_123');
    });

    it('parsePhilosophy throws on invalid data', () => {
      expect(() => parsePhilosophy({ id: 'invalid' })).toThrow();
    });

    it('safeParsePhilosophy returns success result', () => {
      const result = safeParsePhilosophy(validPhilosophy);
      expect(result.success).toBe(true);
    });

    it('safeParsePhilosophy returns error result for invalid data', () => {
      const result = safeParsePhilosophy({ id: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('parseValue works correctly', () => {
      const value = parseValue({
        id: 'val_abc12345',
        name: 'test',
        description: 'desc',
        weight: 0.5,
      });
      expect(value.name).toBe('test');
    });

    it('parseBoundary works correctly', () => {
      const boundary = parseBoundary({
        id: 'bnd_abc12345',
        description: 'test',
        type: 'absolute',
      });
      expect(boundary.type).toBe('absolute');
    });
  });
});
