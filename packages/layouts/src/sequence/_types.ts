import type { BBox, DiagramEdge, DiagramNode, EdgeId, NodeId, ViewId } from '@likec4/core/types'

export type Step = {
  id: EdgeId
  from: {
    column: number
    row: number
  }
  to: {
    column: number
    row: number
  }
  source: DiagramNode
  target: DiagramNode
  label: null | {
    height: number
    width: number
    text: string | null
  }
  isSelfLoop: boolean
  isBack: boolean
  parallelPrefix: string | null
  alternatePrefix: string | null
  offset: number // offset for continuing edges
  edge: DiagramEdge
}

export type Compound = {
  node: DiagramNode
  from: DiagramNode
  to: DiagramNode

  nested: Compound[]
}

export type ParallelRect = {
  parallelPrefix: string
  min: {
    column: number
    row: number
  }
  max: {
    column: number
    row: number
  }
}

export type AlternateRect = {
  alternatePrefix: string
  min: {
    column: number
    row: number
  }
  max: {
    column: number
    row: number
  }
}

export interface SequenceActorStepPort {
  id: string
  cx: number // center x
  cy: number // center y
  height: number
  type: 'target' | 'source'
  position: 'left' | 'right' | 'top' | 'bottom'
}

export interface SequenceActor {
  id: NodeId
  x: number
  y: number
  width: number
  height: number
  ports: Array<SequenceActorStepPort>
}

export interface SequenceCompound {
  id: NodeId // auto-generated
  origin: NodeId
  x: number
  y: number
  width: number
  height: number
  depth: number
}

export interface SequenceParallelArea {
  parallelPrefix: string
  x: number
  y: number
  width: number
  height: number
}

export interface SequenceAlternateArea {
  alternatePrefix: string
  x: number
  y: number
  width: number
  height: number
}

/**
 * Branch overlays computed from unified branching metadata.
 *
 * These are optional, non-breaking overlays:
 * - When absent or empty, consumers fall back to legacy prefixes/areas.
 * - When present, they provide stable branch-aware bounds keyed by branchId/pathId.
 */
export type SequenceBranchArea = {
  branchId: string
  kind: 'alternate' | 'parallel'
  x: number
  y: number
  width: number
  height: number
}

export type SequenceBranchPath = {
  branchId: string
  pathId: string
  index: number
  isDefault: boolean
  x: number
  y: number
  width: number
  height: number
}

export interface SequenceViewLayout {
  id: ViewId
  actors: Array<SequenceActor>
  compounds: Array<SequenceCompound>
  parallelAreas: Array<SequenceParallelArea>
  alternateAreas: Array<SequenceAlternateArea>
  /**
   * Optional branch overlays keyed by branchId/pathId.
   * Always present as arrays for convenience; may be empty when:
   * - unified branching feature flag is disabled, or
   * - no compatible branch metadata is provided.
   */
  branchAreas: Array<SequenceBranchArea>
  branchPaths: Array<SequenceBranchPath>
  bounds: BBox
}
