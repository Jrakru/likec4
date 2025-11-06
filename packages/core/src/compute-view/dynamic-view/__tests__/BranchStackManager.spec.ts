import { describe, expect, it } from 'vitest'
import { BranchStackManager } from '../BranchStackManager'
import type { BranchStackEntry } from '../types'

describe('BranchStackManager', () => {
  describe('stack operations', () => {
    it('should start with empty stack', () => {
      const manager = new BranchStackManager()
      expect(manager.getStack()).toEqual([])
      expect(manager.getDepth()).toBe(0)
    })

    it('should push entry onto stack', () => {
      const manager = new BranchStackManager()
      const entry: BranchStackEntry<any> = {
        branch: {
          branchId: '/parallel@0',
          astPath: '/steps@0',
          kind: 'parallel',
          paths: [],
        },
        path: {
          pathId: '/parallel@0/path@0',
          astPath: '/steps@0/paths@0',
          steps: [],
        },
        pathIndex: 1,
        stepCounter: 0,
      }

      manager.push(entry)

      expect(manager.getStack()).toHaveLength(1)
      expect(manager.getStack()[0]).toBe(entry)
      expect(manager.getDepth()).toBe(1)
    })

    it('should pop entry from stack', () => {
      const manager = new BranchStackManager()
      const entry: BranchStackEntry<any> = {
        branch: { branchId: '/parallel@0', astPath: '', kind: 'parallel', paths: [] },
        path: { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      }

      manager.push(entry)
      const popped = manager.pop()

      expect(popped).toBe(entry)
      expect(manager.getStack()).toHaveLength(0)
      expect(manager.getDepth()).toBe(0)
    })

    it('should return undefined when popping empty stack', () => {
      const manager = new BranchStackManager()
      const popped = manager.pop()

      expect(popped).toBeUndefined()
    })

    it('should handle multiple pushes and pops', () => {
      const manager = new BranchStackManager()
      const entry1: BranchStackEntry<any> = {
        branch: { branchId: '/parallel@0', astPath: '', kind: 'parallel', paths: [] },
        path: { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      }
      const entry2: BranchStackEntry<any> = {
        branch: { branchId: '/alternate@0', astPath: '', kind: 'alternate', paths: [] },
        path: { pathId: '/alternate@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      }

      manager.push(entry1)
      manager.push(entry2)

      expect(manager.getDepth()).toBe(2)
      expect(manager.getStack()[0]).toBe(entry1)
      expect(manager.getStack()[1]).toBe(entry2)

      manager.pop()
      expect(manager.getDepth()).toBe(1)
      expect(manager.getStack()[0]).toBe(entry1)

      manager.pop()
      expect(manager.getDepth()).toBe(0)
    })

    it('should track nested depth correctly', () => {
      const manager = new BranchStackManager()

      for (let i = 0; i < 5; i++) {
        manager.push({
          branch: { branchId: `/b${i}`, astPath: '', kind: 'parallel', paths: [] },
          path: { pathId: `/b${i}/p0`, astPath: '', steps: [] },
          pathIndex: 1,
          stepCounter: 0,
        })
        expect(manager.getDepth()).toBe(i + 1)
      }

      for (let i = 4; i >= 0; i--) {
        expect(manager.getDepth()).toBe(i + 1)
        manager.pop()
      }

      expect(manager.getDepth()).toBe(0)
    })
  })

  describe('registerStep', () => {
    it('should register step with single branch', () => {
      const manager = new BranchStackManager()
      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '/steps@0',
          kind: 'parallel',
          paths: [
            { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
          ] as any,
        },
        path: { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.registerStep('step-01.01.01' as any)

      const collections = manager.finalize()
      expect(collections).toHaveLength(1)
      expect(collections[0].paths[0].edgeIds).toContain('step-01.01.01')
    })

    it('should register step with nested branches', () => {
      const manager = new BranchStackManager()

      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [{ pathId: '/parallel@0/path@0', astPath: '', steps: [] }] as any,
        },
        path: { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.push({
        branch: {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [{ pathId: '/alternate@0/path@0', astPath: '', steps: [] }] as any,
        },
        path: { pathId: '/alternate@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.registerStep('step-01.01.01.01' as any)

      const collections = manager.finalize()
      expect(collections).toHaveLength(2)

      // Both branches should have the step registered
      expect(collections[0].paths[0].edgeIds).toContain('step-01.01.01.01')
      expect(collections[1].paths[0].edgeIds).toContain('step-01.01.01.01')
    })

    it('should accumulate multiple steps', () => {
      const manager = new BranchStackManager()

      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [{ pathId: '/parallel@0/path@0', astPath: '', steps: [] }] as any,
        },
        path: { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.registerStep('step-01.01.01' as any)
      manager.registerStep('step-01.01.02' as any)
      manager.registerStep('step-01.01.03' as any)

      const collections = manager.finalize()
      expect(collections[0].paths[0].edgeIds).toEqual([
        'step-01.01.01',
        'step-01.01.02',
        'step-01.01.03',
      ])
    })
  })

  describe('incrementStepCounters', () => {
    it('should increment step counters for all entries in stack', () => {
      const manager = new BranchStackManager()

      const entry1: BranchStackEntry<any> = {
        branch: { branchId: '/b1', astPath: '', kind: 'parallel', paths: [] },
        path: { pathId: '/b1/p0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      }

      const entry2: BranchStackEntry<any> = {
        branch: { branchId: '/b2', astPath: '', kind: 'alternate', paths: [] },
        path: { pathId: '/b2/p0', astPath: '', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      }

      manager.push(entry1)
      manager.push(entry2)

      manager.incrementStepCounters()

      expect(entry1.stepCounter).toBe(1)
      expect(entry2.stepCounter).toBe(1)

      manager.incrementStepCounters()

      expect(entry1.stepCounter).toBe(2)
      expect(entry2.stepCounter).toBe(2)
    })
  })

  describe('buildTrail', () => {
    it('should return undefined for empty stack', () => {
      const manager = new BranchStackManager()
      const trail = manager.buildTrail()

      expect(trail).toBeUndefined()
    })

    it('should build trail for single branch', () => {
      const manager = new BranchStackManager()

      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '/steps@0',
          kind: 'parallel',
          defaultPathId: '/parallel@0/path@0',
          paths: [] as any,
        },
        path: {
          pathId: '/parallel@0/path@0',
          astPath: '/steps@0/paths@0',
          pathName: 'success',
          pathTitle: 'Success Path',
          steps: [],
        },
        pathIndex: 1,
        stepCounter: 2, // Third step (0-indexed)
      })

      const trail = manager.buildTrail()

      expect(trail).toHaveLength(1)
      expect(trail![0]).toEqual({
        branchId: '/parallel@0',
        pathId: '/parallel@0/path@0',
        kind: 'parallel',
        pathIndex: 1,
        indexWithinPath: 3, // stepCounter + 1
        pathName: 'success',
        pathTitle: 'Success Path',
        isDefaultPath: true,
      })
    })

    it('should build trail for nested branches', () => {
      const manager = new BranchStackManager()

      manager.push({
        branch: {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [] as any,
        },
        path: {
          pathId: '/alternate@0/path@0',
          astPath: '',
          pathName: 'optionA',
          pathTitle: 'Option A',
          steps: [],
        },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          defaultPathId: '/parallel@0/path@1',
          paths: [] as any,
        },
        path: {
          pathId: '/parallel@0/path@1',
          astPath: '',
          pathName: 'pathB',
          pathTitle: null,
          steps: [],
        },
        pathIndex: 2,
        stepCounter: 1,
      })

      const trail = manager.buildTrail()

      expect(trail).toHaveLength(2)
      expect(trail![0]).toMatchObject({
        branchId: '/alternate@0',
        pathId: '/alternate@0/path@0',
        kind: 'alternate',
        pathIndex: 1,
        indexWithinPath: 1,
        pathName: 'optionA',
        isDefaultPath: false,
      })
      expect(trail![1]).toMatchObject({
        branchId: '/parallel@0',
        pathId: '/parallel@0/path@1',
        kind: 'parallel',
        pathIndex: 2,
        indexWithinPath: 2,
        pathName: 'pathB',
        isDefaultPath: true,
      })
    })
  })

  describe('finalize', () => {
    it('should return empty array for no branches', () => {
      const manager = new BranchStackManager()
      const collections = manager.finalize()

      expect(collections).toEqual([])
    })

    it('should finalize single branch with single path', () => {
      const manager = new BranchStackManager()

      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '/steps@0',
          kind: 'parallel',
          label: 'Test Parallel',
          defaultPathId: '/parallel@0/path@0',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '/steps@0/paths@0',
              pathName: 'success',
              pathTitle: 'Success Path',
              description: 'Successful execution',
              tags: ['tag1'],
              steps: [],
            },
          ] as any,
        },
        path: {
          pathId: '/parallel@0/path@0',
          astPath: '/steps@0/paths@0',
          pathName: 'success',
          pathTitle: 'Success Path',
          description: 'Successful execution',
          tags: ['tag1'],
          steps: [],
        },
        pathIndex: 1,
        stepCounter: 0,
      })

      manager.registerStep('step-01.01.01' as any)
      manager.pop()

      const collections = manager.finalize()

      expect(collections).toHaveLength(1)
      expect(collections[0]).toMatchObject({
        branchId: '/parallel@0',
        astPath: '/steps@0',
        kind: 'parallel',
        label: 'Test Parallel',
        defaultPathId: '/parallel@0/path@0',
      })
      expect(collections[0].paths).toHaveLength(1)
      expect(collections[0].paths[0]).toMatchObject({
        pathId: '/parallel@0/path@0',
        pathIndex: 1,
        pathName: 'success',
        pathTitle: 'Success Path',
        description: 'Successful execution',
        tags: ['tag1'],
        edgeIds: ['step-01.01.01'],
        isDefaultPath: true,
      })
    })

    it('should finalize branch with multiple paths sorted by index', () => {
      const manager = new BranchStackManager()

      const branch = {
        branchId: '/parallel@0',
        astPath: '',
        kind: 'parallel' as const,
        paths: [
          { pathId: '/parallel@0/path@0', astPath: '', steps: [] },
          { pathId: '/parallel@0/path@1', astPath: '', steps: [] },
          { pathId: '/parallel@0/path@2', astPath: '', steps: [] },
        ] as any,
      }

      // Push paths in non-sequential order
      manager.push({
        branch,
        path: { pathId: '/parallel@0/path@2', astPath: '', pathTitle: 'Path 2', steps: [] },
        pathIndex: 3,
        stepCounter: 0,
      })
      manager.registerStep('step-01.03.01' as any)
      manager.pop()

      manager.push({
        branch,
        path: { pathId: '/parallel@0/path@0', astPath: '', pathTitle: 'Path 0', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })
      manager.registerStep('step-01.01.01' as any)
      manager.pop()

      manager.push({
        branch,
        path: { pathId: '/parallel@0/path@1', astPath: '', pathTitle: 'Path 1', steps: [] },
        pathIndex: 2,
        stepCounter: 0,
      })
      manager.registerStep('step-01.02.01' as any)
      manager.pop()

      const collections = manager.finalize()

      expect(collections).toHaveLength(1)
      expect(collections[0].paths).toHaveLength(3)
      // Should be sorted by pathIndex
      expect(collections[0].paths[0].pathIndex).toBe(1)
      expect(collections[0].paths[1].pathIndex).toBe(2)
      expect(collections[0].paths[2].pathIndex).toBe(3)
      expect(collections[0].paths[0].pathTitle).toBe('Path 0')
      expect(collections[0].paths[1].pathTitle).toBe('Path 1')
      expect(collections[0].paths[2].pathTitle).toBe('Path 2')
    })

    it('should handle multiple independent branches', () => {
      const manager = new BranchStackManager()

      // First branch
      manager.push({
        branch: {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [{ pathId: '/parallel@0/path@0', astPath: '', steps: [] }] as any,
        },
        path: { pathId: '/parallel@0/path@0', astPath: '', pathTitle: 'P1', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })
      manager.pop()

      // Second branch
      manager.push({
        branch: {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [{ pathId: '/alternate@0/path@0', astPath: '', steps: [] }] as any,
        },
        path: { pathId: '/alternate@0/path@0', astPath: '', pathTitle: 'A1', steps: [] },
        pathIndex: 1,
        stepCounter: 0,
      })
      manager.pop()

      const collections = manager.finalize()

      expect(collections).toHaveLength(2)
      expect(collections.map(c => c.branchId)).toEqual(['/parallel@0', '/alternate@0'])
      expect(collections.map(c => c.kind)).toEqual(['parallel', 'alternate'])
    })
  })
})
