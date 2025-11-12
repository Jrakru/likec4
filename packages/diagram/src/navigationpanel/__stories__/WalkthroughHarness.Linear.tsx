import React from 'react'
import { useWalkthrough } from '../../hooks/walkthrough/useWalkthrough'
import { useWalkthroughCompletion } from '../../hooks/walkthrough/useWalkthroughCompletion'
import { WalkthroughProvider } from '../../hooks/walkthrough/WalkthroughProvider'
import { NavigationPanel } from '../NavigationPanel'

const linearInput = {
  viewId: 'demo-linear',
  steps: [
    {
      id: 's1',
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Step 1',
          },
        ],
      },
    },
    {
      id: 's2',
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Step 2',
          },
        ],
      },
    },
    {
      id: 's3',
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Step 3',
          },
        ],
      },
    },
  ],
  stepIds: ['s1', 's2', 's3'],
} as const

function LinearDebug() {
  const { active } = useWalkthrough()
  const { overall } = useWalkthroughCompletion()

  return (
    <div>
      <div data-testid="wt-linear-active-step">
        {active?.stepId ?? 'none'}
      </div>
      <div data-testid="wt-linear-progress">
        {overall.completedSteps}/{overall.totalSteps}
      </div>
    </div>
  )
}

export function WalkthroughHarnessLinear() {
  return (
    <WalkthroughProvider input={linearInput}>
      <NavigationPanel />
      <LinearDebug />
    </WalkthroughProvider>
  )
}
