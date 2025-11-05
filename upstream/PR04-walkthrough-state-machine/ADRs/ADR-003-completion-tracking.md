# ADR-003: Branch Completion Tracking

**Status:** 🔄 IN PROGRESS  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

From the APPROACH document:
> "Alternate History: after completing a branch, show CTA to revisit other paths without losing global progress; maintain a branch completion set to avoid re-running default path unintentionally."

We need to track:
1. Which branches the user has visited
2. Which specific paths within each branch have been completed
3. Overall walkthrough progress across multiple playthroughs
4. Avoid showing "revisit" CTAs for incomplete branches

## Problem

What data structure should we use to track branch completion? We need to:
- Store per-branch and per-path completion state
- Persist across page reloads (URL or localStorage?)
- Support nested branches
- Show "alternate history" CTAs for completed branches with unvisited paths
- Distinguish between "visited default path" and "explored all paths"

## Proposed Solution

### Option A: Hierarchical Completion Map (Recommended)

Track completion at multiple levels with rich metadata:

```typescript
interface BranchCompletion {
  branchId: string
  visitedPaths: Set<number>  // pathIndex values
  completedPaths: Set<number>  // Fully walked-through paths
  defaultPathIndex: number
  totalPaths: number
  lastVisited: Date
  depth: number  // For nested branches
}

interface CompletionState {
  branches: Map<string, BranchCompletion>
  overallProgress: number  // 0-100 percentage
  lastStepId?: string
}
```

**Usage:**
```typescript
// Check if should show "revisit" CTA
function shouldShowRevisitCTA(branchId: string, completion: CompletionState): boolean {
  const branch = completion.branches.get(branchId)
  if (!branch) return false  // Not visited yet
  
  // Visited at least one path, but not all paths
  return branch.visitedPaths.size > 0 && 
         branch.visitedPaths.size < branch.totalPaths
}

// Mark path as completed
function markPathCompleted(
  completion: CompletionState, 
  branchId: string, 
  pathIndex: number
) {
  let branch = completion.branches.get(branchId)
  if (!branch) {
    branch = createBranchCompletion(branchId, pathIndex)
    completion.branches.set(branchId, branch)
  }
  
  branch.visitedPaths.add(pathIndex)
  branch.completedPaths.add(pathIndex)
  branch.lastVisited = new Date()
}
```

**Pros:**
- Rich metadata for UI features (last visited, completion %)
- Clear distinction between visited vs completed
- Easy to query for specific paths
- Supports nested branches via depth field
- Natural fit for "alternate history" feature

**Cons:**
- More complex structure
- Larger serialization size
- Need to maintain Set serialization

### Option B: Simple Visited Set

Just track which branch+path combinations have been visited:

```typescript
interface CompletionState {
  visited: Set<string>  // Format: "branchId:pathIndex"
  lastStepId?: string
}

// Usage
function hasVisitedPath(branchId: string, pathIndex: number): boolean {
  return visited.has(`${branchId}:${pathIndex}`)
}

function markVisited(branchId: string, pathIndex: number) {
  visited.add(`${branchId}:${pathIndex}`)
}
```

**Pros:**
- Extremely simple
- Minimal memory footprint
- Easy to serialize (just array of strings)
- Fast lookups

**Cons:**
- Can't distinguish "visited" vs "completed"
- Hard to compute overall progress
- No metadata for UI enhancements
- Difficult to determine "show CTA" logic
- Doesn't track last visited timestamp

### Option C: Path-Level Tracking with Completion Percentage

Track each path individually with completion granularity:

```typescript
interface PathCompletion {
  branchId: string
  pathIndex: number
  stepsCompleted: number
  totalSteps: number
  lastStepId: string
  completed: boolean
}

interface CompletionState {
  paths: Map<string, PathCompletion>  // Key: "branchId:pathIndex"
  globalProgress: {
    stepsCompleted: number
    totalSteps: number
  }
}
```

**Pros:**
- Granular progress tracking per path
- Can resume incomplete paths
- Good for showing progress bars
- Clear completion state

**Cons:**
- Most complex structure
- Need to update on every step
- Difficult to calculate totalSteps dynamically
- Overkill if we only need binary visited/not-visited

## Decision

**ACCEPTED: Option A - Hierarchical Completion Map**

We will use rich `BranchCompletion` objects to track visited and completed paths with metadata.

### Key Decisions

1. **Completion Definition:** A path is "completed" when the user reaches the last step in that path
   - No explicit confirmation needed
   - Reaching final step = completed

2. **Persistence Strategy:** localStorage only
   - Per-diagram persistence (keyed by diagram ID)
   - Survives page refresh
   - Private to user (not in shareable URLs)

3. **CTA Placement:** Show "revisit alternate paths" when:
   - User exits a branch that has unvisited paths
   - Display as toast/notification with action button
   - Also available in diagram controls sidebar as persistent option

4. **Nested Branch Completion:** Parent branch is only fully completed when:
   - All paths in parent have been visited
   - All nested branches within those paths are also completed

## Consequences

**Positive:**
- Rich metadata enables sophisticated UI features
- Can distinguish partial vs full completion
- Supports "alternate history" CTA naturally
- Nested branch completion logic is clear
- localStorage provides seamless UX across sessions

**Negative:**
- More complex than simple Set approach
- Need Set serialization/deserialization logic
- State not shareable via URL (separate concern for ADR-004)

**Neutral:**
- Need cleanup mechanism for old localStorage entries
- Consider storage size limits (unlikely to be an issue)

## Implementation Notes

### Data Structure

```typescript
interface BranchCompletion {
  branchId: string
  visitedPaths: Set<number>       // pathIndex values
  completedPaths: Set<number>      // Fully walked-through paths
  defaultPathIndex: number
  totalPaths: number
  lastVisited: Date
  depth: number                    // For nested branches
  parentBranchId?: string          // For tracking nested hierarchy
}

interface CompletionState {
  diagramId: string
  branches: Map<string, BranchCompletion>
  overallProgress: number          // 0-100 percentage
  lastStepId?: string
  version: number                  // For migration support
}
```

### Core Operations

```typescript
class CompletionTracker {
  private state: CompletionState
  
  constructor(diagramId: string) {
    this.state = this.loadFromStorage(diagramId) || this.createEmpty(diagramId)
  }
  
  // Mark a path as completed
  markPathCompleted(
    branchId: string, 
    pathIndex: number,
    branchMetadata: { totalPaths: number, defaultPathIndex: number, depth: number, parentBranchId?: string }
  ): void {
    let branch = this.state.branches.get(branchId)
    
    if (!branch) {
      branch = {
        branchId,
        visitedPaths: new Set(),
        completedPaths: new Set(),
        defaultPathIndex: branchMetadata.defaultPathIndex,
        totalPaths: branchMetadata.totalPaths,
        lastVisited: new Date(),
        depth: branchMetadata.depth,
        parentBranchId: branchMetadata.parentBranchId
      }
      this.state.branches.set(branchId, branch)
    }
    
    branch.visitedPaths.add(pathIndex)
    branch.completedPaths.add(pathIndex)
    branch.lastVisited = new Date()
    
    this.updateOverallProgress()
    this.saveToStorage()
  }
  
  // Check if should show "revisit" CTA
  shouldShowRevisitCTA(branchId: string): boolean {
    const branch = this.state.branches.get(branchId)
    if (!branch) return false
    
    // Visited at least one path, but not all paths
    return branch.visitedPaths.size > 0 && 
           branch.visitedPaths.size < branch.totalPaths
  }
  
  // Check if branch is fully completed (including nested branches)
  isBranchFullyCompleted(branchId: string, allSteps: Map<string, StepWithMetadata>): boolean {
    const branch = this.state.branches.get(branchId)
    if (!branch) return false
    
    // All paths visited?
    if (branch.completedPaths.size < branch.totalPaths) return false
    
    // Check all nested branches within this branch
    const nestedBranches = this.findNestedBranches(branchId, allSteps)
    for (const nestedBranchId of nestedBranches) {
      if (!this.isBranchFullyCompleted(nestedBranchId, allSteps)) {
        return false
      }
    }
    
    return true
  }
  
  // Get unvisited paths for CTA
  getUnvisitedPaths(branchId: string): number[] {
    const branch = this.state.branches.get(branchId)
    if (!branch) return []
    
    const unvisited: number[] = []
    for (let i = 0; i < branch.totalPaths; i++) {
      if (!branch.visitedPaths.has(i)) {
        unvisited.push(i)
      }
    }
    return unvisited
  }
  
  // Calculate overall progress
  private updateOverallProgress(): void {
    let totalPaths = 0
    let completedPaths = 0
    
    for (const branch of this.state.branches.values()) {
      totalPaths += branch.totalPaths
      completedPaths += branch.completedPaths.size
    }
    
    this.state.overallProgress = totalPaths > 0 
      ? Math.round((completedPaths / totalPaths) * 100)
      : 0
  }
  
  // Persistence
  private saveToStorage(): void {
    const serialized = this.serializeState(this.state)
    localStorage.setItem(`likec4-walkthrough-${this.state.diagramId}`, serialized)
  }
  
  private loadFromStorage(diagramId: string): CompletionState | null {
    const data = localStorage.getItem(`likec4-walkthrough-${diagramId}`)
    return data ? this.deserializeState(data) : null
  }
  
  private serializeState(state: CompletionState): string {
    return JSON.stringify({
      diagramId: state.diagramId,
      branches: Array.from(state.branches.entries()).map(([id, branch]) => ({
        id,
        visitedPaths: Array.from(branch.visitedPaths),
        completedPaths: Array.from(branch.completedPaths),
        defaultPathIndex: branch.defaultPathIndex,
        totalPaths: branch.totalPaths,
        lastVisited: branch.lastVisited.toISOString(),
        depth: branch.depth,
        parentBranchId: branch.parentBranchId
      })),
      overallProgress: state.overallProgress,
      lastStepId: state.lastStepId,
      version: state.version
    })
  }
  
  private deserializeState(data: string): CompletionState {
    const parsed = JSON.parse(data)
    const branches = new Map<string, BranchCompletion>()
    
    for (const b of parsed.branches) {
      branches.set(b.id, {
        branchId: b.id,
        visitedPaths: new Set(b.visitedPaths),
        completedPaths: new Set(b.completedPaths),
        defaultPathIndex: b.defaultPathIndex,
        totalPaths: b.totalPaths,
        lastVisited: new Date(b.lastVisited),
        depth: b.depth,
        parentBranchId: b.parentBranchId
      })
    }
    
    return {
      diagramId: parsed.diagramId,
      branches,
      overallProgress: parsed.overallProgress,
      lastStepId: parsed.lastStepId,
      version: parsed.version
    }
  }
  
  // Helper to find nested branches
  private findNestedBranches(parentBranchId: string, allSteps: Map<string, StepWithMetadata>): string[] {
    const nested: string[] = []
    
    for (const [branchId, branch] of this.state.branches.entries()) {
      if (branch.parentBranchId === parentBranchId) {
        nested.push(branchId)
      }
    }
    
    return nested
  }
  
  // Reset completion state
  reset(): void {
    this.state = this.createEmpty(this.state.diagramId)
    this.saveToStorage()
  }
  
  private createEmpty(diagramId: string): CompletionState {
    return {
      diagramId,
      branches: new Map(),
      overallProgress: 0,
      version: 1
    }
  }
}
```

### CTA Display Logic

```typescript
// After exiting a branch, check if CTA should be shown
function onBranchExit(branchId: string, tracker: CompletionTracker) {
  if (tracker.shouldShowRevisitCTA(branchId)) {
    const unvisitedPaths = tracker.getUnvisitedPaths(branchId)
    
    showToast({
      message: `You've completed one path in this branch. ${unvisitedPaths.length} alternate path${unvisitedPaths.length > 1 ? 's' : ''} available.`,
      action: {
        label: 'Explore Alternates',
        onClick: () => jumpToBranch(branchId)
      },
      duration: 8000  // Long enough to read and act
    })
  }
}
```

### Integration with State Machine

The completion tracker will be:
1. Initialized with diagram ID when state machine starts
2. Updated via `markPathCompleted()` when reaching last step of a path
3. Consulted for progress display and CTA logic
4. Persisted automatically on each update

---

## Discussion Points

1. **Completion Definition:** What counts as "completed"?
   - Just reached the last step in a path?
   - Viewed every note/edge in the path?
   - Explicitly marked as "done" by user?

2. **Persistence Strategy:** Where should this state live?
   - URL hash (for sharing links)
   - localStorage (for personal tracking)
   - Both (hybrid approach)?

3. **Reset Mechanism:** Should users be able to reset completion state?
   - "Start over" button?
   - Automatic reset after X days?

4. **Nested Branch Tracking:** How do we handle completion of nested branches?
   - Track independently?
   - Parent branch incomplete until all nested branches done?

5. **CTA Placement:** Where should "revisit alternate paths" CTA appear?
   - At branch exit point?
   - In a sidebar?
   - After completing entire walkthrough?

## Related

- ADR-001: Navigate event handlers will update completion state
- ADR-002: Progress calculation needs completion data
- ADR-004: URL persistence will serialize completion state
- APPROACH document: "Alternate History" feature requirements
