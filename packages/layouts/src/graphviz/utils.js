"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconSizePoints = exports.pxToPoints = exports.pxToInch = exports.inchToPx = void 0;
exports.isCompound = isCompound;
exports.toArrowType = toArrowType;
exports.pointToPx = pointToPx;
exports.compoundColor = compoundColor;
exports.compoundLabelColor = compoundLabelColor;
var utils_1 = require("@likec4/core/utils");
var khroma_1 = require("khroma");
function isCompound(node) {
    return node.children.length > 0;
}
function toArrowType(type) {
    switch (type) {
        case 'open':
            return 'vee';
        default:
            return type;
    }
}
function pointToPx(pt) {
    if (Array.isArray(pt)) {
        return [pointToPx(pt[0]), pointToPx(pt[1])];
    }
    (0, utils_1.invariant)(isFinite(pt), "Invalid not finite point value ".concat(pt));
    return Math.round(pt);
}
var inchToPx = function (inch) {
    (0, utils_1.invariant)(isFinite(inch), "Invalid not finite inch value ".concat(inch));
    return Math.floor(inch * 72);
};
exports.inchToPx = inchToPx;
var pxToInch = function (px) { return Math.ceil((px / 72) * 1000) / 1000; };
exports.pxToInch = pxToInch;
var pxToPoints = function (px) { return Math.ceil(px); };
exports.pxToPoints = pxToPoints;
exports.IconSizePoints = (0, exports.pxToPoints)(40).toString();
function compoundColor(color, depth) {
    return (0, khroma_1.toHex)((0, khroma_1.scale)(color, {
        l: -35 - 5 * depth,
        s: -15 - 5 * depth,
    }));
}
function compoundLabelColor(color) {
    return (0, khroma_1.toHex)((0, khroma_1.transparentize)(color, 0.3));
}
