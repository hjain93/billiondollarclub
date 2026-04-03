import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { getResolvedAIKey } from '../../utils/aiKey'
import { Wand2, Copy, RefreshCw, Download, Film, Eye, X, Play, Pause, Dna, Maximize2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyStudio, lbl, chipStyle } from './shared'
import { useAIQuota } from '../../utils/entitlements'

interface ScriptSection {
  label: string
  content: string
  color: string
}

export function ScriptWriter() {
  const { profile, contentDNA } = useStore()
  const [duration, setDuration] = useState('60')
  const [tone, setTone] = useState('Educational')
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('Instagram Reel')
  const [targetAudience, setTargetAudience] = useState('')
  const [hookStyle, setHookStyle] = useState('Bold Claim')
  const [references, setReferences] = useState('')
  const [useDNA, setUseDNA] = useState(false)
  const [abHooks, setAbHooks] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<ScriptSection[]>([])
  const [hookVariantB, setHookVariantB] = useState('')
  const [activeHook, setActiveHook] = useState<'A' | 'B'>('A')
  const { isAtLimit, limit, used } = useAIQuota()
  const [regenLoading, setRegenLoading] = useState<number | null>(null)
  // Teleprompter
  const [teleprompterOpen, setTeleprompterOpen] = useState(false)
  const [tpSpeed, setTpSpeed] = useState(2)
  const [tpPlaying, setTpPlaying] = useState(false)
  const tpRef = useRef<HTMLDivElement>(null)
  const tpScrollRef = useRef<number>(0)
  const tpAnimRef = useRef<number | null>(null)

  const TONES = ['Educational', 'Storytelling', 'Motivational', 'Witty', 'Personal/Raw', 'Controversial']
  const PLATFORMS = ['Instagram Reel', 'YouTube Short', 'YouTube Video', 'LinkedIn', 'Twitter/X', 'Podcast']
  const DURATIONS = [
    { val: '15', label: '15s' },
    { val: '30', label: '30s' },
    { val: '60', label: '60s' },
    { val: '180', label: '3min' },
    { val: '600', label: '10min' },
  ]
  const HOOK_STYLES = [
    { val: 'Question', label: 'Question', ex: '"Have you ever...?"' },
    { val: 'Bold Claim', label: 'Bold Claim', ex: '"Most people are wrong about..."' },
    { val: 'Story Open', label: 'Story Open', ex: '"3 months ago I..."' },
    { val: 'Stat/Fact', label: 'Stat/Fact', ex: '"90% of creators fail because..."' },
    { val: 'Challenge', label: 'Challenge', ex: '"Stop doing X"' },
    { val: 'FOMO', label: 'FOMO', ex: '"Everyone is doing X except you"' },
  ]

  const SECTION_COLORS: Record<string, string> = {
    HOOK: '#ec4899', SETUP: '#3b82f6', BODY: '#22d3ee', CTA: '#f97316',
  }

  // Teleprompter scroll animation
  useEffect(() => {
    if (!teleprompterOpen) { tpScrollRef.current = 0; return }
    if (tpPlaying) {
      const scroll = () => {
        if (tpRef.current) {
          tpScrollRef.current += tpSpeed * 0.4
          tpRef.current.scrollTop = tpScrollRef.current
          if (tpRef.current.scrollTop >= tpRef.current.scrollHeight - tpRef.current.clientHeight) {
            setTpPlaying(false)
          }
        }
        tpAnimRef.current = requestAnimationFrame(scroll)
      }
      tpAnimRef.current = requestAnimationFrame(scroll)
    } else {
      if (tpAnimRef.current) cancelAnimationFrame(tpAnimRef.current)
    }
    return () => { if (tpAnimRef.current) cancelAnimationFrame(tpAnimRef.current) }
  }, [tpPlaying, tpSpeed, teleprompterOpen])

  // Escape to close teleprompter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setTeleprompterOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function countWords(text: string) { return text.trim().split(/\s+/).filter(Boolean).length }
  function estimateTime(text: string) {
    const wpm = 130
    const secs = Math.round((countWords(text) / wpm) * 60)
    if (secs < 60) return `~${secs}s`
    return `~${Math.round(secs / 60)}min ${secs % 60}s`
  }

  function buildPrompt(forSection?: string) {
    const dnaContext = useDNA && contentDNA
      ? `\n\nCreator's Content DNA:\n- Hook patterns: ${contentDNA.hookPatterns.slice(0, 3).map(h => h.pattern).join(', ')}\n- Tone: ${contentDNA.toneFingerprint.join(', ')}\n- Voice markers: ${contentDNA.uniqueVoiceMarkers.slice(0, 3).join('; ')}`
      : ''

    const platformFormats: Record<string, string> = {
      'Instagram Reel': 'Short, punchy, vertical video. Hook in first 1-2 seconds. No long intros.',
      'YouTube Short': '60s max, vertical. Start with visual hook, quick payoff.',
      'YouTube Video': 'Horizontal long-form. Intro (hook+preview), body with timestamps, outro with CTA.',
      'LinkedIn': 'Professional storytelling. Open with insight or story, build credibility, end with thought-provoking question.',
      'Twitter/X': 'Thread format. Each tweet is standalone. Start with the most attention-grabbing tweet.',
      'Podcast': 'Audio-first. No visual references. Describe everything. Conversational and warm.',
    }

    if (forSection) {
      return `Rewrite only the ${forSection} section of this script for a ${duration}-second ${platform} post.
Topic: ${topic}
Tone: ${tone}
Hook style: ${hookStyle}
Target audience: ${targetAudience || 'general creator audience'}
Platform format: ${platformFormats[platform] || ''}
${dnaContext}

Write only the ${forSection} section content — no label, no other sections. 2-4 sentences max for HOOK/SETUP/CTA, longer for BODY.`
    }

    return `Write a ${duration}-second ${platform} script for an Indian ${profile?.niche || 'content'} creator.

Topic: ${topic}
Tone: ${tone}
Hook style: ${hookStyle} — ${HOOK_STYLES.find(h => h.val === hookStyle)?.ex || ''}
Target audience: ${targetAudience || 'creators and entrepreneurs'}
Platform format: ${platformFormats[platform] || ''}
Language: ${profile?.contentLanguage || 'english'}
Creator niche: ${profile?.niche || 'content creation'}${references ? `\nReferences to include: ${references}` : ''}${dnaContext}

Format the script with EXACTLY these four sections:
[HOOK]
(${hookStyle}-style hook — first 2-3 seconds)

[SETUP]
(context, problem, why the viewer should keep watching)

[BODY]
(main value — tips, story, insights${Number(duration) > 60 ? ' — use timestamps' : ''})

[CTA]
(specific call to action)
${abHooks ? '\nAlso provide a second hook variant:\n[HOOK_B]\n(alternative hook using a different approach)' : ''}

Keep it tight, natural, and punchy. No filler. Real talk.`
  }

  function parseScript(text: string): ScriptSection[] {
    const labels = ['HOOK', 'SETUP', 'BODY', 'CTA']
    return labels.map(label => {
      const regex = new RegExp(`\\[${label}\\]\\s*([\\s\\S]*?)(?=\\[(?:HOOK|SETUP|BODY|CTA|HOOK_B)\\]|$)`)
      const match = text.match(regex)
      return {
        label,
        content: match ? match[1].trim() : '',
        color: SECTION_COLORS[label] || '#94a3b8',
      }
    }).filter(s => s.content)
  }

  async function generate() {
    if (!topic.trim()) { toast.error('Enter a topic first'); return }
    setLoading(true)
    const apiKey = profile?.apiKey

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 900))
      setSections([
        { label: 'HOOK', content: `Stop scrolling. Most ${profile?.niche || 'travel'} creators are doing this completely wrong — and it's costing them views every single day.`, color: '#ec4899' },
        { label: 'SETUP', content: `I spent 3 months researching the top 100 creators in this space. And I found one pattern nobody talks about. It's not about your editing, your camera, or even your content.`, color: '#3b82f6' },
        { label: 'BODY', content: `Here's what actually separates viral posts from average ones:\n\n• The first 1.5 seconds determine everything. Not the first 3. Not the first 5. One and a half seconds.\n\n• The creators killing it right now all use what I call the "tension loop" — they create a problem in the hook, hint at the solution in the setup, and delay the full reveal until the last 10 seconds.\n\n• They also post at a very specific time. Not primetime. Not morning. I'll tell you exactly when.\n\nI've tested this on 3 different niches. Average views went up 340% in 30 days.`, color: '#22d3ee' },
        { label: 'CTA', content: `Save this video — I'm dropping the full framework with examples this Thursday. And comment "SEND IT" if you want me to review your last post for free.`, color: '#f97316' },
      ])
      if (abHooks) setHookVariantB(`Have you ever posted something you were genuinely proud of — and it got 200 views? I know exactly why that happened, and it's fixable in under 10 minutes.`)
      setLoading(false)
      toast.success('Demo script generated! Add API key for AI-powered scripts.', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
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
          max_tokens: 1200,
          messages: [{ role: 'user', content: buildPrompt() }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const parsed = parseScript(text)
      setSections(parsed.length > 0 ? parsed : [{ label: 'SCRIPT', content: text, color: '#3b82f6' }])

      if (abHooks) {
        const hookBMatch = text.match(/\[HOOK_B\]\s*([\s\S]*?)(?=\[|$)/)
        if (hookBMatch) setHookVariantB(hookBMatch[1].trim())
      }

      toast.success('Script ready!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
    } catch {
      toast.error('API error — try again')
    } finally {
      setLoading(false)
    }
  }

  async function regenerateSection(idx: number) {
    const apiKey = getResolvedAIKey()
    if (!apiKey) { toast.error('API key required to regenerate sections'); return }
    setRegenLoading(idx)
    try {
      const sectionLabel = sections[idx].label
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
          max_tokens: 400,
          messages: [{ role: 'user', content: buildPrompt(sectionLabel) }],
        }),
      })
      const data = await res.json()
      const newContent = data.content?.[0]?.text?.trim() || ''
      if (newContent) {
        setSections(prev => prev.map((s, i) => i === idx ? { ...s, content: newContent } : s))
        toast.success(`${sectionLabel} regenerated!`)
      }
    } catch {
      toast.error('Regeneration failed')
    } finally {
      setRegenLoading(null)
    }
  }

  function copyAll() {
    const fullScript = sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n')
    navigator.clipboard.writeText(fullScript)
    toast.success('Full script copied!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
  }

  function downloadScript() {
    const fullScript = `SCRIPT — ${topic}\nPlatform: ${platform} | Duration: ${duration}s | Tone: ${tone}\n\n` +
      sections.map(s => `[${s.label}]\n${s.content}`).join('\n\n')
    const blob = new Blob([fullScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `script-${topic.slice(0, 30).replace(/\s/g, '-')}.txt`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Script downloaded!')
  }

  const totalWords = sections.reduce((sum, s) => sum + countWords(s.content), 0)
  const totalTime = estimateTime(sections.map(s => s.content).join(' '))

  const platformSuitability = () => {
    const wc = totalWords
    if (platform === 'Instagram Reel' && wc > 80) return { ok: false, msg: 'Too long for Reel — trim down' }
    if (platform === 'YouTube Short' && wc > 100) return { ok: false, msg: 'Too long for Short' }
    if (platform === 'YouTube Video' && wc < 200) return { ok: false, msg: 'Too short for YouTube Video' }
    return { ok: true, msg: 'Good fit for ' + platform }
  }
  const suit = platformSuitability()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, height: '100%' }}>
      {/* ── Left Panel Controls ── */}
      <div className="card" style={{ padding: 20, alignSelf: 'start', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 18, letterSpacing: '-0.01em' }}>Script Settings</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Topic / Title</label>
          <input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={`e.g. Hidden trek in ${profile?.niche || 'Uttarakhand'}...`} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Platform</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {PLATFORMS.map((p) => (
              <button key={p} onClick={() => setPlatform(p)} style={chipStyle(platform === p)}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Duration</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {DURATIONS.map((d) => (
              <button key={d.val} onClick={() => setDuration(d.val)} style={chipStyle(duration === d.val)}>{d.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Tone</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TONES.map((t) => (
              <button key={t} onClick={() => setTone(t)} style={chipStyle(tone === t)}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Target Audience</label>
          <input className="field" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. entrepreneurs aged 25-35, struggling with X" />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Hook Style</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {HOOK_STYLES.map((h) => (
              <button
                key={h.val}
                onClick={() => setHookStyle(h.val)}
                style={{
                  ...chipStyle(hookStyle === h.val),
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                  padding: '7px 12px', borderRadius: 10, textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 12 }}>{h.label}</span>
                <span style={{ fontSize: 10.5, opacity: 0.6, marginTop: 1 }}>{h.ex}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>References / Specifics</label>
          <textarea
            className="field"
            rows={3}
            value={references}
            onChange={(e) => setReferences(e.target.value)}
            placeholder="Any specific stats, stories, or examples to include..."
            style={{ resize: 'vertical', fontSize: 12 }}
          />
        </div>

        {contentDNA && (
          <div
            style={{ marginBottom: 14, background: useDNA ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${useDNA ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 150ms' }}
            onClick={() => setUseDNA(!useDNA)}
          >
            <Dna size={14} color={useDNA ? '#3b82f6' : '#4b5680'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: useDNA ? '#93c5fd' : '#6b7a9a' }}>Use my Content DNA</div>
              <div style={{ fontSize: 10.5, color: '#4b5680', marginTop: 1 }}>Inject your hook patterns & voice into the prompt</div>
            </div>
            <div style={{ width: 32, height: 18, borderRadius: 9, background: useDNA ? '#3b82f6' : 'rgba(59,130,246,0.15)', transition: 'background 200ms', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: useDNA ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: useDNA ? '#fff' : '#4b5680', transition: 'left 200ms' }} />
            </div>
          </div>
        )}

        <div
          style={{ marginBottom: 18, background: abHooks ? 'rgba(236,72,153,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${abHooks ? 'rgba(236,72,153,0.3)' : 'rgba(59,130,246,0.1)'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 150ms' }}
          onClick={() => setAbHooks(!abHooks)}
        >
          <Maximize2 size={14} color={abHooks ? '#ec4899' : '#4b5680'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: abHooks ? '#f9a8d4' : '#6b7a9a' }}>A/B Hooks</div>
            <div style={{ fontSize: 10.5, color: '#4b5680', marginTop: 1 }}>Generate 2 hook variants to test</div>
          </div>
          <div style={{ width: 32, height: 18, borderRadius: 9, background: abHooks ? '#ec4899' : 'rgba(59,130,246,0.15)', transition: 'background 200ms', position: 'relative', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: abHooks ? 16 : 3, width: 12, height: 12, borderRadius: '50%', background: abHooks ? '#fff' : '#4b5680', transition: 'left 200ms' }} />
          </div>
        </div>

        <button
          className="btn btn-blue"
          style={{ width: '100%', justifyContent: 'center', opacity: loading || isAtLimit ? 0.7 : 1 }}
          onClick={generate}
          disabled={loading || isAtLimit}
        >
          {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={14} />}
          {loading ? 'Writing script...' : isAtLimit ? `Limit Reached (${used}/${limit})` : 'Generate Script'}
        </button>
      </div>

      {/* ── Right Panel Output ── */}
      <div>
        {sections.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 3 }}>
                  {topic || 'Your Script'} — {platform}
                </h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{totalWords} words · {totalTime}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: suit.ok ? '#10b981' : '#f97316', background: suit.ok ? 'rgba(16,185,129,0.08)' : 'rgba(249,115,22,0.08)', padding: '2px 8px', borderRadius: 10 }}>
                    {suit.msg}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setTeleprompterOpen(true)} title="Teleprompter mode">
                  <Eye size={12} /> Teleprompter
                </button>
                <button className="btn btn-ghost btn-sm" onClick={generate}><RefreshCw size={12} /> Regenerate</button>
                <button className="btn btn-ghost btn-sm" onClick={downloadScript}><Download size={12} /> .txt</button>
                <button className="btn btn-blue btn-sm" onClick={copyAll}><Copy size={12} /> Copy All</button>
              </div>
            </div>

            {abHooks && hookVariantB && (
              <div style={{ marginBottom: 14, background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>A/B Hook Test</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: activeHook === 'A' ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeHook === 'A' ? '#ec4899' : 'rgba(59,130,246,0.12)'}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ec4899', marginBottom: 6 }}>HOOK A</div>
                    <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>{sections.find(s => s.label === 'HOOK')?.content}</p>
                    <button className="btn btn-pink btn-xs" style={{ marginTop: 8 }} onClick={() => setActiveHook('A')}>
                      {activeHook === 'A' ? '✓ Using A' : 'Use A'}
                    </button>
                  </div>
                  <div style={{ background: activeHook === 'B' ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${activeHook === 'B' ? '#ec4899' : 'rgba(59,130,246,0.12)'}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#ec4899', marginBottom: 6 }}>HOOK B</div>
                    <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>{hookVariantB}</p>
                    <button className="btn btn-pink btn-xs" style={{ marginTop: 8 }} onClick={() => setActiveHook('B')}>
                      {activeHook === 'B' ? '✓ Using B' : 'Use B'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sections.map((section, i) => {
                const displayContent = (section.label === 'HOOK' && abHooks && activeHook === 'B' && hookVariantB)
                  ? hookVariantB
                  : section.content
                const wc = countWords(displayContent)
                const et = estimateTime(displayContent)

                return (
                  <div key={i} className="card" style={{ padding: '14px 16px', borderLeft: `3px solid ${section.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: section.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{section.label}</span>
                        <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{wc}w · {et}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => { navigator.clipboard.writeText(displayContent); toast.success(`${section.label} copied!`) }}
                          className="btn btn-ghost btn-xs"
                        >
                          <Copy size={10} />
                        </button>
                        <button
                          onClick={() => regenerateSection(i)}
                          disabled={regenLoading === i}
                          className="btn btn-ghost btn-xs"
                          title={`Regenerate ${section.label}`}
                        >
                          {regenLoading === i
                            ? <RefreshCw size={10} style={{ animation: 'spin 1s linear infinite' }} />
                            : <RefreshCw size={10} />}
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={displayContent}
                      onChange={(e) => {
                        const newContent = e.target.value
                        if (section.label === 'HOOK' && abHooks && activeHook === 'B') {
                          setHookVariantB(newContent)
                        } else {
                          setSections(prev => prev.map((s, idx) => idx === i ? { ...s, content: newContent } : s))
                        }
                      }}
                      rows={displayContent.split('\n').length + 1}
                      style={{
                        width: '100%', background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 13.5, color: '#cbd5e1', lineHeight: 1.75, resize: 'vertical',
                        fontFamily: 'Plus Jakarta Sans, sans-serif', boxSizing: 'border-box', padding: 0,
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setSections([]); setHookVariantB('') }}>
                <Trash2 size={12} /> Clear
              </button>
            </div>
          </motion.div>
        ) : (
          <EmptyStudio
            icon={<Film size={32} />}
            title="Your advanced script will appear here"
            sub="Fill in the settings on the left and click Generate Script"
          />
        )}
      </div>

      {/* ── Teleprompter Overlay ── */}
      {teleprompterOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.7 }}>TELEPROMPTER</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: '#666' }}>Speed</span>
            <input
              type="range" min={1} max={5} step={0.5} value={tpSpeed}
              onChange={(e) => setTpSpeed(Number(e.target.value))}
              style={{ width: 80, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: 11, color: '#666', fontFamily: 'Space Mono, monospace', width: 16 }}>{tpSpeed}</span>
            <button
              onClick={() => { tpScrollRef.current = tpRef.current?.scrollTop || 0; setTpPlaying(!tpPlaying) }}
              style={{ background: tpPlaying ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', border: `1px solid ${tpPlaying ? '#ef4444' : '#10b981'}`, borderRadius: 8, color: tpPlaying ? '#ef4444' : '#10b981', padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}
            >
              {tpPlaying ? <Pause size={13} /> : <Play size={13} />}
              {tpPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setTeleprompterOpen(false)}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
            >
              <X size={13} /> Close (Esc)
            </button>
          </div>
          <div ref={tpRef} style={{ flex: 1, overflowY: 'auto', padding: '60px 120px', scrollbarWidth: 'none' }}>
            {sections.map((s, i) => {
              const content = (s.label === 'HOOK' && abHooks && activeHook === 'B' && hookVariantB) ? hookVariantB : s.content
              return (
                <div key={i} style={{ marginBottom: 48 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontFamily: 'Space Mono, monospace' }}>{s.label}</div>
                  <p style={{ fontSize: 28, color: '#fff', lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: 'Space Mono, monospace', fontWeight: 400 }}>{content}</p>
                </div>
              )
            })}
            <div style={{ height: '50vh' }} />
          </div>
        </div>
      )}
    </div>
  )
}
