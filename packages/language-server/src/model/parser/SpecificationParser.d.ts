import * as c4 from '@likec4/core';
import { ast } from '../../ast';
import { type Base } from './Base';
export declare function SpecificationParser<TBase extends Base>(B: TBase): {
    new (...args: any[]): {
        parseSpecification(): void;
        parseElementSpecificationNode(specAst: ast.SpecificationElementKind): {
            [key: c4.ElementKind]: c4.ElementSpecification;
        };
        parseElementSpecificationNode(specAst: ast.SpecificationDeploymentNodeKind): {
            [key: c4.DeploymentKind]: c4.ElementSpecification;
        };
        isValid: c4;
        readonly services: import("../../module").LikeC4Services;
        readonly doc: import("../../ast").ParsedLikeC4LangiumDocument;
        get project(): import("../../workspace/ProjectsManager").Project;
        resolveFqn(node: ast.FqnReferenceable): c4.Fqn;
        getAstNodePath(node: c4): any;
        getMetadata(metadataAstNode: ast.MetadataProperty | undefined): {
            [key: string]: string | string[];
        } | undefined;
        parseMarkdownOrString(markdownOrString: ast.MarkdownOrString | undefined): c4.MarkdownOrString | undefined;
        convertTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): any;
        parseTags<E extends {
            tags?: ast.Tags;
        }>(withTags?: E): c4.NonEmptyArray<c4.Tag> | null;
        convertLinks(source?: ast.LinkProperty["$container"]): c4.Link[] | undefined;
        parseLinks(source?: ast.LinkProperty["$container"]): c4.Link[] | undefined;
        parseIconProperty(prop: ast.IconProperty | undefined): c4.IconUrl | undefined;
        parseImageAlias(value: string): string | undefined;
        parseColorLiteral(astNode: ast.ColorLiteral): c4.ColorLiteral | undefined;
        parseElementStyle(elementProps: Array<ast.ElementProperty> | ast.ElementStyleProperty | undefined): import("../../ast").ParsedElementStyle;
        parseStyleProps(styleProps: Array<ast.StyleProperty> | undefined): import("../../ast").ParsedElementStyle;
        parseBaseProps(props: {
            title?: ast.MarkdownOrString | undefined;
            summary?: ast.MarkdownOrString | undefined;
            description?: ast.MarkdownOrString | undefined;
            technology?: ast.MarkdownOrString | undefined;
        }, override?: {
            title?: string | undefined;
            summary?: string | undefined;
            description?: string | undefined;
            technology?: string | undefined;
        }): {
            title?: string;
            summary?: c4.MarkdownOrString;
            description?: c4.MarkdownOrString;
            technology?: string;
        };
    };
} & TBase;
