import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { LikeC4Services } from '../module';
export declare class LikeC4MCPServerFactory {
    private services;
    constructor(services: LikeC4Services);
    create(options?: ServerOptions): McpServer;
}
