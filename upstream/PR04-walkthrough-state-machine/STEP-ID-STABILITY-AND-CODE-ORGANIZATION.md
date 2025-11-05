# Step ID Stability Investigation & Code Organization Analysis

**Date:** 2025-10-24  
**Related:** ADR-004 (URL State Persistence)

## Part 1: Step ID Stability Investigation

### How Step IDs Are Generated

From `packages/core/src/types/scalar.ts` and `packages/core/src/compute-view/dynamic-view/compute.ts`:

```typescript
// Generation logic in compute.ts (lines 251-262)
private buildStepId(rootIndex: number, branchStack?: BranchStackEntry<A>[]): StepEdgeId {
  if (!branchStack || branchStack.length === 0) {
    return stepEdgePath([rootIndex])  // e.g., "step-01"
  }
  const segments = [rootIndex]
  for (const entry of branchStack) {
    segments.push(entry.pathIndex)
  }
  const innermost = branchStack[branchStack.length - 1]!
  segments.push(innermost.stepCounter + 1)
  return stepEdgePath(segments)  // e.g., "step-01.00.02"
}

// stepEdgePath in scalar.ts formats with zero-padding
export function stepEdgePath(indices: readonly StepEdgeIndex[]): StepEdgeId {
  // Produces: "step-01", "step-01.00", "step-03.01.05", etc.
}
```

### Stability Analysis

**✅ Step IDs ARE STABLE** (with caveats):

1. **Position-Based Generation:**
   - IDs are based on positional indices in the diagram definition
   - `rootIndex` = position in top-level steps (1, 2, 3, ...)
   - Branch paths add `.pathIndex.stepCounter` segments

2. **Deterministic:**
   - Given the same diagram structure, IDs will always be identical
   - Uses zero-padded formatting for consistency

3. **When IDs Change:**
   - ❌ Adding/removing steps BEFORE a step shifts all subsequent IDs
   - ❌ Reordering steps changes their indices
   - ✅ Adding steps AFTER doesn't affect earlier IDs
   - ✅ Modifying step properties (title, notes, etc.) doesn't change IDs
   - ✅ Adding/removing branches affects branch segment but not root segment

### Recommendation for ADR-004

**URLs WILL BREAK when:**
- Steps are inserted/removed before the linked step
- Diagram is reorganized/reordered

**This is ACCEPTABLE because:**
1. It's a known limitation in position-based systems
2. Users will typically share URLs for current/recent diagram states
3. Alternative approaches (semantic IDs, content hashing) are complex
4. The "show error and fallback" behavior handles this gracefully

**Documentation Note:**
> ⚠️ Walkthrough URLs are tied to diagram structure. If steps are added, removed, or reordered, previously shared URLs may become invalid.

---

## Part 2: Code Organization Analysis

### Current Structure

```
packages/
├── core/
│   └── src/
│       ├── compute-view/
│       │   └── dynamic-view/
│       │       ├── compute.ts           (Step computation, branch metadata)
│       │       └── utils.ts
│       ├── types/
│       │   ├── scalar.ts                (StepEdgeId types & utilities)
│       │   └── view-parsed.dynamic.ts   (Dynamic view types)
│       └── config/
│           └── featureFlags.ts
│
└── diagram/
    └── src/
        ├── likec4diagram/
        │   ├── state/
        │   │   ├── diagram-machine.ts    (Main XState machine - 1443 lines!)
        │   │   ├── assign.ts             (State assignments)
        │   │   ├── utils.ts              (Selectors, helpers)
        │   │   ├── hotkeyActor.ts        (Keyboard shortcuts)
        │   │   └── syncManualLayoutActor.ts
        │   ├── xyflow-sequence/          (Sequence diagram rendering)
        │   └── ui/                       (React components)
        └── hooks/                        (Custom hooks)
```

### Problems Identified

#### 1. **Monolithic State Machine** (diagram-machine.ts: 1443 lines)
- Mixed concerns: navigation, walkthrough, layout, features, overlays
- Hard to understand event flow
- Difficult to test individual features
- No clear boundaries

#### 2. **Walkthrough Logic Scattered**
- Current state: `activeWalkthrough` in diagram-machine.ts (lines 141-145)
- Step navigation: `walkthrough.start`, `walkthrough.step`, `walkthrough.end` events
- No dedicated walkthrough module
- Tightly coupled to main machine

#### 3. **No Separation for New Features**
- Branch navigation logic will add complexity to already-large machine
- Completion tracking has no home
- URL persistence logic has no home
- Hook implementations will be spread across multiple files

#### 4. **Missing Abstractions**
- No `WalkthroughContext` type (just inline object)
- No `NavigationResult` type
- No completion tracker class
- No URL state manager

---

## Part 3: Proposed Refactoring

### Option A: Modular Architecture (Recommended)

Create a dedicated walkthrough module with clear boundaries:

```
packages/diagram/src/likec4diagram/
├── state/
│   ├── diagram-machine.ts        (Core machine - reduced size)
│   ├── assign.ts
│   ├── utils.ts
│   └── walkthrough/               🆕 NEW MODULE
│       ├── index.ts              (Public exports)
│       ├── types.ts              (WalkthroughContext, BranchContext, etc.)
│       ├── walkthrough-machine.ts (Dedicated XState machine for walkthrough)
│       ├── navigation.ts         (computeNextStep, computePreviousStep)
│       ├── completion.ts         (CompletionTracker class)
│       ├── url-state.ts          (URL parsing/serialization)
│       ├── progress.ts           (Progress calculation)
│       └── __tests__/
│           ├── navigation.spec.ts
│           ├── completion.spec.ts
│           ├── url-state.spec.ts
│           └── walkthrough-machine.spec.ts
│
├── hooks/
│   └── walkthrough/               🆕 NEW HOOKS
│       ├── index.ts
│       ├── useWalkthrough.ts
│       ├── useWalkthroughActions.ts
│       ├── useWalkthroughCompletion.ts
│       ├── useBranchSelection.ts
│       ├── useWalkthroughURL.ts
│       └── __tests__/
│
└── ui/
    └── walkthrough/               🆕 NEW COMPONENTS
        ├── WalkthroughControls.tsx
        ├── WalkthroughProgress.tsx
        ├── BranchSelector.tsx
        ├── ResumePrompt.tsx
        └── __tests__/
```

### Integration Pattern

```typescript
// diagram-machine.ts (simplified)
import { walkthroughMachineLogic } from './walkthrough/walkthrough-machine'

const diagramMachine = setup({
  actors: {
    walkthrough: walkthroughMachineLogic,
    overlays: overlaysActorLogic,
    search: searchActorLogic,
    // ...
  }
}).createMachine({
  context: {
    // Spawn walkthrough as child actor
    walkthroughRef: null
  },
  on: {
    'walkthrough.*': {
      actions: sendTo('walkthroughRef', ({ event }) => event)
    }
  }
})

// walkthrough/walkthrough-machine.ts (new file)
export const walkthroughMachineLogic = setup({
  types: {
    context: {} as WalkthroughContext,
    events: {} as WalkthroughEvents,
  }
}).createMachine({
  id: 'walkthrough',
  initial: 'idle',
  context: {
    activeWalkthrough: null,
    completionTracker: null,
    // ...
  },
  states: {
    idle: {
      on: {
        'walkthrough.start': 'active'
      }
    },
    active: {
      initial: 'navigating',
      states: {
        navigating: {
          on: {
            'walkthrough.navigate': {
              actions: 'handleNavigation'
            }
          }
        },
        branchDecision: {
          // User must select path
        }
      }
    }
  }
})
```

### Benefits of Option A

1. **Separation of Concerns:** Walkthrough logic isolated from main diagram logic
2. **Testability:** Each module can be tested independently
3. **Maintainability:** Clear file boundaries, easier to navigate
4. **Extensibility:** Can add features without touching main machine
5. **Type Safety:** Dedicated types in walkthrough/types.ts
6. **Discoverability:** Related code grouped together

### Option B: Keep Inline (Not Recommended)

Continue adding walkthrough features directly to diagram-machine.ts:
- ❌ Machine will grow to 2000+ lines
- ❌ Hard to understand event flow
- ❌ Difficult to test in isolation
- ❌ Tight coupling increases

---

## Part 4: Migration Strategy

### Phase 1: Extract Types (Day 1)
1. Create `state/walkthrough/types.ts`
2. Define all walkthrough-related types
3. Update imports in diagram-machine.ts

### Phase 2: Extract Logic (Day 2)
1. Create `state/walkthrough/navigation.ts` with navigation functions
2. Create `state/walkthrough/completion.ts` with CompletionTracker
3. Create `state/walkthrough/url-state.ts` with URL utilities
4. Create `state/walkthrough/progress.ts` with progress calculation
5. Write tests for each module

### Phase 3: Create Child Machine (Day 3)
1. Create `state/walkthrough/walkthrough-machine.ts`
2. Move walkthrough events and states
3. Integrate as child actor in diagram-machine
4. Write integration tests

### Phase 4: Implement Hooks (Day 4)
1. Create all 5 hooks following ADR-005
2. Write hook tests
3. Update existing components to use hooks

### Phase 5: Build UI Components (Day 5)
1. Create walkthrough UI components
2. Integrate with state machine
3. End-to-end tests

---

## Part 5: Recommendations

### ✅ DO THIS

1. **Use Option A** - Modular architecture with dedicated walkthrough module
2. **Extract before adding** - Don't add more code to diagram-machine.ts
3. **Follow TDD** - Write tests as you extract
4. **Document step ID limitation** - Add note to ADR-004
5. **Keep existing events** - Don't break current walkthrough functionality during migration

### ❌ DON'T DO THIS

1. Don't add 500+ lines to diagram-machine.ts
2. Don't mix walkthrough logic with navigation history logic
3. Don't create circular dependencies
4. Don't skip tests during extraction

### 🎯 Success Criteria

After refactoring:
- diagram-machine.ts reduced to <1000 lines
- All walkthrough logic in dedicated module
- 80%+ test coverage for walkthrough module
- No regression in existing walkthrough features
- Clear path for implementing ADR-001 through ADR-005

---

## Decision Needed

**Should we proceed with Option A (modular refactoring)?**

If yes, we can start with Phase 1 immediately.
