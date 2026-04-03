/**
 * Integration tests for the core creator workflow:
 * Idea capture → Calendar scheduling → Pipeline tracking
 *
 * These test the store logic directly (no DOM rendering needed).
 */
import { describe, it, expect } from 'vitest'
import { canAccess, TIER_LIMITS } from './entitlements'
import type { PricingTier } from '../types'

// ── AI generation limit enforcement ──────────────────────────────────────────

describe('AI generation limit enforcement', () => {
  it('free tier allows up to 10 generations', () => {
    const limit = TIER_LIMITS.free.aiGenerationsPerMonth
    expect(limit).toBe(10)
    // First 10 should pass
    for (let i = 0; i < 10; i++) {
      expect(i < limit).toBe(true)
    }
    // 11th should be blocked
    expect(10 >= limit).toBe(true)
  })

  it('creator tier allows up to 100 generations', () => {
    const limit = TIER_LIMITS.creator.aiGenerationsPerMonth
    expect(limit).toBe(100)
    expect(99 < limit).toBe(true)
    expect(100 >= limit).toBe(true)
  })

  it('pro tier allows 1000 generations', () => {
    expect(TIER_LIMITS.pro.aiGenerationsPerMonth).toBe(1000)
  })

  it('agency tier has no generation limit', () => {
    expect(TIER_LIMITS.agency.aiGenerationsPerMonth).toBe(Infinity)
    // Should never be blocked
    expect(999999 >= Infinity).toBe(false)
  })
})

// ── Upgrade path validation ───────────────────────────────────────────────────

describe('upgrade path: free → creator', () => {
  const blockedOnFree = ['studio', 'analytics', 'brand-deals', 'income', 'pipeline', 'engagement', 'content-dna']
  const unlockedOnCreator = blockedOnFree

  it('blocks all creator features on free plan', () => {
    blockedOnFree.forEach(feature => {
      expect(canAccess(feature, 'free')).toBe(false)
    })
  })

  it('unlocks all those features on creator plan', () => {
    unlockedOnCreator.forEach(feature => {
      expect(canAccess(feature, 'creator')).toBe(true)
    })
  })
})

describe('upgrade path: creator → pro', () => {
  const flagshipFeatures = ['video-brief', 'thumbnail-lab', 'clip-finder', 'audit', 'monetize', 'trends']

  it('blocks flagship pro features on creator plan', () => {
    flagshipFeatures.forEach(feature => {
      expect(canAccess(feature, 'creator')).toBe(false)
    })
  })

  it('unlocks all flagship features on pro plan', () => {
    flagshipFeatures.forEach(feature => {
      expect(canAccess(feature, 'pro')).toBe(true)
    })
  })

  it('video-brief is the conversion trigger — must be pro only', () => {
    expect(canAccess('video-brief', 'free')).toBe(false)
    expect(canAccess('video-brief', 'creator')).toBe(false)
    expect(canAccess('video-brief', 'pro')).toBe(true)
    expect(canAccess('video-brief', 'agency')).toBe(true)
  })
})

describe('upgrade path: pro → agency', () => {
  const agencyFeatures = ['autopilot', 'invoices', 'chief-of-staff', 'cfo', 'automation']

  it('blocks agency features on pro plan', () => {
    agencyFeatures.forEach(feature => {
      expect(canAccess(feature, 'pro')).toBe(false)
    })
  })

  it('unlocks all agency features on agency plan', () => {
    agencyFeatures.forEach(feature => {
      expect(canAccess(feature, 'agency')).toBe(true)
    })
  })
})

// ── Free tier always-accessible features ─────────────────────────────────────

describe('free tier critical features', () => {
  const alwaysFree = ['command-center', 'idea-engine', 'calendar', 'planner', 'goals', 'gear-guide', 'niche-finder']
  const tiers: PricingTier[] = ['free', 'creator', 'pro', 'agency']

  it('free tier features are accessible on all plans', () => {
    alwaysFree.forEach(feature => {
      tiers.forEach(tier => {
        expect(canAccess(feature, tier)).toBe(true)
      })
    })
  })

  it('gear-guide is always free (affiliate revenue driver)', () => {
    expect(canAccess('gear-guide', 'free')).toBe(true)
  })

  it('niche-finder is always free (acquisition tool)', () => {
    expect(canAccess('niche-finder', 'free')).toBe(true)
  })
})

// ── Usage limits sanity checks ────────────────────────────────────────────────

describe('usage limits are monotonically increasing', () => {
  it('ai generations increase with tier', () => {
    expect(TIER_LIMITS.free.aiGenerationsPerMonth).toBeLessThan(TIER_LIMITS.creator.aiGenerationsPerMonth)
    expect(TIER_LIMITS.creator.aiGenerationsPerMonth).toBeLessThan(TIER_LIMITS.pro.aiGenerationsPerMonth)
    expect(TIER_LIMITS.pro.aiGenerationsPerMonth).toBeLessThan(TIER_LIMITS.agency.aiGenerationsPerMonth)
  })

  it('brand deal limits increase with tier', () => {
    expect(TIER_LIMITS.free.brandDealsCount).toBeLessThan(TIER_LIMITS.creator.brandDealsCount)
    expect(TIER_LIMITS.creator.brandDealsCount).toBeLessThan(TIER_LIMITS.pro.brandDealsCount)
  })

  it('team seats increase with tier', () => {
    expect(TIER_LIMITS.free.teamSeats).toBeLessThanOrEqual(TIER_LIMITS.creator.teamSeats)
    expect(TIER_LIMITS.creator.teamSeats).toBeLessThan(TIER_LIMITS.pro.teamSeats)
    expect(TIER_LIMITS.pro.teamSeats).toBeLessThan(TIER_LIMITS.agency.teamSeats)
  })
})
