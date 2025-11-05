import { type Any, type ComputedView, type LayoutedView } from '@likec4/core';
import type { GraphvizJson } from './types-dot';
export declare function parseGraphvizJson<A extends Any, V extends ComputedView<A>>(graphvizJson: GraphvizJson, computedView: V): Extract<LayoutedView<A>, {
    _type: V['_type'];
}>;
