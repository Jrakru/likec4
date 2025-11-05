# Implementation Prompt: Complete PR04 Walkthrough State Machine

## Context

You are completing the PR04 walkthrough state machine implementation for LikeC4. The **core module is already implemented** (navigation, completion, URL state, progress) with passing tests. Your task is to complete the **React hooks layer**, **child actor integration**, and **enhanced UI components** to enable branching walkthrough features.

**Current Branch:** `feat/walkthrough-state-machine`  
**Completion Status:** ~60% complete (core module done, integration layer missing)  
**Estimated Effort:** 8-12 days

---

## What's Already Done ✅

1. **Core Walkthrough Module** (`packages/diagram/src/likec4diagram/state/walkthrough/`)
   - `types.ts` - Complete type system with discriminated unions
   - `navigation.ts` - `computeNextStep()` and `computePreviousStep()` logic
   - `completion.ts` - `CompletionTracker` class with localStorage
   - `url-state.ts` - Hash-based URL parsing/building/validation
   - `progress.ts` - Progress calculation utilities
   - `walkthrough-machine.ts` - XState v5 state machine (315 lines)
   - `__tests__/` - 4 test suites, 8 passing tests

2. **Design Documentation** (`upstream/PR04-walkthrough-state-machine/`)
   - ADR-001: Event Signatures (discriminated actions)
   - ADR-002: Navigation Logic (just-in-time computation)
   - ADR-003: Completion Tracking (localStorage, nested branches)
   - ADR-004: URL Persistence (hash format)
   - ADR-005: Hook APIs (5 granular hooks - NOT IMPLEMENTED)
   - ADR-006: Module Architecture (child actor pattern - NOT INTEGRATED)

3. **Existing Infrastructure**
   - `useDiagram()` hook with basic walkthrough methods
   - Basic UI controls in `navigationpanel/walkthrough/`
   - XState v5.23.0 already installed
   - @xstate/react v6.0.0 already installed

---

## Your Tasks

### Task 1: Implement React Hooks (ADR-005) ⚠️ CRITICAL

**Priority:** P0 - Blocking  
**Effort:** 2-3 days  
**Location:** `packages/diagram/src/hooks/walkthrough/`

Create 5 granular hooks for optimal re-rendering:

#### 1.1 `useWalkthrough.ts`
```typescript
/**
 * Main walkthrough state hook
 * Returns current walkthrough state (read-only)
 */
export function useWalkthrough() {
  const actor = useDiagramActorRef()
  
  return useXstateSelector(actor, (snapshot) => {
    const walkthroughSnapshot = snapshot.context.walkthroughRef?.getSnapshot()
    if (!walkthroughSnapshot) {
      return {
        isActive: false,
        currentStep: null,
        mode: null,
        branchContext: null,
        progress: null,
      }
    }
    
    return {
      isActive: true,
      currentStep: walkthroughSnapshot.context.activeWalkthrough,
      mode: walkthroughSnapshot.context.activeWalkthrough?.type ?? 'linear',
      branchContext: walkthroughSnapshot.context.activeWalkthrough?.type === 'branch'
        ? walkthroughSnapshot.context.activeWalkthrough.context
        : null,
      progress: calculateProgress(walkthroughSnapshot.context),
    }
  }, shallowEqual)
}
```

**Returns:**
- `isActive: boolean`
- `currentStep: WalkthroughStep | null`
- `mode: 'linear' | 'branch' | null`
- `branchContext: BranchContext | null`
- `progress: { current: number, total: number, percentage: number } | null`

#### 1.2 `useWalkthroughActions.ts`
```typescript
/**
 * Walkthrough action hooks (memoized callbacks)
 * Send events to walkthrough actor
 */
export function useWalkthroughActions() {
  const actor = useDiagramActorRef()
  
  return useMemo(() => ({
    start: (stepId?: StepEdgeId, branchChain?: BranchContextChain) => {
      actor.send({ type: 'walkthrough.start', stepId, branchChain })
    },
    stop: () => {
      actor.send({ type: 'walkthrough.stop' })
    },
    navigate: (action: NavigateAction) => {
      actor.send({ type: 'walkthrough.navigate', action })
    },
    next: () => {
      actor.send({ type: 'walkthrough.navigate', action: { type: 'next' } })
    },
    previous: () => {
      actor.send({ type: 'walkthrough.navigate', action: { type: 'previous' } })
    },
    jumpToStep: (stepId: StepEdgeId) => {
      actor.send({ type: 'walkthrough.navigate', action: { type: 'jumpToStep', stepId } })
    },
    jumpToBranch: (branchId: string) => {
      actor.send({ type: 'walkthrough.navigate', action: { type: 'jumpToBranch', branchId } })
    },
    selectPath: (pathIndex: number) => {
      actor.send({ type: 'walkthrough.navigate', action: { type: 'selectPath', pathIndex } })
    },
  }), [actor])
}
```

#### 1.3 `useWalkthroughCompletion.ts`
```typescript
/**
 * Completion tracking hook
 * Subscribes to CompletionTracker
 */
export function useWalkthroughCompletion() {
  const actor = useDiagramActorRef()
  const [completionState, setCompletionState] = useState<CompletionState | null>(null)
  
  useEffect(() => {
    const walkthroughRef = actor.getSnapshot().context.walkthroughRef
    if (!walkthroughRef) return
    
    const walkthroughSnapshot = walkthroughRef.getSnapshot()
    const tracker = walkthroughSnapshot.context.completionTracker
    if (!tracker) return
    
    // Subscribe to completion tracker
    const unsubscribe = tracker.subscribe((state) => {
      setCompletionState(state)
    })
    
    // Initialize
    setCompletionState(tracker.getState())
    
    return unsubscribe
  }, [actor])
  
  return useMemo(() => ({
    completionState,
    isPathCompleted: (branchId: string, pathIndex: number) => {
      const branch = completionState?.branches.get(branchId)
      return branch?.completedPaths.has(pathIndex) ?? false
    },
    isBranchFullyCompleted: (branchId: string) => {
      const branch = completionState?.branches.get(branchId)
      if (!branch) return false
      return branch.completedPaths.size === branch.totalPaths
    },
    shouldShowRevisitCTA: (branchId: string) => {
      const branch = completionState?.branches.get(branchId)
      if (!branch) return false
      return branch.visitedPaths.size > 0 && branch.completedPaths.size < branch.totalPaths
    },
    getUnvisitedPaths: (branchId: string) => {
      const branch = completionState?.branches.get(branchId)
      if (!branch) return []
      return Array.from({ length: branch.totalPaths }, (_, i) => i)
        .filter(i => !branch.visitedPaths.has(i))
    },
    reset: () => {
      const walkthroughRef = actor.getSnapshot().context.walkthroughRef
      walkthroughRef?.getSnapshot().context.completionTracker?.reset()
    },
  }), [completionState, actor])
}
```

#### 1.4 `useBranchSelection.ts`
```typescript
/**
 * Branch selection UI state hook
 * Returns branch decision state
 */
export function useBranchSelection() {
  const actor = useDiagramActorRef()
  
  return useXstateSelector(actor, (snapshot) => {
    const walkthroughSnapshot = snapshot.context.walkthroughRef?.getSnapshot()
    if (!walkthroughSnapshot) {
      return {
        isAtBranchDecision: false,
        branchInfo: null,
        selectPath: () => {},
        cancel: () => {},
      }
    }
    
    const pendingDecision = walkthroughSnapshot.context.pendingBranchDecision
    
    return {
      isAtBranchDecision: pendingDecision !== null,
      branchInfo: pendingDecision ? {
        branchId: pendingDecision.branch.branchId,
        label: pendingDecision.branch.label,
        paths: pendingDecision.branch.paths.map(p => ({
          pathIndex: p.pathIndex,
          pathName: p.pathName,
          pathTitle: p.pathTitle,
          isDefault: p.isDefault,
        })),
      } : null,
      selectPath: (pathIndex: number) => {
        actor.send({ type: 'walkthrough.navigate', action: { type: 'selectPath', pathIndex } })
      },
      cancel: () => {
        actor.send({ type: 'walkthrough.cancelBranchSelection' })
      },
    }
  }, shallowEqual)
}
```

#### 1.5 `useWalkthroughURL.ts`
```typescript
/**
 * URL state management hook
 * Handles hash persistence and resume prompts
 */
export function useWalkthroughURL() {
  const actor = useDiagramActorRef()
  const [urlState, setUrlState] = useState<WalkthroughURLState | null>(null)
  
  useEffect(() => {
    // Parse initial hash
    const hash = window.location.hash
    if (hash) {
      const parsed = parseWalkthroughURL(hash)
      setUrlState(parsed)
    }
    
    // Listen to hash changes
    const handleHashChange = () => {
      const hash = window.location.hash
      const parsed = parseWalkthroughURL(hash)
      setUrlState(parsed)
    }
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  
  // Subscribe to walkthrough state changes and update URL
  useEffect(() => {
    const subscription = actor.subscribe((snapshot) => {
      const walkthroughSnapshot = snapshot.context.walkthroughRef?.getSnapshot()
      if (!walkthroughSnapshot) return
      
      const activeWalkthrough = walkthroughSnapshot.context.activeWalkthrough
      if (!activeWalkthrough) return
      
      const newUrlState: WalkthroughURLState = {
        stepId: activeWalkthrough.stepId,
        branchContext: activeWalkthrough.type === 'branch' 
          ? { branches: activeWalkthrough.stack.map(b => ({ branchId: b.branchId, pathIndex: b.pathIndex })) }
          : activeWalkthrough.stack.length > 0
            ? { branches: activeWalkthrough.stack.map(b => ({ branchId: b.branchId, pathIndex: b.pathIndex })) }
            : undefined,
      }
      
      const hash = buildWalkthroughURL(newUrlState)
      if (hash !== window.location.hash) {
        window.history.replaceState(null, '', hash || window.location.pathname)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [actor])
  
  return useMemo(() => ({
    urlState,
    updateURL: (state: WalkthroughURLState) => {
      const hash = buildWalkthroughURL(state)
      window.history.replaceState(null, '', hash || window.location.pathname)
      setUrlState(state)
    },
    resumeFromURL: () => {
      if (!urlState) return
      actor.send({ 
        type: 'walkthrough.start', 
        stepId: urlState.stepId,
        branchChain: urlState.branchContext,
      })
    },
    clearURL: () => {
      window.history.replaceState(null, '', window.location.pathname)
      setUrlState(null)
    },
  }), [urlState, actor])
}
```

**Testing Requirements:**
- Create `__tests__/` directory in `hooks/walkthrough/`
- Unit tests for each hook using `@testing-library/react-hooks`
- Mock `useDiagramActorRef` and XState actor
- Test memoization, subscriptions, cleanup

---

### Task 2: Child Actor Integration (ADR-006) ⚠️ CRITICAL

**Priority:** P0 - Blocking  
**Effort:** 1-2 days  
**Location:** `packages/diagram/src/likec4diagram/state/diagram-machine.ts`

**Goal:** Spawn walkthrough as child actor, remove inline logic, reduce file from 1442 to <1000 lines.

#### 2.1 Import Walkthrough Machine
```typescript
// Add to imports (around line 80)
import { walkthroughMachine } from './walkthrough'
import type { WalkthroughInput, WalkthroughEvents } from './walkthrough/types'
```

#### 2.2 Add Actor Definition
```typescript
// In setup() actors object
const diagramMachine = setup({
  types: {
    // ... existing types
  },
  actors: {
    overlays: overlaysActorLogic,
    search: searchActorLogic,
    hotkey: hotkeyActorLogic,
    syncManualLayout: syncManualLayoutActorLogic,
    walkthrough: walkthroughMachine, // ADD THIS
  },
  // ... rest
})
```

#### 2.3 Update Context Type
```typescript
// In DiagramContext interface (around line 140)
export interface DiagramContext {
  // ... existing fields
  
  // REPLACE this:
  // activeWalkthrough: null | {
  //   stepId: StepEdgeId
  //   parallelPrefix?: string
  //   branchTrail: readonly ComputedBranchTrailEntry[] | null
  // }
  
  // WITH this:
  walkthroughRef: ActorRef<typeof walkthroughMachine> | null
}
```

#### 2.4 Spawn Child Actor
```typescript
// In dynamicView state (around line 800-900)
states: {
  dynamicView: {
    entry: [
      // ... existing entries
      spawnChild('walkthrough', {
        id: 'walkthrough',
        systemId: 'walkthrough',
        input: ({ context }) => ({
          steps: context.xyedges.filter(isSequenceEdge),
          branchCollections: context.view?.rules?.dynamicView?.branchCollections,
          diagramId: context.viewId,
        } satisfies WalkthroughInput),
      }),
      assign({
        walkthroughRef: ({ spawn }) => spawn('walkthrough', { id: 'walkthrough' })
      }),
    ],
    exit: [
      stopChild('walkthrough'),
      assign({ walkthroughRef: null }),
    ],
    on: {
      // Forward walkthrough events to child
      'walkthrough.start': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
      'walkthrough.navigate': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
      'walkthrough.stop': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
      'walkthrough.end': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
      'walkthrough.cancelBranchSelection': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
      'walkthrough.updateData': {
        actions: sendTo('walkthrough', ({ event }) => event),
      },
    },
  },
}
```

#### 2.5 Remove Old Inline Logic
**Delete/refactor these sections:**
- Line 141-145: Old `activeWalkthrough` context field
- Line 151-152: `getBranchTrail()` helper (move to walkthrough module if needed)
- Line 191-193: Old walkthrough events (replaced by forwarding)
- Line 591: `'update active walkthrough'` action (no longer needed)
- Line 743: `activeWalkthrough: null` initialization
- Line 877+: `'walkthrough.start'` inline handler
- Line 1021+: Inline walkthrough logic
- Line 1111+: `activeWalkthrough` assignment logic

**Update references:**
- Search for `context.activeWalkthrough` → replace with `context.walkthroughRef?.getSnapshot().context.activeWalkthrough`
- Search for `event.type === 'walkthrough.` → ensure forwarding to child

#### 2.6 Update `useDiagram.ts`
Update the old API to use new hooks internally:
```typescript
// useDiagram.ts - UPDATE these methods:
startWalkthrough: () => {
  // OLD: actor.send({ type: 'walkthrough.start' })
  actor.send({ type: 'walkthrough.start' }) // Still forwards to child
},
walkthroughStep: (direction: 'next' | 'previous' = 'next') => {
  // OLD: actor.send({ type: 'walkthrough.step', direction })
  actor.send({ 
    type: 'walkthrough.navigate', 
    action: { type: direction === 'next' ? 'next' : 'previous' } 
  })
},
stopWalkthrough: () => {
  // OLD: actor.send({ type: 'walkthrough.end' })
  actor.send({ type: 'walkthrough.stop' })
},
```

**Testing Requirements:**
- Update `diagram-machine.spec.ts` (if exists) with child actor tests
- Create `walkthrough/__tests__/integration.spec.ts` for parent-child communication
- Test event forwarding (start → child receives → navigates)
- Test cleanup (stopChild on exit)
- Verify line count: `wc -l diagram-machine.ts` should be <1000

---

### Task 3: Enhanced UI Components ⚠️ CRITICAL

**Priority:** P0 - Blocking  
**Effort:** 2-3 days  
**Location:** `packages/diagram/src/navigationpanel/walkthrough/`

#### 3.1 Create `WalkthroughProgress.tsx`
**Purpose:** Display breadcrumbs and progress counters

```tsx
import { useWalkthrough } from '../../hooks/walkthrough'

export function WalkthroughProgress() {
  const { isActive, branchContext, progress } = useWalkthrough()
  
  if (!isActive || !progress) return null
  
  return (
    <Box>
      {/* Breadcrumb trail for nested branches */}
      {branchContext && branchContext.depth > 0 && (
        <Box className="breadcrumb-trail">
          {/* Show branch ancestry: Root > Auth Branch > MFA Branch */}
          {renderBreadcrumbs(branchContext)}
        </Box>
      )}
      
      {/* Progress counters */}
      <Text size="sm">
        {branchContext 
          ? `Path ${branchContext.pathIndex + 1} of ${branchContext.pathCount}, Step ${progress.current} of ${progress.total}`
          : `Step ${progress.current} of ${progress.total}`
        }
      </Text>
      
      {/* Progress bar */}
      <Progress value={progress.percentage} />
    </Box>
  )
}
```

#### 3.2 Create `BranchSelector.tsx`
**Purpose:** Path selection UI (dropdown + keyboard)

```tsx
import { useBranchSelection } from '../../hooks/walkthrough'

export function BranchSelector() {
  const { isAtBranchDecision, branchInfo, selectPath, cancel } = useBranchSelection()
  
  if (!isAtBranchDecision || !branchInfo) return null
  
  return (
    <Modal opened onClose={cancel}>
      <Text size="lg" fw={600}>{branchInfo.label || 'Choose a path'}</Text>
      
      <Stack gap="sm" mt="md">
        {branchInfo.paths.map((path, idx) => (
          <Button
            key={path.pathIndex}
            onClick={() => selectPath(path.pathIndex)}
            variant={path.isDefault ? 'filled' : 'light'}
            leftSection={<Text fw={700}>{idx + 1}</Text>}
          >
            {path.pathTitle || path.pathName || `Path ${idx + 1}`}
            {path.isDefault && <Badge ml="auto">Default</Badge>}
          </Button>
        ))}
      </Stack>
      
      {/* Keyboard hint */}
      <Text size="xs" c="dimmed" mt="md">
        Press 1-{branchInfo.paths.length} to select, Esc to cancel
      </Text>
    </Modal>
  )
}

// Add keyboard handler
useEffect(() => {
  if (!isAtBranchDecision) return
  
  const handleKeyDown = (e: KeyboardEvent) => {
    const num = parseInt(e.key)
    if (num >= 1 && num <= branchInfo.paths.length) {
      selectPath(num - 1)
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isAtBranchDecision, branchInfo, selectPath])
```

#### 3.3 Create `ResumePrompt.tsx`
**Purpose:** "Resume at step X?" prompt on page load

```tsx
import { useWalkthroughURL } from '../../hooks/walkthrough'

export function ResumePrompt() {
  const { urlState, resumeFromURL, clearURL } = useWalkthroughURL()
  const [dismissed, setDismissed] = useState(false)
  
  if (!urlState || dismissed) return null
  
  return (
    <Notification
      title="Resume Walkthrough?"
      onClose={() => {
        clearURL()
        setDismissed(true)
      }}
    >
      <Text size="sm">
        Continue from step: <Code>{urlState.stepId}</Code>
      </Text>
      <Group mt="sm">
        <Button size="xs" onClick={() => {
          resumeFromURL()
          setDismissed(true)
        }}>
          Resume
        </Button>
        <Button size="xs" variant="subtle" onClick={() => {
          clearURL()
          setDismissed(true)
        }}>
          Start Fresh
        </Button>
      </Group>
    </Notification>
  )
}
```

#### 3.4 Create `AlternatePathsCTA.tsx`
**Purpose:** "Revisit alternate paths" call-to-action

```tsx
import { useWalkthroughCompletion, useWalkthroughActions } from '../../hooks/walkthrough'

export function AlternatePathsCTA() {
  const { completionState, shouldShowRevisitCTA, getUnvisitedPaths } = useWalkthroughCompletion()
  const { jumpToBranch } = useWalkthroughActions()
  const [dismissed, setDismissed] = useState(false)
  
  // Find branches with unvisited paths
  const branchesWithUnvisited = useMemo(() => {
    if (!completionState) return []
    return Array.from(completionState.branches.entries())
      .filter(([branchId]) => shouldShowRevisitCTA(branchId))
      .map(([branchId, branch]) => ({
        branchId,
        unvisitedCount: branch.totalPaths - branch.visitedPaths.size,
      }))
  }, [completionState, shouldShowRevisitCTA])
  
  if (branchesWithUnvisited.length === 0 || dismissed) return null
  
  return (
    <Alert
      color="blue"
      title="Explore Alternate Paths"
      onClose={() => setDismissed(true)}
    >
      <Text size="sm">
        You have {branchesWithUnvisited.length} branch{branchesWithUnvisited.length > 1 ? 'es' : ''} with unexplored paths.
      </Text>
      <Group mt="sm">
        {branchesWithUnvisited.map(({ branchId, unvisitedCount }) => (
          <Button
            key={branchId}
            size="xs"
            variant="light"
            onClick={() => {
              jumpToBranch(branchId)
              setDismissed(true)
            }}
          >
            {branchId} ({unvisitedCount} path{unvisitedCount > 1 ? 's' : ''})
          </Button>
        ))}
      </Group>
    </Alert>
  )
}
```

#### 3.5 Update `ActiveWalkthroughControls.tsx`
**Enhance existing component:**

```tsx
// REPLACE old useDiagram methods:
// OLD: diagram.walkthroughStep('next')
// NEW: Use hooks
const { next, previous } = useWalkthroughActions()
const { isActive, currentStep, progress } = useWalkthrough()

// Add new components
return (
  <>
    {/* Existing controls */}
    <ActiveWalkthroughControls />
    
    {/* NEW: Add these */}
    <WalkthroughProgress />
    <BranchSelector />
    <ResumePrompt />
    <AlternatePathsCTA />
  </>
)
```

**Testing Requirements:**
- Component tests with `@testing-library/react`
- Mock hooks using `vi.mock()`
- Test keyboard navigation (number keys, arrows, Esc)
- Test ARIA labels for accessibility
- Screenshot tests with Playwright (optional)

---

### Task 4: Additional Tests ⚠️ IMPORTANT

**Priority:** P1 - Important  
**Effort:** 1-2 days

#### 4.1 State Machine Tests
Create `walkthrough/__tests__/walkthrough-machine.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createActor } from 'xstate'
import { walkthroughMachine } from '../walkthrough-machine'

describe('walkthroughMachine', () => {
  it('should start walkthrough and navigate', () => {
    const actor = createActor(walkthroughMachine, {
      input: { /* mock data */ }
    })
    actor.start()
    
    actor.send({ type: 'walkthrough.start' })
    expect(actor.getSnapshot().value).toBe('active')
    
    actor.send({ type: 'walkthrough.navigate', action: { type: 'next' } })
    // Assert state changes
  })
  
  it('should handle branch decisions', () => {
    // Test pausing at branch without default
  })
  
  it('should auto-follow default paths', () => {
    // Test auto-navigation on 'next'
  })
})
```

#### 4.2 Integration Tests
Create `walkthrough/__tests__/integration.spec.ts`:

```typescript
describe('diagram-machine + walkthrough integration', () => {
  it('should spawn walkthrough child actor', () => {
    // Test that walkthrough actor is spawned on dynamicView entry
  })
  
  it('should forward events to walkthrough child', () => {
    // Send walkthrough.start to parent, verify child receives it
  })
  
  it('should cleanup walkthrough on exit', () => {
    // Test stopChild is called
  })
})
```

#### 4.3 E2E Tests (Playwright)
Create `e2e/tests/walkthrough-branching.spec.ts`:

```typescript
test('linear walkthrough navigation', async ({ page }) => {
  await page.goto('/dynamic-view')
  await page.click('[data-testid="start-walkthrough"]')
  await page.click('[data-testid="walkthrough-next"]')
  // Assert step counter changes
})

test('branch path selection', async ({ page }) => {
  // Navigate to branch decision
  // Assert modal appears
  // Click path selection
  // Assert navigation continues
})

test('URL persistence and resume', async ({ page }) => {
  // Start walkthrough, navigate to step 3
  // Reload page
  // Assert resume prompt appears
  // Click resume
  // Assert walkthrough resumes at step 3
})
```

---

## Success Criteria

### Definition of Done ✅

- [ ] All 5 React hooks implemented and exported from `hooks/walkthrough/index.ts`
- [ ] Child actor spawning in diagram-machine.ts
- [ ] diagram-machine.ts reduced to <1000 lines
- [ ] 4 new UI components (Progress, BranchSelector, ResumePrompt, AlternatePathsCTA)
- [ ] All existing tests still pass (current 8 tests)
- [ ] New tests added:
  - [ ] Hook unit tests (5 files, ~15-20 tests)
  - [ ] State machine tests (~10 tests)
  - [ ] Integration tests (~5 tests)
  - [ ] E2E tests (~5 scenarios)
- [ ] No TypeScript errors
- [ ] Test coverage >80% for new code
- [ ] Keyboard navigation working (number keys for paths, arrows for next/prev)
- [ ] ARIA labels on all interactive elements
- [ ] URL persistence working (resume prompt appears)
- [ ] Completion tracking CTA appears after branch exit

### Verification Commands

```bash
# Run tests
pnpm test --filter=@likec4/diagram

# Check line count
wc -l packages/diagram/src/likec4diagram/state/diagram-machine.ts

# Type check
pnpm typecheck

# E2E tests
pnpm test:e2e

# Coverage
pnpm test --coverage
```

---

## Important Notes

### XState v5 Patterns to Follow

1. **Use `useSelector` for fine-grained subscriptions:**
   ```typescript
   const value = useXstateSelector(actor, selector, equality)
   ```

2. **Memoize callbacks with `useMemo`:**
   ```typescript
   const actions = useMemo(() => ({ next: () => ... }), [actor])
   ```

3. **Child actors are refs, not snapshots:**
   ```typescript
   const walkthroughRef = context.walkthroughRef // ActorRef
   const snapshot = walkthroughRef.getSnapshot() // Snapshot
   ```

4. **Use `sendTo` for parent-child communication:**
   ```typescript
   actions: sendTo('walkthrough', ({ event }) => event)
   ```

### Existing Patterns to Follow

1. **Look at overlay/search/hotkey actors for child actor examples**
2. **Use `useMantinePortalProps()` for portal rendering**
3. **Follow Mantine UI component patterns**
4. **Use `css()` from `@likec4/styles/css` for styling**
5. **Import from `@likec4/styles/jsx` for Box/Stack/etc**

### Common Pitfalls to Avoid

1. ❌ Don't access `walkthroughRef` directly in render - use hooks
2. ❌ Don't create circular dependencies between hooks
3. ❌ Don't forget to cleanup subscriptions in `useEffect`
4. ❌ Don't mutate XState context - return new objects
5. ❌ Don't forget `shallowEqual` in `useSelector` for object returns

---

## Questions?

Refer to:
- `upstream/PR04-walkthrough-state-machine/ADRs/` - All design decisions
- `upstream/PR04-walkthrough-state-machine/README.md` - Full specification
- `upstream/PR04-walkthrough-state-machine/QA-REPORT.md` - Current status
- Existing code in `state/overlays/overlaysActor.ts` - Child actor example
- Existing code in `hooks/useSearchActor.ts` - Hook pattern example

**You've got this! The hard part (core logic) is done. Now connect it to React and watch it shine! 🚀**
