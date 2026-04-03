import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../store'
import { Copy, RefreshCw, Zap, Bookmark, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { lbl } from './shared'

interface Hook {
  id: string
  type: string
  platform: string[]
  formula: string
  example: string
}

const ALL_HOOKS: Hook[] = [
  { id: 'h01', type: 'curiosity', platform: ['YouTube'], formula: 'The [shocking truth] about [topic] nobody is talking about', example: 'The dark truth about YouTube growth nobody is talking about' },
  { id: 'h02', type: 'controversy', platform: ['TikTok'], formula: 'Unpopular opinion: [bold statement]', example: 'Unpopular opinion: posting every day is ruining your channel' },
  { id: 'h03', type: 'value', platform: ['Instagram'], formula: '[Number] [topic] tips that changed my [outcome]', example: '7 editing tips that changed my reel quality overnight' },
  { id: 'h04', type: 'story', platform: ['LinkedIn'], formula: 'I [failed at X]. Here\'s what I learned.', example: 'I lost 50k followers in a week. Here\'s what I learned.' },
  { id: 'h05', type: 'fear', platform: ['YouTube'], formula: 'You\'re [losing/missing/wasting] [X] without knowing it', example: 'You\'re losing subscribers every day without knowing it' },
  { id: 'h06', type: 'social', platform: ['TikTok'], formula: '[Big number] [people/creators] are using this [thing] to [result]', example: '10,000 creators are using this one trick to go viral' },
  { id: 'h07', type: 'curiosity', platform: ['Instagram', 'TikTok'], formula: 'What happens when you [unexpected action] for [time period]', example: 'What happens when you post at 3am for 30 days straight' },
  { id: 'h08', type: 'value', platform: ['YouTube', 'LinkedIn'], formula: 'How to [achieve result] without [common pain point]', example: 'How to grow on YouTube without showing your face' },
  { id: 'h09', type: 'story', platform: ['Instagram'], formula: 'Nobody warned me about [thing]. So I\'m warning you.', example: 'Nobody warned me about creator burnout. So I\'m warning you.' },
  { id: 'h10', type: 'fear', platform: ['LinkedIn', 'YouTube'], formula: 'If you\'re not doing [X] in [year], you\'re already behind', example: 'If you\'re not using short-form in 2025, you\'re already behind' },
  { id: 'h11', type: 'controversy', platform: ['YouTube', 'Instagram'], formula: 'I tried [popular advice] for [time]. Here\'s why it doesn\'t work.', example: 'I tried posting daily for 90 days. Here\'s why it doesn\'t work.' },
  { id: 'h12', type: 'social', platform: ['Instagram', 'LinkedIn'], formula: 'This is how [successful person/brand] actually [did X]', example: 'This is how MrBeast actually structures his thumbnails' },
  { id: 'h13', type: 'curiosity', platform: ['TikTok', 'Instagram'], formula: 'Stop [doing X]. Do this instead.', example: 'Stop using trending audio. Do this instead.' },
  { id: 'h14', type: 'value', platform: ['TikTok'], formula: '[Number]-second rule that changed how I [do X]', example: '3-second rule that changed how I write captions' },
  { id: 'h15', type: 'story', platform: ['YouTube', 'LinkedIn'], formula: 'From [low point] to [high point] in [timeframe]', example: 'From 200 to 200,000 subscribers in 11 months' },
  { id: 'h16', type: 'fear', platform: ['TikTok', 'Instagram'], formula: 'The algorithm just changed and most creators have no idea', example: 'Instagram\'s algorithm just changed and most creators have no idea' },
  { id: 'h17', type: 'controversy', platform: ['LinkedIn'], formula: 'Hot take: [mainstream belief] is actually [opposite view]', example: 'Hot take: consistency is actually overrated for growth' },
  { id: 'h18', type: 'social', platform: ['YouTube'], formula: '[Celebrity/expert] told me [surprising thing]. They were right.', example: 'Gary Vee told me to post garbage. He was right.' },
  { id: 'h19', type: 'curiosity', platform: ['LinkedIn', 'Twitter'], formula: 'The [thing] that [experts/gurus] don\'t tell you about [topic]', example: 'The part that business gurus don\'t tell you about going viral' },
  { id: 'h20', type: 'value', platform: ['Instagram', 'YouTube'], formula: 'I analyzed [big number] [pieces of content]. Here\'s the pattern.', example: 'I analyzed 500 viral reels. Here\'s the exact pattern.' },
  { id: 'h21', type: 'story', platform: ['TikTok'], formula: 'POV: You just discovered [transformative thing]', example: 'POV: You just discovered why your Reels have zero reach' },
  { id: 'h22', type: 'fear', platform: ['YouTube', 'LinkedIn'], formula: 'Your [metric/asset] is dropping and you don\'t even know why', example: 'Your watch time is dropping and you don\'t even know why' },
  { id: 'h23', type: 'controversy', platform: ['Instagram', 'TikTok'], formula: 'I deleted [big thing] for [time] and this happened', example: 'I deleted my best-performing post for a week and this happened' },
  { id: 'h24', type: 'social', platform: ['TikTok', 'Instagram'], formula: 'Every big creator uses [secret method]. Now you can too.', example: 'Every big creator uses this B-roll method. Now you can too.' },
  { id: 'h25', type: 'curiosity', platform: ['YouTube'], formula: 'Wait until you hear what [person/thing] actually [did/said]', example: 'Wait until you hear what the YouTube algorithm actually rewards' },
  { id: 'h26', type: 'value', platform: ['LinkedIn'], formula: '[Number] things I wish I knew before [milestone]', example: '5 things I wish I knew before hitting 100K followers' },
  { id: 'h27', type: 'story', platform: ['YouTube', 'Instagram'], formula: 'I spent [money/time] on [thing]. Was it worth it?', example: 'I spent ₹50,000 on camera gear. Was it worth it?' },
  { id: 'h28', type: 'fear', platform: ['TikTok'], formula: 'You have [time window] before [platform] makes this impossible', example: 'You have 3 months before TikTok makes organic reach impossible' },
  { id: 'h29', type: 'controversy', platform: ['YouTube', 'LinkedIn'], formula: '[Big number] creators fail at [thing]. Here\'s the real reason.', example: '95% of creators fail at monetization. Here\'s the real reason.' },
  { id: 'h30', type: 'social', platform: ['Instagram', 'LinkedIn'], formula: 'I asked [big number] [people] about [topic]. The answers shocked me.', example: 'I asked 1,000 creators about burnout. The answers shocked me.' },
  { id: 'h31', type: 'curiosity', platform: ['TikTok', 'YouTube'], formula: 'The [hidden feature/strategy] that [platform] doesn\'t advertise', example: 'The hidden TikTok setting that doubles your reach' },
  { id: 'h32', type: 'value', platform: ['Instagram', 'TikTok'], formula: 'How I went from [X] to [Y] just by changing [one thing]', example: 'How I went from 500 to 50K views just by changing my hook' },
  { id: 'h33', type: 'story', platform: ['LinkedIn'], formula: 'My biggest professional mistake was [thing]. Here\'s what it taught me.', example: 'My biggest professional mistake was chasing viral. Here\'s what it taught me.' },
  { id: 'h34', type: 'fear', platform: ['Instagram', 'YouTube'], formula: 'Every day you wait to [action] is costing you [result]', example: 'Every day you wait to build an email list is costing you income' },
  { id: 'h35', type: 'controversy', platform: ['TikTok', 'Instagram'], formula: 'Nobody talks about [uncomfortable truth] but I will', example: 'Nobody talks about creator debt but I will' },
  { id: 'h36', type: 'social', platform: ['YouTube', 'LinkedIn'], formula: '[Action] like [aspirational figure] with this one framework', example: 'Script like Alex Hormozi with this one framework' },
  { id: 'h37', type: 'curiosity', platform: ['Instagram', 'LinkedIn'], formula: 'The [counterintuitive thing] that actually [positive outcome]', example: 'The post with zero effort that actually got me brand deals' },
  { id: 'h38', type: 'value', platform: ['YouTube', 'TikTok'], formula: '[Specific timeframe] to [impressive result] using [method]', example: '21 days to 10K followers using only educational content' },
  { id: 'h39', type: 'story', platform: ['Instagram', 'TikTok'], formula: 'This one [decision/moment] changed everything for my [thing]', example: 'This one collaboration changed everything for my channel' },
  { id: 'h40', type: 'fear', platform: ['LinkedIn', 'Instagram'], formula: 'Are you making this [category] mistake without realizing it?', example: 'Are you making this content strategy mistake without realizing it?' },
  { id: 'h41', type: 'controversy', platform: ['YouTube'], formula: 'I broke every [rule/best practice] and here\'s what happened', example: 'I broke every YouTube SEO rule and here\'s what happened' },
  { id: 'h42', type: 'social', platform: ['TikTok', 'Instagram'], formula: 'The exact [tool/method] that got [creator/brand] to [result]', example: 'The exact script format that got this creator to 1M views' },
]

const HOOK_TYPE_COLORS: Record<string, string> = {
  curiosity: '#06b6d4',
  controversy: '#ef4444',
  value: '#10b981',
  story: '#a78bfa',
  fear: '#f97316',
  social: '#ec4899',
}

const HOOK_TYPES = ['all', 'curiosity', 'controversy', 'value', 'story', 'fear', 'social']
const HOOK_PLATFORMS = ['all', 'YouTube', 'TikTok', 'Instagram', 'LinkedIn']

export function HookLibrary() {
  const { profile } = useStore()
  const [selectedType, setSelectedType] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [savedHooks, setSavedHooks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('creator-saved-hooks') || '[]') } catch { return [] }
  })
  const [personalizeInput, setPersonalizeInput] = useState('')
  const [personalizeNiche, setPersonalizeNiche] = useState(profile?.niche || '')
  const [personalizeLoading, setPersonalizeLoading] = useState(false)
  const [personalizedResult, setPersonalizedResult] = useState('')
  const [showSavedOnly, setShowSavedOnly] = useState(false)

  function toggleSave(id: string) {
    setSavedHooks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('creator-saved-hooks', JSON.stringify(next))
      return next
    })
  }

  const filtered = ALL_HOOKS.filter(h => {
    if (showSavedOnly && !savedHooks.includes(h.id)) return false
    if (selectedType !== 'all' && h.type !== selectedType) return false
    if (platformFilter !== 'all' && !h.platform.includes(platformFilter)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!h.formula.toLowerCase().includes(q) && !h.example.toLowerCase().includes(q)) return false
    }
    return true
  })

  async function personalize() {
    if (!personalizeInput) return
    setPersonalizeLoading(true)
    setPersonalizedResult('')
    const apiKey = profile?.apiKey
    const niche = personalizeNiche || profile?.niche || 'content creation'

    if (!apiKey) {
      await new Promise(r => setTimeout(r, 700))
      const filled = personalizeInput
        .replace(/\[topic\]/gi, niche)
        .replace(/\[shocking truth\]/gi, 'hidden strategy')
        .replace(/\[thing\]/gi, 'technique')
        .replace(/\[X\]/gi, niche)
        .replace(/\[outcome\]/gi, 'results')
        .replace(/\[timeframe\]/gi, '30 days')
        .replace(/\[bold statement\]/gi, `working harder isn\'t the answer in ${niche}`)
      setPersonalizedResult(`${filled}\n\n[Demo mode — add API key for AI-personalized hooks]`)
      setPersonalizeLoading(false)
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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Personalize this hook formula for a creator in the "${niche}" niche. Fill in all brackets with specific, compelling details tailored to that niche. Return ONLY the filled hook text, nothing else.\n\nHook formula: ${personalizeInput}`,
          }],
        }),
      })
      const data = await res.json()
      setPersonalizedResult(data.content?.[0]?.text?.trim() || '')
      toast.success('Hook personalized!')
    } catch {
      toast.error('Personalization failed')
    } finally {
      setPersonalizeLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4b5680', pointerEvents: 'none' }} />
            <input
              className="field"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search hooks..."
              style={{ paddingLeft: 32, fontSize: 13 }}
            />
          </div>
          <button
            onClick={() => setShowSavedOnly(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20,
              fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1px solid',
              background: showSavedOnly ? 'rgba(251,191,36,0.12)' : 'transparent',
              borderColor: showSavedOnly ? '#f59e0b' : 'rgba(59,130,246,0.15)',
              color: showSavedOnly ? '#f59e0b' : '#6b7a9a', transition: 'all 140ms',
            }}
          >
            <Bookmark size={12} fill={showSavedOnly ? '#f59e0b' : 'none'} /> Saved ({savedHooks.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'center', marginRight: 4 }}>Type</span>
          {HOOK_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: selectedType === t ? (t === 'all' ? 'rgba(59,130,246,0.12)' : `${HOOK_TYPE_COLORS[t]}15`) : 'transparent',
                borderColor: selectedType === t ? (t === 'all' ? '#3b82f6' : HOOK_TYPE_COLORS[t]) : 'rgba(59,130,246,0.15)',
                color: selectedType === t ? (t === 'all' ? '#3b82f6' : HOOK_TYPE_COLORS[t]) : '#6b7a9a',
                transition: 'all 140ms', textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', alignSelf: 'center', marginRight: 4 }}>Platform</span>
          {HOOK_PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: platformFilter === p ? 'rgba(167,139,250,0.12)' : 'transparent',
                borderColor: platformFilter === p ? '#a78bfa' : 'rgba(59,130,246,0.15)',
                color: platformFilter === p ? '#a78bfa' : '#6b7a9a', transition: 'all 140ms',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#4b5680', fontWeight: 700 }}>{filtered.length} hooks</span>
        {(selectedType !== 'all' || platformFilter !== 'all' || searchQuery || showSavedOnly) && (
          <button
            onClick={() => { setSelectedType('all'); setPlatformFilter('all'); setSearchQuery(''); setShowSavedOnly(false) }}
            style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(hook => (
          <motion.div
            key={hook.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.05em', textTransform: 'capitalize', background: `${HOOK_TYPE_COLORS[hook.type]}18`, color: HOOK_TYPE_COLORS[hook.type] }}>
                {hook.type}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {hook.platform.map(p => (
                  <span key={p} style={{ fontSize: 10, fontWeight: 700, color: '#6b7a9a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 7px' }}>{p}</span>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={() => toggleSave(hook.id)}
                aria-label={savedHooks.includes(hook.id) ? 'Unsave hook' : 'Save hook'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedHooks.includes(hook.id) ? '#f59e0b' : '#4b5680', padding: 4, transition: 'color 140ms' }}
              >
                <Bookmark size={14} fill={savedHooks.includes(hook.id) ? '#f59e0b' : 'none'} />
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#6b7a9a', fontFamily: 'Space Mono, monospace', lineHeight: 1.6, margin: 0 }}>
              {hook.formula}
            </p>

            <p style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
              "{hook.example}"
            </p>

            <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => { navigator.clipboard.writeText(hook.example); toast.success('Hook copied!') }}
              >
                <Copy size={10} /> Copy
              </button>
              <button
                className="btn btn-xs"
                style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', color: '#ec4899', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                onClick={() => { setPersonalizeInput(hook.formula); setPersonalizedResult(''); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) }}
              >
                <Zap size={10} /> Personalize
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5680' }}>
          <Zap size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 700, fontSize: 14, color: '#6b7a9a', marginBottom: 6 }}>No hooks match your filters</p>
          <p style={{ fontSize: 12.5 }}>Try clearing your filters or search with different keywords</p>
        </div>
      )}

      <AnimatePresence>
        {personalizeInput && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="card"
            style={{ padding: '18px 20px', border: '1px solid rgba(236,72,153,0.2)', marginTop: 8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Zap size={15} color="#ec4899" />
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em', margin: 0 }}>Personalize Hook</h3>
              <button
                onClick={() => { setPersonalizeInput(''); setPersonalizedResult('') }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}
                aria-label="Close personalize panel"
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Space Mono, monospace', margin: 0, lineHeight: 1.6 }}>
                {personalizeInput}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Your niche / topic</label>
                <input
                  className="field"
                  value={personalizeNiche}
                  onChange={e => setPersonalizeNiche(e.target.value)}
                  placeholder={profile?.niche || 'e.g. personal finance, travel...'}
                  style={{ fontSize: 13 }}
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  className="btn btn-pink"
                  onClick={personalize}
                  disabled={personalizeLoading}
                  style={{ opacity: personalizeLoading ? 0.7 : 1 }}
                >
                  {personalizeLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
                  {personalizeLoading ? 'Personalizing...' : 'Personalize with AI'}
                </button>
              </div>
            </div>

            {personalizedResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.2)', borderRadius: 10, padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#ec4899', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Personalized Hook</span>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => { navigator.clipboard.writeText(personalizedResult); toast.success('Personalized hook copied!') }}
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
                <p style={{ fontSize: 14, color: '#f0f4ff', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
                  {personalizedResult}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
