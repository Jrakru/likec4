import type { AnyAux } from '../../types'
import { type StepEdgeId, stepEdgeId, stepEdgePath } from '../../types'
import type { BranchStackEntry } from './types'

/**
 * Generates step edge identifiers for dynamic views.
 *
 * Handles both simple sequential IDs (step-01, step-02) and hierarchical
 * IDs for nested branches (step-01.01.01, step-01.02.01).
 *
 * ## Examples
 *
 * ```typescript
 * const generator = new StepIdGenerator()
 *
 * // Simple root-level step
 * generator.buildStepId(1)
 * // => 'step-01'
 *
 * // Legacy parallel step (step within parallel block)
 * generator.buildLegacyParallelStepId(1, 2)
 * // => 'step-01.2'
 *
 * // Nested branch step with stack
 * const stack: BranchStackEntry[] = [
 *   { pathIndex: 1, stepCounter: 0, ... },
 *   { pathIndex: 2, stepCounter: 0, ... }
 * ]
 * generator.buildStepId(1, stack)
 * // => 'step-01.01.02.01'
 * //    ^ root  ^ path1  ^ path2  ^ step within innermost path
 * ```
 */
export class StepIdGenerator<A extends AnyAux> {
  /**
   * Build a step ID for a root-level step or nested branch step.
   *
   * @param rootIndex - The root step index (1-based)
   * @param branchStack - Optional stack of branch entries for nested branches
   * @returns A formatted step edge ID
   *
   * @example
   * // Root-level step
   * buildStepId(1) // => 'step-01'
   *
   * @example
   * // Nested in two branches
   * const stack = [
   *   { pathIndex: 1, stepCounter: 0, ... },
   *   { pathIndex: 2, stepCounter: 3, ... }
   * ]
   * buildStepId(5, stack) // => 'step-05.01.02.04'
   * //                          ^ root ^ path1 ^ path2 ^ step (counter+1)
   */
  buildStepId(rootIndex: number, branchStack?: BranchStackEntry<A>[]): StepEdgeId {
    if (!branchStack || branchStack.length === 0) {
      return stepEdgePath([rootIndex])
    }

    const segments: number[] = [rootIndex]

    // Add path indices from each branch level
    for (const entry of branchStack) {
      segments.push(entry.pathIndex)
    }

    // Add the step counter from the innermost branch (+1 for 1-based indexing)
    const innermost = branchStack[branchStack.length - 1]!
    segments.push(innermost.stepCounter + 1)

    return stepEdgePath(segments as [number, ...number[]])
  }

  /**
   * Build a step ID for legacy parallel blocks.
   *
   * Legacy format uses a simpler two-level structure:
   * - `rootIndex`: The parallel block index
   * - `nestedIndex`: The step within the parallel block
   *
   * @param rootIndex - The parallel block index (1-based)
   * @param nestedIndex - The step index within the parallel block (1-based)
   * @returns A formatted step edge ID
   *
   * @example
   * buildLegacyParallelStepId(2, 3) // => 'step-02.3'
   */
  buildLegacyParallelStepId(rootIndex: number, nestedIndex: number): StepEdgeId {
    return stepEdgeId(rootIndex, nestedIndex)
  }
}
