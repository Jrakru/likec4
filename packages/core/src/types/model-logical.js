import { defaultStyle } from '../styles/LikeC4Styles';
/**
 * Ensures that the sizes are set to default values if they are not set
 */
export function ensureSizes({ size, padding, textSize, ...rest }, defaultSize = defaultStyle.defaults.size) {
    size ??= defaultSize;
    textSize ??= size;
    padding ??= size;
    return {
        ...rest,
        size,
        padding,
        textSize,
    };
}
