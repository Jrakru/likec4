import { flatMap } from 'remeda'
import type { AnyAux, DynamicStep, DynamicViewStep } from '../../types'
import { isDynamicBranchCollection, isDynamicStep, isDynamicStepsSeries, toLegacyParallel } from '../../types'
import type { LegacyParallelStep } from './types'

/**
 * Visitor for traversing and flattening dynamic view steps.
 *
 * Implements the Visitor pattern to process different step types
 * (single steps, series, branches, legacy parallel) and flatten
 * them into an array of individual DynamicStep objects.
 *
 * ## Usage Example
 *
 * ```typescript
 * const visitor = new StepFlattener<MyAux>()
 *
 * const steps: DynamicViewStep[] = [
 *   singleStep,
 *   { __series: [step1, step2, step3] },
 *   { kind: 'parallel', paths: [...] }
 * ]
 *
 * const flattened = steps.flatMap(step => visitor.visit(step))
 * // => [singleStep, step1, step2, step3, ...pathSteps]
 * ```
 */
export class StepFlattener<A extends AnyAux> {
  /**
   * Visit a dynamic view step and flatten it to individual steps.
   *
   * This is the main entry point for the visitor. It dispatches
   * to the appropriate visit method based on the step type.
   *
   * @param step - The step to flatten
   * @returns An array of flattened individual steps
   */
  visit(step: DynamicViewStep<A>): DynamicStep<A>[] {
    // Check for legacy parallel first (takes precedence)
    const legacyParallel = toLegacyParallel(step)
    if (legacyParallel) {
      return this.visitLegacyParallel(legacyParallel)
    }

    // Check for new branch collection
    if (isDynamicBranchCollection(step)) {
      return this.visitBranch(step)
    }

    // Check for series
    if (isDynamicStepsSeries(step)) {
      return this.visitSeries(step)
    }

    // Check for single step
    if (isDynamicStep(step)) {
      return this.visitStep(step)
    }

    // Unknown type, return empty array
    return []
  }

  /**
   * Visit a single step.
   *
   * @param step - The single step
   * @returns An array containing the single step
   */
  private visitStep(step: DynamicStep<A>): DynamicStep<A>[] {
    return [step]
  }

  /**
   * Visit a series of steps.
   *
   * Series represent chained steps like `A -> B -> C`,
   * which are expanded into individual steps.
   *
   * @param series - The series to flatten
   * @returns An array of individual steps from the series
   */
  private visitSeries(series: { __series: readonly DynamicStep<A>[] }): DynamicStep<A>[] {
    return [...series.__series]
  }

  /**
   * Visit a branch collection (parallel or alternate).
   *
   * Flattens all steps from all paths in the branch collection.
   *
   * @param branch - The branch collection to flatten
   * @returns An array of all steps from all paths
   */
  private visitBranch(branch: { paths: readonly { steps: readonly any[] }[] }): DynamicStep<A>[] {
    return flatMap(
      branch.paths,
      path =>
        flatMap(
          path.steps,
          entry => this.visit(entry as DynamicViewStep<A>),
        ),
    )
  }

  /**
   * Visit a legacy parallel block.
   *
   * Legacy parallel blocks have special flattening logic:
   * - Take the first step of each parallel branch (heads)
   * - Then take remaining steps from series (tails)
   *
   * This preserves visual ordering in sequence diagrams.
   *
   * @param parallel - The legacy parallel block
   * @returns An array of flattened steps with heads before tails
   *
   * @example
   * ```typescript
   * // Input: parallel { A -> B -> C, X -> Y }
   * // Output: [A, X, B, C, Y]
   * //         ^heads^  ^tails^
   * ```
   */
  private visitLegacyParallel(
    parallel: LegacyParallelStep<A>,
  ): DynamicStep<A>[] {
    const heads: DynamicStep<A>[] = []
    const tails: DynamicStep<A>[] = []

    for (const step of parallel.__parallel ?? []) {
      if (isDynamicStepsSeries(step)) {
        const [head, ...tail] = step.__series
        heads.push(head)
        tails.push(...tail)
      } else {
        heads.push(step)
      }
    }

    return [...heads, ...tails]
  }
}

/**
 * Flatten a dynamic view step into individual steps.
 *
 * Convenience function that creates a visitor and flattens a single step.
 * Use this for simple one-off flattening operations.
 *
 * @param step - The step to flatten
 * @returns An array of flattened individual steps
 *
 * @example
 * ```typescript
 * const series = { __series: [step1, step2, step3] }
 * const flattened = flattenSteps(series)
 * // => [step1, step2, step3]
 * ```
 */
export function flattenSteps<A extends AnyAux>(step: DynamicViewStep<A>): DynamicStep<A>[] {
  const visitor = new StepFlattener<A>()
  return visitor.visit(step)
}
