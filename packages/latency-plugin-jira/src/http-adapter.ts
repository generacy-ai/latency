import type { AbstractIssueTrackerOptions } from '@generacy-ai/latency-plugin-issue-tracker';

/** Injectable HTTP adapter for Jira REST API calls. */
export interface JiraHttpAdapter {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete(path: string): Promise<void>;
}

/** Configuration options for the JiraPlugin. */
export interface JiraPluginOptions extends AbstractIssueTrackerOptions {
  /** Required injectable HTTP adapter for Jira API calls. */
  http: JiraHttpAdapter;
  /** Default project key used for issue creation when not specified in the spec. */
  projectKey?: string;
}
