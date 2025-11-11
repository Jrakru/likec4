import { describe, expect, it } from 'vitest'
import {
  buildLinearOrder,
  getBranchOptions,
  getDefaultBranchPath,
  getNextStep,
  getPreviousStep,
} from '../navigation'
import type {
  WalkthroughContextInput,
  WalkthroughState,
} from '../types'

function createState(stepId?: string): WalkthroughState {
  if (!stepId) {
    // No active field at all to satisfy exactOptionalPropertyTypes
    return {
      completedSteps: new Set(),
      completedPaths: new Set(),
    }
  }
  return {
    active: {
      stepId,
    },
    completedSteps: new Set(),
    completedPaths: new Set(),
  }
}

describe('walkthrough/navigation', () => {
  describe('buildLinearOrder', () => {
    it('returns a copy of input.stepIds', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v1',
        stepIds: ['s1', 's2', 's3'],
      }

      const order = buildLinearOrder(input)
      expect(order).toEqual(['s1', 's2', 's3'])
      expect(order).not.toBe(input.stepIds)
    })

    it('handles empty stepIds deterministically', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-empty',
        stepIds: [],
      }
      expect(buildLinearOrder(input)).toEqual([])
    })
  })

  describe('linear NEXT/PREVIOUS', () => {
    const input: WalkthroughContextInput = {
      viewId: 'v-linear',
      stepIds: ['s1', 's2', 's3'],
    }

    it('NEXT from no active picks first step', () => {
      const state = createState()
      expect(getNextStep(input, state)).toBe('s1')
    })

    it('NEXT advances along linear order', () => {
      expect(getNextStep(input, createState('s1'))).toBe('s2')
      expect(getNextStep(input, createState('s2'))).toBe('s3')
    })

    it('NEXT from last returns undefined', () => {
      expect(getNextStep(input, createState('s3'))).toBeUndefined()
    })

    it('NEXT from unknown active falls back to first', () => {
      expect(getNextStep(input, createState('unknown'))).toBe('s1')
    })

    it('PREVIOUS from middle steps works', () => {
      expect(getPreviousStep(input, createState('s2'))).toBe('s1')
      expect(getPreviousStep(input, createState('s3'))).toBe('s2')
    })

    it('PREVIOUS from first or no active yields undefined', () => {
      expect(getPreviousStep(input, createState('s1'))).toBeUndefined()
      expect(getPreviousStep(input, createState())).toBeUndefined()
    })

    it('PREVIOUS from unknown active yields undefined', () => {
      expect(getPreviousStep(input, createState('unknown'))).toBeUndefined()
    })
  })

  describe('branch options', () => {
    it('returns branch paths for a simple alternate branch', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-alt',
        stepIds: ['step-01', 'step-02', 'step-03'],
        branchCollections: [
          {
            branchId: 'branch-1',
            kind: 'alternate',
            decisionStepId: 'step-02',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                isDefaultPath: true,
                stepIds: ['step-02:1', 'step-03'],
              },
              {
                pathId: 'path-b',
                pathIndex: 1,
                stepIds: ['step-02:2', 'step-03'],
              },
            ],
          },
        ],
      }

      const options = getBranchOptions(input, 'step-02')
      expect(options).toEqual([
        { branchId: 'branch-1', pathId: 'path-a' },
        { branchId: 'branch-1', pathId: 'path-b' },
      ])
    })

    it('returns branch paths for a simple parallel branch', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-par',
        stepIds: ['step-01', 'step-02', 'step-03'],
        branchCollections: [
          {
            branchId: 'branch-par',
            kind: 'parallel',
            decisionStepId: 'step-02',
            paths: [
              {
                pathId: 'p1',
                pathIndex: 0,
                stepIds: ['step-02.1', 'step-03'],
              },
              {
                pathId: 'p2',
                pathIndex: 1,
                stepIds: ['step-02.2', 'step-03'],
              },
            ],
          },
        ],
      }

      const options = getBranchOptions(input, 'step-02')
      expect(options).toEqual([
        { branchId: 'branch-par', pathId: 'p1' },
        { branchId: 'branch-par', pathId: 'p2' },
      ])
    })

    it('returns empty array when no matching decision step', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-none',
        stepIds: ['step-01'],
        branchCollections: [
          {
            branchId: 'b',
            kind: 'alternate',
            decisionStepId: 'step-02',
            paths: [
              {
                pathId: 'p',
                pathIndex: 0,
                stepIds: ['step-02'],
              },
            ],
          },
        ],
      }

      expect(getBranchOptions(input, 'step-01')).toEqual([])
    })

    it('supports nested branches structurally (branch inside path)', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-nested',
        stepIds: ['step-01', 'step-02', 'step-03', 'step-04'],
        branchCollections: [
          {
            branchId: 'outer',
            kind: 'alternate',
            decisionStepId: 'step-02',
            paths: [
              {
                pathId: 'outer-a',
                pathIndex: 0,
                isDefaultPath: true,
                stepIds: ['step-02:1', 'step-03'],
              },
            ],
          },
          {
            branchId: 'inner',
            kind: 'parallel',
            decisionStepId: 'step-03',
            paths: [
              {
                pathId: 'inner-p1',
                pathIndex: 0,
                stepIds: ['step-03.1', 'step-04'],
              },
            ],
          },
        ],
      }

      const outerOptions = getBranchOptions(input, 'step-02')
      expect(outerOptions).toEqual([
        { branchId: 'outer', pathId: 'outer-a' },
      ])

      const innerOptions = getBranchOptions(input, 'step-03')
      expect(innerOptions).toEqual([
        { branchId: 'inner', pathId: 'inner-p1' },
      ])
    })
  })

  describe('getDefaultBranchPath', () => {
    it('prefers defaultPathId when present', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-default-id',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b1',
            kind: 'alternate',
            // structural forward compat: defaultPathId is allowed by navigation
            // helpers via a widened type
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            ...({ defaultPathId: 'path-b' } as { defaultPathId: string }),
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                stepIds: ['step-01'],
              },
              {
                pathId: 'path-b',
                pathIndex: 1,
                stepIds: ['step-02'],
              },
            ],
          } as any,
        ],
      }

      const def = getDefaultBranchPath(input, 'b1')
      expect(def).toEqual({ branchId: 'b1', pathId: 'path-b' })
    })

    it('falls back to isDefaultPath when no defaultPathId', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-default-flag',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b2',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                stepIds: ['step-01'],
              },
              {
                pathId: 'path-b',
                pathIndex: 1,
                isDefaultPath: true,
                stepIds: ['step-02'],
              },
            ],
          },
        ],
      }

      const def = getDefaultBranchPath(input, 'b2')
      expect(def).toEqual({ branchId: 'b2', pathId: 'path-b' })
    })

    it('falls back to pathIndex === 0 when no explicit default', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-index0',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b3',
            kind: 'parallel',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                stepIds: ['step-01'],
              },
              {
                pathId: 'path-b',
                pathIndex: 1,
                stepIds: ['step-02'],
              },
            ],
          },
        ],
      }

      const def = getDefaultBranchPath(input, 'b3')
      expect(def).toEqual({ branchId: 'b3', pathId: 'path-a' })
    })

    it('falls back to first path when no pathIndex === 0', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-fallback',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b4',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 2,
                stepIds: ['step-01'],
              },
              {
                pathId: 'path-b',
                pathIndex: 3,
                stepIds: ['step-02'],
              },
            ],
          },
        ],
      }

      const def = getDefaultBranchPath(input, 'b4')
      expect(def).toEqual({ branchId: 'b4', pathId: 'path-a' })
    })

    it('returns undefined for unknown branch or when no collections', () => {
      const base: WalkthroughContextInput = {
        viewId: 'v-none',
        stepIds: [],
      }

      expect(getDefaultBranchPath(base, 'x')).toBeUndefined()

      const withCollections: WalkthroughContextInput = {
        viewId: 'v-none-2',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [],
          },
        ],
      }

      expect(getDefaultBranchPath(withCollections, 'missing')).toBeUndefined()
    })
  })
})
