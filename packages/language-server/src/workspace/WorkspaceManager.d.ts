import type { BuildOptions, FileSelector, FileSystemNode, LangiumDocument, LangiumDocumentFactory } from 'langium';
import { DefaultWorkspaceManager } from 'langium';
import type { WorkspaceFolder } from 'vscode-languageserver';
import type { FileSystemProvider } from '../filesystem';
import type { LikeC4SharedServices } from '../module';
export declare class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
    private services;
    protected readonly documentFactory: LangiumDocumentFactory;
    protected readonly fileSystemProvider: FileSystemProvider;
    initialBuildOptions: BuildOptions;
    constructor(services: LikeC4SharedServices);
    /**
     * First load all project config files, then load all documents in the workspace.
     */
    protected performStartup(folders: WorkspaceFolder[]): Promise<LangiumDocument[]>;
    /**
     * Load all additional documents that shall be visible in the context of the given workspace
     * folders and add them to the collector. This can be used to include built-in libraries of
     * your language, which can be either loaded from provided files or constructed in memory.
     */
    protected loadAdditionalDocuments(folders: WorkspaceFolder[], collector: (document: LangiumDocument) => void): Promise<void>;
    /**
     * Determine whether the given folder entry shall be included while indexing the workspace.
     */
    protected includeEntry(_workspaceFolder: WorkspaceFolder, entry: FileSystemNode, selector: FileSelector): boolean;
    workspace(): any;
    get workspaceUri(): any;
    get workspaceURL(): URL;
}
