"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentViewPrinter = void 0;
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var ts_graphviz_1 = require("ts-graphviz");
var dot_labels_1 = require("./dot-labels");
var DotPrinter_1 = require("./DotPrinter");
var utils_2 = require("./utils");
// TODO: For now we use ElementViewPrinter for DeploymentView
var DeploymentViewPrinter = /** @class */ (function (_super) {
    __extends(DeploymentViewPrinter, _super);
    function DeploymentViewPrinter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DeploymentViewPrinter.prototype.createGraph = function () {
        var _a;
        var _b, _c;
        var G = _super.prototype.createGraph.call(this);
        var autoLayout = this.view.autoLayout;
        G.delete(ts_graphviz_1.attribute.TBbalance);
        G.apply((_a = {},
            _a[ts_graphviz_1.attribute.nodesep] = (0, utils_2.pxToInch)((_b = autoLayout.nodeSep) !== null && _b !== void 0 ? _b : 130),
            _a[ts_graphviz_1.attribute.ranksep] = (0, utils_2.pxToInch)((_c = autoLayout.rankSep) !== null && _c !== void 0 ? _c : 130),
            _a));
        return G;
    };
    DeploymentViewPrinter.prototype.postBuild = function (G) {
        var _this = this;
        (0, remeda_1.pipe)(this.view.nodes, (0, remeda_1.map)(function (nd) { return ({
            node: nd,
            graphvizNode: _this.getGraphNode(nd.id),
        }); }), (0, remeda_1.groupBy)(function (_a) {
            var node = _a.node, graphvizNode = _a.graphvizNode;
            if (graphvizNode == null) {
                return undefined;
            }
            return node.modelRef;
        }), (0, remeda_1.values)(), (0, remeda_1.map)(function (nodes) {
            return nodes;
        }), (0, remeda_1.forEach)(function (nodes) {
            var _a;
            if (nodes.length < 2) {
                return;
            }
            G.subgraph((_a = {},
                _a[ts_graphviz_1.attribute.rank] = 'same',
                _a), function (subgraph) {
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var graphvizNode = nodes_1[_i].graphvizNode;
                    subgraph.node((0, utils_1.nonNullable)(graphvizNode).id);
                }
            });
        }), (0, remeda_1.tap)(function () {
            G.set(ts_graphviz_1.attribute.newrank, true);
            G.set(ts_graphviz_1.attribute.clusterrank, 'global');
            G.delete(ts_graphviz_1.attribute.pack);
            G.delete(ts_graphviz_1.attribute.packmode);
        }));
    };
    DeploymentViewPrinter.prototype.elementToSubgraph = function (compound, subgraph) {
        var sub = _super.prototype.elementToSubgraph.call(this, compound, subgraph);
        if (compound.children.length > 1) {
            sub.set(ts_graphviz_1.attribute.margin, (0, utils_2.pxToPoints)(50));
        }
        return sub;
    };
    DeploymentViewPrinter.prototype.addEdge = function (edge, G) {
        var _a, _b, _c, _d;
        var _e, _f, _g, _h;
        // const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
        var _j = [edge.source, edge.target], sourceFqn = _j[0], targetFqn = _j[1];
        var _k = this.edgeEndpoint(sourceFqn, function (nodes) { return (0, remeda_1.last)(nodes); }), sourceNode = _k[0], source = _k[1], ltail = _k[2];
        var _l = this.edgeEndpoint(targetFqn, remeda_1.first), targetNode = _l[0], target = _l[1], lhead = _l[2];
        var hasCompoundEndpoint = (0, remeda_1.isNonNullish)(lhead) || (0, remeda_1.isNonNullish)(ltail);
        var e = G.edge([source, target], (_a = {},
            _a[ts_graphviz_1.attribute.likec4_id] = edge.id,
            _a[ts_graphviz_1.attribute.style] = (_e = edge.line) !== null && _e !== void 0 ? _e : DotPrinter_1.DefaultEdgeStyle,
            _a));
        lhead && e.attributes.set(ts_graphviz_1.attribute.lhead, lhead);
        ltail && e.attributes.set(ts_graphviz_1.attribute.ltail, ltail);
        var weight = this.graphology.getEdgeAttribute(edge.id, 'weight');
        if (weight > 1 && !this.graphology.hasDirectedEdge(edge.target, edge.source)) {
            e.attributes.set(ts_graphviz_1.attribute.weight, weight);
        }
        var label = (0, dot_labels_1.edgelabel)(edge);
        if (label) {
            e.attributes.set(hasCompoundEndpoint ? ts_graphviz_1.attribute.xlabel : ts_graphviz_1.attribute.label, label);
        }
        if (edge.color && edge.color !== this.$defaults.relationship.color) {
            var colorValues = this.styles.colors(edge.color).relationships;
            e.attributes.apply((_b = {},
                _b[ts_graphviz_1.attribute.color] = colorValues.line,
                _b[ts_graphviz_1.attribute.fontcolor] = colorValues.label,
                _b));
        }
        var _m = [(_f = edge.head) !== null && _f !== void 0 ? _f : this.$defaults.relationship.arrow, (_g = edge.tail) !== null && _g !== void 0 ? _g : 'none'], head = _m[0], tail = _m[1];
        if (head === 'none' && tail === 'none') {
            e.attributes.apply((_c = {},
                _c[ts_graphviz_1.attribute.arrowtail] = 'none',
                _c[ts_graphviz_1.attribute.arrowhead] = 'none',
                _c[ts_graphviz_1.attribute.dir] = 'none',
                _c));
            return e;
        }
        if (edge.dir === 'both') {
            e.attributes.apply((_d = {},
                _d[ts_graphviz_1.attribute.arrowhead] = (0, utils_2.toArrowType)(head),
                _d[ts_graphviz_1.attribute.arrowtail] = (0, utils_2.toArrowType)((_h = edge.tail) !== null && _h !== void 0 ? _h : head),
                _d[ts_graphviz_1.attribute.dir] = 'both',
                _d));
            if (!hasCompoundEndpoint && sourceNode.modelRef !== targetNode.modelRef) {
                e.attributes.set(ts_graphviz_1.attribute.constraint, false);
            }
            return e;
        }
        if (head) {
            e.attributes.set(ts_graphviz_1.attribute.arrowhead, (0, utils_2.toArrowType)(head));
        }
        if (tail !== 'none') {
            e.attributes.set(ts_graphviz_1.attribute.arrowtail, (0, utils_2.toArrowType)(tail));
        }
        return e;
    };
    return DeploymentViewPrinter;
}(DotPrinter_1.DotPrinter));
exports.DeploymentViewPrinter = DeploymentViewPrinter;
