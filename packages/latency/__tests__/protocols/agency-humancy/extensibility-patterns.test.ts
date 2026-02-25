import { describe, it, expect } from 'vitest';
import {
  // Namespaces for versioned access
  DecisionOption,
  DecisionRequest,
  DecisionResponse,
  ToolParameterSchema,
  ReturnSchema,
  ToolRegistration,
  InvocationContext,
  ToolInvocation,
  ToolError,
  ToolResult,
  ModeDefinition,
  ModeChangeRequest,
  // Backward-compatible aliases
  DecisionOptionSchema,
  DecisionRequestSchema,
  DecisionResponseSchema,
  ToolParameterSchemaSchema,
  ReturnSchemaSchema,
  ToolRegistrationSchema,
  InvocationContextSchema,
  ToolInvocationSchema,
  ToolErrorSchema,
  ToolResultSchema,
  ModeDefinitionSchema,
  ModeChangeRequestSchema,
  // ExtendedMeta
  ExtendedMetaSchema,
} from '../../../src/protocols/agency-humancy/index.js';

describe('Version selection via getVersion()', () => {
  describe('DecisionOption namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(DecisionOption.getVersion('v1')).toBe(DecisionOption.V1);
    });

    it('should have Latest pointing to V1', () => {
      expect(DecisionOption.Latest).toBe(DecisionOption.V1);
    });

    it('should have VERSIONS map with v1', () => {
      expect(DecisionOption.VERSIONS.v1).toBe(DecisionOption.V1);
    });
  });

  describe('DecisionRequest namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(DecisionRequest.getVersion('v1')).toBe(DecisionRequest.V1);
    });

    it('should have Latest pointing to V1', () => {
      expect(DecisionRequest.Latest).toBe(DecisionRequest.V1);
    });
  });

  describe('DecisionResponse namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(DecisionResponse.getVersion('v1')).toBe(DecisionResponse.V1);
    });

    it('should have Latest pointing to V1', () => {
      expect(DecisionResponse.Latest).toBe(DecisionResponse.V1);
    });
  });

  describe('ToolParameterSchema namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ToolParameterSchema.getVersion('v1')).toBe(ToolParameterSchema.V1);
    });
  });

  describe('ReturnSchema namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ReturnSchema.getVersion('v1')).toBe(ReturnSchema.V1);
    });
  });

  describe('ToolRegistration namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ToolRegistration.getVersion('v1')).toBe(ToolRegistration.V1);
    });
  });

  describe('InvocationContext namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(InvocationContext.getVersion('v1')).toBe(InvocationContext.V1);
    });
  });

  describe('ToolInvocation namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ToolInvocation.getVersion('v1')).toBe(ToolInvocation.V1);
    });
  });

  describe('ToolError namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ToolError.getVersion('v1')).toBe(ToolError.V1);
    });
  });

  describe('ToolResult namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ToolResult.getVersion('v1')).toBe(ToolResult.V1);
    });
  });

  describe('ModeDefinition namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ModeDefinition.getVersion('v1')).toBe(ModeDefinition.V1);
    });
  });

  describe('ModeChangeRequest namespace', () => {
    it('should return V1 schema via getVersion', () => {
      expect(ModeChangeRequest.getVersion('v1')).toBe(ModeChangeRequest.V1);
    });
  });
});

describe('Unknown field preservation via .passthrough()', () => {
  describe('DecisionOption', () => {
    it('should preserve unknown fields', () => {
      const data = {
        id: 'opt-1',
        label: 'Option 1',
        customField: 'custom value',
        nestedData: { key: 'value' },
      };
      const result = DecisionOptionSchema.parse(data);
      expect(result.customField).toBe('custom value');
      expect(result.nestedData).toEqual({ key: 'value' });
    });
  });

  describe('DecisionRequest', () => {
    it('should preserve unknown fields', () => {
      const data = {
        id: 'req-123',
        type: 'question',
        urgency: 'blocking_now',
        question: 'Test?',
        pluginData: { source: 'test-plugin' },
      };
      const result = DecisionRequestSchema.parse(data);
      expect(result.pluginData).toEqual({ source: 'test-plugin' });
    });
  });

  describe('DecisionResponse', () => {
    it('should preserve unknown fields', () => {
      const data = {
        requestId: 'req-123',
        selectedOption: 'opt-1',
        respondedAt: '2024-01-15T10:30:00Z',
        analyticsId: 'analytics-456',
      };
      const result = DecisionResponseSchema.parse(data);
      expect(result.analyticsId).toBe('analytics-456');
    });
  });

  describe('ToolRegistration', () => {
    it('should preserve unknown fields', () => {
      const data = {
        name: 'plugin.tool',
        server: 'my-server',
        description: 'A tool',
        parameters: [],
        returns: { schema: {} },
        modes: ['default'],
        vendor: 'acme',
      };
      const result = ToolRegistrationSchema.parse(data);
      expect(result.vendor).toBe('acme');
    });
  });

  describe('ToolInvocation', () => {
    it('should preserve unknown fields', () => {
      const data = {
        id: 'inv-123',
        tool: 'plugin.tool',
        parameters: {},
        traceId: 'trace-456',
      };
      const result = ToolInvocationSchema.parse(data);
      expect(result.traceId).toBe('trace-456');
    });
  });

  describe('ToolResult', () => {
    it('should preserve unknown fields', () => {
      const data = {
        invocationId: 'inv-123',
        success: true,
        durationMs: 100,
        cacheHit: true,
      };
      const result = ToolResultSchema.parse(data);
      expect(result.cacheHit).toBe(true);
    });
  });

  describe('ModeDefinition', () => {
    it('should preserve unknown fields', () => {
      const data = {
        name: 'custom-mode',
        description: 'A custom mode',
        tools: ['tool.one'],
        priority: 10,
      };
      const result = ModeDefinitionSchema.parse(data);
      expect(result.priority).toBe(10);
    });
  });

  describe('ModeChangeRequest', () => {
    it('should preserve unknown fields', () => {
      const data = {
        mode: 'custom-mode',
        triggeredBy: 'user-action',
      };
      const result = ModeChangeRequestSchema.parse(data);
      expect(result.triggeredBy).toBe('user-action');
    });
  });
});

describe('Meta field serialization and optional presence', () => {
  // Valid ULID for correlation IDs (26 characters, Crockford Base32)
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';

  describe('ExtendedMetaSchema', () => {
    it('should accept all MessageMeta fields', () => {
      const meta = {
        correlationId: validUlid,
        replyTo: 'channel-reply',
        ttl: 30000,
        timestamp: '2024-01-15T10:30:00Z',
      };
      const result = ExtendedMetaSchema.parse(meta);
      expect(result.correlationId).toBe(validUlid);
      expect(result.replyTo).toBe('channel-reply');
      expect(result.ttl).toBe(30000);
      expect(result.timestamp).toBe('2024-01-15T10:30:00Z');
    });

    it('should allow additional plugin-specific fields', () => {
      const meta = {
        correlationId: validUlid,
        pluginVersion: '1.2.3',
        customMetadata: { key: 'value' },
      };
      const result = ExtendedMetaSchema.parse(meta);
      expect(result.pluginVersion).toBe('1.2.3');
      expect(result.customMetadata).toEqual({ key: 'value' });
    });
  });

  describe('DecisionRequest with meta', () => {
    it('should accept optional meta field', () => {
      const request = {
        id: 'req-123',
        type: 'question',
        urgency: 'blocking_now',
        question: 'Test?',
        meta: {
          correlationId: validUlid,
          timestamp: '2024-01-15T10:30:00Z',
        },
      };
      const result = DecisionRequestSchema.parse(request);
      expect(result.meta?.correlationId).toBe(validUlid);
    });

    it('should work without meta field', () => {
      const request = {
        id: 'req-123',
        type: 'question',
        urgency: 'blocking_now',
        question: 'Test?',
      };
      const result = DecisionRequestSchema.parse(request);
      expect(result.meta).toBeUndefined();
    });
  });

  describe('ToolRegistration with meta', () => {
    it('should accept optional meta field', () => {
      const reg = {
        name: 'plugin.tool',
        server: 'my-server',
        description: 'A tool',
        parameters: [],
        returns: { schema: {} },
        modes: ['default'],
        meta: {
          correlationId: validUlid,
          registeredAt: '2024-01-15T10:30:00Z',
        },
      };
      const result = ToolRegistrationSchema.parse(reg);
      expect(result.meta?.correlationId).toBe(validUlid);
      expect(result.meta?.registeredAt).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('ToolInvocation with meta', () => {
    it('should accept optional meta field', () => {
      const inv = {
        id: 'inv-123',
        tool: 'plugin.tool',
        parameters: {},
        meta: {
          ttl: 60000,
        },
      };
      const result = ToolInvocationSchema.parse(inv);
      expect(result.meta?.ttl).toBe(60000);
    });
  });

  describe('ToolResult with meta', () => {
    it('should accept optional meta field', () => {
      const result = ToolResultSchema.parse({
        invocationId: 'inv-123',
        success: true,
        durationMs: 150,
        meta: {
          timestamp: '2024-01-15T10:30:00Z',
        },
      });
      expect(result.meta?.timestamp).toBe('2024-01-15T10:30:00Z');
    });
  });

  describe('ModeDefinition with meta', () => {
    it('should accept optional meta field', () => {
      const mode = {
        name: 'test-mode',
        description: 'A test mode',
        tools: ['tool.one'],
        meta: {
          createdBy: 'system',
        },
      };
      const result = ModeDefinitionSchema.parse(mode);
      expect(result.meta?.createdBy).toBe('system');
    });
  });
});

describe('Backward compatibility', () => {
  it('Schema aliases should point to Latest', () => {
    expect(DecisionOptionSchema).toBe(DecisionOption.Latest);
    expect(DecisionRequestSchema).toBe(DecisionRequest.Latest);
    expect(DecisionResponseSchema).toBe(DecisionResponse.Latest);
    expect(ToolParameterSchemaSchema).toBe(ToolParameterSchema.Latest);
    expect(ReturnSchemaSchema).toBe(ReturnSchema.Latest);
    expect(ToolRegistrationSchema).toBe(ToolRegistration.Latest);
    expect(InvocationContextSchema).toBe(InvocationContext.Latest);
    expect(ToolInvocationSchema).toBe(ToolInvocation.Latest);
    expect(ToolErrorSchema).toBe(ToolError.Latest);
    expect(ToolResultSchema).toBe(ToolResult.Latest);
    expect(ModeDefinitionSchema).toBe(ModeDefinition.Latest);
    expect(ModeChangeRequestSchema).toBe(ModeChangeRequest.Latest);
  });
});
