import { useSelector } from '@xstate/react'
import React, {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import type { ActorRefFrom, StateFrom } from 'xstate'
import { createActor } from 'xstate'
import type {
  WalkthroughContextInput,
  WalkthroughState,
} from '../../likec4diagram/state/walkthrough/types'
import { walkthroughMachine } from '../../likec4diagram/state/walkthrough/walkthrough-machine'

/**
 * WalkthroughProvider
 *
 * - Creates an XState actor from the walkthroughMachine.
 * - Keeps machine input in sync with external props via UPDATE_FROM_INPUT.
 * - Exposes the actorRef and snapshot via React context.
 *
 * NOTE:
 * - The walkthrough is NOT auto-started; consumers must call start() via actions hook.
 * - No coupling to diagram-machine, XYFlow, or any specific UI.
 */

interface WalkthroughProviderValue {
  readonly actor: ActorRefFrom<typeof walkthroughMachine>
  readonly snapshot: StateFrom<typeof walkthroughMachine>
}

const WalkthroughContext = createContext<WalkthroughProviderValue | null>(null)

export interface WalkthroughProviderProps {
  readonly children: ReactNode
  readonly input: WalkthroughContextInput
}

export function WalkthroughProvider({ children, input }: WalkthroughProviderProps) {
  // We create and manage the XState v5 actor manually instead of useInterpret because:
  // - In this monorepo/Vitest toolchain, @xstate/react does not expose useInterpret as expected at runtime.
  // - The walkthrough tests expect concrete machine behaviour backed by a live actor.
  // - XState v5 supports direct actor creation via createActor for framework integration.

  const actorRef = useRef<ActorRefFrom<typeof walkthroughMachine> | null>(null)

  // Lazily create the actor once.
  if (actorRef.current == null) {
    const actor = createActor(walkthroughMachine, {
      input,
      systemId: 'walkthrough',
    })
    actor.start()
    actorRef.current = actor
  }

  const actor = actorRef.current!

  // Sync external input into the machine when it changes.
  useEffect(() => {
    actor.send({ type: 'UPDATE_FROM_INPUT', input })
  }, [actor, input])

  // Stop actor on unmount to avoid leaks in tests/apps.
  useEffect(() => {
    return () => {
      actor.stop()
    }
  }, [actor])

  // Track the full machine snapshot.
  const snapshot = useSelector(actor, s => s as StateFrom<typeof walkthroughMachine>)

  const value = useMemo<WalkthroughProviderValue>(
    () => ({
      actor,
      snapshot,
    }),
    [actor, snapshot],
  )

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  )
}

export function useWalkthroughActorContext(): WalkthroughProviderValue {
  const ctx = useContext(WalkthroughContext)
  if (!ctx) {
    throw new Error(
      'useWalkthrough* hooks must be used within WalkthroughProvider. ' +
        'Wrap your component tree with <WalkthroughProvider />.',
    )
  }
  return ctx
}
