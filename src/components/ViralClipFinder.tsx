import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Scissors, Copy, Check, ChevronDown, ChevronUp, Zap,
  RefreshCw, Download, TrendingUp, Info,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

type ShortPlatform = 'YouTube Shorts' | 'Instagram Reels' | 'TikTok'
type ClipLength = '30s' | '60s' | '90s'

interface ClipResult {
  rank: number
  score: number
  timestampStart: string
  timestampEnd: string
  hookSentence: string
  whyItWorks: string
  platforms: ShortPlatform[]
  editNotes: {
    cuts: string
    textOverlay: string
    audioStyle: string
  }
  captionPreview: string
  hashtagNote: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLIP_COLORS: Record<number, string> = {
  1: '#a78bfa',
  2: '#3b82f6',
  3: '#06b6d4',
  4: '#10b981',
  5: '#f59e0b',
}

const PLATFORM_COLORS: Record<ShortPlatform, string> = {
  'YouTube Shorts': '#ff0000',
  'Instagram Reels': '#e1306c',
  'TikTok': '#69c9d0',
}

const springConfig = { type: 'spring' as const, stiffness: 300, damping: 28 }

const VIRAL_TIPS = [
  {
    title: 'Strong opening 3 seconds',
    body: 'The first sentence must create a pattern interrupt — surprise, contradiction, or immediate value.',
  },
  {
    title: 'Emotional arc',
    body: 'Great clips have a micro-journey: setup tension → release. Even 30 seconds can have a beginning and end.',
  },
  {
    title: 'Quotable moment',
    body: 'One sentence a viewer would screenshot and share is worth more than 3 minutes of explanation.',
  },
  {
    title: 'Relatable specificity',
    body: "Specific numbers (\"27 days\", \"₹8,400\") outperform vague claims every time. Details make it believable.",
  },
]

// ── Demo Data ─────────────────────────────────────────────────────────────────

const DEMO_CLIPS: ClipResult[] = [
  {
    rank: 1,
    score: 9.2,
    timestampStart: '3:14',
    timestampEnd: '4:02',
    hookSentence: "I stopped checking my phone for 30 days. Here's what I found out about my own brain.",
    whyItWorks: "Personal challenge + self-discovery = irresistible curiosity loop. The word 'brain' signals something surprising about to be revealed.",
    platforms: ['YouTube Shorts', 'Instagram Reels', 'TikTok'],
    editNotes: {
      cuts: 'Cut the 8-second pause between "stopped" and the next line. Jump-cut to keep energy up.',
      textOverlay: 'Flash "30 DAYS" in bold at 0:03. End with a statistic text card.',
      audioStyle: 'Upbeat lo-fi study beats under the monologue. Drop out for the punchline.',
    },
    captionPreview: "I gave up my phone for 30 days. The results were not what I expected...",
    hashtagNote: '#productivity #mindset #digitaldetox',
  },
  {
    rank: 2,
    score: 8.7,
    timestampStart: '11:40',
    timestampEnd: '12:38',
    hookSentence: "The second system in this list is the one nobody talks about — and it's the only reason I ship work on time.",
    whyItWorks: "\"Nobody talks about\" is a proven viral trigger. Positions the creator as an insider with rare knowledge viewers can't get elsewhere.",
    platforms: ['YouTube Shorts', 'Instagram Reels'],
    editNotes: {
      cuts: 'Start 5 seconds before the timestamp — the lead-in sets context. Hard cut after the reveal.',
      textOverlay: '"SYSTEM #2" caption at start. Bullet-point the steps as they appear.',
      audioStyle: 'Ambient background, no music over the key reveal moment.',
    },
    captionPreview: "The one productivity system nobody teaches (but I use every single day)",
    hashtagNote: '#productivitytips #worksmarter #creatorhacks',
  },
  {
    rank: 3,
    score: 8.4,
    timestampStart: '22:05',
    timestampEnd: '23:10',
    hookSentence: "Everything I told you up to this point was the setup. THIS is the actual answer.",
    whyItWorks: "Perfect cliffhanger drop. Works even without context from the full video — the urgency is self-contained and triggers immediate watch-through.",
    platforms: ['TikTok', 'Instagram Reels'],
    editNotes: {
      cuts: 'No cuts needed. The natural pause before the reveal is the payoff — do not edit it out.',
      textOverlay: '"Wait for it..." at 0:02. Emphasise the punchline word with a zoom.',
      audioStyle: 'Silence before the reveal, then a satisfying "ding" SFX.',
    },
    captionPreview: "Everything before this was the setup. This is the part they never show you.",
    hashtagNote: '#reveal #contentcreator #viralmoment',
  },
  {
    rank: 4,
    score: 7.9,
    timestampStart: '35:22',
    timestampEnd: '36:18',
    hookSentence: "I wasted 2 years doing this wrong. Here's what I wish someone had told me.",
    whyItWorks: 'Regret-based hooks generate strong empathy. Viewers project their own struggles and feel the creator is speaking directly to them.',
    platforms: ['YouTube Shorts', 'Instagram Reels'],
    editNotes: {
      cuts: 'Cut the mid-sentence filler word at ~15 seconds. The energy dips — splice it clean.',
      textOverlay: '"2 YEARS" counter text at open. Add a checklist graphic for each tip.',
      audioStyle: 'Reflective, slightly melancholic background track for the first half, then energetic on the solution.',
    },
    captionPreview: "2 years of doing this wrong so you don't have to. Save this one.",
    hashtagNote: '#lessons #creatorlife #hardtruth',
  },
  {
    rank: 5,
    score: 7.5,
    timestampStart: '48:10',
    timestampEnd: '49:05',
    hookSentence: "Three tools. Free. And they completely replaced my entire ₹12,000/month stack.",
    whyItWorks: 'Money saved + free tools is evergreen viral content. The specific rupee amount makes it instantly relatable to Indian creator audience.',
    platforms: ['YouTube Shorts', 'TikTok', 'Instagram Reels'],
    editNotes: {
      cuts: 'Cut the 4-second intro where you\'re still framing the camera. Start at "Three tools."',
      textOverlay: 'Show each tool name as a title card overlay as you mention them.',
      audioStyle: 'High-energy, fast-cut tempo music. Keep it punchy — 55 seconds max.',
    },
    captionPreview: "3 free tools that replaced my ₹12,000/month software stack",
    hashtagNote: '#freetools #savemoney #creatortools',
  },
]

// ── AI Prompt ─────────────────────────────────────────────────────────────────

function buildClipPrompt(transcript: string, platforms: ShortPlatform[], maxLength: ClipLength): string {
  const platformStr = platforms.length > 0 ? platforms.join(', ') : 'YouTube Shorts, Instagram Reels, TikTok'
  return `You are a short-form video editor and viral content expert. Analyse this video transcript and find the 5 best moments to turn into viral short-form clips.

Platforms: ${platformStr}
Max clip length: ${maxLength}

TRANSCRIPT:
${transcript.slice(0, 6000)}

Return a JSON array of exactly 5 clips with this structure (no markdown fences):
[
  {
    "rank": 1,
    "score": 9.2,
    "timestampStart": "3:14",
    "timestampEnd": "4:02",
    "hookSentence": "The first sentence of the clip that grabs attention",
    "whyItWorks": "1 sentence explanation of the viral potential",
    "platforms": ["YouTube Shorts", "Instagram Reels"],
    "editNotes": {
      "cuts": "What to cut or trim",
      "textOverlay": "What text to add on screen",
      "audioStyle": "Suggested background audio/music style"
    },
    "captionPreview": "Suggested 2-line caption for social posts",
    "hashtagNote": "#hashtag1 #hashtag2 #hashtag3"
  }
]

Rank clips 1-5 with score/10 for viral potential. Choose clips with strong emotional hooks, quotable moments, surprising reveals, or high-value tips. Timestamps should be realistic for the content described. Platforms should be from: YouTube Shorts, Instagram Reels, TikTok.`
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 700,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.08)',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.2)'}`,
        color: copied ? '#10b981' : '#3b82f6',
        cursor: 'pointer', transition: 'all 150ms ease',
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontSize: 26, fontFamily: 'Space Mono, monospace', fontWeight: 700,
        color, lineHeight: 1,
      }}>
        {score.toFixed(1)}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: '#4b5680' }}>Viral Score</span>
          <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>/10</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: color, borderRadius: 4 }}
          />
        </div>
      </div>
    </div>
  )
}

// ── ClipCard ──────────────────────────────────────────────────────────────────

function ClipCard({ clip }: { clip: ClipResult }) {
  const [editOpen, setEditOpen] = useState(false)
  const color = CLIP_COLORS[clip.rank] || '#a78bfa'

  function buildBriefText(): string {
    return [
      `CLIP ${clip.rank} — Viral Score: ${clip.score}/10`,
      `Timestamp: ${clip.timestampStart} → ${clip.timestampEnd}`,
      `Hook: "${clip.hookSentence}"`,
      `Why it works: ${clip.whyItWorks}`,
      `Platforms: ${clip.platforms.join(', ')}`,
      `\nEDIT NOTES`,
      `Cuts: ${clip.editNotes.cuts}`,
      `Text overlay: ${clip.editNotes.textOverlay}`,
      `Audio: ${clip.editNotes.audioStyle}`,
      `\nCaption: ${clip.captionPreview}`,
      `Hashtags: ${clip.hashtagNote}`,
    ].join('\n')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springConfig}
      className="card"
      style={{ padding: '18px 20px' }}
    >
      {/* Top row: rank badge + score */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: `${color}18`, border: `1.5px solid ${color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontFamily: 'Space Mono, monospace', fontWeight: 700, color,
          }}>
            {clip.rank}
          </div>
          <div>
            <span style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Clip {clip.rank}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                fontSize: 12, fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#06b6d4',
              }}>
                {clip.timestampStart} → {clip.timestampEnd}
              </span>
            </div>
          </div>
        </div>
        <div style={{ width: 160 }}>
          <ScoreBar score={clip.score} color={color} />
        </div>
      </div>

      {/* Hook sentence */}
      <p style={{
        fontSize: 14, fontWeight: 700, color: '#f0f4ff',
        lineHeight: 1.5, marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        "{clip.hookSentence}"
      </p>

      {/* Why it works */}
      <p style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.55, marginBottom: 12 }}>
        <TrendingUp size={11} style={{ display: 'inline', marginRight: 5, color: color, verticalAlign: 'middle' }} />
        {clip.whyItWorks}
      </p>

      {/* Platform pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {clip.platforms.map((p) => (
          <span key={p} style={{
            fontSize: 10, padding: '2px 9px', borderRadius: 20,
            background: `${PLATFORM_COLORS[p]}15`, color: PLATFORM_COLORS[p],
            fontWeight: 700, border: `1px solid ${PLATFORM_COLORS[p]}30`,
          }}>
            {p}
          </span>
        ))}
      </div>

      {/* Edit notes — expandable */}
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 12,
      }}>
        <button
          onClick={() => setEditOpen(!editOpen)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 13px', background: 'rgba(255,255,255,0.03)',
            border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
            transition: 'background 150ms ease',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Edit Notes
          </span>
          {editOpen ? <ChevronUp size={13} color="#4b5680" /> : <ChevronDown size={13} color="#4b5680" />}
        </button>

        <AnimatePresence>
          {editOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '12px 13px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {([
                  { label: 'Cuts', value: clip.editNotes.cuts, color: '#ec4899' },
                  { label: 'Text Overlay', value: clip.editNotes.textOverlay, color: '#f59e0b' },
                  { label: 'Audio Style', value: clip.editNotes.audioStyle, color: '#a78bfa' },
                ] as { label: string; value: string; color: string }[]).map(({ label, value, color: noteColor }) => (
                  <div key={label}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: noteColor || '#4b5680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </span>
                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginTop: 2 }}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption preview */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', borderRadius: 9, padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.05)', marginBottom: 12,
      }}>
        <span style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>
          Caption Preview
        </span>
        <p style={{ fontSize: 13, color: '#c4cde0', lineHeight: 1.5, marginBottom: 3 }}>{clip.captionPreview}</p>
        <span style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{clip.hashtagNote}</span>
      </div>

      {/* Copy brief */}
      <CopyBtn text={buildBriefText()} label="Copy Brief" />
    </motion.div>
  )
}

// ── PillToggle ─────────────────────────────────────────────────────────────────

function PillToggle<T extends string>({
  options,
  selected,
  onToggle,
  colorMap,
}: {
  options: T[]
  selected: T[]
  onToggle: (val: T) => void
  colorMap: Record<T, string>
}) {
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const active = selected.includes(opt)
        const col = colorMap[opt]
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: active ? `${col}18` : 'transparent',
              border: `1px solid ${active ? col : 'rgba(59,130,246,0.15)'}`,
              color: active ? col : '#6b7a9a',
              transition: 'all 150ms ease',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ViralClipFinder() {
  const { profile } = useStore()

  const [transcript, setTranscript] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<ShortPlatform[]>(['YouTube Shorts', 'Instagram Reels', 'TikTok'])
  const [maxLength, setMaxLength] = useState<ClipLength>('60s')
  const [loading, setLoading] = useState(false)
  const [clips, setClips] = useState<ClipResult[] | null>(null)
  const [tipsOpen, setTipsOpen] = useState(false)

  function togglePlatform(p: ShortPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  async function findClips() {
    if (transcript.trim().length < 100) {
      toast.error('Please paste at least a few paragraphs of transcript', { style: { background: '#0d0d1a', color: '#f0f4ff' } })
      return
    }

    const apiKey = profile?.apiKey
    if (!apiKey) {
      setClips(DEMO_CLIPS)
      toast('Showing demo clips — add your API key in settings for AI analysis', {
        icon: '💡',
        style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(245,158,11,0.3)' },
      })
      return
    }

    setLoading(true)
    setClips(null)

    try {
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
          messages: [{
            role: 'user',
            content: buildClipPrompt(transcript, selectedPlatforms, maxLength),
          }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ClipResult[]
        setClips(parsed)
        toast.success('5 viral moments found!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
      } else {
        throw new Error('No JSON array found')
      }
    } catch {
      toast.error('AI error — showing demo clips', { style: { background: '#0d0d1a', color: '#f0f4ff' } })
      setClips(DEMO_CLIPS)
    } finally {
      setLoading(false)
    }
  }

  function exportAllClips() {
    if (!clips) return
    const md = clips.map((clip) =>
      [
        `## CLIP ${clip.rank} — Score: ${clip.score}/10`,
        `**Timestamp:** ${clip.timestampStart} → ${clip.timestampEnd}`,
        `**Hook:** "${clip.hookSentence}"`,
        `**Why it works:** ${clip.whyItWorks}`,
        `**Platforms:** ${clip.platforms.join(', ')}`,
        '',
        '### Edit Notes',
        `- **Cuts:** ${clip.editNotes.cuts}`,
        `- **Text Overlay:** ${clip.editNotes.textOverlay}`,
        `- **Audio Style:** ${clip.editNotes.audioStyle}`,
        '',
        `**Caption:** ${clip.captionPreview}`,
        `**Hashtags:** ${clip.hashtagNote}`,
      ].join('\n')
    ).join('\n\n---\n\n')

    navigator.clipboard.writeText(md).then(() => {
      toast.success('All 5 clip briefs copied as Markdown!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
    })
  }

  return (
    <div style={{ padding: '24px 28px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: 24, color: '#f0f4ff', marginBottom: 4, letterSpacing: '-0.02em',
        }}>
          Viral Clip Finder
        </h1>
        <p style={{ fontSize: 13, color: '#6b7a9a', lineHeight: 1.5 }}>
          Paste a long-form video transcript and AI extracts the 5 best short-form moments for Shorts, Reels & TikTok.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* ── Left Panel ─────────────────────────────────── */}
        <div style={{
          width: 420, flexShrink: 0,
          background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)',
          borderRadius: 16, padding: '22px 20px',
          position: 'sticky', top: 0,
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Video Transcript</label>
            <textarea
              className="field"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your full video transcript here..."
              style={{
                minHeight: 300, resize: 'vertical',
                fontFamily: 'Space Mono, monospace', fontSize: 12, lineHeight: 1.65,
              }}
            />
            {transcript.length > 0 && (
              <span style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace', display: 'block', marginTop: 5 }}>
                {transcript.split(/\s+/).filter(Boolean).length} words
              </span>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Platform Preference</label>
            <PillToggle<ShortPlatform>
              options={['YouTube Shorts', 'Instagram Reels', 'TikTok']}
              selected={selectedPlatforms}
              onToggle={togglePlatform}
              colorMap={PLATFORM_COLORS}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Max Clip Length</label>
            <PillToggle<ClipLength>
              options={['30s', '60s', '90s']}
              selected={[maxLength]}
              onToggle={(v) => setMaxLength(v)}
              colorMap={{ '30s': '#a78bfa', '60s': '#3b82f6', '90s': '#06b6d4' }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={springConfig}
            className="btn-pink"
            style={{
              width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 12, marginBottom: 14,
            }}
            onClick={findClips}
            disabled={loading}
          >
            {loading
              ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Zap size={15} />}
            {loading ? 'Analysing Transcript...' : 'Find Viral Clips'}
          </motion.button>

          {/* Info accordion */}
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.12)',
          }}>
            <button
              onClick={() => setTipsOpen(!tipsOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', background: 'rgba(59,130,246,0.05)',
                border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'background 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Info size={13} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>What makes a good clip?</span>
              </div>
              {tipsOpen ? <ChevronUp size={13} color="#3b82f6" /> : <ChevronDown size={13} color="#3b82f6" />}
            </button>

            <AnimatePresence>
              {tipsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {VIRAL_TIPS.map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          background: 'rgba(59,130,246,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#3b82f6', fontWeight: 700,
                        }}>
                          {i + 1}
                        </div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#c4cde0', display: 'block', marginBottom: 2 }}>{tip.title}</span>
                          <span style={{ fontSize: 11, color: '#6b7a9a', lineHeight: 1.5 }}>{tip.body}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Results header */}
          {clips && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
                  fontSize: 16, color: '#f0f4ff',
                }}>
                  5 Best Clip Moments
                </h2>
                <span className="badge badge-blue" style={{ fontFamily: 'Space Mono, monospace', fontSize: 12 }}>
                  {clips.length} clips
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-blue"
                style={{
                  padding: '9px 16px', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
                onClick={exportAllClips}
              >
                <Download size={13} />
                Export All Clips
              </motion.button>
            </div>
          )}

          {/* Empty state */}
          <AnimatePresence>
            {!clips && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center', padding: '80px 40px',
                  background: '#0d0d1a', borderRadius: 16,
                  border: '1px dashed rgba(59,130,246,0.15)',
                }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: 'rgba(236,72,153,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <Scissors size={26} color="#ec4899" />
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 17, color: '#f0f4ff', marginBottom: 8 }}>
                  Paste a transcript to find your clips
                </h3>
                <p style={{ fontSize: 13, color: '#4b5680', maxWidth: 320, margin: '0 auto' }}>
                  AI will scan the full transcript and surface the 5 moments with the highest viral potential.
                </p>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '80px 40px' }}
              >
                <Zap size={32} color="#ec4899" style={{ animation: 'pulse 1s ease-in-out infinite', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Scanning transcript for viral moments...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clips list */}
          {clips && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {clips.map((clip, i) => (
                <motion.div
                  key={clip.rank}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: i * 0.07 }}
                >
                  <ClipCard clip={clip} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
}
