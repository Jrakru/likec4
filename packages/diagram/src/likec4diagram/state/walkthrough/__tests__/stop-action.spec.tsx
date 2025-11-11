/**
 * Minimal test to verify STOP action clears active state
 */
import { describe, expect, it } from 'vitest'
import type { WalkthroughContextInput } from '../types'
import { walkthroughMachine } from '../walkthrough-machine'
import { createActor } from 'xstate'

describe('STOP action', () => {
  const input: WalkthroughContextInput = {
    viewId: 'v1',
    stepIds: ['s1', 's2'],
  }

  it('should clear active state when STOP is called', () => {
    const actor = createActor(walkthroughMachine, { input })
    actor.start()

    // Start the walkthrough
    actor.send({ type: 'START' })

    let snapshot = actor.getSnapshot()
    expect(snapshot.context.state.active?.stepId).toBe('s1')
    expect(snapshot.value).toEqual({ active: 'navigating' })

    // Stop the walkthrough
    actor.send({ type: 'STOP' })

    snapshot = actor.getSnapshot()
    console.log('After STOP - state value:', snapshot.value)
    console.log('After STOP - active:', snapshot.context.state.active)

    expect(snapshot.value).toBe('idle')
    expect(snapshot.context.state.active).toBeUndefined()
  })

  it('should clear active after SYNC_FROM_URL then STOP', () => {
    const actor = createActor(walkthroughMachine, { input })
    actor.start()

    // Sync from URL to set active state
    actor.send({ type: 'SYNC_FROM_URL', encoded: 'v1:s2' })

    let snapshot = actor.getSnapshot()
    expect(snapshot.context.state.active?.stepId).toBe('s2')

    // Now stop
    actor.send({ type: 'STOP' })

    snapshot = actor.getSnapshot()
    console.log('After SYNC then STOP - state value:', snapshot.value)
    console.log('After SYNC then STOP - active:', snapshot.context.state.active)

    expect(snapshot.value).toBe('idle')
    expect(snapshot.context.state.active).toBeUndefined()
  })
})
