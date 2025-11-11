import { describe, expect, it } from 'vitest'
import type {
  StepEdgeId,
} from '../scalar'
import type {
  ComputedBranchCollection,
} from '../view-computed'
import {
  type DynamicStep,
  type DynamicStepsAlternate,
  type DynamicStepsParallel,
  type DynamicStepsSeries,
  getAlternateStepsPrefix,
  getParallelStepsPrefix,
  isDynamicStepsAlternate,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
} from '../view-parsed.dynamic'

const step = (id: string): DynamicStep => ({
  // DynamicStep is a parsed-view contract; use minimal-but-complete shape for tests
  source: 'a' as any,
  target: 'b' as any,
  title: id,
  // required by DynamicStep
  astPath: `/${id}`,
})

const nonEmpty = <T>(items: T[]): readonly [T, ...T[]] => {
  if (items.length === 0) {
    throw new Error('nonEmpty requires at least one element')
  }
  return [items[0]!, ...items.slice(1)]
}

const series = (seriesId: string, ids: string[]): DynamicStepsSeries => ({
  seriesId,
  __series: nonEmpty(ids.map(step)),
})

const parallel = (
  parallelId: string,
  branches: (DynamicStep | DynamicStepsSeries)[],
): DynamicStepsParallel => ({
  parallelId,
  __parallel: nonEmpty(branches),
})

const alternate = (
  alternateId: string,
  branches: (DynamicStep | DynamicStepsSeries)[],
): DynamicStepsAlternate => ({
  alternateId,
  __alternate: nonEmpty(branches),
})

describe('Dynamic branching model contracts', () => {
  describe('type guards', () => {
    it('detects series steps', () => {
      const s = series('s-1', ['s1', 's2'])
      expect(isDynamicStepsSeries(s)).toBe(true)
      expect(isDynamicStepsParallel(s)).toBe(false)
      expect(isDynamicStepsAlternate(s)).toBe(false)
    })

    it('detects parallel steps', () => {
      const p = parallel('p-1', [step('p1'), series('p-2', ['p2a', 'p2b'])])
      expect(isDynamicStepsParallel(p)).toBe(true)
      expect(isDynamicStepsSeries(p)).toBe(false)
      expect(isDynamicStepsAlternate(p)).toBe(false)
    })

    it('detects alternate steps', () => {
      const a = alternate('a-1', [step('a1'), series('a-2', ['a2a', 'a2b'])])
      expect(isDynamicStepsAlternate(a)).toBe(true)
      expect(isDynamicStepsSeries(a)).toBe(false)
      expect(isDynamicStepsParallel(a)).toBe(false)
    })
  })

  describe('prefix helpers', () => {
    it('extracts parallel prefix', () => {
      expect(getParallelStepsPrefix('step-01.1')).toBe('step-01.')
      expect(getParallelStepsPrefix('step-01.2')).toBe('step-01.')
      expect(getParallelStepsPrefix('step-10.3')).toBe('step-10.')
    })

    it('returns null for non-parallel ids', () => {
      expect(getParallelStepsPrefix('step-01')).toBeNull()
      expect(getParallelStepsPrefix('step-01:1')).toBeNull()
      expect(getParallelStepsPrefix('anything-else')).toBeNull()
    })

    it('extracts alternate prefix', () => {
      expect(getAlternateStepsPrefix('step-01:1')).toBe('step-01:')
      expect(getAlternateStepsPrefix('step-01:2')).toBe('step-01:')
      expect(getAlternateStepsPrefix('step-10:3')).toBe('step-10:')
    })

    it('returns null for non-alternate ids', () => {
      expect(getAlternateStepsPrefix('step-01')).toBeNull()
      expect(getAlternateStepsPrefix('step-01.1')).toBeNull()
      expect(getAlternateStepsPrefix('anything-else')).toBeNull()
    })
  })

  describe('ComputedBranchCollection contract', () => {
    it('is structurally compatible with the public contract', () => {
      // This is a pure type-level assertion using a value that must satisfy
      // the exported ComputedBranchCollection shape. If the contract changes,
      // this test will fail to type-check.
      const collection: ComputedBranchCollection = {
        branchId: 'branch-1',
        kind: 'alternate',
        decisionStepId: 'step-01' as StepEdgeId,
        paths: [
          {
            pathId: 'path-a',
            pathIndex: 0,
            isDefaultPath: true,
            pathName: 'a',
            pathTitle: 'Path A',
            stepIds: ['step-01', 'step-02'] as unknown as StepEdgeId[],
          },
          {
            pathId: 'path-b',
            pathIndex: 1,
            stepIds: ['step-01:1'] as unknown as StepEdgeId[],
          },
        ],
      }

      expect(collection.branchId).toBe('branch-1')
      expect(collection.kind).toBe('alternate')
      expect(collection.paths).toHaveLength(2)
      expect(collection.paths[0]?.pathIndex).toBe(0)
      expect(collection.paths[0]?.isDefaultPath).toBe(true)
    })

    it('requires StepEdgeId-compatible decision and path stepIds', () => {
      const stepId = 'step-10.2' as StepEdgeId
      const collection: ComputedBranchCollection = {
        branchId: 'branch-parallel-1',
        kind: 'parallel',
        decisionStepId: stepId,
        paths: [
          {
            pathId: 'p1',
            pathIndex: 0,
            stepIds: [stepId],
          },
        ],
      }

      expect(collection.decisionStepId).toBe(stepId)
      expect(collection.paths[0]?.stepIds[0]).toBe(stepId)
    })
  })
})
