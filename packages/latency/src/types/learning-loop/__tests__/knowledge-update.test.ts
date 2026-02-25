import { describe, it, expect } from 'vitest';
import {
  KnowledgeChangeSchema,
  KnowledgeUpdateSchema,
  parseKnowledgeChange,
  safeParseKnowledgeChange,
  parseKnowledgeUpdate,
  safeParseKnowledgeUpdate,
} from '../knowledge-update.js';

describe('KnowledgeChangeSchema', () => {
  const validCreateChange = {
    targetType: 'principle' as const,
    operation: 'create' as const,
    after: { statement: 'New principle statement' },
    reasoning: 'Derived from coaching feedback',
  };

  const validUpdateChange = {
    targetType: 'principle' as const,
    targetId: 'pri_abc12345',
    operation: 'update' as const,
    before: { statement: 'Old statement' },
    after: { statement: 'Updated statement' },
    reasoning: 'Refined based on coaching',
  };

  describe('valid shapes', () => {
    it('accepts create operation without targetId', () => {
      const result = KnowledgeChangeSchema.safeParse(validCreateChange);
      expect(result.success).toBe(true);
    });

    it('accepts update operation with targetId', () => {
      const result = KnowledgeChangeSchema.safeParse(validUpdateChange);
      expect(result.success).toBe(true);
    });

    it('accepts deprecate operation with targetId', () => {
      const result = KnowledgeChangeSchema.safeParse({
        ...validUpdateChange,
        operation: 'deprecate',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = KnowledgeChangeSchema.safeParse({
        ...validCreateChange,
        customField: 'allowed',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects update operation without targetId', () => {
      const result = KnowledgeChangeSchema.safeParse({
        targetType: 'principle',
        operation: 'update',
        before: { statement: 'Old' },
        after: { statement: 'New' },
        reasoning: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('rejects deprecate operation without targetId', () => {
      const result = KnowledgeChangeSchema.safeParse({
        targetType: 'pattern',
        operation: 'deprecate',
        before: { description: 'Old' },
        after: { description: 'Deprecated' },
        reasoning: 'No longer valid',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty reasoning', () => {
      const result = KnowledgeChangeSchema.safeParse({
        ...validCreateChange,
        reasoning: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid targetType', () => {
      const result = KnowledgeChangeSchema.safeParse({
        ...validCreateChange,
        targetType: 'value',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid operation', () => {
      const result = KnowledgeChangeSchema.safeParse({
        ...validCreateChange,
        operation: 'delete',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseKnowledgeChange returns valid data', () => {
      const result = parseKnowledgeChange(validCreateChange);
      expect(result.operation).toBe('create');
    });

    it('safeParseKnowledgeChange returns error for invalid data', () => {
      const result = safeParseKnowledgeChange({
        ...validUpdateChange,
        targetId: undefined,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('KnowledgeUpdateSchema', () => {
  const validChange = {
    targetType: 'principle' as const,
    operation: 'create' as const,
    after: { statement: 'New principle' },
    reasoning: 'From coaching',
  };

  const validUpdate = {
    id: 'update_abc12345',
    coachingId: 'coaching_xyz12345',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    type: 'new_principle' as const,
    changes: [validChange],
    status: 'pending' as const,
  };

  describe('valid shapes', () => {
    it('accepts valid knowledge update', () => {
      const result = KnowledgeUpdateSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('accepts no_update type with empty changes', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        type: 'no_update',
        changes: [],
      });
      expect(result.success).toBe(true);
    });

    it('accepts applied status with appliedAt', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        status: 'applied',
        appliedAt: new Date('2024-01-15T11:00:00Z'),
      });
      expect(result.success).toBe(true);
    });

    it('accepts ISO string timestamp', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        timestamp: '2024-01-15T10:00:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid shapes', () => {
    it('rejects empty changes for non-no_update type', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        type: 'new_principle',
        changes: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid id prefix', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        id: 'upd_abc12345',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty coachingId', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        coachingId: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        type: 'delete_principle',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = KnowledgeUpdateSchema.safeParse({
        ...validUpdate,
        status: 'cancelled',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('parse functions', () => {
    it('parseKnowledgeUpdate returns valid data', () => {
      const result = parseKnowledgeUpdate(validUpdate);
      expect(result.id).toBe(validUpdate.id);
      expect(result.changes).toHaveLength(1);
    });

    it('safeParseKnowledgeUpdate returns error for invalid data', () => {
      const result = safeParseKnowledgeUpdate({
        ...validUpdate,
        changes: [],
      });
      expect(result.success).toBe(false);
    });
  });
});
