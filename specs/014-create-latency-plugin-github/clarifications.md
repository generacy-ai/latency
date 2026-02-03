# Clarifications

Questions and answers to clarify the feature specification.

## Batch 1 - 2026-02-03 21:23

### Q1: Missing abstract methods
**Context**: AbstractCICDPlugin requires implementing doGetStatus, doCancel, and doListPipelines in addition to doTrigger, but the spec only shows doTrigger. The plugin won't compile without all four.
**Question**: Should all four abstract methods (doTrigger, doGetStatus, doCancel, doListPipelines) be implemented using the Octokit API, or are some intentionally deferred?
**Options**:
- A: Implement all four using Octokit (doGetStatus via get workflow run, doCancel via cancel workflow run, doListPipelines via list workflows)
- B: Implement doTrigger and doGetStatus only, with doCancel and doListPipelines throwing 'not implemented' errors

**Answer**: *Pending*

### Q2: Package directory naming
**Context**: Existing packages use patterns like packages/plugin-ci-cd/ and packages/latency-plugin-source-control/. The spec references two new packages but doesn't specify their directory names.
**Question**: What directory names should be used under packages/? Options based on existing conventions:
**Options**:
- A: packages/plugin-github-actions/ and packages/github-actions-interface/ (short names like plugin-ci-cd)
- B: packages/latency-plugin-github-actions/ and packages/github-actions-interface/ (long names like latency-plugin-source-control)

**Answer**: *Pending*

### Q3: TriggerOptions field mapping
**Context**: The core TriggerOptions type uses 'branch' and 'parameters' fields, but the spec's doTrigger uses 'options?.ref' and 'options?.inputs' which don't match the interface. GitHub's API uses 'ref' and 'inputs' natively.
**Question**: Should doTrigger map TriggerOptions.branch to GitHub's ref and TriggerOptions.parameters to inputs, or should the plugin use a custom config type that matches GitHub's API directly?
**Options**:
- A: Map standard TriggerOptions fields (branch→ref, parameters→inputs) to maintain interface consistency
- B: Create a GitHubTriggerOptions extending TriggerOptions with ref/inputs fields

**Answer**: *Pending*

### Q4: Undefined interface types
**Context**: The spec references GitHubWorkflowTrigger, GitHubStep, and GitHubArtifact types but doesn't define their fields. These are needed for the interface package to compile.
**Question**: Should these types mirror the GitHub Actions API response shapes, or be simplified abstractions? Key decision is how much GitHub API surface to expose.
**Options**:
- A: Mirror GitHub API shapes closely (WorkflowTrigger with event types, Step with status/conclusion/number, Artifact with size/archive_download_url)
- B: Simplified abstractions (WorkflowTrigger as string union, Step with name/status/conclusion only, Artifact with id/name/size)

**Answer**: *Pending*

### Q5: Run retrieval after dispatch
**Context**: The spec's doTrigger calls createWorkflowDispatch which returns void (HTTP 204), not the created run. Retrieving the actual run requires polling the workflow runs list to find the new run, which is non-trivial and race-prone.
**Question**: How should doTrigger return the PipelineRun after dispatching? This is a known challenge with the GitHub API.
**Options**:
- A: Poll listWorkflowRuns after dispatch, match by headSha/timestamp (may be delayed up to 30s)
- B: Return a synthetic PipelineRun with status 'pending' and a generated ID, let consumers call getPipelineStatus to get the real run later

**Answer**: *Pending*

