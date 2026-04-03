import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Sparkles, Copy, RefreshCw, Wand2, Image, Video, Layers, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { getResolvedAIKey } from '../utils/aiKey'

// ── Types ────────────────────────────────────────────────────────────
type AITool = 'midjourney' | 'gemini' | 'stitch' | 'dalle' | 'stable-diffusion' | 'runway'
type ContentFormat = 'thumbnail' | 'reel-cover' | 'carousel-bg' | 'brand-visual' | 'product-shot' | 'portrait' | 'lifestyle' | 'text-overlay'

interface GeneratedPrompt {
  tool: AITool
  prompt: string
  negativePrompt?: string
  settings?: string
  useCase: string
}

// ── Tool Config ──────────────────────────────────────────────────────
const TOOL_META: Record<AITool, { label: string; color: string; bg: string; description: string; icon: string }> = {
  midjourney:       { label: 'Midjourney',        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  description: 'Photorealistic & artistic',   icon: '🎨' },
  gemini:           { label: 'Gemini Imagen',      color: '#10b981', bg: 'rgba(16,185,129,0.1)', description: 'Google AI image generation',   icon: '✨' },
  stitch:           { label: 'Stitch/Figma AI',    color: '#ec4899', bg: 'rgba(236,72,153,0.1)', description: 'UI & design mockups',          icon: '🖌️' },
  dalle:            { label: 'DALL-E 3',           color: '#f97316', bg: 'rgba(249,115,22,0.1)', description: 'OpenAI image generation',      icon: '🤖' },
  'stable-diffusion': { label: 'Stable Diffusion', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', description: 'Open source, fine-tunable', icon: '🌊' },
  runway:           { label: 'Runway Gen',         color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  description: 'Video & motion generation',    icon: '🎬' },
}

const FORMAT_META: Record<ContentFormat, { label: string; icon: React.ReactNode; aspect: string }> = {
  'thumbnail':    { label: 'YouTube Thumbnail',    icon: <Youtube />, aspect: '16:9' },
  'reel-cover':   { label: 'Reel/Short Cover',     icon: <Video size={14} />, aspect: '9:16' },
  'carousel-bg':  { label: 'Carousel Background',  icon: <Layers size={14} />, aspect: '1:1' },
  'brand-visual': { label: 'Brand Visual',         icon: <Sparkles size={14} />, aspect: '4:5' },
  'product-shot': { label: 'Product Shot',         icon: <Image size={14} />, aspect: '1:1' },
  'portrait':     { label: 'Creator Portrait',     icon: <Wand2 size={14} />, aspect: '4:5' },
  'lifestyle':    { label: 'Lifestyle Scene',      icon: <Image size={14} />, aspect: '3:2' },
  'text-overlay': { label: 'Text Overlay Visual',  icon: <Layers size={14} />, aspect: '9:16' },
}

function Youtube() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.13C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.13C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.13C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.75 15.5v-7l6.5 3.5-6.5 3.5z"/></svg> }

const STYLE_PRESETS = [
  'Cinematic dark moody', 'Bright airy pastel', 'Bold graphic pop art',
  'Luxury editorial', 'Raw documentary', 'Dreamy soft focus',
  'Urban street style', 'Clean minimal white', 'Neon cyberpunk',
  'Golden hour warm', 'Studio professional', 'Nature organic',
]

const DEMO_PROMPTS: Partial<Record<AITool, GeneratedPrompt>> = {
  midjourney: {
    tool: 'midjourney',
    prompt: 'Professional creator portrait, Indian woman, confident expression, warm natural light from window, shallow depth of field, Canon 5D look, muted earth tones wardrobe, blurred home office background with plants, editorial fashion photography, f/1.4 bokeh --ar 4:5 --style raw --v 6.1',
    negativePrompt: 'artificial light, harsh shadows, cluttered background, low quality, blurry',
    settings: '--ar 4:5 --style raw --v 6.1 --q 2',
    useCase: 'Perfect for profile pictures and brand visual identity',
  },
  gemini: {
    tool: 'gemini',
    prompt: 'A vibrant lifestyle flat lay composition featuring a smartphone, notebook, coffee cup, and succulent plant on a white marble surface, soft natural side lighting, top-down view, pastel pink and white color palette, minimalist aesthetic, high resolution product photography style',
    useCase: 'Great for Instagram carousel backgrounds and brand aesthetics',
  },
  stitch: {
    tool: 'stitch',
    prompt: 'Modern creator dashboard UI mockup, dark OLED background #080810, electric blue #3B82F6 accent color, card-based layout with analytics charts, gradient buttons, glass morphism effects, Plus Jakarta Sans font, mobile-responsive, professional SaaS design',
    useCase: 'Use for app mockups and promotional design visuals',
  },
}

// ── Main Component ────────────────────────────────────────────────────
export function VisualPromptGen() {
  const { profile } = useStore()
  const [selectedTools, setSelectedTools] = useState<AITool[]>(['midjourney', 'gemini'])
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('thumbnail')
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('')
  const [mood, setMood] = useState('')
  const [extras, setExtras] = useState('')
  const [generating, setGenerating] = useState(false)
  const [results, setResults] = useState<GeneratedPrompt[]>([])

  function toggleTool(tool: AITool) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  async function generate() {
    if (!topic.trim()) { toast.error('Describe your content topic first'); return }
    setGenerating(true)
    setResults([])

    const niche = profile?.niche || 'content creation'
    const name = profile?.name || 'creator'
    const tone = profile?.tone?.join(', ') || 'professional'

    const apiKey = getResolvedAIKey()
    if (!apiKey) {
      // Demo mode
      await new Promise((r) => setTimeout(r, 1200))
      const demos = selectedTools.map((tool) => {
        const base = DEMO_PROMPTS[tool]
        if (base) return base
        const meta = TOOL_META[tool]
        return {
          tool,
          prompt: `${topic}, ${style || 'professional'} style, ${mood || 'vibrant'} mood, ${niche} content creator aesthetic, high quality, ${FORMAT_META[selectedFormat].aspect} aspect ratio`,
          useCase: `Optimised for ${meta.label}`,
        } as GeneratedPrompt
      })
      setResults(demos)
      setGenerating(false)
      toast.success('Prompts generated (demo mode)')
      return
    }

    const formatInfo = FORMAT_META[selectedFormat]
    const toolsList = selectedTools.map((t) => `${TOOL_META[t].label} (${TOOL_META[t].description})`).join(', ')

    const prompt = `You are an expert AI image/video prompt engineer. Generate highly optimised visual prompts for a content creator.

Creator details:
- Name: ${name}
- Niche: ${niche}
- Tone: ${tone}
- Content topic: ${topic}
- Format: ${formatInfo.label} (${formatInfo.aspect} aspect ratio)
- Visual style: ${style || 'professional and engaging'}
- Mood: ${mood || 'vibrant and eye-catching'}
- Additional requirements: ${extras || 'none'}

Generate one optimised prompt for EACH of these AI tools: ${toolsList}

For each tool, write the prompt in that tool's specific syntax and style. Include:
- Midjourney: use parameters like --ar, --v, --style, --q
- Gemini/DALL-E: descriptive natural language
- Stable Diffusion: comma-separated descriptors with LoRA hints
- Runway: cinematic description with motion direction
- Stitch: UI/design language with color codes and components

Return as JSON array:
[
  {
    "tool": "midjourney|gemini|stitch|dalle|stable-diffusion|runway",
    "prompt": "...",
    "negativePrompt": "...",
    "settings": "optional extra settings",
    "useCase": "when/how to use this prompt"
  }
]`

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
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '[]'
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as GeneratedPrompt[]
        setResults(parsed.filter((p) => selectedTools.includes(p.tool as AITool)))
        toast.success(`${parsed.length} prompts generated!`)
      }
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function copyPrompt(prompt: string) {
    navigator.clipboard.writeText(prompt).then(() => toast.success('Copied to clipboard!'))
  }

  function copyAll() {
    const text = results.map((r) =>
      `## ${TOOL_META[r.tool as AITool]?.label || r.tool}\n${r.prompt}${r.negativePrompt ? `\n\nNegative: ${r.negativePrompt}` : ''}${r.settings ? `\n\nSettings: ${r.settings}` : ''}`
    ).join('\n\n---\n\n')
    navigator.clipboard.writeText(text).then(() => toast.success('All prompts copied!'))
  }

  return (
    <div style={{ padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Visual Prompt Generator
          </h1>
          <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 500 }}>
            Generate AI-optimised prompts for Midjourney, Gemini, Stitch, DALL-E and more
          </p>
        </div>
        {results.length > 0 && (
          <button onClick={copyAll} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
            <Copy size={13} /> Copy All
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24, alignItems: 'start' }}>

        {/* Left: Controls */}
        <div>
          {/* AI Tool Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Target AI Tools
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.entries(TOOL_META) as [AITool, typeof TOOL_META[AITool]][]).map(([tool, meta]) => {
                const active = selectedTools.includes(tool)
                return (
                  <button
                    key={tool}
                    onClick={() => toggleTool(tool)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: active ? meta.bg : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${active ? meta.color + '55' : 'rgba(59,130,246,0.08)'}`,
                      color: active ? meta.color : '#6b7a9a', transition: 'all 150ms',
                      display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{meta.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{meta.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{meta.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Content Format
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              {(Object.entries(FORMAT_META) as [ContentFormat, typeof FORMAT_META[ContentFormat]][]).map(([fmt, meta]) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, cursor: 'pointer', border: 'none',
                    background: selectedFormat === fmt ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                    outline: `1.5px solid ${selectedFormat === fmt ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.08)'}`,
                    color: selectedFormat === fmt ? '#3b82f6' : '#6b7a9a', transition: 'all 150ms',
                    display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {meta.icon}
                  <span style={{ flex: 1 }}>{meta.label}</span>
                  <span style={{ fontSize: 9.5, opacity: 0.6 }}>{meta.aspect}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Content Topic *</label>
            <input
              className="field"
              placeholder="e.g. Healthy meal prep, productivity tips, fashion OOTD…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          {/* Style presets */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Visual Style</label>
            <input
              className="field"
              placeholder="e.g. Cinematic dark moody, bright airy pastel…"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  style={{
                    padding: '3px 9px', borderRadius: 20, fontSize: 10.5, cursor: 'pointer',
                    border: style === s ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.12)',
                    background: style === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: style === s ? '#60a5fa' : '#6b7a9a', transition: 'all 140ms',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Mood / Emotion</label>
            <input className="field" placeholder="e.g. Empowering, dreamy, urgent, calm…" value={mood} onChange={(e) => setMood(e.target.value)} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Additional Details</label>
            <textarea className="field" rows={2} placeholder="Props, colors, setting, lighting, model appearance…" value={extras} onChange={(e) => setExtras(e.target.value)} style={{ resize: 'vertical' }} />
          </div>

          <button
            onClick={generate}
            disabled={generating || selectedTools.length === 0}
            className="btn btn-blue"
            style={{ width: '100%', gap: 8, justifyContent: 'center' }}
          >
            {generating
              ? <><Zap size={15} style={{ animation: 'pulse 1s infinite' }} /> Generating {selectedTools.length} prompts…</>
              : <><Sparkles size={15} /> Generate Prompts for {selectedTools.length} Tools</>
            }
          </button>
        </div>

        {/* Right: Results */}
        <div>
          {results.length === 0 && !generating && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5680' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#3b82f6' }}>
                <Wand2 size={26} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7a9a', marginBottom: 8 }}>Your prompts will appear here</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
                Select tools, describe your content, and generate optimised prompts for each AI platform
              </div>
            </div>
          )}

          {generating && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedTools.map((tool, i) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 14, padding: 20 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: TOOL_META[tool].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                      {TOOL_META[tool].icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TOOL_META[tool].color }}>{TOOL_META[tool].label}</div>
                    <div style={{ marginLeft: 'auto', width: 16, height: 16, border: `2px solid ${TOOL_META[tool].color}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[60, 80, 45, 90, 55].map((w, j) => (
                      <div key={j} style={{ height: 9, borderRadius: 5, background: `rgba(${TOOL_META[tool].color === '#3b82f6' ? '59,130,246' : '236,72,153'},0.1)`, width: `${w}%`, animation: 'pulse 1.5s infinite', animationDelay: `${j * 0.2}s` }} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {results.map((result, i) => {
              const meta = TOOL_META[result.tool as AITool]
              return (
                <motion.div
                  key={result.tool + i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ background: '#111122', border: `1px solid ${meta?.color + '22' || 'rgba(59,130,246,0.1)'}`, borderRadius: 14, padding: 20, marginBottom: 12 }}
                >
                  {/* Tool header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: meta?.bg || 'rgba(59,130,246,0.1)', border: `1px solid ${meta?.color + '33' || 'rgba(59,130,246,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                      {meta?.icon || '✨'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: meta?.color || '#3b82f6' }}>{meta?.label || result.tool}</div>
                      {result.useCase && <div style={{ fontSize: 11, color: '#4b5680', marginTop: 1 }}>{result.useCase}</div>}
                    </div>
                    <button
                      onClick={() => copyPrompt(result.prompt)}
                      className="btn btn-ghost btn-xs"
                      style={{ marginLeft: 'auto', gap: 4 }}
                    >
                      <Copy size={11} /> Copy
                    </button>
                  </div>

                  {/* Main prompt */}
                  <div
                    onClick={() => copyPrompt(result.prompt)}
                    style={{
                      background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)',
                      borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#e2e8f0',
                      lineHeight: 1.7, cursor: 'pointer', transition: 'background 150ms',
                      fontFamily: 'Space Mono, monospace', letterSpacing: '-0.01em',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                  >
                    {result.prompt}
                  </div>

                  {/* Negative prompt */}
                  {result.negativePrompt && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Negative Prompt</div>
                      <div
                        onClick={() => copyPrompt(result.negativePrompt!)}
                        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, cursor: 'pointer', fontFamily: 'Space Mono, monospace' }}
                      >
                        {result.negativePrompt}
                      </div>
                    </div>
                  )}

                  {/* Settings */}
                  {result.settings && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Settings:</span>
                      <code style={{ fontSize: 11, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 5, fontFamily: 'Space Mono' }}>{result.settings}</code>
                      <button onClick={() => copyPrompt(result.settings!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex' }}><Copy size={11} /></button>
                    </div>
                  )}

                  {/* Remix button */}
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        setTopic(topic + ' (variation)')
                        generate()
                      }}
                      className="btn btn-ghost btn-xs"
                      style={{ gap: 4 }}
                    >
                      <RefreshCw size={10} /> Remix
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
