import type { PricingTier } from '../types'

// ── Tier metadata ──────────────────────────────────────────────────────────────

export const TIER_META: Record<PricingTier, { label: string; price: string; color: string; badge: string }> = {
  free: {
    label: 'Free',
    price: '₹0/mo',
    color: '#6b7a9a',
    badge: 'FREE',
  },
  creator: {
    label: 'Creator',
    price: '₹999/mo',
    color: '#3b82f6',
    badge: 'CREATOR',
  },
  pro: {
    label: 'Pro',
    price: '₹2,499/mo',
    color: '#ec4899',
    badge: 'PRO',
  },
  agency: {
    label: 'Agency',
    price: '₹6,999/mo',
    color: '#f97316',
    badge: 'AGENCY',
  },
}

// ── Feature → minimum tier required ──────────────────────────────────────────
// Every view ID from the nav is mapped to the minimum tier needed to access it.
// Features below the user's current tier are unlocked.

export const FEATURE_TIERS: Record<string, PricingTier> = {
  // Free tier — core loop hook
  'command-center': 'free',
  'niche-finder': 'free',   // acquisition tool — always free + shareable
  'idea-engine': 'free',
  'calendar': 'free',
  'planner': 'free',
  'goals': 'free',
  'gear-guide': 'free',       // affiliate revenue driver, always free

  // Creator tier — the working creator toolkit
  'studio': 'creator',
  'pipeline': 'creator',
  'analytics': 'creator',
  'brand-deals': 'creator',
  'income': 'creator',
  'brand-kit': 'creator',
  'visual-prompts': 'creator',
  'engagement': 'creator',
  'templates': 'creator',
  'content-dna': 'creator',
  'inbox': 'creator',
  'tasks': 'creator',

  // Pro tier — serious creators scaling up
  'video-brief': 'pro',       // flagship wow-feature, highest conversion trigger
  'thumbnail-lab': 'pro',
  'clip-finder': 'pro',
  'audit': 'pro',
  'monetize': 'pro',
  'trends': 'pro',
  'competitor-radar': 'pro',
  'pre-publish': 'pro',
  'growth-sim': 'pro',
  'client-portal': 'pro',
  'projects': 'pro',
  'creator-crm': 'pro',
  'repurpose': 'pro',
  'ab-lab': 'pro',

  // Agency tier — running a creator business
  'invoices': 'agency',
  'autopilot': 'agency',
  'chief-of-staff': 'agency',
  'collab': 'agency',
  'collab-network': 'agency',
  'automation': 'agency',
  'cfo': 'agency',
  'store': 'agency',
  'audience': 'agency',
  'ops-hq': 'agency',
}

import { useStore } from '../store'

const TIER_ORDER: PricingTier[] = ['free', 'creator', 'pro', 'agency']

export function tierIndex(tier: PricingTier): number {
  return TIER_ORDER.indexOf(tier)
}

// ── AI Quota hook ─────────────────────────────────────────────────────
// Returns current AI usage vs. tier limit with helper flags for UI

export function useAIQuota() {
  const { planTier, aiGenerationsUsed, aiGenerationsResetMonth } = useStore()
  const limit = TIER_LIMITS[planTier].aiGenerationsPerMonth
  const used = aiGenerationsUsed
  const remaining = Math.max(0, limit - used)
  const isAtLimit = used >= limit
  const isNearLimit = !isAtLimit && remaining <= Math.ceil(limit * 0.2) // ≤20% remaining
  const pct = limit === Infinity ? 0 : Math.round((used / limit) * 100)

  return { used, limit, remaining, isAtLimit, isNearLimit, pct, resetMonth: aiGenerationsResetMonth }
}

export function canAccess(featureId: string, currentTier: PricingTier): boolean {
  const required = FEATURE_TIERS[featureId]
  if (!required) return true // unknown features are open
  return tierIndex(currentTier) >= tierIndex(required)
}

export function featureTier(featureId: string): PricingTier | null {
  return FEATURE_TIERS[featureId] ?? null
}

// ── Usage limits per tier ─────────────────────────────────────────────────────

export const TIER_LIMITS: Record<PricingTier, {
  aiGenerationsPerMonth: number
  brandDealsCount: number
  clientPortalLinks: number
  channelAuditUses: number
  teamSeats: number
  smartTasksCount: number
  goalsCount: number
}> = {
  free: {
    aiGenerationsPerMonth: 10,
    brandDealsCount: 0,
    clientPortalLinks: 0,
    channelAuditUses: 0,
    teamSeats: 1,
    smartTasksCount: 5,
    goalsCount: 3,
  },
  creator: {
    aiGenerationsPerMonth: 100,
    brandDealsCount: 10,
    clientPortalLinks: 2,
    channelAuditUses: 5,
    teamSeats: 1,
    smartTasksCount: 100,
    goalsCount: 10,
  },
  pro: {
    aiGenerationsPerMonth: 1000,
    brandDealsCount: 100,
    clientPortalLinks: 20,
    channelAuditUses: Infinity,
    teamSeats: 3,
    smartTasksCount: Infinity,
    goalsCount: Infinity,
  },
  agency: {
    aiGenerationsPerMonth: Infinity,
    brandDealsCount: Infinity,
    clientPortalLinks: Infinity,
    channelAuditUses: Infinity,
    teamSeats: 15,
    smartTasksCount: Infinity,
    goalsCount: Infinity,
  },
}
