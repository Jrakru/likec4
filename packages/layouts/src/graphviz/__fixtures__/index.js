"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.issue577_valid = exports.issue577_fail = exports.computedAmazonView = exports.computedCloud3levels = exports.computedCloudView = exports.computedIndexView = exports.computeElementView = exports.parsedModel = void 0;
var compute_view_1 = require("@likec4/core/compute-view");
var model_1 = require("@likec4/core/model");
var remeda_1 = require("remeda");
var model_2 = require("./model");
exports.parsedModel = model_1.LikeC4Model.fromDump(model_2.FakeModel);
var computeElementView = function (view) {
    var result = (0, compute_view_1.computeView)(view, exports.parsedModel);
    if (!result.isSuccess) {
        throw result.error;
    }
    return (0, remeda_1.omit)((0, compute_view_1.withReadableEdges)(result.view), ['nodeIds', 'edgeIds']);
};
exports.computeElementView = computeElementView;
exports.computedIndexView = (_a = [
    (0, exports.computeElementView)(model_2.indexView),
    (0, exports.computeElementView)(model_2.cloudView),
    (0, exports.computeElementView)(model_2.cloud3levels),
    (0, exports.computeElementView)(model_2.amazonView),
], _a[0]), exports.computedCloudView = _a[1], exports.computedCloud3levels = _a[2], exports.computedAmazonView = _a[3];
exports.issue577_fail = (0, exports.computeElementView)((0, model_2.issue577View)('https://icons/aws%20&%20CloudFront.svg'));
exports.issue577_valid = (0, exports.computeElementView)((0, model_2.issue577View)('https://icons/aws%20%20CloudFront.svg'));
