import { compareNatural, nonNullable } from '@likec4/core/utils';
import { concat, entries, isTruthy, map, pipe, prop, pullObject, sort } from 'remeda';
/**
 * Colors are taken from the styles presets of the LikeC4
 */
export const radixColors = [
    'tomato',
    'grass',
    'blue',
    'ruby',
    'orange',
    'indigo',
    'pink',
    'teal',
    'purple',
    'amber',
    'crimson',
    'red',
    'lime',
    'yellow',
    'violet',
];
export function assignTagColors(tags) {
    const tagsWithColors = [];
    const tagsWithoutColors = [];
    for (const [tag, spec] of entries(tags)) {
        if (isTruthy(spec.color)) {
            tagsWithColors.push({
                tag: tag,
                spec: {
                    color: spec.color,
                },
            });
        }
        else {
            tagsWithoutColors.push(tag);
        }
    }
    return pipe(tagsWithoutColors, sort(compareNatural), map((tag, idx) => {
        const color = nonNullable(radixColors[idx % radixColors.length]);
        return {
            tag,
            spec: {
                color,
            },
        };
    }), concat(tagsWithColors), sort((a, b) => compareNatural(a.tag, b.tag)), pullObject(prop('tag'), prop('spec')));
}
