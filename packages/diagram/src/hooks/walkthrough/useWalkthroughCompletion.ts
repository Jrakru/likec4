import { useSelector } from '@xstate/react'
import { useMemo } from 'react'
import {
  type BranchPathProgress,
  type OverallProgress,
  getBranchProgress,
  getOverallProgress,
} from '../../likec4diagram/state/walkthrough/progress'
import type {
  WalkthroughContextInput,
  WalkthroughState,
} from '../../likec4diagram/state/walkthrough/types'
import { useWalkthroughActorContext } from './WalkthroughProvider'

export interface UseWalkthroughCompletionResult {
  readonly overall: OverallProgress
  readonly branches: ReadonlyMap<string, readonly BranchPathProgress[]>
}

/**
 * useWalkthroughCompletion
 *
 * Read-only derived completion view:
 * - overall: getOverallProgress(input, state)
 * - branches: Map(branchId -> getBranchProgress(input, state, branchId))
 *
 * No side effects; does not dispatch events.
 */
export function useWalkthroughCompletion(): UseWalkthroughCompletionResult {
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

  return useMemo<UseWalkthroughCompletionResult>(() => {
    const overall = getOverallProgress(input, state)

    const branches = new Map<string, readonly BranchPathProgress[]>()
    const collections = input.branchCollections
    if (collections && collections.length > 0) {
      for (const collection of collections) {
        if (!branches.has(collection.branchId)) {
          const progress = getBranchProgress(input, state, collection.branchId)
          // Only surface branches that have at least some path-level signal.
          // This keeps the map empty when there is no completion at all and
          // avoids cluttering consumers with purely configuration data.
          if (progress.length > 0) {
            branches.set(collection.branchId, progress)
          }
        }
      }
    }

    return {
      overall,
      branches,
    }
  }, [input, state])
}
