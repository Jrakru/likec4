import { describe, expect, it } from 'vitest'
import {
  computeCompletedPaths,
  isStepComplete,
  markStepComplete,
  resetCompletion,
} from '../completion'
import type { WalkthroughContextInput, WalkthroughState } from '../types'

function baseState(partial?: Partial<WalkthroughState>): WalkthroughState {
  const completedSteps = partial?.completedSteps ?? new Set<string>()
  const completedPaths = partial?.completedPaths ?? new Set<string>()

  if (!partial || partial.active === undefined) {
    // Omit `active` entirely when not provided to satisfy exactOptionalPropertyTypes.
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

describe('walkthrough/completion', () => {
  describe('isStepComplete', () => {
    it('returns false when step not completed', () => {
      const state = baseState({ completedSteps: new Set(['s1']) })
      expect(isStepComplete(state, 's2')).toBe(false)
    })

    it('returns true when step completed', () => {
      const state = baseState({ completedSteps: new Set(['s1', 's2']) })
      expect(isStepComplete(state, 's2')).toBe(true)
    })
  })

  describe('markStepComplete', () => {
    it('adds step to completedSteps immutably', () => {
      const original = baseState({ completedSteps: new Set(['s1']) })
      const next = markStepComplete(original, 's2')

      expect(original.completedSteps.has('s2')).toBe(false)
      expect(next.completedSteps.has('s1')).toBe(true)
      expect(next.completedSteps.has('s2')).toBe(true)
    })

    it('is a no-op for already completed step', () => {
      const original = baseState({ completedSteps: new Set(['s1']) })
      const next = markStepComplete(original, 's1')

      expect(next).toBe(original)
    })

    it('is a no-op for empty stepId', () => {
      const original = baseState({ completedSteps: new Set() })
      const next = markStepComplete(original, '')

      expect(next).toBe(original)
    })
  })

  describe('computeCompletedPaths', () => {
    it('returns empty set when no branchCollections', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v1',
        stepIds: ['s1'],
      }
      const state = baseState({ completedSteps: new Set(['s1']) })

      const completed = computeCompletedPaths(input, state)
      expect(completed.size).toBe(0)
    })

    it('marks single-path branch complete when all steps done', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v2',
        stepIds: ['step-01', 'step-02'],
        branchCollections: [
          {
            branchId: 'branch-1',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                stepIds: ['step-01', 'step-02'],
              },
            ],
          },
        ],
      }

      const state = baseState({ completedSteps: new Set(['step-01', 'step-02']) })
      const completed = computeCompletedPaths(input, state)

      expect(Array.from(completed)).toEqual(['branch-1:path-a'])
    })

    it('does not mark path complete when some steps missing', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v3',
        stepIds: ['step-01', 'step-02'],
        branchCollections: [
          {
            branchId: 'branch-1',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'path-a',
                pathIndex: 0,
                stepIds: ['step-01', 'step-02'],
              },
            ],
          },
        ],
      }

      const state = baseState({ completedSteps: new Set(['step-01']) })
      const completed = computeCompletedPaths(input, state)

      expect(completed.size).toBe(0)
    })

    it('handles multiple paths independently', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v4',
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

      const state = baseState({
        completedSteps: new Set(['s2', 's3', 's4']),
      })

      const completed = computeCompletedPaths(input, state)
      const keys = Array.from(completed).sort()

      // Both paths have all their direct stepIds completed
      expect(keys).toEqual(['b1:p1', 'b1:p2'])
    })

    it('ignores nested branches (only direct path stepIds considered)', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v5',
        stepIds: ['step-01', 'step-02', 'step-03'],
        branchCollections: [
          {
            branchId: 'outer',
            kind: 'alternate',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'outer-a',
                pathIndex: 0,
                stepIds: ['step-01', 'step-02'],
              },
            ],
          },
          {
            branchId: 'inner',
            kind: 'parallel',
            decisionStepId: 'step-02',
            paths: [
              {
                pathId: 'inner-p1',
                pathIndex: 0,
                stepIds: ['step-02.1'],
              },
            ],
          },
        ],
      }

      // Only direct stepIds of each path are relevant.
      const state = baseState({
        completedSteps: new Set(['step-01', 'step-02', 'step-02.1']),
      })

      const completed = computeCompletedPaths(input, state)
      const keys = Array.from(completed).sort()

      expect(keys).toEqual(['inner:inner-p1', 'outer:outer-a'])
    })

    it('treats empty path stepIds as not complete', () => {
      const input: WalkthroughContextInput = {
        viewId: 'v6',
        stepIds: [],
        branchCollections: [
          {
            branchId: 'b1',
            kind: 'parallel',
            decisionStepId: 'step-01',
            paths: [
              {
                pathId: 'p-empty',
                pathIndex: 0,
                stepIds: [],
              },
            ],
          },
        ],
      }

      const state = baseState({ completedSteps: new Set() })
      const completed = computeCompletedPaths(input, state)

      expect(completed.size).toBe(0)
    })
  })

  describe('resetCompletion', () => {
    it('is a no-op when nothing completed', () => {
      const state = baseState()
      const next = resetCompletion(state)
      expect(next).toBe(state)
    })

    it('clears completed steps and paths', () => {
      const state = baseState({
        completedSteps: new Set(['s1', 's2']),
        completedPaths: new Set(['b1:p1']),
      })

      const next = resetCompletion(state)
      expect(next.completedSteps.size).toBe(0)
      expect(next.completedPaths.size).toBe(0)
    })
  })
})
