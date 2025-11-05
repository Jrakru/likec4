# ADR-004: URL State Persistence

**Status:** 🔄 IN PROGRESS  
**Date:** 2025-10-24  
**Deciders:** Team  

## Context

Users should be able to share walkthrough states via URL. We need to encode:
- Current step position
- Active branch context (if in a branch)
- Possibly: which path was selected (for deep linking)

From ADR-003, we decided completion state lives in localStorage (not URL). However, the **current position** should be shareable.

Current URL structure (if any) needs to be examined, and we need to design a format that:
- Is human-readable (when possible)
- Doesn't conflict with existing URL patterns
- Supports both linear and branch navigation
- Handles nested branches
- Is concise

## Problem

What URL format should we use to encode walkthrough state?

Key considerations:
1. **Discoverability:** Can users understand what the URL represents?
2. **Length:** URLs can get long with complex state
3. **Compatibility:** Must work with existing routing
4. **Stability:** Should stepIds be in URLs or more stable identifiers?
5. **Branch context:** How do we encode "on step X of path Y in branch Z"?

## Proposed Solution

### Option A: Hash Fragment with Structured Format (Recommended)

Use URL hash with a structured format:

```
# Linear walkthrough
/diagram/my-view#walkthrough=step-5

# Branch walkthrough - shows current step and branch context
/diagram/my-view#walkthrough=step-12&branch=br-auth:1
                                              ^     ^
                                           branchId pathIndex

# Nested branch
/diagram/my-view#walkthrough=step-25&branch=br-auth:1,br-payment:0
                                              ^            ^
                                           parent branch  nested branch
```

**Format Details:**
- `walkthrough=<stepId>` - Current step
- `branch=<branchId>:<pathIndex>[,<nestedBranchId>:<nestedPathIndex>]*` - Branch context chain
- Comma-separated for nested branches (maintains hierarchy)

**Pros:**
- Hash fragment doesn't trigger page reload
- Human-readable structure
- Easy to parse and construct
- Supports arbitrary nesting depth
- No server-side routing conflicts

**Cons:**
- Can get long with deep nesting
- StepIds might be implementation details

### Option B: Query Parameters

Use traditional query parameters:

```
# Linear
/diagram/my-view?walkthrough=step-5

# Branch
/diagram/my-view?walkthrough=step-12&branchId=br-auth&pathIndex=1

# Nested
/diagram/my-view?walkthrough=step-25&branchId=br-auth&pathIndex=1&nestedBranchId=br-payment&nestedPathIndex=0
```

**Pros:**
- Standard web convention
- Easy to parse with URLSearchParams
- Clear parameter names

**Cons:**
- May trigger page reload
- Conflicts with potential server-side routing
- Nested branches get verbose
- Multiple levels need array-like parameters (?branch[0]=... ugly)

### Option C: Encoded Path-Based Format

Encode state directly in the URL path:

```
# Linear
/diagram/my-view/w/step-5

# Branch
/diagram/my-view/w/step-12/br-auth/p1

# Nested
/diagram/my-view/w/step-25/br-auth/p1/br-payment/p0
```

**Pros:**
- Very clean URLs
- RESTful feel
- Natural hierarchy representation
- No special characters

**Cons:**
- Conflicts with routing (needs catch-all route)
- Harder to parse
- May not work with static hosting
- Less flexible for future additions

### Option D: Compact Hash with Base64 Encoding

Encode all state as a compact base64 string:

```
/diagram/my-view#w=eyJzdGVwIjoic3RlcC0xMiIsImJyYW5jaCI6eyJpZCI6ImJyLWF1dGgiLCJwYXRoIjoxfX0
```

Decoded: `{"step":"step-12","branch":{"id":"br-auth","path":1}}`

**Pros:**
- Very compact for complex state
- Can encode arbitrary metadata
- Version-friendly (just change encoding)

**Cons:**
- Not human-readable
- Harder to debug
- Looks suspicious/unprofessional
- Can't manually construct URLs

## Decision

**ACCEPTED: Option A - Hash Fragment with Structured Format**

We will use URL hash fragments with a human-readable structured format:

```
# Linear walkthrough
/diagram/my-view#walkthrough=step-5

# Branch walkthrough
/diagram/my-view#walkthrough=step-12&branch=br-auth:1

# Nested branch (comma-separated hierarchy)
/diagram/my-view#walkthrough=step-25&branch=br-auth:1,br-payment:0
```

### Key Decisions

1. **Initial Load Behavior:** When loading a URL with walkthrough state:
   - Show UI prompt: "Resume walkthrough at step 5?" with action button
   - Don't auto-start (respects user agency)
   - Validate state before showing prompt

2. **Invalid State Handling:** If URL references non-existent step/branch:
   - Show error message explaining the issue
   - Fallback to walkthrough beginning
   - Clear invalid hash from URL

3. **StepId Stability:** **⚠️ NEEDS INVESTIGATION**
   - Must verify if step IDs remain stable across diagram edits
   - If not stable, consider alternative identifiers (semantic names, positions)
   - Document findings before implementation

## Consequences

**Positive:**
- Human-readable URLs (easy to share and debug)
- Hash fragments don't trigger page reload
- No server-side routing conflicts
- Supports arbitrary nesting depth
- Easy to parse and construct
- Can manually edit URLs for testing

**Negative:**
- URLs can get long with deep nesting (acceptable trade-off)
- StepIds may be implementation details (investigation needed)
- Need validation logic for URL state

**Neutral:**
- Requires URL sync on every navigation event
- Need graceful degradation for invalid URLs

## Implementation Notes

### URL Format Specification

```typescript
interface WalkthroughURLState {
  stepId: string
  branchContext?: BranchContextChain
}

interface BranchContextChain {
  branches: Array<{
    branchId: string
    pathIndex: number
  }>
}
```

### Parsing Logic

```typescript
function parseWalkthroughURL(hash: string): WalkthroughURLState | null {
  const params = new URLSearchParams(hash.substring(1)) // Remove '#'
  
  const stepId = params.get('walkthrough')
  if (!stepId) return null
  
  const branchParam = params.get('branch')
  if (!branchParam) {
    return { stepId }
  }
  
  // Parse branch chain: "br-auth:1,br-payment:0"
  const branchParts = branchParam.split(',')
  const branches = branchParts.map(part => {
    const [branchId, pathIndexStr] = part.split(':')
    return {
      branchId,
      pathIndex: parseInt(pathIndexStr, 10)
    }
  })
  
  return {
    stepId,
    branchContext: { branches }
  }
}

function buildWalkthroughURL(state: WalkthroughURLState): string {
  const params = new URLSearchParams()
  params.set('walkthrough', state.stepId)
  
  if (state.branchContext && state.branchContext.branches.length > 0) {
    const branchStr = state.branchContext.branches
      .map(b => `${b.branchId}:${b.pathIndex}`)
      .join(',')
    params.set('branch', branchStr)
  }
  
  return `#${params.toString()}`
}
```

### Validation Logic

```typescript
function validateWalkthroughURL(
  urlState: WalkthroughURLState,
  allSteps: Map<string, StepWithMetadata>
): { valid: boolean; error?: string } {
  // Check step exists
  if (!allSteps.has(urlState.stepId)) {
    return {
      valid: false,
      error: `Step "${urlState.stepId}" not found in diagram`
    }
  }
  
  // Validate branch context if present
  if (urlState.branchContext) {
    for (const branch of urlState.branchContext.branches) {
      const branchInfo = findBranchById(branch.branchId, allSteps)
      
      if (!branchInfo) {
        return {
          valid: false,
          error: `Branch "${branch.branchId}" not found`
        }
      }
      
      if (branch.pathIndex < 0 || branch.pathIndex >= branchInfo.pathCount) {
        return {
          valid: false,
          error: `Invalid path index ${branch.pathIndex} for branch "${branch.branchId}"`
        }
      }
    }
  }
  
  return { valid: true }
}
```

### Resume Walkthrough UI

```typescript
function handleURLStateOnLoad(
  urlState: WalkthroughURLState,
  allSteps: Map<string, StepWithMetadata>
): void {
  const validation = validateWalkthroughURL(urlState, allSteps)
  
  if (!validation.valid) {
    showErrorToast({
      message: `Could not load walkthrough state: ${validation.error}`,
      action: {
        label: 'Start from Beginning',
        onClick: () => {
          clearWalkthroughHash()
          startWalkthrough()
        }
      }
    })
    return
  }
  
  // Show resume prompt
  showResumePrompt({
    stepId: urlState.stepId,
    branchContext: urlState.branchContext,
    onResume: () => {
      // Initialize state machine with URL state
      resumeWalkthroughAt(urlState)
    },
    onCancel: () => {
      clearWalkthroughHash()
    }
  })
}
```

### URL Sync on Navigation

```typescript
// In state machine event handlers
function onNavigationComplete(newState: ActiveWalkthrough, stepId: string): void {
  const urlState: WalkthroughURLState = {
    stepId
  }
  
  if (newState.type === 'branch') {
    // Build branch chain from context and parent contexts
    urlState.branchContext = buildBranchChain(newState.context)
  }
  
  const newHash = buildWalkthroughURL(urlState)
  
  // Update URL without triggering navigation
  history.replaceState(null, '', newHash)
}

function buildBranchChain(context: BranchContext): BranchContextChain {
  const branches = []
  let current: BranchContext | undefined = context
  
  // Walk up the branch hierarchy
  while (current) {
    branches.unshift({
      branchId: current.branchId,
      pathIndex: current.pathIndex
    })
    current = current.parentBranchId 
      ? getBranchContext(current.parentBranchId) 
      : undefined
  }
  
  return { branches }
}
```

### StepId Stability Investigation (TODO)

Before implementation, investigate:
1. How are step IDs generated in `compute-view/dynamic-view/compute.ts`?
2. Do they change when diagram is edited?
3. Are they deterministic based on content?
4. Alternative options:
   - Use element IDs if stable
   - Use semantic labels if available
   - Implement stable ID generation
   - Accept that URLs break on edits (document limitation)

**Action Item:** Run tests with diagram modifications to observe stepId behavior.

---

## Discussion Points

1. **StepId Stability:** Are step IDs stable across diagram edits? Or should we use semantic identifiers?

2. **Initial Load:** When loading a URL with walkthrough state:
   - Auto-start walkthrough at that position?
   - Show a "resume walkthrough" button?
   - Validate state before applying?

3. **Invalid State Handling:** What if URL points to non-existent step/branch?
   - Fallback to start?
   - Show error message?
   - Try to find closest valid state?

4. **Integration with Completion Tracking:** Should URL state override localStorage state, or vice versa?

5. **Deep Linking UX:** Should shared URLs include some context (e.g., "You've been invited to view step 5 of the authentication flow")?

## Related

- ADR-001: Navigate event will update URL on state changes
- ADR-003: Completion state in localStorage, position in URL
- Existing routing: Need to check current URL structure in codebase
