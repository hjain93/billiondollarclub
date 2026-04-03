import { describe, it, expect } from 'vitest'
import { canAccess, featureTier, tierIndex, TIER_LIMITS, FEATURE_TIERS } from './entitlements'
import type { PricingTier } from '../types'

describe('tierIndex', () => {
  it('ranks tiers correctly', () => {
    expect(tierIndex('free')).toBeLessThan(tierIndex('creator'))
    expect(tierIndex('creator')).toBeLessThan(tierIndex('pro'))
    expect(tierIndex('pro')).toBeLessThan(tierIndex('agency'))
  })
})

describe('canAccess', () => {
  it('free user can access free features', () => {
    expect(canAccess('command-center', 'free')).toBe(true)
    expect(canAccess('idea-engine', 'free')).toBe(true)
    expect(canAccess('gear-guide', 'free')).toBe(true)
    expect(canAccess('niche-finder', 'free')).toBe(true)
  })

  it('free user cannot access creator+ features', () => {
    expect(canAccess('studio', 'free')).toBe(false)
    expect(canAccess('analytics', 'free')).toBe(false)
    expect(canAccess('brand-deals', 'free')).toBe(false)
    expect(canAccess('income', 'free')).toBe(false)
  })

  it('free user cannot access pro features', () => {
    expect(canAccess('video-brief', 'free')).toBe(false)
    expect(canAccess('thumbnail-lab', 'free')).toBe(false)
    expect(canAccess('audit', 'free')).toBe(false)
  })

  it('creator user can access creator features', () => {
    expect(canAccess('studio', 'creator')).toBe(true)
    expect(canAccess('analytics', 'creator')).toBe(true)
    expect(canAccess('brand-deals', 'creator')).toBe(true)
  })

  it('creator user cannot access pro features', () => {
    expect(canAccess('video-brief', 'creator')).toBe(false)
    expect(canAccess('thumbnail-lab', 'creator')).toBe(false)
    expect(canAccess('audit', 'creator')).toBe(false)
  })

  it('pro user can access all pro and below', () => {
    expect(canAccess('video-brief', 'pro')).toBe(true)
    expect(canAccess('thumbnail-lab', 'pro')).toBe(true)
    expect(canAccess('studio', 'pro')).toBe(true)
    expect(canAccess('command-center', 'pro')).toBe(true)
  })

  it('pro user cannot access agency features', () => {
    expect(canAccess('autopilot', 'pro')).toBe(false)
    expect(canAccess('invoices', 'pro')).toBe(false)
    expect(canAccess('cfo', 'pro')).toBe(false)
  })

  it('agency user can access everything', () => {
    const agencyFeatures: PricingTier[] = ['free', 'creator', 'pro', 'agency']
    agencyFeatures.forEach(() => {
      expect(canAccess('autopilot', 'agency')).toBe(true)
      expect(canAccess('video-brief', 'agency')).toBe(true)
      expect(canAccess('command-center', 'agency')).toBe(true)
    })
  })

  it('returns true for unknown feature IDs (open by default)', () => {
    expect(canAccess('unknown-future-feature', 'free')).toBe(true)
  })
})

describe('featureTier', () => {
  it('returns correct tier for known features', () => {
    expect(featureTier('command-center')).toBe('free')
    expect(featureTier('studio')).toBe('creator')
    expect(featureTier('video-brief')).toBe('pro')
    expect(featureTier('autopilot')).toBe('agency')
  })

  it('returns null for unknown features', () => {
    expect(featureTier('unknown-xyz')).toBeNull()
  })
})

describe('TIER_LIMITS', () => {
  it('free tier has the most restrictive limits', () => {
    expect(TIER_LIMITS.free.aiGenerationsPerMonth).toBeLessThan(TIER_LIMITS.creator.aiGenerationsPerMonth)
    expect(TIER_LIMITS.creator.aiGenerationsPerMonth).toBeLessThan(TIER_LIMITS.pro.aiGenerationsPerMonth)
  })

  it('agency tier has infinite AI generations', () => {
    expect(TIER_LIMITS.agency.aiGenerationsPerMonth).toBe(Infinity)
  })

  it('free tier has 0 brand deals', () => {
    expect(TIER_LIMITS.free.brandDealsCount).toBe(0)
  })

  it('agency tier has unlimited brand deals', () => {
    expect(TIER_LIMITS.agency.brandDealsCount).toBe(Infinity)
  })

  it('all tiers are defined', () => {
    const tiers: PricingTier[] = ['free', 'creator', 'pro', 'agency']
    tiers.forEach(tier => {
      expect(TIER_LIMITS[tier]).toBeDefined()
      expect(typeof TIER_LIMITS[tier].aiGenerationsPerMonth).toBe('number')
    })
  })
})

describe('FEATURE_TIERS completeness', () => {
  it('has entries for all core views', () => {
    const coreViews = ['command-center', 'idea-engine', 'calendar', 'studio', 'video-brief', 'audit', 'autopilot']
    coreViews.forEach(view => {
      expect(FEATURE_TIERS[view]).toBeDefined()
    })
  })

  it('has no undefined tier values', () => {
    Object.entries(FEATURE_TIERS).forEach(([_key, tier]) => {
      expect(['free', 'creator', 'pro', 'agency']).toContain(tier)
    })
  })
})
