import type {
  WalkthroughBranchPathRef,
  WalkthroughContextInput,
  WalkthroughState,
} from './types'

/**
 * Build the canonical linear order of stepIds for a walkthrough.
 *
 * For now this is a stable pass-through of input.stepIds:
 * - Deterministic
 * - Does not mutate input
 */
export function buildLinearOrder(input: WalkthroughContextInput): string[] {
  return [...input.stepIds]
}

/**
 * Get the next stepId from the current walkthrough state.
 *
 * Rules:
 * - If there is an active step:
 *   - Return the next step in the canonical order if it exists.
 * - If there is no active step:
 *   - Return the first step from the canonical order (if any).
 */
export function getNextStep(
  input: WalkthroughContextInput,
  state: WalkthroughState,
): string | undefined {
  const order = buildLinearOrder(input)
  if (order.length === 0) {
    return undefined
  }
  const activeId = state.active?.stepId
  if (!activeId) {
    return order[0]
  }
  const idx = order.indexOf(activeId)
  if (idx < 0) {
    return order[0]
  }
  return order[idx + 1]
}

/**
 * Get the previous stepId from the current walkthrough state.
 *
 * Rules:
 * - If there is an active step:
 *   - Return the previous step in the canonical order if it exists.
 * - If there is no active step:
 *   - Return undefined.
 */
export function getPreviousStep(
  input: WalkthroughContextInput,
  state: WalkthroughState,
): string | undefined {
  const order = buildLinearOrder(input)
  if (order.length === 0) {
    return undefined
  }
  const activeId = state.active?.stepId
  if (!activeId) {
    return undefined
  }
  const idx = order.indexOf(activeId)
  if (idx <= 0) {
    return undefined
  }
  return order[idx - 1]
}

/**
 * Return all branch path refs associated with a given decisionStepId.
 *
 * This is purely structural and uses branchCollections from the input:
 * - For each collection with matching decisionStepId, return its paths
 *   as (branchId, pathId) pairs.
 */
export function getBranchOptions(
  input: WalkthroughContextInput,
  decisionStepId: string,
): WalkthroughBranchPathRef[] {
  const collections = input.branchCollections
  if (!collections || collections.length === 0) {
    return []
  }

  const result: WalkthroughBranchPathRef[] = []
  for (const collection of collections) {
    if (collection.decisionStepId !== decisionStepId) {
      continue
    }
    for (const path of collection.paths) {
      result.push({
        branchId: collection.branchId,
        pathId: path.pathId,
      })
    }
  }
  return result
}

/**
 * Resolve the default branch path for a given branchId.
 *
 * Priority:
 * 1) collection.defaultPathId (if present)            [future compatible]
 * 2) first path with isDefaultPath === true
 * 3) path with pathIndex === 0
 * 4) first path in paths array (if any)
 */
export function getDefaultBranchPath(
  input: WalkthroughContextInput,
  branchId: string,
): WalkthroughBranchPathRef | undefined {
  const collections = input.branchCollections
  if (!collections || collections.length === 0) {
    return undefined
  }

  const collection = collections.find(c => c.branchId === branchId)
  if (!collection || !collection.paths || collection.paths.length === 0) {
    return undefined
  }

  // 1) defaultPathId on collection (if exposed in future; structural guard)
  const anyCollection = collection as typeof collection & { defaultPathId?: string }
  if (anyCollection.defaultPathId) {
    const match = collection.paths.find(p => p.pathId === anyCollection.defaultPathId)
    if (match) {
      return { branchId: collection.branchId, pathId: match.pathId }
    }
  }

  // 2) first path explicitly marked isDefaultPath
  const explicit = collection.paths.find(p => p.isDefaultPath === true)
  if (explicit) {
    return { branchId: collection.branchId, pathId: explicit.pathId }
  }

  // 3) path with pathIndex === 0
  const byIndex0 = collection.paths.find(p => p.pathIndex === 0)
  if (byIndex0) {
    return { branchId: collection.branchId, pathId: byIndex0.pathId }
  }

  // 4) fallback: first path
  const [first] = collection.paths
  if (!first) {
    return undefined
  }
  return { branchId: collection.branchId, pathId: first.pathId }
}

/**
 * Check if a branch/path combination exists in the branch collections.
 * Used for validating branch references (e.g., when syncing from URL).
 */
export function isBranchPathValid(
  input: WalkthroughContextInput,
  branchId: string,
  pathId: string,
): boolean {
  const collections = input.branchCollections
  if (!collections || collections.length === 0) {
    return false
  }

  const collection = collections.find(c => c.branchId === branchId)
  if (!collection) {
    return false
  }

  const path = collection.paths.find(p => p.pathId === pathId)
  return !!path
}
