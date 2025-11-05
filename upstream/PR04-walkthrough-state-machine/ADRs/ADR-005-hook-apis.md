# ADR-005: Hook API Signatures

**Status:** 🔄 IN PROGRESS  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

From the PR04 README, we need React hooks to:
1. Access walkthrough state
2. Trigger navigation actions
3. Subscribe to progress updates
4. Handle branch selection UI

These hooks will be the primary API for React components to interact with the walkthrough state machine.

## Problem

What should the hook API surface look like? We need to design:
- Hook names and purposes
- Return value structures
- Parameter signatures
- Integration with XState
- TypeScript types for maximum type safety

Key considerations:
1. **Developer Experience:** Should be intuitive and follow React conventions
2. **Performance:** Avoid unnecessary re-renders
3. **Composability:** Can hooks be combined for complex UIs?
4. **Type Safety:** Full TypeScript inference
5. **XState Integration:** Should we expose XState concepts or abstract them?

## Proposed Solution

### Option A: Granular Hooks (Recommended)

Separate hooks for different concerns:

```typescript
// 1. Main walkthrough state hook
function useWalkthrough(): {
  isActive: boolean
  currentStep: string | null
  mode: 'linear' | 'branch' | null
  branchContext: BranchContext | null
  progress: ProgressInfo
  canNavigateNext: boolean
  canNavigatePrevious: boolean
}

// 2. Navigation actions hook
function useWalkthroughActions(): {
  start: () => void
  stop: () => void
  navigate: (action: NavigateAction) => void
  // Convenience methods
  next: () => void
  previous: () => void
  jumpToStep: (stepId: string) => void
  jumpToBranch: (branchId: string) => void
  selectPath: (pathIndex: number) => void
}

// 3. Completion tracking hook
function useWalkthroughCompletion(): {
  completionState: CompletionState
  isPathCompleted: (branchId: string, pathIndex: number) => boolean
  isBranchFullyCompleted: (branchId: string) => boolean
  shouldShowRevisitCTA: (branchId: string) => boolean
  getUnvisitedPaths: (branchId: string) => number[]
  reset: () => void
}

// 4. Branch selection UI hook
function useBranchSelection(): {
  isAtBranchDecision: boolean
  branchInfo: BranchInfo | null
  selectPath: (pathIndex: number) => void
  cancel: () => void  // Exit branch selection mode
}

// 5. URL state sync hook
function useWalkthroughURL(): {
  urlState: WalkthroughURLState | null
  updateURL: (state: WalkthroughURLState) => void
  resumeFromURL: () => void
}
```

**Pros:**
- Clear separation of concerns
- Can use only what you need (performance)
- Easy to test individual hooks
- Follows React conventions (useX pattern)
- Granular re-renders

**Cons:**
- More hooks to learn
- Need to import multiple hooks for complex UIs
- Potential for stale closures if not careful

### Option B: Single Comprehensive Hook

One hook returns everything:

```typescript
function useWalkthrough(): {
  // State
  state: {
    isActive: boolean
    currentStep: string | null
    mode: 'linear' | 'branch' | null
    branchContext: BranchContext | null
    progress: ProgressInfo
    completion: CompletionState
  }
  
  // Actions
  actions: {
    start: () => void
    stop: () => void
    navigate: (action: NavigateAction) => void
    next: () => void
    previous: () => void
    jumpToStep: (stepId: string) => void
    jumpToBranch: (branchId: string) => void
    selectPath: (pathIndex: number) => void
  }
  
  // Computed
  computed: {
    canNavigateNext: boolean
    canNavigatePrevious: boolean
    isAtBranchDecision: boolean
    branchInfo: BranchInfo | null
    shouldShowRevisitCTA: (branchId: string) => boolean
  }
  
  // URL
  url: {
    urlState: WalkthroughURLState | null
    resumeFromURL: () => void
  }
}
```

**Pros:**
- Single import
- All functionality in one place
- Easier to discover features
- Consistent API surface

**Cons:**
- Re-renders on any state change (performance issue)
- Large return object (harder to type)
- Mixes concerns
- Not composable

### Option C: Hybrid with Selectors

Main hook + selector pattern:

```typescript
// Main hook with selector
function useWalkthrough<T>(selector: (state: WalkthroughState) => T): T

// Pre-built selectors
const selectors = {
  isActive: (state) => state.isActive,
  currentStep: (state) => state.currentStep,
  progress: (state) => state.progress,
  // ... etc
}

// Actions hook
function useWalkthroughActions(): { /* same as Option A */ }

// Usage
const isActive = useWalkthrough(selectors.isActive)
const progress = useWalkthrough(selectors.progress)
const actions = useWalkthroughActions()
```

**Pros:**
- Optimal performance (fine-grained subscriptions)
- Flexible selection
- Follows Redux/Zustand patterns
- Composable

**Cons:**
- More complex API
- Selector boilerplate
- Learning curve for new users
- Potential for selector memoization issues

### Option D: XState Direct Integration

Expose XState hooks directly:

```typescript
// Use XState's native hooks
import { useSelector, useActor } from '@xstate/react'

// Usage in components
const isActive = useSelector(walkthroughService, state => state.matches('active'))
const send = useActor(walkthroughService)[1]

send({ type: 'walkthrough.navigate', action: { type: 'next' } })
```

**Pros:**
- Leverages XState ecosystem
- No custom hooks needed
- Full XState features available
- Well-documented (XState docs)

**Cons:**
- Exposes state machine internals
- Steeper learning curve
- Less abstraction (implementation details leak)
- Not beginner-friendly

## Decision

**ACCEPTED: Option A - Granular Hooks**

We will provide separate hooks for different concerns, optimized for frequent state changes.

### Key Decisions

1. **Developer Audience:** Primarily internal team
   - Can assume React/XState knowledge
   - Documentation for common patterns
   - Advanced use cases supported

2. **State Change Frequency:** Assume state changes often (every step)
   - Granular hooks prevent unnecessary re-renders
   - Components subscribe only to needed state
   - Performance over simplicity

3. **Complexity vs Performance:** Medium complexity for good performance
   - Balance between ease of use and optimization
   - Clear hook purposes reduce cognitive load
   - Composability enables complex UIs

## Consequences

**Positive:**
- Optimal re-render performance (components only update when their subscribed state changes)
- Clear separation of concerns (each hook has single responsibility)
- Composable (can combine hooks for complex UIs)
- Follows React best practices (useX pattern)
- Easy to test individual hooks in isolation
- Can add new hooks without breaking existing ones

**Negative:**
- Multiple imports needed for complex components
- Need to understand which hook provides which functionality
- Potential for stale closures if dependencies not managed

**Neutral:**
- Requires good documentation with examples
- TypeScript types make API discoverable

## Implementation Notes

### Hook Signatures

```typescript
// ============================================================
// 1. Main Walkthrough State Hook
// ============================================================
interface WalkthroughState {
  isActive: boolean
  currentStep: string | null
  mode: 'linear' | 'branch' | null
  branchContext: BranchContext | null
  progress: ProgressInfo
  canNavigateNext: boolean
  canNavigatePrevious: boolean
}

function useWalkthrough(): WalkthroughState {
  // Use XState's useSelector internally for fine-grained updates
  const isActive = useSelector(service, s => s.matches('walkthrough.active'))
  const currentStep = useSelector(service, s => s.context.activeWalkthrough?.stepId)
  const mode = useSelector(service, s => s.context.activeWalkthrough?.type)
  const branchContext = useSelector(service, s => 
    s.context.activeWalkthrough?.type === 'branch' 
      ? s.context.activeWalkthrough.context 
      : null
  )
  const progress = useSelector(service, s => calculateProgress(s.context))
  const canNavigateNext = useSelector(service, s => canNavigate(s, 'next'))
  const canNavigatePrevious = useSelector(service, s => canNavigate(s, 'previous'))
  
  return {
    isActive,
    currentStep,
    mode,
    branchContext,
    progress,
    canNavigateNext,
    canNavigatePrevious
  }
}

// ============================================================
// 2. Navigation Actions Hook
// ============================================================
interface WalkthroughActions {
  start: () => void
  stop: () => void
  navigate: (action: NavigateAction) => void
  // Convenience methods (call navigate internally)
  next: () => void
  previous: () => void
  jumpToStep: (stepId: string) => void
  jumpToBranch: (branchId: string) => void
  selectPath: (pathIndex: number) => void
}

function useWalkthroughActions(): WalkthroughActions {
  const { send } = useActor(walkthroughService)
  
  return useMemo(() => ({
    start: () => send({ type: 'walkthrough.start' }),
    stop: () => send({ type: 'walkthrough.stop' }),
    navigate: (action: NavigateAction) => 
      send({ type: 'walkthrough.navigate', action }),
    
    // Convenience methods
    next: () => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'next' } 
    }),
    previous: () => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'previous' } 
    }),
    jumpToStep: (stepId: string) => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'jumpToStep', stepId } 
    }),
    jumpToBranch: (branchId: string) => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'jumpToBranch', branchId } 
    }),
    selectPath: (pathIndex: number) => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'selectPath', pathIndex } 
    })
  }), [send])
}

// ============================================================
// 3. Completion Tracking Hook
// ============================================================
interface WalkthroughCompletionHook {
  completionState: CompletionState
  isPathCompleted: (branchId: string, pathIndex: number) => boolean
  isBranchFullyCompleted: (branchId: string) => boolean
  shouldShowRevisitCTA: (branchId: string) => boolean
  getUnvisitedPaths: (branchId: string) => number[]
  overallProgress: number  // 0-100 percentage
  reset: () => void
}

function useWalkthroughCompletion(): WalkthroughCompletionHook {
  const completionTracker = useSelector(service, s => s.context.completionTracker)
  const [state, setState] = useState(completionTracker.getState())
  
  useEffect(() => {
    // Subscribe to completion state changes
    const unsubscribe = completionTracker.subscribe(setState)
    return unsubscribe
  }, [completionTracker])
  
  return useMemo(() => ({
    completionState: state,
    isPathCompleted: (branchId, pathIndex) => 
      completionTracker.isPathCompleted(branchId, pathIndex),
    isBranchFullyCompleted: (branchId) => 
      completionTracker.isBranchFullyCompleted(branchId),
    shouldShowRevisitCTA: (branchId) => 
      completionTracker.shouldShowRevisitCTA(branchId),
    getUnvisitedPaths: (branchId) => 
      completionTracker.getUnvisitedPaths(branchId),
    overallProgress: state.overallProgress,
    reset: () => completionTracker.reset()
  }), [state, completionTracker])
}

// ============================================================
// 4. Branch Selection UI Hook
// ============================================================
interface BranchSelectionState {
  isAtBranchDecision: boolean
  branchInfo: BranchInfo | null
  selectPath: (pathIndex: number) => void
  cancel: () => void
}

interface BranchInfo {
  branchId: string
  kind: 'parallel' | 'alternate'
  paths: Array<{
    pathIndex: number
    pathId: string
    name?: string
    isDefault: boolean
    isCompleted: boolean
  }>
}

function useBranchSelection(): BranchSelectionState {
  const isAtDecision = useSelector(service, s => 
    s.matches('walkthrough.active.branchDecision')
  )
  const branchInfo = useSelector(service, s => {
    if (!s.matches('walkthrough.active.branchDecision')) return null
    
    const pendingBranch = s.context.pendingBranchDecision
    if (!pendingBranch) return null
    
    return extractBranchInfo(pendingBranch, s.context.completionTracker)
  })
  const { send } = useActor(walkthroughService)
  
  return {
    isAtBranchDecision: isAtDecision,
    branchInfo,
    selectPath: (pathIndex) => send({ 
      type: 'walkthrough.navigate', 
      action: { type: 'selectPath', pathIndex } 
    }),
    cancel: () => send({ type: 'walkthrough.cancelBranchSelection' })
  }
}

// ============================================================
// 5. URL State Sync Hook
// ============================================================
interface WalkthroughURLHook {
  urlState: WalkthroughURLState | null
  updateURL: (state: WalkthroughURLState) => void
  resumeFromURL: () => void
  clearURL: () => void
}

function useWalkthroughURL(): WalkthroughURLHook {
  const [urlState, setUrlState] = useState<WalkthroughURLState | null>(() => 
    parseWalkthroughURL(window.location.hash)
  )
  const { send } = useActor(walkthroughService)
  
  useEffect(() => {
    // Listen for hash changes
    const handleHashChange = () => {
      setUrlState(parseWalkthroughURL(window.location.hash))
    }
    
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  
  const updateURL = useCallback((state: WalkthroughURLState) => {
    const hash = buildWalkthroughURL(state)
    window.history.replaceState(null, '', hash)
    setUrlState(state)
  }, [])
  
  const resumeFromURL = useCallback(() => {
    if (!urlState) return
    
    send({ 
      type: 'walkthrough.resumeFromURL', 
      urlState 
    })
  }, [urlState, send])
  
  const clearURL = useCallback(() => {
    window.history.replaceState(null, '', window.location.pathname)
    setUrlState(null)
  }, [])
  
  return {
    urlState,
    updateURL,
    resumeFromURL,
    clearURL
  }
}
```

### Usage Examples

```typescript
// ============================================================
// Example 1: Simple Progress Display
// ============================================================
function WalkthroughProgress() {
  const { progress, isActive } = useWalkthrough()
  
  if (!isActive) return null
  
  if (progress.mode === 'linear') {
    return <div>Step {progress.currentStep} of {progress.totalSteps}</div>
  }
  
  return (
    <div>
      <div>Branch: {progress.branchInfo?.branchId}</div>
      <div>Path {progress.branchInfo?.pathIndex + 1} of {progress.branchInfo?.pathCount}</div>
      <div>Step {progress.branchInfo?.stepInPath} of {progress.branchInfo?.totalStepsInPath}</div>
    </div>
  )
}

// ============================================================
// Example 2: Navigation Controls
// ============================================================
function WalkthroughControls() {
  const { isActive, canNavigateNext, canNavigatePrevious } = useWalkthrough()
  const { start, stop, next, previous } = useWalkthroughActions()
  
  if (!isActive) {
    return <button onClick={start}>Start Walkthrough</button>
  }
  
  return (
    <div>
      <button onClick={previous} disabled={!canNavigatePrevious}>Previous</button>
      <button onClick={next} disabled={!canNavigateNext}>Next</button>
      <button onClick={stop}>Stop</button>
    </div>
  )
}

// ============================================================
// Example 3: Branch Selection UI
// ============================================================
function BranchSelector() {
  const { isAtBranchDecision, branchInfo, selectPath, cancel } = useBranchSelection()
  
  if (!isAtBranchDecision || !branchInfo) return null
  
  return (
    <div className="branch-selector">
      <h3>Choose a path</h3>
      <div className="paths">
        {branchInfo.paths.map(path => (
          <button
            key={path.pathIndex}
            onClick={() => selectPath(path.pathIndex)}
            className={path.isDefault ? 'default' : ''}
          >
            {path.name || `Path ${path.pathIndex + 1}`}
            {path.isDefault && ' (default)'}
            {path.isCompleted && ' ✓'}
          </button>
        ))}
      </div>
      <button onClick={cancel}>Cancel</button>
    </div>
  )
}

// ============================================================
// Example 4: Completion-based CTA
// ============================================================
function AlternatePathCTA() {
  const { branchContext } = useWalkthrough()
  const { shouldShowRevisitCTA, getUnvisitedPaths } = useWalkthroughCompletion()
  const { jumpToBranch } = useWalkthroughActions()
  
  if (!branchContext) return null
  if (!shouldShowRevisitCTA(branchContext.branchId)) return null
  
  const unvisited = getUnvisitedPaths(branchContext.branchId)
  
  return (
    <div className="cta">
      <p>{unvisited.length} alternate path{unvisited.length > 1 ? 's' : ''} available</p>
      <button onClick={() => jumpToBranch(branchContext.branchId)}>
        Explore Alternates
      </button>
    </div>
  )
}

// ============================================================
// Example 5: URL Resume Prompt
// ============================================================
function ResumeWalkthroughPrompt() {
  const { urlState, resumeFromURL, clearURL } = useWalkthroughURL()
  const [dismissed, setDismissed] = useState(false)
  
  if (!urlState || dismissed) return null
  
  return (
    <div className="resume-prompt">
      <p>Resume walkthrough at step {urlState.stepId}?</p>
      <button onClick={() => {
        resumeFromURL()
        setDismissed(true)
      }}>Resume</button>
      <button onClick={() => {
        clearURL()
        setDismissed(true)
      }}>Start Fresh</button>
    </div>
  )
}
```

### Testing Strategy

```typescript
// Mock the service for testing
const mockService = {
  send: vi.fn(),
  subscribe: vi.fn(),
  // ... other methods
}

// Test example
describe('useWalkthroughActions', () => {
  it('should send correct event on next()', () => {
    const { result } = renderHook(() => useWalkthroughActions(), {
      wrapper: createWalkthroughProvider(mockService)
    })
    
    result.current.next()
    
    expect(mockService.send).toHaveBeenCalledWith({
      type: 'walkthrough.navigate',
      action: { type: 'next' }
    })
  })
})
```

### Documentation Requirements

Provide examples for:
1. Basic walkthrough controls (start/stop/next/previous)
2. Progress indicators (linear and branch)
3. Branch selection UI
4. Completion tracking and CTAs
5. URL state management
6. Keyboard shortcuts integration
7. Custom UI components
8. Performance optimization tips

---

## Discussion Points

1. **Developer Audience:** Who will use these hooks?
   - Internal team only? → Can use more advanced patterns
   - External developers? → Need simple, well-documented APIs

2. **Performance Sensitivity:** How often does walkthrough state change?
   - Every step? → Need optimized re-renders
   - Rarely? → Simpler hooks OK

3. **Testing Strategy:** How will components using these hooks be tested?
   - Mock hooks?
   - Mock state machine?
   - Integration tests?

4. **Documentation Plan:** What examples should we provide?
   - Basic walkthrough controls?
   - Branch selection UI?
   - Progress indicators?
   - CTA buttons?

5. **Future Extensions:** What features might we add later?
   - Keyboard shortcuts hook?
   - Walkthrough recording/playback?
   - Analytics tracking?

## Related

- ADR-001: Navigate event will be sent via actions from hooks
- ADR-002: Progress calculation logic consumed by hooks
- ADR-003: Completion state accessed via hooks
- ADR-004: URL state managed via hooks
- XState React integration: https://xstate.js.org/docs/packages/xstate-react/
