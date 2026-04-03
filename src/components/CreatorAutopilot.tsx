import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Play, Check, X, Edit3, RefreshCw, Calendar,
  TrendingUp, Clock, BarChart3, ChevronDown, ChevronUp,
  Sparkles, Settings,
} from 'lucide-react'
import { useStore } from '../store'
import type { CalendarPost } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutopilotItem {
  id: string
  date: string
  platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin'
  contentType: 'video' | 'reel' | 'post' | 'story' | 'thread'
  title: string
  hook: string
  outline: string[]
  estimatedScore: number
  estimatedReach: number
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  aiReasoning: string
}

interface AutopilotSettings {
  postsPerWeek: number
  contentMix: { educational: number; entertainment: number; promotional: number }
  platforms: { youtube: boolean; instagram: boolean; tiktok: boolean; linkedin: boolean }
  useTrending: boolean
  voiceMatch: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#080810',
  card: '#0d0d1a',
  cardHover: '#111128',
  border: 'rgba(59,130,246,0.1)',
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  pink: '#ec4899',
  danger: '#ef4444',
  text: '#f0f4ff',
  muted: '#4b5680',
  mutedLight: '#6b7eb0',
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: '#ef4444',
  instagram: '#ec4899',
  tiktok: '#06b6d4',
  linkedin: '#3b82f6',
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
}

const TOPIC_BANK: Record<string, string[]> = {
  tech: [
    'My honest review of the most hyped AI tool right now',
    '5 mistakes every beginner developer makes (and how to fix them)',
    'I tried building an app in 30 days — here\'s what happened',
    'The tools I actually use to ship faster',
    'Why most coding tutorials are lying to you',
    'From zero to deployed: a real project walkthrough',
    'AI coding assistants ranked after 90 days of daily use',
  ],
  fitness: [
    'What I eat in a day to stay lean (no diet culture BS)',
    'A beginner workout you can do in your bedroom — no equipment',
    'My 12-month transformation story (with the ugly truth)',
    'Why cardio alone won\'t change your body',
    'I trained like an athlete for 30 days. Here\'s the data.',
    'The 3 habits that actually changed my physique',
    '5 gym mistakes beginners make in their first month',
  ],
  finance: [
    'How I saved ₹1L in 6 months on a regular salary',
    'Index funds explained simply — no jargon, no BS',
    'Passive income ideas that actually work in India',
    'The first 3 investments every 20-something should make',
    'Why your savings account is secretly losing you money',
    'My portfolio breakdown: 100% transparent',
    'How I paid off debt in 18 months',
  ],
  travel: [
    'Hidden hill stations near Delhi that most people don\'t know',
    'Budget solo travel in Southeast Asia: full breakdown',
    'I stayed in a ₹500/night hostel — was it worth it?',
    'The India travel itinerary that changed my perspective',
    '10 things locals actually eat (not what tourists order)',
    'How to travel for free using credit card points',
    'My most life-changing trip and why it wasn\'t expensive',
  ],
  lifestyle: [
    'The morning routine that actually stuck after 6 months',
    'I deleted social media for 30 days. Here\'s the truth.',
    'How I redesigned my apartment for under ₹20,000',
    'The books that changed how I think about work and life',
    'A week in my life as a freelancer working from home',
    'Why I stopped chasing productivity and started this instead',
    'My entire digital life system explained in 10 minutes',
  ],
  business: [
    'How I landed my first ₹1L freelance client',
    'The email that got me a brand deal with zero followers',
    'Starting a business with ₹0: here\'s the actual playbook',
    'Why most solopreneurs burn out by month 6 (and how to not)',
    'My entire content workflow as a one-person business',
    'The pricing mistake that cost me ₹3L (true story)',
    'How I built an audience before launching my product',
  ],
  education: [
    '5 things they don\'t teach you in college about the real world',
    'How I learned a skill in 30 days using the Feynman technique',
    'The study method I used to ace my board exams',
    'Why most online courses are a waste of money (and what to do instead)',
    'Learning in public: week 1 of my design journey',
    'Resources I actually used to break into tech',
    'The fastest way to learn anything — backed by research',
  ],
  food: [
    'Street food crawl: finding the best chaat in Old Delhi',
    'I cooked every meal for a month. Here\'s what I learned.',
    'Recreating restaurant recipes at home for 1/10th the cost',
    'The only meal prep system that actually works for beginners',
    'My grandmother\'s recipes that need to be on the internet',
    'Rating every cloud kitchen in my city',
    'The $2 meal that changed how I think about food',
  ],
  gaming: [
    'Why I quit ranked and my win rate actually went up',
    'The settings every new player gets wrong',
    'I played for 1000 hours. Here\'s every mistake I made.',
    'Gaming setup tour: from ₹15,000 to ₹1,50,000',
    'The hidden mechanics most players never discover',
    'Why this indie game is better than any AAA title this year',
    'My honest review after 50 hours: is it worth ₹4,000?',
  ],
  beauty: [
    'My honest skincare routine after trying everything on the market',
    'Drugstore dupes for expensive products (tested side by side)',
    'I tried a viral beauty trend for 30 days — the truth',
    '5 skincare ingredients that actually work (and 3 that don\'t)',
    'GRWM: honest commentary on my makeup routine',
    'The cleanser I\'ve repurchased 6 times',
    'Rating every "holy grail" product I\'ve tried this year',
  ],
}

const HOOKS_BY_TYPE: Record<string, string[]> = {
  video: [
    'Most people get this completely wrong. Here\'s the truth.',
    'I spent 30 days testing this so you don\'t have to.',
    'Nobody talks about this, but it changed everything for me.',
  ],
  reel: [
    'Wait until the end — this will change how you think about it.',
    'POV: you finally figured out what actually works.',
    'This took me 3 years to learn. You can have it in 60 seconds.',
  ],
  post: [
    'Unpopular opinion: most advice on this is wrong.',
    'The thing I wish someone told me when I started.',
    'I tested 10 approaches. Here\'s the only one that worked.',
  ],
  story: [
    'Behind the scenes: what this actually looks like.',
    'Real talk — something I\'ve never shared publicly.',
    'Quick update on something I\'ve been working on.',
  ],
  thread: [
    'A thread on why everything you know about this is backwards:',
    '10 things I learned after 2 years in this space (save this):',
    'The playbook I use that nobody else talks about:',
  ],
}

const AI_REASONS = [
  'High engagement potential in your niche based on recent trend velocity.',
  'Aligns with your Content DNA — this style performs 2.4x better for your audience.',
  'Optimal posting window: your audience is most active at this time.',
  'Trending topic with low creator saturation — high opportunity window.',
  'Balances your content mix: you haven\'t posted this format recently.',
  'Cross-platform format that works well on multiple channels simultaneously.',
  'Educational content gap: your audience frequently searches this topic.',
  'Evergreen content that will continue driving traffic 6+ months from now.',
]

const CONTENT_TYPES: Array<AutopilotItem['contentType']> = ['video', 'reel', 'post', 'story', 'thread']

// ─── Queue Generator ──────────────────────────────────────────────────────────

function generateQueue(niche: string, settings: AutopilotSettings): AutopilotItem[] {
  const normalizedNiche = niche?.toLowerCase() || 'tech'
  const nicheKey = Object.keys(TOPIC_BANK).find(k => normalizedNiche.includes(k)) || 'tech'
  const topics = TOPIC_BANK[nicheKey]

  const activePlatforms = (Object.keys(settings.platforms) as Array<keyof typeof settings.platforms>)
    .filter(p => settings.platforms[p])
  if (activePlatforms.length === 0) return []

  const totalPosts = Math.round((settings.postsPerWeek / 7) * 14)
  const items: AutopilotItem[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Spread posts across 14 days
  const postDays = new Set<number>()
  while (postDays.size < Math.min(totalPosts, 14)) {
    postDays.add(Math.floor(Math.random() * 14))
  }

  const sortedDays = Array.from(postDays).sort((a, b) => a - b)
  const usedTopics = new Set<string>()

  sortedDays.forEach((dayOffset, idx) => {
    const postDate = new Date(today)
    postDate.setDate(today.getDate() + dayOffset)
    const dateStr = postDate.toISOString().split('T')[0]

    const platform = activePlatforms[idx % activePlatforms.length]
    const contentType = CONTENT_TYPES[idx % CONTENT_TYPES.length]

    // Pick unique topic
    let topic = ''
    for (const t of topics) {
      if (!usedTopics.has(t)) { topic = t; usedTopics.add(t); break }
    }
    if (!topic) topic = topics[idx % topics.length]

    const hookBank = HOOKS_BY_TYPE[contentType] || HOOKS_BY_TYPE.post
    const hook = hookBank[idx % hookBank.length]

    const score = 68 + Math.floor(Math.random() * 27)
    const reach = 5000 + Math.floor(Math.random() * 95000)

    items.push({
      id: `ap-${Date.now()}-${idx}`,
      date: dateStr,
      platform,
      contentType,
      title: topic,
      hook,
      outline: generateOutline(contentType, topic),
      estimatedScore: score,
      estimatedReach: reach,
      status: 'pending',
      aiReasoning: AI_REASONS[idx % AI_REASONS.length],
    })
  })

  return items
}

function generateOutline(type: AutopilotItem['contentType'], _topic: string): string[] {
  const outlines: Record<string, string[]> = {
    video: [
      'Open with the hook — show the surprising result first',
      'Set up the context: why this matters and who it\'s for',
      'Walk through the core 3–5 steps with visual examples',
      'Close with a clear takeaway and CTA to follow for more',
    ],
    reel: [
      'Grab attention in the first 2 seconds with a bold visual',
      'Deliver the core insight or transformation in 15–30 seconds',
      'End with a text overlay reinforcing the key message',
    ],
    post: [
      'Lead with a strong first line that stops the scroll',
      'Share 3–5 concrete points with personal examples',
      'Add a reflection or unexpected angle at the end',
      'Close with a question to spark comments',
    ],
    story: [
      'Slide 1: teaser — "I need to share something"',
      'Slides 2–4: behind-the-scenes or honest update',
      'Final slide: CTA (swipe up / DM me / link in bio)',
    ],
    thread: [
      'Tweet 1: bold claim or counterintuitive statement',
      'Tweets 2–6: one insight per tweet, each stands alone',
      'Tweet 7: the bigger lesson or framework',
      'Final tweet: recap + CTA to follow or retweet',
    ],
  }
  return outlines[type] || outlines.post
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatReach(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

function getScoreColor(score: number): string {
  if (score >= 85) return COLORS.success
  if (score >= 70) return COLORS.warning
  return COLORS.pink
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      style={{
        position: 'relative',
        width: 72,
        height: 36,
        borderRadius: 18,
        background: on
          ? 'linear-gradient(135deg, #10b981, #059669)'
          : 'rgba(75,86,128,0.3)',
        border: on ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(75,86,128,0.3)',
        cursor: 'pointer',
        flexShrink: 0,
        boxShadow: on ? '0 0 20px rgba(16,185,129,0.35)' : 'none',
        transition: 'all 0.3s ease',
        outline: 'none',
      }}
      aria-label={on ? 'Turn autopilot off' : 'Turn autopilot on'}
    >
      <motion.div
        animate={{ x: on ? 38 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position: 'absolute',
          top: 4,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      />
    </motion.button>
  )
}

function StatBadge({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '12px 16px',
      background: 'rgba(59,130,246,0.06)',
      border: '1px solid rgba(59,130,246,0.12)',
      borderRadius: 10,
      minWidth: 120,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.muted }}>
        <Icon size={13} />
        <span style={{ fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '0.04em' }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: 22,
        fontWeight: 700,
        color: COLORS.text,
        fontFamily: 'Space Mono, monospace',
        lineHeight: 1,
      }}>
        {value}
      </span>
    </div>
  )
}

function SliderRow({
  label, value, min, max, unit, onChange, color,
}: {
  label: string; value: number; min: number; max: number; unit?: string;
  onChange: (v: number) => void; color?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: COLORS.mutedLight, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {label}
        </span>
        <span style={{
          fontSize: 13,
          fontFamily: 'Space Mono, monospace',
          color: color || COLORS.primary,
          fontWeight: 600,
        }}>
          {value}{unit || ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: color || COLORS.primary,
          cursor: 'pointer',
          height: 4,
        }}
      />
    </div>
  )
}

function PlatformToggle({
  platform, active, onToggle,
}: { platform: string; active: boolean; onToggle: () => void }) {
  const color = PLATFORM_COLORS[platform]
  return (
    <button
      onClick={onToggle}
      style={{
        padding: '7px 14px',
        borderRadius: 8,
        border: active ? `1px solid ${color}` : '1px solid rgba(75,86,128,0.3)',
        background: active ? `${color}18` : 'transparent',
        color: active ? color : COLORS.muted,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        letterSpacing: '0.03em',
      }}
    >
      {PLATFORM_LABELS[platform]}
    </button>
  )
}

function SmallToggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 13, color: COLORS.mutedLight, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {label}
      </span>
      <button
        onClick={onToggle}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 12,
          background: on ? COLORS.primary : 'rgba(75,86,128,0.3)',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          outline: 'none',
        }}
        aria-label={label}
      >
        <motion.div
          animate={{ x: on ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          style={{
            position: 'absolute',
            top: 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    </div>
  )
}

// ─── Content Card ─────────────────────────────────────────────────────────────

function ContentCard({
  item, onApprove, onReject, onUndo, onRegenerate, onEdit,
}: {
  item: AutopilotItem
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onUndo: (id: string) => void
  onRegenerate: (id: string) => void
  onEdit: (id: string, title: string, hook: string, outline: string[]) => void
}) {
  const [showOutline, setShowOutline] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editHook, setEditHook] = useState(item.hook)
  const [editOutline, setEditOutline] = useState(item.outline.join('\n'))

  const platformColor = PLATFORM_COLORS[item.platform]
  const scoreColor = getScoreColor(item.estimatedScore)
  const isRejected = item.status === 'rejected'
  const isApproved = item.status === 'approved'

  function handleSaveEdit() {
    const lines = editOutline.split('\n').filter(l => l.trim())
    onEdit(item.id, editTitle, editHook, lines)
    setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isRejected ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'relative',
        background: isApproved ? 'rgba(16,185,129,0.04)' : COLORS.card,
        border: isApproved
          ? '1px solid rgba(16,185,129,0.25)'
          : isRejected
          ? '1px solid rgba(75,86,128,0.15)'
          : `1px solid ${COLORS.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, background 0.2s ease',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
        background: platformColor,
        borderRadius: '0 0 0 0',
        opacity: isRejected ? 0.3 : 1,
      }} />

      <div style={{ padding: '16px 18px 16px 22px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Platform badge */}
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: platformColor,
              background: `${platformColor}18`,
              border: `1px solid ${platformColor}40`,
              borderRadius: 6,
              padding: '3px 8px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {PLATFORM_LABELS[item.platform]}
            </span>

            {/* Content type badge */}
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: COLORS.muted,
              background: 'rgba(75,86,128,0.12)',
              border: '1px solid rgba(75,86,128,0.2)',
              borderRadius: 6,
              padding: '3px 8px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              textTransform: 'capitalize',
            }}>
              {item.contentType}
            </span>

            {/* Status badge */}
            {isApproved && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.success,
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 6,
                padding: '3px 8px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                Approved — Added to Calendar
              </span>
            )}
            {isRejected && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.danger,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 6,
                padding: '3px 8px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
                Rejected
              </span>
            )}
          </div>

          {/* Score pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}>
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: scoreColor,
              fontFamily: 'Space Mono, monospace',
              background: `${scoreColor}15`,
              border: `1px solid ${scoreColor}35`,
              borderRadius: 8,
              padding: '4px 10px',
            }}>
              {item.estimatedScore}
            </span>
          </div>
        </div>

        {/* Title */}
        {editing ? (
          <textarea
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(59,130,246,0.07)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 8,
              color: COLORS.text,
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              padding: '8px 12px',
              resize: 'vertical',
              minHeight: 56,
              outline: 'none',
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <p style={{
            fontSize: 15,
            fontWeight: 600,
            color: isRejected ? COLORS.muted : COLORS.text,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1.4,
            marginBottom: 6,
            textDecoration: isRejected ? 'line-through' : 'none',
          }}>
            {item.title}
          </p>
        )}

        {/* Hook */}
        {editing ? (
          <textarea
            value={editHook}
            onChange={e => setEditHook(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(59,130,246,0.07)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 8,
              color: COLORS.mutedLight,
              fontSize: 13,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontStyle: 'italic',
              padding: '8px 12px',
              resize: 'vertical',
              minHeight: 44,
              outline: 'none',
              marginBottom: 8,
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <p style={{
            fontSize: 13,
            fontStyle: 'italic',
            color: COLORS.mutedLight,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1.5,
            marginBottom: 10,
          }}>
            "{item.hook}"
          </p>
        )}

        {/* Outline */}
        {editing ? (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Outline (one bullet per line)
            </p>
            <textarea
              value={editOutline}
              onChange={e => setEditOutline(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 8,
                color: COLORS.text,
                fontSize: 13,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                padding: '8px 12px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 10 }}>
            {(showOutline ? item.outline : item.outline.slice(0, 2)).map((point, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                <span style={{ color: COLORS.primary, fontSize: 11, marginTop: 2, flexShrink: 0 }}>▸</span>
                <span style={{
                  fontSize: 13,
                  color: COLORS.mutedLight,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  lineHeight: 1.5,
                }}>
                  {point}
                </span>
              </div>
            ))}
            {item.outline.length > 2 && (
              <button
                onClick={() => setShowOutline(v => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.primary,
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '2px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {showOutline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showOutline ? 'Show less' : `+${item.outline.length - 2} more`}
              </button>
            )}
          </div>
        )}

        {/* AI Reasoning */}
        <div style={{
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.1)',
          borderLeft: `3px solid ${COLORS.primary}`,
          borderRadius: '0 8px 8px 0',
          padding: '8px 12px',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Sparkles size={11} color={COLORS.primary} />
            <span style={{
              fontSize: 11,
              color: COLORS.primary,
              fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              letterSpacing: '0.04em',
            }}>
              AI REASONING
            </span>
          </div>
          <p style={{
            fontSize: 12,
            color: COLORS.muted,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1.5,
            margin: 0,
          }}>
            {item.aiReasoning}
          </p>
        </div>

        {/* Reach estimate */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 14,
          color: COLORS.muted,
        }}>
          <TrendingUp size={13} />
          <span style={{ fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Est. reach:
          </span>
          <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: COLORS.warning }}>
            {formatReach(item.estimatedReach)}
          </span>
        </div>

        {/* Action row */}
        {editing ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveEdit}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px',
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.35)',
                borderRadius: 8,
                color: COLORS.primary,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              <Check size={14} /> Save Changes
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid rgba(75,86,128,0.3)',
                borderRadius: 8,
                color: COLORS.muted,
                fontSize: 13,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {item.status === 'rejected' ? (
              <button
                onClick={() => onUndo(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px',
                  background: 'rgba(75,86,128,0.1)',
                  border: '1px solid rgba(75,86,128,0.25)',
                  borderRadius: 8,
                  color: COLORS.mutedLight,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <RefreshCw size={13} /> Undo
              </button>
            ) : item.status !== 'approved' ? (
              <>
                <button
                  onClick={() => onApprove(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 8,
                    color: COLORS.success,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  onClick={() => onReject(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8,
                    color: COLORS.danger,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    borderRadius: 8,
                    color: COLORS.primary,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  onClick={() => onRegenerate(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 8,
                    color: COLORS.warning,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RefreshCw size={13} /> Regen
                </button>
              </>
            ) : (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13,
                color: COLORS.success,
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 600,
              }}>
                <Check size={14} /> Added to Calendar
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CreatorAutopilot() {
  const { profile, contentDNA, addCalendarPost } = useStore()

  const [autopilotOn, setAutopilotOn] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [queue, setQueue] = useState<AutopilotItem[]>([])
  const [settings, setSettings] = useState<AutopilotSettings>({
    postsPerWeek: 4,
    contentMix: { educational: 50, entertainment: 30, promotional: 20 },
    platforms: { youtube: false, instagram: true, tiktok: false, linkedin: false },
    useTrending: true,
    voiceMatch: true,
  })

  const generationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Derive platform toggles from profile
  const initPlatformsFromProfile = useCallback(() => {
    if (!profile?.handles) return
    const updated = { youtube: false, instagram: false, tiktok: false, linkedin: false }
    profile.handles.forEach(h => {
      const key = h.platform as keyof typeof updated
      if (key in updated) updated[key] = true
    })
    setSettings(s => ({ ...s, platforms: updated }))
  }, [profile])

  function handleToggleAutopilot() {
    const next = !autopilotOn
    setAutopilotOn(next)
    if (next) {
      initPlatformsFromProfile()
      triggerGenerate()
      setSettingsOpen(true)
    } else {
      setQueue([])
      setSettingsOpen(false)
    }
  }

  function triggerGenerate() {
    setGenerating(true)
    if (generationTimerRef.current) clearTimeout(generationTimerRef.current)
    generationTimerRef.current = setTimeout(() => {
      const niche = profile?.niche || contentDNA?.contentPillars?.[0]?.pillar || 'tech'
      const generated = generateQueue(niche, settings)
      setQueue(generated)
      setGenerating(false)
    }, 1400)
  }

  function handleRegenerateQueue() {
    triggerGenerate()
  }

  function handleApprove(id: string) {
    setQueue(q => q.map(item => {
      if (item.id !== id) return item
      // Add to calendar store
      const post: CalendarPost = {
        id: `cal-${id}`,
        title: item.title,
        platform: item.platform as any,
        contentType: item.contentType as any,
        status: 'scheduled',
        scheduledAt: item.date,
        aiScore: item.estimatedScore,
        notes: `Hook: ${item.hook}`,
      }
      addCalendarPost(post)
      return { ...item, status: 'approved' as const }
    }))
  }

  function handleReject(id: string) {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: 'rejected' as const } : item))
  }

  function handleUndo(id: string) {
    setQueue(q => q.map(item => item.id === id ? { ...item, status: 'pending' as const } : item))
  }

  function handleRegenItem(id: string) {
    const existing = queue.find(i => i.id === id)
    if (!existing) return
    const niche = profile?.niche || 'tech'
    const nicheKey = Object.keys(TOPIC_BANK).find(k => niche.toLowerCase().includes(k)) || 'tech'
    const topics = TOPIC_BANK[nicheKey]
    const newTitle = topics[Math.floor(Math.random() * topics.length)]
    const hookBank = HOOKS_BY_TYPE[existing.contentType] || HOOKS_BY_TYPE.post
    const newHook = hookBank[Math.floor(Math.random() * hookBank.length)]
    const newScore = 68 + Math.floor(Math.random() * 27)
    const newReach = 5000 + Math.floor(Math.random() * 95000)
    setQueue(q => q.map(item => item.id === id ? {
      ...item,
      title: newTitle,
      hook: newHook,
      outline: generateOutline(item.contentType, newTitle),
      estimatedScore: newScore,
      estimatedReach: newReach,
      status: 'pending' as const,
      aiReasoning: AI_REASONS[Math.floor(Math.random() * AI_REASONS.length)],
    } : item))
  }

  function handleEdit(id: string, title: string, hook: string, outline: string[]) {
    setQueue(q => q.map(item => item.id === id
      ? { ...item, title, hook, outline, status: 'modified' as const }
      : item
    ))
  }

  function handleContentMixChange(key: keyof AutopilotSettings['contentMix'], val: number) {
    setSettings(s => {
      const other = Object.keys(s.contentMix).filter(k => k !== key) as Array<keyof typeof s.contentMix>
      const remaining = 100 - val
      const total = other.reduce((sum, k) => sum + s.contentMix[k], 0)
      const adjusted = { ...s.contentMix, [key]: val }
      if (total > 0) {
        other.forEach(k => {
          adjusted[k] = Math.round((s.contentMix[k] / total) * remaining)
        })
      } else {
        other.forEach(k => { adjusted[k] = Math.floor(remaining / other.length) })
      }
      return { ...s, contentMix: adjusted }
    })
  }

  // Group queue by date
  const dayGroups: Record<string, AutopilotItem[]> = {}
  queue.forEach(item => {
    if (!dayGroups[item.date]) dayGroups[item.date] = []
    dayGroups[item.date].push(item)
  })
  const sortedDates = Object.keys(dayGroups).sort()

  const pendingCount = queue.filter(i => i.status === 'pending').length
  const totalReach = queue.filter(i => i.status !== 'rejected').reduce((s, i) => s + i.estimatedReach, 0)
  const optimalTimesUsed = queue.filter(i => i.status !== 'rejected').length

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.bg,
      padding: '28px 28px 100px',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>

      {/* ── Hero Toggle Card ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: autopilotOn
            ? 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, rgba(13,13,26,0.95) 60%)'
            : COLORS.card,
          border: autopilotOn
            ? '1px solid rgba(16,185,129,0.2)'
            : `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: '28px 32px',
          marginBottom: 24,
          boxShadow: autopilotOn ? '0 0 60px rgba(16,185,129,0.08)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {/* Icon */}
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: autopilotOn
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(59,130,246,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: autopilotOn ? '0 0 24px rgba(16,185,129,0.4)' : 'none',
              transition: 'all 0.35s ease',
              flexShrink: 0,
            }}>
              {autopilotOn
                ? <Play size={24} color="#fff" fill="#fff" />
                : <Zap size={24} color={COLORS.primary} />
              }
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: COLORS.text,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}>
                  Creator Autopilot
                </h1>
                {autopilotOn && (
                  <motion.span
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.success,
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      borderRadius: 20,
                      padding: '3px 10px',
                      letterSpacing: '0.06em',
                      fontFamily: 'Space Mono, monospace',
                    }}
                  >
                    ACTIVE
                  </motion.span>
                )}
              </div>
              <p style={{
                fontSize: 14,
                color: autopilotOn ? COLORS.mutedLight : COLORS.muted,
                margin: 0,
                lineHeight: 1.4,
              }}>
                {autopilotOn
                  ? 'Autopilot is active. AI is planning your next 14 days.'
                  : 'Turn on Autopilot to let AI manage your content calendar'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 13, color: COLORS.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {autopilotOn ? 'ON' : 'OFF'}
            </span>
            <Toggle on={autopilotOn} onToggle={handleToggleAutopilot} />
          </div>
        </div>

        {/* Stats row */}
        <AnimatePresence>
          {autopilotOn && queue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 24,
                flexWrap: 'wrap',
                overflow: 'hidden',
              }}
            >
              <StatBadge label="Posts Planned" value={queue.length} icon={Calendar} />
              <StatBadge label="Est. Reach" value={formatReach(totalReach)} icon={TrendingUp} />
              <StatBadge label="Optimal Times" value={optimalTimesUsed} icon={Clock} />
              <StatBadge label="Needs Approval" value={pendingCount} icon={BarChart3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Settings Panel ───────────────────────────────── */}
      <AnimatePresence>
        {autopilotOn && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 16,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            {/* Settings header */}
            <button
              onClick={() => setSettingsOpen(v => !v)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: COLORS.text,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings size={16} color={COLORS.primary} />
                <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Autopilot Settings
                </span>
              </div>
              {settingsOpen ? <ChevronUp size={18} color={COLORS.muted} /> : <ChevronDown size={18} color={COLORS.muted} />}
            </button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    padding: '0 24px 24px',
                    borderTop: `1px solid ${COLORS.border}`,
                    paddingTop: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                  }}>

                    {/* Posting frequency */}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 12, letterSpacing: '0.04em' }}>
                        POSTING FREQUENCY
                      </p>
                      <SliderRow
                        label="Posts per week"
                        value={settings.postsPerWeek}
                        min={1}
                        max={7}
                        unit=" posts/wk"
                        onChange={v => setSettings(s => ({ ...s, postsPerWeek: v }))}
                      />
                    </div>

                    {/* Content mix */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, letterSpacing: '0.04em', margin: 0 }}>
                          CONTENT MIX
                        </p>
                        <span style={{
                          fontSize: 11,
                          fontFamily: 'Space Mono, monospace',
                          color: (settings.contentMix.educational + settings.contentMix.entertainment + settings.contentMix.promotional) === 100
                            ? COLORS.success : COLORS.warning,
                        }}>
                          {settings.contentMix.educational + settings.contentMix.entertainment + settings.contentMix.promotional}% total
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <SliderRow
                          label="Educational"
                          value={settings.contentMix.educational}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={v => handleContentMixChange('educational', v)}
                          color={COLORS.primary}
                        />
                        <SliderRow
                          label="Entertainment"
                          value={settings.contentMix.entertainment}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={v => handleContentMixChange('entertainment', v)}
                          color={COLORS.pink}
                        />
                        <SliderRow
                          label="Promotional"
                          value={settings.contentMix.promotional}
                          min={0}
                          max={100}
                          unit="%"
                          onChange={v => handleContentMixChange('promotional', v)}
                          color={COLORS.warning}
                        />
                      </div>
                    </div>

                    {/* Platforms */}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 12, letterSpacing: '0.04em' }}>
                        PLATFORMS
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(Object.keys(settings.platforms) as Array<keyof typeof settings.platforms>).map(platform => (
                          <PlatformToggle
                            key={platform}
                            platform={platform}
                            active={settings.platforms[platform]}
                            onToggle={() => setSettings(s => ({
                              ...s,
                              platforms: { ...s.platforms, [platform]: !s.platforms[platform] },
                            }))}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Smart toggles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <SmallToggle
                        on={settings.useTrending}
                        onToggle={() => setSettings(s => ({ ...s, useTrending: !s.useTrending }))}
                        label="Auto-use trending topics"
                      />
                      <SmallToggle
                        on={settings.voiceMatch}
                        onToggle={() => setSettings(s => ({ ...s, voiceMatch: !s.voiceMatch }))}
                        label="Match my Content DNA"
                      />
                    </div>

                    {/* Regenerate Queue */}
                    <button
                      onClick={handleRegenerateQueue}
                      disabled={generating}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 24px',
                        background: 'rgba(59,130,246,0.1)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 10,
                        color: COLORS.primary,
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        cursor: generating ? 'not-allowed' : 'pointer',
                        opacity: generating ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                        alignSelf: 'flex-start',
                      }}
                    >
                      <RefreshCw size={15} style={{ animation: generating ? 'spin 1s linear infinite' : 'none' }} />
                      {generating ? 'Generating...' : 'Regenerate Queue'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content Queue ────────────────────────────────── */}
      <AnimatePresence>
        {autopilotOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {generating ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: '80px 0',
              }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles size={32} color={COLORS.primary} />
                </motion.div>
                <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  AI is building your 14-day content plan...
                </p>
                <p style={{ fontSize: 13, color: COLORS.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Analyzing your niche, audience patterns, and trending topics
                </p>
              </div>
            ) : queue.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 0',
                color: COLORS.muted,
              }}>
                <Zap size={32} color={COLORS.border} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 15, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  No content generated yet. Enable at least one platform to start.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {sortedDates.map(date => (
                  <div key={date}>
                    {/* Day header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 14,
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: COLORS.primary,
                        flexShrink: 0,
                      }} />
                      <h2 style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: COLORS.mutedLight,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        margin: 0,
                      }}>
                        {formatDate(date)}
                      </h2>
                      <div style={{
                        flex: 1,
                        height: 1,
                        background: COLORS.border,
                      }} />
                      <span style={{
                        fontSize: 11,
                        color: COLORS.muted,
                        fontFamily: 'Space Mono, monospace',
                      }}>
                        {dayGroups[date].length} post{dayGroups[date].length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <AnimatePresence>
                        {dayGroups[date].map(item => (
                          <ContentCard
                            key={item.id}
                            item={item}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onUndo={handleUndo}
                            onRegenerate={handleRegenItem}
                            onEdit={handleEdit}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state (autopilot off) ──────────────────── */}
      {!autopilotOn && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '80px 0',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(59,130,246,0.07)',
            border: `1px solid ${COLORS.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}>
            <Zap size={32} color={COLORS.primary} />
          </div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.text,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            margin: 0,
          }}>
            Your Autopilot is off
          </h2>
          <p style={{
            fontSize: 14,
            color: COLORS.muted,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            maxWidth: 400,
            lineHeight: 1.6,
            margin: 0,
          }}>
            Toggle Autopilot on and the AI will instantly generate a full 14-day content plan based on your niche, platforms, and Content DNA.
          </p>
        </motion.div>
      )}

      {/* ── Approval Summary Bar (fixed bottom) ─────────── */}
      <AnimatePresence>
        {autopilotOn && pendingCount > 0 && !generating && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              background: 'rgba(13,13,26,0.95)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 14,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span style={{
              fontSize: 13,
              color: COLORS.mutedLight,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 500,
            }}>
              <span style={{ color: COLORS.warning, fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
                {pendingCount}
              </span>
              {' '}item{pendingCount !== 1 ? 's' : ''} pending approval
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  queue.filter(i => i.status === 'pending').forEach(i => handleApprove(i.id))
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 8,
                  color: COLORS.success,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Check size={14} /> Approve All
              </button>
              <button
                onClick={() => {
                  setQueue(q => q.map(i => i.status === 'pending' ? { ...i, status: 'rejected' as const } : i))
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  color: COLORS.danger,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <X size={14} /> Reject All
              </button>
              <button
                onClick={() => {}}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(75,86,128,0.12)',
                  border: '1px solid rgba(75,86,128,0.2)',
                  borderRadius: 8,
                  color: COLORS.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Review Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inline keyframes for spinner ─────────────────── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
