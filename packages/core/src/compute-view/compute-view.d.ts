import { LikeC4Model } from '../model';
import { type AnyAux, type ComputedLikeC4ModelData, type ComputedView, type ParsedLikeC4ModelData, type ParsedView } from '../types';
export type ComputeViewResult<V> = {
    isSuccess: true;
    error?: undefined;
    view: V;
} | {
    isSuccess: false;
    error: Error;
    view: undefined;
};
export declare function unsafeComputeView<A extends AnyAux>(viewsource: ParsedView<A>, likec4model: LikeC4Model<any>): ComputedView<A>;
export declare function computeView<A extends AnyAux>(viewsource: ParsedView<A>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedView<A>>;
export declare function computeParsedModelData<A extends AnyAux>(parsed: ParsedLikeC4ModelData<A>): ComputedLikeC4ModelData<A>;
export declare function computeLikeC4Model<A extends AnyAux>(parsed: ParsedLikeC4ModelData<A>): LikeC4Model.Computed<A>;
//# sourceMappingURL=compute-view.d.ts.map