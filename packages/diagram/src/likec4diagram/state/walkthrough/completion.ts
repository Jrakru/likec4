import type {
  WalkthroughBranchPathRef,
  WalkthroughContextInput,
  WalkthroughState,
} from './types'
import { toBranchPathKey } from './types'

/**
 * Return true when the given stepId is marked as completed in the walkthrough state.
 */
export function isStepComplete(state: WalkthroughState, stepId: string): boolean {
  return state.completedSteps.has(stepId)
}

/**
 * Mark a given stepId as completed.
 *
 * Returns a new WalkthroughState instance without mutating the input.
 */
export function markStepComplete(state: WalkthroughState, stepId: string): WalkthroughState {
  if (!stepId || state.completedSteps.has(stepId)) {
    return state
  }
  const completedSteps = new Set(state.completedSteps)
  completedSteps.add(stepId)

  return {
    ...state,
    completedSteps,
  }
}

/**
 * Compute the set of completed branch paths for the given input + state.
 *
 * Rules:
 * - For each branchCollection and its paths:
 *   - A path is considered complete if all of its stepIds are present in completedSteps.
 * - Nested branches:
 *   - For now, only direct stepIds of the path are considered.
 *   - If those stepIds are all completed, the path is marked complete regardless of inner branches.
 *
 * The returned set contains canonical `(branchId:pathId)` keys.
 */
export function computeCompletedPaths(
  input: WalkthroughContextInput,
  state: WalkthroughState,
): ReadonlySet<string> {
  const result = new Set<string>()
  const { branchCollections } = input
  if (!branchCollections || branchCollections.length === 0) {
    return result
  }
  const completedSteps = state.completedSteps

  for (const collection of branchCollections) {
    for (const path of collection.paths) {
      if (path.stepIds.length === 0) {
        // Empty path: treat as not complete to avoid surprising behavior.
        continue
      }
      let allComplete = true
      for (const stepId of path.stepIds) {
        if (!completedSteps.has(stepId)) {
          allComplete = false
          break
        }
      }
      if (allComplete) {
        const ref: WalkthroughBranchPathRef = {
          branchId: collection.branchId,
          pathId: path.pathId,
        }
        result.add(toBranchPathKey(ref))
      }
    }
  }

  return result
}

/**
 * Reset completion state for steps and paths.
 *
 * Exported for potential reuse by the machine; kept here to stay purely in terms
 * of walkthrough types.
 */
export function resetCompletion(state: WalkthroughState): WalkthroughState {
  if (state.completedSteps.size === 0 && state.completedPaths.size === 0) {
    return state
  }
  return {
    ...state,
    completedSteps: new Set(),
    completedPaths: new Set(),
  }
}
