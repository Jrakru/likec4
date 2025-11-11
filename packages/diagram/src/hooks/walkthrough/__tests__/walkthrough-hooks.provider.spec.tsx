import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import type { WalkthroughContextInput } from '../../../likec4diagram/state/walkthrough/types'
import { useWalkthrough } from '../useWalkthrough'
import { useWalkthroughActions } from '../useWalkthroughActions'
import { WalkthroughProvider } from '../WalkthroughProvider'

function wrapperWithInput(input: WalkthroughContextInput): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }) {
    return <WalkthroughProvider input={input}>{children}</WalkthroughProvider>
  }
}

describe('walkthrough hooks - provider and core actions', () => {
  const input: WalkthroughContextInput = {
    viewId: 'v1',
    stepIds: ['s1', 's2', 's3'],
  }

  it('useWalkthrough throws outside provider', () => {
    // React 18+: Use expect().toThrow() instead of result.error
    expect(() => {
      renderHook(() => useWalkthrough())
    }).toThrow('WalkthroughProvider')
  })

  it('useWalkthroughActions throws outside provider', () => {
    // React 18+: Use expect().toThrow() instead of result.error
    expect(() => {
      renderHook(() => useWalkthroughActions())
    }).toThrow('WalkthroughProvider')
  })

  it('exposes initial idle state until START is called', () => {
    const wrapper = wrapperWithInput(input)

    // Both hooks must be in same renderHook to share the same provider/actor
    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
      }),
      { wrapper },
    )

    // Initially idle: no active step, no completion.
    expect(result.current.walkthrough.active).toBeUndefined()
    expect(result.current.walkthrough.completedSteps.size).toBe(0)
    expect(result.current.walkthrough.completedPaths.size).toBe(0)

    // START should move to first step (s1)
    act(() => {
      result.current.actions.start()
    })
    expect(result.current.walkthrough.active).toEqual(
      expect.objectContaining({
        stepId: 's1',
      }),
    )
  })

  it('supports explicit START stepId when valid', () => {
    const wrapper = wrapperWithInput(input)

    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
      }),
      { wrapper },
    )

    act(() => {
      result.current.actions.start('s2')
    })

    expect(result.current.walkthrough.active).toEqual(
      expect.objectContaining({
        stepId: 's2',
      }),
    )
  })

  it('NEXT and PREVIOUS follow navigation semantics', () => {
    const wrapper = wrapperWithInput(input)

    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
      }),
      { wrapper },
    )

    act(() => {
      result.current.actions.start()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s1')

    act(() => {
      result.current.actions.next()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s2')

    act(() => {
      result.current.actions.next()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s3')

    // At end: NEXT should be a no-op (per getNextStep)
    act(() => {
      result.current.actions.next()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s3')

    // PREVIOUS should move back
    act(() => {
      result.current.actions.previous()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s2')

    act(() => {
      result.current.actions.previous()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s1')

    // At beginning: PREVIOUS is a no-op
    act(() => {
      result.current.actions.previous()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s1')
  })

  it('STOP returns to idle without losing completion state', () => {
    const wrapper = wrapperWithInput(input)

    const { result } = renderHook(
      () => ({
        walkthrough: useWalkthrough(),
        actions: useWalkthroughActions(),
      }),
      { wrapper },
    )

    act(() => {
      result.current.actions.start()
    })
    expect(result.current.walkthrough.active?.stepId).toBe('s1')

    act(() => {
      result.current.actions.markComplete('s1')
    })
    expect(result.current.walkthrough.completedSteps.has('s1')).toBe(true)

    act(() => {
      result.current.actions.stop()
    })

    // active cleared
    expect(result.current.walkthrough.active).toBeUndefined()
    // completion kept
    expect(result.current.walkthrough.completedSteps.has('s1')).toBe(true)
  })
})
