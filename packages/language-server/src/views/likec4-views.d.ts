import type { ComputedView, DiagramView, ProjectId, ViewId } from '@likec4/core';
import { type QueueGraphvizLayoter, GraphvizLayouter } from '@likec4/layouts';
import type { CancellationToken } from 'vscode-languageserver';
import type { LikeC4Services } from '../module';
export type GraphvizOut = {
    readonly dot: string;
    readonly diagram: DiagramView;
};
type GraphvizSvgOut = {
    readonly id: ViewId;
    readonly dot: string;
    readonly svg: string;
};
export interface LikeC4Views {
    readonly layouter: GraphvizLayouter;
    /**
     * Returns computed views (i.e. views with predicates computed)
     */
    computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>;
    /**
     * Returns all layouted views (i.e. views with layout computed)
     * Result includes dot and diagram
     */
    layoutAllViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut[]>;
    /**
     * Returns layouted view (i.e. view with layout computed)
     * Result includes dot and diagram
     */
    layoutView(viewId: ViewId, projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut | null>;
    /**
     * Returns diagrams (i.e. views with layout computed)
     */
    diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>;
    /**
     * Returns all layouted views as Graphviz output (i.e. views with layout computed)
     */
    viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>;
    /**
     * Open view in the preview panel.
     * (works only if running as a vscode extension)
     */
    openView(viewId: ViewId, projectId?: ProjectId | undefined): Promise<void>;
}
export declare class DefaultLikeC4Views implements LikeC4Views {
    private services;
    private cache;
    /**
     * Set of viewIds with reported errors
     * value is `${projectId}-${viewId}`
     */
    private viewsWithReportedErrors;
    private ModelBuilder;
    constructor(services: LikeC4Services);
    get layouter(): QueueGraphvizLayoter;
    computedViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<ComputedView[]>;
    layoutAllViews(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut[]>;
    layoutView(viewId: ViewId, projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<GraphvizOut | null>;
    diagrams(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<DiagramView>>;
    viewsAsGraphvizOut(projectId?: ProjectId | undefined, cancelToken?: CancellationToken): Promise<Array<GraphvizSvgOut>>;
    /**
     * Open a view in the preview panel.
     */
    openView(viewId: ViewId, projectId: ProjectId): Promise<void>;
    private reportViewError;
    private viewSucceed;
}
export {};
