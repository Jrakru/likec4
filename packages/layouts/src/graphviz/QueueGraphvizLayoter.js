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
exports.QueueGraphvizLayoter = void 0;
var utils_1 = require("@likec4/core/utils");
var log_1 = require("@likec4/log");
var p_queue_1 = require("p-queue");
var GraphvizLayoter_1 = require("./GraphvizLayoter");
var logger = log_1.rootLogger.getChild(['layouter', 'queue']);
var QueueGraphvizLayoter = /** @class */ (function (_super) {
    __extends(QueueGraphvizLayoter, _super);
    function QueueGraphvizLayoter(options) {
        var _a, _b, _c;
        var _this = _super.call(this, options === null || options === void 0 ? void 0 : options.graphviz) || this;
        _this.isProcessingBatch = false;
        _this.queue = new p_queue_1.default({
            concurrency: (_a = options === null || options === void 0 ? void 0 : options.concurrency) !== null && _a !== void 0 ? _a : _this.graphvizPort.concurrency,
            timeout: (_b = options === null || options === void 0 ? void 0 : options.timeout) !== null && _b !== void 0 ? _b : 20000,
            throwOnTimeout: (_c = options === null || options === void 0 ? void 0 : options.throwOnTimeout) !== null && _c !== void 0 ? _c : true,
        });
        return _this;
    }
    QueueGraphvizLayoter.prototype.runInQueue = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isProcessingBatch) return [3 /*break*/, 4];
                        logger.debug(templateObject_1 || (templateObject_1 = __makeTemplateObject(["waiting for batch to finish"], ["waiting for batch to finish"])));
                        return [4 /*yield*/, this.queue.onIdle()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, (0, utils_1.promiseNextTick)()
                            // recursively call runInQueue (to prevent batches from running in parallel)
                        ];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.runInQueue(fn)];
                    case 3: 
                    // recursively call runInQueue (to prevent batches from running in parallel)
                    return [2 /*return*/, _a.sent()];
                    case 4:
                        if (!(this.queue.size > this.queue.concurrency * 2 + 1)) return [3 /*break*/, 6];
                        logger
                            .debug(templateObject_2 || (templateObject_2 = __makeTemplateObject(["task limit reached: ", " (pending: ", "), waiting queue to shrink to ", ""], ["task limit reached: ", " (pending: ", "), waiting queue to shrink to ", ""])), this.queue.size, this.queue.pending, this.queue.concurrency);
                        return [4 /*yield*/, this.queue.onSizeLessThan(this.queue.concurrency + 1)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        logger.debug(templateObject_3 || (templateObject_3 = __makeTemplateObject(["add task to queue"], ["add task to queue"])));
                        return [4 /*yield*/, this.queue.add(fn)];
                    case 7: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QueueGraphvizLayoter.prototype.changePort = function (graphvizPort) {
        _super.prototype.changePort.call(this, graphvizPort);
        if (this.queue.concurrency !== graphvizPort.concurrency) {
            this.queue.concurrency = this.graphvizPort.concurrency;
            logger.debug(templateObject_4 || (templateObject_4 = __makeTemplateObject(["set queue concurrency to ", ""], ["set queue concurrency to ", ""])), this.graphvizPort.concurrency);
        }
    };
    QueueGraphvizLayoter.prototype.layout = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.runInQueue(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, _super.prototype.layout.call(this, params)];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); })];
                    case 1:
                        result = _a.sent();
                        if (!result) {
                            throw new Error("QueueGraphvizLayoter: layout failed");
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    QueueGraphvizLayoter.prototype.batchLayout = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var concurrency, results, _loop_1, this_1, _i, _a, task;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.isProcessingBatch) return [3 /*break*/, 4];
                        logger.debug(templateObject_5 || (templateObject_5 = __makeTemplateObject(["wait for previous layouts to finish"], ["wait for previous layouts to finish"
                            // wait for any previous layout to finish
                        ])));
                        // wait for any previous layout to finish
                        return [4 /*yield*/, this.queue.onIdle()];
                    case 1:
                        // wait for any previous layout to finish
                        _b.sent();
                        return [4 /*yield*/, (0, utils_1.promiseNextTick)()
                            // recursively call batchLayout (to prevent batches from running in parallel)
                        ];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.batchLayout(params)];
                    case 3: 
                    // recursively call batchLayout (to prevent batches from running in parallel)
                    return [2 /*return*/, _b.sent()];
                    case 4:
                        concurrency = this.queue.concurrency;
                        logger.debug(templateObject_6 || (templateObject_6 = __makeTemplateObject(["starting batch layout, size: ", ", concurrency: ", ""], ["starting batch layout, size: ", ", concurrency: ", ""])), params.batch.length, concurrency);
                        this.isProcessingBatch = true;
                        results = [];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, , 10, 12]);
                        _loop_1 = function (task) {
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        logger.debug(templateObject_7 || (templateObject_7 = __makeTemplateObject(["add task for view ", ""], ["add task for view ", ""])), task.view.id);
                                        this_1.queue
                                            .add(function () { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        if (!(concurrency <= 2)) return [3 /*break*/, 2];
                                                        return [4 /*yield*/, (0, utils_1.promiseNextTick)()];
                                                    case 1:
                                                        _a.sent();
                                                        _a.label = 2;
                                                    case 2: return [4 /*yield*/, _super.prototype.layout.call(this, task)];
                                                    case 3: return [2 /*return*/, _a.sent()];
                                                }
                                            });
                                        }); })
                                            .then(function (result) {
                                            var _a, _b;
                                            if (!result) {
                                                (_a = params.onError) === null || _a === void 0 ? void 0 : _a.call(params, task, new Error("Layout queue returned null for view ".concat(task.view.id)));
                                                return;
                                            }
                                            results.push(result);
                                            (_b = params.onSuccess) === null || _b === void 0 ? void 0 : _b.call(params, task, result);
                                        })
                                            .catch(function (err) {
                                            var _a;
                                            logger.error("Fail layout view ".concat(task.view.id), { err: err });
                                            (_a = params.onError) === null || _a === void 0 ? void 0 : _a.call(params, task, err);
                                        });
                                        if (!(this_1.queue.size > concurrency + 2)) return [3 /*break*/, 2];
                                        logger
                                            .debug(templateObject_8 || (templateObject_8 = __makeTemplateObject(["task limit reached: ", ", waiting queue to shrink to ", ""], ["task limit reached: ", ", waiting queue to shrink to ", ""])), this_1.queue.size, concurrency);
                                        return [4 /*yield*/, this_1.queue.onSizeLessThan(concurrency + 1)];
                                    case 1:
                                        _c.sent();
                                        _c.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = params.batch;
                        _b.label = 6;
                    case 6:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        task = _a[_i];
                        return [5 /*yield**/, _loop_1(task)];
                    case 7:
                        _b.sent();
                        _b.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 12];
                    case 10: return [4 /*yield*/, this.queue.onIdle()];
                    case 11:
                        _b.sent();
                        logger.debug(templateObject_9 || (templateObject_9 = __makeTemplateObject(["batch layout done"], ["batch layout done"])));
                        this.isProcessingBatch = false;
                        return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, results];
                }
            });
        });
    };
    // TODO: deadlocks
    // override async svg<A extends AnyAux>(params: Params<A>) {
    //   return await this.runInQueue('svg', async () => {
    //     return await super.svg(params)
    //   })
    // }
    // override async dot<A extends AnyAux>(params: Params<A>): Promise<DotSource> {
    //   return await this.runInQueue('dot', async () => {
    //     return await super.dot(params)
    //   })
    // }
    QueueGraphvizLayoter.prototype.dispose = function () {
        this.queue.clear();
        _super.prototype.dispose.call(this);
    };
    return QueueGraphvizLayoter;
}(GraphvizLayoter_1.GraphvizLayouter));
exports.QueueGraphvizLayoter = QueueGraphvizLayoter;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
