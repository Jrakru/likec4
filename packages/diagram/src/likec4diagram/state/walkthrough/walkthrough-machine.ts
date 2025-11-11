import { createMachine, setup } from 'xstate'
import {
  computeCompletedPaths,
  markStepComplete,
  resetCompletion,
} from './completion'
import {
  buildLinearOrder,
  getBranchOptions,
  getDefaultBranchPath,
  getNextStep,
  getPreviousStep,
} from './navigation'
import type {
  WalkthroughBranchPathRef,
  WalkthroughContextInput,
  WalkthroughEvent,
  WalkthroughState,
  WalkthroughStateActive,
} from './types'
import { createWalkthroughState } from './types'
import {
  decodeWalkthroughState,
  encodeWalkthroughState,
  toBranchPathRef,
} from './url-state'

/**
 * Machine context: immutable input + walkthrough state.
 *
 * - `input` is provided by the consumer and may be updated via UPDATE_FROM_INPUT.
 * - `state` is the internal walkthrough state (active position + completion).
 */
export interface WalkthroughMachineContext {
  readonly input: WalkthroughContextInput
  readonly state: WalkthroughState
}

/**
 * Internal helpers
 */

function resolveStartStep(
  input: WalkthroughContextInput,
  explicitStepId?: string,
): string | undefined {
  if (explicitStepId && input.stepIds.includes(explicitStepId)) {
    return explicitStepId
  }
  const order = buildLinearOrder(input)
  return order[0]
}

function createActive(
  stepId: string,
  branch?: WalkthroughBranchPathRef,
): WalkthroughStateActive {
  return branch
    ? {
      stepId,
      branch: {
        branchId: branch.branchId,
        pathId: branch.pathId,
      },
    }
    : {
      stepId,
    }
}

function applySyncFromUrl(
  ctx: WalkthroughMachineContext,
  encoded: string,
): WalkthroughMachineContext {
  const decoded = decodeWalkthroughState(encoded)
  const { input } = ctx

  if (!decoded.viewId || decoded.viewId !== input.viewId) {
    // View mismatch or invalid: ignore and keep current state.
    return ctx
  }

  const stepId = decoded.stepId && input.stepIds.includes(decoded.stepId)
    ? decoded.stepId
    : undefined

  if (!stepId) {
    return ctx
  }

  const branchRef = toBranchPathRef(decoded)
  let active: WalkthroughStateActive

  if (branchRef) {
    // Only keep branch selection if it corresponds to a known option for that decision step.
    const options = getBranchOptions(input, stepId)
    const match = options.find(
      o => o.branchId === branchRef.branchId && o.pathId === branchRef.pathId,
    )
    if (match) {
      active = createActive(stepId, match)
    } else {
      active = createActive(stepId)
    }
  } else {
    active = createActive(stepId)
  }

  return {
    input,
    state: {
      ...ctx.state,
      active,
      // completion untouched
    },
  }
}

function applyUpdateFromInput(
  ctx: WalkthroughMachineContext,
  input: WalkthroughContextInput,
): WalkthroughMachineContext {
  // When input changes, keep completion and attempt to realign active step.
  const prev = ctx
  const prevActive = prev.state.active
  let nextActive: WalkthroughStateActive | undefined

  if (prevActive && input.stepIds.includes(prevActive.stepId)) {
    // Preserve existing active step if it still exists.
    nextActive = createActive(prevActive.stepId, prevActive.branch)
  } else {
    // Otherwise, start from the first available step.
    const stepId = resolveStartStep(input)
    if (stepId) {
      nextActive = createActive(stepId)
    }
  }

  return {
    input,
    state: {
      ...prev.state,
      ...(nextActive ? { active: nextActive } : {}),
    },
  }
}

function applySelectBranchPath(
  ctx: WalkthroughMachineContext,
  branchId: string,
  pathId: string,
): WalkthroughMachineContext {
  const { input, state } = ctx
  const active = state.active
  if (!active) {
    return ctx
  }

  // Only allow selection when there's a matching option for current decision step.
  const options = getBranchOptions(input, active.stepId)
  if (!options.length) {
    return ctx
  }
  const selected = options.find(
    o => o.branchId === branchId && o.pathId === pathId,
  )
  if (!selected) {
    return ctx
  }

  // Move to first step of the selected path; if path has no steps, stay on decision.
  const collection = input.branchCollections?.find(b => b.branchId === branchId)
  const path = collection?.paths.find(p => p.pathId === pathId)

  const nextStepId = path && path.stepIds.length > 0 ? path.stepIds[0] : active.stepId

  return {
    input,
    state: {
      ...state,
      active: createActive(nextStepId, selected),
    },
  }
}

function applyNext(ctx: WalkthroughMachineContext): WalkthroughMachineContext {
  const { input, state } = ctx
  const next = getNextStep(input, state)
  if (!next) {
    return ctx
  }
  return {
    input,
    state: {
      ...state,
      active: createActive(next, state.active?.branch),
    },
  }
}

function applyPrevious(ctx: WalkthroughMachineContext): WalkthroughMachineContext {
  const { input, state } = ctx
  const prev = getPreviousStep(input, state)
  if (!prev) {
    return ctx
  }
  return {
    input,
    state: {
      ...state,
      active: createActive(prev, state.active?.branch),
    },
  }
}

function applyMarkComplete(
  ctx: WalkthroughMachineContext,
  stepId: string,
): WalkthroughMachineContext {
  const nextState = markStepComplete(ctx.state, stepId)
  // Derive completed paths for consistency.
  const completedPaths = computeCompletedPaths(ctx.input, nextState)
  return {
    input: ctx.input,
    state: {
      ...nextState,
      completedPaths,
    },
  }
}

function applyResetCompletion(
  ctx: WalkthroughMachineContext,
): WalkthroughMachineContext {
  const cleared = resetCompletion(ctx.state)
  return {
    input: ctx.input,
    state: cleared,
  }
}

/**
 * Walkthrough machine.
 *
 * States:
 * - idle: not started
 * - active.navigating: linear navigation
 * - active.branchDecision: current step has branch options available
 *
 * This machine is:
 * - Pure and deterministic
 * - Framework-agnostic (no React / XYFlow / diagram-machine coupling)
 * - Driven solely by WalkthroughContextInput + WalkthroughState
 */
export const walkthroughMachine = setup({
  types: {
    context: {} as WalkthroughMachineContext,
    events: {} as WalkthroughEvent,
  },
}).createMachine({
  id: 'walkthrough',
  initial: 'idle',
  context: ({ input }: { input: WalkthroughContextInput }): WalkthroughMachineContext => ({
    input,
    state: createWalkthroughState(),
  }),
  states: {
    idle: {
      on: {
        START: {
          target: 'active',
          actions: ({ event, context, self }) => {
            const stepId = resolveStartStep(context.input, event.stepId)
            if (!stepId) {
              return
            }

            const branchOptions = getBranchOptions(context.input, stepId)
            const active = createActive(stepId)

            // Initialize state with resolved active step
            const nextCtx: WalkthroughMachineContext = {
              input: context.input,
              state: {
                ...context.state,
                active,
              },
            }

            // Transition internally to the correct substate
            const hasDecision = branchOptions.length > 0
            self.send({
              type: hasDecision ? 'INTERNAL__ENTER_BRANCH_DECISION' : 'INTERNAL__ENTER_NAVIGATING',
              // embed latest context
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any) // Update context
             // Note: In XState v5, we adjust via assign-like semantics in transitions below.
            ;(self as unknown as { context: WalkthroughMachineContext }).context = nextCtx
          },
        },
        UPDATE_FROM_INPUT: {
          actions: ({ event, context, self }) => {
            const next = applyUpdateFromInput(context, event.input)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },
        SYNC_FROM_URL: {
          actions: ({ event, context, self }) => {
            const next = applySyncFromUrl(context, event.encoded)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },
      },
    },

    active: {
      initial: 'navigating',
      on: {
        STOP: {
          target: 'idle',
          actions: ({ context, self }) => {
            // Preserve completion, clear active.
            const next: WalkthroughMachineContext = {
              input: context.input,
              state: {
                ...context.state,
                // omit active
                completedSteps: context.state.completedSteps,
                completedPaths: context.state.completedPaths,
              },
            }
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },

        UPDATE_FROM_INPUT: {
          actions: ({ event, context, self }) => {
            const next = applyUpdateFromInput(context, event.input)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },

        SYNC_FROM_URL: {
          actions: ({ event, context, self }) => {
            const next = applySyncFromUrl(context, event.encoded)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },

        MARK_COMPLETE: {
          actions: ({ event, context, self }) => {
            const next = applyMarkComplete(context, event.stepId)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },

        RESET_COMPLETION: {
          actions: ({ context, self }) => {
            const next = applyResetCompletion(context)
            ;(self as unknown as { context: WalkthroughMachineContext }).context = next
          },
        },
      },
      states: {
        navigating: {
          on: {
            NEXT: {
              target: 'navigating',
              actions: ({ context, self }) => {
                const next = applyNext(context)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = next

                const active = next.state.active
                if (!active) {
                  return
                }
                const hasDecision = getBranchOptions(next.input, active.stepId).length > 0
                if (hasDecision) {
                  self.send({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    type: 'INTERNAL__TO_BRANCH_DECISION',
                  } as any)
                }
              },
            },
            PREVIOUS: {
              target: 'navigating',
              actions: ({ context, self }) => {
                const next = applyPrevious(context)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = next
              },
            },
            SELECT_BRANCH_PATH: {
              // Selecting a branch path at a decision step moves us into navigating.
              target: 'navigating',
              actions: ({ event, context, self }) => {
                const next = applySelectBranchPath(context, event.branchId, event.pathId)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = next
              },
            },
            // Internal from START when first step is a decision
            INTERNAL__ENTER_BRANCH_DECISION: {
              target: 'branchDecision',
            },
          },
        },
        branchDecision: {
          on: {
            SELECT_BRANCH_PATH: {
              target: 'navigating',
              actions: ({ event, context, self }) => {
                const next = applySelectBranchPath(context, event.branchId, event.pathId)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = next
              },
            },
            NEXT: {
              target: 'navigating',
              actions: ({ context, self }) => {
                // If NEXT is pressed while in decision state without explicit selection,
                // follow default path if defined; otherwise fall back to linear NEXT.
                const active = context.state.active
                if (!active) {
                  const nextCtx = applyNext(context)
                  ;(self as unknown as { context: WalkthroughMachineContext }).context = nextCtx
                  return
                }

                const options = getBranchOptions(context.input, active.stepId)
                if (options.length === 0) {
                  const nextCtx = applyNext(context)
                  ;(self as unknown as { context: WalkthroughMachineContext }).context = nextCtx
                  return
                }

                const branchIds = Array.from(new Set(options.map(o => o.branchId)))
                const selectedBranchId = branchIds[0]
                const def = getDefaultBranchPath(context.input, selectedBranchId)
                if (def) {
                  const nextCtx = applySelectBranchPath(context, def.branchId, def.pathId)
                  ;(self as unknown as { context: WalkthroughMachineContext }).context = nextCtx
                  return
                }

                const nextCtx = applyNext(context)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = nextCtx
              },
            },
            PREVIOUS: {
              target: 'navigating',
              actions: ({ context, self }) => {
                const next = applyPrevious(context)
                ;(self as unknown as { context: WalkthroughMachineContext }).context = next
              },
            },
            INTERNAL__TO_BRANCH_DECISION: {
              target: 'branchDecision',
            },
          },
        },
      },
    },
  },
})

/**
 * Public helper: encode current machine context into URL token.
 *
 * Consumers outside XState can use this together with decodeWalkthroughState
 * without coupling to the machine implementation details.
 */
export function encodeFromMachineContext(ctx: WalkthroughMachineContext): string {
  return encodeWalkthroughState(ctx.input.viewId, ctx.state)
}
