import type { ElementModel } from '../../model';
import type { LikeC4Model } from '../../model/LikeC4Model';
import { type Any, type aux, type Color, type DynamicStep, type DynamicViewRule, type DynamicViewStep, type NonEmptyArray, type RelationshipLineType, type ViewRuleGlobalStyle } from '../../types';
/**
 * Collects element models explicitly referenced by `include` expressions in the provided resolved rules.
 *
 * @param model - The model to search for elements
 * @param resolvedRules - Resolved dynamic view rules whose `include` expressions will be evaluated
 * @returns A `Set` of `ElementModel<A>` that match any `include` expression from `resolvedRules`
 */
export declare function elementsFromIncludeProperties<A extends Any>(model: LikeC4Model<A>, resolvedRules: Array<Exclude<DynamicViewRule<A>, ViewRuleGlobalStyle>>): Set<ElementModel<A>>;
export declare const flattenSteps: <A extends Any>(s: DynamicViewStep<A>) => DynamicStep<A>[];
/**
 * Compute the ordered set of element models referenced by a sequence of dynamic view steps.
 *
 * Iterates the flattened steps left-to-right, resolves each step's source and target from the model,
 * and accumulates elements in an order that preserves actor ordering implied by the steps and backward links.
 *
 * @param model - Model used to resolve element identifiers from each step
 * @param steps - Dynamic view steps to inspect (may contain series, branches, or legacy parallel structures)
 * @returns A Set of ElementModel objects containing all elements referenced by the steps in processing order
 */
export declare function elementsFromSteps<A extends Any>(model: LikeC4Model<A>, steps: DynamicViewStep<A>[]): Set<ElementModel<A>>;
export declare function findRelations<A extends Any>(source: ElementModel<A>, target: ElementModel<A>, currentViewId: aux.StrictViewId<A>): {
    title?: string;
    kind?: aux.RelationKind<A>;
    tags?: aux.Tags<A>;
    relations?: NonEmptyArray<aux.RelationId>;
    navigateTo?: aux.StrictViewId<A>;
    color?: Color;
    line?: RelationshipLineType;
};
//# sourceMappingURL=utils.d.ts.map