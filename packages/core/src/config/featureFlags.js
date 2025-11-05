import { isTruthy } from 'remeda';
// Check both LIKEC4_UNIFIED_BRANCHES (preferred) and LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES (legacy)
// for backward compatibility during migration period.
// LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES will be removed in a future version.
const dynamicBranchCollectionsEnv = typeof process !== 'undefined' && process.env
    ? process.env['LIKEC4_UNIFIED_BRANCHES'] ?? process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
    : undefined;
const initialState = {
    dynamicBranchCollections: isTruthy(dynamicBranchCollectionsEnv)
        ? /^[ty1]/i.test(dynamicBranchCollectionsEnv)
        : false,
};
const mutableState = { ...initialState };
export const featureFlags = new Proxy(mutableState, {
    get(target, prop) {
        return target[prop];
    },
});
/**
 * Determine if a named feature flag is enabled.
 *
 * @param flag - The feature flag to query
 * @returns `true` if the specified feature flag is enabled, `false` otherwise.
 */
export function isFeatureEnabled(flag) {
    return featureFlags[flag];
}
/**
 * Checks if dynamic branch collections are enabled.
 *
 * @returns `true` if dynamic branch collections are enabled, `false` otherwise.
 */
export function isDynamicBranchCollectionsEnabled() {
    return featureFlags.dynamicBranchCollections;
}
/**
 * Set the runtime value of a feature flag.
 *
 * Mutates the module's runtime feature flag state for the specified flag.
 *
 * @param flag - The feature flag name to update
 * @param enabled - `true` to enable the flag, `false` to disable it
 */
export function setFeatureFlag(flag, enabled) {
    mutableState[flag] = enabled;
}
/**
 * Enable the dynamicBranchCollections feature flag for the current process.
 */
export function enableDynamicBranchCollections() {
    setFeatureFlag('dynamicBranchCollections', true);
}
/**
 * Disables the dynamicBranchCollections feature flag for subsequent checks.
 */
export function disableDynamicBranchCollections() {
    setFeatureFlag('dynamicBranchCollections', false);
}
