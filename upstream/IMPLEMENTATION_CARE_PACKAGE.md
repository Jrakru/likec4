# LikeC4 Alternate Paths Implementation Care Package

**Date**: 2025-01-XX  
**For**: Implementation Team  
**Purpose**: Complete resource package for implementing alternate paths feature in LikeC4  
**Estimated Effort**: 3 days (24 hours)  
**Status**: Ready for Implementation

---

## 📦 What's in This Package

This care package contains everything needed to implement alternate paths for LikeC4 dynamic views:

1. **Feature Specification** — What to build and why
2. **Implementation Guide** — Step-by-step checklist with code snippets
3. **Research & Analysis** — Background investigation and design decisions
4. **Architecture Documentation** — Technical deep-dives
5. **Examples & References** — Working code and patterns
6. **Quick Start Guide** — Get up and running in 30 minutes

---

## 🚀 Quick Start (30 Minutes)

### Step 1: Read the Feature Request (15 min)
📄 [`LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md`](./LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md)

**Focus on**:
- Executive Summary (page 1)
- Use Cases 1-2 (pages 2-4)
- Proposed Syntax (pages 5-6)
- Technical Design Summary (page 7)

### Step 2: Scan the Checklist (10 min)
📋 [`LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md`](./LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md)

**Focus on**:
- Pre-Implementation Setup (page 1)
- Phase 1 overview (page 2)
- File locations reference table (bottom)

### Step 3: Set Up Environment (5 min)
```bash
# Fork and clone
git clone https://github.com/1c4d5-team/likec4.git
cd likec4
git checkout -b feature/alternate-paths

# Install dependencies
pnpm install

# Verify build works
pnpm build
pnpm test
```

**You're ready to start Day 1!**

---

## 📚 Core Documents (Required Reading)

### 1. Feature Specification
📄 **[LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md](./LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md)** (1,306 lines)

**What it contains**:
- Executive summary and motivation
- 4 concrete use cases with code examples
- Proposed syntax (2 options, with recommendation)
- Complete technical design for all 7 components
- Implementation timeline breakdown
- Test specifications
- Backward compatibility analysis
- Open questions with recommendations

**When to read**: Before starting implementation (Day 0 or Day 1 morning)

**Key sections**:
- Pages 1-4: Problem and motivation
- Pages 5-7: Syntax and technical design
- Pages 8-15: Component-by-component implementation details
- Pages 16-20: Testing and quality assurance

### 2. Implementation Checklist
📋 **[LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md](./LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md)** (640 lines)

**What it contains**:
- Pre-implementation setup steps
- 150+ checkboxes organized by phase
- Code snippets for every component
- File paths for every change
- Testing procedures
- Troubleshooting guide
- Success criteria

**When to use**: Throughout implementation (keep open in second monitor)

**How to use**:
- Check off boxes as you complete them
- Use as daily progress tracker
- Reference code snippets when implementing
- Follow commit message suggestions

### 3. Upstream Contribution Guide
📖 **[README.md](./README.md)** (169 lines)

**What it contains**:
- Fork management instructions
- Contribution process overview
- Guidelines for upstream PRs
- Links to all related documents

**When to read**: Before creating PRs (Day 3 afternoon)

---

## 🔬 Research & Analysis (Supporting Context)

### IcePanel Flows Investigation
📊 **[`../investigations/ICEPANEL_FLOWS_INVESTIGATION.md`](../investigations/ICEPANEL_FLOWS_INVESTIGATION.md)** (1,337 lines)

**What it contains**:
- Analysis of IcePanel's Flow feature (our inspiration)
- 8 step types deep-dive
- UX patterns and presentation modes
- Export formats
- Gap analysis (what IcePanel has that we don't)
- Original implementation roadmap (before we discovered LikeC4 had dynamic views)

**When to read**: Optional, for context on user expectations

**Key insight**: IcePanel users expect alternate paths to work with path selector UI and interactive exploration. This informed our UX design.

### LikeC4 Dynamic Views Discovery
🔍 **[`../investigations/LIKEC4_DYNAMIC_VIEWS_FINDINGS.md`](../investigations/LIKEC4_DYNAMIC_VIEWS_FINDINGS.md)** (642 lines)

**What it contains**:
- Discovery that LikeC4 already has dynamic views
- Type system analysis (`DynamicStep`, `DynamicStepsSeries`, `DynamicStepsParallel`)
- Real example from LikeC4's boutique demo
- Comparison: LikeC4 vs IcePanel vs our original proposal
- Gap analysis (what's missing: alternate paths)

**When to read**: Before implementation (helps understand existing patterns)

**Key sections**:
- Section 1: LikeC4 Dynamic View Syntax (how `parallel` works now)
- Section 2: Type System Deep Dive (what to mirror for `alternate`)
- Section 3: Real-World Example (boutique place-order flow)

### Feasibility Analysis
📐 **[`../investigations/LIKEC4_ALTERNATE_PATHS_FEASIBILITY.md`](../investigations/LIKEC4_ALTERNATE_PATHS_FEASIBILITY.md)** (601 lines)

**What it contains**:
- Component-by-component feasibility assessment
- Complexity ratings (⭐ Low to ⭐⭐⭐ Medium)
- Time estimates per component
- Risk assessment
- Comparison: parallel vs alternate implementation
- Proof that implementation is straightforward

**When to read**: If you doubt the 3-day estimate (this proves it's achievable)

**Key finding**: Total effort is 21-33 hours (2.5-4 days), with realistic estimate of 3 days for experienced contributor.

### Walkthrough UX Design
🎨 **[`../investigations/ALTERNATE_PATHS_WALKTHROUGH_UX.md`](../investigations/ALTERNATE_PATHS_WALKTHROUGH_UX.md)** (655 lines)

**What it contains**:
- Detailed UX analysis for interactive walkthrough
- State machine design for path navigation
- UI component specifications
- User flow diagrams
- Mockups (ASCII art)
- Comparison with IcePanel's UX

**When to read**: Before implementing Phase 2 (Walkthrough UI, Day 2)

**Key sections**:
- Section 2: Navigation State Machine (how to handle step navigation)
- Section 3: UI Components (PathSelector component spec)
- Section 4: User Flows (how users interact with decision points)

### Architecture Decision Record
📝 **[`../adr/ADR-0007-leverage-likec4-dynamic-views-for-flow-stories.md`](../adr/ADR-0007-leverage-likec4-dynamic-views-for-flow-stories.md)** (532 lines)

**What it contains**:
- Decision to leverage LikeC4 dynamic views (not build from scratch)
- Rationale for NOT requiring alternate paths as blocker (but why we should still build it)
- Alternatives considered
- Consequences and trade-offs
- Implementation patterns

**When to read**: For context on strategic decisions

**Key insight**: We chose to extend LikeC4 rather than build custom DSL. This means we must follow LikeC4 patterns and contribute upstream.

---

## 💡 Examples & References

### Working LikeC4 Examples

**Location**: `/tmp/likec4/examples/multi-project/boutique/use-cases/`

**Key files to study**:
```
usecase.01-place-order.c4  — Shows parallel paths (template for alternate)
```

**What to look for**:
- How `parallel { }` syntax works
- How steps are defined: `source -> target 'title' { notes }`
- How `navigateTo` links views
- How metadata and styling work

### Code Snippets Collection

All implementation code snippets are in:
- Feature Request (Section 6: Technical Design)
- Implementation Checklist (Phase 1-3, inline with tasks)

**Quick reference by component**:

| Component | Snippet Location | Lines |
|-----------|------------------|-------|
| Grammar | Checklist Phase 1.1 | ~15 lines |
| Types | Checklist Phase 1.2 | ~40 lines |
| Parser | Checklist Phase 1.3 | ~50 lines |
| Compute | Checklist Phase 1.5 | ~15 lines |
| State Machine | Checklist Phase 2.2 | ~80 lines |
| UI Component | Checklist Phase 2.3 | ~60 lines |

### LikeC4 Codebase Map

**Key files you'll modify**:

```
likec4/
├── packages/
│   ├── language-server/
│   │   └── src/
│   │       ├── like-c4.langium                  ← Grammar (Day 1)
│   │       └── model/parser/ViewsParser.ts      ← Parser (Day 1)
│   ├── core/
│   │   └── src/
│   │       ├── types/view-parsed.dynamic.ts     ← Types (Day 1)
│   │       └── compute-view/dynamic-view/
│   │           └── compute.ts                   ← Compute (Day 1)
│   ├── layouts/
│   │   └── src/sequence/
│   │       ├── layouter.ts                      ← Sequence (Day 3)
│   │       └── _types.ts                        ← Types (Day 3)
│   └── diagram/
│       └── src/
│           ├── likec4diagram/state/
│           │   └── diagram-machine.ts           ← State (Day 2)
│           └── navigationpanel/walkthrough/
│               └── ActiveWalkthroughControls.tsx ← UI (Day 2)
```

---

## 🎯 Implementation Strategy

### Day 1: Core Functionality (8 hours)
**Goal**: Parse alternate syntax, render default path in diagram

**Tasks** (in order):
1. Grammar: Add `alternate` and `path` rules (1-2 hrs)
2. Types: Add `DynamicStepsAlternate` interface (1 hr)
3. Parser: Implement `parseDynamicViewAlternateSteps` (2 hrs)
4. Tests: Unit tests for parser (2-3 hrs)
5. Compute: Process alternate in diagram mode (1-2 hrs)

**Deliverable**: Can write `alternate { path { A -> B } }` and it renders

**Checklist**: Phase 1 (pages 2-7 of implementation checklist)

### Day 2: Walkthrough UI (8 hours)
**Goal**: Interactive path selection and navigation

**Tasks** (in order):
1. State: Extend `ActiveWalkthrough` type (1 hr)
2. Navigation: Update `walkthrough.step` action (3-4 hrs)
3. UI: Create `PathSelector` component (3-4 hrs)
4. Tests: Integration tests for navigation (1 hr)

**Deliverable**: User can select paths and navigate through them

**Checklist**: Phase 2 (pages 7-11 of implementation checklist)

### Day 3: Sequence & Polish (8 hours)
**Goal**: Sequence diagram rendering and documentation

**Tasks** (in order):
1. Sequence: Render alt/else blocks (4-6 hrs)
2. Visual: Highlight active paths (1 hr)
3. Docs: Write documentation and examples (2 hrs)

**Deliverable**: Complete feature, ready for PR

**Checklist**: Phase 3 (pages 11-14 of implementation checklist)

---

## 🧪 Testing Strategy

### Unit Tests (Day 1, ~3 hours)
**File**: `packages/language-server/src/model/__tests__/model-parser-dynamic-views.spec.ts`

**Test cases** (11 total):
- [ ] Parse alternate with 2 paths
- [ ] Parse alternate with 3+ paths
- [ ] Parse alternate with named paths
- [ ] Parse alternate with titled paths
- [ ] Parse alternate with unnamed paths
- [ ] Warning on single path
- [ ] Error on empty path
- [ ] Parse nested steps within paths
- [ ] Parse chained steps (series) within paths
- [ ] Parse with metadata
- [ ] Parse with custom properties

### Integration Tests (Day 2, ~1 hour)
**File**: `packages/diagram/src/likec4diagram/state/__tests__/walkthrough-alternate.spec.ts` (new)

**Test cases** (8 total):
- [ ] Navigate to alternate step
- [ ] Enter default path on first Next
- [ ] Navigate through path steps
- [ ] Return to decision point with Back
- [ ] Switch to different path
- [ ] Exit alternate when path complete
- [ ] Handle nested alternates (if implemented)
- [ ] Keyboard navigation (arrow keys)

### Manual Testing (Day 3, ~1 hour)
**Checklist**: 15 items in implementation checklist "Manual Testing" section

**Key scenarios**:
- [ ] Works with parallel paths (no conflicts)
- [ ] Backward compatibility (existing models unchanged)
- [ ] Sequence mode shows alt/else frames
- [ ] Path selector appears at decision point
- [ ] Visual highlighting correct

### Regression Testing (Day 3, ~1 hour)
- [ ] Run full test suite: `pnpm test`
- [ ] Verify all existing tests pass
- [ ] Build all packages: `pnpm build`
- [ ] No TypeScript errors
- [ ] Performance: No noticeable slowdown

---

## 🐛 Common Pitfalls & Solutions

### Pitfall 1: Langium Generation Fails
**Symptom**: Grammar changes don't reflect in parser

**Solution**:
```bash
cd packages/language-server
pnpm clean
pnpm generate
pnpm build
```

### Pitfall 2: Type Errors After Adding New Types
**Symptom**: `Property '__alternate' does not exist on type...`

**Solution**:
```bash
# Rebuild core package first
cd packages/core
pnpm build

# Then rebuild dependent packages
cd ../language-server
pnpm build

cd ../diagram
pnpm build
```

### Pitfall 3: State Machine Not Entering Alternate
**Symptom**: Walkthrough skips over alternate step

**Solution**:
- Check `isDynamicStepsAlternate(step)` type guard returns true
- Debug: Add `console.log(step)` in navigation logic
- Verify step IDs match between compute and walkthrough
- Use XState inspector for state machine debugging

### Pitfall 4: Tests Fail After Changes
**Symptom**: Snapshot tests fail

**Solution**:
```bash
# Update snapshots if changes are intentional
pnpm test -- -u

# Or update specific test file
pnpm test -- model-parser-dynamic-views.spec.ts -u
```

### Pitfall 5: Parallel and Alternate Conflict
**Symptom**: Parallel steps break when alternate is present

**Solution**:
- Ensure `parallelPrefix` and `alternateContext` are independent
- Check processing order in compute.ts
- Test with model that has both parallel and alternate

---

## 📊 Progress Tracking

### Daily Checklist

**Day 1 End-of-Day Checklist**:
- [ ] Grammar compiles without errors
- [ ] Types build successfully
- [ ] Parser tests pass (8+ tests)
- [ ] Can parse alternate syntax in test file
- [ ] Diagram mode shows default path
- [ ] Commit pushed to branch

**Day 2 End-of-Day Checklist**:
- [ ] State machine handles alternate navigation
- [ ] Path selector component renders
- [ ] Can switch between paths
- [ ] Back button returns to decision point
- [ ] Integration tests pass (8+ tests)
- [ ] Commit pushed to branch

**Day 3 End-of-Day Checklist**:
- [ ] Sequence mode shows alt/else blocks
- [ ] Documentation written
- [ ] All tests pass (100%)
- [ ] Manual testing complete
- [ ] PR ready for submission
- [ ] Feature branch pushed

### Key Metrics

**Code Changes** (estimated):
- Files modified: ~12
- Lines added: ~600
- Lines removed: ~10
- Test coverage: 80%+

**Test Coverage** (targets):
- Unit tests: 11+ (parser)
- Integration tests: 8+ (walkthrough)
- E2E tests: 5+ (manual)

**Performance** (benchmarks):
- Parse time: <5% increase
- Render time: <5% increase
- Memory: <10% increase

---

## 🚢 Delivery Checklist

### Before Creating PR

**Code Quality**:
- [ ] All tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] Code formatted: `pnpm format` (if available)
- [ ] No console.logs or debug code
- [ ] Comments added for complex logic

**Documentation**:
- [ ] DSL reference updated
- [ ] Examples added to docs/
- [ ] CHANGELOG.md entry added
- [ ] PR description written
- [ ] Screenshots/GIFs captured (walkthrough demo)

**Testing**:
- [ ] Manual testing complete (15 scenarios)
- [ ] Regression tests pass (existing functionality)
- [ ] Performance acceptable (benchmarks)
- [ ] Accessibility verified (keyboard nav)

**Git Hygiene**:
- [ ] Commits squashed if needed (clean history)
- [ ] Commit messages follow convention
- [ ] Branch synced with upstream/main
- [ ] No merge conflicts

### PR Submission

**Title**: `feat(dynamic-view): add alternate paths support`

**Description Template**:
```markdown
## Summary
Adds support for `alternate` paths (OR logic) in dynamic views, complementing existing `parallel` paths (AND logic).

## Motivation
Enables modeling decision points where one of several mutually exclusive paths is taken (e.g., validation pass/fail, payment methods, authentication outcomes).

## Changes
- Grammar: Add `alternate { path { } }` syntax
- Types: Add `DynamicStepsAlternate` interface
- Parser: Implement alternate path parsing
- Compute: Render default path in diagram mode
- Walkthrough: Interactive path selection UI
- Sequence: Render alt/else blocks
- Tests: 19+ new tests, 100% pass rate
- Docs: Updated DSL reference with examples

## Breaking Changes
None. Feature is additive and backward compatible.

## Examples
[Include code example and screenshot]

## Checklist
- [x] Tests pass
- [x] Documentation updated
- [x] Examples added
- [x] No breaking changes
- [x] Performance acceptable

## Related
- Feature Request: [link]
- Discussion: [link]
```

**Reviewers**: Tag LikeC4 maintainers

---

## 📞 Support & Resources

### Questions During Implementation?

1. **Technical Questions**: 
   - Check feasibility analysis document first
   - Review existing `parallel` implementation
   - Open GitHub discussion in fork

2. **Scope Questions**:
   - Refer to feature request document
   - Check "Open Questions" section for guidance
   - Make pragmatic decisions, document in PR

3. **Blocker**:
   - Document the blocker clearly
   - Propose solution if possible
   - Escalate to 1C4D5 team lead

### Useful Links

**LikeC4 Resources**:
- Repository: https://github.com/likec4/likec4
- Documentation: https://likec4.dev
- Examples: https://github.com/likec4/likec4/tree/main/examples
- Contributing: https://github.com/likec4/likec4/blob/main/CONTRIBUTING.md

**Development Tools**:
- Langium: https://langium.org/docs/
- XState: https://xstate.js.org/docs/
- Mantine: https://mantine.dev/
- Vitest: https://vitest.dev/

**1C4D5 Team**:
- Fork: https://github.com/1c4d5-team/likec4
- Feature branch: `feature/alternate-paths`
- Project docs: `1C4D5/docs/`

---

## 🎉 Success Criteria

**Feature is complete when**:

✅ **Functional**:
- [ ] Parser accepts `alternate { path { ... } }` syntax
- [ ] Diagram mode shows default path
- [ ] Sequence mode renders alt/else blocks
- [ ] Walkthrough allows path selection and navigation
- [ ] Back button returns to decision point
- [ ] Works with existing parallel paths

✅ **Quality**:
- [ ] All tests pass (19+ new, all existing)
- [ ] Code coverage >80% for new code
- [ ] No TypeScript errors
- [ ] No breaking changes
- [ ] Performance acceptable

✅ **Documentation**:
- [ ] DSL reference updated
- [ ] 2+ examples added
- [ ] CHANGELOG.md entry
- [ ] PR description complete

✅ **Delivery**:
- [ ] PR submitted to upstream
- [ ] Feature usable in 1C4D5 fork
- [ ] Ready for code review

---

## 📦 Package Contents Summary

### Documents (8 files)
1. ✅ Feature Request (1,306 lines) — What to build
2. ✅ Implementation Checklist (640 lines) — How to build it
3. ✅ Upstream Guide (169 lines) — Fork management
4. ✅ IcePanel Investigation (1,337 lines) — User expectations
5. ✅ LikeC4 Findings (642 lines) — Existing patterns
6. ✅ Feasibility Analysis (601 lines) — Effort estimates
7. ✅ UX Design (655 lines) — Walkthrough behavior
8. ✅ ADR-0007 (532 lines) — Strategic decisions

### Total: 5,886 lines of documentation

### Code Snippets: 15+ complete implementations
### Examples: 4 use cases with working code
### Tests: 19+ test case specifications
### Diagrams: 10+ mockups and flow charts

---

## 🚀 You've Got This!

**Remember**:
- The 3-day estimate is realistic (backed by feasibility analysis)
- All code snippets are provided
- Pattern already exists (`parallel` implementation to mirror)
- Feature is high-value for the community
- You have comprehensive documentation and support

**Day 1**: Focus on getting syntax working (parser + types)  
**Day 2**: Make it interactive (state machine + UI)  
**Day 3**: Make it beautiful (sequence mode + docs)

**Good luck! We're excited to see this feature come to life. 🎉**

---

**Care Package Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Prepared By**: 1C4D5 Engineering Team  
**For**: Implementation Team  
**Estimated Reading Time**: 2 hours (full package), 30 min (quick start)