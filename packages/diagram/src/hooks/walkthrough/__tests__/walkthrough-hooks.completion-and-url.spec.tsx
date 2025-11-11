import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import type { WalkthroughContextInput } from '../../../likec4diagram/state/walkthrough/types'
import { useWalkthrough } from '../useWalkthrough'
import { useWalkthroughActions } from '../useWalkthroughActions'
import { useWalkthroughCompletion } from '../useWalkthroughCompletion'
import { useWalkthroughURL } from '../useWalkthroughURL'
import { WalkthroughProvider } from '../WalkthroughProvider'

function createWrapper(input: WalkthroughContextInput): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }) {
    return <WalkthroughProvider input={input}>{children}</WalkthroughProvider>
  }
}

describe('walkthrough hooks - completion', () => {
  const input: WalkthroughContextInput = {
    viewId: 'v-completion',
    stepIds: ['s1', 's2', 's3'],
    branchCollections: [
      {
        branchId: 'b1',
        kind: 'alternate',
        decisionStepId: 's1',
        paths: [
          {
            pathId: 'p1',
            pathIndex: 0,
            isDefaultPath: true,
            stepIds: ['s1', 's2'],
          },
          {
            pathId: 'p2',
            pathIndex: 1,
            stepIds: ['s1', 's3'],
          },
        ],
      },
    ],
  }

  it('computes overall and branch completion using core progress helpers', () => {
    const wrapper = createWrapper(input)

    const { result: walkthrough } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actions } = renderHook(() => useWalkthroughActions(), { wrapper })
    const { result: completion } = renderHook(() => useWalkthroughCompletion(), { wrapper })

    // Initially no completion.
    expect(completion.current.overall.totalSteps).toBe(3)
    expect(completion.current.overall.completedSteps).toBe(0)
    expect(completion.current.branches.size).toBe(0)

    // Start and mark s1 + s2 complete -> branch b1:p1 should be complete, p2 not.
    act(() => {
      actions.current.start('s1')
      actions.current.markComplete('s1')
      actions.current.markComplete('s2')
    })

    // Verify overall via helper contract:
    expect(completion.current.overall.completedSteps).toBe(2)

    const branchProgress = completion.current.branches.get('b1')
    expect(branchProgress).toBeDefined()
    const map = branchProgress ?? []
    const p1 = map.find(p => p.pathId === 'p1')
    const p2 = map.find(p => p.pathId === 'p2')

    expect(p1?.isComplete).toBe(true)
    // p2 requires s1 + s3, only s1 complete so far
    expect(p2?.isComplete).toBe(false)

    // Mark s3 complete -> p2 should now be complete as well.
    act(() => {
      actions.current.markComplete('s3')
    })

    const branchProgress2 = completion.current.branches.get('b1') ?? []
    const p2b = branchProgress2.find(p => p.pathId === 'p2')
    expect(p2b?.isComplete).toBe(true)
  })
})

describe('walkthrough hooks - URL encoding / sync', () => {
  const baseInput: WalkthroughContextInput = {
    viewId: 'v-url',
    stepIds: ['s1', 's2'],
    branchCollections: [
      {
        branchId: 'b-url',
        kind: 'alternate',
        decisionStepId: 's1',
        paths: [
          {
            pathId: 'p-default',
            pathIndex: 0,
            isDefaultPath: true,
            stepIds: ['s1'],
          },
          {
            pathId: 'p-alt',
            pathIndex: 1,
            stepIds: ['s2'],
          },
        ],
      },
    ],
  }

  it('read() encodes current state and apply() drives SYNC_FROM_URL', () => {
    const wrapper = createWrapper(baseInput)

    const { result: walkthrough } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actions } = renderHook(() => useWalkthroughActions(), { wrapper })
    const { result: url } = renderHook(() => useWalkthroughURL(), { wrapper })

    // Initially idle -> encoded token should be empty.
    expect(url.current.read()).toBe('')

    // Start at decision step (s1) and encode
    act(() => {
      actions.current.start('s1')
    })
    expect(walkthrough.current.active?.stepId).toBe('s1')

    const tokenAtS1 = url.current.read()
    expect(tokenAtS1).toBe('v-url:s1')

    // Select branch path p-alt and move to its first step.
    act(() => {
      actions.current.selectBranchPath('b-url', 'p-alt')
    })
    expect(walkthrough.current.active?.stepId).toBe('s2')
    expect(walkthrough.current.active?.branch).toEqual({
      branchId: 'b-url',
      pathId: 'p-alt',
    })

    const tokenWithBranch = url.current.read()
    expect(tokenWithBranch).toBe('v-url:s2:b-url:p-alt')

    // Now create a fresh provider instance and apply the encoded token there.
    const wrapper2 = createWrapper(baseInput)
    const { result: walkthrough2 } = renderHook(() => useWalkthrough(), { wrapper: wrapper2 })
    const { result: actions2 } = renderHook(() => useWalkthroughActions(), { wrapper: wrapper2 })
    const { result: url2 } = renderHook(() => useWalkthroughURL(), { wrapper: wrapper2 })

    // Fresh instance: idle
    expect(walkthrough2.current.active).toBeUndefined()

    // Apply encoded token via hook, which dispatches SYNC_FROM_URL to the machine.
    act(() => {
      url2.current.apply(tokenWithBranch)
    })

    // Machine should sync into matching active state (same viewId)
    expect(walkthrough2.current.active?.stepId).toBe('s2')
    expect(walkthrough2.current.active?.branch).toEqual({
      branchId: 'b-url',
      pathId: 'p-alt',
    })

    // If viewId in token mismatches, SYNC_FROM_URL must be ignored (core contract).
    const badToken = 'other-view:s1'
    act(() => {
      actions2.current.stop()
    })
    expect(walkthrough2.current.active).toBeUndefined()

    act(() => {
      url2.current.apply(badToken)
    })
    // Still idle because viewId mismatch is ignored.
    expect(walkthrough2.current.active).toBeUndefined()
  })
})
