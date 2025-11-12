import React from 'react'
import { WalkthroughHarnessBranching } from './WalkthroughHarness.Branching'
import { WalkthroughHarnessLinear } from './WalkthroughHarness.Linear'

export function WalkthroughHarnessApp(props: { variant: 'linear' | 'branching' }) {
  const { variant } = props
  return variant === 'linear'
    ? <WalkthroughHarnessLinear />
    : <WalkthroughHarnessBranching />
}
