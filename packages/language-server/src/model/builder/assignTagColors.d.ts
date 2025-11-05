import type * as c4 from '@likec4/core/types';
import type { ParsedAstSpecification } from '../../ast';
/**
 * Colors are taken from the styles presets of the LikeC4
 */
export declare const radixColors: string[];
export declare function assignTagColors(tags: ParsedAstSpecification['tags']): Record<c4.Tag, c4.TagSpecification>;
