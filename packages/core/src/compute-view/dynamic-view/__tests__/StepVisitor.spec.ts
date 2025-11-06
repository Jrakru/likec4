import { describe, expect, it } from 'vitest'
import type { DynamicBranchCollection, DynamicStep, DynamicViewStep } from '../../../types'
import { flattenSteps, StepFlattener } from '../StepVisitor'

// Helper to create mock steps
function mockStep(id: string): DynamicStep<any> {
  return {
    source: `source-${id}`,
    target: `target-${id}`,
    astPath: `/step-${id}`,
  } as DynamicStep<any>
}

// Helper to create mock legacy parallel
function mockLegacyParallel(parallel: any[]): any {
  return {
    branchId: '/parallel@legacy',
    astPath: '/parallel',
    kind: 'parallel',
    paths: [],
    __parallel: parallel,
  }
}

describe('StepVisitor', () => {
  describe('StepFlattener', () => {
    describe('visitStep', () => {
      it('should return array with single step', () => {
        const visitor = new StepFlattener()
        const step = mockStep('1')

        const result = visitor.visit(step as DynamicViewStep<any>)

        expect(result).toHaveLength(1)
        expect(result[0]).toBe(step)
      })

      it('should handle multiple individual steps', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')

        const result1 = visitor.visit(step1 as DynamicViewStep<any>)
        const result2 = visitor.visit(step2 as DynamicViewStep<any>)
        const result3 = visitor.visit(step3 as DynamicViewStep<any>)

        expect(result1).toEqual([step1])
        expect(result2).toEqual([step2])
        expect(result3).toEqual([step3])
      })
    })

    describe('visitSeries', () => {
      it('should flatten series into individual steps', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')

        const series = {
          __series: [step1, step2, step3],
        }

        const result = visitor.visit(series as DynamicViewStep<any>)

        expect(result).toHaveLength(3)
        expect(result).toEqual([step1, step2, step3])
      })

      it('should handle empty series', () => {
        const visitor = new StepFlattener()
        const series = {
          __series: [],
        }

        const result = visitor.visit(series as DynamicViewStep<any>)

        expect(result).toEqual([])
      })

      it('should handle single-step series', () => {
        const visitor = new StepFlattener()
        const step = mockStep('1')
        const series = {
          __series: [step],
        }

        const result = visitor.visit(series as DynamicViewStep<any>)

        expect(result).toEqual([step])
      })
    })

    describe('visitBranch', () => {
      it('should flatten parallel branch with single path', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step1, step2],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(2)
        expect(result).toEqual([step1, step2])
      })

      it('should flatten parallel branch with multiple paths', () => {
        const visitor = new StepFlattener()
        const stepA1 = mockStep('A1')
        const stepA2 = mockStep('A2')
        const stepB1 = mockStep('B1')
        const stepB2 = mockStep('B2')

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [stepA1, stepA2],
            },
            {
              pathId: '/parallel@0/path@1',
              astPath: '',
              steps: [stepB1, stepB2],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(4)
        expect(result).toEqual([stepA1, stepA2, stepB1, stepB2])
      })

      it('should flatten alternate branch', () => {
        const visitor = new StepFlattener()
        const stepSuccess = mockStep('success')
        const stepFailure = mockStep('failure')

        const branch: DynamicBranchCollection<any> = {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [
            {
              pathId: '/alternate@0/path@0',
              astPath: '',
              steps: [stepSuccess],
            },
            {
              pathId: '/alternate@0/path@1',
              astPath: '',
              steps: [stepFailure],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(2)
        expect(result).toEqual([stepSuccess, stepFailure])
      })

      it('should handle empty branch paths', () => {
        const visitor = new StepFlattener()
        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toEqual([])
      })

      it('should handle branch with empty path steps', () => {
        const visitor = new StepFlattener()
        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toEqual([])
      })

      it('should flatten nested branches', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')

        const nestedBranch: DynamicBranchCollection<any> = {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [
            {
              pathId: '/alternate@0/path@0',
              astPath: '',
              steps: [step2],
            },
          ],
        }

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step1, nestedBranch as any, step3],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(3)
        expect(result).toEqual([step1, step2, step3])
      })

      it('should flatten branch with series in paths', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')

        const series = {
          __series: [step2, step3],
        }

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step1, series as any],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(3)
        expect(result).toEqual([step1, step2, step3])
      })
    })

    describe('visitLegacyParallel', () => {
      it('should flatten legacy parallel with single steps', () => {
        const visitor = new StepFlattener()
        const stepA = mockStep('A')
        const stepB = mockStep('B')

        const parallel = mockLegacyParallel([stepA, stepB])

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        expect(result).toHaveLength(2)
        expect(result).toEqual([stepA, stepB])
      })

      it('should flatten legacy parallel with series (heads before tails)', () => {
        const visitor = new StepFlattener()
        const stepA1 = mockStep('A1')
        const stepA2 = mockStep('A2')
        const stepA3 = mockStep('A3')
        const stepB1 = mockStep('B1')
        const stepB2 = mockStep('B2')

        const parallel = mockLegacyParallel([
          { __series: [stepA1, stepA2, stepA3] },
          { __series: [stepB1, stepB2] },
        ])

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        // Heads first: A1, B1
        // Then tails: A2, A3, B2
        expect(result).toHaveLength(5)
        expect(result).toEqual([stepA1, stepB1, stepA2, stepA3, stepB2])
      })

      it('should flatten legacy parallel with mixed single steps and series', () => {
        const visitor = new StepFlattener()
        const stepA = mockStep('A')
        const stepB1 = mockStep('B1')
        const stepB2 = mockStep('B2')
        const stepC = mockStep('C')

        const parallel = mockLegacyParallel([
          stepA,
          { __series: [stepB1, stepB2] },
          stepC,
        ])

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        // Heads: A, B1, C
        // Tails: B2
        expect(result).toHaveLength(4)
        expect(result).toEqual([stepA, stepB1, stepC, stepB2])
      })

      it('should handle empty legacy parallel', () => {
        const visitor = new StepFlattener()
        const parallel = mockLegacyParallel([])

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        // Empty legacy parallel returns empty (toLegacyParallel returns null)
        expect(result).toEqual([])
      })

      it('should handle legacy parallel with undefined __parallel', () => {
        const visitor = new StepFlattener()
        // Object without __parallel property won't match type guard
        const parallel = {
          branchId: '/test',
          astPath: '/test',
          kind: 'parallel',
          paths: [],
        }

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        // Should return empty because it's a branch collection with no paths
        expect(result).toEqual([])
      })

      it('should handle legacy parallel with single-step series', () => {
        const visitor = new StepFlattener()
        const stepA = mockStep('A')
        const stepB = mockStep('B')

        const parallel = mockLegacyParallel([
          { __series: [stepA] },
          { __series: [stepB] },
        ])

        const result = visitor.visit(parallel as DynamicViewStep<any>)

        expect(result).toHaveLength(2)
        expect(result).toEqual([stepA, stepB])
      })
    })

    describe('visit (main dispatch)', () => {
      it('should prioritize legacy parallel over branch collection', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')

        // Create a step that could be interpreted as both
        const ambiguousStep = {
          branchId: '/parallel@0',
          astPath: '/parallel',
          __parallel: [step1],
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step2],
            },
          ],
        }

        const result = visitor.visit(ambiguousStep as any)

        // Should use legacy parallel logic
        expect(result).toEqual([step1])
      })

      it('should handle unknown step types gracefully', () => {
        const visitor = new StepFlattener()
        const unknownStep = {
          someUnknownProperty: 'value',
        }

        const result = visitor.visit(unknownStep as any)

        // Unknown steps that don't match any type guard are treated as-is
        // (The type guard isDynamicStep might match simple objects)
        expect(Array.isArray(result)).toBe(true)
      })

      it('should handle null/undefined gracefully', () => {
        const visitor = new StepFlattener()

        const resultNull = visitor.visit(null as any)
        const resultUndefined = visitor.visit(undefined as any)

        expect(resultNull).toEqual([])
        expect(resultUndefined).toEqual([])
      })
    })

    describe('complex scenarios', () => {
      it('should flatten deeply nested mixed structures', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')
        const step4 = mockStep('4')
        const step5 = mockStep('5')

        // Parallel with:
        //   - Path 1: step1, series(step2, step3)
        //   - Path 2: alternate with step4 and step5
        const nestedBranch: DynamicBranchCollection<any> = {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [
            {
              pathId: '/alternate@0/path@0',
              astPath: '',
              steps: [step4],
            },
            {
              pathId: '/alternate@0/path@1',
              astPath: '',
              steps: [step5],
            },
          ],
        }

        const series = {
          __series: [step2, step3],
        }

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step1, series as any],
            },
            {
              pathId: '/parallel@0/path@1',
              astPath: '',
              steps: [nestedBranch as any],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(5)
        expect(result).toEqual([step1, step2, step3, step4, step5])
      })

      it('should flatten multiple branch collections', () => {
        const visitor = new StepFlattener()
        const step1 = mockStep('1')
        const step2 = mockStep('2')
        const step3 = mockStep('3')
        const step4 = mockStep('4')

        const branch1: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [step1, step2],
            },
          ],
        }

        const branch2: DynamicBranchCollection<any> = {
          branchId: '/alternate@0',
          astPath: '',
          kind: 'alternate',
          paths: [
            {
              pathId: '/alternate@0/path@0',
              astPath: '',
              steps: [step3, step4],
            },
          ],
        }

        const result1 = visitor.visit(branch1 as DynamicViewStep<any>)
        const result2 = visitor.visit(branch2 as DynamicViewStep<any>)

        expect(result1).toEqual([step1, step2])
        expect(result2).toEqual([step3, step4])
      })

      it('should handle legacy parallel nested in branch collection', () => {
        const visitor = new StepFlattener()
        const stepA = mockStep('A')
        const stepB = mockStep('B')
        const stepC = mockStep('C')

        const legacyParallel = mockLegacyParallel([stepB, stepC])

        const branch: DynamicBranchCollection<any> = {
          branchId: '/parallel@0',
          astPath: '',
          kind: 'parallel',
          paths: [
            {
              pathId: '/parallel@0/path@0',
              astPath: '',
              steps: [stepA, legacyParallel as any],
            },
          ],
        }

        const result = visitor.visit(branch as DynamicViewStep<any>)

        expect(result).toHaveLength(3)
        expect(result).toEqual([stepA, stepB, stepC])
      })
    })
  })

  describe('flattenSteps', () => {
    it('should flatten single step', () => {
      const step = mockStep('1')
      const result = flattenSteps(step as DynamicViewStep<any>)

      expect(result).toEqual([step])
    })

    it('should flatten series', () => {
      const step1 = mockStep('1')
      const step2 = mockStep('2')
      const series = {
        __series: [step1, step2],
      }

      const result = flattenSteps(series as DynamicViewStep<any>)

      expect(result).toEqual([step1, step2])
    })

    it('should flatten branch collection', () => {
      const step1 = mockStep('1')
      const step2 = mockStep('2')
      const branch: DynamicBranchCollection<any> = {
        branchId: '/parallel@0',
        astPath: '',
        kind: 'parallel',
        paths: [
          {
            pathId: '/parallel@0/path@0',
            astPath: '',
            steps: [step1, step2],
          },
        ],
      }

      const result = flattenSteps(branch as DynamicViewStep<any>)

      expect(result).toEqual([step1, step2])
    })

    it('should flatten legacy parallel', () => {
      const stepA = mockStep('A')
      const stepB1 = mockStep('B1')
      const stepB2 = mockStep('B2')
      const parallel = mockLegacyParallel([
        stepA,
        { __series: [stepB1, stepB2] },
      ])

      const result = flattenSteps(parallel as DynamicViewStep<any>)

      // Heads: A, B1
      // Tails: B2
      expect(result).toEqual([stepA, stepB1, stepB2])
    })

    it('should create new visitor instance for each call', () => {
      const step1 = mockStep('1')
      const step2 = mockStep('2')

      const result1 = flattenSteps(step1 as DynamicViewStep<any>)
      const result2 = flattenSteps(step2 as DynamicViewStep<any>)

      expect(result1).toEqual([step1])
      expect(result2).toEqual([step2])
      expect(result1).not.toBe(result2)
    })
  })
})
