# Architecture Decision Records - PR04 Walkthrough State Machine

This directory contains ADRs documenting design decisions for the walkthrough state machine implementation.

## Index

### Feature Design
1. [ADR-001: State Machine Event Signatures](./ADR-001-event-signatures.md) - ✅ ACCEPTED
2. [ADR-002: Step Linearization Logic](./ADR-002-step-linearization.md) - ✅ ACCEPTED
3. [ADR-003: Branch Completion Tracking](./ADR-003-completion-tracking.md) - ✅ ACCEPTED
4. [ADR-004: URL State Persistence](./ADR-004-url-persistence.md) - ✅ ACCEPTED (⚠️ StepId stability confirmed)
5. [ADR-005: Hook API Signatures](./ADR-005-hook-apis.md) - ✅ ACCEPTED

### Architecture
6. [ADR-006: Walkthrough Module Architecture](./ADR-006-module-architecture.md) - ✅ ACCEPTED

## Summary

All design decisions are complete. Ready for implementation following the modular architecture approach:

**Key Decisions:**
- Unified `walkthrough.navigate` event with discriminated actions
- Just-in-time step linearization with rich progress
- Hierarchical completion tracking in localStorage
- Hash-based URL persistence (stepIDs are position-based, break on reorder)
- Granular React hooks for optimal performance
- Dedicated walkthrough module as XState child actor

**Architecture:**
- Create `state/walkthrough/` module with separate concerns
- Spawn walkthrough as child actor (follows existing pattern)
- Reduces main diagram-machine.ts from 1443 → <1000 lines
- Foundation for future `@likec4/walkthrough` package extraction

**Implementation Plan:**
1. Phase 1: Extract types (Day 1)
2. Phase 2: Extract logic modules (Day 2)
3. Phase 3: Create child machine (Day 3)
4. Phase 4: Implement hooks (Day 4)
5. Phase 5: Build UI components (Day 5)

## Status Legend
- ✅ ACCEPTED - Decision made and documented
- ⚠️ ACCEPTED with caveats - Documented in ADR
- 🔄 IN PROGRESS - Currently under discussion
- ⏳ PENDING - Not yet started
- ❌ REJECTED - Considered but not chosen
