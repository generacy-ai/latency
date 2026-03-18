# Data Model: Workflow Verification Phase

## Overview

This feature modifies YAML workflow configuration — there are no application-level data models, entities, or database changes. The "data model" here is the workflow step schema.

## Workflow Step Schema

### Current: `verification.check` step

```yaml
name: string          # Step identifier
uses: verification.check  # Tool reference
with:
  command: string     # Hardcoded shell command (e.g., "pnpm run test")
continueOnError: boolean  # Whether to continue on failure
```

### Target: `build.validate` step

```yaml
name: string          # Step identifier
uses: build.validate  # Tool reference (no `with` block needed)
continueOnError: boolean  # Whether to continue on failure
```

## Relationship

The `build.validate` tool replaces N `verification.check` steps with a single step. It internally discovers and runs all validation scripts, handling the multiplexing that was previously done by listing multiple workflow steps.

```
Before: workflow.yaml → [verification.check(test), verification.check(lint)]
After:  workflow.yaml → [build.validate] → discovers [test, lint, typecheck, ...]
```
