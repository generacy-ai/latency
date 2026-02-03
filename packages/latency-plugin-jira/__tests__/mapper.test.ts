import { describe, it, expect } from 'vitest';
import { mapJiraResponse, mapJiraComment } from '../src/mapper.js';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeRawJiraIssue(overrides: Record<string, unknown> = {}) {
  return {
    id: '10001',
    key: 'PROJ-123',
    fields: {
      summary: 'Test issue',
      description: 'Test description',
      status: {
        id: '1',
        name: 'Open',
        statusCategory: { name: 'To Do' },
      },
      issuetype: { name: 'Bug' },
      priority: { name: 'High' },
      project: { key: 'PROJ' },
      labels: ['bug', 'urgent'],
      assignee: { displayName: 'John Doe' },
      created: '2024-01-15T10:00:00.000Z',
      updated: '2024-01-16T12:00:00.000Z',
      sprint: null,
      ...overrides,
    },
  };
}

function makeRawJiraComment(overrides: Record<string, unknown> = {}) {
  return {
    id: '20001',
    body: 'This is a comment',
    author: { displayName: 'Jane Smith' },
    created: '2024-02-01T08:30:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// mapJiraResponse
// ---------------------------------------------------------------------------

describe('mapJiraResponse', () => {
  it('maps a complete Jira REST API v2 response correctly', () => {
    const raw = makeRawJiraIssue({
      sprint: {
        id: 42,
        name: 'Sprint 7',
        state: 'active',
        startDate: '2024-01-08T00:00:00.000Z',
        endDate: '2024-01-22T00:00:00.000Z',
      },
      story_points: 5,
      epic: 'PROJ-100',
      customfield_10010: 'custom-value',
    });

    const result = mapJiraResponse(raw);

    expect(result).toEqual({
      id: '10001',
      key: 'PROJ-123',
      title: 'Test issue',
      body: 'Test description',
      state: 'open',
      labels: ['bug', 'urgent'],
      assignees: ['John Doe'],
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-16T12:00:00.000Z'),
      projectKey: 'PROJ',
      issueType: 'Bug',
      priority: 'High',
      status: { id: '1', name: 'Open', category: 'To Do' },
      sprint: {
        id: 42,
        name: 'Sprint 7',
        state: 'active',
        startDate: '2024-01-08T00:00:00.000Z',
        endDate: '2024-01-22T00:00:00.000Z',
      },
      storyPoints: 5,
      epicLink: 'PROJ-100',
      customFields: { customfield_10010: 'custom-value' },
    });
  });

  it('handles missing optional fields (no sprint, story_points, epic, priority)', () => {
    const raw = makeRawJiraIssue({
      sprint: null,
      priority: null,
    });
    // Ensure story_points and epic are not present
    delete (raw.fields as Record<string, unknown>)['story_points'];
    delete (raw.fields as Record<string, unknown>)['epic'];

    const result = mapJiraResponse(raw);

    expect(result.sprint).toBeUndefined();
    expect(result.storyPoints).toBeUndefined();
    expect(result.epicLink).toBeUndefined();
    expect(result.priority).toBe('Medium');
  });

  it('maps status category "Done" to state "closed"', () => {
    const raw = makeRawJiraIssue({
      status: {
        id: '3',
        name: 'Closed',
        statusCategory: { name: 'Done' },
      },
    });

    const result = mapJiraResponse(raw);

    expect(result.state).toBe('closed');
  });

  it('maps non-Done status category to state "open"', () => {
    const cases = ['To Do', 'In Progress', 'New', 'Review'];

    for (const category of cases) {
      const raw = makeRawJiraIssue({
        status: {
          id: '2',
          name: category,
          statusCategory: { name: category },
        },
      });

      const result = mapJiraResponse(raw);

      expect(result.state).toBe('open');
    }
  });

  it('derives state "closed" case-insensitively from "done"', () => {
    const raw = makeRawJiraIssue({
      status: {
        id: '3',
        name: 'Done',
        statusCategory: { name: 'done' },
      },
    });

    const result = mapJiraResponse(raw);

    expect(result.state).toBe('closed');
  });

  it('extracts custom fields (fields starting with "customfield_")', () => {
    const raw = makeRawJiraIssue({
      customfield_10010: 'team-alpha',
      customfield_10020: 42,
      customfield_10030: null,
    });

    const result = mapJiraResponse(raw);

    expect(result.customFields).toEqual({
      customfield_10010: 'team-alpha',
      customfield_10020: 42,
      customfield_10030: null,
    });
  });

  it('returns empty customFields when no custom fields exist', () => {
    const raw = makeRawJiraIssue();

    const result = mapJiraResponse(raw);

    expect(result.customFields).toEqual({});
  });

  it('handles null assignee', () => {
    const raw = makeRawJiraIssue({ assignee: null });

    const result = mapJiraResponse(raw);

    expect(result.assignees).toEqual([]);
  });

  it('handles missing assignee (undefined)', () => {
    const raw = makeRawJiraIssue();
    delete (raw.fields as Record<string, unknown>).assignee;

    const result = mapJiraResponse(raw);

    expect(result.assignees).toEqual([]);
  });

  it('handles null description', () => {
    const raw = makeRawJiraIssue({ description: null });

    const result = mapJiraResponse(raw);

    expect(result.body).toBe('');
  });

  it('handles undefined (missing) description', () => {
    const raw = makeRawJiraIssue();
    delete (raw.fields as Record<string, unknown>).description;

    const result = mapJiraResponse(raw);

    expect(result.body).toBe('');
  });

  it('maps labels correctly', () => {
    const raw = makeRawJiraIssue({ labels: ['frontend', 'p1', 'regression'] });

    const result = mapJiraResponse(raw);

    expect(result.labels).toEqual(['frontend', 'p1', 'regression']);
  });

  it('defaults to empty labels array when labels are missing', () => {
    const raw = makeRawJiraIssue();
    delete (raw.fields as Record<string, unknown>).labels;

    const result = mapJiraResponse(raw);

    expect(result.labels).toEqual([]);
  });

  it('maps status fields correctly', () => {
    const raw = makeRawJiraIssue({
      status: {
        id: '5',
        name: 'In Review',
        statusCategory: { name: 'In Progress' },
      },
    });

    const result = mapJiraResponse(raw);

    expect(result.status).toEqual({
      id: '5',
      name: 'In Review',
      category: 'In Progress',
    });
  });

  it('maps sprint with optional dates omitted', () => {
    const raw = makeRawJiraIssue({
      sprint: {
        id: 10,
        name: 'Backlog Sprint',
        state: 'future',
      },
    });

    const result = mapJiraResponse(raw);

    expect(result.sprint).toEqual({
      id: 10,
      name: 'Backlog Sprint',
      state: 'future',
      startDate: undefined,
      endDate: undefined,
    });
  });
});

// ---------------------------------------------------------------------------
// mapJiraComment
// ---------------------------------------------------------------------------

describe('mapJiraComment', () => {
  it('maps a complete comment response correctly', () => {
    const raw = makeRawJiraComment();

    const result = mapJiraComment(raw);

    expect(result).toEqual({
      id: '20001',
      body: 'This is a comment',
      author: 'Jane Smith',
      createdAt: new Date('2024-02-01T08:30:00.000Z'),
    });
  });

  it('verifies date parsing produces correct Date object', () => {
    const raw = makeRawJiraComment({
      created: '2024-06-15T14:45:30.500Z',
    });

    const result = mapJiraComment(raw);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe('2024-06-15T14:45:30.500Z');
  });

  it('maps author display name correctly', () => {
    const raw = makeRawJiraComment({
      author: { displayName: 'Alice Wonderland' },
    });

    const result = mapJiraComment(raw);

    expect(result.author).toBe('Alice Wonderland');
  });
});
