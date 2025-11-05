import { isArray } from 'remeda';
import { isStepEdgeId } from './scalar';
// Get the prefix of the parallel steps
/**
 * Extracts the prefix of a parallel step edge ID up to and including the first dot.
 *
 * @param id - The step edge identifier to examine (for example, `step-01.1`)
 * @returns The prefix including the first dot (for example, `step-01.`), or `null` if `id` is not a step edge ID containing a dot
 */
export function getParallelStepsPrefix(id) {
    if (isStepEdgeId(id) && id.includes('.')) {
        return id.slice(0, id.indexOf('.') + 1);
    }
    return null;
}
/**
 * Determine whether a dynamic view entry represents a single step (not a series or a branch).
 *
 * @param step - The dynamic view item to test
 * @returns `true` if `step` is a `DynamicStep`, `false` otherwise.
 */
export function isDynamicStep(step) {
    return (!!step &&
        !('__series' in step) &&
        !('paths' in step));
}
/**
 * Determines whether a dynamic view step represents a parallel branch that exposes a `__parallel` array.
 *
 * @returns `true` if `step` is a parallel branch with a `__parallel` array, `false` otherwise.
 */
export function isDynamicStepsParallel(step) {
    return (!!step
        && isDynamicBranchCollection(step)
        && step.kind === 'parallel'
        && isArray(step.__parallel));
}
/**
 * Determines whether the provided dynamic view step represents a series of steps.
 *
 * @param step - The dynamic view step (or undefined) to check
 * @returns `true` if the step is a `DynamicStepsSeries`, `false` otherwise
 */
export function isDynamicStepsSeries(step) {
    return !!step && '__series' in step && isArray(step.__series);
}
/**
 * Determines whether a dynamic view step represents a branch collection.
 *
 * @param step - The dynamic view step to test
 * @returns `true` if `step` is a `DynamicBranchCollection`, `false` otherwise.
 */
export function isDynamicBranchCollection(step) {
    return !!step && 'paths' in step && isArray(step.paths);
}
/**
 * Determine whether a value represents a branch path in a dynamic view.
 *
 * @param item - The branch entry or path to test
 * @returns `true` if `item` has `pathId` and `steps` and is a `DynamicBranchPath`, `false` otherwise.
 */
export function isDynamicBranchPath(item) {
    return !!item && 'steps' in item && 'pathId' in item;
}
/**
 * Return a branch in legacy parallel format when the branch contains a populated `__parallel` array.
 *
 * Used for backward compatibility; does not transform or synthesize parallel data.
 *
 * @returns The branch as `DynamicStepsParallel<A>` if `__parallel` exists and has at least one entry, `null` otherwise.
 */
export function toLegacyParallel(step) {
    if (isDynamicStepsParallel(step)) {
        const parallel = step;
        if (isArray(parallel.__parallel) && parallel.__parallel.length > 0) {
            return parallel;
        }
    }
    return null;
}
