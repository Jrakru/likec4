import { invariant } from '@likec4/core';
import indentString from 'indent-string';
import { CstUtils, GrammarUtils } from 'langium';
import { TextEdit } from 'vscode-languageserver-types';
import { serializeToComment } from '../view-utils/manual-layout';
const { findNodeForProperty } = GrammarUtils;
export function saveManualLayout(_services, { viewAst, layout }) {
    invariant(viewAst.$cstNode, 'invalid view.$cstNode');
    const commentCst = CstUtils.findCommentNode(viewAst.$cstNode, ['BLOCK_COMMENT']);
    let txt = serializeToComment(layout);
    if (viewAst.$cstNode.range.start.character > 0) {
        txt = indentString(txt, viewAst.$cstNode.range.start.character);
        // const indent = ' '.repeat(viewAst.$cstNode.range.start.character)
        // txt = txt.split('\n').map(l => indent + l).join('\n')
    }
    if (commentCst) {
        // Do not indent the first line
        return TextEdit.replace(commentCst.range, txt.trimStart());
    }
    return TextEdit.insert({
        line: viewAst.$cstNode.range.start.line,
        character: 0
    }, txt + '\n');
}
