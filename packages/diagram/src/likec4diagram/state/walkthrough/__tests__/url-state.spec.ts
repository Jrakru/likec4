import { describe, expect, it } from 'vitest'
import type { WalkthroughState } from '../types'
import {
  decodeWalkthroughState,
  encodeWalkthroughState,
  toBranchPathRef,
} from '../url-state'

describe('walkthrough/url-state', () => {
  describe('encodeWalkthroughState', () => {
    it('returns empty string when viewId missing', () => {
      const state: WalkthroughState = {
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      // @ts-expect-error viewId is required by type but we verify runtime behavior
      expect(encodeWalkthroughState('', state)).toBe('')
    })

    it('returns empty string when no active step', () => {
      const state: WalkthroughState = {
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      expect(encodeWalkthroughState('view-1', state)).toBe('')
    })

    it('encodes viewId and stepId without branch', () => {
      const state: WalkthroughState = {
        active: {
          stepId: 'step-01',
        },
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      expect(encodeWalkthroughState('view-1', state)).toBe('view-1:step-01')
    })

    it('encodes branch path when present', () => {
      const state: WalkthroughState = {
        active: {
          stepId: 'step-02',
          branch: {
            branchId: 'branch-1',
            pathId: 'path-a',
          },
        },
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      expect(encodeWalkthroughState('view-1', state)).toBe('view-1:step-02:branch-1:path-a')
    })

    it('omits incomplete branch info', () => {
      const stateMissingPath: WalkthroughState = {
        active: {
          stepId: 'step-02',
          // @ts-expect-error runtime guard: missing pathId
          branch: {
            branchId: 'branch-1',
          },
        },
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      expect(encodeWalkthroughState('view-1', stateMissingPath)).toBe('view-1:step-02')
    })
  })

  describe('decodeWalkthroughState', () => {
    it('returns empty object for empty input', () => {
      expect(decodeWalkthroughState('')).toEqual({})
      // @ts-expect-error runtime guard: non-string
      expect(decodeWalkthroughState(undefined)).toEqual({})
    })

    it('decodes viewId and stepId', () => {
      const decoded = decodeWalkthroughState('view-1:step-01')
      expect(decoded.viewId).toBe('view-1')
      expect(decoded.stepId).toBe('step-01')
      expect(decoded.branchId).toBeUndefined()
      expect(decoded.pathId).toBeUndefined()
    })

    it('decodes full branch selection', () => {
      const decoded = decodeWalkthroughState('view-1:step-02:branch-1:path-a')
      expect(decoded.viewId).toBe('view-1')
      expect(decoded.stepId).toBe('step-02')
      expect(decoded.branchId).toBe('branch-1')
      expect(decoded.pathId).toBe('path-a')
    })

    it('ignores extra segments beyond the 4th', () => {
      const decoded = decodeWalkthroughState('view-1:step-02:branch-1:path-a:extra:segments')
      expect(decoded.viewId).toBe('view-1')
      expect(decoded.stepId).toBe('step-02')
      expect(decoded.branchId).toBe('branch-1')
      expect(decoded.pathId).toBe('path-a')
    })

    it('handles malformed but colon-separated input best-effort', () => {
      const decoded = decodeWalkthroughState('only-view')
      expect(decoded).toEqual({})
    })
  })

  describe('toBranchPathRef', () => {
    it('returns undefined when branchId or pathId missing', () => {
      expect(toBranchPathRef({})).toBeUndefined()
      expect(toBranchPathRef({ viewId: 'v', stepId: 's' })).toBeUndefined()
      expect(toBranchPathRef({ branchId: 'b' })).toBeUndefined()
      expect(toBranchPathRef({ pathId: 'p' })).toBeUndefined()
    })

    it('returns WalkthroughBranchPathRef when both present', () => {
      const ref = toBranchPathRef({
        viewId: 'v',
        stepId: 's',
        branchId: 'b',
        pathId: 'p',
      })

      expect(ref).toEqual({
        branchId: 'b',
        pathId: 'p',
      })
    })

    it('is compatible with round-trip encode/decode', () => {
      const state: WalkthroughState = {
        active: {
          stepId: 'step-02',
          branch: {
            branchId: 'branch-x',
            pathId: 'path-y',
          },
        },
        completedSteps: new Set(),
        completedPaths: new Set(),
      }

      const encoded = encodeWalkthroughState('view-xyz', state)
      const decoded = decodeWalkthroughState(encoded)
      const ref = toBranchPathRef(decoded)

      expect(encoded).toBe('view-xyz:step-02:branch-x:path-y')
      expect(ref).toEqual({
        branchId: 'branch-x',
        pathId: 'path-y',
      })
    })
  })
})
