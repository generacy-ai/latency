import { describe, it, expect } from 'vitest';
import {
  parseVersion,
  compareVersions,
  isVersionCompatible,
  SemVerStringSchema,
  VersionRangeSchema,
} from '../../../src/protocols/common/version.js';

describe('parseVersion', () => {
  describe('strict mode', () => {
    it('parses standard semver', () => {
      const result = parseVersion('1.2.3');
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
    });

    it('parses version with prerelease', () => {
      const result = parseVersion('1.0.0-alpha');
      expect(result).toEqual({ major: 1, minor: 0, patch: 0, prerelease: 'alpha' });
    });

    it('parses version with build metadata', () => {
      const result = parseVersion('1.0.0+build.123');
      expect(result).toEqual({ major: 1, minor: 0, patch: 0, build: 'build.123' });
    });

    it('parses version with prerelease and build', () => {
      const result = parseVersion('1.0.0-beta.1+sha.abc');
      expect(result).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: 'beta.1',
        build: 'sha.abc',
      });
    });

    it('throws for partial version in strict mode', () => {
      expect(() => parseVersion('1.2')).toThrow('Invalid version format');
    });
  });

  describe('loose mode', () => {
    it('parses major only', () => {
      const result = parseVersion('1', { loose: true });
      expect(result).toEqual({ major: 1, minor: 0, patch: 0 });
    });

    it('parses major.minor only', () => {
      const result = parseVersion('1.2', { loose: true });
      expect(result).toEqual({ major: 1, minor: 2, patch: 0 });
    });

    it('parses full version', () => {
      const result = parseVersion('1.2.3', { loose: true });
      expect(result).toEqual({ major: 1, minor: 2, patch: 3 });
    });
  });

  describe('edge cases', () => {
    it('parses zero version', () => {
      const result = parseVersion('0.0.0');
      expect(result).toEqual({ major: 0, minor: 0, patch: 0 });
    });

    it('parses large numbers', () => {
      const result = parseVersion('100.200.300');
      expect(result).toEqual({ major: 100, minor: 200, patch: 300 });
    });

    it('throws for empty string', () => {
      expect(() => parseVersion('')).toThrow('Invalid version format');
    });

    it('throws for invalid format', () => {
      expect(() => parseVersion('v1.2.3')).toThrow('Invalid version format');
      expect(() => parseVersion('1.2.3.4')).toThrow('Invalid version format');
    });
  });
});

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
  });

  it('compares major versions', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
  });

  it('compares minor versions', () => {
    expect(compareVersions('1.2.0', '1.1.0')).toBe(1);
    expect(compareVersions('1.1.0', '1.2.0')).toBe(-1);
  });

  it('compares patch versions', () => {
    expect(compareVersions('1.0.2', '1.0.1')).toBe(1);
    expect(compareVersions('1.0.1', '1.0.2')).toBe(-1);
  });

  it('prerelease < release', () => {
    expect(compareVersions('1.0.0-alpha', '1.0.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.0-alpha')).toBe(1);
  });

  it('compares prerelease versions', () => {
    expect(compareVersions('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    expect(compareVersions('1.0.0-beta', '1.0.0-alpha')).toBe(1);
  });

  it('handles partial versions in loose mode', () => {
    expect(compareVersions('1', '1.0.0')).toBe(0);
    expect(compareVersions('1.2', '1.2.0')).toBe(0);
  });
});

describe('isVersionCompatible', () => {
  describe('exact match', () => {
    it('matches exact version', () => {
      expect(isVersionCompatible('1.2.3', '1.2.3')).toBe(true);
    });

    it('rejects different version', () => {
      expect(isVersionCompatible('1.2.3', '1.2.4')).toBe(false);
    });
  });

  describe('caret (^)', () => {
    it('allows same major, higher minor/patch', () => {
      expect(isVersionCompatible('^1.2.0', '1.3.0')).toBe(true);
      expect(isVersionCompatible('^1.2.0', '1.2.5')).toBe(true);
    });

    it('rejects different major', () => {
      expect(isVersionCompatible('^1.2.0', '2.0.0')).toBe(false);
    });

    it('rejects lower version', () => {
      expect(isVersionCompatible('^1.2.0', '1.1.0')).toBe(false);
    });
  });

  describe('tilde (~)', () => {
    it('allows same major/minor, higher patch', () => {
      expect(isVersionCompatible('~1.2.0', '1.2.5')).toBe(true);
    });

    it('rejects different minor', () => {
      expect(isVersionCompatible('~1.2.0', '1.3.0')).toBe(false);
    });
  });

  describe('comparison operators', () => {
    it('handles >=', () => {
      expect(isVersionCompatible('>=1.2.0', '1.2.0')).toBe(true);
      expect(isVersionCompatible('>=1.2.0', '2.0.0')).toBe(true);
      expect(isVersionCompatible('>=1.2.0', '1.1.0')).toBe(false);
    });

    it('handles >', () => {
      expect(isVersionCompatible('>1.2.0', '1.2.1')).toBe(true);
      expect(isVersionCompatible('>1.2.0', '1.2.0')).toBe(false);
    });

    it('handles <=', () => {
      expect(isVersionCompatible('<=1.2.0', '1.2.0')).toBe(true);
      expect(isVersionCompatible('<=1.2.0', '1.1.0')).toBe(true);
      expect(isVersionCompatible('<=1.2.0', '1.3.0')).toBe(false);
    });

    it('handles <', () => {
      expect(isVersionCompatible('<1.2.0', '1.1.9')).toBe(true);
      expect(isVersionCompatible('<1.2.0', '1.2.0')).toBe(false);
    });
  });
});

describe('SemVerStringSchema', () => {
  it('accepts valid semver', () => {
    expect(SemVerStringSchema.safeParse('1.2.3').success).toBe(true);
  });

  it('rejects invalid semver', () => {
    expect(SemVerStringSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('VersionRangeSchema', () => {
  it('accepts version ranges', () => {
    expect(VersionRangeSchema.safeParse('^1.2.3').success).toBe(true);
    expect(VersionRangeSchema.safeParse('~1.2.3').success).toBe(true);
    expect(VersionRangeSchema.safeParse('>=1.0.0').success).toBe(true);
  });

  it('rejects invalid ranges', () => {
    expect(VersionRangeSchema.safeParse('invalid').success).toBe(false);
  });
});
