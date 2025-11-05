# PR01 – Unified Branch Foundations (Types & Parser)

## 1. Context
We begin the unified branching rollout by establishing the shared branch abstractions in the type system and parser. This PR introduces `DynamicBranchCollection` / `DynamicBranchPath`, updates the grammar to support named paths, and ensures legacy `parallel` syntax deserialises into the new structures without observable behaviour changes. Completing this work unblocks downstream refactors (compute, layout, UI) while retaining backward compatibility for historical C4 documents.

## 2. Scope
- Extend Langium grammar with branch collections and paths (parallel + alternate).
- Emit unified branch nodes from the parser with metadata required by later stages.
- Backward-compat conversion layer for legacy anonymous `parallel`.
- TypeScript type definitions and guards reflecting the new structures.
- Feature flag scaffolding to toggle new branch collections off during rollout.

Out of scope: compute traversal, sequence layout, UI changes, or walkthrough behaviour.

## 3. Test-Driven Development Plan
1. **Grammar Fixtures (Failing First)**
   - Add new sample models covering: anonymous parallel (legacy), parallel with named paths, alternate with named paths, nested branches.
   - Extend `packages/language-server/src/__tests__/views-dynamic.spec.ts` with expectations that currently fail (assert new AST form).
2. **Type Guards & Factory Tests**
   - Add failing unit tests in `packages/core/src/types/__tests__/dynamic-branch.spec.ts` verifying type guards, legacy conversion helpers, and feature flag defaults.
3. **Parser Snapshot Tests**
   - Create dedicated parser snapshot suite under `packages/language-server/src/model/__tests__/dynamic-branch-parser.spec.ts` to ensure AST stability.
4. **Formatter Specs**
   - Extend `packages/language-server/src/formatting/LikeC4Formatter.spec.ts` with new syntax fixture expecting formatted output.
5. **Compatibility Regression**
   - Add golden fixture representing legacy dynamic view to confirm parse result is unchanged when flag disabled.

Code is only written once the corresponding tests are red.

## 4. Implementation Outline
- Update grammar (`packages/language-server/src/like-c4.langium`) to introduce branch collection/path productions.
- Adjust AST builders and Langium generated types (`packages/language-server/src/ast.ts` if regeneration needed).
- Extend `ViewsParser` to produce unified branch collections, inserting conversion helper for legacy parallel.
- Introduce new types in `packages/core/src/types/view-parsed.dynamic.ts` plus guards (`isDynamicBranchCollection`, `isBranchPath`).
- Provide helper `toLegacyParallel` in `packages/core/src/types/view-parsed.dynamic.ts` for compatibility consumers.
- Wire feature flag via config (placeholder constant in `packages/core/src/config/featureFlags.ts`).

## 5. Documents & Artifacts to Update
- `upstream/APPROACH_UNIFIED_BRANCHING_REWORK.md` – add PR progress status.
- `apps/docs/src/content/docs/tooling/model-api.mdx` – document new type definitions (draft notes).
- `apps/docs/src/content/docs/language/dynamic-views.mdx` – append syntax preview (flagged as experimental).

## 6. Definition of Done
- All new and existing parser/formatter tests pass with flag both disabled and enabled.
- Legacy fixtures (cloud system dynamic views) parse identically when flag disabled.
- TypeScript build passes without `any` escape hatches; public API exports documented.
- Feature flag defaults to “off”, with CLI/runtime guard ensuring no behaviour change until later PRs.
- Markdown docs updated with “behind feature flag” callouts.
- Changelog draft entry prepared (not yet published).

## 7. Dependencies & Follow-Up
- Depends on: none.
- Enables: PR02 (compute & ID refactor).
- Follow-up tasks: regenerate language-server code if grammar changes require it; communicate flag name to downstream PRs.
