import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { Platform, ContentType } from '../types'
import { Wand2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const PLATFORMS: Platform[] = ['instagram', 'youtube', 'linkedin', 'twitter']
const CONTENT_TYPES: ContentType[] = ['reel', 'carousel', 'post', 'video', 'thread', 'article', 'story']

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#e1306c',
  youtube: '#ff0000',
  linkedin: '#0077b5',
  twitter: '#1da1f2',
}

export function QuickCapture() {
  const { addIdea } = useStore()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram'])
  const [selectedType, setSelectedType] = useState<ContentType>('reel')
  const [tags, setTags] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setTitle('')
    setTags('')
    setSelectedPlatforms(['instagram'])
    setSelectedType('reel')
  }

  const handleClose = () => {
    handleClose()
    resetForm()
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'j')) {
        e.preventDefault()
        setOpen((v) => {
          if (v) resetForm()
          return !v
        })
      }
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 80)
    }
  }, [open])

  function togglePlatform(p: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  function submit() {
    if (!title.trim()) {
      toast.error('Enter an idea title first')
      return
    }
    addIdea({
      id: Math.random().toString(36).slice(2),
      title: title.trim(),
      hook: '',
      contentType: selectedType,
      platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['instagram'],
      aiScore: 0,
      scoreBreakdown: {
        hookStrength: 0,
        nicheRelevance: 0,
        trendAlignment: 0,
        engagementPotential: 0,
        channelFit: 0,
        uniqueness: 0,
      },
      status: 'inbox',
      source: 'manual',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    })
    toast.success('Idea captured!', {
      style: {
        background: '#0d0d1a',
        color: '#f0f4ff',
        border: '1px solid rgba(59,130,246,0.3)',
      },
    })
    handleClose()
  }

  return (
    <>
      {/* FAB */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 60 }}>
        <div style={{ position: 'relative' }}>
          {/* Pulsing ring */}
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: '2px solid rgba(59,130,246,0.35)',
              animation: 'qc-pulse 2.2s ease-in-out infinite',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            title="Quick Capture (⌘J)"
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
              boxShadow: '0 4px 24px rgba(59,130,246,0.45)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <Wand2 size={20} />
          </motion.button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose()}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(8,8,16,0.7)',
                backdropFilter: 'blur(6px)',
                zIndex: 70,
              }}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 80,
                width: 520,
                maxWidth: 'calc(100vw - 40px)',
                background: '#0d0d1a',
                border: '1px solid rgba(59,130,246,0.22)',
                borderRadius: 20,
                padding: '28px 28px 24px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Wand2 size={14} color="white" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Quick Capture</div>
                    <div style={{ fontSize: 11, color: '#4b5680', marginTop: 1 }}>⌘J to open anywhere</div>
                  </div>
                </div>
                <button
                  onClick={() => handleClose()}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4b5680', display: 'flex', padding: 4, borderRadius: 6,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title input */}
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Idea Title</label>
                <input
                  ref={titleRef}
                  className="field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="What's your content idea?"
                  style={{ fontSize: 15, fontWeight: 600 }}
                />
              </div>

              {/* Platform chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Platform</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {PLATFORMS.map((p) => {
                    const active = selectedPlatforms.includes(p)
                    return (
                      <button
                        key={p}
                        onClick={() => togglePlatform(p)}
                        style={{
                          padding: '5px 13px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          background: active ? `${PLATFORM_COLORS[p]}18` : 'transparent',
                          border: `1px solid ${active ? PLATFORM_COLORS[p] : 'rgba(59,130,246,0.15)'}`,
                          color: active ? PLATFORM_COLORS[p] : '#6b7a9a',
                          transition: 'all 140ms',
                          textTransform: 'capitalize',
                        }}
                      >
                        {p}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Content type chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Content Type</label>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {CONTENT_TYPES.map((ct) => {
                    const active = selectedType === ct
                    return (
                      <button
                        key={ct}
                        onClick={() => setSelectedType(ct)}
                        style={{
                          padding: '5px 13px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          background: active ? 'rgba(236,72,153,0.12)' : 'transparent',
                          border: `1px solid ${active ? '#ec4899' : 'rgba(59,130,246,0.15)'}`,
                          color: active ? '#ec4899' : '#6b7a9a',
                          transition: 'all 140ms',
                          textTransform: 'capitalize',
                        }}
                      >
                        {ct}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 22 }}>
                <label style={lbl}>Tags (comma-separated)</label>
                <input
                  className="field"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="travel, adventure, tips..."
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => handleClose()}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-blue"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={submit}
                >
                  Add to Inbox
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes qc-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
      `}</style>
    </>
  )
}

const lbl: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  color: '#4b5680',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 7,
}
