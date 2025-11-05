import { Location, Range, TextEdit } from 'vscode-languageserver-types';
import type { ParsedLikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
import type { ChangeView } from '../protocol';
export declare class LikeC4ModelChanges {
    private services;
    private locator;
    constructor(services: LikeC4Services);
    applyChange(changeView: ChangeView.Params): Promise<Location | null>;
    protected convertToTextEdit({ viewId, projectId, change }: ChangeView.Params): {
        doc: ParsedLikeC4LangiumDocument;
        modifiedRange: Range;
        edits: TextEdit[];
    };
}
