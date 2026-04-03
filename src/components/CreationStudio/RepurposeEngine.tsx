import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../../store'
import { Copy, RefreshCw, Layers } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyStudio, lbl } from './shared'
import { useAIQuota } from '../../utils/entitlements'

export function RepurposeEngine() {
  const { profile } = useStore()
  const [input, setInput] = useState('')
  const [outputs, setOutputs] = useState<{ platform: string; format: string; content: string }[]>([])
  const { isAtLimit, limit, used } = useAIQuota()
  const [loading, setLoading] = useState(false)
  const userName = profile?.name || 'Creator'

  async function repurpose() {
    if (!input.trim()) { toast.error('Paste your content first'); return }
    setLoading(true)
    const apiKey = profile?.apiKey

    const prompt = `You are a content repurposing expert. Take this content and adapt it for every platform:

ORIGINAL CONTENT:
${input}

Creator niche: ${profile?.niche || 'travel'}
Language: ${profile?.contentLanguage || 'english'}

Return a JSON array of platform adaptations:
[
  {"platform": "Instagram Caption", "format": "caption", "content": "adapted content with emojis and hashtags"},
  {"platform": "Twitter/X Thread", "format": "thread", "content": "tweet 1/4 text\\n\\ntweet 2/4 text\\n\\ntweet 3/4 text\\n\\ntweet 4/4 text"},
  {"platform": "LinkedIn Post", "format": "article", "content": "professional long-form with insights"},
  {"platform": "YouTube Description", "format": "description", "content": "SEO optimized description"},
  {"platform": "WhatsApp Status", "format": "short", "content": "very short 1-2 line version"},
  {"platform": "Newsletter Hook", "format": "email", "content": "email hook paragraph to tease the full story"}
]`

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 800))
      setOutputs([
        { platform: 'Instagram Caption', format: 'caption', content: '3 months. No wifi. No deadlines. Just mountains and people who\'ve forgotten what stress feels like. 🏔️\n\nI went to document a trek. I came back changed. Here\'s the part nobody talks about...\n\n#uttarakhand #pahad #himalayas #solotravel #mountainlife' },
        { platform: 'Twitter/X Thread', format: 'thread', content: 'I spent 3 months in a Pahadi village with no internet.\n\nHere\'s what happened to my productivity: 🧵\n\n1/ The first week I panicked. No notifications, no analytics, no validation. Just mountains and silence.\n\n2/ By week 3, I started writing more than I ever had. Turns out "creative block" is just "too much noise block."\n\n3/ The villagers had a concept: work until it\'s done, then completely stop. No "I should be doing something." Just rest.\n\n4/ I brought this back. My output tripled. My stress halved. The mountains taught me what no productivity guru could.' },
        { platform: 'LinkedIn Post', format: 'article', content: 'Took a 90-day sabbatical in the Himalayas. No laptop, minimal phone usage.\n\nWhat I expected: creative recharge\nWhat I got: a fundamental rethink of how I work\n\nThe villagers operated on a simple principle: deep focus during work hours, complete rest after. No hustle culture. No "always be available."\n\nThree months later, my content output has increased 3x. My client satisfaction scores are up. My anxiety is down.\n\nSometimes the most productive thing you can do is completely disconnect.\n\nWould you ever take a digital sabbatical?' },
        { platform: 'YouTube Description', format: 'description', content: 'I lived in a remote Pahadi village for 3 months with no internet access. In this video, I share what I learned about creativity, productivity, and what a slow life actually feels like.\n\n⏱ Timestamps:\n0:00 - Why I went\n2:30 - First week reality check\n5:00 - What changed for me\n10:00 - Lessons I brought home\n\n🔗 Links mentioned:\n• Full trek guide: [link]\n• Gear I used: [link]\n\n#Uttarakhand #PahadiVillage #DigitalDetox #CreatorLife' },
        { platform: 'WhatsApp Status', format: 'short', content: '3 months. No internet. Mountains changed me more than any course ever did. 🏔️' },
        { platform: 'Newsletter Hook', format: 'email', content: 'This week I want to tell you about something that happened when I had no wifi for 90 days.\n\nNot a hiking story. Not a "disconnect to reconnect" cliché.\n\nSomething about how the people who live there think about time — and why it completely broke my understanding of creative output...' },
      ])
      setLoading(false)
      toast.success('Repurposed to 6 platforms!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
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
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) setOutputs(JSON.parse(jsonMatch[0]))
      toast.success('Repurposed across platforms!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' } })
    } catch {
      toast.error('Error — try again')
    } finally {
      setLoading(false)
    }
  }

  const PLATFORM_COLORS: Record<string, string> = {
    'Instagram Caption': '#ec4899',
    'Twitter/X Thread': '#3b82f6',
    'LinkedIn Post': '#0ea5e9',
    'YouTube Description': '#ef4444',
    'WhatsApp Status': '#10b981',
    'Newsletter Hook': '#f97316',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 6, letterSpacing: '-0.01em' }}>One-to-Many Repurpose</h3>
          <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 16, lineHeight: 1.5 }}>Paste any content — script, idea, blog post — and get it adapted for every platform instantly.</p>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Your Original Content</label>
            <textarea
              className="field"
              rows={10}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your script, blog post, video transcript, or even just a rough idea..."
              style={{ resize: 'vertical' }}
            />
          </div>
          <button
            className="btn btn-orange"
            style={{ width: '100%', justifyContent: 'center', opacity: loading || isAtLimit ? 0.7 : 1 }}
            onClick={repurpose}
            disabled={loading || isAtLimit}
          >
            {loading ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Layers size={14} />}
            {loading ? 'Repurposing...' : isAtLimit ? `Limit Reached (${used}/${limit})` : 'Repurpose to All Platforms'}
          </button>
        </div>
      </div>

      <div style={{ overflowY: 'auto' }}>
        {outputs.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 14 }}>
              Repurposed for {outputs.length} platforms
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {outputs.map((out, i) => {
                const color = PLATFORM_COLORS[out.platform] || '#3b82f6'
                const isThread = out.platform === 'Twitter/X Thread'
                const isLinkedIn = out.platform === 'LinkedIn Post'

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {out.platform === 'Instagram Caption' && (
                      <div style={{ background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid #333', maxWidth: 220, margin: '0 auto' }}>
                        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{userName}</div>
                            <div style={{ fontSize: 9, color: '#999' }}>Instagram</div>
                          </div>
                          <div style={{ marginLeft: 'auto', fontSize: 16, color: '#fff' }}>⋯</div>
                        </div>
                        <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #1a0a2e, #0d0d1a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: 28 }}>📸</div>
                        </div>
                        <div style={{ padding: '8px 12px 4px', display: 'flex', gap: 14, fontSize: 16 }}>
                          <span>♡</span><span>💬</span><span>↗</span>
                          <span style={{ marginLeft: 'auto' }}>🔖</span>
                        </div>
                        <div style={{ padding: '2px 12px 10px', fontSize: 10, color: '#fff', lineHeight: 1.4 }}>
                          {out.content.slice(0, 80)}...
                        </div>
                      </div>
                    )}

                    {out.platform === 'YouTube Description' && (
                      <div style={{ background: '#0f0f0f', borderRadius: 12, overflow: 'hidden', border: '1px solid #333', maxWidth: 220, margin: '0 auto' }}>
                        <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, #1a0a0a, #0d0d1a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          <div style={{ fontSize: 24 }}>▶</div>
                          <div style={{ position: 'absolute', bottom: 4, right: 6, background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 9, padding: '1px 4px', borderRadius: 3 }}>10:24</div>
                        </div>
                        <div style={{ padding: 10 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>
                            {out.content.slice(0, 60)}...
                          </div>
                          <div style={{ fontSize: 9, color: '#aaa' }}>1.2K views · 2 hours ago</div>
                        </div>
                      </div>
                    )}

                    {isThread && (
                      <div style={{ background: '#000', borderRadius: 14, overflow: 'hidden', border: '1px solid #2f3336', maxWidth: 240, margin: '0 auto' }}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{userName}</span>
                                <span style={{ fontSize: 9, color: '#666' }}>@handle</span>
                              </div>
                              <div style={{ fontSize: 10, color: '#e7e9ea', lineHeight: 1.4, marginTop: 3 }}>
                                {out.content.split('\n\n')[0].slice(0, 80)}
                              </div>
                              <div style={{ marginTop: 8, display: 'flex', gap: 14, color: '#666', fontSize: 14 }}>
                                <span>💬</span><span>🔁</span><span>♡</span><span>↑</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isLinkedIn && (
                      <div style={{ background: '#1b1f23', borderRadius: 10, overflow: 'hidden', border: '1px solid #2f3336', maxWidth: 240, margin: '0 auto' }}>
                        <div style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 6, background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{userName}</div>
                              <div style={{ fontSize: 9, color: '#94a3b8' }}>Content Creator · {profile?.niche}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: '#e2e8f0', lineHeight: 1.5 }}>
                            {out.content.slice(0, 100)}...
                          </div>
                        </div>
                        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid #2f3336', display: 'flex', gap: 10, fontSize: 9, color: '#666' }}>
                          <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
                        </div>
                      </div>
                    )}

                    <div className="card" style={{ padding: '12px 14px', borderLeft: `3px solid ${color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{out.platform}</span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(out.content); toast.success('Copied!') }}
                          className="btn btn-ghost btn-xs"
                        >
                          <Copy size={10} /> Copy
                        </button>
                      </div>
                      <p style={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.65, whiteSpace: 'pre-line', maxHeight: 120, overflow: 'hidden' }}>{out.content}</p>
                      {out.content.length > 200 && (
                        <button onClick={() => navigator.clipboard.writeText(out.content)} style={{ fontSize: 10, color, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                          Copy full text →
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <EmptyStudio icon={<Layers size={32} />} title="Repurposed content will appear here" sub="Paste your content and click Repurpose to All Platforms" />
        )}
      </div>
    </div>
  )
}
