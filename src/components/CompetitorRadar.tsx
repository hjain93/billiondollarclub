import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Target, Plus, X, Eye, BarChart3,
  Zap, AlertTriangle, ChevronRight, Search, Globe
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Competitor {
  id: string
  name: string
  handle: string
  platform: 'youtube' | 'instagram' | 'tiktok'
  followers: number
  avgViews: number
  postsPerWeek: number
  engagementRate: number
  topNiches: string[]
  recentTopics: string[]
  color: string
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
  bg: '#080810',
  card: '#0d0d1a',
  cardAlt: '#0f0f1e',
  border: 'rgba(59,130,246,0.1)',
  borderStrong: 'rgba(59,130,246,0.25)',
  primary: '#3b82f6',
  red: '#ef4444',
  green: '#10b981',
  warning: '#f59e0b',
  purple: '#a78bfa',
  text: '#f0f4ff',
  muted: '#4b5680',
  mutedLight: '#6b7db0',
}

const fontMono: React.CSSProperties = {
  fontFamily: "'Space Mono', 'Courier New', monospace",
}

const fontSans: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
}

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  youtube: { label: 'YouTube', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  instagram: { label: 'Instagram', color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  tiktok: { label: 'TikTok', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

const COMPETITOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a78bfa', '#ec4899']

// ─── Default Demo Data ────────────────────────────────────────────────────────

const DEFAULT_COMPETITORS: Competitor[] = [
  {
    id: 'demo-1',
    name: 'TechVibe',
    handle: '@techvibe_in',
    platform: 'youtube',
    followers: 8200000,
    avgViews: 2100000,
    postsPerWeek: 4,
    engagementRate: 6.2,
    topNiches: ['Tech Reviews', 'Gadgets', 'Unboxing'],
    recentTopics: ['iPhone 17 Pro Max', 'Best laptops under 50k', 'AI tools 2026', 'Earbuds comparison'],
    color: COMPETITOR_COLORS[0],
  },
  {
    id: 'demo-2',
    name: 'FinanceBro',
    handle: '@financebro_official',
    platform: 'youtube',
    followers: 2100000,
    avgViews: 480000,
    postsPerWeek: 2,
    engagementRate: 8.1,
    topNiches: ['Personal Finance', 'Investing', 'Startups'],
    recentTopics: ['Stock market crash 2026', 'Mutual funds SIP', 'How I made my first crore', 'Crypto regulation India'],
    color: COMPETITOR_COLORS[1],
  },
  {
    id: 'demo-3',
    name: 'ViralKing',
    handle: '@viralking',
    platform: 'instagram',
    followers: 15400000,
    avgViews: 8200000,
    postsPerWeek: 3,
    engagementRate: 12.0,
    topNiches: ['Entertainment', 'Comedy', 'Skits'],
    recentTopics: ['Friendship day skit', 'Village vs City life', 'Engineer jokes', 'IPL funny moments'],
    color: COMPETITOR_COLORS[2],
  },
]

const MY_STATS = {
  followers: 420000,
  avgViews: 85000,
  engagementRate: 4.8,
  postsPerWeek: 2,
  estMonthlyRevenue: 28000,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 10_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function fmtRupees(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

function estRevenue(comp: Competitor): number {
  // rough estimate: views × CPM (₹150) / 1000 × posts/week × 4
  return Math.round((comp.avgViews * 150) / 1000 * comp.postsPerWeek * 4)
}

// ─── Mini Sparkline SVG ───────────────────────────────────────────────────────

function Sparkline({ color, seed }: { color: string; seed: number }) {
  // Generate deterministic "growth" data from seed
  const points = Array.from({ length: 8 }, (_, i) => {
    const base = 30 + (seed % 20)
    const noise = Math.sin(seed + i * 1.7) * 12 + Math.cos(seed * 0.5 + i) * 8
    return Math.max(5, Math.min(58, base + noise + i * 1.8))
  })

  const w = 120
  const h = 48
  const maxP = Math.max(...points)
  const minP = Math.min(...points)
  const range = maxP - minP || 1

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - minP) / range) * (h - 8) - 4,
  }))

  const pathD = coords.reduce(
    (d, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${d} L ${pt.x} ${pt.y}`,
    ''
  )

  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`
  const gradId = `spark-grad-${seed}`

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={3} fill={color} />
    </svg>
  )
}

// ─── Posting Heatmap ──────────────────────────────────────────────────────────

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOURS = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am']

function PostingHeatmap({ competitors }: { competitors: Competitor[] }) {
  // Generate deterministic posting times per competitor based on their ID hash
  const getPostingSlots = (comp: Competitor) => {
    const hash = comp.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const slots: { day: number; hour: number }[] = []
    for (let i = 0; i < Math.round(comp.postsPerWeek); i++) {
      slots.push({
        day: (hash * (i + 1) * 3) % 7,
        hour: (hash * (i + 2) * 7 + 2) % 7,
      })
    }
    return slots
  }

  const cellW = 36
  const cellH = 28
  const padLeft = 42
  const padTop = 28

  const svgW = padLeft + HOURS.length * cellW + 8
  const svgH = padTop + DAYS.length * cellH + 8

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block' }}>
        {/* Day labels */}
        {DAYS.map((d, di) => (
          <text
            key={d}
            x={padLeft - 8}
            y={padTop + di * cellH + cellH / 2 + 4}
            textAnchor="end"
            style={{ ...fontSans, fontSize: 10, fill: C.muted }}
          >
            {d}
          </text>
        ))}

        {/* Hour labels */}
        {HOURS.map((h, hi) => (
          <text
            key={h}
            x={padLeft + hi * cellW + cellW / 2}
            y={padTop - 8}
            textAnchor="middle"
            style={{ ...fontSans, fontSize: 10, fill: C.muted }}
          >
            {h}
          </text>
        ))}

        {/* Grid cells */}
        {DAYS.map((_, di) =>
          HOURS.map((_, hi) => (
            <rect
              key={`${di}-${hi}`}
              x={padLeft + hi * cellW + 1}
              y={padTop + di * cellH + 1}
              width={cellW - 2}
              height={cellH - 2}
              rx={4}
              fill="rgba(59,130,246,0.04)"
              stroke="rgba(59,130,246,0.07)"
              strokeWidth={1}
            />
          ))
        )}

        {/* Competitor dots */}
        {competitors.map(comp => {
          const slots = getPostingSlots(comp)
          return slots.map((slot, si) => (
            <g key={`${comp.id}-${si}`}>
              <circle
                cx={padLeft + slot.hour * cellW + cellW / 2}
                cy={padTop + slot.day * cellH + cellH / 2}
                r={7}
                fill={comp.color}
                opacity={0.85}
              />
              <text
                x={padLeft + slot.hour * cellW + cellW / 2}
                y={padTop + slot.day * cellH + cellH / 2 + 4}
                textAnchor="middle"
                style={{ ...fontSans, fontSize: 8, fill: '#fff', fontWeight: 700 }}
              >
                {comp.name[0]}
              </text>
            </g>
          ))
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {competitors.map(comp => (
          <div key={comp.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: comp.color }} />
            <span style={{ ...fontSans, fontSize: 11, color: C.mutedLight }}>{comp.name}</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14,
        padding: '10px 14px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <AlertTriangle size={13} color={C.warning} />
        <span style={{ ...fontSans, fontSize: 12, color: C.warning }}>
          Competitors mostly avoid Sunday 12am–6am — that's your posting gap opportunity
        </span>
      </div>
    </div>
  )
}

// ─── Add Competitor Modal ─────────────────────────────────────────────────────

interface AddModalProps {
  onAdd: (c: Competitor) => void
  onClose: () => void
  usedColors: string[]
}

function AddCompetitorModal({ onAdd, onClose, usedColors }: AddModalProps) {
  const availableColors = COMPETITOR_COLORS.filter(c => !usedColors.includes(c))
  const nextColor = availableColors[0] || COMPETITOR_COLORS[0]

  const [form, setForm] = useState({
    name: '',
    handle: '',
    platform: 'youtube' as Competitor['platform'],
    followers: '',
    avgViews: '',
    postsPerWeek: '',
    engagementRate: '',
    topic1: '',
    topic2: '',
    topic3: '',
  })
  const [topicInput, setTopicInput] = useState('')
  const [topics, setTopics] = useState<string[]>([])

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const addTopic = () => {
    const t = topicInput.trim()
    if (t && topics.length < 5 && !topics.includes(t)) {
      setTopics(prev => [...prev, t])
      setTopicInput('')
    }
  }

  const handleSubmit = () => {
    if (!form.name || !form.handle) return
    const newComp: Competitor = {
      id: `comp-${Date.now()}`,
      name: form.name,
      handle: form.handle.startsWith('@') ? form.handle : `@${form.handle}`,
      platform: form.platform,
      followers: parseInt(form.followers) || 0,
      avgViews: parseInt(form.avgViews) || 0,
      postsPerWeek: parseFloat(form.postsPerWeek) || 1,
      engagementRate: parseFloat(form.engagementRate) || 0,
      topNiches: topics.slice(0, 3),
      recentTopics: topics,
      color: nextColor,
    }
    onAdd(newComp)
  }

  const inputStyle: React.CSSProperties = {
    ...fontSans,
    width: '100%',
    background: 'rgba(59,130,246,0.06)',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: C.text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    ...fontSans,
    fontSize: 11,
    color: C.muted,
    fontWeight: 600,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    display: 'block',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(8,8,16,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          background: C.card,
          border: `1px solid ${C.borderStrong}`,
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding: '28px 28px 36px',
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 24px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ ...fontSans, fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>Add Competitor</h3>
            <p style={{ ...fontSans, fontSize: 13, color: C.muted, margin: '4px 0 0' }}>Track a creator in your niche</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
              color: C.muted, cursor: 'pointer', padding: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Name + Handle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Creator Name</label>
              <input
                style={inputStyle}
                placeholder="e.g. TechVibe"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Handle</label>
              <input
                style={inputStyle}
                placeholder="@handle"
                value={form.handle}
                onChange={e => set('handle', e.target.value)}
              />
            </div>
          </div>

          {/* Platform */}
          <div>
            <label style={labelStyle}>Platform</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['youtube', 'instagram', 'tiktok'] as const).map(p => {
                const cfg = PLATFORM_CONFIG[p]
                const active = form.platform === p
                return (
                  <button
                    key={p}
                    onClick={() => set('platform', p)}
                    style={{
                      flex: 1,
                      padding: '9px 4px',
                      borderRadius: 8,
                      border: `1px solid ${active ? cfg.color : C.border}`,
                      background: active ? cfg.bg : 'transparent',
                      color: active ? cfg.color : C.muted,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      ...fontSans,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'followers', label: 'Followers', placeholder: '1200000' },
              { key: 'avgViews', label: 'Avg Views', placeholder: '500000' },
              { key: 'postsPerWeek', label: 'Posts / Week', placeholder: '3' },
              { key: 'engagementRate', label: 'Engagement %', placeholder: '5.2' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  style={inputStyle}
                  placeholder={placeholder}
                  type="number"
                  value={form[key as keyof typeof form]}
                  onChange={e => set(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* Content Topics */}
          <div>
            <label style={labelStyle}>Content Topics (up to 5)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="e.g. Gadget Reviews"
                value={topicInput}
                onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic() } }}
              />
              <button
                onClick={addTopic}
                style={{
                  background: C.primary, border: 'none', borderRadius: 8,
                  color: '#fff', cursor: 'pointer', padding: '10px 14px',
                  fontSize: 13, fontWeight: 600, ...fontSans,
                }}
              >
                Add
              </button>
            </div>
            {topics.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topics.map(t => (
                  <span
                    key={t}
                    style={{
                      ...fontSans,
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 20,
                      background: 'rgba(59,130,246,0.12)',
                      border: `1px solid rgba(59,130,246,0.25)`,
                      color: C.primary,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {t}
                    <button
                      onClick={() => setTopics(prev => prev.filter(x => x !== t))}
                      style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.name || !form.handle}
          style={{
            ...fontSans,
            marginTop: 24,
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            border: 'none',
            background: !form.name || !form.handle
              ? 'rgba(59,130,246,0.2)'
              : `linear-gradient(135deg, ${C.primary}, #2563eb)`,
            color: !form.name || !form.handle ? C.muted : '#fff',
            cursor: !form.name || !form.handle ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.02em',
            transition: 'all 0.15s ease',
          }}
        >
          Add to Radar
        </button>
      </motion.div>
    </motion.div>
  )
}

// ─── Competitor Card ──────────────────────────────────────────────────────────

function CompetitorCard({ comp, onRemove, index }: { comp: Competitor; onRemove: () => void; index: number }) {
  const [hovered, setHovered] = useState(false)
  const platform = PLATFORM_CONFIG[comp.platform]
  const seedNum = comp.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)

  const stats = [
    { label: 'Followers', value: fmt(comp.followers), icon: <Users size={13} />, color: C.primary },
    { label: 'Avg Views', value: fmt(comp.avgViews), icon: <Eye size={13} />, color: C.purple },
    { label: 'Posts/Wk', value: comp.postsPerWeek.toString(), icon: <BarChart3 size={13} />, color: C.warning },
    { label: 'Engagement', value: `${comp.engagementRate}%`, icon: <TrendingUp size={13} />, color: C.green },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? comp.color + '40' : C.border}`,
        borderRadius: 16,
        padding: '20px',
        position: 'relative',
        cursor: 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? `0 0 20px ${comp.color}18` : 'none',
      }}
    >
      {/* Color indicator dot */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: comp.color,
        boxShadow: `0 0 8px ${comp.color}`,
      }} />

      {/* Remove button */}
      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={onRemove}
            aria-label={`Remove ${comp.name}`}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 6, color: C.red,
              cursor: 'pointer', padding: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ paddingLeft: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            ...fontSans, fontSize: 15, fontWeight: 700, color: C.text,
          }}>
            {comp.name}
          </span>
          <span style={{
            ...fontSans, fontSize: 11, fontWeight: 600,
            color: platform.color, background: platform.bg,
            padding: '2px 8px', borderRadius: 20,
          }}>
            {platform.label}
          </span>
        </div>
        <div style={{ ...fontSans, fontSize: 12, color: C.muted, marginTop: 2 }}>{comp.handle}</div>
      </div>

      {/* Stats 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: '10px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: stat.color, marginBottom: 4 }}>
              {stat.icon}
              <span style={{ ...fontSans, fontSize: 10, color: C.muted, fontWeight: 600 }}>{stat.label}</span>
            </div>
            <div style={{ ...fontMono, fontSize: 16, fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ ...fontSans, fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 6 }}>GROWTH TREND</div>
        <Sparkline color={comp.color} seed={seedNum} />
      </div>

      {/* Topics */}
      {comp.topNiches.length > 0 && (
        <div>
          <div style={{ ...fontSans, fontSize: 10, color: C.muted, fontWeight: 600, marginBottom: 6 }}>CONTENT TOPICS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {comp.topNiches.map(n => (
              <span key={n} style={{
                ...fontSans,
                fontSize: 11,
                padding: '3px 8px',
                borderRadius: 20,
                background: `${comp.color}15`,
                border: `1px solid ${comp.color}35`,
                color: comp.color,
              }}>
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable({ competitors }: { competitors: Competitor[] }) {
  const metrics: {
    label: string
    myVal: string | number
    myRaw: number
    get: (c: Competitor) => { display: string; raw: number }
    higherIsBetter: boolean
  }[] = [
    {
      label: 'Followers',
      myVal: fmt(MY_STATS.followers),
      myRaw: MY_STATS.followers,
      get: c => ({ display: fmt(c.followers), raw: c.followers }),
      higherIsBetter: true,
    },
    {
      label: 'Avg Views',
      myVal: fmt(MY_STATS.avgViews),
      myRaw: MY_STATS.avgViews,
      get: c => ({ display: fmt(c.avgViews), raw: c.avgViews }),
      higherIsBetter: true,
    },
    {
      label: 'Engagement Rate',
      myVal: `${MY_STATS.engagementRate}%`,
      myRaw: MY_STATS.engagementRate,
      get: c => ({ display: `${c.engagementRate}%`, raw: c.engagementRate }),
      higherIsBetter: true,
    },
    {
      label: 'Posts / Week',
      myVal: MY_STATS.postsPerWeek,
      myRaw: MY_STATS.postsPerWeek,
      get: c => ({ display: c.postsPerWeek.toString(), raw: c.postsPerWeek }),
      higherIsBetter: true,
    },
    {
      label: 'Est. Monthly Rev',
      myVal: fmtRupees(MY_STATS.estMonthlyRevenue),
      myRaw: MY_STATS.estMonthlyRevenue,
      get: c => ({ display: fmtRupees(estRevenue(c)), raw: estRevenue(c) }),
      higherIsBetter: true,
    },
  ]

  const cellBase: React.CSSProperties = {
    ...fontMono,
    padding: '12px 16px',
    fontSize: 13,
    borderBottom: `1px solid ${C.border}`,
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{
              ...fontSans,
              padding: '10px 16px',
              textAlign: 'left',
              fontSize: 11,
              color: C.muted,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: `1px solid ${C.border}`,
            }}>
              Metric
            </th>
            {/* You column */}
            <th style={{
              ...fontSans,
              padding: '10px 16px',
              fontSize: 11,
              color: C.primary,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: `1px solid ${C.border}`,
              borderLeft: `2px solid ${C.primary}`,
              borderRight: `2px solid ${C.primary}`,
              background: 'rgba(59,130,246,0.05)',
              textAlign: 'center',
            }}>
              You
            </th>
            {competitors.map(c => (
              <th key={c.id} style={{
                ...fontSans,
                padding: '10px 16px',
                fontSize: 11,
                color: c.color,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderBottom: `1px solid ${C.border}`,
                textAlign: 'center',
              }}>
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, mi) => (
            <motion.tr
              key={m.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: mi * 0.04, ease: 'easeOut' }}
              style={{ transition: 'background 0.15s' }}
            >
              <td style={{ ...cellBase, ...fontSans, color: C.mutedLight, fontWeight: 500 }}>
                {m.label}
              </td>
              {/* You column */}
              <td style={{
                ...cellBase,
                textAlign: 'center',
                color: C.primary,
                borderLeft: `2px solid ${C.primary}`,
                borderRight: `2px solid ${C.primary}`,
                background: 'rgba(59,130,246,0.04)',
                fontWeight: 700,
              }}>
                {m.myVal}
              </td>
              {competitors.map(c => {
                const { display, raw } = m.get(c)
                const isBehind = m.higherIsBetter ? raw > m.myRaw : raw < m.myRaw
                return (
                  <td key={c.id} style={{
                    ...cellBase,
                    textAlign: 'center',
                    color: isBehind ? C.red : C.green,
                    fontWeight: 600,
                  }}>
                    {display}
                  </td>
                )
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Content Gap Analysis ─────────────────────────────────────────────────────

const GAP_DATA = [
  {
    topic: 'Behind-the-Scenes Content',
    winners: 3,
    score: 87,
    why: 'Builds parasocial bonds — 2x comment rate vs regular content',
    icon: <Globe size={14} />,
    color: C.purple,
  },
  {
    topic: 'Day-in-the-Life Vlogs',
    winners: 4,
    score: 82,
    why: 'Top of algorithm for watch time — averages 8min+ retention',
    icon: <Eye size={14} />,
    color: C.green,
  },
  {
    topic: 'Tool/App Reviews under ₹500',
    winners: 2,
    score: 74,
    why: 'High search volume + affiliate monetization potential',
    icon: <Target size={14} />,
    color: C.warning,
  },
  {
    topic: 'Late-Night Storytime',
    winners: 0,
    score: 91,
    why: 'Zero competition in your niche — 12am–2am has 18% higher engagement',
    icon: <Zap size={14} />,
    color: C.primary,
  },
  {
    topic: 'Collab / Reaction Videos',
    winners: 3,
    score: 69,
    why: 'Cross-audience reach — competitors average 3x follower bump per collab',
    icon: <Users size={14} />,
    color: '#ec4899',
  },
  {
    topic: 'Weekly Industry News Recap',
    winners: 2,
    score: 77,
    why: 'Recurring series drives 40% subscriber return rate',
    icon: <BarChart3 size={14} />,
    color: C.green,
  },
]

function GapCard({ gap, index }: { gap: typeof GAP_DATA[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, ease: 'easeOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? gap.color + '40' : C.border}`,
        borderRadius: 14,
        padding: '18px',
        cursor: 'default',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? `0 0 16px ${gap.color}18` : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${gap.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: gap.color,
          }}>
            {gap.icon}
          </div>
          <span style={{ ...fontSans, fontSize: 13, fontWeight: 700, color: C.text }}>{gap.topic}</span>
        </div>
        {/* Score */}
        <div style={{
          ...fontMono,
          fontSize: 16,
          fontWeight: 700,
          color: gap.score >= 85 ? C.green : gap.score >= 70 ? C.warning : C.muted,
          minWidth: 48,
          textAlign: 'right',
        }}>
          {gap.score}<span style={{ fontSize: 10, color: C.muted }}>/100</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{
          ...fontSans,
          fontSize: 11,
          padding: '3px 8px',
          borderRadius: 20,
          background: gap.winners === 0 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.10)',
          border: `1px solid ${gap.winners === 0 ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.20)'}`,
          color: gap.winners === 0 ? C.green : C.warning,
          fontWeight: 600,
        }}>
          {gap.winners === 0 ? 'Untapped gap' : `${gap.winners}/5 competitors posting this`}
        </div>
      </div>

      <p style={{ ...fontSans, fontSize: 12, color: C.mutedLight, margin: 0, lineHeight: 1.5 }}>
        {gap.why}
      </p>

      {/* Score bar */}
      <div style={{ marginTop: 12, background: 'rgba(59,130,246,0.08)', borderRadius: 4, height: 3 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${gap.score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 * index }}
          style={{
            height: '100%', borderRadius: 4,
            background: gap.score >= 85 ? C.green : gap.score >= 70 ? C.warning : C.primary,
          }}
        />
      </div>
    </motion.div>
  )
}

// ─── Intelligence Summary ─────────────────────────────────────────────────────

function generateInsights(competitors: Competitor[]): string[] {
  if (competitors.length === 0) {
    return [
      'Add competitors above to see personalized intelligence',
      'Track up to 5 creators in your niche for best results',
      'Content gaps and posting opportunities will appear here',
    ]
  }

  const avgPosts = competitors.reduce((s, c) => s + c.postsPerWeek, 0) / competitors.length
  const topEng = [...competitors].sort((a, b) => b.engagementRate - a.engagementRate)[0]
  const topFollowers = [...competitors].sort((a, b) => b.followers - a.followers)[0]

  return [
    `You post ${MY_STATS.postsPerWeek}x/week — top competitors average ${avgPosts.toFixed(1)}x. Closing this gap could 3x your algorithm reach.`,
    `${topEng.name} (${topEng.engagementRate}% engagement) outperforms you by ${(topEng.engagementRate - MY_STATS.engagementRate).toFixed(1)}% — their tutorial + storytime format drives deeper connection.`,
    `${topFollowers.name} has ${fmt(topFollowers.followers)} followers — they dominate ${topFollowers.topNiches[0] || 'entertainment'}. Late-night content (12am–2am) is an untapped gap none of them fill.`,
  ]
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'creator-competitor-radar'

export function CompetitorRadar() {
  const [competitors, setCompetitors] = useState<Competitor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved) as Competitor[]
    } catch {}
    return DEFAULT_COMPETITORS
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'gaps' | 'heatmap'>('overview')
  const [search, setSearch] = useState('')

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(competitors))
    } catch {}
  }, [competitors])

  const addCompetitor = useCallback((c: Competitor) => {
    if (competitors.length >= 5) return
    setCompetitors(prev => [...prev, c])
    setShowAddModal(false)
  }, [competitors.length])

  const removeCompetitor = useCallback((id: string) => {
    setCompetitors(prev => prev.filter(c => c.id !== id))
  }, [])

  const usedColors = competitors.map(c => c.color)
  const insights = generateInsights(competitors)

  const filteredCompetitors = search.trim()
    ? competitors.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.handle.toLowerCase().includes(search.toLowerCase())
      )
    : competitors

  const tabs: { key: typeof activeTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 size={13} /> },
    { key: 'compare', label: 'Compare', icon: <TrendingUp size={13} /> },
    { key: 'gaps', label: 'Content Gaps', icon: <Target size={13} /> },
    { key: 'heatmap', label: 'Posting Map', icon: <Globe size={13} /> },
  ]

  return (
    <div style={{ ...fontSans, background: C.bg, minHeight: '100vh', color: C.text, padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(59,130,246,0.15)',
              border: `1px solid rgba(59,130,246,0.3)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Target size={18} color={C.primary} />
            </div>
            <h1 style={{ ...fontSans, fontSize: 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
              Competitor Radar
            </h1>
          </div>
          <p style={{ ...fontSans, fontSize: 13, color: C.muted, margin: 0 }}>
            Track up to 5 creators — find content gaps & outpost them
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} color={C.muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search competitors…"
              style={{
                ...fontSans,
                paddingLeft: 32, paddingRight: 12,
                padding: '9px 12px 9px 32px',
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 9,
                color: C.text,
                fontSize: 13,
                outline: 'none',
                width: 180,
              }}
            />
          </div>

          {/* Add button */}
          <button
            onClick={() => setShowAddModal(true)}
            disabled={competitors.length >= 5}
            aria-label="Add competitor"
            style={{
              ...fontSans,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              border: `1.5px solid ${competitors.length >= 5 ? C.border : C.primary}`,
              background: competitors.length >= 5 ? 'transparent' : 'rgba(59,130,246,0.1)',
              color: competitors.length >= 5 ? C.muted : C.primary,
              cursor: competitors.length >= 5 ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={14} />
            Add Competitor
            <span style={{
              ...fontMono,
              fontSize: 10,
              padding: '1px 6px',
              borderRadius: 10,
              background: 'rgba(59,130,246,0.15)',
              color: C.primary,
            }}>
              {competitors.length}/5
            </span>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...fontSans,
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? C.primary : 'transparent'}`,
                color: active ? C.primary : C.muted,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                marginBottom: -1,
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {filteredCompetitors.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '64px 24px',
                background: C.card,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}>
                <Target size={40} color={C.muted} style={{ marginBottom: 16 }} />
                <h3 style={{ ...fontSans, color: C.mutedLight, fontWeight: 600, marginBottom: 8 }}>
                  {search ? 'No competitors match your search' : 'No competitors tracked yet'}
                </h3>
                <p style={{ ...fontSans, color: C.muted, fontSize: 13 }}>
                  {search ? 'Try a different search term' : 'Click "Add Competitor" to start tracking creators in your niche'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}>
                <AnimatePresence>
                  {filteredCompetitors.map((comp, i) => (
                    <CompetitorCard
                      key={comp.id}
                      comp={comp}
                      index={i}
                      onRemove={() => removeCompetitor(comp.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'compare' && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {competitors.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '64px 24px',
                background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
              }}>
                <BarChart3 size={40} color={C.muted} style={{ marginBottom: 16 }} />
                <p style={{ ...fontSans, color: C.muted, fontSize: 13 }}>Add competitors to compare metrics</p>
              </div>
            ) : (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={15} color={C.primary} />
                  <span style={{ ...fontSans, fontSize: 14, fontWeight: 700, color: C.text }}>Side-by-Side Comparison</span>
                  <span style={{ ...fontSans, fontSize: 12, color: C.muted, marginLeft: 4 }}>
                    Green = you're ahead, Red = behind
                  </span>
                </div>
                <ComparisonTable competitors={competitors} />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'gaps' && (
          <motion.div
            key="gaps"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ ...fontSans, fontSize: 16, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>
                Opportunities You're Missing
              </h2>
              <p style={{ ...fontSans, fontSize: 13, color: C.muted, margin: 0 }}>
                Content formats competitors use that you haven't explored yet
              </p>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {GAP_DATA.map((gap, i) => (
                <GapCard key={gap.topic} gap={gap} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'heatmap' && (
          <motion.div
            key="heatmap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Globe size={15} color={C.primary} />
                <div>
                  <h2 style={{ ...fontSans, fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
                    Posting Pattern Heatmap
                  </h2>
                  <p style={{ ...fontSans, fontSize: 12, color: C.muted, margin: '3px 0 0' }}>
                    When competitors typically post — spot the gaps
                  </p>
                </div>
              </div>

              {competitors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ ...fontSans, color: C.muted, fontSize: 13 }}>Add competitors to see their posting patterns</p>
                </div>
              ) : (
                <PostingHeatmap competitors={competitors} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Intelligence Summary ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        style={{
          marginTop: 28,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: '22px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(167,139,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color={C.purple} />
          </div>
          <span style={{ ...fontSans, fontSize: 14, fontWeight: 700, color: C.text }}>Key Insights</span>
          <span style={{
            ...fontSans,
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.2)',
            color: C.purple,
            fontWeight: 600,
          }}>
            AI Generated
          </span>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.07, ease: 'easeOut' }}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                background: 'rgba(167,139,250,0.04)',
                border: '1px solid rgba(167,139,250,0.1)',
                borderRadius: 10,
                alignItems: 'flex-start',
              }}
            >
              <ChevronRight size={14} color={C.purple} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ ...fontSans, fontSize: 13, color: C.mutedLight, margin: 0, lineHeight: 1.55 }}>
                {insight}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Add Competitor Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <AddCompetitorModal
            onAdd={addCompetitor}
            onClose={() => setShowAddModal(false)}
            usedColors={usedColors}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
