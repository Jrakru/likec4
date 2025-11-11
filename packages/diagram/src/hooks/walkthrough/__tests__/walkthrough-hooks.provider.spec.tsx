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
    const { result } = renderHook(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useWalkthrough()
    })

    expect(result.error).toBeInstanceOf(Error)
    expect(String(result.error?.message)).toContain('WalkthroughProvider')
  })

  it('useWalkthroughActions throws outside provider', () => {
    const { result } = renderHook(() => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useWalkthroughActions()
    })

    expect(result.error).toBeInstanceOf(Error)
    expect(String(result.error?.message)).toContain('WalkthroughProvider')
  })

  it('exposes initial idle state until START is called', () => {
    const wrapper = wrapperWithInput(input)

    const { result: walkthroughResult } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actionsResult } = renderHook(() => useWalkthroughActions(), { wrapper })

    // Initially idle: no active step, no completion.
    expect(walkthroughResult.current.active).toBeUndefined()
    expect(walkthroughResult.current.completedSteps.size).toBe(0)
    expect(walkthroughResult.current.completedPaths.size).toBe(0)

    // START should move to first step (s1)
    act(() => {
      actionsResult.current.start()
    })
    expect(walkthroughResult.current.active).toEqual(
      expect.objectContaining({
        stepId: 's1',
      }),
    )
  })

  it('supports explicit START stepId when valid', () => {
    const wrapper = wrapperWithInput(input)

    const { result: walkthroughResult } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actionsResult } = renderHook(() => useWalkthroughActions(), { wrapper })

    act(() => {
      actionsResult.current.start('s2')
    })

    expect(walkthroughResult.current.active).toEqual(
      expect.objectContaining({
        stepId: 's2',
      }),
    )
  })

  it('NEXT and PREVIOUS follow navigation semantics', () => {
    const wrapper = wrapperWithInput(input)

    const { result: walkthroughResult } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actionsResult } = renderHook(() => useWalkthroughActions(), { wrapper })

    act(() => {
      actionsResult.current.start()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s1')

    act(() => {
      actionsResult.current.next()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s2')

    act(() => {
      actionsResult.current.next()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s3')

    // At end: NEXT should be a no-op (per getNextStep)
    act(() => {
      actionsResult.current.next()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s3')

    // PREVIOUS should move back
    act(() => {
      actionsResult.current.previous()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s2')

    act(() => {
      actionsResult.current.previous()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s1')

    // At beginning: PREVIOUS is a no-op
    act(() => {
      actionsResult.current.previous()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s1')
  })

  it('STOP returns to idle without losing completion state', () => {
    const wrapper = wrapperWithInput(input)

    const { result: walkthroughResult } = renderHook(() => useWalkthrough(), { wrapper })
    const { result: actionsResult } = renderHook(() => useWalkthroughActions(), { wrapper })

    act(() => {
      actionsResult.current.start()
    })
    expect(walkthroughResult.current.active?.stepId).toBe('s1')

    act(() => {
      actionsResult.current.markComplete('s1')
    })
    expect(walkthroughResult.current.completedSteps.has('s1')).toBe(true)

    act(() => {
      actionsResult.current.stop()
    })

    // active cleared
    expect(walkthroughResult.current.active).toBeUndefined()
    // completion kept
    expect(walkthroughResult.current.completedSteps.has('s1')).toBe(true)
  })
})
