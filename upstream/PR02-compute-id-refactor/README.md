# PR02 – Branch-Aware Compute & Step Identifier Refactor

## 1. Context
With the unified branch structures in place, we must adapt the compute layer to traverse branch collections, emit hierarchical step identifiers, and expose branch metadata on computed edges. This PR focuses on core data flow changes while keeping visual layers untouched. Ensuring deterministic behaviour for legacy documents is critical to avoid layout/lifecycle regressions.

## 2. Scope
- Introduce hierarchical step ID generator (`stepEdgePath`) while preserving legacy outputs for non-branch scenarios.
- Refactor traversal helpers (`flattenSteps`, `elementsFromSteps`, etc.) to consume branch collections.
- Update `DynamicViewCompute` to produce branch-aware edges, including `branchTrail` metadata and branch collection exports.
- Provide compatibility helpers that reconstruct legacy `__parallel` arrays when needed.
- Extend core test fixtures to validate nested branch traversal.

Out of scope: UI/state machine updates, sequence layout changes, or branch selector UX.

## 3. Test-Driven Development Plan
1. **Identifier Tests (Failing First)**
   - Add `packages/core/src/types/__tests__/step-edge-id.spec.ts` verifying new API, including compatibility cases.
2. **Traversal Unit Tests**
   - Introduce `packages/core/src/compute-view/dynamic-view/__test__/branch-traversal.spec.ts` with failing expectations for branch iteration order, actor discovery, and branch metadata.
3. **Golden Compute Fixtures**
   - Capture JSON snapshots for representative dynamic views (legacy + new branch syntax). Write tests in `packages/core/src/compute-view/dynamic-view/__test__/fixtures.spec.ts` that assert previous outputs when flag disabled.
4. **Branch Metadata Smoke Test**
   - Add minimal functional test ensuring `branchCollections` array is emitted and consistent.

Only after tests fail we implement the refactor.

## 4. Implementation Outline
- Modify `packages/core/src/types/scalar.ts` to add hierarchical ID helpers without breaking existing exports.
- Refactor `packages/core/src/types/view-parsed.dynamic.ts` utilities (`flattenSteps`, new branch iterators).
- Update `packages/core/src/compute-view/dynamic-view/compute.ts` loop to maintain branch stacks, push `branchTrail`, and increment numbering correctly.
- Extend `packages/core/src/compute-view/dynamic-view/utils.ts` for branch-aware actor aggregation.
- Ensure TypeScript discriminated unions remain exhaustive with new collection type.
- Feature flag guarding: branch metadata only attached when unified branching flag enabled; fallback path reconstructs existing behaviour.

## 5. Documents & Artifacts to Update
- `upstream/APPROACH_UNIFIED_BRANCHING_REWORK.md` – annotate PR02 milestones.
- `apps/docs/src/content/docs/tooling/model-api.mdx` – update computed view schema docs (branch metadata section).
- Add ADR note in `upstream/IMPLEMENTATION_CARE_PACKAGE.md` referencing compute changes.

## 6. Definition of Done
- All new tests pass; existing compute snapshot tests remain unchanged for legacy fixtures with flag disabled.
- Hierarchical IDs validated for nested branches; manual layout fixtures unaffected (verified via regression test).
- Feature flag toggles between old and new behaviour cleanly.
- Code coverage for branch traversal utilities ≥ the baseline (report attached to PR).
- CHANGELOG draft updated with compute-layer details.

## 7. Dependencies & Follow-Up
- Depends on: PR01 merged (types + parser).
- Enables: PR03 (sequence layout) and PR04 (walkthrough/state machine).
- Follow-up: share branch metadata schema with UI team; coordinate with telemetry for eventual instrumentation.
