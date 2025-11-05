import { _stage, isScopedElementView, } from '@likec4/core';
import { computeView } from '@likec4/core/compute-view';
import { LikeC4Model } from '@likec4/core/model';
import { loggable } from '@likec4/log';
import { deepEqual as eq } from 'fast-equals';
import { Disposable, DocumentState, interruptAndCheck, } from 'langium';
import { filter, flatMap, groupBy, hasAtLeast, isNot, mapToObj, pipe, prop, values, } from 'remeda';
import { isLikeC4Builtin } from '../likec4lib';
import { logger as mainLogger, logWarnError } from '../logger';
import { ADisposable, performanceMark } from '../utils';
import { assignNavigateTo } from '../view-utils';
import { buildModelData } from './builder/buildModel';
const parsedWithoutImportsCacheKey = (projectId) => `parsed-without-imports-${projectId}`;
const parsedModelCacheKey = (projectId) => `parsed-model-${projectId}`;
const computedModelCacheKey = (projectId) => `computed-model-${projectId}`;
const builderLogger = mainLogger.getChild('model-builder');
export class DefaultLikeC4ModelBuilder extends ADisposable {
    projects;
    parser;
    listeners = [];
    cache;
    DocumentBuilder;
    mutex;
    constructor(services) {
        super();
        this.projects = services.shared.workspace.ProjectsManager;
        this.parser = services.likec4.ModelParser;
        this.cache = services.ValidatedWorkspaceCache;
        this.DocumentBuilder = services.shared.workspace.DocumentBuilder;
        this.mutex = services.shared.workspace.WorkspaceLock;
        this.onDispose(this.DocumentBuilder.onUpdate((_changed, deleted) => {
            if (deleted.length > 0) {
                this.notifyListeners(deleted);
            }
        }));
        this.onDispose(this.DocumentBuilder.onBuildPhase(DocumentState.Validated, (docs, _cancelToken) => {
            const validated = docs.map(prop('uri')).filter(isNot(isLikeC4Builtin));
            if (validated.length > 0) {
                this.notifyListeners(validated);
            }
        }));
        builderLogger.debug `created`;
    }
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     *
     * To avoid circular dependencies, we do not resolve imports here.
     */
    unsafeSyncParseModelData(projectId) {
        const cache = this.cache;
        const logger = builderLogger.getChild(projectId);
        const key = parsedWithoutImportsCacheKey(projectId);
        if (cache.has(key)) {
            logger.debug `unsafeSyncBuildModelData from cache`;
        }
        return cache.get(key, () => {
            try {
                const project = this.projects.getProject(projectId);
                const docs = this.documents(projectId);
                if (docs.length === 0) {
                    logger.debug `no documents to build model`;
                    return null;
                }
                logger.debug `unsafeSyncBuildModelData`;
                return buildModelData(project, docs);
            }
            catch (e) {
                logWarnError(e);
                return null;
            }
        });
    }
    /**
     * To avoid circular dependencies, first we parse all documents and then we join them.
     */
    unsafeSyncJoinedModelData(projectId) {
        const logger = builderLogger.getChild(projectId);
        const cache = this.cache;
        const key = parsedModelCacheKey(projectId);
        return cache.get(key, () => {
            const result = this.unsafeSyncParseModelData(projectId);
            if (!result) {
                return null;
            }
            let parsedData = result.data;
            if (result.imports.size > 0) {
                logger.debug `processing imports of ${projectId}`;
                const imports = [...result.imports.associations()].reduce((acc, [projectId, fqns]) => {
                    const anotherProject = this.unsafeSyncParseModelData(projectId);
                    if (anotherProject) {
                        const imported = pipe([...fqns], flatMap(fqn => anotherProject.data.elements[fqn] ?? []));
                        if (hasAtLeast(imported, 1)) {
                            acc[projectId] = imported;
                        }
                    }
                    return acc;
                }, {});
                parsedData = {
                    ...result.data,
                    imports,
                };
            }
            return LikeC4Model.create(parsedData);
        });
    }
    async parseModel(projectId, cancelToken) {
        const project = this.projects.ensureProjectId(projectId);
        const logger = builderLogger.getChild(project);
        const cache = this.cache;
        const cached = cache.get(parsedModelCacheKey(project));
        if (cached) {
            logger.debug `parseModel from cache`;
            return cached;
        }
        const t0 = performanceMark();
        return await this.mutex.read(async () => {
            if (cancelToken) {
                await interruptAndCheck(cancelToken);
            }
            const result = this.unsafeSyncJoinedModelData(project);
            logger.debug `parseModel in ${t0.pretty}`;
            return result;
        });
    }
    previousViews = {};
    /**
     * WARNING:
     * This method is internal and should to be called only when all documents are known to be parsed.
     * Otherwise, the model may be incomplete.
     */
    unsafeSyncBuildModel(projectId) {
        const logger = builderLogger.getChild(projectId);
        const cache = this.cache;
        const viewsCache = this.cache;
        return cache.get(computedModelCacheKey(projectId), () => {
            const parsedModel = this.unsafeSyncJoinedModelData(projectId);
            if (!parsedModel) {
                return LikeC4Model.EMPTY;
            }
            const allViews = [];
            for (const view of values(parsedModel.$data.views)) {
                const result = computeView(view, parsedModel);
                if (!result.isSuccess) {
                    logger.warn(loggable(result.error));
                    continue;
                }
                allViews.push(result.view);
            }
            assignNavigateTo(allViews);
            const views = mapToObj(allViews, v => {
                const key = computedViewKey(projectId, v.id);
                const previous = this.previousViews[key];
                const view = previous && eq(v, previous) ? previous : v;
                this.previousViews[key] = view;
                viewsCache.set(key, view);
                return [v.id, view];
            });
            return LikeC4Model.create({
                ...parsedModel.$data,
                [_stage]: 'computed',
                views,
            });
        });
    }
    async buildLikeC4Model(projectId, cancelToken) {
        const project = this.projects.ensureProjectId(projectId);
        const logger = builderLogger.getChild(project);
        const cache = this.cache;
        const cached = cache.get(computedModelCacheKey(project));
        if (cached) {
            logger.debug('buildLikeC4Model from cache');
            return cached;
        }
        const t0 = performanceMark();
        return await this.mutex.read(async () => {
            if (cancelToken) {
                await interruptAndCheck(cancelToken);
            }
            const result = this.unsafeSyncBuildModel(project);
            logger.debug(`buildLikeC4Model in ${t0.pretty}`);
            return result;
        });
    }
    async computeView(viewId, projectId, cancelToken) {
        const project = this.projects.ensureProjectId(projectId);
        const logger = builderLogger.getChild(project);
        const cache = this.cache;
        const cacheKey = computedViewKey(project, viewId);
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }
        const parsed = await this.parseModel(project, cancelToken);
        if (!parsed) {
            return null;
        }
        return cache.get(cacheKey, () => {
            const view = parsed.$data.views[viewId];
            if (!view) {
                logger.warn `computeView: cant find view ${viewId}`;
                return null;
            }
            logger.debug `computeView: ${viewId}`;
            const result = computeView(view, parsed);
            if (!result.isSuccess) {
                logWarnError(result.error);
                return null;
            }
            let computedView = result.view;
            const allElementViews = pipe(parsed.$data.views, values(), filter(isScopedElementView), filter(v => v.id !== viewId), groupBy(v => v.viewOf));
            for (const node of computedView.nodes) {
                if (!node.navigateTo) {
                    const viewsOfNode = allElementViews[node.id];
                    if (viewsOfNode) {
                        node.navigateTo = viewsOfNode[0].id;
                    }
                }
            }
            const previous = this.previousViews[cacheKey];
            if (previous && eq(computedView, previous)) {
                computedView = previous;
            }
            else {
                this.previousViews[cacheKey] = computedView;
            }
            return computedView;
        });
    }
    onModelParsed(callback) {
        this.listeners.push(callback);
        return Disposable.create(() => {
            const index = this.listeners.indexOf(callback);
            if (index >= 0) {
                this.listeners.splice(index, 1);
            }
        });
    }
    documents(projectId) {
        return this.parser.documents(projectId).toArray();
    }
    notifyListeners(docs) {
        for (const listener of this.listeners) {
            try {
                listener(docs);
            }
            catch (e) {
                logWarnError(e);
            }
        }
    }
}
function computedViewKey(projectId, viewId) {
    return `computed-view-${projectId}-${viewId}`;
}
