# ADR-006: Walkthrough Module Architecture

**Status:** ✅ ACCEPTED  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

After completing ADRs 001-005 defining the walkthrough feature requirements, we need to decide on the code organization and architecture. The current `diagram-machine.ts` is 1443 lines with mixed concerns, and adding walkthrough branching logic would make it significantly larger and harder to maintain.

We researched:
1. Existing walkthrough/tour libraries (Shepherd.js, Intro.js, Driver.js) - **Not suitable** (DOM-based, no branching support)
2. Current implementation - Basic linear walkthrough exists, needs branching extension
3. XState usage - **Already using XState v5** (`xstate: ^5.23.0`, `@xstate/react: ^6.0.0`)
4. Potential for future reuse - Could extract as `@likec4/walkthrough` package

## Problem

Where should we implement the walkthrough state machine and related logic?

### Options Considered

**Option A: Modular Architecture (Recommended)**
- Create dedicated `walkthrough/` module
- Separate XState child machine
- Clear file boundaries for each concern

**Option B: Inline Implementation**
- Add to existing `diagram-machine.ts`
- Keep all state logic in one file

**Option C: External Package First**
- Build as `@likec4/walkthrough` immediately
- Import into diagram package

## Decision

**ACCEPTED: Option A - Modular Architecture**

Create a dedicated walkthrough module with clear separation of concerns and XState child machine integration.

### Rationale

1. **Already using XState** - Perfect foundation for branching logic
2. **Team expertise** - Current machine is complex and working well
3. **Size concerns** - diagram-machine.ts is already 1443 lines
4. **Testability** - Isolated module is easier to test
5. **Future extraction** - Modular design enables later package extraction
6. **No new dependencies** - Uses existing XState infrastructure

## Consequences

**Positive:**
- ✅ Reduces diagram-machine.ts from 1443 → <1000 lines
- ✅ Clear separation of concerns
- ✅ Easy to test in isolation (unit tests per module)
- ✅ Clean implementation path for all 5 ADRs
- ✅ No impact on existing walkthrough functionality
- ✅ Foundation for future `@likec4/walkthrough` extraction
- ✅ Child actor pattern proven in existing code (overlays, search, hotkeys)

**Negative:**
- Need to wire up child actor communication
- Slightly more initial setup time
- More files to navigate (but better organized)

**Neutral:**
- Similar complexity to existing actor patterns in codebase
- Learning curve for contributors (but consistent with existing patterns)

## Implementation Notes

### Directory Structure

```
packages/diagram/src/likec4diagram/
├── state/
│   ├── diagram-machine.ts          (Main machine, spawns walkthrough child)
│   ├── assign.ts                   (Core assignments, delegates to walkthrough)
│   ├── utils.ts                    (Core utilities)
│   └── walkthrough/                🆕 NEW MODULE
│       ├── index.ts                (Public exports)
│       ├── types.ts                (WalkthroughContext, BranchContext, etc.)
│       ├── walkthrough-machine.ts  (XState child machine)
│       ├── navigation.ts           (computeNextStep, computePreviousStep)
│       ├── completion.ts           (CompletionTracker class)
│       ├── url-state.ts            (URL parsing/serialization)
│       ├── progress.ts             (Progress calculation)
│       └── __tests__/              (Unit tests for each module)
│           ├── walkthrough-machine.spec.ts
│           ├── navigation.spec.ts
│           ├── completion.spec.ts
│           ├── url-state.spec.ts
│           └── progress.spec.ts
│
├── hooks/
│   └── walkthrough/                🆕 NEW HOOKS (ADR-005)
│       ├── index.ts
│       ├── useWalkthrough.ts
│       ├── useWalkthroughActions.ts
│       ├── useWalkthroughCompletion.ts
│       ├── useBranchSelection.ts
│       ├── useWalkthroughURL.ts
│       └── __tests__/
│
└── ui/
    └── walkthrough/                🆕 NEW COMPONENTS
        ├── WalkthroughControls.tsx (Enhanced version of existing)
        ├── WalkthroughProgress.tsx (New progress display)
        ├── BranchSelector.tsx      (Path selection UI)
        ├── ResumePrompt.tsx        (URL resume UI)
        └── __tests__/
```

### Integration Pattern

```typescript
// diagram-machine.ts (simplified)
import { walkthroughMachineLogic } from './walkthrough/walkthrough-machine'

export const diagramMachine = setup({
  types: {
    context: {} as Context,
    events: {} as Events
  },
  actors: {
    walkthrough: walkthroughMachineLogic,
    overlays: overlaysActorLogic,
    search: searchActorLogic,
    hotkeys: hotkeyActorLogic,
    // ...
  }
}).createMachine({
  context: ({ input }) => ({
    // ... existing context
    walkthroughRef: null
  }),
  
  entry: assign({
    walkthroughRef: ({ spawn }) => spawn('walkthrough', {
      id: 'walkthrough',
      input: { /* ... */ }
    })
  }),
  
  on: {
    // Forward walkthrough events to child actor
    'walkthrough.*': {
      actions: sendTo('walkthroughRef', ({ event }) => event)
    }
  }
})
```

### Child Machine Structure

```typescript
// walkthrough/walkthrough-machine.ts
import type { WalkthroughContext, WalkthroughEvents } from './types'
import { computeNextStep, computePreviousStep } from './navigation'
import { CompletionTracker } from './completion'
import { parseWalkthroughURL, buildWalkthroughURL } from './url-state'
import { calculateProgress } from './progress'

export const walkthroughMachineLogic = setup({
  types: {
    context: {} as WalkthroughContext,
    events: {} as WalkthroughEvents,
    input: {} as WalkthroughInput
  }
}).createMachine({
  id: 'walkthrough',
  initial: 'idle',
  
  context: ({ input }) => ({
    activeWalkthrough: null,
    completionTracker: new CompletionTracker(input.diagramId),
    allSteps: input.steps,
    // ...
  }),
  
  states: {
    idle: {
      on: {
        'walkthrough.start': {
          target: 'active',
          actions: 'initializeWalkthrough'
        }
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
          on: {
            'walkthrough.navigate': [
              {
                guard: 'isSelectPathAction',
                actions: 'selectPath',
                target: 'navigating'
              }
            ]
          }
        }
      },
      
      on: {
        'walkthrough.end': {
          target: 'idle',
          actions: 'cleanup'
        }
      }
    }
  }
})
```

### Module Responsibilities

#### `types.ts`
- `WalkthroughContext` - Machine context
- `BranchContext` - Branch metadata (from ADR-001)
- `ActiveWalkthrough` - Discriminated union (linear | branch)
- `NavigateAction` - Event action types
- All TypeScript interfaces

#### `navigation.ts`
- `computeNextStep()` - Just-in-time navigation (ADR-002)
- `computePreviousStep()` - Reverse navigation
- `findNextStepInPath()` - Path-specific navigation
- `findStepAfterBranch()` - Branch exit logic
- Graph traversal helpers

#### `completion.ts`
- `CompletionTracker` class (ADR-003)
- `markPathCompleted()`
- `shouldShowRevisitCTA()`
- `isBranchFullyCompleted()`
- localStorage persistence

#### `url-state.ts`
- `parseWalkthroughURL()` (ADR-004)
- `buildWalkthroughURL()`
- `validateWalkthroughURL()`
- Hash-based state serialization

#### `progress.ts`
- `calculateProgress()` (ADR-002)
- Linear vs branch progress calculation
- Step counting logic

### Migration Strategy

**Phase 1: Setup (Day 1)**
1. Create directory structure
2. Extract types from diagram-machine.ts to `walkthrough/types.ts`
3. Update imports
4. No functional changes

**Phase 2: Extract Logic (Day 2)**
1. Move navigation logic to `walkthrough/navigation.ts`
2. Create `CompletionTracker` in `walkthrough/completion.ts`
3. Create URL utilities in `walkthrough/url-state.ts`
4. Create progress calculation in `walkthrough/progress.ts`
5. Write unit tests for each module

**Phase 3: Create Child Machine (Day 3)**
1. Create `walkthrough/walkthrough-machine.ts`
2. Move walkthrough events and states from diagram-machine
3. Wire up as child actor
4. Integration tests

**Phase 4: Implement Hooks (Day 4)**
1. Create 5 hooks per ADR-005
2. Hook unit tests
3. Update existing components to use new hooks

**Phase 5: Build UI (Day 5)**
1. Enhance existing components
2. Create new components (BranchSelector, ResumePrompt)
3. E2E tests

### Testing Strategy

```typescript
// Unit tests (isolated)
describe('navigation.ts', () => {
  it('computes next step in linear mode', () => { /* ... */ })
  it('computes next step at branch decision', () => { /* ... */ })
  it('handles nested branches', () => { /* ... */ })
})

describe('CompletionTracker', () => {
  it('tracks visited paths', () => { /* ... */ })
  it('detects fully completed branches', () => { /* ... */ })
  it('persists to localStorage', () => { /* ... */ })
})

// Integration tests (with machine)
describe('walkthrough-machine', () => {
  it('navigates through linear sequence', () => { /* ... */ })
  it('pauses at branch without default', () => { /* ... */ })
  it('auto-follows default branch path', () => { /* ... */ })
})

// E2E tests (with React)
describe('Walkthrough E2E', () => {
  it('completes full walkthrough with branching', () => { /* ... */ })
  it('shows CTA for unvisited paths', () => { /* ... */ })
  it('resumes from URL state', () => { /* ... */ })
})
```

### Reusability Path

This modular architecture enables future extraction:

**Now (PR04):**
```
packages/diagram/src/likec4diagram/state/walkthrough/
└── (LikeC4-integrated implementation)
```

**Future (Post-PR04):**
```
packages/walkthrough/
├── src/
│   ├── machine/        (Generic XState machine)
│   ├── navigation/     (Pluggable navigation logic)
│   ├── completion/     (Generic completion tracking)
│   └── react/          (Generic hooks)
└── package.json        (@likec4/walkthrough)

packages/diagram/src/likec4diagram/state/walkthrough/
└── (Thin adapter using @likec4/walkthrough)
```

### Dependencies

**No new dependencies required:**
- ✅ XState: Already using v5.23.0
- ✅ @xstate/react: Already using v6.0.0
- ✅ React: Existing dependency
- ✅ TypeScript: Existing setup

## Related ADRs

- ADR-001: Event signatures implemented in walkthrough-machine.ts
- ADR-002: Navigation logic in navigation.ts
- ADR-003: Completion tracking in completion.ts
- ADR-004: URL persistence in url-state.ts
- ADR-005: Hooks in hooks/walkthrough/

## References

- Existing actor pattern: `overlaysActorLogic`, `searchActorLogic`, `hotkeyActorLogic`
- XState v5 docs: https://stately.ai/docs/xstate
- Current walkthrough: `packages/diagram/src/navigationpanel/walkthrough/`
