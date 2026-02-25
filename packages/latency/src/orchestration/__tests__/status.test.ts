import { describe, it, expect } from 'vitest';
import {
  OrchestratorStatusSchema,
  parseOrchestratorStatus,
  safeParseOrchestratorStatus,
} from '../status.js';

describe('OrchestratorStatusSchema', () => {
  const validStatus = {
    queueDepth: 10,
    activeAgents: 3,
    workInProgress: 5,
    completedToday: 42,
  };

  it('accepts valid status', () => {
    const result = safeParseOrchestratorStatus(validStatus);
    expect(result.success).toBe(true);
  });

  it('accepts status with zero values', () => {
    const zeroStatus = {
      queueDepth: 0,
      activeAgents: 0,
      workInProgress: 0,
      completedToday: 0,
    };
    const result = safeParseOrchestratorStatus(zeroStatus);
    expect(result.success).toBe(true);
  });

  it('rejects status with negative queueDepth', () => {
    const invalid = { ...validStatus, queueDepth: -1 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with negative activeAgents', () => {
    const invalid = { ...validStatus, activeAgents: -1 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with negative workInProgress', () => {
    const invalid = { ...validStatus, workInProgress: -1 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with negative completedToday', () => {
    const invalid = { ...validStatus, completedToday: -1 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with non-integer values', () => {
    const invalid = { ...validStatus, queueDepth: 10.5 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with missing fields', () => {
    const invalid = { queueDepth: 10 };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects status with non-number values', () => {
    const invalid = { ...validStatus, queueDepth: 'ten' };
    const result = safeParseOrchestratorStatus(invalid);
    expect(result.success).toBe(false);
  });

  it('strips unknown fields', () => {
    const withExtra = { ...validStatus, extraField: 'should be removed' };
    const result = parseOrchestratorStatus(withExtra);
    expect((result as Record<string, unknown>).extraField).toBeUndefined();
  });

  it('parseOrchestratorStatus throws on invalid input', () => {
    expect(() => parseOrchestratorStatus({ queueDepth: -1 })).toThrow();
  });
});
