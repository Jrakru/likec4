import { computeCompletedPaths } from './completion'
import type { WalkthroughContextInput, WalkthroughState } from './types'

export interface OverallProgress {
  readonly totalSteps: number
  readonly completedSteps: number
}

/**
 * Compute simple overall progress for a walkthrough.
 *
 * - totalSteps: number of steps in input.stepIds
 * - completedSteps: count of stepIds that are marked complete
 *
 * Deterministic and side-effect free.
 */
export function getOverallProgress(
  input: WalkthroughContextInput,
  state: WalkthroughState,
): OverallProgress {
  const totalSteps = input.stepIds.length
  if (totalSteps === 0 || state.completedSteps.size === 0) {
    return {
      totalSteps,
      completedSteps: 0,
    }
  }

  let completedSteps = 0
  for (const stepId of input.stepIds) {
    if (state.completedSteps.has(stepId)) {
      completedSteps++
    }
  }

  return {
    totalSteps,
    completedSteps,
  }
}

/**
 * Per-path progress info within a branch.
 */
export interface BranchPathProgress {
  readonly branchId: string
  readonly pathId: string
  readonly isComplete: boolean
}

/**
 * Branch-level progress:
 * - For each path in the given branchId, whether it is complete.
 *
 * Uses the same completion semantics as computeCompletedPaths:
 * - A path is complete iff every stepId in that path is in completedSteps.
 */
export function getBranchProgress(
  input: WalkthroughContextInput,
  state: WalkthroughState,
  branchId: string,
): BranchPathProgress[] {
  const collections = input.branchCollections
  if (!collections || collections.length === 0) {
    return []
  }

  const collection = collections.find(c => c.branchId === branchId)
  if (!collection) {
    return []
  }

  if (!collection.paths || collection.paths.length === 0) {
    return []
  }

  // Reuse the same semantics as computeCompletedPaths to stay consistent.
  const completedPathKeys = computeCompletedPaths(input, state)

  return collection.paths.map(path => {
    const key = `${collection.branchId}:${path.pathId}`
    return {
      branchId: collection.branchId,
      pathId: path.pathId,
      isComplete: completedPathKeys.has(key),
    }
  })
}
