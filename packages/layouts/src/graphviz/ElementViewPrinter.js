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
exports.ElementViewPrinter = void 0;
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var ts_graphviz_1 = require("ts-graphviz");
var dot_labels_1 = require("./dot-labels");
var DotPrinter_1 = require("./DotPrinter");
var utils_2 = require("./utils");
var ElementViewPrinter = /** @class */ (function (_super) {
    __extends(ElementViewPrinter, _super);
    function ElementViewPrinter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ElementViewPrinter.prototype.postBuild = function (G) {
        var _this = this;
        this.assignGroups();
        // Below is custom made "tile" layout for compound nodes
        var compoundIds = new Set();
        var compounds = this.view.nodes.reduce(function (acc, node) {
            if ((0, utils_2.isCompound)(node)) {
                compoundIds.add(node.id);
                acc.push(node);
            }
            return acc;
        }, []);
        var applyNewRank = false;
        var _loop_1 = function (compound) {
            var children = (0, remeda_1.pipe)(compound.children, (0, remeda_1.filter)(function (id) { return !_this.compoundIds.has(id); }), (0, remeda_1.map)(function (id) { return _this.computedNode(id); }), (0, remeda_1.filter)(function (nd) { return nd.inEdges.length === 0 && nd.outEdges.length === 0; }));
            if (children.length <= 2) {
                return "continue";
            }
            var chunkSize = 2;
            switch (true) {
                case children.length > 11:
                    chunkSize = 4;
                    break;
                case children.length > 4:
                    chunkSize = 3;
                    break;
            }
            var subgraph = (0, utils_1.nonNullable)(this_1.getSubgraph(compound.id), "Subgraph not found for ".concat(compound.id));
            var prevChunkHead = null;
            (0, remeda_1.chunk)(children, chunkSize).forEach(function (chunk) {
                var _a;
                var ranked = chunk.length > 1
                    ? subgraph.createSubgraph((_a = {}, _a[ts_graphviz_1.attribute.rank] = 'same', _a))
                    : null;
                chunk.forEach(function (child, i) {
                    var _a;
                    var nd = _this.getGraphNode(child.id);
                    if (!nd) {
                        return;
                    }
                    ranked === null || ranked === void 0 ? void 0 : ranked.node(nd.id);
                    // Make invisible edges between chunks (link heads)
                    if (i === 0) {
                        if (prevChunkHead) {
                            subgraph.edge([prevChunkHead, nd], (_a = {},
                                _a[ts_graphviz_1.attribute.style] = 'invis',
                                _a));
                        }
                        prevChunkHead = nd;
                    }
                });
                applyNewRank = applyNewRank || !!ranked;
            });
        };
        var this_1 = this;
        for (var _i = 0, compounds_1 = compounds; _i < compounds_1.length; _i++) {
            var compound = compounds_1[_i];
            _loop_1(compound);
        }
        // let sources: SubgraphModel | undefined
        // let sinks: SubgraphModel | undefined
        // this.graphology.forEachNode((nodeId, { origin }) => {
        //   if (isCompound(origin) || isNonNullish(origin.parent)) {
        //     return
        //   }
        //   const nd = nonNullable(this.getGraphNode(origin.id))
        //   if (this.graphology.inDegree(nodeId) === 0) {
        //     sources ??= G.createSubgraph({ [_.rank]: 'min' })
        //     sources.node(nd.id)
        //   }
        //   if (this.graphology.outDegree(nodeId) === 0 && this.graphology.inDegree(nodeId) > 0) {
        //     sinks ??= G.createSubgraph({ [_.rank]: 'max' })
        //     sinks.node(nd.id)
        //   }
        // })
        // applyNewRank = applyNewRank || !!sources || !!sinks
        if (applyNewRank) {
            G.set(ts_graphviz_1.attribute.newrank, true);
            G.set(ts_graphviz_1.attribute.clusterrank, 'global');
        }
    };
    ElementViewPrinter.prototype.addEdge = function (edge, G) {
        var _a, _b, _c, _d, _e, _f;
        var _this = this;
        var _g, _h, _j;
        // const viewEdges = this.view.edges
        var _k = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target], sourceFqn = _k[0], targetFqn = _k[1];
        var _l = this.edgeEndpoint(sourceFqn, function (nodes) { return (0, remeda_1.last)(nodes); }), sourceNode = _l[0], source = _l[1], ltail = _l[2];
        var _m = this.edgeEndpoint(targetFqn, remeda_1.first), targetNode = _m[0], target = _m[1], lhead = _m[2];
        var edgeParentId = edge.parent;
        var edgeAttrs = this.graphology.getEdgeAttributes(edge.id);
        var e = G.edge([source, target], (_a = {},
            _a[ts_graphviz_1.attribute.likec4_id] = edge.id,
            _a[ts_graphviz_1.attribute.style] = (_g = edge.line) !== null && _g !== void 0 ? _g : DotPrinter_1.DefaultEdgeStyle,
            _a));
        lhead && e.attributes.set(ts_graphviz_1.attribute.lhead, lhead);
        ltail && e.attributes.set(ts_graphviz_1.attribute.ltail, ltail);
        var hasCompoundEndpoint = (0, remeda_1.isNonNullish)(lhead) || (0, remeda_1.isNonNullish)(ltail);
        if (!this.graphology.hasDirectedEdge(edge.target, edge.source) && edgeAttrs.weight > 1) {
            e.attributes.set(ts_graphviz_1.attribute.weight, edgeAttrs.weight);
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
        var _o = [(_h = edge.head) !== null && _h !== void 0 ? _h : this.$defaults.relationship.arrow, (_j = edge.tail) !== null && _j !== void 0 ? _j : 'none'], head = _o[0], tail = _o[1];
        if (edge.dir === 'back') {
            e.attributes.apply((_c = {},
                _c[ts_graphviz_1.attribute.arrowtail] = (0, utils_2.toArrowType)(head),
                _c[ts_graphviz_1.attribute.dir] = 'back',
                _c));
            if (tail !== 'none') {
                e.attributes.apply((_d = {},
                    _d[ts_graphviz_1.attribute.arrowhead] = (0, utils_2.toArrowType)(tail),
                    _d[ts_graphviz_1.attribute.dir] = 'both',
                    _d[ts_graphviz_1.attribute.minlen] = 0,
                    _d));
            }
            return e;
        }
        if (head === 'none' && tail === 'none') {
            e.attributes.apply((_e = {},
                _e[ts_graphviz_1.attribute.arrowtail] = 'none',
                _e[ts_graphviz_1.attribute.arrowhead] = 'none',
                _e[ts_graphviz_1.attribute.dir] = 'none',
                _e[ts_graphviz_1.attribute.minlen] = 0,
                _e[ts_graphviz_1.attribute.constraint] = false,
                _e));
            return e;
        }
        if (head !== 'none' && tail !== 'none') {
            e.attributes.apply((_f = {},
                _f[ts_graphviz_1.attribute.arrowhead] = (0, utils_2.toArrowType)(head),
                _f[ts_graphviz_1.attribute.arrowtail] = (0, utils_2.toArrowType)(tail),
                _f[ts_graphviz_1.attribute.dir] = 'both',
                _f[ts_graphviz_1.attribute.minlen] = 0,
                _f));
            return e;
        }
        e.attributes.set(ts_graphviz_1.attribute.arrowhead, (0, utils_2.toArrowType)(head));
        if (tail !== 'none') {
            e.attributes.set(ts_graphviz_1.attribute.arrowtail, (0, utils_2.toArrowType)(tail));
        }
        // Skip the following heuristic if this is the only edge in view
        if (this.view.edges.length === 1) {
            return e;
        }
        // This heuristic removes the rank constraint from the edge
        // if it is the only edge within container.
        var otherEdges;
        if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
            otherEdges = this.view.edges.filter(function (e) {
                // exclude self
                if (e.id === edge.id) {
                    return false;
                }
                // exclude edges inside clusters
                if (e.parent !== null) {
                    return false;
                }
                // exclude edges with the same endpoints
                if ((e.source === edge.source && e.target === edge.target)
                    || (e.source === edge.target && e.target === edge.source)) {
                    return false;
                }
                var edgeSource = _this.computedNode(e.source);
                var edgeTarget = _this.computedNode(e.target);
                // hide edges with compound endpoints
                if ((0, utils_2.isCompound)(edgeSource) || (0, utils_2.isCompound)(edgeTarget)) {
                    return false;
                }
                // only edges between top-level nodes
                return edgeSource.parent == null && edgeTarget.parent == null;
            });
        }
        else {
            otherEdges = this.findInternalEdges(edgeParentId).filter(function (e) {
                // exclude self
                if (e.id === edge.id) {
                    return false;
                }
                // exclude edges with the same endpoints
                if ((e.source === edge.source && e.target === edge.target)
                    || (e.source === edge.target && e.target === edge.source)) {
                    return false;
                }
                return true;
            });
        }
        var isTheOnlyEdge = otherEdges.length === 0;
        if (isTheOnlyEdge) {
            if (edgeParentId === null || this.leafElements(edgeParentId).length <= 3) {
                // don't rank the edge
                e.attributes.set(ts_graphviz_1.attribute.minlen, 0);
                // e.attributes.set(_.constraint, false)
            }
        }
        return e;
    };
    return ElementViewPrinter;
}(DotPrinter_1.DotPrinter));
exports.ElementViewPrinter = ElementViewPrinter;
