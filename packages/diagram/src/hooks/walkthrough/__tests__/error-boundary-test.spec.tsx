/**
 * Minimal test to understand error boundary behavior with renderHook
 */
import { renderHook } from '@testing-library/react'
import { createContext, useContext } from 'react'
import { describe, expect, it } from 'vitest'

describe('Error boundary pattern investigation', () => {
  const TestContext = createContext<{ value: string } | null>(null)

  function useTestHook() {
    const ctx = useContext(TestContext)
    if (!ctx) {
      throw new Error('useTestHook must be used within TestProvider')
    }
    return ctx
  }

  it('should capture error when hook throws outside provider', () => {
    // React 18+: Use expect().toThrow() instead of result.error
    expect(() => {
      renderHook(() => useTestHook())
    }).toThrow('TestProvider')
  })

  it('should work when inside provider', () => {
    const { result } = renderHook(() => useTestHook(), {
      wrapper: ({ children }) => (
        <TestContext.Provider value={{ value: 'test' }}>{children}</TestContext.Provider>
      ),
    })

    expect(result.error).toBeUndefined()
    expect(result.current.value).toBe('test')
  })
})
