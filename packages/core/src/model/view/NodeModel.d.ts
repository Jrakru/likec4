import { type Any, type Color, type ComputedNodeStyle, type ElementShape as C4ElementShape, type ExtractOnStage, type IconUrl, type IteratorLike, type Link, type RichTextOrEmpty, type scalar, GroupElementKind } from '../../types';
import type * as aux from '../../types/_aux';
import type { DeployedInstanceModel, DeploymentElementModel } from '../DeploymentElementModel';
import type { ElementModel } from '../ElementModel';
import type { $View, IncomingFilter, OutgoingFilter, WithTags } from '../types';
import type { EdgesIterator } from './EdgeModel';
import type { LikeC4ViewModel } from './LikeC4ViewModel';
export type NodesIterator<M extends Any, V extends $View<M>> = IteratorLike<NodeModel<M, V>>;
export declare class NodeModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
    #private;
    readonly $view: LikeC4ViewModel<A, V>;
    readonly $node: V['nodes'][number];
    constructor($view: LikeC4ViewModel<A, V>, $node: V['nodes'][number]);
    get id(): scalar.NodeId;
    get title(): string;
    get kind(): aux.ElementKind<A> | aux.DeploymentKind<A> | typeof GroupElementKind | 'instance';
    get description(): RichTextOrEmpty;
    get technology(): string | null;
    get parent(): NodeModel<A, V> | null;
    get element(): ElementModel<A> | null;
    get deployment(): DeploymentElementModel<A> | null;
    get shape(): C4ElementShape;
    get color(): Color;
    get icon(): IconUrl | null;
    get tags(): aux.Tags<A>;
    get links(): ReadonlyArray<Link>;
    get navigateTo(): LikeC4ViewModel<A> | null;
    get style(): ComputedNodeStyle;
    children(): ReadonlySet<NodeModel<A, V>>;
    /**
     * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
     * (from closest to root)
     */
    ancestors(): NodesIterator<A, V>;
    siblings(): NodesIterator<A, V>;
    incoming(filter?: IncomingFilter): EdgesIterator<A, V>;
    incomers(filter?: IncomingFilter): NodesIterator<A, V>;
    outgoing(filter?: OutgoingFilter): EdgesIterator<A, V>;
    outgoers(filter?: OutgoingFilter): NodesIterator<A, V>;
    isDiagramNode(this: NodeModel<any, any>): this is NodeModel<A, ExtractOnStage<V, 'layouted'>>;
    hasChildren(): boolean;
    hasParent(): this is NodeModel.WithParent<A, V>;
    /**
     * Check if this node references to logical model element.
     */
    hasElement(): this is NodeModel.WithElement<A, V>;
    /**
     * Check if this node references to deployment element (Node or Instance).
     */
    hasDeployment(): this is NodeModel.WithDeploymentElement<A, V>;
    /**
     * Check if this node references to deployed instance
     * Deployed instance always references to element and deployment element.
     */
    hasDeployedInstance(): this is NodeModel.WithDeployedInstance<A, V>;
    isGroup(): this is NodeModel.IsGroup<A, V>;
    /**
     * Checks if the node has the given tag.
     */
    isTagged(tag: aux.LooseTag<A>): boolean;
}
export declare namespace NodeModel {
    interface WithParent<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        parent: NodeModel<A, V>;
    }
    interface WithElement<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        kind: aux.ElementKind<A>;
        element: ElementModel<A>;
    }
    interface WithDeploymentElement<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        kind: aux.DeploymentKind<A>;
        deployment: DeploymentElementModel<A>;
    }
    interface WithDeployedInstance<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        kind: 'instance';
        element: ElementModel<A>;
        deployment: DeployedInstanceModel<A>;
    }
    interface IsGroup<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
        kind: typeof GroupElementKind;
        element: null;
        deployment: null;
    }
}
//# sourceMappingURL=NodeModel.d.ts.map