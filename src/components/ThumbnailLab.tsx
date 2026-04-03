import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { getResolvedAIKey } from '../utils/aiKey'
import {
  Image, Sparkles, RefreshCw, Copy, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, Lightbulb,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────
type Platform = 'YouTube' | 'Instagram' | 'TikTok' | 'LinkedIn'
type CTRLevel = 'High' | 'Medium' | 'Low'

interface ThumbnailConcept {
  id: string
  style: 'Face Reaction' | 'Listicle / Text-heavy' | 'Curiosity Gap'
  styleBadgeColor: string
  visualDescription: string
  headline: string
  subText: string
  colorUsage: string
  ctrLevel: CTRLevel
  ctrReason: string
  aiImagePrompt: string
}

interface AlignmentScore {
  score: number
  titlePromises: string
  thumbnailCommunicates: string
}

// ── Demo data ─────────────────────────────────────────────────────────
const DEMO_TITLE = 'I quit my job to become a full-time creator (here\'s what happened)'

const DEMO_CONCEPTS: ThumbnailConcept[] = [
  {
    id: '1',
    style: 'Face Reaction',
    styleBadgeColor: '#ec4899',
    visualDescription:
      'Full-bleed creator face on the right half showing genuine surprise/shock — wide eyes, mouth slightly open. Left half is a deep navy background with bold white "I QUIT" text and a torn paper effect. Small office desk visual fades in bottom-left corner. Strong depth-of-field on face, blurred background.',
    headline: 'I QUIT',
    subText: 'Here\'s What Happened Next',
    colorUsage: 'Use deep navy (#0a0a2e) background with bright white overlay text, pink (#ec4899) accent on sub-text',
    ctrLevel: 'High',
    ctrReason: 'Emotional face + short power word creates instant curiosity loop',
    aiImagePrompt:
      'Midjourney: Creator face close-up, shocked expression, soft studio bokeh background, warm rim light, navy left half with torn paper texture, bold white "I QUIT" typography, professional editorial portrait, --ar 16:9 --style raw --v 6.1 --q 2\n\nDALL-E: A young professional creator in casual clothes with a shocked, wide-eyed expression taking up the right half of a 16:9 frame. Left side is deep navy with bold white text "I QUIT" and a subtle torn paper effect. Film grain overlay, editorial photography style.',
  },
  {
    id: '2',
    style: 'Listicle / Text-heavy',
    styleBadgeColor: '#3b82f6',
    visualDescription:
      'Split-screen layout: left side dark card with a numbered timeline (Month 1, Month 3, Month 6, Month 12) with short stat lines in monospace. Right side uses a bright warm gradient with creator\'s name/channel logo. Large bold "12 MONTHS LATER" heading at top. Clean, minimal, structured like an infographic. No face required.',
    headline: '12 MONTHS LATER',
    subText: '5 things nobody tells you',
    colorUsage: 'Use #3b82f6 (blue) for number accents and timeline dots, #ec4899 (pink) for the stat highlights on dark bg',
    ctrLevel: 'Medium',
    ctrReason: 'Clear promise of valuable info — attracts planning-mindset viewers but lacks raw emotion hook',
    aiImagePrompt:
      'Midjourney: Dark OLED split-screen YouTube thumbnail, left panel shows timeline infographic with 4 milestones, electric blue accent numbers, right panel bright warm amber gradient, bold white sans-serif "12 MONTHS LATER" heading, minimal clean design, no people, data visualization aesthetic --ar 16:9 --v 6.1\n\nDALL-E: A clean, dark 16:9 YouTube thumbnail design. Left half shows a sleek timeline infographic with 4 milestone cards in dark navy. Right half has a warm amber-to-orange gradient. Large bold white text "12 MONTHS LATER" at top. Electric blue accent dots on timeline. Minimal, modern infographic style.',
  },
  {
    id: '3',
    style: 'Curiosity Gap',
    styleBadgeColor: '#f59e0b',
    visualDescription:
      'High-contrast dramatic split: top 60% shows a glowing laptop screen and stack of money/income charts in soft golden light — aspirational. Bottom 40% shows a person sitting in an empty plain office chair from behind, subtle and lonely. Red arrow connecting the two zones. Big question "WORTH IT?" in the center gap with a glowing outline. Creates a visual riddle that demands a click.',
    headline: 'WORTH IT?',
    subText: 'After 12 months of full-time creating',
    colorUsage: 'Use dark charcoal (#1a1a2e) base with #f59e0b (amber) golden glow for the aspirational top zone',
    ctrLevel: 'High',
    ctrReason: 'Unresolved visual tension forces the viewer to click to resolve the "was it worth it?" question',
    aiImagePrompt:
      'Midjourney: YouTube thumbnail dramatic split composition, top half glowing golden laptop with income chart on screen, soft money/cash in background, warm amber glow, bottom half dark empty office chair from behind, moody low light, bold red question mark "WORTH IT?" text centered between zones, cinematic dramatic lighting, dark vignette edges --ar 16:9 --style raw --v 6.1\n\nDALL-E: A dramatic 16:9 YouTube thumbnail with high contrast vertical split. Top 60% shows a glowing gold laptop with an earnings chart and soft warm amber lighting suggesting success. Bottom 40% is moody dark, showing an empty office chair from behind. Large bold white text "WORTH IT?" centered with a subtle red glow outline. Cinematic, contemplative mood.',
  },
]

const DEMO_ALIGNMENT: AlignmentScore = {
  score: 8.5,
  titlePromises: 'a personal story with surprising outcomes',
  thumbnailCommunicates: 'high stakes emotion and a transformation journey',
}

const PLATFORM_TIPS: Record<Platform, string[]> = {
  YouTube: [
    'Use faces with strong emotion — they get 38% higher CTR on average',
    'Keep text to 3–5 words max; viewers see thumbnails at ~120px wide',
    'High contrast between subject and background is critical — test on dark AND light mode',
    'Bright warm colors (yellow, orange, red) outperform cool tones on YouTube search',
    'Include a visual "promise" — show the outcome, not the process',
    'A/B test with YouTube Studio\'s built-in thumbnail testing tool',
  ],
  Instagram: [
    'Square (1:1) crops get the most grid real estate — design for center-safe',
    'Cohesive grid palette matters — single thumbnails are judged as a collection',
    'Bold typography is more important than face here — text hooks drive saves',
    'Carousel covers get tapped 3x more when they show a numbered sequence',
    'High saturation performs better in the explore feed vs. organic grid',
    'Test both the Reels cover (9:16) and the square crop simultaneously',
  ],
  TikTok: [
    'Cover frames must tell the full story in 1 second — no text is often better',
    'Use natural in-video moments as covers, not staged thumbnails',
    'Text overlay on Reels covers: keep to one punchy line, 24px+ font',
    'Faces with direct camera eye-contact drive the strongest for-you-page CTR',
    'Color pops and unexpected visuals outperform polished/branded thumbnails',
    'First 0.2 seconds of video determines cover auto-select — nail your opening frame',
  ],
  LinkedIn: [
    'Professional, well-lit headshots as thumbnail anchor outperform graphics 2:1',
    'Dark backgrounds with light text read best in LinkedIn\'s mostly-white feed',
    'Include numbers in the visual — data-driven thumbnails build authority',
    'Keep branding subtle; overly corporate thumbnails feel like ads and get scrolled',
    'Portrait crops (4:5) perform better than landscape for LinkedIn native video',
    'Industry-specific visuals (office, laptop, charts) boost professional credibility',
  ],
}

// ── Sub-components ────────────────────────────────────────────────────

function CTRPill({ level }: { level: CTRLevel }) {
  const config = {
    High:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <TrendingUp size={11} /> },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Minus size={11} /> },
    Low:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <TrendingDown size={11} /> },
  }[level]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px',
      borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
      color: config.color, background: config.bg, border: `1px solid ${config.color}33`,
    }}>
      {config.icon} CTR: {level}
    </span>
  )
}

function ThumbnailMockup({ concept, primaryColor, accentColor }: {
  concept: ThumbnailConcept
  primaryColor: string
  accentColor: string
}) {
  return (
    <div style={{
      width: '100%', paddingBottom: '56.25%', position: 'relative',
      borderRadius: 10, overflow: 'hidden',
      background: `linear-gradient(135deg, ${primaryColor}dd 0%, ${primaryColor}88 60%, ${accentColor}55 100%)`,
      border: `1px solid ${accentColor}33`,
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '12px 16px', textAlign: 'center' }}>
        {/* Decorative top-right badge */}
        <div style={{
          position: 'absolute', top: 8, right: 10,
          background: `${accentColor}cc`, borderRadius: 4, padding: '2px 7px',
          fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: 'Space Mono, monospace',
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {concept.style}
        </div>
        {/* Decorative BG shape */}
        <div style={{
          position: 'absolute', bottom: -20, left: -20, width: 120, height: 120,
          borderRadius: '50%', background: `${accentColor}22`,
        }} />
        <div style={{
          position: 'absolute', top: -30, right: -10, width: 90, height: 90,
          borderRadius: '50%', background: `${primaryColor}33`,
        }} />
        {/* Headline */}
        <div style={{
          fontSize: 22, fontWeight: 900, color: '#ffffff', lineHeight: 1.1,
          textShadow: '0 2px 12px rgba(0,0,0,0.7)', letterSpacing: '-0.02em',
          fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative',
          maxWidth: '85%', textAlign: 'center',
        }}>
          {concept.headline}
        </div>
        {/* Sub-text */}
        <div style={{
          fontSize: 10, fontWeight: 600, color: `${accentColor === '#f0f4ff' ? '#f0f4ff' : accentColor}ee`,
          marginTop: 6, fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative',
          textShadow: '0 1px 6px rgba(0,0,0,0.8)', maxWidth: '80%', textAlign: 'center',
          lineHeight: 1.4,
        }}>
          {concept.subText}
        </div>
      </div>
    </div>
  )
}

function ConceptCard({ concept, primaryColor, accentColor, onRegenerateVariant }: {
  concept: ThumbnailConcept
  primaryColor: string
  accentColor: string
  onRegenerateVariant: (id: string) => void
}) {
  const [promptOpen, setPromptOpen] = useState(false)
  const [variantSpinning, setVariantSpinning] = useState(false)

  function copyPrompt() {
    navigator.clipboard.writeText(concept.aiImagePrompt).then(() => toast.success('AI prompt copied!'))
  }

  function handleVariant() {
    setVariantSpinning(true)
    setTimeout(() => {
      setVariantSpinning(false)
      onRegenerateVariant(concept.id)
    }, 900)
  }

  const badgeBg = concept.styleBadgeColor + '20'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="card"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          color: concept.styleBadgeColor, background: badgeBg,
          border: `1px solid ${concept.styleBadgeColor}33`,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
        }}>
          {concept.style}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <CTRPill level={concept.ctrLevel} />
        </div>
      </div>

      {/* Mockup */}
      <ThumbnailMockup concept={concept} primaryColor={primaryColor} accentColor={accentColor} />

      {/* Headline display */}
      <div>
        <div style={lbl}>Headline Text</div>
        <div style={{
          fontSize: 17, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em',
          fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.2,
        }}>
          {concept.headline}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {concept.subText}
        </div>
      </div>

      {/* Visual description */}
      <div>
        <div style={lbl}>Visual Composition</div>
        <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.65, margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {concept.visualDescription}
        </p>
      </div>

      {/* Color usage */}
      <div style={{
        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#94a3b8',
        fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.5,
      }}>
        <span style={{ color: '#3b82f6', fontWeight: 700 }}>Color: </span>
        {concept.colorUsage}
      </div>

      {/* CTR reason */}
      <div style={{ fontSize: 12, color: '#6b7a9a', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <TrendingUp size={11} style={{ display: 'inline', marginRight: 5, color: '#10b981' }} />
        {concept.ctrReason}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={() => setPromptOpen((v) => !v)}
          className="btn btn-ghost btn-sm"
          style={{ gap: 6, flex: 1 }}
        >
          <Sparkles size={13} />
          AI Image Prompt
          {promptOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button
          onClick={handleVariant}
          disabled={variantSpinning}
          className="btn btn-ghost btn-sm"
          style={{ gap: 6 }}
        >
          <RefreshCw size={13} style={{ transition: 'transform 600ms', transform: variantSpinning ? 'rotate(360deg)' : 'rotate(0deg)' }} />
          A/B Variant
        </button>
      </div>

      {/* AI Prompt drawer */}
      <AnimatePresence>
        {promptOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Midjourney / DALL-E Prompt
                </span>
                <button onClick={copyPrompt} className="btn btn-ghost btn-xs" style={{ gap: 4 }}>
                  <Copy size={11} /> Copy
                </button>
              </div>
              <pre style={{
                fontSize: 11.5, color: '#94a3b8', lineHeight: 1.7, margin: 0,
                fontFamily: 'Space Mono, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {concept.aiImagePrompt}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AlignmentMeter({ score, titlePromises, thumbnailCommunicates }: AlignmentScore) {
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444'
  const pct = (score / 10) * 100

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Title–Thumbnail Alignment Score
        </div>
        <div style={{
          fontSize: 20, fontWeight: 900, color, fontFamily: 'Space Mono, monospace', letterSpacing: '-0.04em',
        }}>
          {score.toFixed(1)}<span style={{ fontSize: 12, color: '#4b5680' }}>/10</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 30, delay: 0.3 }}
          style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
        />
      </div>
      <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.65, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Your title promises{' '}
        <span style={{ color: '#f0f4ff', fontWeight: 600 }}>{titlePromises}</span>
        {', '}your thumbnail communicates{' '}
        <span style={{ color: '#f0f4ff', fontWeight: 600 }}>{thumbnailCommunicates}</span>.{' '}
        Alignment: <span style={{ color, fontWeight: 700 }}>{score.toFixed(1)}/10</span>
      </p>
    </div>
  )
}

function BestPracticeTips({ platform }: { platform: Platform }) {
  const [open, setOpen] = useState(true)
  const tips = PLATFORM_TIPS[platform]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        }}
      >
        <Lightbulb size={15} color="#f59e0b" />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif', flex: 1 }}>
          {platform} Thumbnail Best Practices
        </span>
        {open ? <ChevronUp size={14} color="#4b5680" /> : <ChevronDown size={14} color="#4b5680" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    minWidth: 20, height: 20, borderRadius: 6, background: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#f59e0b',
                    fontFamily: 'Space Mono, monospace', marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 12.5, color: '#94a3b8', margin: 0, lineHeight: 1.6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export function ThumbnailLab() {
  const { profile } = useStore()

  const [videoTitle, setVideoTitle] = useState('')
  const [description, setDescription] = useState('')
  const [platform, setPlatform] = useState<Platform>('YouTube')
  const [niche, setNiche] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [accentColor, setAccentColor] = useState('#ec4899')
  const [hasFace, setHasFace] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [concepts, setConcepts] = useState<ThumbnailConcept[]>([])
  const [alignment, setAlignment] = useState<AlignmentScore | null>(null)
  const [variantLoadingId, setVariantLoadingId] = useState<string | null>(null)

  const PLATFORMS: Platform[] = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn']

  const buildPrompt = useCallback(() => {
    const title = videoTitle.trim() || DEMO_TITLE
    return `You are an elite YouTube/social media thumbnail strategist. Generate exactly 3 thumbnail concepts and an alignment score for this video.

Video Title: "${title}"
Description: "${description.trim() || 'a personal story about quitting a job to become a full-time creator'}"
Platform: ${platform}
Channel Niche/Style: "${niche.trim() || 'personal development and creator economy'}"
Primary Color: ${primaryColor}
Accent Color: ${accentColor}
Has Face/Person: ${hasFace}

Return ONLY valid JSON in this exact format:
{
  "concepts": [
    {
      "id": "1",
      "style": "Face Reaction",
      "styleBadgeColor": "#ec4899",
      "visualDescription": "detailed visual layout description (2-3 sentences)",
      "headline": "SHORT POWER TEXT",
      "subText": "supporting context line",
      "colorUsage": "specific color instructions using the provided colors",
      "ctrLevel": "High",
      "ctrReason": "one-liner reason",
      "aiImagePrompt": "Full Midjourney prompt with --ar 16:9 --v 6.1 parameters AND a DALL-E natural language description, separated clearly"
    },
    {
      "id": "2",
      "style": "Listicle / Text-heavy",
      "styleBadgeColor": "#3b82f6",
      "visualDescription": "...",
      "headline": "...",
      "subText": "...",
      "colorUsage": "...",
      "ctrLevel": "Medium",
      "ctrReason": "...",
      "aiImagePrompt": "..."
    },
    {
      "id": "3",
      "style": "Curiosity Gap",
      "styleBadgeColor": "#f59e0b",
      "visualDescription": "...",
      "headline": "...",
      "subText": "...",
      "colorUsage": "...",
      "ctrLevel": "High",
      "ctrReason": "...",
      "aiImagePrompt": "..."
    }
  ],
  "alignment": {
    "score": 8.5,
    "titlePromises": "brief description of what the title promises",
    "thumbnailCommunicates": "brief description of what the thumbnails communicate"
  }
}`
  }, [videoTitle, description, platform, niche, primaryColor, accentColor, hasFace])

  async function generate() {
    setGenerating(true)
    setConcepts([])
    setAlignment(null)

    const apiKey = getResolvedAIKey()
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 1400))
      setConcepts(DEMO_CONCEPTS)
      setAlignment(DEMO_ALIGNMENT)
      setGenerating(false)
      toast.success('3 thumbnail concepts ready (demo mode)')
      return
    }

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
          messages: [{ role: 'user', content: buildPrompt() }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.concepts && Array.isArray(parsed.concepts)) {
          setConcepts(parsed.concepts as ThumbnailConcept[])
          if (parsed.alignment) setAlignment(parsed.alignment as AlignmentScore)
          toast.success('3 thumbnail concepts generated!')
        } else {
          throw new Error('Bad response shape')
        }
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      toast.error('Generation failed — showing demo concepts')
      setConcepts(DEMO_CONCEPTS)
      setAlignment(DEMO_ALIGNMENT)
    } finally {
      setGenerating(false)
    }
  }

  function handleRegenerateVariant(id: string) {
    setVariantLoadingId(id)
    setTimeout(() => {
      const idx = concepts.findIndex((c) => c.id === id)
      if (idx === -1) { setVariantLoadingId(null); return }
      const original = concepts[idx]
      const twist = ['with dramatic lighting twist', 'with high-contrast black/white accent', 'with bold neon palette shift'][idx % 3]
      const updated: ThumbnailConcept = {
        ...original,
        headline: original.headline + (idx === 0 ? ' (REAL STORY)' : idx === 1 ? ' — MONTH BY MONTH' : ' (SPOILER)'),
        subText: original.subText + ` ${twist}`,
        ctrReason: `Variant ${twist} — ${original.ctrReason}`,
      }
      const newConcepts = [...concepts]
      newConcepts[idx] = updated
      setConcepts(newConcepts)
      setVariantLoadingId(null)
      toast.success('A/B variant generated!')
    }, 900)
  }

  const showResults = concepts.length > 0

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Thumbnail Lab
        </h1>
        <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          AI-powered thumbnail concepts and CTR optimizer — stop losing views to bad thumbnails
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── Left Panel ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Video Title */}
          <div>
            <label style={lbl}>Video Title</label>
            <input
              className="field"
              placeholder="e.g. I quit my job to become a full-time creator…"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Describe your video in one sentence</label>
            <input
              className="field"
              placeholder="What happens, who it's for, and the key takeaway…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Platform */}
          <div>
            <label style={lbl}>Platform</label>
            <select
              className="field"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              style={{ cursor: 'pointer' }}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Niche */}
          <div>
            <label style={lbl}>Channel niche / style</label>
            <input
              className="field"
              placeholder="e.g. Personal finance for millennials, travel vlogging…"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            />
          </div>

          {/* Color pickers */}
          <div>
            <label style={lbl}>Colors</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: '#6b7a9a', fontWeight: 600, marginBottom: 5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Primary
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>{primaryColor}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: '#6b7a9a', fontWeight: 600, marginBottom: 5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Accent
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '6px 10px' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }}
                  />
                  <span style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>{accentColor}</span>
                </div>
              </div>
            </div>
            {/* Color preview swatches */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <div style={{ flex: 1, height: 32, borderRadius: 6, background: primaryColor, border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, height: 32, borderRadius: 6, background: accentColor, border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ flex: 1, height: 32, borderRadius: 6, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          {/* Face checkbox */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '10px 14px', borderRadius: 10,
            background: hasFace ? 'rgba(236,72,153,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hasFace ? 'rgba(236,72,153,0.3)' : 'rgba(59,130,246,0.1)'}`,
            transition: 'all 150ms',
          }}>
            <input
              type="checkbox"
              checked={hasFace}
              onChange={(e) => setHasFace(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#ec4899' }}
            />
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              I have a face/person in the thumbnail
            </span>
          </label>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating}
            className="btn btn-pink"
            style={{ width: '100%', gap: 8, justifyContent: 'center', marginTop: 4 }}
          >
            {generating ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 0.9s linear infinite' }} />
                Generating concepts…
              </>
            ) : (
              <>
                <Image size={14} />
                Generate Thumbnail Concepts
              </>
            )}
          </button>

          {/* Demo hint */}
          {!profile?.apiKey && (
            <p style={{ fontSize: 11, color: '#4b5680', textAlign: 'center', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', lineHeight: 1.5 }}>
              No API key — showing demo concepts for the video "{DEMO_TITLE.slice(0, 40)}…"
            </p>
          )}
        </div>

        {/* ── Right Panel ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Empty state */}
          {!showResults && !generating && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '64px 24px', textAlign: 'center', color: '#4b5680',
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, marginBottom: 18,
                background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899',
              }}>
                <Image size={26} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7a9a', marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Your thumbnail concepts will appear here
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.65, maxWidth: 300, color: '#4b5680', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Fill in your video details and click Generate — you'll get 3 distinct thumbnail concepts with CTR predictions and Midjourney prompts.
              </div>
            </div>
          )}

          {/* Skeleton loading */}
          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card"
                  style={{ padding: 20 }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{ height: 22, width: 120, borderRadius: 20, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease infinite' }} />
                    <div style={{ height: 22, width: 80, borderRadius: 20, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.4s ease infinite', animationDelay: '0.2s' }} />
                  </div>
                  <div style={{ paddingBottom: '56.25%', background: 'rgba(255,255,255,0.04)', borderRadius: 10, position: 'relative', marginBottom: 14, animation: 'pulse 1.4s ease infinite' }} />
                  {[70, 90, 55, 80].map((w, j) => (
                    <div key={j} style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.05)', width: `${w}%`, marginBottom: 7, animation: 'pulse 1.4s ease infinite', animationDelay: `${j * 0.15}s` }} />
                  ))}
                </motion.div>
              ))}
            </div>
          )}

          {/* Results */}
          {showResults && !generating && (
            <>
              {/* Three concept cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {concepts.map((concept) => (
                  <ConceptCard
                    key={concept.id + (variantLoadingId === concept.id ? '-v' : '')}
                    concept={concept}
                    primaryColor={primaryColor}
                    accentColor={accentColor}
                    onRegenerateVariant={handleRegenerateVariant}
                  />
                ))}
              </div>

              {/* Alignment score */}
              {alignment && <AlignmentMeter {...alignment} />}

              {/* Best practice tips */}
              <BestPracticeTips platform={platform} />

              {/* Regenerate all */}
              <button onClick={generate} className="btn btn-ghost btn-sm" style={{ gap: 6, alignSelf: 'flex-start' }}>
                <RefreshCw size={13} /> Regenerate All Concepts
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared label style ────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif',
}
