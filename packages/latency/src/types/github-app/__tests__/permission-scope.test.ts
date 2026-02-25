import { describe, it, expect } from 'vitest';
import {
  PermissionScope,
  PermissionScopeSchema,
  PermissionCategorySchema,
  PermissionLevelSchema,
  parsePermissionScope,
  safeParsePermissionScope,
  formatPermissionScope,
  parsePermissionScopeString,
  PermissionScopeDefinition,
  PermissionScopeDefinitionSchema,
  parsePermissionScopeDefinition,
  safeParsePermissionScopeDefinition,
} from '../permission-scope.js';

describe('PermissionCategorySchema', () => {
  it('accepts valid permission categories', () => {
    expect(PermissionCategorySchema.safeParse('repo').success).toBe(true);
    expect(PermissionCategorySchema.safeParse('issues').success).toBe(true);
    expect(PermissionCategorySchema.safeParse('pull_requests').success).toBe(true);
    expect(PermissionCategorySchema.safeParse('actions').success).toBe(true);
    expect(PermissionCategorySchema.safeParse('contents').success).toBe(true);
    expect(PermissionCategorySchema.safeParse('workflows').success).toBe(true);
  });

  it('rejects invalid permission categories', () => {
    expect(PermissionCategorySchema.safeParse('invalid').success).toBe(false);
    expect(PermissionCategorySchema.safeParse('REPO').success).toBe(false);
    expect(PermissionCategorySchema.safeParse('').success).toBe(false);
  });
});

describe('PermissionLevelSchema', () => {
  it('accepts valid permission levels', () => {
    expect(PermissionLevelSchema.safeParse('read').success).toBe(true);
    expect(PermissionLevelSchema.safeParse('write').success).toBe(true);
    expect(PermissionLevelSchema.safeParse('admin').success).toBe(true);
    expect(PermissionLevelSchema.safeParse('none').success).toBe(true);
  });

  it('rejects invalid permission levels', () => {
    expect(PermissionLevelSchema.safeParse('invalid').success).toBe(false);
    expect(PermissionLevelSchema.safeParse('READ').success).toBe(false);
    expect(PermissionLevelSchema.safeParse('').success).toBe(false);
  });
});

describe('PermissionScopeSchema', () => {
  const validScope = {
    category: 'repo',
    level: 'read',
  };

  describe('valid scopes', () => {
    it('accepts valid permission scope', () => {
      const result = PermissionScopeSchema.safeParse(validScope);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('repo');
        expect(result.data.level).toBe('read');
      }
    });

    it('accepts various category/level combinations', () => {
      expect(PermissionScopeSchema.safeParse({ category: 'issues', level: 'write' }).success).toBe(true);
      expect(PermissionScopeSchema.safeParse({ category: 'actions', level: 'admin' }).success).toBe(true);
      expect(PermissionScopeSchema.safeParse({ category: 'metadata', level: 'none' }).success).toBe(true);
    });
  });

  describe('invalid scopes', () => {
    it('rejects invalid category', () => {
      const scope = { ...validScope, category: 'invalid' };
      const result = PermissionScopeSchema.safeParse(scope);
      expect(result.success).toBe(false);
    });

    it('rejects invalid level', () => {
      const scope = { ...validScope, level: 'invalid' };
      const result = PermissionScopeSchema.safeParse(scope);
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      expect(PermissionScopeSchema.safeParse({}).success).toBe(false);
      expect(PermissionScopeSchema.safeParse({ category: 'repo' }).success).toBe(false);
      expect(PermissionScopeSchema.safeParse({ level: 'read' }).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = PermissionScope.V1.safeParse(validScope);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = PermissionScope.getVersion('v1');
      const result = schema.safeParse(validScope);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(PermissionScope.Latest).toBe(PermissionScope.V1);
    });
  });

  describe('parse helpers', () => {
    it('parsePermissionScope returns valid scope', () => {
      const scope = parsePermissionScope(validScope);
      expect(scope.category).toBe('repo');
    });

    it('parsePermissionScope throws on invalid data', () => {
      expect(() => parsePermissionScope({})).toThrow();
    });

    it('safeParsePermissionScope returns success result', () => {
      const result = safeParsePermissionScope(validScope);
      expect(result.success).toBe(true);
    });

    it('safeParsePermissionScope returns failure result', () => {
      const result = safeParsePermissionScope({});
      expect(result.success).toBe(false);
    });
  });

  describe('format helpers', () => {
    it('formatPermissionScope creates correct string', () => {
      const scope = parsePermissionScope({ category: 'repo', level: 'read' });
      expect(formatPermissionScope(scope)).toBe('repo:read');
    });

    it('parsePermissionScopeString parses valid string', () => {
      const scope = parsePermissionScopeString('issues:write');
      expect(scope.category).toBe('issues');
      expect(scope.level).toBe('write');
    });

    it('parsePermissionScopeString throws on invalid string', () => {
      expect(() => parsePermissionScopeString('invalid')).toThrow();
      expect(() => parsePermissionScopeString('invalid:invalid')).toThrow();
    });
  });
});

describe('PermissionScopeDefinitionSchema', () => {
  const validDefinition = {
    scope: { category: 'repo', level: 'read' },
    description: 'Read access to repository contents',
    required: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid definitions', () => {
    it('accepts valid permission scope definition', () => {
      const result = PermissionScopeDefinitionSchema.safeParse(validDefinition);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scope.category).toBe('repo');
        expect(result.data.description).toBe('Read access to repository contents');
        expect(result.data.required).toBe(true);
      }
    });

    it('accepts optional permissions', () => {
      const definition = { ...validDefinition, required: false };
      const result = PermissionScopeDefinitionSchema.safeParse(definition);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid definitions', () => {
    it('rejects empty description', () => {
      const definition = { ...validDefinition, description: '' };
      const result = PermissionScopeDefinitionSchema.safeParse(definition);
      expect(result.success).toBe(false);
    });

    it('rejects invalid scope', () => {
      const definition = { ...validDefinition, scope: { category: 'invalid', level: 'read' } };
      const result = PermissionScopeDefinitionSchema.safeParse(definition);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
      const definition = { ...validDefinition, createdAt: 'invalid' };
      const result = PermissionScopeDefinitionSchema.safeParse(definition);
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      expect(PermissionScopeDefinitionSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = PermissionScopeDefinition.V1.safeParse(validDefinition);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(PermissionScopeDefinition.Latest).toBe(PermissionScopeDefinition.V1);
    });
  });

  describe('parse helpers', () => {
    it('parsePermissionScopeDefinition returns valid definition', () => {
      const definition = parsePermissionScopeDefinition(validDefinition);
      expect(definition.description).toBe('Read access to repository contents');
    });

    it('safeParsePermissionScopeDefinition returns success result', () => {
      const result = safeParsePermissionScopeDefinition(validDefinition);
      expect(result.success).toBe(true);
    });
  });
});
