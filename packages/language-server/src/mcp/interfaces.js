import { NoopLikeC4MCPServer } from './NoopLikeC4MCPServer';
export const NoMCPServer = {
    mcpServer: () => new NoopLikeC4MCPServer(),
};
