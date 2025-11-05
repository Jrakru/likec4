declare const configJsonFilenames: readonly [".likec4rc", ".likec4.config.json", "likec4.config.json"];
declare const configNonJsonFilenames: readonly ["likec4.config.js", "likec4.config.mjs", "likec4.config.ts", "likec4.config.mts"];
export declare const ConfigFilenames: readonly [".likec4rc", ".likec4.config.json", "likec4.config.json", "likec4.config.js", "likec4.config.mjs", "likec4.config.ts", "likec4.config.mts"];
/**
 * Checks if the given filename is a LikeC4 JSON config file (JSON, RC).
 */
export declare function isLikeC4JsonConfig(filename: string): filename is typeof configJsonFilenames[number];
/**
 * Checks if the given filename is a LikeC4 non-JSON config file (JS, MJS, TS, MTS)
 */
export declare function isLikeC4NonJsonConfig(filename: string): filename is typeof configNonJsonFilenames[number];
/**
 * Checks if the given filename is a LikeC4 config file (JSON or non-JSON)
 */
export declare function isLikeC4Config(filename: string): filename is typeof ConfigFilenames[number];
export {};
//# sourceMappingURL=filenames.d.ts.map