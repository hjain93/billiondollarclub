import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Copy, Hash, Plus, Trash2, Sparkles, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface HashtagSet {
  name: string
  niche: string
  broad: string[]
  medium: string[]
  niche_tags: string[]
}

const NICHE_SETS: HashtagSet[] = [
  {
    name: 'Travel',
    niche: 'travel',
    broad: ['#travel', '#travelgram', '#wanderlust', '#travelphotography', '#instatravel'],
    medium: ['#indiatravelgram', '#incredibleindia', '#solotravel', '#backpacking', '#travelindia'],
    niche_tags: ['#pahad', '#uttarakhand', '#himalayas', '#trekking', '#digitalnomadindia'],
  },
  {
    name: 'Fitness',
    niche: 'fitness',
    broad: ['#fitness', '#gym', '#workout', '#fitnessmotivation', '#health'],
    medium: ['#indiafit', '#fitindia', '#homeworkout', '#weightloss', '#personaltraining'],
    niche_tags: ['#indianfitness', '#calisthenics', '#functionalfitness', '#yogaindia', '#fitbody'],
  },
  {
    name: 'Finance',
    niche: 'finance',
    broad: ['#finance', '#money', '#investing', '#personalfinance', '#financialfreedom'],
    medium: ['#stockmarket', '#mutualfunds', '#nifty', '#sensex', '#sipinvestment'],
    niche_tags: ['#zerodha', '#growwapp', '#indianstockmarket', '#passiveincomeindia', '#financialindia'],
  },
  {
    name: 'Food',
    niche: 'food',
    broad: ['#food', '#foodie', '#foodphotography', '#yummy', '#delicious'],
    medium: ['#indianfood', '#homecooking', '#foodblogger', '#streetfood', '#indiafoodies'],
    niche_tags: ['#mumbaifood', '#delhifood', '#bengalurufoodie', '#thali', '#desifood'],
  },
  {
    name: 'Tech',
    niche: 'tech',
    broad: ['#tech', '#technology', '#gadgets', '#innovation', '#ai'],
    medium: ['#techreview', '#smartphone', '#techtips', '#android', '#indiatechnology'],
    niche_tags: ['#maketechhuman', '#startupindia', '#techbloggerindia', '#gadgetreview', '#aitools'],
  },
  {
    name: 'Fashion',
    niche: 'fashion',
    broad: ['#fashion', '#style', '#ootd', '#fashionblogger', '#outfitoftheday'],
    medium: ['#indianfashion', '#ethnicwear', '#streetstyle', '#fashionindia', '#styleinspo'],
    niche_tags: ['#sustainablefashion', '#slowfashion', '#DesignerWear', '#indianstyle', '#desiswag'],
  },
  {
    name: 'Education',
    niche: 'education',
    broad: ['#education', '#learning', '#studytips', '#knowledge', '#students'],
    medium: ['#upsc', '#studygram', '#selfimprovement', '#personaldevelopment', '#studymotivation'],
    niche_tags: ['#ias', '#neet', '#jee', '#onlinelearning', '#edtech'],
  },
  {
    name: 'Lifestyle',
    niche: 'lifestyle',
    broad: ['#lifestyle', '#daily', '#motivation', '#happiness', '#mindfulness'],
    medium: ['#slowliving', '#wellbeing', '#selfcare', '#morningroutine', '#productivitytips'],
    niche_tags: ['#intentionalliving', '#digitaldetox', '#minimalism', '#contentcreator', '#solopreneur'],
  },
  {
    name: 'Business',
    niche: 'business',
    broad: ['#business', '#entrepreneur', '#startup', '#success', '#motivation'],
    medium: ['#smallbusiness', '#solopreneur', '#sidehustle', '#startupindia', '#businesstips'],
    niche_tags: ['#bootstrapped', '#saas', '#b2bmarketing', '#freelanceindia', '#indianentrepreneur'],
  },
  {
    name: 'Gaming',
    niche: 'gaming',
    broad: ['#gaming', '#gamer', '#videogames', '#gameplay', '#esports'],
    medium: ['#mobilegaming', '#indiegames', '#pubgmobile', '#freefire', '#battlegroundsmobileindia'],
    niche_tags: ['#indiangamer', '#gamelive', '#pcgaming', '#gamingcommunity', '#indiegamedev'],
  },
]

interface SavedSet {
  id: string
  name: string
  platform: string
  tags: string[]
}

export function HashtagStrategy() {
  const { profile } = useStore()
  const [activePlatform, setActivePlatform] = useState('instagram')
  const [activeNiche, setActiveNiche] = useState(0)
  const [savedSets, setSavedSets] = useState<SavedSet[]>([])
  const [topic, setTopic] = useState('')
  const [generated, setGenerated] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [tagsToSave, setTagsToSave] = useState<string[]>([])

  const PLATFORMS = ['instagram', 'linkedin', 'twitter']
  const set = NICHE_SETS[activeNiche]
  const allTags = [...set.broad, ...set.medium, ...set.niche_tags]
  const charCount = allTags.join(' ').length

  function copyTags(tags: string[]) {
    navigator.clipboard.writeText(tags.join(' '))
    toast.success(`${tags.length} hashtags copied!`, {
      style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' },
    })
  }

  function openSave(tags: string[]) {
    setTagsToSave(tags)
    setSaveName('')
    setShowSaveModal(true)
  }

  function saveSet() {
    if (!saveName.trim()) { toast.error('Enter a name'); return }
    const newSet: SavedSet = {
      id: Math.random().toString(36).slice(2),
      name: saveName.trim(),
      platform: activePlatform,
      tags: tagsToSave,
    }
    setSavedSets((prev) => [newSet, ...prev])
    setShowSaveModal(false)
    toast.success('Set saved!', {
      style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' },
    })
  }

  function deleteSet(id: string) {
    setSavedSets((prev) => prev.filter((s) => s.id !== id))
  }

  async function generateHashtags() {
    if (!topic.trim()) { toast.error('Enter a topic first'); return }
    setGenerating(true)

    const apiKey = profile?.apiKey
    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 700))
      const demo = [
        `#${topic.toLowerCase().replace(/\s+/g, '')}`,
        '#contentcreator', '#creatoreconomy', '#indiancreator',
        `#${profile?.niche || 'travel'}content`, '#viral', '#reels',
        '#instagram', '#youtube', '#trending', '#growyouraudience',
        '#contentmarketing', '#socialmediatips', '#creatorsofinstagram',
        '#reelsinstagram', '#trendingnow', '#explore', '#explorepage',
        '#india', '#indiacreator', '#digitalcreator', '#contentgrowth',
        '#audiencebuilding', '#creatortips', `#${topic.split(' ')[0].toLowerCase()}`,
        `#${topic.split(' ').slice(-1)[0].toLowerCase()}`,
        '#niche', '#engagementrate', '#insights', '#analytics', '#growth',
      ].slice(0, 30)
      setGenerated(demo)
      setGenerating(false)
      toast.success('Demo hashtags generated!', {
        style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' },
      })
      return
    }

    try {
      const prompt = `Generate exactly 30 relevant hashtags for a ${activePlatform} post about "${topic}" for an Indian ${profile?.niche || 'content'} creator.
Mix: 30% broad (1M+ posts), 40% medium (100K-1M), 30% niche (<100K).
Return only a JSON array of hashtag strings starting with #.`

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
          max_tokens: 600,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text: string = data.content?.[0]?.text || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        setGenerated(JSON.parse(match[0]))
        toast.success('30 hashtags generated!')
      }
    } catch {
      toast.error('Error generating hashtags')
    } finally {
      setGenerating(false)
    }
  }

  const reachLabel = (tags: HashtagSet) => {
    const total = tags.broad.length + tags.medium.length + tags.niche_tags.length
    return `~${total * 2}M potential reach`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Platform picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform:</span>
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePlatform(p)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: activePlatform === p ? 'rgba(59,130,246,0.15)' : 'transparent',
              border: `1px solid ${activePlatform === p ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
              color: activePlatform === p ? '#3b82f6' : '#6b7a9a',
              transition: 'all 140ms',
              textTransform: 'capitalize',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* AI Generator */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Sparkles size={14} color="#fbbf24" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI Hashtag Generator</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: generated.length > 0 ? 16 : 0 }}>
          <input
            className="field"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateHashtags()}
            placeholder="Enter a topic or post description..."
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-blue"
            onClick={generateHashtags}
            disabled={generating}
            style={{ whiteSpace: 'nowrap', opacity: generating ? 0.7 : 1 }}
          >
            {generating ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
            {generating ? 'Generating...' : 'Generate 30'}
          </button>
        </div>

        {generated.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>
                {generated.length} hashtags · {generated.join(' ').length} chars
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openSave(generated)}>
                  <Plus size={11} /> Save Set
                </button>
                <button className="btn btn-blue btn-sm" onClick={() => copyTags(generated)}>
                  <Copy size={11} /> Copy All
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {generated.map((h) => (
                <span
                  key={h}
                  onClick={() => { navigator.clipboard.writeText(h); toast.success('Copied!') }}
                  style={{
                    fontSize: 11.5, padding: '4px 10px', borderRadius: 12,
                    background: 'rgba(251,191,36,0.08)',
                    color: '#fbbf24',
                    fontWeight: 600, cursor: 'pointer',
                    transition: 'background 140ms',
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.background = 'rgba(251,191,36,0.18)')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'rgba(251,191,36,0.08)')}
                >
                  {h}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Niche preset sets */}
      <div className="card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Hash size={14} color="#3b82f6" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Niche Hashtag Sets</span>
        </div>

        {/* Niche tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {NICHE_SETS.map((n, i) => (
            <button
              key={n.niche}
              onClick={() => setActiveNiche(i)}
              style={{
                padding: '4px 12px', borderRadius: 16, fontSize: 11.5, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: activeNiche === i ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.04)',
                border: `1px solid ${activeNiche === i ? '#3b82f6' : 'rgba(59,130,246,0.12)'}`,
                color: activeNiche === i ? '#3b82f6' : '#6b7a9a',
                transition: 'all 140ms',
              }}
            >
              {n.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeNiche}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {/* Set header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>
                  {set.name} Hashtags
                </div>
                <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>
                  {allTags.length} tags · {charCount} chars · {reachLabel(set)} · 30% broad + 40% medium + 30% niche
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openSave(allTags)}>
                  <Plus size={11} /> Save
                </button>
                <button className="btn btn-blue btn-sm" onClick={() => copyTags(allTags)}>
                  <Copy size={11} /> Copy All
                </button>
              </div>
            </div>

            {[
              { label: 'Broad (1M+ posts)', tags: set.broad, color: '#ec4899', pct: '30%' },
              { label: 'Medium (100K–1M)', tags: set.medium, color: '#3b82f6', pct: '40%' },
              { label: 'Niche (<100K)', tags: set.niche_tags, color: '#10b981', pct: '30%' },
            ].map(({ label, tags, color, pct }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 10, color: '#3b4260', fontWeight: 600 }}>{pct} of mix</span>
                  <button
                    onClick={() => copyTags(tags)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 11, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map((h) => (
                    <span
                      key={h}
                      onClick={() => { navigator.clipboard.writeText(h); toast.success('Copied!') }}
                      style={{
                        fontSize: 11.5, padding: '3px 10px', borderRadius: 12,
                        background: `${color}08`,
                        color,
                        fontWeight: 600, cursor: 'pointer', border: `1px solid ${color}22`,
                        transition: 'background 140ms',
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.background = `${color}18`)}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.background = `${color}08`)}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Saved sets */}
      {savedSets.length > 0 && (
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Plus size={14} color="#10b981" />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>My Saved Sets</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {savedSets.map((s) => (
              <div
                key={s.id}
                style={{
                  background: 'rgba(59,130,246,0.04)',
                  border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 12,
                  padding: '12px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: '#4b5680', marginLeft: 8, textTransform: 'capitalize' }}>
                      {s.platform} · {s.tags.length} tags
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => copyTags(s.tags)}>
                      <Copy size={10} /> Copy
                    </button>
                    <button
                      onClick={() => deleteSet(s.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 3, display: 'flex' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#4b5680')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.6 }}>
                  {s.tags.slice(0, 8).join(' ')}
                  {s.tags.length > 8 && <span style={{ color: '#3b82f6' }}> +{s.tags.length - 8} more</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save modal */}
      <AnimatePresence>
        {showSaveModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.6)', zIndex: 80 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 90, width: 360,
                background: '#0d0d1a',
                border: '1px solid rgba(59,130,246,0.22)',
                borderRadius: 16, padding: '22px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Save Hashtag Set</h3>
                <button onClick={() => setShowSaveModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex' }}>
                  <X size={15} />
                </button>
              </div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
                Set Name
              </label>
              <input
                className="field"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveSet()}
                placeholder="My travel hashtags..."
                autoFocus
                style={{ marginBottom: 14 }}
              />
              <p style={{ fontSize: 11, color: '#4b5680', marginBottom: 16 }}>{tagsToSave.length} tags will be saved</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowSaveModal(false)}>Cancel</button>
                <button className="btn btn-blue" style={{ flex: 2, justifyContent: 'center' }} onClick={saveSet}>Save Set</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
