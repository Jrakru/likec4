# Branching & Walkthrough Performance Validation

This document captures internal guidance for validating the performance characteristics of the branching / walkthrough experience in this fork, with minimal surface-area impact and without changing core runtime behavior.

It is intended as:
- A checklist of expectations for large models.
- A reference for how to run lightweight, repeatable validations.
- A pointer to existing tests and tooling that guard against obvious regressions.

## Objectives

We want to validate that the walkthrough and branching features:

- Walkthrough child actor lifecycle:
  - Scales as O(#views + #walkthroughConfigs) for typical usage.
  - Does _not_ degrade toward O(#nodes²) behavior when models grow.
  - Spawns at most one walkthrough child actor per active diagram when enabled and configured.

- Branching overlays / layouts:
  - Behave approximately linearly in the number of edges/paths in typical scenarios.
  - Do not introduce combinatorial blow-ups for standard branching/walkthrough patterns.

- Feature gating:
  - When `enableDynamicViewWalkthrough` is disabled (default or explicit):
    - No walkthrough-specific actors are created.
    - No expensive walkthrough-specific computations run.
    - Walkthrough-related events are safely treated as no-ops.

These expectations are enforced via:
- Focused unit-style smoke tests in the diagram state machine compat suite.
- Manual / CI guidance for executing existing suites on large models.
- No additional heavy observability framework or runtime dependency.

## Scenarios to Validate (conceptual)

These scenarios describe how to reason about performance; they are not full benchmarks.

### 1. Large static model

Scenario:
- Large number of nodes/edges in a static view.
- No dynamic walkthrough configuration.
- `enableDynamicViewWalkthrough` flag left at default (off).

Expectations:
- No walkthrough input construction.
- No walkthrough child actor spawned.
- Walkthrough events (if any) are treated as safe no-ops.
- Runtime cost matches pre-walkthrough behavior aside from negligible feature-check branches.

### 2. Large dynamic model with no walkthrough config

Scenario:
- Dynamic view with many nodes/edges/steps, but without a walkthrough configuration that should trigger the feature.
- `enableDynamicViewWalkthrough` is off or not set.

Expectations:
- Any `buildWalkthroughInput`-like logic is skipped or quickly returns `undefined` when gating conditions are not met.
- No walkthrough child actor is spawned.
- `xyflow.init` + `update.view` behave like legacy behavior, with no extra per-step overhead beyond existing logic.

### 3. Large dynamic model with walkthrough enabled

Scenario:
- Dynamic view with a large but reasonable number of step edges (e.g. hundreds).
- `enableDynamicViewWalkthrough = true`.
- Proper initialization via:
  - `xyflow.init`
  - `update.view` with nodes and step edges.

Expectations:
- The diagram machine transitions cleanly to the `ready` state.
- At most one walkthrough child actor is associated with the active diagram.
- Walkthrough events:
  - `walkthrough.start`
  - `walkthrough.step`
  - `walkthrough.end`
  behave correctly for many steps and branches.
- No indication of quadratic or combinatorial behavior:
  - Internal updates should scale roughly with `O(#steps + #branches)`.

The compat tests:
- Provide a "large-ish" smoke-test scenario with many step edges.
- Assert readiness, correct gating, safe walkthrough event handling, and absence of observable explosions in actor spawning or state handling.
- Intentionally avoid direct timing assertions to keep tests deterministic and fast.

## Manual / CI Guidance

For day-to-day confidence and regression checks, use the existing test suites:

Recommended commands:

- Diagram-focused tests:
  - `pnpm test --filter diagram --reporter=basic`

- Layout and branching behavior tests:
  - `pnpm test --filter layouts --reporter=basic`

These already cover:
- Diagram state machine behavior.
- Layout and branching overlay logic.
- General correctness around dynamic/sequence views.

### Local Profiling / Large Model Validation

For deeper, manual inspection with large models:

- Use existing playground or harness routes in this repository.
- Load large static and dynamic models:
  - With and without `enableDynamicViewWalkthrough`.
  - With varied branching/walkthrough configurations.
- Observe:
  - Initial render responsiveness.
  - Interactions (navigation, zoom/pan, walkthrough steps) for jank or stalls.
  - That toggling walkthrough flags/configs does not introduce unexpected work when disabled.

Notes:

- No additional runtime instrumentation is required by default.
- If needed, lightweight ad-hoc profiling can be added locally (e.g., browser devtools performance traces) without changing shipped APIs.
- This fork’s tests and this document together serve as the minimal, code-only observability and validation layer requested for large-model scenarios.