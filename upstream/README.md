# Upstream Contributions to LikeC4

This directory contains documentation for features we're contributing back to the upstream LikeC4 project.

---

## Overview

The 1C4D5 project leverages LikeC4 for architecture modeling. When we identify features that would benefit the broader LikeC4 community, we contribute them upstream rather than maintaining a permanent fork.

**Philosophy**: 
- Leverage upstream, don't fork
- Contribute valuable features back to the community
- Keep our codebase minimal and maintainable
- Use fork temporarily until upstream merges

---

## Active Contributions

### Alternate Paths for Dynamic Views

**Status**: Ready for Implementation  
**Timeline**: 3 days implementation + 1-2 weeks review  
**Priority**: High

**Documents**:
- [`LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md`](./LIKEC4_ALTERNATE_PATHS_FEATURE_REQUEST.md) — Comprehensive feature specification (submit to LikeC4)
- [`LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md`](./LIKEC4_ALTERNATE_PATHS_IMPLEMENTATION_CHECKLIST.md) — Step-by-step implementation guide for development team

**Summary**: Add support for `alternate` paths (OR logic) to complement existing `parallel` paths (AND logic) in dynamic views. Enables modeling decision points where one of several mutually exclusive paths is taken (e.g., validation pass/fail, payment methods, authentication outcomes).

**Use Case**: Data quality gates, authentication flows, payment processing, error handling — common patterns in data pipelines and user flows.

**Implementation Strategy**:
1. Fork `likec4/likec4` → `1c4d5-team/likec4`
2. Implement feature on `feature/alternate-paths` branch
3. Test thoroughly with 1C4D5 use cases
4. Submit PR(s) to upstream `likec4/likec4`
5. Use fork in production until upstream merges
6. Switch back to official release after merge

---

## Contribution Process

### Step 1: Proposal (Feature Request)
- Create comprehensive feature request document
- Include use cases, rationale, technical design
- Show examples and alternatives considered
- Estimate effort and complexity

### Step 2: Upstream Discussion
- Open GitHub Discussion in likec4/likec4 repo
- Share feature request document
- Gauge maintainer interest
- Get feedback on approach

### Step 3: Fork & Implement
- Fork repository: `likec4/likec4` → `1c4d5-team/likec4`
- Create feature branch
- Implement according to checklist
- Write comprehensive tests
- Update documentation

### Step 4: Pull Request
- Submit incremental PRs (easier to review)
- Include before/after examples
- Link to feature request discussion
- Respond to review feedback promptly

### Step 5: Integration
- Use fork in 1C4D5 production
- Monitor for issues
- Keep fork synced with upstream
- Switch to official release after merge

---

## Fork Management

### Fork Repository
**URL**: `https://github.com/1c4d5-team/likec4`  
**Upstream**: `https://github.com/likec4/likec4`

### Branches
- `main` — Synced with upstream/main
- `feature/alternate-paths` — Alternate paths implementation
- `feature/*` — Other feature branches as needed

### Staying in Sync
```bash
# Add upstream remote (once)
git remote add upstream https://github.com/likec4/likec4.git

# Sync main branch
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# Rebase feature branch
git checkout feature/alternate-paths
git rebase main
git push origin feature/alternate-paths --force-with-lease
```

### Using Fork in 1C4D5
```json
{
  "dependencies": {
    "@likec4/core": "github:1c4d5-team/likec4#feature/alternate-paths",
    "@likec4/diagram": "github:1c4d5-team/likec4#feature/alternate-paths"
  }
}
```

---

## Guidelines for Upstream Contributions

### Technical Quality
- Follow LikeC4 code style and conventions
- Include comprehensive tests (unit + integration)
- Update documentation
- No breaking changes to existing APIs
- Performance: no regressions

### Communication
- Be respectful and collaborative
- Respond to feedback promptly
- Be willing to iterate on design
- Explain rationale clearly
- Show concrete examples

### Documentation
- Write clear feature descriptions
- Include use cases and examples
- Document alternatives considered
- Explain design decisions
- Provide migration guide if needed

---

## Related Documents

### Internal (1C4D5)
- [ADR-0007: Leverage LikeC4 Dynamic Views](../adr/ADR-0007-leverage-likec4-dynamic-views-for-flow-stories.md)
- [LikeC4 Dynamic Views Findings](../investigations/LIKEC4_DYNAMIC_VIEWS_FINDINGS.md)
- [Alternate Paths Feasibility Analysis](../investigations/LIKEC4_ALTERNATE_PATHS_FEASIBILITY.md)
- [Alternate Paths UX Design](../investigations/ALTERNATE_PATHS_WALKTHROUGH_UX.md)

### External (LikeC4)
- [LikeC4 Repository](https://github.com/likec4/likec4)
- [LikeC4 Contributing Guide](https://github.com/likec4/likec4/blob/main/CONTRIBUTING.md)
- [LikeC4 Documentation](https://likec4.dev)

---

## Contact

**1C4D5 Team**: Engineering Team  
**Implementation Team**: [To be assigned]  
**Questions**: Open discussion in LikeC4 GitHub or contact 1C4D5 team

---

**Last Updated**: 2025-01-XX  
**Maintained By**: 1C4D5 Engineering Team