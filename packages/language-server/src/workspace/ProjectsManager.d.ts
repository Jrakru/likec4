import { type LikeC4ProjectConfig, type LikeC4ProjectConfigInput } from '@likec4/config';
import type { NonEmptyReadonlyArray } from '@likec4/core';
import type { scalar } from '@likec4/core/types';
import { type Cancellation, type LangiumDocument, URI, WorkspaceCache } from 'langium';
import type { Tagged } from 'type-fest';
import type { LikeC4SharedServices } from '../module';
/**
 * A tagged string that represents a project folder URI
 * Always has trailing slash.
 */
export type ProjectFolder = Tagged<string, 'ProjectFolder'>;
export declare function ProjectFolder(folder: URI | string): ProjectFolder;
interface ProjectData {
    id: scalar.ProjectId;
    config: LikeC4ProjectConfig;
    folder: ProjectFolder;
    folderUri: URI;
    exclude?: (path: string) => boolean;
}
export interface Project {
    id: scalar.ProjectId;
    folderUri: URI;
    config: LikeC4ProjectConfig;
}
export declare class ProjectsManager {
    #private;
    protected services: LikeC4SharedServices;
    /**
     * The global project ID used for all documents
     * that are not part of a specific project.
     */
    static readonly DefaultProjectId: scalar.ProjectId;
    constructor(services: LikeC4SharedServices);
    /**
     * Returns:
     *  - configured default project ID if set
     *  - the default project ID if there are no projects.
     *  - the ID of the only project
     *  - undefined if there are multiple projects.
     */
    get defaultProjectId(): scalar.ProjectId | undefined;
    set defaultProjectId(id: string | scalar.ProjectId | undefined);
    get all(): NonEmptyReadonlyArray<scalar.ProjectId>;
    getProject(arg: scalar.ProjectId | LangiumDocument): Project;
    /**
     * Validates and ensures the project ID.
     * If no project ID is specified, returns default project ID
     * If there are multiple projects and default project is not set, throws an error
     */
    ensureProjectId(projectId?: scalar.ProjectId | undefined): scalar.ProjectId;
    hasMultipleProjects(): boolean;
    /**
     * Checks if the specified document should be excluded from processing.
     */
    checkIfExcluded(document: LangiumDocument | URI | string): boolean;
    /**
     * Checks if it is a config file and it is not excluded by default exclude pattern
     *
     * @param entry The file system entry to check
     */
    isConfigFile(entry: URI): boolean;
    /**
     * Checks if the provided file system entry is a valid project config file.
     *
     * @param entry The file system entry to check
     */
    registerConfigFile(configFile: URI): Promise<ProjectData | undefined>;
    /**
     * Registers (or reloads) likec4 project by config file or config object.
     * If there is some project registered at same folder, it will be reloaded.
     */
    registerProject(opts: URI | {
        config: LikeC4ProjectConfigInput;
        folderUri: URI | string;
    }): Promise<ProjectData>;
    /**
     * Registers (or reloads) likec4 project by config file or config object.
     * If there is some project registered at same folder, it will be reloaded.
     */
    private _registerProject;
    belongsTo(document: LangiumDocument | URI | string): scalar.ProjectId;
    reloadProjects(): Promise<void>;
    protected uniqueProjectId(name: string): scalar.ProjectId;
    protected resetProjectIds(): void;
    protected rebuidDocuments(cancelToken?: Cancellation.CancellationToken): Promise<void>;
    protected findProjectForDocument(documentUri: string): any;
    protected get mappingsToProject(): WorkspaceCache<string, Pick<ProjectData, 'id' | 'config' | 'exclude'>>;
}
export {};
