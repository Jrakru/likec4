import { nonexhaustive, } from '@likec4/core';
import { LikeC4Model } from '@likec4/core/model';
import { loggable } from '@likec4/log';
import { URI } from 'langium';
import { entries, hasAtLeast, indexBy, map, pipe, prop } from 'remeda';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { isLikeC4LangiumDocument } from './ast';
import { logger as mainLogger, logWarnError } from './logger';
import { ProjectsManager } from './workspace';
const logger = mainLogger.getChild('LanguageServices');
/**
 * Public Language Services
 */
export class DefaultLikeC4LanguageServices {
    services;
    builder;
    projectsManager;
    constructor(services) {
        this.services = services;
        this.builder = services.likec4.ModelBuilder;
        this.projectsManager = services.shared.workspace.ProjectsManager;
    }
    get views() {
        return this.services.likec4.Views;
    }
    get workspaceUri() {
        return this.services.shared.workspace.WorkspaceManager.workspaceUri;
    }
    projects() {
        const projectsManager = this.services.shared.workspace.ProjectsManager;
        const projectsWithDocs = pipe(this.services.shared.workspace.LangiumDocuments.groupedByProject(), entries(), map(([projectId, docs]) => {
            const id = projectId;
            const { folderUri, config } = projectsManager.getProject(id);
            return {
                id,
                folder: folderUri,
                title: config.title ?? config.name,
                documents: map(docs, prop('uri')),
                config,
            };
        }));
        // if there are multiple projects and default project is set, ensure it is first
        if (hasAtLeast(projectsWithDocs, 2) && projectsManager.defaultProjectId) {
            const idx = projectsWithDocs.findIndex(p => p.id === projectsManager.defaultProjectId);
            if (idx > 0) {
                const [defaultProject] = projectsWithDocs.splice(idx, 1);
                return [defaultProject, ...projectsWithDocs];
            }
            return projectsWithDocs;
        }
        if (hasAtLeast(projectsWithDocs, 1)) {
            return projectsWithDocs;
        }
        const { folderUri, config } = projectsManager.getProject(ProjectsManager.DefaultProjectId);
        const documents = map(this.services.shared.workspace.LangiumDocuments.projectDocuments(ProjectsManager.DefaultProjectId).toArray(), prop('uri'));
        return [{
                id: ProjectsManager.DefaultProjectId,
                folder: folderUri,
                title: config.title ?? config.name,
                documents,
                config,
            }];
    }
    project(projectId) {
        projectId = this.projectsManager.ensureProjectId(projectId);
        const projectsManager = this.services.shared.workspace.ProjectsManager;
        const { folderUri, config } = projectsManager.getProject(projectId);
        const documents = map(this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).toArray(), prop('uri'));
        return {
            id: projectId,
            folder: folderUri,
            title: config.title ?? config.name,
            documents,
            config,
        };
    }
    /**
     * Diagram is a computed view, layouted using Graphviz
     * Used in React components
     */
    async diagrams() {
        return await this.views.diagrams();
    }
    /**
     * Builds LikeC4Model from all documents
     * Only computes view predicates {@link ComputedView} - i.e. no layout
     * Not ready for rendering, but enough to traverse
     */
    async computedModel(project) {
        const projectId = this.projectsManager.ensureProjectId(project);
        return await this.builder.buildLikeC4Model(projectId);
    }
    /**
     * Same as {@link computedModel()}, but also applies layout
     * Ready for rendering
     */
    async layoutedModel(project) {
        const projectId = this.projectsManager.ensureProjectId(project);
        const parsed = await this.builder.parseModel(projectId);
        if (!parsed) {
            throw new Error('Failed to parse model');
        }
        const diagrams = await this.views.diagrams(projectId);
        return LikeC4Model.create({
            ...parsed.$data,
            _stage: 'layouted',
            views: indexBy(diagrams, prop('id')),
        });
    }
    getErrors() {
        const docs = this.services.shared.workspace.LangiumDocuments.allExcludingBuiltin.toArray();
        return docs.flatMap(doc => {
            return (doc.diagnostics ?? [])
                .filter(d => d.severity === DiagnosticSeverity.Error)
                .map(({ message, range }) => ({
                message,
                line: range.start.line,
                range,
                sourceFsPath: doc.uri.fsPath,
            }));
        });
    }
    /**
     * TODO Replace with watcher
     */
    async notifyUpdate({ changed, removed }) {
        if (!changed && !removed) {
            return false;
        }
        const _changed = changed ? URI.file(changed) : undefined;
        const _removed = removed ? URI.file(removed) : undefined;
        const pm = this.services.shared.workspace.ProjectsManager;
        if ((_changed && pm.isConfigFile(_changed)) || (_removed && pm.isConfigFile(_removed))) {
            await pm.reloadProjects();
            return true;
        }
        const mutex = this.services.shared.workspace.WorkspaceLock;
        try {
            let completed = false;
            await mutex.write(async (token) => {
                await this.services.shared.workspace.DocumentBuilder.update(_changed ? [_changed] : [], _removed ? [_removed] : [], token);
                // we come here if only the update was successful, did not throw and not cancelled
                completed = !token.isCancellationRequested;
            });
            return completed;
        }
        catch (e) {
            logger.error(loggable(e));
            return false;
        }
    }
    locate(params) {
        switch (true) {
            case 'element' in params:
                return this.services.likec4.ModelLocator.locateElement(params.element, params.projectId);
            case 'relation' in params:
                return this.services.likec4.ModelLocator.locateRelation(params.relation, params.projectId);
            case 'view' in params:
                return this.services.likec4.ModelLocator.locateView(params.view, params.projectId);
            case 'deployment' in params:
                return this.services.likec4.ModelLocator.locateDeploymentElement(params.deployment, params.projectId);
            default:
                nonexhaustive(params);
        }
    }
    /**
     * Checks if the specified document should be excluded from processing.
     */
    isExcluded(doc) {
        try {
            return !isLikeC4LangiumDocument(doc) || this.services.shared.workspace.ProjectsManager.checkIfExcluded(doc);
        }
        catch (e) {
            logWarnError(e);
            return false;
        }
    }
    async dispose() {
        logger.debug('disposing LikeC4LanguageServices');
        await this.services.shared.workspace.FileSystemWatcher.dispose();
        if (this.services.mcp.Server.isStarted) {
            await this.services.mcp.Server.stop();
        }
        this.services.Rpc.dispose();
        this.services.likec4.ModelBuilder.dispose();
        logger.debug('LikeC4LanguageServices disposed');
    }
}
