import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  createVersionedSchema,
  getSchemaForVersion,
  VersionedDecisionRequest,
} from '../versioned-schemas.js';

describe('createVersionedSchema', () => {
  const testVersions = {
    '1.0': z.object({ name: z.string() }),
    '2.0': z.object({ name: z.string(), age: z.number().optional() }),
    '3.0': z.object({ name: z.string(), age: z.number().optional(), email: z.string().optional() }),
  };

  it('should create versioned schema collection', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.versions).toBe(testVersions);
    expect(versioned.availableVersions).toHaveLength(3);
  });

  it('should identify latest version correctly', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.latestVersion).toBe('3.0');
    expect(versioned.latest).toBe(testVersions['3.0']);
  });

  it('should sort versions descending', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.availableVersions).toEqual(['3.0', '2.0', '1.0']);
  });

  it('should get schema for specific version', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.getSchema('1.0')).toBe(testVersions['1.0']);
    expect(versioned.getSchema('2.0')).toBe(testVersions['2.0']);
    expect(versioned.getSchema('3.0')).toBe(testVersions['3.0']);
  });

  it('should return undefined for unknown version', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.getSchema('4.0' as keyof typeof testVersions)).toBeUndefined();
  });

  it('should check if version exists', () => {
    const versioned = createVersionedSchema(testVersions);
    expect(versioned.hasVersion('1.0')).toBe(true);
    expect(versioned.hasVersion('2.0')).toBe(true);
    expect(versioned.hasVersion('4.0')).toBe(false);
    expect(versioned.hasVersion('')).toBe(false);
  });

  it('should throw if no versions provided', () => {
    expect(() => createVersionedSchema({})).toThrow('At least one schema version must be provided');
  });

  it('should handle single version', () => {
    const singleVersion = { '1.0': z.object({ id: z.string() }) };
    const versioned = createVersionedSchema(singleVersion);
    expect(versioned.latestVersion).toBe('1.0');
    expect(versioned.availableVersions).toEqual(['1.0']);
  });

  it('should handle semver-style versions', () => {
    const semverVersions = {
      '1.0.0': z.object({ a: z.string() }),
      '1.1.0': z.object({ a: z.string(), b: z.string().optional() }),
      '2.0.0': z.object({ a: z.string(), b: z.string().optional(), c: z.number().optional() }),
    };
    const versioned = createVersionedSchema(semverVersions);
    expect(versioned.latestVersion).toBe('2.0.0');
    expect(versioned.availableVersions).toEqual(['2.0.0', '1.1.0', '1.0.0']);
  });
});

describe('getSchemaForVersion', () => {
  const versions = {
    '1.0': z.object({ name: z.string() }),
    '2.0': z.object({ name: z.string(), age: z.number().optional() }),
  };

  it('should return schema for existing version', () => {
    expect(getSchemaForVersion(versions, '1.0')).toBe(versions['1.0']);
    expect(getSchemaForVersion(versions, '2.0')).toBe(versions['2.0']);
  });

  it('should return undefined for non-existent version', () => {
    expect(getSchemaForVersion(versions, '3.0')).toBeUndefined();
    expect(getSchemaForVersion(versions, '')).toBeUndefined();
  });
});

describe('VersionedDecisionRequest namespace', () => {
  describe('V1 schema', () => {
    it('should validate basic decision request', () => {
      const data = { question: 'What should I do?' };
      const result = VersionedDecisionRequest.V1.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with optional context', () => {
      const data = {
        question: 'What should I do?',
        context: 'Working on a project',
      };
      const result = VersionedDecisionRequest.V1.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty question', () => {
      const data = { question: '' };
      const result = VersionedDecisionRequest.V1.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing question', () => {
      const data = { context: 'Some context' };
      const result = VersionedDecisionRequest.V1.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('V2 schema', () => {
    it('should validate V1 data (backwards compatible)', () => {
      const data = { question: 'What should I do?' };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with urgency', () => {
      const data = {
        question: 'What should I do?',
        urgency: 'high',
      };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate with options', () => {
      const data = {
        question: 'Which option?',
        options: [
          { id: 'a', label: 'Option A', description: 'First option' },
          { id: 'b', label: 'Option B' },
        ],
      };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate full V2 request', () => {
      const data = {
        question: 'Which deployment strategy?',
        context: 'Production environment',
        urgency: 'critical',
        options: [
          { id: 'blue-green', label: 'Blue-Green', description: 'Zero downtime' },
          { id: 'canary', label: 'Canary', description: 'Gradual rollout' },
        ],
      };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid urgency', () => {
      const data = {
        question: 'What?',
        urgency: 'invalid',
      };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid options format', () => {
      const data = {
        question: 'What?',
        options: [{ label: 'Missing id' }],
      };
      const result = VersionedDecisionRequest.V2.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Latest alias', () => {
    it('should be same as V2', () => {
      expect(VersionedDecisionRequest.Latest).toBe(VersionedDecisionRequest.V2);
    });
  });

  describe('VERSIONS registry', () => {
    it('should map 1.0 to V1', () => {
      expect(VersionedDecisionRequest.VERSIONS['1.0']).toBe(VersionedDecisionRequest.V1);
    });

    it('should map 2.0 to V2', () => {
      expect(VersionedDecisionRequest.VERSIONS['2.0']).toBe(VersionedDecisionRequest.V2);
    });
  });

  describe('getVersion helper', () => {
    it('should return correct schema for version', () => {
      expect(VersionedDecisionRequest.getVersion('1.0')).toBe(VersionedDecisionRequest.V1);
      expect(VersionedDecisionRequest.getVersion('2.0')).toBe(VersionedDecisionRequest.V2);
    });

    it('should return undefined for unknown version', () => {
      expect(VersionedDecisionRequest.getVersion('3.0')).toBeUndefined();
    });
  });

  describe('type inference', () => {
    it('should correctly infer V1 type', () => {
      const v1Data: VersionedDecisionRequest.V1Type = {
        question: 'Test',
        context: 'Optional context',
      };
      expect(VersionedDecisionRequest.V1.parse(v1Data)).toEqual(v1Data);
    });

    it('should correctly infer V2 type', () => {
      const v2Data: VersionedDecisionRequest.V2Type = {
        question: 'Test',
        urgency: 'high',
        options: [{ id: '1', label: 'One' }],
      };
      expect(VersionedDecisionRequest.V2.parse(v2Data)).toEqual(v2Data);
    });
  });
});

describe('schema extension pattern', () => {
  it('V2 extends V1 correctly', () => {
    // V1 data should pass V2 validation
    const v1Data = { question: 'Hello?' };
    expect(VersionedDecisionRequest.V2.safeParse(v1Data).success).toBe(true);

    // V2 data should fail V1 validation if it uses V2-only fields
    // (Actually V1 will ignore extra fields by default - this tests shape)
    const v2Data = {
      question: 'Hello?',
      urgency: 'high',
      options: [{ id: '1', label: 'Option 1' }],
    };
    // V1 will pass because Zod by default allows extra properties
    expect(VersionedDecisionRequest.V1.safeParse(v2Data).success).toBe(true);
    // But the parsed result won't include the V2 fields
    const parsed = VersionedDecisionRequest.V1.parse(v2Data);
    expect('urgency' in parsed).toBe(false);
    expect('options' in parsed).toBe(false);
  });
});
