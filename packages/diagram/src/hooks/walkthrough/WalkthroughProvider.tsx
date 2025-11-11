import { useMachine } from '@xstate/react'
import React, {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import type { ActorRefFrom, StateFrom } from 'xstate'
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
  // Use useMachine to properly integrate with React re-renders and subscriptions
  const [snapshot, send, actor] = useMachine(walkthroughMachine, {
    input,
  })

  // Sync external input into the machine when it changes.
  useEffect(() => {
    send({ type: 'UPDATE_FROM_INPUT', input })
  }, [send, input])

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
