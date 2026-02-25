# Clarification Questions

## Status: Pending

## Questions

### Q1: License Choice
**Context**: The spec recommends Apache 2.0 but lists MIT as an acceptable alternative (FR-001). This decision affects all 17 package.json files and the LICENSE file. The two licenses have materially different implications: Apache 2.0 includes an explicit patent grant and contribution license agreement, while MIT is simpler and more permissive. This choice must be finalized before implementation begins.
**Question**: Which open-source license should be applied to the repository and all packages?
**Options**:
- A) Apache 2.0: Includes explicit patent grant, suitable for frameworks others build upon. More protective but slightly more complex. Widely used by Google, Meta, Apache Foundation projects.
- B) MIT: Simpler, highly permissive, no patent grant. Most popular license on GitHub. Lower friction for downstream consumers but less legal protection for contributors.
**Answer**:

### Q2: Copyright Holder
**Context**: Both Apache 2.0 and MIT licenses require a copyright holder name in the license text (e.g., "Copyright 2026 [Entity Name]"). The spec does not specify whether the copyright holder should be the organization name, a legal entity name, or individual maintainers. This affects the LICENSE file content.
**Question**: What is the exact copyright holder name to use in the LICENSE file?
**Options**:
- A) Generacy AI: Use the organization/company name as-is.
- B) Generacy AI, Inc.: Use a formal legal entity name (if applicable).
- C) The Generacy AI Authors: Use a collective attribution style (common in projects like Go, Kubernetes).
**Answer**:

### Q3: Copyright Year
**Context**: The LICENSE file requires a copyright year. The repository has existing git history, so there is a question about whether to use the year of first commit, the current year, or a range.
**Question**: What copyright year(s) should appear in the LICENSE file?
**Options**:
- A) 2026: Use the current year only (year of public release).
- B) Year range from first commit: Use the range from the repository's first commit year to the current year (e.g., "2025-2026").
**Answer**:

### Q4: Security Contact Email
**Context**: SECURITY.md (FR-006) should provide a private vulnerability reporting channel. The spec recommends GitHub Security Advisories as the primary channel with a fallback email address. The actual email address to use is not specified.
**Question**: What email address should be listed as the fallback security contact in SECURITY.md?
**Options**:
- A) security@generacy.ai: A dedicated security reporting email (if it exists or will be created).
- B) A maintainer's personal email: Use a specific maintainer's email address (please specify).
- C) No email fallback: Only use GitHub Security Advisories, omit the email channel entirely.
**Answer**:

### Q5: CODEOWNERS Team/User References
**Context**: The spec uses `@generacy-ai/core-team` as a placeholder in the CODEOWNERS example but explicitly notes that "Actual GitHub usernames and team names must be confirmed before merging." CODEOWNERS requires valid GitHub usernames or team references to function — invalid references will cause GitHub to silently ignore the rules.
**Question**: What GitHub team names or individual usernames should be used in the CODEOWNERS file?
**Options**:
- A) @generacy-ai/core-team: Use this GitHub team reference (confirm the team exists in the GitHub org).
- B) Individual usernames: List specific GitHub usernames to use as code owners (please provide the list).
- C) Both team and individuals: Use a team for default ownership and specific individuals for certain paths.
**Answer**:

### Q6: Package-Specific Ownership Granularity
**Context**: FR-010 requires mapping package directories to responsible maintainers, and the spec example groups packages by pattern (e.g., `/packages/latency-plugin-*/`). However, if all packages are currently owned by the same team, granular per-package ownership rules add complexity without benefit. The level of ownership granularity should match the actual team structure.
**Question**: Should CODEOWNERS have granular per-package or per-category ownership rules, or is a single default owner sufficient for now?
**Options**:
- A) Single default owner only: Use `* @owner` for everything; add granularity later when the team grows.
- B) Category-based grouping: Group by pattern (plugins, interfaces, core) as shown in the spec example, all pointing to the same team for now.
- C) Full per-package granularity: Define a separate rule for each of the 16 packages with individual owners.
**Answer**:

### Q7: Supported Versions in SECURITY.md
**Context**: FR-005 requires a supported versions table in SECURITY.md. All 16 packages are currently at version 0.1.0, which is pre-1.0 (implying instability and no formal support guarantees). The spec says to "at minimum, indicate whether the current major version is supported" but doesn't address how to handle pre-1.0 software where APIs may change frequently.
**Question**: How should version support be communicated in SECURITY.md for packages that are all at v0.1.0?
**Options**:
- A) Support current minor only: State that only the latest 0.x release is supported for security fixes.
- B) Blanket current-version support: State that the latest release is always supported, without committing to specific version ranges.
- C) Explicitly pre-1.0: Note that the project is pre-1.0 and security fixes will only be applied to the latest release on the main branch.
**Answer**:

### Q8: Response Timeline SLAs
**Context**: FR-007 requires documenting expected response timelines for vulnerability reports. The spec suggests "acknowledgment within 48 hours, fix target within 90 days" but these are placeholders. Committing to specific SLAs in a public document creates expectations that the team must meet. For a small team or early-stage project, aggressive SLAs may be unsustainable.
**Question**: What response timeline commitments should SECURITY.md include?
**Options**:
- A) Standard timelines: Acknowledgment within 48 hours, triage within 7 days, fix target within 90 days.
- B) Relaxed timelines: Acknowledgment within 5 business days, best-effort fix timeline with no hard commitment.
- C) Industry-standard only: Align with the 90-day coordinated disclosure standard (Google Project Zero model) without committing to acknowledgment SLAs.
**Answer**:

### Q9: Secrets Scanner Tool
**Context**: FR-012 recommends `gitleaks` for scanning but also mentions `trufflehog` as an alternative. The choice of tool affects the installation process, output format, and what types of secrets are detected. Additionally, the spec doesn't specify whether to add the scanner configuration to the repository permanently (for ongoing CI use) or treat this as a one-time audit.
**Question**: Which secrets scanning tool should be used, and should its configuration be persisted in the repository?
**Options**:
- A) gitleaks, one-time scan only: Run gitleaks for the audit, don't commit configuration to the repo.
- B) gitleaks, persist config: Run gitleaks and commit a `.gitleaks.toml` config file for future CI integration.
- C) trufflehog: Use trufflehog instead of gitleaks for the audit.
**Answer**:

### Q10: Audit Documentation Location
**Context**: FR-015 requires documenting the audit outcome (tool used, scan date, number of findings, remediation actions). The spec doesn't specify where this documentation should live — it could be a file committed to the repo, added to the PR description, stored in the spec directory, or kept as an internal record only.
**Question**: Where should the secrets audit results be documented?
**Options**:
- A) In the spec directory: Add an `audit-report.md` file to `/specs/036-prepare-repository-public/`.
- B) In the PR description: Document the audit results in the pull request body for this feature.
- C) Committed to repo root: Add a `docs/security-audit.md` or similar file that becomes part of the repository.
- D) Internal record only: Keep the audit results outside the repository (e.g., in a team wiki or issue tracker).
**Answer**:

### Q11: History Rewrite Coordination
**Context**: If secrets are found in the git history, FR-014 requires using `git filter-repo` or BFG Repo Cleaner to remove them, which rewrites git history. The spec notes this is destructive and requires coordination. However, it doesn't specify the approval process — who authorizes a force-push, how contributors are notified, or whether there's a rollback plan.
**Question**: If secrets are found and history rewriting is needed, what is the approval and coordination process?
**Options**:
- A) Implementer discretion: The person running the audit can rewrite history and force-push, then notify the team afterward.
- B) Maintainer approval required: Flag any findings in the PR, get explicit maintainer approval before rewriting history.
- C) Defer remediation: Document findings but defer history rewriting to a separate coordinated effort outside this feature.
**Answer**:

### Q12: Gitleaks False Positive Handling
**Context**: Secrets scanners frequently produce false positives (e.g., high-entropy strings in test fixtures, example tokens in documentation, hash values). The spec says to "classify as true positive or false positive" but doesn't specify how to handle false positives — whether to add inline ignore comments, create an allowlist configuration, or simply note them in the audit report.
**Question**: How should false positive findings from the secrets scan be handled?
**Options**:
- A) Allowlist in config: Create a `.gitleaks.toml` (or equivalent) allowlist file committed to the repo to suppress known false positives in future scans.
- B) Document only: Note false positives in the audit report but don't add suppression configuration.
- C) Inline annotations: Add gitleaks ignore comments in the source files where false positives occur.
**Answer**:
