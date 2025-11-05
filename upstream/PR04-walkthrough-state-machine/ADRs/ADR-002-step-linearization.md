# ADR-002: Step Linearization Logic

**Status:** 🔄 IN PROGRESS  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

Dynamic views can have complex branching structures (parallel and alternate). For walkthrough navigation to work smoothly, we need to linearize the step graph into a predictable sequence that respects:
- Branch boundaries
- Sequential iteration through parallel paths
- User-selected alternate paths
- Default path preferences

Current state:
- Steps are represented as edges in a graph
- Steps have `parallelPrefix` and now `branchTrail: string[]` (from PR03)
- No current linearization logic for branching

## Problem

We need an algorithm that:
1. Takes a graph of steps with branch metadata
2. Produces a linear sequence for navigation
3. Handles branch entry/exit correctly
4. Supports both parallel (all paths) and alternate (one path) branches
5. Integrates with the `navigate` event from ADR-001

The linearization must be **dynamic** based on:
- Which branch paths have been selected
- Current position in the walkthrough
- Branch completion state

## Proposed Solution

### Option A: Just-In-Time Linearization (Recommended)

Don't pre-compute a full linear sequence. Instead, compute next/previous steps on-demand based on current state.

```typescript
function computeNextStep(
  currentStep: string,
  activeWalkthrough: ActiveWalkthrough,
  allSteps: Map<string, StepWithMetadata>,
  branchCompletionSet: Set<string>
): string | 'BRANCH_DECISION' | 'END' {
  const current = allSteps.get(currentStep)
  
  // Are we in a branch?
  if (activeWalkthrough.type === 'branch') {
    const { context } = activeWalkthrough
    
    // Find next step in current path
    const nextInPath = findNextStepInPath(current, context.pathId)
    
    if (nextInPath) return nextInPath
    
    // Reached end of current path
    if (context.kind === 'parallel') {
      // Move to next path if available
      if (context.pathIndex < context.pathCount - 1) {
        return findFirstStepInPath(context.branchId, context.pathIndex + 1)
      }
    }
    
    // Completed all paths in branch, exit
    branchCompletionSet.add(context.branchId)
    return findStepAfterBranch(context.branchId)
  }
  
  // Linear navigation: check if next step starts a branch
  const next = findNextStepInGraph(current)
  if (!next) return 'END'
  
  if (hasBranchMetadata(next)) {
    // Check if this branch has a default path
    if (hasDefaultPath(next)) {
      return next.id  // Auto-enter default path
    }
    return 'BRANCH_DECISION'  // Pause for user selection
  }
  
  return next.id
}
```

**Pros:**
- Flexible: adapts to user choices in real-time
- Memory efficient: no large pre-computed structures
- Easy to understand current state
- Naturally handles dynamic path selection

**Cons:**
- Must traverse graph for each navigation
- No "look ahead" to show total progress

### Option B: Pre-Computed Linearization with Branch Points

Compute a full linear sequence upfront, marking branch decision points.

```typescript
interface LinearizedSequence {
  steps: Array<
    | { type: 'step'; id: string }
    | { type: 'branch-decision'; branchId: string; paths: PathInfo[] }
  >
  totalSteps: number
}

function linearizeSteps(
  steps: Map<string, StepWithMetadata>,
  selectedPaths: Map<string, number>  // branchId -> pathIndex
): LinearizedSequence {
  // Walk graph, flatten branches based on selections
  // For unselected branches, use default or insert decision point
}
```

**Pros:**
- Can show overall progress (step X of Y)
- Simpler next/previous logic (just array index)
- Easier to implement "jump to step N"

**Cons:**
- Must recompute on every path selection
- Memory overhead for large sequences
- Doesn't handle parallel "iterate all" naturally
- Complex invalidation logic

### Option C: Hybrid Approach

Pre-compute "zones" (linear segments between branches), compute branch navigation on-demand.

```typescript
interface WalkthroughZone {
  id: string
  steps: string[]  // Linear sequence within this zone
  exitBranch?: BranchInfo
}

function getZones(steps: Map<string, StepWithMetadata>): WalkthroughZone[] {
  // Split graph at branch points
}

function navigateInZone(currentZone: WalkthroughZone, direction: 'next' | 'previous') {
  // Fast within-zone navigation
}
```

**Pros:**
- Balance between flexibility and precomputation
- Good for showing zone-level progress
- Efficient for linear segments

**Cons:**
- More complex data structure
- Still needs dynamic logic for branches
- Unclear benefit over Option A

## Decision

**ACCEPTED: Option A - Just-In-Time Linearization**

We will compute next/previous steps dynamically based on current walkthrough state, traversing the step graph on-demand.

### Key Decisions

1. **Progress Display:** Show detailed contextual progress:
   - Linear mode: "Step X of Y"
   - Branch mode: "Branch: <name> | Path X of Y | Step Z of W"
   
2. **Path Transitions:** Clearly indicate when moving between paths in parallel branches
   - UI notification/animation on path change
   - Update progress indicator
   
3. **Nested Branches:** Full support for branches within branches
   - Track branch depth in context
   - BranchTrail already supports this (from PR03)

## Consequences

**Positive:**
- Naturally adapts to dynamic user choices
- Memory efficient (no large pre-computed structures)
- Clean state representation
- Handles nested branches elegantly via recursive logic
- Progress info is rich and contextual

**Negative:**
- Graph traversal on each navigation (potential performance concern for large diagrams)
- Can't pre-cache total step count for progress bar without full traversal
- More complex progress calculation logic

**Neutral:**
- Need to implement path transition notifications in UI
- Must track branch depth for nested branches

## Implementation Notes

### Core Navigation Function

```typescript
interface NavigationResult {
  nextStepId?: string
  action: 'CONTINUE' | 'BRANCH_DECISION' | 'PATH_TRANSITION' | 'END'
  newBranchContext?: BranchContext
  message?: string  // For path transition notifications
}

function computeNextStep(
  currentStepId: string,
  activeWalkthrough: ActiveWalkthrough,
  allSteps: Map<string, StepWithMetadata>,
  branchCompletionSet: Set<string>
): NavigationResult {
  const current = allSteps.get(currentStepId)
  if (!current) return { action: 'END' }
  
  // Handle branch navigation
  if (activeWalkthrough.type === 'branch') {
    const { context } = activeWalkthrough
    
    // Find next step within current path
    const nextInPath = findNextStepInPath(current, context.pathId, allSteps)
    
    if (nextInPath) {
      // Check if next step starts a nested branch
      if (hasBranchMetadata(nextInPath)) {
        return handleBranchEntry(nextInPath, context)
      }
      return { nextStepId: nextInPath.id, action: 'CONTINUE' }
    }
    
    // Reached end of current path
    if (context.kind === 'parallel') {
      // Move to next path if available
      if (context.pathIndex < context.pathCount - 1) {
        const nextPathIndex = context.pathIndex + 1
        const firstStepInNextPath = findFirstStepInPath(
          context.branchId, 
          nextPathIndex, 
          allSteps
        )
        
        return {
          nextStepId: firstStepInNextPath.id,
          action: 'PATH_TRANSITION',
          newBranchContext: { ...context, pathIndex: nextPathIndex },
          message: `Entering path ${nextPathIndex + 1} of ${context.pathCount}`
        }
      }
    }
    
    // Completed all paths, exit branch
    branchCompletionSet.add(context.branchId)
    const afterBranch = findStepAfterBranch(context.branchId, allSteps)
    
    return {
      nextStepId: afterBranch?.id,
      action: afterBranch ? 'CONTINUE' : 'END',
      message: `Completed branch: ${context.branchId}`
    }
  }
  
  // Linear navigation
  const next = findNextStepInGraph(current, allSteps)
  if (!next) return { action: 'END' }
  
  if (hasBranchMetadata(next)) {
    return handleBranchEntry(next, null)
  }
  
  return { nextStepId: next.id, action: 'CONTINUE' }
}

function handleBranchEntry(
  branchStep: StepWithMetadata,
  parentContext?: BranchContext
): NavigationResult {
  const branchMeta = extractBranchMetadata(branchStep)
  
  // Check for default path
  if (branchMeta.hasDefault) {
    const defaultPathIndex = branchMeta.defaultPathIndex
    return {
      nextStepId: branchStep.id,
      action: 'CONTINUE',
      newBranchContext: {
        branchId: branchMeta.id,
        kind: branchMeta.kind,
        pathIndex: defaultPathIndex,
        pathId: branchMeta.paths[defaultPathIndex].id,
        pathCount: branchMeta.paths.length,
        default: true,
        depth: parentContext ? parentContext.depth + 1 : 0
      },
      message: `Entering branch: ${branchMeta.id} (default path)`
    }
  }
  
  // No default, require user selection
  return {
    action: 'BRANCH_DECISION',
    message: `Select path for branch: ${branchMeta.id}`
  }
}
```

### Progress Calculation

```typescript
interface ProgressInfo {
  mode: 'linear' | 'branch'
  currentStep: number
  totalSteps: number
  branchInfo?: {
    branchId: string
    pathIndex: number
    pathCount: number
    stepInPath: number
    totalStepsInPath: number
    depth: number  // For nested branches
  }
}

function calculateProgress(
  currentStepId: string,
  activeWalkthrough: ActiveWalkthrough,
  allSteps: Map<string, StepWithMetadata>
): ProgressInfo {
  if (activeWalkthrough.type === 'linear') {
    const allLinearSteps = getLinearSteps(allSteps)
    const currentIndex = allLinearSteps.indexOf(currentStepId)
    
    return {
      mode: 'linear',
      currentStep: currentIndex + 1,
      totalSteps: allLinearSteps.length
    }
  }
  
  // Branch mode
  const { context } = activeWalkthrough
  const pathSteps = getStepsInPath(context.pathId, allSteps)
  const currentIndexInPath = pathSteps.indexOf(currentStepId)
  
  return {
    mode: 'branch',
    currentStep: currentIndexInPath + 1,
    totalSteps: pathSteps.length,
    branchInfo: {
      branchId: context.branchId,
      pathIndex: context.pathIndex,
      pathCount: context.pathCount,
      stepInPath: currentIndexInPath + 1,
      totalStepsInPath: pathSteps.length,
      depth: context.depth || 0
    }
  }
}
```

### Helper Functions Needed

- `findNextStepInPath(current, pathId, allSteps)` - Get next step within a specific path
- `findFirstStepInPath(branchId, pathIndex, allSteps)` - Get entry point for a path
- `findStepAfterBranch(branchId, allSteps)` - Get continuation after branch completes
- `findNextStepInGraph(current, allSteps)` - Basic graph traversal
- `hasBranchMetadata(step)` - Check if step starts a branch
- `extractBranchMetadata(step)` - Parse branch info from step
- `getStepsInPath(pathId, allSteps)` - Get all steps for a path
- `getLinearSteps(allSteps)` - Get all non-branch steps

### Nested Branch Support

The `BranchContext` needs a `depth` field:

```typescript
interface BranchContext {
  branchId: string
  kind: 'parallel' | 'alternate'
  pathIndex: number
  pathId: string
  pathCount: number
  default: boolean
  depth: number  // NEW: 0 for top-level, 1 for nested, etc.
}
```

When entering a nested branch:
1. Increment depth from parent context
2. Maintain separate branch trail entry
3. Progress display shows nested context
4. Previous navigation respects parent branch boundaries

---

## Discussion Points

1. **Progress Indication:** Do we need to show "step X of Y" progress? Or is branch-relative progress acceptable?
2. **Graph Traversal:** How expensive is on-demand graph traversal? Should we benchmark?
3. **Branch Metadata:** Do we have all needed metadata (parent relationships, path boundaries)?
4. **Edge Cases:** How do we handle nested branches (branches within branches)?

## Related

- ADR-001: Navigation event provides the interface we must implement
- `packages/core/src/compute-view/dynamic-view/compute.ts` - Step computation with branch metadata
- APPROACH document Section 6.2 - Navigation behavior requirements
