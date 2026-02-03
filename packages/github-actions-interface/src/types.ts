import type { Pipeline, PipelineRun } from '@generacy-ai/latency';

export interface GitHubWorkflow extends Pipeline {
  path: string;
  state: 'active' | 'disabled_inactivity' | 'disabled_manually';
  triggers: GitHubWorkflowTrigger[];
}

export interface GitHubWorkflowRun extends PipelineRun {
  workflowId: number;
  runNumber: number;
  attempt: number;
  triggeredBy: string;
  headSha: string;
  headBranch: string;
  jobs: GitHubJob[];
}

export interface GitHubWorkflowTrigger {
  event: string;
  branches?: string[];
  paths?: string[];
  cron?: string;
}

export interface GitHubJob {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  steps: GitHubStep[];
}

export interface GitHubStep {
  number: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
}

export interface GitHubArtifact {
  id: number;
  name: string;
  sizeInBytes: number;
  archiveDownloadUrl: string;
  expired: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
