import type {
  AnyAux,
  ComputedBranchCollection,
  ComputedBranchCollectionPath,
  ComputedBranchTrailEntry,
  scalar,
  StepEdgeId,
} from '../../types'
import { exact } from '../../types'
import type { BranchCollectionAccumulator, BranchStackEntry } from './types'

/**
 * Manages the branch stack and accumulates branch collection metadata.
 *
 * Responsibilities:
 * - Track current branch context via stack
 * - Accumulate edge IDs for each path
 * - Generate branch trails for steps
 * - Finalize branch collections for output
 *
 * ## Usage Example
 *
 * ```typescript
 * const manager = new BranchStackManager<MyAux>()
 *
 * // Push a branch entry onto the stack
 * manager.push({
 *   branch: parallelBranch,
 *   path: successPath,
 *   pathIndex: 1,
 *   stepCounter: 0
 * })
 *
 * // Register a step in the current context
 * manager.registerStep('step-01.01.01')
 *
 * // Get branch trail for metadata
 * const trail = manager.buildTrail()
 *
 * // Pop when done with this path
 * manager.pop()
 *
 * // Get final computed collections
 * const collections = manager.finalize()
 * ```
 */
export class BranchStackManager<A extends AnyAux> {
  /** Current branch processing stack (tracks nesting) */
  private stack: BranchStackEntry<A>[] = []

  /** Accumulated branch collections and their paths */
  private collections = new Map<string, BranchCollectionAccumulator<A>>()

  /**
   * Push a branch entry onto the stack.
   *
   * Call this when entering a new path in a branch collection.
   * The entry will be used to track context for steps processed
   * within this path.
   *
   * @param entry - The branch stack entry to push
   */
  push(entry: BranchStackEntry<A>): void {
    this.ensureBranchPath(entry)
    this.stack.push(entry)
  }

  /**
   * Pop the top branch entry from the stack.
   *
   * Call this when exiting a path.
   *
   * @returns The popped entry, or undefined if stack is empty
   */
  pop(): BranchStackEntry<A> | undefined {
    return this.stack.pop()
  }

  /**
   * Get the current stack (read-only).
   *
   * @returns The current branch stack
   */
  getStack(): readonly BranchStackEntry<A>[] {
    return this.stack
  }

  /**
   * Get the current stack depth.
   *
   * @returns The number of nested branches currently on the stack
   */
  getDepth(): number {
    return this.stack.length
  }

  /**
   * Register a step with all branches in the current stack.
   *
   * This associates the step's edge ID with every path in the
   * current branch context, so the final computed branch collections
   * know which edges belong to which paths.
   *
   * @param id - The step edge ID to register
   */
  registerStep(id: StepEdgeId): void {
    for (const entry of this.stack) {
      const acc = this.ensureBranchCollection(entry.branch)
      const pathAcc = acc.paths.get(entry.path.pathId)
      if (pathAcc) {
        pathAcc.edgeIds.push(id as unknown as scalar.EdgeId)
      }
    }
  }

  /**
   * Increment the step counter for all entries in the stack.
   *
   * Call this after processing each step to maintain accurate
   * `indexWithinPath` values for branch trails.
   */
  incrementStepCounters(): void {
    for (const entry of this.stack) {
      entry.stepCounter++
    }
  }

  /**
   * Build a branch trail for the current stack state.
   *
   * The trail captures the full lineage of nested branches for a step,
   * used in the computed edge metadata.
   *
   * @returns An array of branch trail entries, or undefined if stack is empty
   */
  buildTrail(): ComputedBranchTrailEntry<A>[] | undefined {
    if (this.stack.length === 0) {
      return undefined
    }

    return this.stack.map(entry =>
      exact({
        branchId: entry.branch.branchId,
        pathId: entry.path.pathId,
        kind: entry.branch.kind,
        pathIndex: entry.pathIndex,
        indexWithinPath: entry.stepCounter + 1, // 1-based for display
        pathName: entry.path.pathName,
        pathTitle: entry.path.pathTitle ?? null,
        isDefaultPath: entry.branch.defaultPathId === entry.path.pathId,
      })
    )
  }

  /**
   * Finalize and return all collected branch collections.
   *
   * Call this after processing all steps to get the final
   * computed branch collection metadata.
   *
   * @returns Array of computed branch collections with sorted paths
   */
  finalize(): ComputedBranchCollection<A>[] {
    return [...this.collections.values()].map(acc => {
      const paths: ComputedBranchCollectionPath<A>[] = [...acc.paths.values()]
        .sort((a, b) => a.pathIndex - b.pathIndex)
        .map(pathAcc => {
          const path: ComputedBranchCollectionPath<A> = {
            pathId: pathAcc.path.pathId,
            pathIndex: pathAcc.pathIndex,
            pathTitle: pathAcc.path.pathTitle ?? null,
            edgeIds: [...pathAcc.edgeIds],
            isDefaultPath: acc.branch.defaultPathId === pathAcc.path.pathId,
          }

          // Add optional fields only if present
          if (pathAcc.path.pathName !== undefined) {
            path.pathName = pathAcc.path.pathName
          }
          if (pathAcc.path.description !== undefined) {
            path.description = pathAcc.path.description
          }
          if (pathAcc.path.tags) {
            path.tags = pathAcc.path.tags
          }

          return path
        })

      const collection: ComputedBranchCollection<A> = {
        branchId: acc.branch.branchId,
        astPath: acc.branch.astPath,
        kind: acc.branch.kind,
        paths,
      }

      // Add optional fields only if present
      if (acc.branch.label !== undefined) {
        collection.label = acc.branch.label
      }
      if (acc.branch.defaultPathId !== undefined) {
        collection.defaultPathId = acc.branch.defaultPathId
      }

      return collection
    })
  }

  /**
   * Ensure a branch collection exists in the accumulator map.
   *
   * @param branch - The branch to ensure exists
   * @returns The branch collection accumulator
   * @private
   */
  private ensureBranchCollection(branch: BranchStackEntry<A>['branch']): BranchCollectionAccumulator<A> {
    let acc = this.collections.get(branch.branchId)
    if (!acc) {
      acc = {
        branch,
        paths: new Map(),
      }
      this.collections.set(branch.branchId, acc)
    }
    return acc
  }

  /**
   * Ensure a path exists in its branch collection accumulator.
   *
   * @param entry - The branch stack entry containing the path
   * @private
   */
  private ensureBranchPath(entry: BranchStackEntry<A>): void {
    const acc = this.ensureBranchCollection(entry.branch)
    if (!acc.paths.has(entry.path.pathId)) {
      acc.paths.set(entry.path.pathId, {
        path: entry.path,
        pathIndex: entry.pathIndex,
        edgeIds: [],
      })
    }
  }
}
