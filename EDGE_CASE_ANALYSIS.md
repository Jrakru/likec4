# Edge Case Analysis: Parallel & Alternate Branch Implementation

## Executive Summary

This document analyzes the alternate and parallel branch feature implementation in LikeC4's dynamic views, comparing it against common issues found in BPMN, UML sequence diagrams, and workflow engines.

**Status**: ✅ The implementation handles most critical edge cases well, with comprehensive validation.
**Gaps Identified**: 6 missing features and 8 edge cases that need consideration.

---

## 1. Current Implementation Coverage

### ✅ Well-Handled Edge Cases

| Edge Case | Status | Implementation Location | Notes |
|-----------|--------|------------------------|-------|
| **Empty branches** | ✅ COVERED | `validation/dynamic-view.ts:97-101` | Error: "block has no paths or steps" |
| **Single-path branches** | ✅ COVERED | `validation/dynamic-view.ts:104-117` | Warning: "no branching value" |
| **Duplicate path names** | ✅ COVERED | `validation/dynamic-view.ts:178-202` | Error with code `LIKEC4-DUP-PATH-NAME` |
| **Nested homogeneous parallel (P-in-P)** | ✅ COVERED | `validation/dynamic-view.ts:119-156` | Error: "flatten inner parallel" |
| **Nested homogeneous alternate (A-in-A)** | ✅ COVERED | `validation/dynamic-view.ts:158-176` | Hint: "can be flattened" |
| **Nested heterogeneous (P-in-A, A-in-P)** | ✅ COVERED | Tests confirm allowed | Branch trail tracks depth correctly |
| **Multiple steps within single path** | ✅ COVERED | `branch-collections.spec.ts:123-147` | `indexWithinPath` increments correctly |
| **Mixed steps and branches** | ✅ COVERED | `branch-collections.spec.ts:317-350` | Steps before/after branches handled |
| **Branch trail tracking** | ✅ COVERED | `compute.ts:134-147` | Full trail with branchId, pathId, kind, pathIndex |
| **Default path marking** | ✅ COVERED | `compute.ts:144, 159` | `isDefaultPath` flag set correctly |
| **Legacy parallel compatibility** | ✅ COVERED | `compute.ts:259-326, 341-356` | Feature flag controls processing mode |
| **Parent-child relationship validation** | ✅ COVERED | `validation/dynamic-view.ts:30-34` | Prevents `parent -> child` steps |
| **Invalid backward chaining** | ✅ COVERED | `validation/dynamic-view.ts:42-46` | Prevents chain after backward step |
| **Path metadata preservation** | ✅ COVERED | `compute.ts:154-170` | Title, description, tags preserved |
| **Step ID hierarchical numbering** | ✅ COVERED | `compute.ts:246-257` | Format: `step-01.02.01` for nested branches |

---

## 2. Common Issues from Research vs. Your Implementation

### Issue: Deadlock in Parallel Gateways (BPMN)

**Problem**: In BPMN, parallel merge gateways expect tokens on ALL incoming flows. If a path doesn't execute, deadlock occurs.

**Your Implementation**: ✅ **NOT APPLICABLE**
- You're modeling static diagrams, not runtime execution
- All paths are defined at design time
- No token-based execution model

### Issue: Multi-merge Problems

**Problem**: Multiple tokens reaching a merge point create unexpected behavior.

**Your Implementation**: ✅ **HANDLED**
- Each path generates distinct edge IDs (`step-01.01.01`, `step-01.02.01`)
- No merging semantics - each path is independently visualized
- Branch trail tracks full lineage

### Issue: Non-deterministic Execution Order

**Problem**: Parallel branches may execute in different orders on each run.

**Your Implementation**: ✅ **HANDLED**
- Paths are numbered deterministically (pathIndex: 1, 2, 3...)
- Order is defined by source code order
- Visual rendering is deterministic

### Issue: Nested Branch Visualization Complexity

**Problem**: Tools like Jenkins Blue Ocean can't visualize deeply nested parallel stages.

**Your Implementation**: ⚠️ **POTENTIAL CONCERN**
- No depth limit validation
- Branch trail can be arbitrarily deep
- Rendering layer may struggle with 4+ nesting levels

**Recommendation**: Add validation for maximum nesting depth (e.g., 3 levels).

---

## 3. Missing Features & Edge Cases

### 🔴 CRITICAL GAPS

#### 1. **Empty Paths**

**Issue**: A path with zero steps is allowed in the type system but not validated.

```typescript
// Type system allows this:
{
  pathId: '/path@0',
  steps: []  // EMPTY!
}
```

**Current State**: ❌ No validation in `dynamic-view.ts`

**Evidence**: `DynamicBranchPath` requires `steps: NonEmptyReadonlyArray` but runtime may not enforce this.

**Recommendation**:
```typescript
// Add to dynamicViewBranchCollection validation
if (path.steps.length === 0) {
  accept('error', 'Path must contain at least one step', {
    node: path,
    code: 'LIKEC4-EMPTY-PATH'
  })
}
```

---

#### 2. **No Guard/Condition Support** (Exclusive Gateways)

**Issue**: Alternate branches lack conditional expressions (guards).

**Research Finding**: BPMN exclusive gateways require:
- Conditions on outgoing flows
- Default flow for unmet conditions

**Current State**: ❌ No syntax for conditions
```typescript
// Cannot express:
alternate {
  path success when (statusCode == 200) { ... }
  path error when (statusCode >= 400) { ... }
  path default { ... }  // fallback
}
```

**Impact**:
- Cannot model real decision logic
- Documentation relies on path names/titles only
- Alternate blocks are purely documentation, not specification

**Recommendation**: **FUTURE FEATURE** - Add optional guards:
```typescript
interface DynamicBranchPath<A> {
  readonly guard?: Expression  // e.g., "[statusCode == 200]"
  readonly isDefault?: boolean  // fallback path
  // ... existing fields
}
```

**Grammar Extension**:
```langium
DynamicViewBranchPath:
  'path' name=Id? guard=BranchGuard? title=String? '{'
    steps+=DynamicViewStepLike+
  '}'
  | 'default' 'path' name=Id? title=String? '{'
    steps+=DynamicViewStepLike+
  '}';

BranchGuard: '[' expression=STRING ']';
```

---

#### 3. **No Loop/Iteration Support**

**Issue**: Cannot model repeated steps or loops.

**Research Finding**: UML sequence diagrams support `loop` fragments.

**Current State**: ❌ No loop syntax

**Use Cases**:
- Retry logic: "Retry API call up to 3 times"
- Batch processing: "For each item in cart"
- Polling: "While status != complete"

**Recommendation**: **FUTURE FEATURE** - Add loop construct:
```typescript
loop (count: 1..3) {
  api -> database
}

loop while [status != 'complete'] {
  client -> server
}
```

---

#### 4. **No Break/Exception Handling**

**Issue**: Cannot model error exits from branches.

**Research Finding**: UML has `break` fragments to exit enclosing interaction.

**Current State**: ❌ No exception/break syntax

**Use Case**:
```typescript
parallel {
  path success {
    api -> db
    db -> cache
  }
  path error {
    api -> errorLogger
    // break - exit entire parallel block
  }
}
// Should NOT reach here if error path executes
```

**Recommendation**: **LOWER PRIORITY** - Document-only feature, low ROI.

---

### ⚠️ IMPORTANT EDGE CASES

#### 5. **Anonymous vs. Named Path Mixing**

**Issue**: Mixing anonymous steps and named paths in same branch.

**Current Behavior**: ✅ ALLOWED
```typescript
parallel {
  path success { ... }     // Named
  customer -> api          // Anonymous - becomes implicit path
  path failure { ... }     // Named
}
```

**Validation Gap**: No warning when mixing styles.

**Recommendation**: Add hint:
```typescript
if (node.paths.length > 0 && node.steps.length > 0) {
  accept('hint',
    'Mixing named paths and anonymous steps. Consider using explicit paths for all branches.',
    { node, code: 'LIKEC4-MIXED-PATH-STYLE' }
  )
}
```

---

#### 6. **Series (Chained Steps) Within Branches**

**Issue**: `A -> B -> C` chains inside branches.

**Current State**: ✅ HANDLED in tests (`branch-collections.spec.ts` - not shown but implied by series support)

**Potential Gap**: Series ID generation within nested branches.

**Verification Needed**: Does `step-01.02.01` handle series correctly?

**Test Case Missing**:
```typescript
parallel {
  path success {
    A -> B -> C  // Series: should generate step-01.01.01, step-01.01.02, step-01.01.03
  }
}
```

**Recommendation**: Add explicit test for series-in-branch ID generation.

---

#### 7. **Deeply Nested Branches (4+ Levels)**

**Issue**: No maximum depth validation.

**Current State**: ⚠️ UNBOUNDED
```typescript
alternate {
  path {
    parallel {
      path {
        alternate {
          path {
            parallel {
              // 5 levels deep!
            }
          }
        }
      }
    }
  }
}
```

**Problems**:
- Step IDs become unwieldy: `step-01.01.01.01.01.01`
- Visual rendering complexity
- Cognitive overload for diagram readers

**Recommendation**: Add validation:
```typescript
const MAX_BRANCH_DEPTH = 3

function calculateBranchDepth(node: AST, depth = 0): number {
  // Recursive depth calculation
}

if (calculateBranchDepth(node) > MAX_BRANCH_DEPTH) {
  accept('warning', `Branch nesting exceeds recommended depth of ${MAX_BRANCH_DEPTH}`,
    { node, code: 'LIKEC4-DEEP-NESTING' }
  )
}
```

---

#### 8. **Circular References in Navigate To**

**Issue**: Steps can navigate to other views, but no cycle detection.

**Current State**: ❌ NOT VALIDATED
```typescript
// View A
dynamic view A {
  parallel {
    path p1 {
      x -> y with navigateTo: viewB
    }
  }
}

// View B
dynamic view B {
  x -> y with navigateTo: viewA  // CYCLE!
}
```

**Impact**: Infinite navigation loops in UI.

**Recommendation**: **SEPARATE CONCERN** - Handle in view graph validation, not branch-specific.

---

### 🔵 NICE-TO-HAVE FEATURES

#### 9. **Path Probability/Weight**

**BPMN Inclusive Gateways** support weighted paths for simulation.

**Use Case**: "Path A: 80% probability, Path B: 20% probability"

**Recommendation**: **FUTURE FEATURE** - Low priority for documentation tool.

---

#### 10. **Path Conditions Evaluation Order**

**BPMN Best Practice**: When multiple conditions match, first-defined wins.

**Your Implementation**: Not applicable (no conditions).

**Future Consideration**: If guards added, document evaluation order.

---

#### 11. **Parallel Path Merge Semantics**

**Issue**: What happens after parallel paths complete?

**Current State**: ✅ IMPLICIT - Each path generates independent edges, no merge node.

**Research Finding**: Dify/AWS workflows have explicit merge nodes.

**Your Model**: **CORRECT FOR DIAGRAMS** - Parallel paths represent concurrent possibilities, not runtime synchronization.

---

#### 12. **Ignore/Optional Fragments**

**UML Feature**: `ignore` operator for messages to exclude.

**Use Case**: "Show main flow, ignore error handling"

**Recommendation**: **OUT OF SCOPE** - Use view filtering instead.

---

## 4. Data Model Edge Cases

### Type Safety Issues

#### Issue: `__parallel` vs `paths` Redundancy

**Code**: `DynamicParallelBranch` has both:
- `__parallel?: NonEmptyReadonlyArray<DynamicStep | DynamicStepsSeries>` (legacy)
- `paths: NonEmptyReadonlyArray<DynamicBranchPath>` (new)

**Problem**: Two sources of truth.

**Current Handling**: ✅ `isLegacyParallel` flag distinguishes

**Potential Issue**: What if BOTH are populated?

**Test Gap**: No test for malformed data with both fields.

**Recommendation**: Add assertion in compute:
```typescript
if (branch.__parallel && branch.paths.length > 0) {
  invariant(branch.isLegacyParallel,
    'Cannot have both __parallel and paths populated in non-legacy branch'
  )
}
```

---

#### Issue: `NonEmptyReadonlyArray` Runtime Enforcement

**Type**: `paths: NonEmptyReadonlyArray<DynamicBranchPath<A>>`

**Problem**: TypeScript type, not runtime check.

**Test**: Can AST parser produce empty arrays?

**Validation**: ✅ Covered by "empty branch" check.

---

## 5. Missing Test Scenarios

Based on research and implementation review, add these tests:

### Critical Tests

1. **Empty path in branch collection**
   ```typescript
   it('should error on path with no steps', () => {
     // path { } with no steps inside
   })
   ```

2. **Series within nested branches**
   ```typescript
   it('should generate correct IDs for chained steps in nested branches', () => {
     parallel {
       path {
         alternate {
           path {
             A -> B -> C  // Series in nested branch
           }
         }
       }
     }
   })
   ```

3. **Maximum nesting depth**
   ```typescript
   it('should warn on deeply nested branches (4+ levels)', () => {
     // 5-level nesting test
   })
   ```

4. **Mixed anonymous and named paths**
   ```typescript
   it('should hint when mixing path styles', () => {
     parallel {
       path success { ... }
       x -> y  // anonymous
     }
   })
   ```

5. **Both __parallel and paths populated**
   ```typescript
   it('should handle malformed branch with both legacy and new format', () => {
     // Edge case for data integrity
   })
   ```

### Stress Tests

6. **10+ parallel paths** - Test ID generation, performance
7. **100 steps in single path** - Test indexing limits
8. **Unicode in path names** - Test i18n edge cases

---

## 6. Comparison to Industry Standards

### BPMN 2.0 Compliance

| BPMN Feature | Your Impl | Notes |
|--------------|-----------|-------|
| Parallel Gateway (AND) | ✅ | Full support via `parallel` |
| Exclusive Gateway (XOR) | ⚠️ | `alternate` exists, but no conditions |
| Inclusive Gateway (OR) | ❌ | Not applicable for diagrams |
| Default Flow | ⚠️ | `defaultPathId` exists, but no condition fallback |
| Gateway Labels | ✅ | `label` field supported |

### UML 2.5 Sequence Diagrams

| UML Feature | Your Impl | Notes |
|-------------|-----------|-------|
| `par` (Parallel) | ✅ | Fully supported |
| `alt` (Alternative) | ✅ | Fully supported |
| `opt` (Optional) | ❌ | Could be modeled as alternate with 1 path |
| `loop` (Loop) | ❌ | Not implemented |
| `break` (Break) | ❌ | Not implemented |
| `critical` (Critical Region) | ❌ | Out of scope |
| Guards on operands | ❌ | No condition support |

### Verdict

**Strong foundation** for static diagram modeling. Missing features are primarily runtime/simulation-oriented (loops, guards) which may be lower priority for a documentation tool.

---

## 7. Recommendations Prioritized

### 🔴 HIGH PRIORITY (Implement Now)

1. **Empty path validation** - Critical data integrity issue
   - Add to `validation/dynamic-view.ts`
   - 10 lines of code

2. **Nesting depth warning** (max 3-4 levels)
   - Add recursive depth calculator
   - Warn at 4+, error at 6+
   - 30 lines of code

3. **Mixed path style hint** (anonymous + named)
   - Improve code quality signal
   - 15 lines of code

4. **Add missing test cases** (#1, #2, #3, #4 above)
   - Prevent regressions
   - 100 lines of tests

### 🟡 MEDIUM PRIORITY (Next Iteration)

5. **Guard/condition expressions** - Enables true decision modeling
   - Grammar changes
   - Parser updates
   - Validation rules
   - ~500 lines of code
   - **Design decision required**: Expression language scope

6. **Loop fragments** - Common use case (retries, iteration)
   - Grammar: `loop`, `while`, `for`
   - Compute logic for repeated steps
   - ~300 lines of code

7. **Opt fragment** (optional paths) - Syntactic sugar for `alt` with 1 path
   - Grammar change
   - Parser normalization to `alternate`
   - 50 lines of code

### 🔵 LOW PRIORITY (Future/Maybe)

8. **Break fragments** - Complex, low ROI
9. **Path probabilities** - Simulation feature, not diagram feature
10. **Inclusive gateway** (OR) - Rare in documentation contexts

---

## 8. Architecture Improvements

Given the complexity, the **refactoring proposal** from earlier is **strongly recommended**:

### Benefits for Edge Case Handling

1. **StepIdGenerator** class
   - Isolate series-in-branch ID logic
   - Easier to test deeply nested cases
   - Single responsibility

2. **BranchStackManager** class
   - Centralize depth tracking
   - Add max depth validation in one place
   - Clear API for nesting invariants

3. **Strategy pattern for processors**
   - Easy to add loop/break/opt processors later
   - Each handles its own edge cases
   - Reduces compute.ts complexity

4. **Validation in dedicated modules**
   - Separate validation for each fragment type
   - Guards validation when feature added
   - Depth validation in BranchValidator class

---

## 9. Conclusion

### What Works Well ✅

- **Comprehensive validation** of structural issues (empty, duplicate, degenerate)
- **Smart nested branch handling** (P-in-P errors, A-in-P allowed)
- **Robust ID generation** for hierarchical steps
- **Legacy compatibility** with feature flag
- **Metadata preservation** (titles, descriptions, tags)

### What Needs Work ⚠️

1. Empty path validation (10 min fix)
2. Nesting depth limits (30 min implementation)
3. Missing test coverage (2 hours)
4. Guard expressions (major feature, requires design)
5. Loop support (major feature)

### Overall Assessment

**Grade: A-**

The implementation is **production-ready** for basic parallel/alternate modeling. The gaps are mostly **future features** (guards, loops) rather than bugs.

**Critical fixes** (#1-4 above) should be addressed before merging to main, but the architecture is sound and extensible.

---

## 10. Next Steps

1. ✅ Fix empty path validation (15 min)
2. ✅ Add nesting depth warning (30 min)
3. ✅ Add mixed style hint (15 min)
4. ✅ Write 5 missing tests (2 hours)
5. 🔄 Refactor to modular architecture (8 hours) - **Optional but recommended**
6. 📋 Design guard expression syntax (1 week) - **Future iteration**
7. 📋 Implement loop fragments (1 week) - **Future iteration**

**Total time to production-hardened**: ~3-4 hours of focused work.

---

**Document Version**: 1.0
**Date**: 2025-11-05
**Author**: AI Code Analysis
**Codebase**: LikeC4 @ commit `313fc94`
