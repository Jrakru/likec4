import { nonexhaustive } from '@likec4/core';
import { loggable } from '@likec4/log';
import { hasAtLeast, isTruthy } from 'remeda';
import { ast } from '../../ast';
import { serverLogger } from '../../logger';
const logger = serverLogger.getChild('GlobalsParser');
export function GlobalsParser(B) {
    return class GlobalsParser extends B {
        parseGlobals() {
            const { parseResult, c4Globals } = this.doc;
            const isValid = this.isValid;
            const globals = parseResult.value.globals.filter(isValid);
            const elRelPredicates = globals.flatMap(r => r.predicates.filter(isValid));
            for (const predicate of elRelPredicates) {
                try {
                    const globalPredicateId = predicate.name;
                    if (!isTruthy(globalPredicateId)) {
                        continue;
                    }
                    if (globalPredicateId in c4Globals.predicates) {
                        logger.warn(`Global predicate named "${globalPredicateId}" is already defined`);
                        continue;
                    }
                    this.parseAndStoreGlobalPredicateGroupOrDynamic(predicate, globalPredicateId, c4Globals);
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
            const styles = globals.flatMap(r => r.styles.filter(isValid));
            for (const style of styles) {
                try {
                    const globalStyleId = style.id.name;
                    if (!isTruthy(globalStyleId)) {
                        continue;
                    }
                    if (globalStyleId in c4Globals.styles) {
                        logger.warn(`Global style named "${globalStyleId}" is already defined`);
                        continue;
                    }
                    const styles = this.parseGlobalStyleOrGroup(style);
                    if (hasAtLeast(styles, 1)) {
                        c4Globals.styles[globalStyleId] = styles;
                    }
                }
                catch (e) {
                    logger.warn(loggable(e));
                }
            }
        }
        parseAndStoreGlobalPredicateGroupOrDynamic(astRule, id, c4Globals) {
            if (ast.isGlobalPredicateGroup(astRule)) {
                const predicates = this.parseGlobalPredicateGroup(astRule);
                if (hasAtLeast(predicates, 1)) {
                    c4Globals.predicates[id] = predicates;
                }
                return;
            }
            if (ast.isGlobalDynamicPredicateGroup(astRule)) {
                const predicates = this.parseGlobalDynamicPredicateGroup(astRule);
                if (hasAtLeast(predicates, 1)) {
                    c4Globals.dynamicPredicates[id] = predicates;
                }
                return;
            }
            nonexhaustive(astRule);
        }
        parseGlobalPredicateGroup(astRule) {
            return astRule.predicates.map(p => this.parseViewRulePredicate(p));
        }
        parseGlobalDynamicPredicateGroup(astRule) {
            return astRule.predicates.map(p => this.parseDynamicViewIncludePredicate(p));
        }
        parseGlobalStyleOrGroup(astRule) {
            if (ast.isGlobalStyle(astRule)) {
                return [this.parseViewRuleStyle(astRule)];
            }
            if (ast.isGlobalStyleGroup(astRule)) {
                return astRule.styles.map(s => this.parseViewRuleStyle(s));
            }
            nonexhaustive(astRule);
        }
    };
}
