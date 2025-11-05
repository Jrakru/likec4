import type { AnyAux, ComputedNode } from '../../types';
/**
 * Returns the ancestors of given computed node, starting with the direct parent and ending with the root node.
 */
export declare function ancestorsOfNode<A extends AnyAux>(node: ComputedNode<A>, nodes: ReadonlyMap<string, ComputedNode<A>>): ReadonlyArray<ComputedNode<A>>;
//# sourceMappingURL=ancestorsOfNode.d.ts.map