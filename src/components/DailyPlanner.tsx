import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isToday, isTomorrow, parseISO, addDays } from 'date-fns'
import { useStore } from '../store'
import type { CalendarPost } from '../types'
import {
  CheckCircle2, Circle, Plus, X, Clock, Flame, Camera, Edit3, Search,
  Smartphone, Coffee, Zap, Target, ChevronLeft, ChevronRight, Trash2,
  GripVertical, BarChart2, Youtube, Instagram, Twitter, Linkedin,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ───────────────────────────────────────────────────────────
type ActivityType = 'filming' | 'editing' | 'research' | 'posting' | 'engagement' | 'planning' | 'break' | 'other'
type ActivityStatus = 'todo' | 'in-progress' | 'done'

interface DailyActivity {
  id: string
  title: string
  type: ActivityType
  startHour: number   // 0-23
  durationMins: number
  status: ActivityStatus
  notes?: string
  linkedPostId?: string
  date: string // yyyy-MM-dd
}

// ── Helpers ─────────────────────────────────────────────────────────
function newId() { return Math.random().toString(36).slice(2) }

const TYPE_META: Record<ActivityType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  filming:    { label: 'Filming',    color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  icon: <Camera size={11} /> },
  editing:    { label: 'Editing',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Edit3 size={11} /> },
  research:   { label: 'Research',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: <Search size={11} /> },
  posting:    { label: 'Posting',    color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <Smartphone size={11} /> },
  engagement: { label: 'Engagement', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Zap size={11} /> },
  planning:   { label: 'Planning',   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  icon: <Target size={11} /> },
  break:      { label: 'Break',      color: '#6b7a9a', bg: 'rgba(107,122,154,0.07)', icon: <Coffee size={11} /> },
  other:      { label: 'Other',      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', icon: <Clock size={11} /> },
}

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  instagram: <Instagram size={10} />,
  youtube:   <Youtube size={10} />,
  twitter:   <Twitter size={10} />,
  linkedin:  <Linkedin size={10} />,
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function urgencyLevel(post: CalendarPost): 'high' | 'medium' | 'low' {
  const d = parseISO(post.scheduledAt + 'T00:00:00')
  if (isToday(d)) return 'high'
  if (isTomorrow(d)) return 'medium'
  return 'low'
}

// ── Local storage key ────────────────────────────────────────────────
const STORAGE_KEY = 'creator-daily-activities'

function loadActivities(): DailyActivity[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveActivities(acts: DailyActivity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(acts))
}

// ── Add Activity Modal ────────────────────────────────────────────────
function AddActivityModal({
  onClose, onAdd, defaultDate, posts,
}: {
  onClose: () => void
  onAdd: (a: DailyActivity) => void
  defaultDate: string
  posts: CalendarPost[]
}) {
  const [form, setForm] = useState<Omit<DailyActivity, 'id'>>({
    title: '',
    type: 'filming',
    startHour: 9,
    durationMins: 60,
    status: 'todo',
    notes: '',
    linkedPostId: '',
    date: defaultDate,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  function handle() {
    if (!form.title.trim()) { toast.error('Add a title'); return }
    onAdd({ id: newId(), ...form })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 18, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>Add Activity</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Title</label>
          <input
            ref={inputRef}
            className="field"
            placeholder="e.g. Film YouTube intro, Edit Reel…"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handle()}
          />
        </div>

        {/* Type grid */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Activity Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(Object.entries(TYPE_META) as [ActivityType, typeof TYPE_META[ActivityType]][]).map(([t, meta]) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                style={{
                  padding: '8px 4px', borderRadius: 9,
                  background: form.type === t ? meta.bg : 'transparent',
                  border: `1.5px solid ${form.type === t ? meta.color : 'rgba(59,130,246,0.1)'}`,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  color: form.type === t ? meta.color : '#6b7a9a', transition: 'all 150ms',
                }}
              >
                {meta.icon}
                <span style={{ fontSize: 10, fontWeight: 700 }}>{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Start Time</label>
            <select className="field" value={form.startHour} onChange={(e) => setForm((f) => ({ ...f, startHour: Number(e.target.value) }))}>
              {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Duration</label>
            <select className="field" value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))}>
              {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>{m >= 60 ? `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Link to post */}
        {posts.filter((p) => p.scheduledAt === form.date || p.scheduledAt >= form.date).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Link to Scheduled Post (optional)</label>
            <select className="field" value={form.linkedPostId || ''} onChange={(e) => setForm((f) => ({ ...f, linkedPostId: e.target.value }))}>
              <option value="">— none —</option>
              {posts
                .filter((p) => p.scheduledAt >= form.date)
                .slice(0, 20)
                .map((p) => (
                  <option key={p.id} value={p.id}>[{p.platform}] {p.title} · {p.scheduledAt}</option>
                ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Notes (optional)</label>
          <textarea
            className="field"
            rows={2}
            placeholder="Shot list, references, reminder…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handle} className="btn btn-blue btn-sm" style={{ flex: 2 }}>Add to Schedule</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Time Block Card ───────────────────────────────────────────────────
function ActivityBlock({
  act, posts, onToggle, onDelete, onEdit,
}: {
  act: DailyActivity
  posts: CalendarPost[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (act: DailyActivity) => void
}) {
  const meta = TYPE_META[act.type]
  const linkedPost = posts.find((p) => p.id === act.linkedPostId)
  const isDone = act.status === 'done'
  const endHour = act.startHour + Math.floor(act.durationMins / 60)
  const endMin = act.durationMins % 60

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      style={{
        background: isDone ? 'rgba(16,185,129,0.04)' : meta.bg,
        border: `1px solid ${isDone ? 'rgba(16,185,129,0.2)' : meta.color + '33'}`,
        borderLeft: `3px solid ${isDone ? '#10b981' : meta.color}`,
        borderRadius: 10, padding: '11px 14px', marginBottom: 6,
        opacity: isDone ? 0.55 : 1, transition: 'all 150ms',
        cursor: 'pointer',
      }}
      onClick={() => onEdit(act)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Drag handle + check */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <GripVertical size={13} color="#4b5680" style={{ cursor: 'grab' }} />
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(act.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDone ? '#10b981' : '#4b5680', padding: 0, display: 'flex' }}
          >
            {isDone ? <CheckCircle2 size={17} /> : <Circle size={17} />}
          </button>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            {/* Type badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: meta.bg, color: meta.color,
              border: `1px solid ${meta.color}44`,
              borderRadius: 5, padding: '1px 6px', fontSize: 9.5, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {meta.icon} {meta.label}
            </span>
            {/* Time */}
            <span style={{ fontSize: 11, color: '#6b7a9a', fontFamily: 'Space Mono, monospace' }}>
              {formatHour(act.startHour)} → {endMin > 0 ? `${formatHour(endHour).replace(' AM', '').replace(' PM', '')}:${String(endMin).padStart(2, '0')}${act.startHour + act.durationMins / 60 >= 12 ? ' PM' : ' AM'}` : formatHour(endHour)}
              &nbsp;·&nbsp;{act.durationMins >= 60 ? `${act.durationMins / 60}h` : `${act.durationMins}m`}
            </span>
          </div>

          <div style={{
            fontSize: 13.5, fontWeight: 700, color: isDone ? '#4b5680' : '#f0f4ff',
            textDecoration: isDone ? 'line-through' : 'none', letterSpacing: '-0.01em', marginBottom: linkedPost ? 4 : 0,
          }}>
            {act.title}
          </div>

          {linkedPost && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
              <span style={{ color: '#4b5680' }}>{PLATFORM_ICON[linkedPost.platform]}</span>
              <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>→ {linkedPost.title}</span>
            </div>
          )}

          {act.notes && (
            <div style={{ fontSize: 11.5, color: '#6b7a9a', marginTop: 5, lineHeight: 1.5 }}>{act.notes}</div>
          )}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(act.id) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', flexShrink: 0, opacity: 0.6, transition: 'opacity 150ms', padding: 2 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export function DailyPlanner() {
  const { calendarPosts, updateCalendarPost, smartTasks } = useStore()
  const [activities, setActivities] = useState<DailyActivity[]>(loadActivities)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAdd, setShowAdd] = useState(false)
  const [editingActivity, setEditingActivity] = useState<DailyActivity | null>(null)
  const [activeTab, setActiveTab] = useState<'schedule' | 'posts' | 'focus'>('schedule')

  // Persist activities
  useEffect(() => { saveActivities(activities) }, [activities])

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Date navigation
  const selectedDateObj = new Date(selectedDate + 'T00:00:00')
  const isSelectedToday = selectedDate === todayStr

  function navDate(dir: -1 | 1) {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + dir)
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  // Activities for selected date
  const dayActivities = activities
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.startHour - b.startHour || a.durationMins - b.durationMins)

  // Posts for selected date
  const dayPosts = calendarPosts
    .filter((p) => p.scheduledAt === selectedDate)
    .sort((a, b) => a.platform.localeCompare(b.platform))

  // Smart Tasks synced to this date
  const syncedTasks = smartTasks.filter(
    (t) => t.status !== 'done' && (t.plannedDate === selectedDate || t.dueDate === selectedDate)
  )

  // Upcoming posts (next 7 days)
  const upcoming = calendarPosts
    .filter((p) => p.scheduledAt > selectedDate && p.scheduledAt <= format(addDays(selectedDateObj, 7), 'yyyy-MM-dd'))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  function addActivity(a: DailyActivity) {
    setActivities((prev) => [...prev, a])
    setShowAdd(false)
    toast.success('Activity added to schedule')
  }

  function toggleActivity(id: string) {
    setActivities((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: a.status === 'done' ? 'todo' : 'done' } : a)
    )
  }

  function deleteActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id))
    toast.success('Removed')
  }

  function markPostDone(id: string) {
    updateCalendarPost(id, { status: 'published' })
    toast.success('Marked as published!')
  }

  // Progress
  const doneCount = dayActivities.filter((a) => a.status === 'done').length
  const totalCount = dayActivities.length
  const progress = totalCount > 0 ? (doneCount / totalCount) : 0

  // Total scheduled time
  const totalMins = dayActivities.filter((a) => a.status !== 'done').reduce((s, a) => s + a.durationMins, 0)

  // Generate week mini-strip (Mon-Sun around selected date)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(selectedDate + 'T00:00:00')
    const dayOfWeek = d.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    d.setDate(d.getDate() + mondayOffset + i)
    const str = format(d, 'yyyy-MM-dd')
    const acts = activities.filter((a) => a.date === str)
    const posts = calendarPosts.filter((p) => p.scheduledAt === str)
    return { date: str, d, acts, posts }
  })

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            Daily Planner
          </h1>
          <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 500 }}>
            Time-block your creator day — filming, editing, posting & more
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn btn-blue"
          style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <Plus size={15} /> Add Activity
        </button>
      </div>

      {/* Week strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 22 }}>
        {weekDays.map(({ date, d, acts, posts }) => {
          const isSelected = date === selectedDate
          const isToday2 = date === todayStr
          const dotCount = acts.length + posts.length
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: '8px 4px', borderRadius: 10, cursor: 'pointer', border: 'none',
                background: isSelected ? 'rgba(59,130,246,0.15)' : isToday2 ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.03)',
                outline: isSelected ? '1.5px solid rgba(59,130,246,0.5)' : isToday2 ? '1.5px solid rgba(59,130,246,0.2)' : '1px solid rgba(59,130,246,0.08)',
                transition: 'all 150ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {format(d, 'EEE')}
              </span>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: isToday2 ? '#3b82f6' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: isToday2 ? '#fff' : isSelected ? '#3b82f6' : '#f0f4ff',
              }}>
                {format(d, 'd')}
              </div>
              {dotCount > 0 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: Math.min(dotCount, 4) }).map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? '#3b82f6' : '#4b5680' }} />
                  ))}
                </div>
              )}
              {dotCount === 0 && <div style={{ height: 6 }} />}
            </button>
          )
        })}
      </div>

      {/* Date header + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button onClick={() => navDate(-1)} className="btn btn-ghost btn-xs"><ChevronLeft size={14} /></button>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
            {isSelectedToday ? 'Today' : format(selectedDateObj, 'EEEE')},{' '}
            {format(selectedDateObj, 'MMMM d')}
          </span>
          {isSelectedToday && (
            <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
              TODAY
            </span>
          )}
        </div>
        <button onClick={() => navDate(1)} className="btn btn-ghost btn-xs"><ChevronRight size={14} /></button>
        <div style={{ flex: 1 }} />
        {totalMins > 0 && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>
              <span style={{ fontFamily: 'Space Mono', color: '#f0f4ff' }}>
                {totalMins >= 60 ? `${Math.floor(totalMins / 60)}h ${totalMins % 60 > 0 ? `${totalMins % 60}m` : ''}` : `${totalMins}m`}
              </span>
              {' '}remaining
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6b7a9a' }}>Day Progress</span>
            <span style={{ fontSize: 12, fontFamily: 'Space Mono, monospace', color: progress === 1 ? '#10b981' : '#3b82f6', fontWeight: 700 }}>
              {doneCount}/{totalCount} done
            </span>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 4, height: 5 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{ height: '100%', background: progress === 1 ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: 4 }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {([
          ['schedule', <Clock size={13} />, `Schedule (${dayActivities.length})`],
          ['posts', <BarChart2 size={13} />, `Posts (${dayPosts.length})`],
          ['focus', <Flame size={13} />, 'Focus Mode'],
        ] as const).map(([id, icon, label]) => (
          <button
            key={id}
            className={`tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {dayActivities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#3b82f6', opacity: 0.6 }}>
                  <Clock size={24} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#6b7a9a', marginBottom: 6 }}>No activities scheduled</p>
                <p style={{ fontSize: 12.5, color: '#4b5680', lineHeight: 1.5, marginBottom: 18 }}>Block time for filming, editing, posting and more</p>
                <button onClick={() => setShowAdd(true)} className="btn btn-blue btn-sm">
                  <Plus size={13} /> Add First Activity
                </button>
              </div>
            ) : (
              <div>
                {/* Group by hour */}
                {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => {
                  const hourActs = dayActivities.filter((a) => a.startHour === hour)
                  if (hourActs.length === 0) return null
                  return (
                    <div key={hour} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                      <div style={{ width: 48, flexShrink: 0, paddingTop: 12 }}>
                        <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#4b5680', fontWeight: 700 }}>
                          {formatHour(hour)}
                        </span>
                      </div>
                      <div style={{ flex: 1 }}>
                        {hourActs.map((act) => (
                          <ActivityBlock
                            key={act.id}
                            act={act}
                            posts={calendarPosts}
                            onToggle={toggleActivity}
                            onDelete={deleteActivity}
                            onEdit={setEditingActivity}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Activities without specific hour grouping (catch all) */}
                {dayActivities.filter((a) => a.startHour < 6 || a.startHour > 23).map((act) => (
                  <ActivityBlock
                    key={act.id}
                    act={act}
                    posts={calendarPosts}
                    onToggle={toggleActivity}
                    onDelete={deleteActivity}
                    onEdit={setEditingActivity}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* POSTS */}
        {activeTab === 'posts' && (
          <motion.div key="posts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {dayPosts.length === 0 && upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#4b5680' }}>
                <BarChart2 size={28} style={{ margin: '0 auto 14px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No posts scheduled</p>
                <p style={{ fontSize: 12 }}>Visit the Content Calendar to schedule posts</p>
              </div>
            ) : (
              <>
                {dayPosts.length > 0 && (
                  <>
                    <div className="sec-label" style={{ marginBottom: 10 }}>
                      {isSelectedToday ? "Today's Posts" : `Posts on ${format(selectedDateObj, 'MMM d')}`}
                    </div>
                    {dayPosts.map((post) => {
                      const urgency = urgencyLevel(post)
                      const isDone = post.status === 'published'
                      return (
                        <motion.div
                          key={post.id}
                          layout
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            background: isDone ? 'rgba(16,185,129,0.04)' : '#111122',
                            border: `1px solid ${isDone ? 'rgba(16,185,129,0.15)' : urgency === 'high' ? 'rgba(239,68,68,0.18)' : 'rgba(59,130,246,0.1)'}`,
                            borderRadius: 12, marginBottom: 8,
                            opacity: isDone ? 0.55 : 1,
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          }}
                        >
                          <button
                            onClick={() => markPostDone(post.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDone ? '#10b981' : '#4b5680', flexShrink: 0, padding: 0, display: 'flex' }}
                          >
                            {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 700, color: isDone ? '#4b5680' : '#f0f4ff', textDecoration: isDone ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.title}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#4b5680', fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>
                              {post.platform} · {post.contentType}
                            </div>
                          </div>
                          <span className={`status-${post.status}`}>{post.status}</span>
                        </motion.div>
                      )
                    })}
                  </>
                )}

                {upcoming.length > 0 && (
                  <>
                    <div className="sec-label" style={{ marginTop: 20, marginBottom: 10 }}>Upcoming This Week</div>
                    {upcoming.slice(0, 6).map((post) => (
                      <div
                        key={post.id}
                        style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                          <div style={{ fontSize: 10.5, color: '#4b5680', fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>
                            {post.platform} · {post.contentType}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#6b7a9a', fontWeight: 700, flexShrink: 0 }}>
                          {format(parseISO(post.scheduledAt + 'T00:00:00'), 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* SYNCED TASKS from SmartTodo */}
        {activeTab === 'schedule' && syncedTasks.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div className="sec-label" style={{ marginBottom: 10 }}>
              Smart Tasks for {isSelectedToday ? 'Today' : format(selectedDateObj, 'MMM d')}
            </div>
            {syncedTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: '#111122', border: '1px solid rgba(59,130,246,0.1)',
                  borderRadius: 10, marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                }}
              >
                <CheckCircle2
                  size={16}
                  color={task.status === 'in-progress' ? '#3b82f6' : '#4b5680'}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.title}
                  </div>
                  {task.estimatedHours && (
                    <div style={{ fontSize: 10, color: '#6b7a9a', marginTop: 2 }}>
                      ~{task.estimatedHours}h estimated
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: task.priority === 'urgent' ? 'rgba(239,68,68,0.1)' : task.priority === 'high' ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.1)',
                  color: task.priority === 'urgent' ? '#ef4444' : task.priority === 'high' ? '#f97316' : '#3b82f6',
                }}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* FOCUS MODE */}
        {activeTab === 'focus' && (
          <motion.div key="focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FocusMode activities={dayActivities.filter((a) => a.status !== 'done')} onToggle={toggleActivity} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <AddActivityModal
            onClose={() => setShowAdd(false)}
            onAdd={addActivity}
            defaultDate={selectedDate}
            posts={calendarPosts}
          />
        )}
      </AnimatePresence>

      {/* Edit modal (reuses add with prefilled data) */}
      <AnimatePresence>
        {editingActivity && (
          <EditActivityModal
            activity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSave={(updated) => {
              setActivities((prev) => prev.map((a) => a.id === updated.id ? updated : a))
              setEditingActivity(null)
              toast.success('Activity updated')
            }}
            onDelete={(id) => {
              deleteActivity(id)
              setEditingActivity(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Focus Mode ────────────────────────────────────────────────────────
function FocusMode({ activities, onToggle }: { activities: DailyActivity[]; onToggle: (id: string) => void }) {
  const [current, setCurrent] = useState(0)

  if (activities.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5680' }}>
        <CheckCircle2 size={32} style={{ margin: '0 auto 14px', color: '#10b981', opacity: 0.5 }} />
        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: '#10b981' }}>All done for today!</p>
        <p style={{ fontSize: 12.5 }}>Amazing work. Take a break or add more activities.</p>
      </div>
    )
  }

  const act = activities[current] || activities[0]
  const meta = act ? TYPE_META[act.type] : null

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Focus Mode · {activities.length} remaining
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
          {activities.map((_, i) => (
            <div key={i} style={{ width: 20, height: 3, borderRadius: 2, background: i === current ? '#3b82f6' : 'rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'background 200ms' }} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </div>

      {act && meta && (
        <motion.div
          key={act.id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ padding: 36, textAlign: 'center', borderColor: meta.color + '33' }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 18, background: meta.bg, border: `1.5px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: meta.color, fontSize: 24 }}>
            {meta.icon}
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{meta.label}</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 10 }}>{act.title}</h2>
          <div style={{ fontSize: 13, color: '#6b7a9a', marginBottom: 8 }}>
            {formatHour(act.startHour)} · {act.durationMins >= 60 ? `${act.durationMins / 60}h` : `${act.durationMins}m`}
          </div>
          {act.notes && (
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginTop: 14, padding: '12px 16px', background: 'rgba(59,130,246,0.05)', borderRadius: 10 }}>{act.notes}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 28, justifyContent: 'center' }}>
            <button
              onClick={() => { onToggle(act.id); if (current < activities.length - 1) setCurrent(current) }}
              className="btn btn-blue"
              style={{ minWidth: 140 }}
            >
              <CheckCircle2 size={15} /> Mark Done
            </button>
            {current < activities.length - 1 && (
              <button onClick={() => setCurrent((c) => c + 1)} className="btn btn-ghost">
                Skip → Next
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Edit Activity Modal ───────────────────────────────────────────────
function EditActivityModal({
  activity, onClose, onSave, onDelete,
}: {
  activity: DailyActivity
  onClose: () => void
  onSave: (a: DailyActivity) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<DailyActivity>({ ...activity })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 18, padding: 28, width: 460, boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>Edit Activity</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Title</label>
          <input className="field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Start Time</label>
            <select className="field" value={form.startHour} onChange={(e) => setForm((f) => ({ ...f, startHour: Number(e.target.value) }))}>
              {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={lbl}>Duration</label>
            <select className="field" value={form.durationMins} onChange={(e) => setForm((f) => ({ ...f, durationMins: Number(e.target.value) }))}>
              {[15, 30, 45, 60, 90, 120, 180, 240].map((m) => (
                <option key={m} value={m}>{m >= 60 ? `${m / 60}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {(Object.entries(TYPE_META) as [ActivityType, typeof TYPE_META[ActivityType]][]).map(([t, meta]) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t }))}
                style={{
                  padding: '7px 4px', borderRadius: 8, cursor: 'pointer', border: 'none',
                  background: form.type === t ? meta.bg : 'transparent',
                  outline: `1.5px solid ${form.type === t ? meta.color : 'rgba(59,130,246,0.08)'}`,
                  color: form.type === t ? meta.color : '#6b7a9a', transition: 'all 150ms',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                {meta.icon}
                <span style={{ fontSize: 9, fontWeight: 700 }}>{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Notes</label>
          <textarea
            className="field"
            rows={2}
            value={form.notes || ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onDelete(form.id)}
            className="btn btn-ghost btn-sm"
            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <Trash2 size={12} /> Delete
          </button>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button onClick={() => onSave(form)} className="btn btn-blue btn-sm" style={{ flex: 2 }}>Save Changes</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
