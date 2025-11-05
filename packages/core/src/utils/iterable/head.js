export function ihead(iterable) {
    if (!iterable) {
        return _head;
    }
    return _head(iterable);
}
function _head(iter) {
    for (const value of iter) {
        return value;
    }
    return;
}
