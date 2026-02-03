export { JiraPlugin } from './jira-plugin.js';
export type { JiraHttpAdapter, JiraPluginOptions } from './http-adapter.js';
export { mapJiraResponse, mapJiraComment } from './mapper.js';

// Re-export all types from jira-interface
export type {
  JiraIssue,
  JiraIssueSpec,
  JiraIssueType,
  JiraPriority,
  JiraStatus,
  JiraSprint,
  JiraTransition,
  JiraIssueLink,
} from '@generacy-ai/jira-interface';
export { isJiraIssue, getJiraIssueUrl } from '@generacy-ai/jira-interface';
