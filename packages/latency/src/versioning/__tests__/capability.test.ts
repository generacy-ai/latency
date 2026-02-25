import { describe, it, expect, beforeEach } from 'vitest';
import {
  Capability,
  CapabilitySchema,
  CapabilityConfigSchema,
  CapabilityMissingError,
  createCapabilityQuery,
  type CapabilityQuery,
  type CapabilityResult,
} from '../../common/capability.js';

describe('Capability enum', () => {
  it('should define all core capabilities', () => {
    expect(Capability.TOOLS).toBe('tools');
    expect(Capability.MODES).toBe('modes');
    expect(Capability.CHANNELS).toBe('channels');
  });

  it('should define all decision capabilities', () => {
    expect(Capability.URGENCY).toBe('urgency');
    expect(Capability.BATCH_DECISIONS).toBe('batch_decisions');
    expect(Capability.DECISION_OPTIONS).toBe('decision_options');
  });

  it('should define all telemetry capabilities', () => {
    expect(Capability.TELEMETRY).toBe('telemetry');
    expect(Capability.METRICS).toBe('metrics');
  });
});

describe('CapabilitySchema', () => {
  it('should validate valid capability strings', () => {
    expect(CapabilitySchema.safeParse('tools').success).toBe(true);
    expect(CapabilitySchema.safeParse('modes').success).toBe(true);
    expect(CapabilitySchema.safeParse('channels').success).toBe(true);
    expect(CapabilitySchema.safeParse('urgency').success).toBe(true);
    expect(CapabilitySchema.safeParse('batch_decisions').success).toBe(true);
    expect(CapabilitySchema.safeParse('decision_options').success).toBe(true);
    expect(CapabilitySchema.safeParse('telemetry').success).toBe(true);
    expect(CapabilitySchema.safeParse('metrics').success).toBe(true);
  });

  it('should reject invalid capability strings', () => {
    expect(CapabilitySchema.safeParse('invalid').success).toBe(false);
    expect(CapabilitySchema.safeParse('').success).toBe(false);
    expect(CapabilitySchema.safeParse(123).success).toBe(false);
  });
});

describe('CapabilityConfigSchema', () => {
  it('should validate config without dependencies or deprecation', () => {
    const result = CapabilityConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should validate config with dependencies', () => {
    const result = CapabilityConfigSchema.safeParse({
      dependsOn: ['tools', 'modes'],
    });
    expect(result.success).toBe(true);
  });

  it('should validate config with deprecation info', () => {
    const result = CapabilityConfigSchema.safeParse({
      deprecated: {
        since: '2.0.0',
        replacement: 'metrics',
        message: 'Use metrics instead',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should validate full config', () => {
    const result = CapabilityConfigSchema.safeParse({
      dependsOn: ['tools'],
      deprecated: {
        since: '2.0.0',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('CapabilityMissingError', () => {
  it('should create error with all required fields', () => {
    const error = new CapabilityMissingError(
      Capability.URGENCY,
      [Capability.TOOLS, Capability.MODES],
      'Consider using the basic tools capability'
    );

    expect(error.code).toBe('CAPABILITY_MISSING');
    expect(error.capability).toBe(Capability.URGENCY);
    expect(error.availableCapabilities).toEqual([Capability.TOOLS, Capability.MODES]);
    expect(error.suggestion).toBe('Consider using the basic tools capability');
    expect(error.message).toContain('urgency');
  });

  it('should create error without suggestion', () => {
    const error = new CapabilityMissingError(
      Capability.METRICS,
      [Capability.TOOLS]
    );

    expect(error.code).toBe('CAPABILITY_MISSING');
    expect(error.capability).toBe(Capability.METRICS);
    expect(error.availableCapabilities).toEqual([Capability.TOOLS]);
    expect(error.suggestion).toBeUndefined();
  });
});

describe('CapabilityQuery', () => {
  let query: CapabilityQuery;

  beforeEach(() => {
    query = createCapabilityQuery([Capability.TOOLS, Capability.MODES, Capability.URGENCY]);
  });

  describe('hasCapability', () => {
    it('should return true for available capabilities', () => {
      expect(query.hasCapability(Capability.TOOLS)).toBe(true);
      expect(query.hasCapability(Capability.MODES)).toBe(true);
      expect(query.hasCapability(Capability.URGENCY)).toBe(true);
    });

    it('should return false for unavailable capabilities', () => {
      expect(query.hasCapability(Capability.METRICS)).toBe(false);
      expect(query.hasCapability(Capability.TELEMETRY)).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return all available capabilities', () => {
      const caps = query.getCapabilities();
      expect(caps).toHaveLength(3);
      expect(caps).toContain(Capability.TOOLS);
      expect(caps).toContain(Capability.MODES);
      expect(caps).toContain(Capability.URGENCY);
    });

    it('should return empty array when no capabilities', () => {
      const emptyQuery = createCapabilityQuery([]);
      expect(emptyQuery.getCapabilities()).toEqual([]);
    });
  });

  describe('requireCapability', () => {
    it('should not throw for available capabilities', () => {
      expect(() => query.requireCapability(Capability.TOOLS)).not.toThrow();
      expect(() => query.requireCapability(Capability.MODES)).not.toThrow();
    });

    it('should throw CapabilityMissingError for unavailable capabilities', () => {
      expect(() => query.requireCapability(Capability.METRICS)).toThrow(
        CapabilityMissingError
      );
    });

    it('should include available capabilities in error', () => {
      try {
        query.requireCapability(Capability.METRICS);
      } catch (e) {
        expect(e).toBeInstanceOf(CapabilityMissingError);
        const error = e as CapabilityMissingError;
        expect(error.availableCapabilities).toEqual([
          Capability.TOOLS,
          Capability.MODES,
          Capability.URGENCY,
        ]);
      }
    });
  });

  describe('tryRequireCapability', () => {
    it('should return success for available capabilities', () => {
      const result: CapabilityResult = query.tryRequireCapability(Capability.TOOLS);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return failure with error for unavailable capabilities', () => {
      const result: CapabilityResult = query.tryRequireCapability(Capability.METRICS);
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(CapabilityMissingError);
      expect(result.error?.capability).toBe(Capability.METRICS);
    });
  });
});

describe('createCapabilityQuery edge cases', () => {
  it('should handle duplicate capabilities', () => {
    const query = createCapabilityQuery([
      Capability.TOOLS,
      Capability.TOOLS,
      Capability.MODES,
    ]);
    // Should deduplicate
    expect(query.getCapabilities()).toHaveLength(2);
  });

  it('should handle empty capabilities array', () => {
    const query = createCapabilityQuery([]);
    expect(query.getCapabilities()).toEqual([]);
    expect(query.hasCapability(Capability.TOOLS)).toBe(false);
  });
});
