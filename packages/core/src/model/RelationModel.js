import { isEmpty, isTruthy } from 'remeda';
import { FqnRef, RichText, } from '../types';
import { commonAncestor } from '../utils/fqn';
export class RelationshipModel {
    model;
    $relationship;
    source;
    target;
    /**
     * Common ancestor of the source and target elements.
     * Represents the boundary of the Relation.
     */
    boundary;
    constructor(model, $relationship) {
        this.model = model;
        this.$relationship = $relationship;
        this.source = model.element(FqnRef.flatten($relationship.source));
        this.target = model.element(FqnRef.flatten($relationship.target));
        const parent = commonAncestor(this.source.id, this.target.id);
        this.boundary = parent ? this.model.element(parent) : null;
    }
    get id() {
        return this.$relationship.id;
    }
    get expression() {
        return `${this.source.id} -> ${this.target.id}`;
    }
    get title() {
        if (!isTruthy(this.$relationship.title)) {
            return null;
        }
        return this.$relationship.title;
    }
    get technology() {
        if (!isTruthy(this.$relationship.technology)) {
            return null;
        }
        return this.$relationship.technology;
    }
    get description() {
        return RichText.memoize(this, 'description', this.$relationship.description);
    }
    get navigateTo() {
        return this.$relationship.navigateTo ? this.model.view(this.$relationship.navigateTo) : null;
    }
    get tags() {
        return this.$relationship.tags ?? [];
    }
    get kind() {
        return this.$relationship.kind ?? null;
    }
    get links() {
        return this.$relationship.links ?? [];
    }
    get color() {
        return this.$relationship.color ?? this.model.$styles.defaults.relationship.color;
    }
    get line() {
        return this.$relationship.line ?? this.model.$styles.defaults.relationship.line;
    }
    get head() {
        return this.$relationship.head ?? this.model.$styles.defaults.relationship.arrow;
    }
    get tail() {
        return this.$relationship.tail;
    }
    /**
     * Iterate over all views that include this relationship.
     */
    *views() {
        for (const view of this.model.views()) {
            if (view.includesRelation(this.id)) {
                yield view;
            }
        }
        return;
    }
    isDeploymentRelation() {
        return false;
    }
    isModelRelation() {
        return true;
    }
    hasMetadata() {
        return !!this.$relationship.metadata && !isEmpty(this.$relationship.metadata);
    }
    getMetadata(field) {
        if (field) {
            return this.$relationship.metadata?.[field];
        }
        return this.$relationship.metadata ?? {};
    }
    /**
     * Checks if the relationship has the given tag.
     */
    isTagged(tag) {
        return this.tags.includes(tag);
    }
}
