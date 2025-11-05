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
exports.GraphvizBinaryAdapter = void 0;
var utils_1 = require("@likec4/core/utils");
var log_1 = require("@likec4/log");
var nano_spawn_1 = require("nano-spawn");
var node_os_1 = require("node:os");
var remeda_1 = require("remeda");
var which_1 = require("which");
var logger = log_1.rootLogger.getChild('graphviz-binary');
var GraphvizBinaryAdapter = /** @class */ (function () {
    function GraphvizBinaryAdapter(
    /**
     * Path to the binary, e.g. 'dot' or '/usr/bin/dot'
     * If not provided, will be found using `which`.
     */
    dot_path, 
    /**
     * Path to the binary, e.g. 'unflatten' or '/usr/bin/unflatten'
     * If not provided, will be found using `which`.
     */
    unflatten_path) {
        this._dotpath = dot_path;
        this._unflattenpath = unflatten_path;
    }
    GraphvizBinaryAdapter.prototype.dispose = function () {
        // do nothing for now
    };
    GraphvizBinaryAdapter.prototype[Symbol.dispose] = function () {
        // do nothing for now
    };
    Object.defineProperty(GraphvizBinaryAdapter.prototype, "concurrency", {
        get: function () {
            return Math.max(1, node_os_1.default.cpus().length - 2);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GraphvizBinaryAdapter.prototype, "dotpath", {
        get: function () {
            var _a;
            return (_a = this._dotpath) !== null && _a !== void 0 ? _a : (0, utils_1.memoizeProp)(this, '_dotpath', function () {
                var path = which_1.default.sync('dot');
                logger.debug(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Found ", ""], ["Found ", ""])), path);
                return path;
            });
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(GraphvizBinaryAdapter.prototype, "unflattenpath", {
        get: function () {
            var _a;
            return (_a = this._unflattenpath) !== null && _a !== void 0 ? _a : (0, utils_1.memoizeProp)(this, '_unflattenpath', function () {
                var path = which_1.default.sync('unflatten');
                logger.debug(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Found ", ""], ["Found ", ""])), path);
                return path;
            });
        },
        enumerable: false,
        configurable: true
    });
    GraphvizBinaryAdapter.prototype.unflatten = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var result, unflatten, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, nano_spawn_1.default)(this.unflattenpath, ['-l 1', '-c 3'], {
                                timeout: 10000,
                                stdin: {
                                    string: dot,
                                },
                            })];
                    case 1:
                        unflatten = _a.sent();
                        result = unflatten.stdout;
                        if (!(0, remeda_1.isEmpty)(unflatten.stderr)) {
                            logger.warn("Command ".concat(unflatten.command, " has stderr:\n") + unflatten.stderr);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger.error("FAILED GraphvizBinaryAdapter.unflatten", { error: error_1 });
                        if (error_1 instanceof nano_spawn_1.SubprocessError && !(0, remeda_1.isEmpty)(error_1.stdout)) {
                            logger.warn("Command: '".concat(error_1.command, "' returned result but also failed (exitcode ").concat(error_1.exitCode, "):\n") + error_1.stderr);
                            result = error_1.stdout;
                        }
                        return [3 /*break*/, 3];
                    case 3:
                        if (result) {
                            dot = result.replaceAll(/\t\[/g, ' [').replaceAll(/\t/g, '    ');
                        }
                        return [2 /*return*/, dot];
                }
            });
        });
    };
    GraphvizBinaryAdapter.prototype.layoutJson = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var result, dotcmd, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, nano_spawn_1.default)(this.dotpath, ['-Tjson', '-y'], {
                                timeout: 10000,
                                stdin: {
                                    string: dot,
                                },
                            })];
                    case 1:
                        dotcmd = _a.sent();
                        result = dotcmd.stdout;
                        if (!(0, remeda_1.isEmpty)(dotcmd.stderr)) {
                            logger.warn("Command ".concat(dotcmd.command, " has stderr:\n") + dotcmd.stderr);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        logger.error("FAILED GraphvizBinaryAdapter.layoutJson", { error: error_2 });
                        logger.warn('FAILED DOT:\n' + dot);
                        if (error_2 instanceof nano_spawn_1.SubprocessError && !(0, remeda_1.isEmpty)(error_2.stdout)) {
                            logger.warn("Command: '".concat(error_2.command, "' returned result but also failed (exitcode ").concat(error_2.exitCode, "): \"").concat(error_2.stderr, "\""));
                            result = error_2.stdout;
                        }
                        else {
                            throw error_2;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, result];
                }
            });
        });
    };
    GraphvizBinaryAdapter.prototype.acyclic = function (_dot) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.reject(new Error('Method not implemented.'))];
            });
        });
    };
    GraphvizBinaryAdapter.prototype.svg = function (dot) {
        return __awaiter(this, void 0, void 0, function () {
            var result, dotcmd, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, nano_spawn_1.default)(this.dotpath, ['-Tsvg', '-y'], {
                                timeout: 10000,
                                stdin: {
                                    string: dot,
                                },
                            })];
                    case 1:
                        dotcmd = _a.sent();
                        result = dotcmd.stdout;
                        if (!(0, remeda_1.isEmpty)(dotcmd.stderr)) {
                            logger.warn("Command ".concat(dotcmd.command, " has stderr:\n") + dotcmd.stderr);
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        logger.error("FAILED GraphvizBinaryAdapter.svg", { error: error_3 });
                        logger.warn('FAILED DOT:\n' + dot);
                        if (error_3 instanceof nano_spawn_1.SubprocessError && !(0, remeda_1.isEmpty)(error_3.stdout)) {
                            logger.warn("Command: '".concat(error_3.command, "' returned result but also failed (exitcode ").concat(error_3.exitCode, "):\n") + error_3.stderr);
                            result = error_3.stdout;
                        }
                        else {
                            throw error_3;
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/, result];
                }
            });
        });
    };
    return GraphvizBinaryAdapter;
}());
exports.GraphvizBinaryAdapter = GraphvizBinaryAdapter;
var templateObject_1, templateObject_2;
