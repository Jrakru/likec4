import { hasAtLeast } from 'remeda';
import { invariant } from '../utils/invariant';
export var BBox;
(function (BBox) {
    function center({ x, y, width, height }) {
        return {
            x: x + width / 2,
            y: y + height / 2,
        };
    }
    BBox.center = center;
    function fromPoints(points) {
        const { x1, y1, x2, y2 } = RectBox.fromPoints(points);
        return {
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
        };
    }
    BBox.fromPoints = fromPoints;
    function merge(...boxes) {
        invariant(hasAtLeast(boxes, 1), 'No boxes provided');
        if (boxes.length === 1) {
            return boxes[0];
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const box of boxes) {
            minX = Math.min(minX, box.x);
            minY = Math.min(minY, box.y);
            maxX = Math.max(maxX, box.x + box.width);
            maxY = Math.max(maxY, box.y + box.height);
        }
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }
    BBox.merge = merge;
    function toRectBox(box) {
        return {
            x1: box.x,
            y1: box.y,
            x2: box.x + box.width,
            y2: box.y + box.height,
        };
    }
    BBox.toRectBox = toRectBox;
    function expand(box, plus) {
        if (plus === 0) {
            return box;
        }
        return {
            x: box.x - plus,
            y: box.y - plus,
            width: box.width + plus * 2,
            height: box.height + plus * 2,
        };
    }
    BBox.expand = expand;
    function shrink(box, minus) {
        if (minus === 0) {
            return box;
        }
        return {
            x: box.x + minus,
            y: box.y + minus,
            width: box.width - minus * 2,
            height: box.height - minus * 2,
        };
    }
    BBox.shrink = shrink;
})(BBox || (BBox = {}));
export var RectBox;
(function (RectBox) {
    function center({ x1, y1, x2, y2 }) {
        return {
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
        };
    }
    RectBox.center = center;
    function fromPoints(points) {
        invariant(points.length > 0, 'At least one point is required');
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [x, y] of points) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        return {
            x1: minX,
            y1: minY,
            x2: maxX,
            y2: maxY,
        };
    }
    RectBox.fromPoints = fromPoints;
    function merge(...boxes) {
        invariant(boxes.length > 0, 'No boxes provided');
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const box of boxes) {
            minX = Math.min(minX, box.x1);
            minY = Math.min(minY, box.y1);
            maxX = Math.max(maxX, box.x2);
            maxY = Math.max(maxY, box.y2);
        }
        return {
            x1: minX,
            y1: minY,
            x2: maxX,
            y2: maxY,
        };
    }
    RectBox.merge = merge;
    function toBBox(box) {
        return {
            x: box.x1,
            y: box.y1,
            width: box.x2 - box.x1,
            height: box.y2 - box.y1,
        };
    }
    RectBox.toBBox = toBBox;
})(RectBox || (RectBox = {}));
