import type { LikeC4ProjectConfig } from '@likec4/config';
import { type DiagramView, type NonEmptyArray, type ProjectId } from '@likec4/core';
import { LikeC4Model } from '@likec4/core/model';
import { type LangiumDocument, URI } from 'langium';
import { type Range } from 'vscode-languageserver-types';
import type { LikeC4ModelBuilder } from './model';
import type { LikeC4Services } from './module';
import type { Locate } from './protocol';
import type { LikeC4Views } from './views/likec4-views';
import { ProjectsManager } from './workspace';
export interface LikeC4LanguageServices {
    readonly views: LikeC4Views;
    readonly builder: LikeC4ModelBuilder;
    readonly workspaceUri: URI;
    readonly projectsManager: ProjectsManager;
    /**
     * Returns all projects with relevant documents
     */
    projects(): NonEmptyArray<{
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: Readonly<LikeC4ProjectConfig>;
    }>;
    /**
     * Returns project by ID
     * If no project ID is specified, returns default project
     */
    project(projectId?: ProjectId): {
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: Readonly<LikeC4ProjectConfig>;
    };
    /**
     * Returns diagrams (i.e. views with layout computed) for the specified project
     * If no project is specified, returns diagrams for default project
     */
    diagrams(project?: ProjectId | undefined): Promise<DiagramView[]>;
    computedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Computed>;
    layoutedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Layouted>;
    getErrors(): Array<{
        message: string;
        line: number;
        range: Range;
        sourceFsPath: string;
    }>;
    /**
     * Notifies the language server about changes in the workspace
     * @deprecated use watcher instead
     */
    notifyUpdate(update: {
        changed?: string;
        removed?: string;
    }): Promise<boolean>;
    /**
     * Returns the location of the specified element, relation, view or deployment element
     */
    locate(params: Locate.Params): Locate.Res;
    /**
     * Checks if the specified document should be excluded from processing.
     */
    isExcluded(doc: LangiumDocument): boolean;
    dispose(): Promise<void>;
}
/**
 * Public Language Services
 */
export declare class DefaultLikeC4LanguageServices implements LikeC4LanguageServices {
    private services;
    readonly builder: LikeC4ModelBuilder;
    readonly projectsManager: ProjectsManager;
    constructor(services: LikeC4Services);
    get views(): LikeC4Views;
    get workspaceUri(): URI;
    projects(): NonEmptyArray<{
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: LikeC4ProjectConfig;
    }>;
    project(projectId?: ProjectId): {
        id: ProjectId;
        folder: URI;
        title: string;
        documents: ReadonlyArray<URI>;
        config: LikeC4ProjectConfig;
    };
    /**
     * Diagram is a computed view, layouted using Graphviz
     * Used in React components
     */
    diagrams(): Promise<DiagramView[]>;
    /**
     * Builds LikeC4Model from all documents
     * Only computes view predicates {@link ComputedView} - i.e. no layout
     * Not ready for rendering, but enough to traverse
     */
    computedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Computed>;
    /**
     * Same as {@link computedModel()}, but also applies layout
     * Ready for rendering
     */
    layoutedModel(project?: ProjectId | undefined): Promise<LikeC4Model.Layouted>;
    getErrors(): Array<{
        message: string;
        line: number;
        range: Range;
        sourceFsPath: string;
    }>;
    /**
     * TODO Replace with watcher
     */
    notifyUpdate({ changed, removed }: {
        changed?: string;
        removed?: string;
    }): Promise<boolean>;
    locate(params: Locate.Params): Locate.Res;
    /**
     * Checks if the specified document should be excluded from processing.
     */
    isExcluded(doc: LangiumDocument): boolean;
    dispose(): Promise<void>;
}
