import { isTruthy } from 'remeda'

type FeatureFlagState = {
  dynamicBranchCollections: boolean
}

type FeatureFlagName = keyof FeatureFlagState

// Check both LIKEC4_UNIFIED_BRANCHES (preferred) and LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES (legacy)
// for backward compatibility during migration period.
// LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES will be removed in a future version.
const dynamicBranchCollectionsEnv = typeof process !== 'undefined' && process.env
  ? process.env['LIKEC4_UNIFIED_BRANCHES'] ?? process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
  : undefined

const initialState: FeatureFlagState = {
  dynamicBranchCollections: isTruthy(dynamicBranchCollectionsEnv)
    ? /^[ty1]/i.test(dynamicBranchCollectionsEnv)
    : false,
}

const mutableState: FeatureFlagState = { ...initialState }

export const featureFlags: FeatureFlagState = new Proxy(mutableState, {
  get(target, prop: FeatureFlagName) {
    return target[prop]
  },
}) as FeatureFlagState

/**
 * Determine if a named feature flag is enabled.
 *
 * @param flag - The feature flag to query
 * @returns `true` if the specified feature flag is enabled, `false` otherwise.
 */
export function isFeatureEnabled(flag: FeatureFlagName): boolean {
  return featureFlags[flag]
}

/**
 * Checks if dynamic branch collections are enabled.
 *
 * @returns `true` if dynamic branch collections are enabled, `false` otherwise.
 */
export function isDynamicBranchCollectionsEnabled(): boolean {
  return featureFlags.dynamicBranchCollections
}

/**
 * Set the runtime value of a feature flag.
 *
 * Mutates the module's runtime feature flag state for the specified flag.
 *
 * @param flag - The feature flag name to update
 * @param enabled - `true` to enable the flag, `false` to disable it
 */
export function setFeatureFlag(flag: FeatureFlagName, enabled: boolean): void {
  mutableState[flag] = enabled
}

/**
 * Enable the dynamicBranchCollections feature flag for the current process.
 */
export function enableDynamicBranchCollections(): void {
  setFeatureFlag('dynamicBranchCollections', true)
}

/**
 * Disables the dynamicBranchCollections feature flag for subsequent checks.
 */
export function disableDynamicBranchCollections(): void {
  setFeatureFlag('dynamicBranchCollections', false)
}

/**
 * Check if dynamic branch collections are enabled for a specific model.
 *
 * Precedence order:
 * 1. Programmatic feature flag (for tests and runtime control) - overrides all
 * 2. Project configuration (experimental.dynamicBranchCollections) - overrides env
 * 3. Environment variable at initialization (LIKEC4_UNIFIED_BRANCHES or legacy LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES)
 *
 * Note: Environment variables are read once at module initialization and stored in featureFlags.
 * The programmatic flag can override this at runtime via setFeatureFlag().
 *
 * @param projectConfig - Optional project experimental configuration
 * @returns `true` if dynamic branch collections are enabled, `false` otherwise
 */
export function isDynamicBranchCollectionsEnabledForProject(
  projectConfig?: { dynamicBranchCollections?: boolean },
): boolean {
  // 1. Programmatic flag (set via setFeatureFlag) overrides everything
  const programmaticEnabled = isDynamicBranchCollectionsEnabled()
  if (programmaticEnabled) {
    return true
  }

  // 2. Project config overrides environment variable
  if (projectConfig?.dynamicBranchCollections !== undefined) {
    return projectConfig.dynamicBranchCollections
  }

  // 3. Fall back to initialization-time value (env var or false)
  return featureFlags.dynamicBranchCollections
}
