import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { APIProxy } from '../services/APIProxy'
import { Dna, Sparkles, RefreshCw, Copy, Download, ChevronDown, ChevronUp, Instagram, Youtube, Loader2, Search, ExternalLink, Grid, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ContentDNAResult } from '../types'

function PillarBar({ pillar, percentage, color, delay }: { pillar: string; percentage: number; color: string; delay: number }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{pillar}</span>
        <span style={{ fontSize: 13, color, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>{percentage}%</span>
      </div>
      <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay }}
          style={{ height: '100%', borderRadius: 6, background: color, boxShadow: `0 0 10px ${color}50` }}
        />
      </div>
    </div>
  )
}

function HookCard({ pattern, frequency, rank }: { pattern: string; frequency: number; rank: number }) {
  const [copied, setCopied] = useState(false)
  const maxFreq = 34
  const pct = (frequency / maxFreq) * 100
  const color = rank === 0 ? '#ec4899' : rank === 1 ? '#f97316' : '#3b82f6'

  function copy() {
    navigator.clipboard.writeText(pattern)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.08 }}
      style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${color}08`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color }}>{rank + 1}</span>
        </div>
        <p style={{ flex: 1, fontSize: 13, color: '#cbd5e1', fontWeight: 600, fontStyle: 'italic', lineHeight: 1.4 }}>{pattern}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{frequency}%</span>
          <button
            onClick={copy}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#10b981' : '#4b5680', display: 'flex', transition: 'color 200ms' }}
          >
            <Copy size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Profile Analyzer ─────────────────────────────────────────────────
interface ProfileAnalysis {
  contentStyle: string
  postingFrequency: string
  topContentTypes: string[]
  audienceInsights: string
  contentPillars: string[]
  hookStyle: string
  toneAndVoice: string
  recommendations: string[]
  dnaAdaptation: string
}

function ProfileAnalyzer({ profile }: { profile: { apiKey?: string; niche: string; name: string } }) {
  const [ytChannelId, setYtChannelId] = useState('')
  const [ytApiKey, setYtApiKey] = useState('')
  const [igPaste, setIgPaste] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<ProfileAnalysis | null>(null)
  const [activeSource, setActiveSource] = useState<'youtube' | 'instagram'>('youtube')
  const [ytData, setYtData] = useState<{ channelTitle: string; subscribers: string; videoCount: string; recentVideos: string[] } | null>(null)
  // Instagram Graph API state
  const [igAccessToken, setIgAccessToken] = useState('')
  const [igSubTab, setIgSubTab] = useState<'own' | 'any'>('own')
  const [igRealData, setIgRealData] = useState<{ username: string; postCount: number; accountType: string; posts: any[] } | null>(null)

  async function fetchYouTube() {
    if (!ytChannelId.trim() || !ytApiKey.trim()) { toast.error('Enter Channel ID and YouTube API key'); return }
    setAnalyzing(true)
    try {
      const aiKey = (useStore.getState() as any).aiKey
      const tokens = { youtube: ytApiKey.trim(), ai: aiKey }
      const response = await APIProxy.secureRequest('youtube', 'stats', { channelId: ytChannelId.trim(), tokens })
      
      if (response.status === 'error') {
        toast.error(response.error || 'YouTube API error — check Channel ID and API key')
        setAnalyzing(false)
        return
      }

      const channelData = {
        channelTitle: response.data.localized?.title || 'YouTube Channel',
        subscribers: Number(response.data.subscriberCount).toLocaleString(),
        videoCount: response.data.videoCount,
        recentVideos: response.data.recentVideos || [],
      }
      setYtData(channelData)

      // Analyze with Claude
      if (aiKey) {
        await analyzeWithClaude('youtube', JSON.stringify(channelData))
      } else {
        setResult(getDemoAnalysis('youtube', channelData.channelTitle))
        toast.success(`Analyzed ${channelData.channelTitle} (demo AI mode)`)
        setAnalyzing(false)
      }
    } catch (err) {
      toast.error('YouTube API error — check Channel ID and API key')
      setAnalyzing(false)
    }
  }

  async function analyzeInstagram() {
    if (!igPaste.trim()) { toast.error('Paste your Instagram profile data first'); return }
    setAnalyzing(true)
    const aiKey = (useStore.getState() as any).aiKey
    if (aiKey) {
      await analyzeWithClaude('instagram', igPaste)
    } else {
      setResult(getDemoAnalysis('instagram', 'Your Instagram'))
      toast.success('Profile analyzed (demo AI mode)')
      setAnalyzing(false)
    }
  }

  async function fetchInstagramRealData() {
    if (!igAccessToken.trim()) { toast.error('Enter your Instagram Access Token'); return }
    setAnalyzing(true)
    try {
      const aiKey = (useStore.getState() as any).aiKey
      const tokens = { instagram: igAccessToken.trim(), ai: aiKey }
      const response = await APIProxy.secureRequest('instagram', 'real-data', { accessToken: igAccessToken.trim(), tokens })

      if (response.status === 'error') {
        toast.error(response.error || 'Failed to fetch Instagram data — check your token and permissions')
        setAnalyzing(false)
        return
      }

      const realData = {
        username: response.data.profile.username || 'unknown',
        postCount: response.data.profile.media_count || response.data.posts.length,
        accountType: response.data.profile.account_type || 'PERSONAL',
        posts: response.data.posts,
      }
      setIgRealData(realData)

      const dataForClaude = {
        profile: { username: realData.username, media_count: realData.postCount, account_type: realData.accountType },
        posts: realData.posts.map((p: any) => ({
          caption: p.caption || '',
          media_type: p.media_type,
          timestamp: p.timestamp,
          like_count: p.like_count,
          comments_count: p.comments_count,
        })),
      }

      if (aiKey) {
        const prompt = `Analyze this creator's real Instagram post data and extract their content DNA. Focus on: recurring themes, hook patterns, caption style, best performing post types, optimal posting patterns.

Data: ${JSON.stringify(dataForClaude, null, 2)}

Provide analysis in JSON format:
{
  "contentStyle": "description of their content visual/editing style based on media types",
  "postingFrequency": "inferred posting cadence from timestamps",
  "topContentTypes": ["list of content formats they use most"],
  "audienceInsights": "what drives engagement based on like/comment counts",
  "contentPillars": ["3-4 main topics from captions"],
  "hookStyle": "how they typically open captions",
  "toneAndVoice": "their tone and communication style",
  "recommendations": ["5 specific actionable insights from the real data"],
  "dnaAdaptation": "how to apply these patterns to ${profile.niche} niche"
}`
        await analyzeWithClaude('instagram', prompt)
        toast.success(`Analyzed @${realData.username}'s real Instagram data!`)
      } else {
        setResult(getDemoAnalysis('instagram', `@${realData.username}`))
        toast.success(`Fetched ${realData.posts.length} posts from @${realData.username} (demo AI mode)`)
      }
    } catch {
      toast.error('Failed to fetch Instagram data — check your token and permissions')
    } finally {
      setAnalyzing(false)
    }
  }

  async function analyzeWithClaude(platform: string, data: string) {
    const prompt = `Analyze this ${platform} creator profile data and extract their content strategy:

${data}

Provide a detailed analysis in JSON format:
{
  "contentStyle": "description of their content visual/editing style",
  "postingFrequency": "how often they post",
  "topContentTypes": ["list of content formats they use most"],
  "audienceInsights": "who their audience is and what resonates",
  "contentPillars": ["3-4 main topics they cover"],
  "hookStyle": "how they typically start content",
  "toneAndVoice": "their tone and communication style",
  "recommendations": ["5 specific things to copy or adapt from this creator"],
  "dnaAdaptation": "how to adapt their style to ${profile.niche} niche"
}`

    try {
      const aiKey = (useStore.getState() as any).aiKey
      const response = await APIProxy.secureRequest('ai', 'analyze-profile', { prompt, tokens: { ai: aiKey } })
      
      if (response.status === 'error') {
        toast.error(response.error || 'AI analysis failed')
        return
      }

      const text = response.response || '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]) as ProfileAnalysis)
        toast.success('Profile analysis complete!')
      } else {
        toast.error('AI response not in expected JSON format.')
      }
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  function getDemoAnalysis(platform: string, name: string): ProfileAnalysis {
    return {
      contentStyle: `${name} uses a clean, high-contrast editing style with fast cuts and bold text overlays. Consistent color palette of navy and white for brand recognition.`,
      postingFrequency: platform === 'youtube' ? '2-3 videos per week, Tuesday and Thursday peak' : '5-6 posts per week, 3 reels + 2 carousels + 1 story',
      topContentTypes: platform === 'youtube' ? ['Long-form tutorials (15-20 min)', 'Shorts (60s tips)', 'Vlogs', 'Collab challenges'] : ['Educational carousels', 'Trending reels', 'Behind-the-scenes stories', 'Q&A posts'],
      audienceInsights: `Primarily 22-35 year olds interested in ${profile.niche}. High engagement on "how-to" and "mistake" themed content. Comments show strong desire for actionable advice.`,
      contentPillars: ['Tutorial & How-to', 'Personal Story & Journey', 'Trends & News', 'Mistakes & Lessons'],
      hookStyle: 'Opens with a bold statement or counter-intuitive claim in first 3 seconds. Uses "Did you know..." and "Stop doing..." patterns frequently.',
      toneAndVoice: 'Casual but authoritative. Mixes humor with value delivery. First-person storytelling with direct audience address.',
      recommendations: [
        `Adopt their fast-paced editing style for your ${profile.niche} reels`,
        'Copy their "mistake-based" hook pattern ("The #1 mistake in [topic]")',
        'Add bold text overlays to reinforce key points',
        'Use their thumbnail style: face + bold text + emotion',
        'Borrow their posting rhythm of Tue/Thu for algorithm momentum',
      ],
      dnaAdaptation: `Apply their storytelling framework to ${profile.niche} by leading with a relatable problem your audience faces, then providing a step-by-step solution in your niche expertise.`,
    }
  }

  return (
    <div>
      {/* Source tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        <button className={`tab ${activeSource === 'youtube' ? 'active' : ''}`} onClick={() => setActiveSource('youtube')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Youtube size={13} /> YouTube Analysis
        </button>
        <button className={`tab ${activeSource === 'instagram' ? 'active' : ''}`} onClick={() => setActiveSource('instagram')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Instagram size={13} /> Instagram Analysis
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, alignItems: 'start' }}>
        {/* Input panel */}
        <div>
          {activeSource === 'youtube' && (
            <div>
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Youtube size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>YouTube Data API Required</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>
                      Get a free API key at console.cloud.google.com → Enable YouTube Data API v3. Enter any public channel's ID (found in channel URL or About page).
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>YouTube Channel ID</label>
                <input className="field" placeholder="UCxxxxxx... (from channel URL)" value={ytChannelId} onChange={(e) => setYtChannelId(e.target.value)} />
                <div style={{ fontSize: 10.5, color: '#4b5680', marginTop: 4 }}>
                  Find it in: youtube.com/@channelname → About → Share → Copy channel ID
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>YouTube Data API Key</label>
                <input className="field" type="password" placeholder="AIzaSy..." value={ytApiKey} onChange={(e) => setYtApiKey(e.target.value)} />
              </div>
              <button onClick={fetchYouTube} disabled={analyzing} className="btn btn-blue" style={{ width: '100%', gap: 6, justifyContent: 'center' }}>
                {analyzing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
                {analyzing ? 'Fetching & analyzing…' : 'Analyze YouTube Channel'}
              </button>

              {ytData && (
                <div style={{ marginTop: 16, background: '#111122', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>{ytData.channelTitle}</div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', fontFamily: 'Space Mono' }}>{ytData.subscribers}</div>
                      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700 }}>Subscribers</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Mono' }}>{ytData.videoCount}</div>
                      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700 }}>Videos</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Recent Videos</div>
                  {ytData.recentVideos.slice(0, 5).map((title, i) => (
                    <div key={i} style={{ fontSize: 11.5, color: '#94a3b8', padding: '3px 0', borderBottom: i < 4 ? '1px solid rgba(59,130,246,0.06)' : 'none' }}>{title}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSource === 'instagram' && (
            <div>
              {/* Sub-tabs */}
              <div className="tab-bar" style={{ marginBottom: 16 }}>
                <button className={`tab ${igSubTab === 'own' ? 'active' : ''}`} onClick={() => { setIgSubTab('own'); setResult(null); setIgRealData(null) }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Instagram size={12} /> My Account
                </button>
                <button className={`tab ${igSubTab === 'any' ? 'active' : ''}`} onClick={() => { setIgSubTab('any'); setResult(null); setIgRealData(null) }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Search size={12} /> Any Profile
                </button>
              </div>

              {igSubTab === 'own' && (
                <div>
                  {/* Info box */}
                  <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <Instagram size={15} color="#ec4899" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f9a8d4', marginBottom: 6 }}>Instagram Graph API — Real Data</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6 }}>
                          Get your token at <span style={{ color: '#f9a8d4', fontWeight: 600 }}>developers.facebook.com → Graph API Explorer</span>. Select your Instagram app, pick your account, then request permissions: <span style={{ color: '#fbbf24', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>instagram_basic, pages_read_engagement</span> → Generate Token.
                        </div>
                        <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, color: '#ec4899', fontWeight: 600, textDecoration: 'none' }}>
                          <ExternalLink size={11} /> Open Graph API Explorer
                        </a>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={lbl}>Instagram Access Token</label>
                    <input
                      className="field"
                      type="password"
                      placeholder="EAAxxxxxxxx..."
                      value={igAccessToken}
                      onChange={(e) => setIgAccessToken(e.target.value)}
                    />
                  </div>

                  <button onClick={fetchInstagramRealData} disabled={analyzing} className="btn btn-pink" style={{ width: '100%', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
                    {analyzing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
                    {analyzing ? 'Fetching & Analysing…' : 'Fetch & Analyse'}
                  </button>

                  {/* Mini stats after fetch */}
                  {igRealData && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#111122', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff' }}>@{igRealData.username}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5680', fontWeight: 600 }}>{igRealData.accountType}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#ec4899', fontFamily: 'Space Mono' }}>{igRealData.postCount.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700 }}>POSTS</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Grid size={10} /> Last {igRealData.posts.length} Posts
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {igRealData.posts.map((post: any, i: number) => (
                          <div key={i} style={{ background: 'rgba(236,72,153,0.05)', border: '1px solid rgba(236,72,153,0.12)', borderRadius: 8, padding: '7px 8px' }}>
                            <span style={{ display: 'inline-block', fontSize: 9, background: post.media_type === 'VIDEO' ? 'rgba(239,68,68,0.15)' : post.media_type === 'CAROUSEL_ALBUM' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)', color: post.media_type === 'VIDEO' ? '#ef4444' : post.media_type === 'CAROUSEL_ALBUM' ? '#f59e0b' : '#3b82f6', padding: '1px 5px', borderRadius: 4, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              {post.media_type === 'CAROUSEL_ALBUM' ? 'ALBUM' : post.media_type || 'IMG'}
                            </span>
                            <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {(post.caption || '(no caption)').slice(0, 40)}
                            </div>
                            <div style={{ fontSize: 9, color: '#4b5680', marginTop: 4, fontFamily: 'Space Mono, monospace' }}>
                              ♥ {post.like_count ?? '–'} · 💬 {post.comments_count ?? '–'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {igSubTab === 'any' && (
                <div>
                  <div style={{ background: 'rgba(236,72,153,0.04)', border: '1px solid rgba(236,72,153,0.12)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <FileText size={15} color="#ec4899" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#f9a8d4', marginBottom: 3 }}>Manual Profile Paste</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5 }}>
                          Open any public Instagram profile → copy their bio and 10–15 recent captions → paste below. AI will extract content style and patterns.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={lbl}>Instagram Profile Data</label>
                    <textarea
                      className="field"
                      rows={8}
                      placeholder={`Paste profile info here, e.g.:

Bio: Travel photographer & storyteller 📸
@username | 125K followers

Recent captions:
"The hidden beaches of Goa nobody talks about..."
"Morning routine that changed everything for me..."
"Why I quit my 9-5 for content creation..."
"3 things I wish I knew before starting my channel..."
"POV: you wake up in a Pahadi village at 4am..."`}
                      value={igPaste}
                      onChange={(e) => setIgPaste(e.target.value)}
                      style={{ resize: 'vertical', fontSize: 12, lineHeight: 1.6 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <button
                      onClick={() => setIgPaste('Bio: Travel & lifestyle creator 📸 Exploring India one village at a time\n@wanderlust.india | 88K followers | Mumbai based\n\nRecent posts:\n"Nobody talks about the 3am bus to Spiti. Here\'s what happens..."\n"I tried the 5am morning routine for 21 days. Honest results inside."\n"The mistake every first-time trekker makes in Himachal."\n"Stop booking Manali. Go here instead (cheaper, less crowded)."\n"How I got my first brand deal with 10K followers."\n"3 things I stopped doing that grew my following by 20K."\n"The Kedarkantha trek — what no travel blogger tells you."\n"Morning routine of a full-time creator (realistic version)."\n"Why I almost quit content creation in month 6."')}
                      className="btn btn-ghost btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      Try Demo
                    </button>
                    <button onClick={analyzeInstagram} disabled={analyzing} className="btn btn-pink" style={{ flex: 1, gap: 5, justifyContent: 'center' }}>
                      {analyzing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                      {analyzing ? 'Analyzing…' : 'Analyze Profile'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analysis results */}
        <div>
          {!result && !analyzing && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#4b5680' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#3b82f6' }}>
                <Search size={22} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#6b7a9a', marginBottom: 6 }}>Analyze any public creator profile</p>
              <p style={{ fontSize: 12, lineHeight: 1.5 }}>Extract their content style, hooks, and patterns to adapt for your own niche</p>
            </div>
          )}

          {analyzing && (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <Loader2 size={28} color="#3b82f6" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7a9a' }}>Analyzing content patterns…</div>
            </div>
          )}

          {result && !analyzing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Content Style', value: result.contentStyle, color: '#3b82f6' },
                { label: 'Posting Frequency', value: result.postingFrequency, color: '#10b981' },
                { label: 'Hook Style', value: result.hookStyle, color: '#ec4899' },
                { label: 'Tone & Voice', value: result.toneAndVoice, color: '#f97316' },
                { label: 'Audience Insights', value: result.audienceInsights, color: '#a78bfa' },
              ].map((item) => (
                <div key={item.label} style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 11, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{item.label}</div>
                  <div style={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.6 }}>{item.value}</div>
                </div>
              ))}

              {/* Content Pillars */}
              <div style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Content Pillars</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.contentPillars.map((p, i) => (
                    <span key={i} style={{ fontSize: 11.5, background: 'rgba(245,158,11,0.1)', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 11, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>How to Adapt This Style</div>
                {result.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: '#e2e8f0' }}>
                    <span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                    {rec}
                  </div>
                ))}
                {result.dnaAdaptation && (
                  <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>For your niche:</span> {result.dnaAdaptation}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}

export function ContentDNA() {
  const { profile, contentDNA, setContentDNA, calendarPosts, ideas, aiKey } = useStore()
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('hooks')
  const [activeTab, setActiveTab] = useState<'dna' | 'profile-analyzer'>('dna')

  const dna = contentDNA

  async function analyzeDNA() {
    if (!aiKey) {
      toast.error('AI Key required for DNA analysis. Please update Settings.')
      return
    }
    setLoading(true)
    try {
      const ideaTitles = ideas.slice(0, 15).map(i => i.title).join(', ')
      const postTitles = calendarPosts.slice(0, 15).map(p => p.title).join(', ')
      const prompt = `Analyze the content DNA for an Indian creator in "${profile?.niche}" niche with tone "${profile?.tone?.join(', ')}". Their content ideas: ${ideaTitles}. Their posts: ${postTitles}. Return JSON: { hookPatterns: [{pattern, frequency}x5], toneFingerprint: [5 adjectives], contentPillars: [{pillar, percentage, color}x4], avgPostLength: string, bestFormats: [4 strings], audienceTriggers: [4 strings], uniqueVoiceMarkers: [5 strings], postingRhythm: string, generatedAt: ISO string }. No other text.`

      const response = await APIProxy.secureRequest('ai', 'analyze-dna', { prompt, tokens: { ai: aiKey } })
      const raw = response.response || '{}'
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as ContentDNAResult
        setContentDNA(result)
        toast.success('Your Content DNA has been analyzed!')
      } else {
        toast.error('AI was unable to format your DNA structure.')
        setContentDNA(null as any)
      }
    } catch {
      toast.error('AI analysis failed')
      setContentDNA(null as any)
    }
    setLoading(false)
  }

  function exportDNA() {
    if (!dna) return
    const text = `# My Content DNA
Generated: ${new Date(dna.generatedAt).toLocaleDateString()}

## Hook Patterns
${dna.hookPatterns.map((h: any, i: number) => `${i + 1}. ${h.pattern} (${h.frequency}% of content)`).join('\n')}

## Tone Fingerprint
${dna.toneFingerprint.join(' · ')}

## Content Pillars
${dna.contentPillars.map((p: any) => `- ${p.pillar}: ${p.percentage}%`).join('\n')}

## Best Formats
${dna.bestFormats.map((f: any) => `- ${f}`).join('\n')}

## Audience Triggers
${dna.audienceTriggers.map((t: any) => `- ${t}`).join('\n')}

## Unique Voice Markers
${dna.uniqueVoiceMarkers.map((v: any) => `- ${v}`).join('\n')}

## Posting Rhythm
${dna.postingRhythm}
`
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'content-dna.md'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Content DNA exported!')
  }

  function toggle(s: string) {
    setExpandedSection(expandedSection === s ? null : s)
  }

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
      <button
        onClick={() => toggle(id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>{title}</span>
        {expandedSection === id ? <ChevronUp size={15} color="#4b5680" /> : <ChevronDown size={15} color="#4b5680" />}
      </button>
      <AnimatePresence>
        {expandedSection === id && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 20px 20px' }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Content DNA</h1>
            <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
              AI-powered analysis of your unique creative fingerprint + competitor profile analysis
            </p>
          </div>
          {activeTab === 'dna' && (
            <div style={{ display: 'flex', gap: 10 }}>
              {dna && (
                <button className="btn btn-ghost btn-sm" onClick={exportDNA}>
                  <Download size={13} /> Export
                </button>
              )}
              <button className="btn btn-blue btn-sm" onClick={analyzeDNA} disabled={loading}>
                {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                {loading ? 'Analyzing...' : dna ? 'Re-analyze' : 'Analyze My DNA'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginTop: 20 }}>
          <button className={`tab ${activeTab === 'dna' ? 'active' : ''}`} onClick={() => setActiveTab('dna')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Dna size={12} /> My Content DNA
          </button>
          <button className={`tab ${activeTab === 'profile-analyzer' ? 'active' : ''}`} onClick={() => setActiveTab('profile-analyzer')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Search size={12} /> Profile Analyzer
          </button>
        </div>
      </motion.div>

      {/* Profile Analyzer Tab */}
      {activeTab === 'profile-analyzer' && profile && (
        <ProfileAnalyzer profile={profile} />
      )}

      {activeTab === 'dna' && !dna && !loading ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 32px' }}
        >
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(236,72,153,0.12))', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Dna size={32} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', marginBottom: 10 }}>Discover Your Content DNA</h2>
          <p style={{ color: '#4b5680', fontSize: 13, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Our AI will analyze your ideas, posting patterns, and niche to extract your unique creative fingerprint — the formula behind your best content.
          </p>
          <button className="btn btn-blue" onClick={analyzeDNA}>
            <Sparkles size={14} /> Analyze Now
          </button>
        </motion.div>
      ) : loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 32px' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 20px', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', border: '2px solid rgba(59,130,246,0.2)', borderTop: '2px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 8, border: '2px solid rgba(236,72,153,0.2)', borderBottom: '2px solid #ec4899', borderRadius: '50%', animation: 'spin 1.5s linear infinite reverse' }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>Analyzing your content DNA...</div>
          <div style={{ fontSize: 12, color: '#4b5680' }}>Extracting hook patterns · Mapping content pillars · Identifying voice markers</div>
        </motion.div>
      ) : dna ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Summary banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(236,72,153,0.07))', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 16, padding: '20px 24px', marginBottom: 18, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Tone', value: dna.toneFingerprint.slice(0, 3).join(' · '), color: '#3b82f6' },
              { label: 'Avg Length', value: dna.avgPostLength, color: '#ec4899' },
              { label: 'Top Format', value: dna.bestFormats[0], color: '#10b981' },
              { label: 'Analyzed', value: new Date(dna.generatedAt).toLocaleDateString('en-IN'), color: '#f59e0b' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: s.color, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Hook Patterns */}
          <Section id="hooks" title="🎣 Hook Patterns — Your Top 5 Openers">
            <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 14, lineHeight: 1.6 }}>
              These are the hook formulas that appear most in your content style. Copy and adapt them for your next post.
            </p>
            {dna.hookPatterns.map((h, i) => (
              <HookCard key={i} pattern={h.pattern} frequency={h.frequency} rank={i} />
            ))}
          </Section>

          {/* Content Pillars */}
          <Section id="pillars" title="🏛️ Content Pillars">
            {dna.contentPillars.map((p: any, i: number) => (
              <PillarBar key={p.pillar} pillar={p.pillar} percentage={p.percentage} color={p.color} delay={i * 0.1} />
            ))}
          </Section>

          {/* Voice Markers */}
          <Section id="voice" title="🎤 Unique Voice Markers">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dna.uniqueVoiceMarkers.map((v: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(236,72,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#ec4899' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, fontWeight: 500 }}>{v}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* Audience Triggers */}
          <Section id="triggers" title="🧲 Audience Triggers">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {dna.audienceTriggers.map((t: any, i: number) => (
                <div key={i} style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, lineHeight: 1.4 }}>{t}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Posting Rhythm */}
          <Section id="rhythm" title="⏰ Posting Rhythm">
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 14, color: '#10b981', fontWeight: 700 }}>{dna.postingRhythm}</div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best Formats</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dna.bestFormats.map((f: any, i: number) => (
                  <span key={i} style={{ fontSize: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '5px 12px', borderRadius: 8, fontWeight: 600 }}>{f}</span>
                ))}
              </div>
            </div>
          </Section>
        </motion.div>
      ) : null}
    </div>
  )
}
