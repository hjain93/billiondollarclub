import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Target, Zap, Calendar, Users, ArrowUp,
  BarChart3, RefreshCw, Sparkles, ChevronRight, Award,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Baseline {
  followers: number
  monthlyGrowth: number
  engagementRate: number
  postsPerWeek: number
  monthlyRevenue: number
  platform: 'youtube' | 'instagram' | 'tiktok'
}

interface Strategy {
  postingFrequency: number
  contentQuality: number       // 1–5
  collabsPerMonth: number
  paidBudget: number
  brandDeals: boolean
  affiliate: boolean
  merch: boolean
  courses: boolean
}

interface MonthlyData {
  month: number
  followers: number
  revenue: number
}

interface Monetization {
  brandDeals: boolean
  affiliate: boolean
  merch: boolean
  courses: boolean
}

// ─── Calculation Engine ──────────────────────────────────────────────────────

const QUALITY_ENGAGEMENT_MULTIPLIER = [1, 1.1, 1.25, 1.45, 1.7, 2.0]
const COLLAB_FOLLOWERS_PER = 120
const PAID_FOLLOWERS_PER_RUPEE = 0.04
const FREQ_MULTIPLIER_BASE = 0.015

function projectGrowth(baseline: Baseline, strategy: Strategy): MonthlyData[] {
  const qualityMult = QUALITY_ENGAGEMENT_MULTIPLIER[strategy.contentQuality] ?? 1
  const freqBoost = 1 + (strategy.postingFrequency - baseline.postsPerWeek) * FREQ_MULTIPLIER_BASE
  const collabBoost = strategy.collabsPerMonth * COLLAB_FOLLOWERS_PER
  const paidBoost = strategy.paidBudget * PAID_FOLLOWERS_PER_RUPEE
  const baseEngMult = (baseline.engagementRate / 100) * qualityMult
  const effectiveGrowthRate = (baseline.monthlyGrowth / baseline.followers) * freqBoost * (1 + baseEngMult)

  const data: MonthlyData[] = []
  let currentFollowers = baseline.followers

  for (let m = 1; m <= 12; m++) {
    currentFollowers = Math.round(
      currentFollowers * (1 + effectiveGrowthRate) + collabBoost + paidBoost
    )
    const revenue = projectRevenue(currentFollowers, baseline.engagementRate * qualityMult, {
      brandDeals: strategy.brandDeals,
      affiliate: strategy.affiliate,
      merch: strategy.merch,
      courses: strategy.courses,
    })
    data.push({ month: m, followers: currentFollowers, revenue })
  }
  return data
}

function projectBaselineGrowth(baseline: Baseline): MonthlyData[] {
  const baseRate = baseline.monthlyGrowth / baseline.followers
  const data: MonthlyData[] = []
  let cur = baseline.followers
  for (let m = 1; m <= 12; m++) {
    cur = Math.round(cur * (1 + baseRate))
    data.push({ month: m, followers: cur, revenue: baseline.monthlyRevenue })
  }
  return data
}

function projectRevenue(followers: number, engRate: number, flags: Monetization): number {
  let rev = 0
  const engMult = Math.min(3, engRate / 3.5)
  if (flags.brandDeals) rev += (followers / 10000) * 1000 * engMult
  if (flags.affiliate) rev += followers * 0.002 * 450
  if (flags.merch) rev += followers * 0.0005 * 800
  if (flags.courses) rev += followers * 0.001 * 2000
  return Math.round(rev)
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString('en-IN')
}

function fmtRupee(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function addMonths(n: number): string {
  const d = new Date(2026, 2, 23)   // today: Mar 2026
  d.setMonth(d.getMonth() + n)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

// ─── SVG Growth Chart ─────────────────────────────────────────────────────────

const MILESTONES = [10000, 50000, 100000, 500000, 1000000]

function GrowthChart({
  baseline,
  optimized,
  currentFollowers,
}: {
  baseline: MonthlyData[]
  optimized: MonthlyData[]
  currentFollowers: number
}) {
  const W = 560
  const H = 220
  const PAD = { top: 20, right: 24, bottom: 36, left: 64 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const allValues = [
    currentFollowers,
    ...baseline.map(d => d.followers),
    ...optimized.map(d => d.followers),
  ]
  const maxVal = Math.max(...allValues) * 1.05
  const minVal = Math.min(...allValues) * 0.95

  const xScale = (i: number) => PAD.left + (i / 12) * chartW
  const yScale = (v: number) => PAD.top + chartH - ((v - minVal) / (maxVal - minVal)) * chartH

  const basePoints = [
    { x: xScale(0), y: yScale(currentFollowers) },
    ...baseline.map((d, i) => ({ x: xScale(i + 1), y: yScale(d.followers) })),
  ]
  const optPoints = [
    { x: xScale(0), y: yScale(currentFollowers) },
    ...optimized.map((d, i) => ({ x: xScale(i + 1), y: yScale(d.followers) })),
  ]

  const toPolyline = (pts: { x: number; y: number }[]) =>
    pts.map(p => `${p.x},${p.y}`).join(' ')

  // Area fill for optimized
  const areaPath = [
    `M ${optPoints[0].x},${optPoints[0].y}`,
    ...optPoints.slice(1).map(p => `L ${p.x},${p.y}`),
    `L ${optPoints[optPoints.length - 1].x},${PAD.top + chartH}`,
    `L ${optPoints[0].x},${PAD.top + chartH}`,
    'Z',
  ].join(' ')

  // Y-axis labels
  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = minVal + ((maxVal - minVal) * i) / yTicks
    return { val, y: yScale(val) }
  })

  // Month labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const startMonthIdx = 3 // April (0-indexed)

  // Milestone dots on optimized line
  const milestoneDots = MILESTONES.map(m => {
    const hitIdx = optimized.findIndex(d => d.followers >= m)
    if (hitIdx === -1) return null
    const pt = optPoints[hitIdx + 1]
    return { milestone: m, x: pt.x, y: pt.y }
  }).filter(Boolean)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ overflow: 'visible', display: 'block' }}
    >
      <defs>
        <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yLabels.map((t, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={t.y}
            x2={PAD.left + chartW} y2={t.y}
            stroke="rgba(59,130,246,0.08)"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={t.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#4b5680"
            fontFamily="'Space Mono', monospace"
          >
            {fmtNum(Math.round(t.val))}
          </text>
        </g>
      ))}

      {/* X-axis month labels */}
      {[0, 2, 4, 6, 8, 10, 11].map(i => (
        <text
          key={i}
          x={xScale(i + 1)}
          y={PAD.top + chartH + 18}
          textAnchor="middle"
          fontSize="10"
          fill="#4b5680"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {monthNames[(startMonthIdx + i) % 12]}
        </text>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#optGrad)" />

      {/* Baseline trajectory (dashed gray) */}
      <polyline
        points={toPolyline(basePoints)}
        fill="none"
        stroke="rgba(75,86,128,0.5)"
        strokeWidth="1.5"
        strokeDasharray="5,4"
      />

      {/* Optimized trajectory */}
      <polyline
        points={toPolyline(optPoints)}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />

      {/* Milestone dots */}
      {milestoneDots.map((dot, i) => dot && (
        <g key={i}>
          <circle cx={dot.x} cy={dot.y} r={5} fill="#0d0d1a" stroke="#10b981" strokeWidth="2" />
          <circle cx={dot.x} cy={dot.y} r={2} fill="#10b981" />
        </g>
      ))}

      {/* Start dot */}
      <circle cx={xScale(0)} cy={yScale(currentFollowers)} r={4} fill="#3b82f6" />

      {/* Legend */}
      <g transform={`translate(${PAD.left}, ${H - 6})`}>
        <line x1="0" y1="0" x2="18" y2="0" stroke="rgba(75,86,128,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
        <text x="22" y="4" fontSize="10" fill="#4b5680" fontFamily="'Plus Jakarta Sans', sans-serif">Current trajectory</text>
        <line x1="120" y1="0" x2="138" y2="0" stroke="#3b82f6" strokeWidth="2" />
        <text x="142" y="4" fontSize="10" fill="#a0aec0" fontFamily="'Plus Jakarta Sans', sans-serif">Optimized</text>
        <circle cx="206" cy="0" r="3.5" fill="#0d0d1a" stroke="#10b981" strokeWidth="1.5" />
        <text x="212" y="4" fontSize="10" fill="#4b5680" fontFamily="'Plus Jakarta Sans', sans-serif">Milestone</text>
      </g>
    </svg>
  )
}

// ─── Custom Slider ────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step, onChange, format, baselineValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  baselineValue?: number
}) {
  const fmt = format ?? ((v: number) => String(v))
  const pct = ((value - min) / (max - min)) * 100
  const changed = baselineValue !== undefined && value !== baselineValue
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 600, letterSpacing: '0.02em' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {baselineValue !== undefined && (
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              color: '#4b5680',
              textDecoration: 'line-through',
            }}>
              {fmt(baselineValue)}
            </span>
          )}
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
            fontWeight: 700,
            color: changed ? '#3b82f6' : '#f0f4ff',
            padding: '2px 8px',
            background: changed ? 'rgba(59,130,246,0.12)' : 'transparent',
            borderRadius: 6,
            transition: 'all 0.2s',
          }}>
            {fmt(value)}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 6 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(59,130,246,0.12)',
          borderRadius: 3,
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${pct}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #a78bfa)',
          borderRadius: 3,
          transition: 'width 0.15s',
        }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step ?? 1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
            margin: 0,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: '#4b5680' }}>{fmt(min)}</span>
        <span style={{ fontSize: 10, color: '#4b5680' }}>{fmt(max)}</span>
      </div>
    </div>
  )
}

// ─── Toggle Pill ──────────────────────────────────────────────────────────────

function TogglePill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: 20,
        border: `1px solid ${active ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
        color: active ? '#3b82f6' : '#4b5680',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {label}
    </button>
  )
}

// ─── Revenue Projection Card ──────────────────────────────────────────────────

function RevCard({
  label, value, color, icon,
}: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: '#0d0d1a',
      border: `1px solid rgba(59,130,246,0.1)`,
      borderRadius: 14,
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ color }}>{icon}</div>
        <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 26,
        fontWeight: 700,
        color,
        letterSpacing: '-0.02em',
      }}>{value}</div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_BASELINE: Baseline = {
  followers: 10000,
  monthlyGrowth: 350,
  engagementRate: 3.5,
  postsPerWeek: 2,
  monthlyRevenue: 15000,
  platform: 'instagram',
}

const QUALITY_LABELS = ['', 'Current', 'Improving', 'Good', 'Great', 'Pro Level']

export function GrowthSimulator() {
  const [baseline, setBaseline] = useState<Baseline>(DEFAULT_BASELINE)
  const [strategy, setStrategy] = useState<Strategy>({
    postingFrequency: DEFAULT_BASELINE.postsPerWeek,
    contentQuality: 1,
    collabsPerMonth: 0,
    paidBudget: 0,
    brandDeals: true,
    affiliate: false,
    merch: false,
    courses: false,
  })

  const updateBaseline = useCallback(<K extends keyof Baseline>(k: K, v: Baseline[K]) =>
    setBaseline(prev => ({ ...prev, [k]: v })), [])

  const updateStrategy = useCallback(<K extends keyof Strategy>(k: K, v: Strategy[K]) =>
    setStrategy(prev => ({ ...prev, [k]: v })), [])

  const resetStrategy = () => setStrategy({
    postingFrequency: baseline.postsPerWeek,
    contentQuality: 1,
    collabsPerMonth: 0,
    paidBudget: 0,
    brandDeals: true,
    affiliate: false,
    merch: false,
    courses: false,
  })

  const baselineData = useMemo(() => projectBaselineGrowth(baseline), [baseline])
  const optimizedData = useMemo(() => projectGrowth(baseline, strategy), [baseline, strategy])

  // Revenue projections
  const rev3 = optimizedData[2]?.revenue ?? 0
  const rev6 = optimizedData[5]?.revenue ?? 0
  const rev12 = optimizedData[11]?.revenue ?? 0

  // Break-even for paid promotion
  const breakEvenMonth = useMemo(() => {
    if (strategy.paidBudget === 0) return null
    let cumRevGain = 0
    for (let i = 0; i < 12; i++) {
      const gain = (optimizedData[i]?.revenue ?? 0) - baseline.monthlyRevenue
      cumRevGain += gain
      if (cumRevGain >= strategy.paidBudget * (i + 1)) return i + 1
    }
    return null
  }, [optimizedData, baseline.monthlyRevenue, strategy.paidBudget])

  // Milestones
  const milestones = useMemo(() => {
    const results: { label: string; monthsFromNow: number; icon: React.ReactNode }[] = []

    MILESTONES.forEach(m => {
      if (baseline.followers >= m) return
      const hitIdx = optimizedData.findIndex(d => d.followers >= m)
      if (hitIdx !== -1) {
        results.push({
          label: `${fmtNum(m)} followers`,
          monthsFromNow: hitIdx + 1,
          icon: <Users size={13} />,
        })
      }
    })

    // Revenue milestones
    const revTargets = [50000, 100000, 500000, 1000000]
    revTargets.forEach(t => {
      if (baseline.monthlyRevenue >= t) return
      const hitIdx = optimizedData.findIndex(d => d.revenue >= t)
      if (hitIdx !== -1) {
        results.push({
          label: `${fmtRupee(t)}/month revenue`,
          monthsFromNow: hitIdx + 1,
          icon: <TrendingUp size={13} />,
        })
      }
    })

    // YouTube Partner Program
    if (baseline.platform === 'youtube' && baseline.followers < 1000) {
      const hitIdx = optimizedData.findIndex(d => d.followers >= 1000)
      if (hitIdx !== -1) results.push({ label: 'Unlock YouTube Partner Program', monthsFromNow: hitIdx + 1, icon: <Award size={13} /> })
    }

    return results.sort((a, b) => a.monthsFromNow - b.monthsFromNow).slice(0, 5)
  }, [optimizedData, baseline])

  // Key insight
  const insight = useMemo(() => {
    // Test each lever independently
    const currentFollowers12 = optimizedData[11]?.followers ?? 0

    // Freq test
    const freqStrategy = { ...strategy, postingFrequency: Math.min(14, strategy.postingFrequency + 2) }
    const freqData = projectGrowth(baseline, freqStrategy)
    const freqGain = (freqData[11]?.followers ?? 0) - currentFollowers12

    // Quality test
    const qualStrategy = { ...strategy, contentQuality: Math.min(5, strategy.contentQuality + 2) }
    const qualData = projectGrowth(baseline, qualStrategy)
    const qualGain = (qualData[11]?.followers ?? 0) - currentFollowers12

    // Collab test
    const collabStrategy = { ...strategy, collabsPerMonth: strategy.collabsPerMonth + 3 }
    const collabData = projectGrowth(baseline, collabStrategy)
    const collabGain = (collabData[11]?.followers ?? 0) - currentFollowers12

    const levers = [
      { name: 'posting frequency', gain: freqGain, detail: `${strategy.postingFrequency}→${Math.min(14, strategy.postingFrequency + 2)}/week` },
      { name: 'content quality', gain: qualGain, detail: `${QUALITY_LABELS[strategy.contentQuality]}→${QUALITY_LABELS[Math.min(5, strategy.contentQuality + 2)]}` },
      { name: 'collaborations', gain: collabGain, detail: `+3 collabs/month` },
    ]
    const top = levers.reduce((a, b) => a.gain > b.gain ? a : b)

    // Month saver: how many months sooner you'd hit 100K
    const target = Math.max(100000, baseline.followers * 5)
    const baseHit = baselineData.findIndex(d => d.followers >= target)
    const optHit = optimizedData.findIndex(d => d.followers >= target)
    const monthsSaved = baseHit !== -1 && optHit !== -1 ? baseHit - optHit : 0

    return { lever: top, target: fmtNum(target), monthsSaved }
  }, [strategy, baseline, optimizedData, baselineData])

  const hasChange =
    strategy.postingFrequency !== baseline.postsPerWeek ||
    strategy.contentQuality !== 1 ||
    strategy.collabsPerMonth > 0 ||
    strategy.paidBudget > 0

  const finalFollowers = optimizedData[11]?.followers ?? baseline.followers
  const finalBaseFollowers = baselineData[11]?.followers ?? baseline.followers
  const upliftPct = finalBaseFollowers > 0
    ? Math.round(((finalFollowers - finalBaseFollowers) / finalBaseFollowers) * 100)
    : 0

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#f0f4ff',
      padding: '28px 24px',
    }}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', margin: 0 }}>Growth Simulator</h1>
            <p style={{ fontSize: 12, color: '#4b5680', margin: 0, marginTop: 1 }}>
              Model your growth trajectory with what-if scenarios
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Section 1: Baseline Setup ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: '#0d0d1a',
          border: '1px solid rgba(59,130,246,0.1)',
          borderRadius: 18,
          padding: '22px 24px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <BarChart3 size={15} color="#3b82f6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Your Baseline Stats</span>
          <span style={{ fontSize: 11, color: '#4b5680', marginLeft: 4 }}>Current starting point</span>
        </div>

        {/* Platform selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['instagram', 'youtube', 'tiktok'] as const).map(p => (
            <button
              key={p}
              onClick={() => updateBaseline('platform', p)}
              style={{
                padding: '7px 16px',
                borderRadius: 10,
                border: `1px solid ${baseline.platform === p ? '#3b82f6' : 'rgba(59,130,246,0.12)'}`,
                background: baseline.platform === p ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: baseline.platform === p ? '#3b82f6' : '#4b5680',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {p === 'instagram' ? 'Instagram' : p === 'youtube' ? 'YouTube' : 'TikTok'}
            </button>
          ))}
        </div>

        {/* Inputs grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { label: 'Current Followers', key: 'followers' as const, prefix: '', suffix: '' },
            { label: 'Monthly Follower Growth', key: 'monthlyGrowth' as const, prefix: '', suffix: '' },
            { label: 'Avg Engagement Rate', key: 'engagementRate' as const, prefix: '', suffix: '%' },
            { label: 'Posts per Week', key: 'postsPerWeek' as const, prefix: '', suffix: '' },
            { label: 'Monthly Revenue', key: 'monthlyRevenue' as const, prefix: '₹', suffix: '' },
          ].map(({ label, key, prefix, suffix }) => (
            <div key={key}>
              <label style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, display: 'block', marginBottom: 6, letterSpacing: '0.03em' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                {prefix && (
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: '#4b5680', fontFamily: "'Space Mono', monospace",
                  }}>{prefix}</span>
                )}
                <input
                  type="number"
                  value={baseline[key] as number}
                  onChange={e => updateBaseline(key, Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(59,130,246,0.05)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 10,
                    padding: prefix ? '9px 12px 9px 24px' : '9px 12px',
                    color: '#f0f4ff',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {suffix && (
                  <span style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, color: '#4b5680',
                  }}>{suffix}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Sections 2 + 3: Two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '40% 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Section 2: Simulator Controls ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 18,
            padding: '22px 22px',
            position: 'sticky',
            top: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Adjust Your Strategy</span>
            </div>
            <button
              onClick={resetStrategy}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8,
                border: '1px solid rgba(59,130,246,0.15)',
                background: 'transparent', color: '#4b5680',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <RefreshCw size={11} />
              Reset
            </button>
          </div>

          {/* Posting Frequency */}
          <Slider
            label="POSTING FREQUENCY"
            value={strategy.postingFrequency}
            min={1}
            max={14}
            onChange={v => updateStrategy('postingFrequency', v)}
            format={v => `${v}/wk`}
            baselineValue={baseline.postsPerWeek}
          />

          {/* Content Quality */}
          <Slider
            label="CONTENT QUALITY INVESTMENT"
            value={strategy.contentQuality}
            min={1}
            max={5}
            onChange={v => updateStrategy('contentQuality', v)}
            format={v => QUALITY_LABELS[v]}
          />

          {/* Collabs */}
          <Slider
            label="COLLABORATION BOOST"
            value={strategy.collabsPerMonth}
            min={0}
            max={10}
            onChange={v => updateStrategy('collabsPerMonth', v)}
            format={v => `${v} collabs/mo`}
          />

          {/* Paid Budget */}
          <Slider
            label="PAID PROMOTION BUDGET"
            value={strategy.paidBudget}
            min={0}
            max={50000}
            step={1000}
            onChange={v => updateStrategy('paidBudget', v)}
            format={v => v === 0 ? '₹0' : fmtRupee(v)}
          />

          {/* Monetization toggles */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 10 }}>
              MONETIZATION STREAMS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <TogglePill label="Brand Deals" active={strategy.brandDeals} onClick={() => updateStrategy('brandDeals', !strategy.brandDeals)} />
              <TogglePill label="Affiliate" active={strategy.affiliate} onClick={() => updateStrategy('affiliate', !strategy.affiliate)} />
              <TogglePill label="Merch" active={strategy.merch} onClick={() => updateStrategy('merch', !strategy.merch)} />
              <TogglePill label="Courses" active={strategy.courses} onClick={() => updateStrategy('courses', !strategy.courses)} />
            </div>
          </div>

          {/* Uplift badge */}
          <AnimatePresence>
            {hasChange && upliftPct > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                  marginTop: 20,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ArrowUp size={14} color="#10b981" />
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>
                  +{upliftPct}% more followers vs baseline
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Section 3: Projection Output ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        >
          {/* Growth Chart */}
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 18,
            padding: '22px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={15} color="#3b82f6" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>12-Month Follower Projection</span>
              </div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 13,
                fontWeight: 700,
                color: '#a78bfa',
                padding: '3px 10px',
                background: 'rgba(167,139,250,0.1)',
                borderRadius: 8,
              }}>
                {fmtNum(finalFollowers)} followers
              </div>
            </div>
            <GrowthChart
              baseline={baselineData}
              optimized={optimizedData}
              currentFollowers={baseline.followers}
            />
          </div>

          {/* Revenue Projections Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Target size={15} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Revenue Projections</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <RevCard
                label="3-Month"
                value={fmtRupee(rev3)}
                color="#10b981"
                icon={<Calendar size={14} />}
              />
              <RevCard
                label="6-Month"
                value={fmtRupee(rev6)}
                color="#3b82f6"
                icon={<Calendar size={14} />}
              />
              <RevCard
                label="12-Month"
                value={fmtRupee(rev12)}
                color="#a78bfa"
                icon={<Calendar size={14} />}
              />
              <RevCard
                label="Paid Promo Break-even"
                value={
                  strategy.paidBudget === 0
                    ? 'No budget set'
                    : breakEvenMonth
                      ? `Month ${breakEvenMonth}`
                      : '>12 months'
                }
                color="#f59e0b"
                icon={<Zap size={14} />}
              />
            </div>
          </div>

          {/* Milestone Timeline */}
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 18,
            padding: '22px 22px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Calendar size={15} color="#f59e0b" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Milestone Timeline</span>
            </div>

            {milestones.length === 0 ? (
              <p style={{ fontSize: 12, color: '#4b5680', margin: 0 }}>
                All major milestones reached within baseline. Adjust your stats to simulate further growth.
              </p>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Vertical line */}
                <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 8,
                  bottom: 8,
                  width: 2,
                  background: 'linear-gradient(180deg, #3b82f6, rgba(59,130,246,0))',
                  borderRadius: 1,
                }} />

                {milestones.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                      marginBottom: i < milestones.length - 1 ? 18 : 0,
                      position: 'relative',
                    }}
                  >
                    {/* Dot */}
                    <div style={{
                      position: 'absolute',
                      left: -21,
                      top: 3,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: i === 0 ? '#3b82f6' : '#0d0d1a',
                      border: `2px solid ${i === 0 ? '#3b82f6' : 'rgba(59,130,246,0.3)'}`,
                      boxShadow: i === 0 ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                    }} />

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: '#3b82f6' }}>{m.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? '#f0f4ff' : '#a0aec0' }}>
                          {m.label}
                        </span>
                        {i === 0 && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: '#3b82f6',
                            padding: '1px 7px', background: 'rgba(59,130,246,0.12)', borderRadius: 20,
                          }}>Next</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ChevronRight size={10} color="#4b5680" />
                        <span style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 11,
                          color: '#4b5680',
                        }}>
                          {addMonths(m.monthsFromNow)} · Month {m.monthsFromNow}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Key Insight Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(167,139,250,0.08) 100%)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 18,
              padding: '20px 22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff' }}>Your #1 Growth Lever</span>
            </div>

            <p style={{ fontSize: 13, color: '#a0aec0', margin: 0, lineHeight: 1.7 }}>
              Increasing your{' '}
              <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{insight.lever.name}</span>
              {' '}({insight.lever.detail}) could add{' '}
              <span style={{
                fontFamily: "'Space Mono', monospace",
                color: '#10b981',
                fontWeight: 700,
              }}>
                +{fmtNum(insight.lever.gain)}
              </span>
              {' '}followers in 12 months.
              {insight.monthsSaved > 0 && (
                <>{' '}That could get you to{' '}
                  <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{insight.target}</span>
                  {' '}
                  <span style={{ color: '#3b82f6', fontWeight: 700 }}>{insight.monthsSaved} month{insight.monthsSaved > 1 ? 's' : ''} sooner</span>.
                </>
              )}
            </p>

            <div style={{ marginTop: 14, display: 'flex', gap: 12 }}>
              {[
                { label: '12M Followers', val: fmtNum(finalFollowers), color: '#3b82f6' },
                { label: '12M Revenue', val: fmtRupee(rev12), color: '#10b981' },
                { label: 'vs Baseline', val: upliftPct > 0 ? `+${upliftPct}%` : '—', color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{
                  flex: 1,
                  background: 'rgba(13,13,26,0.6)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 16,
                    fontWeight: 700,
                    color: item.color,
                    marginBottom: 3,
                  }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Global slider styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
          cursor: pointer;
          border: 2px solid #080810;
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
          cursor: pointer;
          border: 2px solid #080810;
        }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]:focus {
          border-color: rgba(59,130,246,0.4) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.08);
        }
      `}</style>
    </div>
  )
}
