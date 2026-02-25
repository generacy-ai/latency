import { describe, it, expect } from 'vitest';
import {
  UserContextSchema,
  PrioritySchema,
  ConstraintSchema,
  ChangeSchema,
  parseUserContext,
  safeParseUserContext,
  parsePriority,
  parseConstraint,
  parseChange,
} from '../context.js';

describe('PrioritySchema', () => {
  const validPriority = {
    id: 'pty_abc12345',
    description: 'Ship MVP by end of Q4',
    importance: 'critical' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid priority without deadline', () => {
      const result = PrioritySchema.safeParse(validPriority);
      expect(result.success).toBe(true);
    });

    it('accepts priority with deadline', () => {
      const result = PrioritySchema.safeParse({
        ...validPriority,
        deadline: new Date('2024-12-31'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts all importance levels', () => {
      const levels = ['critical', 'high', 'medium', 'low'] as const;
      for (const importance of levels) {
        const result = PrioritySchema.safeParse({ ...validPriority, importance });
        expect(result.success).toBe(true);
      }
    });

    it('coerces string dates for deadline', () => {
      const result = PrioritySchema.safeParse({
        ...validPriority,
        deadline: '2024-12-31T00:00:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deadline).toBeInstanceOf(Date);
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = PrioritySchema.safeParse({
        ...validPriority,
        id: 'ctx_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid importance', () => {
      const result = PrioritySchema.safeParse({
        ...validPriority,
        importance: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty description', () => {
      const result = PrioritySchema.safeParse({
        ...validPriority,
        description: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('ConstraintSchema', () => {
  const validConstraint = {
    type: 'budget' as const,
    description: 'Limited to $10k for infrastructure',
    severity: 'hard' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid constraint', () => {
      const result = ConstraintSchema.safeParse(validConstraint);
      expect(result.success).toBe(true);
    });

    it('accepts all constraint types', () => {
      const types = ['time', 'budget', 'resources', 'political', 'technical'] as const;
      for (const type of types) {
        const result = ConstraintSchema.safeParse({ ...validConstraint, type });
        expect(result.success).toBe(true);
      }
    });

    it('accepts both severity levels', () => {
      expect(ConstraintSchema.safeParse({ ...validConstraint, severity: 'hard' }).success).toBe(true);
      expect(ConstraintSchema.safeParse({ ...validConstraint, severity: 'soft' }).success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid type', () => {
      const result = ConstraintSchema.safeParse({
        ...validConstraint,
        type: 'invalid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid severity', () => {
      const result = ConstraintSchema.safeParse({
        ...validConstraint,
        severity: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('ChangeSchema', () => {
  const validChange = {
    id: 'chg_abc12345',
    description: 'Team expanding from 3 to 8 people',
    impact: 'high' as const,
    category: 'team',
  };

  describe('valid shapes', () => {
    it('accepts valid change without expected date', () => {
      const result = ChangeSchema.safeParse(validChange);
      expect(result.success).toBe(true);
    });

    it('accepts change with expected date', () => {
      const result = ChangeSchema.safeParse({
        ...validChange,
        expectedDate: new Date('2024-06-01'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts all impact levels', () => {
      const levels = ['high', 'medium', 'low'] as const;
      for (const impact of levels) {
        const result = ChangeSchema.safeParse({ ...validChange, impact });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('invalid shapes', () => {
    it('rejects invalid id prefix', () => {
      const result = ChangeSchema.safeParse({
        ...validChange,
        id: 'ctx_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty category', () => {
      const result = ChangeSchema.safeParse({
        ...validChange,
        category: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('UserContextSchema', () => {
  const validContext = {
    id: 'ctx_abc12345',
    userId: 'user_123',
    currentPriorities: [
      {
        id: 'pty_abc12345',
        description: 'Ship MVP',
        importance: 'critical' as const,
      },
    ],
    upcomingChanges: [
      {
        id: 'chg_abc12345',
        description: 'Team expansion',
        impact: 'high' as const,
        category: 'team',
      },
    ],
    constraints: [
      {
        type: 'budget' as const,
        description: 'Limited budget',
        severity: 'hard' as const,
      },
    ],
    energyLevel: 'medium' as const,
    decisionFatigue: 45,
    updatedAt: new Date(),
  };

  describe('valid shapes', () => {
    it('accepts valid user context', () => {
      const result = UserContextSchema.safeParse(validContext);
      expect(result.success).toBe(true);
    });

    it('accepts context with expiry date', () => {
      const result = UserContextSchema.safeParse({
        ...validContext,
        expiresAt: new Date('2024-12-31'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts all energy levels', () => {
      const levels = ['high', 'medium', 'low'] as const;
      for (const energyLevel of levels) {
        const result = UserContextSchema.safeParse({ ...validContext, energyLevel });
        expect(result.success).toBe(true);
      }
    });

    it('accepts boundary decision fatigue values', () => {
      expect(UserContextSchema.safeParse({ ...validContext, decisionFatigue: 0 }).success).toBe(true);
      expect(UserContextSchema.safeParse({ ...validContext, decisionFatigue: 100 }).success).toBe(true);
    });

    it('accepts empty arrays', () => {
      const result = UserContextSchema.safeParse({
        ...validContext,
        currentPriorities: [],
        upcomingChanges: [],
        constraints: [],
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = UserContextSchema.safeParse({
        ...validContext,
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
      const result = UserContextSchema.safeParse({
        ...validContext,
        id: 'pty_abc12345', // wrong prefix
      });
      expect(result.success).toBe(false);
    });

    it('rejects decision fatigue outside range', () => {
      expect(UserContextSchema.safeParse({ ...validContext, decisionFatigue: -1 }).success).toBe(false);
      expect(UserContextSchema.safeParse({ ...validContext, decisionFatigue: 101 }).success).toBe(false);
    });

    it('rejects non-integer decision fatigue', () => {
      const result = UserContextSchema.safeParse({
        ...validContext,
        decisionFatigue: 45.5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid energy level', () => {
      const result = UserContextSchema.safeParse({
        ...validContext,
        energyLevel: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseUserContext returns parsed data', () => {
      const result = parseUserContext(validContext);
      expect(result.id).toBe('ctx_abc12345');
      expect(result.decisionFatigue).toBe(45);
    });

    it('parseUserContext throws on invalid data', () => {
      expect(() => parseUserContext({ id: 'invalid' })).toThrow();
    });

    it('safeParseUserContext returns success result', () => {
      const result = safeParseUserContext(validContext);
      expect(result.success).toBe(true);
    });

    it('safeParseUserContext returns error result for invalid data', () => {
      const result = safeParseUserContext({ id: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('parsePriority works correctly', () => {
      const priority = parsePriority({
        id: 'pty_abc12345',
        description: 'test',
        importance: 'high',
      });
      expect(priority.importance).toBe('high');
    });

    it('parseConstraint works correctly', () => {
      const constraint = parseConstraint({
        type: 'time',
        description: 'deadline',
        severity: 'hard',
      });
      expect(constraint.type).toBe('time');
    });

    it('parseChange works correctly', () => {
      const change = parseChange({
        id: 'chg_abc12345',
        description: 'test change',
        impact: 'medium',
        category: 'process',
      });
      expect(change.impact).toBe('medium');
    });
  });
});
