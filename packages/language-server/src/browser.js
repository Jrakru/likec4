import { configureLogger, getAnsiColorFormatter, getConsoleSink } from '@likec4/log';
import { startLanguageServer as startLanguim } from 'langium/lsp';
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from 'vscode-languageserver/browser';
import { createLanguageServices } from './module';
export { logger as lspLogger } from './logger';
export { createLanguageServices } from './module';
export function startLanguageServer(port) {
    /* browser specific setup code */
    const messageReader = new BrowserMessageReader(port);
    const messageWriter = new BrowserMessageWriter(port);
    const connection = createConnection(messageReader, messageWriter);
    configureLogger({
        sinks: {
            console: getConsoleSink({
                formatter: getAnsiColorFormatter({
                    format: ({ level, category, message }) => {
                        return `${level} ${category} ${message}`;
                    },
                }),
            }),
        },
        loggers: [
            {
                category: 'likec4',
                sinks: ['console'],
                lowestLevel: 'debug',
            },
        ],
    });
    // Inject the shared services and language-specific services
    const services = createLanguageServices({ connection });
    // Start the language server with the shared services
    startLanguim(services.shared);
    return services;
}
