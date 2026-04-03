import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { Copy, RefreshCw, BookMarked, Film, GripVertical, Pencil, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyStudio, lbl } from './shared'
import { useAIQuota } from '../../utils/entitlements'

interface Chapter {
  timestamp: string
  title: string
  description: string
  thumbnailIdea?: string
}

export function VideoChapters() {
  const { profile } = useStore()
  const [transcript, setTranscript] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const { isAtLimit, limit, used } = useAIQuota()
  const [loading, setLoading] = useState(false)
  const [customChapterCount, setCustomChapterCount] = useState(5)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [thumbLoading, setThumbLoading] = useState(false)

  const CHAPTER_COUNTS = [5, 7, 10, 12]

  function parseChapters(text: string): Chapter[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) return JSON.parse(jsonMatch[0])
    } catch { /* fall through */ }
    const lines = text.split('\n').filter(l => l.trim())
    return lines.slice(0, customChapterCount).map((line, i) => {
      const ts = `${i === 0 ? '0' : Math.floor(i * (transcript.length / customChapterCount / 15))}:${i === 0 ? '00' : String(Math.floor(Math.random() * 59)).padStart(2, '0')}`
      return { timestamp: ts, title: line.replace(/^\d+\.\s*/, '').trim(), description: '' }
    })
  }

  async function generate() {
    if (!transcript.trim()) { toast.error('Paste your transcript or script first'); return }
    setLoading(true)
    setChapters([])
    const apiKey = profile?.apiKey

    if (!apiKey) {
      await new Promise(r => setTimeout(r, 900))
      const demo: Chapter[] = [
        { timestamp: '0:00', title: 'Introduction', description: 'Overview of what the video covers and why it matters' },
        { timestamp: '1:45', title: 'The Core Problem', description: 'Breaking down the challenge most creators face' },
        { timestamp: '4:20', title: 'Strategy #1 — Hook Mastery', description: 'How to write hooks that stop the scroll in under 2 seconds' },
        { timestamp: '8:10', title: 'Strategy #2 — Retention Loop', description: 'The tension loop framework that keeps viewers watching' },
        { timestamp: '12:30', title: 'Real Examples & Breakdown', description: 'Analyzing viral content to extract the winning pattern' },
      ].slice(0, customChapterCount)
      setChapters(demo)
      setLoading(false)
      toast.success('Demo chapters generated! Add API key for AI-powered chapters.')
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
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Analyze this video script/transcript and generate exactly ${customChapterCount} YouTube chapters with timestamps.${videoTitle ? ` Video title: ${videoTitle}` : ''}

TRANSCRIPT:
${transcript.slice(0, 4000)}

Rules:
- First chapter MUST be 0:00 Intro
- Estimate timestamps based on content position (assume ~130 words per minute)
- Titles should be concise and compelling (max 6 words)
- Description should be 1 sentence explaining what that section covers

Return ONLY a JSON array:
[{"timestamp":"0:00","title":"Intro","description":"What viewers will learn"},...]`,
          }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const parsed = parseChapters(text)
      setChapters(parsed.length > 0 ? parsed : [])
      toast.success('Chapters generated!')
    } catch {
      toast.error('Generation failed — try again')
    } finally {
      setLoading(false)
    }
  }

  async function generateThumbnailIdeas() {
    if (chapters.length === 0) return
    setThumbLoading(true)
    const apiKey = profile?.apiKey

    if (!apiKey) {
      setChapters(prev => prev.map(c => ({
        ...c,
        thumbnailIdea: `B-roll: Close-up shot illustrating "${c.title}". Text overlay with chapter title in bold. High contrast background.`,
      })))
      setThumbLoading(false)
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
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `For each of these YouTube chapters, give a 1-sentence thumbnail/b-roll concept for that timestamp. Be specific and visual.\n\nChapters:\n${chapters.map(c => `${c.timestamp} - ${c.title}`).join('\n')}\n\nReturn ONLY a JSON array of strings in order: ["concept1","concept2",...]`,
          }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const ideas: string[] = JSON.parse(jsonMatch[0])
        setChapters(prev => prev.map((c, i) => ({ ...c, thumbnailIdea: ideas[i] || '' })))
        toast.success('Thumbnail ideas added!')
      }
    } catch {
      toast.error('Failed to generate thumbnail ideas')
    } finally {
      setThumbLoading(false)
    }
  }

  function copyForYouTube() {
    const text = chapters.map(c => `${c.timestamp} ${c.title}`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Chapters copied for YouTube description!')
  }

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setEditTitle(chapters[idx].title)
  }

  function commitEdit(idx: number) {
    if (editTitle.trim()) {
      setChapters(prev => prev.map((c, i) => i === idx ? { ...c, title: editTitle.trim() } : c))
    }
    setEditingIdx(null)
    setEditTitle('')
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 16, letterSpacing: '-0.01em' }}>Chapter Generator</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Video Title (optional)</label>
            <input className="field" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. How I Grew to 100K Subscribers" style={{ fontSize: 13 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Script or Transcript</label>
            <textarea
              className="field"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste your full script or transcript here. The AI will analyze the content flow and generate chapter markers automatically..."
              style={{ minHeight: 280, resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Chapter count</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {CHAPTER_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setCustomChapterCount(n)}
                  style={{
                    flex: 1, padding: '7px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                    background: customChapterCount === n ? 'rgba(59,130,246,0.12)' : 'transparent',
                    borderColor: customChapterCount === n ? '#3b82f6' : 'rgba(59,130,246,0.15)',
                    color: customChapterCount === n ? '#3b82f6' : '#6b7a9a',
                    fontFamily: 'Space Mono, monospace', transition: 'all 140ms',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-pink"
            style={{ width: '100%', justifyContent: 'center', opacity: loading || isAtLimit ? 0.7 : 1 }}
            onClick={generate}
            disabled={loading || isAtLimit}
          >
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <BookMarked size={14} />}
            {loading ? 'Generating chapters...' : isAtLimit ? `Limit Reached (${used}/${limit})` : 'Generate Chapters'}
          </button>
        </div>

        {transcript.trim() && (
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#06b6d4', fontWeight: 700 }}>
                  {transcript.trim().split(/\s+/).filter(Boolean).length}
                </div>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>words</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#10b981', fontWeight: 700 }}>
                  ~{Math.round(transcript.trim().split(/\s+/).filter(Boolean).length / 130)}min
                </div>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>est. runtime</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        {chapters.length > 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', margin: 0 }}>YouTube Chapters</h3>
                <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', fontSize: 11 }}>
                  {chapters.length} chapters
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => {
                    setShowThumbnails(v => {
                      if (!v && !chapters[0]?.thumbnailIdea) generateThumbnailIdeas()
                      return !v
                    })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid',
                    background: showThumbnails ? 'rgba(167,139,250,0.1)' : 'transparent',
                    borderColor: showThumbnails ? '#a78bfa' : 'rgba(59,130,246,0.15)',
                    color: showThumbnails ? '#a78bfa' : '#6b7a9a', transition: 'all 140ms',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  {thumbLoading ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Film size={12} />}
                  Thumbnail Ideas
                </button>
                <button className="btn btn-blue btn-sm" onClick={copyForYouTube}>
                  <Copy size={12} /> Copy for YouTube
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chapters.map((chapter, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card"
                  style={{ padding: '12px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <GripVertical size={14} color="#2a3050" style={{ marginTop: 3, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontFamily: 'Space Mono, monospace', color: '#06b6d4', fontWeight: 700, flexShrink: 0, minWidth: 44, paddingTop: 2 }}>
                      {chapter.timestamp}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingIdx === idx ? (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            autoFocus
                            className="field"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') commitEdit(idx); if (e.key === 'Escape') setEditingIdx(null) }}
                            style={{ fontSize: 13, fontWeight: 700, flex: 1 }}
                          />
                          <button
                            onClick={() => commitEdit(idx)}
                            aria-label="Confirm edit"
                            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 7, color: '#10b981', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center' }}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: chapter.description ? 3 : 0 }}>
                          {chapter.title}
                        </div>
                      )}
                      {chapter.description && editingIdx !== idx && (
                        <div style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.5 }}>{chapter.description}</div>
                      )}
                      {showThumbnails && chapter.thumbnailIdea && (
                        <div style={{ marginTop: 8, background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                          <Film size={11} color="#a78bfa" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 11, color: '#c4b5fd', lineHeight: 1.5 }}>{chapter.thumbnailIdea}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => editingIdx === idx ? setEditingIdx(null) : startEdit(idx)}
                      aria-label="Edit chapter title"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4, flexShrink: 0, transition: 'color 140ms' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#4b5680')}
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 16, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>YouTube Format Preview</span>
                <button className="btn btn-blue btn-sm" onClick={copyForYouTube}>
                  <Copy size={11} /> Copy All
                </button>
              </div>
              <pre style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Space Mono, monospace', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {chapters.map(c => `${c.timestamp} ${c.title}`).join('\n')}
              </pre>
            </div>
          </motion.div>
        ) : (
          <EmptyStudio
            icon={<BookMarked size={32} />}
            title="Your chapters will appear here"
            sub="Paste your script or transcript on the left and click Generate Chapters"
          />
        )}
      </div>
    </div>
  )
}
