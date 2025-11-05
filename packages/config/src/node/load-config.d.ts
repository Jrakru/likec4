import type { URI } from 'vscode-uri';
import { type LikeC4ProjectConfig } from '../schema';
/**
 * Load LikeC4 Project config file.
 * If filepath is a non-JSON file, it will be bundled and required
 */
export declare function loadConfig(filepath: URI): Promise<LikeC4ProjectConfig>;
//# sourceMappingURL=load-config.d.ts.map