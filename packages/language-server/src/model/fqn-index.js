import { invariant, nonNullable } from '@likec4/core';
import { Fqn } from '@likec4/core/types';
import { ancestorsFqn, compareNatural, DefaultWeakMap, MultiMap, sortNaturalByFqn } from '@likec4/core/utils';
import { AstUtils, DocumentState, stream, WorkspaceCache, } from 'langium';
import { isDefined, isEmpty, isTruthy } from 'remeda';
import { ast, ElementOps, isLikeC4LangiumDocument, } from '../ast';
import { logWarnError } from '../logger';
import { ADisposable } from '../utils';
import { readStrictFqn } from '../utils/elementRef';
import { ProjectsManager } from '../workspace';
export class FqnIndex extends ADisposable {
    services;
    cachePrefix;
    projects;
    langiumDocuments;
    documentCache;
    workspaceCache;
    constructor(services, cachePrefix = 'fqn-index') {
        super();
        this.services = services;
        this.cachePrefix = cachePrefix;
        this.langiumDocuments = services.shared.workspace.LangiumDocuments;
        this.projects = services.shared.workspace.ProjectsManager;
        this.documentCache = new DefaultWeakMap(doc => this.createDocumentIndex(doc));
        this.workspaceCache = new WorkspaceCache(services.shared, DocumentState.IndexedContent);
        this.onDispose(services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.IndexedContent, (doc) => {
            if (isLikeC4LangiumDocument(doc)) {
                this.documentCache.set(doc, this.createDocumentIndex(doc));
            }
        }));
    }
    documents(projectId) {
        return this.langiumDocuments.projectDocuments(projectId).filter((d) => isLikeC4LangiumDocument(d)
            && d.state >= DocumentState.IndexedContent);
    }
    get(document) {
        if (document.state < DocumentState.IndexedContent) {
            logWarnError(`Document ${document.uri.path} is not indexed`);
        }
        return this.documentCache.get(document);
    }
    resolve(reference) {
        if (reference.$type === 'Imported') {
            return this.getFqn(reference.imported.ref);
        }
        if (reference.$type === 'Element') {
            return this.getFqn(reference);
        }
        return this.services.likec4.DeploymentsIndex.getFqn(reference);
    }
    getFqn(el) {
        invariant(ast.isElement(el) || ast.isDeploymentElement(el));
        let id = ElementOps.readId(el);
        if (isTruthy(id)) {
            return id;
        }
        // Document index is not yet created
        const doc = AstUtils.getDocument(el);
        invariant(isLikeC4LangiumDocument(doc));
        logWarnError(`Document ${doc.uri.path} is not indexed, but getFqn was called`);
        // This will create the document index
        this.get(doc);
        return nonNullable(ElementOps.readId(el), 'Element fqn must be set, invalid state');
    }
    byFqn(projectId, fqn) {
        return stream(this.workspaceCache.get(`${this.cachePrefix}:${projectId}:fqn:${fqn}`, () => {
            return this
                .documents(projectId)
                .toArray()
                .flatMap(doc => {
                return this.get(doc).byFqn(fqn);
            });
        }));
    }
    rootElements(projectId) {
        return stream(this.workspaceCache.get(`${this.cachePrefix}:${projectId}:rootElements`, () => {
            const allchildren = this.documents(projectId)
                .reduce((map, doc) => {
                this.get(doc).rootElements().forEach(desc => {
                    map.set(desc.name, desc);
                });
                return map;
            }, new MultiMap());
            return uniqueByName(allchildren);
        }));
    }
    directChildrenOf(projectId, parent) {
        return stream(this.workspaceCache.get(`${this.cachePrefix}:${projectId}:directChildrenOf:${parent}`, () => {
            const allchildren = this.documents(projectId)
                .reduce((map, doc) => {
                this.get(doc).children(parent).forEach(desc => {
                    map.set(desc.name, desc);
                });
                return map;
            }, new MultiMap());
            return uniqueByName(allchildren);
        }));
    }
    /**
     * Returns descedant elements with unique names in the scope
     */
    uniqueDescedants(projectId, parent) {
        return stream(this.workspaceCache.get(`${this.cachePrefix}:${projectId}:uniqueDescedants:${parent}`, () => {
            const { children, descendants } = this.documents(projectId)
                .reduce((map, doc) => {
                const docIndex = this.get(doc);
                docIndex.children(parent).forEach(desc => {
                    map.children.set(desc.name, desc);
                });
                docIndex.descendants(parent).forEach(desc => {
                    map.descendants.set(desc.name, desc);
                });
                return map;
            }, {
                children: new MultiMap(),
                descendants: new MultiMap(),
            });
            const uniqueChildren = uniqueByName(children);
            const uniqueDescendants = [...descendants.associations()]
                .flatMap(([_name, descs]) => descs.length === 1 && !children.has(_name) ? descs : []);
            return [
                ...uniqueChildren,
                ...sortNaturalByFqn(uniqueDescendants),
            ];
        }));
    }
    createDocumentIndex(document) {
        const rootElements = document.parseResult.value.models.flatMap(m => m.elements);
        if (rootElements.length === 0) {
            return DocumentFqnIndex.EMPTY;
        }
        const projectId = document.likec4ProjectId ??= this.projects.belongsTo(document);
        const root = new Array();
        const children = new MultiMap();
        const descendants = new MultiMap();
        const byfqn = new MultiMap();
        const Descriptions = this.services.workspace.AstNodeDescriptionProvider;
        const createAndSaveDescription = (node, name, fqn) => {
            const desc = {
                ...Descriptions.createDescription(node, name, document),
                id: fqn,
                likec4ProjectId: projectId,
            };
            ElementOps.writeId(node, fqn);
            byfqn.set(fqn, desc);
            return desc;
        };
        const traverseNode = (el, parentFqn) => {
            let thisFqn;
            if (ast.isElement(el)) {
                thisFqn = Fqn(el.name, parentFqn);
                const desc = createAndSaveDescription(el, el.name, thisFqn);
                if (!parentFqn) {
                    root.push(desc);
                }
                else {
                    children.set(parentFqn, desc);
                }
            }
            else {
                thisFqn = readStrictFqn(el.element);
            }
            let _nested = [];
            if (isDefined(el.body) && !isEmpty(el.body.elements)) {
                for (const child of el.body.elements) {
                    if (!ast.isRelation(child)) {
                        try {
                            _nested.push(...traverseNode(child, thisFqn));
                        }
                        catch (e) {
                            logWarnError(e);
                        }
                    }
                }
            }
            const directChildren = children.get(thisFqn) ?? [];
            _nested = [
                ...directChildren,
                ..._nested,
            ];
            for (const child of _nested) {
                descendants.set(thisFqn, child);
            }
            if (ast.isExtendElement(el)) {
                for (const ancestor of ancestorsFqn(thisFqn)) {
                    for (const child of _nested) {
                        descendants.set(ancestor, child);
                    }
                }
            }
            return descendants.get(thisFqn) ?? [];
        };
        for (const node of rootElements) {
            try {
                if (ast.isRelation(node)) {
                    continue;
                }
                traverseNode(node, null);
            }
            catch (e) {
                logWarnError(e);
            }
        }
        return new DocumentFqnIndex(root, children, descendants, byfqn, projectId);
    }
}
function uniqueByName(multimap) {
    return [...multimap.associations()]
        .flatMap(([_name, descs]) => (descs.length === 1 ? descs : []))
        .sort((a, b) => compareNatural(a.name, b.name));
}
export class DocumentFqnIndex {
    _rootElements;
    _children;
    _descendants;
    _byfqn;
    projectId;
    static EMPTY = new DocumentFqnIndex([], new MultiMap(), new MultiMap(), new MultiMap(), ProjectsManager.DefaultProjectId);
    constructor(_rootElements, 
    /**
     * direct children of elements
     */
    _children, 
    /**
     * All descendants of an element (unique by name)
     */
    _descendants, 
    /**
     * All elements by FQN
     */
    _byfqn, projectId) {
        this._rootElements = _rootElements;
        this._children = _children;
        this._descendants = _descendants;
        this._byfqn = _byfqn;
        this.projectId = projectId;
    }
    rootElements() {
        return this._rootElements;
    }
    byFqn(fqn) {
        return this._byfqn.get(fqn) ?? [];
    }
    children(parent) {
        return this._children.get(parent) ?? [];
    }
    descendants(nodeName) {
        return this._descendants.get(nodeName) ?? [];
    }
}
