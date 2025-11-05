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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcSequenceLayout = calcSequenceLayout;
var types_1 = require("@likec4/core/types");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var const_1 = require("./const");
var layouter_1 = require("./layouter");
var utils_2 = require("./utils");
function calcSequenceLayout(view) {
    var _a;
    var actorNodes = new Set();
    var getNode = function (id) { return (0, utils_1.nonNullable)(view.nodes.find(function (n) { return n.id === id; })); };
    // Step 1 - prepare steps and actors
    var preparedSteps = [];
    for (var _i = 0, _b = view.edges.filter(function (e) { return (0, types_1.isStepEdgeId)(e.id); }); _i < _b.length; _i++) {
        var edge = _b[_i];
        var source = getNode(edge.source);
        var target = getNode(edge.target);
        if (source.children.length || target.children.length) {
            console.error('Sequence view does not support nested actors');
            continue;
        }
        actorNodes.add(source);
        actorNodes.add(target);
        preparedSteps.push({ edge: edge, source: source, target: target });
    }
    // Keep initial order of actors
    var actors = view.nodes.filter(function (n) { return actorNodes.has(n); });
    (0, utils_1.invariant)((0, remeda_1.hasAtLeast)(actors, 1), 'actors array must not be empty');
    var actorPorts = new utils_1.DefaultMap(function () { return []; });
    var steps = [];
    var row = 0;
    for (var _c = 0, preparedSteps_1 = preparedSteps; _c < preparedSteps_1.length; _c++) {
        var _d = preparedSteps_1[_c], edge = _d.edge, source = _d.source, target = _d.target;
        var prevStep = steps.at(-1);
        var sourceColumn = actors.indexOf(source);
        var targetColumn = actors.indexOf(target);
        var isSelfLoop = source === target;
        var isBack = sourceColumn > targetColumn;
        var parallelPrefix = (0, types_1.getParallelStepsPrefix)(edge.id);
        var isContinuing = false;
        if (prevStep && prevStep.target == source && prevStep.parallelPrefix === parallelPrefix) {
            isContinuing = prevStep.isSelfLoop !== isSelfLoop || prevStep.isBack === isBack;
        }
        if (!isContinuing) {
            row++;
        }
        var step = {
            id: edge.id,
            from: {
                column: sourceColumn,
                row: row,
            },
            to: {
                column: targetColumn,
                row: isSelfLoop ? ++row : row,
            },
            edge: edge,
            isSelfLoop: isSelfLoop,
            isBack: isBack,
            parallelPrefix: parallelPrefix,
            offset: isContinuing ? ((_a = prevStep === null || prevStep === void 0 ? void 0 : prevStep.offset) !== null && _a !== void 0 ? _a : 0) + const_1.CONTINUOUS_OFFSET : 0,
            source: source,
            target: target,
            label: edge.labelBBox
                ? {
                    height: edge.labelBBox.height + 8 + (edge.navigateTo ? 20 : 0),
                    width: edge.labelBBox.width + 16,
                    text: edge.label,
                }
                : null,
        };
        steps.push(step);
        actorPorts.get(source).push({ step: step, row: row, type: 'source', position: isBack && !isSelfLoop ? 'left' : 'right' });
        actorPorts.get(target).push({ step: step, row: row, type: 'target', position: isBack || isSelfLoop ? 'right' : 'left' });
    }
    var layout = new layouter_1.SequenceViewLayouter({
        actors: actors,
        steps: steps,
        compounds: (0, utils_2.buildCompounds)(actors, view.nodes),
    });
    var bounds = layout.getViewBounds();
    var compounds = (0, remeda_1.pipe)(layout.getCompoundBoxes(), (0, remeda_1.map)(function (_a) {
        var node = _a.node, box = __rest(_a, ["node"]);
        return (__assign(__assign({}, box), { id: node.id, origin: node.id }));
    }), (0, remeda_1.groupByProp)('id'), (0, remeda_1.mapValues)(function (boxes, id) {
        if ((0, remeda_1.hasAtLeast)(boxes, 2)) {
            return (0, remeda_1.map)(boxes, function (box, i) { return (__assign(__assign({}, box), { id: "".concat(id, "-").concat(i + 1) })); });
        }
        return boxes;
    }), (0, remeda_1.values)(), (0, remeda_1.flat)());
    return {
        actors: actors.map(function (actor) { return toSeqActor({ actor: actor, ports: actorPorts.get(actor), layout: layout }); }),
        compounds: compounds,
        steps: (0, remeda_1.map)(steps, function (s) { return (__assign({ id: s.id, sourceHandle: s.id + '_source', targetHandle: s.id + '_target' }, s.label && ({
            labelBBox: {
                width: s.label.width,
                height: s.label.height,
            },
        }))); }),
        parallelAreas: layout.getParallelBoxes(),
        bounds: bounds,
    };
}
function toSeqActor(_a) {
    var actor = _a.actor, ports = _a.ports, layout = _a.layout;
    var _b = layout.getActorBox(actor), x = _b.x, y = _b.y, width = _b.width, height = _b.height;
    return {
        id: actor.id,
        x: x,
        y: y,
        width: width,
        height: height,
        ports: ports.map(function (p) {
            var bbox = layout.getPortCenter(p.step, p.type);
            return ({
                id: "".concat(p.step.id, "_").concat(p.type),
                cx: bbox.cx - x,
                cy: bbox.cy - y,
                height: bbox.height,
                type: p.type,
                position: p.position,
            });
        }),
    };
}
