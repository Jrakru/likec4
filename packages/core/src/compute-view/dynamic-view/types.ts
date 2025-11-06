import type { ElementModel } from '../../model'
import type {
  AnyAux,
  aux,
  Color,
  ComputedBranchTrailEntry,
  DynamicBranchCollection,
  DynamicBranchPath,
  RelationshipArrowType,
  RelationshipLineType,
  scalar,
  StepEdgeId,
} from '../../types'

/**
 * Represents an element in the model (shorthand type).
 */
export type Element<A extends AnyAux> = ElementModel<A>

/**
 * Tracks the state of a branch during processing.
 *
 * Each entry in the branch stack represents one level of nesting
 * in the branch hierarchy.
 *
 * @example
 * ```typescript
 * // For: alternate { path p1 { parallel { path p2 { ... } } } }
 * const stack: BranchStackEntry[] = [
 *   {
 *     branch: alternateNode,
 *     path: p1,
 *     pathIndex: 1,
 *     stepCounter: 0
 *   },
 *   {
 *     branch: parallelNode,
 *     path: p2,
 *     pathIndex: 1,
 *     stepCounter: 2  // After processing 2 steps
 *   }
 * ]
 * ```
 */
export interface BranchStackEntry<A extends AnyAux> {
  /** The branch collection (parallel or alternate) being processed */
  branch: DynamicBranchCollection<A>
  /** The specific path within the branch being processed */
  path: DynamicBranchPath<A>
  /** The 1-based index of this path within its branch (used in step IDs) */
  pathIndex: number
  /** The 0-based counter of steps processed within this path */
  stepCounter: number
}

/**
 * Accumulates branch collection data during processing.
 *
 * Used to collect all paths and their associated edge IDs
 * for a single branch collection.
 */
export interface BranchCollectionAccumulator<A extends AnyAux> {
  /** The branch collection being accumulated */
  branch: DynamicBranchCollection<A>
  /** Map of pathId to path data and collected edge IDs */
  paths: Map<string, {
    /** The path metadata */
    path: DynamicBranchPath<A>
    /** The 1-based index of this path within the branch */
    pathIndex: number
    /** All edge IDs generated for steps in this path */
    edgeIds: scalar.EdgeId[]
  }>
}

/**
 * Represents a fully computed step in a dynamic view.
 *
 * This is the intermediate representation used during computation,
 * before final transformation into ComputedEdge.
 */
export interface ComputedStep<A extends AnyAux> {
  /** The unique step edge identifier (e.g., 'step-01' or 'step-01.02.01') */
  id: StepEdgeId
  /** The source element of the interaction */
  source: Element<A>
  /** The target element of the interaction */
  target: Element<A>
  /** Optional custom title for this step */
  title?: string
  /** The kind/type of relationship */
  kind?: aux.RelationKind<A>
  /** Optional description or documentation */
  description?: scalar.MarkdownOrString
  /** Technology label for the interaction */
  technology?: string
  /** Notes for walkthrough/presentation mode */
  notes?: scalar.MarkdownOrString
  /** Color override for this step */
  color?: Color
  /** Line style for the edge */
  line?: RelationshipLineType
  /** Arrow head style */
  head?: RelationshipArrowType
  /** Arrow tail style */
  tail?: RelationshipArrowType
  /** IDs of underlying model relationships */
  relations: scalar.RelationId[]
  /** Whether this is a backward arrow (target is left of source) */
  isBackward: boolean
  /** Optional navigation target to another view */
  navigateTo?: aux.StrictViewId<A>
  /** Tags for filtering/categorization */
  tags?: aux.Tags<A>
  /** Path to the AST node in the source code */
  astPath: string
  /** Trail of branches this step belongs to (for nested branches) */
  branchTrail?: ComputedBranchTrailEntry<A>[]
}
