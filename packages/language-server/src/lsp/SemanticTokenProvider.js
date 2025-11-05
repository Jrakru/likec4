import { invariant, isAnyOf, nonNullable } from '@likec4/core/utils';
import { AbstractSemanticTokenProvider, } from 'langium/lsp';
import { isTruthy } from 'remeda';
import { SemanticTokenModifiers, SemanticTokenTypes } from 'vscode-languageserver-types';
import { ast } from '../ast';
import { logger } from '../logger';
const SemanticTypes = { ...SemanticTokenTypes };
const SemanticModifiers = { ...SemanticTokenModifiers };
function createSemanticTypeMethods(applyHighlight) {
    const modifier = [];
    const self = new Proxy({}, {
        get(_, prop) {
            if (prop === 'modifier') {
                return (mod) => {
                    modifier.push(mod);
                    return self;
                };
            }
            if (prop in SemanticModifiers) {
                modifier.push(SemanticModifiers[prop]);
                return self;
            }
            if (prop in SemanticTypes) {
                return () => applyHighlight(SemanticTypes[prop], modifier);
            }
            throw new Error(`Unknown semantic token type or modifier: ${prop}`);
        },
    });
    return self;
}
const PRUNE = 'Stop Highlighting';
/**
 * Used to stop further highlighting for the current node (processing of its children
 */
const stopHighlight = () => {
    throw PRUNE;
};
export class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
    rules = [];
    constructor(services) {
        super(services);
        this.initRules();
    }
    initRules() {
        this.rules = [];
        const when = (predicate, highlightFn) => {
            const rule = { predicate, highlightFn };
            this.rules.push(rule);
        };
        when(ast.isRelationshipKind, mark => {
            mark.property('name').function();
        });
        when(isAnyOf(ast.isRelation, ast.isOutgoingRelationExpr, ast.isDeploymentRelation), mark => {
            mark.property('kind').function();
        });
        when(ast.isLibIcon, mark => {
            mark.property('name').definition.function();
            stopHighlight();
        });
        when(isAnyOf(ast.isNavigateToProperty, ast.isRelationNavigateToProperty), mark => {
            mark.property('value').readonly.definition.interface();
            stopHighlight();
        });
        when(isAnyOf(ast.isFqnRefExpr, ast.isWildcardExpression), mark => {
            mark.cst().readonly.definition.variable();
            stopHighlight();
        });
        when(ast.isTagRef, mark => {
            mark.cst().type();
            stopHighlight();
        });
        when(ast.isRelationKindDotRef, mark => {
            mark.cst().function();
            stopHighlight();
        });
        when(ast.isWhereRelationKind, mark => {
            if (isTruthy(mark.node.value)) {
                mark.property('value').function();
            }
        });
        when(isAnyOf(ast.isWhereElement, ast.isWhereRelation), mark => {
            if (isTruthy(mark.node.value)) {
                mark.property('value').readonly.definition.type();
            }
        });
        when(isAnyOf(ast.isWhereRelationParticipantKind, ast.isWhereRelationParticipantTag), mark => {
            mark.property('participant').keyword();
        });
        when(ast.isElementKindExpression, mark => {
            if (isTruthy(mark.node.kind)) {
                mark.property('kind').definition.type();
            }
        });
        when(isAnyOf(ast.isGlobalStyleGroup, ast.isGlobalStyle), mark => {
            mark.property('id').readonly.definition.variable();
        });
        when(ast.isViewRuleGlobalStyle, mark => {
            mark.property('style').readonly.definition.variable();
        });
        when(isAnyOf(ast.isGlobalPredicateGroup, ast.isGlobalDynamicPredicateGroup), mark => {
            mark.property('name').readonly.definition.variable();
        });
        when(ast.isViewRuleGlobalPredicateRef, mark => {
            mark.property('predicate').readonly.definition.variable();
        });
        when(ast.isElementTagExpression, mark => {
            if (isTruthy(mark.node.tag)) {
                mark.property('tag').definition.type();
            }
        });
        when(isAnyOf(ast.isFqnRef, ast.isStrictFqnRef), mark => {
            mark.property('value').readonly.definition.variable();
            if (!mark.node.parent) {
                stopHighlight();
            }
        });
        when(ast.isStrictFqnElementRef, mark => {
            mark.property('el').readonly.definition.variable();
            if (!mark.node.parent) {
                stopHighlight();
            }
        });
        when(ast.isSpecificationColor, mark => {
            mark.keyword('color').keyword();
            mark.property('name').readonly.declaration.type();
        });
        when(ast.isSpecificationTag, mark => {
            if (isTruthy(mark.node.color)) {
                mark.keyword('color').property();
            }
        });
        when(isAnyOf(ast.isSpecificationElementKind, ast.isSpecificationRelationshipKind, ast.isSpecificationDeploymentNodeKind), mark => {
            mark.property('kind').readonly.declaration.type();
        });
        when(ast.isTag, mark => {
            mark.property('name').definition.type();
        });
        when(ast.isOpacityProperty, mark => {
            mark.property('value').number();
        });
        when(ast.isIconProperty, mark => {
            if (mark.node.libicon || mark.node.value === 'none') {
                mark.property(mark.node.libicon ? 'libicon' : 'value').defaultLibrary.enum();
                return;
            }
            mark.property('value').string();
        });
        when(ast.isLinkProperty, mark => {
            if (isTruthy(mark.node.value)) {
                mark.property('value').string();
            }
        });
        when(ast.isColorProperty, mark => {
            if (isTruthy(mark.node.customColor)) {
                mark.property('customColor').enum();
            }
            if (isTruthy(mark.node.themeColor)) {
                mark.property('themeColor').enum();
            }
        });
        when(isAnyOf(ast.isShapeProperty, ast.isArrowProperty, ast.isLineProperty, ast.isBorderProperty, ast.isSizeProperty, ast.isDynamicViewDisplayVariantProperty), mark => {
            if (isTruthy(mark.node.value)) {
                mark.property('value').enum();
            }
        });
    }
    highlightElement(node, acceptor) {
        try {
            if (isAnyOf(ast.isElement, ast.isDeploymentNode, ast.isDeployedInstance)(node)) {
                return this.highlightNameAndKind(node);
            }
            if (ast.isLikeC4View(node)) {
                return this.highlightView(node);
            }
            if (ast.isAnyProperty(node) &&
                !isAnyOf(ast.isMetadataProperty, ast.isElementStyleProperty, ast.isRelationStyleProperty)(node)) {
                invariant(node.key);
                acceptor({
                    node,
                    property: 'key',
                    type: SemanticTokenTypes.property,
                });
            }
            for (const { predicate, highlightFn } of this.rules) {
                if (predicate(node)) {
                    highlightFn(this.mark(node));
                    break;
                }
            }
        }
        catch (error) {
            if (error === PRUNE) {
                return 'prune';
            }
            logger.warn(`Error highlighting node of type ${node._type}`, { error });
        }
    }
    highlightNameAndKind(node) {
        const mark = this.mark(node);
        mark.property('name').declaration.readonly.variable();
        if (!ast.isDeployedInstance(node)) {
            this.mark(node).property('kind').keyword();
        }
        if (ast.isElement(node)) {
            if (node.props.length > 0) {
                this.mark(node).property('props').string();
            }
            return;
        }
        // This is DeploymentNode
        if (node.title) {
            this.mark(node).property('title').string();
        }
    }
    highlightView(node) {
        if (node.name) {
            const mark = this.mark(node);
            mark.property('name')
                .modifier('local')
                .declaration
                .readonly
                .interface();
        }
    }
    mark(node) {
        const cst = (cstNode) => {
            return createSemanticTypeMethods((type, modifier) => this.highlightToken({
                range: nonNullable(cstNode ?? node.$cstNode, 'AST node has no CST node').range,
                type,
                modifier,
            }));
        };
        const keyword = (keyword) => {
            return createSemanticTypeMethods((type, modifier) => this.highlightKeyword({
                node,
                keyword,
                type,
                modifier,
            }));
        };
        const property = (property, index) => {
            return createSemanticTypeMethods((type, modifier) => this.highlightProperty({
                node,
                property,
                type,
                modifier,
                ...(index !== undefined ? { index } : {}),
            }));
        };
        return {
            node,
            cst,
            keyword,
            property,
        };
    }
}
