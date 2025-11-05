"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGraphvizJson = parseGraphvizJson;
var core_1 = require("@likec4/core");
var utils_1 = require("@likec4/core/utils");
var log_1 = require("@likec4/log");
var remeda_1 = require("remeda");
var dot_labels_1 = require("./dot-labels");
var utils_2 = require("./utils");
function parseBB(bb) {
    var _a = bb
        ? bb.split(',').map(function (p) { return (0, utils_2.pointToPx)(+p); })
        : [0, 0, 0, 0], llx = _a[0], lly = _a[1], urx = _a[2], ury = _a[3];
    var width = Math.round(urx - llx);
    var height = Math.round(lly - ury);
    return {
        // x: llx - width / 2,
        // y: lly - height / 2,
        x: Math.round(llx),
        y: Math.round(ury),
        width: width,
        height: height,
    };
}
function parsePos(pos) {
    try {
        var _a = pos.split(','), x = _a[0], y = _a[1];
        return {
            x: (0, utils_2.pointToPx)(parseFloat(x)),
            y: (0, utils_2.pointToPx)(parseFloat(y)),
        };
    }
    catch (e) {
        throw new Error("Failed on parsing pos: ".concat(pos), { cause: e });
    }
}
function parseNode(nodeObj) {
    // const cpos = prsePos(posStr, page)
    var _a = parsePos(nodeObj.pos), x = _a.x, y = _a.y;
    var w = (0, utils_2.inchToPx)(parseFloat(nodeObj.width));
    var h = (0, utils_2.inchToPx)(parseFloat(nodeObj.height));
    return {
        x: x - Math.round(w / 2),
        y: y - Math.round(h / 2),
        width: w,
        height: h,
    };
}
function parseLabelBbox(labelDrawOps, _a) {
    var _b = _a === void 0 ? [0, 0] : _a, containerX = _b[0], containerY = _b[1];
    if (!labelDrawOps || labelDrawOps.length === 0) {
        return null;
    }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var fontSize = 13;
    try {
        for (var _i = 0, labelDrawOps_1 = labelDrawOps; _i < labelDrawOps_1.length; _i++) {
            var draw = labelDrawOps_1[_i];
            if (draw.op === 'F') {
                fontSize = (0, utils_2.pointToPx)(draw.size);
                continue;
            }
            if (draw.op === 'T') {
                var x = (0, utils_2.pointToPx)(draw.pt[0]) - containerX;
                var width = (0, utils_2.pointToPx)(draw.width);
                switch (draw.align) {
                    case 'r':
                        x -= width;
                        break;
                    case 'c':
                        x -= Math.round(width / 2);
                        break;
                }
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x + width);
                var y = (0, utils_2.pointToPx)(draw.pt[1]) - containerY;
                minY = Math.min(minY, Math.round(y - fontSize));
                maxY = Math.max(maxY, y);
            }
        }
    }
    catch (e) {
        log_1.logger.warn("Failed on parsing label draw ops: \n{labelDrawOps}", { e: e, labelDrawOps: labelDrawOps });
        return null;
    }
    // If no draw.op === 'T' found, return null
    if (minX === Infinity) {
        return null;
    }
    var padding = 2;
    return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + 2 * padding,
        height: maxY - minY + 2 * padding,
    };
}
// Discussion:
//   https://forum.graphviz.org/t/how-to-interpret-graphviz-edge-coordinates-from-xdot-or-json/879/11
// Example:
//   https://github.com/hpcc-systems/Visualization/blob/trunk/packages/graph/workers/src/graphviz.ts#L38-L93
function parseEdgePoints(_a, viewId) {
    var _draw_ = _a._draw_, _b = _a.likec4_id, likec4_id = _b === void 0 ? '???' : _b;
    if (viewId === void 0) { viewId = '<unknown view>'; }
    try {
        var bezierOps = _draw_.filter(function (v) { return v.op.toLowerCase() === 'b'; });
        (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(bezierOps, 1), "view ".concat(viewId, " edge ").concat(likec4_id, " should have at least one bezier draw op"));
        if (bezierOps.length > 1) {
            log_1.logger.warn("view ".concat(viewId, " edge ").concat(likec4_id, " has more than one bezier draw op, using the first one only"));
        }
        var points = bezierOps[0].points.map(function (p) { return (0, utils_2.pointToPx)(p); });
        (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(points, 2), "view ".concat(viewId, " edge ").concat(likec4_id, " should have at least two points"));
        return points;
    }
    catch (e) {
        throw new Error("failed on parsing view ".concat(viewId, " edge ").concat(likec4_id, " _draw_:\n").concat(JSON.stringify(_draw_, null, 2)), {
            cause: e,
        });
    }
}
function parseGraphvizEdge(graphvizEdge, _a, viewId) {
    var _b, _c;
    var id = _a.id, source = _a.source, target = _a.target, dir = _a.dir, label = _a.label, description = _a.description, computedEdge = __rest(_a, ["id", "source", "target", "dir", "label", "description"]);
    var labelBBox = parseLabelBbox((_c = (_b = graphvizEdge._ldraw_) !== null && _b !== void 0 ? _b : graphvizEdge._tldraw_) !== null && _c !== void 0 ? _c : graphvizEdge._hldraw_);
    var isBack = graphvizEdge.dir === 'back' || dir === 'back';
    label = (label && labelBBox)
        ? (0, dot_labels_1.wrap)(label, { maxchars: dot_labels_1.EDGE_LABEL_MAX_CHARS, maxLines: dot_labels_1.EDGE_LABEL_MAX_LINES }).join('\n')
        : null;
    return __assign(__assign(__assign(__assign(__assign({ id: id, source: source, target: target, label: label }, (0, remeda_1.isTruthy)(description) && { description: description }), (0, remeda_1.isTruthy)(graphvizEdge.pos) && { dotpos: graphvizEdge.pos }), { points: parseEdgePoints(graphvizEdge, viewId), labelBBox: labelBBox }), (isBack ? { dir: 'back' } : {})), computedEdge);
}
function parseGraphvizJson(graphvizJson, computedView) {
    var _a, _b;
    var _c, _d, _e;
    var page = parseBB(graphvizJson.bb);
    var computedNodes = computedView.nodes, computedEdges = computedView.edges, 
    // exclude
    _manualLayout = computedView.manualLayout, view = __rest(computedView, ["nodes", "edges", "manualLayout"]);
    var diagram;
    if (view._type === 'dynamic') {
        diagram = __assign(__assign({}, view), (_a = { sequenceLayout: {
                    actors: [],
                    compounds: [],
                    parallelAreas: [],
                    steps: [],
                    bounds: page,
                } }, _a[core_1._stage] = 'layouted', _a.bounds = page, _a.nodes = [], _a.edges = [], _a));
    }
    else {
        diagram = __assign(__assign({}, view), (_b = {}, _b[core_1._stage] = 'layouted', _b.bounds = page, _b.nodes = [], _b.edges = [], _b));
    }
    var graphvizObjects = (_c = graphvizJson.objects) !== null && _c !== void 0 ? _c : [];
    var _loop_1 = function (computed) {
        var obj = graphvizObjects.find(function (o) { return o.likec4_id === computed.id; });
        (0, utils_1.invariant)(obj, "View ".concat(view.id, " node ").concat(computed.id, " not found in graphviz output"));
        try {
            var _g = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj), x = _g.x, y = _g.y, width = _g.width, height = _g.height;
            var position = [x, y];
            diagram.nodes.push(__assign(__assign({}, computed), { x: x, y: y, width: width, height: height, labelBBox: (_d = parseLabelBbox(obj._ldraw_, position)) !== null && _d !== void 0 ? _d : { x: x, y: y, width: width, height: height } }));
        }
        catch (e) {
            throw new Error("Failed on parsing node ".concat(computed.id, ":\n").concat(JSON.stringify(obj, null, 2)), { cause: e });
        }
    };
    for (var _i = 0, computedNodes_1 = computedNodes; _i < computedNodes_1.length; _i++) {
        var computed = computedNodes_1[_i];
        _loop_1(computed);
    }
    var graphvizEdges = (_e = graphvizJson.edges) !== null && _e !== void 0 ? _e : [];
    var _loop_2 = function (computedEdge) {
        var graphvizEdge = graphvizEdges.find(function (e) { return e.likec4_id === computedEdge.id; });
        if (!graphvizEdge) {
            log_1.logger.warn(templateObject_1 || (templateObject_1 = __makeTemplateObject(["View ", " edge ", " not found in graphviz output, skipping"], ["View ", " edge ", " not found in graphviz output, skipping"])), view.id, computedEdge.id);
            return "continue";
        }
        diagram.edges.push(parseGraphvizEdge(graphvizEdge, computedEdge, view.id));
    };
    for (var _f = 0, computedEdges_1 = computedEdges; _f < computedEdges_1.length; _f++) {
        var computedEdge = computedEdges_1[_f];
        _loop_2(computedEdge);
    }
    return diagram;
}
var templateObject_1;
// const idFromGvId = (id: GvId) => String(id + 1).padStart(2, '0')
// export function parseOverviewGraphvizJson(graphvizJson: GraphvizJson): OverviewGraph {
//   const page = parseBB(graphvizJson.bb)
//   const overviewGraph: OverviewGraph = {
//     nodes: [],
//     edges: [],
//     bounds: page,
//   }
//   const childToParent = new Map<GvId, OverviewGraph.Node>()
//   const graphvizObjects = graphvizJson.objects ?? []
//   for (const obj of graphvizObjects) {
//     if (!obj.likec4_type) {
//       continue
//     }
//     const id = idFromGvId(obj._gvid)
//     const path = obj.likec4_path ?? ''
//     const parent = childToParent.get(obj._gvid)
//     const { x, y, width, height } = 'bb' in obj ? parseBB(obj.bb) : parseNode(obj)
//     const position = { x, y }
//     if (obj.likec4_type === 'view') {
//       invariant(obj.likec4_id, `View ${obj} has no likec4_id`)
//       overviewGraph.nodes.push({
//         id,
//         type: 'view',
//         parentId: parent?.id ?? null,
//         height,
//         width,
//         position,
//         label: obj.label ?? '',
//         viewId: obj.likec4_id as any as ViewId,
//       })
//     } else {
//       const node: OverviewGraph.Node = {
//         id,
//         type: obj.likec4_type,
//         parentId: parent?.id ?? null,
//         height,
//         width,
//         position,
//         path,
//         label: obj.label ?? '',
//       }
//       const children = [
//         ...('subgraphs' in obj ? obj.subgraphs : []),
//         ...('nodes' in obj ? obj.nodes : []),
//       ]
//       for (const childId of children) {
//         childToParent.set(childId, node)
//       }
//       overviewGraph.nodes.push(node)
//     }
//   }
//   for (const edge of graphvizJson.edges ?? []) {
//     try {
//       const source = idFromGvId(edge.tail)
//       const target = idFromGvId(edge.head)
//       overviewGraph.edges.push({
//         id: `link${idFromGvId(edge._gvid)}`,
//         source,
//         target,
//         points: parseEdgePoints(edge),
//       })
//     } catch (error) {
//       logger.warn(`Failed on parsing edge:\n{edge}`, { error, edge })
//     }
//   }
//   return overviewGraph
// }
