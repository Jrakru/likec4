import { type ViewId } from '@likec4/core';
import { LikeC4Model } from '@likec4/core/model';
import type * as c4 from '@likec4/core/types';
import { type URI, Disposable } from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import type { LikeC4Services } from '../module';
import { ADisposable } from '../utils';
type ModelParsedListener = (docs: URI[]) => void;
export interface LikeC4ModelBuilder extends Disposable {
    parseModel(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Parsed | null>;
    unsafeSyncBuildModel(projectId: c4.ProjectId): LikeC4Model.Computed;
    buildLikeC4Model(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Computed>;
    computeView(viewId: ViewId, projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<c4.ComputedView | null>;
    onModelParsed(callback: ModelParsedListener): Disposable;
}
export declare class DefaultLikeC4ModelBuilder extends ADisposable implements LikeC4ModelBuilder {
    private projects;
    private parser;
    private listeners;
    private cache;
    private DocumentBuilder;
    private mutex;
    constructor(services: LikeC4Services);
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * To avoid circular dependencies, we do not resolve imports here.
     */
    private unsafeSyncParseModelData;
    /**
     * To avoid circular dependencies, first we parse all documents and then we join them.
     */
    private unsafeSyncJoinedModelData;
    parseModel(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Parsed | null>;
    private previousViews;
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     */
    unsafeSyncBuildModel(projectId: c4.ProjectId): LikeC4Model.Computed;
    buildLikeC4Model(projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<LikeC4Model.Computed>;
    computeView(viewId: ViewId, projectId?: c4.ProjectId | undefined, cancelToken?: CancellationToken): Promise<c4.ComputedView | null>;
    onModelParsed(callback: ModelParsedListener): Disposable;
    private documents;
    private notifyListeners;
}
export {};
