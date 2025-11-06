import { isAncestor, normalizeBranchKind } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { isEmpty } from 'remeda'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { elementRef } from '../utils/elementRef'
import { tryOrLog } from './_shared'

/**
 * Branch nesting depth configuration.
 *
 * These limits help maintain diagram readability and prevent rendering issues:
 * - MAX_BRANCH_DEPTH: Recommended depth based on cognitive load research and typical use cases.
 *   Exceeding this triggers a warning to encourage flatter, more maintainable structures.
 * - ERROR_DEPTH: Hard limit based on rendering constraints and practical limitations.
 *   Exceeding this triggers an error to prevent unwieldy diagrams.
 */
const BRANCH_DEPTH_LIMITS = {
  /** Recommended maximum depth for maintainability and readability */
  MAX_BRANCH_DEPTH: 3,
  /** Absolute maximum depth to prevent rendering issues */
  ERROR_DEPTH: 6,
} as const

export const dynamicViewStepSingle = (services: LikeC4Services): ValidationCheck<ast.DynamicStepSingle> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const sourceEl: ast.Element | undefined = elementRef(el.source)
    const source = sourceEl && fqnIndex.getFqn(sourceEl)
    if (!source) {
      accept('error', 'Source not found (not parsed/indexed yet)', {
        node: el,
        property: 'source',
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }

    if (source && target && (isAncestor(source, target) || isAncestor(target, source))) {
      accept('error', 'Invalid parent-child relationship', {
        node: el,
      })
    }
  })
}

export const dynamicViewStepChain = (services: LikeC4Services): ValidationCheck<ast.DynamicStepChain> => {
  const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((el, accept) => {
    const source = el.source
    if (ast.isDynamicStepSingle(source) && source.isBackward) {
      accept('error', 'Invalid chain after backward step', {
        node: el,
      })
    }

    const targetEl: ast.Element | undefined = elementRef(el.target)
    const target = targetEl && fqnIndex.getFqn(targetEl)
    if (!target) {
      accept('error', 'Target not found (not parsed/indexed yet)', {
        node: el,
        property: 'target',
      })
    }
  })
}

export const dynamicViewDisplayVariant = (
  _services: LikeC4Services,
): ValidationCheck<ast.DynamicViewDisplayVariantProperty> => {
  return tryOrLog((prop, accept) => {
    if (isEmpty(prop.value) || (prop.value !== 'diagram' && prop.value !== 'sequence')) {
      accept('error', 'Invalid display variant: "diagram" or "sequence" are allowed', {
        node: prop,
        property: 'value',
      })
      return
    }
    if (!AstUtils.hasContainerOfType(prop, ast.isDynamicViewBody)) {
      accept('error', `Display mode can be defined only inside dynamic view`, {
        node: prop,
      })
    }
  })
}

/**
 * Calculate the maximum branch nesting depth.
 *
 * Recursively traverses branch collections to find the deepest nesting level.
 * Used to warn about excessive nesting (Edge Case #2).
 *
 * @param node - The branch collection to analyze
 * @param currentDepth - The current depth (starts at 1 for the root branch)
 * @returns The maximum depth found
 */
function calculateBranchDepth(node: ast.DynamicViewBranchCollection, currentDepth = 1): number {
  let maxDepth = currentDepth

  // Check paths for nested branches
  for (const path of node.paths) {
    for (const step of path.steps) {
      if (ast.isDynamicViewBranchCollection(step)) {
        const childDepth = calculateBranchDepth(step, currentDepth + 1)
        maxDepth = Math.max(maxDepth, childDepth)
      }
    }
  }

  // Check anonymous steps for nested branches
  for (const step of node.steps) {
    if (ast.isDynamicViewBranchCollection(step)) {
      const childDepth = calculateBranchDepth(step, currentDepth + 1)
      maxDepth = Math.max(maxDepth, childDepth)
    }
  }

  return maxDepth
}

export const dynamicViewBranchCollection = (
  services: LikeC4Services,
): ValidationCheck<ast.DynamicViewBranchCollection> => {
  return tryOrLog((node, accept) => {
    const kind = normalizeBranchKind(node.kind)
    const hasNamedPaths = node.paths.length > 0
    const hasSteps = node.steps.length > 0

    // Check for empty branch collection
    if (!hasNamedPaths && !hasSteps) {
      accept('error', `${kind === 'parallel' ? 'Parallel' : 'Alternate'} block has no paths or steps`, {
        node,
      })
      return
    }

    // Check for degenerate single-path branch
    const totalPaths = node.paths.length + node.steps.length
    if (totalPaths === 1) {
      accept(
        'warning',
        `${
          kind === 'parallel' ? 'Parallel' : 'Alternate'
        } block with only one path has no branching value. Consider removing the ${kind} wrapper.`,
        {
          node,
          code: 'LIKEC4-DEGENERATE-BRANCH',
        },
      )
    }

    // Check for empty paths (Edge Case #1)
    for (const path of node.paths) {
      if (path.steps.length === 0) {
        accept('error', 'Path must contain at least one step', {
          node: path,
          code: 'LIKEC4-EMPTY-PATH',
        })
      }
    }

    // Check for mixed anonymous and named paths (Edge Case #3)
    if (node.paths.length > 0 && node.steps.length > 0) {
      accept(
        'hint',
        'Mixing named paths and anonymous steps. Consider using explicit paths for all branches for consistency.',
        {
          node,
          code: 'LIKEC4-MIXED-PATH-STYLE',
        },
      )
    }

    // Check for excessive nesting depth (Edge Case #2)
    const depth = calculateBranchDepth(node)
    if (depth >= BRANCH_DEPTH_LIMITS.ERROR_DEPTH) {
      accept(
        'error',
        `Branch nesting depth (${depth}) exceeds maximum allowed depth (${BRANCH_DEPTH_LIMITS.ERROR_DEPTH}). Consider flattening the branch structure.`,
        {
          node,
          code: 'LIKEC4-MAX-DEPTH',
        },
      )
    } else if (depth > BRANCH_DEPTH_LIMITS.MAX_BRANCH_DEPTH) {
      accept(
        'warning',
        `Branch nesting depth (${depth}) exceeds recommended depth (${BRANCH_DEPTH_LIMITS.MAX_BRANCH_DEPTH}). Deep nesting can make diagrams hard to read.`,
        {
          node,
          code: 'LIKEC4-DEEP-NESTING',
        },
      )
    }

    // Check for nested homogeneous parallel (P-in-P)
    if (kind === 'parallel') {
      for (const path of node.paths) {
        // Check if path contains only a single nested parallel
        if (path.steps.length === 1 && ast.isDynamicViewBranchCollection(path.steps[0])) {
          const nestedKind = normalizeBranchKind(path.steps[0].kind)

          if (nestedKind === 'parallel') {
            accept(
              'error',
              'Nested parallel inside parallel with no other steps is not allowed. Parallel blocks are associative - flatten inner parallel paths into the parent parallel.',
              {
                node: path.steps[0],
                code: 'LIKEC4-NESTED-PARALLEL',
              },
            )
          }
        }
      }

      // Also check anonymous steps that might contain nested parallels
      for (const step of node.steps) {
        if (ast.isDynamicViewBranchCollection(step)) {
          const nestedKind = normalizeBranchKind(step.kind)

          if (nestedKind === 'parallel') {
            accept(
              'warning',
              'Anonymous nested parallel will create a separate path. Consider using named paths for clarity.',
              {
                node: step,
                code: 'LIKEC4-NESTED-PARALLEL',
              },
            )
          }
        }
      }
    }

    // Check for nested homogeneous alternate (A-in-A) - informational only
    if (kind === 'alternate') {
      for (const path of node.paths) {
        if (path.steps.length === 1 && ast.isDynamicViewBranchCollection(path.steps[0])) {
          const nestedKind = normalizeBranchKind(path.steps[0].kind)

          if (nestedKind === 'alternate') {
            accept(
              'hint',
              'Nested alternate inside alternate with no other steps can be flattened. Alternate blocks are associative - consider using sibling paths instead.',
              {
                node: path.steps[0],
                code: 'LIKEC4-NESTED-ALTERNATE',
              },
            )
          }
        }
      }
    }

    // Check for duplicate path names
    const pathNames = new Map<string, ast.DynamicViewBranchPath[]>()
    for (const path of node.paths) {
      if (path.name) {
        const existing = pathNames.get(path.name)
        if (existing) {
          existing.push(path)
        } else {
          pathNames.set(path.name, [path])
        }
      }
    }

    // Report duplicates
    for (const [name, paths] of pathNames) {
      if (paths.length > 1) {
        for (const path of paths) {
          accept('error', `Duplicate path name "${name}" in ${kind} block`, {
            node: path,
            property: 'name',
            code: 'LIKEC4-DUP-PATH-NAME',
          })
        }
      }
    }
  })
}
