import { nonNullable } from '../../utils';
import { isAncestor, isDescendantOf, sortParentsFirst } from '../../utils/fqn';
import { DefaultMap } from '../../utils/mnemonist';
export function treeFromElements(elements) {
    const sorted = sortParentsFirst([...elements]);
    const root = new Set(sorted);
    const map = new Map(sorted.map(e => [e._literalId, e]));
    const parents = new DefaultMap(() => null);
    const children = sorted.reduce((acc, parent, index, all) => {
        acc.set(parent, all
            .slice(index + 1)
            .filter(isDescendantOf(parent))
            .map(e => {
            root.delete(e);
            return e;
        })
            .reduce((acc, el) => {
            if (!acc.some(isAncestor(el))) {
                acc.push(el);
                parents.set(el, parent);
            }
            return acc;
        }, []));
        return acc;
    }, new DefaultMap(() => []));
    return {
        sorted,
        byId: (id) => nonNullable(map.get(id), `Element not found by id: ${id}`),
        root: root,
        parent: (el) => parents.get(el),
        children: (el) => children.get(el),
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
        flatten: () => {
            return new Set([
                ...root,
                ...sorted.reduce((acc, el) => {
                    const _children = children.get(el);
                    if (_children.length === 0) {
                        acc.push(el);
                        return acc;
                    }
                    if (_children.length > 1) {
                        acc.push(..._children);
                    }
                    return acc;
                }, []),
            ]);
        },
    };
}
