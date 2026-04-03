import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Wand2, RefreshCw, Copy, Check, Film, Image, MonitorPlay,
  Mic, ChevronDown, BookOpen, Clapperboard, List, Save,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────

type VideoPlatform = 'YouTube Long-form' | 'YouTube Short' | 'Instagram Reel' | 'TikTok' | 'LinkedIn'
type VideoDuration = '30s' | '1 min' | '3 min' | '10 min' | '20 min'

interface HookVariant {
  style: 'Curiosity Gap' | 'Controversy / Bold Claim' | 'Value-first'
  text: string
}

interface ShotItem {
  number: number
  type: 'Talking Head' | 'B-Roll' | 'Text Overlay' | 'Screen Recording'
  description: string
  duration: string
}

interface ScriptSection {
  label: string
  content: string
  markers: string[]
}

interface ThumbnailConcept {
  style: 'Face Reaction' | 'Text-heavy' | 'Curiosity Gap'
  visualDescription: string
  textOverlay: string
}

interface ChapterItem {
  timestamp: string
  title: string
}

interface BriefOutput {
  hooks: HookVariant[]
  shots: ShotItem[]
  scriptSections: ScriptSection[]
  thumbnails: ThumbnailConcept[]
  chapters: ChapterItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SHOT_TYPE_ICONS: Record<ShotItem['type'], React.ReactNode> = {
  'Talking Head': <Mic size={11} />,
  'B-Roll': <Film size={11} />,
  'Text Overlay': <Image size={11} />,
  'Screen Recording': <MonitorPlay size={11} />,
}

const SHOT_TYPE_COLORS: Record<ShotItem['type'], string> = {
  'Talking Head': '#ec4899',
  'B-Roll': '#3b82f6',
  'Text Overlay': '#f59e0b',
  'Screen Recording': '#06b6d4',
}

const SECTION_COLORS: Record<string, string> = {
  '[HOOK]': '#ec4899',
  '[SETUP]': '#3b82f6',
  '[BODY]': '#06b6d4',
  '[CTA]': '#10b981',
}

const MARKER_COLORS: Record<string, string> = {
  '[PAUSE]': '#6b7a9a',
  '[ENERGY UP]': '#f59e0b',
  '[CUT TO B-ROLL]': '#3b82f6',
  '[ZOOM IN]': '#ec4899',
  '[LOWER THIRDS]': '#10b981',
}

const THUMB_STYLE_COLORS: Record<ThumbnailConcept['style'], string> = {
  'Face Reaction': '#ec4899',
  'Text-heavy': '#f59e0b',
  'Curiosity Gap': '#06b6d4',
}

const CHAPTER_COLORS = ['#a78bfa', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899']

const springConfig = { type: 'spring' as const, stiffness: 300, damping: 28 }

// ── Fallback demo data ────────────────────────────────────────────────────────

const DEMO_BRIEF: BriefOutput = {
  hooks: [
    {
      style: 'Curiosity Gap',
      text: "I hit 10K followers on Instagram in 47 days — but the strategy I used is something nobody teaches. And it has nothing to do with Reels.",
    },
    {
      style: 'Controversy / Bold Claim',
      text: "Posting daily is killing your Instagram growth. I went from 0 to 10K by posting just 3 times a week, and here's the data to prove it.",
    },
    {
      style: 'Value-first',
      text: "I'll show you the exact 5-step system I used to grow from 0 to 10,000 real followers on Instagram — no ads, no follow-for-follow, and no viral luck required.",
    },
  ],
  shots: [
    { number: 1, type: 'Talking Head', description: 'Creator at desk, energetic intro, slight lean forward', duration: '10s' },
    { number: 2, type: 'Screen Recording', description: 'Instagram profile showing follower count jumping from 0 to 10K', duration: '8s' },
    { number: 3, type: 'B-Roll', description: 'Close-up of phone showing Instagram analytics dashboard', duration: '5s' },
    { number: 4, type: 'Talking Head', description: 'Explaining the niche-clarity framework, use whiteboard or text pop-ups', duration: '45s' },
    { number: 5, type: 'Text Overlay', description: '"5 Steps" title card with animated bullet points', duration: '4s' },
    { number: 6, type: 'Screen Recording', description: 'Live demo of writing a caption using the hook formula', duration: '20s' },
    { number: 7, type: 'B-Roll', description: 'Engagement screenshots — comments, DMs, saves on posts', duration: '6s' },
    { number: 8, type: 'Talking Head', description: 'CTA — direct eye contact, warm smile, strong ask', duration: '15s' },
  ],
  scriptSections: [
    {
      label: '[HOOK]',
      content: "0 to 10,000 followers. 47 days. No ads. If you stay till the end, I'll give you the exact 5-step system — free.",
      markers: ['[ENERGY UP]', '[ZOOM IN]'],
    },
    {
      label: '[SETUP]',
      content: "When I started, I was posting random content every day and getting zero traction. Sound familiar? The problem wasn't consistency — it was that I had no clarity on WHO I was talking to or WHAT they actually wanted.",
      markers: ['[PAUSE]', '[CUT TO B-ROLL]'],
    },
    {
      label: '[BODY]',
      content: "Step 1: Niche down until it hurts. Step 2: Study the top 10 creators in your niche and find the gap. Step 3: Use the 3-2-1 content formula — 3 educational posts, 2 entertaining, 1 personal. Step 4: Optimise your bio as a landing page, not a résumé. Step 5: Comment 10 thoughtful comments a day before posting.",
      markers: ['[LOWER THIRDS]', '[CUT TO B-ROLL]', '[ENERGY UP]'],
    },
    {
      label: '[CTA]',
      content: "If you want the full 47-day content calendar I used, comment 'GROWTH' below and I'll DM it to you. And if this helped, subscribe — I post new creator strategy every Tuesday.",
      markers: ['[PAUSE]', '[ENERGY UP]'],
    },
  ],
  thumbnails: [
    {
      style: 'Face Reaction',
      visualDescription: 'Creator with jaw-drop expression, bright background, pointing at number graphic on right side',
      textOverlay: '0 → 10K in 47 Days',
    },
    {
      style: 'Text-heavy',
      visualDescription: 'Dark background, bold white typography dominating, small creator photo in corner',
      textOverlay: 'The 5-Step System Nobody Teaches',
    },
    {
      style: 'Curiosity Gap',
      visualDescription: 'Split layout: left side shows "Before" (empty profile), right side blurred "After" with big question mark',
      textOverlay: 'I Did This for 47 Days...',
    },
  ],
  chapters: [
    { timestamp: '0:00', title: 'Intro — The 47-Day Challenge' },
    { timestamp: '1:15', title: 'Why Most People Fail at Instagram Growth' },
    { timestamp: '3:30', title: 'The 5-Step System (Full Breakdown)' },
    { timestamp: '8:45', title: 'Real Results & Analytics Walkthrough' },
    { timestamp: '11:20', title: 'Recap & Free Content Calendar Giveaway' },
  ],
}

// ── AI Prompt ─────────────────────────────────────────────────────────────────

function buildPrompt(
  topic: string,
  platform: VideoPlatform,
  duration: VideoDuration,
  audience: string,
  useContentDNA: boolean,
  niche?: string,
  dnaHints?: string,
): string {
  return `You are a world-class video producer and content strategist. Generate a complete video production brief for the following:

Topic: "${topic}"
Platform: ${platform}
Duration: ${duration}
Target Audience: ${audience}
${useContentDNA && niche ? `Creator Niche: ${niche}` : ''}
${useContentDNA && dnaHints ? `Content DNA / Voice: ${dnaHints}` : ''}

Return a JSON object with EXACTLY this structure (no extra keys, no markdown fences):
{
  "hooks": [
    { "style": "Curiosity Gap", "text": "..." },
    { "style": "Controversy / Bold Claim", "text": "..." },
    { "style": "Value-first", "text": "..." }
  ],
  "shots": [
    { "number": 1, "type": "Talking Head", "description": "...", "duration": "10s" },
    ...6-8 shots total, types from: Talking Head | B-Roll | Text Overlay | Screen Recording
  ],
  "scriptSections": [
    { "label": "[HOOK]", "content": "...", "markers": ["[ENERGY UP]"] },
    { "label": "[SETUP]", "content": "...", "markers": ["[PAUSE]", "[CUT TO B-ROLL]"] },
    { "label": "[BODY]", "content": "...", "markers": ["[LOWER THIRDS]", "[CUT TO B-ROLL]"] },
    { "label": "[CTA]", "content": "...", "markers": ["[PAUSE]", "[ENERGY UP]"] }
  ],
  "thumbnails": [
    { "style": "Face Reaction", "visualDescription": "...", "textOverlay": "..." },
    { "style": "Text-heavy", "visualDescription": "...", "textOverlay": "..." },
    { "style": "Curiosity Gap", "visualDescription": "...", "textOverlay": "..." }
  ],
  "chapters": [
    { "timestamp": "0:00", "title": "Intro" },
    ...4 more chapters with realistic timestamps for a ${duration} video
  ]
}

Make hooks punchy and platform-native for ${platform}. Keep script content tight for ${duration} run-time. Make thumbnail text extremely short (5-7 words max).`
}

// ── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ color, icon, title }: { color: string; icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
        fontSize: 13, color, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {title}
      </h3>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function VideoBriefStudio() {
  const { profile, contentDNA, addIdea } = useStore()

  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<VideoPlatform>('YouTube Long-form')
  const [duration, setDuration] = useState<VideoDuration>('10 min')
  const [audience, setAudience] = useState('')
  const [useContentDNA, setUseContentDNA] = useState(false)
  const [loading, setLoading] = useState(false)
  const [brief, setBrief] = useState<BriefOutput | null>(null)

  async function generateBrief() {
    if (!topic.trim()) {
      toast.error('Please enter a video topic', { style: { background: '#0d0d1a', color: '#f0f4ff' } })
      return
    }

    const apiKey = profile?.apiKey
    if (!apiKey) {
      setBrief(DEMO_BRIEF)
      toast('Showing demo brief — add your API key in settings for AI generation', {
        icon: '💡',
        style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(245,158,11,0.3)' },
      })
      return
    }

    setLoading(true)
    setBrief(null)

    const dnaHints = contentDNA?.toneFingerprint?.join(', ')

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
            content: buildPrompt(topic, platform, duration, audience || 'general audience', useContentDNA, profile?.niche, dnaHints),
          }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as BriefOutput
        setBrief(parsed)
        toast.success('Production brief ready!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      toast.error('AI error — showing demo brief', { style: { background: '#0d0d1a', color: '#f0f4ff' } })
      setBrief(DEMO_BRIEF)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveIdea() {
    if (!brief) return
    addIdea({
      id: Math.random().toString(36).slice(2),
      title: topic || 'Untitled Video Brief',
      hook: brief.hooks[0]?.text || '',
      contentType: platform.includes('Short') || platform === 'Instagram Reel' || platform === 'TikTok' ? 'reel' : 'video',
      platforms: platform === 'Instagram Reel' ? ['instagram'] : platform === 'LinkedIn' ? ['linkedin'] : platform === 'TikTok' ? ['instagram'] : ['youtube'],
      aiScore: 8.5,
      scoreBreakdown: { hookStrength: 9, nicheRelevance: 8, trendAlignment: 8, engagementPotential: 9, channelFit: 8, uniqueness: 8 },
      status: 'inbox',
      source: 'ai_generated',
      tags: ['brief', platform.toLowerCase().replace(/ /g, '-')],
      createdAt: new Date().toISOString(),
    })
    toast.success('Saved to Idea Engine!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
  }

  function buildChaptersText(): string {
    if (!brief) return ''
    return brief.chapters.map((c) => `${c.timestamp} - ${c.title}`).join('\n')
  }

  return (
    <div style={{ padding: '24px 28px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800,
          fontSize: 24, color: '#f0f4ff', marginBottom: 4, letterSpacing: '-0.02em',
        }}>
          Video Brief Studio
        </h1>
        <p style={{ fontSize: 13, color: '#6b7a9a', lineHeight: 1.5 }}>
          Generate a full production package — hooks, shot list, script outline, thumbnails & chapters — in seconds.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* ── Left Panel ─────────────────────────────────── */}
        <div style={{
          width: 380, flexShrink: 0,
          background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)',
          borderRadius: 16, padding: '22px 20px',
          position: 'sticky', top: 0,
        }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Video Topic</label>
            <input
              className="field"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How I made ₹1L in 30 days on YouTube"
              onKeyDown={(e) => e.key === 'Enter' && generateBrief()}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Platform</label>
            <div style={{ position: 'relative' }}>
              <select
                className="field"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as VideoPlatform)}
                style={{ appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
              >
                {(['YouTube Long-form', 'YouTube Short', 'Instagram Reel', 'TikTok', 'LinkedIn'] as VideoPlatform[]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#4b5680', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Video Duration</label>
            <div style={{ position: 'relative' }}>
              <select
                className="field"
                value={duration}
                onChange={(e) => setDuration(e.target.value as VideoDuration)}
                style={{ appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
              >
                {(['30s', '1 min', '3 min', '10 min', '20 min'] as VideoDuration[]).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: '#4b5680', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Target Audience</label>
            <input
              className="field"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Beginner freelancers in India"
            />
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', marginBottom: 22,
            padding: '10px 12px', borderRadius: 10,
            background: useContentDNA ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${useContentDNA ? 'rgba(236,72,153,0.25)' : 'rgba(59,130,246,0.1)'}`,
            transition: 'all 150ms ease',
          }}>
            <input
              type="checkbox"
              checked={useContentDNA}
              onChange={(e) => setUseContentDNA(e.target.checked)}
              style={{ accentColor: '#ec4899', width: 15, height: 15 }}
            />
            <span style={{ fontSize: 13, color: useContentDNA ? '#ec4899' : '#94a3b8', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Use my Content DNA
            </span>
            {profile?.niche && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                {profile.niche.slice(0, 14)}
              </span>
            )}
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={springConfig}
            className="btn-pink"
            style={{
              width: '100%', padding: '13px 20px', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: 12,
            }}
            onClick={generateBrief}
            disabled={loading}
          >
            {loading
              ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Wand2 size={15} />}
            {loading ? 'Generating Brief...' : 'Generate Full Brief'}
          </motion.button>

          {brief && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="btn-ghost"
              style={{
                width: '100%', marginTop: 10, padding: '10px 20px', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
              onClick={handleSaveIdea}
            >
              <Save size={13} />
              Save as Content Idea
            </motion.button>
          )}
        </div>

        {/* ── Right Panel ────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence>
            {!brief && !loading && (
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
                  <Clapperboard size={26} color="#ec4899" />
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 17, color: '#f0f4ff', marginBottom: 8 }}>
                  Your production brief will appear here
                </h3>
                <p style={{ fontSize: 13, color: '#4b5680', maxWidth: 320, margin: '0 auto' }}>
                  Fill in the topic and platform, then click "Generate Full Brief" to get a complete production package.
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
                <RefreshCw size={32} color="#ec4899" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block' }} />
                <p style={{ fontSize: 14, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Crafting your production brief...
                </p>
              </motion.div>
            )}

            {brief && !loading && (
              <motion.div key="brief" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Section 1: Hook Variants */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: 0 }}
                  className="card" style={{ padding: '20px 22px' }}
                >
                  <SectionHeader color="#ec4899" icon={<Mic size={14} />} title="Hook Variants" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {brief.hooks.map((hook, i) => (
                      <div key={i} style={{
                        background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.15)',
                        borderRadius: 12, padding: '14px 14px 12px',
                        display: 'flex', flexDirection: 'column', gap: 10,
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, color: '#ec4899',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          {String.fromCharCode(65 + i)}: {hook.style}
                        </span>
                        <p style={{ fontSize: 12, color: '#c4cde0', lineHeight: 1.55, flex: 1 }}>
                          "{hook.text}"
                        </p>
                        <CopyButton text={hook.text} label="Use This Hook" />
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Section 2: Shot List */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: 0.06 }}
                  className="card" style={{ padding: '20px 22px' }}
                >
                  <SectionHeader color="#3b82f6" icon={<Film size={14} />} title="Shot List" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {brief.shots.map((shot) => (
                      <div key={shot.number} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(59,130,246,0.08)',
                      }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                          background: 'rgba(59,130,246,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#3b82f6', fontWeight: 700,
                        }}>
                          {shot.number}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                              background: `${SHOT_TYPE_COLORS[shot.type]}15`,
                              color: SHOT_TYPE_COLORS[shot.type],
                            }}>
                              {SHOT_TYPE_ICONS[shot.type]} {shot.type}
                            </span>
                            <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace', marginLeft: 'auto' }}>
                              {shot.duration}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.45 }}>{shot.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Section 3: Script Outline */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: 0.12 }}
                  className="card" style={{ padding: '20px 22px' }}
                >
                  <SectionHeader color="#06b6d4" icon={<BookOpen size={14} />} title="Script Outline" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {brief.scriptSections.map((sec, i) => {
                      const sectionColor = SECTION_COLORS[sec.label] || '#94a3b8'
                      return (
                        <div key={i} style={{
                          borderRadius: 12,
                          background: `${sectionColor}08`,
                          border: `1px solid ${sectionColor}20`,
                          padding: '14px 16px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 800, color: sectionColor,
                              fontFamily: 'Space Mono, monospace',
                            }}>
                              {sec.label}
                            </span>
                            {sec.markers.map((m) => (
                              <span key={m} style={{
                                fontSize: 10, padding: '1px 7px', borderRadius: 20,
                                background: `${MARKER_COLORS[m] || '#6b7a9a'}18`,
                                color: MARKER_COLORS[m] || '#6b7a9a',
                                fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                              }}>
                                {m}
                              </span>
                            ))}
                          </div>
                          <p style={{ fontSize: 13, color: '#c4cde0', lineHeight: 1.6 }}>{sec.content}</p>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Section 4: Thumbnail Concepts */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: 0.18 }}
                  className="card" style={{ padding: '20px 22px' }}
                >
                  <SectionHeader color="#f59e0b" icon={<Image size={14} />} title="Thumbnail Concepts" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {brief.thumbnails.map((thumb, i) => {
                      const tc = THUMB_STYLE_COLORS[thumb.style]
                      return (
                        <div key={i} style={{
                          background: `${tc}06`, border: `1px solid ${tc}20`,
                          borderRadius: 12, padding: '14px',
                          display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, color: tc,
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                          }}>
                            {thumb.style}
                          </span>
                          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
                            {thumb.visualDescription}
                          </p>
                          <div style={{
                            background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 10px',
                            border: `1px solid ${tc}18`,
                          }}>
                            <span style={{ fontSize: 10, color: '#4b5680', display: 'block', marginBottom: 2 }}>TEXT OVERLAY</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                              {thumb.textOverlay}
                            </span>
                          </div>
                          <CopyButton
                            text={`Thumbnail: ${thumb.style}\nVisual: ${thumb.visualDescription}\nText overlay: ${thumb.textOverlay}`}
                            label="Copy Prompt"
                          />
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Section 5: YouTube Chapters */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springConfig, delay: 0.24 }}
                  className="card" style={{ padding: '20px 22px' }}
                >
                  <SectionHeader color="#10b981" icon={<List size={14} />} title="YouTube Chapters" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {brief.chapters.map((ch, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '9px 14px', borderRadius: 9,
                        background: 'rgba(16,185,129,0.04)',
                        border: '1px solid rgba(16,185,129,0.08)',
                      }}>
                        <span style={{
                          fontSize: 12, fontFamily: 'Space Mono, monospace',
                          color: CHAPTER_COLORS[i % CHAPTER_COLORS.length], fontWeight: 700,
                          minWidth: 44,
                        }}>
                          {ch.timestamp}
                        </span>
                        <span style={{ fontSize: 13, color: '#c4cde0' }}>{ch.title}</span>
                      </div>
                    ))}
                  </div>
                  <CopyButton text={buildChaptersText()} label="Copy for YouTube Description" />
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
}
