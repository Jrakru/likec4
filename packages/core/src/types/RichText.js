import { markdownToHtml, markdownToText, memoizeProp, nonexhaustive } from '../utils';
const symb_text = Symbol.for('text');
const symb_html = Symbol.for('html');
const emptyTxt = '';
/**
 * RichText is a class that represents a potentially markdown string.
 * It can be either a plain text or a markdown.
 * It is used to represent the content of a node or a link.
 */
export class RichText {
    static _cache = new WeakMap();
    /**
     * Creates and memoizes a RichText instance.
     * @see ElementModel.description
     * @example
     *
     *  get description(): RichTextOrEmpty {
     *    return RichText.memoize(this, this.$element.description)
     *  }
     */
    static memoize(obj, tag, source) {
        return memoizeProp(obj, tag, () => RichText.from(source));
    }
    /**
     * Creates a RichText instance from a source.
     */
    static from(source) {
        if (source === null || source === undefined || source === RichText.EMPTY) {
            return RichText.EMPTY;
        }
        if (source instanceof RichText) {
            return source;
        }
        if (typeof source === 'string') {
            if (source.trim() === emptyTxt) {
                return RichText.EMPTY;
            }
            return new RichText({ txt: source });
        }
        if ('isEmpty' in source && source.isEmpty) {
            return RichText.EMPTY;
        }
        if ('md' in source && source.md.trim() === emptyTxt) {
            return RichText.EMPTY;
        }
        if ('txt' in source && source.txt.trim() === emptyTxt) {
            return RichText.EMPTY;
        }
        const _source = source;
        const cached = RichText._cache.get(_source);
        if (cached) {
            return cached;
        }
        const rt = new RichText(_source);
        RichText._cache.set(_source, rt);
        return rt;
    }
    /**
     * This is a workaround for the fact that we need instance of RichText for `instanceof` checks
     * It is invalid inheritance (returning `null` from getters), and we cast to @see RichTextEmpty
     */
    static EMPTY = new class extends RichText {
        isEmpty = true;
        nonEmpty = false;
        isMarkdown = false;
        $source = null;
        constructor() {
            super({ txt: emptyTxt });
        }
        get text() {
            return null;
        }
        get md() {
            return null;
        }
        get html() {
            return null;
        }
    }();
    $source;
    isEmpty;
    nonEmpty;
    isMarkdown;
    /**
     * Private constructor to prevent direct instantiation.
     * Use {@link RichText.from} or {@link RichText.memoize} instead.
     */
    constructor(source) {
        this.isMarkdown = false;
        if (typeof source === 'string') {
            this.$source = { txt: source };
            this.isEmpty = source.trim() === emptyTxt;
        }
        else {
            this.$source = source;
            this.isEmpty = true;
            if ('md' in source) {
                this.isEmpty = source.md === emptyTxt;
                this.isMarkdown = true;
            }
            else {
                this.isEmpty = source.txt === emptyTxt;
            }
        }
        this.nonEmpty = !this.isEmpty;
    }
    /**
     * Returns the text content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the markdown.
     */
    get text() {
        if (this.isEmpty || this.$source === null) {
            return emptyTxt;
        }
        const source = this.$source;
        if ('txt' in source) {
            return source.txt;
        }
        return memoizeProp(this, symb_text, () => markdownToText(source.md));
    }
    /**
     * Returns the markdown content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the markdown.
     */
    get md() {
        if (this.isEmpty || this.$source === null) {
            return emptyTxt;
        }
        const source = this.$source;
        if ('md' in source) {
            return source.md;
        }
        if ('txt' in source) {
            return source.txt;
        }
        nonexhaustive(source);
    }
    /**
     * Returns the html content of the rich text.
     * If the source is a string, it returns the string.
     * If the source is a markdown, it returns the HTML.
     */
    get html() {
        if (this.isEmpty || this.$source === null) {
            return emptyTxt;
        }
        const source = this.$source;
        if ('txt' in source) {
            return source.txt;
        }
        return memoizeProp(this, symb_html, () => markdownToHtml(source.md));
    }
    equals(other) {
        if (this === other)
            return true;
        if (!(other instanceof RichText))
            return false;
        if (this.isEmpty && other.isEmpty)
            return true;
        if (this.isEmpty !== other.isEmpty || this.isMarkdown !== other.isMarkdown)
            return false;
        if (this.isMarkdown) {
            return this.$source?.md === other.$source?.md;
        }
        return this.$source?.txt === other.$source?.txt;
    }
}
