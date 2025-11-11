import type { WalkthroughBranchPathRef, WalkthroughState } from './types'

/**
 * Encode walkthrough state into a compact, URL-friendly string.
 *
 * Shape (no full URL, just the encoded token):
 * - `${viewId}:${stepId}`
 * - `${viewId}:${stepId}:${branchId}:${pathId}`
 *
 * Rules:
 * - viewId and stepId are required.
 * - branchId/pathId are included only when an active branch path is selected.
 * - All segments are separated by ':'; consumers must treat values as opaque.
 */
export function encodeWalkthroughState(
  viewId: string,
  state: WalkthroughState,
): string {
  const active = state.active
  if (!viewId || !active?.stepId) {
    return ''
  }

  const base = `${viewId}:${active.stepId}`

  const branch = active.branch
  if (branch && branch.branchId && branch.pathId) {
    return `${base}:${branch.branchId}:${branch.pathId}`
  }

  return base
}

/**
 * Decoded representation of a walkthrough URL token.
 *
 * All fields are optional to make this resilient to partial/invalid inputs.
 */
export interface DecodedWalkthroughState {
  readonly viewId?: string
  readonly stepId?: string
  readonly branchId?: string
  readonly pathId?: string
}

/**
 * Decode a walkthrough token produced by encodeWalkthroughState.
 *
 * Accepted shapes:
 * - `${viewId}:${stepId}`
 * - `${viewId}:${stepId}:${branchId}:${pathId}`
 *
 * Any other shape:
 * - Returns an object with whatever segments are available (best-effort),
 *   leaving missing parts as undefined.
 *
 * This function is:
 * - Pure (no side effects)
 * - Round-trip safe for known formats
 */
export function decodeWalkthroughState(encoded: string): DecodedWalkthroughState {
  if (!encoded || typeof encoded !== 'string') {
    return {}
  }

  const parts = encoded.split(':')

  if (parts.length < 2) {
    // Not enough information to form a meaningful state.
    return {}
  }

  const [viewId, stepId, branchId, pathId, ...rest] = parts

  // Ignore trailing garbage but keep known positions.
  const result: DecodedWalkthroughState = {
    viewId: viewId || undefined,
    stepId: stepId || undefined,
  }

  if (branchId && pathId) {
    result.branchId = branchId
    result.pathId = pathId
  }

  // If there are extra parts beyond the 4th, they are ignored intentionally
  // to keep the format stable and forward-compatible.

  return result
}

/**
 * Helper to turn decoded branch info into a structural WalkthroughBranchPathRef.
 */
export function toBranchPathRef(decoded: DecodedWalkthroughState): WalkthroughBranchPathRef | undefined {
  if (!decoded.branchId || !decoded.pathId) {
    return undefined
  }
  return {
    branchId: decoded.branchId,
    pathId: decoded.pathId,
  }
}
