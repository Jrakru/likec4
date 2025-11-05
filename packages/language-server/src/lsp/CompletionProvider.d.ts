import { type GrammarAST, type MaybePromise } from 'langium';
import { type CompletionAcceptor, type CompletionContext, DefaultCompletionProvider } from 'langium/lsp';
import type { LikeC4Services } from '../module';
export declare class LikeC4CompletionProvider extends DefaultCompletionProvider {
    protected services: LikeC4Services;
    constructor(services: LikeC4Services);
    readonly completionOptions: CompletionProviderOptions;
    protected completionForKeyword(context: CompletionContext, keyword: GrammarAST.Keyword, acceptor: CompletionAcceptor): MaybePromise<void>;
}
