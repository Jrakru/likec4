# PR03 – Sequence Layout & Layouted View Branch Awareness

## 1. Context
After compute emits branch metadata, the sequence layout engine must consume it to render decision areas, path markers, and maintain backwards-compatible geometry for legacy flows. This PR adapts layout calculations, XY conversion, and related data structures. No visible UI chrome changes yet—just structural support for later PRs.

## 2. Scope
- Extend layout types to represent branch areas with per-path bounding boxes.
- Update `SequenceViewLayouter`, layout utilities, and XY conversion to respect branch metadata and generate stable coordinates.
- Maintain compatibility with existing manual layout and sequence export workflows.
- Add Playwright / snapshot baselines to guard visual regressions (render-only; controls remain unchanged).

Out of scope: branch highlight styling, navigation controls, or panel UX.

## 3. Test-Driven Development Plan
1. **Type Contract Tests**
   - Add failing TypeScript tests (via `expectType` or compile-time checks) ensuring new layout interfaces expose branch fields.
2. **Unit Tests for Layout Calculations**
   - Extend `packages/layouts/src/sequence/__tests__/layouter.spec.ts` with failing cases covering branch boxes, nested decisions, and legacy parity.
3. **XY Conversion Tests**
   - Add fixtures in `packages/diagram/src/likec4diagram/xyflow-sequence/__tests__/sequence-view.spec.ts` verifying node/edge emission, including new branch node types.
4. **Visual Regression Setup**
   - Capture baseline screenshots using Storybook/Playwright for sample dynamic views; initial runs should fail due to missing branch overlays.

## 4. Implementation Outline
- Update layout types in `packages/core/src/types/view-layouted.ts` and `packages/layouts/src/sequence/_types.ts` to include `branchId`, `pathIds`, etc.
- Modify `SequenceViewLayouter` to build branch areas from `branchTrail` metadata; ensure numeric stability for legacy cases.
- Enhance utilities in `packages/layouts/src/sequence/utils.ts` to map branch IDs to bounding boxes.
- Adjust `sequenceViewToXY` to generate `seq-branch-area` or updated `seq-parallel` nodes with new metadata, while keeping legacy node IDs for single-path cases.
- Update `packages/diagram/src/likec4diagram/types.ts` to include new node data interfaces.
- Refresh story fixtures in `packages/diagram/src/likec4diagram/__stories__`.

## 5. Documents & Artifacts to Update
- `upstream/APPROACH_UNIFIED_BRANCHING_REWORK.md` – record PR03 progress and open questions.
- `apps/docs/src/content/docs/tooling/react.mdx` – note upcoming sequence layout enhancements (marked experimental).
- `apps/docs/src/content/docs/tooling/model-api.mdx` – describe new layout fields.

## 6. Definition of Done
- Layout unit tests and XY conversion tests pass with both flag states.
- Visual regression diffs review: legacy views unchanged, branch-enabled fixtures show expected overlays.
- No TypeScript `ts-expect-error` regressions; layout consumers compile without modifications when branch flag disabled.
- Manual layout application still succeeds (existing tests).
- CHANGELOG draft entry updated for layout additions.

## 7. Dependencies & Follow-Up
- Depends on: PR02 merged.
- Enables: PR04 (state machine) and PR05 (UI polish).
- Follow-up: coordinate with design on styling tokens for branch overlays; schedule UX review before PR05.
