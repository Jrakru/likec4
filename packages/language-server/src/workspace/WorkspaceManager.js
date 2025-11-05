import { invariant } from '@likec4/core';
import { DefaultWorkspaceManager } from 'langium';
import { hasAtLeast } from 'remeda';
import { URI } from 'vscode-uri';
import * as BuiltIn from '../likec4lib';
import { logWarnError } from '../logger';
export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
    services;
    documentFactory;
    fileSystemProvider;
    initialBuildOptions = {
        eagerLinking: true,
        validation: true,
    };
    constructor(services) {
        super(services);
        this.services = services;
        this.documentFactory = services.workspace.LangiumDocumentFactory;
        this.fileSystemProvider = services.workspace.FileSystemProvider;
    }
    /**
     * First load all project config files, then load all documents in the workspace.
     */
    async performStartup(folders) {
        this.folders ??= folders;
        const configFiles = [];
        for (const folder of folders) {
            try {
                const uri = URI.parse(folder.uri);
                const found = await this.fileSystemProvider.scanProjectFiles(uri);
                configFiles.push(...found);
                this.services.workspace.FileSystemWatcher.watch(uri.fsPath);
            }
            catch (error) {
                logWarnError(error);
            }
        }
        // Project config files
        const projects = this.services.workspace.ProjectsManager;
        for (const entry of configFiles) {
            try {
                await projects.registerConfigFile(entry.uri);
            }
            catch (error) {
                logWarnError(error);
            }
        }
        return await super.performStartup(folders);
    }
    /**
     * Load all additional documents that shall be visible in the context of the given workspace
     * folders and add them to the collector. This can be used to include built-in libraries of
     * your language, which can be either loaded from provided files or constructed in memory.
     */
    async loadAdditionalDocuments(folders, collector) {
        collector(this.documentFactory.fromString(BuiltIn.Content, URI.parse(BuiltIn.Uri)));
        await super.loadAdditionalDocuments(folders, collector);
    }
    /**
     * Determine whether the given folder entry shall be included while indexing the workspace.
     */
    includeEntry(_workspaceFolder, entry, selector) {
        if (this.services.workspace.ProjectsManager.isConfigFile(entry.uri)) {
            return false;
        }
        if (entry.isFile) {
            return !this.services.workspace.ProjectsManager.checkIfExcluded(entry.uri);
        }
        return super.includeEntry(_workspaceFolder, entry, selector);
    }
    workspace() {
        if (this.folders && hasAtLeast(this.folders, 1)) {
            return this.folders[0];
        }
        return null;
    }
    get workspaceUri() {
        const workspace = this.workspace();
        invariant(workspace, 'Workspace not initialized');
        return URI.parse(workspace.uri);
    }
    get workspaceURL() {
        const workspace = this.workspace();
        invariant(workspace, 'Workspace not initialized');
        return new URL(workspace.uri);
    }
}
