import * as React from 'react'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { CreatorScoreRing } from './CreatorScoreRing'
import { PaywallModal } from './PaywallModal'
import { canAccess, featureTier, TIER_META, useAIQuota } from '../utils/entitlements'
import type { CalendarPost } from '../types'
import {
  LayoutDashboard, Lightbulb, Calendar, ListTodo,
  Wand2, BarChart3, Zap, Dna, Briefcase, Target,
  DollarSign, FileText, Sparkles, FolderKanban, CheckSquare,
  Inbox, GitBranch, Globe, Video, Scissors, Image, Palette,
  TrendingUp, Search, Cpu, MessageSquare, CheckCircle, Users, Repeat2, Radar, Receipt, ShoppingBag,
  Brain, FlaskConical, Navigation, Wallet, Lock, Compass,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, phase: 1 },
  { id: 'ops-hq',         label: 'Ops HQ',         icon: Brain,           phase: 1 },
  { id: 'niche-finder',   label: 'Niche Finder',   icon: Compass,         phase: 1 },
  { id: 'idea-engine',    label: 'Idea Engine',     icon: Lightbulb,       phase: 1 },
  { id: 'calendar',       label: 'Content Calendar', icon: Calendar,       phase: 2 },
  { id: 'planner',        label: 'Daily Planner',    icon: ListTodo,       phase: 2 },
  { id: 'studio',         label: 'Creation Studio',  icon: Wand2,          phase: 2 },
  { id: 'pipeline',       label: 'Content Pipeline', icon: GitBranch,      phase: 2 },
  { id: 'analytics',      label: 'Analytics',        icon: BarChart3,      phase: 3 },
  { id: 'trends',         label: 'Trend Radar',      icon: Zap,            phase: 3 },
  { id: 'content-dna',   label: 'Content DNA',      icon: Dna,            phase: 3 },
  { id: 'brand-deals',   label: 'Brand Deals',      icon: Briefcase,      phase: 3 },
  { id: 'goals',          label: 'Goals',            icon: Target,         phase: 3 },
  { id: 'income',         label: 'Income Tracker',   icon: DollarSign,     phase: 3 },
  { id: 'templates',      label: 'Templates',        icon: FileText,       phase: 3 },
  { id: 'visual-prompts', label: 'Visual Prompts',   icon: Sparkles,       phase: 3 },
  // Phase 5: Production
  { id: 'video-brief',    label: 'Video Brief',      icon: Video,          phase: 5 },
  { id: 'thumbnail-lab',  label: 'Thumbnail Lab',    icon: Image,          phase: 5 },
  { id: 'clip-finder',    label: 'Clip Finder',      icon: Scissors,       phase: 5 },
  { id: 'brand-kit',      label: 'Brand Kit',        icon: Palette,        phase: 5 },
  { id: 'gear-guide',     label: 'Gear Guide',       icon: Cpu,            phase: 5 },
  { id: 'engagement',     label: 'Engagement Lab',   icon: MessageSquare,  phase: 5 },
  { id: 'audit',          label: 'Channel Audit',    icon: Search,         phase: 5 },
  { id: 'monetize',       label: 'Monetize',         icon: TrendingUp,     phase: 5 },
  // Phase 6: Intelligence+
  { id: 'pre-publish',      label: 'Pre-Publish Score',  icon: CheckCircle,  phase: 6 },
  { id: 'growth-sim',       label: 'Growth Simulator',   icon: TrendingUp,   phase: 6 },
  { id: 'competitor-radar', label: 'Competitor Radar',   icon: Radar,        phase: 6 },
  { id: 'creator-crm',      label: 'Creator CRM',        icon: Users,        phase: 6 },
  { id: 'repurpose',        label: 'Repurpose Engine',   icon: Repeat2,      phase: 6 },
  { id: 'invoices',         label: 'Invoices & Contracts', icon: Receipt,    phase: 6 },
  { id: 'chief-of-staff',  label: 'AI Chief of Staff',   icon: Brain,       phase: 6 },
  { id: 'autopilot',       label: 'Creator Autopilot',   icon: Navigation,  phase: 6 },
  { id: 'ab-lab',          label: 'A/B Lab',             icon: FlaskConical, phase: 6 },
  { id: 'collab-network',  label: 'Collab Network',      icon: Navigation,   phase: 6 },
  { id: 'audience',        label: 'Audience Moat',       icon: Users,        phase: 6 },
  { id: 'automation',      label: 'Creator Zapier',      icon: Zap,          phase: 6 },
  { id: 'cfo',             label: 'Creator CFO',         icon: Wallet,       phase: 6 },
  { id: 'store',           label: 'D2C Storefront',      icon: ShoppingBag,  phase: 6 },
  // Phase 4: Workspace
  { id: 'inbox',          label: 'Smart Inbox',      icon: Inbox,          phase: 4 },
  { id: 'projects',       label: 'Projects',         icon: FolderKanban,   phase: 4 },
  { id: 'tasks',          label: 'Smart Tasks',      icon: CheckSquare,    phase: 4 },
  { id: 'client-portal',  label: 'Client Portal',    icon: Globe,          phase: 4 },
]


function computeStreak(calendarPosts: CalendarPost[]): number {
  if (calendarPosts.length === 0) return 0
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const hasPost = calendarPosts.some(
      (p) => p.scheduledAt === key && p.status === 'published'
    )
    if (hasPost) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

export function Sidebar() {
  const { activeView, setView, profile, calendarPosts, smartTasks, brandDeals, workspace, planTier, setMobileSidebarOpen } = useStore()
  const { used, limit, remaining, isAtLimit, isNearLimit, pct } = useAIQuota()
  const streak = useMemo(() => computeStreak(calendarPosts), [calendarPosts])
  const [paywallFeature, setPaywallFeature] = useState<{ id: string; name: string } | null>(null)

  // Quota bar color: green → orange at 80% → red at 100%
  const quotaBarColor = isAtLimit ? '#ef4444' : isNearLimit ? '#f97316' : '#10b981'

  function navigate(id: string) {
    setView(id)
    setMobileSidebarOpen(false)
  }

  // Inbox badge count
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const nowTs = today.getTime()

  const inboxCount = useMemo(() => {
    let count = 0
    count += smartTasks.filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr).length
    count += workspace.projects.reduce((sum, p) => sum + p.tasks.filter((t) => t.status === 'blocked').length, 0)
    count += brandDeals.filter((d) => d.status !== 'completed' && d.status !== 'declined' && d.deadline && Math.floor((new Date(d.deadline).getTime() - nowTs) / 86400000) <= 3 && Math.floor((new Date(d.deadline).getTime() - nowTs) / 86400000) >= 0).length
    return count
  }, [smartTasks, workspace.projects, brandDeals, todayStr, nowTs])

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        background: '#0d0d1a',
        borderRight: '1px solid rgba(59,130,246,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 18px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59,130,246,0.35)',
          }}>
            <Wand2 size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#f0f4ff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Creator
            </div>
            <div style={{
              fontWeight: 800, fontSize: 15, lineHeight: 1.1, letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Command
            </div>
          </div>
        </div>
      </div>

      {/* Creator pill */}
      {profile && (
        <div style={{ padding: '0 10px 14px' }}>
          <div style={{
            background: 'rgba(59,130,246,0.07)',
            borderRadius: 10,
            padding: '9px 12px',
            border: '1px solid rgba(59,130,246,0.14)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
              {profile.name || 'Creator'}
            </div>
            <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>{profile.niche}</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
        {/* Phase 1 */}
        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px 6px' }}>
          Command
        </div>
        {NAV_ITEMS.filter(i => i.phase === 1).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)} />
        })}

        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
          Creation
        </div>
        {NAV_ITEMS.filter(i => i.phase === 2).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)} />
        })}

        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
          Intelligence
        </div>
        {NAV_ITEMS.filter(i => i.phase === 3).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)} />
        })}

        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
          Production
        </div>
        {NAV_ITEMS.filter(i => i.phase === 5).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)} />
        })}

        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
          Growth OS
        </div>
        {NAV_ITEMS.filter(i => i.phase === 6).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)} />
        })}

        <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 8px 6px' }}>
          Workspace
        </div>
        {NAV_ITEMS.filter(i => i.phase === 4).map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          const locked = !canAccess(item.id, planTier)
          return <NavItem key={item.id} item={item} Icon={Icon} isActive={isActive} locked={locked}
            onSelect={(id) => locked ? setPaywallFeature({ id, name: item.label }) : navigate(id)}
            badge={!locked && item.id === 'inbox' && inboxCount > 0 ? inboxCount : undefined} />
        })}
      </nav>

      {/* ⌘K hint */}
      <div style={{ padding: '6px 14px 2px' }}>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'k', bubbles: true }))}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 8, padding: '7px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', transition: 'all 150ms',
          }}
        >
          <span style={{ fontSize: 11, color: '#4b5680' }}>Quick search</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#4b5680',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '2px 5px',
          }}>⌘K</span>
        </button>
      </div>

      {/* Streak indicator */}
      {streak > 0 && (
        <div style={{ padding: '8px 14px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(249,115,22,0.08)',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 10, padding: '7px 12px',
          }}>
            <span style={{ fontSize: 15 }}>🔥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{streak} day streak</div>
              <div style={{ fontSize: 10, color: '#6b4a30', marginTop: 1, fontWeight: 600 }}>Keep it going!</div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Tier Badge + AI Quota */}
      <div style={{ padding: '8px 14px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => setPaywallFeature({ id: '', name: '' })}
          style={{
            width: '100%',
            background: `rgba(${planTier === 'pro' ? '236,72,153' : planTier === 'creator' ? '59,130,246' : planTier === 'agency' ? '249,115,22' : '107,122,154'},0.08)`,
            border: `1px solid ${TIER_META[planTier].color}33`,
            borderRadius: 10, padding: '7px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {planTier === 'free' ? 'Free plan' : `${TIER_META[planTier].label} plan`}
          </span>
          {planTier !== 'agency' && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: TIER_META[planTier].color,
              background: `${TIER_META[planTier].color}20`,
              border: `1px solid ${TIER_META[planTier].color}40`,
              borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em',
            }}>
              {planTier === 'free' ? 'UPGRADE' : 'MANAGE'}
            </span>
          )}
        </button>

        {/* AI Quota mini-bar (F-09) */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Quota</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: quotaBarColor }}>{used}/{limit === Infinity ? '∞' : limit}</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${limit === Infinity ? 0 : pct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${quotaBarColor}, ${quotaBarColor}dd)`,
                borderRadius: 2,
                transition: 'width 300ms ease, background 300ms ease',
              }}
            />
          </div>
          {isAtLimit && (
            <div style={{ fontSize: 8.5, color: '#ef4444', fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
              Limit reached — Upgrade for more
            </div>
          )}
          {isNearLimit && !isAtLimit && (
            <div style={{ fontSize: 8.5, color: '#f97316', fontWeight: 700, marginTop: 4, textAlign: 'center' }}>
              {remaining} left this month
            </div>
          )}
        </div>
      </div>

      {/* Score Ring */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
        <CreatorScoreRing />
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallFeature !== null}
        featureId={paywallFeature?.id}
        featureName={paywallFeature?.name}
        onClose={() => setPaywallFeature(null)}
      />
    </aside>
  )
}

function NavItem({
  item, Icon, isActive, onSelect, badge, locked,
}: {
  item: (typeof NAV_ITEMS)[0]
  Icon: React.ComponentType<{ size: number }>
  isActive: boolean
  onSelect: (id: string) => void
  badge?: number
  locked?: boolean
}) {
  const tier = featureTier(item.id)
  const showTierBadge = locked && tier && tier !== 'free'
  const tierColor = tier ? TIER_META[tier].color : '#6b7a9a'

  return (
    <motion.button
      key={item.id}
      onClick={() => onSelect(item.id)}
      whileHover={{ x: locked ? 0 : 2 }}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 12px', borderRadius: 9,
        border: 'none',
        cursor: 'pointer',
        background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
        color: locked ? '#3a4060' : isActive ? '#3b82f6' : '#6b7a9a',
        fontWeight: isActive ? 700 : 500,
        fontSize: 13,
        marginBottom: 1,
        textAlign: 'left',
        position: 'relative',
        transition: 'all 150ms ease',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        opacity: locked ? 0.6 : 1,
      }}
    >
      {isActive && !locked && (
        <motion.div
          layoutId="active-nav"
          style={{
            position: 'absolute', left: 0, top: 6, bottom: 6,
            width: 3, background: '#3b82f6', borderRadius: '0 2px 2px 0',
          }}
        />
      )}
      {locked ? <Lock size={13} color="#3a4060" /> : <Icon size={15} />}
      <span style={{ flex: 1 }}>{item.label}</span>
      {showTierBadge && tier && (
        <span style={{
          fontSize: 8, fontWeight: 800,
          color: tierColor,
          background: `${tierColor}15`,
          border: `1px solid ${tierColor}30`,
          borderRadius: 4, padding: '1px 5px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
          lineHeight: 1.6, flexShrink: 0,
        }}>
          {TIER_META[tier].badge}
        </span>
      )}
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: '#ef4444', color: '#fff',
          borderRadius: 20, padding: '1px 6px',
          fontSize: 10, fontWeight: 800, lineHeight: 1.4,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </motion.button>
  )
}
