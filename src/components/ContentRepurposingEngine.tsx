import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getResolvedAIKey } from '../utils/aiKey'
import {
  Wand2, Copy, RefreshCw, Camera, Zap, Briefcase, Youtube,
  Music, MessageCircle, Mail, Check, Sparkles, Send,
  ChevronDown, MessageSquare, FileText, Mic, Twitter,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentSource = 'youtube_script' | 'blog_post' | 'podcast_notes' | 'tweet_post' | 'video_transcript'
type Tone = 'casual' | 'educational' | 'inspirational' | 'entertaining'
type CTAStyle = 'follow_for_more' | 'link_in_bio' | 'comment_below' | 'none'
type PlatformKey =
  | 'instagram_caption'
  | 'instagram_stories'
  | 'twitter_thread'
  | 'linkedin_post'
  | 'youtube_community'
  | 'tiktok_caption'
  | 'whatsapp_status'
  | 'email_newsletter'

interface PlatformConfig {
  key: PlatformKey
  label: string
  icon: React.ReactNode
  color: string
  limit: number
  unit: string
  tip: string
}

interface OutputCard {
  platform: PlatformKey
  content: string
  saved?: boolean
}

interface SavedRepurposing {
  id: string
  sourceType: ContentSource
  sourceSnippet: string
  cards: OutputCard[]
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEMO_CONTENT = `Hey creators! Today I want to share the 5 morning habits that completely transformed my productivity as a full-time creator.

Habit #1: No phone for the first 30 minutes. I know, I know — but hear me out. When you reach for your phone first thing, you're starting the day in reactive mode. I started doing a phone-free morning and my focus improved dramatically.

Habit #2: Write 3 ideas every morning. Just 3. They don't have to be good. This one habit has given me over 300 content ideas this year alone.

Habit #3: Move your body before you open your laptop. Even a 15-minute walk counts. Your brain needs blood flow before it can do creative work.

Habit #4: Set ONE creative goal for the day. Not a to-do list — one thing that would make today feel successful if you got it done.

Habit #5: Protect the first 2 hours. No emails, no DMs, no comments. This is your deep work window. Guard it fiercely.

These habits sound simple, but implemented consistently they've been game-changing. Which one are you going to try first? Let me know in the comments!`

const SOURCE_TABS: { key: ContentSource; label: string; icon: React.ReactNode }[] = [
  { key: 'youtube_script', label: 'YouTube Script', icon: <Youtube size={13} /> },
  { key: 'blog_post', label: 'Blog Post', icon: <FileText size={13} /> },
  { key: 'podcast_notes', label: 'Podcast Notes', icon: <Mic size={13} /> },
  { key: 'tweet_post', label: 'Tweet/Post', icon: <Twitter size={13} /> },
  { key: 'video_transcript', label: 'Video Transcript', icon: <MessageSquare size={13} /> },
]

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    key: 'instagram_caption',
    label: 'Instagram Caption',
    icon: <Camera size={15} />,
    color: '#ec4899',
    limit: 2200,
    unit: 'chars',
    tip: 'Best: Tuesday 7pm — Use 3-5 hashtags',
  },
  {
    key: 'instagram_stories',
    label: 'Instagram Stories',
    icon: <Camera size={15} />,
    color: '#a78bfa',
    limit: 5,
    unit: 'slides',
    tip: '5 slides max — First slide is the hook',
  },
  {
    key: 'twitter_thread',
    label: 'Twitter/X Thread',
    icon: <Zap size={15} />,
    color: '#38bdf8',
    limit: 280,
    unit: 'chars/tweet',
    tip: '7-10 tweets — End with a CTA tweet',
  },
  {
    key: 'linkedin_post',
    label: 'LinkedIn Post',
    icon: <Briefcase size={15} />,
    color: '#3b82f6',
    limit: 3000,
    unit: 'chars',
    tip: 'Best: Wednesday 9am — No hashtags over 5',
  },
  {
    key: 'youtube_community',
    label: 'YouTube Community',
    icon: <Youtube size={15} />,
    color: '#ef4444',
    limit: 1000,
    unit: 'chars',
    tip: 'Add a poll question for 3x engagement',
  },
  {
    key: 'tiktok_caption',
    label: 'TikTok Caption',
    icon: <Music size={15} />,
    color: '#f0abfc',
    limit: 2200,
    unit: 'chars',
    tip: 'First 3 words must hook — Use trending sounds',
  },
  {
    key: 'whatsapp_status',
    label: 'WhatsApp Status',
    icon: <MessageCircle size={15} />,
    color: '#22c55e',
    limit: 700,
    unit: 'chars',
    tip: 'Keep it punchy — Under 2 lines ideal',
  },
  {
    key: 'email_newsletter',
    label: 'Email Newsletter Intro',
    icon: <Mail size={15} />,
    color: '#f59e0b',
    limit: 500,
    unit: 'chars',
    tip: 'Open rate peaks Mon 6am — Keep subject < 50 chars',
  },
]

const CTA_LABELS: Record<CTAStyle, string> = {
  follow_for_more: 'Follow for more',
  link_in_bio: 'Link in bio',
  comment_below: 'Comment below',
  none: 'None',
}

// ─── Template generation ─────────────────────────────────────────────────────

function extractSentences(text: string, n = 3): string {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(Boolean).slice(0, n).join('. ') + '.'
}

function extractBullets(text: string): string[] {
  const lines = text.split('\n').filter(l => l.trim())
  const bullets = lines.filter(l => /^(Habit|Step|Tip|\d+[.):]|[-•*])/.test(l.trim()))
  if (bullets.length > 0) return bullets.slice(0, 5)
  return lines.slice(0, 5)
}

function ctaText(cta: CTAStyle, tone: Tone): string {
  if (cta === 'none') return ''
  const map: Record<CTAStyle, string> = {
    follow_for_more: tone === 'casual' ? 'Follow for more 🫶' : 'Follow for more content like this.',
    link_in_bio: 'Full breakdown — link in bio.',
    comment_below: 'Drop your thoughts in the comments.',
    none: '',
  }
  return '\n\n' + map[cta]
}

function generateInstagramCaption(content: string, tone: Tone, emojis: boolean, hashtags: boolean, cta: CTAStyle): string {
  const hook = extractSentences(content, 1)
  const body = extractSentences(content, 3)
  const e = emojis
  const opening = tone === 'casual' ? (e ? '✨ ' : '') + hook
    : tone === 'inspirational' ? (e ? '🔥 ' : '') + hook
    : tone === 'entertaining' ? (e ? '👀 ' : '') + hook
    : hook
  const tags = hashtags ? '\n\n#creator #contentcreator #productivity #growthmindset #creatorlife' : ''
  return `${opening}\n\n${body}${ctaText(cta, tone)}${tags}`
}

function generateInstagramStories(content: string, _tone: Tone, emojis: boolean): string {
  const bullets = extractBullets(content)
  const e = emojis
  const slides = [
    `SLIDE 1 — Hook${e ? ' 👀' : ''}\n"${extractSentences(content, 1)}"`,
    `SLIDE 2 — The Problem${e ? ' 😅' : ''}\n${extractSentences(content, 1)}`,
    ...bullets.slice(0, 2).map((b, i) => `SLIDE ${i + 3} — Tip ${i + 1}\n${b.replace(/^(Habit|Step|Tip|\d+[.):\s]+)/, '').trim()}`),
    `SLIDE 5 — CTA${e ? ' 🫶' : ''}\nSave this for later!\nShare with a creator friend.`,
  ]
  return slides.slice(0, 5).join('\n\n---\n\n')
}

function generateTwitterThread(content: string, _tone: Tone, emojis: boolean): string {
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).length > 240) {
      if (current) chunks.push(current.trim())
      current = s
    } else {
      current = current ? current + ' ' + s : s
    }
  }
  if (current) chunks.push(current.trim())
  const tweets = chunks.slice(0, 8).map((t, i) => `${i + 1}/${Math.min(chunks.length, 8) + 1} ${t}`)
  const cta = `${chunks.length + 1}/${chunks.length + 1} ${emojis ? '🔁 ' : ''}RT if this helped. Follow for more creator insights.`
  return [...tweets, cta].join('\n\n')
}

function generateLinkedInPost(content: string, tone: Tone, _emojis: boolean, hashtags: boolean, cta: CTAStyle): string {
  const hook = extractSentences(content, 1)
  const bullets = extractBullets(content)
  const opener = tone === 'educational' ? 'Here\'s what most creators miss:' : 'This changed everything for me:'
  const bulletText = bullets.map(b => `• ${b.replace(/^(Habit|Step|Tip|\d+[.):\s]+)/, '').trim()}`).join('\n')
  const tags = hashtags ? '\n\n#Creator #ContentStrategy #Productivity #LinkedInCreator' : ''
  return `${hook}\n\n${opener}\n\n${bulletText}${ctaText(cta, tone)}${tags}`
}

function generateYoutubeCommunity(content: string, _tone: Tone, emojis: boolean): string {
  const hook = extractSentences(content, 1)
  const bullets = extractBullets(content).slice(0, 3)
  const bulletText = bullets.map(b => `• ${b.replace(/^(Habit|Step|Tip|\d+[.):\s]+)/, '').trim()}`).join('\n')
  return `${emojis ? '📢 ' : ''}New video up!\n\n${hook}\n\n${bulletText}\n\n${emojis ? '👇 ' : ''}Quick poll: Which habit do you already do?`
}

function generateTikTokCaption(content: string, _tone: Tone, emojis: boolean, hashtags: boolean): string {
  const first = extractSentences(content, 1).substring(0, 80)
  const tags = hashtags ? ' #creator #viral #learnontiktok #fyp' : ''
  return `${emojis ? '⚡ ' : ''}${first}${tags}`
}

function generateWhatsAppStatus(content: string, _tone: Tone, emojis: boolean): string {
  const core = extractSentences(content, 2)
  return `${emojis ? '💡 ' : ''}${core.substring(0, 650)}`
}

function generateEmailNewsletter(content: string, _tone: Tone, emojis: boolean): string {
  const hook = extractSentences(content, 1)
  const tease = extractSentences(content, 2)
  return `${emojis ? '👋 ' : ''}Hey!\n\n${hook}\n\n${tease.substring(0, 300)}\n\n${emojis ? '👇 ' : ''}Read the full breakdown below.`
}

function generateForPlatform(
  platform: PlatformKey,
  content: string,
  tone: Tone,
  emojis: boolean,
  hashtags: boolean,
  cta: CTAStyle
): string {
  switch (platform) {
    case 'instagram_caption': return generateInstagramCaption(content, tone, emojis, hashtags, cta)
    case 'instagram_stories': return generateInstagramStories(content, tone, emojis)
    case 'twitter_thread': return generateTwitterThread(content, tone, emojis)
    case 'linkedin_post': return generateLinkedInPost(content, tone, emojis, hashtags, cta)
    case 'youtube_community': return generateYoutubeCommunity(content, tone, emojis)
    case 'tiktok_caption': return generateTikTokCaption(content, tone, emojis, hashtags)
    case 'whatsapp_status': return generateWhatsAppStatus(content, tone, emojis)
    case 'email_newsletter': return generateEmailNewsletter(content, tone, emojis)
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: checked ? '#3b82f6' : 'rgba(59,130,246,0.15)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 200ms',
        flexShrink: 0,
        border: '1px solid rgba(59,130,246,0.2)',
      }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

function QueueStep({ label, status }: { label: string; status: 'waiting' | 'generating' | 'done' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: status === 'done' ? '#10b981' : status === 'generating' ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.06)',
        border: `1px solid ${status === 'done' ? '#10b981' : status === 'generating' ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
      }}>
        {status === 'done' ? (
          <Check size={12} color="#fff" />
        ) : status === 'generating' ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RefreshCw size={11} color="#3b82f6" />
          </motion.div>
        ) : (
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(59,130,246,0.3)' }} />
        )}
      </div>
      <span style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 12,
        color: status === 'done' ? '#10b981' : status === 'generating' ? '#f0f4ff' : '#4b5680',
        fontWeight: status === 'generating' ? 500 : 400,
      }}>
        {label}
        {status === 'generating' && <span style={{ color: '#3b82f6', marginLeft: 6 }}>generating...</span>}
        {status === 'done' && <span style={{ color: '#10b981', marginLeft: 6 }}>done</span>}
      </span>
    </div>
  )
}

function OutputCardComponent({
  card,
  config,
  onContentChange,
  onRegenerate,
  onCopy,
  onSaveToCalendar,
}: {
  card: OutputCard
  config: PlatformConfig
  onContentChange: (text: string) => void
  onRegenerate: () => void
  onCopy: () => void
  onSaveToCalendar: () => void
}) {
  const [copied, setCopied] = useState(false)

  const charCount = card.content.length
  const limitPct = config.unit === 'chars' ? Math.min(100, (charCount / config.limit) * 100)
    : config.unit === 'chars/tweet' ? Math.min(100, ((charCount / (card.content.split('\n\n').length || 1)) / config.limit) * 100)
    : 100
  const isOver = config.unit === 'chars' && charCount > config.limit

  function handleCopy() {
    navigator.clipboard.writeText(card.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
    onCopy()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: '#0d0d1a',
        border: '1px solid rgba(59,130,246,0.1)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(59,130,246,0.08)',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: `${config.color}18`,
            border: `1px solid ${config.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: config.color,
          }}>
            {config.icon}
          </div>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>
            {config.label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'Space Mono, monospace', fontSize: 11,
            color: isOver ? '#ef4444' : '#4b5680',
            background: isOver ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.06)',
            border: `1px solid ${isOver ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.1)'}`,
            borderRadius: 6, padding: '2px 8px',
          }}>
            {charCount.toLocaleString()} / {config.unit === 'slides' ? `${config.limit} ${config.unit}` : `${config.limit.toLocaleString()} ${config.unit}`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px' }}>
        <textarea
          value={card.content}
          onChange={e => onContentChange(e.target.value)}
          rows={6}
          style={{
            width: '100%',
            background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 8,
            padding: '10px 12px',
            color: '#f0f4ff',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            lineHeight: 1.65,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            minHeight: 120,
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.35)' }}
          onBlur={e => { e.target.style.borderColor = 'rgba(59,130,246,0.1)' }}
        />

        {/* Progress bar */}
        {config.unit === 'chars' && (
          <div style={{ marginTop: 6, height: 2, borderRadius: 2, background: 'rgba(59,130,246,0.08)', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${limitPct}%` }}
              style={{
                height: '100%',
                background: isOver ? '#ef4444' : limitPct > 80 ? '#f59e0b' : config.color,
                borderRadius: 2,
              }}
            />
          </div>
        )}

        {/* Tip chip */}
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontFamily: 'Space Mono, monospace', fontSize: 10,
            color: config.color,
            background: `${config.color}12`,
            border: `1px solid ${config.color}25`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            <Sparkles size={9} />
            {config.tip}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.08)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.15)'}`,
              borderRadius: 8, padding: '7px 13px',
              color: copied ? '#10b981' : '#f0f4ff',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { if (!copied) (e.target as HTMLElement).style.background = 'rgba(59,130,246,0.15)' }}
            onMouseLeave={e => { if (!copied) (e.target as HTMLElement).style.background = 'rgba(59,130,246,0.08)' }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={onRegenerate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(167,139,250,0.08)',
              border: '1px solid rgba(167,139,250,0.15)',
              borderRadius: 8, padding: '7px 13px',
              color: '#a78bfa',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 200ms',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(167,139,250,0.15)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(167,139,250,0.08)' }}
          >
            <RefreshCw size={13} />
            Regenerate
          </button>

          <button
            onClick={onSaveToCalendar}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 8, padding: '7px 13px',
              color: '#f59e0b',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', transition: 'all 200ms',
              marginLeft: 'auto',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(245,158,11,0.15)' }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(245,158,11,0.08)' }}
          >
            <Send size={13} />
            Save to Calendar
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContentRepurposingEngine() {
  const [sourceType, setSourceType] = useState<ContentSource>('youtube_script')
  const [content, setContent] = useState(DEMO_CONTENT)
  const [tone, setTone] = useState<Tone>('educational')
  const [useEmojis, setUseEmojis] = useState(true)
  const [useHashtags, setUseHashtags] = useState(true)
  const [ctaStyle, setCtaStyle] = useState<CTAStyle>('follow_for_more')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(
    new Set(PLATFORM_CONFIGS.map(p => p.key))
  )

  const [isProcessing, setIsProcessing] = useState(false)
  const [queueStatuses, setQueueStatuses] = useState<Record<PlatformKey, 'waiting' | 'generating' | 'done'>>({} as any)
  const [outputCards, setOutputCards] = useState<OutputCard[]>([])
  const [savedRepurposings, setSavedRepurposings] = useState<SavedRepurposing[]>([])
  const [copyAllDone, setCopyAllDone] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  const outputRef = useRef<HTMLDivElement>(null)

  const activePlatforms = PLATFORM_CONFIGS.filter(p => selectedPlatforms.has(p.key))

  function togglePlatform(key: PlatformKey) {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function selectAll() { setSelectedPlatforms(new Set(PLATFORM_CONFIGS.map(p => p.key))) }
  function deselectAll() { setSelectedPlatforms(new Set()) }

  const generateWithTemplate = useCallback((platform: PlatformKey) => {
    return generateForPlatform(platform, content, tone, useEmojis, useHashtags, ctaStyle)
  }, [content, tone, useEmojis, useHashtags, ctaStyle])

  async function generateWithAI(platform: PlatformKey, apiKey: string): Promise<string> {
    const config = PLATFORM_CONFIGS.find(p => p.key === platform)!
    const platformLabel = config.label
    const limitNote = config.unit === 'chars' ? `Keep under ${config.limit} characters.`
      : config.unit === 'chars/tweet' ? `Write a thread of 7-10 tweets, each under 280 chars. Number each tweet.`
      : `Write ${config.limit} concise slides.`

    const prompt = `Given this ${sourceType.replace(/_/g, ' ')} content: "${content.substring(0, 1200)}"

Generate a ${platformLabel}-native post that:
- Matches ${tone} tone
- Is optimized for ${platformLabel} (${limitNote})
- Sounds like a real creator, not a brand
- ${useEmojis ? 'Include relevant emojis' : 'No emojis'}
- ${useHashtags ? 'Include relevant hashtags' : 'No hashtags'}
- CTA style: ${CTA_LABELS[ctaStyle]}

Return only the post content, no explanation.`

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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data.content?.[0]?.text || generateWithTemplate(platform)
  }

  async function handleRepurpose() {
    if (!content.trim()) { toast.error('Paste some content first!'); return }
    if (selectedPlatforms.size === 0) { toast.error('Select at least one platform'); return }

    setIsProcessing(true)
    setOutputCards([])
    const initial: Record<PlatformKey, 'waiting' | 'generating' | 'done'> = {} as any
    activePlatforms.forEach(p => { initial[p.key] = 'waiting' })
    setQueueStatuses(initial)

    // Scroll to output
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

    const results: OutputCard[] = []

    for (const platform of activePlatforms) {
      setQueueStatuses(prev => ({ ...prev, [platform.key]: 'generating' }))
      await new Promise(r => setTimeout(r, 300))

      let generated: string
      try {
        const apiKey = getResolvedAIKey()
        if (apiKey) {
          generated = await generateWithAI(platform.key, apiKey)
        } else {
          await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
          generated = generateWithTemplate(platform.key)
        }
      } catch {
        generated = generateWithTemplate(platform.key)
      }

      results.push({ platform: platform.key, content: generated })
      setOutputCards([...results])
      setQueueStatuses(prev => ({ ...prev, [platform.key]: 'done' }))
    }

    // Save to history
    setSavedRepurposings(prev => [
      {
        id: Date.now().toString(),
        sourceType,
        sourceSnippet: content.substring(0, 80) + '...',
        cards: [...results],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 5))

    setIsProcessing(false)
    toast.success(`${results.length} platform adaptations ready!`)
  }

  function updateCard(platform: PlatformKey, text: string) {
    setOutputCards(prev => prev.map(c => c.platform === platform ? { ...c, content: text } : c))
  }

  function regenerateSingle(platform: PlatformKey) {
    const generated = generateWithTemplate(platform)
    updateCard(platform, generated)
    toast.success('Regenerated!')
  }

  function copyAll() {
    const md = outputCards.map(c => {
      const cfg = PLATFORM_CONFIGS.find(p => p.key === c.platform)!
      return `## ${cfg.label}\n\n${c.content}`
    }).join('\n\n---\n\n')
    navigator.clipboard.writeText(md)
    setCopyAllDone(true)
    setTimeout(() => setCopyAllDone(false), 2000)
    toast.success('All content copied as markdown!')
  }

  function restoreRepurposing(saved: SavedRepurposing) {
    setOutputCards(saved.cards)
    toast.success('Repurposing restored!')
  }

  const tones: Tone[] = ['casual', 'educational', 'inspirational', 'entertaining']
  const ctaOptions: CTAStyle[] = ['follow_for_more', 'link_in_bio', 'comment_below', 'none']

  const s = {
    label: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: 11,
      fontWeight: 600,
      color: '#4b5680',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      marginBottom: 8,
    },
    sectionTitle: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      fontSize: 13,
      fontWeight: 600,
      color: '#f0f4ff',
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 7,
    },
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080810',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: '28px 32px 0',
        borderBottom: '1px solid rgba(59,130,246,0.08)',
        paddingBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(167,139,250,0.2))',
            border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Wand2 size={18} color="#a78bfa" />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 22, fontWeight: 700,
              background: 'linear-gradient(135deg, #f0f4ff, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              margin: 0,
            }}>
              Content Repurposing Engine
            </h1>
          </div>
        </div>
        <p style={{ color: '#4b5680', fontSize: 13, margin: 0, marginLeft: 48 }}>
          Drop one piece of content, get {PLATFORM_CONFIGS.length} platform-native adaptations instantly
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', flex: 1, gap: 0, padding: '24px 32px', alignItems: 'flex-start' }}>

        {/* ── Left Panel ── */}
        <div style={{
          width: 400, flexShrink: 0, position: 'sticky', top: 24,
          display: 'flex', flexDirection: 'column', gap: 20,
          maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
          paddingRight: 24,
        }}>

          {/* Content Source */}
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={s.sectionTitle}>
              <FileText size={14} color="#3b82f6" />
              Content Source
            </div>

            {/* Source type tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {SOURCE_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSourceType(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: `1px solid ${sourceType === tab.key ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.1)'}`,
                    background: sourceType === tab.key ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: sourceType === tab.key ? '#3b82f6' : '#4b5680',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 200ms',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={8}
              placeholder="Paste your content here..."
              style={{
                width: '100%',
                background: 'rgba(59,130,246,0.04)',
                border: '1px solid rgba(59,130,246,0.12)',
                borderRadius: 10,
                padding: '12px 14px',
                color: '#f0f4ff',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                lineHeight: 1.65,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 200ms',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.35)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(59,130,246,0.12)' }}
            />
            <div style={{ marginTop: 6, fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#4b5680', textAlign: 'right' }}>
              {content.length.toLocaleString()} chars · {content.trim().split(/\s+/).length} words
            </div>
          </div>

          {/* Voice Settings */}
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={s.sectionTitle}>
              <Sparkles size={14} color="#ec4899" />
              Your Voice Settings
            </div>

            {/* Tone */}
            <div style={{ marginBottom: 16 }}>
              <div style={s.label}>Tone</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tones.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${tone === t ? 'rgba(236,72,153,0.4)' : 'rgba(59,130,246,0.1)'}`,
                      background: tone === t ? 'rgba(236,72,153,0.12)' : 'transparent',
                      color: tone === t ? '#ec4899' : '#4b5680',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', transition: 'all 200ms',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Include emojis', value: useEmojis, onChange: setUseEmojis },
                { label: 'Include hashtags', value: useHashtags, onChange: setUseHashtags },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#f0f4ff' }}>{item.label}</span>
                  <ToggleSwitch checked={item.value} onChange={item.onChange} />
                </div>
              ))}
            </div>

            {/* CTA Style */}
            <div>
              <div style={s.label}>Call-to-action style</div>
              <div style={{
                position: 'relative',
              }}>
                <select
                  value={ctaStyle}
                  onChange={e => setCtaStyle(e.target.value as CTAStyle)}
                  style={{
                    width: '100%',
                    background: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.15)',
                    borderRadius: 8,
                    padding: '8px 32px 8px 12px',
                    color: '#f0f4ff',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 13,
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {ctaOptions.map(o => (
                    <option key={o} value={o} style={{ background: '#0d0d1a' }}>{CTA_LABELS[o]}</option>
                  ))}
                </select>
                <ChevronDown size={14} color="#4b5680" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Platform Toggles */}
          <div style={{
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: 14,
            padding: '18px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={s.sectionTitle}>
                <Send size={14} color="#a78bfa" />
                Platforms
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={selectAll} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Select All</button>
                <span style={{ color: '#4b5680' }}>·</span>
                <button onClick={deselectAll} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, color: '#4b5680', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Deselect All</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PLATFORM_CONFIGS.map(platform => {
                const active = selectedPlatforms.has(platform.key)
                return (
                  <button
                    key={platform.key}
                    onClick={() => togglePlatform(platform.key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 11px',
                      borderRadius: 9,
                      border: `1px solid ${active ? `${platform.color}35` : 'rgba(59,130,246,0.1)'}`,
                      background: active ? `${platform.color}0d` : 'transparent',
                      cursor: 'pointer', transition: 'all 200ms',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: active ? platform.color : 'rgba(59,130,246,0.2)',
                      transition: 'background 200ms',
                    }} />
                    <span style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 11, fontWeight: 500,
                      color: active ? '#f0f4ff' : '#4b5680',
                      transition: 'color 200ms',
                    }}>
                      {platform.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Repurpose Button */}
          <button
            onClick={handleRepurpose}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: isProcessing
                ? 'rgba(59,130,246,0.2)'
                : 'linear-gradient(135deg, #3b82f6, #a78bfa)',
              color: '#fff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 14, fontWeight: 700,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 200ms',
              boxShadow: isProcessing ? 'none' : '0 4px 20px rgba(59,130,246,0.25)',
            }}
          >
            {isProcessing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={16} />
                </motion.div>
                Repurposing...
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Repurpose Now
              </>
            )}
          </button>
        </div>

        {/* ── Right Panel ── */}
        <div ref={outputRef} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Queue */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  background: '#0d0d1a',
                  border: '1px solid rgba(59,130,246,0.12)',
                  borderRadius: 14,
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles size={15} color="#a78bfa" />
                  </motion.div>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>
                    Repurposing Queue
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#4b5680' }}>
                    {Object.values(queueStatuses).filter(v => v === 'done').length} / {activePlatforms.length} done
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {activePlatforms.map(p => (
                    <QueueStep key={p.key} label={p.label} status={queueStatuses[p.key] || 'waiting'} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {outputCards.length === 0 && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 40px',
                background: '#0d0d1a',
                border: '1px dashed rgba(59,130,246,0.15)',
                borderRadius: 14,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(167,139,250,0.1))',
                border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Wand2 size={28} color="#a78bfa" />
              </div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 16, fontWeight: 600, color: '#f0f4ff', margin: '0 0 8px' }}>
                Ready to repurpose
              </h3>
              <p style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, color: '#4b5680', margin: 0, maxWidth: 300, lineHeight: 1.6 }}>
                A sample script is pre-loaded. Hit "Repurpose Now" to see {PLATFORM_CONFIGS.length} platform-native adaptations instantly.
              </p>
            </motion.div>
          )}

          {/* Output cards */}
          <AnimatePresence>
            {outputCards.map(card => {
              const config = PLATFORM_CONFIGS.find(p => p.key === card.platform)!
              return (
                <OutputCardComponent
                  key={card.platform}
                  card={card}
                  config={config}
                  onContentChange={text => updateCard(card.platform, text)}
                  onRegenerate={() => regenerateSingle(card.platform)}
                  onCopy={() => toast.success(`${config.label} copied!`)}
                  onSaveToCalendar={() => toast.success(`Saved to calendar queue!`)}
                />
              )
            })}
          </AnimatePresence>

          {/* Saved Repurposings */}
          {savedRepurposings.length > 0 && (
            <div style={{
              background: '#0d0d1a',
              border: '1px solid rgba(59,130,246,0.1)',
              borderRadius: 14,
              overflow: 'hidden',
            }}>
              <button
                onClick={() => setShowSaved(v => !v)}
                style={{
                  width: '100%', padding: '14px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: showSaved ? '1px solid rgba(59,130,246,0.08)' : 'none',
                }}
              >
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600, color: '#f0f4ff', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MessageCircle size={14} color="#f59e0b" />
                  Saved Repurposings ({savedRepurposings.length})
                </span>
                <motion.div animate={{ rotate: showSaved ? 180 : 0 }} transition={{ duration: 200 }}>
                  <ChevronDown size={15} color="#4b5680" />
                </motion.div>
              </button>

              <AnimatePresence>
                {showSaved && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {savedRepurposings.map(saved => (
                        <button
                          key={saved.id}
                          onClick={() => restoreRepurposing(saved)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 9,
                            border: '1px solid rgba(59,130,246,0.1)',
                            background: 'rgba(59,130,246,0.04)',
                            cursor: 'pointer', transition: 'all 200ms',
                            textAlign: 'left',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.09)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.04)' }}
                        >
                          <div>
                            <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#f0f4ff', marginBottom: 2 }}>
                              {saved.sourceSnippet}
                            </div>
                            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#4b5680' }}>
                              {saved.sourceType.replace(/_/g, ' ')} · {saved.cards.length} platforms · {new Date(saved.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <RefreshCw size={13} color="#3b82f6" style={{ flexShrink: 0, marginLeft: 12 }} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Copy All FAB */}
      <AnimatePresence>
        {outputCards.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={copyAll}
            style={{
              position: 'fixed', bottom: 28, right: 28,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px',
              borderRadius: 50,
              border: 'none',
              background: copyAllDone
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #3b82f6, #a78bfa)',
              color: '#fff',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
              transition: 'background 300ms',
              zIndex: 50,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {copyAllDone ? <Check size={15} /> : <Copy size={15} />}
            {copyAllDone ? 'Copied!' : `Copy All (${outputCards.length})`}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
