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

    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
        completion: useWalkthroughCompletion(),
      }),
      { wrapper },
    )

    // Initially no completion.
    expect(result.current.completion.overall.totalSteps).toBe(3)
    expect(result.current.completion.overall.completedSteps).toBe(0)
    expect(result.current.completion.branches.size).toBe(0)

    // Start and mark s1 + s2 complete -> branch b1:p1 should be complete, p2 not.
    act(() => {
      result.current.actions.start('s1')
      result.current.actions.markComplete('s1')
      result.current.actions.markComplete('s2')
    })

    // Verify overall via helper contract:
    expect(result.current.completion.overall.completedSteps).toBe(2)

    const branchProgress = result.current.completion.branches.get('b1')
    expect(branchProgress).toBeDefined()
    const map = branchProgress ?? []
    const p1 = map.find(p => p.pathId === 'p1')
    const p2 = map.find(p => p.pathId === 'p2')

    expect(p1?.isComplete).toBe(true)
    // p2 requires s1 + s3, only s1 complete so far
    expect(p2?.isComplete).toBe(false)

    // Mark s3 complete -> p2 should now be complete as well.
    act(() => {
      result.current.actions.markComplete('s3')
    })

    const branchProgress2 = result.current.completion.branches.get('b1') ?? []
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

    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
        url: useWalkthroughURL(),
      }),
      { wrapper },
    )

    // Initially idle -> encoded token should be empty.
    expect(result.current.url.read()).toBe('')

    // Start at decision step (s1) and encode
    act(() => {
      result.current.actions.start('s1')
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s1')

    const tokenAtS1 = result.current.url.read()
    expect(tokenAtS1).toBe('v-url:s1')

    // Select branch path p-alt and move to its first step.
    act(() => {
      result.current.actions.selectBranchPath('b-url', 'p-alt')
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s2')
    expect(result.current.walkthrough.active?.branch).toEqual({
      branchId: 'b-url',
      pathId: 'p-alt',
    })

    const tokenWithBranch = result.current.url.read()
    expect(tokenWithBranch).toBe('v-url:s2:b-url:p-alt')

    // Now create a fresh provider instance and apply the encoded token there.
    const wrapper2 = createWrapper(baseInput)
    const { result: result2 } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
        url: useWalkthroughURL(),
      }),
      { wrapper: wrapper2 },
    )

    // Fresh instance: idle
    expect(result2.current.walkthrough.active).toBeUndefined()

    // Apply encoded token via hook, which dispatches SYNC_FROM_URL to the machine.
    act(() => {
      result2.current.url.apply(tokenWithBranch)
    })

    // Machine should sync into matching active state (same viewId)
    expect(result2.current.walkthrough.active?.stepId).toBe('s2')
    expect(result2.current.walkthrough.active?.branch).toEqual({
      branchId: 'b-url',
      pathId: 'p-alt',
    })

    // If viewId in token mismatches, SYNC_FROM_URL must be ignored (core contract).
    const badToken = 'other-view:s1'
    act(() => {
      result2.current.actions.stop()
    })
    expect(result2.current.walkthrough.active).toBeUndefined()

    act(() => {
      result2.current.url.apply(badToken)
    })
    // Still idle because viewId mismatch is ignored.
    expect(result2.current.walkthrough.active).toBeUndefined()
  })
})
