import * as c4 from '@likec4/core';
import { exact } from '@likec4/core';
import { nonNullable } from '@likec4/core/utils';
import { loggable } from '@likec4/log';
import { filter, isNonNullish, isNullish, isTruthy, mapToObj, omitBy, pipe } from 'remeda';
import { ast, parseMarkdownAsString, toRelationshipStyle } from '../../ast';
import { serverLogger } from '../../logger';
import { removeIndent } from './Base';
const logger = serverLogger.getChild('SpecificationParser');
export function SpecificationParser(B) {
    return class SpecificationParser extends B {
        parseSpecification() {
            const { parseResult: { value: { specifications, }, }, c4Specification, } = this.doc;
            const isValid = this.isValid;
            for (const elementSpec of specifications.flatMap(s => s.elements.filter(isValid))) {
                try {
                    Object.assign(c4Specification.elements, this.parseElementSpecificationNode(elementSpec));
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
            for (const deploymentNodeSpec of specifications.flatMap(s => s.deploymentNodes.filter(isValid))) {
                try {
                    Object.assign(c4Specification.deployments, this.parseElementSpecificationNode(deploymentNodeSpec));
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
            const relations_specs = specifications.flatMap(s => s.relationships.filter(this.isValid));
            for (const { kind, props } of relations_specs) {
                try {
                    const kindName = kind.name;
                    if (!isTruthy(kindName)) {
                        continue;
                    }
                    if (kindName in c4Specification.relationships) {
                        logger.warn(`Relationship kind "${kindName}" is already defined`);
                        continue;
                    }
                    const bodyProps = pipe(props.filter(ast.isSpecificationRelationshipStringProperty) ?? [], filter(p => this.isValid(p) && isNonNullish(p.value)), mapToObj(p => [p.key, removeIndent(parseMarkdownAsString(p.value))]), omitBy(isNullish));
                    c4Specification.relationships[kindName] = {
                        ...bodyProps,
                        ...toRelationshipStyle(props.filter(ast.isRelationshipStyleProperty), this.isValid),
                    };
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
            const tags_specs = specifications.flatMap(s => s.tags.filter(this.isValid));
            for (const tagSpec of tags_specs) {
                try {
                    const tag = tagSpec.tag.name;
                    const astPath = this.getAstNodePath(tagSpec.tag);
                    const color = tagSpec.color && this.parseColorLiteral(tagSpec.color);
                    if (isTruthy(tag)) {
                        c4Specification.tags[tag] = {
                            astPath,
                            ...(color ? { color } : {}),
                        };
                    }
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
            const colors_specs = specifications.flatMap(s => s.colors.filter(isValid));
            for (const { name, color } of colors_specs) {
                try {
                    const colorName = name.name;
                    if (colorName in c4Specification.colors) {
                        logger.warn(`Custom color "${colorName}" is already defined`);
                        continue;
                    }
                    c4Specification.colors[colorName] = {
                        color: nonNullable(this.parseColorLiteral(color), `Color "${colorName}" is not valid: ${color}`),
                    };
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
        }
        parseElementSpecificationNode(specAst) {
            const { kind, props } = specAst;
            const kindName = kind.name;
            if (!isTruthy(kindName)) {
                throw new Error('DeploymentNodeKind name is not resolved');
            }
            const tags = this.parseTags(specAst);
            const style = this.parseElementStyle(props.find(ast.isElementStyleProperty));
            const links = this.parseLinks(specAst);
            const bodyProps = pipe(props.filter(ast.isSpecificationElementStringProperty) ?? [], filter(p => this.isValid(p)), mapToObj(p => [p.key, p.value]));
            const baseProps = this.parseBaseProps(bodyProps);
            const notation = removeIndent(parseMarkdownAsString(bodyProps.notation));
            return {
                [kindName]: exact({
                    ...baseProps,
                    notation,
                    tags: tags ?? undefined,
                    ...(links && c4.isNonEmptyArray(links) && { links }),
                    style,
                }),
            };
        }
    };
}
