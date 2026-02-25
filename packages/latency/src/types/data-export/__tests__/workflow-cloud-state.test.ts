import { describe, it, expect } from 'vitest';
import {
  ExportWorkflowDefinitionSchema,
  ExportExecutionSummarySchema,
  ExportScheduledRunSchema,
  WorkflowCloudStateSchema,
  parseWorkflowCloudState,
  safeParseWorkflowCloudState,
} from '../workflow-cloud-state.js';

describe('Workflow Cloud State Schemas', () => {
  describe('ExportWorkflowDefinitionSchema', () => {
    it('should accept valid workflow definition', () => {
      const workflow = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Deploy to Production',
        version: '1.0.0',
        enabled: true,
        triggerTypes: ['manual', 'schedule'],
        stepCount: 5,
        tags: ['production', 'deploy'],
      };
      const result = ExportWorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('should accept workflow with all trigger types', () => {
      const workflow = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Full Trigger',
        enabled: true,
        triggerTypes: ['manual', 'schedule', 'webhook', 'event'],
        stepCount: 3,
        tags: [],
      };
      const result = ExportWorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('should accept workflow with full definition', () => {
      const workflow = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: 'Test',
        enabled: false,
        triggerTypes: ['manual'],
        stepCount: 1,
        tags: [],
        definition: { steps: [{ id: '1', name: 'step1' }] },
      };
      const result = ExportWorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const workflow = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        name: '',
        enabled: true,
        triggerTypes: ['manual'],
        stepCount: 1,
        tags: [],
      };
      const result = ExportWorkflowDefinitionSchema.safeParse(workflow);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportExecutionSummarySchema', () => {
    it('should accept valid execution summary', () => {
      const execution = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        status: 'succeeded',
        executionLocation: 'cloud',
        createdAt: '2024-01-15T10:30:00Z',
      };
      const result = ExportExecutionSummarySchema.safeParse(execution);
      expect(result.success).toBe(true);
    });

    it('should accept all status values', () => {
      const statuses = [
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
      statuses.forEach((status) => {
        const execution = {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          status,
          executionLocation: 'local',
          createdAt: '2024-01-15T10:30:00Z',
        };
        const result = ExportExecutionSummarySchema.safeParse(execution);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all execution location values', () => {
      const locations = ['local', 'cloud', 'hybrid'];
      locations.forEach((location) => {
        const execution = {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          status: 'succeeded',
          executionLocation: location,
          createdAt: '2024-01-15T10:30:00Z',
        };
        const result = ExportExecutionSummarySchema.safeParse(execution);
        expect(result.success).toBe(true);
      });
    });

    it('should accept complete execution summary', () => {
      const execution = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        workflowVersion: '1.2.0',
        status: 'failed',
        executionLocation: 'cloud',
        triggerType: 'webhook',
        createdAt: '2024-01-15T10:30:00Z',
        startedAt: '2024-01-15T10:30:05Z',
        completedAt: '2024-01-15T10:35:00Z',
        durationMs: 295000,
        errorMessage: 'Step 3 timed out',
        initiatedBy: 'user_abc123',
        tags: ['nightly', 'backup'],
      };
      const result = ExportExecutionSummarySchema.safeParse(execution);
      expect(result.success).toBe(true);
    });
  });

  describe('ExportScheduledRunSchema', () => {
    it('should accept valid scheduled run', () => {
      const scheduled = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        cron: '0 9 * * 1-5',
        enabled: true,
      };
      const result = ExportScheduledRunSchema.safeParse(scheduled);
      expect(result.success).toBe(true);
    });

    it('should accept complete scheduled run', () => {
      const scheduled = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        cron: '0 0 * * *',
        timezone: 'America/New_York',
        enabled: true,
        nextRunAt: '2024-01-16T00:00:00Z',
        lastRunAt: '2024-01-15T00:00:00Z',
        lastRunStatus: 'succeeded',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const result = ExportScheduledRunSchema.safeParse(scheduled);
      expect(result.success).toBe(true);
    });

    it('should accept all lastRunStatus values', () => {
      const statuses = ['succeeded', 'failed', 'cancelled'];
      statuses.forEach((status) => {
        const scheduled = {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
          workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          cron: '0 9 * * *',
          enabled: true,
          lastRunStatus: status,
        };
        const result = ExportScheduledRunSchema.safeParse(scheduled);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty cron', () => {
      const scheduled = {
        id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
        workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        cron: '',
        enabled: true,
      };
      const result = ExportScheduledRunSchema.safeParse(scheduled);
      expect(result.success).toBe(false);
    });
  });

  describe('WorkflowCloudStateSchema', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      orgId: 'org_abc123',
      workflows: [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          name: 'Test Workflow',
          enabled: true,
          triggerTypes: ['manual'],
          stepCount: 3,
          tags: [],
        },
      ],
      executions: [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAX',
          workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          status: 'succeeded',
          executionLocation: 'cloud',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
      scheduledRuns: [
        {
          id: '01ARZ3NDEKTSV4RRFFQ69G5FAY',
          workflowId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
          cron: '0 9 * * *',
          enabled: true,
        },
      ],
    });

    it('should accept valid export', () => {
      const exportData = createValidExport();
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with empty arrays', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        workflows: [],
        executions: [],
        scheduledRuns: [],
      };
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with statistics', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { statistics: object }).statistics = {
        workflowCount: 5,
        activeWorkflowCount: 4,
        executionCount: 100,
        executionsByStatus: { succeeded: 80, failed: 15, cancelled: 5 },
        scheduledRunCount: 3,
      };
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with options', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { exportOptions: object }).exportOptions = {
        includeDefinitions: true,
        executionDateRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-15T12:00:00Z',
        },
        executionStatusFilter: ['succeeded', 'failed'],
      };
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should reject missing orgId', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        workflows: [],
        executions: [],
        scheduledRuns: [],
      };
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid version format', () => {
      const exportData = createValidExport();
      exportData.exportVersion = 'v1';
      const result = WorkflowCloudStateSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    it('parseWorkflowCloudState should return parsed data', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        workflows: [],
        executions: [],
        scheduledRuns: [],
      };
      const result = parseWorkflowCloudState(exportData);
      expect(result.orgId).toBe('org_abc123');
    });

    it('parseWorkflowCloudState should throw on invalid data', () => {
      expect(() => parseWorkflowCloudState({ invalid: 'data' })).toThrow();
    });

    it('safeParseWorkflowCloudState should return success result', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        workflows: [],
        executions: [],
        scheduledRuns: [],
      };
      const result = safeParseWorkflowCloudState(exportData);
      expect(result.success).toBe(true);
    });

    it('safeParseWorkflowCloudState should return error on invalid data', () => {
      const result = safeParseWorkflowCloudState({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
