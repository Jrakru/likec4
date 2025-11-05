export type Point = readonly [x: number, y: number];
export interface XYPoint {
    x: number;
    y: number;
}
export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare namespace BBox {
    function center({ x, y, width, height }: BBox): XYPoint;
    function fromPoints(points: Point[]): BBox;
    function merge(...boxes: BBox[]): BBox;
    function toRectBox(box: BBox): RectBox;
    function expand(box: BBox, plus: number): BBox;
    function shrink(box: BBox, minus: number): BBox;
}
export interface RectBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export declare namespace RectBox {
    function center({ x1, y1, x2, y2 }: RectBox): XYPoint;
    function fromPoints(points: Point[]): RectBox;
    function merge(...boxes: RectBox[]): RectBox;
    function toBBox(box: RectBox): BBox;
}
//# sourceMappingURL=geometry.d.ts.map