import { invariant, nonexhaustive, nonNullable } from '@likec4/core';
import { loggable } from '@likec4/log';
import { AstUtils } from 'langium';
import { isBoolean, isDefined, isNonNullish, isTruthy } from 'remeda';
import { ast, parseAstOpacityProperty, parseAstSizeValue, parseMarkdownAsString, toColor } from '../../ast';
import { serverLogger } from '../../logger';
import { projectIdFrom } from '../../utils';
import { importsRef, instanceRef } from '../../utils/fqnRef';
import { createBinaryOperator, parseWhereClause } from '../model-parser-where';
import { removeIndent } from './Base';
const logger = serverLogger.getChild('ExpressionV2Parser');
const location = (astNode) => {
    const cst = astNode.$cstNode;
    const position = cst ? `:${cst.range.start.line + 1}:${cst.range.start.character + 1}` : '';
    return `${AstUtils.getDocument(astNode).uri.fsPath}${position}`;
};
export function ExpressionV2Parser(B) {
    return class ExpressionV2Parser extends B {
        parseFqnRef(astNode) {
            const refValue = nonNullable(astNode.value?.ref, () => `FqnRef "${astNode.$cstNode?.text}" is empty at ${location(astNode)}`);
            if (ast.isImported(refValue)) {
                const fqnRef = {
                    project: projectIdFrom(refValue),
                    model: this.resolveFqn(nonNullable(refValue.imported.ref, `FqnRef is empty of imported: ${refValue.$cstNode?.text}`)),
                };
                this.doc.c4Imports.set(fqnRef.project, fqnRef.model);
                return fqnRef;
            }
            if (ast.isElement(refValue)) {
                const imported = importsRef(astNode);
                if (imported) {
                    const fqnRef = {
                        project: projectIdFrom(imported),
                        model: this.resolveFqn(refValue),
                    };
                    this.doc.c4Imports.set(fqnRef.project, fqnRef.model);
                    return fqnRef;
                }
                const deployedInstanceAst = instanceRef(astNode);
                if (!deployedInstanceAst) {
                    return {
                        model: this.resolveFqn(refValue),
                    };
                }
                const deployment = this.resolveFqn(deployedInstanceAst);
                const element = this.resolveFqn(refValue);
                return {
                    deployment,
                    element,
                };
            }
            if (ast.isDeploymentElement(refValue)) {
                return {
                    deployment: this.resolveFqn(refValue),
                };
            }
            nonexhaustive(refValue);
        }
        parseExpressionV2(astNode) {
            if (ast.isFqnExprOrWith(astNode)) {
                return this.parseFqnExprOrWith(astNode);
            }
            if (ast.isRelationExprOrWith(astNode)) {
                return this.parseRelationExprOrWith(astNode);
            }
            nonexhaustive(astNode);
        }
        parseFqnExprOrWith(astNode) {
            if (ast.isFqnExprWith(astNode)) {
                return this.parseFqnExprWith(astNode);
            }
            if (ast.isFqnExprOrWhere(astNode)) {
                return this.parseFqnExprOrWhere(astNode);
            }
            nonexhaustive(astNode);
        }
        parseFqnExprWith(astNode) {
            const expr = this.parseFqnExprOrWhere(astNode.subject);
            const props = astNode.custom?.props ?? [];
            return props.reduce((acc, prop) => {
                if (!this.isValid(prop)) {
                    return acc;
                }
                if (ast.isNavigateToProperty(prop)) {
                    const viewId = prop.value.view.$refText;
                    if (isTruthy(viewId)) {
                        acc.custom.navigateTo = viewId;
                    }
                    return acc;
                }
                if (ast.isElementStringProperty(prop)) {
                    if (isDefined(prop.value) && prop.key !== 'summary') {
                        if (prop.key === 'description') {
                            const parsed = this.parseMarkdownOrString(prop.value);
                            if (parsed) {
                                acc.custom['description'] = parsed;
                            }
                        }
                        else {
                            acc.custom[prop.key] = removeIndent(parseMarkdownAsString(prop.value)) || '';
                        }
                    }
                    return acc;
                }
                if (ast.isIconProperty(prop)) {
                    const value = this.parseIconProperty(prop);
                    if (isDefined(value)) {
                        acc.custom[prop.key] = value;
                    }
                    return acc;
                }
                if (ast.isColorProperty(prop)) {
                    const value = toColor(prop);
                    if (isDefined(value)) {
                        acc.custom[prop.key] = value;
                    }
                    return acc;
                }
                if (ast.isShapeProperty(prop)) {
                    if (isDefined(prop.value)) {
                        acc.custom[prop.key] = prop.value;
                    }
                    return acc;
                }
                if (ast.isBorderProperty(prop)) {
                    if (isDefined(prop.value)) {
                        acc.custom[prop.key] = prop.value;
                    }
                    return acc;
                }
                if (ast.isOpacityProperty(prop)) {
                    if (isDefined(prop.value)) {
                        acc.custom[prop.key] = parseAstOpacityProperty(prop);
                    }
                    return acc;
                }
                if (ast.isNotationProperty(prop)) {
                    const value = isTruthy(prop.value) ? removeIndent(parseMarkdownAsString(prop.value)) : undefined;
                    if (value) {
                        acc.custom[prop.key] = value;
                    }
                    return acc;
                }
                if (ast.isMultipleProperty(prop)) {
                    if (isBoolean(prop.value)) {
                        acc.custom[prop.key] = prop.value;
                    }
                    return acc;
                }
                if (ast.isShapeSizeProperty(prop)) {
                    if (isTruthy(prop.value)) {
                        acc.custom[prop.key] = parseAstSizeValue(prop);
                    }
                    return acc;
                }
                if (ast.isTextSizeProperty(prop)) {
                    if (isTruthy(prop.value)) {
                        acc.custom[prop.key] = parseAstSizeValue(prop);
                    }
                    return acc;
                }
                if (ast.isPaddingSizeProperty(prop)) {
                    if (isTruthy(prop.value)) {
                        acc.custom[prop.key] = parseAstSizeValue(prop);
                    }
                    return acc;
                }
                nonexhaustive(prop);
            }, {
                custom: {
                    expr,
                },
            });
        }
        parseFqnExprOrWhere(astNode) {
            if (ast.isFqnExprWhere(astNode)) {
                return this.parseFqnExprWhere(astNode);
            }
            if (ast.isFqnExpr(astNode)) {
                return this.parseFqnExpr(astNode);
            }
            nonexhaustive(astNode);
        }
        parseFqnExprWhere(astNode) {
            invariant(!ast.isFqnExprWhere(astNode.subject), 'FqnExprWhere is not allowed as subject of FqnExprWhere');
            return {
                where: {
                    expr: this.parseFqnExpr(astNode.subject),
                    condition: astNode.where ? parseWhereClause(astNode.where) : {
                        kind: { neq: '--always-true--' },
                    },
                },
            };
        }
        parseFqnExpr(astNode) {
            if (ast.isWildcardExpression(astNode)) {
                return {
                    wildcard: true,
                };
            }
            if (ast.isElementKindExpression(astNode)) {
                invariant(astNode.kind?.ref, 'ElementKindExpr kind is not resolved: ' + astNode.$cstNode?.text);
                return {
                    elementKind: astNode.kind.ref.name,
                    isEqual: astNode.isEqual,
                };
            }
            if (ast.isElementTagExpression(astNode)) {
                invariant(astNode.tag.tag.ref, 'ElementTagExpr tag is not resolved: ' + astNode.$cstNode?.text);
                let elementTag = astNode.tag.tag.$refText;
                return {
                    elementTag: elementTag,
                    isEqual: astNode.isEqual,
                };
            }
            if (ast.isFqnRefExpr(astNode)) {
                return this.parseFqnRefExpr(astNode);
            }
            nonexhaustive(astNode);
        }
        parseFqnRefExpr(astNode) {
            const ref = this.parseFqnRef(astNode.ref);
            switch (true) {
                case astNode.selector === '._':
                    return {
                        ref,
                        selector: 'expanded',
                    };
                case astNode.selector === '.**':
                    return {
                        ref,
                        selector: 'descendants',
                    };
                case astNode.selector === '.*':
                    return {
                        ref,
                        selector: 'children',
                    };
                default:
                    return { ref };
            }
        }
        parseFqnExpressions(astNode) {
            const exprs = [];
            let iter = astNode;
            while (iter) {
                try {
                    if (isNonNullish(iter.value) && this.isValid(iter.value)) {
                        exprs.push(this.parseFqnExpr(iter.value));
                    }
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
                iter = iter.prev;
            }
            return exprs.reverse();
        }
        parseRelationExprOrWith(astNode) {
            if (ast.isRelationExprWith(astNode)) {
                return this.parseRelationExprWith(astNode);
            }
            if (ast.isRelationExprOrWhere(astNode)) {
                return this.parseRelationExprOrWhere(astNode);
            }
            nonexhaustive(astNode);
        }
        parseRelationExprWith(astNode) {
            const expr = this.parseRelationExprOrWhere(astNode.subject);
            const customProps = this.parseCustomRelationProperties(astNode.custom);
            return {
                customRelation: {
                    ...customProps,
                    expr,
                },
            };
        }
        parseCustomRelationProperties(custom) {
            const props = custom?.props ?? [];
            return props.reduce((acc, prop) => {
                if (ast.isRelationStringProperty(prop) || ast.isNotationProperty(prop) || ast.isNotesProperty(prop)) {
                    const value = isTruthy(prop.value) ? removeIndent(parseMarkdownAsString(prop.value)) : undefined;
                    if (value) {
                        acc[prop.key] = value;
                    }
                    return acc;
                }
                if (ast.isArrowProperty(prop)) {
                    if (isTruthy(prop.value)) {
                        acc[prop.key] = prop.value;
                    }
                    return acc;
                }
                if (ast.isColorProperty(prop)) {
                    const value = toColor(prop);
                    if (isTruthy(value)) {
                        acc[prop.key] = value;
                    }
                    return acc;
                }
                if (ast.isLineProperty(prop)) {
                    if (isTruthy(prop.value)) {
                        acc[prop.key] = prop.value;
                    }
                    return acc;
                }
                if (ast.isRelationNavigateToProperty(prop)) {
                    const viewId = prop.value.view.ref?.name;
                    if (isTruthy(viewId)) {
                        acc[prop.key] = viewId;
                    }
                    return acc;
                }
                nonexhaustive(prop);
            }, {});
        }
        parseRelationExprOrWhere(astNode) {
            if (ast.isRelationExprWhere(astNode)) {
                return this.parseRelationExprWhere(astNode);
            }
            if (ast.isRelationExpr(astNode)) {
                return this.parseRelationExpr(astNode);
            }
            nonexhaustive(astNode);
        }
        parseRelationExprWhere(astNode) {
            invariant(!ast.isRelationExprWhere(astNode.subject), 'RelationExprWhere is not allowed as subject of RelationExprWhere');
            const relationOrWhereExpr = this.parseRelationExpr(astNode.subject);
            const expr = relationOrWhereExpr.where?.expr ?? relationOrWhereExpr;
            const kindCondition = relationOrWhereExpr.where?.condition;
            const whereCondition = astNode.where ? parseWhereClause(astNode.where) : null;
            let condition;
            if (whereCondition && kindCondition) {
                condition = createBinaryOperator('and', kindCondition, whereCondition);
            }
            else {
                condition = whereCondition
                    ?? kindCondition
                    ?? { kind: { neq: '--always-true--' } };
            }
            return {
                where: {
                    expr: expr,
                    condition: condition,
                },
            };
        }
        parseRelationExpr(astNode) {
            switch (astNode.$type) {
                case 'DirectedRelationExpr':
                    return this.wrapInWhere({
                        source: this.parseFqnExpr(astNode.source.from),
                        target: this.parseFqnExpr(astNode.target),
                        isBidirectional: astNode.source.isBidirectional,
                    }, this.parseInlineKindCondition(astNode.source));
                case 'InOutRelationExpr':
                    return {
                        inout: this.parseFqnExpr(astNode.inout.to),
                    };
                case 'OutgoingRelationExpr':
                    return this.wrapInWhere({ outgoing: this.parseFqnExpr(astNode.from) }, this.parseInlineKindCondition(astNode));
                case 'IncomingRelationExpr':
                    return {
                        incoming: this.parseFqnExpr(astNode.to),
                    };
                default:
                    nonexhaustive(astNode);
            }
        }
        parseInlineKindCondition(astNode) {
            const kind = astNode.kind ?? astNode.dotKind?.kind;
            if (kind) {
                invariant(kind.ref, 'Kind is not resolved: ' + astNode.$cstNode?.text);
                return { kind: { eq: kind.ref?.name } };
            }
            return null;
        }
        wrapInWhere(expr, condition) {
            return condition ? { where: { expr, condition } } : expr;
        }
    };
}
