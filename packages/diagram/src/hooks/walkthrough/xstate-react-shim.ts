import { useInterpret as realUseInterpret, useSelector as realUseSelector } from '@xstate/react'

if (typeof realUseInterpret !== 'function') {
  throw new Error(
    '[walkthrough:xstate-react-shim] useInterpret is not a function. ' +
      'This indicates a mismatch between @xstate/react and xstate versions or incorrect module resolution. ' +
      'Ensure a single, workspace-level @xstate/react compatible with xstate v5 is installed.',
  )
}

if (typeof realUseSelector !== 'function') {
  throw new Error(
    '[walkthrough:xstate-react-shim] useSelector is not a function. ' +
      'This indicates a mismatch between @xstate/react and xstate versions or incorrect module resolution. ' +
      'Ensure a single, workspace-level @xstate/react compatible with xstate v5 is installed.',
  )
}

export const useInterpret = realUseInterpret
export const useSelector = realUseSelector
