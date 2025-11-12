# Branching Experience Implementation Plan

This document outlines the implementation plan for the branching walkthrough and navigation experience in LikeC4.

## Goals

- Provide structured walkthrough flows for dynamic views.
- Support alternate, parallel, and exclusive paths.
- Keep UI and consumer APIs stable and backwards compatible.
- Avoid coupling external consumers to internal XState machine details.

## Scope

- Dynamic view walkthrough behavior.
- Branch-aware navigation and branching collections.
- React hooks and navigation panel integration.
- E2E harnesses and tests validating public contracts.

## High-Level Approach

1. Define stable contracts for walkthrough configuration and branching metadata.
2. Implement a dedicated walkthrough state machine as a child of the diagram machine.
3. Expose walkthrough state/actions via opt-in React hooks.
4. Drive navigation panel UI from hooks + feature flags, not internal machines.
5. Provide harnesses and E2E tests that validate only public contracts.
6. Gate all behavior behind feature flags to preserve legacy behavior by default.

## Phases

### Phase 1: Contracts and Types

- Introduce `WalkthroughContextInput` and branching structures:
  - `viewId` (dynamic view id).
  - `stepIds` (ordered walkthrough-capable steps).
  - `branchCollections` (optional):
    - `branchId` (stable identifier).
    - `kind`: `alternate` | `parallel` | `exclusive`.
    - `decisionStepId`: step where a branch decision occurs.
    - `paths`:
      - `pathId` / `label`.
      - Ordered `stepIds` for that path.
      - Optional metadata (e.g. `isDefaultPath`, `pathTitle`).

### Phase 2: Walkthrough State Machine

- Implement dedicated walkthrough-machine:
  - Hosted as a child actor of the diagram-machine.
  - Responsible for:
    - Current step tracking.
    - Branch selection and path progression.
    - Completion state and stable events.
- Diagram-machine responsibilities:
  - Compute `WalkthroughContextInput` from:
    - current dynamic view
    - xyflow / xydata
    - view steps / edges.
  - Spawn, update, or stop the walkthrough child based on:
    - Feature flags.
    - Validity of the input.
    - Initialization state of xyflow/xydata.

### Phase 3: React Hooks

- Provide opt-in hooks (no breaking changes for non-users):
  - `useWalkthrough`
  - `useWalkthroughActions`
  - `useWalkthroughCompletion`
  - `useWalkthroughURL`
  - `useBranchSelection`
- Requirements:
  - Valid only within walkthrough/diagram context.
  - Surface stable state + commands only.
  - No direct exposure of internal XState machine shape.

### Phase 4: Navigation Panel Integration

- Use hooks + feature flags in Navigation Panel:
  - Render walkthrough and branching controls when enabled and configured.
  - Ensure no direct imports or assumptions about internal machines.
- Keep UI behavior declarative:
  - UI responds to hook state.
  - Changes in machine internals do not break consumers.

### Phase 5: Harnesses and E2E

- Add walkthrough harnesses:
  - Linear walkthrough.
  - Branching walkthrough.
- Add Playwright specs:
  - Validate behavior only via:
    - Feature flags.
    - Public hooks.
    - DOM interactions exposed by harnesses.
- Ensure coverage for:
  - Default (no walkthrough).
  - Linear flow.
  - Branching scenarios (alternate/parallel/exclusive where applicable).

### Phase 6: Gating and Backwards Compatibility

- All functionality behind:
  - `enableDynamicViewWalkthrough` (and related internal flags).
- When disabled or misconfigured:
  - No walkthrough child actor.
  - Walkthrough events are safe no-ops.
  - Behavior matches upstream/legacy.

## Status / Implementation Summary

- Branch-aware dynamic view contracts:
  - Implemented in the fork.
  - Dynamic views can declare walkthrough-capable steps and branchCollections.
- Walkthrough state and machine:
  - Walkthrough behavior is handled by a dedicated walkthrough-machine, hosted as a child actor of the diagram-machine:
    - [packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts](packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts:1)
    - [packages/diagram/src/likec4diagram/state/diagram-machine.ts](packages/diagram/src/likec4diagram/state/diagram-machine.ts:1)
  - The parent diagram-machine:
    - Spawns/updates/stops the walkthrough child only when:
      - enableDynamicViewWalkthrough is enabled.
      - The current dynamic view has valid walkthrough input (stepIds, optional branchCollections).
      - xyflow/xydata are initialized.
- React walkthrough hooks:
  - Public, opt-in hooks expose walkthrough state and actions:
    - [packages/diagram/src/hooks/walkthrough/useWalkthrough.ts](packages/diagram/src/hooks/walkthrough/useWalkthrough.ts:1)
    - [packages/diagram/src/hooks/walkthrough/useWalkthroughActions.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughActions.ts:1)
    - [packages/diagram/src/hooks/walkthrough/useWalkthroughCompletion.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughCompletion.ts:1)
    - [packages/diagram/src/hooks/walkthrough/useWalkthroughURL.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughURL.ts:1)
    - [packages/diagram/src/hooks/walkthrough/useBranchSelection.ts](packages/diagram/src/hooks/walkthrough/useBranchSelection.ts:1)
  - Hooks:
    - Are valid only within the walkthrough/diagram context.
    - Are optional; consumers not using them see no change.
- Navigation panel integration:
  - Walkthrough UI in the navigation panel is driven solely via hooks and feature flags:
    - [packages/diagram/src/navigationpanel/NavigationPanel.tsx](packages/diagram/src/navigationpanel/NavigationPanel.tsx:1)
  - No direct coupling to internal machines from UI components.
- E2E harness and tests:
  - Walkthrough harness components and Playwright specs validate public contracts:
    - [packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx](packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx:1)
    - [packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Branching.tsx](packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Branching.tsx:1)
    - [e2e/tests/walkthrough-linear.spec.ts](e2e/tests/walkthrough-linear.spec.ts:1)
    - [e2e/tests/walkthrough-branching.spec.ts](e2e/tests/walkthrough-branching.spec.ts:1)
- Gating and backwards compatibility:
  - All walkthrough and branching behavior is gated by enableDynamicViewWalkthrough (and related feature flags).
  - When flags are disabled or walkthrough input is absent:
    - No walkthrough child actor is spawned.
    - walkthrough.* events are safe no-ops.
    - Behavior matches upstream/legacy semantics.