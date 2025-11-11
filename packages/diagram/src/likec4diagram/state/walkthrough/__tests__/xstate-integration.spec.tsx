/**
 * Minimal test to isolate XState v5 + React integration issue
 */
import { useSelector } from '@xstate/react'
import { act, renderHook } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { assign, createActor, setup } from 'xstate'

describe('XState v5 integration - minimal repro', () => {
  it('useSelector should update when assign is used', () => {
    // Minimal machine similar to walkthrough pattern
    const testMachine = setup({
      types: {
        context: {} as { count: number },
        events: {} as { type: 'INCREMENT' },
      },
    }).createMachine({
      id: 'test',
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: {
          on: {
            INCREMENT: {
              actions: assign({
                count: ({ context }) => context.count + 1,
              }),
            },
          },
        },
      },
    })

    // Test using manual createActor (like WalkthroughProvider does)
    const { result } = renderHook(() => {
      const actorRef = useRef<ReturnType<typeof createActor<typeof testMachine>> | null>(null)

      if (actorRef.current == null) {
        const actor = createActor(testMachine)
        actor.start()
        actorRef.current = actor
      }

      const count = useSelector(actorRef.current, (snapshot) => snapshot.context.count)

      return {
        actor: actorRef.current,
        count,
      }
    })

    // Initial state
    expect(result.current.count).toBe(0)

    // Send event
    act(() => {
      result.current.actor.send({ type: 'INCREMENT' })
    })

    // Check if useSelector updated
    expect(result.current.count).toBe(1)
  })

  it('useSelector with nested object updates', () => {
    interface TestContext {
      state: {
        active?: { stepId: string }
        count: number
      }
    }

    // More similar to walkthrough machine
    const testMachine = setup({
      types: {
        context: {} as TestContext,
        events: {} as { type: 'SET_ACTIVE'; stepId: string },
      },
    }).createMachine({
      id: 'test',
      context: {
        state: {
          count: 0,
        },
      },
      on: {
        SET_ACTIVE: {
          actions: assign({
            state: ({ event, context }) => ({
              ...context.state,
              active: { stepId: event.stepId },
            }),
          }),
        },
      },
    })

    const { result } = renderHook(() => {
      const actorRef = useRef<ReturnType<typeof createActor<typeof testMachine>> | null>(null)

      if (actorRef.current == null) {
        const actor = createActor(testMachine)
        actor.start()
        actorRef.current = actor
      }

      const active = useSelector(actorRef.current, (snapshot) => snapshot.context.state.active)

      return {
        actor: actorRef.current,
        active,
      }
    })

    // Initial state
    expect(result.current.active).toBeUndefined()

    // Send event
    act(() => {
      result.current.actor.send({ type: 'SET_ACTIVE', stepId: 's1' })
    })

    // Check if useSelector updated
    expect(result.current.active).toEqual({ stepId: 's1' })
  })

  it('using full context spread (like walkthrough does)', () => {
    interface TestContext {
      input: { viewId: string }
      state: {
        active?: { stepId: string }
      }
    }

    const testMachine = setup({
      types: {
        context: {} as TestContext,
        events: {} as { type: 'START'; stepId: string },
      },
    }).createMachine({
      id: 'test',
      context: ({ input }: { input: { viewId: string } }) => ({
        input,
        state: {},
      }),
      on: {
        START: {
          actions: assign(({ event, context }) => ({
            ...context,
            state: {
              ...context.state,
              active: { stepId: event.stepId },
            },
          })),
        },
      },
    })

    const { result } = renderHook(() => {
      const actorRef = useRef<ReturnType<typeof createActor<typeof testMachine>> | null>(null)

      if (actorRef.current == null) {
        const actor = createActor(testMachine, {
          input: { viewId: 'v1' },
        })
        actor.start()
        actorRef.current = actor
      }

      const active = useSelector(actorRef.current, (snapshot) => snapshot.context.state.active)

      return {
        actor: actorRef.current,
        active,
      }
    })

    expect(result.current.active).toBeUndefined()

    act(() => {
      result.current.actor.send({ type: 'START', stepId: 's1' })
    })

    expect(result.current.active).toEqual({ stepId: 's1' })
  })
})
