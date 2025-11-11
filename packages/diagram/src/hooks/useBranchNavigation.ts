import type { AnyAux } from '@likec4/core/types'

type BranchCollectionPathLike<A extends AnyAux = AnyAux> = {
  pathId: string
  pathIndex?: number
  pathName?: string
  pathTitle?: string
  isDefaultPath?: boolean
  // edgeIds and any extra fields are allowed but not required here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

type BranchCollectionLike<A extends AnyAux = AnyAux> = {
  branchId: string
  kind: 'alternate' | 'parallel'
  defaultPathId?: string
  paths: ReadonlyArray<BranchCollectionPathLike<A>>
}

/**
 * Minimal, framework-agnostic helpers for working with branch collection–like data.
 *
 * These are intentionally structural:
 * - They do not depend on internal @likec4/core types to avoid tight coupling.
 * - They operate on the shape used in performance tests and upcoming contracts.
 */

export function getBranchPathLabel<A extends AnyAux = AnyAux>(
  path: BranchCollectionPathLike<A>,
): string {
  if (path.pathTitle && path.pathTitle.trim().length > 0) {
    return path.pathTitle
  }
  if (path.pathName && path.pathName.trim().length > 0) {
    return path.pathName
  }
  if (typeof path.pathIndex === 'number') {
    return `Path ${path.pathIndex}`
  }
  return path.pathId
}

/**
 * Return paths sorted by their pathIndex (ascending).
 * Falls back to original order when pathIndex is missing.
 */
export function getSortedBranchPaths<A extends AnyAux = AnyAux>(
  collection: BranchCollectionLike<A>,
): readonly BranchCollectionPathLike<A>[] {
  const { paths } = collection
  if (!paths || paths.length <= 1) {
    return paths ?? []
  }

  // If every path has a numeric pathIndex, sort by that.
  if (paths.every((p: BranchCollectionPathLike<A>) => typeof p.pathIndex === 'number')) {
    return [...paths].sort((a: BranchCollectionPathLike<A>, b: BranchCollectionPathLike<A>) => {
      const ai = a.pathIndex ?? 0
      const bi = b.pathIndex ?? 0
      return ai - bi
    })
  }

  // Otherwise, keep as-is to avoid surprising reordering.
  return paths
}

/**
 * Determine whether a given pathId is the default for a collection.
 *
 * Priority:
 * 1) collection.defaultPathId, if defined
 * 2) first path explicitly marked isDefaultPath
 * 3) if none marked, first path in sorted order
 */
export function isDefaultBranchPath<A extends AnyAux = AnyAux>(
  collection: BranchCollectionLike<A>,
  pathId: string,
): boolean {
  const { paths } = collection
  if (!paths || paths.length === 0) {
    return false
  }

  // 1) Honor explicit defaultPathId on the collection
  if (collection.defaultPathId) {
    return collection.defaultPathId === pathId
  }

  // 2) Look for explicitly marked default path
  const explicitDefault = paths.find((p: BranchCollectionPathLike<A>) => p.isDefaultPath === true)
  if (explicitDefault) {
    return explicitDefault.pathId === pathId
  }

  // 3) Fallback: first path in sorted order
  const [first] = getSortedBranchPaths(collection)
  return !!first && first.pathId === pathId
}
