# Clarification Questions

## Status: Pending

## Questions

### Q1: Provenance Flag in Preview Publish
**Context**: The existing `publish-preview.yml` workflow uses `--provenance` on `pnpm changeset publish`, and the workflow has `id-token: write` permission to support npm provenance via OIDC. However, previous commits (c1b5983) removed the `--provenance` flag due to issues, and the spec's "Out of Scope" section says "npm OIDC trusted publishing" is not included. The current workflow file still has `--provenance` and `id-token: write`, contradicting the spec.
**Question**: Should the `--provenance` flag and `id-token: write` permission be removed from the preview and release workflows to match the spec's token-only approach, or should provenance signing be kept as a best practice alongside token-based auth?
**Options**:
- A) Remove `--provenance` and `id-token: write`: Matches the spec exactly — pure `NPM_TOKEN` auth with no OIDC. Simplest approach; avoids the OIDC configuration issues seen in prior commits.
- B) Keep `--provenance` alongside `NPM_TOKEN`: Uses token-based auth for publishing but adds provenance attestation via OIDC as a non-blocking enhancement. Provides supply chain security benefits.
- C) Defer to what currently works: Remove `--provenance` only if it's causing failures in the current pipeline; otherwise keep it.
**Answer**:

### Q2: registry-url in setup-node vs .npmrc
**Context**: The current `publish-preview.yml` still uses `registry-url: https://registry.npmjs.org` in the `setup-node` action, but commit 9a764d9 specifically removed this to avoid `.npmrc` conflicts. The release workflow does NOT use `registry-url`. The spec does not specify how npm authentication should be configured at the workflow level (just says "uses NPM_TOKEN"). There is no `.npmrc` file in the repo.
**Question**: What is the intended npm authentication mechanism in workflows — should `registry-url` be set in `setup-node` (which auto-creates `.npmrc`), or should an `.npmrc` be explicitly created/committed, or should the `NPM_TOKEN` be set as an environment variable directly?
**Options**:
- A) Use `registry-url` in `setup-node`: Let the action auto-generate `.npmrc` with `NODE_AUTH_TOKEN`. Simple but has caused conflicts previously.
- B) Commit a root `.npmrc` file: Add `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` to the repo. Consistent across all workflows but exposes the auth pattern in source.
- C) Set `NPM_TOKEN` as env variable only: Rely on changesets/action and pnpm's default behavior to pick up `NPM_TOKEN` from the environment. Matches how `release.yml` currently works.
**Answer**:

### Q3: npm Global Update Step
**Context**: Both `publish-preview.yml` and `release.yml` include a step `npm install -g npm@latest` before installing dependencies. The spec does not mention this step. It's unclear why a global npm update is needed when pnpm is the package manager — this may have been a workaround for an npm provenance/publishing bug.
**Question**: Should the `npm install -g npm@latest` step be kept in the workflows, or removed as unnecessary overhead since pnpm handles all package management?
**Options**:
- A) Remove it: pnpm is the package manager; a global npm update is unnecessary and adds ~10s to each workflow run.
- B) Keep it: There may be an underlying reason (e.g., `pnpm changeset publish` shells out to npm internally, and an older npm version has bugs).
- C) Investigate and document: Determine if there's a concrete reason before deciding, and document the finding in the spec.
**Answer**:

### Q4: Spec Says "New Implementation" but Workflows Already Exist
**Context**: The spec reads as though these workflows need to be created from scratch (Phase 2, blocked by generacy#242). However, all three workflow files (`ci.yml`, `publish-preview.yml`, `release.yml`) and the `.changeset/config.json` already exist and appear functional. The spec's acceptance criteria closely match the existing implementation.
**Question**: Is the intent of this spec to (a) document and validate the existing CI/CD setup, (b) replace/rewrite the workflows with improvements, or (c) make specific targeted changes to the existing workflows? This affects the scope of implementation work.
**Options**:
- A) Document and validate: The workflows already exist; this spec formalizes them. Implementation is verification + minor fixes only.
- B) Rewrite with improvements: Use the spec as the source of truth and rewrite workflows to match exactly, resolving discrepancies (provenance, registry-url, npm update).
- C) Targeted fixes: Keep existing workflows but fix the specific discrepancies identified between spec and implementation.
**Answer**:

### Q5: Preview Publish Failure Handling
**Context**: The spec does not describe what should happen if a preview snapshot publish partially fails (e.g., 10 of 16 packages publish but 6 fail due to a transient npm registry error). Since preview publishes modify package versions in-place via `changeset version --snapshot`, a partial failure leaves the workspace in a dirty state.
**Question**: What is the desired failure behavior for preview publishes — should partial failures be retried, should the workflow be idempotent, or is "fail and investigate manually" acceptable for the preview stream?
**Options**:
- A) Fail fast, investigate manually: Preview is best-effort; if it fails, developers can re-trigger by pushing to develop. No special retry logic needed.
- B) Add retry logic: Wrap the publish step in a retry (e.g., 3 attempts with backoff) to handle transient npm registry errors.
- C) Publish packages individually: Instead of `pnpm changeset publish` (all-or-nothing), publish each package separately so partial success is preserved.
**Answer**:

### Q6: CI Workflow Trigger Scope for Pull Requests
**Context**: The spec says CI triggers "on all pull requests (to any branch)" and the current `ci.yml` uses `pull_request:` with no branch filter, which matches. However, this means PRs targeting feature branches (not just develop/main) also trigger CI. In a monorepo with active development, this could consume significant GitHub Actions minutes.
**Question**: Should the CI workflow trigger on PRs to ALL branches (current behavior), or only on PRs targeting `develop` and `main`?
**Options**:
- A) All branches (current): Maximum safety — every PR gets CI regardless of target. Matches the spec as written.
- B) Only `develop` and `main`: Reduces Actions minutes usage. PRs to feature branches skip CI, which is acceptable if those branches eventually merge to develop.
**Answer**:

### Q7: Stable Release npm Authentication Mechanism
**Context**: In the current `release.yml`, the `NPM_TOKEN` is passed as an environment variable to the `changesets/action@v1` step. However, the changesets action documentation typically expects `NPM_TOKEN` to be available for `npm publish` internally. The release workflow does NOT use `registry-url` in `setup-node` and has no `.npmrc` — it's unclear how npm knows to use the token for authentication during `pnpm changeset publish`.
**Question**: Has the stable release pipeline been verified to successfully publish to npm with the current authentication setup? If not, should we add explicit `.npmrc` configuration or `registry-url` to the release workflow?
**Options**:
- A) Verified working: The changesets/action handles `NPM_TOKEN` automatically; no changes needed.
- B) Add `.npmrc` creation step: Explicitly create `.npmrc` with the auth token before publishing, to be safe.
- C) Align with preview workflow: Use the same auth mechanism in both preview and release workflows for consistency.
**Answer**:

### Q8: Test Coverage for Packages with No Tests
**Context**: Several packages have `"test": "echo 'No tests yet'"` as their test script. The CI pipeline runs `pnpm test` across all packages, which will succeed even for untested packages (since `echo` exits 0). The spec's success criteria (SC-001) says "CI passes on all PRs that have no lint/test/build errors" but doesn't address minimum test coverage.
**Question**: Should the spec include a requirement for minimum test presence or coverage thresholds, or is it acceptable that some packages pass CI with zero tests?
**Options**:
- A) Accept zero tests for now: The CI pipeline validates what exists; test coverage is a separate concern tracked outside this spec.
- B) Require at least one test per package: Add a check that ensures no package uses the `echo 'No tests yet'` placeholder.
- C) Add coverage reporting (no threshold): Add vitest coverage output to CI for visibility, but don't enforce a minimum threshold yet.
**Answer**:

### Q9: Concurrency Group for Preview Publish
**Context**: The CI workflow has a concurrency group (`ci-${{ github.ref }}`) that cancels in-progress runs on new pushes. The release workflow has a concurrency group with `cancel-in-progress: false`. However, the preview publish workflow has NO concurrency group at all. If two merges to `develop` happen in quick succession, two preview publish workflows could run simultaneously, potentially causing version conflicts or duplicate publishes.
**Question**: Should the preview publish workflow have a concurrency group, and if so, should it cancel in-progress runs or queue them?
**Options**:
- A) Add concurrency with cancel-in-progress: true: The latest merge wins; older preview publishes are cancelled since they'd be stale anyway.
- B) Add concurrency with cancel-in-progress: false: Queue preview publishes to avoid conflicts, but never cancel a running publish.
- C) No concurrency group needed: Preview publishes from `workflow_run` events are naturally serialized by GitHub Actions, or the risk of conflict is low enough to ignore.
**Answer**:

### Q10: Changesets Action Version Pinning
**Context**: The spec and current workflow reference `changesets/action@v1`, which is a major version tag that auto-updates to the latest v1.x release. A breaking change in a minor/patch release could silently break the release pipeline. The spec does not specify whether to pin to an exact version or use the major version tag.
**Question**: Should the `changesets/action` be pinned to a specific commit SHA or version tag for reproducibility, or is the `@v1` major version tag acceptable?
**Options**:
- A) Use `@v1` major tag (current): Automatically gets bug fixes and improvements. Acceptable risk for a well-maintained action.
- B) Pin to exact SHA: Maximum reproducibility (e.g., `changesets/action@abc123`). Requires manual updates to get improvements.
- C) Pin to minor version: Use `@v1.x.y` for a middle ground between stability and auto-updates.
**Answer**:

### Q11: lint Script is Actually typecheck
**Context**: The spec lists `pnpm lint` as a CI step (FR-001, US1), and the root `package.json` has a `lint` script. However, `lint` in every package is defined as `tsc --noEmit`, which is identical to the `typecheck` script. There is no ESLint, Prettier, or other code quality linting configured. The CI pipeline effectively runs typecheck twice (once in `build` which runs `tsc`, and once in `lint` which runs `tsc --noEmit`).
**Question**: Should the spec acknowledge that "lint" is currently just TypeScript type checking, or should actual linting (ESLint/Biome/etc.) be added as part of this CI/CD spec?
**Options**:
- A) Acknowledge and keep as-is: Document that `lint` = `typecheck` currently. Adding a real linter is a separate task/spec.
- B) Add ESLint/Biome setup to this spec: Expand the scope to include proper linting configuration as part of the CI/CD pipeline work.
- C) Remove the `lint` step from CI: Since it duplicates `typecheck` (which `build` already validates), remove the redundant step to save CI time.
**Answer**:

### Q12: Branch Protection Rules Enforcement
**Context**: US1 acceptance criteria states "PR merge is blocked if any step fails (via branch protection rules)" and the Out of Scope section says "Branch protection rule configuration is managed separately." This creates an implicit dependency — the CI pipeline alone doesn't enforce merge blocking; branch protection rules must also be configured.
**Question**: Should the spec include verification steps to confirm branch protection rules are configured correctly, or is a note in Assumptions sufficient? Who is responsible for configuring branch protection?
**Options**:
- A) Assumptions note is sufficient: Branch protection is a separate concern. The spec just needs CI to report status checks correctly.
- B) Add a verification checklist item: Include a post-implementation step to verify that branch protection rules reference the CI workflow's status check.
**Answer**:
