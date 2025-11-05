import type { AnyAux, ComputedEdge, ComputedNode } from '../../types';
type TopologicalSortParam<A extends AnyAux> = {
    nodes: ReadonlyMap<string, ComputedNode<A>>;
    edges: Iterable<ComputedEdge<A>>;
};
export declare function topologicalSort<A extends AnyAux>(param: TopologicalSortParam<A>): {
    nodes: ComputedNode<A>[];
    edges: ComputedEdge<A>[];
};
export {};
//# sourceMappingURL=topological-sort.d.ts.map