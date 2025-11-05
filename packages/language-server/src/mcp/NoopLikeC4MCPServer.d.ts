import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LikeC4MCPServer } from './interfaces';
export declare class NoopLikeC4MCPServer implements LikeC4MCPServer {
    get mcp(): McpServer;
    get isStarted(): boolean;
    get port(): number;
    start(): Promise<void>;
    stop(): Promise<void>;
}
