import { afterEach, describe, expect, it } from 'vitest'
import {
  disableDynamicBranchCollections,
  enableDynamicBranchCollections,
} from '../../../config/featureFlags'
import type {
  DynamicBranchCollection,
  DynamicBranchPath,
  DynamicViewStep,
  ParsedDynamicView,
  ViewId,
} from '../../../types'
import { _stage } from '../../../types'
import { fakeModel } from '../../element-view/__test__/fixture'
import { computeDynamicView } from '../compute'
import { $step } from './fixture'

const baseView = {
  [_stage]: 'parsed' as const,
  _type: 'dynamic' as const,
  id: 'branch-view' as ViewId,
  title: null,
  description: null,
  tags: null,
  links: null,
  rules: [],
}

function makeBranchPath(
  pathId: string,
  steps: DynamicViewStep<any>[],
  extras?: Partial<DynamicBranchPath<any>>,
): DynamicBranchPath<any> {
  return {
    pathId,
    astPath: `${pathId}/ast`,
    steps: steps as unknown as DynamicBranchPath<any>['steps'],
    ...extras,
  }
}

function makeBranch(): DynamicBranchCollection<any> {
  const firstStep = $step('customer -> cloud.frontend.dashboard', 'browse dashboard')
  const secondStep = $step('customer -> cloud.backend.graphql', 'call backend')
  return {
    branchId: '/branch@0',
    astPath: '/branch@0',
    kind: 'parallel',
    parallelId: '/branch@0',
    label: 'customer decisions',
    defaultPathId: '/branch@0/path@0',
    paths: [
      makeBranchPath('/branch@0/path@0', [firstStep], {
        pathName: 'happy',
        pathTitle: 'Happy path',
      }),
      makeBranchPath('/branch@0/path@1', [secondStep], {
        pathName: 'detour',
      }),
    ] as unknown as DynamicBranchCollection<any>['paths'],
  }
}

describe('DynamicViewCompute branch traversal', () => {
  afterEach(() => {
    disableDynamicBranchCollections()
  })

  it('emits hierarchical step ids and branch metadata when feature flag enabled', () => {
    enableDynamicBranchCollections()
    const branch = makeBranch()
    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01',
      'step-01.02.01',
    ])

    expect(computed.edges.map(edge => edge.branchTrail)).toMatchObject([
      [
        {
          branchId: branch.branchId,
          pathId: branch.paths[0]!.pathId,
          pathIndex: 1,
          indexWithinPath: 1,
          isDefaultPath: true,
        },
      ],
      [
        {
          branchId: branch.branchId,
          pathId: branch.paths[1]!.pathId,
          pathIndex: 2,
          indexWithinPath: 1,
          isDefaultPath: false,
        },
      ],
    ])

    expect(computed.branchCollections).toBeDefined()
    expect(computed.branchCollections).toHaveLength(1)
    const [collection] = computed.branchCollections!
    expect(collection).toMatchObject({
      branchId: branch.branchId,
      kind: 'parallel',
      defaultPathId: branch.defaultPathId,
      paths: [
        {
          pathId: branch.paths[0]!.pathId,
          pathIndex: 1,
          edgeIds: ['step-01.01.01'],
          isDefaultPath: true,
          pathTitle: 'Happy path',
        },
        {
          pathId: branch.paths[1]!.pathId,
          pathIndex: 2,
          edgeIds: ['step-01.02.01'],
          isDefaultPath: false,
        },
      ],
    })
  })

  it('keeps legacy numbering and omits metadata when feature flag disabled', () => {
    disableDynamicBranchCollections()
    const branch = makeBranch()
    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual(['step-01', 'step-02'])
    expect(computed.edges.every(edge => !edge.branchTrail)).toBe(true)
    expect(computed).not.toHaveProperty('branchCollections')
  })

  it('handles nested branches with 3-level depth', () => {
    enableDynamicBranchCollections()
    const innerStep1 = $step('customer -> cloud.frontend.dashboard', 'inner path 1')
    const innerStep2 = $step('customer -> cloud.backend.graphql', 'inner path 2')

    const innerBranch: DynamicBranchCollection<any> = {
      branchId: '/branch@0/path@0/branch@0',
      astPath: '/branch@0/path@0/branch@0',
      kind: 'alternate',
      label: 'inner alternate',
      defaultPathId: '/branch@0/path@0/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0/branch@0/path@0', [innerStep1]),
        makeBranchPath('/branch@0/path@0/branch@0/path@1', [innerStep2]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const outerStep = $step('customer -> cloud.frontend.dashboard', 'outer step')
    const outerBranch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'parallel',
      parallelId: '/branch@0',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [innerBranch as any]),
        makeBranchPath('/branch@0/path@1', [outerStep]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [outerBranch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01.01',
      'step-01.01.02.01',
      'step-01.02.01',
    ])

    expect(computed.edges[0]!.branchTrail).toHaveLength(2)
    expect(computed.edges[1]!.branchTrail).toHaveLength(2)
    expect(computed.edges[2]!.branchTrail).toHaveLength(1)
  })

  it('handles alternate inside parallel (heterogeneous nesting)', () => {
    enableDynamicBranchCollections()
    const altStep1 = $step('customer -> cloud.frontend.dashboard', 'alternate path 1')
    const altStep2 = $step('customer -> cloud.backend.graphql', 'alternate path 2')

    const alternate: DynamicBranchCollection<any> = {
      branchId: '/branch@0/path@0/branch@0',
      astPath: '/branch@0/path@0/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0/branch@0/path@0', [altStep1], { pathName: 'success' }),
        makeBranchPath('/branch@0/path@0/branch@0/path@1', [altStep2], { pathName: 'failure' }),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const parallelStep = $step('customer -> cloud.frontend.dashboard', 'parallel step')
    const parallel: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'parallel',
      parallelId: '/branch@0',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [alternate as any]),
        makeBranchPath('/branch@0/path@1', [parallelStep]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [parallel] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01.01',
      'step-01.01.02.01',
      'step-01.02.01',
    ])

    expect(computed.branchCollections).toHaveLength(2)
    const outerCollection = computed.branchCollections!.find(c => c.kind === 'parallel')
    const innerCollection = computed.branchCollections!.find(c => c.kind === 'alternate')
    expect(outerCollection).toBeDefined()
    expect(innerCollection).toBeDefined()
    expect(innerCollection!.paths[0]!.pathName).toBe('success')
    expect(innerCollection!.paths[1]!.pathName).toBe('failure')
  })

  it('handles parallel inside alternate (heterogeneous nesting)', () => {
    enableDynamicBranchCollections()
    const parStep1 = $step('customer -> cloud.frontend.dashboard', 'parallel path 1')
    const parStep2 = $step('customer -> cloud.backend.graphql', 'parallel path 2')

    const parallel: DynamicBranchCollection<any> = {
      branchId: '/branch@0/path@0/branch@0',
      astPath: '/branch@0/path@0/branch@0',
      kind: 'parallel',
      parallelId: '/branch@0/path@0/branch@0',
      defaultPathId: '/branch@0/path@0/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0/branch@0/path@0', [parStep1]),
        makeBranchPath('/branch@0/path@0/branch@0/path@1', [parStep2]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const altStep = $step('customer -> cloud.frontend.dashboard', 'alternate step')
    const alternate: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [parallel as any]),
        makeBranchPath('/branch@0/path@1', [altStep]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [alternate] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01.01',
      'step-01.01.02.01',
      'step-01.02.01',
    ])
  })

  it('handles multiple paths with multiple steps each', () => {
    enableDynamicBranchCollections()
    const path1Step1 = $step('customer -> cloud.frontend.dashboard', 'path1 step1')
    const path1Step2 = $step('cloud.frontend.dashboard -> cloud.backend.graphql', 'path1 step2')
    const path2Step1 = $step('customer -> cloud.backend.graphql', 'path2 step1')
    const path2Step2 = $step('cloud.backend.graphql -> cloud.backend.storage', 'path2 step2')

    const branch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [path1Step1, path1Step2]),
        makeBranchPath('/branch@0/path@1', [path2Step1, path2Step2]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01.01.01',
      'step-01.01.02',
      'step-01.02.01',
      'step-01.02.02',
    ])

    const collection = computed.branchCollections![0]!
    expect(collection.paths[0]!.edgeIds).toEqual(['step-01.01.01', 'step-01.01.02'])
    expect(collection.paths[1]!.edgeIds).toEqual(['step-01.02.01', 'step-01.02.02'])
  })

  it('tracks branch trails correctly through nested structures', () => {
    enableDynamicBranchCollections()
    const innerStep = $step('customer -> cloud.frontend.dashboard', 'inner step')

    const innerBranch: DynamicBranchCollection<any> = {
      branchId: '/branch@0/path@0/branch@0',
      astPath: '/branch@0/path@0/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0/branch@0/path@0', [innerStep]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const outerBranch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'parallel',
      parallelId: '/branch@0',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [innerBranch as any]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [outerBranch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges[0]!.branchTrail).toMatchObject([
      {
        branchId: '/branch@0',
        pathId: '/branch@0/path@0',
        pathIndex: 1,
        indexWithinPath: 1,
        isDefaultPath: true,
      },
      {
        branchId: '/branch@0/path@0/branch@0',
        pathId: '/branch@0/path@0/branch@0/path@0',
        pathIndex: 1,
        indexWithinPath: 1,
        isDefaultPath: true,
      },
    ])
  })

  it('handles steps before and after branch collections', () => {
    enableDynamicBranchCollections()
    const beforeStep = $step('customer -> cloud.frontend.dashboard', 'before branch')
    const branchStep = $step('cloud.frontend.dashboard -> cloud.backend.graphql', 'in branch')
    const afterStep = $step('cloud.backend.graphql -> cloud.backend.storage', 'after branch')

    const branch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'parallel',
      parallelId: '/branch@0',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [branchStep]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [beforeStep, branch, afterStep] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    expect(computed.edges.map(edge => edge.id)).toEqual([
      'step-01',
      'step-02.01.01',
      'step-03',
    ])

    expect(computed.edges[0]!.branchTrail).toBeUndefined()
    expect(computed.edges[1]!.branchTrail).toHaveLength(1)
    expect(computed.edges[2]!.branchTrail).toBeUndefined()
  })

  it('assigns pathIndex sequentially within branch collection', () => {
    enableDynamicBranchCollections()
    const step1 = $step('customer -> cloud.frontend.dashboard', 'path 1')
    const step2 = $step('customer -> cloud.backend.graphql', 'path 2')
    const step3 = $step('customer -> cloud.backend.storage', 'path 3')

    const branch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [step1]),
        makeBranchPath('/branch@0/path@1', [step2]),
        makeBranchPath('/branch@0/path@2', [step3]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    const collection = computed.branchCollections![0]!
    expect(collection.paths.map(p => p.pathIndex)).toEqual([1, 2, 3])
  })

  it('marks only default path as isDefaultPath', () => {
    enableDynamicBranchCollections()
    const step1 = $step('customer -> cloud.frontend.dashboard', 'default')
    const step2 = $step('customer -> cloud.backend.graphql', 'other')

    const branch: DynamicBranchCollection<any> = {
      branchId: '/branch@0',
      astPath: '/branch@0',
      kind: 'alternate',
      defaultPathId: '/branch@0/path@0',
      paths: [
        makeBranchPath('/branch@0/path@0', [step1]),
        makeBranchPath('/branch@0/path@1', [step2]),
      ] as unknown as DynamicBranchCollection<any>['paths'],
    }

    const view = {
      ...baseView,
      steps: [branch] as DynamicViewStep<any>[],
    } as ParsedDynamicView<any>
    const computed = computeDynamicView(fakeModel, view)

    const collection = computed.branchCollections![0]!
    expect(collection.paths[0]!.isDefaultPath).toBe(true)
    expect(collection.paths[1]!.isDefaultPath).toBe(false)
  })
})
