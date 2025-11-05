import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Store original env before tests
const originalEnv = process.env

describe('Feature Flags', () => {
  beforeEach(() => {
    // Reset env for each test
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
  })

  describe('Environment variable parsing', () => {
    it('should enable flag when LIKEC4_UNIFIED_BRANCHES is "true"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'true'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should enable flag when LIKEC4_UNIFIED_BRANCHES is "yes"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'yes'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should enable flag when LIKEC4_UNIFIED_BRANCHES is "1"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = '1'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should disable flag when LIKEC4_UNIFIED_BRANCHES is "false"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'false'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should disable flag when LIKEC4_UNIFIED_BRANCHES is "no"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'no'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should disable flag when LIKEC4_UNIFIED_BRANCHES is "0"', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = '0'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should fall back to legacy LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES env var', async () => {
      process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES'] = 'true'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should prefer LIKEC4_UNIFIED_BRANCHES over legacy env var', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'false'
      process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES'] = 'true'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should default to false when no env var is set', async () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      delete process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES']
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should handle invalid env values as false', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'invalid'
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should handle empty string as false', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = ''
      const { isDynamicBranchCollectionsEnabled } = await import('../featureFlags')
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })
  })

  describe('Programmatic flag control', () => {
    it('should allow enabling flag programmatically', async () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      const {
        isDynamicBranchCollectionsEnabled,
        enableDynamicBranchCollections,
      } = await import('../featureFlags')

      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should allow disabling flag programmatically', async () => {
      process.env['LIKEC4_UNIFIED_BRANCHES'] = 'true'
      const {
        isDynamicBranchCollectionsEnabled,
        disableDynamicBranchCollections,
      } = await import('../featureFlags')

      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
    })

    it('should allow toggling flag multiple times', async () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      const {
        isDynamicBranchCollectionsEnabled,
        enableDynamicBranchCollections,
        disableDynamicBranchCollections,
      } = await import('../featureFlags')

      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
      disableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(false)
      enableDynamicBranchCollections()
      expect(isDynamicBranchCollectionsEnabled()).toBe(true)
    })

    it('should allow using setFeatureFlag directly', async () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      const { isFeatureEnabled, setFeatureFlag } = await import('../featureFlags')

      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
      setFeatureFlag('dynamicBranchCollections', true)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(true)
      setFeatureFlag('dynamicBranchCollections', false)
      expect(isFeatureEnabled('dynamicBranchCollections')).toBe(false)
    })
  })

  describe('Proxy behavior', () => {
    it('should reflect state changes through proxy', async () => {
      delete process.env['LIKEC4_UNIFIED_BRANCHES']
      const { featureFlags, enableDynamicBranchCollections } = await import('../featureFlags')

      expect(featureFlags.dynamicBranchCollections).toBe(false)
      enableDynamicBranchCollections()
      expect(featureFlags.dynamicBranchCollections).toBe(true)
    })
  })
})
