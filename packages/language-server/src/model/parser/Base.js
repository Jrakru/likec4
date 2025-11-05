import { exact, GlobalFqn, isNonEmptyArray, nonexhaustive, nonNullable, } from '@likec4/core';
import { filter, flatMap, groupBy, isArray, isBoolean, isEmpty, isNumber, isString, isTruthy, mapValues, pipe, unique, } from 'remeda';
import stripIndent from 'strip-indent';
import { hasLeadingSlash, hasProtocol, isRelative, joinRelativeURL, joinURL } from 'ufo';
import { ast, parseAstOpacityProperty, parseAstPercent, parseAstSizeValue, parseMarkdownAsString, toColor, } from '../../ast';
import { serverLogger } from '../../logger';
import { projectIdFrom } from '../../utils';
import { readStrictFqn } from '../../utils/elementRef';
import { checksFromDiagnostics } from '../../validation';
const logger = serverLogger.getChild('BaseParser');
export function toSingleLine(str) {
    if (str === null || str === undefined) {
        return undefined;
    }
    const without = removeIndent(str);
    if (isString(without)) {
        return without.split('\n').join(' ');
    }
    if ('md' in without) {
        return {
            md: without.md.split('\n').join('  '),
        };
    }
    return {
        txt: without.txt.split('\n').join(' '),
    };
}
// export function removeIndent(str: ast.MarkdownOrString | string): MarkdownOrString | string
export function removeIndent(str) {
    if (str === null || str === undefined) {
        return undefined;
    }
    switch (true) {
        case isString(str):
            return stripIndent(str).trim();
        case ast.isMarkdownOrString(str) && isTruthy(str.markdown):
            return {
                md: stripIndent(str.markdown).trim(),
            };
        case ast.isMarkdownOrString(str) && isTruthy(str.text):
            return {
                txt: stripIndent(str.text).trim(),
            };
        default:
            return undefined;
    }
}
export class BaseParser {
    services;
    doc;
    isValid;
    constructor(services, doc) {
        this.services = services;
        this.doc = doc;
        // do nothing
        this.isValid = checksFromDiagnostics(doc).isValid;
    }
    get project() {
        return this.services.shared.workspace.ProjectsManager.getProject(this.doc);
    }
    resolveFqn(node) {
        if (ast.isImported(node)) {
            const project = projectIdFrom(node);
            const fqn = this.resolveFqn(nonNullable(node.imported.ref, `FqnRef is empty of imported: ${node.$cstNode?.text}`));
            this.doc.c4Imports.set(project, fqn);
            return GlobalFqn(project, fqn);
        }
        if (ast.isExtendElement(node)) {
            return readStrictFqn(node.element);
        }
        if (ast.isExtendDeployment(node)) {
            return readStrictFqn(node.deploymentNode);
        }
        if (ast.isDeploymentElement(node)) {
            return this.services.likec4.DeploymentsIndex.getFqn(node);
        }
        return this.services.likec4.FqnIndex.getFqn(node);
    }
    getAstNodePath(node) {
        return this.services.workspace.AstNodeLocator.getAstNodePath(node);
    }
    getMetadata(metadataAstNode) {
        if (!metadataAstNode || !this.isValid(metadataAstNode) || isEmpty(metadataAstNode.props)) {
            return undefined;
        }
        // Helper function to extract string values from MetadataValue
        const extractValues = (value) => {
            if (ast.isMarkdownOrString(value)) {
                const mdOrStr = removeIndent(value);
                if (!mdOrStr)
                    return [];
                // Handle both string and MarkdownOrString types
                if (typeof mdOrStr === 'string') {
                    return isTruthy(mdOrStr) ? [mdOrStr] : [];
                }
                else {
                    // MarkdownOrString object with txt or md property
                    const strValue = mdOrStr.md || mdOrStr.txt;
                    return isTruthy(strValue) ? [strValue] : [];
                }
            }
            else if (ast.isMetadataArray(value)) {
                return value.values
                    .map(v => removeIndent(v))
                    .map(v => {
                    if (typeof v === 'string') {
                        return v;
                    }
                    else {
                        // MarkdownOrString object
                        return v.md || v.txt;
                    }
                })
                    .filter(isTruthy);
            }
            return [];
        };
        // Transform metadata attributes into key-value pairs
        const keyValuePairs = pipe(metadataAstNode.props, flatMap(p => extractValues(p.value).map(v => [p.key, v])), filter(([_, value]) => isTruthy(value)));
        if (isEmpty(keyValuePairs)) {
            return undefined;
        }
        // Group by key to handle duplicate keys
        const groupedData = pipe(keyValuePairs, groupBy(([key]) => key), mapValues(pairs => pairs.map(([_, value]) => value)));
        // Convert to final format: single values as string, multiple values as string[]
        const data = {};
        for (const [key, values] of Object.entries(groupedData)) {
            if (values && values.length > 0) {
                data[key] = values.length === 1 ? values[0] : values;
            }
        }
        return isEmpty(data) ? undefined : data;
    }
    parseMarkdownOrString(markdownOrString) {
        if (ast.isMarkdownOrString(markdownOrString)) {
            return removeIndent(markdownOrString);
        }
        return undefined;
    }
    convertTags(withTags) {
        return this.parseTags(withTags);
    }
    parseTags(withTags) {
        let iter = withTags?.tags;
        if (!iter) {
            return null;
        }
        let tags = [];
        while (iter) {
            try {
                if (this.isValid(iter)) {
                    const values = iter.values.map(t => t.tag.ref?.name).filter(isTruthy);
                    if (values.length > 0) {
                        tags.push(...values);
                    }
                }
            }
            catch {
                // ignore
            }
            iter = iter.prev;
        }
        return isNonEmptyArray(tags) ? unique(tags) : null;
    }
    convertLinks(source) {
        return this.parseLinks(source);
    }
    parseLinks(source) {
        if (!source?.props || source.props.length === 0) {
            return undefined;
        }
        return pipe(source.props, filter(ast.isLinkProperty), flatMap(p => {
            if (!this.isValid(p)) {
                return [];
            }
            const url = p.value;
            if (isTruthy(url)) {
                const title = isTruthy(p.title) ? toSingleLine(p.title) : undefined;
                const relative = this.services.lsp.DocumentLinkProvider.relativeLink(this.doc, url);
                return {
                    url,
                    ...(title && { title }),
                    ...(relative && relative !== url && { relative }),
                };
            }
            return [];
        }));
    }
    parseIconProperty(prop) {
        if (!prop || !this.isValid(prop)) {
            return undefined;
        }
        const { libicon, value } = prop;
        switch (true) {
            case !!libicon: {
                return libicon.ref?.name;
            }
            case value && value === 'none': {
                return value;
            }
            case value && hasProtocol(value): {
                if (value.startsWith('file:')) {
                    logger.warn(`Icon property '${value}' used the 'file' protocol which is not supported`);
                    return undefined;
                }
                return value;
            }
            case value && value.startsWith('@'): {
                return this.parseImageAlias(value);
            }
            case value && isRelative(value): {
                return joinRelativeURL(this.doc.uri.toString(), '../', value);
            }
            case value && hasLeadingSlash(value): {
                return joinURL(this.project.folderUri.toString(), value);
            }
            default: {
                logger.warn(`Icon property '${value}' is not a valid URL, library icon, image alias or 'none'`);
                return undefined;
            }
        }
    }
    parseImageAlias(value) {
        // Extract the alias name (e.g., '@infra' from '@infra/backend.svg')
        const slashIndex = value.indexOf('/');
        const aliasName = slashIndex > 0 ? value.substring(0, slashIndex) : value;
        const remainingPath = slashIndex > 0 ? value.substring(slashIndex + 1) : '';
        // Get imageAliases from project config, or use default '@' -> './images' mapping
        const imageAliases = { '@': './images', ...this.project.config.imageAliases };
        // Look up the alias path
        const aliasPath = imageAliases[aliasName];
        if (!aliasPath) {
            logger.warn(`Image alias "${aliasName}" not found in project configuration`);
            return undefined;
        }
        // Combine the alias path with the remaining path
        const fullPath = remainingPath ? joinURL(aliasPath, remainingPath) : aliasPath;
        // Make it relative to the **project root**, not the current document.
        return joinURL(this.project.folderUri.toString(), fullPath);
    }
    parseColorLiteral(astNode) {
        if (!this.isValid(astNode)) {
            return undefined;
        }
        if (ast.isHexColor(astNode)) {
            return `#${astNode.hex}`;
        }
        if (ast.isRGBAColor(astNode)) {
            let alpha = isNumber(astNode.alpha) ? astNode.alpha : undefined;
            if (isString(astNode.alpha)) {
                alpha = parseAstPercent(astNode.alpha) / 100;
            }
            if (alpha !== undefined) {
                return `rgba(${astNode.red},${astNode.green},${astNode.blue},${alpha})`;
            }
            return `rgb(${astNode.red},${astNode.green},${astNode.blue})`;
        }
        nonexhaustive(astNode);
    }
    parseElementStyle(elementProps) {
        if (!elementProps) {
            return {};
        }
        if (isArray(elementProps)) {
            const style = this.parseStyleProps(elementProps.find(ast.isElementStyleProperty)?.props);
            // Property on element has higher priority than from style
            const iconProp = this.parseIconProperty(elementProps.find(ast.isIconProperty));
            if (iconProp) {
                style.icon = iconProp;
            }
            return style;
        }
        return this.parseStyleProps(elementProps.props);
    }
    parseStyleProps(styleProps) {
        const result = {};
        if (!styleProps || styleProps.length === 0) {
            return result;
        }
        for (const prop of styleProps) {
            if (!this.isValid(prop)) {
                continue;
            }
            switch (true) {
                case ast.isBorderProperty(prop): {
                    if (isTruthy(prop.value)) {
                        result.border = prop.value;
                    }
                    break;
                }
                case ast.isColorProperty(prop): {
                    const color = toColor(prop);
                    if (isTruthy(color)) {
                        result.color = color;
                    }
                    break;
                }
                case ast.isShapeProperty(prop): {
                    if (isTruthy(prop.value)) {
                        result.shape = prop.value;
                    }
                    break;
                }
                case ast.isIconProperty(prop): {
                    const icon = this.parseIconProperty(prop);
                    if (isTruthy(icon)) {
                        result.icon = icon;
                    }
                    break;
                }
                case ast.isOpacityProperty(prop): {
                    result.opacity = parseAstOpacityProperty(prop);
                    break;
                }
                case ast.isMultipleProperty(prop): {
                    result.multiple = isBoolean(prop.value) ? prop.value : false;
                    break;
                }
                case ast.isShapeSizeProperty(prop): {
                    if (isTruthy(prop.value)) {
                        result.size = parseAstSizeValue(prop);
                    }
                    break;
                }
                case ast.isPaddingSizeProperty(prop): {
                    if (isTruthy(prop.value)) {
                        result.padding = parseAstSizeValue(prop);
                    }
                    break;
                }
                case ast.isTextSizeProperty(prop): {
                    if (isTruthy(prop.value)) {
                        result.textSize = parseAstSizeValue(prop);
                    }
                    break;
                }
                default:
                    nonexhaustive(prop);
            }
        }
        return exact(result);
    }
    /**
     * Parse base properties: title, description and technology
     *
     * @param props - body properties (inside '{...}')
     * @param override - optional, inline properties (right on the node)
     *                   have higher priority and override body properties
     */
    parseBaseProps(props, override) {
        const title = removeIndent(override?.title ?? parseMarkdownAsString(props.title));
        const description = override?.description
            ? { txt: removeIndent(override.description) }
            : this.parseMarkdownOrString(props.description);
        const summary = override?.summary
            ? { txt: removeIndent(override.summary) }
            : this.parseMarkdownOrString(props.summary);
        const technology = toSingleLine(override?.technology) ??
            removeIndent(parseMarkdownAsString(props.technology));
        return exact({
            title,
            summary,
            description,
            technology,
        });
    }
}
