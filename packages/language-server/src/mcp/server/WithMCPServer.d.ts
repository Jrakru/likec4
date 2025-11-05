import type { LikeC4MCPServerModuleContext } from '../interfaces';
export declare const WithMCPServer: (type?: "stdio" | "sse" | {
    port: number;
}) => LikeC4MCPServerModuleContext;
