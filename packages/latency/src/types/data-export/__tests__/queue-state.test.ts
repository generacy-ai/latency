import { describe, it, expect } from 'vitest';
import {
  ExportQueueItemSchema,
  ExportSavedFilterSchema,
  QueueStateSchema,
  parseQueueState,
  safeParseQueueState,
} from '../queue-state.js';

describe('Queue State Schemas', () => {
  describe('ExportQueueItemSchema', () => {
    const createValidItem = () => ({
      id: 'qitem_abc12345',
      title: 'Choose deployment strategy',
      domains: ['infrastructure', 'devops'],
      urgency: 'high',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00Z',
    });

    it('should accept valid queue item', () => {
      const item = createValidItem();
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept all urgency values', () => {
      const urgencies = ['critical', 'high', 'normal', 'low'];
      urgencies.forEach((urgency) => {
        const item = createValidItem();
        item.urgency = urgency as 'high';
        const result = ExportQueueItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all status values', () => {
      const statuses = ['pending', 'in_progress', 'resolved', 'deferred', 'expired'];
      statuses.forEach((status) => {
        const item = createValidItem();
        item.status = status as 'pending';
        const result = ExportQueueItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      });
    });

    it('should accept item with source', () => {
      const item = {
        ...createValidItem(),
        source: {
          type: 'workflow',
          ref: 'workflow_abc123',
        },
      };
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept all source types', () => {
      const sourceTypes = ['manual', 'automated', 'workflow', 'external'];
      sourceTypes.forEach((type) => {
        const item = {
          ...createValidItem(),
          source: { type },
        };
        const result = ExportQueueItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      });
    });

    it('should accept resolved item with resolution', () => {
      const item = {
        ...createValidItem(),
        status: 'resolved',
        resolution: {
          resolvedAt: '2024-01-15T14:00:00Z',
          resolvedBy: 'user_abc123',
          chosenOptionId: 'dopt_001',
          notes: 'Chose option A due to budget',
        },
      };
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should accept complete queue item', () => {
      const item = {
        id: 'qitem_abc12345',
        decisionRequestId: 'dreq_def67890',
        title: 'Choose deployment strategy',
        description: 'Need to decide between options',
        domains: ['infrastructure'],
        urgency: 'critical',
        status: 'in_progress',
        assignedTo: 'user_abc123',
        projectId: 'proj_xyz',
        source: { type: 'manual' },
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        dueAt: '2024-01-16T12:00:00Z',
        tags: ['urgent', 'deployment'],
        priorityScore: 85,
      };
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const item = createValidItem();
      item.title = '';
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });

    it('should reject empty domains array', () => {
      const item = createValidItem();
      item.domains = [];
      const result = ExportQueueItemSchema.safeParse(item);
      expect(result.success).toBe(false);
    });
  });

  describe('ExportSavedFilterSchema', () => {
    it('should accept valid saved filter', () => {
      const filter = {
        id: 'filter_abc12345',
        name: 'Critical Infrastructure',
        ownerId: 'user_abc123',
        isShared: true,
        criteria: {
          urgency: ['critical', 'high'],
          domains: ['infrastructure'],
        },
      };
      const result = ExportSavedFilterSchema.safeParse(filter);
      expect(result.success).toBe(true);
    });

    it('should accept filter with all criteria', () => {
      const filter = {
        id: 'filter_abc12345',
        name: 'Complete Filter',
        ownerId: 'user_abc123',
        isShared: false,
        criteria: {
          projectId: 'proj_xyz',
          urgency: ['critical'],
          domains: ['architecture', 'security'],
          assignedTo: 'user_def456',
          status: ['pending', 'in_progress'],
          dateRange: {
            from: '2024-01-01T00:00:00Z',
            to: '2024-12-31T23:59:59Z',
          },
          tags: ['urgent'],
        },
        createdAt: '2024-01-01T00:00:00Z',
        lastUsedAt: '2024-01-15T10:00:00Z',
        useCount: 50,
      };
      const result = ExportSavedFilterSchema.safeParse(filter);
      expect(result.success).toBe(true);
    });

    it('should accept filter with empty criteria', () => {
      const filter = {
        id: 'filter_abc12345',
        name: 'No Filters',
        ownerId: 'user_abc123',
        isShared: false,
        criteria: {},
      };
      const result = ExportSavedFilterSchema.safeParse(filter);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const filter = {
        id: 'filter_abc12345',
        name: '',
        ownerId: 'user_abc123',
        isShared: false,
        criteria: {},
      };
      const result = ExportSavedFilterSchema.safeParse(filter);
      expect(result.success).toBe(false);
    });
  });

  describe('QueueStateSchema', () => {
    const createValidExport = () => ({
      exportVersion: '1.0.0',
      exportedAt: '2024-01-15T12:00:00Z',
      orgId: 'org_abc123',
      items: [
        {
          id: 'qitem_abc12345',
          title: 'Test Decision',
          domains: ['test'],
          urgency: 'normal',
          status: 'pending',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
      filters: [
        {
          id: 'filter_abc12345',
          name: 'Test Filter',
          ownerId: 'user_abc123',
          isShared: false,
          criteria: {},
        },
      ],
    });

    it('should accept valid export', () => {
      const exportData = createValidExport();
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with empty arrays', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        items: [],
        filters: [],
      };
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with statistics', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { statistics: object }).statistics = {
        itemCount: 100,
        itemsByStatus: { pending: 50, in_progress: 30, resolved: 20 },
        itemsByUrgency: { critical: 10, high: 30, normal: 50, low: 10 },
        itemsByDomain: { infrastructure: 40, architecture: 35, security: 25 },
        filterCount: 5,
        sharedFilterCount: 2,
        avgResolutionTimeMs: 3600000,
      };
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should accept export with options', () => {
      const exportData = createValidExport();
      (exportData as typeof exportData & { exportOptions: object }).exportOptions = {
        includeResolved: true,
        itemDateRange: {
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-15T12:00:00Z',
        },
        statusFilter: ['pending', 'in_progress'],
      };
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(true);
    });

    it('should reject missing orgId', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        items: [],
        filters: [],
      };
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid version format', () => {
      const exportData = createValidExport();
      exportData.exportVersion = 'version1.0';
      const result = QueueStateSchema.safeParse(exportData);
      expect(result.success).toBe(false);
    });
  });

  describe('Parse functions', () => {
    it('parseQueueState should return parsed data', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        items: [],
        filters: [],
      };
      const result = parseQueueState(exportData);
      expect(result.orgId).toBe('org_abc123');
    });

    it('parseQueueState should throw on invalid data', () => {
      expect(() => parseQueueState({ invalid: 'data' })).toThrow();
    });

    it('safeParseQueueState should return success result', () => {
      const exportData = {
        exportVersion: '1.0.0',
        exportedAt: '2024-01-15T12:00:00Z',
        orgId: 'org_abc123',
        items: [],
        filters: [],
      };
      const result = safeParseQueueState(exportData);
      expect(result.success).toBe(true);
    });

    it('safeParseQueueState should return error on invalid data', () => {
      const result = safeParseQueueState({ invalid: 'data' });
      expect(result.success).toBe(false);
    });
  });
});
