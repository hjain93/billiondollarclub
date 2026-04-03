import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, TrendingUp, Trophy, Play, Pause, Plus, X, Copy,
  BarChart3, CheckCircle, AlertCircle, Clock, RefreshCw, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type TestType = 'title' | 'thumbnail' | 'hook' | 'cta' | 'description'
type TestStatus = 'draft' | 'running' | 'completed' | 'paused'
type ActiveTab = 'active' | 'completed' | 'create'

interface Variant {
  content: string
  views: number
  clicks: number
  ctr: number
  engagementRate: number
  color: string
}

interface ABTest {
  id: string
  name: string
  type: TestType
  status: TestStatus
  startDate: string
  endDate?: string
  daysRunning: number
  totalDays: number
  variantA: Variant
  variantB: Variant
  winner?: 'A' | 'B' | 'inconclusive'
  confidence: number
  insight: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<TestType, { label: string; icon: React.ReactNode }> = {
  title: { label: 'Title', icon: <BarChart3 size={14} /> },
  thumbnail: { label: 'Thumbnail', icon: <FlaskConical size={14} /> },
  hook: { label: 'Hook', icon: <TrendingUp size={14} /> },
  cta: { label: 'CTA', icon: <ChevronRight size={14} /> },
  description: { label: 'Description', icon: <Copy size={14} /> },
}

const STORAGE_KEY = 'creator-ab-tests'

// ─── Statistical Logic ────────────────────────────────────────────────────────

function computeConfidence(a: Variant, b: Variant): number {
  const totalA = a.views
  const totalB = b.views
  if (totalA < 100 || totalB < 100) return Math.min(30, Math.floor((totalA + totalB) / 20))

  const clicksA = a.clicks
  const clicksB = b.clicks
  const noClicksA = totalA - clicksA
  const noClicksB = totalB - clicksB

  const grandTotal = totalA + totalB
  const grandClicks = clicksA + clicksB
  const grandNoClicks = noClicksA + noClicksB

  const expectedA_clicks = (totalA * grandClicks) / grandTotal
  const expectedA_no = (totalA * grandNoClicks) / grandTotal
  const expectedB_clicks = (totalB * grandClicks) / grandTotal
  const expectedB_no = (totalB * grandNoClicks) / grandTotal

  const chiSq =
    Math.pow(clicksA - expectedA_clicks, 2) / (expectedA_clicks || 1) +
    Math.pow(noClicksA - expectedA_no, 2) / (expectedA_no || 1) +
    Math.pow(clicksB - expectedB_clicks, 2) / (expectedB_clicks || 1) +
    Math.pow(noClicksB - expectedB_no, 2) / (expectedB_no || 1)

  // Chi-sq to confidence mapping (1 df: 3.84 = 95%, 6.63 = 99%)
  let conf = 50
  if (chiSq >= 10.83) conf = 99
  else if (chiSq >= 6.63) conf = 97
  else if (chiSq >= 5.02) conf = 95
  else if (chiSq >= 3.84) conf = 90
  else if (chiSq >= 2.71) conf = 80
  else if (chiSq >= 1.64) conf = 70
  else conf = Math.max(50, Math.min(65, 50 + chiSq * 10))

  return Math.min(99, conf)
}

function declareWinner(test: ABTest): 'A' | 'B' | 'inconclusive' {
  if (test.confidence < 80) return 'inconclusive'
  return test.variantA.ctr >= test.variantB.ctr ? 'A' : 'B'
}

// ─── Simulated Growth ─────────────────────────────────────────────────────────

function simulateDailyGrowth(test: ABTest): ABTest {
  const start = new Date(test.startDate)
  const now = new Date()
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
  const days = Math.min(daysElapsed, test.totalDays)

  // Seed randomness from test id for consistency
  const seed = test.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const rand = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n

  const baseViewsPerDay = 800 + rand(1200)
  const aGrowthFactor = 1 + rand(0.03) // A grows slightly slower
  const bGrowthFactor = 1.02 + rand(0.03) // B has edge in some tests

  const aViews = Math.floor(test.variantA.views + baseViewsPerDay * days * aGrowthFactor)
  const bViews = Math.floor(test.variantB.views + baseViewsPerDay * days * bGrowthFactor)

  const aBaseCtr = test.variantA.ctr
  const bBaseCtr = test.variantB.ctr
  const aCtr = parseFloat((aBaseCtr + (rand(0.5) - 0.2) * (days / test.totalDays)).toFixed(2))
  const bCtr = parseFloat((bBaseCtr + (rand(0.6) - 0.1) * (days / test.totalDays)).toFixed(2))

  const aClicks = Math.floor(aViews * (aCtr / 100))
  const bClicks = Math.floor(bViews * (bCtr / 100))
  const aEngagement = parseFloat((test.variantA.engagementRate + rand(0.3) * (days / test.totalDays)).toFixed(2))
  const bEngagement = parseFloat((test.variantB.engagementRate + rand(0.4) * (days / test.totalDays)).toFixed(2))

  const updatedA: Variant = { ...test.variantA, views: aViews, clicks: aClicks, ctr: aCtr, engagementRate: aEngagement }
  const updatedB: Variant = { ...test.variantB, views: bViews, clicks: bClicks, ctr: bCtr, engagementRate: bEngagement }
  const confidence = computeConfidence(updatedA, updatedB)

  return {
    ...test,
    daysRunning: days,
    variantA: updatedA,
    variantB: updatedB,
    confidence,
    winner: test.status === 'completed' ? declareWinner({ ...test, variantA: updatedA, variantB: updatedB, confidence }) : undefined,
  }
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

const TODAY = new Date()
const daysAgo = (n: number) => new Date(TODAY.getTime() - n * 86400000).toISOString().split('T')[0]

const DEMO_TESTS: ABTest[] = [
  {
    id: 'test-1',
    name: 'YouTube Title: Numbers vs Curiosity',
    type: 'title',
    status: 'running',
    startDate: daysAgo(6),
    totalDays: 14,
    daysRunning: 6,
    variantA: {
      content: '7 Habits That Grew My Channel to 100K',
      views: 18400,
      clicks: 1472,
      ctr: 8.0,
      engagementRate: 4.2,
      color: '#3b82f6',
    },
    variantB: {
      content: 'Why Most Creators Never Hit 100K (And How I Did)',
      views: 21200,
      clicks: 1908,
      ctr: 9.0,
      engagementRate: 5.1,
      color: '#ec4899',
    },
    confidence: 61,
    insight: 'Curiosity-gap titles appear stronger — needs more data.',
  },
  {
    id: 'test-2',
    name: 'Thumbnail: Face vs Text-Only',
    type: 'thumbnail',
    status: 'running',
    startDate: daysAgo(3),
    totalDays: 14,
    daysRunning: 3,
    variantA: {
      content: 'Creator face close-up, shocked expression, bold "TRUTH" overlay',
      views: 9200,
      clicks: 920,
      ctr: 10.0,
      engagementRate: 5.8,
      color: '#3b82f6',
    },
    variantB: {
      content: 'Dark background, stat callout "3.2M views in 30 days", minimal text',
      views: 8800,
      clicks: 704,
      ctr: 8.0,
      engagementRate: 4.4,
      color: '#ec4899',
    },
    confidence: 38,
    insight: 'Early data favors face thumbnails. Test still in progress.',
  },
  {
    id: 'test-3',
    name: 'Hook: Question vs Bold Statement',
    type: 'hook',
    status: 'completed',
    startDate: daysAgo(35),
    endDate: daysAgo(5),
    totalDays: 30,
    daysRunning: 30,
    variantA: {
      content: 'What if I told you everything you know about going viral is wrong?',
      views: 42000,
      clicks: 3780,
      ctr: 9.0,
      engagementRate: 6.2,
      color: '#3b82f6',
    },
    variantB: {
      content: 'This video will change how you make content forever. I promise.',
      views: 39000,
      clicks: 2730,
      ctr: 7.0,
      engagementRate: 5.1,
      color: '#ec4899',
    },
    winner: 'A',
    confidence: 94,
    insight: 'Question hooks outperform bold statements by 28.6% CTR. Audiences engage more when challenged with a question.',
  },
  {
    id: 'test-4',
    name: 'CTA Placement: Mid-Video vs End',
    type: 'cta',
    status: 'completed',
    startDate: daysAgo(25),
    endDate: daysAgo(11),
    totalDays: 14,
    daysRunning: 14,
    variantA: {
      content: 'Subscribe CTA at 2:30 mark with verbal callout + on-screen prompt',
      views: 31500,
      clicks: 2520,
      ctr: 8.0,
      engagementRate: 4.9,
      color: '#3b82f6',
    },
    variantB: {
      content: 'Subscribe CTA in last 30 seconds with end-screen animation',
      views: 31000,
      clicks: 1860,
      ctr: 6.0,
      engagementRate: 3.8,
      color: '#ec4899',
    },
    winner: 'A',
    confidence: 91,
    insight: 'Mid-video CTAs convert 33% better. Place ask when engagement is peak, not after drop-off zone.',
  },
  {
    id: 'test-5',
    name: 'Description: SEO-Dense vs Conversational',
    type: 'description',
    status: 'completed',
    startDate: daysAgo(50),
    endDate: daysAgo(20),
    totalDays: 30,
    daysRunning: 30,
    variantA: {
      content: 'In this video, I break down the exact YouTube growth strategy, SEO tips, algorithm hacks, content marketing tactics...',
      views: 27000,
      clicks: 1350,
      ctr: 5.0,
      engagementRate: 2.9,
      color: '#3b82f6',
    },
    variantB: {
      content: 'Spent 18 months cracking YouTube\'s algorithm so you don\'t have to. Here\'s the honest breakdown...',
      views: 28500,
      clicks: 1653,
      ctr: 5.8,
      engagementRate: 3.7,
      color: '#ec4899',
    },
    winner: 'B',
    confidence: 87,
    insight: 'Conversational descriptions pull 16% more clicks. Authenticity beats keyword stuffing for modern audiences.',
  },
]

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function loadTests(): ABTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ABTest[]
  } catch { /* ignore */ }
  return DEMO_TESTS
}

function saveTests(tests: ABTest[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tests)) } catch { /* ignore */ }
}

// ─── Confetti Animation (CSS) ─────────────────────────────────────────────────

const confettiStyle = `
@keyframes confetti-fall {
  0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(60px) rotate(720deg); opacity: 0; }
}
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall 1.2s ease-out forwards;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.4); }
}
`

const CONFETTI_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#a78bfa']

function ConfettiPieces() {
  return (
    <>
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${5 + i * 6}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${i * 0.07}s`,
            animationDuration: `${1 + (i % 3) * 0.3}s`,
          }}
        />
      ))}
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === 'running') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: '#10b981',
        animation: 'pulse-dot 1.4s ease-in-out infinite', display: 'inline-block',
      }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Running
      </span>
    </div>
  )
  if (status === 'completed') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <CheckCircle size={12} color="#a78bfa" />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#a78bfa', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Completed
      </span>
    </div>
  )
  if (status === 'paused') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <AlertCircle size={12} color="#f59e0b" />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Paused
      </span>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Clock size={12} color="#4b5680" />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#4b5680', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Draft
      </span>
    </div>
  )
}

function TypeBadge({ type }: { type: TestType }) {
  const meta = TYPE_META[type]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      background: 'rgba(59,130,246,0.12)', borderRadius: 6,
      fontSize: 11, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.04em',
    }}>
      {meta.icon}
      {meta.label}
    </span>
  )
}

function VariantCard({
  label, variant, isWinner, isCompleted,
}: {
  label: 'A' | 'B'
  variant: Variant
  isWinner: boolean
  isCompleted: boolean
}) {
  return (
    <div style={{
      flex: 1, padding: '14px 16px', borderRadius: 10,
      background: `${variant.color}10`,
      border: `1px solid ${variant.color}${isWinner ? '60' : '25'}`,
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {isWinner && isCompleted && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: '#f59e0b', borderRadius: 4, padding: '2px 6px',
          fontSize: 10, fontWeight: 700, color: '#080810', letterSpacing: '0.06em',
        }}>
          WINNER
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 4, background: variant.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#fff',
        }}>
          {label}
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#4b5680' }}>Variant {label}</span>
      </div>

      <p style={{
        fontSize: 12, color: '#f0f4ff', lineHeight: 1.5, marginBottom: 12,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontStyle: 'italic',
      }}>
        "{variant.content}"
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, color: '#4b5680' }}>CTR</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 700, color: variant.color }}>
            {variant.ctr.toFixed(1)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#4b5680' }}>Views</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>
            {fmtNum(variant.views)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#4b5680' }}>Engagement</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>
            {variant.engagementRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({ test }: { test: ABTest }) {
  const aWinning = test.variantA.ctr >= test.variantB.ctr
  const aPercent = aWinning
    ? Math.round(50 + (test.confidence - 50) / 2)
    : Math.round(50 - (test.confidence - 50) / 2)
  const bPercent = 100 - aPercent

  const daysLeft = Math.max(0, test.totalDays - test.daysRunning)
  const isSignificant = test.confidence >= 80

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>A {aPercent}%</span>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: isSignificant ? '#10b981' : '#f59e0b',
        }}>
          {test.confidence}% confidence
          {!isSignificant && daysLeft > 0 && ` — needs ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}`}
          {isSignificant && ' — significant!'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#ec4899' }}>{bPercent}% B</span>
      </div>
      <div style={{
        height: 8, borderRadius: 4, overflow: 'hidden', background: '#1a1a2e',
        display: 'flex',
      }}>
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${aPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: '#3b82f6', borderRadius: '4px 0 0 4px' }}
        />
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${bPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ background: '#ec4899', borderRadius: '0 4px 4px 0' }}
        />
      </div>
    </div>
  )
}

function WinnerCard({ test }: { test: ABTest }) {
  if (!test.winner || test.winner === 'inconclusive') {
    return (
      <div style={{
        marginTop: 14, padding: '12px 16px', borderRadius: 10,
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <AlertCircle size={16} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>
            Inconclusive
          </div>
          <div style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.5 }}>{test.insight}</div>
        </div>
      </div>
    )
  }

  const winnerVariant = test.winner === 'A' ? test.variantA : test.variantB
  const loserVariant = test.winner === 'A' ? test.variantB : test.variantA
  const improvement = loserVariant.ctr > 0
    ? Math.round(((winnerVariant.ctr - loserVariant.ctr) / loserVariant.ctr) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: 14, padding: '14px 16px', borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(167,139,250,0.08))',
        border: '1px solid rgba(16,185,129,0.3)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, pointerEvents: 'none' }}>
        <ConfettiPieces />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Trophy size={16} color="#f59e0b" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>
          Variant {test.winner} Wins!
        </span>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(16,185,129,0.15)', borderRadius: 6, padding: '2px 8px',
          fontSize: 12, fontWeight: 700, color: '#10b981',
        }}>
          +{improvement}% CTR
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 4 }}>
        {test.confidence}% statistical confidence
      </div>
      <div style={{ fontSize: 12, color: '#4b5680', lineHeight: 1.5 }}>{test.insight}</div>
    </motion.div>
  )
}

function ProgressBar({ test }: { test: ABTest }) {
  const pct = Math.min(100, Math.round((test.daysRunning / test.totalDays) * 100))
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#4b5680' }}>
          Day {test.daysRunning} of {test.totalDays}
        </span>
        <span style={{ fontSize: 11, color: '#4b5680' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 2,
            background: test.status === 'completed'
              ? 'linear-gradient(90deg, #a78bfa, #3b82f6)'
              : 'linear-gradient(90deg, #3b82f6, #10b981)',
          }}
        />
      </div>
    </div>
  )
}

function TestCard({
  test, onTogglePause, onDelete,
}: {
  test: ABTest
  onTogglePause: (id: string) => void
  onDelete: (id: string) => void
}) {
  const isCompleted = test.status === 'completed'
  const aWins = test.winner === 'A'
  const bWins = test.winner === 'B'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: '#0d0d1a',
        border: '1px solid rgba(59,130,246,0.1)',
        borderRadius: 14, padding: '18px 20px',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <StatusBadge status={test.status} />
            <TypeBadge type={test.type} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', lineHeight: 1.4, margin: 0 }}>
            {test.name}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {!isCompleted && (
            <button
              onClick={() => onTogglePause(test.id)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
                padding: '5px 7px', cursor: 'pointer', color: '#4b5680',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#f0f4ff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#4b5680' }}
              title={test.status === 'running' ? 'Pause test' : 'Resume test'}
            >
              {test.status === 'running' ? <Pause size={13} /> : <Play size={13} />}
            </button>
          )}
          <button
            onClick={() => onDelete(test.id)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 6,
              padding: '5px 7px', cursor: 'pointer', color: '#4b5680',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLButtonElement).style.color = '#4b5680' }}
            title="Delete test"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar test={test} />

      {/* Variants side by side */}
      <div style={{ display: 'flex', gap: 10 }}>
        <VariantCard label="A" variant={test.variantA} isWinner={aWins} isCompleted={isCompleted} />
        <VariantCard label="B" variant={test.variantB} isWinner={bWins} isCompleted={isCompleted} />
      </div>

      {/* Confidence bar */}
      <ConfidenceBar test={test} />

      {/* Winner / insight */}
      {isCompleted && <WinnerCard test={test} />}
    </motion.div>
  )
}

// ─── Completed Table ──────────────────────────────────────────────────────────

function CompletedTable({ tests, onCopyWinner }: { tests: ABTest[]; onCopyWinner: (t: ABTest) => void }) {
  const completed = tests.filter(t => t.status === 'completed')

  if (completed.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        color: '#4b5680', fontSize: 14,
      }}>
        <FlaskConical size={40} color="#1a1a2e" style={{ margin: '0 auto 12px' }} />
        No completed tests yet. Keep running experiments!
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
            {['Test Name', 'Type', 'Winner', 'Improvement', 'Confidence', 'Date', ''].map(h => (
              <th key={h} style={{
                padding: '10px 12px', textAlign: 'left',
                fontSize: 11, fontWeight: 600, color: '#4b5680',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {completed.map(test => {
            const wv = test.winner === 'A' ? test.variantA : test.winner === 'B' ? test.variantB : null
            const lv = test.winner === 'A' ? test.variantB : test.winner === 'B' ? test.variantA : null
            const improvement = wv && lv && lv.ctr > 0
              ? Math.round(((wv.ctr - lv.ctr) / lv.ctr) * 100)
              : null

            return (
              <motion.tr
                key={test.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ borderBottom: '1px solid rgba(59,130,246,0.06)' }}
              >
                <td style={{ padding: '12px 12px', fontSize: 13, color: '#f0f4ff', fontWeight: 500 }}>
                  {test.name}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <TypeBadge type={test.type} />
                </td>
                <td style={{ padding: '12px 12px' }}>
                  {test.winner === 'inconclusive' ? (
                    <span style={{ fontSize: 12, color: '#f59e0b' }}>Inconclusive</span>
                  ) : test.winner ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Trophy size={12} color="#f59e0b" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>
                        Variant {test.winner}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#4b5680' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  {improvement !== null ? (
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: improvement > 0 ? '#10b981' : '#ef4444',
                      fontFamily: 'Space Mono, monospace',
                    }}>
                      {improvement > 0 ? '+' : ''}{improvement}% CTR
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#4b5680' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#a78bfa' }}>
                    {test.confidence}%
                  </span>
                </td>
                <td style={{ padding: '12px 12px', fontSize: 12, color: '#4b5680' }}>
                  {test.endDate ?? '—'}
                </td>
                <td style={{ padding: '12px 12px' }}>
                  {test.winner && test.winner !== 'inconclusive' && (
                    <button
                      onClick={() => onCopyWinner(test)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, color: '#3b82f6',
                        transition: 'background 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                    >
                      <Copy size={11} />
                      Apply Winner
                    </button>
                  )}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Create Test Form ─────────────────────────────────────────────────────────

const ALL_TYPES: TestType[] = ['title', 'thumbnail', 'hook', 'cta', 'description']
const DURATIONS = [7, 14, 30]

interface CreateForm {
  name: string
  type: TestType
  contentA: string
  contentB: string
  duration: 7 | 14 | 30
}

const DEFAULT_FORM: CreateForm = {
  name: '', type: 'title', contentA: '', contentB: '', duration: 14,
}

function CreateTestPanel({ onSubmit, onCancel }: { onSubmit: (f: CreateForm) => void; onCancel?: () => void }) {
  const [form, setForm] = useState<CreateForm>(DEFAULT_FORM)

  const valid = form.name.trim() && form.contentA.trim() && form.contentB.trim()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#0d0d1a',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 16, padding: '28px 28px',
        maxWidth: 680, margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(59,130,246,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlaskConical size={18} color="#3b82f6" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>Create A/B Test</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#4b5680' }}>Run a scientific split test on your content</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: '#4b5680', padding: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f0f4ff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4b5680')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Test name */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5680', marginBottom: 6, letterSpacing: '0.04em' }}>
          TEST NAME
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. YouTube Title: Numbers vs Story"
          style={{
            width: '100%', padding: '10px 14px',
            background: '#080810', border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 8, fontSize: 13, color: '#f0f4ff',
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(59,130,246,0.4)')}
          onBlur={e => (e.target.style.borderColor = 'rgba(59,130,246,0.15)')}
        />
      </div>

      {/* Test type */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5680', marginBottom: 8, letterSpacing: '0.04em' }}>
          TEST TYPE
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ALL_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setForm(f => ({ ...f, type }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: form.type === type ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                border: form.type === type ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: form.type === type ? '#3b82f6' : '#4b5680',
              }}
            >
              {TYPE_META[type].icon}
              {TYPE_META[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Variants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {(['A', 'B'] as const).map(v => (
          <div key={v}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6,
              color: v === 'A' ? '#3b82f6' : '#ec4899', letterSpacing: '0.04em',
            }}>
              VARIANT {v}
            </label>
            <textarea
              value={v === 'A' ? form.contentA : form.contentB}
              onChange={e => setForm(f => v === 'A'
                ? { ...f, contentA: e.target.value }
                : { ...f, contentB: e.target.value }
              )}
              placeholder={v === 'A' ? 'Enter Variant A content...' : 'Enter Variant B content...'}
              rows={4}
              style={{
                width: '100%', padding: '10px 14px',
                background: '#080810',
                border: `1px solid ${v === 'A' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)'}`,
                borderRadius: 8, fontSize: 12, color: '#f0f4ff',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                lineHeight: 1.5, transition: 'border-color 0.15s',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
              onFocus={e => (e.target.style.borderColor = v === 'A' ? 'rgba(59,130,246,0.4)' : 'rgba(236,72,153,0.4)')}
              onBlur={e => (e.target.style.borderColor = v === 'A' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)')}
            />
          </div>
        ))}
      </div>

      {/* Duration */}
      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4b5680', marginBottom: 8, letterSpacing: '0.04em' }}>
          DURATION
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setForm(f => ({ ...f, duration: d as 7 | 14 | 30 }))}
              style={{
                padding: '7px 20px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: form.duration === d ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: form.duration === d ? '1px solid rgba(167,139,250,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: form.duration === d ? '#a78bfa' : '#4b5680',
              }}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <motion.button
        whileHover={valid ? { scale: 1.02 } : {}}
        whileTap={valid ? { scale: 0.98 } : {}}
        onClick={() => valid && onSubmit(form)}
        style={{
          width: '100%', padding: '12px 0',
          background: valid ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
          border: 'none', borderRadius: 10, cursor: valid ? 'pointer' : 'not-allowed',
          fontSize: 14, fontWeight: 700, color: valid ? '#fff' : '#4b5680',
          transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}
      >
        <Play size={16} />
        Start Test
      </motion.button>
    </motion.div>
  )
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ tests }: { tests: ABTest[] }) {
  const active = tests.filter(t => t.status === 'running').length
  const completed = tests.filter(t => t.status === 'completed').length

  const improvements = tests
    .filter(t => t.winner && t.winner !== 'inconclusive')
    .map(t => {
      const w = t.winner === 'A' ? t.variantA : t.variantB
      const l = t.winner === 'A' ? t.variantB : t.variantA
      return l.ctr > 0 ? ((w.ctr - l.ctr) / l.ctr) * 100 : 0
    })
  const avgImprovement = improvements.length
    ? Math.round(improvements.reduce((a, b) => a + b, 0) / improvements.length)
    : 0

  // Best type by winner count
  const typeWins: Record<TestType, number> = { title: 0, thumbnail: 0, hook: 0, cta: 0, description: 0 }
  tests.filter(t => t.winner && t.winner !== 'inconclusive').forEach(t => { typeWins[t.type]++ })
  const bestType = (Object.entries(typeWins).sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'title') as TestType
  const bestTypeLabel = TYPE_META[bestType].label + ' tests'

  const stats = [
    { label: 'Active Tests', value: active.toString(), icon: <FlaskConical size={16} color="#3b82f6" />, color: '#3b82f6' },
    { label: 'Tests Completed', value: completed.toString(), icon: <CheckCircle size={16} color="#10b981" />, color: '#10b981' },
    { label: 'Avg Improvement', value: `+${avgImprovement}%`, icon: <TrendingUp size={16} color="#a78bfa" />, color: '#a78bfa' },
    { label: 'Best Variant Type', value: bestTypeLabel, icon: <Trophy size={16} color="#f59e0b" />, color: '#f59e0b' },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24,
    }}>
      {stats.map(s => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.08)',
            borderRadius: 12, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${s.color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {s.icon}
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#4b5680', marginBottom: 2 }}>{s.label}</div>
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: 15, fontWeight: 700,
              color: '#f0f4ff',
            }}>
              {s.value}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContentABLab() {
  const [tests, setTests] = useState<ABTest[]>(() => loadTests())
  const [tab, setTab] = useState<ActiveTab>('active')
  const [refreshKey, setRefreshKey] = useState(0)

  // Inject CSS
  useEffect(() => {
    const id = 'ab-lab-styles'
    if (!document.getElementById(id)) {
      const style = document.createElement('style')
      style.id = id
      style.textContent = confettiStyle
      document.head.appendChild(style)
    }
    return () => { document.getElementById('ab-lab-styles')?.remove() }
  }, [])

  // Simulate growth for running tests on mount and refresh
  useEffect(() => {
    setTests(prev => {
      const updated = prev.map(t =>
        t.status === 'running' ? simulateDailyGrowth(t) : t
      )
      saveTests(updated)
      return updated
    })
  }, [refreshKey])

  // Persist to localStorage
  useEffect(() => {
    saveTests(tests)
  }, [tests])

  const handleTogglePause = useCallback((id: string) => {
    setTests(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: t.status === 'running' ? 'paused' : 'running' }
        : t
    ))
  }, [])

  const handleDelete = useCallback((id: string) => {
    setTests(prev => prev.filter(t => t.id !== id))
    toast.success('Test deleted')
  }, [])

  const handleCopyWinner = useCallback((test: ABTest) => {
    const winner = test.winner === 'A' ? test.variantA : test.variantB
    navigator.clipboard.writeText(winner.content)
      .then(() => toast.success('Winning variant copied to clipboard!'))
      .catch(() => toast.error('Copy failed'))
  }, [])

  const handleCreateTest = useCallback((form: CreateForm) => {
    const seedViews = 5000 + Math.floor(Math.random() * 10000)
    const seedCtrA = 4 + Math.random() * 4
    const seedCtrB = 4 + Math.random() * 4

    const newTest: ABTest = {
      id: `test-${Date.now()}`,
      name: form.name,
      type: form.type,
      status: 'running',
      startDate: new Date().toISOString().split('T')[0],
      totalDays: form.duration,
      daysRunning: 0,
      variantA: {
        content: form.contentA,
        views: seedViews,
        clicks: Math.floor(seedViews * seedCtrA / 100),
        ctr: parseFloat(seedCtrA.toFixed(1)),
        engagementRate: parseFloat((2 + Math.random() * 3).toFixed(1)),
        color: '#3b82f6',
      },
      variantB: {
        content: form.contentB,
        views: seedViews,
        clicks: Math.floor(seedViews * seedCtrB / 100),
        ctr: parseFloat(seedCtrB.toFixed(1)),
        engagementRate: parseFloat((2 + Math.random() * 3).toFixed(1)),
        color: '#ec4899',
      },
      confidence: 20,
      insight: 'Test just started — collect more data before drawing conclusions.',
    }

    setTests(prev => [newTest, ...prev])
    setTab('active')
    toast.success('Test started! Data will accumulate daily.')
  }, [])

  const activeTests = tests.filter(t => t.status === 'running' || t.status === 'paused')
  const completedTests = tests.filter(t => t.status === 'completed')

  const TABS: { key: ActiveTab; label: string; count?: number }[] = [
    { key: 'active', label: 'Active Tests', count: activeTests.length },
    { key: 'completed', label: 'Completed', count: completedTests.length },
    { key: 'create', label: 'Create New' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      padding: '28px 28px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FlaskConical size={20} color="#3b82f6" />
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
              Content A/B Lab
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#4b5680', lineHeight: 1.5 }}>
            Scientific split testing for creators. Test what works, prove it with data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: '#4b5680',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.09)'; (e.currentTarget).style.color = '#f0f4ff' }}
            onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget).style.color = '#4b5680' }}
            title="Refresh metrics"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setTab('create')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none', borderRadius: 8, padding: '9px 16px',
              cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            <Plus size={15} />
            New Test
          </motion.button>
        </div>
      </div>

      {/* Stats Bar */}
      <StatsBar tests={tests} />

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        borderBottom: '1px solid rgba(59,130,246,0.1)', paddingBottom: 0,
      }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 16px', borderRadius: '8px 8px 0 0',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s', background: 'transparent',
              color: tab === t.key ? '#f0f4ff' : '#4b5680',
              borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {t.label}
            {t.count !== undefined && (
              <span style={{
                background: tab === t.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                borderRadius: 4, padding: '1px 6px', fontSize: 11,
                color: tab === t.key ? '#3b82f6' : '#4b5680',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {tab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTests.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 20px',
                color: '#4b5680',
              }}>
                <FlaskConical size={48} color="#1a1a2e" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#4b5680', marginBottom: 6 }}>
                  No active tests
                </div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>
                  Create your first A/B test to start collecting data
                </div>
                <button
                  onClick={() => setTab('create')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 8, padding: '9px 18px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: '#3b82f6',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <Plus size={15} />
                  Create Test
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 16 }}>
                <AnimatePresence>
                  {activeTests.map(test => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onTogglePause={handleTogglePause}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: '#0d0d1a',
              border: '1px solid rgba(59,130,246,0.08)',
              borderRadius: 14, overflow: 'hidden',
            }}
          >
            <CompletedTable tests={tests} onCopyWinner={handleCopyWinner} />
          </motion.div>
        )}

        {tab === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <CreateTestPanel
              onSubmit={handleCreateTest}
              onCancel={() => setTab('active')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
