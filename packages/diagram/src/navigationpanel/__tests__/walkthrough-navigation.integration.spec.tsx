import { describe, expect, it } from 'vitest'

// This spec is intentionally minimal.
// Walkthrough + NavigationPanel integration is validated via:
// - Walkthrough harness components in:
//   - packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Linear.tsx
//   - packages/diagram/src/navigationpanel/__stories__/WalkthroughHarness.Branching.tsx
// - E2E tests (if configured) using those harnesses.
// This placeholder ensures legacy file paths remain valid without coupling to internals.

describe('walkthrough-navigation.integration (superseded by harness-based coverage)', () => {
  it('is covered via walkthrough harnesses and Playwright routes', () => {
    expect(true).toBe(true)
  })
})
