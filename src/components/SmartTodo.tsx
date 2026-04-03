import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { SmartTask, TaskPriority, TaskStatus, ChecklistItem, FileAttachment, TimeEntry, TaskDependency, DependencyType } from '../types'
import {
  CheckSquare, Plus, Trash2, Search, ChevronDown, Calendar, Sparkles,
  LayoutList, Columns, Clock, X, Bell, MoreHorizontal,
  ChevronRight, FolderKanban,
  CheckCircle2, AlertTriangle, Paperclip, Download, RefreshCw,
  Grid, Play, Square, Timer, ListTodo, Video,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981',
}
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6b7a9a', 'in-progress': '#3b82f6', review: '#f59e0b', done: '#10b981', blocked: '#ef4444',
}
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Todo', 'in-progress': 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked',
}
const PROJECT_COLORS = ['#3b82f6', '#ec4899', '#f97316', '#10b981', '#f59e0b', '#8b5cf6']

function uid() { return Math.random().toString(36).slice(2, 10) }

// ── NLP Date Parser ────────────────────────────────────────────────────────────

function parseSmartDate(input: string): string | null {
  const s = input.trim().toLowerCase()
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const add = (n: number, unit: 'day' | 'week' | 'month') => {
    const d = new Date(today)
    if (unit === 'day') d.setDate(d.getDate() + n)
    else if (unit === 'week') d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    return fmt(d)
  }
  if (s === 'today' || s === 'eod') return fmt(today)
  if (s === 'tomorrow') return add(1, 'day')
  if (s === 'yesterday') return add(-1, 'day')
  if (s === 'next week' || s === 'eow') return add(7, 'day')
  const inMatch = s.match(/^in (\d+) (day|days|week|weeks|month|months)$/)
  if (inMatch) {
    const n = parseInt(inMatch[1])
    const u = inMatch[2].startsWith('d') ? 'day' : inMatch[2].startsWith('w') ? 'week' : 'month'
    return add(n, u)
  }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const nextDay = s.replace('next ', '')
  const di = days.indexOf(nextDay)
  if (di !== -1) {
    const d = new Date(today)
    let diff = di - d.getDay()
    if (diff <= 0) diff += 7
    d.setDate(d.getDate() + diff)
    return fmt(d)
  }
  const qMap: Record<string, string> = {
    q1: `${today.getFullYear()}-03-31`, q2: `${today.getFullYear()}-06-30`,
    q3: `${today.getFullYear()}-09-30`, q4: `${today.getFullYear()}-12-31`,
  }
  if (qMap[s]) return qMap[s]
  const parsed = new Date(input)
  if (!isNaN(parsed.getTime())) return fmt(parsed)
  return null
}

function smartDateLabel(dateStr?: string): { label: string; color: string } {
  if (!dateStr) return { label: '', color: '#4b5680' }
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#ef4444' }
  if (diff === 0) return { label: 'Today', color: '#f97316' }
  if (diff === 1) return { label: 'Tomorrow', color: '#f59e0b' }
  if (diff <= 7) return { label: `${diff}d`, color: '#6b7a9a' }
  return { label: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: '#4b5680' }
}

// ── SmartDateInput ─────────────────────────────────────────────────────────────

function SmartDateInput({ value, onChange, placeholder = 'Due date…' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [text, setText] = useState(value || '')
  const [focused, setFocused] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const suggestions = ['Today', 'Tomorrow', 'In 3 days', 'Next week', 'In 2 weeks', 'Next month']
  const { label, color } = smartDateLabel(value)

  useEffect(() => { if (!focused) setText(value || '') }, [value, focused])

  const handleBlur = () => {
    setFocused(false)
    const parsed = parseSmartDate(text)
    if (parsed) onChange(parsed)
    else if (!text.trim()) onChange('')
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          ref={ref}
          value={text}
          onChange={e => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7, padding: '6px 10px', color: '#f0f4ff', fontSize: 13,
            fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
          }}
        />
        {value && <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{label}</span>}
      </div>
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#1a1a2e', border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 8, padding: 8, marginTop: 4,
              display: 'flex', flexWrap: 'wrap', gap: 5,
            }}
          >
            {suggestions.map(s => (
              <button
                key={s}
                onMouseDown={e => {
                  e.preventDefault()
                  const parsed = parseSmartDate(s)
                  if (parsed) { onChange(parsed); setText(parsed); setFocused(false) }
                }}
                style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                  color: '#3b82f6', cursor: 'pointer',
                }}
              >{s}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── AIButton ───────────────────────────────────────────────────────────────────

function AIButton({ apiKey, context, onResult, placeholder = 'Ask AI…' }: {
  apiKey?: string
  context: string
  onResult: (text: string) => void
  placeholder?: string
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (apiKey) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 512,
            messages: [{ role: 'user', content: context }],
          }),
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || ''
        if (text) onResult(text)
      } else {
        // Demo fallback
        await new Promise(r => setTimeout(r, 600))
        onResult('(AI demo) ' + placeholder + ' — add your API key in Settings for real AI responses.')
      }
    } catch { toast.error('AI request failed') }
    finally { setLoading(false) }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={placeholder}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7,
        background: loading ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.12)',
        border: '1px solid rgba(139,92,246,0.25)', color: loading ? '#6b7a9a' : '#8b5cf6',
        fontSize: 11, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      <Sparkles size={11} />
      {loading ? 'Thinking…' : 'AI'}
    </button>
  )
}

// ── ReminderPicker ─────────────────────────────────────────────────────────────

function ReminderPicker({ taskTitle, onClose }: { taskTitle: string; onClose: () => void }) {
  const options = [
    { label: 'In 1 hour', ms: 3600000 },
    { label: 'In 4 hours', ms: 14400000 },
    { label: 'Tomorrow morning', ms: 57600000 },
    { label: 'In 1 day', ms: 86400000 },
  ]
  const [custom, setCustom] = useState('')

  const schedule = (ms: number, label: string) => {
    const fire = () => toast(`⏰ Reminder: ${taskTitle}`, { duration: 8000 })
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          setTimeout(() => new Notification('Creator Command', { body: `Reminder: ${taskTitle}` }), ms)
          toast.success(`Reminder set: ${label}`)
        } else {
          setTimeout(fire, ms)
          toast.success(`Reminder set: ${label} (in-app only)`)
        }
      })
    } else {
      setTimeout(fire, ms)
      toast.success(`Reminder set: ${label}`)
    }
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8,8,16,0.7)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14,
          padding: 24, width: 320,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, color: '#f0f4ff', marginBottom: 4 }}>Set Reminder</div>
        <div style={{ fontSize: 12, color: '#4b5680', marginBottom: 16 }}>{taskTitle}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {options.map(o => (
            <button
              key={o.label}
              onClick={() => schedule(o.ms, o.label)}
              style={{
                background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 8, padding: '9px 14px', color: '#3b82f6', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', textAlign: 'left',
              }}
            >{o.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Custom (e.g. in 3 hours)"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, padding: '7px 10px', color: '#f0f4ff', fontSize: 12,
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
            }}
          />
          <button
            onClick={() => {
              const parsed = parseSmartDate(custom)
              if (parsed) {
                const ms = new Date(parsed).getTime() - Date.now()
                schedule(Math.max(ms, 1000), custom)
              } else toast.error('Could not parse date')
            }}
            className="btn btn-blue btn-sm"
          >Set</button>
        </div>
      </div>
    </motion.div>
  )
}

// ── FileAttachmentPanel ────────────────────────────────────────────────────────

function FileAttachmentPanel({ taskId, attachments = [], onAdd, onRemove }: {
  taskId: string
  attachments: FileAttachment[]
  onAdd: (taskId: string, att: FileAttachment) => void
  onRemove: (taskId: string, attId: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const MAX_SIZE = 5 * 1024 * 1024

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`)
        return
      }
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        onAdd(taskId, {
          id: uid(),
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'me',
        })
        toast.success(`Attached ${file.name}`)
      }
      reader.readAsDataURL(file)
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const isImage = (type: string) => type.startsWith('image/')

  const download = (att: FileAttachment) => {
    const a = document.createElement('a')
    a.href = att.dataUrl
    a.download = att.name
    a.click()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Attachments {attachments.length > 0 && <span style={{ color: '#3b82f6' }}>{attachments.length}</span>}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
            color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Paperclip size={10} /> Attach
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map(att => (
            <div
              key={att.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 7,
              }}
            >
              {isImage(att.type) ? (
                <img
                  src={att.dataUrl}
                  alt={att.name}
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 4, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Paperclip size={12} color="#3b82f6" />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#d0d8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                <div style={{ fontSize: 10, color: '#4b5680' }}>{formatSize(att.size)}</div>
              </div>
              <button onClick={() => download(att)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 3 }} title="Download">
                <Download size={12} />
              </button>
              <button onClick={() => onRemove(taskId, att.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', padding: 3 }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachments.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8, padding: '14px',
            textAlign: 'center', cursor: 'pointer', color: '#3a4060', fontSize: 12,
          }}
        >
          Click to attach files (max 5MB each)
        </div>
      )}
    </div>
  )
}

// ── TimeTracker ────────────────────────────────────────────────────────────────

function TimeTracker({ taskId, timeEntries = [], loggedHours: _loggedHours, onAddEntry }: {
  taskId: string
  timeEntries: TimeEntry[]
  loggedHours?: number
  onAddEntry: (taskId: string, entry: TimeEntry) => void
}) {
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [note, setNote] = useState('')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(0)

  const startStop = () => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setRunning(false)
      const totalMinutes = Math.round(elapsed / 60)
      if (totalMinutes > 0) {
        onAddEntry(taskId, {
          id: uid(), taskId,
          durationMinutes: totalMinutes,
          note: note || undefined,
          loggedAt: new Date().toISOString(),
          loggedBy: 'me',
        })
        toast.success(`Logged ${totalMinutes}m`)
        setNote('')
      }
      setElapsed(0)
    } else {
      startRef.current = Date.now() - elapsed * 1000
      setRunning(true)
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
      }, 1000)
    }
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const logManual = () => {
    const h = parseFloat(hours) || 0
    const m = parseInt(minutes) || 0
    const total = h * 60 + m
    if (total <= 0) { toast.error('Enter time to log'); return }
    onAddEntry(taskId, {
      id: uid(), taskId,
      durationMinutes: total,
      note: note || undefined,
      loggedAt: new Date().toISOString(),
      loggedBy: 'me',
    })
    toast.success(`Logged ${h > 0 ? h + 'h ' : ''}${m > 0 ? m + 'm' : ''}`)
    setHours(''); setMinutes(''); setNote('')
  }

  const totalLogged = timeEntries.reduce((a, e) => a + e.durationMinutes, 0)
  const totalH = Math.floor(totalLogged / 60)
  const totalM = totalLogged % 60

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Time Tracking
        {totalLogged > 0 && (
          <span style={{ marginLeft: 8, color: '#3b82f6', fontFamily: 'Space Mono, monospace' }}>
            {totalH > 0 ? `${totalH}h ` : ''}{totalM > 0 ? `${totalM}m` : ''} logged
          </span>
        )}
      </div>

      {/* Stopwatch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
        <button
          onClick={startStop}
          style={{
            width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
            background: running ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            color: running ? '#ef4444' : '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {running ? <Square size={12} /> : <Play size={12} />}
        </button>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 14, fontWeight: 700, color: running ? '#f0f4ff' : '#4b5680', flex: 1 }}>
          {formatElapsed(elapsed)}
        </span>
        {running && (
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What are you working on?"
            style={{
              flex: 2, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11,
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
            }}
          />
        )}
      </div>

      {/* Manual log */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={hours} onChange={e => setHours(e.target.value)} placeholder="h"
          type="number" min="0" step="1"
          style={{ width: 48, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 8px', color: '#f0f4ff', fontSize: 12, fontFamily: 'Space Mono, monospace', outline: 'none', textAlign: 'center' }}
        />
        <span style={{ color: '#4b5680', fontSize: 12 }}>h</span>
        <input
          value={minutes} onChange={e => setMinutes(e.target.value)} placeholder="m"
          type="number" min="0" max="59" step="5"
          style={{ width: 48, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 8px', color: '#f0f4ff', fontSize: 12, fontFamily: 'Space Mono, monospace', outline: 'none', textAlign: 'center' }}
        />
        <span style={{ color: '#4b5680', fontSize: 12 }}>m</span>
        <input
          value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)"
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 9px', color: '#f0f4ff', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
        />
        <button onClick={logManual} style={{ padding: '6px 11px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Log</button>
      </div>

      {/* History */}
      {timeEntries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {timeEntries.slice(-5).reverse().map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <Timer size={10} color="#4b5680" />
              <span style={{ fontSize: 11, fontFamily: 'Space Mono, monospace', color: '#3b82f6', flexShrink: 0 }}>
                {Math.floor(e.durationMinutes / 60) > 0 ? `${Math.floor(e.durationMinutes / 60)}h ` : ''}{e.durationMinutes % 60 > 0 ? `${e.durationMinutes % 60}m` : ''}
              </span>
              {e.note && <span style={{ flex: 1, fontSize: 11, color: '#6b7a9a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.note}</span>}
              <span style={{ fontSize: 10, color: '#2a3050', flexShrink: 0 }}>
                {new Date(e.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TaskDetailDrawer ───────────────────────────────────────────────────────────

function TaskDetailDrawer({
  task, projectMap, allTasks, calendarPosts, onSave, onRemove, onClose, apiKey,
  onAddAttachment, onRemoveAttachment, onAddTimeEntry,
}: {
  task: SmartTask
  projectMap: Map<string, { name: string; color: string }>
  allTasks: SmartTask[]
  calendarPosts?: import('../types').CalendarPost[]
  onSave: (id: string, u: Partial<SmartTask>) => void
  onRemove: (id: string) => void
  onClose: () => void
  apiKey?: string
  onAddAttachment: (taskId: string, att: FileAttachment) => void
  onRemoveAttachment: (taskId: string, attId: string) => void
  onAddTimeEntry: (taskId: string, entry: TimeEntry) => void
}) {
  const [t, setT] = useState<SmartTask>({ ...task })
  const [newCheckItem, setNewCheckItem] = useState('')
  const [newTag, setNewTag] = useState('')
  const [showReminder, setShowReminder] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const dirty = JSON.stringify(t) !== JSON.stringify(task)
  const checkDone = (t.checklist || []).filter(c => c.done).length
  const checkTotal = (t.checklist || []).length
  const SP_CHIPS = [1, 2, 3, 5, 8, 13]

  const save = () => {
    const updates: Partial<SmartTask> = { ...t }
    if (t.status === 'done' && task.status !== 'done') updates.completedAt = new Date().toISOString()
    onSave(task.id, updates)
    toast.success('Task saved')
    onClose()
  }

  const addCheck = () => {
    if (!newCheckItem.trim()) return
    const item: ChecklistItem = { id: uid(), title: newCheckItem.trim(), done: false }
    setT(prev => ({ ...prev, checklist: [...(prev.checklist || []), item] }))
    setNewCheckItem('')
  }

  const toggleCheck = (id: string) => {
    setT(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(c => c.id === id ? { ...c, done: !c.done } : c),
    }))
  }

  const removeCheck = (id: string) => {
    setT(prev => ({ ...prev, checklist: (prev.checklist || []).filter(c => c.id !== id) }))
  }

  const addTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!tag || t.tags.includes(tag)) return
    setT(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    setNewTag('')
  }

  const proj = t.projectId ? projectMap.get(t.projectId) : undefined

  const depOptions = allTasks.filter(x => x.id !== task.id)
  const currentDeps = t.dependencies || []
  const addDep = (toTaskId: string, depType: DependencyType) => {
    if (currentDeps.find(d => d.toTaskId === toTaskId)) return
    const dep: TaskDependency = { id: uid(), fromTaskId: task.id, toTaskId, type: depType }
    setT(prev => ({ ...prev, dependencies: [...(prev.dependencies || []), dep] }))
  }
  const removeDep = (id: string) => setT(prev => ({ ...prev, dependencies: (prev.dependencies || []).filter(d => d.id !== id) }))

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 100 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 101,
          background: '#0d0d1a', borderLeft: '1px solid rgba(59,130,246,0.15)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          maxHeight: '100vh',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Task Detail</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowReminder(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }} title="Set reminder">
              <Bell size={15} />
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Title */}
          <input
            value={t.title}
            onChange={e => setT(prev => ({ ...prev, title: e.target.value }))}
            style={{
              background: 'none', border: 'none', fontSize: 20, fontWeight: 800,
              color: '#f0f4ff', letterSpacing: '-0.02em', width: '100%',
              fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10,
            }}
          />

          {/* Status + Priority */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Status</div>
              <select
                value={t.status}
                onChange={e => setT(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                style={{
                  width: '100%', background: `${STATUS_COLORS[t.status]}12`,
                  border: `1px solid ${STATUS_COLORS[t.status]}30`, borderRadius: 7,
                  padding: '7px 10px', color: STATUS_COLORS[t.status], fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Priority</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setT(prev => ({ ...prev, priority: p }))}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                      border: t.priority === p ? `1.5px solid ${PRIORITY_COLORS[p]}` : '1px solid rgba(255,255,255,0.07)',
                      background: t.priority === p ? `${PRIORITY_COLORS[p]}18` : 'transparent',
                      color: t.priority === p ? PRIORITY_COLORS[p] : '#4b5680',
                      cursor: 'pointer', textTransform: 'capitalize',
                    }}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Story Points */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Story Points</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {SP_CHIPS.map(sp => (
                <button
                  key={sp}
                  onClick={() => setT(prev => ({ ...prev, storyPoints: prev.storyPoints === sp ? undefined : sp }))}
                  style={{
                    width: 32, height: 28, borderRadius: 6, fontSize: 11, fontWeight: 700,
                    border: t.storyPoints === sp ? '1.5px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.07)',
                    background: t.storyPoints === sp ? 'rgba(139,92,246,0.15)' : 'transparent',
                    color: t.storyPoints === sp ? '#8b5cf6' : '#4b5680',
                    cursor: 'pointer', fontFamily: 'Space Mono, monospace',
                  }}
                >{sp}</button>
              ))}
              <input
                type="number" min="1"
                value={t.storyPoints && !SP_CHIPS.includes(t.storyPoints) ? t.storyPoints : ''}
                onChange={e => setT(prev => ({ ...prev, storyPoints: parseInt(e.target.value) || undefined }))}
                placeholder="custom"
                style={{ width: 60, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 7px', color: '#f0f4ff', fontSize: 11, fontFamily: 'Space Mono, monospace', outline: 'none', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Project */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Project</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {proj && <div style={{ width: 10, height: 10, borderRadius: '50%', background: proj.color }} />}
              <select
                value={t.projectId || ''}
                onChange={e => setT(prev => ({ ...prev, projectId: e.target.value || undefined }))}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 7, padding: '7px 10px', color: '#f0f4ff', fontSize: 12,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <option value="">No project</option>
                {Array.from(projectMap.entries()).map(([id, p]) => (
                  <option key={id} value={id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Start Date</div>
              <SmartDateInput value={t.startDate || ''} onChange={v => setT(prev => ({ ...prev, startDate: v || undefined }))} placeholder="Start date…" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Due Date</div>
              <SmartDateInput value={t.dueDate || ''} onChange={v => setT(prev => ({ ...prev, dueDate: v || undefined }))} placeholder="Due date…" />
            </div>
          </div>

          {/* Est hours + Recurrence */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Estimated Hours</div>
              <input
                type="number" step="0.5" min="0"
                value={t.estimatedHours || ''}
                onChange={e => setT(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || undefined }))}
                placeholder="e.g. 2.5"
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', color: '#f0f4ff', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Recurrence</div>
              <select
                value={t.recurrence || 'none'}
                onChange={e => setT(prev => ({ ...prev, recurrence: e.target.value as SmartTask['recurrence'] }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', color: '#f0f4ff', fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                <option value="none">No recurrence</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Quick Actions: Add to Planner + Meet + Performance Link */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setT(prev => ({ ...prev, plannedDate: today }))
                toast.success('Added to Daily Planner for today')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)',
                background: t.plannedDate ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)',
                color: t.plannedDate ? '#3b82f6' : '#6b7a9a',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <ListTodo size={12} />
              {t.plannedDate ? `In Planner (${t.plannedDate})` : 'Add to Planner'}
            </button>
            <button
              onClick={() => {
                const title = encodeURIComponent(`${t.title}`)
                const now = new Date()
                const start = new Date(now.getTime() + 86400000)
                const end = new Date(start.getTime() + 3600000)
                const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z'
                const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&add=meet`
                window.open(url, '_blank')
                toast.success('Google Calendar opened — add Meet link')
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(6,182,212,0.2)',
                background: 'rgba(6,182,212,0.06)', color: '#06b6d4',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <Video size={12} />
              Schedule Meet
            </button>
          </div>

          {/* Notes + AI */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</div>
              <AIButton
                apiKey={apiKey}
                context={`Expand and improve these task notes for "${t.title}": ${t.notes || '(no notes yet)'}`}
                onResult={text => setT(prev => ({ ...prev, notes: text }))}
                placeholder="Expand notes"
              />
            </div>
            <textarea
              value={t.notes || ''}
              onChange={e => setT(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes, context, or links..."
              rows={3}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 10px', color: '#f0f4ff', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
            />
          </div>

          {/* Performance × Content Link */}
          {calendarPosts && calendarPosts.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Link to Content Post
              </div>
              <select
                value={t.linkedPostId || ''}
                onChange={(e) => setT(prev => ({ ...prev, linkedPostId: e.target.value || undefined }))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '7px 10px', color: '#f0f4ff', fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
              >
                <option value="">No linked post</option>
                {calendarPosts.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.platform} · {p.scheduledAt})</option>
                ))}
              </select>
              {t.linkedPostId && (() => {
                const post = calendarPosts.find((p) => p.id === t.linkedPostId)
                if (!post?.performanceData) return null
                const pd = post.performanceData
                return (
                  <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#10b981', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Performance Data</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {[
                        { label: 'Views', val: pd.views },
                        { label: 'Likes', val: pd.likes },
                        { label: 'Comments', val: pd.comments },
                        { label: 'Saves', val: pd.saves },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Space Mono, monospace' }}>{val.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: '#6b7a9a' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Checklist */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Checklist {checkTotal > 0 && <span style={{ color: '#3b82f6' }}>{checkDone}/{checkTotal}</span>}
              </div>
            </div>
            {checkTotal > 0 && (
              <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0}%`, background: '#10b981', borderRadius: 2, transition: 'width 300ms ease' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
              {(t.checklist || []).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <button
                    onClick={() => toggleCheck(item.id)}
                    style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${item.done ? '#10b981' : '#2a3050'}`, background: item.done ? '#10b981' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {item.done && <CheckSquare size={9} color="white" />}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: item.done ? '#3a4060' : '#d0d8f0', textDecoration: item.done ? 'line-through' : 'none' }}>{item.title}</span>
                  <button onClick={() => removeCheck(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3050', padding: 0 }}><X size={11} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCheck() }}
                placeholder="Add subtask…"
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 9px', color: '#f0f4ff', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
              />
              <button onClick={addCheck} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59,130,246,0.15)', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {t.tags.map(tag => (
                <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11, fontWeight: 600, color: '#3b82f6' }}>
                  {tag}
                  <button onClick={() => setT(prev => ({ ...prev, tags: prev.tags.filter(tg => tg !== tag) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 0, display: 'flex' }}><X size={9} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag() }}
                placeholder="Add tag…"
                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 9px', color: '#f0f4ff', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif', outline: 'none' }}
              />
              <button onClick={addTag} style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(59,130,246,0.15)', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Time Tracking */}
          <TimeTracker
            taskId={task.id}
            timeEntries={task.timeEntries || []}
            loggedHours={task.loggedHours}
            onAddEntry={onAddTimeEntry}
          />

          {/* File Attachments */}
          <FileAttachmentPanel
            taskId={task.id}
            attachments={task.attachments || []}
            onAdd={onAddAttachment}
            onRemove={onRemoveAttachment}
          />

          {/* Dependencies */}
          {depOptions.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dependencies</div>
              {currentDeps.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                  {currentDeps.map(dep => {
                    const depTask = allTasks.find(x => x.id === dep.toTaskId)
                    return depTask ? (
                      <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', padding: '1px 5px', background: 'rgba(245,158,11,0.1)', borderRadius: 3 }}>{dep.type}</span>
                        <span style={{ flex: 1, fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{depTask.title}</span>
                        <button onClick={() => removeDep(dep.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', padding: 0 }}><X size={10} /></button>
                      </div>
                    ) : null
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <select
                  defaultValue=""
                  onChange={e => {
                    if (e.target.value) addDep(e.target.value, 'blocks')
                    e.target.value = ''
                  }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 9px', color: '#6b7a9a', fontSize: 12, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  <option value="">Link dependency…</option>
                  {depOptions.map(x => (
                    <option key={x.id} value={x.id}>{x.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#ef4444' }}>Delete this task?</span>
              <button onClick={() => { onRemove(task.id); onClose() }} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7a9a', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={13} /> Delete
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7a9a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={save}
              style={{
                padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: dirty ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.3)',
                border: 'none', color: dirty ? '#fff' : '#3b82f6',
              }}
            >Save</button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showReminder && <ReminderPicker taskTitle={task.title} onClose={() => setShowReminder(false)} />}
      </AnimatePresence>
    </>
  )
}

// ── TaskRow (List) ─────────────────────────────────────────────────────────────

function TaskRow({
  task, projectMap, onUpdate, onRemove, onOpen,
}: {
  task: SmartTask
  projectMap: Map<string, { name: string; color: string }>
  onUpdate: (id: string, u: Partial<SmartTask>) => void
  onRemove: (id: string) => void
  onOpen: (task: SmartTask) => void
}) {
  const [hovered, setHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const done = task.status === 'done'
  const { label: dateLabel, color: dateColor } = smartDateLabel(task.dueDate)
  const proj = task.projectId ? projectMap.get(task.projectId) : undefined
  const checkDone = (task.checklist || []).filter(c => c.done).length
  const checkTotal = (task.checklist || []).length
  const attachCount = (task.attachments || []).length

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowMenu(false) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
          background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent', transition: 'background 100ms ease',
          position: 'relative',
        }}
      >
        <button
          onClick={() => onUpdate(task.id, { status: done ? 'todo' : 'done', completedAt: done ? undefined : new Date().toISOString() })}
          style={{
            width: 17, height: 17, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
            border: `1.5px solid ${done ? '#10b981' : '#2a3050'}`,
            background: done ? '#10b981' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {done && <CheckSquare size={10} color="white" />}
        </button>

        <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />

        {task.storyPoints && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#8b5cf6', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
            {task.storyPoints}
          </span>
        )}

        <span
          onClick={() => !done && onOpen(task)}
          style={{
            flex: 1, fontSize: 13, fontWeight: 500, cursor: done ? 'default' : 'pointer',
            color: done ? '#3a4060' : '#d0d8f0', textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>

        {proj && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 5, background: `${proj.color}15`, border: `1px solid ${proj.color}25`, flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: proj.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: proj.color }}>{proj.name}</span>
          </div>
        )}

        {checkTotal > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: checkDone === checkTotal ? '#10b981' : '#6b7a9a', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
            {checkDone}/{checkTotal}
          </span>
        )}

        {task.recurrence && task.recurrence !== 'none' && (
          <RefreshCw size={10} color="#f59e0b" style={{ flexShrink: 0 }} />
        )}

        {task.estimatedHours && (
          <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>~{task.estimatedHours}h</span>
        )}

        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', flexShrink: 0 }}>{tag}</span>
        ))}

        {task.dueDate && (
          <span style={{ fontSize: 11, fontWeight: 700, color: dateColor, fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{dateLabel}</span>
        )}

        {attachCount > 0 && (
          <span style={{ fontSize: 10, color: '#4b5680', display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Paperclip size={9} />{attachCount}
          </span>
        )}

        <AnimatePresence>
          {hovered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => setShowReminder(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', padding: 3 }} title="Set reminder"><Bell size={12} /></button>
              <button onClick={() => onOpen(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', padding: 3 }} title="Open"><ChevronRight size={13} /></button>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowMenu(m => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3a4060', padding: 3 }}><MoreHorizontal size={13} /></button>
                {showMenu && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', background: '#111122', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 4, zIndex: 30, minWidth: 140, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                    {[
                      { label: 'Open', icon: <ChevronRight size={12} />, action: () => onOpen(task) },
                      { label: 'Delete', icon: <Trash2 size={12} />, action: () => onRemove(task.id), danger: true },
                    ].map(item => (
                      <button key={item.label} onClick={() => { item.action(); setShowMenu(false) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer', color: item.danger ? '#ef4444' : '#94a3b8', fontSize: 12, borderRadius: 5, textAlign: 'left' }}>
                        {item.icon} {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showReminder && <ReminderPicker taskTitle={task.title} onClose={() => setShowReminder(false)} />}
      </AnimatePresence>
    </>
  )
}

// ── List View ──────────────────────────────────────────────────────────────────

function ListView({ tasks, projectMap, onUpdate, onRemove, onOpen }: {
  tasks: SmartTask[]
  projectMap: Map<string, { name: string; color: string }>
  onUpdate: (id: string, u: Partial<SmartTask>) => void
  onRemove: (id: string) => void
  onOpen: (task: SmartTask) => void
}) {
  const [showDone, setShowDone] = useState(false)
  const today = new Date().toDateString()
  const tomorrow = new Date(Date.now() + 86400000).toDateString()
  const weekEnd = new Date(Date.now() + 7 * 86400000)
  const active = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt).toDateString() === today)

  const overdue = active.filter(t => t.dueDate && new Date(t.dueDate) < new Date(today))
  const todayT = active.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today)
  const tomorrowT = active.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === tomorrow)
  const thisWeek = active.filter(t => t.dueDate && new Date(t.dueDate) > new Date(today) && new Date(t.dueDate) <= weekEnd && new Date(t.dueDate).toDateString() !== today && new Date(t.dueDate).toDateString() !== tomorrow)
  const later = active.filter(t => t.dueDate && new Date(t.dueDate) > weekEnd)
  const unscheduled = active.filter(t => !t.dueDate)

  const Section = ({ label, items, accent }: { label: string; items: SmartTask[]; accent?: string }) => {
    const [collapsed, setCollapsed] = useState(false)
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 18 }}>
        <button
          onClick={() => setCollapsed(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', marginBottom: 5, width: '100%', textAlign: 'left' }}
        >
          <ChevronDown size={11} color={accent || '#4b5680'} style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 150ms', flexShrink: 0 }} />
          {accent === '#ef4444' && <AlertTriangle size={10} color={accent} />}
          <span style={{ fontSize: 10, fontWeight: 800, color: accent || '#4b5680', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label} · {items.length}</span>
        </button>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <AnimatePresence>{items.map(t => <TaskRow key={t.id} task={t} projectMap={projectMap} onUpdate={onUpdate} onRemove={onRemove} onOpen={onOpen} />)}</AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  if (!active.length && !done.length) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4b5680' }}>
        <CheckCircle2 size={48} style={{ marginBottom: 16, opacity: 0.15 }} />
        <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7a9a', marginBottom: 6 }}>All clear!</div>
        <div style={{ fontSize: 13 }}>Add a task above to get started</div>
      </div>
    )
  }

  return (
    <div>
      <Section label="Overdue" items={overdue} accent="#ef4444" />
      <Section label="Today" items={todayT} accent="#f97316" />
      <Section label="Tomorrow" items={tomorrowT} accent="#f59e0b" />
      <Section label="This Week" items={thisWeek} />
      <Section label="Later" items={later} />
      <Section label="No Due Date" items={unscheduled} />
      {done.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button onClick={() => setShowDone(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', color: '#4b5680', fontSize: 12, fontWeight: 600 }}>
            <ChevronDown size={13} style={{ transform: showDone ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
            {done.length} completed today
          </button>
          <AnimatePresence>
            {showDone && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                {done.map(t => <TaskRow key={t.id} task={t} projectMap={projectMap} onUpdate={onUpdate} onRemove={onRemove} onOpen={onOpen} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── Board View ─────────────────────────────────────────────────────────────────

function BoardView({ tasks, projectMap, onUpdate, onRemove, onOpen, onAdd }: {
  tasks: SmartTask[]
  projectMap: Map<string, { name: string; color: string }>
  onUpdate: (id: string, u: Partial<SmartTask>) => void
  onRemove: (id: string) => void
  onOpen: (task: SmartTask) => void
  onAdd: (t: SmartTask) => void
}) {
  const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'blocked', 'done']
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [newTitle, setNewTitle] = useState('')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, width: '100%' }}>
      {statuses.map(status => {
        const col = tasks.filter(t => t.status === status)
        return (
          <div key={status} style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, padding: '0 4px' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[status] }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7a9a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{STATUS_LABELS[status]}</span>
              <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', color: '#4b5680', borderRadius: 10, padding: '1px 6px', fontWeight: 600, marginLeft: 'auto' }}>{col.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <AnimatePresence>
                {col.map(t => {
                  const proj = t.projectId ? projectMap.get(t.projectId) : undefined
                  const checkDone = (t.checklist || []).filter(c => c.done).length
                  const checkTotal = (t.checklist || []).length
                  const { label: dl, color: dc } = smartDateLabel(t.dueDate)
                  const totalMinutes = (t.timeEntries || []).reduce((a, e) => a + e.durationMinutes, 0)
                  return (
                    <motion.div
                      key={t.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => onOpen(t)}
                      className="card"
                      style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}
                    >
                      {/* Priority color bar */}
                      <div style={{ height: 3, background: PRIORITY_COLORS[t.priority], width: '100%' }} />
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                          {t.storyPoints && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{t.storyPoints}</span>
                          )}
                          <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: t.status === 'done' ? '#4b5680' : '#d0d8f0', textDecoration: t.status === 'done' ? 'line-through' : 'none', lineHeight: 1.4, wordBreak: 'break-word', minWidth: 0 }}>{t.title}</span>
                          <button onClick={e => { e.stopPropagation(); onRemove(t.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3050', padding: 0, flexShrink: 0 }}><X size={11} /></button>
                        </div>
                        {proj && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: proj.color }} />
                            <span style={{ fontSize: 10, color: proj.color, fontWeight: 600 }}>{proj.name}</span>
                          </div>
                        )}
                        {checkTotal > 0 && (
                          <div style={{ marginBottom: 5 }}>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(checkDone / checkTotal) * 100}%`, background: '#10b981', borderRadius: 2 }} />
                            </div>
                            <div style={{ fontSize: 9, color: '#4b5680', marginTop: 2 }}>{checkDone}/{checkTotal} subtasks</div>
                          </div>
                        )}
                        {t.dueDate && <div style={{ fontSize: 10, color: dc, display: 'flex', alignItems: 'center', gap: 3, marginBottom: 5 }}><Calendar size={9} />{dl}</div>}
                        {t.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                            {t.tags.slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>{tag}</span>)}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <select
                            value={t.status}
                            onChange={e => { e.stopPropagation(); onUpdate(t.id, { status: e.target.value as TaskStatus }) }}
                            onClick={e => e.stopPropagation()}
                            style={{ flex: 1, background: `${STATUS_COLORS[t.status]}10`, border: `1px solid ${STATUS_COLORS[t.status]}25`, borderRadius: 5, padding: '3px 6px', color: STATUS_COLORS[t.status], fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                          >
                            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                          {totalMinutes > 0 && (
                            <span style={{ fontSize: 9, color: '#4b5680', fontFamily: 'Space Mono, monospace', marginLeft: 6 }}>
                              {Math.floor(totalMinutes / 60) > 0 ? `${Math.floor(totalMinutes / 60)}h` : ''}{totalMinutes % 60 > 0 ? `${totalMinutes % 60}m` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {addingTo === status ? (
                <input
                  autoFocus placeholder="Task title…" value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTitle.trim()) {
                      onAdd({ id: uid(), title: newTitle.trim(), priority: 'medium', status, tags: [], createdAt: new Date().toISOString() })
                      setNewTitle(''); setAddingTo(null)
                    }
                    if (e.key === 'Escape') { setAddingTo(null); setNewTitle('') }
                  }}
                  onBlur={() => { if (!newTitle.trim()) setAddingTo(null) }}
                  style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 10px', color: '#f0f4ff', fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <button onClick={() => setAddingTo(status)} style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px', cursor: 'pointer', color: '#3a4060', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 150ms ease', width: '100%' }}>
                  <Plus size={12} /> Add task
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Timeline View ──────────────────────────────────────────────────────────────

function TimelineView({ tasks, projectMap, onUpdate, onRemove, onOpen }: {
  tasks: SmartTask[]
  projectMap: Map<string, { name: string; color: string }>
  onUpdate: (id: string, u: Partial<SmartTask>) => void
  onRemove: (id: string) => void
  onOpen: (task: SmartTask) => void
}) {
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date(new Date().toDateString()) && t.status !== 'done')
  const days = Array.from({ length: 23 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + (i - 1))
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: d, dateStr,
      label: i === 0 ? 'Yesterday' : i === 1 ? 'Today' : i === 2 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tasks: tasks.filter(t => t.dueDate === dateStr && t.status !== 'done'),
      isToday: i === 1,
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {overdue.length > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={11} /> Overdue · {overdue.length}
          </div>
          {overdue.map(t => <TaskRow key={t.id} task={t} projectMap={projectMap} onUpdate={onUpdate} onRemove={onRemove} onOpen={onOpen} />)}
        </div>
      )}
      {days.map(({ date, label, tasks: dt, isToday }, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14, opacity: dt.length === 0 ? 0.3 : 1 }}>
          <div style={{ width: 90, flexShrink: 0, paddingTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isToday ? '#f97316' : '#6b7a9a' }}>{label}</div>
            <div style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: '#2a3050', marginTop: 2 }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </div>
          <div style={{ flex: 1, borderLeft: `2px solid ${isToday ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)'}`, paddingLeft: 16, minHeight: 28, minWidth: 0, overflow: 'hidden' }}>
            {dt.length === 0 ? <div style={{ fontSize: 12, color: '#2a3050', paddingTop: 4 }}>—</div> : dt.map(t => <TaskRow key={t.id} task={t} projectMap={projectMap} onUpdate={onUpdate} onRemove={onRemove} onOpen={onOpen} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Priority Matrix (Eisenhower) ───────────────────────────────────────────────

function MatrixView({ tasks, onOpen }: {
  tasks: SmartTask[]
  onOpen: (task: SmartTask) => void
}) {
  const active = tasks.filter(t => t.status !== 'done')
  const in3days = new Date(Date.now() + 3 * 86400000)

  const isUrgent = (t: SmartTask) => {
    if (!t.dueDate) return t.priority === 'urgent'
    return new Date(t.dueDate) <= in3days || t.priority === 'urgent'
  }
  const isImportant = (t: SmartTask) => t.priority === 'urgent' || t.priority === 'high'

  const q1 = active.filter(t => isUrgent(t) && isImportant(t))
  const q2 = active.filter(t => !isUrgent(t) && isImportant(t))
  const q3 = active.filter(t => isUrgent(t) && !isImportant(t))
  const q4 = active.filter(t => !isUrgent(t) && !isImportant(t))

  const quadrants = [
    { label: 'Do First', sub: 'Urgent + Important', tasks: q1, color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)' },
    { label: 'Schedule', sub: 'Not Urgent + Important', tasks: q2, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)' },
    { label: 'Delegate', sub: 'Urgent + Not Important', tasks: q3, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)' },
    { label: 'Eliminate', sub: 'Not Urgent + Not Important', tasks: q4, color: '#6b7a9a', bg: 'rgba(107,122,154,0.06)', border: 'rgba(107,122,154,0.12)' },
  ]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 11, color: '#4b5680', marginBottom: 14, textAlign: 'center' }}>
        Eisenhower Matrix — {active.length} active tasks
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
        {quadrants.map(q => (
          <div
            key={q.label}
            style={{
              background: q.bg, border: `1px solid ${q.border}`, borderRadius: 12,
              padding: '14px', minHeight: 160, minWidth: 0, overflow: 'hidden',
            }}
          >
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: q.color }}>{q.label}</div>
              <div style={{ fontSize: 10, color: '#4b5680', marginTop: 1 }}>{q.sub}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {q.tasks.length === 0 && (
                <div style={{ fontSize: 11, color: '#2a3050', textAlign: 'center', padding: '16px 0' }}>—</div>
              )}
              {q.tasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => onOpen(t)}
                  style={{
                    padding: '6px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                    background: `${q.color}15`, border: `1px solid ${q.color}25`,
                    color: '#d0d8f0', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    minWidth: 0, overflow: 'hidden',
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[t.priority], flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{t.title}</span>
                  {t.dueDate && (
                    <span style={{ fontSize: 9, color: smartDateLabel(t.dueDate).color, fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
                      {smartDateLabel(t.dueDate).label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── QuickAddBar ────────────────────────────────────────────────────────────────

function QuickAddBar({ projectMap, onAdd }: { projectMap: Map<string, { name: string; color: string }>; onAdd: (t: SmartTask) => void }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [added, setAdded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (!title.trim()) return
    onAdd({ id: uid(), title: title.trim(), priority, status: 'todo', dueDate: dueDate || undefined, projectId: projectId || undefined, tags: [], createdAt: new Date().toISOString() })
    setTitle(''); setDueDate('')
    setAdded(true); setTimeout(() => setAdded(false), 600)
    inputRef.current?.focus()
  }

  return (
    <motion.div
      animate={{ scale: added ? [1, 1.01, 1] : 1 }}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: '10px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[priority], flexShrink: 0 }} />
      <input
        ref={inputRef}
        placeholder="Add a task… press Enter to save"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        style={{ flex: 1, background: 'none', border: 'none', color: '#f0f4ff', fontSize: 14, outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      />
      <select
        value={priority}
        onChange={e => setPriority(e.target.value as TaskPriority)}
        style={{ background: `${PRIORITY_COLORS[priority]}15`, border: `1px solid ${PRIORITY_COLORS[priority]}30`, borderRadius: 6, padding: '4px 7px', color: PRIORITY_COLORS[priority], fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}
      >
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      {projectMap.size > 0 && (
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 7px', color: '#6b7a9a', fontSize: 11, cursor: 'pointer' }}
        >
          <option value="">No project</option>
          {Array.from(projectMap.entries()).map(([id, p]) => <option key={id} value={id}>{p.name}</option>)}
        </select>
      )}
      <div style={{ minWidth: 0, flex: '1 1 120px' }}><SmartDateInput value={dueDate} onChange={setDueDate} placeholder="Due…" /></div>
      <button
        onClick={handleAdd}
        disabled={!title.trim()}
        style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: title.trim() ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', border: 'none', cursor: title.trim() ? 'pointer' : 'default', color: title.trim() ? '#3b82f6' : '#4b5680', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Plus size={14} />
      </button>
    </motion.div>
  )
}

// ── Recurring task auto-create helper ─────────────────────────────────────────

function nextRecurringDate(dueDate: string, recurrence: SmartTask['recurrence']): string | undefined {
  if (!recurrence || recurrence === 'none' || !dueDate) return undefined
  const d = new Date(dueDate)
  if (recurrence === 'daily') d.setDate(d.getDate() + 1)
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7)
  else if (recurrence === 'biweekly') d.setDate(d.getDate() + 14)
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
  return d.toISOString().split('T')[0]
}

// ── Main SmartTodo ─────────────────────────────────────────────────────────────

export function SmartTodo() {
  const {
    smartTasks, addSmartTask, updateSmartTask, removeSmartTask,
    workspace, profile, calendarPosts,
    addAttachmentToSmartTask, removeAttachmentFromSmartTask,
    addTimeEntryToSmartTask,
  } = useStore()

  const [viewMode, setViewMode] = useState<'list' | 'board' | 'timeline' | 'matrix'>('list')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [statusFilter] = useState<TaskStatus | 'all'>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [hideDone, setHideDone] = useState(false)
  const [sorting, setSorting] = useState(false)
  const [openTask, setOpenTask] = useState<SmartTask | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const apiKey = profile?.apiKey

  const projectMap = new Map<string, { name: string; color: string }>(
    workspace.projects.map((p, i) => [p.id, { name: p.name, color: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] }])
  )

  // Stats
  const today = new Date().toDateString()
  const weekAgo = new Date(Date.now() - 7 * 86400000)
  const totalActive = smartTasks.filter(t => t.status !== 'done').length
  const dueToday = smartTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today && t.status !== 'done').length
  const overdueCount = smartTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date(today) && t.status !== 'done').length
  const doneThisWeek = smartTasks.filter(t => t.status === 'done' && t.completedAt && new Date(t.completedAt) >= weekAgo).length

  const filtered = smartTasks
    .filter(t => search ? t.title.toLowerCase().includes(search.toLowerCase()) : true)
    .filter(t => priorityFilter === 'all' ? true : t.priority === priorityFilter)
    .filter(t => statusFilter === 'all' ? true : t.status === statusFilter)
    .filter(t => projectFilter === 'all' ? true : projectFilter === 'unlinked' ? !t.projectId : t.projectId === projectFilter)
    .filter(t => hideDone ? t.status !== 'done' : true)

  // Handle task save with recurring auto-create
  const handleSave = useCallback((id: string, updates: Partial<SmartTask>) => {
    updateSmartTask(id, updates)
    const original = smartTasks.find(t => t.id === id)
    if (!original) return
    const updated = { ...original, ...updates }
    if (updated.status === 'done' && original.status !== 'done' && updated.recurrence && updated.recurrence !== 'none' && updated.dueDate) {
      const nextDate = nextRecurringDate(updated.dueDate, updated.recurrence)
      if (nextDate) {
        const newTask: SmartTask = {
          ...updated,
          id: uid(),
          status: 'todo',
          completedAt: undefined,
          dueDate: nextDate,
          createdAt: new Date().toISOString(),
          timeEntries: [],
          attachments: [],
        }
        addSmartTask(newTask)
        toast.success(`Recurring task created for ${nextDate}`)
      }
    }
  }, [smartTasks, updateSmartTask, addSmartTask])

  const handleSmartSort = useCallback(async () => {
    if (sorting) return
    setSorting(true)
    try {
      const activeTasks = filtered.filter(t => t.status !== 'done')
      if (apiKey) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5',
            max_tokens: 1024,
            messages: [{ role: 'user', content: `Re-prioritize these tasks based on urgency/importance. Return ONLY JSON array [{id, priority}] where priority is urgent|high|medium|low.\n\nTasks:\n${activeTasks.map(t => `id:${t.id} title:"${t.title}" due:${t.dueDate || 'none'} current:${t.priority}`).join('\n')}` }],
          }),
        })
        const data = await res.json()
        const text = data.content?.[0]?.text || ''
        const m = text.match(/\[[\s\S]*\]/)
        if (m) {
          const updates: { id: string; priority: TaskPriority }[] = JSON.parse(m[0])
          updates.forEach(({ id, priority }) => updateSmartTask(id, { priority }))
          toast.success(`AI sorted ${updates.length} tasks`)
        }
      } else {
        // Demo fallback: sort by due date and current priority
        const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
        const sorted = [...activeTasks].sort((a, b) => {
          if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
          if (a.dueDate) return -1
          if (b.dueDate) return 1
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
        sorted.slice(0, 3).forEach(t => updateSmartTask(t.id, { priority: 'high' }))
        toast.success('Demo AI sort applied (add API key for real AI)')
      }
    } catch { toast.error('AI sort failed') }
    finally { setSorting(false) }
  }, [apiKey, filtered, sorting, updateSmartTask])

  // Project task counts for sidebar
  const projectTaskCounts = new Map<string, number>()
  smartTasks.forEach(t => { if (t.projectId) projectTaskCounts.set(t.projectId, (projectTaskCounts.get(t.projectId) || 0) + 1) })
  const unlinkedCount = smartTasks.filter(t => !t.projectId).length

  const statCards = [
    { label: 'Active', value: totalActive, color: '#3b82f6' },
    { label: 'Due Today', value: dueToday, color: '#f97316' },
    { label: 'Overdue', value: overdueCount, color: '#ef4444' },
    { label: 'Done This Week', value: doneThisWeek, color: '#10b981' },
  ]

  const viewModes = [
    { id: 'list' as const, icon: <LayoutList size={14} />, label: 'List' },
    { id: 'board' as const, icon: <Columns size={14} />, label: 'Board' },
    { id: 'timeline' as const, icon: <Clock size={14} />, label: 'Timeline' },
    { id: 'matrix' as const, icon: <Grid size={14} />, label: 'Matrix' },
  ]

  // Sync open task with store updates
  useEffect(() => {
    if (openTask) {
      const updated = smartTasks.find(t => t.id === openTask.id)
      if (updated) setOpenTask(updated)
    }
  }, [smartTasks])

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f4ff', margin: 0, letterSpacing: '-0.03em' }}>Smart Tasks</h1>
          <div style={{ fontSize: 12, color: '#4b5680', marginTop: 2 }}>{smartTasks.length} total tasks across {workspace.projects.length} projects</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 2 }}>
            {viewModes.map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', border: 'none', fontSize: 12, fontWeight: 600, background: viewMode === v.id ? 'rgba(59,130,246,0.15)' : 'transparent', color: viewMode === v.id ? '#3b82f6' : '#6b7a9a', transition: 'all 150ms ease' }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button onClick={handleSmartSort} disabled={sorting} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} />{sorting ? 'Sorting…' : 'AI Sort'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        {statCards.map(card => (
          <div key={card.label} style={{ flex: '1 1 140px', background: '#111122', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: card.color, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: 11, color: '#4b5680', marginTop: 3, fontWeight: 600 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Add — flex-wrap for narrow screens */}
      <QuickAddBar projectMap={projectMap} onAdd={addSmartTask} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 10px', flex: 1, minWidth: 160, maxWidth: 240 }}>
          <Search size={13} style={{ color: '#4b5680', flexShrink: 0 }} />
          <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#f0f4ff', fontSize: 13, outline: 'none', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 0 }}><X size={12} /></button>}
        </div>
        {(['all', 'urgent', 'high', 'medium', 'low'] as (TaskPriority | 'all')[]).map(p => (
          <button key={p} onClick={() => setPriorityFilter(p)} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: priorityFilter === p ? `1.5px solid ${p === 'all' ? '#3b82f680' : PRIORITY_COLORS[p as TaskPriority] + '60'}` : '1px solid rgba(255,255,255,0.07)', background: priorityFilter === p ? `${p === 'all' ? '#3b82f6' : PRIORITY_COLORS[p as TaskPriority]}15` : 'transparent', color: priorityFilter === p ? (p === 'all' ? '#3b82f6' : PRIORITY_COLORS[p as TaskPriority]) : '#6b7a9a', textTransform: 'capitalize' }}>{p === 'all' ? 'All Priority' : p}</button>
        ))}
        <button onClick={() => setHideDone(h => !h)} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: hideDone ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.07)', background: hideDone ? 'rgba(16,185,129,0.12)' : 'transparent', color: hideDone ? '#10b981' : '#6b7a9a' }}>
          {hideDone ? 'Showing active' : 'Hide done'}
        </button>
        <button onClick={() => setSidebarOpen(v => !v)} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: sidebarOpen ? '1.5px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.07)', background: sidebarOpen ? 'rgba(59,130,246,0.1)' : 'transparent', color: sidebarOpen ? '#3b82f6' : '#6b7a9a', display: 'flex', alignItems: 'center', gap: 5 }}>
          <FolderKanban size={12} /> Projects
        </button>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: 20, overflow: 'hidden' }}>
        {/* Project sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 190, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ flexShrink: 0, overflow: 'hidden' }}
            >
              <div style={{ width: 190 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#2a3050', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Filter by Project</div>
                {[
                  { id: 'all', name: 'All Tasks', count: smartTasks.length, color: '#3b82f6' },
                  { id: 'unlinked', name: 'Unlinked', count: unlinkedCount, color: '#6b7a9a' },
                  ...workspace.projects.map((p, i) => ({ id: p.id, name: p.name, count: projectTaskCounts.get(p.id) || 0, color: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] })),
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setProjectFilter(item.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: projectFilter === item.id ? 'rgba(59,130,246,0.1)' : 'transparent', marginBottom: 2, textAlign: 'left', transition: 'background 100ms' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: projectFilter === item.id ? '#f0f4ff' : '#6b7a9a' }}>{item.name}</span>
                    <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{item.count}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={viewMode} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}>
              {viewMode === 'list' && <ListView tasks={filtered} projectMap={projectMap} onUpdate={updateSmartTask} onRemove={removeSmartTask} onOpen={setOpenTask} />}
              {viewMode === 'board' && (
                <BoardView tasks={filtered} projectMap={projectMap} onUpdate={updateSmartTask} onRemove={removeSmartTask} onOpen={setOpenTask} onAdd={addSmartTask} />
              )}
              {viewMode === 'timeline' && <TimelineView tasks={filtered} projectMap={projectMap} onUpdate={updateSmartTask} onRemove={removeSmartTask} onOpen={setOpenTask} />}
              {viewMode === 'matrix' && <MatrixView tasks={filtered} onOpen={setOpenTask} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
            style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111122', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 60, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{selectedIds.size} selected</span>
            <button onClick={() => { selectedIds.forEach(id => updateSmartTask(id, { status: 'done', completedAt: new Date().toISOString() })); setSelectedIds(new Set()); toast.success('Marked done') }} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><CheckCircle2 size={13} />Mark Done</button>
            <button onClick={() => { selectedIds.forEach(id => removeSmartTask(id)); setSelectedIds(new Set()); toast.success('Tasks deleted') }} style={{ padding: '5px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}><Trash2 size={12} />Delete</button>
            <button onClick={() => setSelectedIds(new Set())} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Drawer */}
      <AnimatePresence>
        {openTask && (
          <TaskDetailDrawer
            task={openTask}
            projectMap={projectMap}
            allTasks={smartTasks}
            calendarPosts={calendarPosts}
            onSave={(id, u) => { handleSave(id, u); setOpenTask(null) }}
            onRemove={(id) => { removeSmartTask(id); setOpenTask(null) }}
            onClose={() => setOpenTask(null)}
            apiKey={apiKey}
            onAddAttachment={addAttachmentToSmartTask}
            onRemoveAttachment={removeAttachmentFromSmartTask}
            onAddTimeEntry={addTimeEntryToSmartTask}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
