import { describe, it, expect } from 'vitest';
import {
  ToolParameterSchemaSchema,
  ReturnSchemaSchema,
  ToolRegistrationSchema,
  parseToolRegistration,
  safeParseToolRegistration,
} from '../../../src/protocols/agency-humancy/tool-registration.js';

describe('ToolParameterSchema', () => {
  it('should validate a valid parameter schema', () => {
    const validParam = {
      name: 'message',
      schema: { type: 'string' },
      description: 'The commit message',
    };
    expect(ToolParameterSchemaSchema.parse(validParam)).toEqual(validParam);
  });

  it('should require a name', () => {
    const invalidParam = {
      name: '',
      schema: { type: 'string' },
    };
    const result = ToolParameterSchemaSchema.safeParse(invalidParam);
    expect(result.success).toBe(false);
  });

  it('should allow optional description', () => {
    const paramWithoutDesc = {
      name: 'files',
      schema: { type: 'array', items: { type: 'string' } },
    };
    expect(ToolParameterSchemaSchema.parse(paramWithoutDesc)).toEqual(paramWithoutDesc);
  });
});

describe('ReturnSchema', () => {
  it('should validate a valid return schema', () => {
    const validReturn = {
      schema: { type: 'object', properties: { success: { type: 'boolean' } } },
      description: 'Result of the operation',
    };
    expect(ReturnSchemaSchema.parse(validReturn)).toEqual(validReturn);
  });

  it('should allow optional description', () => {
    const returnWithoutDesc = {
      schema: { type: 'boolean' },
    };
    expect(ReturnSchemaSchema.parse(returnWithoutDesc)).toEqual(returnWithoutDesc);
  });
});

describe('ToolRegistration', () => {
  const validRegistration = {
    name: 'source_control.commit',
    server: 'git-server',
    description: 'Commit changes to the repository',
    parameters: [
      { name: 'message', schema: { type: 'string' } },
      { name: 'files', schema: { type: 'array', items: { type: 'string' } } },
    ],
    returns: { schema: { type: 'object', properties: { sha: { type: 'string' } } } },
    modes: ['development', 'review'],
  };

  it('should validate a valid tool registration', () => {
    expect(parseToolRegistration(validRegistration)).toEqual(validRegistration);
  });

  it('should reject invalid tool names', () => {
    const invalid = { ...validRegistration, name: 'Invalid-Name' };
    expect(safeParseToolRegistration(invalid).success).toBe(false);
  });

  it('should reject tool names starting with numbers', () => {
    const invalid = { ...validRegistration, name: '123tool' };
    expect(safeParseToolRegistration(invalid).success).toBe(false);
  });

  it('should accept namespaced tool names', () => {
    const valid = { ...validRegistration, name: 'namespace.sub.tool_name' };
    expect(safeParseToolRegistration(valid).success).toBe(true);
  });

  it('should require at least one mode', () => {
    const invalid = { ...validRegistration, modes: [] };
    expect(safeParseToolRegistration(invalid).success).toBe(false);
  });

  it('should require a server name', () => {
    const invalid = { ...validRegistration, server: '' };
    expect(safeParseToolRegistration(invalid).success).toBe(false);
  });

  it('should require a description', () => {
    const invalid = { ...validRegistration, description: '' };
    expect(safeParseToolRegistration(invalid).success).toBe(false);
  });
});
