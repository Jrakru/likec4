import { configureLogger, getConsoleSink, getTextFormatter } from '@likec4/log';
import { defu } from 'defu';
import { startLanguageServer as startLanguim } from 'langium/lsp';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { NoopFileSystem } from './filesystem';
import { LikeC4FileSystem } from './filesystem/LikeC4FileSystem';
import { getTelemetrySink, logger } from './logger';
import { WithMCPServer } from './mcp/server/WithMCPServer';
import { createLanguageServices } from './module';
import { ConfigurableLayouter } from './views/configurable-layouter';
export { getLspConnectionSink, logger as lspLogger } from './logger';
export { isLikeC4Builtin } from './likec4lib';
export { createLanguageServices } from './module';
export { LikeC4FileSystem, NoopFileSystem, WithMCPServer };
export function startLanguageServer(options) {
    const opts = defu(options, {
        enableWatcher: true,
        enableMCP: 'sse',
    });
    const connection = createConnection(ProposedFeatures.all);
    configureLogger({
        sinks: {
            console: getConsoleSink({
                formatter: getTextFormatter(),
            }),
            telemetry: getTelemetrySink(connection),
        },
        loggers: [
            {
                category: ['likec4'],
                sinks: ['console', 'telemetry'],
            },
        ],
    });
    logger.info('Starting LikeC4 language server');
    // Inject the shared services and language-specific services
    const services = createLanguageServices({
        connection,
        ...LikeC4FileSystem(opts.enableWatcher),
        ...opts.enableMCP && WithMCPServer(opts.enableMCP),
    }, {
        likec4: {
            ...ConfigurableLayouter.likec4,
        },
    });
    // Start the language server with the shared services
    startLanguim(services.shared);
    return services;
}
