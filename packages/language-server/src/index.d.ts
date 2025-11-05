import { NoopFileSystem } from './filesystem';
import { LikeC4FileSystem } from './filesystem/LikeC4FileSystem';
import { WithMCPServer } from './mcp/server/WithMCPServer';
import { type LikeC4Services, type LikeC4SharedServices } from './module';
export { getLspConnectionSink, logger as lspLogger } from './logger';
export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model';
export type { LikeC4LanguageServices } from './LikeC4LanguageServices';
export { isLikeC4Builtin } from './likec4lib';
export { createLanguageServices } from './module';
export type { LikeC4Services, LikeC4SharedServices } from './module';
export type { LikeC4Views } from './views';
export type { ProjectsManager } from './workspace';
export { LikeC4FileSystem, NoopFileSystem, WithMCPServer };
type StartLanguageServerOptions = {
    /**
     * Whether to enable the file system watcher.
     * @default true
     */
    enableWatcher?: boolean;
    /**
     * Whether to enable the MCP server.
     * @default 'sse'
     */
    enableMCP?: false | 'sse' | 'stdio';
};
export declare function startLanguageServer(options?: StartLanguageServerOptions): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
