import { useCallback, useMemo } from 'react'
import type { WalkthroughBranchPathRef } from '../../likec4diagram/state/walkthrough/types'
import { useWalkthroughActorContext } from './WalkthroughProvider'

export interface WalkthroughActions {
  readonly start: (stepId?: string) => void
  readonly stop: () => void
  readonly next: () => void
  readonly previous: () => void
  readonly selectBranchPath: (branchId: string, pathId: string) => void
  readonly markComplete: (stepId: string) => void
  readonly resetCompletion: () => void
  readonly syncFromUrl: (encoded: string) => void
}

/**
 * useWalkthroughActions
 *
 * Stable callbacks that dispatch walkthrough events to the underlying actor.
 * - No UI/diagram-machine/XYFlow coupling.
 * - Does not auto-start walkthrough; caller decides when to start().
 */
export function useWalkthroughActions(): WalkthroughActions {
  const { actor } = useWalkthroughActorContext()

  // NOTE:
  // We intentionally do NOT include actor in dependency arrays.
  // The actor ref from useInterpret is stable across renders, so this is safe
  // and ensures callbacks remain referentially stable.
  const start = useCallback(
    (stepId?: string) => {
      actor.send({
        type: 'START',
        ...(stepId ? { stepId } : {}),
      })
    },
    [],
  )

  const stop = useCallback(() => {
    actor.send({ type: 'STOP' })
  }, [])

  const next = useCallback(() => {
    actor.send({ type: 'NEXT' })
  }, [])

  const previous = useCallback(() => {
    actor.send({ type: 'PREVIOUS' })
  }, [])

  const selectBranchPath = useCallback(
    (branchId: string, pathId: string) => {
      actor.send({
        type: 'SELECT_BRANCH_PATH',
        branchId,
        pathId,
      })
    },
    [],
  )

  const markComplete = useCallback((stepId: string) => {
    actor.send({
      type: 'MARK_COMPLETE',
      stepId,
    })
  }, [])

  const resetCompletion = useCallback(() => {
    actor.send({ type: 'RESET_COMPLETION' })
  }, [])

  const syncFromUrl = useCallback((encoded: string) => {
    actor.send({
      type: 'SYNC_FROM_URL',
      encoded,
    })
  }, [])

  return useMemo(
    () => ({
      start,
      stop,
      next,
      previous,
      selectBranchPath,
      markComplete,
      resetCompletion,
      syncFromUrl,
    }),
    [
      start,
      stop,
      next,
      previous,
      selectBranchPath,
      markComplete,
      resetCompletion,
      syncFromUrl,
    ],
  )
}
