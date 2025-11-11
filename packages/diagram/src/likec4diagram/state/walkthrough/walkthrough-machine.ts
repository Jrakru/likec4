import { assign, createMachine, setup } from 'xstate'
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
  }
  // If there was no previous active step, stay idle (don't auto-start).

  const nextState: WalkthroughState = nextActive
    ? {
      ...prev.state,
      active: nextActive,
    }
    : {
      completedSteps: prev.state.completedSteps,
      completedPaths: prev.state.completedPaths,
      // no active field - stay idle
    }

  return {
    input,
    state: nextState,
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
          target: 'active.navigating',
          actions: assign(({ event, context }) => {
            const stepId = resolveStartStep(context.input, event.stepId)
            if (!stepId) {
              return context
            }

            const active = createActive(stepId)

            return {
              ...context,
              state: {
                ...context.state,
                active,
              },
            }
          }),
        },
        UPDATE_FROM_INPUT: {
          actions: assign(({ event, context }) => applyUpdateFromInput(context, event.input)),
        },
        SYNC_FROM_URL: {
          actions: assign(({ event, context }) => applySyncFromUrl(context, event.encoded)),
        },
      },
    },

    active: {
      initial: 'navigating',
      on: {
        STOP: {
          target: 'idle',
          actions: assign(({ context }) => ({
            input: context.input,
            state: {
              completedSteps: context.state.completedSteps,
              completedPaths: context.state.completedPaths,
              // omit active - explicitly not including it
            },
          })),
        },

        UPDATE_FROM_INPUT: {
          actions: assign(({ event, context }) => applyUpdateFromInput(context, event.input)),
        },

        SYNC_FROM_URL: {
          actions: assign(({ event, context }) => applySyncFromUrl(context, event.encoded)),
        },

        MARK_COMPLETE: {
          actions: assign(({ event, context }) => applyMarkComplete(context, event.stepId)),
        },

        RESET_COMPLETION: {
          actions: assign(({ context }) => applyResetCompletion(context)),
        },
      },
      states: {
        navigating: {
          on: {
            NEXT: {
              target: 'navigating',
              actions: assign(({ context }) => applyNext(context)),
            },
            PREVIOUS: {
              target: 'navigating',
              actions: assign(({ context }) => applyPrevious(context)),
            },
            SELECT_BRANCH_PATH: {
              // Selecting a branch path at a decision step moves us into navigating.
              target: 'navigating',
              actions: assign(({ event, context }) =>
                applySelectBranchPath(context, event.branchId, event.pathId)
              ),
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
              actions: assign(({ event, context }) =>
                applySelectBranchPath(context, event.branchId, event.pathId)
              ),
            },
            NEXT: {
              target: 'navigating',
              actions: assign(({ context }) => {
                // If NEXT is pressed while in decision state without explicit selection,
                // follow default path if defined; otherwise fall back to linear NEXT.
                const active = context.state.active
                if (!active) {
                  return applyNext(context)
                }

                const options = getBranchOptions(context.input, active.stepId)
                if (options.length === 0) {
                  return applyNext(context)
                }

                const branchIds = Array.from(new Set(options.map(o => o.branchId)))
                const selectedBranchId = branchIds[0]
                const def = getDefaultBranchPath(context.input, selectedBranchId)
                if (def) {
                  return applySelectBranchPath(context, def.branchId, def.pathId)
                }

                return applyNext(context)
              }),
            },
            PREVIOUS: {
              target: 'navigating',
              actions: assign(({ context }) => applyPrevious(context)),
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
