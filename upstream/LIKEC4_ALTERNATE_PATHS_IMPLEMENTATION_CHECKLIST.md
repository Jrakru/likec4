# LikeC4 Alternate Paths: Implementation Checklist

**Feature**: Alternate Paths for Dynamic Views  
**Repository**: Fork of `likec4/likec4`  
**Branch**: `feature/alternate-paths`  
**Estimated Effort**: 3 days (24 hours)  
**Status**: Not Started

---

## Pre-Implementation Setup

### Repository Setup
- [ ] Fork `likec4/likec4` to `1c4d5-team/likec4`
- [ ] Clone fork locally: `git clone https://github.com/1c4d5-team/likec4.git`
- [ ] Create feature branch: `git checkout -b feature/alternate-paths`
- [ ] Install dependencies: `pnpm install`
- [ ] Verify build works: `pnpm build`
- [ ] Verify tests pass: `pnpm test`
- [ ] Set up upstream remote: `git remote add upstream https://github.com/likec4/likec4.git`

### Development Environment
- [ ] IDE configured (VS Code recommended)
- [ ] Langium extension installed
- [ ] TypeScript version matches project (check `package.json`)
- [ ] Node.js version matches project requirements
- [ ] Familiarize with project structure (`packages/` organization)

### Documentation Review
- [ ] Read `CONTRIBUTING.md` in likec4 repo
- [ ] Review existing `parallel` implementation (reference points)
- [ ] Study `packages/language-server/src/like-c4.langium` grammar
- [ ] Review `packages/core/src/types/view-parsed.dynamic.ts` types
- [ ] Understand XState machine in `packages/diagram/src/likec4diagram/state/`

---

## Phase 1: Core Functionality (Day 1, ~8 hours)

### 1.1 Grammar Extension (1-2 hours)

**File**: `packages/language-server/src/like-c4.langium`

- [ ] Add `DynamicViewAlternateSteps` rule to grammar
  ```langium
  DynamicViewAlternateSteps:
    ('alternate'|'alt') '{'
      (paths+=DynamicViewAlternatePath)*
    '}'
  ;
  ```

- [ ] Add `DynamicViewAlternatePath` rule
  ```langium
  DynamicViewAlternatePath:
    ('path')? name=ID? title=String? '{'
      (steps+=DynamicViewStep)*
    '}'
  ;
  ```

- [ ] Update `DynamicViewBody` to include alternate steps
  ```langium
  DynamicViewBody: '{'
    // ... existing ...
    (
      steps+=(DynamicViewParallelSteps | DynamicViewAlternateSteps | DynamicViewStep) |
      rules+=DynamicViewRule
    )*
  '}'
  ```

- [ ] Regenerate Langium artifacts: `pnpm --filter @likec4/language-server generate`
- [ ] Verify no syntax errors in generated files
- [ ] Test: Create simple `.likec4` file with `alternate` syntax
- [ ] Verify: Parser accepts new syntax without errors

**Commit**: `feat(grammar): add alternate paths syntax to dynamic views`

### 1.2 Type System (1 hour)

**File**: `packages/core/src/types/view-parsed.dynamic.ts`

- [ ] Add `DynamicStepsAlternate` interface
  ```typescript
  export interface DynamicStepsAlternate<A extends AnyAux = AnyAux> {
    readonly alternateId: string
    readonly __alternate: NonEmptyReadonlyArray<DynamicStepsAlternatePath<A>>
  }
  ```

- [ ] Add `DynamicStepsAlternatePath` interface
  ```typescript
  export interface DynamicStepsAlternatePath<A extends AnyAux = AnyAux> {
    readonly pathId: string
    readonly pathName?: string
    readonly pathTitle?: string
    readonly isDefault: boolean
    readonly __steps: NonEmptyReadonlyArray<DynamicStep<A> | DynamicStepsSeries<A>>
  }
  ```

- [ ] Update `DynamicViewStep` discriminated union
  ```typescript
  export type DynamicViewStep<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Step: DynamicStep<A>
    Series: DynamicStepsSeries<A>
    Parallel: DynamicStepsParallel<A>
    Alternate: DynamicStepsAlternate<A>  // NEW
  }>
  ```

- [ ] Add type guard function
  ```typescript
  export function isDynamicStepsAlternate<A extends AnyAux>(
    step: DynamicViewStep<A> | undefined,
  ): step is DynamicStepsAlternate<A> {
    return !!step && '__alternate' in step && isArray(step.__alternate)
  }
  ```

- [ ] Export new types from `index.ts`
- [ ] Build: `pnpm --filter @likec4/core build`
- [ ] Verify: No TypeScript errors

**Commit**: `feat(types): add alternate paths types to dynamic views`

### 1.3 Parser Implementation (2 hours)

**File**: `packages/language-server/src/model/parser/ViewsParser.ts`

- [ ] Add `parseDynamicViewAlternateSteps` method (mirror `parseDynamicViewSteps`)
  ```typescript
  parseDynamicViewAlternateSteps(node: ast.DynamicViewAlternateSteps): c4.DynamicStepsAlternate {
    const alternateId = pathInsideDynamicView(node)
    const __alternate = node.paths.map((path, index) => {
      const pathId = `${alternateId}/path@${index}`
      const __steps = path.steps.map(step => this.parseDynamicStep(step))
      
      invariant(
        isNonEmptyArray(__steps), 
        `Alternate path '${path.name || index}' must have at least one step`
      )
      
      return {
        pathId,
        pathName: path.name,
        pathTitle: path.title,
        isDefault: index === 0,
        __steps,
      }
    })
    
    invariant(isNonEmptyArray(__alternate), 'Alternate must have at least one path')
    
    if (__alternate.length < 2) {
      this.accept('warning', 'Alternate should have at least 2 paths', {
        node,
        code: 'alternate-single-path',
      })
    }
    
    return { alternateId, __alternate }
  }
  ```

- [ ] Integrate into `parseDynamicViewBody` step dispatch
- [ ] Handle `ast.isDynamicViewAlternateSteps` check
- [ ] Build: `pnpm --filter @likec4/language-server build`
- [ ] Verify: No TypeScript errors

**Commit**: `feat(parser): implement alternate paths parser`

### 1.4 Unit Tests (2-3 hours)

**File**: `packages/language-server/src/model/__tests__/model-parser-dynamic-views.spec.ts`

- [ ] Test: Parse alternate with 2 paths
  ```typescript
  it('parses alternate paths with multiple branches', async ({ expect }) => {
    // ... test implementation
  })
  ```

- [ ] Test: Parse alternate with named paths
- [ ] Test: Parse alternate with titled paths
- [ ] Test: Parse alternate with 3+ paths
- [ ] Test: Warning on single path
- [ ] Test: Error on empty path
- [ ] Test: Nested steps within paths
- [ ] Test: Chained steps within paths (series)
- [ ] Run tests: `pnpm --filter @likec4/language-server test`
- [ ] Verify: All tests pass (including existing tests)

**Commit**: `test(parser): add alternate paths parser tests`

### 1.5 Compute Layer - Diagram Mode (1-2 hours)

**File**: `packages/core/src/compute-view/dynamic-view/compute.ts`

- [ ] Add alternate handling to step processing loop
  ```typescript
  if (isDynamicStepsAlternate(step)) {
    // Process only default path (first path) in diagram mode
    const defaultPath = step.__alternate[0]!
    let nestedStepNum = 1
    for (const s of defaultPath.__steps) {
      nestedStepNum = processStep(s, nestedStepNum, stepNum)
    }
    stepNum++
    continue
  }
  ```

- [ ] Update `elementsFromSteps` utility to handle alternate paths
- [ ] Build: `pnpm --filter @likec4/core build`
- [ ] Test manually with example model
- [ ] Verify: Default path renders in diagram

**Commit**: `feat(compute): add alternate paths support to diagram computation`

---

## Phase 2: Walkthrough Interactive Navigation (Day 2, ~8 hours)

### 2.1 State Machine Types (1 hour)

**File**: `packages/diagram/src/likec4diagram/state/types.ts` (or inline in diagram-machine.ts)

- [ ] Extend `ActiveWalkthrough` interface
  ```typescript
  interface ActiveWalkthrough {
    stepId: StepEdgeId
    parallelPrefix: string | null
    alternateContext?: {
      alternateId: string
      selectedPathIndex: number
      pathStepIndex: number
      availablePaths: Array<{
        pathId: string
        pathName?: string
        pathTitle?: string
        isDefault: boolean
      }>
    }
  }
  ```

- [ ] Add new event type
  ```typescript
  | { type: 'walkthrough.switchPath'; pathIndex: number }
  ```

**Commit**: `feat(state): extend walkthrough state for alternate paths`

### 2.2 Navigation Logic (3-4 hours)

**File**: `packages/diagram/src/likec4diagram/state/diagram-machine.ts`

- [ ] Update `'walkthrough.step'` action with alternate logic
  - [ ] Case 1: Traversing alternate path (next/previous within path)
  - [ ] Case 2: At decision point (entering alternate)
  - [ ] Case 3: Exiting alternate (path complete)

- [ ] Add `'walkthrough.switchPath'` action
  ```typescript
  'walkthrough.switchPath': {
    actions: [
      assign(({ context, event }) => {
        // Switch to different path, reset to path start
      }),
      'update active walkthrough',
      'xyflow:fitFocusedBounds',
    ],
  }
  ```

- [ ] Add helper functions
  - [ ] `isAlternateStep(step): boolean`
  - [ ] `getAlternatePaths(alternateId): Path[]`
  - [ ] `getPathSteps(alternateId, pathIndex): Step[]`
  - [ ] `findStepAfterAlternate(alternateId): number`

- [ ] Build: `pnpm --filter @likec4/diagram build`
- [ ] Verify: No TypeScript errors

**Commit**: `feat(walkthrough): implement alternate path navigation logic`

### 2.3 UI Components (3-4 hours)

**File**: `packages/diagram/src/navigationpanel/walkthrough/PathSelector.tsx` (new file)

- [ ] Create `PathSelector` component
  ```tsx
  interface PathSelectorProps {
    paths: Array<{ pathId: string; pathName?: string; pathTitle?: string; isDefault: boolean }>
    selectedPathIndex: number
    onSelectPath: (index: number) => void
    isAtDecisionPoint: boolean
  }
  ```

- [ ] Style with Mantine components (Badge, Button, Stack, Text)
- [ ] Add path selection UI (radio buttons or button group)
- [ ] Show current path indicator
- [ ] Show "return to decision" hint when traversing

**File**: `packages/diagram/src/navigationpanel/walkthrough/ActiveWalkthroughControls.tsx`

- [ ] Import `PathSelector`
- [ ] Read `alternateContext` from diagram state
- [ ] Conditionally render `PathSelector` when alternate context exists
- [ ] Update step badge to show path context
  ```tsx
  <Badge>
    Step {currentStep} of {totalSteps}
    {alternateContext && <> • {getCurrentPathTitle()}</>}
  </Badge>
  ```

- [ ] Wire up `onSelectPath` to `diagram.switchPath(index)`

**File**: `packages/diagram/src/hooks/useDiagram.ts`

- [ ] Add `switchPath` method to `DiagramApi`
  ```typescript
  switchPath(pathIndex: number): void
  ```

- [ ] Implement by sending `walkthrough.switchPath` event

- [ ] Build: `pnpm --filter @likec4/diagram build`
- [ ] Test manually with example model

**Commit**: `feat(ui): add path selector component for alternate paths`

### 2.4 Integration Tests (1 hour)

**File**: `packages/diagram/src/likec4diagram/state/__tests__/walkthrough-alternate.spec.ts` (new file)

- [ ] Test: Navigate to alternate step
- [ ] Test: Enter default path
- [ ] Test: Navigate through path steps
- [ ] Test: Return to decision point (back button)
- [ ] Test: Switch to different path
- [ ] Test: Exit alternate (reach end of path)
- [ ] Run tests: `pnpm --filter @likec4/diagram test`
- [ ] Verify: All tests pass

**Commit**: `test(walkthrough): add alternate path navigation tests`

---

## Phase 3: Sequence Diagram & Polish (Day 3, ~8 hours)

### 3.1 Sequence Layout (4-6 hours)

**File**: `packages/layouts/src/sequence/_types.ts`

- [ ] Add `alternatePrefix` to `Step` type
  ```typescript
  export type Step = {
    // ... existing fields
    alternatePrefix: string | null
    alternatePath?: {
      pathId: string
      pathName?: string
      pathTitle?: string
      isDefault: boolean
    }
  }
  ```

**File**: `packages/layouts/src/sequence/utils.ts`

- [ ] Add `getAlternateStepsPrefix(id: string): string | null` helper
- [ ] Mirror implementation of `getParallelStepsPrefix`

**File**: `packages/layouts/src/sequence/layouter.ts`

- [ ] Identify alternate step groups (similar to parallel boxes)
- [ ] Calculate bounding boxes for alt/else frames
- [ ] Store alternate boxes in `#alternateBoxes` array
- [ ] Add `getAlternateBoxes()` method

**File**: `packages/layouts/src/sequence/sequence-view.ts`

- [ ] Render alternate frames (boxes with labels)
- [ ] Stack paths vertically within frame
- [ ] Add path labels (e.g., "alt Success", "else Failure")
- [ ] Style with borders and background

- [ ] Build: `pnpm --filter @likec4/layouts build`
- [ ] Test with sequence mode example
- [ ] Verify: Alt/else boxes render correctly

**Commit**: `feat(layout): add sequence diagram rendering for alternate paths`

### 3.2 Visual Indicators (1 hour)

**File**: `packages/diagram/src/likec4diagram/xyflow-sequence/` (or diagram rendering)

- [ ] Hide inactive alternate paths during walkthrough
- [ ] Highlight active path steps
- [ ] Add visual indicator at decision point (optional: ghosted paths)

- [ ] Build: `pnpm --filter @likec4/diagram build`
- [ ] Test manually: Verify correct highlighting

**Commit**: `feat(diagram): add visual indicators for alternate paths`

### 3.3 Documentation (2 hours)

**File**: `docs/dsl/dynamic-view.md` (or appropriate docs location)

- [ ] Add "Alternate Paths" section
- [ ] Explain syntax and semantics
- [ ] Show example: Data quality pipeline
- [ ] Show example: Authentication flow
- [ ] Explain walkthrough behavior
- [ ] Add screenshot/diagram if possible

**File**: `CHANGELOG.md`

- [ ] Add entry under "Unreleased" or next version
  ```markdown
  ### Features
  - **dynamic views**: Add support for alternate paths (OR logic)
    - Use `alternate { path { ... } }` syntax for decision points
    - Walkthrough mode allows exploring different paths interactively
    - Sequence mode renders as alt/else blocks
  ```

**File**: `examples/` (add example workspace)

- [ ] Create example with alternate paths
- [ ] Include multiple use cases (2-3 views)
- [ ] Add README explaining examples

**Commit**: `docs: add alternate paths documentation and examples`

---

## Testing & Quality Assurance

### Manual Testing Checklist

- [ ] Test: Parse alternate syntax without errors
- [ ] Test: Diagram mode shows default path only
- [ ] Test: Sequence mode shows alt/else frames
- [ ] Test: Walkthrough enters alternate correctly
- [ ] Test: Path selector appears at decision point
- [ ] Test: Can select different paths
- [ ] Test: Can navigate through selected path
- [ ] Test: Back button returns to decision point
- [ ] Test: Can switch paths at decision point
- [ ] Test: Exiting alternate continues correctly
- [ ] Test: Works with parallel paths (no conflicts)
- [ ] Test: Nested alternates work (if implemented)
- [ ] Test: Single-path alternate shows warning
- [ ] Test: Empty path shows error
- [ ] Test: Keyboard navigation works (arrow keys)

### Regression Testing

- [ ] Verify: Existing dynamic views render identically
- [ ] Verify: Parallel paths still work
- [ ] Verify: Regular steps unaffected
- [ ] Verify: All existing tests pass
- [ ] Run full test suite: `pnpm test`
- [ ] Build all packages: `pnpm build`
- [ ] Check for TypeScript errors: `pnpm type-check` (if available)

### Performance Testing

- [ ] Benchmark: Model with 50+ steps (with/without alternates)
- [ ] Verify: No noticeable slowdown
- [ ] Check: Memory usage reasonable
- [ ] Profile: Walkthrough navigation responsiveness

### Accessibility Testing

- [ ] Keyboard: Path selector navigable with Tab/Enter
- [ ] Keyboard: Arrow keys work in walkthrough
- [ ] Screen reader: Path labels announced
- [ ] Contrast: Path selector meets WCAG standards

---

## Pull Request Preparation

### PR 1: Core Functionality (Grammar, Types, Parser)

- [ ] Squash commits if needed for clean history
- [ ] Write comprehensive PR description
  - [ ] Problem statement
  - [ ] Solution overview
  - [ ] Breaking changes: None
  - [ ] Examples included
- [ ] Add "before/after" comparison
- [ ] Link to feature request issue
- [ ] Self-review: Check diff for debug code, console.logs
- [ ] Verify: CI passes (if fork has CI)
- [ ] Tag reviewers
- [ ] Create PR: `1c4d5-team/likec4:feature/alternate-paths` → `likec4/likec4:main`

### PR 2: Walkthrough UI (If splitting into multiple PRs)

- [ ] Same preparation steps as PR 1
- [ ] Mention dependency on PR 1
- [ ] Include demo GIF/video of walkthrough

### PR 3: Sequence Rendering (If splitting)

- [ ] Same preparation steps
- [ ] Include screenshot of sequence mode

---

## Post-Implementation

### Sync with Upstream

- [ ] Keep fork up to date: `git fetch upstream && git rebase upstream/main`
- [ ] Resolve conflicts if any
- [ ] Re-test after rebase

### Use in 1C4D5

- [ ] Update 1C4D5 dependency to use fork
  ```json
  "dependencies": {
    "@likec4/core": "github:1c4d5-team/likec4#feature/alternate-paths"
  }
  ```

- [ ] Test with 1C4D5 use cases (data quality gates, etc.)
- [ ] Document any issues or limitations
- [ ] Gather user feedback

### Monitor Upstream PR

- [ ] Respond to review comments promptly
- [ ] Make requested changes
- [ ] Re-request review after updates
- [ ] Celebrate merge! 🎉
- [ ] Switch 1C4D5 back to official release once merged

---

## Troubleshooting

### Issue: Langium generation fails

**Solution**: 
- Check grammar syntax carefully
- Run `pnpm --filter @likec4/language-server clean` then regenerate
- Check for duplicate rule names

### Issue: Type errors after adding new types

**Solution**:
- Rebuild `@likec4/core` package
- Check all dependent packages are using latest build
- Run `pnpm build` from monorepo root

### Issue: Tests fail after changes

**Solution**:
- Update snapshots if needed: `pnpm test -- -u`
- Check if existing tests need updates for new functionality
- Ensure test fixtures are valid

### Issue: Walkthrough not entering alternate

**Solution**:
- Debug state machine with XState inspector
- Check `isDynamicStepsAlternate` type guard
- Verify step IDs match between compute and walkthrough

### Issue: Sequence layout broken

**Solution**:
- Check bounding box calculations
- Verify alternate boxes don't overlap with parallel boxes
- Test with simpler examples first

---

## Success Criteria

**Definition of Done**:

- [ ] All checklist items complete
- [ ] All tests passing (unit + integration)
- [ ] Documentation written
- [ ] Examples added
- [ ] Manual testing complete
- [ ] No regressions in existing functionality
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] PR(s) submitted to upstream
- [ ] Code reviewed and approved
- [ ] Feature usable in 1C4D5 fork

---

## Resources

### Key Files Reference

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Grammar | `packages/language-server/src/like-c4.langium` | DSL syntax |
| Types | `packages/core/src/types/view-parsed.dynamic.ts` | Type definitions |
| Parser | `packages/language-server/src/model/parser/ViewsParser.ts` | AST → Types |
| Compute | `packages/core/src/compute-view/dynamic-view/compute.ts` | View processing |
| Layout | `packages/layouts/src/sequence/layouter.ts` | Sequence layout |
| State Machine | `packages/diagram/src/likec4diagram/state/diagram-machine.ts` | Walkthrough logic |
| UI | `packages/diagram/src/navigationpanel/walkthrough/` | React components |

### Reference Documents

- Feature Request: `docs/upstream/LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md`
- Feasibility Analysis: `docs/investigations/LIKEC4_ALTERNATE_PATHS_FEASIBILITY.md`
- UX Design: `docs/investigations/ALTERNATE_PATHS_WALKTHROUGH_UX.md`
- ADR: `docs/adr/ADR-0007-leverage-likec4-dynamic-views-for-flow-stories.md`

### Communication

- GitHub: Create issues/discussions as needed
- LikeC4 Discord: Join for questions (if available)
- 1C4D5 Team: Regular sync on progress

---

**Checklist Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Owner**: Implementation Team  
**Estimated Completion**: 3 days (24 hours)