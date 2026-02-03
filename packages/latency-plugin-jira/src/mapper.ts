import type { Comment } from '@generacy-ai/latency';
import type { JiraIssue, JiraStatus, JiraSprint } from '@generacy-ai/jira-interface';

/** Raw Jira REST API v2 issue response shape (partial). */
interface RawJiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string | null;
    status: { id: string; name: string; statusCategory: { name: string } };
    issuetype: { name: string };
    priority?: { name: string } | null;
    project: { key: string };
    labels?: string[];
    assignee?: { displayName: string } | null;
    created: string;
    updated: string;
    sprint?: {
      id: number;
      name: string;
      state: string;
      startDate?: string;
      endDate?: string;
    } | null;
    [key: string]: unknown;
  };
}

/** Raw Jira REST API v2 comment response shape (partial). */
interface RawJiraComment {
  id: string;
  body: string;
  author: { displayName: string };
  created: string;
}

function mapStatus(raw: RawJiraIssue['fields']['status']): JiraStatus {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.statusCategory.name,
  };
}

function mapSprint(
  raw: RawJiraIssue['fields']['sprint'],
): JiraSprint | undefined {
  if (!raw) return undefined;
  return {
    id: raw.id,
    name: raw.name,
    state: raw.state,
    startDate: raw.startDate,
    endDate: raw.endDate,
  };
}

function extractCustomFields(
  fields: Record<string, unknown>,
): Record<string, unknown> {
  const customs: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('customfield_')) {
      customs[key] = value;
    }
  }
  return customs;
}

function deriveState(status: JiraStatus): 'open' | 'closed' {
  return status.category.toLowerCase() === 'done' ? 'closed' : 'open';
}

/** Maps a raw Jira REST API v2 issue response to a JiraIssue. */
export function mapJiraResponse(raw: unknown): JiraIssue {
  const r = raw as RawJiraIssue;
  const status = mapStatus(r.fields.status);
  const assignees: string[] = [];
  if (r.fields.assignee?.displayName) {
    assignees.push(r.fields.assignee.displayName);
  }

  return {
    id: r.id,
    key: r.key,
    title: r.fields.summary,
    body: r.fields.description ?? '',
    state: deriveState(status),
    labels: r.fields.labels ?? [],
    assignees,
    createdAt: new Date(r.fields.created),
    updatedAt: new Date(r.fields.updated),
    projectKey: r.fields.project.key,
    issueType: r.fields.issuetype.name,
    priority: r.fields.priority?.name ?? 'Medium',
    status,
    sprint: mapSprint(r.fields.sprint),
    storyPoints: r.fields['story_points'] as number | undefined,
    epicLink: r.fields['epic'] as string | undefined,
    customFields: extractCustomFields(r.fields as Record<string, unknown>),
  };
}

/** Maps a raw Jira REST API v2 comment response to a Comment. */
export function mapJiraComment(raw: unknown): Comment {
  const r = raw as RawJiraComment;
  return {
    id: r.id,
    body: r.body,
    author: r.author.displayName,
    createdAt: new Date(r.created),
  };
}
