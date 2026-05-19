---
"@generacy-ai/latency": patch
---

Publish to the `stable` npm dist-tag. No code changes — this changeset exists to force a version+publish cycle so a `stable` dist-tag is created on npm (the orchestrator entrypoint installs `@generacy-ai/*@stable`, but `stable` was never populated for any package — only `latest`).
