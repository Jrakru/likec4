import React from 'react'
import { useBranchSelection } from '../../hooks/walkthrough/useBranchSelection'
import { useWalkthrough } from '../../hooks/walkthrough/useWalkthrough'
import { useWalkthroughActions } from '../../hooks/walkthrough/useWalkthroughActions'
import { useWalkthroughCompletion } from '../../hooks/walkthrough/useWalkthroughCompletion'
import { useWalkthroughURL } from '../../hooks/walkthrough/useWalkthroughURL'
import { WalkthroughProvider } from '../../hooks/walkthrough/WalkthroughProvider'
import { NavigationPanel } from '../NavigationPanel'

const branchingInput = {
  viewId: 'demo-branching',
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
      id: 's2a',
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Step 2A',
          },
        ],
      },
    },
    {
      id: 's2b',
      notes: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            text: 'Step 2B',
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
  stepIds: ['s1', 's2a', 's2b', 's3'],
  branchCollections: [
    {
      branchId: 'decision-1',
      kind: 'exclusive',
      decisionStepId: 's1',
      paths: [
        {
          pathId: 'path-a',
          isDefaultPath: true,
          stepIds: ['s2a', 's3'],
        },
        {
          pathId: 'path-b',
          isDefaultPath: false,
          stepIds: ['s2b', 's3'],
        },
      ],
    },
  ],
} as const

function BranchingDebug() {
  const { active } = useWalkthrough()
  const { start, next, previous, stop, selectBranchPath } = useWalkthroughActions()
  const { overall } = useWalkthroughCompletion()
  const { read } = useWalkthroughURL()
  const { activeBranch } = useBranchSelection()

  const urlToken = read() ?? ''

  return (
    <div>
      <div>
        <button
          type="button"
          data-testid="wt-branching-start"
          onClick={() => start()}
        >
          start
        </button>
        <button
          type="button"
          data-testid="wt-branching-next"
          onClick={() => next()}
        >
          next
        </button>
        <button
          type="button"
          data-testid="wt-branching-prev"
          onClick={() => previous()}
        >
          prev
        </button>
        <button
          type="button"
          data-testid="wt-branching-stop"
          onClick={() => stop()}
        >
          stop
        </button>
        <button
          type="button"
          data-testid="wt-branching-select-path-a"
          onClick={() => selectBranchPath('decision-1', 'path-a')}
        >
          path-a
        </button>
        <button
          type="button"
          data-testid="wt-branching-select-path-b"
          onClick={() => selectBranchPath('decision-1', 'path-b')}
        >
          path-b
        </button>
      </div>

      <div data-testid="wt-branching-active-step">
        {active?.stepId ?? 'none'}
      </div>
      <div data-testid="wt-branching-active-branch">
        {(active?.branch?.branchId ?? '') + ':' + (active?.branch?.pathId ?? '')}
      </div>
      <div data-testid="wt-branching-progress">
        {overall.completedSteps}/{overall.totalSteps}
      </div>
      <div data-testid="wt-branching-url-token">
        {urlToken}
      </div>
      <div data-testid="wt-branching-branch-active">
        {activeBranch
          ? `${activeBranch.branchId}/${activeBranch.pathId}`
          : ''}
      </div>
    </div>
  )
}

export function WalkthroughHarnessBranching() {
  return (
    <WalkthroughProvider input={branchingInput}>
      <NavigationPanel />
      <BranchingDebug />
    </WalkthroughProvider>
  )
}
