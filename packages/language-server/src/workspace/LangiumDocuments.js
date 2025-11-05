import { compareNaturalHierarchically } from '@likec4/core/utils';
import { DefaultLangiumDocuments } from 'langium';
import { groupBy, prop } from 'remeda';
import { isLikeC4LangiumDocument } from '../ast';
import { isLikeC4Builtin } from '../likec4lib';
/**
 * Compare function for document paths to ensure consistent order
 */
const compare = compareNaturalHierarchically('/', true);
const ensureOrder = (a, b) => compare(a.uri.path, b.uri.path);
export class LangiumDocuments extends DefaultLangiumDocuments {
    services;
    compare = compareNaturalHierarchically('/', true);
    constructor(services) {
        super(services);
        this.services = services;
    }
    addDocument(document) {
        const uriString = document.uri.toString();
        if (this.documentMap.has(uriString)) {
            throw new Error(`A document with the URI '${uriString}' is already present.`);
        }
        const docs = [...this.documentMap.values(), document].sort(ensureOrder);
        // Clear and re-add documents to ensure consistent order
        this.documentMap.clear();
        for (const doc of docs) {
            this.documentMap.set(doc.uri.toString(), doc);
        }
    }
    /**
     * Returns all user documents, excluding built-in documents.
     */
    get allExcludingBuiltin() {
        const projects = this.services.workspace.ProjectsManager;
        return super.all.filter((doc) => {
            if (!isLikeC4LangiumDocument(doc) || isLikeC4Builtin(doc.uri) || projects.checkIfExcluded(doc)) {
                return false;
            }
            doc.likec4ProjectId = projects.belongsTo(doc.uri);
            return true;
        });
    }
    projectDocuments(projectId) {
        return this.allExcludingBuiltin.filter(doc => doc.likec4ProjectId === projectId);
    }
    groupedByProject() {
        return groupBy(this.allExcludingBuiltin.toArray(), prop('likec4ProjectId'));
    }
    resetProjectIds() {
        const projects = this.services.workspace.ProjectsManager;
        this.all.forEach(doc => {
            if (!isLikeC4LangiumDocument(doc) || isLikeC4Builtin(doc.uri)) {
                return;
            }
            doc.likec4ProjectId = projects.belongsTo(doc);
        });
    }
}
