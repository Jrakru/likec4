# Requirements Verification Matrix

**Date:** 2025-10-24  
**Purpose:** Verify all requirements from APPROACH document and ADRs are captured in implementation plan

---

## Section 6: Walkthrough & Navigation Experience

### 6.1 Core Types & Interfaces

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| `BranchContext` interface with `branchId`, `kind`, `pathIndex`, `pathId`, `pathCount`, `default` | APPROACH 6.1 | ADR-001, types.ts | ✅ COVERED |
| Add `depth` field to `BranchContext` for nested branches | Design Decision | ADR-002, ADR-006 | ✅ COVERED |
| `ActiveWalkthrough` discriminated union (linear \| branch) | APPROACH 6.1 | ADR-001, types.ts | ✅ COVERED |

### 6.2 Navigation Controls

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| **Next/Previous**: Traverse linearized order | APPROACH 6.2 | ADR-002, navigation.ts | ✅ COVERED |
| **Auto-follow default path** when entering branch | APPROACH 6.2 | ADR-001, ADR-002, navigation.ts | ✅ COVERED |
| **Jump to Decision Point**: Rewind to branch root via `walkthrough.jumpToBranch` | APPROACH 6.2 | ADR-001, walkthrough-machine.ts | ✅ COVERED |
| **Branch Selection**: Present path selector (dropdown or keyboard) | APPROACH 6.2 | ADR-001, BranchSelector.tsx | ✅ COVERED |
| **Parallel: Auto-iterate sequentially** through all paths | APPROACH 6.2 | ADR-001, ADR-002, navigation.ts | ✅ COVERED |
| **Parallel: "View all branches"** toggled view option | APPROACH 6.2 | ADR-001, context field | ✅ COVERED |
| **Alternate History**: Show CTA after completing branch | APPROACH 6.2 | ADR-003, completion.ts | ✅ COVERED |
| **Completion Set**: Avoid re-running default path unintentionally | APPROACH 6.2 | ADR-003, CompletionTracker | ✅ COVERED |
| **Backtracking**: Respect branch boundaries, return to root | APPROACH 6.2 | ADR-002, navigation.ts | ✅ COVERED |

### 6.3 Progress Indicators

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Display breadcrumb of branch ancestry | APPROACH 6.3 | ADR-002, WalkthroughProgress.tsx | ✅ COVERED |
| Provide counters: "Path 2 of 4", "Step 5 of 9" | APPROACH 6.3 | ADR-002, progress.ts | ✅ COVERED |
| Persist walkthrough state in URL hash for shareable links | APPROACH 6.3 | ADR-004, url-state.ts | ✅ COVERED |

---

## Section 7: Quality-of-Life Enhancements

### 7.1 Metadata & Storytelling

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Optional branch-level `guard` field | APPROACH 7.1 | Out of scope for PR04 | ⏳ FUTURE |
| Optional `confidence`/`probability` numeric fields | APPROACH 7.1 | Out of scope for PR04 | ⏳ FUTURE |
| Optional `owner` field (person/team) | APPROACH 7.1 | Out of scope for PR04 | ⏳ FUTURE |
| Step-level `evidence` or `references` | APPROACH 7.1 | Out of scope for PR04 | ⏳ FUTURE |

### 7.2 View Toggles & Scenario Modes

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| "Scenario filters" to enable/disable paths | APPROACH 7.2 | Out of scope for PR04 | ⏳ FUTURE |
| Export branch path as dedicated view | APPROACH 7.2 | Out of scope for PR04 | ⏳ FUTURE |
| Compare mode (side-by-side diff) | APPROACH 7.2 | Out of scope for PR04 | ⏳ FUTURE |

### 7.3 Collaboration Hooks

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Analytics events ("user watched branch X") | APPROACH 7.3 | Out of scope (PR07 telemetry) | ⏳ PR07 |
| Comment markers on branch nodes | APPROACH 7.3 | Out of scope for PR04 | ⏳ FUTURE |

### 7.4 Accessibility & Keyboard Support

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Keyboard shortcuts for branch switching | APPROACH 7.4 | Day 5: Keyboard navigation | ✅ COVERED |
| Number keys (1, 2, 3) for path selection | Design Decision | Day 5: BranchSelector | ✅ COVERED |
| Arrow keys for next/previous | Existing | Already implemented | ✅ EXISTS |
| Screen-reader friendly labels with ARIA | APPROACH 7.4 | Day 5: Component tests | ✅ COVERED |

### 7.5 Testing & Tooling

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| State machine unit tests for new events | APPROACH 7.5 | Day 3: Machine tests | ✅ COVERED |
| Regression tests for compute output | APPROACH 7.5 | Day 2: Unit tests | ✅ COVERED |
| Screenshot-based tests (Playwright/Storybook) | APPROACH 7.5 | Day 5: E2E tests | ✅ COVERED |
| Grammar + formatter tests | APPROACH 7.5 | Out of scope (no syntax changes) | N/A |

---

## ADR-001: State Machine Event Signatures

| Requirement | Implementation | Status |
|------------|----------------|---------|
| Unified `walkthrough.navigate` event | walkthrough-machine.ts | ✅ COVERED |
| Action: `{ type: 'next' }` | Event types | ✅ COVERED |
| Action: `{ type: 'previous' }` | Event types | ✅ COVERED |
| Action: `{ type: 'jumpToBranch', branchId }` | Event types | ✅ COVERED |
| Action: `{ type: 'selectPath', pathIndex }` | Event types | ✅ COVERED |
| Action: `{ type: 'jumpToStep', stepId }` | Event types | ✅ COVERED |
| Auto-follow default paths on "next" | navigation.ts logic | ✅ COVERED |
| Pause at branches without default | State: branchDecision | ✅ COVERED |
| Parallel: iterate sequentially | navigation.ts logic | ✅ COVERED |
| "View all branches" mode toggle | Context field | ✅ COVERED |

---

## ADR-002: Step Linearization Logic

| Requirement | Implementation | Status |
|------------|----------------|---------|
| Just-in-time computation (no pre-compute) | navigation.ts approach | ✅ COVERED |
| `computeNextStep()` function | navigation.ts | ✅ COVERED |
| `computePreviousStep()` function | navigation.ts | ✅ COVERED |
| `NavigationResult` type with action enum | types.ts | ✅ COVERED |
| Branch boundary detection | navigation.ts logic | ✅ COVERED |
| Nested branch support via depth field | types.ts, navigation.ts | ✅ COVERED |
| Path transition notifications | NavigationResult.message | ✅ COVERED |
| Progress: "Step X of Y" (linear) | progress.ts | ✅ COVERED |
| Progress: "Path X of Y, Step Z of W" (branch) | progress.ts | ✅ COVERED |
| Progress: Nested branch depth display | progress.ts | ✅ COVERED |

---

## ADR-003: Branch Completion Tracking

| Requirement | Implementation | Status |
|------------|----------------|---------|
| `BranchCompletion` interface | completion.ts types | ✅ COVERED |
| `visitedPaths` Set tracking | CompletionTracker | ✅ COVERED |
| `completedPaths` Set tracking | CompletionTracker | ✅ COVERED |
| `lastVisited` timestamp | CompletionTracker | ✅ COVERED |
| `depth` field for nested branches | CompletionTracker | ✅ COVERED |
| `parentBranchId` field | CompletionTracker | ✅ COVERED |
| localStorage persistence | CompletionTracker.saveToStorage() | ✅ COVERED |
| Set serialization/deserialization | CompletionTracker methods | ✅ COVERED |
| `markPathCompleted()` method | CompletionTracker | ✅ COVERED |
| `shouldShowRevisitCTA()` method | CompletionTracker | ✅ COVERED |
| `isBranchFullyCompleted()` with nesting | CompletionTracker | ✅ COVERED |
| `getUnvisitedPaths()` method | CompletionTracker | ✅ COVERED |
| Overall progress percentage | CompletionTracker | ✅ COVERED |
| CTA placement: Toast on branch exit | Day 5: UI components | ✅ COVERED |
| CTA placement: Persistent sidebar option | Day 5: UI components | ✅ COVERED |
| Completion = reaching last step | Design decision | ✅ COVERED |
| Parent branch completion requires nested completion | Design decision | ✅ COVERED |

---

## ADR-004: URL State Persistence

| Requirement | Implementation | Status |
|------------|----------------|---------|
| Hash-based format | url-state.ts | ✅ COVERED |
| Format: `#walkthrough=step-01` (linear) | url-state.ts | ✅ COVERED |
| Format: `#walkthrough=step-01&branch=br-auth:1` | url-state.ts | ✅ COVERED |
| Format: nested branches with comma separation | url-state.ts | ✅ COVERED |
| `parseWalkthroughURL()` function | url-state.ts | ✅ COVERED |
| `buildWalkthroughURL()` function | url-state.ts | ✅ COVERED |
| `validateWalkthroughURL()` function | url-state.ts | ✅ COVERED |
| Resume prompt UI: "Resume at step X?" | Day 5: ResumePrompt.tsx | ✅ COVERED |
| Invalid URL: Show error message | url-state.ts validation | ✅ COVERED |
| Invalid URL: Fallback to beginning | url-state.ts validation | ✅ COVERED |
| StepId stability investigation | STEP-ID-STABILITY doc | ✅ COVERED |
| URL state doesn't trigger page reload | hash-based approach | ✅ COVERED |

---

## ADR-005: Hook API Signatures

| Requirement | Implementation | Status |
|------------|----------------|---------|
| `useWalkthrough()` hook | hooks/walkthrough/ | ✅ COVERED |
| Returns: isActive, currentStep, mode, branchContext, progress | useWalkthrough.ts | ✅ COVERED |
| `useWalkthroughActions()` hook | hooks/walkthrough/ | ✅ COVERED |
| Returns: start, stop, navigate, next, previous, jumpToStep, jumpToBranch, selectPath | useWalkthroughActions.ts | ✅ COVERED |
| `useWalkthroughCompletion()` hook | hooks/walkthrough/ | ✅ COVERED |
| Returns: completionState, isPathCompleted, isBranchFullyCompleted, shouldShowRevisitCTA, getUnvisitedPaths, reset | useWalkthroughCompletion.ts | ✅ COVERED |
| `useBranchSelection()` hook | hooks/walkthrough/ | ✅ COVERED |
| Returns: isAtBranchDecision, branchInfo, selectPath, cancel | useBranchSelection.ts | ✅ COVERED |
| `useWalkthroughURL()` hook | hooks/walkthrough/ | ✅ COVERED |
| Returns: urlState, updateURL, resumeFromURL, clearURL | useWalkthroughURL.ts | ✅ COVERED |
| Fine-grained subscriptions via useSelector | Implementation detail | ✅ COVERED |
| Memoized callbacks | useMemo/useCallback | ✅ COVERED |
| Usage examples provided | ADR-005 document | ✅ COVERED |
| Backward compatibility with useDiagram | Day 4 plan | ✅ COVERED |

---

## ADR-006: Walkthrough Module Architecture

| Requirement | Implementation | Status |
|------------|----------------|---------|
| Dedicated `state/walkthrough/` module | Directory structure | ✅ COVERED |
| Child actor pattern (follows existing) | XState integration | ✅ COVERED |
| `types.ts` file | Day 1 | ✅ COVERED |
| `walkthrough-machine.ts` file | Day 3 | ✅ COVERED |
| `navigation.ts` file | Day 2 | ✅ COVERED |
| `completion.ts` file | Day 2 | ✅ COVERED |
| `url-state.ts` file | Day 2 | ✅ COVERED |
| `progress.ts` file | Day 2 | ✅ COVERED |
| `__tests__/` directory | Each day | ✅ COVERED |
| `hooks/walkthrough/` module | Day 4 | ✅ COVERED |
| `ui/walkthrough/` components | Day 5 | ✅ COVERED |
| Spawn as child actor in diagram-machine | Day 3 integration | ✅ COVERED |
| Forward events with sendTo() | Day 3 integration | ✅ COVERED |
| Reduce diagram-machine.ts <1000 lines | Refactoring goal | ✅ COVERED |
| Maintain backward compatibility | Throughout implementation | ✅ COVERED |
| Foundation for future extraction | Architecture design | ✅ COVERED |

---

## Testing Requirements

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Navigation unit tests | ADR-002 | Day 2: navigation.spec.ts | ✅ COVERED |
| Completion unit tests | ADR-003 | Day 2: completion.spec.ts | ✅ COVERED |
| URL state unit tests | ADR-004 | Day 2: url-state.spec.ts | ✅ COVERED |
| Progress unit tests | ADR-002 | Day 2: progress.spec.ts | ✅ COVERED |
| State machine tests | ADR-006 | Day 3: walkthrough-machine.spec.ts | ✅ COVERED |
| Integration tests (parent-child) | ADR-006 | Day 3: integration.spec.ts | ✅ COVERED |
| Hook unit tests (all 5) | ADR-005 | Day 4: hook tests | ✅ COVERED |
| Component tests | ADR-006 | Day 5: component tests | ✅ COVERED |
| E2E Playwright tests | README | Day 5: E2E tests | ✅ COVERED |
| Keyboard navigation tests | APPROACH 7.5 | Day 5: E2E tests | ✅ COVERED |
| Accessibility tests | APPROACH 7.4 | Day 5: component tests | ✅ COVERED |
| Feature flag tests (on/off) | README DoD | Throughout testing | ✅ COVERED |
| 80%+ coverage target | README DoD | Test plan | ✅ COVERED |

---

## UI Components

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| Enhanced WalkthroughControls | Existing + new features | Day 5 | ✅ COVERED |
| WalkthroughProgress component | ADR-002, ADR-005 | Day 5: New component | ✅ COVERED |
| BranchSelector component | ADR-001, ADR-005 | Day 5: New component | ✅ COVERED |
| ResumePrompt component | ADR-004, ADR-005 | Day 5: New component | ✅ COVERED |
| "Revisit alternate paths" CTA | ADR-003 | Day 5: Toast notification | ✅ COVERED |
| Path transition notifications | ADR-002 | Day 5: UI feedback | ✅ COVERED |
| Branch breadcrumb display | APPROACH 6.3 | Day 5: Progress component | ✅ COVERED |

---

## Documentation Requirements

| Requirement | Source | Implementation | Status |
|------------|--------|----------------|---------|
| ADR-001: Event Signatures | Design phase | Complete | ✅ DONE |
| ADR-002: Step Linearization | Design phase | Complete | ✅ DONE |
| ADR-003: Completion Tracking | Design phase | Complete | ✅ DONE |
| ADR-004: URL Persistence | Design phase | Complete | ✅ DONE |
| ADR-005: Hook APIs | Design phase | Complete | ✅ DONE |
| ADR-006: Module Architecture | Design phase | Complete | ✅ DONE |
| ADR INDEX with summary | Design phase | Complete | ✅ DONE |
| README with implementation plan | Design phase | Complete | ✅ DONE |
| Quick Reference Guide | Design phase | Complete | ✅ DONE |
| Step ID stability analysis | Design phase | Complete | ✅ DONE |
| Package research document | Design phase | Complete | ✅ DONE |
| JSDoc on public APIs | README DoD | Day 4-5 | ✅ COVERED |
| Hook usage examples | ADR-005 | Complete | ✅ DONE |
| React docs update | README Section 5 | Post-implementation | ✅ COVERED |
| CHANGELOG draft | README DoD | Post-implementation | ✅ COVERED |

---

## Summary

### ✅ Fully Covered (PR04 Scope)
- Core navigation controls (next, previous, jump to branch, select path)
- Branch-aware navigation with auto-follow default
- Parallel path sequential iteration
- Nested branch support
- Completion tracking with localStorage
- "Revisit alternate paths" CTA
- URL state persistence (hash-based)
- All 5 React hooks
- Progress indicators (linear and branch)
- Keyboard navigation
- Accessibility (ARIA, screen readers)
- Comprehensive test coverage
- Modular architecture with child actor
- Complete documentation (6 ADRs + guides)

### ⏳ Future Work (Post-PR04)
- Branch-level metadata fields (guard, confidence, owner)
- Scenario filters and view toggles
- Compare mode (side-by-side diff)
- Comment markers on branch nodes
- Grammar/formatter updates (no syntax changes in PR04)
- Timeline overlays
- Branch analytics
- Conditional styling
- Auto-play simulation

### 🎯 Out of Scope (Other PRs)
- Telemetry/analytics wiring → PR07
- Final UI styling polish → PR05
- Documentation migration → PR06

---

## Verification Result

**✅ ALL PR04 REQUIREMENTS COVERED**

Every requirement from:
- APPROACH document Section 6 (Walkthrough & Navigation)
- APPROACH document Section 7.4-7.5 (Accessibility & Testing)
- All 6 ADRs (001-006)
- Original PR04 README scope

...is captured in the implementation plan with specific file/day assignments.

**Implementation team has everything needed to execute!** 🚀
