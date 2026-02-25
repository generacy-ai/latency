import { describe, it, expect } from 'vitest';
import {
  WorkflowExecution,
  WorkflowExecutionSchema,
  ExecutionIdSchema,
  ExecutionStatusSchema,
  ExecutionLocationSchema,
  StepExecutionStatusSchema,
  StepExecutionResultSchema,
  ExecutionErrorSchema,
  generateExecutionId,
  parseWorkflowExecution,
  safeParseWorkflowExecution,
  isTerminalStatus,
  isCancellable,
} from '../execution.js';

// ============================================================================
// ID Schema
// ============================================================================

describe('ExecutionIdSchema', () => {
  it('accepts valid ULID format', () => {
    const result = ExecutionIdSchema.safeParse('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    expect(ExecutionIdSchema.safeParse('invalid').success).toBe(false);
    expect(ExecutionIdSchema.safeParse('').success).toBe(false);
    expect(ExecutionIdSchema.safeParse('123').success).toBe(false);
  });
});

describe('generateExecutionId', () => {
  it('generates valid ULID', () => {
    const id = generateExecutionId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(26);

    const result = ExecutionIdSchema.safeParse(id);
    expect(result.success).toBe(true);
  });

  it('generates unique IDs', () => {
    const id1 = generateExecutionId();
    const id2 = generateExecutionId();
    expect(id1).not.toBe(id2);
  });
});

// ============================================================================
// Execution Status
// ============================================================================

describe('ExecutionStatusSchema', () => {
  it('accepts all valid statuses', () => {
    const validStatuses = [
      'pending',
      'queued',
      'running',
      'paused',
      'waiting',
      'succeeded',
      'failed',
      'cancelled',
      'timed_out',
    ];

    for (const status of validStatuses) {
      expect(ExecutionStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(ExecutionStatusSchema.safeParse('invalid').success).toBe(false);
    expect(ExecutionStatusSchema.safeParse('').success).toBe(false);
    expect(ExecutionStatusSchema.safeParse('RUNNING').success).toBe(false);
  });
});

describe('ExecutionLocationSchema', () => {
  it('accepts valid locations', () => {
    expect(ExecutionLocationSchema.safeParse('local').success).toBe(true);
    expect(ExecutionLocationSchema.safeParse('cloud').success).toBe(true);
    expect(ExecutionLocationSchema.safeParse('hybrid').success).toBe(true);
  });

  it('rejects invalid location', () => {
    expect(ExecutionLocationSchema.safeParse('remote').success).toBe(false);
  });
});

// ============================================================================
// Step Execution
// ============================================================================

describe('StepExecutionStatusSchema', () => {
  it('accepts all valid step statuses', () => {
    const validStatuses = ['pending', 'running', 'succeeded', 'failed', 'skipped', 'cancelled'];

    for (const status of validStatuses) {
      expect(StepExecutionStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

describe('StepExecutionResultSchema', () => {
  const validResult = {
    stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    status: 'succeeded',
    startedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:30:05Z',
    durationMs: 5000,
    output: { result: 'success' },
  };

  it('accepts valid step result', () => {
    const result = StepExecutionResultSchema.safeParse(validResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('succeeded');
      expect(result.data.durationMs).toBe(5000);
    }
  });

  it('accepts result with error', () => {
    const failedResult = {
      stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      status: 'failed',
      startedAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T10:30:02Z',
      error: 'Connection timeout',
      errorStack: 'Error: Connection timeout\n    at connect...',
      retryCount: 3,
    };
    const result = StepExecutionResultSchema.safeParse(failedResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.error).toBe('Connection timeout');
      expect(result.data.retryCount).toBe(3);
    }
  });

  it('accepts result with logs', () => {
    const resultWithLogs = {
      ...validResult,
      logs: ['Starting build...', 'Compiling...', 'Build complete'],
    };
    const result = StepExecutionResultSchema.safeParse(resultWithLogs);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logs.length).toBe(3);
    }
  });

  it('provides defaults', () => {
    const minimalResult = {
      stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      status: 'pending',
    };
    const result = StepExecutionResultSchema.safeParse(minimalResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.retryCount).toBe(0);
      expect(result.data.logs).toEqual([]);
    }
  });
});

// ============================================================================
// Execution Error
// ============================================================================

describe('ExecutionErrorSchema', () => {
  it('accepts valid error', () => {
    const result = ExecutionErrorSchema.safeParse({
      message: 'Step timed out after 30 seconds',
      code: 'STEP_TIMEOUT',
      stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      occurredAt: '2024-01-15T10:31:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts error with stack trace', () => {
    const result = ExecutionErrorSchema.safeParse({
      message: 'Connection refused',
      code: 'CONNECTION_ERROR',
      stack: 'Error: Connection refused\n    at Socket...',
      context: { host: 'api.example.com', port: 443 },
      occurredAt: '2024-01-15T10:31:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('requires message', () => {
    const result = ExecutionErrorSchema.safeParse({
      code: 'ERROR',
      occurredAt: '2024-01-15T10:31:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('requires non-empty message', () => {
    const result = ExecutionErrorSchema.safeParse({
      message: '',
      occurredAt: '2024-01-15T10:31:00Z',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Workflow Execution
// ============================================================================

describe('WorkflowExecutionSchema', () => {
  const validExecution = {
    id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
    workflowVersion: '1.0.0',
    status: 'running',
    currentStepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
    inputs: { environment: 'production' },
    executionLocation: 'local',
    triggerType: 'manual',
    createdAt: '2024-01-15T10:29:55Z',
    startedAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    priority: 75,
  };

  describe('valid executions', () => {
    it('accepts valid execution', () => {
      const result = WorkflowExecutionSchema.safeParse(validExecution);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
        expect(result.data.status).toBe('running');
        expect(result.data.priority).toBe(75);
      }
    });

    it('accepts execution with step results', () => {
      const execution = {
        ...validExecution,
        stepResults: [
          {
            stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
            status: 'succeeded',
            startedAt: '2024-01-15T10:30:00Z',
            completedAt: '2024-01-15T10:30:05Z',
            durationMs: 5000,
          },
        ],
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('accepts completed execution', () => {
      const execution = {
        ...validExecution,
        status: 'succeeded',
        completedAt: '2024-01-15T10:35:00Z',
        outputs: { deploymentUrl: 'https://app.example.com' },
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('accepts failed execution with error', () => {
      const execution = {
        ...validExecution,
        status: 'failed',
        completedAt: '2024-01-15T10:31:00Z',
        error: {
          message: 'Deployment failed',
          code: 'DEPLOY_FAILURE',
          stepId: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          occurredAt: '2024-01-15T10:31:00Z',
        },
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('accepts execution with tags and metadata', () => {
      const execution = {
        ...validExecution,
        tags: ['production', 'critical'],
        metadata: {
          commitSha: 'abc123',
          prNumber: 42,
        },
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('accepts execution with user context', () => {
      const execution = {
        ...validExecution,
        initiatedBy: 'user-123',
        organizationId: 'org-456',
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('accepts execution with timeout', () => {
      const execution = {
        ...validExecution,
        timeoutMs: 300000, // 5 minutes
      };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(true);
    });
  });

  describe('default values', () => {
    it('provides default for inputs', () => {
      const minimalExecution = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAW',
        status: 'pending',
        executionLocation: 'local',
        createdAt: '2024-01-15T10:29:55Z',
        updatedAt: '2024-01-15T10:29:55Z',
      };
      const result = WorkflowExecutionSchema.safeParse(minimalExecution);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputs).toEqual({});
        expect(result.data.outputs).toEqual({});
        expect(result.data.stepResults).toEqual([]);
        expect(result.data.priority).toBe(50);
        expect(result.data.tags).toEqual([]);
        expect(result.data.metadata).toEqual({});
      }
    });
  });

  describe('validation', () => {
    it('rejects invalid status', () => {
      const execution = { ...validExecution, status: 'invalid' };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(false);
    });

    it('rejects invalid execution location', () => {
      const execution = { ...validExecution, executionLocation: 'remote' };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(false);
    });

    it('validates priority range', () => {
      expect(WorkflowExecutionSchema.safeParse({
        ...validExecution,
        priority: -1,
      }).success).toBe(false);

      expect(WorkflowExecutionSchema.safeParse({
        ...validExecution,
        priority: 101,
      }).success).toBe(false);

      expect(WorkflowExecutionSchema.safeParse({
        ...validExecution,
        priority: 0,
      }).success).toBe(true);

      expect(WorkflowExecutionSchema.safeParse({
        ...validExecution,
        priority: 100,
      }).success).toBe(true);
    });

    it('rejects invalid timestamp', () => {
      const execution = { ...validExecution, createdAt: 'invalid' };
      const result = WorkflowExecutionSchema.safeParse(execution);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WorkflowExecution.V1.safeParse(validExecution);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WorkflowExecution.getVersion('v1');
      const result = schema.safeParse(validExecution);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(WorkflowExecution.Latest).toBe(WorkflowExecution.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseWorkflowExecution returns valid execution', () => {
      const execution = parseWorkflowExecution(validExecution);
      expect(execution.id).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
    });

    it('parseWorkflowExecution throws on invalid data', () => {
      expect(() => parseWorkflowExecution({})).toThrow();
    });

    it('safeParseWorkflowExecution returns success result', () => {
      const result = safeParseWorkflowExecution(validExecution);
      expect(result.success).toBe(true);
    });

    it('safeParseWorkflowExecution returns failure result', () => {
      const result = safeParseWorkflowExecution({});
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

describe('isTerminalStatus', () => {
  it('returns true for terminal statuses', () => {
    expect(isTerminalStatus('succeeded')).toBe(true);
    expect(isTerminalStatus('failed')).toBe(true);
    expect(isTerminalStatus('cancelled')).toBe(true);
    expect(isTerminalStatus('timed_out')).toBe(true);
  });

  it('returns false for non-terminal statuses', () => {
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('queued')).toBe(false);
    expect(isTerminalStatus('running')).toBe(false);
    expect(isTerminalStatus('paused')).toBe(false);
    expect(isTerminalStatus('waiting')).toBe(false);
  });
});

describe('isCancellable', () => {
  it('returns true for cancellable statuses', () => {
    expect(isCancellable('pending')).toBe(true);
    expect(isCancellable('queued')).toBe(true);
    expect(isCancellable('running')).toBe(true);
    expect(isCancellable('paused')).toBe(true);
    expect(isCancellable('waiting')).toBe(true);
  });

  it('returns false for non-cancellable statuses', () => {
    expect(isCancellable('succeeded')).toBe(false);
    expect(isCancellable('failed')).toBe(false);
    expect(isCancellable('cancelled')).toBe(false);
    expect(isCancellable('timed_out')).toBe(false);
  });
});
