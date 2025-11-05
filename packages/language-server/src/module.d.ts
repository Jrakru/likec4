import { QueueGraphvizLayoter } from '@likec4/layouts';
import { type Module, WorkspaceCache } from 'langium';
import { type DefaultSharedModuleContext, type LangiumServices, type LangiumSharedServices, type PartialLangiumServices } from 'langium/lsp';
import { LikeC4DocumentationProvider } from './documentation';
import { type FileSystemModuleContext, type FileSystemProvider, type FileSystemWatcher } from './filesystem';
import { type LikeC4LanguageServices } from './LikeC4LanguageServices';
import { LikeC4CodeLensProvider, LikeC4CompletionProvider, LikeC4DocumentHighlightProvider, LikeC4DocumentLinkProvider, LikeC4DocumentSymbolProvider, LikeC4HoverProvider, LikeC4SemanticTokenProvider } from './lsp';
import { type LikeC4MCPServer, type LikeC4MCPServerModuleContext } from './mcp/interfaces';
import { LikeC4MCPServerFactory } from './mcp/MCPServerFactory';
import { type LikeC4ModelBuilder, DeploymentsIndex, FqnIndex, LikeC4ModelLocator, LikeC4ModelParser, LikeC4ValueConverter } from './model';
import { LikeC4ModelChanges } from './model-change/ModelChanges';
import { LikeC4NameProvider, LikeC4ScopeComputation, LikeC4ScopeProvider } from './references';
import { Rpc } from './Rpc';
import { NodeKindProvider, WorkspaceSymbolProvider } from './shared';
import { LikeC4DocumentValidator } from './validation';
import { type LikeC4Views } from './views';
import { IndexManager, LangiumDocuments, LikeC4WorkspaceManager, ProjectsManager } from './workspace';
export type LanguageServicesContext = Omit<DefaultSharedModuleContext, 'fileSystemProvider'> & FileSystemModuleContext & LikeC4MCPServerModuleContext;
interface LikeC4AddedSharedServices {
    lsp: {
        NodeKindProvider: NodeKindProvider;
        WorkspaceSymbolProvider: WorkspaceSymbolProvider;
    };
    workspace: {
        ProjectsManager: ProjectsManager;
        IndexManager: IndexManager;
        LangiumDocuments: LangiumDocuments;
        WorkspaceManager: LikeC4WorkspaceManager;
        FileSystemProvider: FileSystemProvider;
        FileSystemWatcher: FileSystemWatcher;
    };
}
export type LikeC4SharedServices = LangiumSharedServices & LikeC4AddedSharedServices;
/**
 * Declaration of custom services - add your own service classes here.
 */
export interface LikeC4AddedServices {
    documentation: {
        DocumentationProvider: LikeC4DocumentationProvider;
    };
    ValidatedWorkspaceCache: WorkspaceCache<string, any>;
    validation: {
        DocumentValidator: LikeC4DocumentValidator;
    };
    Rpc: Rpc;
    mcp: {
        Server: LikeC4MCPServer;
        ServerFactory: LikeC4MCPServerFactory;
    };
    likec4: {
        LanguageServices: LikeC4LanguageServices;
        Views: LikeC4Views;
        Layouter: QueueGraphvizLayoter;
        DeploymentsIndex: DeploymentsIndex;
        FqnIndex: FqnIndex;
        ModelParser: LikeC4ModelParser;
        ModelBuilder: LikeC4ModelBuilder;
        ModelLocator: LikeC4ModelLocator;
        ModelChanges: LikeC4ModelChanges;
    };
    lsp: {
        CompletionProvider: LikeC4CompletionProvider;
        DocumentHighlightProvider: LikeC4DocumentHighlightProvider;
        DocumentSymbolProvider: LikeC4DocumentSymbolProvider;
        SemanticTokenProvider: LikeC4SemanticTokenProvider;
        HoverProvider: LikeC4HoverProvider;
        CodeLensProvider: LikeC4CodeLensProvider;
        DocumentLinkProvider: LikeC4DocumentLinkProvider;
    };
    references: {
        NameProvider: LikeC4NameProvider;
        ScopeComputation: LikeC4ScopeComputation;
        ScopeProvider: LikeC4ScopeProvider;
    };
    shared?: LikeC4SharedServices;
    parser: {
        ValueConverter: LikeC4ValueConverter;
    };
}
export type LikeC4Services = LangiumServices & LikeC4AddedServices;
export declare const createLikeC4Module: (context: LikeC4MCPServerModuleContext) => Module<LikeC4Services, PartialLangiumServices & LikeC4AddedServices>;
export declare function createLanguageServices<I1, I2, I3, I extends I1 & I2 & I3 & LikeC4Services>(context: Partial<LanguageServicesContext>, module?: Module<I, I1>, module2?: Module<I, I2>, module3?: Module<I, I3>): {
    shared: LikeC4SharedServices;
    likec4: I;
};
export declare function createSharedServices(context?: Partial<LanguageServicesContext>): LikeC4SharedServices;
export {};
