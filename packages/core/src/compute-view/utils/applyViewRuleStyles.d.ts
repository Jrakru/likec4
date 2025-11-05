import { type AnyAux, type AnyViewRuleStyle, type ComputedNode, type ElementViewRule } from '../../types';
type Predicate<T> = (x: T) => boolean;
export declare function applyViewRuleStyle<A extends AnyAux>(rule: Pick<AnyViewRuleStyle<A>, 'style' | 'notation'>, predicates: Predicate<ComputedNode<A>>[], nodes: ComputedNode<A>[]): void;
export declare function applyViewRuleStyles<A extends AnyAux, N extends ComputedNode<A>[]>(rules: ElementViewRule<A>[], nodes: N): N;
export {};
//# sourceMappingURL=applyViewRuleStyles.d.ts.map