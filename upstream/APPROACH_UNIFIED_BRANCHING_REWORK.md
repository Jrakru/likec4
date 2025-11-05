# LikeC4 Unified Branching (Reworked Implementation Plan)

**Document Type**: Technical Decision Update  
**Status**: Draft for Stakeholder Review  
**Date**: 2025-01-24  
**Decision Scope**: Dynamic view branching (parallel + alternate) and walkthrough UX

---

## 1. Context & Motivation

Our original comparison (Approach B) established clear long-term value for a unified branching model.
While reviewing the codebase we surfaced several weaknesses that the prior plan did not fully absorb:

- Core helpers (`flattenSteps`, dynamic compute loop) cannot ingest heterogeneous branch payloads without structural refactors.
- Sequence layout, walkthrough state, and diagram UI deeply depend on the current `parallelPrefix` semantics.
- Types, formatting, and validation only understand parallel blocks; alternate blocks would be invisible to tooling unless the AST layer is extended in lockstep.
- Step IDs and prefixes assume a two-level `step-NN(.MM)` scheme; richer branching requires a hierarchical identifier strategy.

This reworked plan keeps the unified direction but expands scope and deliverables so that branching data, layout, navigation, and tooling are upgraded consistently.

---

## 2. Goals and Non-Goals

### Goals
- Introduce a shared branching abstraction that powers both `parallel` and `alternate`.
- Preserve backward compatibility for anonymous `parallel` syntax while enabling optional named paths and structured metadata.
- Deliver a walkthrough experience that supports:
  - Linear next/previous navigation across the entire flow.
  - Jumping back to the current decision point (parallel or alternate).
  - Stepping through individual branches before continuing the main storyline.
- Provide parity-level improvements inspired by Icepanel (scenario storytelling, branch metadata, richer step context).
- Maintain a high-confidence review path through incremental PRs with thorough tests.

### Non-Goals
- Rewriting the manual layout system beyond necessary adjustments for new branch metadata.
- Shipping a full-blown timeline/story editor in this iteration (documented as follow-up opportunities).

---

## 3. Branch Data Model Enhancements

### 3.1 Branch Collections & Paths
- Introduce `DynamicBranchCollection` type representing a decision point:
  ```ts
  interface DynamicBranchCollection<A extends AnyAux> {
    readonly branchId: string;
    readonly kind: 'parallel' | 'alternate';
    readonly label?: string;
    readonly defaultPathId?: string;
    readonly paths: NonEmptyReadonlyArray<DynamicBranchPath<A>>;
  }
  ```
- `DynamicBranchPath` (shared) to hold path metadata:
  ```ts
  interface DynamicBranchPath<A extends AnyAux> {
    readonly pathId: string;
    readonly pathName?: string;
    readonly pathTitle?: string;
    readonly description?: MarkdownOrString;
    readonly tags?: aux.Tags<A>;
    readonly steps: NonEmptyReadonlyArray<DynamicStep<A> | DynamicStepsSeries<A> | DynamicBranchCollection<A>>;
  }
  ```
- Allow nested branch collections inside paths (enables decisions within a branch without grammar hacks).

### 3.2 Step Identifiers
- Replace `stepEdgeId(step, parallelStep)` with a hierarchical ID builder:
  ```ts
  type StepEdgeIdLiteral = `step-${string}`;
  function stepEdgePath(indices: readonly number[]): StepEdgeId;
  ```
  Example: `["1"] -> step-01`, `["3","2"] -> step-03.02`, `["4","1","b"] -> step-04.01b`.
- Persist branch ancestry on the computed edge for quick lookups:
  ```ts
  interface ComputedEdge {
    ...
    branchTrail?: readonly {
      branchId: string;
      pathId: string;
      indexWithinPath: number;
    }[];
  }
  ```

### 3.3 Parser & Grammar
- Extend grammar with reusable `DynamicViewBranchCollection` production:
  ```langium
  DynamicViewBranchCollection:
    kind=('parallel' | 'par' | 'alternate' | 'alt') '{'
      (paths+=DynamicViewBranchPath | steps+=DynamicViewStep)+
    '}';

  DynamicViewBranchPath:
    'path' name=ID? title=String? metadata=BranchMetadataBlock?
    '{' steps+=DynamicViewStep+ '}';
  ```
- `BranchMetadataBlock` optional to capture `description`, `default`, `probability`, `tags`.
- Parser emits:
  - Anonymous `parallel` block => converts to collection with synthetic path IDs.
  - Explicit `path` items => named entries.
  - `default` keyword marks canonical path (used for navigation and auto-selection).

### 3.4 Backward Compatibility
- When encountering legacy `parallel` blocks:
  - Wrap in collection `kind:'parallel'`.
  - Generate `path-${index}` IDs; set `pathTitle` from first step title if defined.
  - `defaultPathId` stays `undefined` unless user marks one explicitly.
- Support shorthand `alternate { { steps } { steps } }` by generating anonymous paths.

---

## 4. Compute & Utilities Refactor

### 4.1 Flattening & Actor Discovery
- Rewrite `flattenSteps` to traverse the new tree:
  - Accept `DynamicBranchCollection`.
  - Build actor lists per path; union them while preserving original order for consistent sequence columns.
- Provide dedicated helpers:
  - `collectBranchCollections(viewSteps)` returning flat array for UI.
  - `forEachStep(viewSteps, callbacks)` to abstract recursion.

### 4.2 Step Numbering
- Maintain a stack of indices while walking steps; push/pop on branch entry/exit.
- When iterating a branch, step numbering should advance per path but share the parent index for grouping:
  ```
  step-03   // decision point
  ├─ step-03.01 (path A)
  ├─ step-03.02 (path B)
  └─ ...
  ```
- Provide helper `getBranchPrefix(stepId)` returning `step-03.` for UI highlighters.

### 4.3 Computed View Output
- Include branch metadata on edges (`branchTrail`, `branchRootId`).
- Emit derived `branchCollections` array in the computed view to power UI without recomputation.
- Update layout preparation to carry branch context for sequence rendering.

---

## 5. Layout & Diagram Updates

### 5.1 Sequence Layout
- Extend `LayoutedDynamicView.Sequence.ParallelArea` into `SequenceBranchArea` with:
  - `branchId`, `pathIds`, `kind`, `title`, `color`.
- Compute bounding boxes per path in a branch (not only aggregate area).
- Render alternate boxes with differentiated styling (e.g., blue vs orange) and label default path.

### 5.2 XYFlow Nodes & Edges
- Introduce new node type `seq-branch-path` to overlay branch consoles in sequence mode.
- Update existing `seq-parallel` nodes to reuse new structure (or replace entirely).
- Ensure nodes share branch metadata for hover/selection events.

### 5.3 Main Diagram View
- For diagram variant, overlay badges on edges belonging to alternate branches (for quick recognition).
- Enable branch filter chips (show/hide paths) using the computed `branchCollections`.

---

## 6. Walkthrough & Navigation Experience

### 6.1 Unified BranchContext
```ts
interface BranchContext {
  branchId: string;
  kind: 'parallel' | 'alternate';
  pathIndex: number;
  pathId: string;
  pathCount: number;
  default: boolean;
}

type ActiveWalkthrough =
  | { type: 'linear'; stepId: StepEdgeId }
  | { type: 'branch'; stepId: StepEdgeId; context: BranchContext }
```

### 6.2 Navigation Controls
- **Next / Previous**: traverse linearised order; when entering a branch, default path plays first unless user chooses otherwise.
- **Jump to Decision Point**: new control that rewinds to the edge representing the branch root (the step immediately before the branch collection). Implement by inspecting `branchTrail` and raising `walkthrough.jumpToBranch`.
- **Branch Selection**: upon reaching a branch, present path selector (dropdown or keyboard shortcuts). For parallel:
  - Option 1: auto-iterate each path sequentially.
  - Option 2: allow “view all branches” toggled view (highlight all edges simultaneously) while still stepping through notes.
- **Alternate History**: after completing a branch, show CTA to revisit other paths without losing global progress; maintain a branch completion set to avoid re-running default path unintentionally.
- **Backtracking**: `walkthrough.step(previous)` respects branch boundaries; when leaving non-selected path, place user at branch root so they can pick another path quickly.

### 6.3 Progress Indicators
- Display breadcrumb of branch ancestry (`Decision » Path`).
- Provide counters: `Path 2 of 4`, `Step 5 of 9`.
- Persist walkthrough state in URL hash for shareable deep links.

---

## 7. Quality-of-Life Enhancements & Icepanel Parity

### 7.1 Metadata & Storytelling
- Allow optional branch-level fields:
  - `guard`: textual condition (e.g., “if payment fails”).
  - `confidence` / `probability`: numeric to visualize likelihood.
  - `owner`: person/team responsible (mirroring Icepanel responsibilities).
- Expose step-level `evidence` or `references` (link to docs or incidents).

### 7.2 View Toggles & Scenario Modes
- Introduce “scenario filters” to quickly enable/disable non-default paths.
- Add ability to export a particular branch path as a dedicated view (auto-generated) for stakeholders needing a simplified story.
- Provide compare mode (side-by-side diff of branches) inspired by Icepanel’s scenario compare.

### 7.3 Collaboration Hooks
- Extend walkthrough events so the web app can emit analytics (“user watched branch X”).
- Add optional comment markers on branch nodes for review discussions.

### 7.4 Accessibility & Keyboard Support
- Keyboard shortcuts for branch switching (`Shift+[`/`]`).
- Screen-reader friendly labels on branch controls with ARIA attributes.

### 7.5 Testing & Tooling Upgrades
- Grammar + formatter golden tests for new syntax.
- Regression tests for compute output when mixing nested branches.
- Screenshot-based tests for sequence branch areas (via Playwright/Storybook).
- State machine unit tests capturing new events `walkthrough.jumpToBranch`, `walkthrough.selectPath`.

---

## 8. Additional Opportunities (Post-MVP)

- **Timeline overlay**: base on step timestamps or SLOs.
- **Branch analytics**: display adoption rates once telemetry is available.
- **Conditional styling**: color paths based on probability or status.
- **Automatic branch simulation**: ability to auto-play the default storyline for demos.

---

## 9. Incremental Delivery Plan (High-Acceptance PR Series)

1. **Foundational Types & Parser**
   - Introduce shared `DynamicBranchCollection`/`DynamicBranchPath`.
   - Update grammar, parser, and type guards.
   - Backward-compat conversions for legacy parallel syntax.
   - Include exhaustive unit tests (parser snapshots, type-level).

2. **Compute & ID Refactor**
   - Replace step ID generator, extend flatten utilities.
  - Update dynamic compute to emit branch metadata and maintain compatibility.
  - Adjust existing tests, add fixtures covering nested branches.

3. **Sequence Layout & Layouted View Changes**
  - Extend layout types to output branch areas.
  - Update layout algorithms and XYFlow conversion (no UI tweaks yet).
  - Add visual regression tests (CI screenshot baseline).

4. **Walkthrough State Machine & Hooks**
  - Implement unified `BranchContext` and new navigation events.
  - Add controls for next/previous/jump-to-decision in the navigation panel.
  - Ensure keyboard support and telemetry hooks.

5. **UI Polish & Metadata Surfacing**
  - Build branch selector UI (diagram + sequence).
  - Render branch metadata (guard, probability, tags) in walkthrough notes.
  - Implement scenario filters and branch breadcrumbs.

6. **Documentation & Migration Guides**
  - Update docs with new syntax examples, storytelling workflows, and Icepanel parity notes.
  - Provide migration cheat sheet and “how to adopt named paths”.

7. **Quality Gate & Telemetry (Optional, Fast-Follow)**
  - Add feature flag + analytics.
  - Capture early adopter feedback before defaulting on mainline.

Each PR is reviewable in isolation, includes tests, and keeps the feature behind a CLI flag or configuration toggle until the full stack is ready. This sequencing maximizes acceptance likelihood by avoiding mega-PRs and providing clear rollback points.

---

## 10. Risks & Mitigations (Updated)

| Risk | Mitigation |
|------|------------|
| Incomplete branch traversal coverage | Dedicated traversal utilities + exhaustive unit tests on mixed depth fixtures. |
| Layout regressions | Playwright/Chromatic baselines per PR, fallback flag to disable new branch overlays. |
| Walkthrough UX overwhelm | Feature flag + UX review prototypes before roll-out. |
| Tooling drift (formatter/intellisense) | Add formatter spec updates alongside parser change, ensure VS Code tmLanguage extends keywords. |
| Documentation lag | Ship docs PR immediately after UI polish to keep stakeholders aligned. |

---

## 11. Implementation Progress

### ✅ PR01 - Foundational Types & Parser (Completed)
**Status**: Merged to upstream as [PR #2333](https://github.com/likec4/likec4/pull/2333)

**Delivered**:
- Added `DynamicBranchCollection` type with `parallel` and `alternate` kinds
- Implemented hierarchical step ID support via `stepEdgePath()`
- Added feature flag system (`dynamicBranchCollections` / `LIKEC4_UNIFIED_BRANCHES`)
- Parser improvements: `getBranchKind()` and `parseValidSteps()` helpers
- Enhanced type safety: removed unsafe casts, added proper type guards
- Comprehensive test coverage with 687 passing tests

**Key Changes**:
- `packages/core/src/types/view-parsed.dynamic.ts` - Core type definitions
- `packages/core/src/types/scalar.ts` - Hierarchical step IDs
- `packages/core/src/config/featureFlags.ts` - Feature flag system
- `packages/language-server/src/model/parser/ViewsParser.ts` - Parser refactoring

### ✅ PR02 - Compute Layer Branch Awareness (Completed)
**Status**: Merged to upstream as [PR #2332](https://github.com/likec4/likec4/pull/2332)

**Delivered**:
- Dual-mode compute: `processBranchAwareSteps()` (new) + `processLegacySteps()` (backward compat)
- Branch metadata tracking: `ComputedBranchTrailEntry`, `ComputedBranchCollectionPath`, `ComputedBranchCollection`
- Branch stack management for nested decision points
- Actor discovery across branch collections
- Fixed series step indexing bug and unnecessary recursion in `flattenSteps()`

**Key Changes**:
- `packages/core/src/types/view-computed.ts` - Branch metadata types
- `packages/core/src/compute-view/dynamic-view/compute.ts` - Compute engine
- `packages/core/src/compute-view/dynamic-view/utils.ts` - Traversal utilities

### ✅ PR03 - Sequence Layout & Layouted View Branch Awareness (Completed)
**Status**: Ready for upstream submission

**Delivered**:
- Extended layout types with branch metadata (`branchId`, `pathId`, `pathIndex`, `kind`, `isDefaultPath`)
- Updated `SequenceViewLayouter` to process branch collections
- Enhanced `findParallelRects()` to extract branch metadata from `branchTrail`
- Constraint-based layout for branch path rectangles (Kiwi solver)
- UI state management: branch trail tracking in diagram machine
- Comprehensive test coverage (+154 test lines across layout and diagram packages)
- **Total**: 18 files changed, +656 insertions, -89 deletions

**Key Changes**:
- `packages/core/src/types/view-layouted.ts` - Layouted view types
- `packages/layouts/src/sequence/` - Layout engine (5 files)
- `packages/diagram/src/likec4diagram/xyflow-sequence/` - XY conversion (6 files)
- `packages/diagram/src/likec4diagram/state/` - State management (3 files)
- `packages/diagram/src/likec4diagram/custom/nodes/SequenceActorNode.tsx` - Actor rendering

**Test Coverage**:
- Unit tests for `findParallelRects()` with branch collections
- Branch metadata extraction verification
- Parallel rectangle generation for branch paths
- Backward compatibility with legacy parallel syntax

**Deferred**:
- Visual regression baselines (Playwright/Storybook) - postponed to PR05 (UI polish)

---

## 12. Next Steps
- **Immediate**: Submit PR03 to upstream (likec4/likec4)
- **PR04**: Walkthrough state machine with branch path selection
  - Implement unified `BranchContext` and new navigation events
  - Add controls for next/previous/jump-to-decision
  - Keyboard support and telemetry hooks
- **PR05**: UI polish & metadata surfacing
  - Branch selector UI (diagram + sequence)
  - Render branch metadata (guard, probability, tags)
  - Scenario filters and branch breadcrumbs
  - Visual regression baseline establishment
- **PR06**: Documentation & migration guides
- **PR07**: Quality gate & telemetry (optional fast-follow)
- **UX Review**: Schedule design review for branch overlays before PR05

This reworked plan preserves the strategic benefits of unified branching while explicitly covering the deeper refactors and UX expectations necessary for success. It positions LikeC4 to close parity gaps with Icepanel and deliver a robust storytelling experience for complex dynamic views.

---

## 12. Historical Document Compatibility Analysis

Ensuring that existing LikeC4 projects continue to render and behave exactly as today is a hard requirement. Below is a subsystem-by-subsystem analysis of how the unified branching implementation protects legacy documents and what guardrails we need in place before rollout.

### 12.1 Grammar & Parser

- **Legacy Parallel Grammar** (`parallel { step... }`) remains unchanged; the new `DynamicViewBranchCollection` production is additive.
- During parsing we detect the absence of explicit `path` clauses and synthesize a single shared collection whose paths map one-to-one with the original step list. This guarantees that the AST shape produced for downstream consumers is new, but the observable behaviour of old documents (step order, branch counts) stays identical.
- Validation, formatter, and tmLanguage updates are additive; existing tokens remain valid. Formatter specs must include fixtures for pure legacy syntax to confirm no diff churn.

### 12.2 Type System & Derived Structures

- `DynamicViewStep` stays as a tagged union but now admits `DynamicBranchCollection`. Conversion helpers provide adapters so older consumers (e.g., `isDynamicStepsParallel`) can still recognise the legacy form: if a branch collection originated from anonymous parallel syntax we set `kind:'parallel'` and mark each path with `path.isAnonymous = true`.
- Downstream callers that expect `DynamicStepsParallel.__parallel` arrays (e.g., plug-ins or scripts) need a compatibility shim. We will export a helper `toLegacyParallel(step)` that unwraps the first-level anonymous collection for compatibility CLI users.

### 12.3 Step IDs & Manual Layout

- For sequences without branches the ID generator emits exactly the previous format (`step-01`, `step-02`, …).
- For anonymous parallel blocks we continue to emit `step-03.01`, `step-03.02`, etc. using numeric suffixes. Even with hierarchical ID support we preserve the old ordering so that existing manual layout payloads (`ViewManualLayout.edges`) still align; see `packages/layouts/src/manual/applyManualLayout.ts` which indexes by `edge.id`.
- Regression check: load historical manual layout test fixtures (e.g., `packages/language-server/src/view-utils/manual-layout.spec.ts`) alongside real project fixtures, run compute before/after, and assert equality of sorted edge IDs.
- If a project mixes manual layout with nested branches (currently impossible), we ensure the migration keeps root-level IDs identical and only appends deterministic suffixes for new deeper levels.

### 12.4 Dynamic Compute & Actor Ordering

- Legacy documents rely on the current actor ordering heuristics in `elementsFromSteps` and `compute.ts`. Refactors must guarantee that when the tree contains only `DynamicStep` and `DynamicStepsSeries`, the traversal path matches today’s flattening (verified via snapshot tests in `packages/core/src/compute-view/dynamic-view/__test__`).
- For legacy parallel, the branch collection introduces an extra recursion level; tests must confirm that `actors` and `steps` arrays remain identical. We will capture the output of canonical fixtures (cloud-system, authTokenUpdateFlow) before changes and assert parity.

### 12.5 Layout Pipelines (Diagram & Sequence)

- Sequence layout currently groups by `parallelPrefix` derived from the step ID. Because ID formats for existing branches remain the same, the derived prefix string (e.g., `step-03.`) persists, allowing existing functions like `getParallelStepsPrefix` to continue working while we migrate to the richer metadata.
- Diagram layout uses manual layout or auto layout with edge linking; preserving IDs guarantees edges keep their stored control points (`packages/layouts/src/manual/applyManualLayout.ts:148`).
- Visual regression tests: baseline screenshots for legacy dynamic views in both diagram and sequence modes must remain pixel-identical when the new branch collection wraps legacy syntax.

### 12.6 Walkthrough State Machine

- Current context stores `{ stepId, parallelPrefix }`. For legacy documents we populate `BranchContext` but mark `pathCount = 1` and `kind = 'parallel'`. Navigation keeps working because branch selectors only render when `pathCount > 1`.
- Event names and guards remain backward compatible, so persisted walkthrough state (e.g., local storage in the app) continues to hydrate correctly.

### 12.7 Tooling & Ecosystem Integrations

- **CLI / Code Generation**: any generated artefacts that iterate dynamic view steps via the public API will continue to receive the same flat edge list. We will add wrapper utilities so third-party scripts can opt into the richer branch metadata without breaking existing code.
- **VS Code Extension**: syntax highlighting rules only need keyword additions; diagnostics rely on Langium’s AST and will treat legacy documents exactly as before.
- **Manual Layout Comments**: serialization format does not change. Compatibility tests already prove the parser handles the current base64 comment; we extend tests with content generated from a legacy project re-parsed after enablement.

### 12.8 Migration & Testing Strategy

- Establish a “Legacy Compatibility Suite” ingesting:
  - All examples in `examples/` and `apps/playground/src/examples/dynamic`.
  - Real-world internal models contributed by stakeholders (after anonymisation).
  - Manual layout fixtures with stored edge control points.
- For each fixture, run `likec4 compute` before and after enabling the new branch engine, compare:
  - Computed nodes/edges (IDs, counts, metadata).
  - Layouted sequence output and XY conversion.
  - Walkthrough behaviour (recorded via interaction tests).
- Add unit tests asserting `stepEdgePath([index]) === legacyId` for single-level cases to prevent regressions.
- Introduce feature flag gating the new branch metadata. Rollout plan:
  1. Ship code path disabled by default.
  2. Run compatibility suite with flag on to ensure equality.
  3. Enable by default once parity is proven.

### 12.9 Known Edge Cases to Monitor

- Projects that rely on string sorting of step IDs might see different order when new non-numeric suffixes (e.g., letters) appear. We mitigate by keeping numeric suffixes for generated paths and documenting the stability guarantee.
- If users manually refer to step IDs (rare but possible in documentation) we provide a changelog emphasising stable identifiers for unchanged syntax and explaining the new structure when they opt into named paths.

With these safeguards, the unified branching implementation can ship without breaking historical documents while still offering a clear upgrade path for teams ready to adopt named paths and alternate scenarios.
