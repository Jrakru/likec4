import { type ViewChange } from '@likec4/core';
import { TextEdit } from 'vscode-languageserver-types';
import { ast, type ParsedAstView, type ParsedLikeC4LangiumDocument } from '../ast';
import type { LikeC4Services } from '../module';
type ChangeViewLayoutArg = {
    view: ParsedAstView;
    doc: ParsedLikeC4LangiumDocument;
    viewAst: ast.LikeC4View;
    layout: ViewChange.ChangeAutoLayout['layout'];
};
export declare function changeViewLayout(_services: LikeC4Services, { view, viewAst, layout }: ChangeViewLayoutArg): TextEdit;
export {};
