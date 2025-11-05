import { extractStep, isStepEdgeId, RichText, } from '../../types';
export class EdgeModel {
    view;
    $edge;
    source;
    target;
    #edge;
    constructor(view, $edge, source, target) {
        this.view = view;
        this.$edge = $edge;
        this.source = source;
        this.target = target;
        this.#edge = $edge;
    }
    get id() {
        return this.#edge.id;
    }
    get parent() {
        return this.#edge.parent ? this.view.node(this.#edge.parent) : null;
    }
    get label() {
        return this.#edge.label ?? null;
    }
    get description() {
        return RichText.memoize(this, 'description', this.#edge.description);
    }
    get technology() {
        return this.#edge.technology ?? null;
    }
    hasParent() {
        return this.#edge.parent !== null;
    }
    get tags() {
        return this.#edge.tags ?? [];
    }
    get stepNumber() {
        return this.isStep() ? extractStep(this.id) : null;
    }
    get navigateTo() {
        return this.#edge.navigateTo ? this.view.$model.view(this.#edge.navigateTo) : null;
    }
    get color() {
        return this.#edge.color;
    }
    get line() {
        return this.#edge.line ?? this.view.$model.$styles.defaults.relationship.line;
    }
    get head() {
        return this.#edge.head ?? this.view.$model.$styles.defaults.relationship.arrow;
    }
    get tail() {
        return this.#edge.tail;
    }
    isStep() {
        return isStepEdgeId(this.id);
    }
    *relationships(type) {
        for (const id of this.#edge.relations) {
            // if type is provided, then we need to filter relationships
            if (type) {
                const rel = this.view.$model.findRelationship(id, type);
                if (rel) {
                    yield rel;
                }
            }
            else {
                yield this.view.$model.relationship(id);
            }
        }
        return;
    }
    includesRelation(rel) {
        const id = typeof rel === 'string' ? rel : rel.id;
        return this.#edge.relations.includes(id);
    }
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
