import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { APIProxy } from '../services/APIProxy'
import { extractJSONArray } from '../utils/aiParsing'
import { Zap, AlertCircle, RefreshCw, X, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import type { TrendItem } from '../types'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  youtube: '#ef4444',
  linkedin: '#3b82f6',
  twitter: '#22d3ee',
}

const CATEGORIES = ['All', 'Tech', 'Travel', 'Lifestyle', 'Business', 'Finance', 'Sports', 'Culture', 'Fashion', 'Food', 'Beauty']

function VelocityBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = pct > 75 ? '#ec4899' : pct > 50 ? '#f97316' : '#3b82f6'
  return (
    <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 4, height: 4, width: '100%', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
      />
    </div>
  )
}

export function TrendRadar() {
  const { profile, trendData, setTrendData } = useStore()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('All')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null)
  const [sortBy, setSortBy] = useState<'velocity' | 'relevance'>('velocity')
  const [ideaModal, setIdeaModal] = useState<TrendItem | null>(null)
  const [ideaContent, setIdeaContent] = useState('')
  const [ideaLoading, setIdeaLoading] = useState(false)

  const trends = trendData || []
  const maxVelocity = trends.length > 0 ? Math.max(...trends.map(t => t.velocity || 0)) : 100

  const filtered = trends
    .filter(t => filter === 'All' || t.category === filter)
    .filter(t => platformFilter === 'all' || t.platform.includes(platformFilter as any))
    .sort((a, b) => sortBy === 'velocity' ? (b.velocity || 0) - (a.velocity || 0) : (b.relevanceScore || 0) - (a.relevanceScore || 0))

  const alerts = trends.filter(t => t.isAlert)

  function getAnyAIKeyFromStore() {
    const s = useStore.getState() as any
    return s.aiKey || s.anthropicKey || s.geminiKey || s.openaiKey || s.profile?.apiKey || null
  }

  async function refreshTrends() {
    setLoading(true)
    try {
      // PHASE 1: Fetch Actually Live Trending Data from Multiple Sources
      const ytPromise = APIProxy.secureRequest('youtube', 'trends', { tokens: { youtube: profile?.youtubeApiKey } })
      const webPromise = useStore.getState().googleSearchToken 
        ? APIProxy.secureRequest('web' as any, 'search', { query: `trending topics ${profile?.niche || 'general'} 2026`, tokens: { search: useStore.getState().googleSearchToken } })
        : Promise.resolve({ data: [] })

      const [ytResponse, webResponse] = await Promise.all([ytPromise, webPromise])
      
      let combinedRaw: any[] = []
      
      if (ytResponse.status === 'success' && ytResponse.source === 'live') {
        combinedRaw = [...combinedRaw, ...(ytResponse.data || []).map((v: any) => ({ ...v, platform: ['youtube'] }))]
      }
      
      if ('source' in webResponse && webResponse.source === 'live') {
        combinedRaw = [...combinedRaw, ...(webResponse.data || []).map((s: any) => ({ 
          id: Math.random().toString(36).substr(2, 9),
          topic: s.title,
          snippet: s.snippet,
          platform: ['web'] 
        }))]
      }
      
      if (combinedRaw.length === 0) {
        toast.error('No live data found — check your API keys.')
        setLoading(false)
        return
      }

      // PHASE 2: Enrich with REAL AI (The model now gets actual web+social data)
      const hasAnyAIKey = Boolean(getAnyAIKeyFromStore())
      if (hasAnyAIKey) {
        const resolvedAIKey = getAnyAIKeyFromStore()
        const aiResponse = await APIProxy.secureRequest('ai', 'generate-trends', { 
          prompt: `You are a viral trend analyst. Below is real-time data from YouTube and the general Web for a ${profile?.niche} creator in India. 
          DATA: ${JSON.stringify(combinedRaw.slice(0, 15))}
          
          TASK: Analyze this data and return a JSON list of 10 TrendItems. 
          Rank them by 'velocity' (1-500) and 'relevanceScore' (1-10).
          Categories: ${CATEGORIES.join(', ')}.
          Structure: [{"id","topic","velocity","category","platform":["youtube","instagram","web"],"relevanceScore","relatedKeywords":[],"isAlert"}]`,
          tokens: { ai: resolvedAIKey } 
        })
        if (aiResponse.status !== 'success') {
          toast.error(aiResponse.error || 'AI trend enrichment failed. Check selected provider and key.')
          setLoading(false)
          return
        }
        
        const raw = aiResponse.response || ''
        const parsed = extractJSONArray(raw)
        if (parsed) {
          setTrendData(parsed)
          toast.success(`Synchronized ${parsed.length} live trends!`, { icon: '🌐' })
        } else {
           toast.error('AI Enrichment failed to parse real data.')
        }
      } else {
        // Fallback for no AI key
        const mapped = combinedRaw.map((t: any) => ({
          id: t.id || Math.random().toString(36).substr(2, 9),
          topic: t.topic || t.title,
          velocity: 100,
          category: 'Trending',
          platform: t.platform || ['web'],
          relevanceScore: 7.0,
          relatedKeywords: ['live'],
          isAlert: false
        }))
        setTrendData(mapped)
        toast.success('Real data fetched (AI Enrichment required for ranking)')
      }
    } catch (e) {
      toast.error('Failed to refresh Trends')
      console.error(e)
    }
    setLoading(false)
  }

  async function generateIdea(trend: TrendItem) {
    setIdeaModal(trend)
    
    // Check cache first
    if ((trend as any).ideaSynthesis) {
        setIdeaContent((trend as any).ideaSynthesis)
        setIdeaLoading(false)
        return
    }

    setIdeaLoading(true)
    setIdeaContent('')
    if (!getAnyAIKeyFromStore()) {
      await new Promise(r => setTimeout(r, 800))
      const fallbackIdea = `**Hook**: "Everyone's talking about ${trend.topic} — but here's what nobody tells you..."\n\n**Angle**: Personal experience + data-backed insight\n\n**Format**: 60-second reel with text overlays\n\n**Script Outline**:\n1. Open with a bold claim about ${trend.topic}\n2. Share a surprising fact or personal story\n3. Give 3 actionable takeaways\n4. CTA: "Save this for later"\n\n**Caption**: Start with a question, use 10-15 niche hashtags, end with a call to action.\n\n**Best time to post**: Next 3-5 days before peak`
      
      setIdeaContent(fallbackIdea)
      setTrendData(trends.map(t => t.id === trend.id ? { ...t, ideaSynthesis: fallbackIdea } : t))
      setIdeaLoading(false)
      return
    }
    
    try {
      const prompt = `Create a content idea for the trend "${trend.topic}" for an Indian ${profile?.niche || 'lifestyle'} creator. Include: hook, content angle, best format, quick script outline, caption tips. Keep it actionable and specific.`
      
      const response = await APIProxy.secureRequest('ai', 'trend-idea', { prompt })
      const aiIdea = response.response || 'Failed to generate idea.'
      setIdeaContent(aiIdea)
      if (response.status === 'success' && aiIdea) {
        setTrendData(trends.map(t => t.id === trend.id ? { ...t, ideaSynthesis: aiIdea } : t))
      }
    } catch {
      setIdeaContent('Failed to generate idea. Try again.')
    }
    setIdeaLoading(false)
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Trend Radar</h1>
            <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
              Real-time trending topics ranked by velocity and niche relevance
            </p>
          </div>
          <button className="btn btn-blue btn-sm" onClick={refreshTrends} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Refreshing...' : 'Refresh Trends'}
          </button>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {alerts.map(a => (
              <motion.div
                key={a.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}
                onClick={() => setSelectedTrend(a)}
              >
                <AlertCircle size={13} color="#ec4899" />
                <span style={{ fontSize: 12, color: '#ec4899', fontWeight: 700 }}>Alert: {a.topic}</span>
                <span style={{ fontSize: 11, color: '#4b5680' }}>+{a.velocity}% velocity</span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: filter === c ? '1px solid #3b82f6' : '1px solid rgba(59,130,246,0.15)',
                background: filter === c ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: filter === c ? '#3b82f6' : '#4b5680',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 140ms',
              }}
            >{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Filter size={12} color="#4b5680" />
          {(['all', 'instagram', 'youtube', 'linkedin', 'twitter'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: platformFilter === p ? `1px solid ${PLATFORM_COLORS[p] || '#3b82f6'}` : '1px solid rgba(59,130,246,0.15)',
                background: platformFilter === p ? `${PLATFORM_COLORS[p] || '#3b82f6'}20` : 'transparent',
                color: platformFilter === p ? (PLATFORM_COLORS[p] || '#3b82f6') : '#4b5680',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 140ms',
                textTransform: 'capitalize',
              }}
            >{p}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['velocity', 'relevance'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                border: sortBy === s ? '1px solid #f97316' : '1px solid rgba(59,130,246,0.15)',
                background: sortBy === s ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: sortBy === s ? '#f97316' : '#4b5680',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 140ms',
                textTransform: 'capitalize',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {filtered.length === 0 && !loading && (
          <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '100px 40px', background: 'rgba(59,130,246,0.02)', border: '1px dashed rgba(59,130,246,0.1)', borderRadius: 20 }}>
            <Zap size={32} color="#4b5680" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>No Live Trends Found</h3>
            <p style={{ fontSize: 13, color: '#4b5680', maxWidth: 400, margin: '0 auto 24px' }}>
              Connect your YouTube API key to start seeing real-time trending topics specialized for your niche.
            </p>
            {!Boolean(getAnyAIKeyFromStore()) && (
              <p style={{ fontSize: 11, color: '#ec4899', fontWeight: 600 }}>⚠️ AI Enrichment requires an AI Key in settings</p>
            )}
          </div>
        )}
        {filtered.map((trend, i) => (
          <motion.div
            key={trend.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card"
            style={{ padding: '18px 20px', cursor: 'pointer', borderColor: selectedTrend?.id === trend.id ? 'rgba(59,130,246,0.4)' : undefined }}
            onClick={() => setSelectedTrend(trend.id === selectedTrend?.id ? null : trend)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {trend.isAlert && <AlertCircle size={12} color="#ec4899" />}
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>{trend.topic}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>{trend.category}</span>
                  {trend.platform.map((p: string) => (
                    <span key={p} style={{ fontSize: 10, color: PLATFORM_COLORS[p] || '#3b82f6', fontWeight: 600, textTransform: 'capitalize' }}>{p}</span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: trend.velocity > 300 ? '#ec4899' : trend.velocity > 200 ? '#f97316' : '#3b82f6', letterSpacing: '-0.02em' }}>
                  +{trend.velocity}%
                </div>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>velocity</div>
              </div>
            </div>

            <VelocityBar value={trend.velocity} max={maxVelocity} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {trend.relatedKeywords.map((k: string) => (
                  <span key={k} style={{ fontSize: 10, color: '#4b5680', background: 'rgba(59,130,246,0.05)', padding: '2px 7px', borderRadius: 5 }}>#{k.replace(/\s/g, '')}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#fbbf24' }} />
                <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>{trend.relevanceScore}/10</span>
              </div>
            </div>

            <AnimatePresence>
              {selectedTrend?.id === trend.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', marginTop: 14, paddingTop: 14 }}>
                    {trend.peakDate && (
                      <div style={{ fontSize: 11, color: '#f97316', fontWeight: 600, marginBottom: 10 }}>
                        Peak predicted: {trend.peakDate} — create now for maximum impact
                      </div>
                    )}
                    <button
                      className="btn btn-blue btn-sm"
                      style={{ width: '100%' }}
                      onClick={e => { e.stopPropagation(); generateIdea(trend) }}
                    >
                      <Zap size={12} /> Generate Content Idea for This Trend
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Idea Modal */}
      {ideaModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: 560, maxHeight: '80vh', background: '#111122', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>Content Idea</div>
                <div style={{ fontSize: 12, color: '#4b5680', marginTop: 2 }}>{ideaModal.topic}</div>
              </div>
              <button onClick={() => setIdeaModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {ideaLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#4b5680' }}>
                  <div style={{ width: 32, height: 32, border: '2px solid rgba(59,130,246,0.3)', borderTop: '2px solid #3b82f6', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                  Generating idea...
                </div>
              ) : (
                <pre style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{ideaContent}</pre>
              )}
            </div>
            {!ideaLoading && ideaContent && (
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(59,130,246,0.1)' }}>
                <button className="btn btn-blue" style={{ width: '100%' }} onClick={() => {
                  navigator.clipboard.writeText(ideaContent)
                  toast.success('Idea copied to clipboard!')
                }}>Copy Idea</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
