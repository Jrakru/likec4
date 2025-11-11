import type { BBox } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import type {
  SequenceBranchArea,
  SequenceBranchPath,
  SequenceViewLayout,
  Step,
} from '../_types'
import { SequenceViewLayouter } from '../layouter'

/**
 * Minimal local replica of the branch collection contract used by the layouter.
 * This is intentionally decoupled from core types to avoid cross-package coupling.
 */
type ComputedBranchCollection = {
  branchId: string
  kind: 'alternate' | 'parallel'
  decisionStepId: string
  paths: ReadonlyArray<{
    pathId: string
    index: number
    isDefault: boolean
    stepIds: ReadonlyArray<string>
  }>
}

/**
 * Helper to build a synthetic layouter-compatible step.
 */
function step(
  id: string,
  fromCol: number,
  toCol: number,
  row: number,
  labelWidth = 80,
): Step {
  const mkNode = (nid: string) => ({
    id: nid,
    title: nid,
    width: 80,
    height: 32,
    children: [],
    style: {},
    tags: [],
  } as any)

  const source = mkNode(`a${fromCol}`)
  const target = mkNode(`a${toCol}`)

  return {
    id: id as any,
    from: { column: fromCol, row },
    to: { column: toCol, row },
    source,
    target,
    label: {
      width: labelWidth,
      height: 16,
      text: id,
    },
    isSelfLoop: false,
    isBack: fromCol > toCol,
    parallelPrefix: null,
    alternatePrefix: null,
    offset: 0,
    edge: {
      id,
      source: source.id,
      target: target.id,
    } as any,
  }
}

function layoutWithBranches(
  steps: Step[],
  branches?: ReadonlyArray<ComputedBranchCollection>,
): {
  layout: SequenceViewLayout & {
    branchAreas: SequenceBranchArea[]
    branchPaths: SequenceBranchPath[]
  }
} {
  const actorIds = new Set<string>()
  for (const s of steps) {
    actorIds.add(s.source.id)
    actorIds.add(s.target.id)
  }
  const actors = Array.from(actorIds).map(
    id =>
      ({
        id,
        title: id,
        width: 80,
        height: 32,
        children: [],
        style: {},
        tags: [],
      }) as any,
  )

  const layouter = new SequenceViewLayouter({
    actors: actors as any,
    steps,
    compounds: [],
    branchCollections: branches,
  } as any)

  const bounds = layouter.getViewBounds() as BBox

  const layout: SequenceViewLayout & {
    branchAreas: SequenceBranchArea[]
    branchPaths: SequenceBranchPath[]
  } = {
    id: 'v' as any,
    actors: actors.map(actor => ({
      id: actor.id,
      ...layouter.getActorBox(actor),
      ports: [],
    })),
    compounds: [],
    parallelAreas: layouter.getParallelBoxes().map(box => ({
      parallelPrefix: (box as any).parallelPrefix,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    })),
    alternateAreas: layouter.getAlternateBoxes().map(box => ({
      alternatePrefix: (box as any).alternatePrefix,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    })),
    branchAreas: layouter.getBranchAreas(),
    branchPaths: layouter.getBranchPaths(),
    bounds,
  }

  return { layout }
}

describe('Sequence branch overlays - linear only', () => {
  it('produces empty branchAreas and branchPaths when no metadata', () => {
    const s1 = step('s1', 0, 1, 0)
    const { layout } = layoutWithBranches([s1])

    expect(layout.branchAreas).toEqual([])
    expect(layout.branchPaths).toEqual([])
  })
})

describe('Sequence branch overlays - single parallel branch', () => {
  it('computes branch area enclosing all branch steps and paths with correct indices', () => {
    const s1 = step('b1-p0-s1', 0, 1, 0)
    const s2 = step('b1-p1-s1', 1, 2, 1)

    const branches: ComputedBranchCollection[] = [
      {
        branchId: 'b1',
        kind: 'parallel',
        decisionStepId: 'b1-p0-s1',
        paths: [
          {
            pathId: 'p0',
            index: 0,
            isDefault: true,
            stepIds: ['b1-p0-s1'],
          },
          {
            pathId: 'p1',
            index: 1,
            isDefault: false,
            stepIds: ['b1-p1-s1'],
          },
        ],
      },
    ]

    const { layout } = layoutWithBranches([s1, s2], branches)

    expect(layout.branchAreas).toHaveLength(1)
    const area = layout.branchAreas[0]!
    expect(area.branchId).toBe('b1')
    expect(area.kind).toBe('parallel')
    expect(area.width).toBeGreaterThan(0)
    expect(area.height).toBeGreaterThan(0)

    expect(layout.branchPaths).toHaveLength(2)
    const [p0, p1] = layout.branchPaths
    expect(p0!, 'p0').toBeDefined()
    expect(p1!, 'p1').toBeDefined()

    expect(p0!.branchId).toBe('b1')
    expect(p0!.pathId).toBe('p0')
    expect(p0!.index).toBe(0)
    expect(p0!.isDefault).toBe(true)
    expect(p0!.width).toBeGreaterThan(0)
    expect(p0!.height).toBeGreaterThan(0)

    expect(p1!.branchId).toBe('b1')
    expect(p1!.pathId).toBe('p1')
    expect(p1!.index).toBe(1)
    expect(p1!.isDefault).toBe(false)

    // deterministic order by index
    expect(p0!.x).toBeLessThanOrEqual(p1!.x)
  })
})

describe('Sequence branch overlays - single alternate branch', () => {
  it('computes alternate branch overlays with isDefault propagated', () => {
    const s1 = step('b2-a0-s1', 0, 1, 0)
    const s2 = step('b2-a1-s1', 0, 2, 1)

    const branches: ComputedBranchCollection[] = [
      {
        branchId: 'b2',
        kind: 'alternate',
        decisionStepId: 'b2-a0-s1',
        paths: [
          {
            pathId: 'a0',
            index: 0,
            isDefault: true,
            stepIds: ['b2-a0-s1'],
          },
          {
            pathId: 'a1',
            index: 1,
            isDefault: false,
            stepIds: ['b2-a1-s1'],
          },
        ],
      },
    ]

    const { layout } = layoutWithBranches([s1, s2], branches)

    expect(layout.branchAreas).toHaveLength(1)
    const area = layout.branchAreas[0]!
    expect(area.branchId).toBe('b2')
    expect(area.kind).toBe('alternate')

    expect(layout.branchPaths).toHaveLength(2)
    const [a0, a1] = layout.branchPaths
    expect(a0!, 'a0').toBeDefined()
    expect(a1!, 'a1').toBeDefined()

    expect(a0!.branchId).toBe('b2')
    expect(a0!.pathId).toBe('a0')
    expect(a0!.index).toBe(0)
    expect(a0!.isDefault).toBe(true)

    expect(a1!.branchId).toBe('b2')
    expect(a1!.pathId).toBe('a1')
    expect(a1!.index).toBe(1)
    expect(a1!.isDefault).toBe(false)
  })
})

describe('Sequence branch overlays - nested branches', () => {
  it('ensures deterministic sort order and non-degenerate areas for nested branches', () => {
    const rootStep = step('root-s1', 0, 1, 0)
    const nestedP0 = step('nested-p0-s1', 0, 1, 1)
    const nestedP1 = step('nested-p1-s1', 1, 2, 2)

    const branches: ComputedBranchCollection[] = [
      {
        branchId: 'root',
        kind: 'parallel',
        decisionStepId: 'root-s1',
        paths: [
          {
            pathId: 'root-p0',
            index: 0,
            isDefault: true,
            stepIds: ['root-s1', 'nested-p0-s1'],
          },
          {
            pathId: 'root-p1',
            index: 1,
            isDefault: false,
            stepIds: ['nested-p1-s1'],
          },
        ],
      },
      {
        branchId: 'nested',
        kind: 'alternate',
        decisionStepId: 'nested-p0-s1',
        paths: [
          {
            pathId: 'nested-a0',
            index: 0,
            isDefault: true,
            stepIds: ['nested-p0-s1'],
          },
          {
            pathId: 'nested-a1',
            index: 1,
            isDefault: false,
            stepIds: ['nested-p1-s1'],
          },
        ],
      },
    ]

    const { layout } = layoutWithBranches(
      [rootStep, nestedP0, nestedP1],
      branches,
    )

    expect(layout.branchAreas).toHaveLength(2)
    const [rootArea, nestedArea] = layout.branchAreas
    expect(rootArea!, 'rootArea').toBeDefined()
    expect(nestedArea!, 'nestedArea').toBeDefined()

    expect(rootArea!.branchId).toBe('root')
    expect(nestedArea!.branchId).toBe('nested')

    expect(rootArea!.y).toBeLessThanOrEqual(nestedArea!.y)
    expect(rootArea!.height).toBeGreaterThan(0)
    expect(nestedArea!.height).toBeGreaterThan(0)

    // Deterministic ordering:
    // - Primary sort by branch decision order (root before nested)
    // - Secondary sort by path index within each branch
    expect(layout.branchPaths.map(p => `${p.branchId}:${p.index}`)).toEqual([
      'root:0',
      'root:1',
      'nested:0',
      'nested:1',
    ])
  })
})
