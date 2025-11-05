import { isLikeC4Config, validateProjectConfig, } from '@likec4/config';
import { BiMap, delay, invariant, memoizeProp, nonNullable } from '@likec4/core/utils';
import { deepEqual } from 'fast-equals';
import { interruptAndCheck, URI, WorkspaceCache, } from 'langium';
import picomatch from 'picomatch';
import { hasAtLeast, isNullish, map, pipe, prop, sortBy } from 'remeda';
import { joinRelativeURL, parseFilename, withoutProtocol, withTrailingSlash, } from 'ufo';
import { logger as mainLogger } from '../logger';
const logger = mainLogger.getChild('ProjectsManager');
function normalizeUri(uri) {
    if (URI.isUri(uri)) {
        return uri.toString();
    }
    else if (typeof uri === 'string') {
        // TODO: handle non-file URIs, i.e. vscode-remote://
        return uri.startsWith('file://') ? uri : URI.file(uri).toString();
    }
    else {
        return uri.uri.toString();
    }
}
export function ProjectFolder(folder) {
    folder = normalizeUri(folder);
    return withTrailingSlash(folder);
}
const DefaultProject = {
    id: 'default',
    config: {
        name: 'default',
        exclude: ['**/node_modules/**'],
    },
    exclude: picomatch('**/node_modules/**', { dot: true }),
};
export class ProjectsManager {
    services;
    /**
     * The global project ID used for all documents
     * that are not part of a specific project.
     */
    static DefaultProjectId = DefaultProject.id;
    /**
     * Configured default project ID.
     * (it is used in CLI and Vite plugin)
     */
    #defaultProjectId = undefined;
    /**
     * The mapping between project config files and project IDs.
     */
    #projectIdToFolder = new BiMap();
    /**
     * Registered projects.
     * Sorted descending by the number of segments in the folder path.
     * This ensures that the most specific project is used for a document.
     */
    #projects = [];
    #excludedDocuments = new WeakMap();
    constructor(services) {
        this.services = services;
        logger.debug `created`;
    }
    /**
     * Returns:
     *  - configured default project ID if set
     *  - the default project ID if there are no projects.
     *  - the ID of the only project
     *  - undefined if there are multiple projects.
     */
    get defaultProjectId() {
        if (this.#defaultProjectId) {
            return this.#defaultProjectId;
        }
        if (this.#projects.length > 1) {
            return undefined;
        }
        return this.#projects[0]?.id ?? ProjectsManager.DefaultProjectId;
    }
    set defaultProjectId(id) {
        if (id === this.#defaultProjectId) {
            return;
        }
        if (!id || id === ProjectsManager.DefaultProjectId) {
            logger.debug `reset default project ID`;
            this.#defaultProjectId = undefined;
            return;
        }
        invariant(this.#projects.find(p => p.id === id), `Project "${id}" not found`);
        logger.debug `set default project ID to ${id}`;
        this.#defaultProjectId = id;
    }
    get all() {
        if (hasAtLeast(this.#projects, 1)) {
            const ids = [
                ...map(this.#projects, prop('id')),
                DefaultProject.id,
            ];
            // if default project is set, ensure it is first
            if (this.#defaultProjectId) {
                const idx = ids.findIndex(p => p === this.#defaultProjectId);
                if (idx > 0) {
                    const [defaultProject] = ids.splice(idx, 1);
                    return [defaultProject, ...ids];
                }
            }
            return ids;
        }
        return [DefaultProject.id];
    }
    getProject(arg) {
        const id = typeof arg === 'string' ? arg : (arg.likec4ProjectId || this.belongsTo(arg));
        if (id === DefaultProject.id) {
            let folderUri;
            try {
                folderUri = this.services.workspace.WorkspaceManager.workspaceUri;
            }
            catch (error) {
                logger.warn('Failed to get workspace URI, using default folder', { error });
                folderUri = URI.file('');
                // ignore - workspace not initialized
            }
            return {
                id: ProjectsManager.DefaultProjectId,
                config: DefaultProject.config,
                folderUri,
            };
        }
        const { config, folderUri, } = nonNullable(this.#projects.find(p => p.id === id), `Project "${id}" not found`);
        return {
            id,
            folderUri,
            config,
        };
    }
    /**
     * Validates and ensures the project ID.
     * If no project ID is specified, returns default project ID
     * If there are multiple projects and default project is not set, throws an error
     */
    ensureProjectId(projectId) {
        if (projectId === ProjectsManager.DefaultProjectId) {
            return this.defaultProjectId ?? ProjectsManager.DefaultProjectId;
        }
        if (projectId) {
            invariant(this.#projectIdToFolder.has(projectId), `Project ID ${projectId} is not registered`);
            return projectId;
        }
        return nonNullable(this.defaultProjectId, () => `Specify exact project, known: [${[...this.#projectIdToFolder.keys()].join(', ')}]`);
    }
    hasMultipleProjects() {
        return this.#projects.length > 1;
    }
    /**
     * Checks if the specified document should be excluded from processing.
     */
    checkIfExcluded(document) {
        if (typeof document === 'string' || URI.isUri(document)) {
            let docUriAsString = normalizeUri(document);
            const project = this.findProjectForDocument(docUriAsString);
            return project.exclude ? project.exclude(withoutProtocol(docUriAsString)) : false;
        }
        let isExcluded = this.#excludedDocuments.get(document);
        if (isExcluded === undefined) {
            isExcluded = this.checkIfExcluded(document.uri);
            this.#excludedDocuments.set(document, isExcluded);
        }
        return isExcluded;
    }
    /**
     * Checks if it is a config file and it is not excluded by default exclude pattern
     *
     * @param entry The file system entry to check
     */
    isConfigFile(entry) {
        const filename = parseFilename(entry.toString(), { strict: false })?.toLowerCase();
        const isConfigFile = !!filename && isLikeC4Config(filename);
        if (isConfigFile) {
            if (DefaultProject.exclude(entry.path)) {
                logger.debug `exclude config file ${entry.path}`;
                return false;
            }
        }
        return isConfigFile;
    }
    /**
     * Checks if the provided file system entry is a valid project config file.
     *
     * @param entry The file system entry to check
     */
    async registerConfigFile(configFile) {
        if (this.isConfigFile(configFile)) {
            try {
                return await this.registerProject(configFile);
            }
            catch (error) {
                this.services.lsp.Connection?.window.showErrorMessage(`LikeC4: Failed to register project at ${configFile.fsPath}`);
                logger.warn('Failed to register project at {uri}', { uri: configFile.fsPath, error });
                return undefined;
            }
        }
        return undefined;
    }
    /**
     * Registers (or reloads) likec4 project by config file or config object.
     * If there is some project registered at same folder, it will be reloaded.
     */
    async registerProject(opts) {
        if (URI.isUri(opts)) {
            const configFile = opts;
            const config = await this.services.workspace.FileSystemProvider.loadProjectConfig(configFile);
            const path = joinRelativeURL(configFile.path, '..');
            const folderUri = configFile.with({ path });
            return this._registerProject({ config, folderUri });
        }
        return this._registerProject(opts);
    }
    /**
     * Registers (or reloads) likec4 project by config file or config object.
     * If there is some project registered at same folder, it will be reloaded.
     */
    _registerProject(opts) {
        const config = validateProjectConfig(opts.config);
        const folder = ProjectFolder(opts.folderUri);
        let project = this.#projects.find(p => p.folder === folder);
        if (project && deepEqual(project.config, config)) {
            return project;
        }
        let mustReset = false;
        let id;
        if (!project) {
            if (this.#projectIdToFolder.has(config.name)) {
                logger.warn `Project "${config.name}" already exists, generating unique ID`;
            }
            id = this.uniqueProjectId(config.name);
            project = {
                id,
                config,
                folder,
                folderUri: URI.parse(folder),
            };
            // if there is any project within subfolder or parent folder
            // we need to reset assigned to documents project IDs
            mustReset = this.#projects.some(p => p.folder.startsWith(folder) || folder.startsWith(p.folder));
            this.#projects = pipe([...this.#projects, project], sortBy([({ folder }) => withoutProtocol(folder).split('/').length, 'desc']));
            logger.info `register project ${project.id} folder: ${folder}`;
        }
        else {
            // Project exists but configs are different (deepEqual check above)
            mustReset = true;
            if (project.config.name !== config.name) {
                this.#projectIdToFolder.delete(project.id);
                logger.info `unregister project ${project.id} folder: ${folder}`;
                id = this.uniqueProjectId(config.name);
                project.id = id;
                logger.info `re-register project ${project.id} folder: ${folder}`;
            }
            else {
                id = project.id;
                logger.info `update project ${project.id} on config change`;
            }
            project.config = config;
        }
        if (isNullish(config.exclude)) {
            project.exclude = DefaultProject.exclude;
        }
        else if (hasAtLeast(config.exclude, 1)) {
            project.exclude = picomatch(config.exclude, { dot: true });
        }
        this.#projectIdToFolder.set(project.id, folder);
        if (mustReset) {
            this.resetProjectIds();
        }
        return project;
    }
    belongsTo(document) {
        const documentUri = normalizeUri(document);
        return this.findProjectForDocument(documentUri).id;
    }
    async reloadProjects() {
        const folders = this.services.workspace.WorkspaceManager.workspaceFolders;
        if (!folders) {
            logger.warn('No workspace folders found');
            return;
        }
        logger.debug `schedule reload projects`;
        await this.services.workspace.WorkspaceLock.write(async (cancelToken) => {
            const configFiles = [];
            for (const folder of folders) {
                try {
                    const files = await this.services.workspace.FileSystemProvider.scanProjectFiles(URI.parse(folder.uri));
                    for (const file of files) {
                        if (file.isFile && this.isConfigFile(file.uri)) {
                            configFiles.push(file);
                        }
                    }
                }
                catch (error) {
                    logger.error('Failed to scanProjectFiles, {folder}', { folder: folder.uri, error });
                }
            }
            if (configFiles.length === 0 && this.#projects.length !== 0) {
                logger.warning('No config files found, but some projects were registered before');
            }
            // debounce reload projects
            await delay(150);
            await interruptAndCheck(cancelToken);
            logger.debug `start reload projects`;
            this.#projects = [];
            this.#projectIdToFolder.clear();
            for (const entry of configFiles) {
                try {
                    await this.registerConfigFile(entry.uri);
                }
                catch (error) {
                    logger.error('Failed to load config file {uri}', { uri: entry.uri.toString(), error });
                }
            }
            this.resetProjectIds();
            await this.rebuidDocuments(cancelToken);
        });
    }
    uniqueProjectId(name) {
        let id = name;
        let i = 1;
        while (this.#projectIdToFolder.has(id)) {
            id = `${name}-${i++}`;
        }
        return id;
    }
    resetProjectIds() {
        if (this.#defaultProjectId && !this.#projectIdToFolder.has(this.#defaultProjectId)) {
            this.#defaultProjectId = undefined;
        }
        this.mappingsToProject.clear();
        this.#excludedDocuments = new WeakMap();
        this.services.workspace.LangiumDocuments.resetProjectIds();
    }
    async rebuidDocuments(cancelToken) {
        const docs = this.services.workspace.LangiumDocuments.all.map(d => d.uri).toArray();
        logger.info('invalidate and rebuild all {docs} documents', { docs: docs.length });
        await this.services.workspace.DocumentBuilder.update(docs, [], cancelToken);
    }
    findProjectForDocument(documentUri) {
        return this.mappingsToProject.get(documentUri, () => {
            const project = this.#projects.find(({ folder }) => documentUri.startsWith(folder));
            // If the document is not part of any project, assign it to the global project ID
            return project ?? DefaultProject;
        });
    }
    // The mapping between document URIs and their corresponding project ID
    // Lazy-created due to initialization order of the LanguageServer
    get mappingsToProject() {
        return memoizeProp(this, '_mappingsToProject', () => new WorkspaceCache(this.services));
    }
}
