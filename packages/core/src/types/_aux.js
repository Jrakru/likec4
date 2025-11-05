/**
 * Returns summary if it is not null, otherwise returns description
 */
export function preferSummary(a) {
    return a.summary ?? a.description;
}
/**
 * Returns description if it is not null, otherwise returns summary
 */
export function preferDescription(a) {
    return a.description ?? a.summary;
}
