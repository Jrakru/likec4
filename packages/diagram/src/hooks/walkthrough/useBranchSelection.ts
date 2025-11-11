import { useSelector } from '@xstate/react'
import { useMemo } from 'react'
import { getBranchOptions } from '../../likec4diagram/state/walkthrough/navigation'
import type {
  WalkthroughBranchPathRef,
  WalkthroughContextInput,
} from '../../likec4diagram/state/walkthrough/types'
import { useWalkthroughActorContext } from './WalkthroughProvider'

export interface UseBranchSelectionResult {
  readonly activeBranch?: WalkthroughBranchPathRef
  readonly options?: readonly WalkthroughBranchPathRef[]
}

/**
 * useBranchSelection
 *
 * Read-only derived view over current branch selection:
 * - activeBranch: currently selected branch/path (if any)
 * - options: available branch path options for the current decision step, if any
 *
 * Uses:
 * - WalkthroughContextInput + navigation.getBranchOptions for computation.
 * - No side effects; does not dispatch events.
 */
export function useBranchSelection(): UseBranchSelectionResult {
  const { actor } = useWalkthroughActorContext()

  const { input, active } = useSelector(
    actor,
    snapshot => {
      const ctx = snapshot.context as {
        input: WalkthroughContextInput
        state: {
          active?: {
            stepId: string
            branch?: WalkthroughBranchPathRef
          }
        }
      }
      return {
        input: ctx.input,
        active: ctx.state.active,
      }
    },
    (prev, next) => prev.input === next.input && prev.active === next.active,
  )

  return useMemo<UseBranchSelectionResult>(() => {
    if (!active) {
      return {}
    }

    const activeBranch = active.branch
      ? {
        branchId: active.branch.branchId,
        pathId: active.branch.pathId,
      }
      : undefined

    if (!active.stepId) {
      return { activeBranch }
    }

    const options = getBranchOptions(input, active.stepId)
    if (!options.length) {
      return { activeBranch }
    }

    return {
      activeBranch,
      options,
    }
  }, [input, active])
}
