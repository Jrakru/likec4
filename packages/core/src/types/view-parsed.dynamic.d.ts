import type * as aux from './_aux';
import type { AnyAux } from './_aux';
import type { ExclusiveUnion, NonEmptyReadonlyArray } from './_common';
import type { _type } from './const';
import type { ModelFqnExpr } from './expression-model';
import { type MarkdownOrString } from './scalar';
import type { Color, RelationshipArrowType, RelationshipLineType } from './styles';
import type { BaseParsedViewProperties, ViewRuleAutoLayout, ViewRuleGlobalPredicateRef, ViewRuleGlobalStyle } from './view-common';
import type { ElementViewRuleStyle } from './view-parsed.element';
export interface DynamicStep<A extends AnyAux = AnyAux> {
    readonly source: aux.StrictFqn<A>;
    readonly target: aux.StrictFqn<A>;
    readonly title?: string | null;
    readonly kind?: aux.RelationKind<A>;
    readonly description?: MarkdownOrString;
    readonly technology?: string;
    readonly notation?: string;
    readonly notes?: MarkdownOrString;
    readonly color?: Color;
    readonly line?: RelationshipLineType;
    readonly head?: RelationshipArrowType;
    readonly tail?: RelationshipArrowType;
    readonly isBackward?: boolean;
    readonly navigateTo?: aux.StrictViewId<A>;
    /**
     * Path to the AST node relative to the view body ast
     * Used to locate the step in the source code
     */
    readonly astPath: string;
}
export interface DynamicStepsSeries<A extends AnyAux = AnyAux> {
    readonly seriesId: string;
    readonly __series: NonEmptyReadonlyArray<DynamicStep<A>>;
}
export type DynamicBranchEntry<A extends AnyAux = AnyAux> = DynamicStep<A> | DynamicStepsSeries<A> | DynamicBranchCollection<A>;
export interface DynamicBranchPath<A extends AnyAux = AnyAux> {
    readonly pathId: string;
    readonly astPath: string;
    readonly pathName?: string;
    readonly pathTitle?: string | null;
    readonly description?: MarkdownOrString;
    readonly tags?: aux.Tags<A>;
    readonly steps: NonEmptyReadonlyArray<DynamicBranchEntry<A>>;
    readonly isAnonymous?: boolean;
}
interface DynamicBranchCollectionBase<A extends AnyAux = AnyAux> {
    readonly branchId: string;
    readonly astPath: string;
    readonly kind: 'parallel' | 'alternate';
    readonly label?: string;
    readonly defaultPathId?: string;
    readonly paths: NonEmptyReadonlyArray<DynamicBranchPath<A>>;
}
export interface DynamicParallelBranch<A extends AnyAux = AnyAux> extends DynamicBranchCollectionBase<A> {
    readonly kind: 'parallel';
    readonly parallelId: string;
    readonly __parallel?: NonEmptyReadonlyArray<DynamicStep<A> | DynamicStepsSeries<A>>;
    readonly isLegacyParallel?: boolean;
}
export interface DynamicAlternateBranch<A extends AnyAux = AnyAux> extends DynamicBranchCollectionBase<A> {
    readonly kind: 'alternate';
}
export type DynamicBranchCollection<A extends AnyAux = AnyAux> = DynamicParallelBranch<A> | DynamicAlternateBranch<A>;
export type DynamicStepsParallel<A extends AnyAux = AnyAux> = DynamicParallelBranch<A>;
/**
 * Extracts the prefix of a parallel step edge ID up to and including the first dot.
 *
 * @param id - The step edge identifier to examine (for example, `step-01.1`)
 * @returns The prefix including the first dot (for example, `step-01.`), or `null` if `id` is not a step edge ID containing a dot
 */
export declare function getParallelStepsPrefix(id: string): string | null;
export type DynamicViewStep<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Step: DynamicStep<A>;
    Series: DynamicStepsSeries<A>;
    Branch: DynamicBranchCollection<A>;
}>;
/**
 * Determine whether a dynamic view entry represents a single step (not a series or a branch).
 *
 * @param step - The dynamic view item to test
 * @returns `true` if `step` is a `DynamicStep`, `false` otherwise.
 */
export declare function isDynamicStep<A extends AnyAux>(step: DynamicViewStep<A> | undefined): step is DynamicStep<A>;
/**
 * Determines whether a dynamic view step represents a parallel branch that exposes a `__parallel` array.
 *
 * @returns `true` if `step` is a parallel branch with a `__parallel` array, `false` otherwise.
 */
export declare function isDynamicStepsParallel<A extends AnyAux>(step: DynamicViewStep<A> | undefined): step is DynamicStepsParallel<A>;
/**
 * Determines whether the provided dynamic view step represents a series of steps.
 *
 * @param step - The dynamic view step (or undefined) to check
 * @returns `true` if the step is a `DynamicStepsSeries`, `false` otherwise
 */
export declare function isDynamicStepsSeries<A extends AnyAux>(step: DynamicViewStep<A> | undefined): step is DynamicStepsSeries<A>;
/**
 * Determines whether a dynamic view step represents a branch collection.
 *
 * @param step - The dynamic view step to test
 * @returns `true` if `step` is a `DynamicBranchCollection`, `false` otherwise.
 */
export declare function isDynamicBranchCollection<A extends AnyAux>(step: DynamicViewStep<A> | undefined): step is DynamicBranchCollection<A>;
/**
 * Determine whether a value represents a branch path in a dynamic view.
 *
 * @param item - The branch entry or path to test
 * @returns `true` if `item` has `pathId` and `steps` and is a `DynamicBranchPath`, `false` otherwise.
 */
export declare function isDynamicBranchPath<A extends AnyAux>(item: DynamicBranchPath<A> | DynamicBranchEntry<A>): item is DynamicBranchPath<A>;
/**
 * Return a branch in legacy parallel format when the branch contains a populated `__parallel` array.
 *
 * Used for backward compatibility; does not transform or synthesize parallel data.
 *
 * @returns The branch as `DynamicStepsParallel<A>` if `__parallel` exists and has at least one entry, `null` otherwise.
 */
export declare function toLegacyParallel<A extends AnyAux>(step: DynamicViewStep<A>): DynamicStepsParallel<A> | null;
export interface DynamicViewIncludeRule<A extends AnyAux = AnyAux> {
    include: ModelFqnExpr.Any<A>[];
}
export type DynamicViewRule<A extends AnyAux = AnyAux> = ExclusiveUnion<{
    Include: DynamicViewIncludeRule<A>;
    GlobalPredicateRef: ViewRuleGlobalPredicateRef;
    ElementViewRuleStyle: ElementViewRuleStyle<A>;
    GlobalStyle: ViewRuleGlobalStyle;
    AutoLayout: ViewRuleAutoLayout;
}>;
export type DynamicViewDisplayVariant = 'diagram' | 'sequence';
export interface ParsedDynamicView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
    [_type]: 'dynamic';
    /**
     * How to display the dynamic view
     * - `diagram`: display as a regular likec4 view
     * - `sequence`: display as a sequence diagram
     *
     * @default 'diagram'
     */
    readonly variant?: DynamicViewDisplayVariant;
    readonly steps: DynamicViewStep<A>[];
    readonly rules: DynamicViewRule<A>[];
}
export {};
//# sourceMappingURL=view-parsed.dynamic.d.ts.map