"use strict";
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
var builder_1 = require("@likec4/core/builder");
var vitest_1 = require("vitest");
var DeploymentViewPrinter_1 = require("./DeploymentViewPrinter");
(0, vitest_1.describe)('DeploymentViewPrinter', function () {
    var model = builder_1.Builder
        .specification({
        elements: {
            el: {},
        },
        deployments: {
            node: {},
        },
    })
        .model(function (_a, _) {
        var el = _a.el, rel = _a.rel;
        return _(el('client'), el('cloud'), el('cloud.ui'), el('cloud.backend'), el('cloud.backend.api'), el('cloud.db'), rel('client', 'cloud.ui', {
            title: 'uses',
        }), rel('cloud.ui', 'cloud.backend.api', {
            title: 'fetches',
            technology: 'REST',
        }), rel('cloud.backend.api', 'cloud.db', {
            title: 'very very very long title that should be wrapped to multiple lines',
        }));
    })
        .deployment(function (_a, _) {
        var node = _a.node, instanceOf = _a.instanceOf;
        return _(node('client').with(instanceOf('client')), node('z1'), node('z1.s1').with(instanceOf('cloud.ui'), instanceOf('cloud.backend.api')), node('z1.s2').with(instanceOf('cloud.ui'), instanceOf('cloud.backend.api')), instanceOf('z1.db', 'cloud.db'));
    })
        .views(function (_a, _) {
        var deploymentView = _a.deploymentView, $include = _a.$include;
        return _(deploymentView('index').with($include('*'), $include('z1.**')));
    })
        .toLikeC4Model();
    (0, vitest_1.it)('print deployment view', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var computedIndexView, dot;
        var expect = _b.expect;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    computedIndexView = model.view('index').$view;
                    dot = new DeploymentViewPrinter_1.DeploymentViewPrinter(computedIndexView, model.$styles).print();
                    return [4 /*yield*/, expect(dot).toMatchFileSnapshot('__snapshots__/DeploymentViewPrinter-index.dot')];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
