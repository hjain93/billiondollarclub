import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import {
  TrendingUp, Briefcase, BarChart2, Link, Package, BookOpen, Users,
  AlertCircle, Calculator, Target, Plus, X, Check,
} from 'lucide-react'

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

interface StreamDef {
  key: string
  label: string
  color: string
  icon: React.ReactNode
  estPotential: number
}

const STREAMS: StreamDef[] = [
  { key: 'brand_deal',   label: 'Brand Deals',      color: '#3b82f6', icon: <Briefcase size={15} />,  estPotential: 40000 },
  { key: 'adsense',      label: 'AdSense',           color: '#f97316', icon: <BarChart2 size={15} />,  estPotential: 12000 },
  { key: 'affiliate',    label: 'Affiliates',        color: '#10b981', icon: <Link size={15} />,       estPotential: 18000 },
  { key: 'product',      label: 'Digital Products',  color: '#a78bfa', icon: <Package size={15} />,    estPotential: 45000 },
  { key: 'subscription', label: 'Memberships',       color: '#ec4899', icon: <Users size={15} />,      estPotential: 15000 },
  { key: 'other',        label: 'Courses',           color: '#f59e0b', icon: <BookOpen size={15} />,   estPotential: 35000 },
]

const DEMO_ENTRIES = [
  { id: 'd1', source: 'brand_deal', amount: 25000, date: '2026-03-10' },
  { id: 'd2', source: 'adsense',    amount: 8200,  date: '2026-03-05' },
  { id: 'd3', source: 'affiliate',  amount: 4500,  date: '2026-02-28' },
  { id: 'd4', source: 'brand_deal', amount: 35000, date: '2026-02-15' },
  { id: 'd5', source: 'adsense',    amount: 7100,  date: '2026-02-05' },
  { id: 'd6', source: 'subscription', amount: 6000, date: '2026-01-31' },
  { id: 'd7', source: 'brand_deal', amount: 18000, date: '2026-01-20' },
  { id: 'd8', source: 'adsense',    amount: 6800,  date: '2026-01-05' },
  { id: 'd9', source: 'product',    amount: 12000, date: '2025-12-28' },
  { id: 'd10', source: 'brand_deal', amount: 20000, date: '2025-12-10' },
  { id: 'd11', source: 'adsense',   amount: 9500,  date: '2025-12-05' },
  { id: 'd12', source: 'affiliate', amount: 3200,  date: '2025-12-01' },
]

const spring = { type: 'spring', stiffness: 300, damping: 28 } as const

export function MonetizationDashboard() {
  const { incomeEntries, monthlyIncomeTarget, addIncomeEntry } = useStore()
  const entries = incomeEntries.length > 0 ? incomeEntries : DEMO_ENTRIES
  const isDemo = incomeEntries.length === 0

  // Rate calculator state
  const [calcFollowers, setCalcFollowers] = useState('100000')
  const [calcEngagement, setCalcEngagement] = useState('3.5')
  const [calcPlatform, setCalcPlatform] = useState<'instagram' | 'youtube' | 'podcast'>('instagram')

  // Quick-add inline form state: which stream key is open
  const [addingStream, setAddingStream] = useState<string | null>(null)
  const [addAmount, setAddAmount] = useState('')

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`

  const thisMonthEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(currentMonthKey)),
    [entries, currentMonthKey]
  )
  const prevMonthEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(prevMonthKey)),
    [entries, prevMonthKey]
  )

  const thisMonthTotal = useMemo(() => thisMonthEntries.reduce((s, e) => s + e.amount, 0), [thisMonthEntries])
  const prevMonthTotal = useMemo(() => prevMonthEntries.reduce((s, e) => s + e.amount, 0), [prevMonthEntries])

  const vsLastMonth = prevMonthTotal > 0
    ? Math.round(((thisMonthTotal - prevMonthTotal) / prevMonthTotal) * 100)
    : 0

  // Diversification score: dominant source share
  const streamTotals = useMemo(() => {
    const map: Record<string, number> = {}
    thisMonthEntries.forEach((e) => {
      map[e.source] = (map[e.source] || 0) + e.amount
    })
    return map
  }, [thisMonthEntries])

  const maxShare = thisMonthTotal > 0
    ? Math.max(...Object.values(streamTotals).map((v) => v / thisMonthTotal)) * 100
    : 0

  const { divScore, divLabel, divColor } = useMemo(() => {
    if (maxShare >= 60) return { divScore: Math.round(100 - maxShare), divLabel: 'Poor', divColor: '#ef4444' }
    if (maxShare >= 40) return { divScore: Math.round(100 - maxShare), divLabel: 'Fair', divColor: '#f59e0b' }
    return { divScore: Math.round(100 - maxShare), divLabel: 'Strong', divColor: '#10b981' }
  }, [maxShare])

  const streamsActive = Object.keys(streamTotals).filter((k) => streamTotals[k] > 0).length

  // YTD
  const currentYear = now.getFullYear().toString()
  const ytdEntries = entries.filter((e) => e.date.startsWith(currentYear))
  const ytdTotal = ytdEntries.reduce((s, e) => s + e.amount, 0)

  // Best month
  const monthMap: Record<string, number> = {}
  entries.forEach((e) => {
    const key = e.date.slice(0, 7)
    monthMap[key] = (monthMap[key] || 0) + e.amount
  })
  const bestMonth = Math.max(...Object.values(monthMap), 0)
  const avgPerMonth = Object.keys(monthMap).length > 0
    ? Math.round(Object.values(monthMap).reduce((a, b) => a + b, 0) / Object.keys(monthMap).length)
    : 0

  // Forecast
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()
  const projected = daysPassed > 0 ? Math.round((thisMonthTotal / daysPassed) * daysInMonth) : 0
  const forecastPct = Math.min(100, Math.round((projected / monthlyIncomeTarget) * 100))
  const gap = Math.max(0, monthlyIncomeTarget - projected)

  // Rate calculator
  const followers = parseInt(calcFollowers, 10) || 0
  const engagement = parseFloat(calcEngagement) || 0
  const base = (followers / 10000) * 1000
  const engMult = engagement >= 3 ? 2 : 1
  const vidMult = calcPlatform === 'youtube' ? 1.5 : 1
  const ratePost = Math.round(base * engMult)
  const rateVideo = Math.round(base * engMult * vidMult)
  const rateStory = Math.round(base * engMult * 0.4)

  function handleQuickAdd(streamKey: string) {
    const amount = parseInt(addAmount, 10)
    if (!amount || amount <= 0) return
    if (!isDemo) {
      addIncomeEntry({
        id: Math.random().toString(36).slice(2),
        label: STREAMS.find((s) => s.key === streamKey)?.label ?? streamKey,
        amount,
        source: streamKey as 'brand_deal' | 'adsense' | 'affiliate' | 'product' | 'subscription' | 'other',
        platform: 'instagram',
        date: now.toISOString().split('T')[0],
      })
    }
    setAddingStream(null)
    setAddAmount('')
  }

  const topStats = [
    {
      label: 'Total This Month',
      value: fmt(thisMonthTotal),
      color: '#10b981',
      sub: 'Current month earnings',
    },
    {
      label: 'Diversification',
      value: String(divScore),
      color: divColor,
      sub: divLabel,
      badge: divLabel,
    },
    {
      label: 'Streams Active',
      value: String(streamsActive),
      color: '#3b82f6',
      sub: 'of 6 possible streams',
    },
    {
      label: 'vs Last Month',
      value: prevMonthTotal > 0 ? `${vsLastMonth > 0 ? '+' : ''}${vsLastMonth}%` : '—',
      color: vsLastMonth >= 0 ? '#10b981' : '#ef4444',
      sub: prevMonthTotal > 0 ? fmt(prevMonthTotal) + ' last month' : 'No prior data',
    },
  ]

  // Opportunity alerts
  const alerts: { icon: React.ReactNode; text: string; color: string }[] = []
  const affiliateTotal = streamTotals['affiliate'] || 0
  const brandTotal = streamTotals['brand_deal'] || 0
  const productTotal = streamTotals['product'] || 0

  if (affiliateTotal === 0) {
    alerts.push({
      icon: <Link size={14} />,
      text: 'No affiliate income this month. Creators in most niches earn ₹15,000–₹45,000/mo from affiliate links alone.',
      color: '#f59e0b',
    })
  }
  if (brandTotal > 0 && engagement >= 3) {
    alerts.push({
      icon: <TrendingUp size={14} />,
      text: 'Your engagement rate is above 3% — brand deals should be priced at 2× your current base rate.',
      color: '#3b82f6',
    })
  }
  if (productTotal === 0) {
    alerts.push({
      icon: <Package size={14} />,
      text: 'No digital product income detected. Creators in your niche earn avg ₹45,000/mo from templates, presets or mini-courses.',
      color: '#a78bfa',
    })
  }
  if (streamsActive <= 2) {
    alerts.push({
      icon: <AlertCircle size={14} />,
      text: `Only ${streamsActive} income stream${streamsActive === 1 ? '' : 's'} active this month. Diversifying to 4+ streams reduces income volatility by ~60%.`,
      color: '#ec4899',
    })
  }
  const visibleAlerts = alerts.slice(0, 4)

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <TrendingUp size={20} color="#10b981" />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Monetization Intelligence
            </h1>
          </div>
          <p style={{ color: '#4b5680', fontSize: 13, fontWeight: 500 }}>
            Track, optimize, and grow every revenue stream
            {isDemo && <span style={{ color: '#f97316', marginLeft: 8, fontSize: 11, fontWeight: 700 }}>· Demo Data</span>}
          </p>
        </div>
      </motion.div>

      {/* Top Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {topStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.05 }}
            className="card"
            style={{ padding: '18px 20px' }}
          >
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'Space Mono, monospace', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>
              {s.value}
            </div>
            {s.badge && (
              <div style={{
                display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                background: `${s.color}20`, color: s.color, marginBottom: 4,
              }}>
                {s.badge}
              </div>
            )}
            <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, color: '#4b5680' }}>{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Two-column main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>
        {/* Left: Revenue Streams */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0, paddingBottom: 4 }}>
            Revenue Streams
          </h2>
          {STREAMS.map((stream, i) => {
            const streamMonthTotal = streamTotals[stream.key] || 0
            const pct = thisMonthTotal > 0 ? Math.round((streamMonthTotal / thisMonthTotal) * 100) : 0
            const isActive = streamMonthTotal > 0
            const isAdding = addingStream === stream.key

            return (
              <motion.div
                key={stream.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: i * 0.04 }}
                className="card"
                style={{ padding: '16px 18px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${stream.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: stream.color, flexShrink: 0,
                    }}>
                      {stream.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{stream.label}</div>
                      <div style={{ fontSize: 11, color: '#4b5680' }}>
                        {isActive
                          ? `Est. ₹${stream.estPotential.toLocaleString('en-IN')}/mo potential`
                          : `Est. ₹${stream.estPotential.toLocaleString('en-IN')}/mo potential`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: isActive ? '#10b981' : '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                        {fmt(streamMonthTotal)}
                      </div>
                      <div style={{ fontSize: 10, color: '#4b5680' }}>{pct}% of total</div>
                    </div>
                    {isActive
                      ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#10b98120', color: '#10b981' }}>Active</span>
                      : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f9731620', color: '#f97316' }}>Untapped</span>
                    }
                  </div>
                </div>

                {/* Bar */}
                <div style={{ height: 4, background: 'rgba(59,130,246,0.1)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: stream.color, borderRadius: 2 }}
                  />
                </div>

                {/* Quick Add */}
                {isAdding ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      autoFocus
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAdd(stream.key); if (e.key === 'Escape') setAddingStream(null) }}
                      placeholder="Amount in ₹"
                      className="field"
                      style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
                    />
                    <button
                      onClick={() => handleQuickAdd(stream.key)}
                      style={{ background: '#10b981', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0 }}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => { setAddingStream(null); setAddAmount('') }}
                      style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5680', flexShrink: 0 }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingStream(stream.key); setAddAmount('') }}
                    style={{
                      background: 'none', border: `1px solid rgba(59,130,246,0.15)`, borderRadius: 8,
                      color: '#4b5680', fontSize: 11, fontWeight: 700, padding: '6px 12px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = stream.color; e.currentTarget.style.color = stream.color }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; e.currentTarget.style.color = '#4b5680' }}
                  >
                    <Plus size={11} /> Add Income
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Opportunity Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.15 }}
          >
            <h2 style={{ fontSize: 12, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Opportunity Alerts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleAlerts.map((alert, i) => (
                <div
                  key={i}
                  style={{
                    padding: '13px 14px', borderRadius: 12,
                    border: `1px solid ${alert.color}30`,
                    background: `${alert.color}08`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                >
                  <div style={{ color: alert.color, flexShrink: 0, marginTop: 1 }}>{alert.icon}</div>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{alert.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rate Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2 }}
            className="card"
            style={{ padding: '18px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Calculator size={14} color="#06b6d4" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', margin: 0 }}>
                Rate Calculator
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Followers</label>
                <input
                  className="field"
                  type="number"
                  value={calcFollowers}
                  onChange={(e) => setCalcFollowers(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>Engagement %</label>
                  <input
                    className="field"
                    type="number"
                    value={calcEngagement}
                    onChange={(e) => setCalcEngagement(e.target.value)}
                    placeholder="3.5"
                    step="0.1"
                  />
                </div>
                <div>
                  <label style={lbl}>Platform</label>
                  <select
                    className="field"
                    value={calcPlatform}
                    onChange={(e) => setCalcPlatform(e.target.value as typeof calcPlatform)}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Suggested Rates
              </div>
              {[
                { label: 'Per Post / Reel', value: ratePost },
                { label: 'Per Dedicated Video', value: rateVideo },
                { label: 'Per Story Set', value: rateStory },
              ].map((r) => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Mono, monospace' }}>
                    {fmt(r.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.25 }}
            className="card"
            style={{ padding: '18px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={14} color="#ec4899" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', margin: 0 }}>
                Monthly Forecast
              </h3>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#4b5680' }}>
                Day {daysPassed} of {daysInMonth}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>
                {fmt(thisMonthTotal)} earned · {fmt(projected)} projected
              </span>
            </div>

            <div style={{ height: 8, background: 'rgba(236,72,153,0.1)', borderRadius: 4, marginBottom: 10, overflow: 'hidden', position: 'relative' }}>
              {/* Earned */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.round((thisMonthTotal / monthlyIncomeTarget) * 100))}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                style={{ position: 'absolute', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: 4 }}
              />
              {/* Projected */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${forecastPct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ position: 'absolute', height: '100%', background: 'rgba(236,72,153,0.25)', borderRadius: 4 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#4b5680' }}>Target: {fmt(monthlyIncomeTarget)}</span>
              {gap > 0
                ? <span style={{ color: '#ef4444' }}>Gap: {fmt(gap)}</span>
                : <span style={{ color: '#10b981', fontWeight: 700 }}>On track!</span>
              }
            </div>
          </motion.div>
        </div>
      </div>

      {/* YTD Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.3 }}
        style={{ marginTop: 20 }}
      >
        <h2 style={{ fontSize: 12, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Year-to-Date Summary
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'YTD Total', value: fmt(ytdTotal), color: '#10b981', sub: `Jan–${now.toLocaleDateString('en-IN', { month: 'short' })} ${currentYear}` },
            { label: 'Best Month', value: fmt(bestMonth), color: '#f59e0b', sub: 'Single month record' },
            { label: 'Avg / Month', value: fmt(avgPerMonth), color: '#3b82f6', sub: 'Based on all tracked months' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.35 + i * 0.05 }}
              className="card"
              style={{ padding: '18px 22px' }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Space Mono, monospace', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#4b5680' }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: '#4b5680',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
}
