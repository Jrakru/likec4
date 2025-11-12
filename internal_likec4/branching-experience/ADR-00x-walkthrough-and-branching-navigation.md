# ADR-00x: Walkthrough and Branching Navigation Architecture

## Status

Accepted

## Context

We need structured, branch-aware walkthrough flows for dynamic views that:

- Support alternate/parallel/exclusive paths.
- Keep UI and consumer APIs stable over time.
- Remain fully backward compatible when features are disabled or configs are absent.
- Avoid coupling external code to internal XState machine structure.

## Decision

### 1. Contracts

- WalkthroughContextInput:
  - viewId: the dynamic view id.
  - stepIds: ordered list of walkthrough-capable step ids.
  - branchCollections (optional):
    - branchId: unique per branch collection.
    - kind: alternate | parallel | exclusive.
    - decisionStepId: step where a branch decision is made.
    - paths:
      - pathId / label.
      - ordered stepIds for that path.
      - optional metadata (e.g. isDefaultPath, pathTitle).
  - Defined and documented in:
    - [packages/diagram/src/likec4diagram/state/walkthrough/types.ts](packages/diagram/src/likec4diagram/state/walkthrough/types.ts:1)

### 2. Walkthrough state machine

- Introduce a dedicated walkthrough-machine:
  - [packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts](packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts:1)
- Integrate as a child actor of the diagram-machine:
  - [packages/diagram/src/likec4diagram/state/diagram-machine.ts](packages/diagram/src/likec4diagram/state/diagram-machine.ts:1)
  - The diagram-machine:
    - Computes WalkthroughContextInput from the current context (xyedges + view).
    - Spawns or updates the walkthrough child only when:
      - enableDynamicViewWalkthrough === true.
      - A valid WalkthroughContextInput exists.
      - xyflow and xydata are initialized.
    - Stops the child when:
      - Flag is disabled.
      - View/input no longer valid.

### 3. Public React hooks

- Expose walkthrough behavior via hooks (opt-in):
  - [packages/diagram/src/hooks/walkthrough/useWalkthrough.ts](packages/diagram/src/hooks/walkthrough/useWalkthrough.ts:1)
  - [packages/diagram/src/hooks/walkthrough/useWalkthroughActions.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughActions.ts:1)
  - [packages/diagram/src/hooks/walkthrough/useWalkthroughCompletion.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughCompletion.ts:1)
  - [packages/diagram/src/hooks/walkthrough/useWalkthroughURL.ts](packages/diagram/src/hooks/walkthrough/useWalkthroughURL.ts:1)
  - [packages/diagram/src/hooks/walkthrough/useBranchSelection.ts](packages/diagram/src/hooks/walkthrough/useBranchSelection.ts:1)
- Invariants:
  - Hooks must be used within a WalkthroughProvider / diagram context that owns the walkthrough actor.
  - For consumers that do not use these hooks, there is no behavior change.

### 4. UI integration

- Navigation Panel:
  - Uses walkthrough hooks and feature flags to render walkthrough controls:
    - [packages/diagram/src/navigationpanel/NavigationPanel.tsx](packages/diagram/src/navigationpanel/NavigationPanel.tsx:1)
  - Does not depend directly on internal machine implementation.
- Harnesses:
  - WalkthroughHarness.* showcase canonical integration and power Playwright tests:
    - [packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx](packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx:1)
    - [packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Branching.tsx](packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Branching.tsx:1)

### 5. Gating

- All walkthrough and branching behavior is strictly feature-flagged:
  - Enabled only when:
    - enableDynamicViewWalkthrough (and related flags) are true.
    - Dynamic view has valid walkthrough input.
  - Otherwise:
    - No walkthrough child actor.
    - walkthrough.* events no-op.
    - Legacy behavior preserved.

## Consequences

- Backwards compatibility:
  - Existing consumers without flags/configs are unaffected.
- Stable contracts:
  - Consumers are encouraged to rely on:
    - WalkthroughContextInput and branchCollections.
    - React hooks and documented events.
  - Direct dependency on internal XState machine structure is discouraged.
- Testability:
  - Harness and Playwright tests validate behavior using only public APIs and flags.
- Extensibility:
  - Future branching/walkthrough enhancements can evolve behind the same contracts and flags.

## References

- [packages/diagram/src/likec4diagram/state/walkthrough/types.ts](packages/diagram/src/likec4diagram/state/walkthrough/types.ts:1)
- [packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts](packages/diagram/src/likec4diagram/state/walkthrough/walkthrough-machine.ts:1)
- [packages/diagram/src/likec4diagram/state/diagram-machine.ts](packages/diagram/src/likec4diagram/state/diagram-machine.ts:1)
- [packages/diagram/src/hooks/walkthrough/useWalkthrough.ts](packages/diagram/src/hooks/walkthrough/useWalkthrough.ts:1)
- [packages/diagram/src/navigationpanel/NavigationPanel.tsx](packages/diagram/src/navigationpanel/NavigationPanel.tsx:1)
- [packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx](packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx:1)
- [e2e/tests/walkthrough-linear.spec.ts](e2e/tests/walkthrough-linear.spec.ts:1)
- [e2e/tests/walkthrough-branching.spec.ts](e2e/tests/walkthrough-branching.spec.ts:1)