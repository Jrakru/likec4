/**
 * For padding, margin, etc.
 */
export const Sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
export const BorderStyles = ['solid', 'dashed', 'dotted', 'none'];
export const ElementShapes = [
    'rectangle',
    'person',
    'browser',
    'mobile',
    'cylinder',
    'storage',
    'queue',
];
// reference: https://graphviz.org/docs/attr-types/arrowType/
export const RelationshipArrowTypes = [
    'none',
    'normal',
    'onormal',
    'dot',
    'odot',
    'diamond',
    'odiamond',
    'crow',
    'open',
    'vee',
];
export const ThemeColors = [
    'amber',
    'blue',
    'gray',
    'slate',
    'green',
    'indigo',
    'muted',
    'primary',
    'red',
    'secondary',
    'sky',
];
export function isThemeColor(color) {
    return ThemeColors.includes(color);
}
export function isCustomColor(color) {
    return !isThemeColor(color);
}
