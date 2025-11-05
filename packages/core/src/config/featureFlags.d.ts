type FeatureFlagState = {
    dynamicBranchCollections: boolean;
};
type FeatureFlagName = keyof FeatureFlagState;
export declare const featureFlags: FeatureFlagState;
/**
 * Determine if a named feature flag is enabled.
 *
 * @param flag - The feature flag to query
 * @returns `true` if the specified feature flag is enabled, `false` otherwise.
 */
export declare function isFeatureEnabled(flag: FeatureFlagName): boolean;
/**
 * Checks if dynamic branch collections are enabled.
 *
 * @returns `true` if dynamic branch collections are enabled, `false` otherwise.
 */
export declare function isDynamicBranchCollectionsEnabled(): boolean;
/**
 * Set the runtime value of a feature flag.
 *
 * Mutates the module's runtime feature flag state for the specified flag.
 *
 * @param flag - The feature flag name to update
 * @param enabled - `true` to enable the flag, `false` to disable it
 */
export declare function setFeatureFlag(flag: FeatureFlagName, enabled: boolean): void;
/**
 * Enable the dynamicBranchCollections feature flag for the current process.
 */
export declare function enableDynamicBranchCollections(): void;
/**
 * Disables the dynamicBranchCollections feature flag for subsequent checks.
 */
export declare function disableDynamicBranchCollections(): void;
export {};
//# sourceMappingURL=featureFlags.d.ts.map