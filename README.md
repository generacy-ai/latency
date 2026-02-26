# Latency

Latency monitoring, performance tracking, and plugin infrastructure for software development workflows. A modular TypeScript monorepo providing a plugin-based architecture for integrating dev agents, source control, CI/CD pipelines, and issue trackers.

## Packages

### Core

| Package | Description |
|---------|-------------|
| [`@generacy-ai/latency`](packages/latency) | Latency monitoring and performance tracking core library |

### Interfaces

| Package | Description |
|---------|-------------|
| [`@generacy-ai/claude-code-interface`](packages/claude-code-interface) | Types and interfaces for Claude Code plugin consumers |
| [`@generacy-ai/git-interface`](packages/git-interface) | Git interface types and utilities |
| [`@generacy-ai/github-actions-interface`](packages/github-actions-interface) | TypeScript type definitions for GitHub Actions concepts extending core Latency types |
| [`@generacy-ai/github-issues-interface`](packages/github-issues-interface) | GitHub Issues interface types and utilities |
| [`@generacy-ai/jira-interface`](packages/jira-interface) | Jira-specific types and helpers |

### Abstract Plugins

| Package | Description |
|---------|-------------|
| [`@generacy-ai/latency-plugin-dev-agent`](packages/latency-plugin-dev-agent) | Abstract dev agent plugin providing common logic for AI agent implementations |
| [`@generacy-ai/latency-plugin-source-control`](packages/latency-plugin-source-control) | Abstract source control plugin providing common validation and shared logic for all VCS implementations |
| [`@generacy-ai/latency-plugin-issue-tracker`](packages/latency-plugin-issue-tracker) | Abstract issue tracker plugin |
| [`@generacy-ai/latency-plugin-ci-cd`](packages/plugin-ci-cd) | Abstract CI/CD plugin providing common logic for all pipeline implementations |

### Concrete Plugins

| Package | Description |
|---------|-------------|
| [`@generacy-ai/latency-plugin-claude-code`](packages/latency-plugin-claude-code) | Claude Code CLI plugin for the Latency dev agent ecosystem |
| [`@generacy-ai/latency-plugin-git`](packages/latency-plugin-git) | Git source control plugin |
| [`@generacy-ai/latency-plugin-github-actions`](packages/latency-plugin-github-actions) | GitHub Actions CI/CD plugin |
| [`@generacy-ai/latency-plugin-github-issues`](packages/latency-plugin-github-issues) | GitHub Issues plugin implementation |
| [`@generacy-ai/latency-plugin-jira`](packages/latency-plugin-jira) | Jira issue tracker plugin |
| [`@generacy-ai/latency-plugin-health-check`](packages/latency-plugin-health-check) | Health check plugin |

## Getting Started

### Prerequisites

- Node.js 20 or later
- [Corepack](https://nodejs.org/api/corepack.html) enabled (`corepack enable`) — this provides the correct pnpm version automatically

### Installation

```bash
corepack enable
pnpm install
```

## Development

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests across all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Run TypeScript type checking across all packages |

### Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing. When making changes that should result in a new package version, add a changeset:

```bash
pnpm changeset
```

## License

Apache-2.0 — see [LICENSE](LICENSE) for details.

## Security

To report a security vulnerability, see [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, coding standards, and how to submit changes.
