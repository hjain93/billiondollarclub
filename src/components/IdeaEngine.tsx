import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { APIProxy } from '../services/APIProxy'
import { extractJSONArray } from '../utils/aiParsing'
import { useAIQuota } from '../utils/entitlements'
import type { ContentIdea, ContentType, Platform } from '../types'
import {
  Sparkles, Plus, RefreshCw, Trash2, MoveRight,
  Video, Image, FileText, MessageSquare, LayoutGrid,
  CalendarPlus, X, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  reel: <Video size={12} />,
  carousel: <LayoutGrid size={12} />,
  post: <Image size={12} />,
  video: <Video size={12} />,
  thread: <MessageSquare size={12} />,
  article: <FileText size={12} />,
  story: <Image size={12} />,
}

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#e1306c',
  youtube: '#ff0000',
  linkedin: '#0077b5',
  twitter: '#1da1f2',
}

// Strict Live mode: mock constants purged

const KANBAN_COLS: { id: ContentIdea['status']; label: string; color: string }[] = [
  { id: 'inbox', label: 'Inbox', color: '#6b7a9a' },
  { id: 'planned', label: 'Planned', color: '#3b82f6' },
  { id: 'creating', label: 'Creating', color: '#ec4899' },
  { id: 'done', label: 'Done', color: '#10b981' },
]

function scoreColor(score: number) {
  if (score >= 9) return '#fbbf24'
  if (score >= 8) return '#3b82f6'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

function scoreBg(score: number) {
  if (score >= 9) return 'rgba(251,191,36,0.12)'
  if (score >= 8) return 'rgba(59,130,246,0.12)'
  if (score >= 6) return 'rgba(245,158,11,0.12)'
  return 'rgba(239,68,68,0.12)'
}

function IdeaCard({
  idea,
  onMove,
  onDelete,
  onSchedule,
}: {
  idea: ContentIdea
  onMove: (id: string, status: ContentIdea['status']) => void
  onDelete: (id: string) => void
  onSchedule: (idea: ContentIdea) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const nextStatus: Record<ContentIdea['status'], ContentIdea['status'] | null> = {
    inbox: 'planned',
    planned: 'creating',
    creating: 'done',
    done: null,
  }
  const next = nextStatus[idea.status]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="idea-card"
      style={{ padding: '14px 16px', cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Score + type */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {CONTENT_TYPE_ICONS[idea.contentType]}
          <span style={{ fontSize: 11, color: '#6b7280', textTransform: 'capitalize' }}>
            {idea.contentType}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            className="badge"
            style={{
              background: scoreBg(idea.aiScore),
              color: scoreColor(idea.aiScore),
            }}
          >
            {idea.aiScore.toFixed(1)}
          </span>
          {idea.aiScore > 8.5 && (
            <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
              🔥 TRENDING
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 600,
          fontSize: 13,
          color: '#e2e8f0',
          lineHeight: 1.4,
          marginBottom: 6,
        }}
      >
        {idea.title}
      </h4>

      {/* Platforms */}
      <div style={{ display: 'flex', gap: 4, marginBottom: expanded ? 10 : 0 }}>
        {idea.platforms.map((p) => (
          <span
            key={p}
            style={{
              fontSize: 10,
              padding: '1px 7px',
              borderRadius: 10,
              background: `${PLATFORM_COLORS[p]}18`,
              color: PLATFORM_COLORS[p],
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {p}
          </span>
        ))}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                lineHeight: 1.5,
                fontStyle: 'italic',
                padding: '8px 0',
                borderTop: '1px solid rgba(59,130,246,0.1)',
                marginTop: 8,
              }}
            >
              "{idea.hook}"
            </p>

            {/* Score breakdown */}
            <div style={{ marginTop: 8 }}>
              {Object.entries(idea.scoreBreakdown).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#4b5563', width: 120, textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(59,130,246,0.1)', borderRadius: 2 }}>
                    <div
                      style={{
                        width: `${(val / 10) * 100}%`,
                        height: '100%',
                        background: scoreColor(val),
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: scoreColor(val), fontFamily: 'Space Mono, monospace', width: 20 }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div
              style={{ display: 'flex', gap: 8, marginTop: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              {next && (
                <button
                  className="btn btn-blue"
                  style={{ flex: 1, padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  onClick={() => onMove(idea.id, next)}
                >
                  Move to {next.charAt(0).toUpperCase() + next.slice(1)}
                  <MoveRight size={12} />
                </button>
              )}
              {idea.status === 'inbox' && (
                <button
                  style={{
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid rgba(16,185,129,0.25)',
                    background: 'rgba(16,185,129,0.08)',
                    color: '#10b981',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                    transition: 'all 150ms ease',
                  }}
                  onClick={() => onSchedule(idea)}
                >
                  <CalendarPlus size={12} /> Schedule
                </button>
              )}
              <button
                style={{
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(239,68,68,0.2)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
                onClick={() => onDelete(idea.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function IdeaEngine() {
  const {
    profile,
    ideas,
    addIdea,
    updateIdeaStatus,
    removeIdea,
    addCalendarPost,
    aiKey,
  } = useStore()
  const { isAtLimit, limit, used } = useAIQuota()
  const [isGenerating, setIsGenerating] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [scheduleIdea, setScheduleIdea] = useState<ContentIdea | null>(null)
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  const [schedulePlatforms, setSchedulePlatforms] = useState<Platform[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [batchSelected, setBatchSelected] = useState<string[]>([])
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0])

  function getAnyAIKeyFromStore() {
    const s = useStore.getState() as any
    return s.aiKey || s.anthropicKey || s.geminiKey || s.openaiKey || s.profile?.apiKey || null
  }

  function seedDemoIdeas() {
    toast.error('No saved AI provider key found. In Settings > Integrations, add a key and click Save All Integrations.', { icon: '🔐' })
  }

  async function generateIdeas() {
    const hasAnyAIKey = Boolean(getAnyAIKeyFromStore())
    if (!hasAnyAIKey) {
      seedDemoIdeas()
      return
    }
    setIsGenerating(true)
    try {
      const prompt = `You are a viral content strategist for Indian creators. Generate 5 high-potential content ideas for a ${profile?.niche || 'travel'} creator.
Account context:
- Followers: ${profile?.handles?.[0]?.followerCount || '10,000'}
- Platform: ${profile?.handles?.[0]?.platform || 'YouTube'}
- Recent Trend Alignment: High
- Profile Tone: ${profile?.tone?.join(', ') || 'educational, personal'}

Return a JSON array of 5 ideas with this exact structure:
[{
  "title": "compelling title",
  "hook": "first-sentence hook",
  "contentType": "reel|carousel|post|video|thread",
  "platforms": ["instagram","youtube"],
  "aiScore": 8.5,
  "scoreBreakdown": {"hookStrength":9,"nicheRelevance":8,"trendAlignment":8,"engagementPotential":9,"channelFit":8,"uniqueness":8},
  "tags": ["tag1","tag2"]
}]`

      const data = await APIProxy.secureRequest('ai', 'generate-ideas', { prompt })
      if (data.status !== 'success') {
        toast.error(data.error || 'AI generation failed. Verify provider key and selected provider in Settings.')
        return
      }
      const text = data.response || ''
      
      // Fallback to mock ideas if proxy is in dummy mode or parsing fails
      const newIdeas = extractJSONArray(text)
      if (newIdeas) {
        newIdeas.forEach((idea: any) => {
          addIdea({
            ...idea,
            id: Math.random().toString(36).slice(2),
            status: 'inbox',
            source: 'ai_generated',
            createdAt: new Date().toISOString(),
          })
        })
        toast.success(`${newIdeas.length} ideas generated via secure proxy!`)
      } else {
        toast.error('AI returned an unexpected format. Try again or switch provider in Settings.')
      }
    } catch (e: any) {
      toast.error(e.message || 'Engine connection error. Verify your AI key.')
    } finally {
      setIsGenerating(false)
    }
  }

  function addManualIdea() {
    if (!manualTitle.trim()) return
    addIdea({
      id: Math.random().toString(36).slice(2),
      title: manualTitle,
      hook: '',
      contentType: 'post',
      platforms: ['instagram'],
      aiScore: 0,
      scoreBreakdown: { hookStrength: 0, nicheRelevance: 0, trendAlignment: 0, engagementPotential: 0, channelFit: 0, uniqueness: 0 },
      status: 'inbox',
      source: 'manual',
      tags: [],
      createdAt: new Date().toISOString(),
    })
    setManualTitle('')
    setShowAddForm(false)
    toast.success('Idea added!', { style: { background: '#0f0f2a', color: '#e2e8f0', border: '1px solid rgba(59,130,246,0.3)' } })
  }

  function openSchedule(idea: ContentIdea) {
    setScheduleIdea(idea)
    setScheduleDate(new Date().toISOString().split('T')[0])
    setSchedulePlatforms(idea.platforms.slice())
  }

  function confirmSchedule() {
    if (!scheduleIdea) return
    const platforms = schedulePlatforms.length > 0 ? schedulePlatforms : scheduleIdea.platforms
    platforms.forEach((platform) => {
      addCalendarPost({
        id: Math.random().toString(36).slice(2),
        title: scheduleIdea.title,
        platform,
        contentType: scheduleIdea.contentType,
        status: 'scheduled',
        scheduledAt: scheduleDate,
        ideaId: scheduleIdea.id,
        aiScore: scheduleIdea.aiScore,
      })
    })
    updateIdeaStatus(scheduleIdea.id, 'planned')
    toast.success(
      `Scheduled to ${platforms.join(', ')} for ${new Date(scheduleDate + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      { style: { background: '#0f0f2a', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)' } }
    )
    setScheduleIdea(null)
  }

  function toggleBatchIdea(id: string) {
    setBatchSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function confirmBatch() {
    if (batchSelected.length === 0) { toast.error('Select at least one idea'); return }
    batchSelected.forEach((id) => {
      const idea = ideas.find((i) => i.id === id)
      if (!idea) return
      idea.platforms.forEach((platform) => {
        addCalendarPost({
          id: Math.random().toString(36).slice(2),
          title: idea.title,
          platform,
          contentType: idea.contentType,
          status: 'scheduled',
          scheduledAt: batchDate,
          ideaId: idea.id,
          aiScore: idea.aiScore,
        })
      })
      updateIdeaStatus(id, 'planned')
    })
    toast.success(`${batchSelected.length} ideas scheduled!`, {
      style: { background: '#0f0f2a', color: '#e2e8f0', border: '1px solid rgba(16,185,129,0.3)' },
    })
    setBatchMode(false)
    setBatchSelected([])
  }

  return (
    <div style={{ padding: '32px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 24,
              color: '#e2e8f0',
              marginBottom: 4,
            }}
          >
            Idea Engine
          </h1>
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            AI-powered ideas scored across 6 virality dimensions. {ideas.length} ideas in pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-ghost"
            style={{ padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} />
            Add Idea
          </motion.button>
          {ideas.some((i) => i.status === 'inbox') && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setBatchMode(!batchMode); setBatchSelected([]) }}
              style={{
                padding: '10px 16px', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8,
                background: batchMode ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)',
                border: `1px solid ${batchMode ? 'rgba(16,185,129,0.4)' : 'rgba(16,185,129,0.2)'}`,
                borderRadius: 10, cursor: 'pointer', color: '#10b981',
                fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700,
                transition: 'all 140ms',
              }}
            >
              <Calendar size={14} />
              {batchMode ? 'Exit Batch' : 'Batch Schedule'}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-blue"
            style={{
              padding: '10px 20px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: isGenerating || isAtLimit ? 0.7 : 1,
            }}
            onClick={generateIdeas}
            disabled={isGenerating || isAtLimit}
          >
            {isGenerating ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={14} />
            )}
            {isGenerating ? 'Generating...' : isAtLimit ? `Limit Reached (${used}/${limit})` : 'Generate with AI'}
          </motion.button>
        </div>
      </div>

      {/* Manual add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 20 }}
          >
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addManualIdea()}
                  placeholder="Enter your idea title..."
                  style={{
                    flex: 1,
                    background: 'rgba(10,10,20,0.8)',
                    border: '1px solid rgba(59,130,246,0.18)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    color: '#e2e8f0',
                    fontSize: 14,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    outline: 'none',
                  }}
                />
                <button className="btn btn-blue" style={{ padding: '10px 20px', fontSize: 14 }} onClick={addManualIdea}>
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch schedule bar */}
      <AnimatePresence>
        {batchMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 16, overflow: 'hidden' }}
          >
            <div style={{
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <CalendarPlus size={15} color="#10b981" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                Batch Mode — click inbox ideas to select ({batchSelected.length} selected)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Week of:</label>
                <input
                  type="date"
                  className="field"
                  value={batchDate}
                  onChange={(e) => setBatchDate(e.target.value)}
                  style={{ width: 160, padding: '6px 10px', fontSize: 12 }}
                />
                <button
                  className="btn btn-blue btn-sm"
                  onClick={confirmBatch}
                  disabled={batchSelected.length === 0}
                  style={{ opacity: batchSelected.length === 0 ? 0.5 : 1 }}
                >
                  Schedule {batchSelected.length > 0 ? batchSelected.length : ''} Ideas
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {ideas.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'rgba(59,130,246,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={28} color="#3b82f6" />
          </div>
          <h3
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: '#e2e8f0',
              marginBottom: 8,
            }}
          >
            Tell me your niche and I'll find 10 ideas that will perform
          </h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            {aiKey
              ? `Generating personalised ideas for ${profile?.niche}...`
              : 'Secure your AI key in settings, or click below for demo ideas'}
          </p>
          <button className="btn btn-blue" style={{ padding: '12px 28px', fontSize: 14 }} onClick={generateIdeas}>
            <Sparkles size={14} />
            &nbsp; Generate Ideas Now
          </button>
        </motion.div>
      )}

      {/* Kanban board */}
      {ideas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {KANBAN_COLS.map((col) => {
            const colIdeas = ideas.filter((i) => i.status === col.id)
            return (
              <div key={col.id}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: col.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontWeight: 700,
                      fontSize: 12,
                      color: col.color,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      fontFamily: 'Space Mono, monospace',
                      color: '#4b5563',
                      background: 'rgba(59,130,246,0.08)',
                      padding: '1px 6px',
                      borderRadius: 10,
                    }}
                  >
                    {colIdeas.length}
                  </span>
                </div>

                {/* Cards */}
                <div
                  style={{
                    background: 'rgba(10,10,30,0.4)',
                    border: '1px solid rgba(59,130,246,0.08)',
                    borderRadius: 14,
                    padding: 10,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <AnimatePresence>
                    {colIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        style={{ position: 'relative' }}
                        onClick={batchMode && idea.status === 'inbox' ? () => toggleBatchIdea(idea.id) : undefined}
                      >
                        {batchMode && idea.status === 'inbox' && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8, zIndex: 10,
                            width: 18, height: 18, borderRadius: 5,
                            background: batchSelected.includes(idea.id) ? '#10b981' : 'rgba(16,185,129,0.15)',
                            border: `2px solid ${batchSelected.includes(idea.id) ? '#10b981' : 'rgba(16,185,129,0.3)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 140ms',
                          }}>
                            {batchSelected.includes(idea.id) && (
                              <span style={{ fontSize: 10, color: 'white', fontWeight: 800 }}>✓</span>
                            )}
                          </div>
                        )}
                        <IdeaCard
                          idea={idea}
                          onMove={updateIdeaStatus}
                          onDelete={removeIdea}
                          onSchedule={openSchedule}
                        />
                      </div>
                    ))}
                  </AnimatePresence>
                  {colIdeas.length === 0 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '20px 8px',
                        color: '#374151',
                        fontSize: 12,
                      }}
                    >
                      Drop ideas here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Schedule modal */}
      <AnimatePresence>
        {scheduleIdea && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setScheduleIdea(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(8,8,16,0.65)',
                backdropFilter: 'blur(5px)',
                zIndex: 70,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.16 }}
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 80,
                width: 440,
                maxWidth: 'calc(100vw - 40px)',
                background: '#0d0d1a',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 18,
                padding: '26px',
                boxShadow: '0 20px 70px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarPlus size={16} color="#10b981" />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Schedule Idea</h3>
                </div>
                <button onClick={() => setScheduleIdea(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex', padding: 4 }}>
                  <X size={15} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 18, lineHeight: 1.4 }}>
                "{scheduleIdea.title.slice(0, 60)}{scheduleIdea.title.length > 60 ? '...' : ''}"
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Date</label>
                <input
                  className="field"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Platforms</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {scheduleIdea.platforms.map((p) => {
                    const active = schedulePlatforms.includes(p)
                    return (
                      <button
                        key={p}
                        onClick={() => setSchedulePlatforms((prev) =>
                          prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                        )}
                        style={{
                          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                          background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
                          border: `1px solid ${active ? '#10b981' : 'rgba(59,130,246,0.15)'}`,
                          color: active ? '#10b981' : '#6b7a9a',
                          transition: 'all 140ms', textTransform: 'capitalize',
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setScheduleIdea(null)}>
                  Cancel
                </button>
                <button
                  className="btn btn-blue"
                  style={{ flex: 2, justifyContent: 'center', background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', color: '#10b981' }}
                  onClick={confirmSchedule}
                >
                  <CalendarPlus size={14} /> Confirm Schedule
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
}
