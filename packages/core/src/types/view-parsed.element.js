export function isViewRuleGroup(rule) {
    return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules);
}
