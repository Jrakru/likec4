/**
 * Walkthrough module core types.
 *
 * These types are:
 * - Structural: depend only on stable contracts (StepEdgeId-like step ids, branchCollections shape).
 * - Library-like: no React, no XState specifics.
 * - UI-agnostic: suitable for use in any consumer (machines, hooks, external clients).
 */

/**
 * Reference to a single walkthrough step.
 *
 * stepId is expected (by convention) to be a StepEdgeId as emitted by dynamic views
 * and used in xyedges / branchCollections, but this module stays structural and
 * does not depend on the concrete StepEdgeId branded type.
 */
export interface WalkthroughStepRef {
  readonly stepId: string
}

/**
 * Reference to a specific branch path within a branch collection.
 *
 * - branchId: stable identifier for the branch (decision)
 * - pathId: stable identifier for the path within that branch
 */
export interface WalkthroughBranchPathRef {
  readonly branchId: string
  readonly pathId: string
}

/**
 * Structural input for the walkthrough.
 *
 * This is intentionally close to the ComputedDynamicView + branchCollections contract,
 * but without importing core types directly to keep this module self-contained.
 */
export interface WalkthroughContextInput {
  /**
   * Stable view identifier.
   */
  readonly viewId: string

  /**
   * Flat ordered list of stepIds as seen in the rendered diagram/sequence.
   * This is the canonical linear order used for NEXT/PREVIOUS navigation.
   *
   * stepIds are expected to be StepEdgeId-compatible but are modeled as strings
   * to avoid leaking the concrete branded type.
   */
  readonly stepIds: readonly string[]

  /**
   * Optional unified branching collections for this view.
   *
   * This mirrors the structural contract of ComputedDynamicView.branchCollections,
   * restricted to the fields needed by walkthrough/navigation.
   */
  readonly branchCollections?: readonly {
    readonly branchId: string
    readonly kind: 'alternate' | 'parallel'
    /**
     * Step at which this branch decision is introduced.
     * Optional structurally here; when provided it should be present in stepIds.
     */
    readonly decisionStepId?: string
    readonly paths: readonly {
      readonly pathId: string
      readonly pathIndex: number
      readonly isDefaultPath?: boolean
      readonly pathTitle?: string
      readonly stepIds: readonly string[]
    }[]
  }[]

  /**
   * Optional mapping from stepId to layout/XY metadata (e.g. for overlays).
   * Walkthrough core MUST NOT depend on any XYFlow-specific types.
   */
  readonly stepMetaById?: Readonly<Record<string, unknown>>
}

/**
 * Internal walkthrough state.
 *
 * This is kept minimal and serializable.
 */
export interface WalkthroughStateActive {
  /**
   * Current step in the linear order / within a branch path.
   */
  readonly stepId: string
  /**
   * When inside a branch path, identifies the selected branch/path.
   */
  readonly branch?: WalkthroughBranchPathRef
}

/**
 * Internal walkthrough state.
 *
 * This is kept minimal and serializable.
 */
export interface WalkthroughState {
  /**
   * Current active position, if any.
   */
  readonly active?: WalkthroughStateActive

  /**
   * Completed step ids.
   *
   * Represented as a Set at runtime for efficient lookups. When serialized,
   * consumers may map to arrays.
   */
  readonly completedSteps: ReadonlySet<string>

  /**
   * Completed paths `(branchId:pathId)`.
   *
   * This is derived via helpers, but we store it explicitly here to keep the
   * machine/state transitions simple and deterministic.
   */
  readonly completedPaths: ReadonlySet<string>
}

/**
 * Walkthrough events.
 *
 * These are framework-agnostic and can be fed into any state machine
 * implementation (XState, Redux, custom, etc.).
 */
export type WalkthroughEvent =
  | {
    type: 'START'
    /**
     * Optional explicit starting stepId. When omitted, consumers use the
     * first step from buildLinearOrder(input).
     */
    stepId?: string
  }
  | {
    type: 'STOP'
  }
  | {
    type: 'NEXT'
  }
  | {
    type: 'PREVIOUS'
  }
  | {
    type: 'SELECT_BRANCH_PATH'
    readonly branchId: string
    readonly pathId: string
  }
  | {
    type: 'MARK_COMPLETE'
    readonly stepId: string
  }
  | {
    type: 'RESET_COMPLETION'
  }
  | {
    type: 'SYNC_FROM_URL'
    /**
     * Encoded walkthrough position (see url-state.ts).
     */
    readonly encoded: string
  }
  | {
    type: 'UPDATE_FROM_INPUT'
    /**
     * Replace walkthrough input and recompute any derived structures.
     */
    readonly input: WalkthroughContextInput
  }

/**
 * Convenience tuple-like identifier for a branch path.
 */
export type BranchPathKey = `${string}:${string}`

/**
 * Build an immutable WalkthroughState with defensive copying of sets.
 */
export function createWalkthroughState(params?: {
  active?: WalkthroughStateActive
  completedSteps?: Iterable<string>
  completedPaths?: Iterable<string>
}): WalkthroughState {
  const active = params?.active
    ? {
      stepId: params.active.stepId,
      ...(params.active.branch
        ? {
          branch: {
            branchId: params.active.branch.branchId,
            pathId: params.active.branch.pathId,
          },
        }
        : {}),
    }
    : undefined

  return {
    ...(active ? { active } : {}),
    completedSteps: new Set(params?.completedSteps ?? []),
    completedPaths: new Set(params?.completedPaths ?? []),
  }
}

/**
 * Canonical key for a branch path for storage in completedPaths.
 */
export function toBranchPathKey(ref: WalkthroughBranchPathRef): BranchPathKey {
  return `${ref.branchId}:${ref.pathId}`
}
