/**
 * Test that exactly matches the WalkthroughProvider pattern
 */
import { useSelector } from '@xstate/react'
import { act, renderHook } from '@testing-library/react'
import React, { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { assign, createActor, setup, type ActorRefFrom, type StateFrom } from 'xstate'

describe('Provider pattern (matching WalkthroughProvider)', () => {
  interface TestContext {
    input: { viewId: string }
    state: {
      active?: { stepId: string }
    }
  }

  type TestEvent = { type: 'START'; stepId: string }

  const testMachine = setup({
    types: {
      context: {} as TestContext,
      events: {} as TestEvent,
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

  interface TestProviderValue {
    readonly actor: ActorRefFrom<typeof testMachine>
    readonly snapshot: StateFrom<typeof testMachine>
  }

  const TestContext = createContext<TestProviderValue | null>(null)

  function TestProvider({ children, input }: { children: ReactNode; input: { viewId: string } }) {
    // EXACT same pattern as WalkthroughProvider
    const actorRef = useRef<ActorRefFrom<typeof testMachine> | null>(null)

    if (actorRef.current == null) {
      const actor = createActor(testMachine, {
        input,
      })
      actor.start()
      actorRef.current = actor
    }

    const actor = actorRef.current!

    // Stop actor on unmount
    useEffect(() => {
      return () => {
        actor.stop()
      }
    }, [actor])

    // Track the full machine snapshot - EXACT same as WalkthroughProvider
    const snapshot = useSelector(actor, (s) => s as StateFrom<typeof testMachine>)

    const value = useMemo<TestProviderValue>(
      () => ({
        actor,
        snapshot,
      }),
      [actor, snapshot],
    )

    return <TestContext.Provider value={value}>{children}</TestContext.Provider>
  }

  function useTestContext() {
    const ctx = useContext(TestContext)
    if (!ctx) {
      throw new Error('Must be used within TestProvider')
    }
    return ctx
  }

  function useTestState() {
    const { actor } = useTestContext()
    return useSelector(actor, (snapshot) => snapshot.context.state.active)
  }

  function useTestActions() {
    const { actor } = useTestContext()
    return {
      start: (stepId: string) => {
        actor.send({ type: 'START', stepId })
      },
    }
  }

  it('should update when using exact WalkthroughProvider pattern', () => {
    function Wrapper({ children }: { children: ReactNode }) {
      return <TestProvider input={{ viewId: 'v1' }}>{children}</TestProvider>
    }

    // Must use both hooks in SAME render to share the same provider/actor
    const { result } = renderHook(
      () => ({
        state: useTestState(),
        actions: useTestActions(),
      }),
      { wrapper: Wrapper },
    )

    // Initial state
    expect(result.current.state).toBeUndefined()

    // Send START event
    act(() => {
      result.current.actions.start('s1')
    })

    // Check if state updated
    expect(result.current.state).toEqual({ stepId: 's1' })
  })
})
