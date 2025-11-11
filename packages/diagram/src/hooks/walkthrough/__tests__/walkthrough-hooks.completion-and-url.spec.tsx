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

    // Initially:
    // - No steps completed.
    // - We only track branch completion once at least one path in that branch
    //   has some completion signal. Since nothing is completed yet, the map is empty.
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
    // p2 requires s1 + s3, only s1 complete so far, so it must not yet appear.
    expect(p2).toBeUndefined()

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
            // This path begins at the decision step (s1) and continues with s2,
            // which allows the machine to restore a consistent branchRef.
            stepIds: ['s1', 's2'],
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

    // Select branch path p-alt and move along that path.
    act(() => {
      result.current.actions.selectBranchPath('b-url', 'p-alt')
    })
    // We expect to be at s1's branch path start or its next step depending on machine navigation;
    // in either case, the active branchRef must be consistent with the branch options.
    expect(result.current.walkthrough.active?.branch).toEqual({
      branchId: 'b-url',
      pathId: 'p-alt',
    })

    const tokenWithBranch = result.current.url.read()
    // Token must encode both the step and the valid branchRef.
    expect(tokenWithBranch).toMatch(/^v-url:s[12]:b-url:p-alt$/)

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

    // Machine should sync into a matching active state (same viewId) and preserve
    // the branchRef only if it is valid for that encoded state. This asserts that
    // URL decoding never produces an impossible (step, branch/path) combination.
    const synced = result2.current.walkthrough.active
    expect(synced?.stepId).toBeDefined()
    if (synced?.branch) {
      // If a branchRef is restored, it must match the encoded one.
      expect(synced.branch).toEqual({
        branchId: 'b-url',
        pathId: 'p-alt',
      })
    }

    // If viewId in token mismatches, SYNC_FROM_URL must be ignored (core contract).
    const badToken = 'other-view:s1'

    act(() => {
      result2.current.actions.stop()
    })
    // After STOP the machine goes idle and must not keep any active step or branchRef.
    expect(result2.current.walkthrough.active).toBeUndefined()

    act(() => {
      result2.current.url.apply(badToken)
    })
    // Still idle because viewId mismatch is ignored.
    expect(result2.current.walkthrough.active).toBeUndefined()
  })
})
