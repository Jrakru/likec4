import { type LikeC4Services, type LikeC4SharedServices } from './module';
export { logger as lspLogger } from './logger';
export type { DocumentParser, LikeC4ModelBuilder, LikeC4ModelLocator, LikeC4ModelParser } from './model';
export type { LikeC4LanguageServices } from './LikeC4LanguageServices';
export { createLanguageServices } from './module';
export type { LikeC4Services, LikeC4SharedServices } from './module';
export type { LikeC4Views } from './views';
export declare function startLanguageServer(port: MessagePort | DedicatedWorkerGlobalScope): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
