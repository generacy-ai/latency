import { describe, it, expect } from 'vitest';
import {
  ProtocolHandshakeSchema,
  ProtocolHandshakeResponseSchema,
  ProtocolNegotiationErrorSchema,
  ProtocolHandshakeResultSchema,
  negotiateProtocol,
  negotiateWithWarnings,
  createProtocolNegotiationError,
  createHandshakeResponse,
  parseProtocolHandshake,
  safeParseProtocolHandshake,
} from '../../../src/protocols/agency-generacy/protocol-handshake.js';

describe('ProtocolHandshakeSchema', () => {
  it('validates correct handshake data', () => {
    const data = {
      component: 'agency',
      packageVersion: '1.0.0',
      supportedProtocols: ['1.0.0', '2.0.0'],
    };
    expect(ProtocolHandshakeSchema.parse(data)).toEqual(data);
  });

  it('validates generacy component', () => {
    const data = {
      component: 'generacy',
      packageVersion: '2.1.0',
      supportedProtocols: ['1.0.0'],
    };
    expect(ProtocolHandshakeSchema.parse(data)).toEqual(data);
  });

  it('validates humancy component', () => {
    const data = {
      component: 'humancy',
      packageVersion: '1.0.0',
      supportedProtocols: ['1.0.0'],
    };
    expect(ProtocolHandshakeSchema.parse(data)).toEqual(data);
  });

  it('rejects invalid component', () => {
    const data = {
      component: 'invalid',
      packageVersion: '1.0.0',
      supportedProtocols: ['1.0.0'],
    };
    expect(() => ProtocolHandshakeSchema.parse(data)).toThrow();
  });

  it('rejects invalid semver', () => {
    const data = {
      component: 'agency',
      packageVersion: 'invalid',
      supportedProtocols: ['1.0.0'],
    };
    expect(() => ProtocolHandshakeSchema.parse(data)).toThrow();
  });

  it('rejects empty supportedProtocols', () => {
    const data = {
      component: 'agency',
      packageVersion: '1.0.0',
      supportedProtocols: [],
    };
    expect(() => ProtocolHandshakeSchema.parse(data)).toThrow();
  });
});

describe('ProtocolHandshakeResponseSchema', () => {
  it('validates correct response data', () => {
    const data = {
      success: true,
      selectedProtocol: '2.0.0',
      capabilities: ['modes', 'telemetry'],
    };
    expect(ProtocolHandshakeResponseSchema.parse(data)).toEqual(data);
  });

  it('validates response with warnings', () => {
    const data = {
      success: true,
      selectedProtocol: '2.0.0',
      capabilities: ['modes', 'telemetry'],
      warnings: ['Capability X is deprecated'],
    };
    expect(ProtocolHandshakeResponseSchema.parse(data)).toEqual(data);
  });

  it('validates response with empty warnings array', () => {
    const data = {
      success: true,
      selectedProtocol: '2.0.0',
      capabilities: [],
      warnings: [],
    };
    expect(ProtocolHandshakeResponseSchema.parse(data)).toEqual(data);
  });

  it('rejects response without success: true', () => {
    const data = {
      success: false,
      selectedProtocol: '2.0.0',
      capabilities: [],
    };
    expect(() => ProtocolHandshakeResponseSchema.parse(data)).toThrow();
  });
});

describe('ProtocolNegotiationErrorSchema', () => {
  it('validates correct error response', () => {
    const data = {
      success: false,
      error: {
        code: 'PROTOCOL_NEGOTIATION_FAILED',
        message: 'No compatible protocol',
        details: {
          requestedProtocols: ['3.0.0'],
          availableProtocols: ['1.0.0', '2.0.0'],
        },
        retryable: false,
      },
    };
    expect(ProtocolNegotiationErrorSchema.parse(data)).toEqual(data);
  });

  it('rejects error with wrong code', () => {
    const data = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some error',
        details: {
          requestedProtocols: [],
          availableProtocols: [],
        },
        retryable: false,
      },
    };
    expect(() => ProtocolNegotiationErrorSchema.parse(data)).toThrow();
  });
});

describe('ProtocolHandshakeResultSchema (discriminated union)', () => {
  it('parses success response', () => {
    const data = {
      success: true,
      selectedProtocol: '1.0.0',
      capabilities: ['modes'],
    };
    const result = ProtocolHandshakeResultSchema.parse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.selectedProtocol).toBe('1.0.0');
    }
  });

  it('parses error response', () => {
    const data = {
      success: false,
      error: {
        code: 'PROTOCOL_NEGOTIATION_FAILED',
        message: 'No compatible protocol',
        details: {
          requestedProtocols: ['3.0.0'],
          availableProtocols: ['1.0.0'],
        },
        retryable: false,
      },
    };
    const result = ProtocolHandshakeResultSchema.parse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('PROTOCOL_NEGOTIATION_FAILED');
    }
  });
});

describe('negotiateProtocol', () => {
  it('returns highest mutual version', () => {
    const client = ['1.0.0', '2.0.0', '3.0.0'];
    const server = ['1.0.0', '2.0.0'];
    expect(negotiateProtocol(client, server)).toBe('2.0.0');
  });

  it('returns null when no overlap', () => {
    const client = ['3.0.0', '4.0.0'];
    const server = ['1.0.0', '2.0.0'];
    expect(negotiateProtocol(client, server)).toBeNull();
  });

  it('handles single version overlap', () => {
    const client = ['1.0.0'];
    const server = ['1.0.0', '2.0.0'];
    expect(negotiateProtocol(client, server)).toBe('1.0.0');
  });

  it('handles prerelease versions correctly', () => {
    const client = ['1.0.0', '2.0.0-alpha'];
    const server = ['2.0.0-alpha', '2.0.0'];
    expect(negotiateProtocol(client, server)).toBe('2.0.0-alpha');
  });
});

describe('createProtocolNegotiationError', () => {
  it('creates error with correct structure', () => {
    const error = createProtocolNegotiationError(['3.0.0'], ['1.0.0', '2.0.0']);
    expect(error.success).toBe(false);
    expect(error.error.code).toBe('PROTOCOL_NEGOTIATION_FAILED');
    expect(error.error.retryable).toBe(false);
    expect(error.error.details.requestedProtocols).toEqual(['3.0.0']);
    expect(error.error.details.availableProtocols).toEqual(['1.0.0', '2.0.0']);
  });

  it('creates meaningful error message', () => {
    const error = createProtocolNegotiationError(['3.0.0'], ['1.0.0']);
    expect(error.error.message).toContain('3.0.0');
    expect(error.error.message).toContain('1.0.0');
  });
});

describe('parse helpers', () => {
  it('parseProtocolHandshake returns parsed data', () => {
    const data = {
      component: 'agency',
      packageVersion: '1.0.0',
      supportedProtocols: ['1.0.0'],
    };
    expect(parseProtocolHandshake(data)).toEqual(data);
  });

  it('safeParseProtocolHandshake returns success result', () => {
    const data = {
      component: 'agency',
      packageVersion: '1.0.0',
      supportedProtocols: ['1.0.0'],
    };
    const result = safeParseProtocolHandshake(data);
    expect(result.success).toBe(true);
  });

  it('safeParseProtocolHandshake returns error result for invalid data', () => {
    const result = safeParseProtocolHandshake({ invalid: true });
    expect(result.success).toBe(false);
  });
});

describe('negotiateWithWarnings', () => {
  it('negotiates protocol and returns empty warnings when no deprecated capabilities', () => {
    const result = negotiateWithWarnings({
      clientProtocols: ['1.0.0', '2.0.0'],
      serverProtocols: ['2.0.0', '3.0.0'],
    });
    expect(result.selectedProtocol).toBe('2.0.0');
    expect(result.warnings).toEqual([]);
  });

  it('collects deprecation warnings for deprecated capabilities', () => {
    const result = negotiateWithWarnings({
      clientProtocols: ['1.0.0', '2.0.0'],
      serverProtocols: ['2.0.0'],
      requestedCapabilities: ['telemetry', 'legacy_mode'],
      deprecatedCapabilities: new Map([
        ['legacy_mode', 'Deprecated since 2.0.0. Use modes instead.'],
      ]),
    });
    expect(result.selectedProtocol).toBe('2.0.0');
    expect(result.warnings).toEqual(['Deprecated since 2.0.0. Use modes instead.']);
  });

  it('collects multiple deprecation warnings', () => {
    const result = negotiateWithWarnings({
      clientProtocols: ['1.0.0'],
      serverProtocols: ['1.0.0'],
      requestedCapabilities: ['old_feature', 'another_old'],
      deprecatedCapabilities: new Map([
        ['old_feature', 'Deprecated in 1.5.0'],
        ['another_old', 'Deprecated in 1.8.0'],
      ]),
    });
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings).toContain('Deprecated in 1.5.0');
    expect(result.warnings).toContain('Deprecated in 1.8.0');
  });

  it('returns null selectedProtocol when no overlap', () => {
    const result = negotiateWithWarnings({
      clientProtocols: ['3.0.0'],
      serverProtocols: ['1.0.0', '2.0.0'],
    });
    expect(result.selectedProtocol).toBeNull();
    expect(result.warnings).toEqual([]);
  });
});

describe('createHandshakeResponse', () => {
  it('creates response without warnings', () => {
    const response = createHandshakeResponse('2.0.0', ['modes', 'telemetry']);
    expect(response.success).toBe(true);
    expect(response.selectedProtocol).toBe('2.0.0');
    expect(response.capabilities).toEqual(['modes', 'telemetry']);
    expect(response.warnings).toBeUndefined();
  });

  it('creates response with warnings', () => {
    const response = createHandshakeResponse(
      '2.0.0',
      ['modes'],
      ['Warning 1', 'Warning 2']
    );
    expect(response.success).toBe(true);
    expect(response.warnings).toEqual(['Warning 1', 'Warning 2']);
  });

  it('excludes warnings field when empty array provided', () => {
    const response = createHandshakeResponse('2.0.0', ['modes'], []);
    expect(response.warnings).toBeUndefined();
  });
});

describe('full handshake flow with warnings', () => {
  it('performs complete handshake with deprecation warnings', () => {
    // Simulate client handshake request
    const clientRequest = {
      component: 'agency' as const,
      packageVersion: '1.5.0',
      supportedProtocols: ['1.0.0', '2.0.0'],
    };
    ProtocolHandshakeSchema.parse(clientRequest);

    // Server performs negotiation with warnings
    const deprecatedCaps = new Map([
      ['old_telemetry', 'Use telemetry instead. Deprecated since 1.2.0.'],
    ]);

    const negotiation = negotiateWithWarnings({
      clientProtocols: clientRequest.supportedProtocols,
      serverProtocols: ['2.0.0', '3.0.0'],
      requestedCapabilities: ['modes', 'old_telemetry'],
      deprecatedCapabilities: deprecatedCaps,
    });

    expect(negotiation.selectedProtocol).toBe('2.0.0');
    expect(negotiation.warnings).toHaveLength(1);

    // Create response with warnings
    const response = createHandshakeResponse(
      negotiation.selectedProtocol!,
      ['modes', 'telemetry'],
      negotiation.warnings
    );

    // Validate response
    const parsed = ProtocolHandshakeResponseSchema.parse(response);
    expect(parsed.success).toBe(true);
    expect(parsed.warnings).toContain('Use telemetry instead. Deprecated since 1.2.0.');
  });
});
