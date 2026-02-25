import { describe, it, expect } from 'vitest';
import {
  ModeDefinitionSchema,
  ModeChangeRequestSchema,
  parseModeDefinition,
  safeParseModeDefinition,
  parseModeChangeRequest,
  safeParseModeChangeRequest,
} from '../../../src/protocols/agency-humancy/mode-management.js';

describe('ModeDefinition', () => {
  const validMode = {
    name: 'development',
    description: 'Development mode with full toolset',
    tools: ['source_control.commit', 'source_control.push', 'testing.run'],
    extends: 'basic',
  };

  it('should validate a valid mode definition', () => {
    expect(parseModeDefinition(validMode)).toEqual(validMode);
  });

  it('should allow mode without extends', () => {
    const modeWithoutExtends = {
      name: 'basic',
      description: 'Basic mode with minimal tools',
      tools: ['file.read', 'file.write'],
    };
    expect(safeParseModeDefinition(modeWithoutExtends).success).toBe(true);
  });

  it('should allow empty tools array', () => {
    const modeWithNoTools = {
      name: 'restricted',
      description: 'Restricted mode with no tools',
      tools: [],
    };
    expect(safeParseModeDefinition(modeWithNoTools).success).toBe(true);
  });

  it('should require mode name', () => {
    const invalid = { ...validMode, name: '' };
    expect(safeParseModeDefinition(invalid).success).toBe(false);
  });

  it('should require mode description', () => {
    const invalid = { ...validMode, description: '' };
    expect(safeParseModeDefinition(invalid).success).toBe(false);
  });

  it('should validate tool names in tools array', () => {
    const invalidTools = {
      ...validMode,
      tools: ['valid.tool', 'Invalid-Tool'],
    };
    expect(safeParseModeDefinition(invalidTools).success).toBe(false);
  });

  it('should accept nested namespaced tool names', () => {
    const nestedTools = {
      ...validMode,
      tools: ['namespace.sub.action', 'another.deep.nested.tool'],
    };
    expect(safeParseModeDefinition(nestedTools).success).toBe(true);
  });
});

describe('ModeChangeRequest', () => {
  it('should validate a valid mode change request', () => {
    const validRequest = {
      mode: 'development',
      reason: 'Starting development work',
    };
    expect(parseModeChangeRequest(validRequest)).toEqual(validRequest);
  });

  it('should allow request without reason', () => {
    const requestWithoutReason = {
      mode: 'review',
    };
    expect(safeParseModeChangeRequest(requestWithoutReason).success).toBe(true);
  });

  it('should require mode name', () => {
    const invalid = {
      mode: '',
      reason: 'test',
    };
    expect(safeParseModeChangeRequest(invalid).success).toBe(false);
  });

  it('should accept any non-empty mode name', () => {
    const requests = [
      { mode: 'development' },
      { mode: 'REVIEW' },
      { mode: 'Mode With Spaces' },
      { mode: 'mode-with-dashes' },
    ];
    for (const request of requests) {
      expect(safeParseModeChangeRequest(request).success).toBe(true);
    }
  });
});

describe('Mode Inheritance (additive)', () => {
  it('should support mode inheritance pattern', () => {
    // Demonstrate the expected usage pattern for additive inheritance
    const basicMode = {
      name: 'basic',
      description: 'Basic tools',
      tools: ['file.read'],
    };

    const advancedMode = {
      name: 'advanced',
      description: 'Advanced mode extending basic',
      tools: ['file.write', 'source_control.commit'],
      extends: 'basic',
    };

    expect(parseModeDefinition(basicMode)).toEqual(basicMode);
    expect(parseModeDefinition(advancedMode)).toEqual(advancedMode);

    // The actual inheritance resolution would be done at runtime:
    // advancedMode.effectiveTools = [...basicMode.tools, ...advancedMode.tools]
    // This test just validates the schema supports the pattern
  });
});
