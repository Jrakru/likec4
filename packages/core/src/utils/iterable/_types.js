import { isNonNullish } from 'remeda';
export function isIterable(something) {
    return isNonNullish(something) && typeof something === 'object' && Symbol.iterator in something;
}
