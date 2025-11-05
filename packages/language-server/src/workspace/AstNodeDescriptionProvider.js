import { AstUtils, DefaultAstNodeDescriptionProvider, } from 'langium';
export class AstNodeDescriptionProvider extends DefaultAstNodeDescriptionProvider {
    services;
    constructor(services) {
        super(services);
        this.services = services;
    }
    createDescription(node, name, document) {
        const doc = document ?? AstUtils.getDocument(node);
        const description = super.createDescription(node, name, document);
        doc.likec4ProjectId ??= this.services.shared.workspace.ProjectsManager.belongsTo(doc.uri);
        description.likec4ProjectId = doc.likec4ProjectId;
        return description;
    }
}
