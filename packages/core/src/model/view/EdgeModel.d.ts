import { type Any, type aux, type Color, type IteratorLike, type RelationshipArrowType, type RelationshipLineType, type RichTextOrEmpty, type scalar, type StepEdgeId } from '../../types';
import type { DeploymentRelationModel } from '../DeploymentElementModel';
import type { RelationshipModel } from '../RelationModel';
import type { $View, WithTags } from '../types';
import type { LikeC4ViewModel } from './LikeC4ViewModel';
import type { NodeModel } from './NodeModel';
export type EdgesIterator<A extends Any, V extends $View<A>> = IteratorLike<EdgeModel<A, V>>;
export declare class EdgeModel<A extends Any = Any, View extends $View<A> = $View<A>> implements WithTags<A> {
    #private;
    readonly view: LikeC4ViewModel<A, View>;
    readonly $edge: View['edges'][number];
    readonly source: NodeModel<A, View>;
    readonly target: NodeModel<A, View>;
    constructor(view: LikeC4ViewModel<A, View>, $edge: View['edges'][number], source: NodeModel<A, View>, target: NodeModel<A, View>);
    get id(): scalar.EdgeId;
    get parent(): NodeModel<A, View> | null;
    get label(): string | null;
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    hasParent(): this is EdgeModel.WithParent<A, View>;
    get tags(): aux.Tags<A>;
    get stepNumber(): number | null;
    get navigateTo(): LikeC4ViewModel<A> | null;
    get color(): Color;
    get line(): RelationshipLineType;
    get head(): RelationshipArrowType;
    get tail(): RelationshipArrowType | undefined;
    isStep(): this is EdgeModel.StepEdge<A, View>;
    relationships(type: 'model'): IteratorLike<RelationshipModel<A>>;
    relationships(type: 'deployment'): IteratorLike<DeploymentRelationModel<A>>;
    relationships(type?: 'model' | 'deployment'): IteratorLike<RelationshipModel<A> | DeploymentRelationModel<A>>;
    includesRelation(rel: aux.RelationId | {
        id: aux.RelationId;
    }): boolean;
    isTagged(tag: aux.LooseTag<A>): boolean;
}
declare namespace EdgeModel {
    interface StepEdge<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
        id: StepEdgeId;
        stepNumber: number;
    }
    interface WithParent<A extends Any, V extends $View<A>> extends EdgeModel<A, V> {
        parent: NodeModel<A, V>;
    }
}
export {};
//# sourceMappingURL=EdgeModel.d.ts.map