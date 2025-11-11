import { describe, expect, it } from 'vitest'
import { computeCompletedPaths } from '../completion'
import {
  getBranchProgress,
  getOverallProgress,
} from '../progress'
import type { WalkthroughContextInput, WalkthroughState } from '../types'

function state(partial?: Partial<WalkthroughState>): WalkthroughState {
  const completedSteps = partial?.completedSteps ?? new Set<string>()
  const completedPaths = partial?.completedPaths ?? new Set<string>()

  if (!partial?.active) {
    return {
      completedSteps,
      completedPaths,
    }
  }

  return {
    active: partial.active,
    completedSteps,
    completedPaths,
  }
}

describe('walkthrough/progress', () => {
  describe('getOverallProgress', () => {
    it('reports zero progress when no steps', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-empty',
        stepIds: [],
      }
      const s = state()

      const p = getOverallProgress(input, s)
      expect(p).toEqual({
        totalSteps: 0,
        completedSteps: 0,
      })
    })

    it('counts only stepIds that are in input.stepIds', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v1',
        stepIds: ['s1', 's2', 's3'],
      }
      const s = state({
        completedSteps: new Set(['s1', 's2', 'extra']),
      })

      const p = getOverallProgress(input, s)
      expect(p.totalSteps).toBe(3)
      expect(p.completedSteps).toBe(2)
    })

    it('is deterministic regardless of Set iteration order', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v2',
        stepIds: ['a', 'b', 'c', 'd'],
      }
      const s = state({
        completedSteps: new Set(['d', 'b']),
      })

      const p = getOverallProgress(input, s)
      expect(p).toEqual({
        totalSteps: 4,
        completedSteps: 2,
      })
    })
  })

  describe('getBranchProgress', () => {
    it('returns empty for unknown branch or no collections', () => {
      const inputNoCollections: WalkthroughContextInput = {
        viewId: 'v',
        stepIds: [],
      }
      const s = state()

      expect(getBranchProgress(inputNoCollections, s, 'b1')).toEqual([])

      const inputWithOther: WalkthroughContextInput = {
        viewId: 'v',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'other',
            kind: 'alternate',
            decisionStepId: 's1',
            paths: [
              { pathId: 'p', pathIndex: 0, stepIds: ['s1'] },
            ],
          },
        ],
      }

      expect(getBranchProgress(inputWithOther, s, 'b1')).toEqual([])
    })

    it('marks paths complete when all direct stepIds are completed', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-branch',
        stepIds: ['s1', 's2', 's3', 's4'],
        branchCollections: [
          {
            branchId: 'b1',
            kind: 'alternate',
            decisionStepId: 's2',
            paths: [
              {
                pathId: 'p1',
                pathIndex: 0,
                stepIds: ['s2', 's3'],
              },
              {
                pathId: 'p2',
                pathIndex: 1,
                stepIds: ['s2', 's4'],
              },
            ],
          },
        ],
      }

      const s = state({
        completedSteps: new Set(['s2', 's3', 's4']),
      })

      // Sanity: computeCompletedPaths matches our expectations
      const completedPaths = computeCompletedPaths(input, s)
      expect(Array.from(completedPaths).sort()).toEqual(['b1:p1', 'b1:p2'])

      const progress = getBranchProgress(input, s, 'b1').sort((a, b) => a.pathId.localeCompare(b.pathId))

      expect(progress).toEqual([
        {
          branchId: 'b1',
          pathId: 'p1',
          isComplete: true,
        },
        {
          branchId: 'b1',
          pathId: 'p2',
          isComplete: true,
        },
      ])
    })

    it('marks only fully-complete paths as complete', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-branch-partial',
        stepIds: ['s1', 's2', 's3', 's4'],
        branchCollections: [
          {
            branchId: 'b2',
            kind: 'alternate',
            decisionStepId: 's2',
            paths: [
              {
                pathId: 'p1',
                pathIndex: 0,
                stepIds: ['s2', 's3'],
              },
              {
                pathId: 'p2',
                pathIndex: 1,
                stepIds: ['s2', 's4'],
              },
            ],
          },
        ],
      }

      const s = state({
        completedSteps: new Set(['s2', 's3']),
      })

      const progress = getBranchProgress(input, s, 'b2').sort((a, b) => a.pathId.localeCompare(b.pathId))

      expect(progress).toEqual([
        {
          branchId: 'b2',
          pathId: 'p1',
          isComplete: true,
        },
        {
          branchId: 'b2',
          pathId: 'p2',
          isComplete: false,
        },
      ])
    })

    it('ignores nested branches and uses only direct stepIds semantics', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v-nested',
        stepIds: ['s1', 's2', 's3'],
        branchCollections: [
          {
            branchId: 'outer',
            kind: 'alternate',
            decisionStepId: 's1',
            paths: [
              {
                pathId: 'outer-a',
                pathIndex: 0,
                stepIds: ['s1', 's2'],
              },
            ],
          },
          {
            branchId: 'inner',
            kind: 'parallel',
            decisionStepId: 's2',
            paths: [
              {
                pathId: 'inner-p1',
                pathIndex: 0,
                stepIds: ['s2.1'],
              },
            ],
          },
        ],
      }

      const s = state({
        completedSteps: new Set(['s1', 's2', 's2.1']),
      })

      const outerProgress = getBranchProgress(input, s, 'outer')
      const innerProgress = getBranchProgress(input, s, 'inner')

      expect(outerProgress).toEqual([
        {
          branchId: 'outer',
          pathId: 'outer-a',
          isComplete: true,
        },
      ])

      expect(innerProgress).toEqual([
        {
          branchId: 'inner',
          pathId: 'inner-p1',
          isComplete: true,
        },
      ])
    })
  })
})
