import { DefaultIndexManager, stream } from 'langium';
export class IndexManager extends DefaultIndexManager {
    services;
    constructor(services) {
        super(services);
        this.services = services;
    }
    async updateContent(document, cancelToken) {
        const projects = this.services.workspace.ProjectsManager;
        // Ensure the document is assigned to a project
        document.likec4ProjectId = projects.belongsTo(document.uri);
        await super.updateContent(document, cancelToken);
    }
    projectElements(projectId, nodeType, uris) {
        const projects = this.services.workspace.ProjectsManager;
        let documentUris = stream(this.symbolIndex.keys());
        return documentUris
            .filter(uri => projects.belongsTo(uri) === projectId && (!uris || uris.has(uri)))
            .flatMap(uri => this.getFileDescriptions(uri, nodeType));
    }
}
