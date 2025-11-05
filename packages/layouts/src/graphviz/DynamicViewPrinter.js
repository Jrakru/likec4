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
exports.DynamicViewPrinter = void 0;
var core_1 = require("@likec4/core");
var remeda_1 = require("remeda");
var ts_graphviz_1 = require("ts-graphviz");
var dot_labels_1 = require("./dot-labels");
var DotPrinter_1 = require("./DotPrinter");
var utils_1 = require("./utils");
var DynamicViewPrinter = /** @class */ (function (_super) {
    __extends(DynamicViewPrinter, _super);
    function DynamicViewPrinter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DynamicViewPrinter.prototype.postBuild = function (G) {
        G.delete(ts_graphviz_1.attribute.TBbalance);
    };
    DynamicViewPrinter.prototype.addEdge = function (edge, G) {
        var _a, _b, _c, _d, _e, _f, _g;
        var _h, _j, _k, _l, _m;
        var viewNodes = this.view.nodes;
        var _o = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target], sourceFqn = _o[0], targetFqn = _o[1];
        var _p = this.edgeEndpoint(sourceFqn, function (nodes) { return (0, remeda_1.last)(nodes); }), _sourceNode = _p[0], source = _p[1], ltail = _p[2];
        var _q = this.edgeEndpoint(targetFqn, remeda_1.first), _targetNode = _q[0], target = _q[1], lhead = _q[2];
        var e = G.edge([source, target], (_a = {},
            _a[ts_graphviz_1.attribute.likec4_id] = edge.id,
            _a[ts_graphviz_1.attribute.style] = (_h = edge.line) !== null && _h !== void 0 ? _h : DotPrinter_1.DefaultEdgeStyle,
            _a));
        lhead && e.attributes.set(ts_graphviz_1.attribute.lhead, lhead);
        ltail && e.attributes.set(ts_graphviz_1.attribute.ltail, ltail);
        if (edge.color && edge.color !== this.$defaults.relationship.color) {
            var colorValues = this.styles.colors(edge.color).relationships;
            e.attributes.apply((_b = {},
                _b[ts_graphviz_1.attribute.color] = colorValues.line,
                _b[ts_graphviz_1.attribute.fontcolor] = colorValues.label,
                _b));
        }
        var labelText = [
            (_j = edge.label) === null || _j === void 0 ? void 0 : _j.trim(),
            (_k = edge.technology) === null || _k === void 0 ? void 0 : _k.trim(),
        ].filter(remeda_1.isTruthy).join('\n');
        var step = (0, core_1.extractStep)(edge.id);
        var label = (0, dot_labels_1.stepEdgeLabel)(step, labelText);
        e.attributes.set(ts_graphviz_1.attribute.label, label);
        // IF we already have "seen" the target node in previous steps
        // We don't want constraints to be applied
        var sourceIdx = viewNodes.findIndex(function (n) { return n.id === sourceFqn; });
        var targetIdx = viewNodes.findIndex(function (n) { return n.id === targetFqn; });
        if (targetIdx < sourceIdx && edge.dir !== 'back') {
            e.attributes.apply((_c = {},
                _c[ts_graphviz_1.attribute.minlen] = 0,
                _c));
        }
        var _r = [(_l = edge.head) !== null && _l !== void 0 ? _l : this.$defaults.relationship.arrow, (_m = edge.tail) !== null && _m !== void 0 ? _m : 'none'], head = _r[0], tail = _r[1];
        if (edge.dir === 'back') {
            e.attributes.apply((_d = {},
                _d[ts_graphviz_1.attribute.arrowtail] = (0, utils_1.toArrowType)(head),
                _d[ts_graphviz_1.attribute.dir] = 'back',
                _d));
            if (tail !== 'none') {
                e.attributes.apply((_e = {},
                    _e[ts_graphviz_1.attribute.arrowhead] = (0, utils_1.toArrowType)(tail),
                    _e[ts_graphviz_1.attribute.minlen] = 0,
                    _e));
            }
            return e;
        }
        if ((head === 'none' && tail === 'none') || (head !== 'none' && tail !== 'none')) {
            e.attributes.apply((_f = {},
                _f[ts_graphviz_1.attribute.arrowhead] = (0, utils_1.toArrowType)(head),
                _f[ts_graphviz_1.attribute.arrowtail] = (0, utils_1.toArrowType)(tail),
                _f[ts_graphviz_1.attribute.dir] = 'both',
                _f));
            return e;
        }
        if (head === 'none') {
            e.attributes.delete(ts_graphviz_1.attribute.arrowhead);
            e.attributes.apply((_g = {},
                _g[ts_graphviz_1.attribute.arrowtail] = (0, utils_1.toArrowType)(tail),
                _g[ts_graphviz_1.attribute.minlen] = 0,
                _g[ts_graphviz_1.attribute.dir] = 'back',
                _g));
            return e;
        }
        e.attributes.set(ts_graphviz_1.attribute.arrowhead, (0, utils_1.toArrowType)(head));
        return e;
    };
    return DynamicViewPrinter;
}(DotPrinter_1.DotPrinter));
exports.DynamicViewPrinter = DynamicViewPrinter;
