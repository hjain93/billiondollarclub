import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { IncomeEntry } from '../types'
import type { Platform } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Plus, Trash2, X, Edit2, TrendingUp, Target, DollarSign, Calendar, Link } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Affiliate Links types ──────────────────────────────────────────────────
type AffiliatePlatform = 'youtube-description' | 'instagram-bio' | 'pinned-comment' | 'newsletter' | 'other'
type AffiliateStatus = 'active' | 'paused' | 'expired'

interface AffiliateLink {
  id: string
  brand: string
  url: string
  commission: number
  cookieDays: number
  platform: AffiliatePlatform
  status: AffiliateStatus
  monthlyEst: number
  notes?: string
}

const AFFILIATE_LS_KEY = 'creator-affiliate-links'

const DEMO_AFFILIATE_LINKS: AffiliateLink[] = [
  { id: 'al1', brand: 'Booking.com', url: 'https://booking.com/affiliate', commission: 4, cookieDays: 30, platform: 'youtube-description', status: 'active', monthlyEst: 4500, notes: 'Travel niche — strong converter' },
  { id: 'al2', brand: 'Amazon Associates', url: 'https://affiliate-program.amazon.in', commission: 5, cookieDays: 24, platform: 'youtube-description', status: 'active', monthlyEst: 3200, notes: 'Gear links in video descriptions' },
  { id: 'al3', brand: 'Hostinger', url: 'https://hostinger.in/affiliate', commission: 40, cookieDays: 30, platform: 'instagram-bio', status: 'active', monthlyEst: 8000, notes: 'High commission, tech audience fits well' },
  { id: 'al4', brand: 'Skillshare', url: 'https://skillshare.com/affiliates', commission: 10, cookieDays: 30, platform: 'newsletter', status: 'paused', monthlyEst: 1200 },
  { id: 'al5', brand: 'NordVPN', url: 'https://nordvpn.com/affiliate', commission: 30, cookieDays: 30, platform: 'pinned-comment', status: 'expired', monthlyEst: 0 },
]

const PLATFORM_LABELS: Record<AffiliatePlatform, string> = {
  'youtube-description': 'YouTube Desc',
  'instagram-bio':       'Instagram Bio',
  'pinned-comment':      'Pinned Comment',
  'newsletter':          'Newsletter',
  'other':               'Other',
}

const STATUS_COLORS: Record<AffiliateStatus, string> = {
  active:  '#10b981',
  paused:  '#f59e0b',
  expired: '#ef4444',
}

const EMPTY_AFFILIATE_FORM: Omit<AffiliateLink, 'id'> = {
  brand: '', url: '', commission: 10, cookieDays: 30,
  platform: 'youtube-description', status: 'active', monthlyEst: 0, notes: '',
}

const SOURCE_LABELS: Record<IncomeEntry['source'], string> = {
  brand_deal: 'Brand Deal',
  adsense: 'AdSense',
  affiliate: 'Affiliate',
  subscription: 'Subscription',
  product: 'Product',
  other: 'Other',
}

const SOURCE_COLORS: Record<IncomeEntry['source'], string> = {
  brand_deal: '#3b82f6',
  adsense: '#f97316',
  affiliate: '#10b981',
  subscription: '#ec4899',
  product: '#8b5cf6',
  other: '#6b7a9a',
}

const PLATFORMS: (Platform | 'all')[] = ['all', 'instagram', 'youtube', 'linkedin', 'twitter']

const DEMO_ENTRIES: IncomeEntry[] = [
  { id: 'd1', source: 'brand_deal', platform: 'instagram', amount: 25000, label: 'Myntra Reel Campaign', date: '2026-03-10', notes: 'Two reels' },
  { id: 'd2', source: 'adsense', platform: 'youtube', amount: 8200, label: 'March AdSense', date: '2026-03-05' },
  { id: 'd3', source: 'affiliate', platform: 'instagram', amount: 4500, label: 'Affiliate — Booking.com', date: '2026-02-28' },
  { id: 'd4', source: 'brand_deal', platform: 'youtube', amount: 35000, label: 'Noise Watch Review', date: '2026-02-15' },
  { id: 'd5', source: 'adsense', platform: 'youtube', amount: 7100, label: 'Feb AdSense', date: '2026-02-05' },
  { id: 'd6', source: 'subscription', platform: 'all', amount: 6000, label: 'Patreon Monthly', date: '2026-01-31' },
  { id: 'd7', source: 'brand_deal', platform: 'linkedin', amount: 18000, label: 'SaaS Tool Sponsored Post', date: '2026-01-20' },
  { id: 'd8', source: 'adsense', platform: 'youtube', amount: 6800, label: 'Jan AdSense', date: '2026-01-05' },
  { id: 'd9', source: 'product', platform: 'all', amount: 12000, label: 'Preset Pack Sales', date: '2025-12-28' },
  { id: 'd10', source: 'brand_deal', platform: 'instagram', amount: 20000, label: 'H&M Holiday Campaign', date: '2025-12-10' },
  { id: 'd11', source: 'adsense', platform: 'youtube', amount: 9500, label: 'Dec AdSense', date: '2025-12-05' },
  { id: 'd12', source: 'affiliate', platform: 'youtube', amount: 3200, label: 'Amazon Affiliate Dec', date: '2025-12-01' },
]

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString('en-IN')}`
}

function getMonthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export function IncomeTracker() {
  const { incomeEntries, monthlyIncomeTarget, addIncomeEntry, removeIncomeEntry, setMonthlyIncomeTarget } = useStore()

  const entries = incomeEntries.length > 0 ? incomeEntries : DEMO_ENTRIES
  const isDemo = incomeEntries.length === 0

  const [activeTab, setActiveTab] = useState<'income' | 'affiliates'>('income')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState(String(monthlyIncomeTarget))

  // ── Affiliate Links state ────────────────────────────────────────────────
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>(() => {
    try {
      const stored = localStorage.getItem(AFFILIATE_LS_KEY)
      if (stored) return JSON.parse(stored) as AffiliateLink[]
    } catch { /* ignore */ }
    return DEMO_AFFILIATE_LINKS
  })

  useEffect(() => {
    try { localStorage.setItem(AFFILIATE_LS_KEY, JSON.stringify(affiliateLinks)) } catch { /* ignore */ }
  }, [affiliateLinks])

  const [affiliateFormOpen, setAffiliateFormOpen] = useState(false)
  const [affiliateForm, setAffiliateForm] = useState<Omit<AffiliateLink, 'id'>>(EMPTY_AFFILIATE_FORM)
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null)

  function openNewAffiliateForm() {
    setAffiliateForm(EMPTY_AFFILIATE_FORM)
    setEditingAffiliateId(null)
    setAffiliateFormOpen(true)
  }

  function openEditAffiliateForm(link: AffiliateLink) {
    const { id, ...rest } = link
    setAffiliateForm(rest)
    setEditingAffiliateId(id)
    setAffiliateFormOpen(true)
  }

  function saveAffiliateLink() {
    if (!affiliateForm.brand.trim()) { toast.error('Enter a brand name'); return }
    if (!affiliateForm.url.trim()) { toast.error('Enter a URL'); return }
    if (editingAffiliateId) {
      setAffiliateLinks((prev) =>
        prev.map((l) => l.id === editingAffiliateId ? { ...affiliateForm, id: editingAffiliateId } : l)
      )
      toast.success('Affiliate link updated!')
    } else {
      setAffiliateLinks((prev) => [{ ...affiliateForm, id: Math.random().toString(36).slice(2) }, ...prev])
      toast.success('Affiliate link added!')
    }
    setAffiliateFormOpen(false)
    setEditingAffiliateId(null)
    setAffiliateForm(EMPTY_AFFILIATE_FORM)
  }

  function deleteAffiliateLink(id: string) {
    setAffiliateLinks((prev) => prev.filter((l) => l.id !== id))
    toast.success('Link removed')
  }

  const activeAffiliateCount = affiliateLinks.filter((l) => l.status === 'active').length
  const totalAffiliateMonthlyEst = affiliateLinks.filter((l) => l.status === 'active').reduce((s, l) => s + l.monthlyEst, 0)
  const bestAffiliate = [...affiliateLinks].sort((a, b) => b.monthlyEst - a.monthlyEst)[0]

  // Form state
  const [form, setForm] = useState<{
    label: string
    amount: string
    source: IncomeEntry['source']
    platform: Platform | 'all'
    date: string
    notes: string
  }>({
    label: '',
    amount: '',
    source: 'brand_deal',
    platform: 'instagram',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const thisMonthTotal = useMemo(
    () => entries.filter((e) => e.date.startsWith(currentMonthKey)).reduce((s, e) => s + e.amount, 0),
    [entries, currentMonthKey]
  )

  const allTimeTotal = useMemo(() => entries.reduce((s, e) => s + e.amount, 0), [entries])
  const pctOfTarget = Math.min(100, Math.round((thisMonthTotal / monthlyIncomeTarget) * 100))

  // Last 6 months bar chart data
  const barData = useMemo(() => {
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months.map((key) => ({
      month: getMonthLabel(key),
      income: entries.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0),
    }))
  }, [entries])

  // Pie chart by source
  const pieData = useMemo(() => {
    const map: Record<string, number> = {}
    entries.forEach((e) => {
      map[e.source] = (map[e.source] || 0) + e.amount
    })
    return Object.entries(map).map(([source, value]) => ({
      name: SOURCE_LABELS[source as IncomeEntry['source']],
      value,
      color: SOURCE_COLORS[source as IncomeEntry['source']],
    }))
  }, [entries])

  // Sorted entries
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))

  function saveTarget() {
    const n = Number(targetInput)
    if (!isNaN(n) && n > 0) {
      setMonthlyIncomeTarget(n)
      setEditingTarget(false)
      toast.success('Target updated!')
    }
  }

  function submitEntry() {
    if (!form.label.trim()) { toast.error('Enter a label'); return }
    const amount = Number(form.amount)
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    addIncomeEntry({
      id: Math.random().toString(36).slice(2),
      label: form.label.trim(),
      amount,
      source: form.source,
      platform: form.platform,
      date: form.date,
      notes: form.notes.trim() || undefined,
    })
    toast.success('Income logged!', {
      style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' },
    })
    setDrawerOpen(false)
    setForm({ label: '', amount: '', source: 'brand_deal', platform: 'instagram', date: new Date().toISOString().split('T')[0], notes: '' })
  }

  return (
    <div style={{ padding: '28px 32px', position: 'relative' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Income Tracker</h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 5, fontWeight: 500 }}>
            Track brand deals, AdSense, affiliates and all income streams
            {isDemo && <span style={{ color: '#f97316', marginLeft: 8, fontSize: 11, fontWeight: 700 }}>· Demo Data</span>}
          </p>
        </div>
        {activeTab === 'income'
          ? <button className="btn btn-blue" onClick={() => setDrawerOpen(true)}><Plus size={14} /> Log Income</button>
          : <button className="btn btn-blue" onClick={openNewAffiliateForm}><Plus size={14} /> Add Affiliate Link</button>
        }
      </motion.div>

      {/* Tab bar */}
      <div className="tab-bar" style={{ marginBottom: 24 }}>
        <button
          className={`tab${activeTab === 'income' ? ' active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          <DollarSign size={13} /> Income Log
        </button>
        <button
          className={`tab${activeTab === 'affiliates' ? ' active' : ''}`}
          onClick={() => setActiveTab('affiliates')}
        >
          <Link size={13} /> Affiliate Links
        </button>
      </div>

      {/* ── Income Log Tab ─────────────────────────────────────────────── */}
      {activeTab === 'income' && (<>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          {
            label: "This Month's Income",
            value: fmt(thisMonthTotal),
            icon: <DollarSign size={15} />,
            color: '#10b981',
          },
          {
            label: 'Monthly Target',
            value: editingTarget ? (
              <input
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') setEditingTarget(false) }}
                onBlur={saveTarget}
                autoFocus
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  color: '#fbbf24', fontSize: 28, fontWeight: 800,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  width: '100%', letterSpacing: '-0.02em',
                }}
              />
            ) : (
              <span style={{ cursor: 'pointer' }} onClick={() => { setEditingTarget(true); setTargetInput(String(monthlyIncomeTarget)) }}>
                {fmt(monthlyIncomeTarget)}
              </span>
            ),
            icon: <Edit2 size={15} />,
            color: '#fbbf24',
            sub: 'Click to edit',
          },
          {
            label: '% of Target',
            value: `${pctOfTarget}%`,
            icon: <Target size={15} />,
            color: pctOfTarget >= 100 ? '#10b981' : pctOfTarget >= 50 ? '#3b82f6' : '#ec4899',
          },
          {
            label: 'All-Time Income',
            value: fmt(allTimeTotal),
            icon: <TrendingUp size={15} />,
            color: '#3b82f6',
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card"
            style={{ padding: '18px 20px' }}
          >
            <div style={{ color: s.color, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 500 }}>{s.label}</div>
            {s.sub && !editingTarget && (
              <div style={{ fontSize: 10.5, color: '#3b4260', marginTop: 3 }}>{s.sub}</div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Monthly progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
        style={{ padding: '18px 22px', marginBottom: 20 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Progress</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: pctOfTarget >= 100 ? '#10b981' : '#f0f4ff' }}>
            {fmt(thisMonthTotal)} / {fmt(monthlyIncomeTarget)}
          </span>
        </div>
        <div style={{ height: 10, background: 'rgba(59,130,246,0.1)', borderRadius: 5, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pctOfTarget}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: pctOfTarget >= 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : 'linear-gradient(90deg, #3b82f6, #ec4899)',
              borderRadius: 5,
            }}
          />
        </div>
      </motion.div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 24 }}>
        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: '20px 22px' }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 18 }}>Last 6 Months</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={32}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4b5680', fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4b5680', fontFamily: 'Space Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={60} />
              <Tooltip
                contentStyle={{ background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
                labelStyle={{ color: '#f0f4ff', fontWeight: 700 }}
                formatter={(v) => [fmt(Number(v)), 'Income']}
              />
              <Bar dataKey="income" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="card"
          style={{ padding: '20px 22px' }}
        >
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 10 }}>By Source</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={38} dataKey="value" paddingAngle={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
                formatter={(v) => [fmt(Number(v)), '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Entries table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="card"
        style={{ padding: '20px 22px' }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 16 }}>
          All Entries <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, marginLeft: 6 }}>{sorted.length} total</span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                {['Date', 'Label', 'Source', 'Platform', 'Amount', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left', padding: '6px 10px',
                      fontSize: 10.5, fontWeight: 800, color: '#4b5680',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) => (
                <tr
                  key={entry.id}
                  style={{ borderBottom: '1px solid rgba(59,130,246,0.06)', transition: 'background 140ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '11px 10px', color: '#6b7a9a', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
                    {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '11px 10px', color: '#e2e8f0', fontWeight: 600 }}>{entry.label}</td>
                  <td style={{ padding: '11px 10px' }}>
                    <span
                      style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 12, fontWeight: 700,
                        background: `${SOURCE_COLORS[entry.source]}15`,
                        color: SOURCE_COLORS[entry.source],
                      }}
                    >
                      {SOURCE_LABELS[entry.source]}
                    </span>
                  </td>
                  <td style={{ padding: '11px 10px', color: '#6b7a9a', textTransform: 'capitalize', fontSize: 12 }}>
                    {entry.platform}
                  </td>
                  <td style={{ padding: '11px 10px', color: '#10b981', fontWeight: 800, fontFamily: 'Space Mono, monospace', fontSize: 13 }}>
                    {fmt(entry.amount)}
                  </td>
                  <td style={{ padding: '11px 10px' }}>
                    {!isDemo && (
                      <button
                        onClick={() => { removeIncomeEntry(entry.id); toast.success('Entry removed') }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#4b5680', padding: 4, borderRadius: 6,
                          display: 'flex', alignItems: 'center',
                          transition: 'color 140ms',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#4b5680')}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      </>)}

      {/* ── Affiliate Links Tab ─────────────────────────────────────────── */}
      {activeTab === 'affiliates' && (
        <div>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
            {[
              { label: 'Active Links', value: String(activeAffiliateCount), color: '#10b981' },
              { label: 'Est. Monthly (Active)', value: fmt(totalAffiliateMonthlyEst), color: '#f59e0b' },
              { label: 'Best Performer', value: bestAffiliate?.brand ?? '—', color: '#3b82f6' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card"
                style={{ padding: '16px 20px' }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'Space Mono, monospace', letterSpacing: '-0.02em', marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 500 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Add / Edit Form */}
          <AnimatePresence>
            {affiliateFormOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="card"
                style={{ padding: '20px 22px', marginBottom: 18, border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', margin: 0 }}>
                    {editingAffiliateId ? 'Edit Affiliate Link' : 'Add Affiliate Link'}
                  </h3>
                  <button
                    onClick={() => { setAffiliateFormOpen(false); setEditingAffiliateId(null); setAffiliateForm(EMPTY_AFFILIATE_FORM) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex' }}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>Brand Name</label>
                    <input className="field" value={affiliateForm.brand} onChange={(e) => setAffiliateForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Amazon, Hostinger…" autoFocus />
                  </div>
                  <div>
                    <label style={lbl}>URL</label>
                    <input className="field" value={affiliateForm.url} onChange={(e) => setAffiliateForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
                  </div>
                  <div>
                    <label style={lbl}>Commission %</label>
                    <input className="field" type="number" value={affiliateForm.commission} onChange={(e) => setAffiliateForm((f) => ({ ...f, commission: Number(e.target.value) }))} min={0} max={100} />
                  </div>
                  <div>
                    <label style={lbl}>Cookie Days</label>
                    <input className="field" type="number" value={affiliateForm.cookieDays} onChange={(e) => setAffiliateForm((f) => ({ ...f, cookieDays: Number(e.target.value) }))} min={1} />
                  </div>
                  <div>
                    <label style={lbl}>Platform Placement</label>
                    <select className="field" value={affiliateForm.platform} onChange={(e) => setAffiliateForm((f) => ({ ...f, platform: e.target.value as AffiliatePlatform }))}>
                      {(Object.keys(PLATFORM_LABELS) as AffiliatePlatform[]).map((k) => (
                        <option key={k} value={k}>{PLATFORM_LABELS[k]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Est. Monthly (₹)</label>
                    <input className="field" type="number" value={affiliateForm.monthlyEst} onChange={(e) => setAffiliateForm((f) => ({ ...f, monthlyEst: Number(e.target.value) }))} min={0} />
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select className="field" value={affiliateForm.status} onChange={(e) => setAffiliateForm((f) => ({ ...f, status: e.target.value as AffiliateStatus }))}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Notes (optional)</label>
                    <input className="field" value={affiliateForm.notes ?? ''} onChange={(e) => setAffiliateForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Context, performance notes…" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setAffiliateFormOpen(false); setEditingAffiliateId(null); setAffiliateForm(EMPTY_AFFILIATE_FORM) }}>
                    Cancel
                  </button>
                  <button className="btn btn-blue" style={{ flex: 2, justifyContent: 'center' }} onClick={saveAffiliateLink}>
                    <Link size={13} /> {editingAffiliateId ? 'Update Link' : 'Save Link'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Links list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {affiliateLinks.length === 0 && (
              <div className="empty-state">No affiliate links yet. Add your first link above.</div>
            )}
            {affiliateLinks.map((link, i) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
              >
                {/* Brand + platform */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0' }}>{link.brand}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                      {PLATFORM_LABELS[link.platform]}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                    {link.cookieDays}-day cookie · {link.commission}% commission
                    {link.notes && <span style={{ marginLeft: 10, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>— {link.notes}</span>}
                  </div>
                </div>

                {/* Est monthly */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', fontFamily: 'Space Mono, monospace' }}>
                    {fmt(link.monthlyEst)}
                  </div>
                  <div style={{ fontSize: 10, color: '#4b5680' }}>est/mo</div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 10,
                  background: `${STATUS_COLORS[link.status]}18`,
                  color: STATUS_COLORS[link.status],
                  minWidth: 54, textAlign: 'center', textTransform: 'capitalize',
                }}>
                  {link.status}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => openEditAffiliateForm(link)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 140ms' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#3b82f6')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#4b5680')}
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteAffiliateLink(link.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 140ms' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#4b5680')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Platform Tips */}
          <h3 style={{ fontSize: 12, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Placement Strategy Tips
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                title: 'YouTube Description',
                color: '#ef4444',
                tips: [
                  'Pin your highest-commission link in lines 1–3 — only the first 3 lines show above "Show more".',
                  'Use timestamps as anchor points and place affiliate links below each relevant timestamp.',
                  'Add "↓ Gear I use:" as a section header to signal affiliate section to viewers.',
                ],
              },
              {
                title: 'Instagram Bio',
                color: '#ec4899',
                tips: [
                  'Use a link-in-bio tool (Linktree, Later, Beacons) to rotate up to 5 affiliate links.',
                  'Lead with your highest-value offer and rotate based on recent content topics.',
                  'Add a CTA in every caption ending: "Link in bio" drives 3× more clicks than just having the link.',
                ],
              },
              {
                title: 'Pinned Comment',
                color: '#3b82f6',
                tips: [
                  'Pin within 30 minutes of publishing — the first comment is read by 40% of early viewers.',
                  'Works best for evergreen content where the same product remains relevant.',
                  'Format: "I use [Brand] for [specific task] — link: [URL] (affiliate)" for transparency.',
                ],
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="card"
                style={{ padding: '16px 18px', borderTop: `3px solid ${tip.color}` }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 12 }}>{tip.title}</div>
                {tip.tips.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${tip.color}20`, color: tip.color, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>{t}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Income Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(8,8,16,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 50,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0,
                width: 400, background: '#0d0d1a',
                borderLeft: '1px solid rgba(59,130,246,0.18)',
                zIndex: 60, padding: '28px 24px',
                overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DollarSign size={16} color="#10b981" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Log Income</h2>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <label style={lbl}>Label / Description</label>
                <input
                  className="field"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Brand campaign, AdSense Feb..."
                  autoFocus
                />
              </div>

              <div>
                <label style={lbl}>Amount (₹)</label>
                <input
                  className="field"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="25000"
                  min={0}
                />
              </div>

              <div>
                <label style={lbl}>Source</label>
                <select
                  className="field"
                  value={form.source}
                  onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as IncomeEntry['source'] }))}
                >
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Platform</label>
                <select
                  className="field"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value as Platform | 'all' }))}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Date</label>
                <input
                  className="field"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div>
                <label style={lbl}>Notes (optional)</label>
                <textarea
                  className="field"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Contract details, deliverables..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setDrawerOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-blue" style={{ flex: 2, justifyContent: 'center' }} onClick={submitEntry}>
                  <Calendar size={14} /> Log Income
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
  marginBottom: 7,
}
