import {
  type DiagramEdge,
  type DiagramNode,
  type LayoutedDynamicView,
  type NodeId,
  getAlternateStepsPrefix,
  getParallelStepsPrefix,
  isStepEdgeId,
} from '@likec4/core/types'
import { DefaultMap, invariant, nonNullable } from '@likec4/core/utils'
import { flat, groupByProp, hasAtLeast, map, mapValues, pipe, values } from 'remeda'
import type {
  SequenceActor,
  SequenceActorStepPort,
  SequenceBranchArea,
  SequenceBranchPath,
  Step,
} from './_types'
import {
  CONTINUOUS_OFFSET,
} from './const'
import type { SequenceBranchCollectionInput } from './layouter'
import { SequenceViewLayouter } from './layouter'
import { buildCompounds } from './utils'

type Port = {
  step: Step
  row: number
  type: 'source' | 'target'
  position: 'left' | 'right' | 'top' | 'bottom'
}

/**
 * Map optional unified branching metadata from LayoutedDynamicView into the
 * minimal local SequenceBranchCollectionInput shape understood by the layouter.
 *
 * We intentionally treat `view` as `any` here to avoid tight coupling to core.
 * If no compatible metadata is present, this returns undefined.
 */
function toBranchCollections(
  view: LayoutedDynamicView,
): SequenceBranchCollectionInput | undefined {
  const anyView = view as any
  const collections = anyView.branchCollections as
    | SequenceBranchCollectionInput
    | undefined
  if (!collections || collections.length === 0) {
    return undefined
  }
  return collections
}

export function calcSequenceLayout(view: LayoutedDynamicView): LayoutedDynamicView.Sequence.Layout {
  const actorNodes = new Set<DiagramNode>()

  const getNode = (id: string) => nonNullable(view.nodes.find(n => n.id === id))

  // Step 1 - prepare steps and actors
  const preparedSteps = [] as Array<{
    edge: DiagramEdge
    source: DiagramNode
    target: DiagramNode
  }>

  for (const edge of view.edges.filter(e => isStepEdgeId(e.id))) {
    const source = getNode(edge.source)
    const target = getNode(edge.target)

    if (source.children.length || target.children.length) {
      console.error('Sequence view does not support nested actors')
      continue
    }
    actorNodes.add(source)
    actorNodes.add(target)
    preparedSteps.push({ edge, source, target })
  }

  // Keep initial order of actors
  const actors = view.nodes.filter(n => actorNodes.has(n))
  invariant(hasAtLeast(actors, 1), 'actors array must not be empty')

  const actorPorts = new DefaultMap<DiagramNode, Port[]>(() => [])

  const steps = [] as Array<Step>

  let row = 0

  for (const { edge, source, target } of preparedSteps) {
    const prevStep = steps.at(-1)

    let sourceColumn = actors.indexOf(source)
    let targetColumn = actors.indexOf(target)

    const isSelfLoop = source === target
    const isBack = sourceColumn > targetColumn
    const parallelPrefix = getParallelStepsPrefix(edge.id)
    const alternatePrefix = getAlternateStepsPrefix(edge.id)

    let isContinuing = false
    if (
      prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix &&
      prevStep.alternatePrefix === alternatePrefix
    ) {
      isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack
    }

    if (!isContinuing) {
      row++
    }

    const step: Step = {
      id: edge.id,
      from: {
        column: sourceColumn,
        row,
      },
      to: {
        column: targetColumn,
        row: isSelfLoop ? ++row : row,
      },
      edge,
      isSelfLoop,
      isBack,
      parallelPrefix,
      alternatePrefix,
      offset: isContinuing ? (prevStep?.offset ?? 0) + CONTINUOUS_OFFSET : 0,
      source,
      target,
      label: edge.labelBBox
        ? {
          height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
          width: edge.labelBBox.width + 16,
          text: edge.label,
        }
        : null,
    }
    steps.push(step)
    actorPorts.get(source).push({ step, row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' })
    actorPorts.get(target).push({ step, row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' })
  }

  const branchCollections = toBranchCollections(view)

  const layout = new SequenceViewLayouter({
    actors,
    steps,
    compounds: buildCompounds(actors, view.nodes),
    // Optional, only influences branchAreas/branchPaths overlays.
    ...(branchCollections && { branchCollections }),
  })

  const bounds = layout.getViewBounds()

  const compounds = pipe(
    layout.getCompoundBoxes(),
    map(({ node, ...box }) => ({ ...box, id: node.id, origin: node.id })),
    groupByProp('id'),
    mapValues((boxes, id) => {
      if (hasAtLeast(boxes, 2)) {
        return map(boxes, (box, i) => ({ ...box, id: `${id}-${i + 1}` as NodeId }))
      }
      return boxes
    }),
    values(),
    flat(),
  )

  // Legacy fields
  const parallelAreas = layout.getParallelBoxes()
  const alternateAreas = layout.getAlternateBoxes()

  // Branch overlays are always present as arrays on the layout contract
  // but will be empty unless branchCollections metadata was provided.
  const branchAreas: SequenceBranchArea[] = layout.getBranchAreas()
  const branchPaths: SequenceBranchPath[] = layout.getBranchPaths()

  return {
    actors: actors.map(actor => toSeqActor({ actor, ports: actorPorts.get(actor), layout })),
    compounds,
    steps: map(steps, s => ({
      id: s.id,
      sourceHandle: s.id + '_source',
      targetHandle: s.id + '_target',
      ...s.label && ({
        labelBBox: {
          width: s.label.width,
          height: s.label.height,
        },
      }),
    })),
    parallelAreas,
    alternateAreas,
    // New overlays: always arrays on the layout contract; populated only when
    // upstream metadata is present. When absent they are empty, preserving
    // backward-compatible behaviour.
    branchAreas,
    branchPaths,
    bounds,
  } as LayoutedDynamicView.Sequence.Layout
}

function toSeqActor({ actor, ports, layout }: {
  actor: DiagramNode
  ports: Port[]
  layout: SequenceViewLayouter
}): SequenceActor {
  const { x, y, width, height } = layout.getActorBox(actor)
  return {
    id: actor.id,
    x,
    y,
    width,
    height,
    ports: ports.map((p): SequenceActorStepPort => {
      const bbox = layout.getPortCenter(p.step, p.type)
      return ({
        id: `${p.step.id}_${p.type}`,
        cx: bbox.cx - x,
        cy: bbox.cy - y,
        height: bbox.height,
        type: p.type,
        position: p.position,
      })
    }),
  }
}
