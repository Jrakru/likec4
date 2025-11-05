import type { AstNode } from 'langium';
import { type SemanticTokenAcceptor, AbstractSemanticTokenProvider } from 'langium/lsp';
import type { LikeC4Services } from '../module';
export declare class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
    private rules;
    constructor(services: LikeC4Services);
    protected initRules(): void;
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | undefined | 'prune';
    private highlightNameAndKind;
    private highlightView;
    private mark;
}
