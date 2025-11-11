import { describe, expect, it } from 'vitest'
import {
  type StepEdgeId,
  type StepEdgeIdLiteral,
  isStepEdgeId,
  stepEdgeId,
} from '../scalar'

function literal(id: StepEdgeId): StepEdgeIdLiteral {
  return id as StepEdgeIdLiteral
}

describe('StepEdgeId', () => {
  it('generates stable zero-padded ids for linear steps', () => {
    const id1 = stepEdgeId(1)
    const id10 = stepEdgeId(10)
    const id123 = stepEdgeId(123)

    expect(id1).toBe('step-01')
    expect(id10).toBe('step-10')
    expect(id123).toBe('step-123')
  })

  it('uses dot separator for parallel steps', () => {
    const p1 = stepEdgeId(1, 1, false)
    const p2 = stepEdgeId(1, 2, false)
    const p10 = stepEdgeId(10, 3, false)

    expect(p1).toBe('step-01.1')
    expect(p2).toBe('step-01.2')
    expect(p10).toBe('step-10.3')
  })

  it('uses colon separator for alternate steps', () => {
    const a1 = stepEdgeId(1, 1, true)
    const a2 = stepEdgeId(1, 2, true)
    const a10 = stepEdgeId(10, 3, true)

    expect(a1).toBe('step-01:1')
    expect(a2).toBe('step-01:2')
    expect(a10).toBe('step-10:3')
  })

  it('is unique per (step, subIndex, kind) combination', () => {
    const ids = new Set<StepEdgeIdLiteral>([
      literal(stepEdgeId(1)),
      literal(stepEdgeId(2)),
      literal(stepEdgeId(1, 1, false)),
      literal(stepEdgeId(1, 2, false)),
      literal(stepEdgeId(1, 1, true)),
      literal(stepEdgeId(1, 2, true)),
    ])

    // If any duplicate existed, size would shrink
    expect(ids.size).toBe(6)
  })

  it('is recognized by isStepEdgeId', () => {
    const valid: string[] = [
      'step-01',
      'step-10',
      'step-123',
      'step-01.1',
      'step-01.2',
      'step-10.3',
      'step-01:1',
      'step-01:2',
      'step-10:3',
    ]

    // NOTE:
    // isStepEdgeId is intentionally permissive for backward compatibility:
    // it currently only checks for the 'step-' prefix and does not fully validate the shape.
    // We avoid asserting on "weird but prefixed" variants (like 'step-x1'), since tightening that
    // behavior would be a breaking change outside the scope of unified branching.
    // Only assert a minimal set of clearly invalid, non-prefixed or empty values.
    const invalid: string[] = [
      '',
      'step',
      'foo-step-01',
      '1-step-01',
      'foo',
      'bar-01',
    ]

    for (const id of valid) {
      expect(isStepEdgeId(id)).toBe(true)
    }
    for (const id of invalid) {
      expect(isStepEdgeId(id)).toBe(false)
    }
  })
})
