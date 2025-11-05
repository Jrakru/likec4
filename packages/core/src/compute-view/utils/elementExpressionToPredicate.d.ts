import { ModelFqnExpr } from '../../types';
type Predicate<T> = (x: T) => boolean;
export declare function elementExprToPredicate<T extends {
    id: string;
    tags: readonly string[];
    kind: string;
}>(target: ModelFqnExpr.Any): Predicate<T>;
export {};
//# sourceMappingURL=elementExpressionToPredicate.d.ts.map