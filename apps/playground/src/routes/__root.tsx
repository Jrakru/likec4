import { WalkthroughHarnessApp } from '@likec4/diagram/navigationpanel/__stories__/WalkthroughHarnessApp'
import { useMantineColorScheme } from '@mantine/core'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

const asTheme = (v: unknown): 'light' | 'dark' | undefined => {
  if (typeof v !== 'string') {
    return undefined
  }
  const vlower = v.toLowerCase()
  if (vlower === 'light' || vlower === 'dark') {
    return vlower
  }
  return undefined
}

export type SearchParams = {
  theme?: 'light' | 'dark' | undefined
}

export const Route = createRootRouteWithContext<{}>()({
  component: RootComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      theme: asTheme(search['theme']),
    }
  },
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <ThemeSync />
    </>
  )
}

// Test-only E2E harness routes for walkthrough behaviour.
// These are minimal and do not affect normal playground navigation.
export const WalkthroughLinearRoute = Route.createRoute({
  id: 'e2e-walkthrough-linear',
  path: '/e2e/walkthrough-linear',
  component: () => <WalkthroughHarnessApp variant="linear" />,
})

export const WalkthroughBranchingRoute = Route.createRoute({
  id: 'e2e-walkthrough-branching',
  path: '/e2e/walkthrough-branching',
  component: () => <WalkthroughHarnessApp variant="branching" />,
})

const ThemeSync = () => {
  const { theme } = Route.useSearch()
  const mantineColorScheme = useMantineColorScheme()

  useEffect(() => {
    if (!theme) {
      return
    }
    if (theme !== mantineColorScheme.colorScheme) {
      mantineColorScheme.setColorScheme(theme)
    }
  }, [theme])

  return null
}
