import type { ElementModel } from '../../model/ElementModel';
import type { AnyAux, aux } from '../../types';
export declare function treeFromElements<M extends AnyAux>(elements: Iterable<ElementModel<M>>): {
    sorted: readonly ElementModel<M>[];
    byId: (id: aux.ElementId<M>) => ElementModel<M>;
    root: ReadonlySet<ElementModel<M>>;
    parent: (el: ElementModel<M>) => ElementModel<M> | null;
    children: (el: ElementModel<M>) => ReadonlyArray<ElementModel<M>>;
    /**
     * Flattens the tree structure by removing redundant hierarchy levels.
     * @example
     *   A
     *   └── B
     *       ├── C
     *       │   └── D
     *       │       └── E
     *       └── F
     *           └── G
     * becomes
     *   A
     *   ├── C
     *   │   └── E
     *   └── F
     *       └── G
     */
    flatten: () => Set<ElementModel<M>>;
};
//# sourceMappingURL=utils.d.ts.map