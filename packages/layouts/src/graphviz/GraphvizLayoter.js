"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphvizLayouter = void 0;
var core_1 = require("@likec4/core");
var utils_1 = require("@likec4/core/utils");
var log_1 = require("@likec4/log");
var applyManualLayout_1 = require("../manual/applyManualLayout");
var sequence_1 = require("../sequence");
var DeploymentViewPrinter_1 = require("./DeploymentViewPrinter");
var DynamicViewPrinter_1 = require("./DynamicViewPrinter");
var ElementViewPrinter_1 = require("./ElementViewPrinter");
var GraphvizParser_1 = require("./GraphvizParser");
var GraphvizWasmAdapter_1 = require("./wasm/GraphvizWasmAdapter");
var getPrinter = function (_a) {
    var view = _a.view, styles = _a.styles;
    switch (true) {
        case (0, core_1.isDynamicView)(view):
            return new DynamicViewPrinter_1.DynamicViewPrinter(view, styles);
        case (0, core_1.isDeploymentView)(view):
            return new DeploymentViewPrinter_1.DeploymentViewPrinter(view, styles);
        case (0, core_1.isElementView)(view):
            return new ElementViewPrinter_1.ElementViewPrinter(view, styles);
        default:
            (0, utils_1.nonexhaustive)(view);
    }
};
var logger = log_1.rootLogger.getChild(['layouter']);
var GraphvizLayouter = /** @class */ (function () {
    function GraphvizLayouter(graphviz) {
        this.graphviz = graphviz !== null && graphviz !== void 0 ? graphviz : new GraphvizWasmAdapter_1.GraphvizWasmAdapter();
    }
    GraphvizLayouter.prototype.dispose = function () {
        this.graphviz.dispose();
    };
    GraphvizLayouter.prototype[Symbol.dispose] = function () {
        this.dispose();
    };
    Object.defineProperty(GraphvizLayouter.prototype, "graphvizPort", {
        get: function () {
            return this.graphviz;
        },
        enumerable: false,
        configurable: true
    });
    GraphvizLayouter.prototype.changePort = function (graphviz) {
        this.graphviz.dispose();
        this.graphviz = graphviz;
    };
    GraphvizLayouter.prototype.dotToJson = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var json, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.graphviz.layoutJson(dot)];
                    case 1:
                        json = _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error((0, log_1.loggable)(error_1));
                        logger.error(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Failed to convert DOT to JSON:\n", ""], ["Failed to convert DOT to JSON:\\n", ""])), dot);
                        throw error_1;
                    case 3:
                        try {
                            return [2 /*return*/, JSON.parse(json)];
                        }
                        catch (error) {
                            logger.error((0, log_1.loggable)(error));
                            logger.error(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Failed to parse JSON:\n", "\n. Generated from DOT:\n", ""], ["Failed to parse JSON:\\n", "\\n. Generated from DOT:\\n", ""])), json, dot);
                            throw error;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GraphvizLayouter.prototype.layout = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dot, view, json, diagram, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        logger.debug(templateObject_3 || (templateObject_3 = __makeTemplateObject(["layouting view ", "..."], ["layouting view ", "..."])), params.view.id);
                        return [4 /*yield*/, this.dot(params)];
                    case 1:
                        dot = _a.sent();
                        view = params.view;
                        return [4 /*yield*/, this.dotToJson(dot)];
                    case 2:
                        json = _a.sent();
                        diagram = (0, GraphvizParser_1.parseGraphvizJson)(json, view);
                        if (view.manualLayout) {
                            diagram = (0, applyManualLayout_1.applyManualLayout)(diagram, view.manualLayout);
                        }
                        if ((0, core_1.isDynamicView)(diagram)) {
                            ;
                            diagram.sequenceLayout = (0, sequence_1.calcSequenceLayout)(diagram);
                        }
                        dot = dot
                            .split('\n')
                            .filter(function (l) { return !(l.includes('margin') && l.includes('50.1')); }) // see DotPrinter.ts#L175
                            .join('\n');
                        logger.debug(templateObject_4 || (templateObject_4 = __makeTemplateObject(["layouting view ", " done"], ["layouting view ", " done"])), params.view.id);
                        return [2 /*return*/, { dot: dot, diagram: diagram }];
                    case 3:
                        e_1 = _a.sent();
                        throw new Error("Error during layout: ".concat(params.view.id), { cause: e_1 });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    GraphvizLayouter.prototype.svg = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var dot, svg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dot(params)];
                    case 1:
                        dot = _a.sent();
                        dot = dot
                            .split('\n')
                            .filter(function (l) { return !(l.includes('margin') && l.includes('50.1')); }) // see DotPrinter.ts#L175
                            .join('\n');
                        return [4 /*yield*/, this.graphviz.svg(dot)];
                    case 2:
                        svg = _a.sent();
                        return [2 /*return*/, {
                                svg: svg,
                                dot: dot,
                            }];
                }
            });
        });
    };
    GraphvizLayouter.prototype.dot = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var printer, dot, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        printer = getPrinter(params);
                        dot = printer.print();
                        if (!(0, core_1.isElementView)(params.view)) {
                            return [2 /*return*/, dot];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.graphviz.unflatten(dot)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_2 = _a.sent();
                        logger.warn("Error during unflatten: ".concat(params.view.id), { error: error_2 });
                        return [2 /*return*/, dot];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GraphvizLayouter;
}());
exports.GraphvizLayouter = GraphvizLayouter;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
