---
sidebar_position: 2
title: Code Quality and Slop Detection
---

# Code Quality and Slop Detection

DeployMate includes a balanced quality pipeline to catch:

- legacy code drift (dead/unused files, dependency cycles)
- AI-generated "slop code" (duplication, weak structure, untested changes)
- risky patterns (static security findings)

## What Runs in CI

The CI quality job runs these checks in **warn mode** (non-blocking) by default:

1. `knip` for unused files, exports, and dependencies
2. `jscpd` for copy/paste duplication
3. `dependency-cruiser` for circular dependencies
4. `semgrep` for static analysis findings
5. `c8` coverage threshold check

Artifacts are uploaded on each run for triage and baseline cleanup.

## Local Commands

Run quality checks from the repo root:

```bash
pnpm quality:unused
pnpm quality:dup
pnpm quality:deps
pnpm quality:semgrep
pnpm quality:coverage
pnpm quality:all
```

## Thresholds and Ratcheting

Current baseline thresholds:

- coverage: lines/functions/statements >= 70%
- coverage: branches >= 60%
- duplication threshold: 8%
- dependency policy: warn on circular dependencies in `src/**`

Recommended rollout:

1. keep checks non-blocking while fixing noisy/baseline findings
2. make `quality:unused`, `quality:deps`, and `quality:coverage` required
3. ratchet duplication threshold downward over time
4. tighten semgrep severity gates once rule noise is understood

## AI-Generated Code Review Expectations

When code is generated with AI, reviewers should require:

- explicit explanation of what changed and why
- tests for any non-trivial behavior change
- no unexplained `any`/unsafe casts
- no new abstractions without concrete need
- no large opaque PRs that are hard to review

Use the PR template checklist to enforce these expectations consistently.
