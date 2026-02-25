import { describe, it, expect } from 'vitest';
import {
  InvocationContextSchema,
  ToolInvocationSchema,
  parseToolInvocation,
  safeParseToolInvocation,
} from '../../../src/protocols/agency-humancy/tool-invocation.js';

describe('InvocationContext', () => {
  it('should validate a full context', () => {
    const validContext = {
      workflowId: 'workflow-123',
      issueNumber: 42,
      sessionId: 'session-abc',
    };
    expect(InvocationContextSchema.parse(validContext)).toEqual(validContext);
  });

  it('should require sessionId', () => {
    const invalidContext = {
      workflowId: 'workflow-123',
    };
    expect(InvocationContextSchema.safeParse(invalidContext).success).toBe(false);
  });

  it('should allow minimal context with just sessionId', () => {
    const minimalContext = {
      sessionId: 'session-abc',
    };
    expect(InvocationContextSchema.parse(minimalContext)).toEqual(minimalContext);
  });

  it('should reject negative issue numbers', () => {
    const invalidContext = {
      sessionId: 'session-abc',
      issueNumber: -1,
    };
    expect(InvocationContextSchema.safeParse(invalidContext).success).toBe(false);
  });

  it('should reject non-integer issue numbers', () => {
    const invalidContext = {
      sessionId: 'session-abc',
      issueNumber: 1.5,
    };
    expect(InvocationContextSchema.safeParse(invalidContext).success).toBe(false);
  });
});

describe('ToolInvocation', () => {
  const validInvocation = {
    id: 'inv-123',
    tool: 'source_control.commit',
    parameters: {
      message: 'feat: add new feature',
      files: ['src/index.ts'],
    },
    context: {
      sessionId: 'session-abc',
      issueNumber: 42,
    },
  };

  it('should validate a valid invocation', () => {
    expect(parseToolInvocation(validInvocation)).toEqual(validInvocation);
  });

  it('should allow invocation without context', () => {
    const invocationWithoutContext = {
      id: 'inv-123',
      tool: 'source_control.commit',
      parameters: {},
    };
    expect(safeParseToolInvocation(invocationWithoutContext).success).toBe(true);
  });

  it('should reject empty invocation id', () => {
    const invalid = { ...validInvocation, id: '' };
    expect(safeParseToolInvocation(invalid).success).toBe(false);
  });

  it('should reject invalid tool names', () => {
    const invalid = { ...validInvocation, tool: 'Invalid-Tool' };
    expect(safeParseToolInvocation(invalid).success).toBe(false);
  });

  it('should accept namespaced tool names', () => {
    const valid = { ...validInvocation, tool: 'namespace.sub.action' };
    expect(safeParseToolInvocation(valid).success).toBe(true);
  });

  it('should accept empty parameters', () => {
    const valid = { ...validInvocation, parameters: {} };
    expect(safeParseToolInvocation(valid).success).toBe(true);
  });
});
