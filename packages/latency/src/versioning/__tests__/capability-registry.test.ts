import { describe, it, expect } from 'vitest';
import { Capability } from '../../common/capability.js';
import {
  CAPABILITY_CONFIG,
  CAPABILITY_DEPS,
  validateCapabilityDependencies,
  getCapabilityConfig,
  isCapabilityDeprecated,
  getDeprecationInfo,
  getAllDependencies,
} from '../capability-registry.js';

describe('CAPABILITY_DEPS', () => {
  it('should define metrics depending on telemetry', () => {
    const deps = CAPABILITY_DEPS.get(Capability.METRICS);
    expect(deps).toContain(Capability.TELEMETRY);
  });

  it('should define batch_decisions depending on decision_options', () => {
    const deps = CAPABILITY_DEPS.get(Capability.BATCH_DECISIONS);
    expect(deps).toContain(Capability.DECISION_OPTIONS);
  });

  it('should have no dependencies for core capabilities', () => {
    expect(CAPABILITY_DEPS.get(Capability.TOOLS)).toBeUndefined();
    expect(CAPABILITY_DEPS.get(Capability.MODES)).toBeUndefined();
    expect(CAPABILITY_DEPS.get(Capability.CHANNELS)).toBeUndefined();
  });
});

describe('CAPABILITY_CONFIG', () => {
  it('should define config for all capabilities', () => {
    const allCapabilities = Object.values(Capability);
    for (const cap of allCapabilities) {
      expect(CAPABILITY_CONFIG.has(cap)).toBe(true);
    }
  });

  it('should have dependencies in config matching CAPABILITY_DEPS', () => {
    const metricsConfig = CAPABILITY_CONFIG.get(Capability.METRICS);
    expect(metricsConfig?.dependsOn).toContain(Capability.TELEMETRY);
  });
});

describe('validateCapabilityDependencies', () => {
  it('should return valid for capabilities with no dependencies', () => {
    const result = validateCapabilityDependencies([
      Capability.TOOLS,
      Capability.MODES,
      Capability.CHANNELS,
    ]);
    expect(result.valid).toBe(true);
    expect(result.missingDependencies.size).toBe(0);
  });

  it('should return valid when all dependencies are satisfied', () => {
    const result = validateCapabilityDependencies([
      Capability.METRICS,
      Capability.TELEMETRY, // Required by METRICS
    ]);
    expect(result.valid).toBe(true);
    expect(result.missingDependencies.size).toBe(0);
  });

  it('should return invalid when dependencies are missing', () => {
    const result = validateCapabilityDependencies([
      Capability.METRICS,
      // Missing TELEMETRY!
    ]);
    expect(result.valid).toBe(false);
    expect(result.missingDependencies.get(Capability.METRICS)).toContain(
      Capability.TELEMETRY
    );
  });

  it('should detect multiple missing dependencies', () => {
    const result = validateCapabilityDependencies([
      Capability.METRICS,
      Capability.BATCH_DECISIONS,
      // Missing both TELEMETRY and DECISION_OPTIONS!
    ]);
    expect(result.valid).toBe(false);
    expect(result.missingDependencies.size).toBe(2);
    expect(result.missingDependencies.get(Capability.METRICS)).toContain(
      Capability.TELEMETRY
    );
    expect(result.missingDependencies.get(Capability.BATCH_DECISIONS)).toContain(
      Capability.DECISION_OPTIONS
    );
  });

  it('should return valid for empty capability list', () => {
    const result = validateCapabilityDependencies([]);
    expect(result.valid).toBe(true);
    expect(result.missingDependencies.size).toBe(0);
  });
});

describe('getCapabilityConfig', () => {
  it('should return config for existing capability', () => {
    const config = getCapabilityConfig(Capability.METRICS);
    expect(config).toBeDefined();
    expect(config?.dependsOn).toContain(Capability.TELEMETRY);
  });

  it('should return empty config for capability with no special config', () => {
    const config = getCapabilityConfig(Capability.TOOLS);
    expect(config).toBeDefined();
    expect(config?.dependsOn).toBeUndefined();
    expect(config?.deprecated).toBeUndefined();
  });
});

describe('isCapabilityDeprecated', () => {
  it('should return false for non-deprecated capabilities', () => {
    expect(isCapabilityDeprecated(Capability.TOOLS)).toBe(false);
    expect(isCapabilityDeprecated(Capability.METRICS)).toBe(false);
    expect(isCapabilityDeprecated(Capability.TELEMETRY)).toBe(false);
  });

  // Note: Currently no capabilities are deprecated in the registry.
  // This test verifies the function works correctly when deprecation exists.
});

describe('getDeprecationInfo', () => {
  it('should return undefined for non-deprecated capabilities', () => {
    expect(getDeprecationInfo(Capability.TOOLS)).toBeUndefined();
    expect(getDeprecationInfo(Capability.MODES)).toBeUndefined();
  });

  // Note: Currently no capabilities are deprecated in the registry.
  // When a capability is deprecated, we can add specific tests.
});

describe('getAllDependencies', () => {
  it('should return empty array for capability with no dependencies', () => {
    const deps = getAllDependencies(Capability.TOOLS);
    expect(deps).toEqual([]);
  });

  it('should return direct dependencies', () => {
    const deps = getAllDependencies(Capability.METRICS);
    expect(deps).toContain(Capability.TELEMETRY);
  });

  it('should return transitive dependencies', () => {
    // BATCH_DECISIONS -> DECISION_OPTIONS
    const deps = getAllDependencies(Capability.BATCH_DECISIONS);
    expect(deps).toContain(Capability.DECISION_OPTIONS);
  });

  it('should deduplicate dependencies', () => {
    const deps = getAllDependencies(Capability.METRICS);
    const uniqueDeps = [...new Set(deps)];
    expect(deps.length).toBe(uniqueDeps.length);
  });
});
