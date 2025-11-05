import { describe, expect, it } from 'vitest'
import { StepIdGenerator } from '../StepIdGenerator'
import type { BranchStackEntry } from '../types'

describe('StepIdGenerator', () => {
  const generator = new StepIdGenerator()

  describe('buildStepId', () => {
    it('should generate root-level step ID', () => {
      const id = generator.buildStepId(1)
      expect(id).toBe('step-01')
    })

    it('should pad single-digit root indices with zero', () => {
      expect(generator.buildStepId(1)).toBe('step-01')
      expect(generator.buildStepId(5)).toBe('step-05')
      expect(generator.buildStepId(9)).toBe('step-09')
    })

    it('should handle double-digit root indices', () => {
      expect(generator.buildStepId(10)).toBe('step-10')
      expect(generator.buildStepId(25)).toBe('step-25')
      expect(generator.buildStepId(99)).toBe('step-99')
    })

    it('should handle triple-digit root indices', () => {
      expect(generator.buildStepId(100)).toBe('step-100')
      expect(generator.buildStepId(999)).toBe('step-999')
    })

    it('should generate hierarchical ID for single-level branch', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: { branchId: '/parallel@0', kind: 'parallel' } as any,
          path: { pathId: '/parallel@0/path@0' } as any,
          pathIndex: 1,
          stepCounter: 0,
        },
      ]

      const id = generator.buildStepId(1, branchStack)
      // Format: step-{root}.{pathIndex}.{stepCounter+1}
      expect(id).toBe('step-01.01.01')
    })

    it('should increment step counter in branch', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: { branchId: '/parallel@0', kind: 'parallel' } as any,
          path: { pathId: '/parallel@0/path@0' } as any,
          pathIndex: 1,
          stepCounter: 2, // Third step (0-indexed)
        },
      ]

      const id = generator.buildStepId(1, branchStack)
      expect(id).toBe('step-01.01.03') // stepCounter+1 = 3
    })

    it('should generate hierarchical ID for nested branches (2 levels)', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: { branchId: '/alternate@0', kind: 'alternate' } as any,
          path: { pathId: '/alternate@0/path@0' } as any,
          pathIndex: 1,
          stepCounter: 0,
        },
        {
          branch: { branchId: '/parallel@0', kind: 'parallel' } as any,
          path: { pathId: '/parallel@0/path@1' } as any,
          pathIndex: 2,
          stepCounter: 0,
        },
      ]

      const id = generator.buildStepId(5, branchStack)
      // Format: step-{root}.{path1}.{path2}.{stepCounter+1}
      expect(id).toBe('step-05.01.02.01')
    })

    it('should generate hierarchical ID for deeply nested branches (4 levels)', () => {
      const branchStack: BranchStackEntry<any>[] = [
        { branch: {} as any, path: {} as any, pathIndex: 1, stepCounter: 0 },
        { branch: {} as any, path: {} as any, pathIndex: 2, stepCounter: 0 },
        { branch: {} as any, path: {} as any, pathIndex: 3, stepCounter: 0 },
        { branch: {} as any, path: {} as any, pathIndex: 1, stepCounter: 0 },
      ]

      const id = generator.buildStepId(1, branchStack)
      expect(id).toBe('step-01.01.02.03.01.01')
    })

    it('should handle empty branch stack', () => {
      const id = generator.buildStepId(3, [])
      expect(id).toBe('step-03')
    })

    it('should handle undefined branch stack', () => {
      const id = generator.buildStepId(3, undefined)
      expect(id).toBe('step-03')
    })

    it('should handle multiple paths with different step counters', () => {
      const branchStack1: BranchStackEntry<any>[] = [
        {
          branch: {} as any,
          path: {} as any,
          pathIndex: 1,
          stepCounter: 0,
        },
      ]

      const branchStack2: BranchStackEntry<any>[] = [
        {
          branch: {} as any,
          path: {} as any,
          pathIndex: 2,
          stepCounter: 3,
        },
      ]

      expect(generator.buildStepId(1, branchStack1)).toBe('step-01.01.01')
      expect(generator.buildStepId(1, branchStack2)).toBe('step-01.02.04')
    })
  })

  describe('buildLegacyParallelStepId', () => {
    it('should generate legacy parallel step ID', () => {
      const id = generator.buildLegacyParallelStepId(1, 1)
      expect(id).toBe('step-01.1')
    })

    it('should not pad nested index in legacy format', () => {
      expect(generator.buildLegacyParallelStepId(1, 1)).toBe('step-01.1')
      expect(generator.buildLegacyParallelStepId(1, 5)).toBe('step-01.5')
      expect(generator.buildLegacyParallelStepId(1, 10)).toBe('step-01.10')
    })

    it('should handle various root and nested indices', () => {
      expect(generator.buildLegacyParallelStepId(1, 1)).toBe('step-01.1')
      expect(generator.buildLegacyParallelStepId(2, 3)).toBe('step-02.3')
      expect(generator.buildLegacyParallelStepId(10, 5)).toBe('step-10.5')
      expect(generator.buildLegacyParallelStepId(99, 99)).toBe('step-99.99')
    })

    it('should pad root index but not nested index', () => {
      const id = generator.buildLegacyParallelStepId(5, 15)
      expect(id).toBe('step-05.15')
    })
  })

  describe('edge cases', () => {
    it('should handle step counter at maximum value', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: {} as any,
          path: {} as any,
          pathIndex: 1,
          stepCounter: 999,
        },
      ]

      const id = generator.buildStepId(1, branchStack)
      expect(id).toBe('step-01.01.1000')
    })

    it('should handle large path indices', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: {} as any,
          path: {} as any,
          pathIndex: 100,
          stepCounter: 0,
        },
      ]

      const id = generator.buildStepId(1, branchStack)
      expect(id).toBe('step-01.100.01')
    })

    it('should maintain consistency across multiple calls', () => {
      const branchStack: BranchStackEntry<any>[] = [
        {
          branch: {} as any,
          path: {} as any,
          pathIndex: 1,
          stepCounter: 0,
        },
      ]

      const id1 = generator.buildStepId(1, branchStack)
      const id2 = generator.buildStepId(1, branchStack)

      expect(id1).toBe(id2)
      expect(id1).toBe('step-01.01.01')
    })
  })
})
