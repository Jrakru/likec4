import type * as c4 from '@likec4/core';
import { ast } from '../ast';
/**
 * Returns referenced AST Element
 */
export declare function elementRef(node: ast.ElementRef | ast.StrictFqnElementRef): any;
/**
 * Returns FQN of StrictFqnElementRef
 * a.b.c.d - for c node returns a.b.c
 */
export declare function readStrictFqn(node: ast.StrictFqnElementRef | ast.StrictFqnRef): c4.Fqn;
