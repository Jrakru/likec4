import { ancestorsFqn, Fqn } from '@likec4/core';
import { MultiMap } from '@likec4/core/utils';
import { isDefined, isTruthy } from 'remeda';
import { ast, ElementOps, } from '../ast';
import { logWarnError } from '../logger';
import { readStrictFqn } from '../utils/elementRef';
import { DocumentFqnIndex, FqnIndex } from './fqn-index';
export class DeploymentsIndex extends FqnIndex {
    services;
    Names;
    constructor(services) {
        super(services, 'deployments-index');
        this.services = services;
        this.Names = services.references.NameProvider;
    }
    createDocumentIndex(document) {
        const rootNodes = document.parseResult.value.deployments.flatMap(m => m.elements);
        if (rootNodes.length === 0) {
            return DocumentFqnIndex.EMPTY;
        }
        const projectId = document.likec4ProjectId ??= this.projects.belongsTo(document);
        const root = new Array();
        const children = new MultiMap();
        const descendants = new MultiMap();
        const byfqn = new MultiMap();
        const Names = this.Names;
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
        const traverseNode = (node, parentFqn) => {
            let thisFqn;
            if (ast.isExtendDeployment(node)) {
                thisFqn = readStrictFqn(node.deploymentNode);
            }
            else {
                const name = Names.getName(node);
                if (!isTruthy(name)) {
                    return [];
                }
                thisFqn = Fqn(name, parentFqn);
                const desc = createAndSaveDescription(node, name, thisFqn);
                if (!parentFqn) {
                    root.push(desc);
                }
                else {
                    children.set(parentFqn, desc);
                }
                if (ast.isDeployedInstance(node)) {
                    return [];
                }
            }
            let _nested = [];
            if (isDefined(node.body)) {
                for (const child of node.body.elements) {
                    if (!ast.isDeploymentRelation(child)) {
                        try {
                            _nested.push(...traverseNode(child, thisFqn));
                        }
                        catch (e) {
                            logWarnError(e);
                        }
                    }
                }
            }
            _nested = [
                ...children.get(thisFqn) ?? [],
                ..._nested,
            ];
            for (const child of _nested) {
                descendants.set(thisFqn, child);
            }
            if (ast.isExtendDeployment(node)) {
                for (const ancestor of ancestorsFqn(thisFqn)) {
                    for (const child of _nested) {
                        descendants.set(ancestor, child);
                    }
                }
            }
            return descendants.get(thisFqn) ?? [];
        };
        for (const node of rootNodes) {
            try {
                if (ast.isDeploymentRelation(node)) {
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
