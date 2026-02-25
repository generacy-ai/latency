import { describe, it, expect } from 'vitest';
import {
  WorkItemType,
  WorkItemStatus,
  WorkItemSchema,
  WorkItemTypeSchema,
  WorkItemStatusSchema,
  parseWorkItem,
  safeParseWorkItem,
} from '../../../src/protocols/orchestration/work-item.js';

describe('WorkItemType', () => {
  it('has correct values', () => {
    expect(WorkItemType.GITHUB_ISSUE).toBe('github-issue');
    expect(WorkItemType.TASK).toBe('task');
    expect(WorkItemType.REVIEW).toBe('review');
  });
});

describe('WorkItemStatus', () => {
  it('has correct values', () => {
    expect(WorkItemStatus.PENDING).toBe('pending');
    expect(WorkItemStatus.CLAIMED).toBe('claimed');
    expect(WorkItemStatus.IN_PROGRESS).toBe('in-progress');
    expect(WorkItemStatus.COMPLETED).toBe('completed');
    expect(WorkItemStatus.FAILED).toBe('failed');
  });
});

describe('WorkItemTypeSchema', () => {
  it('accepts valid work item types', () => {
    expect(WorkItemTypeSchema.safeParse('github-issue').success).toBe(true);
    expect(WorkItemTypeSchema.safeParse('task').success).toBe(true);
    expect(WorkItemTypeSchema.safeParse('review').success).toBe(true);
  });

  it('rejects invalid work item types', () => {
    expect(WorkItemTypeSchema.safeParse('invalid').success).toBe(false);
    expect(WorkItemTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('WorkItemStatusSchema', () => {
  it('accepts valid statuses', () => {
    expect(WorkItemStatusSchema.safeParse('pending').success).toBe(true);
    expect(WorkItemStatusSchema.safeParse('claimed').success).toBe(true);
    expect(WorkItemStatusSchema.safeParse('in-progress').success).toBe(true);
    expect(WorkItemStatusSchema.safeParse('completed').success).toBe(true);
    expect(WorkItemStatusSchema.safeParse('failed').success).toBe(true);
  });

  it('rejects invalid statuses', () => {
    expect(WorkItemStatusSchema.safeParse('unknown').success).toBe(false);
  });
});

describe('WorkItemSchema', () => {
  const validUlid = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const validTimestamp = '2024-01-15T10:30:00Z';

  const validWorkItem = {
    id: validUlid,
    type: 'github-issue',
    priority: 1,
    status: 'pending',
    payload: { issueNumber: 123 },
    createdAt: validTimestamp,
    updatedAt: validTimestamp,
  };

  it('accepts valid work item without assignedAgent', () => {
    const result = safeParseWorkItem(validWorkItem);
    expect(result.success).toBe(true);
  });

  it('accepts valid work item with assignedAgent', () => {
    const workItemWithAgent = {
      ...validWorkItem,
      assignedAgent: validUlid,
    };
    const result = safeParseWorkItem(workItemWithAgent);
    expect(result.success).toBe(true);
  });

  it('rejects work item with invalid id', () => {
    const invalid = { ...validWorkItem, id: 'invalid' };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects work item with invalid type', () => {
    const invalid = { ...validWorkItem, type: 'invalid' };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects work item with negative priority', () => {
    const invalid = { ...validWorkItem, priority: -1 };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects work item with invalid status', () => {
    const invalid = { ...validWorkItem, status: 'invalid' };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects work item with invalid timestamp', () => {
    const invalid = { ...validWorkItem, createdAt: 'not-a-timestamp' };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects work item with missing required fields', () => {
    const invalid = { id: validUlid };
    const result = safeParseWorkItem(invalid);
    expect(result.success).toBe(false);
  });

  it('strips unknown fields', () => {
    const withExtra = { ...validWorkItem, extraField: 'should be removed' };
    const result = parseWorkItem(withExtra);
    expect((result as Record<string, unknown>).extraField).toBeUndefined();
  });
});
