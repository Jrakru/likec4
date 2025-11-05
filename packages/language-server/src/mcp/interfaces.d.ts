import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LikeC4Services } from '../module';
export interface LikeC4MCPServer {
    readonly mcp: McpServer;
    readonly isStarted: boolean;
    readonly port: number;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
}
export interface LikeC4MCPServerModuleContext {
    mcpServer: (services: LikeC4Services) => LikeC4MCPServer;
}
export declare const NoMCPServer: LikeC4MCPServerModuleContext;
