import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Inbox, Lightbulb, Calendar, Briefcase,
  Target, Zap, Archive, Filter, RefreshCw,
  ChevronRight, Clock, AlertTriangle, TrendingUp,
  Bell, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface InboxItem {
  id: string
  type: 'overdue-task' | 'idea-stale' | 'deal-deadline' | 'goal-behind' | 'streak-risk' | 'trend-alert' | 'project-blocked' | 'no-post-today'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  body: string
  action?: { label: string; view: string }
  timestamp: string
  entityId?: string
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
}

const TYPE_ICON: Record<string, React.ComponentType<{ size: number; color?: string }>> = {
  'overdue-task': Clock,
  'idea-stale': Lightbulb,
  'deal-deadline': Briefcase,
  'goal-behind': Target,
  'streak-risk': Zap,
  'trend-alert': TrendingUp,
  'project-blocked': AlertTriangle,
  'no-post-today': Calendar,
}

const TYPE_LABEL: Record<string, string> = {
  'overdue-task': 'Overdue Task',
  'idea-stale': 'Stale Idea',
  'deal-deadline': 'Deal Deadline',
  'goal-behind': 'Goal Behind',
  'streak-risk': 'Streak Risk',
  'trend-alert': 'Trend Alert',
  'project-blocked': 'Blocked Project',
  'no-post-today': 'No Post Today',
}

export function SmartInbox() {
  const {
    smartTasks, ideas, brandDeals, calendarPosts,
    workspace, dismissedInboxIds, dismissInboxItem, clearDismissedInbox,
    setView,
  } = useStore()

  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const inboxItems = useMemo((): InboxItem[] => {
    const items: InboxItem[] = []

    // Overdue tasks
    smartTasks
      .filter((t) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr)
      .forEach((t) => {
        const daysOverdue = Math.floor(
          (today.getTime() - new Date(t.dueDate!).getTime()) / 86400000
        )
        items.push({
          id: `overdue-${t.id}`,
          type: 'overdue-task',
          priority: daysOverdue >= 3 ? 'critical' : 'high',
          title: `"${t.title}" is overdue`,
          body: `This task was due ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} ago. Update its status or reschedule.`,
          action: { label: 'Open Tasks', view: 'tasks' },
          timestamp: t.dueDate!,
          entityId: t.id,
        })
      })

    // Project blocked tasks
    workspace.projects.forEach((project) => {
      const blocked = project.tasks.filter((t) => t.status === 'blocked')
      if (blocked.length > 0) {
        items.push({
          id: `blocked-${project.id}`,
          type: 'project-blocked',
          priority: 'high',
          title: `${blocked.length} task${blocked.length > 1 ? 's' : ''} blocked in "${project.name}"`,
          body: `Blocked: ${blocked.map((t) => t.title).join(', ')}. Review and unblock to maintain velocity.`,
          action: { label: 'Open Projects', view: 'projects' },
          timestamp: new Date().toISOString(),
          entityId: project.id,
        })
      }
    })

    // Deal deadlines within 3 days
    brandDeals
      .filter((d) => d.status !== 'completed' && d.status !== 'declined' && d.deadline)
      .forEach((d) => {
        const daysLeft = Math.floor(
          (new Date(d.deadline!).getTime() - today.getTime()) / 86400000
        )
        if (daysLeft <= 3 && daysLeft >= 0) {
          items.push({
            id: `deal-${d.id}`,
            type: 'deal-deadline',
            priority: daysLeft <= 1 ? 'critical' : 'high',
            title: `Brand deal with ${d.brand} due in ${daysLeft === 0 ? 'today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`}`,
            body: `Deal value: ₹${d.value.toLocaleString()}. Status: ${d.status}. Don't miss the deadline.`,
            action: { label: 'Open Brand Deals', view: 'brand-deals' },
            timestamp: d.deadline!,
            entityId: d.id,
          })
        }
      })

    // Stale ideas in inbox > 7 days
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000).toISOString()
    ideas
      .filter((i) => i.status === 'inbox' && i.createdAt < sevenDaysAgo)
      .slice(0, 3)
      .forEach((idea) => {
        items.push({
          id: `idea-stale-${idea.id}`,
          type: 'idea-stale',
          priority: 'medium',
          title: `"${idea.title}" has been in your inbox 7+ days`,
          body: `Ideas left in inbox lose momentum. Score: ${idea.aiScore}. Plan it or archive it.`,
          action: { label: 'Open Ideas', view: 'idea-engine' },
          timestamp: idea.createdAt,
          entityId: idea.id,
        })
      })

    // No post scheduled today
    const hasPostToday = calendarPosts.some((p) => p.scheduledAt === todayStr)
    if (!hasPostToday) {
      items.push({
        id: 'no-post-today',
        type: 'no-post-today',
        priority: 'medium',
        title: 'No content scheduled for today',
        body: 'Consistent posting is key to growth. Schedule something for today or pull from your idea bank.',
        action: { label: 'Open Calendar', view: 'calendar' },
        timestamp: todayStr,
      })
    }

    // No tasks for today check
    const hasTaskToday = smartTasks.some(
      (t) => t.status !== 'done' && (t.dueDate === todayStr || t.plannedDate === todayStr)
    )
    if (!hasTaskToday && smartTasks.filter((t) => t.status !== 'done').length > 0) {
      items.push({
        id: 'no-tasks-today',
        type: 'overdue-task',
        priority: 'low',
        title: 'No tasks planned for today',
        body: `You have ${smartTasks.filter((t) => t.status !== 'done').length} open tasks. Consider planning some for today in your daily planner.`,
        action: { label: 'Open Planner', view: 'planner' },
        timestamp: todayStr,
      })
    }

    return items.filter((item) => !dismissedInboxIds.includes(item.id))
  }, [smartTasks, workspace.projects, brandDeals, ideas, calendarPosts, dismissedInboxIds, todayStr])

  const filtered = filter === 'all' ? inboxItems : inboxItems.filter((i) => i.priority === filter)

  const priorityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    inboxItems.forEach((i) => counts[i.priority]++)
    return counts
  }, [inboxItems])

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg, #080810)' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Inbox size={18} color="white" />
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #f0f4ff)', margin: 0 }}>
                Smart Inbox
              </h1>
              {inboxItems.length > 0 && (
                <span style={{
                  background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700,
                }}>
                  {inboxItems.length} items
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted, #6b7a9a)', margin: 0 }}>
              AI-triaged alerts, deadlines & action items across your workspace
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={clearDismissedInbox}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} />
            Reset dismissed
          </button>
        </div>

        {/* Priority filter + counts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <Filter size={13} color="#4b5680" />
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: filter === p
                  ? (p === 'all' ? 'rgba(59,130,246,0.15)' : `rgba(${p === 'critical' ? '239,68,68' : p === 'high' ? '249,115,22' : p === 'medium' ? '245,158,11' : '59,130,246'},0.15)`)
                  : 'rgba(255,255,255,0.04)',
                color: filter === p
                  ? (p === 'all' ? '#3b82f6' : PRIORITY_COLOR[p] || '#3b82f6')
                  : '#6b7a9a',
                transition: 'all 150ms',
              }}
            >
              {p === 'all' ? `All (${inboxItems.length})` : `${p.charAt(0).toUpperCase() + p.slice(1)} (${priorityCounts[p] || 0})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Inbox list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="empty-state"
              style={{ padding: '60px 32px' }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Inbox size={28} color="#10b981" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>
                All clear!
              </div>
              <div style={{ fontSize: 13, color: '#6b7a9a' }}>
                No items need your attention right now. Keep up the great work!
              </div>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {filtered.map((item, idx) => {
                  const Icon = TYPE_ICON[item.type] || Bell
                  const pColor = PRIORITY_COLOR[item.priority]
                  const isSelected = selectedId === item.id

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => setSelectedId(isSelected ? null : item.id)}
                      style={{
                        background: isSelected ? 'rgba(59,130,246,0.06)' : 'var(--s2, #111122)',
                        border: `1px solid ${isSelected ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.08)'}`,
                        borderLeft: `3px solid ${pColor}`,
                        borderRadius: 12, padding: '14px 16px',
                        cursor: 'pointer', transition: 'all 150ms',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                          background: `rgba(${pColor === '#ef4444' ? '239,68,68' : pColor === '#f97316' ? '249,115,22' : pColor === '#f59e0b' ? '245,158,11' : '59,130,246'},0.12)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={16} color={pColor} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: pColor,
                            }}>
                              {item.priority}
                            </span>
                            <span style={{ fontSize: 10, color: '#4b5680' }}>
                              {TYPE_LABEL[item.type]}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #f0f4ff)', marginBottom: 4 }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.5 }}>
                            {item.body}
                          </div>

                          {isSelected && item.action && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              style={{ marginTop: 12, display: 'flex', gap: 8 }}
                            >
                              <button
                                className="btn btn-blue btn-sm"
                                onClick={(e) => { e.stopPropagation(); setView(item.action!.view); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <ChevronRight size={13} />
                                {item.action.label}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={(e) => { e.stopPropagation(); dismissInboxItem(item.id); setSelectedId(null); toast.success('Dismissed') }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <Archive size={13} />
                                Dismiss
                              </button>
                            </motion.div>
                          )}
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); dismissInboxItem(item.id); toast.success('Dismissed') }}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#4b5680', padding: 4, borderRadius: 6,
                            flexShrink: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right summary panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          {/* Priority breakdown */}
          <div className="card" style={{ padding: '16px', marginBottom: 14 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>Priority Breakdown</div>
            {(['critical', 'high', 'medium', 'low'] as const).map((p) => {
              const count = priorityCounts[p]
              const pct = inboxItems.length > 0 ? (count / inboxItems.length) * 100 : 0
              return (
                <div key={p} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: PRIORITY_COLOR[p] }}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7a9a' }}>{count}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      style={{ height: '100%', background: PRIORITY_COLOR[p], borderRadius: 2 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick stats */}
          <div className="card" style={{ padding: '16px' }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>Workspace Health</div>
            {[
              { label: 'Open tasks', value: smartTasks.filter(t => t.status !== 'done').length, color: '#3b82f6' },
              { label: 'Active projects', value: workspace.projects.filter(p => p.status === 'active').length, color: '#10b981' },
              { label: 'Stale ideas', value: ideas.filter(i => i.status === 'inbox').length, color: '#f59e0b' },
              { label: 'Active deals', value: brandDeals.filter(d => d.status !== 'completed' && d.status !== 'declined').length, color: '#ec4899' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.06)',
              }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'Space Mono, monospace' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
