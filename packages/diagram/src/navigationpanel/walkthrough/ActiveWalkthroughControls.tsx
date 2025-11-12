import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { Badge, Button, Portal } from '@mantine/core'
import {
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStopFilled,
} from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { isTruthy } from 'remeda'
import { useMantinePortalProps } from '../../hooks'
import { useWalkthrough } from '../../hooks/walkthrough/useWalkthrough'
import { useWalkthroughActions } from '../../hooks/walkthrough/useWalkthroughActions'
import { useWalkthroughCompletion } from '../../hooks/walkthrough/useWalkthroughCompletion'
import { TriggerWalkthroughButton } from './DynamicViewControls'

const PrevNextButton = Button.withProps({
  // Button is polymorphic, but we dont want it to inherit the motion props
  component: m.button as any as 'button',
  variant: 'light',
  size: 'xs',
  fw: '500',
})

const ParallelFrame = () => {
  const { portalProps } = useMantinePortalProps()
  return (
    <Portal {...portalProps}>
      <Box
        css={{
          position: 'absolute',
          margin: '0',
          padding: '0',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          border: `2px solid`,
          borderColor: 'mantine.colors.orange[6]',
          pointerEvents: 'none',
          md: {
            borderWidth: 4,
          },
        }}
      >
      </Box>
    </Portal>
  )
}

export function ActiveWalkthroughControls() {
  const { active } = useWalkthrough()
  const { next, previous, stop } = useWalkthroughActions()
  const { overall } = useWalkthroughCompletion()

  if (!active) {
    // No active walkthrough: render nothing to keep UI stable and no-op safe.
    return null
  }

  const {
    totalSteps,
    completedSteps,
    isParallel,
  } = overall

  const hasSteps = totalSteps > 0
  const currentStep = hasSteps
    ? Math.min(completedSteps + 1, totalSteps)
    : 0

  const hasPrevious = hasSteps && currentStep > 1
  const hasNext = hasSteps && currentStep < totalSteps

  return (
    <AnimatePresence propagate>
      <TriggerWalkthroughButton
        key="stop-walkthrough"
        variant="light"
        size="xs"
        color="orange"
        mr="sm"
        onClick={e => {
          e.stopPropagation()
          stop()
        }}
        rightSection={<IconPlayerStopFilled size={10} />}
      >
        Stop
      </TriggerWalkthroughButton>

      <PrevNextButton
        key="prev"
        disabled={!hasPrevious}
        onClick={e => {
          e.stopPropagation()
          previous()
        }}
        leftSection={<IconPlayerSkipBackFilled size={10} />}
      >
        Previous
      </PrevNextButton>

      {hasSteps && (
        <Badge
          key="step-badge"
          component={m.div}
          size="md"
          radius="sm"
          variant={isParallel ? 'gradient' : 'transparent'}
          gradient={{ from: 'red', to: 'orange', deg: 90 }}
          rightSection={
            <m.div
              className={css({
                fontSize: 'xxs',
                display: isParallel ? 'block' : 'none',
              })}
            >
              parallel
            </m.div>
          }
          className={css({
            alignItems: 'baseline',
          })}
        >
          <m.span>
            {currentStep} / {totalSteps}
          </m.span>
        </Badge>
      )}

      <PrevNextButton
        key="next"
        disabled={!hasNext}
        onClick={e => {
          e.stopPropagation()
          next()
        }}
        rightSection={<IconPlayerSkipForwardFilled size={10} />}
      >
        Next
      </PrevNextButton>

      {isParallel && <ParallelFrame key="parallel-frame" />}
    </AnimatePresence>
  )
}
