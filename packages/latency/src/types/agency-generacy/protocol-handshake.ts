import { z } from 'zod';
import { SemVerStringSchema, compareVersions } from '../../common/version.js';

// Component identifier - includes all three ecosystem components
export const ComponentSchema = z.enum(['agency', 'generacy', 'humancy']);
export type Component = z.infer<typeof ComponentSchema>;

// Protocol Handshake Request
export const ProtocolHandshakeSchema = z.object({
  component: ComponentSchema,
  packageVersion: SemVerStringSchema,
  supportedProtocols: z.array(SemVerStringSchema).min(1),
});

export type ProtocolHandshake = z.infer<typeof ProtocolHandshakeSchema>;

// Protocol Handshake Success Response
export const ProtocolHandshakeResponseSchema = z.object({
  success: z.literal(true),
  selectedProtocol: SemVerStringSchema,
  capabilities: z.array(z.string()),
  /** Deprecation or compatibility warnings */
  warnings: z.array(z.string()).optional(),
});

export type ProtocolHandshakeResponse = z.infer<typeof ProtocolHandshakeResponseSchema>;

// Protocol Negotiation Error Details
export const ProtocolNegotiationErrorDetailsSchema = z.object({
  requestedProtocols: z.array(z.string()),
  availableProtocols: z.array(z.string()),
});

export type ProtocolNegotiationErrorDetails = z.infer<typeof ProtocolNegotiationErrorDetailsSchema>;

// Protocol Negotiation Error Response
export const ProtocolNegotiationErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.literal('PROTOCOL_NEGOTIATION_FAILED'),
    message: z.string(),
    details: ProtocolNegotiationErrorDetailsSchema,
    retryable: z.literal(false),
  }),
});

export type ProtocolNegotiationError = z.infer<typeof ProtocolNegotiationErrorSchema>;

// Combined Response (discriminated union)
export const ProtocolHandshakeResultSchema = z.discriminatedUnion('success', [
  ProtocolHandshakeResponseSchema,
  ProtocolNegotiationErrorSchema,
]);

export type ProtocolHandshakeResult = z.infer<typeof ProtocolHandshakeResultSchema>;

/**
 * Negotiate a protocol version between client and server.
 *
 * @param clientProtocols - Protocols supported by the client
 * @param serverProtocols - Protocols supported by the server
 * @returns The highest mutually supported version, or null if no overlap
 */
export function negotiateProtocol(
  clientProtocols: string[],
  serverProtocols: string[]
): string | null {
  const serverSet = new Set(serverProtocols);
  const mutual = clientProtocols.filter((p) => serverSet.has(p));

  if (mutual.length === 0) {
    return null;
  }

  // Sort descending by version and return the highest
  return mutual.sort((a, b) => compareVersions(b, a))[0] ?? null;
}

/**
 * Create a protocol negotiation error response.
 */
export function createProtocolNegotiationError(
  requestedProtocols: string[],
  availableProtocols: string[]
): ProtocolNegotiationError {
  return {
    success: false,
    error: {
      code: 'PROTOCOL_NEGOTIATION_FAILED',
      message: `No compatible protocol version found. Client supports: [${requestedProtocols.join(', ')}], Server supports: [${availableProtocols.join(', ')}]`,
      details: {
        requestedProtocols,
        availableProtocols,
      },
      retryable: false,
    },
  };
}

/**
 * Options for protocol negotiation with warnings.
 */
export interface NegotiateWithWarningsOptions {
  /** Protocols supported by the client */
  clientProtocols: string[];
  /** Protocols supported by the server */
  serverProtocols: string[];
  /** Capabilities requested by the client */
  requestedCapabilities?: string[];
  /** Deprecated capabilities that should trigger warnings */
  deprecatedCapabilities?: Map<string, string>;
}

/**
 * Result of protocol negotiation with collected warnings.
 */
export interface NegotiationWithWarningsResult {
  /** The selected protocol version, or null if negotiation failed */
  selectedProtocol: string | null;
  /** Collected deprecation and compatibility warnings */
  warnings: string[];
}

/**
 * Negotiate protocol and collect deprecation warnings.
 *
 * This function performs protocol negotiation while also collecting
 * any deprecation warnings for capabilities that are being phased out.
 *
 * @param options - Negotiation options
 * @returns Negotiation result with warnings
 *
 * @example
 * ```typescript
 * const result = negotiateWithWarnings({
 *   clientProtocols: ['1.0.0', '2.0.0'],
 *   serverProtocols: ['2.0.0', '3.0.0'],
 *   requestedCapabilities: ['telemetry', 'legacy_mode'],
 *   deprecatedCapabilities: new Map([
 *     ['legacy_mode', 'Deprecated since 2.0.0. Use modes instead.']
 *   ]),
 * });
 * // result.selectedProtocol === '2.0.0'
 * // result.warnings === ['Deprecated since 2.0.0. Use modes instead.']
 * ```
 */
export function negotiateWithWarnings(
  options: NegotiateWithWarningsOptions
): NegotiationWithWarningsResult {
  const {
    clientProtocols,
    serverProtocols,
    requestedCapabilities = [],
    deprecatedCapabilities = new Map(),
  } = options;

  const selectedProtocol = negotiateProtocol(clientProtocols, serverProtocols);
  const warnings: string[] = [];

  // Collect deprecation warnings for requested capabilities
  for (const cap of requestedCapabilities) {
    const deprecationMessage = deprecatedCapabilities.get(cap);
    if (deprecationMessage) {
      warnings.push(deprecationMessage);
    }
  }

  return {
    selectedProtocol,
    warnings,
  };
}

/**
 * Create a successful handshake response with optional warnings.
 *
 * @param selectedProtocol - The negotiated protocol version
 * @param capabilities - Available capabilities for this session
 * @param warnings - Optional array of deprecation/compatibility warnings
 * @returns A valid ProtocolHandshakeResponse
 */
export function createHandshakeResponse(
  selectedProtocol: string,
  capabilities: string[],
  warnings?: string[]
): ProtocolHandshakeResponse {
  const response: ProtocolHandshakeResponse = {
    success: true,
    selectedProtocol,
    capabilities,
  };

  if (warnings && warnings.length > 0) {
    response.warnings = warnings;
  }

  return response;
}

// Parse helpers
export const parseProtocolHandshake = (data: unknown): ProtocolHandshake =>
  ProtocolHandshakeSchema.parse(data);

export const safeParseProtocolHandshake = (data: unknown) =>
  ProtocolHandshakeSchema.safeParse(data);

export const parseProtocolHandshakeResponse = (data: unknown): ProtocolHandshakeResponse =>
  ProtocolHandshakeResponseSchema.parse(data);

export const safeParseProtocolHandshakeResponse = (data: unknown) =>
  ProtocolHandshakeResponseSchema.safeParse(data);

export const parseProtocolHandshakeResult = (data: unknown): ProtocolHandshakeResult =>
  ProtocolHandshakeResultSchema.parse(data);

export const safeParseProtocolHandshakeResult = (data: unknown) =>
  ProtocolHandshakeResultSchema.safeParse(data);
