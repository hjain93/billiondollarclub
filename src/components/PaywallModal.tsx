import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Crown, Building2, Check, Lock } from 'lucide-react'
import { useStore } from '../store'
import { TIER_META, TIER_LIMITS, FEATURE_TIERS } from '../utils/entitlements'
import type { PricingTier } from '../types'

const TIER_ICONS: Record<PricingTier, React.ComponentType<{ size: number; color: string }>> = {
  free: Zap,
  creator: Zap,
  pro: Crown,
  agency: Building2,
}

const TIER_FEATURES: Record<PricingTier, string[]> = {
  free: [
    'Command Center dashboard',
    'Idea Engine (10 AI gen/mo)',
    'Content Calendar (basic)',
    'Daily Planner',
    'Goals (up to 3)',
    'Smart Tasks (up to 5)',
    'Gear Guide + affiliate deals',
  ],
  creator: [
    'Everything in Free',
    'Creation Studio (all 7 tabs)',
    'Content Pipeline kanban',
    'Analytics dashboard',
    'Brand Deals CRM (up to 10)',
    'Income Tracker + Affiliate Hub',
    'Brand Kit',
    'Visual Prompts builder',
    'Engagement Lab',
    'Content DNA analysis',
    'Smart Inbox + Tasks (100)',
    '100 AI generations/month',
  ],
  pro: [
    'Everything in Creator',
    'AI Video Brief Studio',
    'Thumbnail Lab + CTR optimizer',
    'Viral Clip Finder',
    'Channel Audit (unlimited)',
    'Monetization Intelligence',
    'Trend Radar',
    'Competitor Radar',
    'Pre-Publish Score',
    'Growth Simulator',
    'Client Portal (20 links)',
    'Projects + full PM suite',
    'Creator CRM',
    'Content Repurpose Engine',
    'A/B Lab',
    '1,000 AI generations/month',
  ],
  agency: [
    'Everything in Pro',
    'Invoice Generator + Contracts',
    'Creator Autopilot (AI workflows)',
    'AI Chief of Staff',
    'Collab Mode + Network',
    'Creator Zapier (Automation)',
    'Financial CFO dashboard',
    'D2C Storefront',
    'Audience Moat analytics',
    'Ops HQ command center',
    '15 team seats',
    '5,000 AI generations/month',
  ],
}

interface PaywallModalProps {
  featureId?: string
  featureName?: string
  onClose: () => void
  isOpen: boolean
}

export function PaywallModal({ featureId, featureName, onClose, isOpen }: PaywallModalProps) {
  const { planTier, setPlanTier } = useStore()
  const requiredTier = featureId ? FEATURE_TIERS[featureId] : 'creator'
  const tiers: PricingTier[] = ['free', 'creator', 'pro', 'agency']

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(4px)',
              zIndex: 200,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed',
              inset: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 201,
              pointerEvents: 'none',
              padding: '20px',
            }}
          >
            <div style={{
              background: '#0d0d1a',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 20,
              padding: '28px 28px 24px',
              width: '100%',
              maxWidth: 780,
              maxHeight: '90vh',
              overflowY: 'auto',
              pointerEvents: 'all',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Lock size={16} color="#ec4899" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ec4899', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Upgrade Required
                    </span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', margin: 0, letterSpacing: '-0.02em' }}>
                    {featureName ? `Unlock ${featureName}` : 'Upgrade Creator Command'}
                  </h2>
                  {requiredTier && (
                    <p style={{ fontSize: 13, color: '#6b7a9a', margin: '6px 0 0' }}>
                      Requires <span style={{ color: TIER_META[requiredTier].color, fontWeight: 700 }}>{TIER_META[requiredTier].label}</span> plan or above
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6b7a9a', flexShrink: 0,
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Current plan indicator */}
              <div style={{
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.12)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 13, color: '#94a3b8', marginBottom: 20,
              }}>
                You're on the <span style={{ color: TIER_META[planTier].color, fontWeight: 700 }}>
                  {TIER_META[planTier].label}
                </span> plan.
                {planTier === 'free' && ' Unlock the full creator OS below.'}
                {planTier === 'creator' && ' Upgrade to Pro or Agency for advanced tools.'}
                {planTier === 'pro' && ' Upgrade to Agency for team and automation features.'}
              </div>

              {/* Tier cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {tiers.map((tier) => {
                  const meta = TIER_META[tier]
                  const Icon = TIER_ICONS[tier]
                  const isCurrentPlan = tier === planTier
                  const isRecommended = tier === requiredTier
                  const limits = TIER_LIMITS[tier]

                  return (
                    <motion.div
                      key={tier}
                      whileHover={{ y: -2 }}
                      style={{
                        background: isRecommended ? `rgba(${tier === 'pro' ? '236,72,153' : tier === 'creator' ? '59,130,246' : tier === 'agency' ? '249,115,22' : '107,122,154'},0.08)` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isRecommended ? meta.color : isCurrentPlan ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 14,
                        padding: '16px 14px',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (tier !== 'free') {
                          // Demo: set plan tier for preview
                          setPlanTier(tier)
                          onClose()
                        }
                      }}
                    >
                      {isRecommended && (
                        <div style={{
                          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                          background: meta.color,
                          color: '#fff', fontSize: 9, fontWeight: 800,
                          padding: '3px 10px', borderRadius: 20, letterSpacing: '0.08em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>
                          Recommended
                        </div>
                      )}
                      {isCurrentPlan && !isRecommended && (
                        <div style={{
                          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                          background: '#3b82f6',
                          color: '#fff', fontSize: 9, fontWeight: 800,
                          padding: '3px 10px', borderRadius: 20, letterSpacing: '0.08em',
                          textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>
                          Current
                        </div>
                      )}

                      <div style={{ marginBottom: 10 }}>
                        <Icon size={18} color={meta.color} />
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', marginTop: 8, marginBottom: 2 }}>
                          {meta.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: meta.color, letterSpacing: '-0.02em' }}>
                          {meta.price}
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: '#6b7a9a', marginBottom: 12 }}>
                        {limits.aiGenerationsPerMonth === Infinity
                          ? 'Unlimited AI'
                          : `${limits.aiGenerationsPerMonth} AI gen/mo`}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {TIER_FEATURES[tier].slice(0, 6).map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <Check size={10} color={meta.color} style={{ marginTop: 3, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                          </div>
                        ))}
                        {TIER_FEATURES[tier].length > 6 && (
                          <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>
                            +{TIER_FEATURES[tier].length - 6} more features
                          </div>
                        )}
                      </div>

                      {tier !== 'free' && (
                        <div style={{
                          marginTop: 14,
                          background: isRecommended ? meta.color : 'rgba(255,255,255,0.06)',
                          color: isRecommended ? '#fff' : '#94a3b8',
                          borderRadius: 8, padding: '8px 12px',
                          fontSize: 12, fontWeight: 700, textAlign: 'center',
                          cursor: 'pointer',
                        }}>
                          {isCurrentPlan ? 'Current Plan' : `Upgrade to ${meta.label}`}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <p style={{ fontSize: 11, color: '#4b5680', textAlign: 'center', marginTop: 16 }}>
                7-day free trial on all paid plans · Cancel anytime · Indian creator pricing in INR
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
