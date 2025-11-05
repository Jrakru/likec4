import { invariant, isNonEmptyArray, LinkedList, nonexhaustive, nonNullable } from '@likec4/core';
import { exact, FqnRef } from '@likec4/core/types';
import { loggable } from '@likec4/log';
import { filter, first, isDefined, isEmpty, isTruthy, map, mapToObj, pipe } from 'remeda';
import { ast, toRelationshipStyle, } from '../../ast';
import { logger as mainLogger } from '../../logger';
import { stringHash } from '../../utils/stringHash';
const logger = mainLogger.getChild('ModelParser');
function* streamModel(doc) {
    const traverseStack = LinkedList.from(doc.parseResult.value.models.flatMap(m => m.elements));
    const relations = [];
    let el;
    while ((el = traverseStack.shift())) {
        if (ast.isRelation(el)) {
            relations.push(el);
            continue;
        }
        if (el.body && el.body.elements && el.body.elements.length > 0) {
            for (const child of el.body.elements) {
                traverseStack.push(child);
            }
        }
        yield el;
    }
    yield* relations;
    return;
}
export function ModelParser(B) {
    return class ModelParser extends B {
        parseModel() {
            const doc = this.doc;
            for (const el of streamModel(doc)) {
                try {
                    if (ast.isElement(el)) {
                        doc.c4Elements.push(this.parseElement(el));
                        continue;
                    }
                    if (ast.isRelation(el)) {
                        if (this.isValid(el)) {
                            doc.c4Relations.push(this.parseRelation(el));
                        }
                        continue;
                    }
                    if (ast.isExtendElement(el)) {
                        const parsed = this.parseExtendElement(el);
                        if (parsed) {
                            doc.c4ExtendElements.push(parsed);
                        }
                        continue;
                    }
                    nonexhaustive(el);
                }
                catch (e) {
                    const astPath = this.getAstNodePath(el);
                    const error = loggable(e);
                    const message = e instanceof Error ? e.message : String(error);
                    logger.warn(`Error on {eltype}: ${message}\n document: {path}\n astpath: {astPath}\n${error}`, {
                        path: doc.uri.path,
                        eltype: el.$type,
                        astPath,
                    });
                }
            }
        }
        parseElement(astNode) {
            const isValid = this.isValid;
            const id = this.resolveFqn(astNode);
            const kind = nonNullable(astNode.kind.ref, 'Element kind is not resolved').name;
            const tags = this.parseTags(astNode.body);
            const style = this.parseElementStyle(astNode.body?.props);
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const astPath = this.getAstNodePath(astNode);
            let [_title, _summary, _technology] = astNode.props ?? [];
            const bodyProps = pipe(astNode.body?.props ?? [], filter(isValid), filter(ast.isElementStringProperty), mapToObj(p => [p.key, p.value]));
            const { title, ...descAndTech } = this.parseBaseProps(bodyProps, {
                title: _title,
                summary: _summary,
                technology: _technology,
            });
            const links = this.parseLinks(astNode.body);
            return exact({
                id,
                kind,
                astPath,
                title: title ?? astNode.name,
                metadata,
                tags: tags ?? undefined,
                ...(links && isNonEmptyArray(links) && { links }),
                ...descAndTech,
                style,
            });
        }
        parseExtendElement(astNode) {
            const id = this.resolveFqn(astNode);
            const tags = this.parseTags(astNode.body);
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const astPath = this.getAstNodePath(astNode);
            const links = this.parseLinks(astNode.body) ?? [];
            if (!tags && isEmpty(metadata ?? {}) && isEmpty(links)) {
                return null;
            }
            return exact({
                id,
                astPath,
                metadata,
                tags,
                links: isNonEmptyArray(links) ? links : null,
            });
        }
        _resolveRelationSource(node) {
            if (isDefined(node.source)) {
                const source = this.parseFqnRef(node.source);
                invariant(FqnRef.isModelRef(source) || FqnRef.isImportRef(source), 'Relation source must be a model reference');
                return source;
            }
            if (ast.isElementBody(node.$container)) {
                return {
                    model: this.resolveFqn(node.$container.$container),
                };
            }
            if (ast.isExtendElementBody(node.$container)) {
                return {
                    model: this.resolveFqn(node.$container.$container),
                };
            }
            throw new Error('RelationRefError: Invalid container for sourceless relation');
        }
        parseRelation(astNode) {
            const isValid = this.isValid;
            const source = this._resolveRelationSource(astNode);
            const target = this.parseFqnRef(astNode.target);
            invariant(FqnRef.isModelRef(target) || FqnRef.isImportRef(target), 'Target must be a model reference');
            const tags = this.parseTags(astNode) ?? this.parseTags(astNode.body);
            const links = this.parseLinks(astNode.body);
            const kind = (astNode.kind ?? astNode.dotKind?.kind)?.ref?.name;
            const metadata = this.getMetadata(astNode.body?.props.find(ast.isMetadataProperty));
            const astPath = this.getAstNodePath(astNode);
            const bodyProps = pipe(astNode.body?.props ?? [], filter(ast.isRelationStringProperty), filter(p => isTruthy(p.value)), mapToObj(p => [p.key, p.value]));
            const navigateTo = pipe(astNode.body?.props ?? [], filter(ast.isRelationNavigateToProperty), map(p => p.value.view.ref?.name), filter(isTruthy), first());
            const { title = '', description, technology } = this.parseBaseProps(bodyProps, {
                // inline props
                title: astNode.title,
                description: astNode.description,
                technology: astNode.technology,
            });
            const styleProp = astNode.body?.props.find(ast.isRelationStyleProperty);
            const id = stringHash(astPath, source.model, target.model);
            return exact({
                id,
                astPath,
                source,
                target,
                title,
                metadata,
                kind,
                tags: tags ?? undefined,
                links: isNonEmptyArray(links) ? links : undefined,
                navigateTo: navigateTo ? navigateTo : undefined,
                description,
                technology,
                ...toRelationshipStyle(styleProp?.props, isValid),
            });
        }
    };
}
