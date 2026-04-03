import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Telescope, RefreshCw, CheckCircle2, XCircle, Clock,
  TrendingUp, Target, Zap, BarChart2, Users, AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store'
import { YouTubeApiService } from '../utils/youtubeApi'
import type { YouTubeChannelStats } from '../utils/youtubeApi'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditPlatform = 'youtube' | 'instagram'

interface DimensionScore {
  name: string
  score: number
  current: string
  tip: string
}

interface QuickWin {
  action: string
  priority: 'High' | 'Medium' | 'Low'
  impact: string
}

interface CompetitorGap {
  dimension: string
  yours: string
  topCreators: string
}

interface MonetizationItem {
  label: string
  status: 'Ready' | 'Not Yet' | 'Partially'
  action: string
}

interface AuditReport {
  overallScore: number
  percentileBeat: number
  dimensions: DimensionScore[]
  quickWins: QuickWin[]
  competitorGaps: CompetitorGap[]
  monetization: MonetizationItem[]
  niche: string
}

// ─── Demo Fallback ─────────────────────────────────────────────────────────────

const DEMO_AUDIT: AuditReport = {
  overallScore: 68,
  percentileBeat: 54,
  niche: 'fitness & health',
  dimensions: [
    {
      name: 'Niche Clarity',
      score: 72,
      current: 'Your niche is broadly fitness but lacks a defined sub-audience (age, goal, lifestyle).',
      tip: 'Pick one persona: e.g. "busy moms who want to lose weight in 20 min/day" and lead every video title with that lens.',
    },
    {
      name: 'Thumbnail Consistency',
      score: 58,
      current: 'Thumbnails vary wildly — some use bold text overlays, others rely on raw footage.',
      tip: 'Create a thumbnail template: same font, same expression style, same background treatment. Apply to every upload.',
    },
    {
      name: 'Upload Frequency',
      score: 55,
      current: 'You publish roughly once per week with occasional 2–3 week gaps.',
      tip: 'Batch-record 4 videos in one day and schedule them to maintain a 2x/week cadence consistently.',
    },
    {
      name: 'Hook Quality',
      score: 74,
      current: 'Hooks are decent — you address the problem within the first 10 seconds in most videos.',
      tip: 'Open with a result statement, not a question. "I lost 8kg in 60 days without cardio" beats "Have you tried this workout?"',
    },
    {
      name: 'CTA Effectiveness',
      score: 61,
      current: 'CTAs are buried at the 8-12 minute mark and feel scripted rather than natural.',
      tip: 'Place your first CTA at the 30% mark and frame it as a value-add ("If this helped, there\'s a free program linked below").',
    },
  ],
  quickWins: [
    { action: 'Add a chapter/timestamp structure to all videos over 5 minutes', priority: 'High', impact: 'Could improve watch time by 20–35%' },
    { action: 'Rewrite your channel description to include your target viewer, transformation promise, and upload schedule', priority: 'High', impact: 'Improves subscriber conversion from profile visits by ~18%' },
    { action: 'Pin a comment on your top 3 videos with a CTA to your free resource', priority: 'High', impact: 'Could add 50–100 email subs/month passively' },
    { action: 'Create a "Start Here" playlist and feature it at the top of your channel page', priority: 'Medium', impact: 'Reduces bounce from new visitors by ~25%' },
    { action: 'A/B test one thumbnail this week — same video title, two different thumbnail treatments', priority: 'Medium', impact: 'Potential CTR improvement of 15–30%' },
  ],
  competitorGaps: [
    { dimension: 'Upload frequency', yours: '1x / week', topCreators: '3–4x / week' },
    { dimension: 'Average video length', yours: '14 minutes', topCreators: '7–9 minutes' },
    { dimension: 'Community posts', yours: '0–1 / month', topCreators: '3–5 / week' },
  ],
  monetization: [
    { label: 'YouTube Partner Program (1K subs + 4K hours)', status: 'Partially', action: 'You\'re at ~60% of watch-hour threshold. Post 2x/week to hit it in ~6 weeks.' },
    { label: 'Brand deal readiness (engagement + niche clarity)', status: 'Partially', action: 'Engagement is solid but niche needs sharper definition before pitching brands.' },
    { label: 'Digital product potential (trust + content depth)', status: 'Ready', action: 'You have enough depth for a PDF guide or 4-week workout plan. Launch one now.' },
    { label: 'Affiliate marketing fit (purchase-intent content)', status: 'Ready', action: 'Review/unboxing content already ranks. Add affiliate links to your top 10 videos today.' },
    { label: 'Course or membership potential', status: 'Not Yet', action: 'Build an email list to 1,000 first — then validate a paid community or course.' },
    { label: 'Newsletter / community potential', status: 'Partially', action: 'Add a lead magnet (free workout PDF) to start capturing emails from your audience.' },
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function priorityColor(p: QuickWin['priority']): string {
  if (p === 'High') return '#ef4444'
  if (p === 'Medium') return '#f59e0b'
  return '#10b981'
}

function statusColor(s: MonetizationItem['status']): string {
  if (s === 'Ready') return '#10b981'
  if (s === 'Partially') return '#f59e0b'
  return '#ef4444'
}

function StatusIcon({ status }: { status: MonetizationItem['status'] }) {
  if (status === 'Ready') return <CheckCircle2 size={15} color="#10b981" />
  if (status === 'Partially') return <Clock size={15} color="#f59e0b" />
  return <XCircle size={15} color="#ef4444" />
}

const LOADING_MSGS = [
  'Analyzing channel structure...',
  'Reviewing content patterns...',
  'Generating recommendations...',
  'Building your audit report...',
]

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  'Niche Clarity': <Target size={15} />,
  'Thumbnail Consistency': <BarChart2 size={15} />,
  'Upload Frequency': <TrendingUp size={15} />,
  'Hook Quality': <Zap size={15} />,
  'CTA Effectiveness': <Users size={15} />,
}

// ─── AI Prompt Builder ────────────────────────────────────────────────────────

function buildAuditPrompt(platform: AuditPlatform, handle: string, niche: string, bio: string): string {
  return `You are a brutally honest YouTube/Instagram growth strategist. Audit this creator's channel.

Platform: ${platform === 'youtube' ? 'YouTube' : 'Instagram'}
Handle: ${handle}
Niche: ${niche}
Bio/Description: ${bio || 'Not provided'}

Return a JSON object ONLY (no markdown, no explanation) in this exact shape:
{
  "overallScore": <number 0-100>,
  "percentileBeat": <number 0-99, what % of creators in the niche this beats>,
  "niche": "<cleaned niche label>",
  "dimensions": [
    { "name": "Niche Clarity", "score": <0-100>, "current": "<1 sentence current state>", "tip": "<1 specific actionable improvement>" },
    { "name": "Thumbnail Consistency", "score": <0-100>, "current": "<1 sentence>", "tip": "<1 specific tip>" },
    { "name": "Upload Frequency", "score": <0-100>, "current": "<1 sentence>", "tip": "<1 specific tip>" },
    { "name": "Hook Quality", "score": <0-100>, "current": "<1 sentence>", "tip": "<1 specific tip>" },
    { "name": "CTA Effectiveness", "score": <0-100>, "current": "<1 sentence>", "tip": "<1 specific tip>" }
  ],
  "quickWins": [
    { "action": "<specific action>", "priority": "High"|"Medium"|"Low", "impact": "<estimated impact with numbers>" },
    { "action": "...", "priority": "...", "impact": "..." },
    { "action": "...", "priority": "...", "impact": "..." },
    { "action": "...", "priority": "...", "impact": "..." },
    { "action": "...", "priority": "...", "impact": "..." }
  ],
  "competitorGaps": [
    { "dimension": "<aspect>", "yours": "<typical for this niche/handle>", "topCreators": "<what top creators do>" },
    { "dimension": "...", "yours": "...", "topCreators": "..." },
    { "dimension": "...", "yours": "...", "topCreators": "..." }
  ],
  "monetization": [
    { "label": "YouTube Partner Program eligibility (1000 subs + 4000 hours)", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" },
    { "label": "Brand deal readiness (engagement rate, niche clarity)", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" },
    { "label": "Digital product potential (audience trust, content depth)", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" },
    { "label": "Affiliate marketing fit (purchase-intent content)", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" },
    { "label": "Course / membership potential", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" },
    { "label": "Newsletter / community potential", "status": "Ready"|"Partially"|"Not Yet", "action": "<one-line next step>" }
  ]
}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const color = scoreColor(score)
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
      <svg width={130} height={130} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <motion.circle
          cx={65} cy={65} r={r}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: 30, fontWeight: 700, color,
          lineHeight: 1,
        }}>{score}</span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: '#6b7a9a' }}>/100</span>
      </div>
    </div>
  )
}

function DimensionCard({ dim, index }: { dim: DimensionScore; index: number }) {
  const color = scoreColor(dim.score)
  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 28 }}
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: color }}>{DIMENSION_ICONS[dim.name]}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{dim.name}</span>
        </div>
        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color,
        }}>{dim.score}</span>
      </div>

      {/* Score bar */}
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dim.score}%` }}
          transition={{ delay: index * 0.08 + 0.3, duration: 0.7, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>{dim.current}</p>

      <div style={{
        background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 8, padding: '10px 12px',
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <ChevronRight size={13} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: '#c7d3f0', lineHeight: 1.55, margin: 0 }}>{dim.tip}</p>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ChannelAudit() {
  const { profile } = useStore()

  const [platform, setPlatform] = useState<AuditPlatform>('youtube')
  const [handle, setHandle] = useState(profile?.handles.find(h => h.platform === 'youtube')?.handle || '')
  const [niche, setNiche] = useState(profile?.niche || '')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [ytStats, setYtStats] = useState<YouTubeChannelStats | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // Auto-fill from profile when it changes
  useEffect(() => {
    if (profile) {
      if (!handle) setHandle(profile.handles.find(h => h.platform === (platform as any))?.handle || '')
      if (!niche) setNiche(profile.niche || '')
    }
  }, [profile, platform])

  useEffect(() => {
    async function fetchYtStats() {
      if (platform === 'youtube' && profile?.youtubeApiKey && profile?.youtubeChannelId) {
        const stats = await YouTubeApiService.getChannelStats(profile)
        setYtStats(stats)
      } else {
        setYtStats(null)
      }
    }
    fetchYtStats()
  }, [platform, profile?.youtubeApiKey, profile?.youtubeChannelId])

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MSGS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [loading])

  async function runAudit() {
    if (!handle.trim()) {
      toast.error('Please enter your channel handle or URL')
      return
    }
    if (!niche.trim()) {
      toast.error('Please describe your niche')
      return
    }

    setLoading(true)
    setLoadingMsgIdx(0)
    setReport(null)

    const apiKey = profile?.apiKey

    let realStatsStr = ''
    if (platform === 'youtube' && profile?.youtubeApiKey && profile?.youtubeChannelId) {
      const stats = ytStats || await YouTubeApiService.getChannelStats(profile)
      if (stats) {
        realStatsStr = `\nREAL-TIME CHANNEL METRICS (Use this data for accuracy):\n- Subscribers: ${stats.subscriberCount}\n- Lifetime Views: ${stats.viewCount}\n- Video Count: ${stats.videoCount}\n`
      }
      
      const videos = await YouTubeApiService.getRecentVideos(profile, 3)
      if (videos.length > 0) {
        realStatsStr += `\nRECENT VIDEOS PERFORMANCE:\n`
        videos.forEach(v => {
          realStatsStr += `- "${v.title}" (${new Date(v.publishedAt).toLocaleDateString()}): ${v.viewCount} views, ${v.likeCount} likes, ${v.commentCount} comments\n`
        })
      }
    }

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 3200))
      setReport(DEMO_AUDIT)
      setLoading(false)
      toast.success('Demo audit loaded — add your AI key in Settings for a real analysis')
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
      return
    }

    try {
      const prompt = buildAuditPrompt(platform, handle, niche, bio) + (realStatsStr ? `\n\n${realStatsStr}` : '')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const raw = data.content?.[0]?.text ?? ''
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')
      const parsed: AuditReport = JSON.parse(jsonMatch[0])
      setReport(parsed)
      toast.success('Audit complete!')
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    } catch {
      toast.error('Failed to generate audit. Showing demo instead.')
      setReport(DEMO_AUDIT)
    } finally {
      setLoading(false)
    }
  }

  const spring = { type: 'spring' as const, stiffness: 300, damping: 28 }

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(167,139,250,0.2))',
            border: '1px solid rgba(236,72,153,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Telescope size={18} color="#ec4899" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.3px' }}>
              Channel Audit
            </h1>
            <p style={{ fontSize: 13, color: '#6b7a9a', marginTop: 1 }}>
              Get a brutally honest audit of your channel with actionable improvements
            </p>
          </div>
        </div>
      </motion.div>

      {/* Input Panel */}
      <AnimatePresence>
        {!report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={spring}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}
          >
            <div className="card" style={{
              width: '100%', maxWidth: 600,
              padding: '32px 36px',
              background: '#111122',
              border: '1px solid rgba(236,72,153,0.15)',
            }}>
              {/* Platform toggle */}
              <div style={{ marginBottom: 24 }}>
                <label className="sec-label" style={{
                  display: 'block', marginBottom: 10, fontSize: 11, fontWeight: 700,
                  color: '#6b7a9a', textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  Platform
                </label>
                <div style={{
                  display: 'flex', gap: 8,
                  background: '#0d0d1a', borderRadius: 10, padding: 5,
                  border: '1px solid rgba(59,130,246,0.1)',
                }}>
                  {(['youtube', 'instagram'] as AuditPlatform[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 7, border: 'none',
                        cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: 13, fontWeight: 700,
                        transition: 'all 160ms ease',
                        background: platform === p
                          ? 'linear-gradient(135deg, #ec4899, #d946ef)'
                          : 'transparent',
                        color: platform === p ? '#fff' : '#6b7a9a',
                        boxShadow: platform === p ? '0 4px 14px rgba(236,72,153,0.3)' : 'none',
                      }}
                    >
                      {p === 'youtube' ? 'YouTube' : 'Instagram'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handle input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8',
                }}>
                  {platform === 'youtube' ? 'YouTube channel URL or @handle' : 'Instagram @handle'}
                </label>
                <input
                  className="field"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder={platform === 'youtube' ? 'https://youtube.com/@yourchannel or @yourchannel' : '@yourhandle'}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Niche input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8',
                }}>
                  Your niche / content type
                </label>
                <input
                  className="field"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. personal finance for millennials, home workouts, tech reviews"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Bio textarea */}
              <div style={{ marginBottom: 28 }}>
                <label style={{
                  display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8',
                }}>
                  Channel description or bio{' '}
                  <span style={{ color: '#4b5680', fontWeight: 400 }}>(optional — helps AI be more specific)</span>
                </label>
                <textarea
                  className="field"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Paste your channel description or bio here..."
                  rows={4}
                  style={{ width: '100%', resize: 'vertical', minHeight: 96, lineHeight: 1.6 }}
                />
              </div>

              {/* CTA */}
              <button
                className="btn btn-pink"
                onClick={runAudit}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '13px 0', opacity: loading ? 0.7 : 1 }}
              >
                <Telescope size={16} />
                {loading ? 'Auditing...' : 'Audit My Channel'}
              </button>

              {!profile?.apiKey && (
                <p style={{ textAlign: 'center', fontSize: 11.5, color: '#4b5680', marginTop: 12 }}>
                  No API key found — will show a demo audit. Add your Claude key in Settings for a real analysis.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 24, padding: '60px 0',
            }}
          >
            {/* Pulse ring */}
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px solid #ec4899',
                }}
              />
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(167,139,250,0.15))',
                border: '1px solid rgba(236,72,153,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Telescope size={30} color="#ec4899" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                style={{ fontSize: 15, fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}
              >
                {LOADING_MSGS[loadingMsgIdx]}
              </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{ width: 320, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '90%' }}
                transition={{ duration: 7, ease: 'easeInOut' }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #ec4899, #a78bfa)', borderRadius: 99 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Report */}
      <AnimatePresence>
        {report && !loading && (
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Overall Score Header */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              style={{
                padding: '32px 36px', marginBottom: 24,
                background: 'linear-gradient(135deg, #111122, #0d0d1a)',
                border: '1px solid rgba(236,72,153,0.15)',
                display: 'flex', alignItems: 'center', gap: 32,
                flexWrap: 'wrap',
              }}
            >
              <ScoreCircle score={report.overallScore} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff' }}>Your Channel Audit</span>
                </div>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
                  Your channel scores higher than{' '}
                  <span style={{ color: scoreColor(report.overallScore), fontWeight: 700 }}>
                    {report.percentileBeat}%
                  </span>{' '}
                  of creators in the <strong style={{ color: '#f0f4ff' }}>{report.niche}</strong> niche.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-amber" style={{ fontSize: 11 }}>
                    {report.overallScore >= 75 ? 'On Track' : report.overallScore >= 50 ? 'Needs Work' : 'Critical Fixes Needed'}
                  </span>
                  <span className="badge badge-blue">
                    {report.niche}
                  </span>
                </div>
              </div>

              {/* Re-audit button top-right */}
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setReport(null); setHandle(''); setNiche(''); setBio('') }}
                style={{ alignSelf: 'flex-start' }}
              >
                <RefreshCw size={13} />
                New Audit
              </button>
            </motion.div>

            {/* 5 Dimension Cards — 2-column grid */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6b7a9a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 14 }}>
                Performance Dimensions
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 14,
              }}>
                {report.dimensions.map((dim, i) => (
                  <DimensionCard key={dim.name} dim={dim} index={i} />
                ))}
              </div>
            </div>

            {/* Quick Wins */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...spring }}
              style={{ padding: '24px 28px', marginBottom: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <Zap size={16} color="#f59e0b" />
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>
                  5 Quick Wins{' '}
                  <span style={{ fontWeight: 400, color: '#6b7a9a', fontSize: 13 }}>
                    — Implement these in the next 7 days
                  </span>
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.quickWins.map((win, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.07, ...spring }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '13px 16px',
                      background: '#0d0d1a', borderRadius: 10,
                      border: '1px solid rgba(59,130,246,0.08)',
                    }}
                  >
                    <div style={{
                      minWidth: 24, height: 24, borderRadius: '50%',
                      background: '#111122', border: `2px solid ${priorityColor(win.priority)}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700,
                      color: priorityColor(win.priority), flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f4ff', lineHeight: 1.5, marginBottom: 4 }}>
                        {win.action}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${priorityColor(win.priority)}18`,
                          color: priorityColor(win.priority),
                        }}>
                          {win.priority}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7a9a' }}>{win.impact}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Competitor Gap Analysis */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...spring }}
              style={{ padding: '24px 28px', marginBottom: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <AlertTriangle size={15} color="#f97316" />
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>
                  Competitor Gap Analysis{' '}
                  <span style={{ fontWeight: 400, color: '#6b7a9a', fontSize: 13 }}>
                    — What top creators in {report.niche} do that you don't
                  </span>
                </h2>
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                padding: '8px 16px', marginBottom: 8,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Dimension</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Your Channel</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Top Creators</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {report.competitorGaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
                      padding: '12px 16px', borderRadius: 10,
                      background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.07)',
                    }}
                  >
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{gap.dimension}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: '#ef4444',
                      fontFamily: 'Space Mono, monospace',
                    }}>{gap.yours}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: '#10b981',
                      fontFamily: 'Space Mono, monospace',
                    }}>{gap.topCreators}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Monetization Readiness */}
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, ...spring }}
              style={{ padding: '24px 28px', marginBottom: 32 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <TrendingUp size={15} color="#10b981" />
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>Monetization Readiness</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.monetization.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.06, ...spring }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '13px 16px', borderRadius: 10,
                      background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.07)',
                    }}
                  >
                    <div style={{ marginTop: 1, flexShrink: 0 }}>
                      <StatusIcon status={item.status} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#f0f4ff' }}>{item.label}</span>
                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                          background: `${statusColor(item.status)}18`,
                          color: statusColor(item.status),
                        }}>
                          {item.status}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.5 }}>{item.action}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Re-audit footer button */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setReport(null); setHandle(''); setNiche(''); setBio('') }}
                style={{ gap: 8 }}
              >
                <RefreshCw size={14} />
                Run a New Audit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
