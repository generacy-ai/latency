import { describe, it, expect } from 'vitest';
import {
  OrchestratorEventType,
  OrchestratorEventSchema,
  parseOrchestratorEvent,
  safeParseOrchestratorEvent,
  WorkQueuedEventSchema,
  WorkClaimedEventSchema,
  WorkCompletedEventSchema,
  WorkFailedEventSchema,
  WorkReassignedEventSchema,
  WorkProgressEventSchema,
  AgentRegisteredEventSchema,
  AgentHeartbeatEventSchema,
  AgentOfflineEventSchema,
  AgentDeregisteredEventSchema,
} from '../events.js';

describe('OrchestratorEventType', () => {
  it('has correct work event values', () => {
    expect(OrchestratorEventType.WORK_QUEUED).toBe('work:queued');
    expect(OrchestratorEventType.WORK_CLAIMED).toBe('work:claimed');
    expect(OrchestratorEventType.WORK_COMPLETED).toBe('work:completed');
    expect(OrchestratorEventType.WORK_FAILED).toBe('work:failed');
    expect(OrchestratorEventType.WORK_REASSIGNED).toBe('work:reassigned');
    expect(OrchestratorEventType.WORK_PROGRESS).toBe('work:progress');
  });

  it('has correct agent event values', () => {
    expect(OrchestratorEventType.AGENT_REGISTERED).toBe('agent:registered');
    expect(OrchestratorEventType.AGENT_HEARTBEAT).toBe('agent:heartbeat');
    expect(OrchestratorEventType.AGENT_OFFLINE).toBe('agent:offline');
    expect(OrchestratorEventType.AGENT_DEREGISTERED).toBe('agent:deregistered');
  });
});

describe('OrchestratorEventSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTimestamp = '2024-01-15T10:30:00Z';

  const validWorkItem = {
    id: validUlid,
    type: 'github-issue',
    priority: 1,
    status: 'pending',
    payload: {},
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
  };

  const validAgentInfo = {
    id: validUlid,
    status: 'available',
    capabilities: [],
    lastHeartbeat: validTimestamp,
    metadata: {},
  };

  describe('work:queued event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'work:queued',
        work: validWorkItem,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('work:claimed event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'work:claimed',
        work: validWorkItem,
        agent: validUlid,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('work:completed event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'work:completed',
        work: validWorkItem,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('work:failed event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'work:failed',
        work: validWorkItem,
        error: 'Something went wrong',
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('work:reassigned event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'work:reassigned',
        work: validWorkItem,
        fromAgent: validUlid,
        toAgent: validUlid,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('work:progress event', () => {
    it('accepts valid event with message', () => {
      const event = {
        type: 'work:progress',
        work: validWorkItem,
        progress: 50,
        message: 'Halfway done',
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });

    it('accepts valid event without message', () => {
      const event = {
        type: 'work:progress',
        work: validWorkItem,
        progress: 75,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });

    it('rejects invalid progress value (over 100)', () => {
      const event = {
        type: 'work:progress',
        work: validWorkItem,
        progress: 150,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid progress value (negative)', () => {
      const event = {
        type: 'work:progress',
        work: validWorkItem,
        progress: -10,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(false);
    });
  });

  describe('agent:registered event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'agent:registered',
        agent: validAgentInfo,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('agent:heartbeat event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'agent:heartbeat',
        agentId: validUlid,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('agent:offline event', () => {
    it('accepts valid event', () => {
      const event = {
        type: 'agent:offline',
        agentId: validUlid,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('agent:deregistered event', () => {
    it('accepts valid event with reason', () => {
      const event = {
        type: 'agent:deregistered',
        agentId: validUlid,
        reason: 'Shutdown requested',
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });

    it('accepts valid event without reason', () => {
      const event = {
        type: 'agent:deregistered',
        agentId: validUlid,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(true);
    });
  });

  describe('discriminated union', () => {
    it('rejects unknown event type', () => {
      const event = {
        type: 'unknown:event',
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(false);
    });

    it('rejects event with missing type', () => {
      const event = {
        work: validWorkItem,
        timestamp: validTimestamp,
      };
      const result = safeParseOrchestratorEvent(event);
      expect(result.success).toBe(false);
    });

    it('parseOrchestratorEvent throws on invalid input', () => {
      expect(() => parseOrchestratorEvent({ type: 'invalid' })).toThrow();
    });
  });
});
