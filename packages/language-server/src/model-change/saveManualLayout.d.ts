import { type ViewChange } from '@likec4/core';
import { TextEdit } from 'vscode-languageserver-types';
import { ast, type ParsedAstView, type ParsedLikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
export type ManualLayoutArg = {
    view: ParsedAstView;
    doc: ParsedLikeC4LangiumDocument;
    viewAst: ast.LikeC4View;
    layout: ViewChange.SaveManualLayout['layout'];
};
export declare function saveManualLayout(_services: LikeC4Services, { viewAst, layout }: ManualLayoutArg): TextEdit;
