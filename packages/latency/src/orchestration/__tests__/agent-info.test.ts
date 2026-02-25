import { describe, it, expect } from 'vitest';
import {
  AgentStatus,
  AgentStatusSchema,
  AgentInfoSchema,
  parseAgentInfo,
  safeParseAgentInfo,
} from '../agent-info.js';

describe('AgentStatus', () => {
  it('has correct values', () => {
    expect(AgentStatus.AVAILABLE).toBe('available');
    expect(AgentStatus.BUSY).toBe('busy');
    expect(AgentStatus.OFFLINE).toBe('offline');
  });
});

describe('AgentStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(AgentStatusSchema.safeParse('available').success).toBe(true);
    expect(AgentStatusSchema.safeParse('busy').success).toBe(true);
    expect(AgentStatusSchema.safeParse('offline').success).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(AgentStatusSchema.safeParse('unknown').success).toBe(false);
    expect(AgentStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('AgentInfoSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTimestamp = '2024-01-15T10:30:00Z';

  const validAgentInfo = {
    id: validUlid,
    status: 'available',
    capabilities: ['github', 'code-review'],
    lastHeartbeat: validTimestamp,
    metadata: { version: '1.0.0' },
  };

  it('accepts valid agent info without currentWork', () => {
    const result = safeParseAgentInfo(validAgentInfo);
    expect(result.success).toBe(true);
  });

  it('accepts valid agent info with currentWork', () => {
    const agentWithWork = {
      ...validAgentInfo,
      currentWork: validUlid,
    };
    const result = safeParseAgentInfo(agentWithWork);
    expect(result.success).toBe(true);
  });

  it('accepts agent info with empty capabilities array', () => {
    const agentWithNoCapabilities = {
      ...validAgentInfo,
      capabilities: [],
    };
    const result = safeParseAgentInfo(agentWithNoCapabilities);
    expect(result.success).toBe(true);
  });

  it('accepts agent info with empty metadata', () => {
    const agentWithEmptyMetadata = {
      ...validAgentInfo,
      metadata: {},
    };
    const result = safeParseAgentInfo(agentWithEmptyMetadata);
    expect(result.success).toBe(true);
  });

  it('rejects agent info with invalid id', () => {
    const invalid = { ...validAgentInfo, id: 'invalid' };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects agent info with invalid status', () => {
    const invalid = { ...validAgentInfo, status: 'unknown' };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects agent info with invalid capabilities (not array)', () => {
    const invalid = { ...validAgentInfo, capabilities: 'github' };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects agent info with invalid timestamp', () => {
    const invalid = { ...validAgentInfo, lastHeartbeat: 'not-a-timestamp' };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects agent info with invalid currentWork', () => {
    const invalid = { ...validAgentInfo, currentWork: 'invalid-id' };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects agent info with missing required fields', () => {
    const invalid = { id: validUlid };
    const result = safeParseAgentInfo(invalid);
    expect(result.success).toBe(false);
  });

  it('strips unknown fields', () => {
    const withExtra = { ...validAgentInfo, extraField: 'should be removed' };
    const result = parseAgentInfo(withExtra);
    expect((result as Record<string, unknown>).extraField).toBeUndefined();
  });
});
