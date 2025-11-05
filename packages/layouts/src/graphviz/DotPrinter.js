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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DotPrinter = exports.DefaultEdgeStyle = void 0;
var utils_1 = require("@likec4/core/utils");
var graphology_1 = require("@likec4/core/utils/graphology");
var log_1 = require("@likec4/log");
var remeda_1 = require("remeda");
var ts_graphviz_1 = require("ts-graphviz");
var dot_labels_1 = require("./dot-labels");
var utils_2 = require("./utils");
exports.DefaultEdgeStyle = 'dashed';
var FontName = 'Arial';
var logger = (0, log_1.createLogger)('dot');
var DotPrinter = /** @class */ (function () {
    function DotPrinter(view, styles) {
        var _this = this;
        var _a, _b, _c;
        this.view = view;
        this.styles = styles;
        this.ids = new Set();
        this.subgraphs = new Map();
        this.nodes = new Map();
        this.edges = new Map();
        this.graphology = new graphology_1.Graph({
            allowSelfLoops: true,
            multi: true,
            type: 'directed',
        });
        this.compoundIds = new Set(view.nodes.filter(utils_2.isCompound).map(function (n) { return n.id; }));
        this.edgesWithCompounds = new Set(this.compoundIds.size > 0
            ? view.edges
                .filter(function (e) { return _this.compoundIds.has(e.source) || _this.compoundIds.has(e.target); })
                .map(function (n) { return n.id; })
            : []);
        for (var _i = 0, _d = view.nodes; _i < _d.length; _i++) {
            var node = _d[_i];
            this.graphology.addNode(node.id, {
                origin: node,
                level: node.level,
                depth: (_a = node.depth) !== null && _a !== void 0 ? _a : 0,
                modelRef: (_b = node.modelRef) !== null && _b !== void 0 ? _b : null,
                deploymentRef: (_c = node.deploymentRef) !== null && _c !== void 0 ? _c : null,
                maxConnectedHierarchyDistance: 0,
            });
        }
        for (var _e = 0, _f = view.edges; _e < _f.length; _e++) {
            var edge = _f[_e];
            // First compare deploymentRef of any
            var sourceFqn = this.graphology.getNodeAttribute(edge.source, 'deploymentRef');
            var targetFqn = this.graphology.getNodeAttribute(edge.target, 'deploymentRef');
            if (sourceFqn === null || targetFqn === null) {
                // Then compare modelRef
                sourceFqn = this.graphology.getNodeAttribute(edge.source, 'modelRef');
                targetFqn = this.graphology.getNodeAttribute(edge.target, 'modelRef');
            }
            var distance = -1;
            if (sourceFqn !== null && targetFqn !== null) {
                distance = (0, utils_1.hierarchyDistance)(sourceFqn, targetFqn);
            }
            else {
                logger.warn("Edge ".concat(edge.id, " of view ").concat(view.id, " is invalid, sourceFqn: ").concat(sourceFqn, ", targetFqn: ").concat(targetFqn));
            }
            this.graphology.addEdgeWithKey(edge.id, edge.source, edge.target, {
                origin: edge,
                hierarchyDistance: distance,
                weight: 1,
            });
            if (distance > this.graphology.getNodeAttribute(edge.source, 'maxConnectedHierarchyDistance')) {
                this.graphology.mergeNodeAttributes(edge.source, {
                    maxConnectedHierarchyDistance: distance,
                });
            }
            if (distance > this.graphology.getNodeAttribute(edge.target, 'maxConnectedHierarchyDistance')) {
                this.graphology.mergeNodeAttributes(edge.target, {
                    maxConnectedHierarchyDistance: distance,
                });
            }
        }
        this.graphology.forEachEdge(function (edgeId, _a, _s, _t, sourceAttributes, targetAttributes) {
            var hierarchyDistance = _a.hierarchyDistance;
            var maxDistance = Math.max(sourceAttributes.maxConnectedHierarchyDistance, targetAttributes.maxConnectedHierarchyDistance);
            if (maxDistance > hierarchyDistance) {
                _this.graphology.mergeEdgeAttributes(edgeId, {
                    weight: maxDistance - hierarchyDistance + 1,
                });
            }
            else {
                var sourceDegree = _this.graphology.directedDegree(_s);
                var targetDegree = _this.graphology.directedDegree(_t);
                if (sourceDegree === 1 && targetDegree === 1 && hierarchyDistance > 1) {
                    _this.graphology.mergeEdgeAttributes(edgeId, {
                        weight: hierarchyDistance,
                    });
                }
            }
        });
        var G = this.graphvizModel = this.createGraph();
        this.applyNodeAttributes(G.attributes.node);
        this.applyEdgeAttributes(G.attributes.edge);
        this.build(G);
        this.postBuild(G);
    }
    Object.defineProperty(DotPrinter.prototype, "$defaults", {
        get: function () {
            return this.styles.defaults;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DotPrinter.prototype, "hasEdgesWithCompounds", {
        get: function () {
            return this.edgesWithCompounds.size > 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DotPrinter.prototype, "defaultRelationshipColors", {
        get: function () {
            var colorValues = this.styles.relationshipColors;
            return {
                line: colorValues.line,
                label: colorValues.label,
                labelBg: colorValues.labelBg,
            };
        },
        enumerable: false,
        configurable: true
    });
    DotPrinter.prototype.postBuild = function (_G) {
        // override in subclass
    };
    DotPrinter.prototype.build = function (G) {
        var _this = this;
        // ----------------------------------------------
        // Traverse clusters first
        var traverseClusters = function (element, parent) {
            var id = _this.generateGraphvizId(element);
            var subgraph = _this.elementToSubgraph(element, parent.subgraph(id));
            _this.subgraphs.set(element.id, subgraph);
            for (var _i = 0, _a = element.children; _i < _a.length; _i++) {
                var childId = _a[_i];
                var child = _this.computedNode(childId);
                if ((0, utils_2.isCompound)(child)) {
                    traverseClusters(child, subgraph);
                }
                else {
                    var gvnode = (0, utils_1.nonNullable)(_this.getGraphNode(child.id), "Graphviz Node not found for ".concat(child.id));
                    subgraph.node(gvnode.id);
                }
            }
        };
        var topCompound = [];
        for (var _i = 0, _a = this.view.nodes; _i < _a.length; _i++) {
            var element = _a[_i];
            if ((0, utils_2.isCompound)(element)) {
                if ((0, remeda_1.isNullish)(element.parent)) {
                    topCompound.push(element);
                }
            }
            else {
                var id = this.generateGraphvizId(element);
                var node = this.elementToNode(element, G.node(id));
                this.nodes.set(element.id, node);
            }
        }
        for (var _b = 0, topCompound_1 = topCompound; _b < topCompound_1.length; _b++) {
            var compound = topCompound_1[_b];
            traverseClusters(compound, G);
        }
        for (var _c = 0, _d = this.view.edges; _c < _d.length; _c++) {
            var edge = _d[_c];
            var model = this.addEdge(edge, G);
            if (model) {
                this.edges.set(edge.id, model);
            }
        }
    };
    DotPrinter.prototype.print = function () {
        return (0, ts_graphviz_1.toDot)(this.graphvizModel, {
            print: {
                indentStyle: 'space',
                indentSize: 2,
            },
        });
    };
    DotPrinter.prototype.createGraph = function () {
        var _a, _b;
        var _c, _d;
        var autoLayout = this.view.autoLayout;
        var G = (0, ts_graphviz_1.digraph)((_a = {},
            _a[ts_graphviz_1.attribute.likec4_viewId] = this.view.id,
            _a[ts_graphviz_1.attribute.bgcolor] = 'transparent',
            _a[ts_graphviz_1.attribute.layout] = 'dot',
            _a[ts_graphviz_1.attribute.compound] = true,
            _a[ts_graphviz_1.attribute.rankdir] = autoLayout.direction,
            _a[ts_graphviz_1.attribute.TBbalance] = 'min',
            _a[ts_graphviz_1.attribute.splines] = 'spline',
            _a[ts_graphviz_1.attribute.outputorder] = 'nodesfirst',
            _a[ts_graphviz_1.attribute.nodesep] = (0, utils_2.pxToInch)((_c = autoLayout.nodeSep) !== null && _c !== void 0 ? _c : 110),
            _a[ts_graphviz_1.attribute.ranksep] = (0, utils_2.pxToInch)((_d = autoLayout.rankSep) !== null && _d !== void 0 ? _d : 120),
            _a[ts_graphviz_1.attribute.pad] = (0, utils_2.pxToInch)(15),
            _a[ts_graphviz_1.attribute.fontname] = FontName,
            _a));
        G.attributes.graph.apply((_b = {},
            _b[ts_graphviz_1.attribute.fontsize] = (0, utils_2.pxToPoints)(15),
            _b[ts_graphviz_1.attribute.labeljust] = autoLayout.direction === 'RL' ? 'r' : 'l',
            _b[ts_graphviz_1.attribute.labelloc] = autoLayout.direction === 'BT' ? 'b' : 't',
            _b[ts_graphviz_1.attribute.margin] = 50.1,
            _b));
        return G;
    };
    DotPrinter.prototype.applyNodeAttributes = function (node) {
        var _a;
        var colors = this.styles.elementColors;
        node.apply((_a = {},
            _a[ts_graphviz_1.attribute.fontname] = FontName,
            _a[ts_graphviz_1.attribute.shape] = 'rect',
            _a[ts_graphviz_1.attribute.fillcolor] = colors.fill,
            _a[ts_graphviz_1.attribute.fontcolor] = colors.hiContrast,
            _a[ts_graphviz_1.attribute.color] = colors.stroke,
            _a[ts_graphviz_1.attribute.style] = 'filled',
            _a[ts_graphviz_1.attribute.penwidth] = 0,
            _a));
    };
    DotPrinter.prototype.applyEdgeAttributes = function (edge) {
        var _a;
        var colors = this.defaultRelationshipColors;
        edge.apply((_a = {},
            _a[ts_graphviz_1.attribute.arrowsize] = 0.75,
            _a[ts_graphviz_1.attribute.fontname] = FontName,
            _a[ts_graphviz_1.attribute.fontsize] = (0, utils_2.pxToPoints)(14),
            _a[ts_graphviz_1.attribute.penwidth] = (0, utils_2.pxToPoints)(2),
            _a[ts_graphviz_1.attribute.color] = colors.line,
            _a[ts_graphviz_1.attribute.fontcolor] = colors.label,
            _a));
    };
    DotPrinter.prototype.checkNodeId = function (name, isCompound) {
        if (isCompound === void 0) { isCompound = false; }
        if (isCompound) {
            name = 'cluster_' + name;
        }
        else if (name.toLowerCase().startsWith('cluster')) {
            name = 'nd_' + name;
        }
        if (!this.ids.has(name)) {
            this.ids.add(name);
            return name;
        }
        return null;
    };
    DotPrinter.prototype.generateGraphvizId = function (node) {
        var _compound = (0, utils_2.isCompound)(node);
        var elementName = (0, utils_1.nameFromFqn)(node.id).toLowerCase();
        var name = this.checkNodeId(elementName, _compound);
        if (name !== null) {
            return name;
        }
        // use post-index
        elementName = (0, utils_1.nameFromFqn)(node.id).toLowerCase();
        var i = 1;
        do {
            name = this.checkNodeId(elementName + '_' + i++, _compound);
        } while (name === null);
        return name;
    };
    DotPrinter.prototype.elementToSubgraph = function (compound, subgraph) {
        var _a;
        (0, utils_1.invariant)((0, utils_2.isCompound)(compound), 'node should be compound');
        (0, utils_1.invariant)((0, remeda_1.isNumber)(compound.depth), 'node.depth should be defined');
        var colorValues = this.styles.colors(compound.color).elements;
        var textColor = (0, utils_2.compoundLabelColor)(colorValues.loContrast);
        subgraph.apply((_a = {},
            _a[ts_graphviz_1.attribute.likec4_id] = compound.id,
            _a[ts_graphviz_1.attribute.likec4_level] = compound.level,
            _a[ts_graphviz_1.attribute.likec4_depth] = compound.depth,
            _a[ts_graphviz_1.attribute.fillcolor] = (0, utils_2.compoundColor)(colorValues.fill, compound.depth),
            _a[ts_graphviz_1.attribute.color] = (0, utils_2.compoundColor)(colorValues.stroke, compound.depth),
            _a[ts_graphviz_1.attribute.style] = 'filled',
            _a[ts_graphviz_1.attribute.margin] = (0, utils_2.pxToPoints)(compound.children.length > 1 ? 40 : 32),
            _a));
        if (!(0, remeda_1.isEmpty)(compound.title.trim())) {
            subgraph.set(ts_graphviz_1.attribute.label, (0, dot_labels_1.compoundLabel)(compound, textColor));
        }
        return subgraph;
    };
    DotPrinter.prototype.elementToNode = function (element, node) {
        var _a, _b, _c, _d, _e, _f;
        (0, utils_1.invariant)(!(0, utils_2.isCompound)(element), 'node should not be compound');
        var hasIcon = (0, remeda_1.isTruthy)(element.icon);
        var colorValues = this.styles.colors(element.color).elements;
        var _g = this.styles.nodeSizes(element.style).values, padding = _g.padding, _h = _g.sizes, width = _h.width, height = _h.height;
        node.attributes.apply((_a = {},
            _a[ts_graphviz_1.attribute.likec4_id] = element.id,
            _a[ts_graphviz_1.attribute.likec4_level] = element.level,
            _a[ts_graphviz_1.attribute.label] = (0, dot_labels_1.nodeLabel)(element, this.styles),
            _a[ts_graphviz_1.attribute.margin] = "".concat((0, utils_2.pxToInch)(hasIcon ? 8 : padding), ",").concat((0, utils_2.pxToInch)(padding)),
            _a));
        node.attributes.set(ts_graphviz_1.attribute.width, (0, utils_2.pxToInch)(width));
        node.attributes.set(ts_graphviz_1.attribute.height, (0, utils_2.pxToInch)(height));
        if (!this.styles.isDefaultColor(element.color)) {
            node.attributes.apply((_b = {},
                _b[ts_graphviz_1.attribute.fillcolor] = colorValues.fill,
                _b[ts_graphviz_1.attribute.fontcolor] = colorValues.hiContrast,
                _b[ts_graphviz_1.attribute.color] = colorValues.stroke,
                _b));
        }
        switch (element.shape) {
            case 'cylinder':
            case 'storage': {
                node.attributes.apply((_c = {},
                    _c[ts_graphviz_1.attribute.margin] = "".concat((0, utils_2.pxToInch)(hasIcon ? 8 : padding), ",").concat((0, utils_2.pxToInch)(0)),
                    _c[ts_graphviz_1.attribute.penwidth] = (0, utils_2.pxToPoints)(2),
                    _c[ts_graphviz_1.attribute.shape] = 'cylinder',
                    _c));
                break;
            }
            case 'browser': {
                node.attributes.apply((_d = {},
                    _d[ts_graphviz_1.attribute.margin] = "".concat((0, utils_2.pxToInch)(hasIcon ? 8 : padding + 4), ",").concat((0, utils_2.pxToInch)(padding + 6)),
                    _d));
                break;
            }
            case 'mobile': {
                node.attributes.apply((_e = {},
                    _e[ts_graphviz_1.attribute.margin] = "".concat((0, utils_2.pxToInch)(hasIcon ? 8 : padding + 4), ",").concat((0, utils_2.pxToInch)(padding)),
                    _e));
                break;
            }
            case 'queue': {
                node.attributes.apply((_f = {},
                    _f[ts_graphviz_1.attribute.width] = (0, utils_2.pxToInch)(width),
                    _f[ts_graphviz_1.attribute.height] = (0, utils_2.pxToInch)(height - 8),
                    _f[ts_graphviz_1.attribute.margin] = "".concat((0, utils_2.pxToInch)(hasIcon ? 8 : padding + 4), ",").concat((0, utils_2.pxToInch)(padding)),
                    _f));
                break;
            }
            default:
                break;
        }
        return node;
    };
    DotPrinter.prototype.leafElements = function (parentId) {
        var _this = this;
        if (parentId === null) {
            return this.view.nodes.filter(function (n) { return !(0, utils_2.isCompound)(n); });
        }
        return this.computedNode(parentId).children.flatMap(function (childId) {
            var child = _this.computedNode(childId);
            return (0, utils_2.isCompound)(child) ? _this.leafElements(child.id) : child;
        });
    };
    DotPrinter.prototype.descendants = function (parentId) {
        var _this = this;
        if (parentId === null) {
            return this.view.nodes.slice();
        }
        return this.computedNode(parentId).children.flatMap(function (childId) {
            var child = _this.computedNode(childId);
            return __spreadArray([child], _this.descendants(child.id), true);
        });
    };
    DotPrinter.prototype.computedNode = function (id) {
        return (0, utils_1.nonNullable)(this.view.nodes.find(function (n) { return n.id === id; }), "Node ".concat(id, " not found"));
    };
    DotPrinter.prototype.getGraphNode = function (id) {
        var _a;
        return (_a = this.nodes.get(id)) !== null && _a !== void 0 ? _a : null;
    };
    DotPrinter.prototype.getSubgraph = function (id) {
        var _a;
        return (_a = this.subgraphs.get(id)) !== null && _a !== void 0 ? _a : null;
    };
    /**
     * In case edge has a cluster as endpoint,
     * pick nested node to use as endpoint
     */
    DotPrinter.prototype.edgeEndpoint = function (endpointId, pickFromCluster) {
        var _a;
        var element = this.computedNode(endpointId);
        var endpoint = this.getGraphNode(endpointId);
        // see https://graphviz.org/docs/attrs/lhead/
        var logicalEndpoint;
        if (!endpoint) {
            (0, utils_1.invariant)((0, utils_2.isCompound)(element), 'endpoint node should be compound');
            // Edge with cluster as endpoint
            logicalEndpoint = (_a = this.getSubgraph(endpointId)) === null || _a === void 0 ? void 0 : _a.id;
            (0, utils_1.invariant)(logicalEndpoint, "subgraph ".concat(endpointId, " not found"));
            element = (0, utils_1.nonNullable)(pickFromCluster(this.leafElements(endpointId)), "leaf element in ".concat(endpointId, " not found"));
            endpoint = (0, utils_1.nonNullable)(this.getGraphNode(element.id), "source graphviz node ".concat(element.id, " not found"));
        }
        return [element, endpoint, logicalEndpoint];
    };
    DotPrinter.prototype.findInternalEdges = function (parentId) {
        var _this = this;
        if (parentId === null) {
            return this.view.edges.slice();
        }
        var parent = this.computedNode(parentId);
        return (0, remeda_1.pipe)(this.descendants(parentId), (0, remeda_1.flatMap)(function (child) {
            return (0, remeda_1.concat)(child.inEdges, child.outEdges);
        }), (0, remeda_1.unique)(), (0, remeda_1.difference)((0, remeda_1.concat)(parent.inEdges, parent.outEdges)), (0, remeda_1.map)(function (edgeId) { return _this.view.edges.find(function (e) { return e.id === edgeId; }); }), (0, remeda_1.filter)(remeda_1.isTruthy));
    };
    DotPrinter.prototype.withoutCompoundEdges = function (element) {
        var _this = this;
        if (this.edgesWithCompounds.size === 0) {
            return element;
        }
        return __assign(__assign({}, element), { inEdges: element.inEdges.filter(function (e) { return !_this.edgesWithCompounds.has(e); }), outEdges: element.outEdges.filter(function (e) { return !_this.edgesWithCompounds.has(e); }) });
    };
    DotPrinter.prototype.assignGroups = function () {
        var _this = this;
        var groups = (0, remeda_1.pipe)(this.view.nodes, (0, remeda_1.filter)(utils_2.isCompound), (0, remeda_1.map)(function (n) { return n.id; }), (0, remeda_1.sort)(utils_1.compareFqnHierarchically), (0, remeda_1.reverse)(), (0, remeda_1.map)(function (id) {
            // edges only inside clusters, compound endpoints are not considered
            var edges = _this.findInternalEdges(id).filter(function (e) {
                return e.source !== e.target && !_this.compoundIds.has(e.source) && !_this.compoundIds.has(e.target);
            });
            return { id: id, edges: edges };
        }), (0, remeda_1.filter)(function (_a) {
            var edges = _a.edges;
            return edges.length > 1 && edges.length < 8;
        }), 
        // take only first 4 groups, otherwise grahviz eats the memory
        (0, remeda_1.take)(4));
        var processed = new Set();
        for (var _i = 0, groups_1 = groups; _i < groups_1.length; _i++) {
            var group = groups_1[_i];
            var edges = group.edges.filter(function (e) { return !processed.has(e.source) && !processed.has(e.target); });
            for (var _a = 0, edges_1 = edges; _a < edges_1.length; _a++) {
                var edge = edges_1[_a];
                try {
                    var sourceNode = (0, utils_1.nonNullable)(this.getGraphNode(edge.source), "Graphviz Node not found for ".concat(edge.source));
                    var targetNode = (0, utils_1.nonNullable)(this.getGraphNode(edge.target), "Graphviz Node not found for ".concat(edge.target));
                    processed.add(edge.source);
                    processed.add(edge.target);
                    sourceNode.attributes.set(ts_graphviz_1.attribute.group, group.id);
                    targetNode.attributes.set(ts_graphviz_1.attribute.group, group.id);
                }
                catch (error) {
                    logger.error("Failed to assign group to edge ".concat(edge.id), { error: error });
                }
            }
        }
    };
    /**
     * Use coordinates from given diagram as initial position for nodes
     * (try to keep existing layout as much as possible)
     */
    DotPrinter.prototype.applyManualLayout = function (_a) {
        var _b, _c;
        var _d;
        var height = _a.height, layout = __rest(_a, ["height"]);
        var offsetX = layout.x < 0 ? -layout.x : 0;
        var offsetY = layout.y < 0 ? -layout.y : 0;
        var isShifted = offsetX > 0 || offsetY > 0;
        for (var _i = 0, _e = layout.nodes; _i < _e.length; _i++) {
            var _f = _e[_i];
            var id = _f.id, manual = __rest(_f, ["id"]);
            // we pin only nodes, not clusters
            var model = this.getGraphNode(id);
            if (!model) {
                continue;
            }
            // Invert Y axis and convert to inches
            var x = (0, utils_2.pxToInch)(manual.center.x) + offsetX;
            var y = (0, utils_2.pxToInch)(height - manual.center.y);
            if (manual.fixedsize) {
                model.attributes.apply((_b = {},
                    _b[ts_graphviz_1.attribute.pos] = "".concat(x, ",").concat(y, "!"),
                    _b[ts_graphviz_1.attribute.pin] = true,
                    _b[ts_graphviz_1.attribute.width] = (0, utils_2.pxToInch)(manual.fixedsize.width),
                    _b[ts_graphviz_1.attribute.height] = (0, utils_2.pxToInch)(manual.fixedsize.height),
                    _b[ts_graphviz_1.attribute.fixedsize] = true,
                    _b));
            }
            else {
                // Not pinned, but suggested position
                model.attributes.set(ts_graphviz_1.attribute.pos, "".concat(x, ",").concat(y));
            }
        }
        var _loop_1 = function (id, edgeModel) {
            edgeModel.attributes.delete(ts_graphviz_1.attribute.weight);
            edgeModel.attributes.delete(ts_graphviz_1.attribute.minlen);
            edgeModel.attributes.delete(ts_graphviz_1.attribute.constraint);
            var dotpos = (_d = layout.edges.find(function (e) { return e.id === id; })) === null || _d === void 0 ? void 0 : _d.dotpos;
            if (dotpos && !isShifted) {
                edgeModel.attributes.set(ts_graphviz_1.attribute.pos, dotpos);
            }
        };
        for (var _g = 0, _h = this.edges.entries(); _g < _h.length; _g++) {
            var _j = _h[_g], id = _j[0], edgeModel = _j[1];
            _loop_1(id, edgeModel);
        }
        // TODO: apply manual layout fails when there are edges with compounds
        // Array.from(this.edgesWithCompounds.values()).forEach(edgeId => {
        //   const edge = this.edges.get(edgeId)!
        //   if (!edge) {
        //     return
        //   }
        //   const source = edge.attributes.get(_.ltail) ?? edge.targets[0]
        //   const target = edge.attributes.get(_.lhead) ?? edge.targets[1]
        //   edge.attributes.delete(_.ltail)
        //   edge.attributes.delete(_.lhead)
        //   const xlabel = edge.attributes.get(_.xlabel)
        //   if (xlabel) {
        //     edge.attributes.delete(_.xlabel)
        //     edge.attributes.set(_.label, xlabel)
        //   }
        //   this.graphvizModel.edge([source, target]).attributes.apply(edge.attributes.values)
        //   this.graphvizModel.removeEdge(edge)
        // })
        this.graphvizModel.apply((_c = {},
            _c[ts_graphviz_1.attribute.layout] = 'fdp',
            // [_.scale]: 72.0,
            _c[ts_graphviz_1.attribute.overlap] = 'vpsc',
            _c[ts_graphviz_1.attribute.sep] = '+50,50',
            _c[ts_graphviz_1.attribute.esep] = '+10,10',
            _c[ts_graphviz_1.attribute.start] = 'random2',
            _c[ts_graphviz_1.attribute.splines] = 'compound',
            _c[ts_graphviz_1.attribute.K] = 10,
            _c));
        this.graphvizModel.delete(ts_graphviz_1.attribute.compound);
        this.graphvizModel.delete(ts_graphviz_1.attribute.rankdir);
        this.graphvizModel.delete(ts_graphviz_1.attribute.nodesep);
        this.graphvizModel.delete(ts_graphviz_1.attribute.ranksep);
        this.graphvizModel.delete(ts_graphviz_1.attribute.pack);
        this.graphvizModel.delete(ts_graphviz_1.attribute.pad);
        this.graphvizModel.delete(ts_graphviz_1.attribute.packmode);
        this.graphvizModel.attributes.graph.delete(ts_graphviz_1.attribute.margin);
        return this;
    };
    return DotPrinter;
}());
exports.DotPrinter = DotPrinter;
