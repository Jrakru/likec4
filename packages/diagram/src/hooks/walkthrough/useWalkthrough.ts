import { useSelector } from '@xstate/react'
import { useWalkthroughActorContext } from './WalkthroughProvider'

export interface UseWalkthroughResult {
  readonly active?: {
    readonly stepId: string
    readonly branch?: {
      readonly branchId: string
      readonly pathId: string
    }
  }
  readonly completedSteps: ReadonlySet<string>
  readonly completedPaths: ReadonlySet<string>
}

/**
 * useWalkthrough
 *
 * Read-only selector over walkthrough machine context/state.
 * Returns:
 * - active: current step + optional branch selection
 * - completedSteps: set of completed stepIds
 * - completedPaths: set of completed branch-path keys
 *
 * Uses useSelector to minimize re-renders.
 */
export function useWalkthrough(): UseWalkthroughResult {
  const { actor } = useWalkthroughActorContext()

  return useSelector(
    actor,
    snapshot => {
      const { state } = snapshot.context
      return {
        active: state.active,
        completedSteps: state.completedSteps,
        completedPaths: state.completedPaths,
      }
    },
    (prev, next) => {
      if (prev === next) {
        return true
      }
      // Shallow compare structural fields; sets are identity-based and stable
      // under the walkthrough-machine's immutable update semantics.
      return (
        prev.active === next.active &&
        prev.completedSteps === next.completedSteps &&
        prev.completedPaths === next.completedPaths
      )
    },
  )
}
