# ADR-001: State Machine Event Signatures

**Status:** 🔄 IN PROGRESS  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

The walkthrough state machine needs to handle branch-aware navigation. From the APPROACH document, we know we need:

1. **walkthrough.jumpToBranch** - Jump to a specific branch decision point
2. **walkthrough.selectPath** - Choose a path when at a branch
3. **Enhanced next/previous** - Navigate with branch boundary awareness

Current state machine has:
- `activeWalkthrough: { stepId: string, parallelPrefix?: string, branchTrail: string[] }`
- Basic events: `walkthrough.next`, `walkthrough.previous`, `walkthrough.to`

## Problem

We need to design event signatures that:
- Support jumping to branch decision points
- Allow path selection within branches
- Maintain type safety with TypeScript
- Enable smooth UX for both keyboard and UI navigation
- Work with the BranchContext type from APPROACH doc

## Proposed Solution

### Option A: Minimal Extension (Recommended)

Add two new events while keeping existing ones:

```typescript
// New events
type JumpToBranchEvent = {
  type: 'walkthrough.jumpToBranch'
  branchId: string  // The branch to jump to
}

type SelectPathEvent = {
  type: 'walkthrough.selectPath'
  pathIndex: number  // Which path to take (0-based)
}

// Enhanced existing events with optional context
type NextEvent = {
  type: 'walkthrough.next'
  exitBranchOnEnd?: boolean  // If true, exit branch when reaching last step
}

type PreviousEvent = {
  type: 'walkthrough.previous'
  exitBranchOnStart?: boolean  // If true, exit branch when reaching first step
}
```

**Pros:**
- Minimal API surface
- Backward compatible with existing code
- Clear intent for each action
- Works naturally with keyboard navigation

**Cons:**
- Requires branch state inspection in event handlers
- Two separate events for branch navigation

### Option B: Unified Navigation Event

Single event with discriminated payload:

```typescript
type NavigateEvent = {
  type: 'walkthrough.navigate'
  action: 
    | { type: 'next', exitBranchOnEnd?: boolean }
    | { type: 'previous', exitBranchOnStart?: boolean }
    | { type: 'jumpToBranch', branchId: string }
    | { type: 'selectPath', pathIndex: number }
    | { type: 'jumpToStep', stepId: string }
}
```

**Pros:**
- Single event handler to maintain
- Consistent pattern
- Easy to add new navigation types

**Cons:**
- More complex type definitions
- Harder to trace specific navigation actions
- Overkill for simple next/previous

### Option C: Branch-Specific Events

Separate event namespaces for linear vs branch:

```typescript
// Linear navigation
type WalkthroughNext = { type: 'walkthrough.next' }
type WalkthroughPrevious = { type: 'walkthrough.previous' }
type WalkthroughTo = { type: 'walkthrough.to', stepId: string }

// Branch navigation
type BranchEnter = { type: 'branch.enter', branchId: string }
type BranchSelectPath = { type: 'branch.selectPath', pathIndex: number }
type BranchExit = { type: 'branch.exit' }
```

**Pros:**
- Clear separation of concerns
- Explicit branch entry/exit
- Easy to understand state transitions

**Cons:**
- More events to maintain
- Redundant concepts (branch.enter ~= jumpToBranch)
- Steeper learning curve

## Decision

**ACCEPTED: Option B - Unified Navigation Event**

We will use a single `walkthrough.navigate` event with discriminated action payload:

```typescript
type NavigateEvent = {
  type: 'walkthrough.navigate'
  action: 
    | { type: 'next' }
    | { type: 'previous' }
    | { type: 'jumpToBranch', branchId: string }
    | { type: 'selectPath', pathIndex: number }
    | { type: 'jumpToStep', stepId: string }
}
```

### Navigation Behavior

1. **Next at branch decision:**
   - Auto-follows `default: true` paths
   - Pauses at branches without default, awaiting `selectPath`
   - For parallel branches: iterates through paths sequentially

2. **Previous from within branch:**
   - Returns to branch root (decision point)
   - Enables quick path switching

3. **Path selection:**
   - Explicit override via `selectPath` action
   - Supports keyboard shortcuts (1, 2, 3, etc.)

4. **View all branches mode:**
   - Toggle for parallel branches
   - Highlights all paths simultaneously while stepping through

## Consequences

**Positive:**
- Single event handler simplifies state machine
- Clear action discrimination for type safety
- Extensible pattern for future navigation types
- Supports both auto-navigation and explicit control

**Negative:**
- Slightly more complex type definitions
- Need careful action discrimination in handlers

**Neutral:**
- Requires branch completion tracking (addressed in ADR-003)
- Need UI for path selection and "view all" toggle

## Implementation Notes

### State Machine Context Updates

```typescript
interface WalkthroughContext {
  activeWalkthrough?: ActiveWalkthrough
  branchCompletionSet: Set<string>  // Track visited branches
  viewAllBranchesMode: boolean      // Toggle for parallel visualization
}

type ActiveWalkthrough =
  | { type: 'linear'; stepId: string }
  | { type: 'branch'; stepId: string; context: BranchContext }
```

### Event Handler Responsibilities

1. **next action:**
   - Check if current step leads to branch
   - If branch has `default: true`, enter it
   - If parallel with multiple paths, iterate sequentially
   - Mark branch as visited in completion set

2. **previous action:**
   - If in branch, return to branch root
   - Otherwise, standard step back

3. **jumpToBranch action:**
   - Inspect `branchTrail` to find branch root stepId
   - Set activeWalkthrough to branch root

4. **selectPath action:**
   - Update BranchContext with chosen pathIndex
   - Enter selected path

5. **jumpToStep action:**
   - Direct step navigation (existing behavior)

### Parallel Branch Sequential Iteration

For parallel branches, "next" behavior:
1. Enter first path (pathIndex: 0)
2. Complete all steps in path
3. Auto-advance to next path (pathIndex: 1)
4. Repeat until all paths visited
5. Exit branch and continue main flow

---

## Discussion Points

1. **Keyboard Navigation:** How should arrow keys behave at branch boundaries?
2. **Default Behavior:** Should next/previous auto-select default paths or stop at branches?
3. **Path Selection UX:** Do we need a "neutral" state before selecting a path?
4. **Type Safety:** How can we ensure invalid state transitions are caught at compile time?

## Related

- APPROACH document Section 6 (lines 165-186)
- `packages/diagram/src/likec4diagram/state/diagram-machine.ts` (lines 141-144)
