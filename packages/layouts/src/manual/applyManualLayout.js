"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyManualLayout = applyManualLayout;
var core_1 = require("@likec4/core");
var fast_equals_1 = require("fast-equals");
var vecti_1 = require("vecti");
var nodeSep = 100;
var rankSep = 100;
var containerMargin = { top: 50, right: 40, bottom: 40, left: 40 };
/**
 * When the hash of the diagram view is the same as the previous hash, we can safely apply the layout.
 */
function safeApplyLayout(diagramView, manualLayout) {
    var nodes = diagramView.nodes.map(function (node) {
        var previous = manualLayout.nodes[node.id];
        if (!previous) {
            return node;
        }
        var x = previous.x, y = previous.y, width = previous.width, height = previous.height;
        return __assign(__assign({}, node), { width: width, height: height, x: x, y: y });
    });
    var edges = diagramView.edges.map(function (edge) {
        var previous = manualLayout.edges[edge.id];
        if (!previous) {
            return edge;
        }
        return __assign(__assign({}, edge), previous);
    });
    return __assign(__assign({}, diagramView), { bounds: {
            x: manualLayout.x,
            y: manualLayout.y,
            width: manualLayout.width,
            height: manualLayout.height,
        }, nodes: nodes, edges: edges });
}
function applyManualLayout(diagramView, manualLayout) {
    var nodes = new Map(diagramView.nodes.map(function (node) { return [node.id, node]; }));
    if (diagramView.hash === manualLayout.hash
        || canApplySafely(diagramView, manualLayout)) {
        // We still need to adjust size of compounds as one of their children might have been removed
        adjustCompoundNodes(diagramView.nodes.filter(function (node) { return !node.parent; }), nodes, manualLayout);
        return safeApplyLayout(diagramView, manualLayout);
    }
    diagramView.hasLayoutDrift = true;
    // Place new nodes
    var previousBb = core_1.BBox.merge.apply(core_1.BBox, diagramView.nodes
        .map(function (node) { return manualLayout.nodes[node.id]; })
        .filter(function (n) { return !!n; }));
    diagramView.nodes
        .filter(function (node) { return node.parent == null; })
        .reduce(function (acc, node) { return layoutNode(node, acc, nodes, manualLayout); }, { x: previousBb.x, y: previousBb.y + previousBb.height + rankSep });
    // Add new edges
    diagramView.edges
        .filter(function (edge) { return !manualLayout.edges[edge.id]; })
        .forEach(function (edge) { return layoutEdge(edge, manualLayout); });
    return safeApplyLayout(diagramView, manualLayout);
}
function layoutNode(node, basePoint, nodes, manualLayout) {
    var _a, _b;
    var nodeLayout = manualLayout.nodes[node.id];
    var wasCompound = (_a = nodeLayout === null || nodeLayout === void 0 ? void 0 : nodeLayout.isCompound) !== null && _a !== void 0 ? _a : false;
    var isNew = !nodeLayout;
    var placeAt = isNew
        // It's a new node, we'll place it at base point
        ? basePoint
        // It's an existing node, we'll leave it where it is
        : { x: nodeLayout.x, y: nodeLayout.y };
    // Layout children
    var previousChildren = node.children
        .map(function (child) { return manualLayout.nodes[child]; })
        .filter(function (n) { return !!n; });
    var oldChildrenBb = previousChildren.length > 0 && core_1.BBox.merge.apply(core_1.BBox, previousChildren);
    var placeChildrenAt = wasCompound && oldChildrenBb
        // Place new children under the old ones
        ? {
            x: oldChildrenBb.x,
            y: oldChildrenBb.y + oldChildrenBb.height + rankSep,
        }
        // Place new children as a content of the parent
        : {
            x: placeAt.x + containerMargin.left,
            y: placeAt.y + containerMargin.top,
        };
    node.children
        .map(function (child) { return nodes.get(child); })
        .reduce(function (acc, child) { return layoutNode(child, acc, nodes, manualLayout); }, placeChildrenAt);
    // Layout node itself
    nodeLayout = node.children.length > 0
        ? buildCompoundNodeLayout(node, manualLayout)
        : (_b = manualLayout.nodes[node.id]) !== null && _b !== void 0 ? _b : {
            isCompound: false,
            width: node.width,
            height: node.height,
            x: placeAt.x,
            y: placeAt.y,
        };
    manualLayout.nodes[node.id] = nodeLayout;
    return isNew
        // It's a new node, the next one should be placed to the right
        ? { x: nodeLayout.x + nodeLayout.width + nodeSep, y: nodeLayout.y }
        // It's an existing node, it did not use the basePoint
        : basePoint;
}
function layoutEdge(edge, manualLayout) {
    var _a;
    var source = manualLayout.nodes[edge.source];
    var target = manualLayout.nodes[edge.target];
    var sourceCenter = toVector(core_1.BBox.center(source));
    var targetCenter = toVector(core_1.BBox.center(target));
    var edgeVector = targetCenter.subtract(sourceCenter);
    var _b = edgeVector.divide(2).add(sourceCenter), middlePointX = _b.x, middlePointY = _b.y;
    var labelBBox = __assign(__assign({}, ((_a = edge === null || edge === void 0 ? void 0 : edge.labelBBox) !== null && _a !== void 0 ? _a : { width: 0, height: 0 })), { x: middlePointX, y: middlePointY });
    var controlPoint = edgeVector.multiply(0.7).add(sourceCenter);
    var middlePoint = edgeVector.multiply(0.3).add(sourceCenter);
    manualLayout.edges[edge.id] = {
        points: [
            [sourceCenter.x, sourceCenter.y],
            [middlePoint.x, middlePoint.y],
            [controlPoint.x, controlPoint.y],
            [targetCenter.x, targetCenter.y],
        ],
        labelBBox: labelBBox,
        controlPoints: [controlPoint],
    };
}
function adjustCompoundNodes(nodesToAdjust, nodes, manualLayout) {
    nodesToAdjust
        .filter(function (node) { return node.children.length > 0; })
        .forEach(function (node) {
        adjustCompoundNodes(node.children
            .map(function (child) { return nodes.get(child); })
            .filter(function (n) { return !!n; }), nodes, manualLayout);
        manualLayout.nodes[node.id] = buildCompoundNodeLayout(node, manualLayout);
    });
}
function buildCompoundNodeLayout(node, manualLayout) {
    var childrenBb = core_1.BBox.merge.apply(core_1.BBox, node.children.map(function (child) { return manualLayout.nodes[child]; }));
    return {
        isCompound: true,
        x: childrenBb.x - containerMargin.left,
        y: childrenBb.y - containerMargin.top,
        width: childrenBb.width + containerMargin.left + containerMargin.right,
        height: childrenBb.height + containerMargin.top + containerMargin.bottom,
    };
}
function canApplySafely(diagramView, manualLayout) {
    var isCompound = function (node) { return node.children.length > 0; };
    // We still can safely apply the layout:
    // - autoLayout is the same
    // - no new nodes
    // - compound nodes do not become leaf nodes and vice versa
    // - no new edges
    return (0, fast_equals_1.deepEqual)(diagramView.autoLayout, manualLayout.autoLayout)
        && diagramView.nodes.every(function (n) {
            var manualNode = manualLayout.nodes[n.id];
            return !!manualNode
                && isCompound(n) === manualNode.isCompound;
        })
        && diagramView.edges.every(function (e) { return !!manualLayout.edges[e.id]; });
}
function toVector(_a) {
    var x = _a.x, y = _a.y;
    return new vecti_1.Vector(x, y);
}
