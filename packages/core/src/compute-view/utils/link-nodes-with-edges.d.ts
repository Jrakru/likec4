import type { AnyAux, ComputedEdge, ComputedNode } from '../../types';
/**
 * Update `inEdges` and `outEdges` props of nodes based on the edges
 * Mutates nodes and updates their in/out edges
 */
export declare function linkNodesWithEdges<A extends AnyAux>(nodesMap: ReadonlyMap<any, ComputedNode<A>>, edges: ComputedEdge<A>[]): void;
//# sourceMappingURL=link-nodes-with-edges.d.ts.map