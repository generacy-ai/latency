# Feature Specification: Prepare Repository for Public Visibility

Add the required code artifacts and perform pre-publication audits before making the latency repo public.

**Branch**: `036-prepare-repository-public` | **Date**: 2026-02-25 | **Status**: Draft

## Summary

The `latency` repository (`generacy-ai/latency`) is a pnpm monorepo containing 16 packages under the `@generacy-ai/` namespace — a plugin-based latency monitoring and performance tracking framework for the Tetrad ecosystem. The repository currently has **no** public-facing governance files: no LICENSE, no SECURITY.md, no CODEOWNERS, no README.md at the root, no CONTRIBUTING.md, and no CODE_OF_CONDUCT.md.

This feature adds the minimum required artifacts for responsible open-source publication:

1. **LICENSE** — an open-source license file at repo root
2. **SECURITY.md** — vulnerability disclosure policy
3. **.github/CODEOWNERS** — automated PR review routing
4. **Git history audit** — scan and remediate any leaked secrets across all commits

GitHub repository settings (branch protection, interaction limits, Actions permissions) are handled separately and are **not** in scope.

## User Stories

### US1: Open-Source Consumer Identifies License Terms

**As a** developer evaluating `@generacy-ai/latency` for use in my project,
**I want** a clearly defined open-source license in the repository root,
**So that** I can determine whether the library is compatible with my project's licensing requirements.

**Acceptance Criteria**:
- [ ] A `LICENSE` file exists at the repository root
- [ ] The license is a widely recognized OSI-approved license (e.g., MIT, Apache 2.0)
- [ ] The license text is the canonical, unmodified version from the license authority
- [ ] The `license` field in the root `package.json` matches the chosen license SPDX identifier
- [ ] Each package's `package.json` includes the matching `license` field

### US2: Security Researcher Reports a Vulnerability

**As a** security researcher who discovers a vulnerability in the latency framework,
**I want** a published security policy with clear reporting instructions,
**So that** I can responsibly disclose the issue through the correct channel.

**Acceptance Criteria**:
- [ ] A `SECURITY.md` file exists at the repository root
- [ ] The file specifies which versions are currently supported
- [ ] The file provides a private reporting channel (email or GitHub Security Advisories)
- [ ] The file sets expectations for response timelines
- [ ] The file describes the disclosure process (acknowledgment, fix, public disclosure)

### US3: Contributor Submits a Pull Request with Correct Reviewers

**As a** contributor submitting a pull request,
**I want** the correct code owners to be automatically assigned as reviewers,
**So that** my PR is reviewed by the people most familiar with the affected code.

**Acceptance Criteria**:
- [ ] A `.github/CODEOWNERS` file exists
- [ ] The file defines a default owner for the entire repository (`*`)
- [ ] The file maps package directories (`/packages/*`) to responsible maintainers
- [ ] The file maps infrastructure paths (root config files, `.github/`) to responsible maintainers
- [ ] The file uses valid GitHub usernames or team references

### US4: Maintainer Confirms No Secrets in Git History

**As a** repository maintainer preparing for public release,
**I want** the full git history audited for accidentally committed secrets,
**So that** no credentials, API keys, or sensitive data are exposed when the repository becomes public.

**Acceptance Criteria**:
- [ ] A secrets scanning tool has been run against the full git history (all branches)
- [ ] The scan report shows zero high-confidence secret findings, or all findings have been remediated
- [ ] Any remediated commits have been verified to no longer contain the secret
- [ ] The audit results are documented (scan tool used, date, outcome)

## Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Add a `LICENSE` file to the repository root with an OSI-approved license | P1 | Recommend Apache 2.0 for patent grant protection suitable for frameworks; MIT is also acceptable |
| FR-002 | Set the `license` field in root `package.json` to the chosen SPDX identifier | P1 | e.g., `"Apache-2.0"` or `"MIT"` |
| FR-003 | Set the `license` field in each package's `package.json` to match | P1 | All 16 packages under `packages/` |
| FR-004 | Add a `SECURITY.md` file to the repository root | P1 | Follow GitHub's recommended format for security policies |
| FR-005 | Define supported versions table in SECURITY.md | P2 | At minimum, indicate whether the current major version is supported |
| FR-006 | Provide a private vulnerability reporting channel in SECURITY.md | P1 | Prefer GitHub Security Advisories; include fallback email |
| FR-007 | Document expected response timeline in SECURITY.md | P2 | e.g., acknowledgment within 48 hours, fix target within 90 days |
| FR-008 | Create `.github/` directory if it does not exist | P1 | Required for CODEOWNERS placement |
| FR-009 | Add `.github/CODEOWNERS` with default ownership rule (`*`) | P1 | Assigns a default reviewer for all PRs |
| FR-010 | Add package-level ownership rules in CODEOWNERS | P2 | Map `/packages/<name>/` paths to responsible maintainers or teams |
| FR-011 | Add infrastructure ownership rules in CODEOWNERS | P2 | Cover root config files, `.github/`, `specs/` |
| FR-012 | Run a secrets scanner against the full git history | P1 | Use `gitleaks`, `trufflehog`, or equivalent |
| FR-013 | Scan all branches, not just the default branch | P1 | Secrets may exist on feature branches |
| FR-014 | Remediate any confirmed secret findings | P1 | Use `git filter-repo` or BFG Repo Cleaner; rotate any exposed credentials |
| FR-015 | Document the audit outcome | P2 | Record tool used, scan date, number of findings, remediation actions |

## Technical Design

### LICENSE File

Place at repo root: `LICENSE`

**Recommended license: Apache 2.0**
- Provides an explicit patent grant, which is important for a framework that others build upon
- Widely adopted for similar projects (e.g., many Google, Meta, and Apache Foundation projects)
- Compatible with MIT-licensed downstream consumers
- If simplicity is preferred over patent protection, MIT is a valid alternative

Update `package.json` files:
- Root: add `"license": "Apache-2.0"`
- Each of the 16 packages: add or update `"license": "Apache-2.0"`

### SECURITY.md

Place at repo root: `SECURITY.md`

Structure:
1. **Supported Versions** — table of version ranges and support status
2. **Reporting a Vulnerability** — instructions to use GitHub Security Advisories (preferred) or email
3. **Response Process** — acknowledgment SLA, triage, fix, coordinated disclosure
4. **Scope** — what constitutes a valid security report for this project

### .github/CODEOWNERS

Place at: `.github/CODEOWNERS`

Suggested structure:
```
# Default owner for everything
* @generacy-ai/core-team

# Package-specific ownership (adjust teams/users as needed)
/packages/latency/                    @generacy-ai/core-team
/packages/latency-plugin-*/           @generacy-ai/core-team
/packages/*-interface/                @generacy-ai/core-team

# Infrastructure and CI
/.github/                             @generacy-ai/core-team
/package.json                         @generacy-ai/core-team
/pnpm-workspace.yaml                  @generacy-ai/core-team
/tsconfig.base.json                   @generacy-ai/core-team
```

Actual GitHub usernames and team names must be confirmed before merging.

### Git History Audit

**Tool**: `gitleaks` (recommended — actively maintained, supports custom rules, CI-friendly)

**Process**:
1. Install gitleaks
2. Run: `gitleaks detect --source . --verbose --report-path gitleaks-report.json`
3. Review findings — classify as true positive or false positive
4. For true positives:
   - Rotate the exposed credential immediately
   - Use `git filter-repo` to remove the secret from history
   - Force-push the cleaned history (coordinate with all contributors)
5. Re-run scan to confirm clean history
6. Document the audit results

**Note**: History rewriting (step 4) is destructive and must be coordinated. If the repo has not yet been shared publicly, the risk is lower, but all local clones will need to be re-cloned after a force-push.

## Success Criteria

| ID | Metric | Target | Measurement |
|----|--------|--------|-------------|
| SC-001 | LICENSE file present at repo root | File exists and contains valid license text | `test -f LICENSE` |
| SC-002 | License field consistency | All 17 package.json files (root + 16 packages) have matching `license` field | Script check across all package.json files |
| SC-003 | SECURITY.md present at repo root | File exists with reporting instructions | `test -f SECURITY.md` |
| SC-004 | CODEOWNERS present and valid | File exists and GitHub parses it without errors | GitHub UI shows "Code owners" on PR files tab |
| SC-005 | Secrets scan clean | Zero unresolved high-confidence findings | gitleaks exit code 0 on full history scan |
| SC-006 | All branches scanned | Scan covers all remote branches | gitleaks `--all` flag or equivalent |

## Assumptions

- The repository has not yet been made public; there is still time to rewrite history if secrets are found without impacting external consumers.
- The `@generacy-ai` GitHub organization exists and has team definitions that can be referenced in CODEOWNERS.
- The license choice (Apache 2.0 vs MIT) will be confirmed by the project maintainer before implementation.
- All 16 packages should share the same license as the root repository.
- GitHub Security Advisories are enabled (or can be enabled) on the `generacy-ai/latency` repository for private vulnerability reporting.
- Contributors with local clones will be notified if git history is rewritten, so they can re-clone.

## Out of Scope

- **GitHub repository settings** — branch protection rules, PR restrictions, interaction limits, and Actions permissions are handled in a separate interactive session.
- **README.md** — while important for public repos, authoring a comprehensive README is a separate effort.
- **CONTRIBUTING.md** — contribution guidelines will be addressed separately.
- **CODE_OF_CONDUCT.md** — community standards document is a separate effort.
- **CI/CD workflows** — adding or modifying `.github/workflows/` is not part of this feature.
- **npm publish configuration** — package registry settings, access levels, and publish workflows are separate.
- **Dependency audit** — auditing third-party dependencies for vulnerabilities (e.g., `pnpm audit`) is a valuable but separate task.
- **GitHub Actions secrets rotation** — if secrets are found in history, rotating CI/CD secrets is a follow-up operational task.

---

*Generated by speckit*
