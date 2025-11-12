/**
 * Deprecated harness implementation.
 *
 * This file is intentionally kept minimal and only re-exports the new,
 * spec-compliant harness components to avoid breaking imports from
 * previous attempts while TODO 9 is finalized.
 *
 * New harness implementations live in:
 * - WalkthroughHarness.Linear.tsx
 * - WalkthroughHarness.Branching.tsx
 */

export { WalkthroughHarnessBranching } from './WalkthroughHarness.Branching'
export { WalkthroughHarnessLinear } from './WalkthroughHarness.Linear'
