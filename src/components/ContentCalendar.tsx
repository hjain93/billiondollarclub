import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'
import { useStore } from '../store'
import type { CalendarPost, Platform, ContentIdea } from '../types'
import { getFestivalsForDate } from '../data/festivals'
import { ChevronLeft, ChevronRight, Plus, X, Calendar, List, Columns, Trash2, Lightbulb, Inbox } from 'lucide-react'
import toast from 'react-hot-toast'
import { APIProxy } from '../services/APIProxy'

const PLATFORM_LABEL: Record<Platform, string> = { instagram: 'IG', youtube: 'YT', linkedin: 'LI', twitter: 'TW' }
const PLATFORM_CLASS: Record<Platform, string> = { instagram: 'pb-ig', youtube: 'pb-yt', linkedin: 'pb-li', twitter: 'pb-tw' }

function newId() { return Math.random().toString(36).slice(2) }
function toISO(d: Date) { return format(d, 'yyyy-MM-dd') }

// ── Editor panel ──────────────────────────────────────────────────
function PostEditor({
  post,
  onClose,
  onSave,
  onDelete,
  defaultDate,
  ideaId,
}: {
  post: CalendarPost | null
  onClose: () => void
  onSave: (p: CalendarPost) => void
  onDelete?: (id: string) => void
  defaultDate?: string
  ideaId?: string
}) {
  const { profile } = useStore()
  const [form, setForm] = useState<Omit<CalendarPost, 'id'>>({
    title: post?.title ?? '',
    platform: post?.platform ?? 'instagram',
    contentType: post?.contentType ?? 'post',
    status: post?.status ?? 'draft',
    scheduledAt: post?.scheduledAt ?? (defaultDate ?? toISO(new Date())),
    notes: post?.notes ?? '',
    ideaId: post?.ideaId ?? ideaId,
  })
  const [publishing, setPublishing] = useState(false)

  const isEdit = !!post

  function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    onSave({ id: post?.id ?? newId(), ...form })
  }

  async function handlePublish() {
    if (!profile) return
    if (!form.title.trim()) { toast.error('Title is required'); return }
    
    setPublishing(true)
    const toastId = toast.loading(`Publishing to ${form.platform}...`)
    
    try {
      const response = await APIProxy.secureRequest(
        form.platform as any, 
        'publish', 
        { title: form.title, notes: form.notes }
      )

      if (response.status === 'success') {
        const updatedPost: CalendarPost = {
          id: post?.id ?? newId(),
          ...form,
          status: 'published',
          publishResult: {
            success: true,
            platformId: response.data.id,
            publishedAt: response.data.publishedAt
          }
        }
        onSave(updatedPost)
        toast.success(`Securely published to ${form.platform}!`, { id: toastId })
        onClose()
      } else {
        toast.error(`Publish failed: ${response.error}`, { id: toastId })
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId })
    } finally {
      setPublishing(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      style={{
        position: 'fixed', top: 0, right: 0, width: 440, height: '100vh',
        background: '#0d0d1a',
        borderLeft: '1px solid rgba(59,130,246,0.15)',
        zIndex: 60, display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {isEdit ? 'Edit Post' : 'Schedule Post'}
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
            {isEdit ? 'Update details' : 'New calendar entry'}
          </h3>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#6b7a9a' }}>
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Post Title</label>
          <input className="field" placeholder="What is this post about?" {...field('title')} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Platform</label>
            <select className="field" {...field('platform')}>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter/X</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Content Type</label>
            <select className="field" {...field('contentType')}>
              <option value="reel">Reel</option>
              <option value="carousel">Carousel</option>
              <option value="post">Static Post</option>
              <option value="video">Video</option>
              <option value="story">Story</option>
              <option value="thread">Thread</option>
              <option value="article">Article</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Scheduled Date</label>
            <input className="field" type="date" {...field('scheduledAt')} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select className="field" {...field('status')}>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Notes</label>
          <textarea
            className="field"
            rows={4}
            placeholder="Hook idea, key message, CTA..."
            style={{ resize: 'vertical' }}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Status preview */}
        <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#4b5680' }}>
          <span className={`status-${form.status}`}>{form.status}</span>
          <span style={{ marginLeft: 10 }}>· {form.platform} · {form.contentType}</span>
          {post?.publishResult && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#10b981' }}>
              ✓ Published to platform (ID: {post.publishResult.platformId?.slice(0, 12)}...)
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEdit && onDelete && (
            <button
              onClick={() => { onDelete(post!.id); onClose() }}
              className="btn btn-ghost btn-sm"
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
            Save Draft
          </button>
        </div>
        
        <button 
          onClick={handlePublish} 
          disabled={publishing || form.status === 'published'}
          className="btn btn-blue" 
          style={{ width: '100%', gap: 8 }}
        >
          {publishing ? 'Publishing...' : form.status === 'published' ? 'Published' : `Publish to ${form.platform.charAt(0).toUpperCase() + form.platform.slice(1)} Now`}
        </button>
      </div>
    </motion.div>
  )
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}

// ── Month View ─────────────────────────────────────────────────────
function MonthView({ currentDate, posts, onDayClick, onPostClick }: {
  currentDate: Date
  posts: CalendarPost[]
  onDayClick: (date: string) => void
  onPostClick: (post: CalendarPost) => void
}) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 800, color: '#4b5680', padding: '6px 0', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day) => {
          const dateStr = toISO(day)
          const dayPosts = posts.filter((p) => p.scheduledAt === dateStr)
          const festivals = getFestivalsForDate(dateStr)
          const isThisMonth = isSameMonth(day, currentDate)
          const isTodayDay = isToday(day)

          return (
            <div
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              style={{
                background: isTodayDay ? 'rgba(59,130,246,0.06)' : isThisMonth ? '#111122' : '#0d0d1a',
                border: `1.5px solid ${isTodayDay ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.08)'}`,
                borderRadius: 10,
                padding: 7,
                minHeight: 120,
                cursor: 'pointer',
                opacity: isThisMonth ? 1 : 0.38,
                transition: 'border-color 150ms, background 150ms',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isTodayDay) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.28)'
              }}
              onMouseLeave={(e) => {
                if (!isTodayDay) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.08)'
              }}
            >
              {/* Today accent bar */}
              {isTodayDay && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: '10px 10px 0 0' }} />
              )}

              {/* Day number */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: festivals.length > 0 ? 4 : 5 }}>
                {isTodayDay ? (
                  <div style={{ width: 22, height: 22, background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>
                    {format(day, 'd')}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 800, color: isThisMonth ? '#6b7a9a' : '#3a4060' }}>
                    {format(day, 'd')}
                  </span>
                )}
                {dayPosts.length > 0 && (
                  <span style={{ fontSize: 9, fontFamily: 'Space Mono, monospace', color: '#4b5680', background: 'rgba(59,130,246,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                    {dayPosts.length}
                  </span>
                )}
              </div>

              {/* Festival badges */}
              {festivals.slice(0, 1).map((f) => (
                <div key={f.name} className="fest-badge" style={{ marginBottom: 3 }}>{f.name}</div>
              ))}

              {/* Posts */}
              {dayPosts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className={`pb ${PLATFORM_CLASS[p.platform]}`}
                  onClick={(e) => { e.stopPropagation(); onPostClick(p) }}
                  title={p.title}
                >
                  <span style={{ fontSize: 8, fontWeight: 900, marginRight: 3 }}>{PLATFORM_LABEL[p.platform]}</span>
                  {p.title}
                </div>
              ))}
              {dayPosts.length > 3 && (
                <div className="more-pill">+{dayPosts.length - 3} more</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Week View ──────────────────────────────────────────────────────
function WeekView({ currentDate, posts, onDayClick, onPostClick }: {
  currentDate: Date
  posts: CalendarPost[]
  onDayClick: (date: string) => void
  onPostClick: (post: CalendarPost) => void
}) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {days.map((day) => {
        const dateStr = toISO(day)
        const dayPosts = posts.filter((p) => p.scheduledAt === dateStr)
        const festivals = getFestivalsForDate(dateStr)
        const isTodayDay = isToday(day)

        return (
          <div
            key={dateStr}
            onClick={() => onDayClick(dateStr)}
            style={{
              background: isTodayDay ? 'rgba(59,130,246,0.06)' : '#111122',
              border: `1.5px solid ${isTodayDay ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.08)'}`,
              borderRadius: 12,
              padding: 10,
              minHeight: 380,
              cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {isTodayDay && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #3b82f6, #ec4899)' }} />
            )}
            <div style={{ textAlign: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {format(day, 'EEE')}
              </div>
              {isTodayDay ? (
                <div style={{ width: 28, height: 28, background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', margin: '4px auto 0' }}>
                  {format(day, 'd')}
                </div>
              ) : (
                <div style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', marginTop: 2 }}>
                  {format(day, 'd')}
                </div>
              )}
            </div>

            {festivals.slice(0, 1).map((f) => (
              <div key={f.name} className="fest-badge" style={{ marginBottom: 5 }}>{f.name}</div>
            ))}

            {dayPosts.map((p) => (
              <div
                key={p.id}
                className={`pb ${PLATFORM_CLASS[p.platform]}`}
                style={{ fontSize: 10.5, padding: '5px 8px', marginBottom: 4 }}
                onClick={(e) => { e.stopPropagation(); onPostClick(p) }}
              >
                <span style={{ fontSize: 8, fontWeight: 900, display: 'block', marginBottom: 1 }}>{PLATFORM_LABEL[p.platform]} · {p.contentType}</span>
                {p.title}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── List View ──────────────────────────────────────────────────────
function ListView({ posts, onPostClick }: {
  posts: CalendarPost[]
  onPostClick: (post: CalendarPost) => void
}) {
  const sorted = [...posts].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5680' }}>
        <Calendar size={32} style={{ margin: '0 auto 14px', color: '#3b82f6', opacity: 0.4 }} />
        <p style={{ fontWeight: 600, fontSize: 14 }}>No posts scheduled yet</p>
        <p style={{ fontSize: 12, marginTop: 6 }}>Click any day on the calendar to add a post</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 90px 110px', gap: 8, padding: '10px 16px', background: 'rgba(59,130,246,0.05)', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        {['Date', 'Title', 'Platform', 'Type', 'Status'].map((h) => (
          <div key={h} style={{ fontSize: 10.5, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
        ))}
      </div>
      {sorted.map((post) => (
        <div
          key={post.id}
          onClick={() => onPostClick(post)}
          style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 90px 110px', gap: 8, alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid rgba(59,130,246,0.06)', cursor: 'pointer', transition: 'background 140ms' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>
            {format(new Date(post.scheduledAt + 'T00:00:00'), 'dd MMM')}
          </div>
          <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.title}
          </div>
          <div>
            <span className={`pb ${PLATFORM_CLASS[post.platform]}`} style={{ display: 'inline-block', borderRadius: 4 }}>
              {post.platform}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize', fontWeight: 600 }}>
            {post.contentType}
          </div>
          <div><span className={`status-${post.status}`}>{post.status}</span></div>
        </div>
      ))}
    </div>
  )
}

// ── Ideas Panel (escapes port) ──────────────────────────────────────
function IdeasPanel({
  ideas, onSchedule,
}: {
  ideas: ContentIdea[]
  onSchedule: (idea: ContentIdea) => void
}) {
  const [tab, setTab] = useState<'inbox' | 'planned' | 'high'>('inbox')

  const filtered = ideas.filter((i) => {
    if (tab === 'inbox') return i.status === 'inbox'
    if (tab === 'planned') return i.status === 'planned'
    if (tab === 'high') return i.aiScore >= 8
    return true
  })

  function copyTitle(idea: ContentIdea) {
    navigator.clipboard.writeText(idea.title).then(() => toast.success('Copied!'))
  }

  return (
    <div style={{
      width: 256, flexShrink: 0,
      position: 'sticky', top: 0,
      maxHeight: 'calc(100vh - 60px)',
      overflowY: 'auto',
    }}>
      {/* Panel header */}
      <div style={{ background: '#0d0d1a', borderBottom: '1px solid rgba(59,130,246,0.12)', padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Lightbulb size={14} color="#f59e0b" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff' }}>Idea Bank</span>
          <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
            {ideas.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
          {([
            ['inbox', 'Inbox'],
            ['planned', 'Planned'],
            ['high', '⭐ Top'],
          ] as const).map(([t, lbl]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                background: 'none', border: 'none',
                color: tab === t ? '#3b82f6' : '#4b5680',
                borderBottom: `2px solid ${tab === t ? '#3b82f6' : 'transparent'}`,
                transition: 'all 150ms',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas list */}
      <div style={{ background: '#0d0d1a' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: '#4b5680' }}>
            <Inbox size={20} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 11.5, fontWeight: 600 }}>No ideas here</p>
          </div>
        ) : (
          filtered.slice(0, 30).map((idea) => (
            <div
              key={idea.id}
              onClick={() => copyTitle(idea)}
              style={{
                padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.06)',
                cursor: 'pointer', transition: 'background 140ms', position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.05)'
                const badge = e.currentTarget.querySelector('.copy-badge') as HTMLElement | null
                if (badge) badge.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                const badge = e.currentTarget.querySelector('.copy-badge') as HTMLElement | null
                if (badge) badge.style.opacity = '0'
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.4, marginBottom: 4, paddingRight: 28 }}>
                {idea.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9.5, color: '#4b5680', fontWeight: 700, textTransform: 'capitalize' }}>
                  {idea.contentType} · {idea.platforms.slice(0, 2).join('/')}
                </span>
                {idea.aiScore >= 8 && (
                  <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '0 5px', borderRadius: 8, fontWeight: 800 }}>
                    {idea.aiScore.toFixed(1)}
                  </span>
                )}
              </div>
              {/* Schedule chip */}
              <button
                className="copy-badge"
                onClick={(e) => { e.stopPropagation(); onSchedule(idea) }}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 9, fontWeight: 800, color: '#3b82f6',
                  background: 'rgba(59,130,246,0.12)', padding: '2px 6px', borderRadius: 4,
                  border: 'none', cursor: 'pointer', opacity: 0, transition: 'opacity 140ms',
                }}
              >
                +Cal
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────
type ViewMode = 'month' | 'week' | 'list'

export function ContentCalendar() {
  const { calendarPosts, addCalendarPost, updateCalendarPost, removeCalendarPost, ideas } = useStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [editor, setEditor] = useState<{ open: boolean; post: CalendarPost | null; defaultDate?: string; ideaId?: string }>({
    open: false, post: null,
  })
  const [showIdeasPanel, setShowIdeasPanel] = useState(true)

  // Stats
  const total = calendarPosts.length
  const published = calendarPosts.filter((p) => p.status === 'published').length
  const scheduled = calendarPosts.filter((p) => p.status === 'scheduled').length
  const draft = calendarPosts.filter((p) => p.status === 'draft').length

  function openNew(date?: string, ideaId?: string) {
    setEditor({ open: true, post: null, defaultDate: date, ideaId })
  }
  function openEdit(post: CalendarPost) {
    setEditor({ open: true, post })
  }
  function closeEditor() {
    setEditor({ open: false, post: null })
  }

  function handleSave(post: CalendarPost) {
    if (editor.post) {
      updateCalendarPost(post.id, post)
      toast.success('Post updated')
    } else {
      addCalendarPost(post)
      toast.success('Post scheduled')
    }
    closeEditor()
  }

  function handleDelete(id: string) {
    removeCalendarPost(id)
    toast.success('Post removed')
  }

  function handleScheduleIdea(idea: ContentIdea) {
    const today = format(new Date(), 'yyyy-MM-dd')
    openNew(today, idea.id)
    // Pre-fill title from idea in editor — this is handled by defaultDate + title hint
    toast.success(`Scheduling: ${idea.title.slice(0, 40)}…`)
  }

  function navPrev() {
    if (viewMode === 'month') setCurrentDate((d) => subMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate((d) => subWeeks(d, 1))
  }
  function navNext() {
    if (viewMode === 'month') setCurrentDate((d) => addMonths(d, 1))
    else if (viewMode === 'week') setCurrentDate((d) => addWeeks(d, 1))
  }

  const headerLabel = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : viewMode === 'week'
    ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
    : 'All Posts'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

      {/* Header bar */}
      <div style={{
        padding: '16px 28px',
        borderBottom: '1px solid rgba(59,130,246,0.1)',
        background: '#0d0d1a',
        display: 'flex', alignItems: 'center', gap: 14,
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Content Calendar</h1>
          <p style={{ fontSize: 11, color: '#4b5680', fontWeight: 500, marginTop: 2 }}>Plan and track every post across all platforms</p>
        </div>

        {/* Stats mini bar */}
        <div style={{ display: 'flex', gap: 14, marginLeft: 12 }}>
          {[
            { label: 'Total', val: total, color: '#94a3b8' },
            { label: 'Scheduled', val: scheduled, color: '#60a5fa' },
            { label: 'Published', val: published, color: '#34d399' },
            { label: 'Drafts', val: draft, color: '#4b5680' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9.5, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* View toggles */}
        <div style={{ display: 'flex', background: 'rgba(59,130,246,0.06)', borderRadius: 9, padding: 3, border: '1px solid rgba(59,130,246,0.1)', gap: 2 }}>
          {([['month', <Calendar size={13} />, 'Month'], ['week', <Columns size={13} />, 'Week'], ['list', <List size={13} />, 'List']] as const).map(([m, icon, lbl]) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 7,
                border: 'none', cursor: 'pointer',
                background: viewMode === m ? '#3b82f6' : 'transparent',
                color: viewMode === m ? '#fff' : '#6b7a9a',
                fontSize: 12, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 150ms',
              }}
            >{icon}{lbl}</button>
          ))}
        </div>

        {/* Nav arrows (not on list) */}
        {viewMode !== 'list' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={navPrev} style={navBtnStyle}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', minWidth: 170, textAlign: 'center', letterSpacing: '-0.01em' }}>{headerLabel}</span>
            <button onClick={navNext} style={navBtnStyle}><ChevronRight size={14} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="btn btn-ghost btn-xs" style={{ marginLeft: 4 }}>Today</button>
          </div>
        )}

        {/* Ideas panel toggle */}
        <button
          onClick={() => setShowIdeasPanel((v) => !v)}
          className="btn btn-ghost btn-sm"
          style={{ gap: 6, color: showIdeasPanel ? '#f59e0b' : '#6b7a9a', borderColor: showIdeasPanel ? 'rgba(245,158,11,0.3)' : undefined, background: showIdeasPanel ? 'rgba(245,158,11,0.08)' : undefined }}
        >
          <Lightbulb size={14} /> Ideas
        </button>

        <button
          onClick={() => openNew()}
          className="btn btn-blue btn-sm"
          style={{ gap: 6 }}
        >
          <Plus size={14} /> Schedule Post
        </button>
      </div>

      {/* Calendar body with optional ideas panel */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', minHeight: 0 }}>
        {/* Ideas Panel Sidebar (escapes port) */}
        <AnimatePresence>
          {showIdeasPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ overflow: 'hidden', borderRight: '1px solid rgba(59,130,246,0.1)', flexShrink: 0 }}
            >
              <IdeasPanel ideas={ideas} onSchedule={handleScheduleIdea} />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px 28px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {viewMode === 'month' && (
              <MonthView
                currentDate={currentDate}
                posts={calendarPosts}
                onDayClick={(d) => openNew(d)}
                onPostClick={openEdit}
              />
            )}
            {viewMode === 'week' && (
              <WeekView
                currentDate={currentDate}
                posts={calendarPosts}
                onDayClick={(d) => openNew(d)}
                onPostClick={openEdit}
              />
            )}
            {viewMode === 'list' && (
              <ListView
                posts={calendarPosts}
                onPostClick={openEdit}
              />
            )}
          </motion.div>
        </AnimatePresence>
        </div>  {/* end calendar scroll area */}
      </div>  {/* end flex body */}

      {/* Overlay */}
      <AnimatePresence>
        {editor.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditor}
              style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.7)', backdropFilter: 'blur(3px)', zIndex: 55 }}
            />
            <PostEditor
              post={editor.post}
              defaultDate={editor.defaultDate}
              ideaId={editor.ideaId}
              onClose={closeEditor}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8,
  background: 'rgba(59,130,246,0.08)',
  border: '1px solid rgba(59,130,246,0.14)',
  color: '#6b7a9a', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', transition: 'all 150ms',
}
