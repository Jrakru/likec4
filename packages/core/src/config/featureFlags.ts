/**
 * Centralized LikeC4 feature flags for experimental / opt-in behaviour.
 *
 * All new branching + walkthrough behaviour MUST:
 * - Be guarded by these flags
 * - Preserve legacy behaviour when disabled
 *
 * Flags are intentionally simple runtime booleans so they can be
 * configured by host applications (Node, VSCode, web, tests).
 */

export interface LikeC4FeatureFlags {
  /**
   * Unified branching contracts for dynamic views.
   *
   * When enabled:
   * - compute-view may emit well-typed branchCollections for dynamic views
   * - layouts / diagram / walkthrough modules can consume these contracts
   *
   * When disabled:
   * - No branchCollections are exposed
   * - Output remains identical to existing pre-branching behaviour
   */
  unifiedBranching: boolean

  /**
   * Walkthrough state machine + hooks built on top of branch contracts.
   *
   * When enabled:
   * - diagram-machine may spawn the standalone walkthrough child machine
   *   for dynamic views with branchCollections
   *
   * When disabled:
   * - Existing linear walkthrough behaviour is preserved
   */
  walkthrough: boolean
}

/**
 * Default flag values.
 *
 * IMPORTANT:
 * - Defaults are conservative (off) to guarantee backward compatibility.
 * - Callers can override via `createLikeC4FeatureFlags`.
 */
const defaultFlags: LikeC4FeatureFlags = {
  unifiedBranching: false,
  walkthrough: false,
}

/**
 * Create a concrete feature flag bag from:
 * - explicit overrides
 * - environment variables (if wired by host)
 *
 * This stays minimal here; env / config layering is handled by callers.
 */
export function createLikeC4FeatureFlags(
  overrides?: Partial<LikeC4FeatureFlags>,
): LikeC4FeatureFlags {
  return {
    ...defaultFlags,
    ...overrides,
  }
}

/**
 * Singleton-style flags used by core when no explicit flags are provided.
 * Libraries embedding LikeC4 are expected to provide their own instance instead
 * of mutating this directly.
 */
let globalFlags: LikeC4FeatureFlags = defaultFlags

export function setLikeC4FeatureFlags(flags: Partial<LikeC4FeatureFlags>): void {
  globalFlags = {
    ...globalFlags,
    ...flags,
  }
}

export function getLikeC4FeatureFlags(): LikeC4FeatureFlags {
  return globalFlags
}
