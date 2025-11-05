# PR04 – Walkthrough State Machine & Navigation Enhancements

> **Status:** Design Complete ✅ | Ready for Implementation  
> **Dependencies:** PR03 (merged) ✅ | XState v5 (installed) ✅  
> **Implementation Time:** 5 days (modular approach)

## Quick Start for Implementation Team

1. **Start here:** Read `ADRs/INDEX.md` for complete design summary
2. **Architecture:** See `ADR-006-module-architecture.md` for code organization
3. **Implementation:** Follow 5-day plan in Section 4 below
4. **Testing:** TDD approach detailed in Section 3 below

All design decisions are documented in 6 ADRs with TypeScript types, code examples, and rationale.

---

## 1. Context
With branch metadata available through compute and layout (PR03), the walkthrough experience must be updated to support branching navigation (next/previous, jump to decision point, branch selection). This PR implements a modular walkthrough state machine as an XState child actor, with dedicated modules for navigation, completion tracking, and URL persistence, while maintaining backward compatibility for linear walkthroughs.

## 2. Scope

### Core Features (All Defined in ADRs)
- **State Machine Architecture** (ADR-006): Extract walkthrough logic to dedicated child actor module
- **Event System** (ADR-001): Unified `walkthrough.navigate` event with discriminated action types
- **Navigation Logic** (ADR-002): Just-in-time step computation with branch-aware traversal
- **Completion Tracking** (ADR-003): localStorage-based hierarchical tracking with "revisit alternate paths" CTAs
- **URL State** (ADR-004): Hash-based persistence for shareable walkthrough positions
- **React Hooks** (ADR-005): Five granular hooks for optimal component re-rendering

### Implementation Details
- Introduce `BranchContext` type with depth tracking for nested branches
- Create dedicated `state/walkthrough/` module with: types, machine, navigation, completion, url-state, progress
- Implement five React hooks: `useWalkthrough`, `useWalkthroughActions`, `useWalkthroughCompletion`, `useBranchSelection`, `useWalkthroughURL`
- Build UI components: enhanced controls, progress indicators, branch selector, resume prompt
- Implement keyboard bindings for navigation
- Ensure support for legacy views where branch context collapses to single-path behaviour

### Out of Scope
- Final UI styling polish (handled in PR05)
- Telemetry wiring (PR07)
- Step ID format changes (confirmed position-based IDs are acceptable)

## 3. Test-Driven Development Plan

### Phase 1: Module Unit Tests (Day 2)
1. **Navigation Logic** (`state/walkthrough/navigation.ts`)
   - `computeNextStep()` in linear mode
   - `computeNextStep()` at branch decision points
   - `computeNextStep()` with default path auto-follow
   - `computeNextStep()` with parallel path iteration
   - `computePreviousStep()` with branch boundary respect
   - Nested branch navigation

2. **Completion Tracking** (`state/walkthrough/completion.ts`)
   - `CompletionTracker.markPathCompleted()`
   - `CompletionTracker.shouldShowRevisitCTA()`
   - `CompletionTracker.isBranchFullyCompleted()` with nesting
   - localStorage persistence and deserialization
   - Set serialization (visitedPaths, completedPaths)

3. **URL State** (`state/walkthrough/url-state.ts`)
   - `parseWalkthroughURL()` for linear walkthrough
   - `parseWalkthroughURL()` for branch context
   - `parseWalkthroughURL()` for nested branches
   - `buildWalkthroughURL()` with hash formatting
   - `validateWalkthroughURL()` error handling

4. **Progress Calculation** (`state/walkthrough/progress.ts`)
   - Linear progress (step X of Y)
   - Branch progress (path X of Y, step Z of W)
   - Nested branch progress with depth

### Phase 2: State Machine Tests (Day 3)
1. **Walkthrough Machine** (`state/walkthrough/walkthrough-machine.ts`)
   - Start walkthrough (idle → active)
   - Navigate next in linear mode
   - Navigate next at branch (pause vs auto-follow default)
   - Select path action (branchDecision → navigating)
   - Jump to branch action
   - Stop walkthrough (active → idle)
   - Nested branch entry/exit
   - Event type discrimination

2. **Integration with Diagram Machine**
   - Child actor spawning
   - Event forwarding from parent to child
   - State synchronization
   - Backward compatibility with existing `walkthrough.start`, `walkthrough.step`, `walkthrough.end`

### Phase 3: Hook Tests (Day 4)
1. **useWalkthrough** - State subscription and re-render optimization
2. **useWalkthroughActions** - Event dispatch and memoization
3. **useWalkthroughCompletion** - Completion state subscription
4. **useBranchSelection** - Branch decision state
5. **useWalkthroughURL** - URL sync and hashchange handling

### Phase 4: Integration Tests (Day 5)
1. **Component Integration**
   - WalkthroughControls with useWalkthrough + useWalkthroughActions
   - BranchSelector with useBranchSelection
   - ResumePrompt with useWalkthroughURL

2. **Keyboard Navigation**
   - Arrow keys for next/previous
   - Number keys for path selection
   - Escape to cancel branch selection

3. **E2E Walkthrough Scenarios**
   - Complete linear walkthrough
   - Branch with default path auto-follow
   - Branch requiring path selection
   - Nested branch navigation
   - URL resume flow
   - "Revisit alternate paths" CTA trigger

### Phase 5: Playwright Tests
- Full walkthrough with branching on sample view (flag on)
- Linear walkthrough with branching disabled (flag off)
- URL sharing and resume
- Keyboard-only navigation
- Recorded video/gif for PR reviewers

## 4. Implementation Outline (5-Day Plan)

### Day 1: Extract Types & Setup Module Structure
**Files to create:**
```
packages/diagram/src/likec4diagram/state/walkthrough/
├── index.ts                    (Public exports)
├── types.ts                    (All TypeScript types)
└── __tests__/                  (Test directory)
```

**Tasks:**
1. Create directory structure per ADR-006
2. Define all types in `types.ts`:
   - `BranchContext` (with depth field)
   - `ActiveWalkthrough` (discriminated union: linear | branch)
   - `WalkthroughContext` (machine context)
   - `NavigateAction` (discriminated union: next | previous | jumpToBranch | selectPath | jumpToStep)
   - `NavigateEvent` (event with action payload)
   - `WalkthroughEvents` (all event types)
3. Update imports in `diagram-machine.ts` to use new types
4. No functional changes (types only)

### Day 2: Extract Logic Modules + Unit Tests
**Files to create:**
```
state/walkthrough/
├── navigation.ts               (ADR-002: Just-in-time navigation)
├── completion.ts               (ADR-003: CompletionTracker class)
├── url-state.ts                (ADR-004: URL parsing/serialization)
├── progress.ts                 (ADR-002: Progress calculation)
└── __tests__/
    ├── navigation.spec.ts
    ├── completion.spec.ts
    ├── url-state.spec.ts
    └── progress.spec.ts
```

**Tasks:**
1. Implement `navigation.ts`:
   - `computeNextStep()` with NavigationResult return type
   - `computePreviousStep()`
   - Helper functions: `findNextStepInPath()`, `findStepAfterBranch()`, etc.
2. Implement `completion.ts`:
   - `CompletionTracker` class with localStorage persistence
   - `markPathCompleted()`, `shouldShowRevisitCTA()`, `isBranchFullyCompleted()`
   - Set serialization/deserialization
3. Implement `url-state.ts`:
   - `parseWalkthroughURL()`, `buildWalkthroughURL()`, `validateWalkthroughURL()`
   - Hash-based format: `#walkthrough=step-01&branch=br-auth:1,br-nested:0`
4. Implement `progress.ts`:
   - `calculateProgress()` returning ProgressInfo
   - Linear vs branch mode calculation
5. Write comprehensive unit tests for each module (TDD approach)

### Day 3: Create Walkthrough Child Machine + Integration Tests
**Files to create:**
```
state/walkthrough/
├── walkthrough-machine.ts      (XState child machine)
└── __tests__/
    ├── walkthrough-machine.spec.ts
    └── integration.spec.ts
```

**Tasks:**
1. Create `walkthrough-machine.ts`:
   - Define machine with XState v5 `setup()`
   - States: idle, active.navigating, active.branchDecision
   - Events: All from ADR-001
   - Actions: Use navigation.ts, completion.ts functions
   - Guards: Branch decision checks
2. Update `diagram-machine.ts`:
   - Import `walkthroughMachineLogic`
   - Add to actors configuration
   - Spawn as child actor in entry action
   - Forward `walkthrough.*` events to child with `sendTo()`
3. Maintain backward compatibility:
   - Map old events (`walkthrough.step`) to new format
   - Keep existing `activeWalkthrough` context sync
4. Write state machine tests (XState testing patterns)
5. Write integration tests (parent-child communication)

### Day 4: Implement React Hooks + Tests
**Files to create:**
```
packages/diagram/src/hooks/walkthrough/
├── index.ts
├── useWalkthrough.ts
├── useWalkthroughActions.ts
├── useWalkthroughCompletion.ts
├── useBranchSelection.ts
├── useWalkthroughURL.ts
└── __tests__/
    ├── useWalkthrough.spec.tsx
    ├── useWalkthroughActions.spec.tsx
    ├── useWalkthroughCompletion.spec.tsx
    ├── useBranchSelection.spec.tsx
    └── useWalkthroughURL.spec.tsx
```

**Tasks:**
1. Implement all 5 hooks per ADR-005:
   - Use `useSelector` from `@xstate/react` for fine-grained subscriptions
   - Use `useActor` for actions
   - Memoize callbacks and computed values
2. Update existing `useDiagram.ts`:
   - Keep `startWalkthrough()`, `walkthroughStep()`, `stopWalkthrough()` for backward compatibility
   - Optionally add new convenience methods
3. Write React Testing Library tests for each hook
4. Test re-render optimization (verify components only update when needed)

### Day 5: Build UI Components + E2E Tests
**Files to create/update:**
```
packages/diagram/src/navigationpanel/walkthrough/
├── WalkthroughProgress.tsx     (Enhanced progress display)
├── BranchSelector.tsx          (New: Path selection UI)
├── ResumePrompt.tsx            (New: URL resume UI)
└── __tests__/
    ├── WalkthroughProgress.spec.tsx
    ├── BranchSelector.spec.tsx
    └── ResumePrompt.spec.tsx
```

**Tasks:**
1. Enhance existing `ActiveWalkthroughControls.tsx`:
   - Use new hooks
   - Display branch context (path X of Y)
   - Show nested branch depth
2. Create `WalkthroughProgress.tsx`:
   - Linear mode: "Step 5 of 12"
   - Branch mode: "Branch: auth | Path 2 of 3 | Step 4 of 7"
3. Create `BranchSelector.tsx`:
   - Display when at branch decision point
   - Show path options with completion status
   - Keyboard navigation (1, 2, 3 for paths)
4. Create `ResumePrompt.tsx`:
   - Parse URL on mount
   - Show "Resume at step X?" prompt
   - Handle invalid URLs gracefully
5. Add "revisit alternate paths" CTA logic
6. Write component tests
7. Create Playwright E2E tests for full flows

## 5. Documents & Artifacts to Update

### Architecture Decision Records (ADRs/)
- ✅ **ADR-001**: Event Signatures - Unified navigate event
- ✅ **ADR-002**: Step Linearization - Just-in-time computation
- ✅ **ADR-003**: Completion Tracking - localStorage hierarchical
- ✅ **ADR-004**: URL Persistence - Hash-based format
- ✅ **ADR-005**: Hook APIs - Five granular hooks
- ✅ **ADR-006**: Module Architecture - Child actor pattern
- ✅ **INDEX.md**: Complete summary and implementation plan

### Supporting Documentation
- ✅ **STEP-ID-STABILITY-AND-CODE-ORGANIZATION.md**: Technical investigation, confirmed stepIDs are position-based
- ✅ **EXISTING-IMPLEMENTATION-AND-PACKAGE-RESEARCH.md**: Current state analysis, XState confirmed
- ✅ **DEEP-RESEARCH-PROMPT.md**: Optional external research prompt

### External Documentation (To Update During/After Implementation)
- `upstream/APPROACH_UNIFIED_BRANCHING_REWORK.md` - Log implementation progress and questions
- `apps/docs/src/content/docs/tooling/react.mdx` - Document five new hooks with examples
- `CHANGELOG.md` - Add walkthrough enhancements section
- `apps/playground` demo script - Add branch navigation examples

### Code Documentation
- Add JSDoc comments to all public APIs
- Document event flow in walkthrough-machine.ts
- Add usage examples in hook files
- Document CompletionTracker localStorage schema

## 6. Definition of Done

### Code Quality
- ✅ All modules have comprehensive unit tests (80%+ coverage)
- ✅ State machine tests cover all event transitions
- ✅ Hook tests verify re-render optimization
- ✅ Integration tests pass for parent-child actor communication
- ✅ E2E Playwright tests cover all user scenarios
- ✅ Tests pass with both feature flag states (on/off)
- ✅ TypeScript strict mode: no errors, full type safety
- ✅ ESLint/Prettier: clean, no warnings

### Functionality
- ✅ Linear walkthrough still works (backward compatibility)
- ✅ Branch navigation: auto-follow default paths
- ✅ Branch navigation: pause at branches without defaults
- ✅ Path selection UI functional with keyboard support
- ✅ Parallel branches iterate sequentially
- ✅ Nested branches navigate correctly (up to 3 levels tested)
- ✅ Completion tracking persists to localStorage
- ✅ "Revisit alternate paths" CTA appears correctly
- ✅ URL state: shareable links work
- ✅ URL state: invalid URLs handled gracefully with error message
- ✅ Progress indicators adapt to linear vs branch mode
- ✅ Keyboard navigation: arrow keys, number keys, escape

### Performance
- ✅ Components only re-render when their subscribed state changes
- ✅ Navigation is responsive (<100ms for step transitions)
- ✅ No memory leaks from child actor or subscriptions
- ✅ localStorage operations don't block UI

### Documentation
- ✅ All ADRs complete and consistent with implementation
- ✅ README updated with implementation details
- ✅ Hook APIs documented with JSDoc and usage examples
- ✅ React docs updated (apps/docs)
- ✅ CHANGELOG draft prepared

### Deliverables
- ✅ Recorded video/gif demonstrating branch navigation
- ✅ Screenshots of new UI components
- ✅ Code review checklist completed
- ✅ No regressions in existing diagram events (verified via snapshot)
- ✅ Accessibility review notes captured (keyboard nav, screen readers)

## 7. Dependencies & Follow-Up

### Dependencies
- **Depends on:** PR03 (feat/sequence-layout-updates) merged ✅
  - Provides: `branchTrail` metadata in step edges
  - Provides: Branch metadata in computed views
  - Status: Complete, PR #2334 submitted

### Technical Foundation
- **XState v5.23.0** - Already installed ✅
- **@xstate/react v6.0.0** - Already installed ✅
- **Existing walkthrough** - Basic linear implementation exists ✅
- **Step ID format** - Position-based, confirmed stable enough ✅

### Enables Future Work
- **PR05 (UI Polish)**: Leverage new contexts for visual controls and animations
  - BranchContext enables rich branch visualizations
  - Completion state enables progress indicators
  - URL state enables shareable tour links
- **PR06 (Documentation Migration)**: Examples for new hook APIs
- **PR07 (Quality Gate & Telemetry)**: Analytics for branch navigation patterns
  - Track which paths users explore
  - Measure completion rates
  - Identify confusing branches

### Follow-Up Actions
1. **Gather UX feedback** on branch navigation flow
   - Does auto-follow default feel right?
   - Is path selection UI intuitive?
   - Should we show "preview" of paths before selection?
2. **Performance monitoring** in production
   - Check localStorage size growth
   - Monitor navigation response times
   - Verify no memory leaks from actors
3. **Accessibility audit**
   - Screen reader testing with branch navigation
   - Keyboard-only workflow verification
   - Focus management in modals/prompts
4. **Potential extraction** to `@likec4/walkthrough` package
   - Generic walkthrough library for other projects
   - Contribute patterns to XState community
   - Blog post about state machine walkthroughs

### Known Limitations (Documented)
- **Step ID stability**: URLs break when steps are reordered (acceptable, documented in ADR-004)
- **Browser compatibility**: localStorage required (fallback: in-memory only)
- **Nested branch depth**: Tested to 3 levels, deeper nesting may need optimization
- **Step count estimation**: Cannot pre-compute total steps with branching (by design)
