import { describe, it, expect } from 'vitest';
import {
  ProtocolHandshakeSchema,
  ProtocolHandshakeResponseSchema,
  negotiateProtocol,
  negotiateWithWarnings,
  createHandshakeResponse,
  type ProtocolHandshake,
  type ProtocolHandshakeResponse,
} from '../../../src/protocols/agency-generacy/protocol-handshake.js';
import {
  Capability,
  createCapabilityQuery,
} from '../../../src/protocols/common/capability.js';
import {
  validateCapabilityDependencies,
} from '../../../src/protocols/version-compatibility/capability-registry.js';
import { VersionedDecisionRequest } from '../../../src/protocols/version-compatibility/versioned-schemas.js';

// ============================================================================
// Compatibility Matrix Test Helpers
// ============================================================================

/**
 * Simulates a client/server handshake.
 */
interface HandshakeScenario {
  name: string;
  client: {
    component: 'agency' | 'generacy' | 'humancy';
    version: string;
    protocols: string[];
    capabilities?: string[];
  };
  server: {
    protocols: string[];
    capabilities: string[];
    deprecatedCapabilities?: Map<string, string>;
  };
}

/**
 * Execute a handshake scenario and return the result.
 */
function executeHandshake(scenario: HandshakeScenario): {
  request: ProtocolHandshake;
  response: ProtocolHandshakeResponse | null;
  warnings: string[];
} {
  // Create and validate client request
  const request: ProtocolHandshake = {
    component: scenario.client.component,
    packageVersion: scenario.client.version,
    supportedProtocols: scenario.client.protocols,
  };
  ProtocolHandshakeSchema.parse(request);

  // Perform negotiation with warnings
  const negotiationOptions: Parameters<typeof negotiateWithWarnings>[0] = {
    clientProtocols: scenario.client.protocols,
    serverProtocols: scenario.server.protocols,
  };
  if (scenario.client.capabilities !== undefined) {
    negotiationOptions.requestedCapabilities = scenario.client.capabilities;
  }
  if (scenario.server.deprecatedCapabilities !== undefined) {
    negotiationOptions.deprecatedCapabilities = scenario.server.deprecatedCapabilities;
  }
  const negotiation = negotiateWithWarnings(negotiationOptions);

  if (!negotiation.selectedProtocol) {
    return { request, response: null, warnings: negotiation.warnings };
  }

  // Determine available capabilities (intersection of requested and server caps)
  const clientCaps = new Set(scenario.client.capabilities ?? []);
  const availableCaps = scenario.server.capabilities.filter(
    (c) => clientCaps.size === 0 || clientCaps.has(c)
  );

  const response = createHandshakeResponse(
    negotiation.selectedProtocol,
    availableCaps,
    negotiation.warnings.length > 0 ? negotiation.warnings : undefined
  );

  ProtocolHandshakeResponseSchema.parse(response);

  return { request, response, warnings: negotiation.warnings };
}

// ============================================================================
// Compatibility Matrix Tests
// ============================================================================

describe('Compatibility Matrix: Protocol Negotiation', () => {
  describe('V1 client with V2 server', () => {
    it('should negotiate to V1 protocol', () => {
      const result = executeHandshake({
        name: 'V1 client to V2 server',
        client: {
          component: 'agency',
          version: '1.0.0',
          protocols: ['1.0.0'],
        },
        server: {
          protocols: ['1.0.0', '2.0.0'],
          capabilities: ['tools', 'modes'],
        },
      });

      expect(result.response).not.toBeNull();
      expect(result.response!.selectedProtocol).toBe('1.0.0');
    });

    it('should provide limited capabilities for V1 protocol', () => {
      const result = executeHandshake({
        name: 'V1 client capabilities',
        client: {
          component: 'agency',
          version: '1.0.0',
          protocols: ['1.0.0'],
          capabilities: ['tools', 'modes'],
        },
        server: {
          protocols: ['1.0.0', '2.0.0'],
          capabilities: ['tools', 'modes', 'urgency', 'telemetry'],
        },
      });

      expect(result.response!.capabilities).toContain('tools');
      expect(result.response!.capabilities).toContain('modes');
    });
  });

  describe('V2 client with V1 server', () => {
    it('should negotiate to V1 protocol', () => {
      const result = executeHandshake({
        name: 'V2 client to V1 server',
        client: {
          component: 'agency',
          version: '2.0.0',
          protocols: ['1.0.0', '2.0.0'],
        },
        server: {
          protocols: ['1.0.0'],
          capabilities: ['tools'],
        },
      });

      expect(result.response).not.toBeNull();
      expect(result.response!.selectedProtocol).toBe('1.0.0');
    });

    it('should receive only V1 capabilities', () => {
      const result = executeHandshake({
        name: 'V2 client limited by V1 server',
        client: {
          component: 'agency',
          version: '2.0.0',
          protocols: ['1.0.0', '2.0.0'],
          capabilities: ['tools', 'modes', 'urgency'],
        },
        server: {
          protocols: ['1.0.0'],
          capabilities: ['tools', 'modes'],
        },
      });

      expect(result.response!.capabilities).toContain('tools');
      expect(result.response!.capabilities).toContain('modes');
      // Server doesn't have urgency
      expect(result.response!.capabilities).not.toContain('urgency');
    });
  });

  describe('V2 client with V2 server', () => {
    it('should negotiate to highest common version (V2)', () => {
      const result = executeHandshake({
        name: 'V2 client to V2 server',
        client: {
          component: 'agency',
          version: '2.0.0',
          protocols: ['1.0.0', '2.0.0'],
        },
        server: {
          protocols: ['1.0.0', '2.0.0'],
          capabilities: ['tools', 'modes', 'urgency'],
        },
      });

      expect(result.response!.selectedProtocol).toBe('2.0.0');
    });

    it('should have full capabilities', () => {
      const result = executeHandshake({
        name: 'V2 full capabilities',
        client: {
          component: 'agency',
          version: '2.0.0',
          protocols: ['2.0.0'],
          capabilities: ['tools', 'modes', 'urgency'],
        },
        server: {
          protocols: ['2.0.0'],
          capabilities: ['tools', 'modes', 'urgency', 'telemetry'],
        },
      });

      expect(result.response!.capabilities).toContain('tools');
      expect(result.response!.capabilities).toContain('modes');
      expect(result.response!.capabilities).toContain('urgency');
    });
  });

  describe('No common protocol', () => {
    it('should fail negotiation', () => {
      const result = executeHandshake({
        name: 'Incompatible versions',
        client: {
          component: 'agency',
          version: '3.0.0',
          protocols: ['3.0.0'],
        },
        server: {
          protocols: ['1.0.0', '2.0.0'],
          capabilities: ['tools'],
        },
      });

      expect(result.response).toBeNull();
    });
  });
});

describe('Compatibility Matrix: Capability Negotiation', () => {
  describe('Capability dependency validation', () => {
    it('should validate when dependencies are satisfied', () => {
      const result = validateCapabilityDependencies([
        Capability.TELEMETRY,
        Capability.METRICS, // Depends on TELEMETRY
      ]);
      expect(result.valid).toBe(true);
    });

    it('should fail when dependencies are missing', () => {
      const result = validateCapabilityDependencies([
        Capability.METRICS, // Missing TELEMETRY dependency
      ]);
      expect(result.valid).toBe(false);
      expect(result.missingDependencies.get(Capability.METRICS)).toContain(
        Capability.TELEMETRY
      );
    });
  });

  describe('Capability query across versions', () => {
    it('V1 capabilities should be subset of V2', () => {
      const v1Caps = [Capability.TOOLS, Capability.MODES];
      const v2Caps = [Capability.TOOLS, Capability.MODES, Capability.URGENCY];

      const v1Query = createCapabilityQuery(v1Caps);
      const v2Query = createCapabilityQuery(v2Caps);

      // V1 has base capabilities
      expect(v1Query.hasCapability(Capability.TOOLS)).toBe(true);
      expect(v1Query.hasCapability(Capability.MODES)).toBe(true);
      expect(v1Query.hasCapability(Capability.URGENCY)).toBe(false);

      // V2 has all capabilities
      expect(v2Query.hasCapability(Capability.TOOLS)).toBe(true);
      expect(v2Query.hasCapability(Capability.MODES)).toBe(true);
      expect(v2Query.hasCapability(Capability.URGENCY)).toBe(true);
    });
  });
});

describe('Compatibility Matrix: Schema Versioning', () => {
  describe('V1 client sending data to V2 server', () => {
    it('V1 data should be valid for V2 schema (backwards compatible)', () => {
      const v1Data = {
        question: 'What should I do?',
        context: 'Working on a project',
      };

      // V1 data is valid for both V1 and V2 schemas
      expect(VersionedDecisionRequest.V1.safeParse(v1Data).success).toBe(true);
      expect(VersionedDecisionRequest.V2.safeParse(v1Data).success).toBe(true);
    });
  });

  describe('V2 client sending data to V1 server', () => {
    it('V2 data should be parseable by V1 schema (extra fields stripped)', () => {
      const v2Data = {
        question: 'What should I do?',
        urgency: 'high',
        options: [{ id: '1', label: 'Option 1' }],
      };

      // V1 schema will parse but strip V2-only fields
      const parsed = VersionedDecisionRequest.V1.parse(v2Data);
      expect(parsed.question).toBe('What should I do?');
      // V2 fields are not in the parsed result type
      expect('urgency' in parsed).toBe(false);
    });
  });

  describe('Schema selection based on negotiated protocol', () => {
    it('should select correct schema version', () => {
      const negotiatedVersion = '1.0';
      const schema = VersionedDecisionRequest.getVersion(negotiatedVersion);

      expect(schema).toBe(VersionedDecisionRequest.V1);

      const data = { question: 'Test?' };
      expect(schema!.safeParse(data).success).toBe(true);
    });

    it('should use latest for V2 protocol', () => {
      const negotiatedVersion = '2.0';
      const schema = VersionedDecisionRequest.getVersion(negotiatedVersion);

      expect(schema).toBe(VersionedDecisionRequest.V2);

      const data = {
        question: 'Test?',
        urgency: 'high',
      };
      expect(schema!.safeParse(data).success).toBe(true);
    });
  });
});

describe('Compatibility Matrix: Deprecation Warnings', () => {
  it('should collect warnings for deprecated capabilities', () => {
    const result = executeHandshake({
      name: 'Deprecated capability warning',
      client: {
        component: 'agency',
        version: '2.0.0',
        protocols: ['2.0.0'],
        capabilities: ['tools', 'old_feature'],
      },
      server: {
        protocols: ['2.0.0'],
        capabilities: ['tools', 'new_feature'],
        deprecatedCapabilities: new Map([
          ['old_feature', 'Deprecated since 1.5.0. Use new_feature instead.'],
        ]),
      },
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Deprecated since 1.5.0');
    expect(result.response!.warnings).toEqual(result.warnings);
  });

  it('should not include warnings when no deprecated capabilities', () => {
    const result = executeHandshake({
      name: 'No deprecations',
      client: {
        component: 'agency',
        version: '2.0.0',
        protocols: ['2.0.0'],
        capabilities: ['tools'],
      },
      server: {
        protocols: ['2.0.0'],
        capabilities: ['tools'],
      },
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.response!.warnings).toBeUndefined();
  });
});

describe('Compatibility Matrix: All Component Types', () => {
  const components: Array<'agency' | 'generacy' | 'humancy'> = [
    'agency',
    'generacy',
    'humancy',
  ];

  for (const component of components) {
    it(`should support ${component} component handshake`, () => {
      const result = executeHandshake({
        name: `${component} handshake`,
        client: {
          component,
          version: '1.0.0',
          protocols: ['1.0.0'],
        },
        server: {
          protocols: ['1.0.0'],
          capabilities: ['tools'],
        },
      });

      expect(result.response).not.toBeNull();
      expect(result.request.component).toBe(component);
    });
  }
});

describe('Compatibility Matrix: Edge Cases', () => {
  it('should handle multiple protocol versions in negotiation', () => {
    const result = negotiateProtocol(
      ['1.0.0', '1.5.0', '2.0.0'],
      ['1.0.0', '1.5.0', '2.0.0', '3.0.0']
    );
    expect(result).toBe('2.0.0');
  });

  it('should handle prerelease versions', () => {
    const result = negotiateProtocol(
      ['2.0.0-alpha', '2.0.0-beta'],
      ['2.0.0-beta', '2.0.0']
    );
    expect(result).toBe('2.0.0-beta');
  });

  it('should prefer stable over prerelease when both available', () => {
    const result = negotiateProtocol(
      ['2.0.0-alpha', '2.0.0'],
      ['2.0.0-alpha', '2.0.0']
    );
    expect(result).toBe('2.0.0');
  });
});
