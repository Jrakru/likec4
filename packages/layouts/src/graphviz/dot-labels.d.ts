import { type ComputedEdge, type ComputedNode, LikeC4Styles } from '@likec4/core';
export declare function sanitize(text: string): any;
type WrapOptions = {
    maxchars: number;
    maxLines?: number | undefined;
    sanitize?: ((v: string) => string) | undefined;
};
export declare function wrap(text: string, { maxchars, maxLines, sanitize: escape, }: WrapOptions): string[];
/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
export declare function nodeIcon(): string;
export declare function nodeLabel(node: ComputedNode, styles: LikeC4Styles): string;
export declare function compoundLabel(node: ComputedNode, color?: string): string;
export declare const EDGE_LABEL_MAX_CHARS = 40;
export declare const EDGE_LABEL_MAX_LINES = 5;
export declare function edgelabel({ label, technology }: ComputedEdge): string;
export declare function stepEdgeLabel(step: number, text?: string | null): string;
export {};
