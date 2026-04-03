import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { PipelineItem, PipelineStage, ContentType, Platform, TaskPriority } from '../types'
import {
  GitBranch, Plus, X, Lightbulb, FileText,
  Camera, Scissors, Star, CheckCircle, Calendar,
  ArrowRight, Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

const STAGES: { id: PipelineStage; label: string; color: string; desc: string }[] = [
  { id: 'idea', label: 'Idea', color: '#f59e0b', desc: 'Raw concepts' },
  { id: 'script', label: 'Script', color: '#a78bfa', desc: 'Writing phase' },
  { id: 'filming', label: 'Filming', color: '#3b82f6', desc: 'Recording' },
  { id: 'editing', label: 'Editing', color: '#06b6d4', desc: 'Post-production' },
  { id: 'review', label: 'Review', color: '#ec4899', desc: 'Approval' },
  { id: 'published', label: 'Published', color: '#10b981', desc: 'Live content' },
]

const STAGE_ICONS: Record<PipelineStage, React.ComponentType<{ size: number; color?: string }>> = {
  idea: Lightbulb,
  script: FileText,
  filming: Camera,
  editing: Scissors,
  review: Star,
  published: CheckCircle,
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  youtube: '#ef4444',
  linkedin: '#0a66c2',
  twitter: '#1da1f2',
}

const CONTENT_TYPES: ContentType[] = ['reel', 'carousel', 'post', 'video', 'thread', 'article', 'story']
const PLATFORMS: Platform[] = ['instagram', 'youtube', 'linkedin', 'twitter']
const PRIORITIES: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

function generateId() {
  return `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function ContentPipeline() {
  const { pipelineItems, addPipelineItem, movePipelineItem, removePipelineItem } = useStore()
  const [addingStage, setAddingStage] = useState<PipelineStage | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<ContentType>('reel')
  const [newPlatforms, setNewPlatforms] = useState<Platform[]>(['instagram'])
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all')

  const dragItem = useRef<string | null>(null)

  function getStageItems(stage: PipelineStage) {
    return pipelineItems
      .filter(
        (i) =>
          i.stage === stage &&
          (filterPlatform === 'all' || i.platforms.includes(filterPlatform)) &&
          (filterPriority === 'all' || i.priority === filterPriority)
      )
  }

  function handleAddItem(stage: PipelineStage) {
    if (!newTitle.trim()) return
    const item: PipelineItem = {
      id: generateId(),
      title: newTitle.trim(),
      stage,
      contentType: newType,
      platforms: newPlatforms,
      priority: newPriority,
      dueDate: newDueDate || undefined,
      notes: newNotes || undefined,
      tags: [],
      createdAt: new Date().toISOString(),
    }
    addPipelineItem(item)
    setNewTitle('')
    setNewDueDate('')
    setNewNotes('')
    setAddingStage(null)
    toast.success('Added to pipeline')
  }

  function handleDragStart(id: string) {
    dragItem.current = id
    setDraggingId(id)
  }

  function handleDrop(stage: PipelineStage) {
    if (dragItem.current) {
      movePipelineItem(dragItem.current, stage)
      toast.success(`Moved to ${stage}`)
    }
    dragItem.current = null
    setDraggingId(null)
    setDragOverStage(null)
  }

  const totalItems = pipelineItems.length
  const publishedThisMonth = pipelineItems.filter((i) => {
    if (i.stage !== 'published' || !i.movedAt) return false
    const d = new Date(i.movedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const bottleneck = STAGES.reduce((max, s) =>
    getStageItems(s.id).length > (getStageItems(max.id).length) ? s : max
  , STAGES[0])

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg, #080810)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GitBranch size={18} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #f0f4ff)', margin: 0 }}>
                Content Pipeline
              </h1>
              <p style={{ fontSize: 12, color: 'var(--muted, #6b7a9a)', margin: 0 }}>
                {totalItems} items · {publishedThisMonth} published this month · Bottleneck: <span style={{ color: bottleneck.color }}>{bottleneck.label}</span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {/* Platform filter */}
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as any)}
              className="field"
              style={{ width: 130, fontSize: 12 }}
            >
              <option value="all">All platforms</option>
              {PLATFORMS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            {/* Priority filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="field"
              style={{ width: 120, fontSize: 12 }}
            >
              <option value="all">All priorities</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline Board */}
      <div style={{
        display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16,
        alignItems: 'flex-start',
      }}>
        {STAGES.map((stage) => {
          const items = getStageItems(stage.id)
          const Icon = STAGE_ICONS[stage.id]
          const isOver = dragOverStage === stage.id

          return (
            <div
              key={stage.id}
              style={{ minWidth: 240, maxWidth: 240, flexShrink: 0 }}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.id) }}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage.id)}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px',
                background: `rgba(${stage.color === '#f59e0b' ? '245,158,11' : stage.color === '#a78bfa' ? '167,139,250' : stage.color === '#3b82f6' ? '59,130,246' : stage.color === '#06b6d4' ? '6,182,212' : stage.color === '#ec4899' ? '236,72,153' : '16,185,129'},0.08)`,
                border: `1px solid ${stage.color}22`,
                borderRadius: 10, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} color={stage.color} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>
                    {stage.label}
                  </span>
                  <span style={{
                    background: `${stage.color}22`, color: stage.color,
                    borderRadius: 20, padding: '1px 7px',
                    fontSize: 11, fontWeight: 800,
                  }}>
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={() => { setAddingStage(stage.id); setNewTitle('') }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: stage.color, padding: 2, borderRadius: 4,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add card input */}
              <AnimatePresence>
                {addingStage === stage.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      background: 'var(--s2, #111122)',
                      border: '1px solid rgba(59,130,246,0.25)',
                      borderRadius: 10, padding: 12, marginBottom: 10, overflow: 'hidden',
                    }}
                  >
                    <input
                      autoFocus
                      className="field"
                      placeholder="Content title…"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem(stage.id)}
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <select
                        className="field"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as ContentType)}
                        style={{ flex: 1, fontSize: 11 }}
                      >
                        {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <select
                        className="field"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                        style={{ flex: 1, fontSize: 11 }}
                      >
                        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <input
                      className="field"
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    {/* Platform toggles */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      {PLATFORMS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setNewPlatforms((prev) =>
                            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                          )}
                          style={{
                            width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                            background: newPlatforms.includes(p) ? `${PLATFORM_COLORS[p]}22` : 'rgba(255,255,255,0.04)',
                            color: newPlatforms.includes(p) ? PLATFORM_COLORS[p] : '#4b5680',
                            fontSize: 10, fontWeight: 700,
                          }}
                        >
                          {p[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-blue btn-xs" style={{ flex: 1 }} onClick={() => handleAddItem(stage.id)}>
                        Add
                      </button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setAddingStage(null)}>
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Drop zone */}
              <div
                style={{
                  minHeight: 60, borderRadius: 10, transition: 'all 150ms',
                  background: isOver ? 'rgba(59,130,246,0.06)' : 'transparent',
                  border: isOver ? '2px dashed rgba(59,130,246,0.35)' : '2px dashed transparent',
                  marginBottom: items.length > 0 ? 0 : 0,
                }}
              />

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    stageColor={stage.color}
                    isDragging={draggingId === item.id}
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverStage(null) }}
                    onRemove={() => { removePipelineItem(item.id); toast.success('Removed') }}

                    stages={STAGES}
                    onMove={(s) => { movePipelineItem(item.id, s); toast.success(`Moved to ${s}`) }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PipelineCard({
  item, stageColor, isDragging, onDragStart, onDragEnd, onRemove, stages, onMove,
}: {
  item: PipelineItem
  stageColor: string
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onRemove: () => void
  stages: { id: PipelineStage; label: string; color: string }[]
  onMove: (stage: PipelineStage) => void
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  const priorityColors: Record<string, string> = {
    urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6',
  }

  const now = useRef(Date.now()).current
  const daysUntilDue = item.dueDate
    ? Math.floor((new Date(item.dueDate).getTime() - now) / 86400000)
    : null

  return (
    <motion.div
      layout
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'var(--s2, #111122)',
        border: `1px solid ${isDragging ? stageColor + '44' : 'rgba(59,130,246,0.08)'}`,
        borderRadius: 10, padding: '12px',
        cursor: 'grab', opacity: isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 150ms',
        userSelect: 'none',
      }}
    >
      {/* Priority dot + type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: priorityColors[item.priority] || '#3b82f6', flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#6b7a9a',
          background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 6px',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {item.contentType}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {item.platforms.map((p) => (
            <div
              key={p}
              style={{
                width: 16, height: 16, borderRadius: 4,
                background: `${PLATFORM_COLORS[p]}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: PLATFORM_COLORS[p],
              }}
            >
              {p[0].toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #f0f4ff)', lineHeight: 1.4, marginBottom: 8 }}>
        {item.title}
      </div>

      {/* Due date */}
      {daysUntilDue !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8,
        }}>
          <Calendar size={11} color={daysUntilDue < 0 ? '#ef4444' : daysUntilDue <= 2 ? '#f97316' : '#6b7a9a'} />
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: daysUntilDue < 0 ? '#ef4444' : daysUntilDue <= 2 ? '#f97316' : '#6b7a9a',
          }}>
            {daysUntilDue < 0
              ? `${Math.abs(daysUntilDue)}d overdue`
              : daysUntilDue === 0
              ? 'Due today'
              : `${daysUntilDue}d left`}
          </span>
        </div>
      )}

      {/* Notes preview */}
      {item.notes && (
        <div style={{ fontSize: 11, color: '#6b7a9a', marginBottom: 8, lineHeight: 1.4 }}>
          {item.notes.slice(0, 80)}{item.notes.length > 80 ? '…' : ''}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
        <button
          onClick={() => setShowMoveMenu((v) => !v)}
          style={{
            flex: 1, background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 6, padding: '5px 8px',
            fontSize: 11, fontWeight: 600, color: '#3b82f6',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <ArrowRight size={11} />
          Move
        </button>
        <button
          onClick={onRemove}
          style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 6, padding: '5px 7px',
            cursor: 'pointer', color: '#ef4444',
          }}
        >
          <Trash2 size={11} />
        </button>

        {showMoveMenu && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 0, marginBottom: 4,
            background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 10, overflow: 'hidden', zIndex: 100, minWidth: 140,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => { onMove(s.id); setShowMoveMenu(false) }}
                style={{
                  width: '100%', padding: '9px 14px', border: 'none', cursor: 'pointer',
                  background: item.stage === s.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: item.stage === s.id ? s.color : '#94a3b8',
                  fontSize: 12, fontWeight: 600, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 100ms',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
