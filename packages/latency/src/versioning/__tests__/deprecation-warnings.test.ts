import { describe, it, expect } from 'vitest';
import { Capability, type DeprecationInfo } from '../../common/capability.js';
import {
  collectDeprecationWarnings,
  formatDeprecationMessage,
  formatDeprecationMessages,
  hasDeprecatedCapabilities,
  getDeprecationReplacements,
  DeprecationWarningSchema,
} from '../deprecation-warnings.js';

describe('DeprecationWarningSchema', () => {
  it('should validate a complete deprecation warning', () => {
    const warning = {
      capability: Capability.TELEMETRY,
      since: '2.0.0',
      replacement: Capability.METRICS,
      message: 'Test message',
    };
    expect(DeprecationWarningSchema.safeParse(warning).success).toBe(true);
  });

  it('should validate warning without replacement', () => {
    const warning = {
      capability: Capability.TOOLS,
      since: '1.5.0',
      message: 'Test message',
    };
    expect(DeprecationWarningSchema.safeParse(warning).success).toBe(true);
  });

  it('should reject invalid capability', () => {
    const warning = {
      capability: 'invalid_cap',
      since: '1.0.0',
      message: 'Test',
    };
    expect(DeprecationWarningSchema.safeParse(warning).success).toBe(false);
  });
});

describe('formatDeprecationMessage', () => {
  it('should format basic deprecation message', () => {
    const info: DeprecationInfo = {
      since: '2.0.0',
    };
    const message = formatDeprecationMessage(Capability.TELEMETRY, info);
    expect(message).toBe("Capability 'telemetry' is deprecated since 2.0.0.");
  });

  it('should include custom message', () => {
    const info: DeprecationInfo = {
      since: '2.0.0',
      message: 'This feature is no longer needed.',
    };
    const message = formatDeprecationMessage(Capability.TELEMETRY, info);
    expect(message).toContain('This feature is no longer needed.');
  });

  it('should include replacement suggestion', () => {
    const info: DeprecationInfo = {
      since: '2.0.0',
      replacement: Capability.METRICS,
    };
    const message = formatDeprecationMessage(Capability.TELEMETRY, info);
    expect(message).toContain("Use 'metrics' instead.");
  });

  it('should format complete deprecation message', () => {
    const info: DeprecationInfo = {
      since: '2.0.0',
      replacement: Capability.METRICS,
      message: 'Telemetry has been restructured.',
    };
    const message = formatDeprecationMessage(Capability.TELEMETRY, info);
    expect(message).toBe(
      "Capability 'telemetry' is deprecated since 2.0.0. Telemetry has been restructured. Use 'metrics' instead."
    );
  });
});

describe('collectDeprecationWarnings', () => {
  // Note: By default, no capabilities are deprecated in the registry.
  // We test the function works correctly with the current registry state.

  it('should return empty array when no deprecated capabilities', () => {
    const warnings = collectDeprecationWarnings([
      Capability.TOOLS,
      Capability.MODES,
    ]);
    expect(warnings).toEqual([]);
  });

  it('should return empty array for empty input', () => {
    const warnings = collectDeprecationWarnings([]);
    expect(warnings).toEqual([]);
  });

  it('should handle all current capabilities without error', () => {
    const allCapabilities = Object.values(Capability);
    expect(() => collectDeprecationWarnings(allCapabilities)).not.toThrow();
  });
});

describe('formatDeprecationMessages', () => {
  it('should format array of warnings to messages', () => {
    const warnings = [
      {
        capability: Capability.TELEMETRY,
        since: '2.0.0',
        message: 'First warning',
      },
      {
        capability: Capability.MODES,
        since: '1.5.0',
        message: 'Second warning',
      },
    ];
    const messages = formatDeprecationMessages(warnings);
    expect(messages).toEqual(['First warning', 'Second warning']);
  });

  it('should return empty array for empty warnings', () => {
    expect(formatDeprecationMessages([])).toEqual([]);
  });
});

describe('hasDeprecatedCapabilities', () => {
  it('should return false when no deprecated capabilities', () => {
    expect(hasDeprecatedCapabilities([Capability.TOOLS])).toBe(false);
    expect(hasDeprecatedCapabilities([Capability.MODES])).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(hasDeprecatedCapabilities([])).toBe(false);
  });

  it('should handle all capabilities', () => {
    const allCapabilities = Object.values(Capability);
    // Currently none are deprecated, so should be false
    expect(hasDeprecatedCapabilities(allCapabilities)).toBe(false);
  });
});

describe('getDeprecationReplacements', () => {
  it('should return empty map when no deprecated capabilities', () => {
    const replacements = getDeprecationReplacements([
      Capability.TOOLS,
      Capability.MODES,
    ]);
    expect(replacements.size).toBe(0);
  });

  it('should return empty map for empty input', () => {
    const replacements = getDeprecationReplacements([]);
    expect(replacements.size).toBe(0);
  });
});

// Tests for formatDeprecationMessage with various configurations
describe('deprecation detection with deprecated capability', () => {
  it('formatDeprecationMessage works correctly for deprecated scenarios', () => {
    // Test all combinations of deprecation info
    const basicInfo: DeprecationInfo = { since: '1.0.0' };
    const withMessage: DeprecationInfo = { since: '1.0.0', message: 'Custom message.' };
    const withReplacement: DeprecationInfo = { since: '1.0.0', replacement: Capability.METRICS };
    const full: DeprecationInfo = { since: '1.0.0', replacement: Capability.METRICS, message: 'Full info.' };

    expect(formatDeprecationMessage(Capability.TELEMETRY, basicInfo)).toContain('since 1.0.0');
    expect(formatDeprecationMessage(Capability.TELEMETRY, withMessage)).toContain('Custom message.');
    expect(formatDeprecationMessage(Capability.TELEMETRY, withReplacement)).toContain("Use 'metrics' instead.");
    expect(formatDeprecationMessage(Capability.TELEMETRY, full)).toContain('Full info.');
    expect(formatDeprecationMessage(Capability.TELEMETRY, full)).toContain("Use 'metrics' instead.");
  });
});
