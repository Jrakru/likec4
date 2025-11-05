import type { LikeC4Styles } from '@likec4/core/styles';
import type { AnyAux, ComputedEdge, ComputedNode, ComputedView, DeploymentFqn, EdgeId, Fqn, LikeC4StyleDefaults, NodeId, RelationshipColorValues, XYPoint } from '@likec4/core/types';
import { Graph } from '@likec4/core/utils/graphology';
import { type AttributeListModel, type EdgeAttributeKey, type EdgeModel, type NodeAttributeKey, type NodeModel, type RootGraphModel, type SubgraphModel } from 'ts-graphviz';
import type { DotSource } from './types';
export declare const DefaultEdgeStyle: RelationshipLineType;
export type ApplyManualLayoutData = {
    x: number;
    y: number;
    height: number;
    nodes: Array<{
        id: string;
        center: XYPoint;
        fixedsize?: {
            width: number;
            height: number;
        };
    }>;
    edges: Array<{
        id: string;
        dotpos: string;
    }>;
};
type GraphologyNodeAttributes = {
    modelRef: Fqn | null;
    deploymentRef: DeploymentFqn | null;
    origin: ComputedNode;
    level: number;
    depth: number;
    maxConnectedHierarchyDistance: number;
};
type GraphologyEdgeAttributes = {
    origin: ComputedEdge;
    weight: number;
    hierarchyDistance: number;
};
export declare abstract class DotPrinter<A extends AnyAux, V extends ComputedView<A>> {
    protected readonly view: V;
    protected readonly styles: LikeC4Styles;
    private ids;
    private subgraphs;
    private nodes;
    protected edges: any;
    protected compoundIds: Set<NodeId>;
    protected edgesWithCompounds: Set<EdgeId>;
    protected graphology: Graph<GraphologyNodeAttributes, GraphologyEdgeAttributes>;
    readonly graphvizModel: RootGraphModel;
    constructor(view: V, styles: LikeC4Styles);
    protected get $defaults(): LikeC4StyleDefaults;
    get hasEdgesWithCompounds(): boolean;
    protected get defaultRelationshipColors(): RelationshipColorValues;
    protected postBuild(_G: RootGraphModel): void;
    private build;
    print(): DotSource;
    protected createGraph(): RootGraphModel;
    protected applyNodeAttributes(node: AttributeListModel<'Node', NodeAttributeKey>): void;
    protected applyEdgeAttributes(edge: AttributeListModel<'Edge', EdgeAttributeKey>): void;
    protected checkNodeId(name: string, isCompound?: boolean): string;
    protected generateGraphvizId(node: ComputedNode): string;
    protected elementToSubgraph(compound: ComputedNode, subgraph: SubgraphModel): SubgraphModel;
    protected elementToNode(element: ComputedNode, node: NodeModel): NodeModel;
    /**
     * ElementView and DynamicView have different implementation
     */
    protected abstract addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null;
    protected leafElements(parentId: NodeId | null): ComputedNode[];
    protected descendants(parentId: NodeId | null): ComputedNode[];
    protected computedNode(id: NodeId): any;
    protected getGraphNode(id: NodeId): any;
    protected getSubgraph(id: NodeId): any;
    /**
     * In case edge has a cluster as endpoint,
     * pick nested node to use as endpoint
     */
    protected edgeEndpoint(endpointId: NodeId, pickFromCluster: (data: ComputedNode[]) => ComputedNode | undefined): readonly [any, any, string];
    protected findInternalEdges(parentId: Fqn | null): ComputedEdge[];
    protected withoutCompoundEdges(element: ComputedNode): any;
    protected assignGroups(): void;
    /**
     * Use coordinates from given diagram as initial position for nodes
     * (try to keep existing layout as much as possible)
     */
    applyManualLayout({ height, ...layout }: ApplyManualLayoutData): this;
}
export {};
