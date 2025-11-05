import type { Tagged, TupleToUnion } from 'type-fest';
/**
 * For padding, margin, etc.
 */
export declare const Sizes: readonly ["xs", "sm", "md", "lg", "xl"];
export type Size = TupleToUnion<typeof Sizes>;
export type TextSize = Size;
export type ShapeSize = Size;
export type SpacingSize = Size;
export declare const BorderStyles: readonly ["solid", "dashed", "dotted", "none"];
export type BorderStyle = TupleToUnion<typeof BorderStyles>;
export declare const ElementShapes: readonly ["rectangle", "person", "browser", "mobile", "cylinder", "storage", "queue"];
export type ElementShape = TupleToUnion<typeof ElementShapes>;
export type HexColor = `#${string}`;
export type ColorLiteral = HexColor | `rgb(${number},${number},${number})` | `rgba(${number},${number},${number},${number})`;
export type RelationshipLineType = 'dashed' | 'solid' | 'dotted';
export declare const RelationshipArrowTypes: readonly ["none", "normal", "onormal", "dot", "odot", "diamond", "odiamond", "crow", "open", "vee"];
export type RelationshipArrowType = TupleToUnion<typeof RelationshipArrowTypes>;
export declare const ThemeColors: readonly ["amber", "blue", "gray", "slate", "green", "indigo", "muted", "primary", "red", "secondary", "sky"];
export type ThemeColor = typeof ThemeColors[number];
export declare function isThemeColor(color: string): color is ThemeColor;
export type CustomColorDefinitions = {
    [key: string]: ThemeColorValues;
};
export type CustomColor = Tagged<string, 'CustomColor'>;
export declare function isCustomColor(color: string): color is CustomColor;
export type Color = ThemeColor | CustomColor;
export interface ElementColorValues {
    readonly fill: ColorLiteral;
    readonly stroke: ColorLiteral;
    readonly hiContrast: ColorLiteral;
    readonly loContrast: ColorLiteral;
}
export interface RelationshipColorValues {
    readonly line: ColorLiteral;
    readonly labelBg: ColorLiteral;
    readonly label: ColorLiteral;
}
export interface ThemeColorValues {
    readonly elements: ElementColorValues;
    readonly relationships: RelationshipColorValues;
}
/**
 * Default style values for elements, groups and relationships
 */
export interface LikeC4StyleDefaults {
    readonly color: ThemeColor;
    readonly size: ShapeSize;
    readonly shape: ElementShape;
    readonly opacity?: number;
    readonly border?: BorderStyle;
    readonly padding?: SpacingSize;
    readonly text?: TextSize;
    /**
     * Default style values for groups
     * If not specified, the default values for elements are used
     */
    readonly group?: {
        readonly color?: ThemeColor;
        readonly opacity?: number;
        readonly border?: BorderStyle;
    };
    readonly relationship: {
        readonly color: ThemeColor;
        readonly line: RelationshipLineType;
        readonly arrow: RelationshipArrowType;
    };
}
export interface LikeC4Theme {
    readonly colors: Readonly<Record<ThemeColor, ThemeColorValues>>;
    readonly sizes: Readonly<Record<ShapeSize, {
        readonly width: number;
        readonly height: number;
    }>>;
    readonly spacing: Readonly<Record<SpacingSize, number>>;
    readonly textSizes: Readonly<Record<TextSize, number>>;
}
export interface LikeC4StylesConfig {
    readonly theme: LikeC4Theme;
    readonly defaults: LikeC4StyleDefaults;
}
//# sourceMappingURL=types.d.ts.map