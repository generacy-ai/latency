# Research: CI/CD for Latency Repo

## Current State Analysis

### Existing Workflow Files (as of 2026-02-26)

All three workflow files already exist and are broadly functional:
- `.github/workflows/ci.yml` — PR and push CI
- `.github/workflows/publish-preview.yml` — Snapshot publishing on develop
- `.github/workflows/release.yml` — Stable publishing on main

### Discrepancies Between Spec and Implementation

Identified through 12 clarification questions. Each discrepancy maps to a targeted fix:

| Issue | Current State | Spec/Clarification | Fix |
|-------|--------------|---------------------|-----|
| Provenance flag | `--provenance` in preview publish | Out of scope (Q1) | Remove flag |
| OIDC permissions | `id-token: write` in both publish workflows | Out of scope (Q1) | Remove permission |
| npm global update | `npm install -g npm@latest` in both publish workflows | Unnecessary (Q3) | Remove step |
| Release auth | No `registry-url` in release workflow | Should align with preview (Q7) | Add `registry-url` |
| Preview concurrency | No concurrency group | Risk of duplicate publishes (Q9) | Add concurrency group |

### Commit History Context

- **c1b5983**: Removed `--provenance` flag due to issues — confirms Q1 answer is correct
- **9a764d9**: Removed `registry-url` from `setup-node` to avoid `.npmrc` conflict — this was likely caused by the OIDC/provenance interaction, not `registry-url` itself

## npm Authentication: How It Works

### `setup-node` with `registry-url`

When `actions/setup-node@v4` is configured with `registry-url`, it:
1. Creates a `.npmrc` file in the runner's home directory
2. Sets the registry URL and auth token reference:
   ```
   //registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}
   ```
3. Any subsequent `npm publish` or `pnpm changeset publish` reads this `.npmrc`

### Token Flow

```
GitHub Secret: NPM_TOKEN
    ↓
Workflow env: NODE_AUTH_TOKEN=${{ secrets.NPM_TOKEN }}
    ↓
.npmrc: _authToken=${NODE_AUTH_TOKEN}
    ↓
npm/pnpm reads .npmrc for registry auth
```

### Why Both NPM_TOKEN and NODE_AUTH_TOKEN?

- `NODE_AUTH_TOKEN`: Used by `.npmrc` created by `setup-node`. This is the standard GitHub Actions convention.
- `NPM_TOKEN`: Used by some tools (like `changesets/action`) directly via environment variable lookup.
- Setting both ensures compatibility regardless of which mechanism the publishing tool uses.

## Changesets Workflow Behavior

### On push to `main`:

The `changesets/action@v1` has two modes:
1. **If changeset files exist**: Creates a "Version Packages" PR that bumps versions and updates changelogs
2. **If no changeset files exist** (i.e., the Version Packages PR was just merged): Runs `pnpm changeset publish` to publish packages with updated versions to npm

This two-step dance means:
- First push to main with changesets → creates PR
- Merging that PR → triggers second push → publishes to npm

### On push to `develop` (preview):

The preview workflow uses `--snapshot preview` to create temporary versions like `0.1.0-preview-20260226123456` and publishes with the `preview` npm tag.

## pnpm Topological Build Order

`pnpm -r build` (recursive) automatically resolves workspace dependencies in topological order. This means packages are built in dependency order without any explicit configuration.

Verified dependency graph (16 packages, 4 levels):

- **Level 0**: `latency` (core — foundation package, no internal deps)
- **Level 1**: 9 packages depending only on core (interfaces + abstract plugins)
- **Level 2**: 4 packages depending on core + Level 1 (concrete plugins)
- **Level 3**: 2 packages depending on multiple levels (top-level plugins)

No Turbo/Nx is needed for this workspace size. Build times are fast enough with sequential topological builds.

## Preview Publish: workflow_run Trigger

The preview workflow uses `workflow_run` trigger instead of `push`:
```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [develop]
```

This means:
- It only runs after CI completes successfully on a push to develop
- It does NOT run on PR CI completions (the `event == 'push'` check ensures this)
- The `workflow_run` event provides the `conclusion` field to check CI success

**Important**: `workflow_run` always runs on the default branch's version of the workflow file. This means changes to `publish-preview.yml` on a feature branch won't take effect until merged to the default branch.
