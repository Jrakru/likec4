import { useSelector } from '@xstate/react'
import { useCallback, useMemo } from 'react'
import type {
  WalkthroughContextInput,
  WalkthroughState,
} from '../../likec4diagram/state/walkthrough/types'
import { encodeWalkthroughState } from '../../likec4diagram/state/walkthrough/url-state'
import { useWalkthroughActorContext } from './WalkthroughProvider'

export interface UseWalkthroughURLResult {
  /**
   * Compute an encoded walkthrough token for the current machine context.
   * Pure read: does not touch window.location or history.
   */
  readonly read: () => string
  /**
   * Apply an encoded token to the walkthrough via SYNC_FROM_URL.
   * URL ownership (reading/writing) is left to the caller.
   */
  readonly apply: (encoded: string) => void
}

/**
 * useWalkthroughURL
 *
 * Thin adapter over url-state helpers + walkthrough machine:
 * - read(): encodeWalkthroughState(viewId, state)
 * - apply(encoded): dispatches SYNC_FROM_URL
 *
 * No direct interaction with window.history or actual URLs.
 */
export function useWalkthroughURL(): UseWalkthroughURLResult {
  const { actor } = useWalkthroughActorContext()

  const { input, state } = useSelector(
    actor,
    snapshot => {
      const ctx = snapshot.context as {
        input: WalkthroughContextInput
        state: WalkthroughState
      }
      return {
        input: ctx.input,
        state: ctx.state,
      }
    },
    (prev, next) => prev.input === next.input && prev.state === next.state,
  )

  const read = useCallback(() => {
    return encodeWalkthroughState(input.viewId, state)
  }, [input.viewId, state])

  const apply = useCallback(
    (encoded: string) => {
      actor.send({
        type: 'SYNC_FROM_URL',
        encoded,
      })
    },
    [actor],
  )

  return useMemo<UseWalkthroughURLResult>(
    () => ({
      read,
      apply,
    }),
    [read, apply],
  )
}
