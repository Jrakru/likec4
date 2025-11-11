import { intersection } from 'remeda'
import type { DeploymentElementModel } from '../../../model'
import type { AnyAux } from '../../../types'
import { type MutableState, AbstractStageExclude } from '../../memory'
import type { Ctx } from '../memory/memory'

export class StageExclude extends AbstractStageExclude<Ctx> {
  /**
   * Remove empty parent deployment nodes after excluding child elements.
   * This only runs when there are no connections remaining in the view,
   * ensuring we don't break the structural hierarchy needed for connections.
   */
  protected override postcommit(state: MutableState<Ctx>): MutableState<Ctx> {
    // First run parent's postcommit checks
    state = super.postcommit(state)

    // Only remove empty parents if there are no connections at all
    if (state.connections.length > 0) {
      return state
    }

    // Find parent nodes that have become empty after exclusions
    let emptyParents = new Set<DeploymentElementModel<AnyAux>>()

    // Check all elements to find deployment nodes without children
    for (const element of state.elements) {
      // Only deployment nodes can have children
      if (!element.isDeploymentNode()) {
        continue
      }

      // Don't remove explicitly included nodes
      if (state.explicits.has(element)) {
        continue
      }

      const children = element.children()
      if (children.size > 0) {
        // Check if any children still exist in our elements set
        const hasRemainingChildren = intersection([...children], [...state.elements]).length > 0
        if (!hasRemainingChildren) {
          emptyParents.add(element)
        }
      }
    }

    // Recursively remove empty parents (parents of empty parents may also become empty)
    while (emptyParents.size > 0) {
      state.elements = new Set([...state.elements].filter(el => !emptyParents.has(el)))
      state.explicits = new Set([...state.explicits].filter(el => !emptyParents.has(el)))
      state.final = new Set([...state.final].filter(el => !emptyParents.has(el)))

      // Check if removal of these empty parents made their parents empty
      const nextEmptyParents = new Set<DeploymentElementModel<AnyAux>>()
      for (const emptyParent of emptyParents) {
        const parent = emptyParent.parent
        if (parent && state.elements.has(parent) && !state.explicits.has(parent)) {
          const parentChildren = parent.children()
          const hasRemainingChildren = intersection([...parentChildren], [...state.elements]).length > 0
          if (!hasRemainingChildren) {
            nextEmptyParents.add(parent)
          }
        }
      }
      emptyParents = nextEmptyParents
    }

    return state
  }
}
