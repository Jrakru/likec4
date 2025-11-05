import { type LikeC4Services, type LikeC4SharedServices } from './module';
/**
 * This is used as `bin` entry point to start the language server.
 */
export declare function startLanguageServer(): {
    shared: LikeC4SharedServices;
    likec4: LikeC4Services;
};
