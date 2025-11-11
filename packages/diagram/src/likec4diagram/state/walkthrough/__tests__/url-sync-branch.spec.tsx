/**
 * Minimal test to isolate URL sync with branch path restoration
 */
import { describe, expect, it } from 'vitest'
import type { WalkthroughContextInput } from '../types'
import { decodeWalkthroughState, encodeWalkthroughState } from '../url-state'
import { walkthroughMachine } from '../walkthrough-machine'
import { createActor } from 'xstate'

describe('URL sync with branch paths', () => {
  const input: WalkthroughContextInput = {
    viewId: 'v1',
    stepIds: ['s1', 's2'],
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
            stepIds: ['s1'],
          },
          {
            pathId: 'p2',
            pathIndex: 1,
            stepIds: ['s2'],
          },
        ],
      },
    ],
  }

  it('should restore branch when syncing from URL with step inside path', () => {
    // Simulate: user selected branch b1:p2 and is on step s2
    const encoded = encodeWalkthroughState('v1', {
      active: {
        stepId: 's2',
        branch: {
          branchId: 'b1',
          pathId: 'p2',
        },
      },
      completedSteps: new Set(),
      completedPaths: new Set(),
    })

    expect(encoded).toBe('v1:s2:b1:p2')

    // Decode to verify
    const decoded = decodeWalkthroughState(encoded)
    expect(decoded).toEqual({
      viewId: 'v1',
      stepId: 's2',
      branchId: 'b1',
      pathId: 'p2',
    })

    // Create actor and apply SYNC_FROM_URL
    const actor = createActor(walkthroughMachine, { input })
    actor.start()

    actor.send({ type: 'SYNC_FROM_URL', encoded })

    const snapshot = actor.getSnapshot()
    console.log('Snapshot after SYNC_FROM_URL:', JSON.stringify(snapshot.context.state, null, 2))

    // Should restore the branch reference
    expect(snapshot.context.state.active?.stepId).toBe('s2')
    expect(snapshot.context.state.active?.branch).toEqual({
      branchId: 'b1',
      pathId: 'p2',
    })
  })

  it('should work when syncing at decision step with branch', () => {
    // When on the decision step itself with branch selected
    const encoded = encodeWalkthroughState('v1', {
      active: {
        stepId: 's1',
        branch: {
          branchId: 'b1',
          pathId: 'p2',
        },
      },
      completedSteps: new Set(),
      completedPaths: new Set(),
    })

    const actor = createActor(walkthroughMachine, { input })
    actor.start()

    actor.send({ type: 'SYNC_FROM_URL', encoded })

    const snapshot = actor.getSnapshot()

    expect(snapshot.context.state.active?.stepId).toBe('s1')
    expect(snapshot.context.state.active?.branch).toEqual({
      branchId: 'b1',
      pathId: 'p2',
    })
  })
})
