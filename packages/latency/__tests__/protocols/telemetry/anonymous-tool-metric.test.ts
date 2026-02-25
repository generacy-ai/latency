import { describe, it, expect } from 'vitest';
import {
  AnonymousToolMetricSchema,
  type AnonymousToolMetric,
} from '../../../src/protocols/telemetry/anonymous-tool-metric.js';

describe('AnonymousToolMetricSchema', () => {
  const validMetric: AnonymousToolMetric = {
    version: '1.0.0',
    server: 'mcp-server-test',
    tool: 'test_tool',
    durationMs: 150,
    success: true,
  };

  it('accepts valid metric with required fields', () => {
    const result = AnonymousToolMetricSchema.safeParse(validMetric);
    expect(result.success).toBe(true);
  });

  it('accepts metric with all optional fields', () => {
    const fullMetric = {
      ...validMetric,
      errorCategory: 'timeout',
      errorType: 'RequestTimeout',
      agentPlatform: 'claude-code',
      environment: 'docker:generacy/agent:latest',
    };
    const result = AnonymousToolMetricSchema.safeParse(fullMetric);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { version, ...metricWithoutVersion } = validMetric;
    const result = AnonymousToolMetricSchema.safeParse(metricWithoutVersion);
    expect(result.success).toBe(false);
  });

  it('rejects empty version', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      version: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty server name', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      server: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty tool name', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      tool: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative durationMs', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      durationMs: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer durationMs', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      durationMs: 150.5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero durationMs', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      durationMs: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid errorCategory', () => {
    const result = AnonymousToolMetricSchema.safeParse({
      ...validMetric,
      errorCategory: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('ensures no PII fields are present in schema', () => {
    // Verify the schema structure doesn't include PII fields
    const shape = AnonymousToolMetricSchema.shape;
    expect('inputs' in shape).toBe(false);
    expect('outputs' in shape).toBe(false);
    expect('sessionId' in shape).toBe(false);
    expect('workflowId' in shape).toBe(false);
    expect('issueNumber' in shape).toBe(false);
  });
});
