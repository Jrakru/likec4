export declare function compareNatural(a: string | undefined, b: string | undefined): -1 | 0 | 1;
/**
 * Compares two strings lexicographically first, then hierarchically based on their depth.\
 * From parent nodes to leaves
 *
 * @example
 * const lines = [
 *   'b.c',
 *   'b',
 *   'a.b.c',
 * ]
 * lines.sort(compareNaturalHierarchically('.'))
 * // [
 * //   'a.b.c',
 * //   'b',
 * //   'b.c',
 * // ]
 */
export declare function compareNaturalHierarchically(separator?: string, deepestFirst?: boolean): (a: string | undefined, b: string | undefined) => number;
//# sourceMappingURL=compare-natural.d.ts.map