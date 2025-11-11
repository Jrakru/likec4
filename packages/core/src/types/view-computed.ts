import type { Except } from 'type-fest'
import type {
  Color,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
} from '../styles/types'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { _stage, _type } from './const'
import type { ElementStyle } from './model-logical'
import type * as scalar from './scalar'
import type {
  Icon,
} from './scalar'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewManualLayout,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

export type ComputedNodeStyle = Except<ElementStyle, 'icon' | 'shape' | 'color', { requireExactProps: true }>
// export type ComputedNodeStyle = ElementStyle

// dprint-ignore
export interface ComputedNode<A extends AnyAux = AnyAux>
  extends
    aux.WithTags<A>,
    aux.WithOptionalLinks
{  
  id: scalar.NodeId
  kind: aux.ElementKind<A> | aux.DeploymentKind<A> | '@group'
  parent: scalar.NodeId | null
  /**
   * Reference to model element
   */
  modelRef?: aux.Fqn<A>
  /**
   * Reference to deployment element
   */
  deploymentRef?: aux.DeploymentFqn<A>
  title: string
  /**
   * Description of the node
   * either summary or description
   */
  description?: scalar.MarkdownOrString | null
  technology?: string | null
  children: scalar.NodeId[]
  inEdges: scalar.EdgeId[]
  outEdges: scalar.EdgeId[]
  shape: ElementShape
  color: Color
  icon?: Icon
  style: ComputedNodeStyle
  navigateTo?: aux.StrictViewId<A> | null
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number | null
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
  notation?: string | null
}

export interface ComputedEdge<A extends AnyAux = AnyAux> extends aux.WithOptionalTags<A> {
  id: scalar.EdgeId
  parent: scalar.NodeId | null
  source: scalar.NodeId
  target: scalar.NodeId
  label: string | null
  description?: scalar.MarkdownOrString | null
  technology?: string | null
  relations: scalar.RelationId[]
  kind?: aux.RelationKind<A> | typeof scalar.StepEdgeKind
  notation?: string
  // Notes for walkthrough
  notes?: scalar.MarkdownOrString
  color: Color
  line: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  // Link to dynamic view
  navigateTo?: aux.StrictViewId<A> | null
  /**
   * If this edge is derived from custom relationship predicate
   */
  isCustomized?: boolean
  /**
   * Path to the AST node relative to the view body ast
   * Available only in dynamic views
   * @internal
   */
  astPath?: string
  /**
   * For layouting purposes
   * @default 'forward'
   */
  dir?: 'forward' | 'back' | 'both'
}

interface BaseComputedViewProperties<A extends AnyAux> extends BaseViewProperties<A>, ViewWithHash, ViewWithNotation {
  readonly [_stage]: 'computed'
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayout | undefined
}

export interface ComputedElementView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'element'
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
}

export interface ComputedDeploymentView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'deployment'
}

/**
 * Branch collection contract computed for dynamic views.
 *
 * This is the core, branch-aware contract that downstream consumers (layouts,
 * diagram navigation, walkthrough) can rely on when the `unifiedBranching`
 * feature flag is enabled.
 *
 * Characteristics:
 * - Stable: uses explicit branchId/pathId + StepEdgeId references.
 * - Backward compatible: purely additive, does not remove or change existing fields.
 * - Optional at runtime: when `unifiedBranching` is disabled, no collections are exposed.
 */
export interface ComputedBranchCollection {
  /**
   * Stable identifier for this branch decision.
   *
   * May be derived from:
   * - the decision step id
   * - authoring-time metadata
   */
  readonly branchId: string
  /**
   * Branching semantics:
   * - `alternate`: mutually exclusive paths
   * - `parallel`: independent paths that may all be taken
   */
  readonly kind: 'alternate' | 'parallel'
  /**
   * Step at which this branch decision is introduced.
   *
   * This is always a StepEdgeId, and is expected to be present in the
   * corresponding ComputedDynamicView.edges.
   */
  readonly decisionStepId: scalar.StepEdgeId
  /**
   * Branch-local paths available from the decision step.
   *
   * The order of this array is significant and should match `pathIndex`.
   */
  readonly paths: ReadonlyArray<{
    /**
     * Stable identifier of the path within this branch.
     */
    readonly pathId: string
    /**
     * Zero-based index of the path within the branch.
     *
     * Mirrors the provided specification order and is used for deterministic
     * overlays and navigation.
     */
    readonly pathIndex: number
    /**
     * Whether this path is the default choice when no explicit selection is made.
     *
     * This is optional at the contract level; callers may derive defaults
     * based on domain rules when omitted.
     */
    readonly isDefaultPath?: boolean
    /**
     * Optional short, machine-friendly name (e.g. from DSL identifier).
     */
    readonly pathName?: string
    /**
     * Optional human-readable title presented in UIs.
     */
    readonly pathTitle?: string
    /**
     * Ordered list of step ids that belong to this path.
     *
     * Each entry MUST be a valid StepEdgeId and refer to existing edges
     * of the same ComputedDynamicView.
     */
    readonly stepIds: ReadonlyArray<scalar.StepEdgeId>
  }>
}

/**
 * Computed representation of a dynamic view.
 *
 * `branchCollections`:
 * - When `unifiedBranching` is enabled:
 *   - MAY be populated with one or more ComputedBranchCollection entries.
 * - When disabled:
 *   - MUST be absent at runtime (or treated as undefined).
 *
 * Consumers must treat this field as optional and fall back to legacy
 * step/prefix-based behaviour when it is not provided.
 */
export interface ComputedDynamicView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'dynamic'
  /**
   * How to display the dynamic view
   * - `diagram`: display as a regular likec4 view
   * - `sequence`: display as a sequence diagram
   */
  readonly variant: DynamicViewDisplayVariant
  /**
   * Optional unified branching collections for this dynamic view.
   *
   * This is additive and does not alter existing semantics:
   * - Legacy consumers can ignore this field.
   * - New consumers can rely on the stable ComputedBranchCollection contract.
   */
  readonly branchCollections?: ReadonlyArray<ComputedBranchCollection>
}
