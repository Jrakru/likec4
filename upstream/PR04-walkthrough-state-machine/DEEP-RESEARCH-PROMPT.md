# Deep Research Prompt: Reusable Walkthrough/Navigation Solutions

## Research Objective

Find existing open-source libraries, frameworks, or patterns that solve **state machine-based navigation through branching data flows**, particularly for interactive walkthroughs with alternate paths and completion tracking.

## Problem Context

We're building an interactive walkthrough system for dynamic sequence diagrams that needs to:

1. **Navigate through a graph of steps** with branching logic
2. **Handle alternate paths** (user can choose between multiple branches)
3. **Track completion state** (which paths/branches have been visited)
4. **Support nested branches** (branches within branches)
5. **Persist state in URL** for sharing
6. **Provide progress indicators** that adapt to context (linear vs branching)
7. **Work with React and XState**

## Key Requirements

### Must Have
- State machine-driven (ideally XState or compatible)
- Support for **branching/alternate paths** (not just linear sequences)
- **Completion tracking** across multiple playthroughs
- Graph/tree navigation logic
- TypeScript support
- React integration
- MIT or compatible license

### Nice to Have
- URL state serialization
- Progress calculation for branching flows
- "Jump to branch point" navigation
- Completion-based UI hints (e.g., "explore alternate path" CTAs)

### Not Required
- DOM-based tooltips/overlays (we're canvas-based)
- WYSIWYG tour builders
- Analytics integration

## Search Areas

### 1. State Machine Libraries & Patterns

**Keywords:**
- "XState branching navigation"
- "state machine graph traversal"
- "XState nested machines workflow"
- "finite state machine alternate paths"
- "hierarchical state machine navigation"

**Questions:**
- Are there XState examples/patterns for branching workflows?
- Does XState have official patterns for "choose your own adventure" flows?
- Are there libraries built on top of XState for complex navigation?

### 2. Interactive Narrative Systems

**Keywords:**
- "interactive fiction engine javascript"
- "branching narrative library"
- "visual novel engine web"
- "choice-based story framework"
- "Twine alternative javascript"
- "ink narrative scripting"

**Questions:**
- Do game narrative engines have reusable state management?
- Are there lightweight branching story libraries?
- Can visual novel engines be adapted for non-story use cases?

### 3. Workflow/Process Engines

**Keywords:**
- "workflow engine javascript branching"
- "BPMN javascript library"
- "process orchestration react"
- "decision tree navigation library"
- "flowchart execution engine"

**Questions:**
- Are there BPMN engines with good React integration?
- Do workflow engines support completion tracking?
- Can process orchestration libraries handle interactive navigation?

### 4. Tutorial/Onboarding Systems

**Keywords:**
- "multi-path tutorial system"
- "adaptive onboarding framework"
- "branching learning path library"
- "educational flow state machine"
- "training workflow engine react"

**Questions:**
- Do onboarding systems handle branching content?
- Are there libraries for adaptive tutorials with alternate paths?
- Can LMS (Learning Management System) libraries be repurposed?

### 5. Graph/Tree Navigation Libraries

**Keywords:**
- "graph traversal state management"
- "tree navigation react library"
- "directed graph walker javascript"
- "AST traversal with state"
- "graph-based navigation system"

**Questions:**
- Are there graph traversal libraries with state management?
- Do tree navigation libraries support completion tracking?
- Are there generic graph walkers that can be adapted?

### 6. Game State Management

**Keywords:**
- "game state machine branching choices"
- "dialogue tree system javascript"
- "quest system state management"
- "RPG progression tracking library"
- "game save state branching paths"

**Questions:**
- How do game engines handle branching quest lines?
- Are there reusable dialogue tree systems?
- Can game state managers track alternate path completion?

### 7. Academic/Research Projects

**Keywords:**
- "interactive walkthrough research papers"
- "graph navigation UI patterns"
- "branching process visualization"
- "alternate path exploration systems"
- "exploratory navigation interfaces"

**Questions:**
- Has academic research produced reusable implementations?
- Are there novel UI patterns for branching navigation?
- Have visualization tools tackled similar problems?

## Comparison Criteria

For each solution found, evaluate:

### Technical Fit
- [ ] State machine-based or compatible
- [ ] Supports branching/alternate paths
- [ ] Handles nested branches
- [ ] TypeScript support
- [ ] React integration available
- [ ] Completion tracking built-in

### Architecture
- [ ] Separation of state logic from UI
- [ ] Pluggable navigation logic
- [ ] Can work with canvas/SVG (not just DOM)
- [ ] URL state serialization

### Developer Experience
- [ ] Clear API and documentation
- [ ] TypeScript type safety
- [ ] Good test coverage
- [ ] Active maintenance
- [ ] Examples/tutorials

### License & Community
- [ ] MIT, BSD, or compatible license
- [ ] Active community
- [ ] Recent updates (within 6 months)
- [ ] Reasonable bundle size

## Specific Questions to Answer

1. **Is there a library that does exactly what we need?**
   - If yes: What's the integration path? What are the tradeoffs?
   - If no: Which library gets closest?

2. **Are there proven patterns we should follow?**
   - XState community patterns for branching
   - Navigation patterns from game dev
   - State management patterns from workflow engines

3. **What problems have others encountered?**
   - Common pitfalls in branching navigation
   - Performance issues with deep nesting
   - UI/UX challenges with alternate paths

4. **Can any solution be adapted/forked?**
   - Would it be easier to fork and modify?
   - Are there parts we can extract and reuse?
   - What's the learning curve?

5. **Is this actually a novel problem?**
   - Or are we missing obvious existing solutions?
   - Are there industry-standard approaches?

## Expected Deliverables

1. **Top 3-5 candidate libraries/frameworks** with:
   - Name, GitHub/npm link
   - Brief description
   - Pros/cons for our use case
   - Integration complexity estimate

2. **Comparison table** showing:
   - Feature matrix
   - License compatibility
   - Bundle size
   - Maintenance status

3. **Recommendation**: 
   - Use library X as-is
   - Adapt library Y with modifications
   - Build custom using patterns from Z
   - No suitable solution found (justify custom build)

4. **If custom build recommended:**
   - Which patterns to adopt
   - Which pitfalls to avoid
   - Links to relevant examples/discussions

## Out of Scope

❌ Don't research:
- Pure UI tour libraries (Shepherd.js, Intro.js, Driver.js - already evaluated)
- Analytics/tracking platforms
- Low-code/no-code workflow builders
- Enterprise BPMN engines (too heavy)
- Backend workflow orchestration (we need frontend)

## Context About Our Codebase

- **Framework:** React 18+
- **State Management:** XState (already in dependencies)
- **Rendering:** XYFlow (React Flow fork) for canvas-based diagrams
- **Language:** TypeScript (strict mode)
- **Use Case:** Sequence diagram walkthrough with branch collections and alternate paths
- **Scale:** Dozens of steps, up to 10 branches, 2-3 levels of nesting

## Timeline

**Deadline:** Need recommendation within 24-48 hours to decide:
- Integrate existing solution (if found)
- Proceed with custom XState implementation (already designed via ADRs)

---

## Success Criteria

Research is successful if it either:
1. **Finds a library** that saves us 50%+ of implementation time, OR
2. **Confirms custom build** is the right choice with confidence

Research fails if we:
- Miss an obvious existing solution
- Choose a library that doesn't actually fit
- Waste time evaluating incompatible solutions
