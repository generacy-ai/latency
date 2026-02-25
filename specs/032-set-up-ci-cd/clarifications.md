# Clarification Questions

## Status: Pending

## Questions

### Q1: Missing lint script in latency-plugin-source-control
**Context**: The `latency-plugin-source-control` package does not have a `lint` script in its `package.json`, while all other 15 packages do. Running `pnpm -r lint` in CI will fail (or skip) on this package. The spec assumes `pnpm lint` works across all packages.
**Question**: Should we add a `lint` script (`"lint": "tsc --noEmit"`) to `latency-plugin-source-control` to match the other packages, or should CI be configured to tolerate missing scripts (e.g., `pnpm -r --if-present lint`)?
**Options**:
- A) Add missing lint script: Add `"lint": "tsc --noEmit"` to `latency-plugin-source-control/package.json` for consistency
- B) Use `--if-present` flag: Change CI to run `pnpm -r --if-present lint` so missing scripts are silently skipped
**Answer**:

### Q2: Workspace protocol resolution for publishing
**Context**: All internal dependencies use `workspace:*` protocol (e.g., `"@generacy-ai/latency": "workspace:*"`). When publishing to npm, these must be replaced with real version ranges. Changesets handles this automatically, but 3 packages (`plugin-ci-cd`, `github-actions-interface`, `latency-plugin-github-actions`) also declare `peerDependencies` with pinned `^0.1.0` ranges that won't auto-update. The changesets config has `updateInternalDependencies: "patch"` which updates `dependencies` and `devDependencies` but may not cover `peerDependencies` by default.
**Question**: Should the `peerDependencies` version ranges be updated to use `workspace:^` protocol so changesets can manage them automatically, or should they remain as fixed `^0.1.0` ranges?
**Options**:
- A) Convert to `workspace:^`: Change peerDependencies to `"@generacy-ai/latency": "workspace:^"` so changesets resolves them on publish
- B) Keep fixed ranges: Leave peerDependencies as `^0.1.0` and manually update them when needed
- C) Use changesets `linked` groups: Configure linked versioning so peer dependency packages are always versioned together
**Answer**:

### Q3: Redundant lint and typecheck in CI
**Context**: In every package, the `lint` script is `tsc --noEmit`, which is identical to `typecheck`. The CI workflow runs `pnpm lint` then `pnpm test` then `pnpm build` (which runs `tsc`). This means TypeScript type checking runs twice: once for lint and once for build. The spec does not mention running `typecheck` separately. Adding a real linter (e.g., ESLint/Biome) is out of scope but this redundancy adds ~30-60s to CI.
**Question**: Should CI run `pnpm lint` as a separate step (accepting the redundancy), or should it be removed from CI since `pnpm build` already catches type errors?
**Options**:
- A) Keep lint step: Run `pnpm lint` as specified — it's fast enough and matches the spec literally
- B) Remove lint step: Skip `pnpm lint` in CI since `pnpm build` covers the same checks, and add it back when a real linter is introduced
- C) Replace with typecheck: Run `pnpm typecheck` instead of `pnpm lint` to be semantically accurate about what's happening
**Answer**:

### Q4: Preview snapshot version format
**Context**: The spec says preview versions should use the format `X.Y.Z-preview.YYYYMMDDHHMMSS` (datetime-based). However, `changeset version --snapshot preview` produces versions like `0.1.0-preview-YYYYMMDDHHMMSS` (hyphen, not dot) by default in Changesets v2, or `0.0.0-preview-YYYYMMDDHHMMSS` in some configurations. The exact format depends on the changesets version and config options.
**Question**: Is the exact datetime format important, or is any snapshot version format acceptable as long as it uses the `@preview` dist-tag and is clearly identifiable as a pre-release?
**Options**:
- A) Accept default format: Use whatever format `changesets --snapshot` produces by default (likely `0.1.0-preview-YYYYMMDDHHMMSS`)
- B) Enforce spec format: Add custom snapshot configuration to produce exactly `X.Y.Z-preview.YYYYMMDDHHMMSS` with a dot separator
**Answer**:

### Q5: CI workflow trigger scope
**Context**: The CI workflow in the spec triggers on `pull_request` (all PRs) and `push` to `develop`/`main`. This means CI runs twice for PRs targeting develop/main: once on the PR event and again on the push event after merge. Additionally, the `pull_request` trigger with no branch filter will run CI on PRs targeting any branch, not just `develop` and `main`.
**Question**: Should the `pull_request` trigger be scoped to only PRs targeting `develop` and `main`, and should the `push` trigger be kept (which causes duplicate runs on merge)?
**Options**:
- A) Keep both triggers as spec'd: Accept duplicate runs — push trigger ensures CI runs on direct pushes and merge results
- B) Scope PR trigger, keep push: Add `branches: [develop, main]` to `pull_request` trigger, keep `push` trigger for post-merge validation
- C) PR only, no push: Use only `pull_request` trigger (scoped to develop/main) to avoid duplicate CI runs on merge
**Answer**:

### Q6: NPM_TOKEN environment variable placement
**Context**: The preview publish workflow in the spec sets `NODE_AUTH_TOKEN` at the job level via `env:`, but the release workflow uses `NPM_TOKEN` inside the `changesets/action` step. The `actions/setup-node` with `registry-url` expects `NODE_AUTH_TOKEN`. The spec uses both `NPM_TOKEN` (the secret name) and `NODE_AUTH_TOKEN` (the env var) but the mapping between them is inconsistent across workflows.
**Question**: Should both workflows consistently use `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` at the step level where publishing occurs, or is the current mixed approach intentional?
**Options**:
- A) Standardize on NODE_AUTH_TOKEN: Use `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` consistently in both workflows at the publish step level
- B) Keep as spec'd: The `changesets/action` uses its own `NPM_TOKEN` env var convention, which is correct for that action
**Answer**:

### Q7: Handling packages with no real tests
**Context**: The `@generacy-ai/latency` core package has `"test": "echo 'No tests yet'"` which will pass CI but provides no actual validation. Two packages (`github-actions-interface`, `jira-interface`) have no `test` script at all — `pnpm -r test` may fail or skip these. The spec assumes all tests pass reliably in CI.
**Question**: Should packages without real tests have their test scripts standardized (e.g., add `"test": "echo 'No tests yet'"` to packages missing the script entirely), or should CI use `pnpm -r --if-present test`?
**Options**:
- A) Add placeholder test scripts: Add `"test": "echo 'No tests yet'"` to the 2 packages missing test scripts
- B) Use `--if-present`: Change CI to `pnpm -r --if-present test` to gracefully skip packages without test scripts
- C) Both: Add placeholder scripts AND use `--if-present` for resilience
**Answer**:

### Q8: Branch protection timing and method
**Context**: The spec lists branch protection as Phase 5 (post-merge) and mentions configuring it via "GitHub settings or `gh api`". However, the spec is being implemented on the `032-set-up-ci-cd` branch which will merge to `develop`, not `main`. Branch protection on `main` requires the CI workflow to exist on `main` first (for required status checks to reference). The spec also says `main` needs to be synced with `develop` first.
**Question**: Should branch protection be configured as part of this PR's implementation (using `gh api` commands documented in the PR), or should it be a manual post-merge step done by a maintainer?
**Options**:
- A) Document only: Add branch protection setup commands to the PR description as manual post-merge steps
- B) Automate with script: Create a setup script (e.g., `scripts/setup-branch-protection.sh`) that can be run after merge
- C) Configure in workflow: Add a one-time GitHub Actions workflow that sets branch protection via `gh api`
**Answer**:

### Q9: Changesets `fixed` and `linked` group configuration
**Context**: The changesets config has empty `fixed: []` and `linked: []` arrays. This monorepo has tightly coupled packages (e.g., `latency-plugin-git` depends on `git-interface` and `latency-plugin-source-control`). Without `linked` groups, a change to `git-interface` could be published at a new version while `latency-plugin-git` stays at the old version, even though they're meant to work together.
**Question**: Should any packages be grouped using changesets `linked` (versions bump together but can be released independently) or `fixed` (always same version) configuration?
**Options**:
- A) No grouping: Keep empty arrays — developers will manually add changesets for dependent packages when needed
- B) Link interface+plugin pairs: Link packages like `[git-interface, latency-plugin-git]`, `[jira-interface, latency-plugin-jira]`, etc.
- C) Fix all packages: Use `fixed` to keep all 16 packages at the same version number
- D) Link all packages: Use `linked` so any version bump applies to all packages that had changes
**Answer**:

### Q10: Develop branch CI — duplicate with preview publish
**Context**: On push to `develop`, both the CI workflow and the preview publish workflow will trigger. The preview publish workflow also runs `pnpm install` and `pnpm build`. This means every merge to `develop` runs two separate workflows that both install dependencies and build, consuming double the GitHub Actions minutes.
**Question**: Should the preview publish workflow be made dependent on the CI workflow (using `workflow_run` trigger or a reusable workflow), or should they remain independent parallel workflows?
**Options**:
- A) Keep independent: Run both workflows in parallel — simpler, more resilient to individual failures, ~2x minutes
- B) Chain with workflow_run: Make preview publish trigger only after CI succeeds using `workflow_run` — saves minutes but adds latency
- C) Merge into one workflow: Combine CI and preview publish into a single workflow with conditional publish job — most efficient but more complex
**Answer**:

