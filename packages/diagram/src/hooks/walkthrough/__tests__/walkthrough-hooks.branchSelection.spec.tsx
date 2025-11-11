import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import type {
  WalkthroughBranchPathRef,
  WalkthroughContextInput,
} from '../../../likec4diagram/state/walkthrough/types'
import { useBranchSelection } from '../useBranchSelection'
import { useWalkthrough } from '../useWalkthrough'
import { useWalkthroughActions } from '../useWalkthroughActions'
import { WalkthroughProvider } from '../WalkthroughProvider'

function wrapperWithInput(input: WalkthroughContextInput): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }) {
    return <WalkthroughProvider input={input}>{children}</WalkthroughProvider>
  }
}

describe('walkthrough hooks - branch selection', () => {
  const branchInput: WalkthroughContextInput = {
    viewId: 'v-branch',
    stepIds: ['d1', 'a1', 'b1'],
    branchCollections: [
      {
        branchId: 'branch-alt',
        kind: 'alternate',
        decisionStepId: 'd1',
        paths: [
          {
            pathId: 'path-a',
            pathIndex: 0,
            isDefaultPath: true,
            pathTitle: 'Path A',
            stepIds: ['a1'],
          },
          {
            pathId: 'path-b',
            pathIndex: 1,
            pathTitle: 'Path B',
            stepIds: ['b1'],
          },
        ],
      },
    ],
  }

  it('returns options at decision step and updates activeBranch on selection', () => {
    const wrapper = wrapperWithInput(branchInput)

    const { result: walkthrough } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actions } = renderHook(() => useWalkthroughActions(), { wrapper })
    const { result: branch } = renderHook(() => useBranchSelection(), { wrapper })

    // Initially idle: no active, no options.
    expect(walkthrough.current.active).toBeUndefined()
    expect(branch.current.activeBranch).toBeUndefined()
    expect(branch.current.options).toBeUndefined()

    // Start walkthrough: should land on decision step d1
    act(() => {
      actions.current.start('d1')
    })
    expect(walkthrough.current.active?.stepId).toBe('d1')

    // At decision step: options should be available
    const options = branch.current.options as readonly WalkthroughBranchPathRef[] | undefined
    expect(options).toBeDefined()
    expect(options?.length).toBe(2)
    expect(options).toEqual(
      expect.arrayContaining([
        { branchId: 'branch-alt', pathId: 'path-a' },
        { branchId: 'branch-alt', pathId: 'path-b' },
      ]),
    )

    // No branch selected yet
    expect(branch.current.activeBranch).toBeUndefined()

    // Select branch path-a
    act(() => {
      actions.current.selectBranchPath('branch-alt', 'path-a')
    })

    // Active step should move to first step of selected path (a1)
    expect(walkthrough.current.active?.stepId).toBe('a1')
    expect(branch.current.activeBranch).toEqual({
      branchId: 'branch-alt',
      pathId: 'path-a',
    })

    // At non-decision step, options should not be exposed anymore
    expect(branch.current.options).toBeUndefined()
  })
})
