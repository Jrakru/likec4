# Implementation Quick Reference

**For:** PR04 Walkthrough State Machine Implementation Team  
**Date:** 2025-10-24

## 📚 Document Map

### Start Here
1. **`README.md`** - Overview, scope, 5-day plan
2. **`ADRs/INDEX.md`** - All design decisions summary

### Design Decisions (Read in Order)
1. **`ADRs/ADR-001-event-signatures.md`** - What events to send
2. **`ADRs/ADR-002-step-linearization.md`** - How navigation works
3. **`ADRs/ADR-003-completion-tracking.md`** - How to track progress
4. **`ADRs/ADR-004-url-persistence.md`** - How to save state in URL
5. **`ADRs/ADR-005-hook-apis.md`** - React hooks API design
6. **`ADRs/ADR-006-module-architecture.md`** - Code organization

### Supporting Analysis
- **`STEP-ID-STABILITY-AND-CODE-ORGANIZATION.md`** - Technical deep dive
- **`EXISTING-IMPLEMENTATION-AND-PACKAGE-RESEARCH.md`** - Current state

---

## 🎯 Key Decisions at a Glance

### Event System (ADR-001)
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

### Navigation Behavior (ADR-002)
- **Just-in-time computation** (no pre-computed sequence)
- **Auto-follow default paths** when pressing "next"
- **Pause at branches without defaults** for user selection
- **Parallel branches iterate sequentially** through all paths
- **Progress shows context:** "Path 2 of 3, Step 4 of 7"

### Completion Tracking (ADR-003)
- **localStorage** with per-diagram keys
- **Hierarchical** tracking (branch → paths → completion)
- **Nested branch support** via parent tracking
- **CTA trigger:** Exit branch with unvisited paths → toast notification

### URL Format (ADR-004)
```
Linear:    #walkthrough=step-01
Branch:    #walkthrough=step-12&branch=br-auth:1
Nested:    #walkthrough=step-25&branch=br-auth:1,br-payment:0
```
⚠️ **URLs break if steps reordered** (acceptable, show error + fallback)

### React Hooks (ADR-005)
```typescript
useWalkthrough()              // State subscription
useWalkthroughActions()       // Event dispatch
useWalkthroughCompletion()    // Completion tracking
useBranchSelection()          // Branch UI state
useWalkthroughURL()           // URL sync
```

### Code Organization (ADR-006)
```
state/walkthrough/
├── types.ts              (All TypeScript interfaces)
├── walkthrough-machine.ts (XState child machine)
├── navigation.ts         (computeNextStep, etc.)
├── completion.ts         (CompletionTracker class)
├── url-state.ts          (parse/build/validate)
├── progress.ts           (calculateProgress)
└── __tests__/

hooks/walkthrough/
├── useWalkthrough.ts
├── useWalkthroughActions.ts
├── useWalkthroughCompletion.ts
├── useBranchSelection.ts
├── useWalkthroughURL.ts
└── __tests__/

ui/walkthrough/
├── WalkthroughProgress.tsx
├── BranchSelector.tsx
├── ResumePrompt.tsx
└── __tests__/
```

---

## 📅 5-Day Implementation Plan

### Day 1: Types & Structure
- Create directory structure
- Define all TypeScript types
- No functional changes

### Day 2: Logic Modules + Tests
- Implement navigation.ts
- Implement completion.ts
- Implement url-state.ts
- Implement progress.ts
- Write unit tests (TDD)

### Day 3: State Machine + Integration
- Create walkthrough-machine.ts
- Integrate as child actor
- Wire up parent-child communication
- Maintain backward compatibility
- Integration tests

### Day 4: React Hooks + Tests
- Implement 5 hooks
- Write hook tests
- Verify re-render optimization

### Day 5: UI Components + E2E
- Enhance existing controls
- Build new components
- E2E Playwright tests
- Record demo video

---

## ✅ Definition of Done Checklist

### Code
- [ ] All unit tests pass (80%+ coverage)
- [ ] State machine tests cover all transitions
- [ ] Hook tests verify optimization
- [ ] E2E tests pass (linear + branching)
- [ ] TypeScript strict: no errors
- [ ] ESLint/Prettier clean

### Functionality
- [ ] Linear walkthrough works (backward compat)
- [ ] Branch auto-follow default paths
- [ ] Branch pause without defaults
- [ ] Parallel iterate sequentially
- [ ] Nested branches work (3 levels)
- [ ] Completion persists localStorage
- [ ] "Revisit" CTA appears correctly
- [ ] URL sharing works
- [ ] Invalid URLs handled gracefully
- [ ] Keyboard navigation works

### Performance
- [ ] Components re-render optimally
- [ ] Navigation < 100ms
- [ ] No memory leaks
- [ ] localStorage doesn't block UI

### Documentation
- [ ] JSDoc on all public APIs
- [ ] Usage examples in hooks
- [ ] React docs updated
- [ ] CHANGELOG draft ready
- [ ] Demo video recorded

---

## 🔍 Where to Find Code Examples

### Event Handling
See: `ADR-001-event-signatures.md` (lines 65-110)

### Navigation Logic
See: `ADR-002-step-linearization.md` (lines 95-220)

### CompletionTracker Class
See: `ADR-003-completion-tracking.md` (lines 85-250)

### URL Parsing
See: `ADR-004-url-persistence.md` (lines 75-150)

### Hook Implementations
See: `ADR-005-hook-apis.md` (lines 95-380)

### Child Machine Setup
See: `ADR-006-module-architecture.md` (lines 120-200)

---

## 🚨 Common Pitfalls to Avoid

1. **Don't add to diagram-machine.ts directly** - Use child actor pattern
2. **Don't pre-compute full sequence** - Use just-in-time navigation
3. **Don't forget Set serialization** - localStorage can't store Sets directly
4. **Don't skip backward compatibility** - Old events must still work
5. **Don't break existing walkthrough** - Test with feature flag off
6. **Don't optimize prematurely** - Get it working first, then optimize
7. **Don't forget accessibility** - Keyboard nav and screen readers

---

## 💡 Pro Tips

1. **Start with types** - Good TypeScript types catch bugs early
2. **Write tests first** - TDD reveals design issues quickly
3. **Use XState visualizer** - Great for debugging state transitions
4. **Check existing actors** - Follow patterns from overlays/search/hotkeys
5. **Keep modules pure** - navigation.ts shouldn't know about React
6. **Memoize callbacks** - useCallback/useMemo prevent re-renders
7. **Test edge cases** - Empty branches, single path, deep nesting

---

## 📞 Questions?

If design decisions are unclear or missing details:
1. Check the specific ADR for that topic
2. Look for code examples in ADRs
3. Review existing actor patterns in codebase
4. Document assumptions and proceed

All design decisions are final. Implementation team has authority to make tactical decisions within the documented architecture.

---

## 🎉 You're Ready!

Everything you need is documented. Follow the 5-day plan, write tests first, and ship it! 🚀
