import chroma from 'chroma-js';
import defu from 'defu';
import { hasAtLeast, isDeepEqual } from 'remeda';
import { ensureSizes } from '../types';
import { memoizeProp } from '../utils';
import { computeColorValues } from './compute-color-values';
import { styleDefaults } from './defaults';
import { defaultTheme } from './theme';
export const defaultStyle = {
    theme: defaultTheme,
    defaults: styleDefaults,
};
/**
 * Styles of a LikeC4 project
 *
 * Accepts an array of LikeC4ProjectStylesConfig objects as a parameter
 * and constructs a LikeC4Styles merged with the default styles.
 *
 * The class provides methods to get the default element colors, relationship
 * colors, group colors, font size in pixels, padding in pixels, and to compute
 * the ThemeColorValues from a given color.
 */
export class LikeC4Styles {
    config;
    theme;
    defaults;
    static DEFAULT = new LikeC4Styles(defaultStyle);
    static from(...configs) {
        if (hasAtLeast(configs, 1)) {
            return new LikeC4Styles(defu(...configs, defaultStyle));
        }
        return this.DEFAULT;
    }
    constructor(config) {
        this.config = config;
        this.theme = config.theme;
        this.defaults = config.defaults;
    }
    /**
     * Default element colors
     */
    get elementColors() {
        return this.theme.colors[this.defaults.color].elements;
    }
    /**
     * Default relationship colors
     */
    get relationshipColors() {
        return this.theme.colors[this.defaults.relationship.color].relationships;
    }
    /**
     * Default group colors
     */
    get groupColors() {
        const color = this.defaults.group?.color;
        if (!color) {
            return this.elementColors;
        }
        return memoizeProp(this, 'defaultGroup', () => ({
            ...this.elementColors,
            ...this.theme.colors[color].elements,
        }));
    }
    isDefaultColor(color) {
        return color === this.defaults.color;
    }
    /**
     * Get color values
     *
     * @param color - The color to use
     * @default color From the defaults
     */
    colors(color) {
        color ??= this.defaults.color;
        if (this.isThemeColor(color)) {
            return this.theme.colors[color];
        }
        throw new Error(`Unknown color: ${color}`);
    }
    /**
     * Get font size in pixels
     *
     * @param textSize - The text size to use
     * @default textSize From the defaults
     */
    fontSize(textSize) {
        textSize ??= this.defaults.text ?? this.defaults.size;
        return this.theme.textSizes[textSize];
    }
    /**
     * Get padding in pixels
     *
     * @param paddingSize - The padding size to use
     * @default paddingSize From the defaults
     */
    padding(paddingSize) {
        paddingSize ??= this.defaults.padding ?? this.defaults.size;
        return this.theme.spacing[paddingSize];
    }
    isThemeColor(color) {
        return color in this.theme.colors;
    }
    /**
     * Calculate sizes and values based on the node styles
     *
     * @example
     * ```typescript
     * const { sizes, values } = styles.nodeSizes(node.style)
     *
     * // sizes
     * sizes.size     // enum Size
     * sizes.padding  // enum SpacingSize
     * sizes.textSize // enum TextSize
     *
     * // values
     * values.sizes    // { width: number, height: number }
     * values.padding  // number
     * values.textSize // number
     * ```
     */
    nodeSizes(nodestyles) {
        const sizes = ensureSizes(nodestyles, this.defaults.size);
        return {
            sizes,
            values: {
                sizes: this.theme.sizes[sizes.size],
                padding: this.padding(sizes.padding),
                textSize: this.fontSize(sizes.textSize),
            },
        };
    }
    /**
     * Compute ThemeColorValues from a given color
     * @param color - HEX, RGB, RGBA, etc.
     */
    computeFrom(color) {
        if (this.isThemeColor(color)) {
            return this.theme.colors[color];
        }
        if (!chroma.valid(color)) {
            throw new Error(`Invalid color value: "${color}"`);
        }
        return memoizeProp(this, `compute-${color}`, () => computeColorValues(color));
    }
    equals(other) {
        if (other === this) {
            return true;
        }
        return isDeepEqual(this.config, other.config);
    }
}
