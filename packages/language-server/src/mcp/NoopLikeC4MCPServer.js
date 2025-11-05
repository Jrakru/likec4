export class NoopLikeC4MCPServer {
    get mcp() {
        throw new Error('NoopLikeC4MCPServer does not have a McpServer');
    }
    get isStarted() {
        return false;
    }
    get port() {
        return NaN;
    }
    start() {
        return Promise.resolve();
    }
    stop() {
        return Promise.resolve();
    }
}
