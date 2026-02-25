import { describe, it, expect } from 'vitest';
import {
  DebugState,
  DebugStateSchema,
  DebugModeSchema,
  Breakpoint,
  BreakpointSchema,
  BreakpointIdSchema,
  BreakpointTypeSchema,
  StepSnapshot,
  StepSnapshotSchema,
  SnapshotIdSchema,
  generateBreakpointId,
  generateSnapshotId,
  parseDebugState,
  safeParseDebugState,
  parseBreakpoint,
  safeParseBreakpoint,
  parseStepSnapshot,
  safeParseStepSnapshot,
} from '../debug-state.js';

// ============================================================================
// ID Schemas
// ============================================================================

describe('BreakpointIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = BreakpointIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(BreakpointIdSchema.safeParse('invalid').success).toBe(false);
    expect(BreakpointIdSchema.safeParse('').success).toBe(false);
  });
});

describe('generateBreakpointId', () => {
  it('generates valid ULID', () => {
    const id = generateBreakpointId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = BreakpointIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateBreakpointId();
    const id2 = generateBreakpointId();
    expect(id1).not.toBe(id2);
  });
});

describe('SnapshotIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = SnapshotIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(SnapshotIdSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('generateSnapshotId', () => {
  it('generates valid ULID', () => {
    const id = generateSnapshotId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = SnapshotIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Breakpoint Schema
// ============================================================================

describe('BreakpointTypeSchema', () => {
  it('accepts valid breakpoint types', () => {
    expect(BreakpointTypeSchema.safeParse('step').success).toBe(true);
    expect(BreakpointTypeSchema.safeParse('condition').success).toBe(true);
    expect(BreakpointTypeSchema.safeParse('error').success).toBe(true);
    expect(BreakpointTypeSchema.safeParse('exception').success).toBe(true);
  });

  it('rejects invalid breakpoint type', () => {
    expect(BreakpointTypeSchema.safeParse('invalid').success).toBe(false);
    expect(BreakpointTypeSchema.safeParse('line').success).toBe(false);
  });
});

describe('BreakpointSchema', () => {
  describe('step breakpoints', () => {
    it('accepts valid step breakpoint', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'step',
        stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('requires stepId for step breakpoints', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'step',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('accepts step breakpoint with hit count', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'step',
        stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        hitCount: 5,
        currentHits: 2,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hitCount).toBe(5);
        expect(result.data.currentHits).toBe(2);
      }
    });
  });

  describe('condition breakpoints', () => {
    it('accepts valid condition breakpoint', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'condition',
        condition: '$.count > 10',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('requires condition for condition breakpoints', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'condition',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('error breakpoints', () => {
    it('accepts error breakpoint', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'error',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('accepts exception breakpoint', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'exception',
        enabled: true,
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('logpoints', () => {
    it('accepts breakpoint with log message (logpoint)', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'step',
        stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        logMessage: 'Step reached with count: {{$.count}}',
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logMessage).toContain('count');
      }
    });
  });

  describe('defaults', () => {
    it('provides default for enabled', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'error',
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it('provides default for hit counts', () => {
      const result = BreakpointSchema.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'error',
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hitCount).toBe(0);
        expect(result.data.currentHits).toBe(0);
      }
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = Breakpoint.V1.safeParse({
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        type: 'error',
        createdAt: '2024-01-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = Breakpoint.getVersion('v1');
      expect(schema).toBe(Breakpoint.V1);
    });

    it('Latest points to V1', () => {
      expect(Breakpoint.Latest).toBe(Breakpoint.V1);
    });
  });

  describe('parse helpers', () => {
    const validBreakpoint = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      type: 'error',
      createdAt: '2024-01-15T10:30:00Z',
    };

    it('parseBreakpoint returns valid breakpoint', () => {
      const bp = parseBreakpoint(validBreakpoint);
      expect(bp.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseBreakpoint throws on invalid data', () => {
      expect(() => parseBreakpoint({})).toThrow();
    });

    it('safeParseBreakpoint returns success result', () => {
      const result = safeParseBreakpoint(validBreakpoint);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Step Snapshot Schema
// ============================================================================

describe('StepSnapshotSchema', () => {
  const validSnapshot = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
    stepName: 'Build step',
    variables: { count: 5, items: ['a', 'b'] },
    inputs: { source: './src' },
    sequenceNumber: 3,
    capturedAt: '2024-01-15T10:30:00Z',
  };

  it('accepts valid snapshot', () => {
    const result = StepSnapshotSchema.safeParse(validSnapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepName).toBe('Build step');
      expect(result.data.sequenceNumber).toBe(3);
    }
  });

  it('accepts completed snapshot with outputs', () => {
    const snapshot = {
      ...validSnapshot,
      completed: true,
      outputs: { result: 'success', artifactPath: '/dist' },
      durationMs: 5000,
    };
    const result = StepSnapshotSchema.safeParse(snapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completed).toBe(true);
      expect(result.data.outputs).toHaveProperty('result');
    }
  });

  it('accepts snapshot with error', () => {
    const snapshot = {
      ...validSnapshot,
      completed: true,
      error: 'Build failed: missing dependency',
    };
    const result = StepSnapshotSchema.safeParse(snapshot);
    expect(result.success).toBe(true);
  });

  it('provides defaults', () => {
    const minimalSnapshot = {
      id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
      sequenceNumber: 0,
      capturedAt: '2024-01-15T10:30:00Z',
    };
    const result = StepSnapshotSchema.safeParse(minimalSnapshot);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.variables).toEqual({});
      expect(result.data.inputs).toEqual({});
      expect(result.data.completed).toBe(false);
    }
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = StepSnapshot.V1.safeParse(validSnapshot);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(StepSnapshot.Latest).toBe(StepSnapshot.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseStepSnapshot returns valid snapshot', () => {
      const snapshot = parseStepSnapshot(validSnapshot);
      expect(snapshot.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('safeParseStepSnapshot returns success result', () => {
      const result = safeParseStepSnapshot(validSnapshot);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Debug Mode
// ============================================================================

describe('DebugModeSchema', () => {
  it('accepts valid debug modes', () => {
    expect(DebugModeSchema.safeParse('disabled').success).toBe(true);
    expect(DebugModeSchema.safeParse('stepping').success).toBe(true);
    expect(DebugModeSchema.safeParse('running').success).toBe(true);
    expect(DebugModeSchema.safeParse('paused').success).toBe(true);
  });

  it('rejects invalid mode', () => {
    expect(DebugModeSchema.safeParse('stopped').success).toBe(false);
    expect(DebugModeSchema.safeParse('').success).toBe(false);
  });
});

// ============================================================================
// Debug State Schema
// ============================================================================

describe('DebugStateSchema', () => {
  const validDebugState = {
    executionId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    paused: true,
    mode: 'paused',
    breakpoints: [],
    stepHistory: [],
    variables: { counter: 0 },
    updatedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid states', () => {
    it('accepts valid debug state', () => {
      const result = DebugStateSchema.safeParse(validDebugState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paused).toBe(true);
        expect(result.data.mode).toBe('paused');
      }
    });

    it('accepts debug state with breakpoints', () => {
      const state = {
        ...validDebugState,
        breakpoints: [
          {
            id: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
            type: 'step',
            stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
            enabled: true,
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
        pausedAtBreakpoint: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('accepts debug state with step history', () => {
      const state = {
        ...validDebugState,
        stepHistory: [
          {
            id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
            stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
            variables: { input: 'test' },
            sequenceNumber: 1,
            capturedAt: '2024-01-15T10:30:00Z',
          },
        ],
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('accepts debug state with current step', () => {
      const state = {
        ...validDebugState,
        currentStepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('accepts debug state with call stack', () => {
      const state = {
        ...validDebugState,
        callStack: [
          {
            workflowId: 'parent-workflow',
            workflowName: 'Parent Workflow',
            stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          },
          {
            workflowId: 'child-workflow',
            stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
          },
        ],
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });

    it('accepts debug state with watches', () => {
      const state = {
        ...validDebugState,
        watches: [
          { expression: '$.counter', value: 5 },
          { expression: '$.items.length', value: 3 },
          { expression: '$.invalid', value: null, error: 'Path not found' },
        ],
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.watches.length).toBe(3);
        expect(result.data.watches[2].error).toBe('Path not found');
      }
    });

    it('accepts debug state with session ID', () => {
      const state = {
        ...validDebugState,
        sessionId: 'debug-session-123',
      };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(true);
    });
  });

  describe('defaults', () => {
    it('provides default arrays', () => {
      const minimalState = {
        executionId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        paused: false,
        mode: 'disabled',
        updatedAt: '2024-01-15T10:30:00Z',
      };
      const result = DebugStateSchema.safeParse(minimalState);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.breakpoints).toEqual([]);
        expect(result.data.stepHistory).toEqual([]);
        expect(result.data.variables).toEqual({});
        expect(result.data.callStack).toEqual([]);
        expect(result.data.watches).toEqual([]);
      }
    });
  });

  describe('validation', () => {
    it('rejects invalid mode', () => {
      const state = { ...validDebugState, mode: 'invalid' };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('rejects invalid executionId', () => {
      const state = { ...validDebugState, executionId: 'invalid' };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
      const state = { ...validDebugState, updatedAt: 'invalid' };
      const result = DebugStateSchema.safeParse(state);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = DebugState.V1.safeParse(validDebugState);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = DebugState.getVersion('v1');
      expect(schema).toBe(DebugState.V1);
    });

    it('Latest points to V1', () => {
      expect(DebugState.Latest).toBe(DebugState.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseDebugState returns valid state', () => {
      const state = parseDebugState(validDebugState);
      expect(state.executionId).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseDebugState throws on invalid data', () => {
      expect(() => parseDebugState({})).toThrow();
    });

    it('safeParseDebugState returns success result', () => {
      const result = safeParseDebugState(validDebugState);
      expect(result.success).toBe(true);
    });

    it('safeParseDebugState returns failure result', () => {
      const result = safeParseDebugState({});
      expect(result.success).toBe(false);
    });
  });
});
