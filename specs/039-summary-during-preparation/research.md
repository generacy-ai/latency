# Research: Public Repo Configuration Gaps

## Current Repository State

### Existing Files
| File | Status | Notes |
|------|--------|-------|
| `LICENSE` | Present | Apache 2.0, Copyright 2026 The Generacy AI Authors |
| `SECURITY.md` | Present | Complete — reporting via GitHub Security Advisories or security@generacy.ai |
| `README.md` | **Missing** | No root README |
| `CONTRIBUTING.md` | **Missing** | No contribution guide |
| `CODE_OF_CONDUCT.md` | **Missing** | No code of conduct |
| `.github/dependabot.yml` | **Missing** | No Dependabot configuration |

### Workflow Auth Analysis

#### `release.yml` (line 33)
- **Current**: `registry-url: https://registry.npmjs.org` in `setup-node`
- **Publish method**: `changesets/action@v1` with `publish: pnpm changeset publish --provenance`
- **Auth env**: `NPM_TOKEN: ${{ secrets.NPM_TOKEN }}`
- **Problem**: `setup-node` with `registry-url` writes an `.npmrc` with `//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}`. But `changesets/action` uses `NPM_TOKEN` (not `NODE_AUTH_TOKEN`) and writes its own `.npmrc`. The `setup-node`-generated `.npmrc` is redundant and potentially conflicting.
- **Decision (Q4)**: Remove `registry-url`. Commit `9a764d9` already validated this approach. `changesets/action` documentation confirms it manages its own `.npmrc`.
- **Also present**: `id-token: write` permission for provenance/OIDC.

#### `publish-preview.yml` (line 47)
- **Current**: `registry-url: https://registry.npmjs.org` in `setup-node`
- **Publish method**: Direct `pnpm changeset publish --tag preview --provenance`
- **Auth env**: `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`
- **Assessment**: This is correct. `setup-node` + `registry-url` generates `.npmrc` using `NODE_AUTH_TOKEN`, which is the standard pattern for direct `npm publish` / `pnpm publish`.
- **Decision**: Keep as-is. The `registry-url` + `NODE_AUTH_TOKEN` pattern is the intended `setup-node` workflow.

### Package Inventory (16 packages)

#### Core
| Package | Description |
|---------|-------------|
| `@generacy-ai/latency` | Latency monitoring and performance tracking for the Tetrad ecosystem |

#### Interface Packages
| Package | Description |
|---------|-------------|
| `@generacy-ai/claude-code-interface` | Types and interfaces for Claude Code plugin consumers |
| `@generacy-ai/git-interface` | Git interface types and utilities for the Latency ecosystem |
| `@generacy-ai/github-actions-interface` | TypeScript type definitions for GitHub Actions concepts extending core Latency types |
| `@generacy-ai/github-issues-interface` | GitHub Issues interface types and utilities for the Latency ecosystem |
| `@generacy-ai/jira-interface` | Jira-specific types and helpers for the Latency ecosystem |

#### Abstract Plugin Packages
| Package | Description |
|---------|-------------|
| `@generacy-ai/latency-plugin-dev-agent` | Abstract dev agent plugin providing common logic for AI agent implementations |
| `@generacy-ai/latency-plugin-source-control` | Abstract source control plugin providing common validation and shared logic for all VCS implementations |
| `@generacy-ai/latency-plugin-ci-cd` | Abstract CI/CD plugin providing common logic for all pipeline implementations |
| `@generacy-ai/latency-plugin-issue-tracker` | Abstract issue tracker plugin for the Latency ecosystem |

#### Concrete Plugin Packages
| Package | Description |
|---------|-------------|
| `@generacy-ai/latency-plugin-claude-code` | Claude Code CLI plugin for the Latency dev agent ecosystem |
| `@generacy-ai/latency-plugin-git` | Git source control plugin for the Latency ecosystem |
| `@generacy-ai/latency-plugin-github-actions` | GitHub Actions CI/CD plugin for the Latency ecosystem |
| `@generacy-ai/latency-plugin-github-issues` | GitHub Issues plugin implementation for the Latency ecosystem |
| `@generacy-ai/latency-plugin-jira` | Jira issue tracker plugin for the Latency ecosystem |
| `@generacy-ai/latency-plugin-health-check` | Health check plugin for the Latency ecosystem |

### Key Technical Context

- **Monorepo tool**: pnpm workspaces (no Turborepo)
- **Build orchestration**: `pnpm -r build` (recursive)
- **Version management**: `@changesets/cli` with `baseBranch: develop`
- **TypeScript**: Strict mode, `NodeNext` module resolution, ES2022 target
- **Test framework**: vitest
- **Node**: `>=20.0.0` engine requirement, Node 22 in CI
- **Package manager**: `pnpm@9.15.5` (via `packageManager` field / Corepack)
- **Changeset access**: `public` (all packages published publicly)
- **License**: Apache-2.0
- **Org**: Generacy AI (`@generacy-ai` npm scope)

### Contributor Covenant v2.1

The Contributor Covenant v2.1 is the most widely adopted code of conduct for open-source projects. The template requires:
- **Contact method**: `conduct@generacy.ai` (per Q7 answer)
- **Enforcement guidelines**: Correction, Warning, Temporary Ban, Permanent Ban levels
- No other customization needed — the template is self-contained.
