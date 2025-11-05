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
exports.GraphvizWasmAdapter = void 0;
var wasm_graphviz_1 = require("@hpcc-js/wasm-graphviz");
var utils_1 = require("@likec4/core/utils");
var log_1 = require("@likec4/log");
var p_limit_1 = require("p-limit");
// limit to 1 concurrency to avoid wasm loading issues
var limit = (0, p_limit_1.default)(1);
var logger = log_1.rootLogger.getChild('graphviz-wasm');
var GraphvizWasmAdapter = /** @class */ (function () {
    function GraphvizWasmAdapter() {
    }
    Object.defineProperty(GraphvizWasmAdapter.prototype, "concurrency", {
        get: function () {
            return 1;
        },
        enumerable: false,
        configurable: true
    });
    GraphvizWasmAdapter.prototype.dispose = function () {
        wasm_graphviz_1.Graphviz.unload();
        GraphvizWasmAdapter._graphviz = null;
    };
    GraphvizWasmAdapter.prototype[Symbol.dispose] = function () {
        this.dispose();
    };
    GraphvizWasmAdapter.prototype.graphviz = function () {
        var _this = this;
        return Promise.resolve().then(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!GraphvizWasmAdapter._graphviz) {
                            logger.debug(templateObject_1 || (templateObject_1 = __makeTemplateObject(["loading wasm"], ["loading wasm"])));
                            GraphvizWasmAdapter.opsCount = 0;
                            GraphvizWasmAdapter._graphviz = wasm_graphviz_1.Graphviz.load();
                        }
                        return [4 /*yield*/, GraphvizWasmAdapter._graphviz];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        }); });
    };
    GraphvizWasmAdapter.prototype.attempt = function (logMessage, dot, fn) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, limit(function () { return __awaiter(_this, void 0, void 0, function () {
                            var result, error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, fn()];
                                    case 1:
                                        result = _a.sent();
                                        if (++GraphvizWasmAdapter.opsCount >= 10) {
                                            logger.debug(templateObject_2 || (templateObject_2 = __makeTemplateObject(["unloading wasm"], ["unloading wasm"])));
                                            wasm_graphviz_1.Graphviz.unload();
                                            GraphvizWasmAdapter._graphviz = null;
                                        }
                                        return [2 /*return*/, result];
                                    case 2:
                                        error_1 = _a.sent();
                                        logger.error("FAILED GraphvizWasm. ".concat(logMessage), { error: error_1 });
                                        logger.error('FAILED DOT:\n' + dot);
                                        wasm_graphviz_1.Graphviz.unload();
                                        GraphvizWasmAdapter._graphviz = null;
                                        return [3 /*break*/, 3];
                                    case 3:
                                        logger.warn('Retrying...');
                                        return [4 /*yield*/, (0, utils_1.delay)(10, 500)];
                                    case 4:
                                        _a.sent();
                                        _a.label = 5;
                                    case 5:
                                        _a.trys.push([5, , 7, 8]);
                                        return [4 /*yield*/, fn()];
                                    case 6: return [2 /*return*/, _a.sent()];
                                    case 7:
                                        wasm_graphviz_1.Graphviz.unload();
                                        GraphvizWasmAdapter._graphviz = null;
                                        return [7 /*endfinally*/];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GraphvizWasmAdapter.prototype.unflatten = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.attempt("unflatten", dot, function () { return __awaiter(_this, void 0, void 0, function () {
                            var graphviz, unflattened;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.graphviz()];
                                    case 1:
                                        graphviz = _a.sent();
                                        unflattened = graphviz.unflatten(dot, 1, false, 3);
                                        return [2 /*return*/, unflattened.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ')];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GraphvizWasmAdapter.prototype.acyclic = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.attempt("acyclic", dot, function () { return __awaiter(_this, void 0, void 0, function () {
                            var graphviz, res;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.graphviz()];
                                    case 1:
                                        graphviz = _a.sent();
                                        res = graphviz.acyclic(dot, true);
                                        return [2 /*return*/, res.acyclic ? (res.outFile || dot) : dot];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GraphvizWasmAdapter.prototype.layoutJson = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.attempt("layout", dot, function () { return __awaiter(_this, void 0, void 0, function () {
                            var graphviz;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.graphviz()];
                                    case 1:
                                        graphviz = _a.sent();
                                        return [2 /*return*/, graphviz.layout(dot, 'json', undefined, {
                                                yInvert: true,
                                            })];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GraphvizWasmAdapter.prototype.svg = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.attempt("svg", dot, function () { return __awaiter(_this, void 0, void 0, function () {
                            var graphviz;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, this.graphviz()];
                                    case 1:
                                        graphviz = _a.sent();
                                        return [2 /*return*/, graphviz.layout(dot, 'svg')];
                                }
                            });
                        }); })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    GraphvizWasmAdapter._graphviz = null;
    /**
     * Workaround for graphviz wasm memory issues
     * After each N operations unload the wasm and reload it
     */
    GraphvizWasmAdapter.opsCount = 0;
    return GraphvizWasmAdapter;
}());
exports.GraphvizWasmAdapter = GraphvizWasmAdapter;
var templateObject_1, templateObject_2;
