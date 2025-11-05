"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDGE_LABEL_MAX_LINES = exports.EDGE_LABEL_MAX_CHARS = void 0;
exports.sanitize = sanitize;
exports.wrap = wrap;
exports.nodeIcon = nodeIcon;
exports.nodeLabel = nodeLabel;
exports.compoundLabel = compoundLabel;
exports.edgelabel = edgelabel;
exports.stepEdgeLabel = stepEdgeLabel;
var core_1 = require("@likec4/core");
var utils_1 = require("@likec4/core/utils");
var remeda_1 = require("remeda");
var word_wrap_1 = require("word-wrap");
var utils_2 = require("./utils");
function sanitize(text) {
    return text.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function wrap(text, _a) {
    var maxchars = _a.maxchars, maxLines = _a.maxLines, _b = _a.sanitize, escape = _b === void 0 ? (0, remeda_1.identity)() : _b;
    var lines = (0, word_wrap_1.default)(text, {
        width: maxchars,
        indent: '',
        escape: escape,
    }).split('\n');
    if ((0, remeda_1.isDefined)(maxLines) && maxLines > 0 && lines.length > maxLines) {
        lines = lines.slice(0, maxLines);
    }
    return lines;
}
function wrapWithFont(_a) {
    var text = _a.text, maxchars = _a.maxchars, fontsize = _a.fontsize, maxLines = _a.maxLines, bold = _a.bold, color = _a.color;
    var html = wrap(text, { maxchars: maxchars, maxLines: maxLines, sanitize: sanitize }).join('<BR/>');
    if (bold) {
        html = "<B>".concat(html, "</B>");
    }
    var Color = color ? " COLOR=\"".concat(color, "\"") : "";
    return "<FONT POINT-SIZE=\"".concat((0, utils_2.pxToPoints)(fontsize), "\"").concat(Color, ">").concat(html, "</FONT>");
}
/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
function nodeIcon() {
    return "<TABLE FIXEDSIZE=\"TRUE\" BGCOLOR=\"#112233\" WIDTH=\"".concat(utils_2.IconSizePoints, "\" HEIGHT=\"").concat(utils_2.IconSizePoints, "\" BORDER=\"0\" CELLPADDING=\"0\" CELLSPACING=\"0\"><TR><TD> </TD></TR></TABLE>");
}
function maxchars(size) {
    switch (size) {
        case 'xs':
        case 'sm':
            return 30;
        case 'md':
            return 40;
        case 'lg':
        case 'xl':
            return 55;
        default:
            (0, utils_1.nonexhaustive)(size);
    }
}
function nodeLabel(node, styles) {
    var _a;
    var _b = styles.nodeSizes(node.style), size = _b.sizes.size, values = _b.values;
    var colorValues = styles.colors(node.color).elements;
    var isSmOrXs = ['sm', 'xs'].includes(size);
    var hasIcon = (0, remeda_1.isTruthy)(node.icon);
    var lines = [
        wrapWithFont({
            text: node.title,
            fontsize: values.textSize,
            maxchars: maxchars(size),
            maxLines: isSmOrXs ? 1 : 3,
        }),
    ];
    if (size !== 'xs') {
        if ((0, remeda_1.isTruthy)((_a = node.technology) === null || _a === void 0 ? void 0 : _a.trim())) {
            lines.push(wrapWithFont({
                text: node.technology,
                fontsize: Math.ceil(values.textSize * 0.65),
                maxchars: hasIcon ? 35 : 45,
                maxLines: 1,
                color: colorValues.loContrast,
            }));
        }
        var description = core_1.RichText.from(node.description).text;
        if (description) {
            lines.push(wrapWithFont({
                text: description,
                fontsize: Math.ceil(values.textSize * 0.75),
                maxchars: hasIcon ? 35 : 45,
                maxLines: isSmOrXs ? 3 : 5,
                color: colorValues.loContrast,
            }));
        }
    }
    if (lines.length === 1 && hasIcon === false) {
        return "<".concat(lines[0], ">");
    }
    var rowMapper = hasIcon
        ? function (line, idx, all) {
            var cell = "<TD ALIGN=\"TEXT\" BALIGN=\"LEFT\">".concat(line, "</TD>");
            // if first row, prepend columns with ROWSPAN
            if (idx === 0) {
                var rowspan = all.length > 1 ? " ROWSPAN=\"".concat(all.length, "\"") : '';
                var leftwidth = 76; // icon is 60px, plus 10px here and plus 10px padding from node margin
                if (['xs', 'sm'].includes(size)) {
                    leftwidth = 16;
                }
                if (node.shape === 'queue' || node.shape === 'mobile') {
                    // add 20px padding more
                    leftwidth += 20;
                }
                // prepend empty cell (left padding)
                cell = "<TD".concat(rowspan, " WIDTH=\"").concat(leftwidth, "\"> </TD>").concat(cell);
                // append empty cell (right padding)
                cell = "".concat(cell, "<TD").concat(rowspan, " WIDTH=\"16\"> </TD>");
            }
            return "<TR>".concat(cell, "</TR>");
        }
        : function (line) {
            return "<TR><TD>".concat(line, "</TD></TR>");
        };
    var rows = lines.map(rowMapper).join('');
    return "<<TABLE BORDER=\"0\" CELLPADDING=\"0\" CELLSPACING=\"4\">".concat(rows, "</TABLE>>");
}
function compoundLabel(node, color) {
    var html = wrapWithFont({
        text: node.title.toUpperCase(),
        maxchars: 50,
        fontsize: 11,
        maxLines: 1,
        bold: true,
        color: color,
    });
    if (html.includes('<BR/>')) {
        return "<<TABLE BORDER=\"0\" CELLPADDING=\"0\" CELLSPACING=\"0\"><TR><TD ALIGN=\"TEXT\" BALIGN=\"LEFT\">".concat(html, "</TD></TR></TABLE>>");
    }
    return "<".concat(html, ">");
}
exports.EDGE_LABEL_MAX_CHARS = 40;
exports.EDGE_LABEL_MAX_LINES = 5;
var BGCOLOR = "BGCOLOR=\"".concat(core_1.LikeC4Styles.DEFAULT.relationshipColors.labelBg, "A0\"");
function edgelabel(_a) {
    var label = _a.label, technology = _a.technology;
    var lines = [];
    if ((0, remeda_1.isTruthy)(label === null || label === void 0 ? void 0 : label.trim())) {
        lines.push(wrapWithFont({
            text: label,
            maxchars: exports.EDGE_LABEL_MAX_CHARS,
            fontsize: 14,
            maxLines: exports.EDGE_LABEL_MAX_LINES,
            bold: label === '[...]',
        }));
    }
    // if (isTruthy(description)) {
    //   lines.push(
    //     wrapWithFont({
    //       text: description,
    //       maxchars: EDGE_LABEL_MAX_CHARS,
    //       maxLines: 4,
    //       fontsize: 14
    //     })
    //   )
    // }
    if ((0, remeda_1.isTruthy)(technology === null || technology === void 0 ? void 0 : technology.trim())) {
        lines.push(wrapWithFont({
            text: "[ ".concat(technology, " ]"),
            fontsize: 12,
            maxLines: 1,
            maxchars: exports.EDGE_LABEL_MAX_CHARS,
        }));
    }
    if (lines.length === 0) {
        return null;
    }
    var rows = lines.map(function (line) { return "<TR><TD ALIGN=\"TEXT\" BALIGN=\"LEFT\">".concat(line, "</TD></TR>"); }).join('');
    return "<<TABLE BORDER=\"0\" CELLPADDING=\"3\" CELLSPACING=\"0\" ".concat(BGCOLOR, ">").concat(rows, "</TABLE>>");
}
function stepEdgeLabel(step, text) {
    var num = "<TABLE BORDER=\"0\" CELLPADDING=\"6\" ".concat(BGCOLOR, "><TR><TD WIDTH=\"20\" HEIGHT=\"20\"><FONT POINT-SIZE=\"").concat((0, utils_2.pxToPoints)(14), "\"><B>").concat(step, "</B></FONT></TD></TR></TABLE>");
    if (!(0, remeda_1.isTruthy)(text === null || text === void 0 ? void 0 : text.trim())) {
        return "<".concat(num, ">");
    }
    var html = [
        "<TABLE BORDER=\"0\" CELLPADDING=\"0\" CELLSPACING=\"3\">",
        "<TR>",
        "<TD>".concat(num, "</TD>"),
        "<TD ".concat(BGCOLOR, " CELLPADDING=\"3\">"),
        wrapWithFont({
            text: text,
            maxchars: exports.EDGE_LABEL_MAX_CHARS,
            fontsize: 14,
            maxLines: 5,
        }),
        "</TD>",
        "</TR>",
        "</TABLE>",
    ];
    return "<".concat(html.join(''), ">");
}
