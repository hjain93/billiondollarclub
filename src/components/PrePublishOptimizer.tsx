import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Zap, Search, Clock, TrendingUp,
  CheckCircle, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Copy, Sparkles,
  ArrowRight, BarChart3,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentFormat = 'youtube' | 'reel' | 'short' | 'blog'
type Platform = 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

interface ContentInput {
  format: ContentFormat
  title: string
  description: string
  tags: string
  platforms: Platform[]
  thumbnailConcept: string
  postDay: DayOfWeek
  postTime: string
}

interface DimensionScore {
  id: string
  label: string
  icon: React.ReactNode
  score: number
  status: 'Strong' | 'Needs Improvement' | 'Critical'
  summary: string
  tips: string[]
  suggestion?: string
}

interface TopAction {
  priority: 'P1' | 'P2' | 'P3'
  action: string
  impact: string
  suggestion: string
}

interface ScoreResult {
  overall: number
  label: 'Needs Work' | 'Good' | 'Strong' | 'Excellent'
  dimensions: DimensionScore[]
  topActions: TopAction[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POWER_WORDS = [
  'secret', 'hidden', 'proven', 'ultimate', 'shocking', 'surprising',
  'never', 'always', 'why', 'how', 'what', 'best', 'worst', 'most',
  'fastest', 'easiest', 'free', 'new', 'now', 'today', 'instantly',
  'guaranteed', 'exclusive', 'limited', 'revealed', 'truth', 'lies',
  'mistake', 'hack', 'trick', 'formula', 'blueprint',
]

const EMOTION_WORDS = [
  'love', 'hate', 'fear', 'hope', 'dream', 'fail', 'win', 'lose',
  'struggle', 'success', 'inspire', 'transform', 'change', 'regret',
  'proud', 'embarrass', 'shock', 'amaze', 'incredible', 'terrifying',
  'heartbreak', 'joy', 'anxiety', 'relief', 'excitement',
]

const CTA_PHRASES = [
  'comment below', 'let me know', 'share this', 'subscribe', 'follow',
  'save this', 'tag a friend', 'what do you think', 'drop a', 'tell me',
  'click the link', 'swipe up', 'watch till the end', 'don\'t forget',
]

const PLATFORM_OPTIMAL: Record<Platform, { days: DayOfWeek[]; hours: number[] }> = {
  youtube: { days: ['Thursday', 'Friday', 'Saturday'], hours: [14, 15, 16, 17, 18] },
  instagram: { days: ['Tuesday', 'Wednesday', 'Thursday'], hours: [9, 10, 11, 17, 18] },
  tiktok: { days: ['Tuesday', 'Thursday', 'Friday'], hours: [7, 8, 19, 20, 21] },
  linkedin: { days: ['Tuesday', 'Wednesday', 'Thursday'], hours: [8, 9, 10, 17] },
  twitter: { days: ['Wednesday', 'Thursday', 'Friday'], hours: [9, 12, 15, 17, 18] },
}

const FORMAT_PLATFORM_FIT: Record<ContentFormat, Platform[]> = {
  youtube: ['youtube'],
  reel: ['instagram', 'tiktok'],
  short: ['youtube', 'tiktok', 'instagram'],
  blog: ['linkedin', 'twitter'],
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

function scoreContent(input: ContentInput): ScoreResult {
  const title = input.title.toLowerCase()
  const desc = input.description.toLowerCase()
  const tags = input.tags.toLowerCase()
  const combined = `${title} ${desc} ${tags}`
  const postHour = parseInt(input.postTime.split(':')[0] || '12', 10)

  // Hook Strength (0-100)
  let hookScore = 30
  const titleLen = input.title.length
  if (titleLen >= 40 && titleLen <= 70) hookScore += 20
  else if (titleLen >= 30 && titleLen < 40) hookScore += 12
  else if (titleLen > 70 && titleLen <= 85) hookScore += 10
  else if (titleLen > 0) hookScore += 5

  if (input.title.includes('?')) hookScore += 15
  if (input.title.includes(':')) hookScore += 8

  const powerWordHits = POWER_WORDS.filter(w => title.includes(w)).length
  hookScore += Math.min(powerWordHits * 8, 25)

  const hasNumber = /\d/.test(input.title)
  if (hasNumber) hookScore += 10

  hookScore = Math.min(hookScore, 100)

  const hookTips: string[] = []
  if (titleLen < 40) hookTips.push('Expand your title to 45–70 characters for maximum visibility')
  if (powerWordHits === 0) hookTips.push('Add a power word like "secret", "proven", or a number to boost click-through')
  if (!input.title.includes('?') && !hasNumber) hookTips.push('Reframe as a question or lead with a number (e.g., "7 Ways…")')
  if (input.description.length < 100) hookTips.push('Your first 2 lines of description appear in search previews — make them count')
  if (hookTips.length === 0) hookTips.push('Hook is well-crafted — consider A/B testing with a question variant')

  const hookSuggestion = input.title.length > 0
    ? `"${input.title.slice(0, 1).toUpperCase() + input.title.slice(1)} (Most People Get This Wrong)"`
    : '"How I Did [Result] in [Time] — The Exact Method"'

  // SEO Potential (0-100)
  let seoScore = 20
  const keywordCount = tags.split(',').filter(t => t.trim().length > 0).length
  if (keywordCount >= 5) seoScore += 25
  else if (keywordCount >= 3) seoScore += 15
  else if (keywordCount >= 1) seoScore += 8

  if (titleLen >= 45 && titleLen <= 60) seoScore += 20
  else if (titleLen > 0) seoScore += 8

  const keywordsInTitle = tags.split(',').filter(t => title.includes(t.trim().toLowerCase())).length
  seoScore += Math.min(keywordsInTitle * 10, 20)

  if (input.description.length >= 200) seoScore += 15
  else if (input.description.length >= 100) seoScore += 8

  seoScore = Math.min(seoScore, 100)

  const seoTips: string[] = []
  if (keywordCount < 5) seoTips.push(`Add ${5 - keywordCount} more relevant tags — aim for 8–12 for YouTube, 5–8 for others`)
  if (keywordsInTitle === 0 && keywordCount > 0) seoTips.push('Include your primary keyword naturally in the title')
  if (input.description.length < 200) seoTips.push('Write at least 200 characters in description — include keywords in first 100 chars')
  if (seoTips.length === 0) seoTips.push('Strong SEO setup — verify keyword competition with a research tool before publishing')

  // Platform Fit (0-100)
  let platformScore = 15
  if (input.platforms.length === 0) {
    platformScore = 15
  } else {
    const fittingPlatforms = input.platforms.filter(p =>
      FORMAT_PLATFORM_FIT[input.format]?.includes(p)
    ).length
    platformScore += (fittingPlatforms / input.platforms.length) * 50
    if (input.platforms.length >= 2) platformScore += 15
    if (input.thumbnailConcept.length > 20) platformScore += 20
    else if (input.thumbnailConcept.length > 0) platformScore += 10
  }
  platformScore = Math.min(Math.round(platformScore), 100)

  const platformTips: string[] = []
  if (input.platforms.length === 0) platformTips.push('Select at least one platform to get fit analysis')
  const mismatchedPlatforms = input.platforms.filter(p => !FORMAT_PLATFORM_FIT[input.format]?.includes(p))
  if (mismatchedPlatforms.length > 0) {
    platformTips.push(`"${input.format}" format may underperform on ${mismatchedPlatforms.join(', ')} — consider repurposing`)
  }
  if (input.thumbnailConcept.length < 20) platformTips.push('Describe a specific thumbnail concept — high contrast face + bold text outperforms generic imagery by 2.3×')
  if (platformTips.length === 0) platformTips.push('Great platform alignment — cross-post within 24h of primary publish for best reach')

  // Engagement Triggers (0-100)
  let engagementScore = 20
  const ctaHits = CTA_PHRASES.filter(c => combined.includes(c)).length
  engagementScore += Math.min(ctaHits * 15, 35)

  const hasQuestion = desc.includes('?') || title.includes('?')
  if (hasQuestion) engagementScore += 15

  const emotionHits = EMOTION_WORDS.filter(w => combined.includes(w)).length
  engagementScore += Math.min(emotionHits * 8, 20)

  if (input.description.includes('👇') || input.description.includes('⬇')) engagementScore += 5
  if (combined.includes('link in bio') || combined.includes('link below')) engagementScore += 5

  engagementScore = Math.min(engagementScore, 100)

  const engagementTips: string[] = []
  if (ctaHits === 0) engagementTips.push('Add a direct CTA like "Comment your thoughts below" — posts with CTAs get 3× more comments')
  if (!hasQuestion) engagementTips.push('End your caption with a question to invite replies')
  if (emotionHits === 0) engagementTips.push('Weave in an emotional hook — vulnerability and aspiration drive saves and shares')
  if (engagementTips.length === 0) engagementTips.push('Strong engagement setup — consider a controversy/debate prompt for extra comment volume')

  const engagementSuggestion = 'Add to caption end: "What\'s your experience with this? Drop a comment — I read every single one. 👇"'

  // Optimal Timing (0-100)
  let timingScore = 20
  if (input.platforms.length > 0) {
    const platformTimingScores = input.platforms.map(platform => {
      const optimal = PLATFORM_OPTIMAL[platform]
      if (!optimal) return 40
      let ps = 0
      if (optimal.days.includes(input.postDay)) ps += 50
      if (optimal.hours.includes(postHour)) ps += 50
      return ps
    })
    timingScore = Math.round(platformTimingScores.reduce((a, b) => a + b, 0) / platformTimingScores.length)
    timingScore = Math.max(timingScore, 15)
  }

  const timingTips: string[] = []
  if (input.platforms.length === 0) {
    timingTips.push('Select platforms to get timing recommendations')
  } else {
    input.platforms.forEach(p => {
      const optimal = PLATFORM_OPTIMAL[p]
      if (optimal && !optimal.days.includes(input.postDay)) {
        timingTips.push(`${p.charAt(0).toUpperCase() + p.slice(1)}: Peak days are ${optimal.days.slice(0, 2).join(' & ')}`)
      }
      if (optimal && !optimal.hours.includes(postHour)) {
        const bestHour = optimal.hours[Math.floor(optimal.hours.length / 2)]
        timingTips.push(`${p.charAt(0).toUpperCase() + p.slice(1)}: Try posting around ${bestHour}:00 for higher early engagement`)
      }
    })
  }
  if (timingTips.length === 0) timingTips.push('Optimal timing window — schedule now to capture peak algorithm boost')

  // Assemble dimensions
  const dimensions: DimensionScore[] = [
    {
      id: 'hook',
      label: 'Hook Strength',
      icon: <Zap size={16} />,
      score: hookScore,
      status: hookScore >= 71 ? 'Strong' : hookScore >= 41 ? 'Needs Improvement' : 'Critical',
      summary: hookScore >= 71 ? 'Your title creates genuine curiosity' : hookScore >= 41 ? 'Hook is decent but could stop more scrolls' : 'Weak hook — most viewers will scroll past',
      tips: hookTips,
      suggestion: hookSuggestion,
    },
    {
      id: 'seo',
      label: 'SEO Potential',
      icon: <Search size={16} />,
      score: seoScore,
      status: seoScore >= 71 ? 'Strong' : seoScore >= 41 ? 'Needs Improvement' : 'Critical',
      summary: seoScore >= 71 ? 'Solid keyword coverage and discoverability' : seoScore >= 41 ? 'Moderate search potential — room to grow' : 'Low discoverability — few people will find this organically',
      tips: seoTips,
    },
    {
      id: 'platform',
      label: 'Platform Fit',
      icon: <Target size={16} />,
      score: platformScore,
      status: platformScore >= 71 ? 'Strong' : platformScore >= 41 ? 'Needs Improvement' : 'Critical',
      summary: platformScore >= 71 ? 'Format aligns well with chosen platforms' : platformScore >= 41 ? 'Partial fit — some platforms may underperform' : 'Format mismatch — consider adapting for each platform',
      tips: platformTips,
    },
    {
      id: 'engagement',
      label: 'Engagement Triggers',
      icon: <TrendingUp size={16} />,
      score: engagementScore,
      status: engagementScore >= 71 ? 'Strong' : engagementScore >= 41 ? 'Needs Improvement' : 'Critical',
      summary: engagementScore >= 71 ? 'Strong CTAs and emotional anchors present' : engagementScore >= 41 ? 'Some triggers present — needs more urgency' : 'Missing key engagement triggers — algorithm deprioritises passive content',
      tips: engagementTips,
      suggestion: engagementSuggestion,
    },
    {
      id: 'timing',
      label: 'Optimal Timing',
      icon: <Clock size={16} />,
      score: timingScore,
      status: timingScore >= 71 ? 'Strong' : timingScore >= 41 ? 'Needs Improvement' : 'Critical',
      summary: timingScore >= 71 ? 'Posting in a high-traffic window' : timingScore >= 41 ? 'Timing is okay but not peak' : 'Off-peak timing will limit initial reach',
      tips: timingTips,
    },
  ]

  // Overall score
  const weights = [0.25, 0.20, 0.20, 0.20, 0.15]
  const scores = [hookScore, seoScore, platformScore, engagementScore, timingScore]
  const overall = Math.round(scores.reduce((sum, s, i) => sum + s * weights[i], 0))

  const overallLabel: ScoreResult['label'] =
    overall >= 86 ? 'Excellent' :
    overall >= 71 ? 'Strong' :
    overall >= 41 ? 'Good' : 'Needs Work'

  // Top 3 actions
  const sorted = [...dimensions].sort((a, b) => a.score - b.score)
  const priorities: Array<'P1' | 'P2' | 'P3'> = ['P1', 'P2', 'P3']
  const topActions: TopAction[] = sorted.slice(0, 3).map((dim, i) => ({
    priority: priorities[i],
    action: `Improve ${dim.label}: ${dim.tips[0]}`,
    impact: i === 0 ? '+8–12 engagement score' : i === 1 ? '+5–8 engagement score' : '+3–5 engagement score',
    suggestion: dim.suggestion || dim.tips[0],
  }))

  return { overall, label: overallLabel, dimensions, topActions }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const statusStyles: Record<DimensionScore['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  Strong: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle size={12} /> },
  'Needs Improvement': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertTriangle size={12} /> },
  Critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: <XCircle size={12} /> },
}

function scoreColor(score: number): string {
  if (score >= 86) return '#10b981'
  if (score >= 71) return '#3b82f6'
  if (score >= 41) return '#f59e0b'
  return '#ef4444'
}

function DimensionCard({ dim, index }: { dim: DimensionScore; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const st = statusStyles[dim.status]
  const color = scoreColor(dim.score)

  function handleCopy() {
    if (dim.suggestion) {
      navigator.clipboard.writeText(dim.suggestion)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      style={{
        background: '#0d0d1a',
        border: '1px solid rgba(59,130,246,0.1)',
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6b7a9a' }}>{dim.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', letterSpacing: '-0.01em' }}>{dim.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status pill */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: st.color,
            background: st.bg, borderRadius: 20,
            padding: '3px 9px',
          }}>
            {st.icon}
            {dim.status}
          </span>
          {/* Score */}
          <span style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: 20, fontWeight: 700,
            color: color,
            minWidth: 36, textAlign: 'right',
          }}>{dim.score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dim.score}%` }}
          transition={{ delay: index * 0.08 + 0.2, duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: color }}
        />
      </div>

      {/* Summary */}
      <p style={{ fontSize: 12.5, color: '#6b7a9a', margin: 0, lineHeight: 1.5 }}>{dim.summary}</p>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', padding: 0,
          color: '#4b5680', fontSize: 11.5, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Hide tips' : 'Show actionable tips'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              {dim.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: color, flexShrink: 0, marginTop: 5,
                  }} />
                  <span style={{ fontSize: 12, color: '#8b9ab8', lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}

              {dim.suggestion && (
                <div style={{
                  marginTop: 6,
                  background: 'rgba(59,130,246,0.07)',
                  border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                }}>
                  <span style={{ fontSize: 11.5, color: '#8b9ab8', lineHeight: 1.5, fontStyle: 'italic', flex: 1 }}>
                    {dim.suggestion}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                      border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)'}`,
                      borderRadius: 7, padding: '4px 9px',
                      color: copied ? '#10b981' : '#3b82f6',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Copy size={11} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ScoreCircle({ score, label }: { score: number; label: ScoreResult['label'] }) {
  const color = scoreColor(score)
  const r = 52
  const circumference = 2 * Math.PI * r
  const strokeDash = (score / 100) * circumference

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={9} />
          <motion.circle
            cx={70} cy={70} r={r}
            fill="none"
            stroke={color}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - strokeDash }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            style={{
              fontFamily: '"Space Mono", monospace',
              fontSize: 32, fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {score}
          </motion.span>
          <span style={{ fontSize: 10, color: '#4b5680', marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          fontFamily: '"Space Mono", monospace',
          fontSize: 13, fontWeight: 700, color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: 20, padding: '4px 14px',
        }}
      >
        {label}
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEMO_INPUT: ContentInput = {
  format: 'youtube',
  title: '5 YouTube Mistakes That Are Killing Your Growth (Most Creators Ignore #3)',
  description: 'After analysing 200+ creator channels, I found the same 5 mistakes killing growth. In this video I break down exactly what they are and how to fix them today. Comment below — which mistake are you making right now? 👇 Save this for your next upload!',
  tags: 'youtube growth, creator tips, youtube algorithm, content strategy, youtube mistakes',
  platforms: ['youtube', 'instagram'],
  thumbnailConcept: 'Face with shocked expression + bold red text "YOU\'RE DOING IT WRONG" + dark background with YouTube play button',
  postDay: 'Thursday',
  postTime: '15:00',
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const PLATFORM_LIST: { id: Platform; label: string }[] = [
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter' },
]
const FORMAT_TABS: { id: ContentFormat; label: string }[] = [
  { id: 'youtube', label: 'YouTube Video' },
  { id: 'reel', label: 'Instagram Reel' },
  { id: 'short', label: 'Short-Form' },
  { id: 'blog', label: 'Blog/Newsletter' },
]

export function PrePublishOptimizer() {
  const [input, setInput] = useState<ContentInput>({
    format: 'youtube',
    title: '',
    description: '',
    tags: '',
    platforms: [],
    thumbnailConcept: '',
    postDay: 'Thursday',
    postTime: '09:00',
  })
  const [result, setResult] = useState<ScoreResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [copiedAction, setCopiedAction] = useState<number | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  function handlePlatformToggle(p: Platform) {
    setInput(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }))
  }

  function handleAnalyze() {
    setIsAnalyzing(true)
    // Use demo data if fields are empty
    const effectiveInput: ContentInput = {
      format: input.format,
      title: input.title.trim() || DEMO_INPUT.title,
      description: input.description.trim() || DEMO_INPUT.description,
      tags: input.tags.trim() || DEMO_INPUT.tags,
      platforms: input.platforms.length > 0 ? input.platforms : DEMO_INPUT.platforms,
      thumbnailConcept: input.thumbnailConcept.trim() || DEMO_INPUT.thumbnailConcept,
      postDay: input.postDay,
      postTime: input.postTime,
    }
    setTimeout(() => {
      setResult(scoreContent(effectiveInput))
      setIsAnalyzing(false)
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 900)
  }

  function handleCopyAction(idx: number, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedAction(idx)
    setTimeout(() => setCopiedAction(null), 2000)
  }

  const priorityColor: Record<string, string> = { P1: '#ef4444', P2: '#f59e0b', P3: '#3b82f6' }
  const titleLen = input.title.length

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      color: '#f0f4ff',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      padding: '28px 24px',
    }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Pre-Publish Optimizer
          </h1>
        </div>
        <p style={{ fontSize: 13, color: '#4b5680', margin: 0 }}>
          Score your content before it goes live — like Ad Strength, but for creators.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left panel (sticky) ── */}
        <div style={{
          width: 420, flexShrink: 0,
          position: 'sticky', top: 24,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 16, padding: '20px 20px',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>

            {/* Format tabs */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Content Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {FORMAT_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setInput(prev => ({ ...prev, format: tab.id }))}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 9,
                      border: input.format === tab.id
                        ? '1px solid rgba(59,130,246,0.5)'
                        : '1px solid rgba(59,130,246,0.08)',
                      background: input.format === tab.id
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(255,255,255,0.02)',
                      color: input.format === tab.id ? '#3b82f6' : '#6b7a9a',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title/Hook */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Title / Hook
                </label>
                <span style={{
                  fontSize: 11,
                  fontFamily: '"Space Mono", monospace',
                  color: titleLen > 70 ? '#ef4444' : titleLen >= 45 ? '#10b981' : '#4b5680',
                }}>
                  {titleLen}/85
                </span>
              </div>
              <textarea
                value={input.title}
                onChange={e => setInput(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. 5 YouTube Mistakes Killing Your Growth (Most Ignore #3)"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 10, padding: '10px 12px',
                  color: '#f0f4ff', fontSize: 13, lineHeight: 1.55,
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Description / Caption
              </label>
              <textarea
                value={input.description}
                onChange={e => setInput(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Write your description or caption here..."
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 10, padding: '10px 12px',
                  color: '#f0f4ff', fontSize: 13, lineHeight: 1.55,
                  fontFamily: 'inherit', resize: 'none', outline: 'none',
                }}
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Tags / Keywords
              </label>
              <input
                value={input.tags}
                onChange={e => setInput(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="youtube growth, creator tips, algorithm (comma-separated)"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 10, padding: '10px 12px',
                  color: '#f0f4ff', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>

            {/* Platforms */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Platforms
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PLATFORM_LIST.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePlatformToggle(p.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 20,
                      border: input.platforms.includes(p.id)
                        ? '1px solid rgba(59,130,246,0.5)'
                        : '1px solid rgba(59,130,246,0.08)',
                      background: input.platforms.includes(p.id)
                        ? 'rgba(59,130,246,0.15)'
                        : 'rgba(255,255,255,0.02)',
                      color: input.platforms.includes(p.id) ? '#3b82f6' : '#6b7a9a',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail concept */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Thumbnail Concept
              </label>
              <input
                value={input.thumbnailConcept}
                onChange={e => setInput(prev => ({ ...prev, thumbnailConcept: e.target.value }))}
                placeholder="Describe your thumbnail idea..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 10, padding: '10px 12px',
                  color: '#f0f4ff', fontSize: 13,
                  fontFamily: 'inherit', outline: 'none',
                }}
              />
            </div>

            {/* Posting time */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: '#4b5680', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Posting Time
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={input.postDay}
                  onChange={e => setInput(prev => ({ ...prev, postDay: e.target.value as DayOfWeek }))}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(59,130,246,0.1)',
                    borderRadius: 10, padding: '10px 12px',
                    color: '#f0f4ff', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {DAYS.map(d => <option key={d} value={d} style={{ background: '#0d0d1a' }}>{d}</option>)}
                </select>
                <select
                  value={input.postTime}
                  onChange={e => setInput(prev => ({ ...prev, postTime: e.target.value }))}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(59,130,246,0.1)',
                    borderRadius: 10, padding: '10px 12px',
                    color: '#f0f4ff', fontSize: 13,
                    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const h = String(i).padStart(2, '0')
                    return <option key={h} value={`${h}:00`} style={{ background: '#0d0d1a' }}>{h}:00</option>
                  })}
                </select>
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              style={{
                width: '100%', padding: '14px',
                background: isAnalyzing
                  ? 'rgba(59,130,246,0.3)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 14, fontWeight: 700,
                cursor: isAnalyzing ? 'default' : 'pointer',
                fontFamily: 'inherit', letterSpacing: '-0.01em',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'opacity 0.2s',
                opacity: isAnalyzing ? 0.7 : 1,
              }}
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles size={16} />
                  </motion.div>
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze Content
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {!result && (
              <p style={{ fontSize: 11.5, color: '#4b5680', textAlign: 'center', margin: 0 }}>
                Leave fields empty to run with demo content
              </p>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div ref={resultRef} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AnimatePresence mode="wait">
            {!result && !isAnalyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 400, gap: 16, textAlign: 'center',
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Target size={28} color="rgba(59,130,246,0.5)" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f4ff', margin: '0 0 6px' }}>
                    Score your content before publishing
                  </p>
                  <p style={{ fontSize: 13, color: '#4b5680', margin: 0, maxWidth: 320 }}>
                    Fill in the left panel and click "Analyze Content" to get your score and recommendations.
                  </p>
                </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 400, gap: 20,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(236,72,153,0.2))',
                    border: '1px solid rgba(59,130,246,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Sparkles size={30} color="#3b82f6" />
                </motion.div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#f0f4ff', margin: '0 0 6px' }}>
                    Analyzing your content…
                  </p>
                  <p style={{ fontSize: 13, color: '#4b5680', margin: 0 }}>
                    Scoring across 5 dimensions
                  </p>
                </div>
                {/* Loading bars */}
                {['Hook Strength', 'SEO Potential', 'Platform Fit', 'Engagement Triggers', 'Optimal Timing'].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 340 }}
                  >
                    <span style={{ fontSize: 12, color: '#4b5680', minWidth: 130, textAlign: 'right' }}>{label}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ delay: i * 0.12 + 0.1, duration: 0.6, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 4, background: 'rgba(59,130,246,0.5)' }}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {result && !isAnalyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Overall score card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid rgba(59,130,246,0.1)',
                    borderRadius: 16, padding: '24px 24px',
                    display: 'flex', alignItems: 'center', gap: 28,
                  }}
                >
                  <ScoreCircle score={result.overall} label={result.label} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: '#4b5680', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Overall Content Score
                    </p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', margin: '0 0 14px', lineHeight: 1.4 }}>
                      {result.label === 'Excellent' && 'Ready to publish — this has strong viral potential.'}
                      {result.label === 'Strong' && 'Solid content — a few tweaks could push this to excellent.'}
                      {result.label === 'Good' && 'Decent foundation — address the top recommendations before publishing.'}
                      {result.label === 'Needs Work' && 'Several key areas need attention before this is ready to publish.'}
                    </p>
                    {/* Mini score bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {result.dimensions.map(dim => (
                        <div key={dim.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: '#4b5680', width: 140, flexShrink: 0 }}>{dim.label}</span>
                          <div style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${dim.score}%` }}
                              transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 3, background: scoreColor(dim.score) }}
                            />
                          </div>
                          <span style={{
                            fontFamily: '"Space Mono", monospace',
                            fontSize: 11, color: scoreColor(dim.score),
                            width: 28, textAlign: 'right',
                          }}>{dim.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Dimension grid */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                    Score Breakdown
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {result.dimensions.map((dim, i) => (
                      <DimensionCard key={dim.id} dim={dim} index={i} />
                    ))}
                  </div>
                </div>

                {/* Top 3 actions */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid rgba(59,130,246,0.1)',
                    borderRadius: 16, padding: '20px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <CheckCircle size={16} color="#10b981" />
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                      Top 3 Actions Before Publishing
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {result.topActions.map((action, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(59,130,246,0.07)',
                          borderRadius: 12, padding: '14px 16px',
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                        }}
                      >
                        {/* Priority badge */}
                        <span style={{
                          flexShrink: 0,
                          fontFamily: '"Space Mono", monospace',
                          fontSize: 11, fontWeight: 700,
                          color: priorityColor[action.priority],
                          background: `${priorityColor[action.priority]}15`,
                          border: `1px solid ${priorityColor[action.priority]}30`,
                          borderRadius: 6, padding: '3px 7px',
                          marginTop: 1,
                        }}>
                          {action.priority}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: '#f0f4ff', margin: '0 0 4px', lineHeight: 1.45 }}>
                            {action.action}
                          </p>
                          <span style={{
                            fontSize: 11.5, color: '#10b981',
                            background: 'rgba(16,185,129,0.1)',
                            borderRadius: 20, padding: '2px 8px',
                          }}>
                            Expected: {action.impact}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyAction(i, action.suggestion)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            background: copiedAction === i ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.1)',
                            border: `1px solid ${copiedAction === i ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.2)'}`,
                            borderRadius: 8, padding: '6px 10px',
                            color: copiedAction === i ? '#10b981' : '#3b82f6',
                            fontSize: 11.5, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.2s', flexShrink: 0,
                          }}
                        >
                          <Copy size={12} />
                          {copiedAction === i ? 'Copied!' : 'Apply'}
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Competitor benchmark */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid rgba(59,130,246,0.1)',
                    borderRadius: 16, padding: '18px 20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <BarChart3 size={15} color="#6b7a9a" />
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
                      How Does This Compare?
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Niche avg (top creators)', value: 78, color: '#6b7a9a' },
                      { label: 'Your last 5 posts', value: 71, color: '#f59e0b' },
                      { label: 'This post', value: result.overall, color: scoreColor(result.overall) },
                    ].map((item, i) => (
                      <div key={i} style={{
                        flex: 1, minWidth: 140,
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${item.color}20`,
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', flexDirection: 'column', gap: 6,
                      }}>
                        <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>{item.label}</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{
                            fontFamily: '"Space Mono", monospace',
                            fontSize: 26, fontWeight: 700, color: item.color,
                          }}>{item.value}</span>
                          <span style={{ fontSize: 12, color: '#4b5680' }}>/100</span>
                          {i === 2 && result.overall > 71 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 }}
                              style={{
                                fontSize: 11, fontWeight: 700,
                                color: '#10b981', background: 'rgba(16,185,129,0.12)',
                                borderRadius: 20, padding: '2px 7px', marginLeft: 4,
                              }}
                            >
                              +{result.overall - 71} above avg
                            </motion.span>
                          )}
                          {i === 2 && result.overall < 71 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.9 }}
                              style={{
                                fontSize: 11, fontWeight: 700,
                                color: '#f59e0b', background: 'rgba(245,158,11,0.12)',
                                borderRadius: 20, padding: '2px 7px', marginLeft: 4,
                              }}
                            >
                              {71 - result.overall} below avg
                            </motion.span>
                          )}
                        </div>
                        <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 3, background: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
