import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'
import { AlignLeft, Copy, RefreshCw, Hash, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyStudio, lbl, chipStyle } from './shared'
import { useAIQuota } from '../../utils/entitlements'

interface Caption { text: string; score: number; platform: string }

export function CaptionLab() {
  const { profile } = useStore()
  const [post, setPost] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [captions, setCaptions] = useState<Caption[]>([])
  const [hashtags, setHashtags] = useState<string[]>([])
  const { isAtLimit, limit, used } = useAIQuota()
  const [loading, setLoading] = useState(false)
  const [activeCaption, setActiveCaption] = useState(0)

  const PLATFORMS = ['instagram', 'linkedin', 'twitter', 'youtube']

  async function generate() {
    if (!post.trim()) { toast.error('Describe your post first'); return }
    setLoading(true)
    const apiKey = profile?.apiKey

    const prompt = `You are a viral content strategist for Indian creators. Generate 6 high-performing captions for a ${platform} post.

Post topic/description: ${post}
Creator niche: ${profile?.niche || 'travel'}
Creator tone: ${profile?.tone?.join(', ') || 'educational, storytelling'}
Language style: ${profile?.contentLanguage || 'english'} (${profile?.contentLanguage === 'hinglish' ? 'mix Hindi + English naturally' : 'professional English with Indian warmth'})

Return a JSON object with:
{
  "captions": [
    {"text": "caption text with emojis and spacing", "score": 8.5, "type": "Hook", "platform": "${platform}"}
  ],
  "hashtags": ["hashtag1", "hashtag2", ...15 hashtags max]
}`

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 700))
      setCaptions([
        { text: '3 months living in a Pahadi village changed how I see the world. No deadlines. No noise. Just mountains and people who remember what rest actually feels like. 🏔️\n\nSave this if you\'ve been craving a real reset.', score: 9.2, platform },
        { text: 'The Himalayas don\'t ask you to be more productive. They just ask you to be present. 🌿\n\nSpent 90 days in remote Uttarakhand. Here\'s what I brought home (hint: not souvenirs).', score: 8.8, platform },
        { text: 'Hot take: The best travel experiences aren\'t on any bucket list.\n\nFound this valley 5 hours from any road. No internet. No other tourists. Just glaciers and a silence I hadn\'t heard since childhood. 📍', score: 8.5, platform },
        { text: 'What if the best thing for your creative work wasn\'t a new tool — it was 3 months in the mountains with no wifi? 🤔\n\nTried it. Here\'s my honest review.', score: 8.2, platform },
        { text: 'Pahadi mornings hit different. 4am chai, wood smoke, the whole valley below you still dark and quiet. ☕\n\nI\'m going to miss this forever.', score: 8.0, platform },
        { text: 'PSA: Uttarakhand has villages that have never had a tourist.\n\nI found one. Stayed for a week. This is what happened. 👇', score: 8.7, platform },
      ])
      setHashtags(['#uttarakhand', '#pahad', '#himalayas', '#incredibleindia', '#travelblogger', '#solotravel', '#mountains', '#indiatravelgram', '#travelphotography', '#wanderlust', '#pahadi', '#mountainlife', '#trekking', '#digitalnomadindia', '#contentstrategy'])
      setLoading(false)
      toast.success('Demo captions generated!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
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
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setCaptions(parsed.captions || [])
        setHashtags(parsed.hashtags || [])
      }
      toast.success('Captions ready!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
    } catch {
      toast.error('Error — try again')
    } finally {
      setLoading(false)
    }
  }

  function scoreColor(s: number) {
    if (s >= 9) return '#fbbf24'
    if (s >= 8) return '#3b82f6'
    if (s >= 6) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 16, letterSpacing: '-0.01em' }}>Caption Settings</h3>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Platform</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setPlatform(p)} style={chipStyle(platform === p, '#ec4899')}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Describe your post</label>
            <textarea
              className="field"
              rows={5}
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="What's this post about? Include the key insight, story, or value you're sharing..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            className="btn btn-pink"
            style={{ width: '100%', justifyContent: 'center', opacity: loading || isAtLimit ? 0.7 : 1 }}
            onClick={generate}
            disabled={loading || isAtLimit}
          >
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <AlignLeft size={14} />}
            {loading ? 'Generating...' : isAtLimit ? `Limit Reached (${used}/${limit})` : 'Generate Captions'}
          </button>
        </div>

        {hashtags.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <Hash size={12} /> Hashtags
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(hashtags.join(' ')); toast.success('Hashtags copied!') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Copy size={11} /> Copy all
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {hashtags.map((h) => (
                <span
                  key={h}
                  onClick={() => { navigator.clipboard.writeText(h); toast.success('Copied!') }}
                  style={{ fontSize: 11, padding: '3px 9px', background: 'rgba(236,72,153,0.08)', color: '#ec4899', borderRadius: 12, cursor: 'pointer', fontWeight: 600, transition: 'background 140ms' }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'rgba(236,72,153,0.16)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'rgba(236,72,153,0.08)')}
                >
                  {h}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div>
        {captions.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
                Captions — {platform}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#4b5680', fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
                  {activeCaption + 1} / {captions.length}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={generate}><RefreshCw size={12} /> Regenerate</button>
              </div>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') setActiveCaption((c) => Math.max(0, c - 1))
                if (e.key === 'ArrowRight') setActiveCaption((c) => Math.min(captions.length - 1, c + 1))
              }}
              tabIndex={0}
            >
              <button
                onClick={() => setActiveCaption((c) => Math.max(0, c - 1))}
                disabled={activeCaption === 0}
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.15)',
                  background: activeCaption === 0 ? 'transparent' : 'rgba(59,130,246,0.06)',
                  cursor: activeCaption === 0 ? 'not-allowed' : 'pointer',
                  color: activeCaption === 0 ? '#2a3050' : '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 140ms',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCaption}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.14 }}
                  className="card"
                  style={{ flex: 1, padding: '22px 24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Caption {activeCaption + 1} of {captions.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {captions[activeCaption].score > 0 && (
                        <span className="badge" style={{ background: `${scoreColor(captions[activeCaption].score)}15`, color: scoreColor(captions[activeCaption].score), fontSize: 12 }}>
                          {captions[activeCaption].score.toFixed(1)}
                        </span>
                      )}
                      <button
                        onClick={() => { navigator.clipboard.writeText(captions[activeCaption].text); toast.success('Caption copied!') }}
                        className="btn btn-ghost btn-xs"
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.8, whiteSpace: 'pre-line', fontWeight: 500 }}>
                    {captions[activeCaption].text}
                  </p>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={() => setActiveCaption((c) => Math.min(captions.length - 1, c + 1))}
                disabled={activeCaption === captions.length - 1}
                style={{
                  flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                  border: '1px solid rgba(59,130,246,0.15)',
                  background: activeCaption === captions.length - 1 ? 'transparent' : 'rgba(59,130,246,0.06)',
                  cursor: activeCaption === captions.length - 1 ? 'not-allowed' : 'pointer',
                  color: activeCaption === captions.length - 1 ? '#2a3050' : '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 140ms',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
              {captions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCaption(i)}
                  style={{
                    width: i === activeCaption ? 20 : 6, height: 6, borderRadius: 3,
                    background: i === activeCaption ? '#3b82f6' : 'rgba(59,130,246,0.2)',
                    border: 'none', cursor: 'pointer', transition: 'all 200ms ease', padding: 0,
                  }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <EmptyStudio icon={<AlignLeft size={32} />} title="Captions will appear here" sub="Describe your post and click Generate Captions" />
        )}
      </div>
    </div>
  )
}
