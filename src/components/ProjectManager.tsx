import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { getResolvedAIKey } from '../utils/aiKey'
import type {
  Project, ProjectTask, Milestone, Risk, ActivityLog,
  TeamMember, ProjectType, ProjectStatus, TaskStatus, TaskPriority,
  MilestoneStatus, RiskStatus, TaskComment, SmartTask,
  FileAttachment, TimeEntry, TaskDependency, ProjectTemplateId,
} from '../types'
import {
  FolderKanban, Plus, X, Users, CheckSquare,
  User, Calendar, Trash2, ChevronDown,
  Flag, AlertTriangle, Bell, ArrowLeft, Edit2, Check,
  Zap, Clock, TrendingUp, DollarSign,
  Activity, Grid, List, Tag, MessageSquare, ChevronUp,
  BarChart2, Target, Briefcase, Paperclip, Image, FileText, Video,
  Download, Link, Play, Square, LayoutGrid,
  RefreshCw, Upload, Star, Timer,
  AlertCircle, Wand2,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ────────────────────────────────────────────────────────────────

const PROJECT_COLORS = ['#3b82f6', '#ec4899', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#22d3ee']

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#f59e0b',
  active: '#10b981',
  'on-hold': '#f97316',
  completed: '#3b82f6',
  cancelled: '#6b7a9a',
}

const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#6b7a9a',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  done: '#10b981',
  blocked: '#ef4444',
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
}

const MILESTONE_STATUS_COLORS: Record<MilestoneStatus, string> = {
  upcoming: '#f59e0b',
  'in-progress': '#3b82f6',
  completed: '#10b981',
  delayed: '#ef4444',
}

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 28 }
const PAGE = { duration: 0.15 }

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string { return Math.random().toString(36).slice(2, 10) }
function getInitials(name: string): string { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }
function daysFromNow(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}
function fmtDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}
function fmtShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}
function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return fmtDate(ts)
}
function smartDateLabel(dateStr: string): string {
  const days = daysFromNow(dateStr)
  if (days === null) return ''
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 0) return `${days} days away`
  return `Overdue by ${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''}`
}
function fmtYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ── parseSmartDate ────────────────────────────────────────────────────────────

function parseSmartDate(input: string): string | null {
  const s = input.trim().toLowerCase()
  const now = new Date()
  if (s === 'today' || s === 'eod') return fmtYMD(now)
  if (s === 'tomorrow') { const d = new Date(now); d.setDate(d.getDate() + 1); return fmtYMD(d) }
  if (s === 'yesterday') { const d = new Date(now); d.setDate(d.getDate() - 1); return fmtYMD(d) }
  if (s === 'next week') { const d = new Date(now); d.setDate(d.getDate() + 7); return fmtYMD(d) }
  if (s === 'eow') {
    const d = new Date(now); const dow = d.getDay()
    const toFri = (5 - dow + 7) % 7 || 7; d.setDate(d.getDate() + toFri); return fmtYMD(d)
  }
  const quarters: Record<string, [number, number]> = { q1: [2, 31], q2: [5, 30], q3: [8, 30], q4: [11, 31] }
  if (quarters[s]) { const [mo, dy] = quarters[s]; return fmtYMD(new Date(now.getFullYear(), mo, dy)) }
  const inMatch = s.match(/^in (\d+) (day|days|week|weeks|month|months)$/)
  if (inMatch) {
    const n = parseInt(inMatch[1]); const unit = inMatch[2]; const d = new Date(now)
    if (unit.startsWith('day')) d.setDate(d.getDate() + n)
    else if (unit.startsWith('week')) d.setDate(d.getDate() + n * 7)
    else d.setMonth(d.getMonth() + n)
    return fmtYMD(d)
  }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  const nextMatch = s.match(/^next (sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/)
  if (nextMatch) {
    const target = days.indexOf(nextMatch[1]); const d = new Date(now)
    const cur = d.getDay(); const diff = (target - cur + 7) % 7 || 7
    d.setDate(d.getDate() + diff); return fmtYMD(d)
  }
  const parsed = new Date(input)
  if (!isNaN(parsed.getTime())) return fmtYMD(parsed)
  return null
}

// ── SmartDateInput ────────────────────────────────────────────────────────────

const DATE_CHIPS = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: 'In 3 days', value: 'in 3 days' },
  { label: 'Next week', value: 'next week' },
  { label: 'In 2 weeks', value: 'in 2 weeks' },
  { label: 'Next month', value: 'in 1 months' },
]

function SmartDateInput({ value, onChange, placeholder = 'e.g. next monday, in 3 days' }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(value)
  const label = value ? smartDateLabel(value) : ''
  const labelColor = value && (daysFromNow(value) ?? 0) < 0 ? '#ef4444' : '#10b981'
  useEffect(() => { setText(value) }, [value])
  function handleBlur() {
    setFocused(false)
    const parsed = parseSmartDate(text)
    if (parsed) { onChange(parsed); setText(parsed) }
    else if (text === '') onChange('')
  }
  function handleChip(chipValue: string) {
    const parsed = parseSmartDate(chipValue)
    if (parsed) { onChange(parsed); setText(parsed) }
    setFocused(false)
  }
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input className="field" style={{ flex: 1 }} value={text} placeholder={placeholder}
          onChange={e => setText(e.target.value)} onFocus={() => setFocused(true)} onBlur={handleBlur} />
        {label && <span style={{ fontSize: 11, color: labelColor, whiteSpace: 'nowrap', fontWeight: 600 }}>{label}</span>}
      </div>
      <AnimatePresence>
        {focused && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={SPRING}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginTop: 4 }}>
            {DATE_CHIPS.map(chip => (
              <button key={chip.value} type="button" onMouseDown={e => { e.preventDefault(); handleChip(chip.value) }}
                className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '4px 10px' }}>{chip.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 28, color = '#3b82f6' }: { name: string; size?: number; color?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}22`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  )
}

// ── AI Button ─────────────────────────────────────────────────────────────────

function AIButton({ prompt, onResult, disabled = false }: {
  prompt: string; onResult: (text: string) => void; disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const apiKey = getResolvedAIKey()
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
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        const data = await res.json()
        const text = data.content?.[0]?.text ?? ''
        if (text) onResult(text)
        else toast.error('AI returned empty response')
      } else {
        // Demo fallback
        await new Promise(r => setTimeout(r, 800))
        onResult(`This is a demo AI response. Add your Claude API key in Settings to get real AI-generated content for: "${prompt.slice(0, 60)}..."`)
      }
    } catch {
      toast.error('AI request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={disabled || loading}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: loading || disabled ? 'not-allowed' : 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6', transition: 'all 150ms', opacity: disabled ? 0.5 : 1 }}>
      {loading ? <div style={{ width: 10, height: 10, border: '1.5px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Zap size={10} />}
      AI
    </button>
  )
}

// ── ReminderModal ─────────────────────────────────────────────────────────────

function ReminderModal({ task, onClose, onSet }: { task: ProjectTask; onClose: () => void; onSet: (ms: number, label: string) => void }) {
  const OPTIONS = [{ label: '1 hour', ms: 3600000 }, { label: '4 hours', ms: 14400000 }, { label: '1 day', ms: 86400000 }, { label: '2 days', ms: 172800000 }]
  const [custom, setCustom] = useState('')
  const [customUnit, setCustomUnit] = useState<'minutes' | 'hours' | 'days'>('hours')
  function handleCustom() {
    const n = parseInt(custom); if (!n || n <= 0) return
    const mult = customUnit === 'minutes' ? 60000 : customUnit === 'hours' ? 3600000 : 86400000
    onSet(n * mult, `${n} ${customUnit}`)
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }} transition={SPRING}
        className="card" style={{ width: 360, padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Bell size={16} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: 15 }}>Set Reminder</span>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={onClose}><X size={14} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>"{task.title}"</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {OPTIONS.map(opt => (
            <button key={opt.ms} className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => onSet(opt.ms, opt.label)}>
              <Clock size={13} /> {opt.label}
            </button>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(59,130,246,0.12)', paddingTop: 14 }}>
          <p className="sec-label" style={{ marginBottom: 8 }}>Custom</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="field" style={{ flex: 1 }} type="number" min={1} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Amount" />
            <select className="field" style={{ width: 100 }} value={customUnit} onChange={e => setCustomUnit(e.target.value as 'minutes' | 'hours' | 'days')}>
              <option value="minutes">mins</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
            <button className="btn btn-blue btn-sm" onClick={handleCustom}>Set</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── buildActivity ─────────────────────────────────────────────────────────────

function buildActivity(actorName: string, action: string, entityType: ActivityLog['entityType'], entityTitle: string): ActivityLog {
  return { id: uid(), actorName, action, entityType, entityTitle, timestamp: new Date().toISOString() }
}

// ── Risk helpers ──────────────────────────────────────────────────────────────

function riskScore(r: Risk): number { return r.probability * r.impact }
function riskLevel(score: number): { label: string; color: string } {
  if (score <= 4) return { label: 'Low', color: '#10b981' }
  if (score <= 9) return { label: 'Medium', color: '#f59e0b' }
  if (score <= 15) return { label: 'High', color: '#f97316' }
  return { label: 'Critical', color: '#ef4444' }
}

// ── Health Score ──────────────────────────────────────────────────────────────

function computeHealthScore(project: Project): number {
  const tasks = project.tasks ?? []; const risks = project.risks ?? []; const milestones = project.milestones ?? []
  const now = Date.now()
  const totalTasks = tasks.length
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const taskScore = totalTasks > 0 ? (doneTasks / totalTasks) * 40 : 40
  const overdueTasks = tasks.filter(t => t.eta && new Date(t.eta).getTime() < now && t.status !== 'done').length
  const overdueScore = overdueTasks === 0 ? 20 : Math.max(0, 20 - overdueTasks * 4)
  const criticalRisks = risks.filter(r => riskScore(r) >= 16 && r.status === 'open').length
  const riskHealthScore = criticalRisks === 0 ? 20 : Math.max(0, 20 - criticalRisks * 5)
  const delayedMilestones = milestones.filter(m => m.status === 'delayed').length
  const msScore = milestones.length === 0 ? 10 : delayedMilestones === 0 ? 10 : Math.max(0, 10 - delayedMilestones * 3)
  let budgetScore = 10
  if (project.budget && project.spentBudget) {
    const ratio = project.spentBudget / project.budget
    budgetScore = ratio <= 1 ? 10 : Math.max(0, 10 - (ratio - 1) * 20)
  }
  return Math.round(taskScore + overdueScore + riskHealthScore + msScore + budgetScore)
}

function healthLabel(score: number): { label: string; color: string } {
  if (score <= 40) return { label: 'At Risk', color: '#ef4444' }
  if (score <= 70) return { label: 'Needs Attention', color: '#f59e0b' }
  if (score <= 90) return { label: 'On Track', color: '#3b82f6' }
  return { label: 'Excellent', color: '#10b981' }
}

// ── ProgressRing ──────────────────────────────────────────────────────────────

function ProgressRing({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2; const circ = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (pct / 100) * circ }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </svg>
      <span style={{ fontSize: size * 0.22, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{pct}%</span>
    </div>
  )
}

function HealthRing({ score, size = 120 }: { score: number; size?: number }) {
  const { label, color } = healthLabel(score)
  const r = (size - 14) / 2; const circ = 2 * Math.PI * r; const progress = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth={7} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - progress }}
          transition={{ duration: 1, ease: 'easeOut' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: size * 0.24, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{score}</div>
        <div style={{ fontSize: size * 0.1, color, fontWeight: 700, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ── ENTITY ICONS / COLORS ────────────────────────────────────────────────────

const ENTITY_ICONS: Record<ActivityLog['entityType'], React.ReactNode> = {
  task: <CheckSquare size={14} />, milestone: <Flag size={14} />, risk: <AlertTriangle size={14} />,
  project: <FolderKanban size={14} />, member: <User size={14} />,
}
const ENTITY_COLORS: Record<ActivityLog['entityType'], string> = {
  task: '#3b82f6', milestone: '#f59e0b', risk: '#ef4444', project: '#8b5cf6', member: '#10b981',
}

// ── FILE ATTACHMENTS PANEL ────────────────────────────────────────────────────

function FileAttachmentsPanel({ taskId: _taskId, attachments, onAdd, onRemove }: {
  taskId: string
  attachments: FileAttachment[]
  onAdd: (att: FileAttachment) => void
  onRemove: (attId: string) => void
}) {
  const { profile } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function getMimeIcon(type: string) {
    if (type.startsWith('image/')) return <Image size={16} color="#3b82f6" />
    if (type === 'application/pdf' || type.includes('pdf')) return <FileText size={16} color="#ef4444" />
    if (type.startsWith('video/')) return <Video size={16} color="#8b5cf6" />
    return <Paperclip size={16} color="#94a3b8" />
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    if (attachments.length + files.length > 10) { toast.error('Maximum 10 attachments per task'); return }
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} exceeds 5MB limit`); return }
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const att: FileAttachment = {
          id: uid(), name: file.name, size: file.size, type: file.type,
          dataUrl, uploadedAt: new Date().toISOString(), uploadedBy: profile?.name ?? 'You',
        }
        onAdd(att)
        toast.success(`${file.name} attached`)
      }
      reader.readAsDataURL(file)
    })
  }

  function handleDownload(att: FileAttachment) {
    const a = document.createElement('a')
    a.href = att.dataUrl; a.download = att.name; a.click()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="sec-label" style={{ margin: 0 }}>Attachments ({attachments.length}/10)</p>
        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => fileInputRef.current?.click()}>
          <Upload size={12} /> Attach File
        </button>
        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
      </div>
      {attachments.length === 0 && (
        <p style={{ fontSize: 12, color: '#4b5680', textAlign: 'center', padding: '12px 0' }}>No attachments yet.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {attachments.map(att => (
          <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0d0d1a', borderRadius: 8, border: '1px solid rgba(59,130,246,0.1)' }}>
            {att.type.startsWith('image/') ? (
              <img src={att.dataUrl} alt={att.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {getMimeIcon(att.type)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
              <p style={{ fontSize: 11, color: '#4b5680' }}>{fmtFileSize(att.size)} · {timeAgo(att.uploadedAt)}</p>
            </div>
            <button onClick={() => handleDownload(att)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: 6 }} title="Download">
              <Download size={13} />
            </button>
            <button onClick={() => onRemove(att.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 6 }} title="Delete">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TIME TRACKING PANEL ───────────────────────────────────────────────────────

function TimeTrackingPanel({ task, onLogTime }: {
  task: ProjectTask
  onLogTime: (entry: TimeEntry) => void
}) {
  const { profile } = useStore()
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [note, setNote] = useState('')
  const [timerActive, setTimerActive] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [timerActive])

  function formatTimer(secs: number): string {
    const m = Math.floor(secs / 60); const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  function handleLog() {
    const totalMins = hours * 60 + minutes
    if (totalMins <= 0) { toast.error('Enter at least 1 minute'); return }
    onLogTime({ id: uid(), taskId: task.id, durationMinutes: totalMins, note: note || undefined, loggedAt: new Date().toISOString(), loggedBy: profile?.name ?? 'You' })
    setHours(0); setMinutes(0); setNote('')
    toast.success(`Logged ${fmtMinutes(totalMins)}`)
  }

  function handleStopAndLog() {
    setTimerActive(false)
    const totalMins = Math.ceil(timerSeconds / 60)
    if (totalMins > 0) {
      onLogTime({ id: uid(), taskId: task.id, durationMinutes: totalMins, note: 'Timer session', loggedAt: new Date().toISOString(), loggedBy: profile?.name ?? 'You' })
      toast.success(`Logged ${fmtMinutes(totalMins)} from timer`)
    }
    setTimerSeconds(0)
  }

  const entries = task.timeEntries ?? []
  const totalLogged = entries.reduce((sum, e) => sum + e.durationMinutes, 0)
  const estimated = (task.estimatedHours ?? 0) * 60
  const loggedPct = estimated > 0 ? Math.min(100, Math.round((totalLogged / estimated) * 100)) : 0

  return (
    <div>
      <p className="sec-label" style={{ marginBottom: 10 }}>Time Tracking</p>
      {estimated > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'Space Mono', monospace" }}>
              {fmtMinutes(totalLogged)} / {fmtMinutes(estimated)} logged
            </span>
            <span style={{ fontSize: 11, color: loggedPct > 100 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{loggedPct}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(59,130,246,0.1)', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div animate={{ width: `${Math.min(100, loggedPct)}%` }} transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ height: '100%', background: loggedPct > 100 ? '#ef4444' : '#10b981', borderRadius: 4 }} />
          </div>
        </div>
      )}

      {/* Timer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', background: timerActive ? 'rgba(16,185,129,0.08)' : 'rgba(59,130,246,0.06)', borderRadius: 8, border: `1px solid ${timerActive ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.12)'}` }}>
        <Timer size={14} color={timerActive ? '#10b981' : '#94a3b8'} />
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 18, fontWeight: 700, color: timerActive ? '#10b981' : '#94a3b8', flex: 1 }}>
          {formatTimer(timerSeconds)}
        </span>
        {!timerActive ? (
          <button className="btn btn-sm" onClick={() => setTimerActive(true)}
            style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: 11 }}>
            <Play size={11} /> Start Timer
          </button>
        ) : (
          <button className="btn btn-sm" onClick={handleStopAndLog}
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: 11 }}>
            <Square size={11} /> Stop &amp; Log
          </button>
        )}
      </div>

      {/* Manual log */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr auto', gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, marginBottom: 4 }}>HOURS</p>
          <input className="field" type="number" min={0} max={99} step={0.5} value={hours}
            onChange={e => setHours(parseFloat(e.target.value) || 0)} style={{ padding: '8px 10px', textAlign: 'center' }} />
        </div>
        <div>
          <p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, marginBottom: 4 }}>MINS</p>
          <input className="field" type="number" min={0} max={59} step={5} value={minutes}
            onChange={e => setMinutes(parseInt(e.target.value) || 0)} style={{ padding: '8px 10px', textAlign: 'center' }} />
        </div>
        <div>
          <p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, marginBottom: 4 }}>NOTE</p>
          <input className="field" value={note} onChange={e => setNote(e.target.value)} placeholder="Optional…" style={{ padding: '8px 10px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-blue btn-sm" onClick={handleLog}>Log</button>
        </div>
      </div>

      {/* History */}
      {entries.length > 0 && (
        <div style={{ maxHeight: 160, overflowY: 'auto' }}>
          {[...entries].reverse().map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(59,130,246,0.07)' }}>
              <Clock size={11} color="#4b5680" />
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{fmtMinutes(e.durationMinutes)}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{e.note ?? '—'}</span>
              <span style={{ fontSize: 10, color: '#4b5680' }}>{timeAgo(e.loggedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── DEPENDENCIES PANEL ────────────────────────────────────────────────────────

function DependenciesPanel({ task, allTasks, onAdd, onRemove }: {
  task: ProjectTask
  allTasks: ProjectTask[]
  onAdd: (dep: TaskDependency) => void
  onRemove: (depId: string) => void
}) {
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [depType, setDepType] = useState<'blocks' | 'blocked-by' | 'relates-to'>('blocked-by')
  const deps = task.dependencies ?? []
  const otherTasks = allTasks.filter(t => t.id !== task.id)

  const blockedByUnfinished = deps
    .filter(d => d.type === 'blocked-by')
    .map(d => allTasks.find(t => t.id === d.toTaskId))
    .filter((t): t is ProjectTask => !!t && t.status !== 'done')

  function handleAdd() {
    if (!selectedTaskId) return
    const dep: TaskDependency = { id: uid(), fromTaskId: task.id, toTaskId: selectedTaskId, type: depType }
    onAdd(dep)
    setSelectedTaskId('')
  }

  const DEP_COLORS: Record<string, string> = { 'blocks': '#f97316', 'blocked-by': '#ef4444', 'relates-to': '#3b82f6' }

  return (
    <div>
      <p className="sec-label" style={{ marginBottom: 10 }}>Dependencies</p>

      {blockedByUnfinished.length > 0 && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} color="#f59e0b" />
          <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>
            Blocked by: {blockedByUnfinished.map(t => t.title).join(', ')}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select className="field" style={{ flex: 1 }} value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
          <option value="">Select task…</option>
          {otherTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <select className="field" style={{ width: 120 }} value={depType} onChange={e => setDepType(e.target.value as typeof depType)}>
          <option value="blocked-by">blocked by</option>
          <option value="blocks">blocks</option>
          <option value="relates-to">relates to</option>
        </select>
        <button className="btn btn-blue btn-sm" onClick={handleAdd} disabled={!selectedTaskId}>Add</button>
      </div>

      {deps.length === 0 && <p style={{ fontSize: 12, color: '#4b5680' }}>No dependencies set.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deps.map(dep => {
          const linked = allTasks.find(t => t.id === dep.toTaskId)
          const color = DEP_COLORS[dep.type] ?? '#94a3b8'
          return (
            <div key={dep.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: `${color}0d`, borderRadius: 6, border: `1px solid ${color}22` }}>
              <Link size={11} color={color} />
              <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'capitalize', flexShrink: 0 }}>{dep.type.replace('-', ' ')}</span>
              <span style={{ fontSize: 12.5, flex: 1, color: '#f0f4ff' }}>{linked?.title ?? 'Unknown task'}</span>
              <button onClick={() => onRemove(dep.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 2 }}>
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TASK DETAIL DRAWER ────────────────────────────────────────────────────────

function TaskDetailDrawer({ task, project, members, onClose, onSaved, onDeleted }: {
  task: ProjectTask; project: Project; members: TeamMember[]
  onClose: () => void; onSaved: (updated: ProjectTask) => void; onDeleted: (id: string) => void
}) {
  const { profile, updateProjectTask, removeProjectTask, addActivityLog, addAttachmentToProjectTask, removeAttachmentFromProjectTask, addTimeEntryToProjectTask, addProjectTask } = useStore()
  const actorName = profile?.name ?? 'You'
  const [draft, setDraft] = useState<ProjectTask>({ ...task })
  const [checkInput, setCheckInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [reminderOpen, setReminderOpen] = useState(false)
  const [aiBreaking, setAiBreaking] = useState(false)
  const [meetLoading, setMeetLoading] = useState(false)

  // Sync draft when task prop changes (store update)
  useEffect(() => { setDraft({ ...task }) }, [task.id])

  function patch(u: Partial<ProjectTask>) { setDraft(d => ({ ...d, ...u })) }

  function handleSave() {
    const now = new Date().toISOString()
    const completedAt = draft.status === 'done' && !draft.completedAt ? now : draft.completedAt
    const final = { ...draft, completedAt }
    updateProjectTask(task.id, final)
    addActivityLog(project.id, buildActivity(actorName, 'updated task', 'task', draft.title))
    toast.success('Task saved')
    onSaved(final)
    onClose()
  }

  function handleDelete() {
    removeProjectTask(task.id)
    addActivityLog(project.id, buildActivity(actorName, 'deleted task', 'task', task.title))
    toast.success('Task deleted')
    onDeleted(task.id)
    onClose()
  }

  function addChecklist() {
    if (!checkInput.trim()) return
    patch({ checklist: [...(draft.checklist ?? []), { id: uid(), title: checkInput.trim(), done: false }] })
    setCheckInput('')
  }

  function addComment() {
    if (!commentBody.trim()) return
    const comment: TaskComment = { id: uid(), authorName: actorName, body: commentBody.trim(), createdAt: new Date().toISOString() }
    patch({ comments: [...(draft.comments ?? []), comment] })
    setCommentBody('')
  }

  function scheduleGMeet() {
    setMeetLoading(true)
    const title = encodeURIComponent(`Review: ${draft.title} — ${project.name}`)
    const now = new Date()
    const start = new Date(now.getTime() + 86400000) // tomorrow
    const end = new Date(start.getTime() + 3600000) // 1 hour
    const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&add=meet`
    window.open(url, '_blank')
    patch({ description: (draft.description ? draft.description + '\n' : '') + `[Google Meet scheduled: ${new Date().toLocaleDateString()}]` })
    setTimeout(() => setMeetLoading(false), 500)
    toast.success('Google Calendar opened — add Meet link')
  }

  async function handleAIBreakdown() {
    const apiKey = getResolvedAIKey()
    if (!apiKey) { toast.error('Add your Claude API key in Settings'); return }
    setAiBreaking(true)
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
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `Break down this project task into 5-7 specific actionable subtasks. Return ONLY a JSON array of objects with "title" and "estimatedHours" (number) fields. Task: "${draft.title}". Context: ${draft.description || project.name}`,
          }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '[]'
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON')
      const subtasks: { title: string; estimatedHours: number }[] = JSON.parse(jsonMatch[0])
      subtasks.forEach((sub) => {
        const subtask: ProjectTask = {
          id: uid(), projectId: project.id, title: sub.title,
          status: 'todo', priority: draft.priority,
          estimatedHours: sub.estimatedHours,
          milestoneId: draft.milestoneId,
          tags: [...draft.tags], checklist: [], comments: [],
          createdAt: new Date().toISOString(),
        }
        addProjectTask(subtask)
      })
      toast.success(`Created ${subtasks.length} subtasks from AI breakdown!`)
    } catch {
      toast.error('AI breakdown failed — check your API key')
    }
    setAiBreaking(false)
  }

  function scheduleReminder(ms: number, label: string) {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        setTimeout(() => { new Notification(`Reminder: ${task.title}`, { body: 'This task needs attention.' }); updateProjectTask(task.id, { reminderSent: true }) }, ms)
        toast.success(`Reminder set for "${task.title}" in ${label}`)
      } else {
        toast(`Reminder saved — in-app on return`, { icon: '🔔' })
      }
    })
    setReminderOpen(false)
  }

  const checklistDone = draft.checklist?.filter(c => c.done).length ?? 0
  const checklistTotal = draft.checklist?.length ?? 0
  const checkPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0
  const statusOptions: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked']
  const priorityOptions: TaskPriority[] = ['urgent', 'high', 'medium', 'low']

  const blockedBy = (draft.dependencies ?? [])
    .filter(d => d.type === 'blocked-by')
    .map(d => (project.tasks ?? []).find(t => t.id === d.toTaskId))
    .filter((t): t is ProjectTask => !!t && t.status !== 'done')

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.5)', zIndex: 90 }} onClick={onClose} />
      <motion.div initial={{ x: 540 }} animate={{ x: 0 }} exit={{ x: 540 }} transition={SPRING}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, background: '#0d0d1a', borderLeft: '1px solid rgba(59,130,246,0.15)', zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Blocked banner */}
        {blockedBy.length > 0 && (
          <div style={{ padding: '10px 24px', background: 'rgba(245,158,11,0.1)', borderBottom: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={13} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>Blocked by: {blockedBy.map(t => t.title).join(', ')}</span>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <input className="field" style={{ fontSize: 20, fontWeight: 700, background: 'transparent', border: 'none', padding: '4px 0', width: '100%' }}
              value={draft.title} onChange={e => patch({ title: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}
              onClick={scheduleGMeet}
              title="Schedule Google Meet"
              disabled={meetLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19.5 5.5L17.5 3.5L5.5 3.5C4.4 3.5 3.5 4.4 3.5 5.5L3.5 18.5C3.5 19.6 4.4 20.5 5.5 20.5L18.5 20.5C19.6 20.5 20.5 19.6 20.5 18.5L20.5 6.5L19.5 5.5Z" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M15 12L9 12M9 12L12 9M9 12L12 15" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Meet
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} onClick={() => setReminderOpen(true)} title="Set reminder">
              <Bell size={15} color={draft.reminderSent ? '#f59e0b' : undefined} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '6px 8px' }} onClick={onClose}><X size={15} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '16px 24px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Status</p>
              <select className="field" value={draft.status} onChange={e => patch({ status: e.target.value as TaskStatus })}>
                {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}
              </select>
            </div>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Priority</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {priorityOptions.map(p => (
                  <button key={p} onClick={() => patch({ priority: p })}
                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${PRIORITY_COLORS[p]}`, background: draft.priority === p ? `${PRIORITY_COLORS[p]}22` : 'transparent', color: PRIORITY_COLORS[p], transition: 'all 150ms' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Owner */}
          <div>
            <p className="sec-label" style={{ marginBottom: 6 }}>Owner</p>
            <select className="field" value={draft.ownerId ?? ''} onChange={e => patch({ ownerId: e.target.value || undefined })}>
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Start Date</p>
              <SmartDateInput value={draft.startDate ?? ''} onChange={v => patch({ startDate: v || undefined })} />
            </div>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>ETA / Due Date</p>
              <SmartDateInput value={draft.eta ?? ''} onChange={v => patch({ eta: v || undefined })} />
            </div>
          </div>

          {/* Milestone + Story Points + Est. Hours */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', gap: 12 }}>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Milestone</p>
              <select className="field" value={draft.milestoneId ?? ''} onChange={e => patch({ milestoneId: e.target.value || undefined })}>
                <option value="">None</option>
                {project.milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Points</p>
              <input className="field" type="number" min={0} value={draft.storyPoints ?? ''} onChange={e => patch({ storyPoints: parseInt(e.target.value) || undefined })} placeholder="0" style={{ padding: '10px 8px', textAlign: 'center' }} />
            </div>
            <div>
              <p className="sec-label" style={{ marginBottom: 6 }}>Est. Hrs</p>
              <input className="field" type="number" min={0} step={0.5} value={draft.estimatedHours ?? ''} onChange={e => patch({ estimatedHours: parseFloat(e.target.value) || undefined })} placeholder="0" style={{ padding: '10px 8px', textAlign: 'center' }} />
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p className="sec-label" style={{ margin: 0 }}>Description / Notes</p>
              <AIButton
                prompt={`Write a clear, professional task description for: ${draft.title}. Project context: ${project.name}. Keep it 2-3 sentences, actionable.`}
                onResult={text => patch({ description: text })}
              />
            </div>
            <textarea className="field" rows={4} value={draft.description ?? ''}
              onChange={e => patch({ description: e.target.value || undefined })}
              placeholder="Add details, context, links…" style={{ resize: 'vertical', lineHeight: 1.6 }} />
          </div>

          {/* Checklist */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p className="sec-label" style={{ margin: 0 }}>Checklist</p>
              {checklistTotal > 0 && (
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Space Mono', monospace" }}>{checklistDone}/{checklistTotal}</span>
              )}
            </div>
            {checklistTotal > 0 && (
              <div style={{ height: 4, background: 'rgba(59,130,246,0.1)', borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                <motion.div animate={{ width: `${checkPct}%` }} transition={SPRING}
                  style={{ height: '100%', background: '#10b981', borderRadius: 4 }} />
              </div>
            )}
            {draft.checklist?.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
                <button onClick={() => patch({ checklist: draft.checklist?.map(c => c.id === item.id ? { ...c, done: !c.done } : c) })}
                  style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${item.done ? '#10b981' : 'rgba(59,130,246,0.3)'}`, background: item.done ? '#10b98122' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item.done && <Check size={11} color="#10b981" />}
                </button>
                <span style={{ flex: 1, fontSize: 13, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#4b5680' : '#f0f4ff' }}>{item.title}</span>
                <button onClick={() => patch({ checklist: draft.checklist?.filter(c => c.id !== item.id) })}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 2 }}><X size={12} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="field" style={{ flex: 1 }} value={checkInput} onChange={e => setCheckInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addChecklist()} placeholder="Add checklist item…" />
              <button className="btn btn-ghost btn-sm" onClick={addChecklist}><Plus size={14} /></button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="sec-label" style={{ marginBottom: 8 }}>Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {draft.tags.map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, fontSize: 11, color: '#8b5cf6', fontWeight: 600 }}>
                  {tag}
                  <button onClick={() => patch({ tags: draft.tags.filter(t => t !== tag) })}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8b5cf6', padding: 0, lineHeight: 1 }}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="field" style={{ flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { if (!tagInput.trim()) return; if (!draft.tags.includes(tagInput.trim())) patch({ tags: [...draft.tags, tagInput.trim()] }); setTagInput('') } }}
                placeholder="Add tag…" />
              <button className="btn btn-ghost btn-sm" onClick={() => { if (!tagInput.trim()) return; if (!draft.tags.includes(tagInput.trim())) patch({ tags: [...draft.tags, tagInput.trim()] }); setTagInput('') }}><Tag size={14} /></button>
            </div>
          </div>

          {/* Time Tracking */}
          <TimeTrackingPanel task={draft} onLogTime={entry => {
            addTimeEntryToProjectTask(task.id, entry)
            patch({ timeEntries: [...(draft.timeEntries ?? []), entry] })
          }} />

          {/* Dependencies */}
          <DependenciesPanel task={draft} allTasks={project.tasks ?? []}
            onAdd={dep => patch({ dependencies: [...(draft.dependencies ?? []), dep] })}
            onRemove={depId => patch({ dependencies: draft.dependencies?.filter(d => d.id !== depId) })} />

          {/* Attachments */}
          <FileAttachmentsPanel taskId={task.id} attachments={draft.attachments ?? []}
            onAdd={att => { addAttachmentToProjectTask(task.id, att); patch({ attachments: [...(draft.attachments ?? []), att] }) }}
            onRemove={attId => { removeAttachmentFromProjectTask(task.id, attId); patch({ attachments: draft.attachments?.filter(a => a.id !== attId) }) }} />

          {/* Comments */}
          <div>
            <p className="sec-label" style={{ marginBottom: 8 }}>Comments</p>
            {(draft.comments ?? []).length === 0 && <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 10 }}>No comments yet.</p>}
            {draft.comments?.map(c => (
              <div key={c.id} style={{ padding: '10px 12px', background: '#111122', borderRadius: 8, marginBottom: 8, border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Avatar name={c.authorName} size={22} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.authorName}</span>
                  <span style={{ fontSize: 11, color: '#4b5680', marginLeft: 'auto' }}>{timeAgo(c.createdAt)}</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#94a3b8', lineHeight: 1.6, paddingLeft: 30 }}>{c.body}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <textarea className="field" rows={2} value={commentBody} onChange={e => setCommentBody(e.target.value)}
                placeholder="Write a comment…" style={{ flex: 1, resize: 'none' }} />
              <button className="btn btn-blue btn-sm" style={{ alignSelf: 'flex-end' }} onClick={addComment}><MessageSquare size={13} /></button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'sticky', bottom: 0, padding: '16px 24px', background: '#0d0d1a', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-pink btn-sm"
            onClick={handleAIBreakdown}
            disabled={aiBreaking}
            style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
          >
            {aiBreaking ? (
              <><div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Breaking down…</>
            ) : (
              <><Wand2 size={13} />AI Task Breakdown — auto-create subtasks</>
            )}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-blue" style={{ flex: 1 }} onClick={handleSave}><Check size={14} /> Save Task</button>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button onClick={handleDelete} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', transition: 'all 150ms', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {reminderOpen && <ReminderModal task={task} onClose={() => setReminderOpen(false)} onSet={scheduleReminder} />}
      </AnimatePresence>
    </>
  )
}

// ── PROJECT TEMPLATES ─────────────────────────────────────────────────────────

interface TemplateDefinition {
  id: ProjectTemplateId
  name: string
  description: string
  icon: React.ReactNode
  color: string
  milestones: { title: string; daysFromStart: number }[]
  tasks: { title: string; status: TaskStatus; priority: TaskPriority }[]
}

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'blank', name: 'Blank', description: 'Start from scratch', icon: <Plus size={20} />, color: '#6b7a9a',
    milestones: [], tasks: [],
  },
  {
    id: 'marketing-campaign', name: 'Marketing Campaign', description: '6 milestones, 8 tasks', icon: <TrendingUp size={20} />, color: '#ec4899',
    milestones: [
      { title: 'Brief & Strategy', daysFromStart: 7 }, { title: 'Creative Development', daysFromStart: 21 },
      { title: 'Internal Review', daysFromStart: 30 }, { title: 'Client Approval', daysFromStart: 37 },
      { title: 'Campaign Launch', daysFromStart: 45 }, { title: 'Performance Report', daysFromStart: 60 },
    ],
    tasks: [
      { title: 'Define campaign goals and KPIs', status: 'todo', priority: 'urgent' },
      { title: 'Develop creative brief', status: 'todo', priority: 'high' },
      { title: 'Design visual assets', status: 'todo', priority: 'high' },
      { title: 'Write copy and scripts', status: 'todo', priority: 'medium' },
      { title: 'Set up tracking and analytics', status: 'todo', priority: 'medium' },
      { title: 'Review and QA all creatives', status: 'todo', priority: 'high' },
      { title: 'Schedule and publish campaign', status: 'todo', priority: 'urgent' },
      { title: 'Monitor performance and optimize', status: 'todo', priority: 'medium' },
    ],
  },
  {
    id: 'product-launch', name: 'Product Launch', description: '5 milestones, 10 tasks', icon: <Zap size={20} />, color: '#3b82f6',
    milestones: [
      { title: 'Discovery & Research', daysFromStart: 14 }, { title: 'Design Complete', daysFromStart: 35 },
      { title: 'Development Done', daysFromStart: 70 }, { title: 'QA Passed', daysFromStart: 84 },
      { title: 'Launch Day', daysFromStart: 90 },
    ],
    tasks: [
      { title: 'Market research and competitive analysis', status: 'todo', priority: 'urgent' },
      { title: 'Define product requirements', status: 'todo', priority: 'urgent' },
      { title: 'Create user personas and journey maps', status: 'todo', priority: 'high' },
      { title: 'Wireframes and prototypes', status: 'todo', priority: 'high' },
      { title: 'UI/UX design system', status: 'todo', priority: 'high' },
      { title: 'Backend API development', status: 'todo', priority: 'high' },
      { title: 'Frontend implementation', status: 'todo', priority: 'high' },
      { title: 'QA testing and bug fixes', status: 'todo', priority: 'medium' },
      { title: 'Launch checklist and go-live', status: 'todo', priority: 'urgent' },
      { title: 'Post-launch monitoring', status: 'todo', priority: 'medium' },
    ],
  },
  {
    id: 'content-calendar', name: 'Content Calendar', description: '4 milestones, 8 tasks', icon: <Calendar size={20} />, color: '#10b981',
    milestones: [
      { title: 'Research & Planning', daysFromStart: 7 }, { title: 'Content Creation', daysFromStart: 21 },
      { title: 'Review & Edit', daysFromStart: 28 }, { title: 'Publish & Distribute', daysFromStart: 35 },
    ],
    tasks: [
      { title: 'Audience research and topic ideation', status: 'todo', priority: 'high' },
      { title: 'Build 30-day content calendar', status: 'todo', priority: 'urgent' },
      { title: 'Write long-form blog/article', status: 'todo', priority: 'medium' },
      { title: 'Create short-form video scripts', status: 'todo', priority: 'high' },
      { title: 'Design social media graphics', status: 'todo', priority: 'medium' },
      { title: 'Record and edit videos', status: 'todo', priority: 'high' },
      { title: 'SEO optimization and tagging', status: 'todo', priority: 'medium' },
      { title: 'Schedule and auto-publish', status: 'todo', priority: 'low' },
    ],
  },
  {
    id: 'brand-deal', name: 'Brand Deal', description: '4 milestones, 6 tasks', icon: <DollarSign size={20} />, color: '#f59e0b',
    milestones: [
      { title: 'Negotiation', daysFromStart: 7 }, { title: 'Creative Brief', daysFromStart: 14 },
      { title: 'Content Creation', daysFromStart: 28 }, { title: 'Delivery & Invoice', daysFromStart: 35 },
    ],
    tasks: [
      { title: 'Review and negotiate contract terms', status: 'todo', priority: 'urgent' },
      { title: 'Align on deliverables and timeline', status: 'todo', priority: 'high' },
      { title: 'Create content per brief', status: 'todo', priority: 'high' },
      { title: 'Submit for brand approval', status: 'todo', priority: 'high' },
      { title: 'Publish and share live links', status: 'todo', priority: 'urgent' },
      { title: 'Send invoice and performance report', status: 'todo', priority: 'medium' },
    ],
  },
  {
    id: 'event-planning', name: 'Event Planning', description: '5 milestones, 8 tasks', icon: <Star size={20} />, color: '#f97316',
    milestones: [
      { title: 'Planning Complete', daysFromStart: 14 }, { title: 'Logistics Confirmed', daysFromStart: 30 },
      { title: 'Marketing Live', daysFromStart: 45 }, { title: 'Day-Of Execution', daysFromStart: 60 },
      { title: 'Followup & Recap', daysFromStart: 67 },
    ],
    tasks: [
      { title: 'Define event objectives and audience', status: 'todo', priority: 'urgent' },
      { title: 'Venue booking and vendor contracts', status: 'todo', priority: 'high' },
      { title: 'Speaker/guest management', status: 'todo', priority: 'high' },
      { title: 'Event branding and collateral', status: 'todo', priority: 'medium' },
      { title: 'Promotion and ticket sales', status: 'todo', priority: 'high' },
      { title: 'Run-of-show and logistics doc', status: 'todo', priority: 'urgent' },
      { title: 'Day-of coordination', status: 'todo', priority: 'urgent' },
      { title: 'Post-event survey and recap', status: 'todo', priority: 'low' },
    ],
  },
  {
    id: 'sprint', name: 'Sprint (2 weeks)', description: 'Sprint structure with 5 tasks', icon: <RefreshCw size={20} />, color: '#8b5cf6',
    milestones: [
      { title: 'Sprint Planning', daysFromStart: 0 }, { title: 'Mid-Sprint Check', daysFromStart: 7 },
      { title: 'Sprint Review', daysFromStart: 14 }, { title: 'Retrospective', daysFromStart: 14 },
    ],
    tasks: [
      { title: 'Sprint planning and backlog grooming', status: 'todo', priority: 'urgent' },
      { title: 'Feature development — primary scope', status: 'in-progress', priority: 'high' },
      { title: 'Feature development — secondary scope', status: 'todo', priority: 'medium' },
      { title: 'Testing and bug fixes', status: 'todo', priority: 'high' },
      { title: 'Sprint demo and retrospective', status: 'todo', priority: 'medium' },
    ],
  },
]

// ── GANTT TIMELINE ────────────────────────────────────────────────────────────

function GanttTimeline({ project }: { project: Project }) {
  const [selected, setSelected] = useState<Milestone | null>(null)
  const milestones = project.milestones ?? []

  const startDate = project.startDate ? new Date(project.startDate) : new Date()
  const endDate = project.endDate
    ? new Date(project.endDate)
    : new Date(startDate.getTime() + 60 * 86400000)

  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000))
  const today = new Date()
  const todayPct = Math.min(100, Math.max(0, ((today.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100))

  // Build axis ticks (weekly)
  const ticks: { label: string; pct: number }[] = []
  const tickDate = new Date(startDate)
  while (tickDate <= endDate) {
    const pct = ((tickDate.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100
    ticks.push({ label: fmtShortDate(fmtYMD(tickDate)), pct })
    tickDate.setDate(tickDate.getDate() + 7)
  }

  const hasDates = milestones.some(m => m.dueDate)
  if (!hasDates) {
    return (
      <div>
        <p className="sec-label" style={{ marginBottom: 12 }}>Gantt Timeline</p>
        <div className="empty-state">
          <BarChart2 size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
          <p style={{ fontSize: 14, color: '#6b7a9a' }}>No dates set for milestones</p>
          <p style={{ fontSize: 12, color: '#4b5680', marginTop: 6 }}>Add due dates to milestones to see the Gantt chart.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="sec-label" style={{ marginBottom: 12 }}>Gantt Timeline</p>
      <div style={{ background: '#0d0d1a', borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)', overflow: 'hidden' }}>
        {/* Axis */}
        <div style={{ position: 'relative', height: 28, borderBottom: '1px solid rgba(59,130,246,0.1)', background: '#111122' }}>
          {ticks.map((tick, i) => (
            <div key={i} style={{ position: 'absolute', left: `${tick.pct}%`, height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
              <span style={{ fontSize: 9, color: '#4b5680', fontWeight: 700, whiteSpace: 'nowrap' }}>{tick.label}</span>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 1, background: 'rgba(59,130,246,0.1)' }} />
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ padding: '8px 0', position: 'relative', minHeight: 120 }}>
          {/* Today line */}
          {todayPct >= 0 && todayPct <= 100 && (
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPct}%`, width: 1.5, background: '#ef4444', opacity: 0.7, zIndex: 10 }}>
              <div style={{ position: 'absolute', top: 4, left: -14, background: '#ef4444', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>TODAY</div>
            </div>
          )}

          {milestones.map((m, idx) => {
            const msDate = new Date(m.dueDate)
            const endPct = Math.min(100, Math.max(0, ((msDate.getTime() - startDate.getTime()) / 86400000 / totalDays) * 100))
            const width = Math.max(2, endPct)
            const color = MILESTONE_STATUS_COLORS[m.status]
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 12px', position: 'relative' }}>
                <div style={{ width: 120, flexShrink: 0, paddingRight: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</p>
                </div>
                <div style={{ flex: 1, position: 'relative', height: 24 }}>
                  {/* Track */}
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: 'rgba(59,130,246,0.08)', transform: 'translateY(-50%)', borderRadius: 4 }} />
                  {/* Bar */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                    onClick={() => setSelected(m)}
                    style={{ position: 'absolute', top: '50%', left: 0, height: 18, transform: 'translateY(-50%)', background: `${color}33`, border: `1.5px solid ${color}`, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 6, minWidth: 8 }}
                    title={`${m.title} — due ${fmtDate(m.dueDate)}`}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {width > 8 ? fmtShortDate(m.dueDate) : ''}
                    </span>
                  </motion.div>
                </div>
                <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
                  {fmtShortDate(m.dueDate)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Milestone detail popover */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRING}
            style={{ marginTop: 12, padding: 16, background: '#111122', borderRadius: 10, border: `1px solid ${MILESTONE_STATUS_COLORS[selected.status]}33` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag size={14} color={MILESTONE_STATUS_COLORS[selected.status]} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{selected.title}</span>
                <span className="badge" style={{ background: `${MILESTONE_STATUS_COLORS[selected.status]}20`, color: MILESTONE_STATUS_COLORS[selected.status] }}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={13} /></button>
            </div>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Due: {fmtDate(selected.dueDate)} · {smartDateLabel(selected.dueDate)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── PRIORITY MATRIX ───────────────────────────────────────────────────────────

function PriorityMatrix({ project, onTaskClick }: { project: Project; onTaskClick: (t: ProjectTask) => void }) {
  const tasks = (project.tasks ?? []).filter(t => t.status !== 'done')

  function getQuadrant(t: ProjectTask): 'q1' | 'q2' | 'q3' | 'q4' {
    const isUrgent = t.priority === 'urgent' || t.priority === 'high'
    const isImportant = t.priority === 'urgent' || t.priority === 'high'
    const isOverdue = t.eta ? (daysFromNow(t.eta) ?? 0) <= 2 : false
    const urgentFlag = isUrgent || isOverdue
    const importantFlag = isImportant
    if (urgentFlag && importantFlag) return 'q1'
    if (!urgentFlag && importantFlag) return 'q2'
    if (urgentFlag && !importantFlag) return 'q3'
    return 'q4'
  }

  const quadrants: { key: 'q1' | 'q2' | 'q3' | 'q4'; label: string; action: string; color: string; x: string; y: string }[] = [
    { key: 'q1', label: 'Do First', action: 'Urgent + Important', color: '#ef4444', x: 'URGENT', y: 'IMPORTANT' },
    { key: 'q2', label: 'Schedule', action: 'Important, Not Urgent', color: '#3b82f6', x: 'NOT URGENT', y: 'IMPORTANT' },
    { key: 'q3', label: 'Delegate', action: 'Urgent, Less Important', color: '#f59e0b', x: 'URGENT', y: 'LESS IMPORTANT' },
    { key: 'q4', label: 'Eliminate', action: 'Not Urgent, Not Important', color: '#6b7a9a', x: 'NOT URGENT', y: 'LESS IMPORTANT' },
  ]

  const grouped: Record<string, ProjectTask[]> = { q1: [], q2: [], q3: [], q4: [] }
  tasks.forEach(t => { grouped[getQuadrant(t)].push(t) })

  return (
    <div>
      <p className="sec-label" style={{ marginBottom: 12 }}>Priority Matrix (Eisenhower)</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {quadrants.map(q => (
          <div key={q.key} style={{ background: `${q.color}08`, border: `1.5px solid ${q.color}25`, borderRadius: 10, padding: 14, minHeight: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: q.color, margin: 0 }}>{q.label}</p>
                <p style={{ fontSize: 9, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{q.action}</p>
              </div>
              <span style={{ marginLeft: 'auto', fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: q.color }}>{grouped[q.key].length}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {grouped[q.key].map(t => (
                <motion.button key={t.id} whileHover={{ scale: 1.04 }} transition={SPRING}
                  onClick={() => onTaskClick(t)}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: `${q.color}15`, border: `1px solid ${q.color}35`, color: '#f0f4ff', transition: 'all 150ms', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                  {t.title}
                </motion.button>
              ))}
              {grouped[q.key].length === 0 && (
                <p style={{ fontSize: 11, color: '#4b5680', fontStyle: 'italic' }}>No tasks here</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MILESTONES PANEL ──────────────────────────────────────────────────────────

function MilestonesPanel({ project }: { project: Project }) {
  const { profile, addMilestone, updateMilestone, removeMilestone, addActivityLog } = useStore()
  const actorName = profile?.name ?? 'You'
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list')

  const milestones = project.milestones ?? []
  const tasks = project.tasks ?? []

  function handleAdd() {
    if (!newTitle.trim() || !newDate) return
    const m: Milestone = { id: uid(), projectId: project.id, title: newTitle.trim(), description: newDesc || undefined, dueDate: newDate, status: 'upcoming', linkedTaskIds: [], createdAt: new Date().toISOString() }
    addMilestone(project.id, m)
    addActivityLog(project.id, buildActivity(actorName, 'created milestone', 'milestone', m.title))
    toast.success('Milestone added')
    setNewTitle(''); setNewDate(''); setNewDesc(''); setAdding(false)
  }

  function getMilestoneProgress(m: Milestone) {
    const linked = tasks.filter(t => m.linkedTaskIds.includes(t.id))
    return { done: linked.filter(t => t.status === 'done').length, total: linked.length }
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Milestones</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setViewMode('list')}><List size={13} /></button>
          <button className={`btn btn-sm ${viewMode === 'gantt' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setViewMode('gantt')}><BarChart2 size={13} /></button>
          <button className="btn btn-blue btn-sm" onClick={() => setAdding(!adding)}><Plus size={13} /> Add Milestone</button>
        </div>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING}
            className="card" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Title</p>
                <input className="field" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Milestone name" autoFocus />
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Due Date</p>
                <SmartDateInput value={newDate} onChange={setNewDate} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p className="sec-label" style={{ margin: 0 }}>Description</p>
                <AIButton prompt={`Write a milestone description for: ${newTitle || 'this milestone'} in project ${project.name}.`} onResult={setNewDesc} />
              </div>
              <textarea className="field" rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description…" style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-blue btn-sm" onClick={handleAdd}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'gantt' && <GanttTimeline project={project} />}

      {viewMode === 'list' && (
        <>
          {milestones.length === 0 && !adding && (
            <div className="empty-state">
              <Flag size={28} style={{ marginBottom: 10, opacity: 0.3 }} />
              <p>No milestones yet. Add one to track key delivery points.</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {milestones.map(m => {
              const { done, total } = getMilestoneProgress(m)
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const days = daysFromNow(m.dueDate)
              const linkedTasks = tasks.filter(t => m.linkedTaskIds.includes(t.id))
              const isExpanded = expandedId === m.id
              const daysColor = days !== null && days < 0 ? '#ef4444' : days !== null && days <= 3 ? '#f59e0b' : '#10b981'
              const statusOpts: MilestoneStatus[] = ['upcoming', 'in-progress', 'completed', 'delayed']
              return (
                <motion.div key={m.id} layout className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Flag size={16} color={MILESTONE_STATUS_COLORS[m.status]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{m.title}</span>
                        <span className="badge" style={{ background: `${MILESTONE_STATUS_COLORS[m.status]}20`, color: MILESTONE_STATUS_COLORS[m.status] }}>{m.status}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                        <span style={{ color: daysColor, fontWeight: 600 }}>
                          {m.dueDate ? (days !== null && days < 0 ? `Overdue ${Math.abs(days)}d` : days === 0 ? 'Due today' : `${days}d away`) : '—'}
                        </span>
                        <span>{done}/{total} tasks done</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <select className="field" style={{ width: 120, padding: '4px 8px', fontSize: 11 }} value={m.status}
                        onChange={e => updateMilestone(project.id, m.id, { status: e.target.value as MilestoneStatus })}>
                        {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                      <button onClick={() => { removeMilestone(project.id, m.id); addActivityLog(project.id, buildActivity(actorName, 'deleted milestone', 'milestone', m.title)); toast.success('Milestone removed') }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {total > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ height: 4, background: 'rgba(59,130,246,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${pct}%` }} transition={SPRING}
                          style={{ height: '100%', background: MILESTONE_STATUS_COLORS[m.status], borderRadius: 4 }} />
                      </div>
                    </div>
                  )}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} style={{ marginTop: 12, overflow: 'hidden' }}>
                        {linkedTasks.length === 0
                          ? <p style={{ fontSize: 12, color: '#4b5680' }}>No tasks linked.</p>
                          : linkedTasks.map(t => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TASK_STATUS_COLORS[t.status], flexShrink: 0 }} />
                              <span style={{ fontSize: 12.5, flex: 1 }}>{t.title}</span>
                              <span className="badge" style={{ background: `${TASK_STATUS_COLORS[t.status]}20`, color: TASK_STATUS_COLORS[t.status] }}>{t.status}</span>
                            </div>
                          ))
                        }
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── RISKS PANEL ───────────────────────────────────────────────────────────────

function RisksPanel({ project }: { project: Project }) {
  const { profile, addRisk, updateRisk, removeRisk, addActivityLog } = useStore()
  const actorName = profile?.name ?? 'You'
  const members = useStore(s => s.workspace.members)
  const [adding, setAdding] = useState(false)
  const [statusFilter, setStatusFilter] = useState<RiskStatus | 'all'>('all')
  const [newRisk, setNewRisk] = useState<Partial<Risk>>({ title: '', probability: 3, impact: 3, status: 'open' })

  const risks = project.risks ?? []
  const filtered = statusFilter === 'all' ? risks : risks.filter(r => r.status === statusFilter)
  const statusOpts: (RiskStatus | 'all')[] = ['all', 'open', 'mitigated', 'accepted', 'closed']
  const riskStatusOpts: RiskStatus[] = ['open', 'mitigated', 'accepted', 'closed']

  function handleAdd() {
    if (!newRisk.title?.trim()) return
    const r: Risk = { id: uid(), projectId: project.id, title: newRisk.title!.trim(), description: newRisk.description, probability: (newRisk.probability ?? 3) as Risk['probability'], impact: (newRisk.impact ?? 3) as Risk['impact'], mitigation: newRisk.mitigation, ownerId: newRisk.ownerId, status: newRisk.status ?? 'open', createdAt: new Date().toISOString() }
    addRisk(project.id, r)
    addActivityLog(project.id, buildActivity(actorName, 'added risk', 'risk', r.title))
    toast.success('Risk added')
    setAdding(false)
    setNewRisk({ title: '', probability: 3, impact: 3, status: 'open' })
  }

  const matrixCells = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => {
      const prob = (5 - row) as Risk['probability']; const imp = (col + 1) as Risk['impact']
      const score = prob * imp; const { color } = riskLevel(score)
      const cellRisks = risks.filter(r => r.probability === prob && r.impact === imp)
      return { prob, imp, score, color, risks: cellRisks }
    })
  )

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Risk Register</h3>
        <button className="btn btn-blue btn-sm" onClick={() => setAdding(!adding)}><Plus size={13} /> Add Risk</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {statusOpts.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-blue' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>{s}</button>
        ))}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING}
            className="card" style={{ padding: 16, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Title</p>
                <input className="field" value={newRisk.title ?? ''} onChange={e => setNewRisk(r => ({ ...r, title: e.target.value }))} placeholder="Risk title" autoFocus />
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Owner</p>
                <select className="field" value={newRisk.ownerId ?? ''} onChange={e => setNewRisk(r => ({ ...r, ownerId: e.target.value || undefined }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Probability (1-5)</p>
                <input className="field" type="number" min={1} max={5} value={newRisk.probability ?? 3} onChange={e => setNewRisk(r => ({ ...r, probability: Math.min(5, Math.max(1, parseInt(e.target.value) || 3)) as Risk['probability'] }))} />
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Impact (1-5)</p>
                <input className="field" type="number" min={1} max={5} value={newRisk.impact ?? 3} onChange={e => setNewRisk(r => ({ ...r, impact: Math.min(5, Math.max(1, parseInt(e.target.value) || 3)) as Risk['impact'] }))} />
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Status</p>
                <select className="field" value={newRisk.status ?? 'open'} onChange={e => setNewRisk(r => ({ ...r, status: e.target.value as RiskStatus }))}>
                  {riskStatusOpts.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <p className="sec-label" style={{ margin: 0 }}>Mitigation</p>
                <AIButton prompt={`Suggest 3 concrete mitigation strategies for this risk: ${newRisk.title || 'unknown risk'}. Format as numbered list.`} onResult={text => setNewRisk(r => ({ ...r, mitigation: text }))} />
              </div>
              <textarea className="field" rows={2} value={newRisk.mitigation ?? ''} onChange={e => setNewRisk(r => ({ ...r, mitigation: e.target.value || undefined }))} placeholder="How will you mitigate this risk?" style={{ resize: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-blue btn-sm" onClick={handleAdd}>Add Risk</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {risks.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 20 }}>
          <p className="sec-label" style={{ marginBottom: 12 }}>Risk Matrix (P × I)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '20px repeat(5, 1fr)', gap: 3 }}>
            <div />
            {[1,2,3,4,5].map(i => <div key={i} style={{ textAlign: 'center', fontSize: 10, color: '#4b5680', fontWeight: 700, paddingBottom: 4 }}>I={i}</div>)}
            {matrixCells.map((row, ri) =>
              row.map((cell, ci) => (
                <div key={`${ri}-${ci}`} style={{ display: ci === 0 ? 'contents' : undefined }}>
                  {ci === 0 && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#4b5680', fontWeight: 700 }}>P={cell.prob}</div>}
                  <div style={{ height: 44, borderRadius: 6, background: `${cell.color}18`, border: `1px solid ${cell.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 3, padding: 3, position: 'relative' }} title={`P=${cell.prob} × I=${cell.imp} = ${cell.score}`}>
                    <span style={{ position: 'absolute', top: 3, left: 5, fontSize: 8, color: cell.color, fontWeight: 700, opacity: 0.6 }}>{cell.score}</span>
                    {cell.risks.map(r => <div key={r.id} style={{ width: 8, height: 8, borderRadius: '50%', background: cell.color }} title={r.title} />)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {filtered.length === 0
        ? <div className="empty-state"><AlertTriangle size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No risks recorded.</p></div>
        : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
                  {['Title', 'P', 'I', 'Score', 'Status', 'Owner', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const score = riskScore(r); const { label, color } = riskLevel(score)
                  const owner = members.find(m => m.id === r.ownerId)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(59,130,246,0.06)', transition: 'background 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 12px', fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                        {r.mitigation && <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>{r.mitigation.slice(0, 80)}{r.mitigation.length > 80 ? '…' : ''}</div>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <select style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Mono', monospace", width: 32 }} value={r.probability} onChange={e => updateRisk(project.id, r.id, { probability: parseInt(e.target.value) as Risk['probability'] })}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <select style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Mono', monospace", width: 32 }} value={r.impact} onChange={e => updateRisk(project.id, r.id, { impact: parseInt(e.target.value) as Risk['impact'] })}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px' }}><span className="badge" style={{ background: `${color}20`, color }}>{score} · {label}</span></td>
                      <td style={{ padding: '10px 12px' }}>
                        <select className="field" style={{ width: 100, padding: '3px 8px', fontSize: 11 }} value={r.status} onChange={e => updateRisk(project.id, r.id, { status: e.target.value as RiskStatus })}>
                          {riskStatusOpts.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8' }}>{owner ? owner.name.split(' ')[0] : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => { removeRisk(project.id, r.id); addActivityLog(project.id, buildActivity(actorName, 'removed risk', 'risk', r.title)); toast.success('Risk removed') }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

// ── ACTIVITY PANEL ────────────────────────────────────────────────────────────

function ActivityPanel({ project }: { project: Project }) {
  const [filter, setFilter] = useState<ActivityLog['entityType'] | 'all'>('all')
  const log = project.activityLog ?? []
  const filterOpts: (ActivityLog['entityType'] | 'all')[] = ['all', 'task', 'milestone', 'risk', 'project', 'member']
  const filtered = filter === 'all' ? log : log.filter(e => e.entityType === filter)

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Activity Log</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filterOpts.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-blue' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize', fontSize: 11 }}>{f}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0
        ? <div className="empty-state"><Activity size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No activity yet.</p></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((entry, idx) => {
              const color = ENTITY_COLORS[entry.entityType]
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, transition: 'background 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0, marginTop: 2 }}>
                    {ENTITY_ICONS[entry.entityType]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 700 }}>{entry.actorName}</span>
                      {' '}<span style={{ color: '#94a3b8' }}>{entry.action}</span>
                      {' '}<span style={{ color, fontWeight: 600 }}>"{entry.entityTitle}"</span>
                    </p>
                    <p style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>{timeAgo(entry.timestamp)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── WORKLOAD VIEW ─────────────────────────────────────────────────────────────

function WorkloadView({ project }: { project: Project }) {
  const members = useStore(s => s.workspace.members)
  const [sortBy, setSortBy] = useState<'tasks' | 'overloaded'>('tasks')
  const now = useRef(Date.now()).current // Initialize once

  const projectMembers = members.filter(m => project.members.includes(m.id))
  const tasks = project.tasks ?? []

  interface MemberStats {
    member: TeamMember
    tasksByStatus: Record<TaskStatus, number>
    estimatedHours: number
    loggedHours: number
    overdueTasks: number
    inProgressCount: number
    capacity: 'Overloaded' | 'Busy' | 'Available'
    capacityColor: string
  }

  const stats: MemberStats[] = projectMembers.map(m => {
    const myTasks = tasks.filter(t => t.ownerId === m.id)
    const tasksByStatus: Record<TaskStatus, number> = { todo: 0, 'in-progress': 0, review: 0, done: 0, blocked: 0 }
    myTasks.forEach(t => { tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1 })
    const estimatedHours = myTasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0)
    const loggedHours = myTasks.reduce((sum, t) => sum + (t.actualHours ?? 0), 0)
    const overdueTasks = myTasks.filter(t => t.eta && new Date(t.eta).getTime() < now && t.status !== 'done').length
    const inProgressCount = tasksByStatus['in-progress']
    let capacity: 'Overloaded' | 'Busy' | 'Available'
    let capacityColor: string
    if (inProgressCount > 5) { capacity = 'Overloaded'; capacityColor = '#ef4444' }
    else if (inProgressCount >= 3) { capacity = 'Busy'; capacityColor = '#f59e0b' }
    else { capacity = 'Available'; capacityColor = '#10b981' }
    return { member: m, tasksByStatus, estimatedHours, loggedHours, overdueTasks, inProgressCount, capacity, capacityColor }
  })

  const sorted = [...stats].sort((a, b) => {
    if (sortBy === 'overloaded') return b.inProgressCount - a.inProgressCount
    return (b.tasksByStatus.todo + b.tasksByStatus['in-progress']) - (a.tasksByStatus.todo + a.tasksByStatus['in-progress'])
  })

  const STATUS_KEYS: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked']
  const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'Todo', 'in-progress': 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked' }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Team Workload</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm ${sortBy === 'tasks' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setSortBy('tasks')}>Most Tasks</button>
          <button className={`btn btn-sm ${sortBy === 'overloaded' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setSortBy('overloaded')}>Overloaded First</button>
        </div>
      </div>

      {projectMembers.length === 0 && (
        <div className="empty-state"><Users size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No team members on this project.</p></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sorted.map(({ member, tasksByStatus, estimatedHours, loggedHours, overdueTasks, capacity, capacityColor }) => {
          const totalTasks = STATUS_KEYS.reduce((sum, s) => sum + tasksByStatus[s], 0)
          const loggedPct = estimatedHours > 0 ? Math.min(100, Math.round((loggedHours / estimatedHours) * 100)) : 0
          return (
            <div key={member.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <Avatar name={member.name} size={40} color={PROJECT_COLORS[member.name.charCodeAt(0) % PROJECT_COLORS.length]} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</span>
                    <span className="badge" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', textTransform: 'capitalize' }}>{member.role}</span>
                    <span className="badge" style={{ background: `${capacityColor}18`, color: capacityColor }}>{capacity}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#4b5680' }}>{member.email}</span>
                </div>
                {overdueTasks > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle size={12} color="#ef4444" />
                    <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>{overdueTasks} overdue</span>
                  </div>
                )}
              </div>

              {/* Task bar */}
              {totalTasks > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
                    {STATUS_KEYS.map(s => {
                      const count = tasksByStatus[s]
                      const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0
                      if (pct === 0) return null
                      return (
                        <div key={s} style={{ flex: count, background: TASK_STATUS_COLORS[s], display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: count > 0 ? 20 : 0 }} title={`${STATUS_LABELS[s]}: ${count}`}>
                          {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{count}</span>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                    {STATUS_KEYS.filter(s => tasksByStatus[s] > 0).map(s => (
                      <span key={s} style={{ fontSize: 10, color: TASK_STATUS_COLORS[s], display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: TASK_STATUS_COLORS[s] }} />
                        {STATUS_LABELS[s]} ({tasksByStatus[s]})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hours */}
              {estimatedHours > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'Space Mono', monospace" }}>
                      {loggedHours.toFixed(1)}h / {estimatedHours.toFixed(1)}h
                    </span>
                    <span style={{ fontSize: 11, color: loggedPct > 100 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{loggedPct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(59,130,246,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, loggedPct)}%`, background: loggedPct > 100 ? '#ef4444' : '#10b981', borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── VELOCITY CHART ────────────────────────────────────────────────────────────

function VelocityChart({ project }: { project: Project }) {
  const tasks = project.tasks ?? []
  const today = new Date()
  const days: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const dateStr = fmtYMD(d)
    const count = tasks.filter(t => t.completedAt && t.completedAt.startsWith(dateStr)).length
    days.push({ date: dateStr, count })
  }

  const maxCount = Math.max(1, ...days.map(d => d.count))
  const hasData = days.some(d => d.count > 0)

  return (
    <div>
      <p className="sec-label" style={{ marginBottom: 12 }}>Velocity (Last 14 Days)</p>
      {!hasData
        ? <p style={{ fontSize: 12, color: '#4b5680', textAlign: 'center', padding: '16px 0' }}>No completed tasks yet.</p>
        : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
            {days.map((d, i) => {
              const heightPct = d.count > 0 ? Math.max(0.15, d.count / maxCount) : 0.04
              const isToday = d.date === fmtYMD(today)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }} title={`${d.date}: ${d.count} tasks done`}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                    style={{ width: '100%', background: isToday ? '#3b82f6' : d.count > 0 ? '#3b82f620' : 'rgba(59,130,246,0.06)', borderRadius: '3px 3px 0 0', border: isToday ? '1px solid #3b82f6' : `1px solid ${d.count > 0 ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {d.count > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: isToday ? '#fff' : '#3b82f6' }}>{d.count}</span>}
                  </motion.div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── PROJECT OVERVIEW ──────────────────────────────────────────────────────────

function ProjectOverview({ project }: { project: Project }) {
  const members = useStore(s => s.workspace.members)
  const healthScore = computeHealthScore(project)
  const tasks = project.tasks ?? []
  const risks = project.risks ?? []
  const now = useRef(Date.now()).current // Initialize once

  const kpiTotal = tasks.length

  const kpiTotal = tasks.length
  const kpiDone = tasks.filter(t => t.status === 'done').length
  const kpiInProgress = tasks.filter(t => t.status === 'in-progress').length
  const kpiBlocked = tasks.filter(t => t.status === 'blocked').length
  const kpiOverdue = tasks.filter(t => t.eta && new Date(t.eta).getTime() < now && t.status !== 'done').length
  const projectMembers = members.filter(m => project.members.includes(m.id))

  const nextMilestone = (project.milestones ?? [])
    .filter(m => m.status !== 'completed' && m.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]

  const recentActivity = (project.activityLog ?? []).slice(0, 5)
  const spentPct = project.budget && project.spentBudget ? Math.min(100, Math.round((project.spentBudget / project.budget) * 100)) : null

  const criticalRisks = risks.filter(r => riskScore(r) >= 16 && r.status === 'open').length
  const highRisks = risks.filter(r => riskScore(r) >= 10 && riskScore(r) < 16 && r.status === 'open').length
  const medRisks = risks.filter(r => riskScore(r) < 10 && r.status === 'open').length

  const KPI = ({ label, value, color = '#f0f4ff', sub }: { label: string; value: number; color?: string; sub?: string }) => (
    <div className="card" style={{ padding: '14px 16px', textAlign: 'center', flex: 1, minWidth: 80 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Health + KPIs */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <HealthRing score={healthScore} size={130} />
          <div>
            <p style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Project Health</p>
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, maxWidth: 180 }}>Based on task completion, overdue items, risks, milestones &amp; budget.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignContent: 'flex-start' }}>
          <KPI label="Total Tasks" value={kpiTotal} />
          <KPI label="Done" value={kpiDone} color="#10b981" />
          <KPI label="In Progress" value={kpiInProgress} color="#3b82f6" />
          <KPI label="Blocked" value={kpiBlocked} color={kpiBlocked > 0 ? '#ef4444' : '#4b5680'} />
          <KPI label="Overdue" value={kpiOverdue} color={kpiOverdue > 0 ? '#ef4444' : '#4b5680'} />
          <KPI label="Team" value={projectMembers.length} color="#8b5cf6" />
        </div>
      </div>

      {/* Velocity */}
      <div className="card" style={{ padding: 20 }}>
        <VelocityChart project={project} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Next milestone */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Flag size={15} color="#f59e0b" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Next Milestone</span>
          </div>
          {nextMilestone ? (
            <>
              <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{nextMilestone.title}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge" style={{ background: `${MILESTONE_STATUS_COLORS[nextMilestone.status]}20`, color: MILESTONE_STATUS_COLORS[nextMilestone.status] }}>{nextMilestone.status}</span>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{nextMilestone.dueDate ? smartDateLabel(nextMilestone.dueDate) : '—'}</span>
              </div>
            </>
          ) : <p style={{ fontSize: 13, color: '#4b5680' }}>No upcoming milestones.</p>}
        </div>

        {/* Active Risks */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={15} color="#ef4444" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Active Risks</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {criticalRisks > 0 && <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>{criticalRisks} Critical</span>}
            {highRisks > 0 && <span className="badge" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>{highRisks} High</span>}
            {medRisks > 0 && <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{medRisks} Medium</span>}
            {criticalRisks + highRisks + medRisks === 0 && <p style={{ fontSize: 12, color: '#10b981' }}>No open risks.</p>}
          </div>
        </div>

        {/* Budget */}
        {project.budget && (
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={15} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Budget</span>
              </div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
                <span style={{ color: spentPct !== null && spentPct > 100 ? '#ef4444' : '#f0f4ff' }}>${(project.spentBudget ?? 0).toLocaleString()}</span>
                <span style={{ color: '#4b5680' }}> / ${project.budget.toLocaleString()}</span>
                {spentPct !== null && <span className="badge" style={{ marginLeft: 8, background: spentPct > 100 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: spentPct > 100 ? '#ef4444' : '#10b981' }}>{spentPct}%</span>}
              </div>
            </div>
            {spentPct !== null && (
              <div style={{ height: 6, background: 'rgba(59,130,246,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div animate={{ width: `${Math.min(100, spentPct)}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', background: spentPct > 100 ? '#ef4444' : '#10b981', borderRadius: 4 }} />
              </div>
            )}
          </div>
        )}

        {/* Team */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Users size={15} color="#3b82f6" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Team ({projectMembers.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projectMembers.slice(0, 5).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={m.name} size={28} color={PROJECT_COLORS[m.name.charCodeAt(0) % PROJECT_COLORS.length]} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{m.name}</span>
                <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{m.role}</span>
              </div>
            ))}
            {projectMembers.length === 0 && <p style={{ fontSize: 12, color: '#4b5680' }}>No members assigned.</p>}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Activity size={15} color="#8b5cf6" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Recent Activity</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentActivity.map(entry => {
              const color = ENTITY_COLORS[entry.entityType]
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
                  <div style={{ color, flexShrink: 0 }}>{ENTITY_ICONS[entry.entityType]}</div>
                  <p style={{ fontSize: 12.5, flex: 1 }}>
                    <span style={{ fontWeight: 700 }}>{entry.actorName}</span>
                    {' '}<span style={{ color: '#94a3b8' }}>{entry.action}</span>
                    {' '}<span style={{ color, fontWeight: 600 }}>"{entry.entityTitle}"</span>
                  </p>
                  <span style={{ fontSize: 11, color: '#4b5680', flexShrink: 0 }}>{timeAgo(entry.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TASKS PANEL ───────────────────────────────────────────────────────────────

function TasksPanel({ project }: { project: Project }) {
  const { profile, addProjectTask, addActivityLog, smartTasks, addSmartTask, updateSmartTask } = useStore()
  const members = useStore(s => s.workspace.members)
  const actorName = profile?.name ?? 'You'

  const [viewMode, setViewMode] = useState<'list' | 'board' | 'matrix'>('list')
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [addingTask, setAddingTask] = useState(false)
  const [asSmartTask, setAsSmartTask] = useState(false)
  const [newTask, setNewTask] = useState<Partial<ProjectTask>>({ title: '', status: 'todo', priority: 'medium', tags: [] })
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const tasks = project.tasks ?? []
  const linkedSmartTasks = smartTasks.filter(st => st.projectId === project.id)

  // Keep selectedTask in sync with store
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id)
      if (updated && updated.id === selectedTask.id) setSelectedTask(updated)
      else if (!updated) setSelectedTask(null) // Task was deleted
    }
  }, [tasks, selectedTask])

  function handleAddTask() {
    if (!newTask.title?.trim()) return
    if (asSmartTask) {
      const st: SmartTask = { id: uid(), title: newTask.title!.trim(), priority: (newTask.priority ?? 'medium') as SmartTask['priority'], status: 'todo', tags: [], projectId: project.id, createdAt: new Date().toISOString() }
      addSmartTask(st)
      toast.success('Added as Smart Task')
    } else {
      const task: ProjectTask = { id: uid(), projectId: project.id, title: newTask.title!.trim(), status: (newTask.status ?? 'todo') as TaskStatus, priority: (newTask.priority ?? 'medium') as TaskPriority, tags: [], createdAt: new Date().toISOString() }
      addProjectTask(task)
      addActivityLog(project.id, buildActivity(actorName, 'created task', 'task', task.title))
      toast.success('Task added')
    }
    setNewTask({ title: '', status: 'todo', priority: 'medium', tags: [] })
    setAddingTask(false)
    setAsSmartTask(false)
  }

  function convertSmartTask(st: SmartTask) {
    const task: ProjectTask = { id: uid(), projectId: project.id, title: st.title, description: st.notes, status: st.status, priority: st.priority, startDate: st.startDate, eta: st.dueDate, estimatedHours: st.estimatedHours, checklist: st.checklist, tags: st.tags, createdAt: new Date().toISOString() }
    addProjectTask(task)
    updateSmartTask(st.id, { projectId: undefined })
    addActivityLog(project.id, buildActivity(actorName, 'converted smart task', 'task', st.title))
    toast.success('Converted to project task')
  }

  const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked']
  const COLUMN_LABELS: Record<TaskStatus, string> = { todo: 'To Do', 'in-progress': 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked' }

  function TaskRowItem({ task }: { task: ProjectTask }) {
    const owner = members.find(m => m.id === task.ownerId)
    const isExpanded = expandedRows.has(task.id)
    const days = daysFromNow(task.eta)
    const isOverdue = days !== null && days < 0 && task.status !== 'done'
    const checkDone = (task.checklist ?? []).filter(c => c.done).length
    const checkTotal = (task.checklist ?? []).length

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.07)', cursor: 'pointer', transition: 'background 150ms' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }} onClick={() => setSelectedTask(task)}>{task.title}</span>
          {checkTotal > 0 && (
            <span style={{ fontSize: 10, color: '#4b5680', fontFamily: "'Space Mono', monospace", flexShrink: 0 }}>{checkDone}/{checkTotal}</span>
          )}
          {task.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', borderRadius: 10, fontWeight: 700 }}>{tag}</span>
          ))}
          {owner && <Avatar name={owner.name} size={22} color={PROJECT_COLORS[owner.name.charCodeAt(0) % PROJECT_COLORS.length]} />}
          {task.eta && <span style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#94a3b8', fontWeight: isOverdue ? 700 : 400, whiteSpace: 'nowrap' }}>{isOverdue ? `Overdue ${Math.abs(days!)}d` : `${days}d`}</span>}
          <span className="badge" style={{ background: `${TASK_STATUS_COLORS[task.status]}20`, color: TASK_STATUS_COLORS[task.status] }}>{task.status}</span>
          <button onClick={e => { e.stopPropagation(); setExpandedRows(s => { const n = new Set(s); n.has(task.id) ? n.delete(task.id) : n.add(task.id); return n }) }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
        <AnimatePresence>
          {isExpanded && task.description && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={SPRING}
              style={{ overflow: 'hidden', paddingLeft: 32, paddingRight: 14, background: 'rgba(59,130,246,0.02)' }}>
              <p style={{ fontSize: 12.5, color: '#94a3b8', padding: '10px 0', lineHeight: 1.6, borderBottom: '1px solid rgba(59,130,246,0.07)' }}>{task.description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-blue btn-sm" onClick={() => setAddingTask(!addingTask)}><Plus size={13} /> Add Task</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setViewMode('list')}><List size={13} /></button>
          <button className={`btn btn-sm ${viewMode === 'board' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setViewMode('board')}><Grid size={13} /></button>
          <button className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-blue' : 'btn-ghost'}`} onClick={() => setViewMode('matrix')}><LayoutGrid size={13} /></button>
        </div>
      </div>

      <AnimatePresence>
        {addingTask && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING}
            className="card" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, marginBottom: 10 }}>
              <input className="field" value={newTask.title ?? ''} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                placeholder="Task title" onKeyDown={e => e.key === 'Enter' && handleAddTask()} autoFocus />
              <select className="field" style={{ width: 120 }} value={newTask.priority ?? 'medium'} onChange={e => setNewTask(t => ({ ...t, priority: e.target.value as TaskPriority }))}>
                <option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <select className="field" style={{ width: 130 }} value={newTask.status ?? 'todo'} onChange={e => setNewTask(t => ({ ...t, status: e.target.value as TaskStatus }))}>
                {STATUSES.map(s => <option key={s} value={s}>{COLUMN_LABELS[s]}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, color: '#94a3b8' }}>
                <input type="checkbox" checked={asSmartTask} onChange={e => setAsSmartTask(e.target.checked)} />
                <Zap size={12} color="#f59e0b" /> Smart Task
              </label>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="btn btn-blue btn-sm" onClick={handleAddTask}>Add</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingTask(false)}>Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {linkedSmartTasks.length > 0 && (
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={13} color="#f59e0b" /><span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Smart Tasks ({linkedSmartTasks.length})</span>
          </div>
          {linkedSmartTasks.map(st => (
            <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(59,130,246,0.06)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[st.priority], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5 }}>{st.title}</span>
              <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 10, fontWeight: 700 }}>Smart Task</span>
              <span className="badge" style={{ background: `${TASK_STATUS_COLORS[st.status]}20`, color: TASK_STATUS_COLORS[st.status] }}>{st.status}</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => convertSmartTask(st)}>Convert</button>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div>
          {STATUSES.map(status => {
            const grouped = tasks.filter(t => t.status === status)
            if (grouped.length === 0) return null
            return (
              <div key={status} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: `${TASK_STATUS_COLORS[status]}10`, borderRadius: '8px 8px 0 0', borderBottom: `2px solid ${TASK_STATUS_COLORS[status]}40` }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TASK_STATUS_COLORS[status] }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: TASK_STATUS_COLORS[status], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{COLUMN_LABELS[status]}</span>
                  <span style={{ fontSize: 11, color: '#4b5680' }}>({grouped.length})</span>
                </div>
                <div className="card" style={{ borderRadius: '0 0 10px 10px', borderTop: 'none', overflow: 'hidden' }}>
                  {grouped.map(t => <TaskRowItem key={t.id} task={t} />)}
                </div>
              </div>
            )
          })}
          {tasks.length === 0 && <div className="empty-state"><CheckSquare size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No tasks yet. Add your first task above.</p></div>}
        </div>
      )}

      {/* Board View */}
      {viewMode === 'board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, overflowX: 'auto' }}>
          {STATUSES.map(status => {
            const colTasks = tasks.filter(t => t.status === status)
            return (
              <div key={status}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '6px 10px', background: `${TASK_STATUS_COLORS[status]}10`, borderRadius: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: TASK_STATUS_COLORS[status] }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: TASK_STATUS_COLORS[status], textTransform: 'uppercase', letterSpacing: '0.05em' }}>{COLUMN_LABELS[status]}</span>
                  <span style={{ fontSize: 10, color: '#4b5680', marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                  {colTasks.map(t => {
                    const owner = members.find(m => m.id === t.ownerId)
                    const days = daysFromNow(t.eta)
                    return (
                      <motion.div key={t.id} layout className="card" style={{ padding: 12, cursor: 'pointer' }}
                        onClick={() => setSelectedTask(t)} whileHover={{ y: -2 }} transition={SPRING}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[t.priority], marginTop: 5, flexShrink: 0 }} />
                          <p style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{t.title}</p>
                        </div>
                        {t.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                            {t.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{ fontSize: 9, padding: '1px 6px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', borderRadius: 8, fontWeight: 700 }}>{tag}</span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {owner ? <Avatar name={owner.name} size={20} color={PROJECT_COLORS[owner.name.charCodeAt(0) % PROJECT_COLORS.length]} /> : <div />}
                          {t.eta && days !== null && (
                            <span style={{ fontSize: 10, color: days < 0 ? '#ef4444' : '#94a3b8', fontWeight: days < 0 ? 700 : 400 }}>{days < 0 ? `−${Math.abs(days)}d` : `${days}d`}</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Priority Matrix View */}
      {viewMode === 'matrix' && (
        <PriorityMatrix project={project} onTaskClick={setSelectedTask} />
      )}

      <AnimatePresence>
        {selectedTask && (
          <TaskDetailDrawer task={selectedTask} project={project} members={members}
            onClose={() => setSelectedTask(null)}
            onSaved={() => setSelectedTask(null)}
            onDeleted={() => setSelectedTask(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── NEW PROJECT MODAL ─────────────────────────────────────────────────────────

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const { profile, addProject, addProjectTask, addMilestone, addActivityLog } = useStore()
  const actorName = profile?.name ?? 'You'

  const [step, setStep] = useState(1)
  const [templateId, setTemplateId] = useState<ProjectTemplateId>('blank')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ProjectType>('one-off')
  const [color, setColor] = useState(PROJECT_COLORS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [aiDescLoading, setAiDescLoading] = useState(false)

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId)!

  const TYPE_OPTIONS: { value: ProjectType; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'one-off', label: 'One-Off', desc: 'Single campaign or event', icon: <Target size={20} /> },
    { value: 'monthly', label: 'Monthly', desc: 'Recurring monthly deliverables', icon: <Calendar size={20} /> },
    { value: 'ongoing', label: 'Ongoing', desc: 'Long-running without fixed end', icon: <TrendingUp size={20} /> },
  ]

  async function generateDesc() {
    setAiDescLoading(true)
    try {
      const apiKey = getResolvedAIKey()
      if (apiKey) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: 'claude-haiku-4-5', max_tokens: 400, messages: [{ role: 'user', content: `Write a compelling project description for: ${name}, type: ${type}. Keep it concise.` }] }),
        })
        const data = await res.json()
        setDescription(data.content?.[0]?.text ?? '')
      } else {
        await new Promise(r => setTimeout(r, 600))
        setDescription(`${name} is a ${type} project designed to deliver exceptional results. This initiative focuses on creating measurable impact through strategic planning and flawless execution.`)
      }
    } catch { toast.error('AI request failed') }
    finally { setAiDescLoading(false) }
  }

  function handleCreate() {
    if (!name.trim()) return
    const now = new Date().toISOString()
    const projectId = uid()
    const project: Project = {
      id: projectId, name: name.trim(), description: description || undefined, type, status: 'planning',
      members: [], tasks: [], milestones: [], risks: [], activityLog: [], color,
      startDate: startDate || undefined, endDate: endDate || undefined,
      budget: budget ? parseFloat(budget) : undefined, spentBudget: 0,
      createdAt: now, createdBy: profile?.name ?? 'Unknown',
    }
    addProject(project)

    // Apply template
    if (selectedTemplate.id !== 'blank') {
      const base = startDate ? new Date(startDate) : new Date()
      selectedTemplate.milestones.forEach(ms => {
        const dueDate = new Date(base); dueDate.setDate(dueDate.getDate() + ms.daysFromStart)
        const m: Milestone = { id: uid(), projectId, title: ms.title, dueDate: fmtYMD(dueDate), status: 'upcoming', linkedTaskIds: [], createdAt: now }
        addMilestone(projectId, m)
      })
      selectedTemplate.tasks.forEach(td => {
        const t: ProjectTask = { id: uid(), projectId, title: td.title, status: td.status, priority: td.priority, tags: [], createdAt: now }
        addProjectTask(t)
      })
    }

    addActivityLog(projectId, buildActivity(actorName, 'created project', 'project', project.name))
    toast.success(`Project "${project.name}" created`)
    onClose()
  }

  const steps = [{ label: 'Template', num: 1 }, { label: 'Basics', num: 2 }, { label: 'Timeline', num: 3 }, { label: 'Review', num: 4 }]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={SPRING}
        className="card" style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Step indicator */}
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', gap: 0 }}>
          {steps.map((s, idx) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s.num ? '#3b82f6' : 'rgba(59,130,246,0.1)', border: `2px solid ${step >= s.num ? '#3b82f6' : 'rgba(59,130,246,0.2)'}`, fontSize: 13, fontWeight: 700, color: step >= s.num ? '#fff' : '#4b5680', transition: 'all 200ms' }}>
                  {step > s.num ? <Check size={13} /> : s.num}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: step >= s.num ? '#f0f4ff' : '#4b5680' }}>{s.label}</span>
              </div>
              {idx < steps.length - 1 && <div style={{ flex: 1, height: 2, background: step > s.num ? '#3b82f6' : 'rgba(59,130,246,0.15)', margin: '0 8px', borderRadius: 2, transition: 'background 300ms' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Template */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={SPRING}
              style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Choose a Template</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Start with a pre-built structure or from scratch.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {TEMPLATES.map(tmpl => (
                  <button key={tmpl.id} onClick={() => setTemplateId(tmpl.id)}
                    style={{ padding: '16px', borderRadius: 12, border: `2px solid ${templateId === tmpl.id ? tmpl.color : 'rgba(59,130,246,0.15)'}`, background: templateId === tmpl.id ? `${tmpl.color}0d` : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 180ms', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${tmpl.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tmpl.color, flexShrink: 0 }}>
                      {tmpl.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 3 }}>{tmpl.name}</p>
                      <p style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.4 }}>{tmpl.description}</p>
                    </div>
                    {templateId === tmpl.id && <Check size={14} color={tmpl.color} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Basics */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={SPRING}
              style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Project Details</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Name your project and choose its type.</p>
              <div style={{ marginBottom: 16 }}>
                <p className="sec-label" style={{ marginBottom: 6 }}>Project Name *</p>
                <input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Brand Collab" autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p className="sec-label" style={{ margin: 0 }}>Description</p>
                  <button onClick={generateDesc} disabled={!name.trim() || aiDescLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: !name.trim() || aiDescLoading ? 'not-allowed' : 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#8b5cf6', opacity: !name.trim() ? 0.5 : 1 }}>
                    {aiDescLoading ? <div style={{ width: 10, height: 10, border: '1.5px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Zap size={10} />} AI
                  </button>
                </div>
                <textarea className="field" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief overview…" style={{ resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <p className="sec-label" style={{ marginBottom: 10 }}>Project Type</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {TYPE_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setType(opt.value)}
                      style={{ padding: '14px 12px', borderRadius: 12, border: `2px solid ${type === opt.value ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`, background: type === opt.value ? 'rgba(59,130,246,0.08)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 180ms' }}>
                      <div style={{ color: type === opt.value ? '#3b82f6' : '#4b5680', marginBottom: 8 }}>{opt.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: type === opt.value ? '#f0f4ff' : '#94a3b8', marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.4 }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 10 }}>Color</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {PROJECT_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                      style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${color === c ? '#fff' : 'transparent'}`, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 150ms' }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Timeline */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={SPRING}
              style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Timeline &amp; Budget</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Set your project dates and optional budget.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <p className="sec-label" style={{ marginBottom: 6 }}>Start Date</p>
                  <SmartDateInput value={startDate} onChange={setStartDate} placeholder="e.g. today, next monday" />
                </div>
                <div>
                  <p className="sec-label" style={{ marginBottom: 6 }}>End Date</p>
                  <SmartDateInput value={endDate} onChange={setEndDate} placeholder="e.g. in 2 months, q2" />
                </div>
              </div>
              <div>
                <p className="sec-label" style={{ marginBottom: 6 }}>Budget (optional)</p>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5680', fontSize: 14 }}>$</span>
                  <input className="field" type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)} placeholder="0" style={{ paddingLeft: 26 }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={SPRING}
              style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Review &amp; Create</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Confirm your project details.</p>
              <div className="card" style={{ padding: 20, background: '#111122' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}22`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={20} color={color} />
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800 }}>{name || 'Untitled Project'}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', textTransform: 'capitalize' }}>{type}</span>
                      <span className="badge" style={{ background: `${selectedTemplate.color}20`, color: selectedTemplate.color }}>{selectedTemplate.name}</span>
                    </div>
                  </div>
                </div>
                {description && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 14, lineHeight: 1.6 }}>{description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {startDate && <div><p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Start</p><p style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(startDate)}</p></div>}
                  {endDate && <div><p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>End</p><p style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(endDate)}</p></div>}
                  {budget && <div><p style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Budget</p><p style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>${parseFloat(budget).toLocaleString()}</p></div>}
                </div>
                {selectedTemplate.id !== 'blank' && (
                  <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.12)' }}>
                    <p style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>Template will add: {selectedTemplate.tasks.length} tasks, {selectedTemplate.milestones.length} milestones</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 4
            ? <button className="btn btn-blue" onClick={() => setStep(s => s + 1)} disabled={step === 2 && !name.trim()}>Next →</button>
            : <button className="btn btn-blue" onClick={handleCreate} disabled={!name.trim()}><FolderKanban size={14} /> Create Project</button>
          }
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── EXPORT HELPERS ────────────────────────────────────────────────────────────

function exportTasksCSV(project: Project, members: TeamMember[]) {
  const header = ['Title', 'Status', 'Priority', 'Owner', 'Start Date', 'ETA', 'Est. Hours', 'Logged Hours', 'Tags']
  const rows = (project.tasks ?? []).map(t => {
    const owner = members.find(m => m.id === t.ownerId)
    return [
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      owner ? owner.name : '',
      t.startDate ?? '',
      t.eta ?? '',
      t.estimatedHours?.toString() ?? '',
      t.actualHours?.toFixed(2) ?? '0',
      `"${t.tags.join(', ')}"`,
    ]
  })
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${project.name.replace(/\s+/g, '-')}-tasks.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success('Tasks CSV downloaded')
}

function exportProjectSummary(project: Project) {
  const tasks = project.tasks ?? []
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const blocked = tasks.filter(t => t.status === 'blocked').length
  const milestones = project.milestones ?? []
  const risks = project.risks ?? []

  const text = [
    `PROJECT SUMMARY: ${project.name}`,
    `${'='.repeat(50)}`,
    `Description: ${project.description ?? 'None'}`,
    `Type: ${project.type} | Status: ${project.status}`,
    `Created: ${fmtDate(project.createdAt)}`,
    project.startDate ? `Timeline: ${fmtDate(project.startDate)} → ${project.endDate ? fmtDate(project.endDate) : 'Ongoing'}` : '',
    ``,
    `TASKS (${total} total)`,
    `  Done: ${done}`,
    `  In Progress: ${inProgress}`,
    `  Blocked: ${blocked}`,
    `  Todo: ${tasks.filter(t => t.status === 'todo').length}`,
    ``,
    `MILESTONES (${milestones.length})`,
    ...milestones.map(m => `  [${m.status}] ${m.title} — ${m.dueDate}`),
    ``,
    `RISKS (${risks.length})`,
    ...risks.map(r => `  [${r.status}] ${r.title} (Score: ${riskScore(r)})`),
    ``,
    `Team: ${project.members.length} members`,
    project.budget ? `Budget: $${project.budget.toLocaleString()} (Spent: $${(project.spentBudget ?? 0).toLocaleString()})` : '',
  ].filter(Boolean).join('\n')

  navigator.clipboard.writeText(text).then(() => toast.success('Summary copied to clipboard!'))
}

// ── PROJECT DETAIL ────────────────────────────────────────────────────────────

function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  const { updateProject, removeProject, addActivityLog, profile } = useStore()
  const members = useStore(s => s.workspace.members)
  const actorName = profile?.name ?? 'You'
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'milestones' | 'risks' | 'activity' | 'workload'>('overview')
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(project.name)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const daysLeft = daysFromNow(project.endDate)
  const health = computeHealthScore(project)
  const { color: healthColor } = healthLabel(health)

  useEffect(() => { setNameVal(project.name) }, [project.name])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function saveProjectName() {
    if (nameVal.trim() && nameVal.trim() !== project.name) {
      updateProject(project.id, { name: nameVal.trim() })
      addActivityLog(project.id, buildActivity(actorName, 'renamed project', 'project', nameVal.trim()))
    }
    setEditingName(false)
  }

  function handleDeleteProject() {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return
    removeProject(project.id)
    toast.success('Project deleted')
    onBack()
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: `Tasks (${project.tasks?.length ?? 0})` },
    { key: 'milestones', label: `Milestones (${project.milestones?.length ?? 0})` },
    { key: 'risks', label: `Risks (${project.risks?.length ?? 0})` },
    { key: 'activity', label: 'Activity' },
    { key: 'workload', label: 'Workload' },
  ] as const

  const statusOpts: ProjectStatus[] = ['planning', 'active', 'on-hold', 'completed', 'cancelled']

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '6px 10px' }}><ArrowLeft size={15} /></button>
        <div style={{ width: 4, height: 36, borderRadius: 4, background: project.color, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingName
            ? <input className="field" style={{ fontSize: 20, fontWeight: 800, background: 'transparent', padding: '2px 8px', maxWidth: 400 }} value={nameVal} onChange={e => setNameVal(e.target.value)} onBlur={saveProjectName} onKeyDown={e => e.key === 'Enter' && saveProjectName()} autoFocus />
            : <h1 style={{ fontSize: 20, fontWeight: 800 }}>{project.name}</h1>}
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditingName(!editingName)}><Edit2 size={13} /></button>
          <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', textTransform: 'capitalize' }}>{project.type}</span>
          {/* Health dot */}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} title={`Health: ${health}`} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {daysLeft !== null && (
            <span style={{ fontSize: 12, color: daysLeft < 0 ? '#ef4444' : daysLeft < 7 ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </span>
          )}
          <select className="field" style={{ width: 130, padding: '5px 10px', fontSize: 12 }} value={project.status}
            onChange={e => { updateProject(project.id, { status: e.target.value as ProjectStatus }); addActivityLog(project.id, buildActivity(actorName, `set status to ${e.target.value}`, 'project', project.name)) }}>
            {statusOpts.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>

          {/* Export dropdown */}
          <div ref={exportRef} style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setExportOpen(v => !v)}>
              <Download size={13} /> Export <ChevronDown size={11} />
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={SPRING}
                  style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: 6, zIndex: 50, minWidth: 180 }}>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }}
                    onClick={() => { exportTasksCSV(project, members); setExportOpen(false) }}>
                    <BarChart2 size={12} /> Tasks as CSV
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 12 }}
                    onClick={() => { exportProjectSummary(project); setExportOpen(false) }}>
                    <FileText size={12} /> Copy Summary
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleDeleteProject}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ paddingLeft: 28 }}>
        {TABS.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={PAGE}>
            {activeTab === 'overview' && <ProjectOverview project={project} />}
            {activeTab === 'tasks' && <TasksPanel project={project} />}
            {activeTab === 'milestones' && <MilestonesPanel project={project} />}
            {activeTab === 'risks' && <RisksPanel project={project} />}
            {activeTab === 'activity' && <ActivityPanel project={project} />}
            {activeTab === 'workload' && <WorkloadView project={project} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── PROJECT CARD ──────────────────────────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const members = useStore(s => s.workspace.members)
  const health = computeHealthScore(project)
  const { color: healthColor } = healthLabel(health)
  const tasks = project.tasks ?? []
  const done = tasks.filter(t => t.status === 'done').length
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
  const daysLeft = daysFromNow(project.endDate)
  const projectMembers = members.filter(m => project.members.includes(m.id)).slice(0, 4)
  const overflowCount = project.members.length > 4 ? project.members.length - 4 : 0

  return (
    <motion.div className="card" style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={onClick} whileHover={{ y: -3 }} transition={SPRING}>
      <div style={{ height: 4, background: project.color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, lineHeight: 1.3 }}>{project.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', textTransform: 'capitalize', fontSize: 10 }}>{project.type}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: `${STATUS_COLORS[project.status]}15`, color: STATUS_COLORS[project.status] }}>{project.status}</span>
            </div>
          </div>
          <ProgressRing pct={pct} color={project.color} size={48} />
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={11} /> {tasks.length} tasks</span>
          {daysLeft !== null && (
            <span style={{ color: daysLeft < 0 ? '#ef4444' : daysLeft < 7 ? '#f59e0b' : '#94a3b8', fontWeight: daysLeft < 7 ? 700 : 400 }}>
              {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor }} />
            <span style={{ color: healthColor, fontWeight: 700, fontSize: 10 }}>{health}</span>
          </div>
        </div>
        {projectMembers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {projectMembers.map((m, i) => (
              <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: projectMembers.length - i }}>
                <Avatar name={m.name} size={24} color={PROJECT_COLORS[m.name.charCodeAt(0) % PROJECT_COLORS.length]} />
              </div>
            ))}
            {overflowCount > 0 && <span style={{ marginLeft: 4, fontSize: 10, color: '#4b5680' }}>+{overflowCount}</span>}
          </div>
        )}
      </div>
    </motion.div>
  )
}

const StatTile = ({ label, value, color = '#f0f4ff', icon }: { label: string; value: number; color?: string; icon: React.ReactNode }) => (
  <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{label}</div>
    </div>
  </div>
)

// ── PORTFOLIO (PROJECTS GRID) ─────────────────────────────────────────────────

function PortfolioGrid({ onSelectProject, onNew }: { onSelectProject: (p: Project) => void; onNew: () => void }) {
  const { workspace } = useStore()
  const projects = workspace.projects
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const atRiskProjects = projects.filter(p => computeHealthScore(p) <= 40).length
  const completedThisMonth = projects.filter(p => p.status === 'completed' && p.createdAt >= thisMonthStart).length

  return (
    <div style={{ padding: '28px 28px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Projects</h2>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{workspace.name} · {workspace.plan === 'pro' ? 'Pro' : 'Personal'} plan</p>
        </div>
        <button className="btn btn-blue" onClick={onNew}><Plus size={14} /> New Project</button>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatTile label="Total" value={totalProjects} color="#3b82f6" icon={<FolderKanban size={18} />} />
        <StatTile label="Active" value={activeProjects} color="#10b981" icon={<Activity size={18} />} />
        <StatTile label="At Risk" value={atRiskProjects} color="#ef4444" icon={<AlertTriangle size={18} />} />
        <StatTile label="Done This Month" value={completedThisMonth} color="#8b5cf6" icon={<Check size={18} />} />
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <FolderKanban size={40} style={{ marginBottom: 16, opacity: 0.15 }} />
          <p style={{ fontSize: 16, color: '#6b7a9a', fontWeight: 600 }}>No projects yet</p>
          <p style={{ fontSize: 13, color: '#4b5680', marginTop: 6, marginBottom: 20 }}>Create your first project to start managing work like a pro.</p>
          <button className="btn btn-blue" onClick={onNew}><Plus size={14} /> Create First Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p)} />)}
        </div>
      )}
    </div>
  )
}

// ── MY TASKS VIEW ─────────────────────────────────────────────────────────────

function MyTasksView() {
  const { workspace, smartTasks, profile } = useStore()
  const userId = profile?.name ?? ''
  const members = workspace.members
  const myProjectTasks: (ProjectTask & { projectName: string; projectColor: string })[] = []
  workspace.projects.forEach(proj => {
    const me = members.find(m => m.name === userId || m.id === userId)
    proj.tasks.forEach(t => {
      if (t.ownerId === me?.id || t.ownerId === userId) {
        myProjectTasks.push({ ...t, projectName: proj.name, projectColor: proj.color })
      }
    })
  })
  const linkedSmartTasks = smartTasks.filter(st => st.projectId)

  return (
    <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>My Tasks</h2>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>All tasks assigned to you across all projects.</p>
      </div>
      {myProjectTasks.length === 0 && linkedSmartTasks.length === 0 && (
        <div className="empty-state"><User size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No tasks assigned to you yet.</p></div>
      )}
      {myProjectTasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p className="sec-label" style={{ marginBottom: 12 }}>Project Tasks ({myProjectTasks.length})</p>
          <div className="card" style={{ overflow: 'hidden' }}>
            {myProjectTasks.map(t => {
              const days = daysFromNow(t.eta)
              const isOverdue = days !== null && days < 0 && t.status !== 'done'
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(59,130,246,0.07)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{t.title}</span>
                  <div style={{ width: 3, height: 16, borderRadius: 2, background: t.projectColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#4b5680' }}>{t.projectName}</span>
                  {t.eta && <span style={{ fontSize: 11, color: isOverdue ? '#ef4444' : '#94a3b8', fontWeight: isOverdue ? 700 : 400 }}>{isOverdue ? `Overdue ${Math.abs(days!)}d` : `${days}d`}</span>}
                  <span className="badge" style={{ background: `${TASK_STATUS_COLORS[t.status]}20`, color: TASK_STATUS_COLORS[t.status] }}>{t.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {linkedSmartTasks.length > 0 && (
        <div>
          <p className="sec-label" style={{ marginBottom: 12 }}>Smart Tasks — Linked to Projects ({linkedSmartTasks.length})</p>
          <div className="card" style={{ overflow: 'hidden' }}>
            {linkedSmartTasks.map(st => {
              const proj = workspace.projects.find(p => p.id === st.projectId)
              return (
                <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(59,130,246,0.07)' }}>
                  <Zap size={12} color="#f59e0b" />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{st.title}</span>
                  <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 10, fontWeight: 700 }}>Smart</span>
                  {proj && <span style={{ fontSize: 11, color: '#4b5680' }}>{proj.name}</span>}
                  <span className="badge" style={{ background: `${TASK_STATUS_COLORS[st.status]}20`, color: TASK_STATUS_COLORS[st.status] }}>{st.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TEAM VIEW ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member', viewer: 'Viewer' }
const ROLE_COLORS: Record<string, string> = { owner: '#f59e0b', admin: '#ec4899', member: '#3b82f6', viewer: '#6b7a9a' }

function TeamView() {
  const { workspace, addTeamMember, updateTeamMember, removeTeamMember, updateProject } = useStore()
  const members = workspace.members
  const projects = workspace.projects
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'member' })
  const [editRole, setEditRole] = useState<string>('member')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')

  function handleAdd() {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email required'); return }
    addTeamMember({ id: uid(), name: form.name.trim(), email: form.email.trim(), role: form.role as TeamMember['role'], joinedAt: new Date().toISOString() })
    toast.success(`${form.name} added`)
    setForm({ name: '', email: '', role: 'member' })
    setShowAdd(false)
  }

  function handleRemove(id: string) {
    projects.forEach(p => { if (p.members.includes(id)) updateProject(p.id, { members: p.members.filter(m => m !== id) }) })
    removeTeamMember(id)
    setConfirmRemove(null)
    toast.success('Member removed')
  }

  function toggleMemberProject(memberId: string, projectId: string) {
    const proj = projects.find(p => p.id === projectId)
    if (!proj) return
    const isMember = proj.members.includes(memberId)
    updateProject(projectId, { members: isMember ? proj.members.filter(m => m !== memberId) : [...proj.members, memberId] })
    toast.success(isMember ? 'Removed from project' : 'Added to project')
  }

  function handleInvite() {
    if (!inviteEmail.trim()) return
    toast.success(`Invite sent to ${inviteEmail}!`)
    setInviteEmail('')
  }

  function getMemberStats(memberId: string) {
    let taskCount = 0; let doneCount = 0; let loggedHours = 0
    projects.forEach(p => {
      p.tasks.forEach(t => {
        if (t.ownerId === memberId) {
          taskCount++
          if (t.status === 'done') doneCount++
          loggedHours += t.actualHours ?? 0
        }
      })
    })
    return { taskCount, doneCount, loggedHours }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', margin: 0 }}>Workspace Team</h2>
          <div style={{ fontSize: 12, color: '#4b5680', marginTop: 3 }}>
            {members.length} member{members.length !== 1 ? 's' : ''} · {workspace.plan === 'pro' ? 'Pro' : 'Personal'} plan
          </div>
        </div>
        <button className="btn btn-blue btn-sm" onClick={() => setShowAdd(v => !v)}><Plus size={13} /> Add Member</button>
      </div>

      {/* Invite */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input className="field" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
          placeholder="Invite by email address…" onKeyDown={e => e.key === 'Enter' && handleInvite()} style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={handleInvite}>Send Invite</button>
      </div>

      {/* Add member form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 14 }}>New Team Member</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="field" style={{ flex: '1 1 160px' }} />
              <input placeholder="Email *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="field" style={{ flex: '1 1 200px' }} />
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="field" style={{ flex: '0 0 120px' }}>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-blue btn-sm" onClick={handleAdd}>Add Member</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {members.length === 0 ? (
        <div className="empty-state"><Users size={28} style={{ marginBottom: 10, opacity: 0.3 }} /><p>No team members yet. Add your first member.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {members.map(m => {
            const isEditing = editId === m.id
            const stats = getMemberStats(m.id)

            return (
              <motion.div key={m.id} layout className="card" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <Avatar name={m.name} size={44} color={PROJECT_COLORS[m.name.charCodeAt(0) % PROJECT_COLORS.length]} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{m.name}</span>
                      {isEditing ? (
                        <select value={editRole} onChange={e => setEditRole(e.target.value)} className="field" style={{ width: 100, padding: '3px 8px', fontSize: 11 }}>
                          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: `${ROLE_COLORS[m.role] ?? '#4b5680'}18`, color: ROLE_COLORS[m.role] ?? '#94a3b8' }}>{ROLE_LABELS[m.role] ?? m.role}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 10 }}>{m.email}</p>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={11} /> {stats.taskCount} tasks</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} color="#10b981" /> {stats.doneCount} done</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {stats.loggedHours.toFixed(1)}h logged</span>
                    </div>
                    {/* Project assignments */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {projects.map(p => {
                        const assigned = p.members.includes(m.id)
                        return (
                          <button key={p.id} onClick={() => toggleMemberProject(m.id, p.id)}
                            style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 150ms', background: assigned ? `${p.color}22` : 'transparent', border: `1.5px solid ${assigned ? p.color : 'rgba(59,130,246,0.2)'}`, color: assigned ? p.color : '#4b5680' }}>
                            {assigned ? '✓ ' : '+ '}{p.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {isEditing ? (
                      <>
                        <button className="btn btn-blue btn-sm" onClick={() => { updateTeamMember(m.id, { role: editRole as TeamMember['role'] }); setEditId(null); toast.success('Role updated') }}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(m.id); setEditRole(m.role) }}><Edit2 size={12} /></button>
                        <button onClick={() => setConfirmRemove(m.id)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={12} /></button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Confirm remove */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => setConfirmRemove(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} transition={SPRING}
              className="card" style={{ padding: 28, width: 340 }} onClick={e => e.stopPropagation()}>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Remove member?</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>They'll be removed from all projects.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmRemove(null)}>Cancel</button>
                <button onClick={() => handleRemove(confirmRemove!)}
                  style={{ flex: 1, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 10, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Remove</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ROOT: ProjectManager ──────────────────────────────────────────────────────

export function ProjectManager() {
  const { workspace } = useStore()
  const [mainTab, setMainTab] = useState<'projects' | 'my-tasks' | 'team'>('projects')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showNewProject, setShowNewProject] = useState(false)

  // Keep selectedProject in sync with store
  const selectedProject = workspace.projects.find(p => p.id === selectedProjectId) ?? null

  // Deselect project if it gets deleted
  useEffect(() => {
    if (selectedProjectId && !workspace.projects.some(p => p.id === selectedProjectId)) {
      setSelectedProjectId(null)
    }
  }, [workspace.projects, selectedProjectId, setSelectedProjectId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#080810' }}>
      {/* Top bar */}
      <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', gap: 0, background: '#0d0d1a', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 24, borderRight: '1px solid rgba(59,130,246,0.1)', marginRight: 8 }}>
          <FolderKanban size={18} color="#3b82f6" />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff' }}>Projects</span>
        </div>
        <div className="tab-bar" style={{ border: 'none', flex: 1 }}>
          {([
            { key: 'projects', label: 'Projects', count: workspace.projects.length },
            { key: 'my-tasks', label: 'My Tasks', count: null },
            { key: 'team', label: 'Team', count: workspace.members.length },
          ] as const).map(t => (
            <button key={t.key} className={`tab ${mainTab === t.key ? 'active' : ''}`}
              onClick={() => { setMainTab(t.key); setSelectedProjectId(null) }}>
              {t.label}
              {t.count !== null && t.count > 0 && (
                <span style={{ marginLeft: 5, padding: '1px 6px', background: mainTab === t.key ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)', borderRadius: 10, fontSize: 10, fontWeight: 700, color: mainTab === t.key ? '#3b82f6' : '#4b5680' }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        {mainTab === 'projects' && !selectedProject && (
          <button className="btn btn-blue btn-sm" onClick={() => setShowNewProject(true)} style={{ marginLeft: 'auto' }}>
            <Plus size={13} /> New Project
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {mainTab === 'projects' && !selectedProject && (
            <motion.div key="portfolio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={PAGE} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <PortfolioGrid onSelectProject={p => setSelectedProjectId(p.id)} onNew={() => setShowNewProject(true)} />
            </motion.div>
          )}
          {mainTab === 'projects' && selectedProject && (
            <motion.div key={`project-${selectedProject.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={PAGE} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <ProjectDetail project={selectedProject} onBack={() => setSelectedProjectId(null)} />
            </motion.div>
          )}
          {mainTab === 'my-tasks' && (
            <motion.div key="my-tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={PAGE} style={{ flex: 1 }}>
              <MyTasksView />
            </motion.div>
          )}
          {mainTab === 'team' && (
            <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={PAGE} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TeamView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
      </AnimatePresence>
    </div>
  )
}
