import { DefaultWeakMap, invariant, MultiMap } from '@likec4/core/utils';
import { loggable } from '@likec4/log';
import { DocumentState } from 'langium';
import { pipe } from 'remeda';
import { DiagnosticSeverity } from 'vscode-languageserver-types';
import { isLikeC4LangiumDocument } from '../ast';
import { isLikeC4Builtin } from '../likec4lib';
import { logger as rootLogger } from '../logger';
import { BaseParser } from './parser/Base';
import { DeploymentModelParser } from './parser/DeploymentModelParser';
import { DeploymentViewParser } from './parser/DeploymentViewParser';
import { ExpressionV2Parser } from './parser/FqnRefParser';
import { GlobalsParser } from './parser/GlobalsParser';
import { ImportsParser } from './parser/ImportsParser';
import { ModelParser } from './parser/ModelParser';
import { PredicatesParser } from './parser/PredicatesParser';
import { SpecificationParser } from './parser/SpecificationParser';
import { ViewsParser } from './parser/ViewsParser';
const DocumentParserFromMixins = pipe(BaseParser, ExpressionV2Parser, ImportsParser, ModelParser, DeploymentModelParser, DeploymentViewParser, PredicatesParser, SpecificationParser, ViewsParser, GlobalsParser);
export class DocumentParser extends DocumentParserFromMixins {
}
const logger = rootLogger.getChild('ModelParser');
export class LikeC4ModelParser {
    services;
    cachedParsers = new DefaultWeakMap((doc) => this.createParser(doc));
    constructor(services) {
        this.services = services;
        services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Linked, doc => {
            try {
                if (services.shared.workspace.ProjectsManager.checkIfExcluded(doc)) {
                    return;
                }
                if (!isLikeC4Builtin(doc.uri)) {
                    this.cachedParsers.set(doc, this.createParser(doc));
                }
            }
            catch (e) {
                logger.warn(loggable(e));
            }
        });
        // We need to clean up cached parser after document is validated
        // Because after that parser takes into account validation results
        services.shared.workspace.DocumentBuilder.onDocumentPhase(DocumentState.Validated, doc => {
            if (doc.diagnostics?.some(d => d.severity === DiagnosticSeverity.Error)) {
                this.cachedParsers.delete(doc);
            }
        });
    }
    documents(projectId) {
        return this.services.shared.workspace.LangiumDocuments.projectDocuments(projectId).map(d => this.parse(d));
    }
    parse(doc) {
        try {
            const parser = this.forDocument(doc);
            return parser.doc;
        }
        catch (cause) {
            throw new Error(`Error parsing document ${doc.uri.toString()}`, { cause });
        }
    }
    forDocument(doc) {
        if (doc.state < DocumentState.Linked) {
            logger.warn(`Document {doc} is not linked`, { doc: doc.uri.toString() });
        }
        return this.cachedParsers.get(doc);
    }
    createParser(doc) {
        invariant(isLikeC4LangiumDocument(doc), `Document ${doc.uri.toString()} is not a LikeC4 document`);
        if (doc.likec4ProjectId) {
            logger.debug(`create parser {projectId} document {doc}`, {
                projectId: doc.likec4ProjectId,
                doc: doc.uri.toString(),
            });
        }
        else {
            logger.warn(`create parser for document without project {doc}`, { doc: doc.uri.toString() });
        }
        const props = {
            c4Specification: {
                tags: {},
                elements: {},
                relationships: {},
                colors: {},
                deployments: {},
            },
            c4Elements: [],
            c4ExtendElements: [],
            c4ExtendDeployments: [],
            c4Relations: [],
            c4Deployments: [],
            c4DeploymentRelations: [],
            c4Globals: {
                predicates: {},
                dynamicPredicates: {},
                styles: {},
            },
            c4Views: [],
            c4Imports: new MultiMap(Set),
        };
        doc = Object.assign(doc, props);
        const parser = new DocumentParser(this.services, doc);
        try {
            parser.parseSpecification();
            parser.parseImports();
            parser.parseModel();
            parser.parseGlobals();
            parser.parseDeployment();
            parser.parseViews();
        }
        catch (e) {
            logger.error(`Error parsing document {doc}`, { doc: doc.uri.toString(), error: e });
        }
        return parser;
    }
}
