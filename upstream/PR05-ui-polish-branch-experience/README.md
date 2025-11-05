# PR05 – UI Polish & Branch Storytelling Experience

## 1. Context
After the state machine exposes branch-aware navigation, we refine the UI to deliver the storytelling improvements (branch selectors, breadcrumbs, metadata surfacing, scenario filters). This PR introduces visual components, accessibility polish, and finalises the user-facing experience for unified branching.

## 2. Scope
- Build branch selector UI (dropdown/buttons) in navigation panel and walkthrough overlay.
- Render branch breadcrumbs, path counters, and metadata (guard, probability, owner, etc.) when available.
- Add scenario filter chips to show/hide non-default paths in diagram view.
- Apply stylistic differentiation between parallel and alternate paths (colors, icons) using design tokens.
- Ensure responsive and accessible layouts (keyboard navigation, ARIA attributes).

Out of scope: telemetry (PR07) and documentation updates (PR06).

## 3. Test-Driven Development Plan
1. **Component Tests**
   - Add failing tests in `packages/diagram/src/navigationpanel/__tests__/BranchControls.spec.tsx` covering selector interactions, accessibility, and conditional rendering.
2. **Visual Regression**
   - Capture Storybook/Playwright snapshots for key states: default path, alternate path selection, scenario filter toggled.
3. **End-to-End Flow**
   - Extend e2e scenario to exercise branch switching, jump to decision, filter toggles, and ensure persisted state.
4. **Accessibility Audit**
   - Integrate automated axe-core checks in UI tests; initial runs should fail until ARIA wiring is in place.

## 4. Implementation Outline
- Create new components under `packages/diagram/src/navigationpanel/walkthrough/` for branch selectors and metadata display.
- Update `WalkthroughPanel`, `ActiveWalkthroughControls`, and `NavigationPanel` to compose new components.
- Introduce scenario filter UI in `packages/diagram/src/navigationpanel/NavigationPanelControls.tsx`.
- Wire styling via `@likec4/styles`, adding tokens for branch colors/icons; ensure theme compatibility.
- Hook into state machine actions from PR04 for user interactions.
- Add branch metadata surfaces in edge tooltips and notes panels (if available).

## 5. Documents & Artifacts to Update
- `upstream/APPROACH_UNIFIED_BRANCHING_REWORK.md` – mark UI work in progress/completion.
- `apps/docs/src/content/docs/tooling/react.mdx` – update component usage examples.
- `apps/docs/src/content/docs/tooling/dynamic-views.mdx` – add screenshots demonstrating new UI.
- Update demo scripts (`apps/playground/src/routes/...`) to highlight feature flag toggle.

## 6. Definition of Done
- Component/unit tests, e2e scenarios, and accessibility audits pass.
- Visual regression diffs reviewed and approved by design (screenshots attached).
- UI seamlessly degrades when feature flag disabled (controls hidden).
- Responsive behaviour verified for common breakpoints (mobile/tablet/desktop).
- CHANGELOG draft updated with UX improvements.

## 7. Dependencies & Follow-Up
- Depends on: PR04 merged.
- Enables: PR06 documentation updates (since UI is final) and PR07 telemetry instrumentation.
- Follow-up: gather beta feedback, prepare onboarding tips for Icepanel parity features.
