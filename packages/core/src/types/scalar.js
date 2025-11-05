import { isString, isTruthy } from 'remeda';
import { invariant } from '../utils';
/**
 * Create a ProjectId value from a plain string.
 *
 * @param name - The project identifier string
 * @returns The input string expressed as a `ProjectId`
 */
export function ProjectId(name) {
    return name;
}
export function flattenMarkdownOrString(value) {
    if (value === null || value === undefined) {
        return null;
    }
    const content = isString(value) ? value : value.txt ?? value.md;
    return isTruthy(content?.trim()) ? content : null;
}
export function Fqn(name, parent) {
    return (parent ? parent + '.' + name : name);
}
export const GroupElementKind = '@group';
export function isGroupElementKind(v) {
    return v.kind === GroupElementKind;
}
export function DeploymentFqn(name, parent) {
    return (parent ? parent + '.' + name : name);
}
export function ViewId(id) {
    return id;
}
export function RelationId(id) {
    return id;
}
export function GlobalFqn(projectId, name) {
    invariant(typeof projectId === 'string' && projectId != '');
    return '@' + projectId + '.' + name;
}
export function isGlobalFqn(fqn) {
    return fqn.startsWith('@');
}
export function splitGlobalFqn(fqn) {
    if (!fqn.startsWith('@')) {
        return [null, fqn];
    }
    const firstDot = fqn.indexOf('.');
    if (firstDot < 2) {
        throw new Error('Invalid global FQN');
    }
    const projectId = fqn.slice(1, firstDot);
    const name = fqn.slice(firstDot + 1);
    return [projectId, name];
}
export function NodeId(id) {
    return id;
}
/**
 * Casts a plain string to the `EdgeId` branded type.
 *
 * @param id - The string to tag as an `EdgeId`
 * @returns The input string typed as an `EdgeId`
 */
export function EdgeId(id) {
    return id;
}
/**
 * Normalize a step edge path index segment for inclusion in an edge identifier.
 *
 * @param segment - The index segment, either a number or string
 * @param isFirst - Whether this segment is the first in the path (not used by the formatter)
 * @returns The segment as a string; numeric segments are left-padded with zeros to at least two characters, non-numeric segments are returned unchanged
 */
function formatIndex(segment, { isFirst }) {
    const raw = typeof segment === 'number' ? segment.toString() : segment;
    if (!/^\d+$/u.test(raw)) {
        return raw;
    }
    if (isFirst) {
        return raw;
    }
    return raw.padStart(2, '0');
}
/**
 * Construct a hierarchical step edge identifier from a non-empty list of indices.
 *
 * Numeric index segments are formatted (including zero-padding where applicable) and joined into a path prefixed with `step-`; non-numeric string segments are appended verbatim.
 *
 * @param indices - Non-empty array of numeric or string segments that form the step path; the first element becomes the primary step after the `step-` prefix.
 * @returns A `StepEdgeId` representing the assembled step path (e.g. `step-01`, `step-01.02`, or `step-01.alpha`)
 */
export function stepEdgePath(indices) {
    const [head, ...rest] = indices;
    const prefix = `step-${formatIndex(head, { isFirst: true })}`;
    if (rest.length === 0) {
        return prefix;
    }
    let id = prefix;
    for (const segment of rest) {
        if (typeof segment === 'number') {
            id += `.${formatIndex(segment, { isFirst: false })}`;
            continue;
        }
        // segment is a string, check if it's numeric
        if (/^\d+$/u.test(segment)) {
            id += `.${formatIndex(segment, { isFirst: false })}`;
            continue;
        }
        id += segment;
    }
    return id;
}
/**
 * Build a hierarchical step edge identifier for a step, optionally including a parallel step segment.
 *
 * @param step - Primary step index
 * @param parallelStep - Optional secondary (parallel) step index
 * @returns A `StepEdgeId` in the form `step-<segment>` or `step-<segment>.<segment>` where numeric segments are formatted/padded as required
 */
export function stepEdgeId(step, parallelStep) {
    return parallelStep !== undefined
        ? stepEdgePath([step, parallelStep])
        : stepEdgePath([step]);
}
export const StepEdgeKind = '@step';
export function isStepEdgeId(id) {
    return id.startsWith('step-');
}
export function extractStep(id) {
    if (!isStepEdgeId(id)) {
        throw new Error(`Invalid step edge id: ${id}`);
    }
    return parseFloat(id.slice('step-'.length));
}
