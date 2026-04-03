import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Star, Heart, MessageSquare, Share2, TrendingUp, Crown, Award,
  Plus, X, Search, ChevronRight, Edit3, Tag
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Fan {
  id: string
  name: string
  handle: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter'
  avatarColor: string
  tier: 'superfan' | 'loyal' | 'regular' | 'casual'
  totalComments: number
  totalLikes: number
  shareCount: number
  joinedDate: string
  lastActive: string
  tags: string[]
  notes: string
  engagementScore: number
  lifetimeValue: number
}

// ─── Tier Logic ───────────────────────────────────────────────────────────────

function assignTier(score: number): Fan['tier'] {
  if (score >= 85) return 'superfan'
  if (score >= 65) return 'loyal'
  if (score >= 40) return 'regular'
  return 'casual'
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_FANS: Fan[] = [
  {
    id: '1', name: 'Priya Sharma', handle: '@priya_creates', platform: 'youtube',
    avatarColor: '#ec4899', tier: 'superfan', totalComments: 312, totalLikes: 847,
    shareCount: 43, joinedDate: '2022-03-14', lastActive: '2026-03-22',
    tags: ['asks questions', 'buys merch', 'shares posts'],
    notes: 'Always first to comment. Bought 2 courses.', engagementScore: 94, lifetimeValue: 8400,
  },
  {
    id: '2', name: 'Rahul Verma', handle: '@rahulv_yt', platform: 'youtube',
    avatarColor: '#3b82f6', tier: 'superfan', totalComments: 289, totalLikes: 1203,
    shareCount: 67, joinedDate: '2021-11-05', lastActive: '2026-03-21',
    tags: ['shares posts', 'buys merch', 'super chats'],
    notes: 'Top donor on live streams. Very engaged community member.', engagementScore: 91, lifetimeValue: 12600,
  },
  {
    id: '3', name: 'Arjun Nair', handle: '@arjun.nair', platform: 'instagram',
    avatarColor: '#a78bfa', tier: 'superfan', totalComments: 178, totalLikes: 634,
    shareCount: 29, joinedDate: '2022-08-20', lastActive: '2026-03-20',
    tags: ['asks questions', 'DMs frequently'],
    notes: 'Reaches out with feedback regularly.', engagementScore: 88, lifetimeValue: 4200,
  },
  {
    id: '4', name: 'Neha Gupta', handle: '@neha_g', platform: 'instagram',
    avatarColor: '#10b981', tier: 'loyal', totalComments: 134, totalLikes: 512,
    shareCount: 18, joinedDate: '2022-06-10', lastActive: '2026-03-18',
    tags: ['shares posts', 'saves content'],
    notes: '', engagementScore: 78, lifetimeValue: 2100,
  },
  {
    id: '5', name: 'Vikram Singh', handle: '@vikram_singh', platform: 'youtube',
    avatarColor: '#f59e0b', tier: 'loyal', totalComments: 156, totalLikes: 423,
    shareCount: 22, joinedDate: '2022-01-30', lastActive: '2026-02-28',
    tags: ['asks questions', 'recommends channel'],
    notes: 'Sends referrals often.', engagementScore: 72, lifetimeValue: 3500,
  },
  {
    id: '6', name: 'Ananya Iyer', handle: '@ananya_i', platform: 'tiktok',
    avatarColor: '#ec4899', tier: 'loyal', totalComments: 98, totalLikes: 789,
    shareCount: 56, joinedDate: '2023-02-14', lastActive: '2026-03-19',
    tags: ['shares posts', 'duets content'],
    notes: '', engagementScore: 69, lifetimeValue: 1800,
  },
  {
    id: '7', name: 'Karan Mehta', handle: '@karan.mehta', platform: 'youtube',
    avatarColor: '#22d3ee', tier: 'loyal', totalComments: 112, totalLikes: 367,
    shareCount: 14, joinedDate: '2021-09-12', lastActive: '2026-03-15',
    tags: ['buys merch', 'long watch time'],
    notes: 'Buys every course drop.', engagementScore: 67, lifetimeValue: 6300,
  },
  {
    id: '8', name: 'Divya Reddy', handle: '@divya_reddy', platform: 'instagram',
    avatarColor: '#f97316', tier: 'regular', totalComments: 67, totalLikes: 234,
    shareCount: 9, joinedDate: '2023-05-22', lastActive: '2026-03-10',
    tags: ['saves content', 'story viewer'],
    notes: '', engagementScore: 54, lifetimeValue: 700,
  },
  {
    id: '9', name: 'Siddharth Kumar', handle: '@sidd_k', platform: 'twitter',
    avatarColor: '#6366f1', tier: 'regular', totalComments: 89, totalLikes: 156,
    shareCount: 31, joinedDate: '2022-11-08', lastActive: '2026-03-12',
    tags: ['quote tweets', 'replies often'],
    notes: '', engagementScore: 51, lifetimeValue: 0,
  },
  {
    id: '10', name: 'Pooja Bhat', handle: '@pooja_bhat', platform: 'youtube',
    avatarColor: '#14b8a6', tier: 'regular', totalComments: 45, totalLikes: 178,
    shareCount: 7, joinedDate: '2023-07-03', lastActive: '2026-02-20',
    tags: ['asks questions'],
    notes: '', engagementScore: 47, lifetimeValue: 0,
  },
  {
    id: '11', name: 'Amit Joshi', handle: '@amit.joshi', platform: 'instagram',
    avatarColor: '#84cc16', tier: 'regular', totalComments: 52, totalLikes: 198,
    shareCount: 6, joinedDate: '2023-04-15', lastActive: '2026-03-01',
    tags: ['saves content'],
    notes: '', engagementScore: 43, lifetimeValue: 350,
  },
  {
    id: '12', name: 'Riya Kapoor', handle: '@riya_k', platform: 'tiktok',
    avatarColor: '#e879f9', tier: 'casual', totalComments: 12, totalLikes: 89,
    shareCount: 3, joinedDate: '2023-09-18', lastActive: '2026-01-14',
    tags: ['lurker'],
    notes: '', engagementScore: 28, lifetimeValue: 0,
  },
  {
    id: '13', name: 'Rohan Das', handle: '@rohan_das', platform: 'youtube',
    avatarColor: '#fb923c', tier: 'casual', totalComments: 8, totalLikes: 67,
    shareCount: 1, joinedDate: '2023-10-02', lastActive: '2025-12-30',
    tags: ['occasional viewer'],
    notes: '', engagementScore: 22, lifetimeValue: 0,
  },
  {
    id: '14', name: 'Sneha Pillai', handle: '@sneha.p', platform: 'instagram',
    avatarColor: '#c084fc', tier: 'casual', totalComments: 14, totalLikes: 72,
    shareCount: 2, joinedDate: '2023-11-25', lastActive: '2026-02-05',
    tags: ['story viewer'],
    notes: '', engagementScore: 19, lifetimeValue: 0,
  },
  {
    id: '15', name: 'Tanvi Mishra', handle: '@tanvi_m', platform: 'twitter',
    avatarColor: '#38bdf8', tier: 'casual', totalComments: 6, totalLikes: 45,
    shareCount: 4, joinedDate: '2024-01-10', lastActive: '2026-01-28',
    tags: ['retweets'],
    notes: '', engagementScore: 15, lifetimeValue: 0,
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Fan['tier'], { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  superfan: { label: 'Superfan', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Crown size={12} /> },
  loyal:    { label: 'Loyal',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: <Star size={12} /> },
  regular:  { label: 'Regular',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: <Award size={12} /> },
  casual:   { label: 'Casual',   color: '#4b5680', bg: 'rgba(75,86,128,0.15)',   icon: <Users size={12} /> },
}

const PLATFORM_CONFIG: Record<Fan['platform'], { label: string; color: string; bg: string }> = {
  youtube:   { label: 'YouTube',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  instagram: { label: 'Instagram', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  tiktok:    { label: 'TikTok',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  twitter:   { label: 'Twitter',   color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
}

const SORT_OPTIONS = [
  { value: 'engagementScore', label: 'Engagement Score' },
  { value: 'lifetimeValue',   label: 'Lifetime Value' },
  { value: 'totalComments',   label: 'Total Comments' },
  { value: 'lastActive',      label: 'Last Active' },
]

const EMPTY_FAN: Omit<Fan, 'id'> = {
  name: '', handle: '', platform: 'youtube', avatarColor: '#3b82f6',
  tier: 'casual', totalComments: 0, totalLikes: 0, shareCount: 0,
  joinedDate: '', lastActive: '', tags: [], notes: '',
  engagementScore: 0, lifetimeValue: 0,
}

const PAGE_SIZE = 20

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function daysAgo(d: string) {
  if (!d) return 999
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

function fmtNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function fmtInr(n: number) {
  if (n === 0) return '₹0'
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L'
  if (n >= 1000) return '₹' + (n / 1000).toFixed(1) + 'k'
  return '₹' + n
}

function avgScore(fans: Fan[]) {
  if (!fans.length) return 0
  return Math.round(fans.reduce((s, f) => s + f.engagementScore, 0) / fans.length)
}

function healthLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Excellent', color: '#10b981' }
  if (score >= 50) return { label: 'Good',      color: '#3b82f6' }
  if (score >= 35) return { label: 'Fair',       color: '#f59e0b' }
  return { label: 'Poor', color: '#ef4444' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AvatarCircle({ fan, size = 38 }: { fan: Fan; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${fan.avatarColor}cc, ${fan.avatarColor}44)`,
      border: `1.5px solid ${fan.avatarColor}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, color: '#f0f4ff',
      flexShrink: 0, fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {getInitials(fan.name)}
    </div>
  )
}

function TierBadge({ tier }: { tier: Fan['tier'] }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function PlatformBadge({ platform }: { platform: Fan['platform'] }) {
  const cfg = PLATFORM_CONFIG[platform]
  return (
    <span style={{
      display: 'inline-block', padding: '3px 8px',
      borderRadius: 20, fontSize: 11, fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

function TagChip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: '#a78bfa', background: 'rgba(167,139,250,0.1)',
      border: '1px solid rgba(167,139,250,0.2)',
    }}>
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remove tag ${label}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#a78bfa', lineHeight: 1 }}
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 72, height: 5, borderRadius: 3,
        background: 'rgba(240,244,255,0.08)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 3,
          background: color,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color, fontWeight: 700 }}>
        {score}
      </span>
    </div>
  )
}

// ─── Engagement Score Ring ────────────────────────────────────────────────────

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(240,244,255,0.08)" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 10, color: '#4b5680', fontWeight: 600, marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  )
}

// ─── Fan Pyramid ──────────────────────────────────────────────────────────────

function FanPyramid({
  fans,
  activeTier,
  onTierClick,
}: {
  fans: Fan[]
  activeTier: Fan['tier'] | 'all'
  onTierClick: (tier: Fan['tier'] | 'all') => void
}) {
  const counts = {
    superfan: fans.filter(f => f.tier === 'superfan').length,
    loyal:    fans.filter(f => f.tier === 'loyal').length,
    regular:  fans.filter(f => f.tier === 'regular').length,
    casual:   fans.filter(f => f.tier === 'casual').length,
  }

  const tiers: { tier: Fan['tier']; label: string; color: string; y: number; h: number; w: number }[] = [
    { tier: 'superfan', label: 'Superfans',  color: '#f59e0b', y: 0,   h: 52, w: 120 },
    { tier: 'loyal',    label: 'Loyal Fans', color: '#a78bfa', y: 56,  h: 52, w: 200 },
    { tier: 'regular',  label: 'Regular',    color: '#3b82f6', y: 112, h: 52, w: 280 },
    { tier: 'casual',   label: 'Casual',     color: '#4b5680', y: 168, h: 52, w: 360 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ marginBottom: 8, fontSize: 11, color: '#4b5680', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Click a tier to filter
      </div>
      <svg width={380} height={230} viewBox="0 0 380 230" style={{ overflow: 'visible' }}>
        {tiers.map(({ tier, label, color, y, h, w }) => {
          const x = (380 - w) / 2
          const isActive = activeTier === tier
          const isFiltered = activeTier !== 'all' && activeTier !== tier
          return (
            <g key={tier} style={{ cursor: 'pointer' }} onClick={() => onTierClick(activeTier === tier ? 'all' : tier)}>
              <rect
                x={x} y={y} width={w} height={h - 4}
                rx={6}
                fill={isActive ? color : `${color}22`}
                stroke={isActive ? color : `${color}55`}
                strokeWidth={isActive ? 2 : 1}
                opacity={isFiltered ? 0.35 : 1}
                style={{ transition: 'all 0.2s ease' }}
              />
              <text
                x={190} y={y + (h - 4) / 2 - 6}
                textAnchor="middle" dominantBaseline="middle"
                fill={isActive ? '#080810' : color}
                fontSize={13} fontWeight={700}
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {label}
              </text>
              <text
                x={190} y={y + (h - 4) / 2 + 10}
                textAnchor="middle" dominantBaseline="middle"
                fill={isActive ? '#080810cc' : `${color}aa`}
                fontSize={11} fontWeight={600}
                fontFamily="Space Mono, monospace"
              >
                {counts[tier]} fans
              </text>
            </g>
          )
        })}
      </svg>
      {activeTier !== 'all' && (
        <button
          onClick={() => onTierClick('all')}
          style={{
            marginTop: 4, background: 'none', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 600,
            color: '#3b82f6', cursor: 'pointer',
          }}
        >
          Clear filter
        </button>
      )}
    </div>
  )
}

// ─── Fan Detail Drawer ────────────────────────────────────────────────────────

function FanDrawer({
  fan,
  onClose,
  onUpdate,
}: {
  fan: Fan
  onClose: () => void
  onUpdate: (id: string, patch: Partial<Fan>) => void
}) {
  const [notes, setNotes] = useState(fan.notes)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(fan.tags)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tierColor = TIER_CONFIG[fan.tier].color

  function handleNotesChange(val: string) {
    setNotes(val)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => onUpdate(fan.id, { notes: val }), 800)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) { setTagInput(''); return }
    const next = [...tags, t]
    setTags(next)
    onUpdate(fan.id, { tags: next })
    setTagInput('')
  }

  function removeTag(t: string) {
    const next = tags.filter(x => x !== t)
    setTags(next)
    onUpdate(fan.id, { tags: next })
  }

  function markSuperfan() {
    onUpdate(fan.id, { tier: 'superfan', engagementScore: Math.max(fan.engagementScore, 85) })
  }

  const activity = [
    { icon: <MessageSquare size={13} />, label: 'Commented on your video', date: fan.lastActive, color: '#3b82f6' },
    { icon: <Heart size={13} />,         label: `Liked ${fan.totalLikes} posts`, date: fan.joinedDate, color: '#ec4899' },
    { icon: <Share2 size={13} />,        label: `Shared ${fan.shareCount} posts`, date: fan.joinedDate, color: '#10b981' },
    { icon: <TrendingUp size={13} />,    label: 'Engagement spike detected', date: fan.joinedDate, color: '#f59e0b' },
    { icon: <Star size={13} />,          label: 'Joined as follower', date: fan.joinedDate, color: '#a78bfa' },
  ]

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: '#0d0d1a', borderLeft: '1px solid rgba(59,130,246,0.15)',
        zIndex: 50, overflowY: 'auto', padding: '24px 20px',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.5)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flex: 1 }}>
          <AvatarCircle fan={fan} size={64} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{fan.name}</div>
            <div style={{ fontSize: 13, color: '#4b5680', marginBottom: 8 }}>{fan.handle}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              <TierBadge tier={fan.tier} />
              <PlatformBadge platform={fan.platform} />
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close drawer"
          style={{
            background: 'rgba(240,244,255,0.05)', border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 8, padding: 6, cursor: 'pointer', color: '#4b5680',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Score ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <ScoreRing score={fan.engagementScore} color={tierColor} />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24,
      }}>
        {[
          { label: 'Comments', value: fmtNumber(fan.totalComments), icon: <MessageSquare size={14} />, color: '#3b82f6' },
          { label: 'Likes',    value: fmtNumber(fan.totalLikes),    icon: <Heart size={14} />,         color: '#ec4899' },
          { label: 'Shares',   value: fmtNumber(fan.shareCount),    icon: <Share2 size={14} />,        color: '#10b981' },
          { label: 'LTV',      value: fmtInr(fan.lifetimeValue),   icon: <TrendingUp size={14} />,    color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(240,244,255,0.03)', border: '1px solid rgba(59,130,246,0.08)',
            borderRadius: 10, padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ color: s.color, marginBottom: 4, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity timeline */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          Activity
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activity.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: `${a.color}18`, border: `1px solid ${a.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color,
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 500 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#4b5680' }}>{formatDate(a.date)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Tags
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map(t => <TagChip key={t} label={t} onRemove={() => removeTag(t)} />)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Add tag…"
            style={{
              flex: 1, background: 'rgba(240,244,255,0.04)', border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 8, padding: '7px 10px', fontSize: 12, color: '#f0f4ff',
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
            }}
          />
          <button
            onClick={addTag}
            style={{
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#a78bfa', fontSize: 12, fontWeight: 700,
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Notes <span style={{ fontSize: 10, color: '#4b5680', textTransform: 'none', fontWeight: 400 }}>(auto-saves)</span>
        </div>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder="Private notes about this fan…"
          rows={4}
          style={{
            width: '100%', background: 'rgba(240,244,255,0.04)', border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#f0f4ff',
            fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', resize: 'vertical',
            boxSizing: 'border-box', lineHeight: 1.6,
          }}
        />
      </div>

      {/* CTA */}
      {fan.tier !== 'superfan' && (
        <button
          onClick={markSuperfan}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))',
            border: '1px solid rgba(245,158,11,0.35)',
            color: '#f59e0b', fontSize: 13, fontWeight: 800,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(245,158,11,0.12))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))')}
        >
          <Crown size={15} /> Mark as Superfan
        </button>
      )}
    </motion.div>
  )
}

// ─── Add Fan Modal ────────────────────────────────────────────────────────────

function AddFanModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (fan: Fan) => void
}) {
  const [form, setForm] = useState<Omit<Fan, 'id'>>({
    ...EMPTY_FAN, joinedDate: new Date().toISOString().slice(0, 10),
    lastActive: new Date().toISOString().slice(0, 10),
  })
  const [tagInput, setTagInput] = useState('')

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => {
      const next = { ...f, [k]: v }
      // Auto-assign tier based on score
      if (k === 'engagementScore') next.tier = assignTier(v as number)
      return next
    })
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) { setTagInput(''); return }
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t: string) { set('tags', form.tags.filter(x => x !== t)) }

  function handleSubmit() {
    if (!form.name.trim() || !form.handle.trim()) return
    onAdd({ ...form, id: crypto.randomUUID() })
    onClose()
  }

  const inputStyle = {
    width: '100%', background: 'rgba(240,244,255,0.04)', border: '1px solid rgba(59,130,246,0.15)',
    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#f0f4ff',
    fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', boxSizing: 'border-box' as const,
  }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 5, display: 'block' }

  const AVATAR_COLORS = ['#3b82f6', '#ec4899', '#a78bfa', '#10b981', '#f59e0b', '#22d3ee', '#f97316', '#84cc16']

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 360 }}
        style={{
          background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.18)',
          borderRadius: 16, padding: '28px 24px', width: 460, maxHeight: '88vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff' }}>Add Fan</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} placeholder="Priya Sharma" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Handle *</label>
              <input style={inputStyle} placeholder="@handle" value={form.handle} onChange={e => set('handle', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Platform</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.platform} onChange={e => set('platform', e.target.value as Fan['platform'])}>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Engagement Score (0-100)</label>
              <input
                style={inputStyle} type="number" min={0} max={100} placeholder="0"
                value={form.engagementScore || ''}
                onChange={e => set('engagementScore', Math.min(100, Math.max(0, Number(e.target.value))))}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Avatar Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => set('avatarColor', c)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${c}cc, ${c}44)`,
                    border: form.avatarColor === c ? `2px solid ${c}` : '2px solid transparent',
                    cursor: 'pointer', boxSizing: 'border-box',
                    outline: form.avatarColor === c ? `2px solid rgba(255,255,255,0.4)` : 'none',
                    outlineOffset: 1,
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Lifetime Value (₹)</label>
              <input style={inputStyle} type="number" min={0} placeholder="0" value={form.lifetimeValue || ''} onChange={e => set('lifetimeValue', Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Joined Date</label>
              <input style={inputStyle} type="date" value={form.joinedDate} onChange={e => set('joinedDate', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {form.tags.map(t => <TagChip key={t} label={t} onRemove={() => removeTag(t)} />)}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...inputStyle, flex: 1 }} value={tagInput}
                onChange={e => setTagInput(e.target.value)} placeholder="asks questions…"
                onKeyDown={e => e.key === 'Enter' && addTag()}
              />
              <button onClick={addTag} style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', color: '#a78bfa', fontSize: 12, fontWeight: 700 }}>
                Add
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder="Private notes…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.handle.trim()}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, cursor: 'pointer',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              opacity: (!form.name.trim() || !form.handle.trim()) ? 0.4 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            Add Fan
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Intelligence Panel ───────────────────────────────────────────────────────

function IntelligencePanel({ fans }: { fans: Fan[] }) {
  const topFan = [...fans].sort((a, b) => b.engagementScore - a.engagementScore)[0]

  const dormant = fans.filter(f =>
    (f.tier === 'superfan' || f.tier === 'loyal') && daysAgo(f.lastActive) >= 30
  )

  const platformCounts: Record<string, number> = {}
  fans.forEach(f => { platformCounts[f.platform] = (platformCounts[f.platform] || 0) + 1 })
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  const allTags: Record<string, number> = {}
  fans.forEach(f => f.tags.forEach(t => { allTags[t] = (allTags[t] || 0) + 1 }))
  const topTags = Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const insights = [
    topFan && {
      icon: <Crown size={14} />, color: '#f59e0b',
      text: `${topFan.name} is your top fan with ${topFan.totalComments} comments`,
    },
    dormant.length > 0 && {
      icon: <TrendingUp size={14} />, color: '#ef4444',
      text: `${dormant.length} superfan${dormant.length > 1 ? 's' : ''} inactive for 30+ days — re-engage?`,
    },
    {
      icon: <Star size={14} />, color: '#10b981',
      text: `Most engaged platform: ${PLATFORM_CONFIG[topPlatform as Fan['platform']]?.label || topPlatform}`,
    },
    {
      icon: <Users size={14} />, color: '#3b82f6',
      text: `${fans.filter(f => f.tier === 'superfan').length} superfans drive most of your community engagement`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; color: string; text: string }[]

  return (
    <div style={{
      background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)',
      borderRadius: 14, padding: '20px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <TrendingUp size={15} color="#3b82f6" /> Community Insights
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: `${ins.color}18`, border: `1px solid ${ins.color}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: ins.color,
            }}>
              {ins.icon}
            </div>
            <div style={{ fontSize: 12, color: '#a0aec0', lineHeight: 1.5, paddingTop: 5 }}>{ins.text}</div>
          </div>
        ))}
      </div>
      {topTags.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Top Tags
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {topTags.map(([t, n]) => (
              <span key={t} style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                color: '#a78bfa', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
              }}>
                {t} <span style={{ color: '#4b5680' }}>×{n}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreatorCRM() {
  const STORAGE_KEY = 'creator-crm-fans'

  function loadFans(): Fan[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : DEMO_FANS
    } catch { return DEMO_FANS }
  }

  const [fans, setFans] = useState<Fan[]>(loadFans)
  const [search, setSearch] = useState('')
  const [activeTier, setActiveTier] = useState<Fan['tier'] | 'all'>('all')
  const [activePlatform, setActivePlatform] = useState<Fan['platform'] | 'all'>('all')
  const [sortBy, setSortBy] = useState<'engagementScore' | 'lifetimeValue' | 'totalComments' | 'lastActive'>('engagementScore')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fans)) } catch {}
  }, [fans])

  function updateFan(id: string, patch: Partial<Fan>) {
    setFans(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
    setSelectedFan(prev => prev?.id === id ? { ...prev, ...patch } as Fan : prev)
  }

  function addFan(fan: Fan) {
    setFans(prev => [fan, ...prev])
  }

  // Filter + sort
  const filtered = fans
    .filter(f => activeTier === 'all' || f.tier === activeTier)
    .filter(f => activePlatform === 'all' || f.platform === activePlatform)
    .filter(f =>
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.handle.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = sortBy === 'lastActive' ? new Date(a.lastActive).getTime() : a[sortBy]
      const bv = sortBy === 'lastActive' ? new Date(b.lastActive).getTime() : b[sortBy]
      return sortDir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
    setPage(0)
  }

  const health = healthLabel(avgScore(fans))

  const statCards = [
    { label: 'Total Community', value: fans.length.toString(), icon: <Users size={18} />, color: '#3b82f6' },
    { label: 'Superfans (top 5%)', value: fans.filter(f => f.tier === 'superfan').length.toString(), icon: <Crown size={18} />, color: '#f59e0b' },
    { label: 'Avg Engagement', value: `${avgScore(fans)}/100`, icon: <TrendingUp size={18} />, color: '#a78bfa' },
    { label: 'Community Health', value: health.label, icon: <Star size={18} />, color: health.color },
  ]

  const colHead = (label: string, col?: typeof sortBy) => (
    <th
      onClick={col ? () => toggleSort(col) : undefined}
      style={{
        padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
        color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em',
        borderBottom: '1px solid rgba(59,130,246,0.08)', whiteSpace: 'nowrap',
        cursor: col ? 'pointer' : 'default', userSelect: 'none',
        background: '#0d0d1a',
      }}
    >
      {label}
      {col && sortBy === col && (
        <span style={{ marginLeft: 4, color: '#3b82f6' }}>{sortDir === 'desc' ? '↓' : '↑'}</span>
      )}
    </th>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#f0f4ff',
      padding: '24px 28px',
    }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#f0f4ff', margin: 0, letterSpacing: '-0.02em' }}>
            Creator CRM
          </h1>
          <p style={{ fontSize: 13, color: '#4b5680', margin: '4px 0 0', fontWeight: 500 }}>
            Superfan tracker & community intelligence
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', borderRadius: 10, padding: '10px 18px',
            fontSize: 13, fontWeight: 800, color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.3)' }}
        >
          <Plus size={15} /> Add Fan
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 12, padding: '16px 18px',
          }}>
            <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main layout: pyramid + table + intelligence */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Pyramid */}
          <div style={{
            background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 14, padding: '20px 16px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={15} color="#a78bfa" /> Fan Pyramid
            </div>
            <FanPyramid
              fans={fans}
              activeTier={activeTier}
              onTierClick={t => { setActiveTier(t); setPage(0) }}
            />
          </div>

          {/* Intelligence */}
          <IntelligencePanel fans={fans} />
        </div>

        {/* Right column: table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5680' }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                placeholder="Search fans…"
                style={{
                  width: '100%', background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)',
                  borderRadius: 10, padding: '9px 12px 9px 34px', fontSize: 13, color: '#f0f4ff',
                  fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Platform filter */}
            <select
              value={activePlatform}
              onChange={e => { setActivePlatform(e.target.value as Fan['platform'] | 'all'); setPage(0) }}
              style={{
                background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10,
                padding: '9px 12px', fontSize: 12, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">Twitter</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(0) }}
              style={{
                background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10,
                padding: '9px 12px', fontSize: 12, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer', outline: 'none',
              }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filtered.length} fans
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead>
                  <tr>
                    {colHead('Fan')}
                    {colHead('Platform')}
                    {colHead('Tier')}
                    {colHead('Score', 'engagementScore')}
                    {colHead('Interactions', 'totalComments')}
                    {colHead('LTV', 'lifetimeValue')}
                    {colHead('Last Active', 'lastActive')}
                    {colHead('Tags')}
                    {colHead('')}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {paginated.map((fan, i) => {
                      const tierColor = TIER_CONFIG[fan.tier].color
                      return (
                        <motion.tr
                          key={fan.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.025, duration: 0.2 }}
                          onClick={() => setSelectedFan(fan)}
                          style={{
                            cursor: 'pointer', borderBottom: '1px solid rgba(59,130,246,0.06)',
                            transition: 'background 0.15s ease',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                          {/* Fan */}
                          <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <AvatarCircle fan={fan} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{fan.name}</div>
                                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 500 }}>{fan.handle}</div>
                              </div>
                            </div>
                          </td>
                          {/* Platform */}
                          <td style={{ padding: '13px 14px' }}>
                            <PlatformBadge platform={fan.platform} />
                          </td>
                          {/* Tier */}
                          <td style={{ padding: '13px 14px' }}>
                            <TierBadge tier={fan.tier} />
                          </td>
                          {/* Score */}
                          <td style={{ padding: '13px 14px' }}>
                            <ScoreBar score={fan.engagementScore} color={tierColor} />
                          </td>
                          {/* Interactions */}
                          <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#4b5680' }}>
                                <MessageSquare size={11} color="#3b82f6" />
                                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#f0f4ff' }}>{fmtNumber(fan.totalComments)}</span>
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#4b5680' }}>
                                <Heart size={11} color="#ec4899" />
                                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#f0f4ff' }}>{fmtNumber(fan.totalLikes)}</span>
                              </span>
                            </div>
                          </td>
                          {/* LTV */}
                          <td style={{ padding: '13px 14px' }}>
                            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: fan.lifetimeValue > 0 ? '#10b981' : '#4b5680', fontWeight: 700 }}>
                              {fmtInr(fan.lifetimeValue)}
                            </span>
                          </td>
                          {/* Last active */}
                          <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: daysAgo(fan.lastActive) <= 7 ? '#10b981' : daysAgo(fan.lastActive) <= 30 ? '#f59e0b' : '#4b5680',
                            }}>
                              {daysAgo(fan.lastActive) === 0 ? 'Today' :
                                daysAgo(fan.lastActive) === 1 ? 'Yesterday' :
                                `${daysAgo(fan.lastActive)}d ago`}
                            </span>
                          </td>
                          {/* Tags */}
                          <td style={{ padding: '13px 14px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 180 }}>
                              {fan.tags.slice(0, 2).map(t => <TagChip key={t} label={t} />)}
                              {fan.tags.length > 2 && (
                                <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, padding: '2px 4px' }}>+{fan.tags.length - 2}</span>
                              )}
                            </div>
                          </td>
                          {/* Actions */}
                          <td style={{ padding: '13px 14px' }}>
                            <div
                              className="row-actions"
                              style={{ display: 'flex', gap: 4, opacity: 0.01 }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={e => (e.currentTarget.style.opacity = '0.01')}
                            >
                              {[
                                { icon: <ChevronRight size={13} />, title: 'View', color: '#3b82f6', onClick: () => setSelectedFan(fan) },
                                { icon: <Edit3 size={13} />, title: 'Note', color: '#a78bfa', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedFan(fan) } },
                                { icon: <Tag size={13} />, title: 'Tag', color: '#10b981', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setSelectedFan(fan) } },
                              ].map(a => (
                                <button
                                  key={a.title}
                                  title={a.title}
                                  aria-label={a.title}
                                  onClick={e => { e.stopPropagation(); a.onClick(e as React.MouseEvent) }}
                                  style={{
                                    width: 28, height: 28, borderRadius: 7,
                                    background: `${a.color}18`, border: `1px solid ${a.color}33`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: a.color, transition: 'background 0.12s ease',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = `${a.color}30`)}
                                  onMouseLeave={e => (e.currentTarget.style.background = `${a.color}18`)}
                                >
                                  {a.icon}
                                </button>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                  {paginated.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#4b5680', fontSize: 13, fontWeight: 600 }}>
                        No fans match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderTop: '1px solid rgba(59,130,246,0.08)',
              }}>
                <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 600 }}>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      style={{
                        width: 30, height: 30, borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: i === page ? '#3b82f6' : 'rgba(59,130,246,0.08)',
                        border: `1px solid ${i === page ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
                        color: i === page ? '#fff' : '#4b5680', cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fan Detail Drawer */}
      <AnimatePresence>
        {selectedFan && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedFan(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 49, backdropFilter: 'blur(2px)' }}
            />
            <FanDrawer
              fan={selectedFan}
              onClose={() => setSelectedFan(null)}
              onUpdate={updateFan}
            />
          </>
        )}
      </AnimatePresence>

      {/* Add Fan Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <AddFanModal onClose={() => setAddModalOpen(false)} onAdd={addFan} />
        )}
      </AnimatePresence>
    </div>
  )
}
