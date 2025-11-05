# Edge Cases & Industry Comparison - Detailed Walkthrough

## Part 1: The 8 Missing Edge Cases (Prioritized by Severity)

---

### 🔴 CRITICAL SEVERITY

#### Edge Case #1: Empty Paths Not Validated

**What's the problem?**
```typescript
parallel {
  path success {
    customer -> api
  }
  path failure {
    // EMPTY! No steps at all
  }
}
```

**Current behavior**: ✅ Compiles without error
**Expected behavior**: ❌ Should fail validation

**Why it matters**:
- TypeScript type says `steps: NonEmptyReadonlyArray<DynamicBranchEntry>` but runtime doesn't enforce it
- Parser could theoretically create empty arrays
- Will cause rendering errors or confusing diagrams
- Violates type system contract

**Evidence in code**:
```typescript
// packages/core/src/types/view-parsed.dynamic.ts:60
readonly steps: NonEmptyReadonlyArray<DynamicBranchEntry<A>>
// TypeScript types this as non-empty, but no runtime check
```

**What validation exists**:
- ✅ Empty branch collection (no paths AND no steps) is caught
- ❌ Empty individual path is NOT caught

**Proof it's missing**:
```typescript
// packages/language-server/src/validation/dynamic-view.ts:88-204
export const dynamicViewBranchCollection = (services: LikeC4Services) => {
  return tryOrLog((node, accept) => {
    // Checks if BRANCH is empty:
    if (!hasNamedPaths && !hasSteps) {
      accept('error', `${kind} block has no paths or steps`)
    }
    // BUT does NOT check if individual PATHS are empty!
  })
}
```

**Impact**: HIGH - Data integrity issue, could cause crashes

**Fix difficulty**: EASY - 10 lines of code

**Recommended fix**:
```typescript
// Add after line 102 in dynamic-view.ts
for (const path of node.paths) {
  if (!path.steps || path.steps.length === 0) {
    accept('error', 'Path must contain at least one step', {
      node: path,
      code: 'LIKEC4-EMPTY-PATH'
    })
  }
}
```

---

#### Edge Case #2: Unbounded Nesting Depth

**What's the problem?**
```typescript
alternate {
  path {
    parallel {
      path {
        alternate {
          path {
            parallel {
              path {
                alternate {
                  // 6 LEVELS DEEP!
                  customer -> api
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**Current behavior**: ✅ Allowed without warning
**Expected behavior**: ⚠️ Should warn at 4+ levels, error at 6+

**Why it matters**:
- Step IDs become unwieldy: `step-01.01.01.01.01.01`
- Cognitive overload for diagram readers
- Rendering engines may struggle (research shows tools like Jenkins Blue Ocean can't handle 3+ nesting)
- Likely indicates poor diagram design

**Research evidence**:
> "Jenkins Blue Ocean will display top-level stages, plus parallel branches inside a top-level stage, but currently no more." - Jenkins documentation

**Current state in code**:
```typescript
// No depth checking anywhere in validation/dynamic-view.ts
// BranchStack in compute.ts can grow indefinitely
```

**Impact**: MEDIUM-HIGH - Usability issue, rendering problems

**Fix difficulty**: MEDIUM - 30 lines of code

**Recommended fix**:
```typescript
const MAX_BRANCH_DEPTH = 3
const ERROR_DEPTH = 6

function calculateBranchDepth(node: ast.DynamicViewBranchCollection, depth = 1): number {
  let maxDepth = depth

  for (const path of node.paths) {
    for (const step of path.steps) {
      if (ast.isDynamicViewBranchCollection(step)) {
        const childDepth = calculateBranchDepth(step, depth + 1)
        maxDepth = Math.max(maxDepth, childDepth)
      }
    }
  }

  for (const step of node.steps) {
    if (ast.isDynamicViewBranchCollection(step)) {
      const childDepth = calculateBranchDepth(step, depth + 1)
      maxDepth = Math.max(maxDepth, childDepth)
    }
  }

  return maxDepth
}

// In validation:
const depth = calculateBranchDepth(node)
if (depth >= ERROR_DEPTH) {
  accept('error', `Branch nesting depth (${depth}) exceeds maximum (${ERROR_DEPTH})`, {
    node,
    code: 'LIKEC4-MAX-DEPTH'
  })
} else if (depth > MAX_BRANCH_DEPTH) {
  accept('warning', `Branch nesting depth (${depth}) exceeds recommended depth (${MAX_BRANCH_DEPTH})`, {
    node,
    code: 'LIKEC4-DEEP-NESTING'
  })
}
```

---

### ⚠️ IMPORTANT SEVERITY

#### Edge Case #3: Mixed Anonymous and Named Paths

**What's the problem?**
```typescript
parallel {
  path success {
    api -> database
  }

  customer -> api  // Anonymous step - creates implicit path

  path failure {
    api -> errorLogger
  }
}
```

**Current behavior**: ✅ Allowed, works correctly
**Expected behavior**: 💡 Should hint about inconsistent style

**Why it matters**:
- Inconsistent code style
- Harder to understand which steps belong to which conceptual path
- Anonymous steps become separate paths (each step = one path)
- Can be confusing in complex diagrams

**How it works internally**:
```typescript
// Parser creates implicit paths for anonymous steps:
{
  branchId: '/parallel@0',
  paths: [
    { pathId: '/parallel@0/path@0', pathName: 'success', steps: [...] },
    // Anonymous step becomes:
    { pathId: '/parallel@0/implicit@0', steps: [step], isAnonymous: true },
    { pathId: '/parallel@0/path@1', pathName: 'failure', steps: [...] }
  ]
}
```

**Current validation**: None

**Impact**: LOW-MEDIUM - Code quality issue, not a bug

**Fix difficulty**: EASY - 15 lines of code

**Recommended fix**:
```typescript
// In dynamicViewBranchCollection validation
if (node.paths.length > 0 && node.steps.length > 0) {
  accept('hint',
    'Mixing named paths and anonymous steps. Consider using explicit paths for all branches for consistency.',
    { node, code: 'LIKEC4-MIXED-PATH-STYLE' }
  )
}
```

---

#### Edge Case #4: Series Within Nested Branches (Test Gap)

**What's the problem?**
```typescript
parallel {
  path success {
    A -> B -> C  // Series/chain in nested branch
  }
  path failure {
    X -> Y -> Z  // Another series
  }
}
```

**Question**: Do step IDs generate correctly?
- Expected: `step-01.01.01`, `step-01.01.02`, `step-01.01.03` for path 1
- Expected: `step-01.02.01`, `step-01.02.02`, `step-01.02.03` for path 2

**Current state**:
- ✅ Series (`A -> B -> C`) is supported at root level
- ✅ Series is supported in legacy parallel
- ❓ Series in NEW branch-aware nested paths - **no explicit test**

**Evidence**:
```typescript
// packages/core/src/compute-view/dynamic-view/__test__/branch-collections.spec.ts
// Has test "should handle multiple steps within a single path" (line 123)
// BUT steps are separate, not chained with ->
it('should handle multiple steps within a single path', () => {
  steps: [
    $step('customer -> cloud.frontend.dashboard'),
    $step('cloud.frontend.dashboard -> cloud.backend.graphql'),
    // ^ These are TWO separate steps, not a series
  ]
})

// Missing test:
it('should handle series within nested branches', () => {
  steps: [
    $step('customer -> dashboard -> graphql')  // SERIES with ->
  ]
})
```

**Why it matters**:
- Step ID generation logic is complex for nested branches
- Series adds another layer of complexity (multiple steps from one AST node)
- Risk of ID collision or incorrect numbering

**Impact**: MEDIUM - Likely works but unverified

**Fix difficulty**: EASY - Add 1 test case

**Recommended test**:
```typescript
it('should generate correct IDs for series/chains in nested branches', () => {
  const parallel: DynamicBranchCollection = {
    branchId: '/parallel@0',
    astPath: '/steps@0',
    kind: 'parallel',
    paths: [
      {
        pathId: '/parallel@0/path@0',
        steps: [
          // This creates a SERIES - multiple edges from one step
          {
            __series: [
              $step('A -> B'),
              $step('B -> C'),
              $step('C -> D')
            ]
          }
        ]
      }
    ]
  }

  const view = compute([parallel])

  expect(view.edgeIds).toEqual([
    'step-01.01.01',
    'step-01.01.02',
    'step-01.01.03'
  ])

  // Verify branch trail is consistent
  expect(view.edges[0].branchTrail[0].indexWithinPath).toBe(1)
  expect(view.edges[1].branchTrail[0].indexWithinPath).toBe(2)
  expect(view.edges[2].branchTrail[0].indexWithinPath).toBe(3)
})
```

---

#### Edge Case #5: Circular References in navigateTo

**What's the problem?**
```typescript
// View A
dynamic view viewA {
  parallel {
    path p1 {
      x -> y with navigateTo: viewB
    }
  }
}

// View B (different file)
dynamic view viewB {
  x -> y with navigateTo: viewA  // CYCLE!
}
```

**Current behavior**: ✅ No validation - cycle is allowed
**Expected behavior**: ⚠️ Warn about potential infinite navigation loop

**Why it matters**:
- UI navigation could get stuck in loop
- Confusing user experience
- Difficult to debug in large codebases with many views

**Current validation**:
```typescript
// packages/core/src/compute-view/dynamic-view/compute.ts:220
const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
  ? stepNavigateTo
  : derivedNavigateTo
// Only checks self-reference, not transitive cycles
```

**Scope**: This is a **view graph problem**, not branch-specific

**Impact**: LOW-MEDIUM - UX issue, not a crash

**Fix difficulty**: MEDIUM - Requires global view analysis

**Recommendation**: Defer to view graph validation (separate concern from branches)

---

#### Edge Case #6: Deeply Nested Step IDs Become Unwieldy

**What's the problem?**
At depth 5:
```
step-01.01.01.01.01
```

At depth 10:
```
step-01.01.01.01.01.01.01.01.01.01
```

**Current state**: No limits on ID length

**Why it matters**:
- Hard to read in debugging
- Potential issues with storage/databases (string length limits)
- Graph rendering libraries may truncate IDs

**Related to**: Edge Case #2 (Unbounded nesting)

**Impact**: LOW - Cosmetic issue, fixed by depth limit

**Fix**: Same as Edge Case #2 - add depth validation

---

### 🔵 LOW SEVERITY

#### Edge Case #7: Both `__parallel` and `paths` Populated (Data Integrity)

**What's the problem?**
```typescript
// Malformed data structure:
const branch: DynamicParallelBranch = {
  branchId: '/parallel@0',
  kind: 'parallel',

  // Legacy format:
  __parallel: [
    step1, step2, step3
  ],

  // New format:
  paths: [
    { pathId: '/path@0', steps: [...] }
  ],

  // Both populated! Which one is truth?
}
```

**Current state**:
```typescript
// packages/core/src/types/view-parsed.dynamic.ts:73-78
export interface DynamicParallelBranch<A> extends DynamicBranchCollectionBase<A> {
  readonly kind: 'parallel'
  readonly parallelId: string
  readonly __parallel?: NonEmptyReadonlyArray<DynamicStep<A> | DynamicStepsSeries<A>>  // Legacy
  readonly isLegacyParallel?: boolean
}
// Type system allows BOTH fields to exist!
```

**Processing logic**:
```typescript
// compute.ts handles this via feature flag:
if (branchFeatureEnabled) {
  this.processBranchAwareSteps(viewSteps)  // Uses paths
} else {
  this.processLegacySteps(viewSteps)       // Uses __parallel
}
```

**Risk**: If someone manually constructs data with both fields, behavior is undefined

**Impact**: VERY LOW - Only possible with programmatic construction, not via parser

**Fix difficulty**: EASY - Add assertion

**Recommended fix**:
```typescript
// In compute.ts, add after line 100:
if (isDynamicBranchCollection(step)) {
  if ('__parallel' in step && step.__parallel && step.paths.length > 0) {
    if (!step.isLegacyParallel) {
      throw new Error(
        `Invalid branch ${step.branchId}: cannot have both __parallel and paths populated`
      )
    }
  }
}
```

---

#### Edge Case #8: Missing Test Scenarios (Coverage Gaps)

**What's missing?**

1. **Empty path rejection test** (for Edge Case #1)
2. **Deep nesting warning test** (for Edge Case #2)
3. **Mixed path style hint test** (for Edge Case #3)
4. **Series in nested branches** (for Edge Case #4)
5. **Malformed data with both __parallel and paths** (for Edge Case #7)

**Impact**: MEDIUM - Without tests, edge cases can regress

**Fix difficulty**: MEDIUM - 2 hours to write all tests

**Priority**: HIGH - Tests prevent future bugs

---

## Summary Table: Missing Edge Cases

| # | Edge Case | Severity | Impact | Fix Effort | Priority |
|---|-----------|----------|--------|------------|----------|
| 1 | Empty paths not validated | 🔴 CRITICAL | Data integrity | 10 min | **DO NOW** |
| 2 | Unbounded nesting depth | 🔴 CRITICAL | Usability | 30 min | **DO NOW** |
| 3 | Mixed anonymous/named paths | ⚠️ IMPORTANT | Code quality | 15 min | **DO SOON** |
| 4 | Series in nested branches (test gap) | ⚠️ IMPORTANT | Coverage | 20 min | **DO SOON** |
| 5 | Circular navigateTo | ⚠️ IMPORTANT | UX | 2 hours | Later (separate concern) |
| 6 | Unwieldy step IDs | 🔵 LOW | Cosmetic | N/A | Fixed by #2 |
| 7 | Both __parallel and paths | 🔵 LOW | Data integrity | 10 min | Nice to have |
| 8 | Missing test coverage | ⚠️ IMPORTANT | Maintenance | 2 hours | **DO SOON** |

**Total effort for HIGH priority items**: ~4 hours

---

# Part 2: The 12 Edge Case Comparisons (Your Implementation vs. Industry)

Based on research of BPMN engines (Flowable, Camunda), UML tools (IBM, Visual Paradigm), and workflow platforms (AWS Step Functions, Azure Logic Apps, n8n, Dify).

---

## Comparison #1: Deadlock in Parallel Merge

### What the industry faces:

**BPMN Parallel Gateway Problem**:
```
     ┌─────> Task A ────┐
     │                   ├───> [Merge] ──> Next Task
     └─────> Task B ────┘
```

**Issue**: Parallel merge gateway expects a "token" on EVERY incoming sequence flow. If Task B fails or is skipped, the merge waits forever = **DEADLOCK**.

**Quote from research**:
> "A parallel merging gateway expects a token on every incoming sequence flow, and if a token doesn't exist, the process gets stuck at this point (Deadlock)." - Flokzu documentation

**Real-world example** (BPMN):
```xml
<parallelGateway id="fork" />
<sequenceFlow sourceRef="fork" targetRef="taskA" />
<sequenceFlow sourceRef="fork" targetRef="taskB" />
<!-- If taskB errors and doesn't reach merge, DEADLOCK -->
<parallelGateway id="merge" />
```

**Why it's hard**:
- Runtime execution with tokens
- Asynchronous task completion
- Error handling in one branch affects merge
- Need timeout mechanisms

### Your implementation:

**Status**: ✅ **NOT APPLICABLE** - Different model

**Why you don't have this problem**:
```typescript
// You're not doing runtime execution, you're modeling static structure
parallel {
  path success { A -> B }
  path failure { X -> Y }
}
// Both paths are ALWAYS present in the computed view
// No tokens, no runtime, no deadlock possible
```

**Your model**:
- All paths are defined at design time
- Each path generates edges independently
- No synchronization semantics
- Purely declarative, not imperative

**Verdict**: ✅ Your approach is simpler and correct for documentation use case

---

## Comparison #2: Multi-Merge Problems

### What the industry faces:

**BPMN Multi-Merge Problem**:
```
Task A ──┐
         ├──> [Merge] ──> Next Task
Task B ──┘

But if Task A runs twice, you get 2 tokens at merge!
```

**Issue**: When multiple execution tokens reach a merge point that expects only one, creates duplicate executions.

**Quote from research**:
> "Multi-merges are not necessarily an error in terms of BPMN but they usually create an unintended process behavior, occurring when multiple tokens are not synchronized" - Flokzu

**Real example** (workflow engine):
```javascript
// Task A emits 2 events
taskA.on('complete', () => triggerMerge())  // Called twice!
taskA.on('retry-complete', () => triggerMerge())  // Oops, duplicate

merge.onTrigger(() => {
  // This runs TWICE when it should run once
  sendEmail()  // User gets 2 emails!
})
```

### Your implementation:

**Status**: ✅ **HANDLED** - No merge semantics

**Why you don't have this problem**:
```typescript
// Each path creates distinct, numbered edge IDs
parallel {
  path p1 { A -> B }  // Creates step-01.01.01
  path p2 { A -> B }  // Creates step-01.02.01 (different ID!)
}

// Result:
edges: [
  { id: 'step-01.01.01', source: A, target: B, branchTrail: [...] },
  { id: 'step-01.02.01', source: A, target: B, branchTrail: [...] }
]
// Two independent edges, no "merging"
```

**Your approach**:
- No merge nodes
- Each edge is independent
- Visual rendering shows both paths
- No execution semantics to conflict

**Verdict**: ✅ Elegant solution - parallel paths are just "alternative scenarios" to display

---

## Comparison #3: Non-Deterministic Execution Order

### What the industry faces:

**Workflow Engine Problem**:
```javascript
// Google Cloud Workflows
parallel:
  branches:
    - branch1:
        call: api.fetchUserData
    - branch2:
        call: api.fetchOrderData
    - branch3:
        call: api.fetchInventory

// Which completes first? UNPREDICTABLE!
// Order might be: 2, 1, 3 on first run
// Then: 1, 3, 2 on second run
```

**Quote from research**:
> "Parallel branches and iterations can run in any order, and might run in a different order with each execution. This non-deterministic behavior can create challenges when workflows depend on specific ordering." - Google Cloud Workflows docs

**Problems this causes**:
- Debugging is hard (different trace each time)
- Race conditions if branches share state
- Flaky tests
- Need synchronization primitives

**Real example** (Azure Logic Apps):
```json
{
  "actions": {
    "Parallel_Branch": {
      "type": "Foreach",
      "foreach": "@triggerBody()?['items']",
      "actions": {
        // These run in parallel, ORDER IS RANDOM!
      },
      "runtimeConfiguration": {
        "concurrency": {
          "repetitions": 20  // 20 parallel executions!
        }
      }
    }
  }
}
```

### Your implementation:

**Status**: ✅ **HANDLED** - Deterministic by design

**Why you don't have this problem**:
```typescript
// Your paths have explicit ordering
parallel {
  path success { ... }   // pathIndex: 1
  path fallback { ... }  // pathIndex: 2
  path error { ... }     // pathIndex: 3
}

// Stored in computed view:
branchCollections: [{
  paths: [
    { pathIndex: 1, ... },  // ALWAYS in this order
    { pathIndex: 2, ... },
    { pathIndex: 3, ... }
  ]
}]

// Step IDs reflect order:
step-01.01.01  // Path 1, step 1
step-01.02.01  // Path 2, step 1
step-01.03.01  // Path 3, step 1
```

**Your approach**:
- Order is defined by source code position
- Parser assigns sequential `pathIndex`
- Visual rendering is deterministic
- Same input always produces same output

**Verdict**: ✅ Your static model is inherently deterministic

---

## Comparison #4: Nested Branch Visualization Complexity

### What the industry faces:

**Jenkins Pipeline Problem**:
```groovy
pipeline {
  stages {
    stage('Level 1') {
      parallel {
        stage('Branch A') {
          parallel {  // NESTED parallel
            stage('A1') { }
            stage('A2') { }
          }
        }
      }
    }
  }
}
```

**Quote from research**:
> "Blue Ocean will display top-level stages, plus parallel branches inside a top-level stage, but currently **no more**. The Pipeline Stage View plugin will currently only display a linear list of stages" - Jenkins documentation

**Why it's hard**:
- Nested boxes within boxes (visual complexity)
- Limited screen real estate
- Tree rendering is expensive
- User cognitive overload

**Screenshot example**: Jenkins shows max 2 levels, deeper nesting is flattened

### Your implementation:

**Status**: ⚠️ **POTENTIAL CONCERN** - No depth limit

**Current state**:
```typescript
// This is ALLOWED but could be problematic:
alternate {
  path {
    parallel {
      path {
        alternate {
          path {
            parallel {
              // 5 LEVELS DEEP!
            }
          }
        }
      }
    }
  }
}

// Branch trail can be arbitrarily deep:
branchTrail: [
  { branchId: '/alt@0', pathIndex: 1, ... },
  { branchId: '/par@0', pathIndex: 1, ... },
  { branchId: '/alt@1', pathIndex: 1, ... },
  { branchId: '/par@1', pathIndex: 1, ... },
  // No limit!
]
```

**Rendering layer concern**:
- If using XYFlow or similar, deeply nested groups may not render well
- Step IDs become very long: `step-01.01.01.01.01`
- User confusion

**Recommendation**: Add the depth validation (Edge Case #2)

**Verdict**: ⚠️ Learn from Jenkins - add depth limit to prevent issues

---

## Comparison #5: Data Interference in Parallel Execution

### What the industry faces:

**n8n Workflow Problem** (from GitHub issues):
```javascript
// n8n parallel branches
Workflow 1: Read from Database -> Transform -> Write to Database
Workflow 2: Read from Database -> Transform -> Write to Database
Workflow 3: Read from Database -> Transform -> Write to Database

// All 3 run in parallel...
// Problem: They interfere with each other's data!
// Workflow 1 reads row, Workflow 2 modifies it, Workflow 1 writes stale data
```

**Quote from research**:
> "Parallel executions seem to be interfering with each other, causing incorrect calculations. After multiple tests, I suspect this could be either a bug or an unexpected behavior in how data is processed when multiple branches run simultaneously." - n8n community

**This is a classic race condition**:
```javascript
let sharedState = { counter: 0 }

// Branch A
sharedState.counter++  // Read: 0, Write: 1

// Branch B (runs at same time)
sharedState.counter++  // Read: 0 (stale!), Write: 1 (lost update!)

// Result: counter = 1, should be 2
```

### Your implementation:

**Status**: ✅ **NOT APPLICABLE** - No shared mutable state

**Why you don't have this problem**:
```typescript
// Your steps don't execute, they're just data structures
parallel {
  path p1 {
    api -> database  // This is METADATA, not execution
  }
  path p2 {
    api -> cache     // No shared state to corrupt
  }
}

// Each step is immutable:
interface DynamicStep {
  readonly source: Fqn
  readonly target: Fqn
  readonly title?: string
  // All readonly!
}
```

**Your data model**:
- Immutable data structures
- No execution context
- No mutable shared state
- Purely functional transformation

**Verdict**: ✅ Functional programming FTW - no race conditions possible

---

## Comparison #6: Synchronization and Race Conditions

### What the industry faces:

**LangGraph Multi-Agent Problem**:
```python
# Parallel agent execution
async def supervisor_node(state):
    parallel_nodes = [agent1, agent2, agent3]

    # Launch all in parallel
    tasks = [asyncio.create_task(node(state)) for node in parallel_nodes]

    # BUG: Supervisor proceeds before agents finish!
    results = await asyncio.wait(tasks, timeout=5.0)
    # If timeout, some agents still running!

    return process_results(results)  # INCOMPLETE RESULTS
```

**Quote from research**:
> "Without proper synchronization, a supervisor might proceed before slower branches complete, causing incomplete results or race conditions. This is particularly problematic in multi-agent systems where parallel branches have asymmetric completion times." - Medium article on LangGraph

**Dify Workflow Bug** (GitHub Issue #12492):
```javascript
// Merge node not triggered after parallel execution
parallel_node.execute()
  .then(() => {
    // Sometimes this never fires!
    merge_node.trigger()
  })

// Root cause: Race condition in result queue
// Fix required proper synchronization primitives
```

### Your implementation:

**Status**: ✅ **NOT APPLICABLE** - No async execution

**Why you don't have this problem**:
```typescript
// Your compute is synchronous, single-threaded
processBranchAwareSteps(viewSteps: DynamicViewStep[]): void {
  const branchStack: BranchStackEntry[] = []

  for (const step of viewSteps) {
    if (isDynamicBranchCollection(step)) {
      processBranchCollection(step, rootIndex)  // Synchronous!
      rootIndex++
    }
  }
}
// No promises, no async, no race conditions
```

**Your execution model**:
- Single-threaded computation
- Synchronous processing
- Deterministic order
- Complete before returning

**Verdict**: ✅ Simplicity wins - no async complexity needed

---

## Comparison #7: Empty Branch Handling

### What the industry faces:

**Google Cloud Workflows - Empty Branch**:
```yaml
parallel:
  branches:
    - branch1:
        steps:
          - call_api: ...
    - branch2:
        steps: []  # EMPTY!
    - branch3:
        steps:
          - call_database: ...

# What happens?
# - Some engines skip empty branches silently
# - Others throw runtime errors
# - Inconsistent behavior across platforms
```

**AWS Step Functions**:
```json
{
  "Type": "Parallel",
  "Branches": [
    {
      "StartAt": "Task1",
      "States": { "Task1": {...} }
    },
    {
      "StartAt": "???",  // No states defined!
      "States": {}      // EMPTY - ERROR!
    }
  ]
}
// AWS: InvalidDefinition error at deployment time
```

### Your implementation:

**Status**: ⚠️ **PARTIALLY HANDLED**

**What you validate**:
```typescript
// ✅ Empty branch collection:
parallel {
  // No paths, no steps - ERROR
}

// ✅ Single path (degenerate):
parallel {
  path only { ... }  // WARNING
}
```

**What you DON'T validate**:
```typescript
// ❌ Empty individual path:
parallel {
  path success { api -> db }
  path failure {
    // NO STEPS! Should error but doesn't
  }
}
```

**Verdict**: ⚠️ Need to add validation (Edge Case #1)

---

## Comparison #8: Condition Evaluation Order (Exclusive Gateways)

### What the industry faces:

**BPMN Exclusive Gateway Rules**:
```xml
<exclusiveGateway id="decision">
  <sequenceFlow targetRef="path1" condition="${score >= 80}" />
  <sequenceFlow targetRef="path2" condition="${score >= 60}" />
  <sequenceFlow targetRef="path3" condition="${score >= 40}" />
  <sequenceFlow targetRef="default" />  <!-- Default if none match -->
</exclusiveGateway>

<!-- If score = 85, which path? -->
<!-- Answer: path1 (first match wins) -->
```

**Quote from research**:
> "If more than one condition evaluates to true, the path that was **defined first** is chosen." - Flowable documentation

**Problem scenarios**:
```javascript
// WRONG ORDER:
if (score >= 40) return 'fail'   // Matches 85!
if (score >= 60) return 'pass'   // Never reached
if (score >= 80) return 'excellent'  // Never reached

// RIGHT ORDER:
if (score >= 80) return 'excellent'
if (score >= 60) return 'pass'
if (score >= 40) return 'fail'
```

**Default flow importance**:
> "Whenever conditions on other paths aren't met, the instance proceeds via the Default Flow" - SAP Signavio

### Your implementation:

**Status**: ❌ **NOT APPLICABLE** - No conditions

**Current state**:
```typescript
// You have alternate, but no guards:
alternate {
  path success { ... }    // When does this execute? Unknown
  path failure { ... }    // When does this execute? Unknown
  default path retry { ... }  // defaultPathId exists but not enforced
}

// defaultPathId is metadata only:
interface DynamicBranchCollectionBase {
  readonly defaultPathId?: string  // Just a marker, no fallback logic
}
```

**Why you don't have conditions**:
- You're documenting flows, not executing them
- Conditions would require expression language
- Evaluation would need runtime context

**Future consideration**:
If you add guards (Edge Case #2 in missing features):
```typescript
alternate {
  path success when "[statusCode == 200]" { ... }  // First match
  path failure when "[statusCode >= 400]" { ... }  // Second match
  default path { ... }  // Fallback if none match
}
```

**Verdict**: 📋 Future feature - document first-match-wins if guards added

---

## Comparison #9: Nested Execution Limitations

### What the industry faces:

**Microsoft Power Automate Limitation**:
```
Apply to each (outer loop)
  └─ Apply to each (inner loop)
      └─ Apply to each (innermost)  // ❌ ALWAYS SEQUENTIAL!
```

**Quote from research**:
> "When you nest Apply to each actions, **the inner actions always execute sequentially**. This is a significant limitation in platforms like Power Automate, where concurrency controls for Apply to each actions take effect **only on the highest level** in the cloud flow." - Microsoft Learn

**Practical impact**:
```javascript
// Outer loop: 10 items (parallel)
for (let item of outerArray) {  // These run in parallel

  // Inner loop: 5 items (sequential - SLOW!)
  for (let subItem of innerArray) {  // These run one-by-one!
    await processSubItem(subItem)
  }
}

// Total time: Much slower than expected
```

### Your implementation:

**Status**: ✅ **NOT APPLICABLE** - No execution, but well-designed

**Your nested structure**:
```typescript
// You support arbitrary nesting:
parallel {
  path p1 {
    alternate {
      path a {
        parallel {
          // 3 levels deep - fully supported
        }
      }
    }
  }
}

// Each level is processed:
branchStack: [
  { branch: parallel, path: p1, pathIndex: 1 },
  { branch: alternate, path: a, pathIndex: 1 },
  { branch: parallel, path: ..., pathIndex: 1 }
]
```

**Your approach is cleaner**:
- No execution limitations
- Consistent behavior at all depths
- Stack-based tracking works uniformly

**Verdict**: ✅ Your recursion model is elegant and scalable

---

## Comparison #10: Performance with Non-Blocking Steps

### What the industry faces:

**Google Cloud Workflows Advisory**:
```yaml
parallel:
  branches:
    - branch1:
        steps:
          - assign_variable: ${x = 1}  # Non-blocking
    - branch2:
        steps:
          - assign_variable: ${y = 2}  # Non-blocking

# Performance gain: ZERO!
# These are instant operations, parallelization overhead > benefit
```

**Quote from research**:
> "Parallel branches provide **no performance advantages** for non-blocking steps, such as assignments, conditions, or non-blocking calls." - Google Cloud Workflows docs

**When parallelization helps**:
```yaml
# GOOD USE:
parallel:
  branches:
    - call_api_1: ...      # 2 second network call
    - call_api_2: ...      # 2 second network call
    - call_database: ...   # 1 second query
# Time: 2 seconds (parallel) vs 5 seconds (sequential)

# BAD USE:
parallel:
  branches:
    - set_var_1: ${x = 1}  # 0.001ms
    - set_var_2: ${y = 2}  # 0.001ms
# Time: 0.1ms (parallel overhead) vs 0.002ms (sequential) - SLOWER!
```

### Your implementation:

**Status**: ✅ **NOT APPLICABLE** - No runtime performance

**Why this doesn't apply**:
```typescript
// Your parallel is for DOCUMENTATION, not optimization
parallel {
  path "API Call" {
    frontend -> backend  // Not actually executed
  }
  path "Cache Check" {
    frontend -> cache    // Describes concurrent possibility
  }
}

// Compute time is the same regardless:
compute(viewSteps)  // O(n) where n = total steps
```

**Your use case**:
- Modeling concurrent behaviors
- Showing alternative scenarios
- Documenting system design
- NOT runtime optimization

**Verdict**: ✅ Different goals - you're documenting concurrency, not optimizing it

---

## Comparison #11: Break Fragment Complexity

### What the industry faces:

**UML Break Fragment Limitation**:
```
alt [condition]
  break [error occurs]
    Actor -> Error Handler
    // EXIT the alt fragment here
  else
    Actor -> Success Path
end

// Problem: Can only break ONE level!
// Can't break out of nested loops or multiple fragments
```

**Quote from research**:
> "UML allows only **one level** - directly enclosing interaction fragment - to be abandoned, which could become really annoying if double loop or loop with other combined fragments should be broken." - UML spec analysis

**Complex scenario that can't be modeled**:
```
loop [retries < 3]
  alt [payment method]
    break [account locked]
      // Want to exit BOTH loop AND alt
      // But can only exit alt!
    else
      process payment
  end
end
```

### Your implementation:

**Status**: ❌ **NOT IMPLEMENTED** - Not needed

**Current capabilities**:
```typescript
// You don't have break, opt, or exception constructs
parallel {
  path success { ... }
  path error { ... }
  // No way to say "exit entire parallel if error"
}
```

**Why it's okay**:
- Break is for execution control flow
- You're documenting, not executing
- Can show error paths explicitly
- Less complexity to maintain

**If you wanted to add it**:
```typescript
// Hypothetical syntax:
parallel {
  path success {
    api -> db
    db -> cache
  }

  path error {
    api -> errorHandler
    break  // Exit entire parallel block
  }
}
// After parallel, this step should be skipped if error path taken
```

**Verdict**: 📋 Low priority feature - documentation value is minimal

---

## Comparison #12: Weak Sequencing Ambiguity (UML)

### What the industry faces:

**UML Weak Sequencing Problem**:
```
par
  operand1:
    Actor1 -> Actor2: msg1
    Actor1 -> Actor2: msg2
  operand2:
    Actor3 -> Actor4: msg3
    Actor3 -> Actor4: msg4
end

// Within operand1: msg1 MUST happen before msg2 (strict)
// Within operand2: msg3 MUST happen before msg4 (strict)
// Between operands: msg1, msg2, msg3, msg4 can INTERLEAVE in any way!
```

**Quote from research**:
> "In a Par fragment, the order of operands is enforced, but the order of messages **within each operand follows weak sequencing**. A weak sequencing can act like a parallel fragment when operands participate on different lifelines, but turns into a strict order when its operands appear on the **same lifeline**." - IBM Docs

**Ambiguity example**:
```
par
  operand1:
    A -> B: msg1
    B -> C: msg2  // B is source
  operand2:
    X -> B: msg3  // B is target
    B -> Y: msg4  // B is source again!
end

// AMBIGUOUS! When B appears in both operands:
// Does msg3 happen before or after msg2?
// The order is "implementation-defined"!
```

**Simulation/execution problem**: Different tools may render this differently

### Your implementation:

**Status**: ✅ **HANDLED** - Each path is independent

**Your model**:
```typescript
parallel {
  path p1 {
    A -> B
    B -> C
  }
  path p2 {
    X -> B
    B -> Y
  }
}

// How you handle this:
// Each path generates SEPARATE edges with distinct IDs:
edges: [
  { id: 'step-01.01.01', source: A, target: B, branchTrail: [p1] },
  { id: 'step-01.01.02', source: B, target: C, branchTrail: [p1] },
  { id: 'step-01.02.01', source: X, target: B, branchTrail: [p2] },
  { id: 'step-01.02.02', source: B, target: Y, branchTrail: [p2] }
]

// No ambiguity! Each edge knows which path it belongs to
// Visual rendering shows them as separate scenarios
```

**Your approach advantages**:
- No weak sequencing rules needed
- Each path is a complete scenario
- Branch trail clearly identifies lineage
- No interleaving semantics

**Verdict**: ✅ Your model is simpler and avoids UML's complexity

---

## Summary Table: 12 Edge Case Comparisons

| # | Industry Issue | Your Status | Reason |
|---|----------------|-------------|--------|
| 1 | Deadlock in parallel merge | ✅ N/A | No runtime execution, no tokens |
| 2 | Multi-merge duplicates | ✅ Handled | Distinct edge IDs, no merge nodes |
| 3 | Non-deterministic order | ✅ Handled | Deterministic path ordering |
| 4 | Nested visualization limits | ⚠️ Concern | No depth limit (add validation) |
| 5 | Data race conditions | ✅ N/A | Immutable data, no execution |
| 6 | Synchronization issues | ✅ N/A | Synchronous processing |
| 7 | Empty branch handling | ⚠️ Partial | Need empty path validation |
| 8 | Condition evaluation order | 📋 Future | No conditions yet (guards feature) |
| 9 | Nested execution limits | ✅ N/A | Consistent at all depths |
| 10 | Performance overhead | ✅ N/A | Different goals (documentation) |
| 11 | Break fragment complexity | 📋 Low priority | Execution feature, not needed |
| 12 | Weak sequencing ambiguity | ✅ Handled | Independent paths, no interleaving |

**Legend**:
- ✅ Handled / N/A: Your implementation is fine
- ⚠️ Concern: Needs attention (see Edge Cases #1, #2)
- 📋 Future: Consider for future features

**Key Insight**: Your static, declarative model **elegantly avoids** most runtime execution problems that plague BPMN/workflow engines!

---

## Conclusion

### Missing Edge Cases: Quick Reference

**MUST FIX** (1 hour):
1. ✅ Empty path validation (15 min)
2. ✅ Nesting depth limit (30 min)
3. ✅ Mixed path style hint (15 min)

**SHOULD FIX** (2 hours):
4. ✅ Add series-in-branch test (20 min)
5. ✅ Add missing test coverage (90 min)

**NICE TO HAVE** (later):
6. Circular navigateTo detection (separate concern)
7. Both __parallel and paths assertion (10 min)

### Industry Comparisons: Key Takeaway

Your static modeling approach **naturally avoids** 10 out of 12 runtime execution problems. The 2 that apply (nesting depth, empty branches) have straightforward fixes.

**You've made smart design choices** that prioritize:
- Simplicity over runtime complexity
- Determinism over performance optimization
- Documentation clarity over execution semantics

Keep this philosophy when considering future features (guards, loops)!
