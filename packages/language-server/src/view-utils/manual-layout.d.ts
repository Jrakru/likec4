import type * as c4 from '@likec4/core';
import { type ViewManualLayout } from '@likec4/core';
import type { ast } from '../ast';
export declare function serializeToComment(layout: ViewManualLayout): string;
export declare function hasManualLayout(comment: string): boolean;
export declare function deserializeFromComment(comment: string): ViewManualLayout;
export declare function parseViewManualLayout(node: ast.LikeC4View): c4.ViewManualLayout | undefined;
