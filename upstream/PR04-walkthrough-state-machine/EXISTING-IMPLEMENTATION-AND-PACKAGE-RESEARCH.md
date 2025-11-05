# Existing Walkthrough Implementation Analysis & Reusable Package Options

**Date:** 2025-10-24  
**Related:** PR04 Design Phase

## Part 1: Current Walkthrough Implementation

### What Already Exists

```
packages/diagram/src/
├── navigationpanel/walkthrough/
│   ├── ActiveWalkthroughControls.tsx   (Controls UI: Stop, Prev, Next, Step counter)
│   ├── DynamicViewControls.tsx         (Start button, variant switcher)
│   ├── WalkthroughPanel.tsx            (Notes display panel)
│   └── WalkthroughPanel.css.ts
│
├── hooks/useDiagram.ts
│   ├── startWalkthrough()              (Send 'walkthrough.start')
│   ├── walkthroughStep(direction)      (Send 'walkthrough.step')
│   └── stopWalkthrough()               (Send 'walkthrough.end')
│
└── likec4diagram/state/
    ├── diagram-machine.ts
    │   ├── activeWalkthrough context    (stepId, parallelPrefix, branchTrail)
    │   ├── 'walkthrough.start' event   (Initialize walkthrough)
    │   ├── 'walkthrough.step' event    (Navigate next/previous)
    │   └── 'walkthrough.end' event     (Stop walkthrough)
    └── assign.ts
        └── updateActiveWalkthrough()    (Update active step)
```

### Current Features

✅ **Already Implemented:**
- Basic linear walkthrough (step through sequence edges)
- Parallel step detection (shows orange border frame)
- Step counter display (current / total)
- Next/Previous navigation
- Stop walkthrough
- Notes panel integration
- Keyboard shortcuts (via hotkeyActor.ts)

❌ **Missing (PR04 Goals):**
- Branch-aware navigation
- Path selection UI
- Completion tracking
- "Revisit alternate paths" CTAs
- URL state persistence
- Rich progress indicators
- Nested branch support

### Assessment

**Current implementation is:**
- ✅ Simple and functional for basic use case
- ✅ Integrated with XState state machine
- ✅ UI components already exist
- ❌ Not designed for branching/alternate paths
- ❌ No completion tracking
- ❌ No URL sharing
- ❌ Tightly coupled to diagram-machine.ts

**Reusability:**
- UI components (buttons, controls) are reusable
- State machine integration is LikeC4-specific
- No generic abstraction layer

---

## Part 2: Existing Package Research

### Popular Walkthrough/Tour Libraries

#### 1. **Shepherd.js** (Most Popular)
- **URL:** https://shepherdjs.dev/
- **Stars:** 13k+ on GitHub
- **License:** MIT
- **Approach:** DOM-based, attaches tooltips to elements

```javascript
const tour = new Shepherd.Tour({
  useModalOverlay: true
});

tour.addStep({
  id: 'step1',
  text: 'This is the first step',
  attachTo: {
    element: '.selector',
    on: 'bottom'
  },
  buttons: [
    { text: 'Next', action: tour.next }
  ]
});
```

**Pros:**
- Very popular, well-maintained
- Rich UI out of the box
- Keyboard navigation
- Progress tracking

**Cons:**
- ❌ DOM-based (we're working with canvas/SVG)
- ❌ Not state machine driven
- ❌ No branching/alternate paths
- ❌ Designed for UI tours, not data flow walkthroughs

#### 2. **Intro.js**
- **URL:** https://introjs.com/
- **Stars:** 22k+ on GitHub
- **License:** AGPL-3.0 (commercial license available)

**Cons:**
- ❌ Same limitations as Shepherd
- ❌ AGPL license (problematic for MIT project)

#### 3. **Driver.js**
- **URL:** https://driverjs.com/
- **Stars:** 23k+ on GitHub
- **License:** MIT

**Cons:**
- ❌ Same DOM-based limitations
- ❌ No state machine integration

#### 4. **Reactour**
- **URL:** https://github.com/elrumordelaluz/reactour
- **React-specific tour library**

**Cons:**
- ❌ DOM-based
- ❌ No branching support

### State Machine Libraries (Generic)

#### 5. **XState** (Already Using!)
- **URL:** https://xstate.js.org/
- **Already a dependency:** `@xstate/react` in package.json
- **Perfect for:** State-driven logic, complex workflows

**We're already using XState!** This is the right foundation.

#### 6. **Robot**
- **URL:** https://thisrobot.life/
- **Alternative to XState**
- ❌ Not needed (XState is better for our use case)

---

## Part 3: Recommendation

### ❌ Don't Use Existing Tour Libraries

**None of the popular walkthrough libraries fit our needs because:**

1. **Wrong Domain:** They're designed for UI tours (highlighting DOM elements), not data flow walkthroughs
2. **No Canvas Support:** We're rendering on XYFlow (canvas-based), not DOM elements
3. **No Branching:** None support alternate paths/branching logic
4. **No State Machine Integration:** They manage their own state, can't integrate with XState
5. **Different Use Case:** We're walking through dynamic view steps (edges), not UI elements

### ✅ Build on XState (Already Have It!)

**XState is perfect for our needs:**
- ✅ Already a dependency
- ✅ Handles complex state transitions
- ✅ Built-in actor model (child machines)
- ✅ TypeScript support
- ✅ Great testing story
- ✅ Event-driven architecture
- ✅ Can model branching/alternate paths naturally
- ✅ React integration via `@xstate/react`

### 🎯 Proposed Approach: Extract as Standalone Package (Future)

While we can't use existing tour libraries, we **can** make our implementation reusable:

#### Phase 1: Build for LikeC4 (PR04)
- Implement in `packages/diagram/src/likec4diagram/state/walkthrough/`
- Use XState child machine
- Tightly integrated with diagram state

#### Phase 2: Extract Core Logic (Future PR)
Create `@likec4/walkthrough` package:

```
packages/walkthrough/
├── src/
│   ├── machine/
│   │   ├── walkthrough-machine.ts      (Generic XState machine)
│   │   ├── types.ts                    (Generic types)
│   │   └── actions.ts                  (Generic actions)
│   ├── navigation/
│   │   ├── navigator.ts                (Graph navigation logic)
│   │   ├── completion.ts               (Completion tracking)
│   │   └── url-state.ts                (URL serialization)
│   ├── react/
│   │   ├── hooks/                      (Generic hooks)
│   │   └── context/                    (React context)
│   └── index.ts
└── package.json
```

**Generic API:**
```typescript
import { createWalkthroughMachine } from '@likec4/walkthrough'

const machine = createWalkthroughMachine({
  steps: mySteps,
  navigator: myNavigationLogic,
  onStepChange: (step) => { /* custom logic */ }
})
```

**Benefits:**
1. ✅ Can be used in other projects (not just LikeC4)
2. ✅ Testable in isolation
3. ✅ Clear abstraction boundaries
4. ✅ Potential open-source contribution to XState ecosystem
5. ✅ Can be published to npm separately

#### Phase 3: Contribute to XState Community (Optional)
- Blog post about building complex walkthroughs with XState
- Example repo
- Maybe even get featured in XState docs

---

## Part 4: Implementation Plan

### Immediate (PR04)
1. ✅ Use XState (already have it)
2. ✅ Build walkthrough logic as child machine in LikeC4
3. ✅ Reuse existing UI components (ActiveWalkthroughControls, etc.)
4. ✅ Extend with branching logic
5. ✅ Keep core logic modular (easy to extract later)

### Future (Post-PR04)
1. Extract generic walkthrough machine to `@likec4/walkthrough`
2. Make diagram-specific logic pluggable
3. Document patterns for others to use
4. Consider publishing separately

---

## Part 5: Code Reuse Strategy

### What to Reuse from Current Implementation

```typescript
// ✅ REUSE: UI Components
packages/diagram/src/navigationpanel/walkthrough/
├── ActiveWalkthroughControls.tsx      // Keep and extend
├── DynamicViewControls.tsx            // Keep
└── WalkthroughPanel.tsx               // Keep

// ✅ REUSE: Hook pattern
packages/diagram/src/hooks/useDiagram.ts
└── startWalkthrough(), walkthroughStep(), stopWalkthrough()
    // Keep API, enhance implementation

// 🔄 REFACTOR: State machine logic
packages/diagram/src/likec4diagram/state/
├── diagram-machine.ts
│   └── Extract walkthrough to child machine
└── assign.ts
    └── Move to walkthrough/actions.ts
```

### New Code (Modular & Reusable)

```typescript
// 🆕 NEW: Walkthrough module
packages/diagram/src/likec4diagram/state/walkthrough/
├── types.ts                    (Generic types, reusable)
├── walkthrough-machine.ts      (XState machine, mostly generic)
├── navigation.ts               (Graph navigation, diagram-specific)
├── completion.ts               (CompletionTracker, generic)
├── url-state.ts                (URL utils, generic)
└── progress.ts                 (Progress calc, diagram-specific)

// Integration layer (diagram-specific)
packages/diagram/src/likec4diagram/state/
└── diagram-machine.ts
    └── Spawn walkthrough child actor
```

**Generic parts (future extraction):**
- `types.ts` → Generic walkthrough types
- `walkthrough-machine.ts` → Generic state machine
- `completion.ts` → Generic completion tracking
- `url-state.ts` → Generic URL serialization

**Diagram-specific parts:**
- `navigation.ts` → XYFlow edge navigation
- `progress.ts` → Dynamic view specific

---

## Summary

### Answer to Your Question

**"Can this be reused in other projects?"**

**Yes, but not by using existing packages.** Instead:

1. ✅ **Build it properly with XState** (we already have it)
2. ✅ **Make core logic modular** (easy to extract)
3. ✅ **Keep diagram-specific parts separate**
4. 🔮 **Future: Extract to `@likec4/walkthrough`** (standalone package)

### Why Not Use Existing Libraries?

- ❌ Shepherd.js, Intro.js, Driver.js are for **UI tours** (DOM-based)
- ❌ We need **data flow walkthroughs** (canvas-based)
- ❌ None support **branching/alternate paths**
- ❌ None integrate with **XState**

### What We Already Have

- ✅ **XState** - Perfect state machine library
- ✅ **Basic walkthrough** - UI and simple navigation
- ✅ **React components** - Controls, panels, buttons

### What We Need to Build

- 🔨 **Branching logic** (PR04 focus)
- 🔨 **Completion tracking** (PR04 focus)
- 🔨 **URL persistence** (PR04 focus)
- 🔨 **Modular architecture** (makes future extraction easy)

**Recommendation: Proceed with Option A (modular architecture) from the previous analysis. This gives us the best foundation for both LikeC4 and future reuse.**
