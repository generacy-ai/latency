import { describe, it, expect } from 'vitest';
import {
  WorkflowStatusEventSchema,
  WorkflowStatusEvent,
  WorkflowExecutionStatusSchema,
  WorkflowStepStatusSchema,
  WorkflowStatusDataSchema,
  parseWorkflowStatusEvent,
  safeParseWorkflowStatusEvent,
} from '../sse/workflow-status.js';

describe('WorkflowExecutionStatusSchema', () => {
  it('accepts valid execution statuses', () => {
    expect(WorkflowExecutionStatusSchema.safeParse('pending').success).toBe(true);
    expect(WorkflowExecutionStatusSchema.safeParse('running').success).toBe(true);
    expect(WorkflowExecutionStatusSchema.safeParse('paused').success).toBe(true);
    expect(WorkflowExecutionStatusSchema.safeParse('completed').success).toBe(true);
    expect(WorkflowExecutionStatusSchema.safeParse('failed').success).toBe(true);
    expect(WorkflowExecutionStatusSchema.safeParse('cancelled').success).toBe(true);
  });

  it('rejects invalid execution statuses', () => {
    expect(WorkflowExecutionStatusSchema.safeParse('active').success).toBe(false);
    expect(WorkflowExecutionStatusSchema.safeParse('RUNNING').success).toBe(false);
    expect(WorkflowExecutionStatusSchema.safeParse('').success).toBe(false);
  });
});

describe('WorkflowStepStatusSchema', () => {
  it('accepts valid step statuses', () => {
    expect(WorkflowStepStatusSchema.safeParse('pending').success).toBe(true);
    expect(WorkflowStepStatusSchema.safeParse('running').success).toBe(true);
    expect(WorkflowStepStatusSchema.safeParse('completed').success).toBe(true);
    expect(WorkflowStepStatusSchema.safeParse('failed').success).toBe(true);
    expect(WorkflowStepStatusSchema.safeParse('skipped').success).toBe(true);
  });

  it('rejects invalid step statuses', () => {
    expect(WorkflowStepStatusSchema.safeParse('paused').success).toBe(false);
    expect(WorkflowStepStatusSchema.safeParse('cancelled').success).toBe(false);
  });
});

describe('WorkflowStatusDataSchema', () => {
  const validStatusData = {
    executionId: 'exec_123',
    workflowId: 'wf_456',
    status: 'running',
    statusChangedAt: '2024-01-15T10:30:00Z',
  };

  describe('valid status data', () => {
    it('accepts minimal status data', () => {
      const result = WorkflowStatusDataSchema.safeParse(validStatusData);
      expect(result.success).toBe(true);
    });

    it('accepts status data with current step', () => {
      const data = {
        ...validStatusData,
        currentStepId: 'step_789',
        currentStepName: 'Deploy to staging',
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts status data with progress', () => {
      const data = {
        ...validStatusData,
        progress: {
          totalSteps: 5,
          completedSteps: 2,
          percentComplete: 40,
        },
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts status data with error', () => {
      const data = {
        ...validStatusData,
        status: 'failed',
        error: {
          code: 'STEP_TIMEOUT',
          message: 'Step exceeded maximum execution time',
          stepId: 'step_789',
        },
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('accepts status data with execution location', () => {
      const data = {
        ...validStatusData,
        executionLocation: 'cloud',
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(true);

      const localData = {
        ...validStatusData,
        executionLocation: 'local',
      };
      expect(WorkflowStatusDataSchema.safeParse(localData).success).toBe(true);
    });

    it('accepts complete status data with all fields', () => {
      const data = {
        executionId: 'exec_123',
        workflowId: 'wf_456',
        status: 'running',
        currentStepId: 'step_3',
        currentStepName: 'Run tests',
        progress: {
          totalSteps: 10,
          completedSteps: 5,
          percentComplete: 50,
        },
        executionLocation: 'cloud',
        statusChangedAt: '2024-01-15T10:30:00Z',
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid status data', () => {
    it('rejects empty executionId', () => {
      const data = { ...validStatusData, executionId: '' };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects empty workflowId', () => {
      const data = { ...validStatusData, workflowId: '' };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const data = { ...validStatusData, status: 'unknown' };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp format', () => {
      const data = { ...validStatusData, statusChangedAt: '2024-01-15' };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects negative progress values', () => {
      const data = {
        ...validStatusData,
        progress: {
          totalSteps: -1,
          completedSteps: 0,
          percentComplete: 0,
        },
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects percentComplete over 100', () => {
      const data = {
        ...validStatusData,
        progress: {
          totalSteps: 5,
          completedSteps: 5,
          percentComplete: 150,
        },
      };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects invalid execution location', () => {
      const data = { ...validStatusData, executionLocation: 'hybrid' };
      const result = WorkflowStatusDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('WorkflowStatusEventSchema', () => {
  const validEvent = {
    id: 'evt_01ARZ3NDEKTSV4RRFFQ69G5FAV',
    type: 'workflow.started',
    data: {
      executionId: 'exec_123',
      workflowId: 'wf_456',
      status: 'running',
      statusChangedAt: '2024-01-15T10:30:00Z',
    },
    timestamp: '2024-01-15T10:30:00Z',
  };

  describe('valid events', () => {
    it('accepts valid workflow.started event', () => {
      const result = WorkflowStatusEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('accepts workflow.step_completed event', () => {
      const event = {
        ...validEvent,
        type: 'workflow.step_completed',
        data: {
          ...validEvent.data,
          currentStepId: 'step_2',
          currentStepName: 'Build application',
          progress: {
            totalSteps: 5,
            completedSteps: 1,
            percentComplete: 20,
          },
        },
      };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts workflow.completed event', () => {
      const event = {
        ...validEvent,
        type: 'workflow.completed',
        data: {
          ...validEvent.data,
          status: 'completed',
          progress: {
            totalSteps: 5,
            completedSteps: 5,
            percentComplete: 100,
          },
        },
      };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts workflow.failed event with error', () => {
      const event = {
        ...validEvent,
        type: 'workflow.failed',
        data: {
          ...validEvent.data,
          status: 'failed',
          error: {
            code: 'EXECUTION_ERROR',
            message: 'Step failed with exit code 1',
            stepId: 'step_3',
          },
        },
      };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts workflow.paused event', () => {
      const event = {
        ...validEvent,
        type: 'workflow.paused',
        data: {
          ...validEvent.data,
          status: 'paused',
          currentStepId: 'step_breakpoint',
        },
      };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('accepts event with retry field', () => {
      const event = { ...validEvent, retry: 5000 };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.retry).toBe(5000);
      }
    });
  });

  describe('invalid events', () => {
    it('rejects non-workflow event types', () => {
      const event = { ...validEvent, type: 'decision.created' };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects coaching event type', () => {
      const event = { ...validEvent, type: 'coaching.received' };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects empty event id', () => {
      const event = { ...validEvent, id: '' };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
      const event = { ...validEvent, timestamp: 'invalid' };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects invalid data payload', () => {
      const event = { ...validEvent, data: { invalid: 'data' } };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });

    it('rejects negative retry', () => {
      const event = { ...validEvent, retry: -1 };
      const result = WorkflowStatusEventSchema.safeParse(event);
      expect(result.success).toBe(false);
    });
  });

  describe('versioned namespace', () => {
    it('supports V1 schema access', () => {
      const result = WorkflowStatusEvent.V1.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('supports getVersion helper', () => {
      const schema = WorkflowStatusEvent.getVersion('v1');
      const result = schema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('Latest points to V1', () => {
      expect(WorkflowStatusEvent.Latest).toBe(WorkflowStatusEvent.V1);
    });
  });

  describe('parse helpers', () => {
    it('parseWorkflowStatusEvent returns valid event', () => {
      const event = parseWorkflowStatusEvent(validEvent);
      expect(event.id).toBe(validEvent.id);
      expect(event.type).toBe('workflow.started');
      expect(event.data.executionId).toBe('exec_123');
    });

    it('parseWorkflowStatusEvent throws on invalid data', () => {
      expect(() => parseWorkflowStatusEvent({ id: '' })).toThrow();
    });

    it('safeParseWorkflowStatusEvent returns success result', () => {
      const result = safeParseWorkflowStatusEvent(validEvent);
      expect(result.success).toBe(true);
    });

    it('safeParseWorkflowStatusEvent returns failure result', () => {
      const result = safeParseWorkflowStatusEvent({ type: 'decision.created' });
      expect(result.success).toBe(false);
    });
  });
});
