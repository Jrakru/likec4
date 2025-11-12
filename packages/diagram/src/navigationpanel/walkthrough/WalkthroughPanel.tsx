import { RichText } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  ScrollAreaAutosize,
} from '@mantine/core'
import { Markdown } from '../../base-primitives'
import { useWalkthrough } from '../../hooks/walkthrough/useWalkthrough'
import { useWalkthroughActorContext } from '../../hooks/walkthrough/WalkthroughProvider'

const SectionHeader = styled('div', {
  base: {
    fontSize: 'xs',
    color: 'mantine.colors.dimmed',
    fontWeight: 500,
    userSelect: 'none',
    mb: 'xxs',
  },
})

export const WalkthroughPanel = () => {
  const { active } = useWalkthrough()
  const { snapshot } = useWalkthroughActorContext()

  if (!active) {
    // No active walkthrough: no notes to display.
    return null
  }

  // WalkthroughProvider exposes the walkthroughMachine snapshot.
  // Its context includes `input`, which is the WalkthroughContextInput provided by the host.
  const ctx = snapshot.context as {
    input?: {
      steps?: ReadonlyArray<{
        id: string
        notes?: unknown
      }>
    }
  }

  const steps = ctx.input?.steps ?? []
  const stepId = active.stepId

  const notes = (steps.find(step => step.id === stepId)?.notes as RichText | undefined) ?? RichText.EMPTY

  if (!notes || notes.isEmpty) {
    return null
  }

  return (
    <styled.div position={'relative'}>
      <ScrollAreaAutosize
        className={cx(
          'nowheel nopan nodrag',
          vstack({
            position: 'absolute',
            layerStyle: 'likec4.dropdown',
            gap: 'sm',
            padding: 'md',
            paddingTop: 'xxs',
            pointerEvents: 'all',
            maxWidth: 'calc(100cqw - 32px)',
            minWidth: 'calc(100cqw - 50px)',
            maxHeight: 'calc(100cqh - 100px)',
            width: 'max-content',
            cursor: 'default',
            overflow: 'auto',
            overscrollBehavior: 'contain',
            '@/sm': {
              minWidth: 400,
              maxWidth: 550,
            },
            '@/lg': {
              maxWidth: 700,
            },
          }),
        )}
        // miw={180}
        // maw={450}
        // mah={350}
        type="scroll"
        // mt={2}
      >
        <SectionHeader>Notes</SectionHeader>
        <Markdown
          value={notes}
          fontSize="sm"
          emptyText="No description"
          className={css({
            userSelect: 'all',
          })}
        />
      </ScrollAreaAutosize>
    </styled.div>
  )
}
