import type { NonEmptyArray, ProjectId } from '@likec4/core';
import type { LangiumDocument, Stream } from 'langium';
import { DefaultLangiumDocuments } from 'langium';
import { type LikeC4LangiumDocument } from '../ast';
import type { LikeC4SharedServices } from '../module';
export declare class LangiumDocuments extends DefaultLangiumDocuments {
    protected services: LikeC4SharedServices;
    protected compare: any;
    constructor(services: LikeC4SharedServices);
    addDocument(document: LangiumDocument): void;
    /**
     * Returns all user documents, excluding built-in documents.
     */
    get allExcludingBuiltin(): Stream<LikeC4LangiumDocument>;
    projectDocuments(projectId: ProjectId): Stream<LikeC4LangiumDocument>;
    groupedByProject(): Record<ProjectId, NonEmptyArray<LikeC4LangiumDocument>>;
    resetProjectIds(): void;
}
