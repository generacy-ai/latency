import { describe, it, expect } from 'vitest';
import {
  FeaturesSchema,
  CapabilityDeclarationSchema,
  parseCapabilityDeclaration,
  safeParseCapabilityDeclaration,
} from '../../../src/protocols/agency-generacy/capability-declaration.js';

describe('FeaturesSchema', () => {
  it('validates correct features data', () => {
    const data = {
      modes: true,
      urgency: false,
      batchQuestions: true,
      channels: false,
      telemetry: true,
    };
    expect(FeaturesSchema.parse(data)).toEqual(data);
  });

  it('rejects missing feature flag', () => {
    const data = {
      modes: true,
      urgency: false,
      batchQuestions: true,
      // missing channels and telemetry
    };
    expect(() => FeaturesSchema.parse(data)).toThrow();
  });

  it('rejects non-boolean feature values', () => {
    const data = {
      modes: 'yes',
      urgency: false,
      batchQuestions: true,
      channels: false,
      telemetry: true,
    };
    expect(() => FeaturesSchema.parse(data)).toThrow();
  });
});

describe('CapabilityDeclarationSchema', () => {
  it('validates correct capability declaration', () => {
    const data = {
      features: {
        modes: true,
        urgency: true,
        batchQuestions: true,
        channels: true,
        telemetry: true,
      },
      tools: ['tool1', 'tool2', 'namespace.tool3'],
      protocolVersion: '1.0.0',
    };
    expect(CapabilityDeclarationSchema.parse(data)).toEqual(data);
  });

  it('validates empty tools array', () => {
    const data = {
      features: {
        modes: false,
        urgency: false,
        batchQuestions: false,
        channels: false,
        telemetry: false,
      },
      tools: [],
      protocolVersion: '2.1.0',
    };
    expect(CapabilityDeclarationSchema.parse(data)).toEqual(data);
  });

  it('rejects invalid protocol version', () => {
    const data = {
      features: {
        modes: true,
        urgency: true,
        batchQuestions: true,
        channels: true,
        telemetry: true,
      },
      tools: [],
      protocolVersion: 'invalid',
    };
    expect(() => CapabilityDeclarationSchema.parse(data)).toThrow();
  });

  it('accepts prerelease version', () => {
    const data = {
      features: {
        modes: true,
        urgency: false,
        batchQuestions: false,
        channels: false,
        telemetry: false,
      },
      tools: ['tool1'],
      protocolVersion: '1.0.0-alpha.1',
    };
    expect(CapabilityDeclarationSchema.parse(data)).toEqual(data);
  });
});

describe('parse helpers', () => {
  const validData = {
    features: {
      modes: true,
      urgency: false,
      batchQuestions: false,
      channels: false,
      telemetry: false,
    },
    tools: ['tool1'],
    protocolVersion: '1.0.0',
  };

  it('parseCapabilityDeclaration returns parsed data', () => {
    expect(parseCapabilityDeclaration(validData)).toEqual(validData);
  });

  it('parseCapabilityDeclaration throws for invalid data', () => {
    expect(() => parseCapabilityDeclaration({ invalid: true })).toThrow();
  });

  it('safeParseCapabilityDeclaration returns success for valid data', () => {
    const result = safeParseCapabilityDeclaration(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('safeParseCapabilityDeclaration returns error for invalid data', () => {
    const result = safeParseCapabilityDeclaration({ invalid: true });
    expect(result.success).toBe(false);
  });
});
