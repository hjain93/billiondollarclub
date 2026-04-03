import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Bell, BellOff, TrendingUp, AlertTriangle, Zap, Target,
  Check, ChevronRight, Star,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type NotifCategory = 'trending' | 'deadline' | 'milestone' | 'insight' | 'opportunity' | 'warning'

interface SmartNotification {
  id: string
  category: NotifCategory
  title: string
  body: string
  timestamp: string
  read: boolean
  actionLabel?: string
  actionView?: string
  priority: 'high' | 'medium' | 'low'
  icon: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<NotifCategory, { color: string; bg: string; label: string }> = {
  trending:    { color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  label: 'Trending'     },
  deadline:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Deadline'     },
  milestone:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Milestone'    },
  insight:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Insight'      },
  opportunity: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Opportunity'  },
  warning:     { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    label: 'Warning'      },
}


const STORAGE_KEY = 'creator-notifications'

// ── Demo Notifications ─────────────────────────────────────────────────────────

const DEMO_NOTIFICATIONS: SmartNotification[] = [
  {
    id: 'n1',
    category: 'trending',
    title: 'Trending in your niche',
    body: 'AI tools for creators is trending in India right now. 3 competitors posted about it today. Strike while it\'s hot.',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    read: false,
    actionLabel: 'View Trends',
    actionView: 'trends',
    priority: 'high',
    icon: 'TrendingUp',
  },
  {
    id: 'n2',
    category: 'deadline',
    title: 'Brand deal deadline in 2 days',
    body: 'Mamaearth collab — sponsored reel due on Mar 26. You haven\'t uploaded yet.',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
    actionLabel: 'View Deal',
    actionView: 'brand-deals',
    priority: 'high',
    icon: 'AlertTriangle',
  },
  {
    id: 'n3',
    category: 'opportunity',
    title: 'High-potential idea waiting',
    body: '"5 AI Tools Every Creator Needs" scored 92/100. It\'s been sitting in your inbox for 3 days.',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: false,
    actionLabel: 'View Idea',
    actionView: 'idea-engine',
    priority: 'high',
    icon: 'Zap',
  },
  {
    id: 'n4',
    category: 'milestone',
    title: 'Revenue milestone reached!',
    body: 'You\'ve crossed ₹50,000 this month — 83% of your ₹60K monthly goal. You\'re on track.',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    read: false,
    actionLabel: 'View Income',
    actionView: 'income-tracker',
    priority: 'medium',
    icon: 'Target',
  },
  {
    id: 'n5',
    category: 'warning',
    title: 'Task overdue',
    body: '"Edit Ladakh vlog B-roll" was due yesterday and is still in progress. Update or reschedule.',
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    read: true,
    actionLabel: 'View Tasks',
    actionView: 'planner',
    priority: 'medium',
    icon: 'AlertTriangle',
  },
  {
    id: 'n6',
    category: 'insight',
    title: 'Your best posting time is 7–9 PM',
    body: 'Based on your last 30 posts, Reels published between 7–9 PM IST get 2.4x more reach in the first hour.',
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    read: true,
    actionLabel: 'View Analytics',
    actionView: 'analytics',
    priority: 'low',
    icon: 'Star',
  },
  {
    id: 'n7',
    category: 'opportunity',
    title: 'High-potential idea waiting',
    body: '"How I Grew to 100K with 0 Paid Ads" scored 89/100. Don\'t let great ideas go stale.',
    timestamp: new Date(Date.now() - 18 * 3600000).toISOString(),
    read: true,
    actionLabel: 'View Idea',
    actionView: 'idea-engine',
    priority: 'medium',
    icon: 'Zap',
  },
  {
    id: 'n8',
    category: 'deadline',
    title: 'Content scheduled for today',
    body: '"Creator Economy 2025" LinkedIn post is scheduled for 12:00 PM today. Ready to go?',
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
    actionLabel: 'View Calendar',
    actionView: 'calendar',
    priority: 'low',
    icon: 'Clock',
  },
]

// ── Notification Generator ─────────────────────────────────────────────────────

function generateNotifications(store: {
  smartTasks: { id: string; title: string; dueDate?: string; status: string }[]
  brandDeals: { id: string; brand: string; deadline?: string; status: string }[]
  ideas: { id: string; title: string; aiScore: number; status: string }[]
  incomeEntries: { amount: number }[]
  monthlyIncomeTarget: number
}): SmartNotification[] {
  const today = new Date().toISOString().split('T')[0]
  const notifs: SmartNotification[] = []

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.ceil(diff / 86400000)
  }

  // Overdue tasks
  store.smartTasks
    .filter(t => t.dueDate && t.dueDate < today && t.status !== 'done')
    .slice(0, 2)
    .forEach(t => {
      notifs.push({
        id: `gen-task-${t.id}`,
        category: 'warning',
        title: 'Task overdue',
        body: `"${t.title}" is past its due date. Reschedule or mark complete.`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        read: false,
        actionLabel: 'View Tasks',
        actionView: 'planner',
        priority: 'high',
        icon: 'AlertTriangle',
      })
    })

  // Brand deal deadlines within 3 days
  store.brandDeals
    .filter(d => d.deadline && daysUntil(d.deadline) <= 3 && daysUntil(d.deadline) >= 0 && d.status !== 'completed')
    .slice(0, 2)
    .forEach(d => {
      notifs.push({
        id: `gen-deal-${d.id}`,
        category: 'deadline',
        title: 'Deal deadline approaching',
        body: `${d.brand} — deadline in ${daysUntil(d.deadline ?? '')} day${daysUntil(d.deadline ?? '') !== 1 ? 's' : ''}.`,
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        read: false,
        actionLabel: 'View Deal',
        actionView: 'brand-deals',
        priority: 'high',
        icon: 'AlertTriangle',
      })
    })

  // High-score ideas not acted on
  store.ideas
    .filter(i => i.aiScore >= 8.5 && i.status === 'inbox')
    .slice(0, 2)
    .forEach(i => {
      notifs.push({
        id: `gen-idea-${i.id}`,
        category: 'opportunity',
        title: 'High-potential idea waiting',
        body: `"${i.title.slice(0, 55)}..." scored ${i.aiScore}/10. Don't let it sit.`,
        timestamp: new Date(Date.now() - Math.random() * 10800000).toISOString(),
        read: false,
        actionLabel: 'View Idea',
        actionView: 'idea-engine',
        priority: 'medium',
        icon: 'Zap',
      })
    })

  // Income milestone
  const totalIncome = store.incomeEntries.reduce((s, e) => s + e.amount, 0)
  if (store.monthlyIncomeTarget > 0 && totalIncome > 0) {
    const pct = Math.round((totalIncome / store.monthlyIncomeTarget) * 100)
    if (pct >= 80 && pct < 100) {
      notifs.push({
        id: 'gen-income-milestone',
        category: 'milestone',
        title: `${pct}% of monthly income goal`,
        body: `You've earned ₹${totalIncome.toLocaleString()} of your ₹${store.monthlyIncomeTarget.toLocaleString()} target this month.`,
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        read: false,
        actionLabel: 'View Income',
        actionView: 'income-tracker',
        priority: 'medium',
        icon: 'Target',
      })
    }
  }

  return notifs
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryIcon({ category, size = 14 }: { category: NotifCategory; size?: number }) {
  const cfg = CATEGORY_CONFIG[category]
  const iconMap: Record<NotifCategory, React.ComponentType<{ size?: number; color?: string }>> = {
    trending:    TrendingUp,
    deadline:    AlertTriangle,
    milestone:   Target,
    insight:     Star,
    opportunity: Zap,
    warning:     AlertTriangle,
  }
  const Icon = iconMap[category]
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8, background: cfg.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      border: `1px solid ${cfg.color}25`,
    }}>
      <Icon size={size} color={cfg.color} />
    </div>
  )
}

function NotificationCard({
  notif, onRead, onNavigate,
}: {
  notif: SmartNotification
  onRead: (id: string) => void
  onNavigate: (view: string | undefined, id: string) => void
}) {
  const cfg = CATEGORY_CONFIG[notif.category]
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      onClick={() => onRead(notif.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 10, padding: '12px 14px',
        background: hovered ? 'rgba(59,130,246,0.04)' : notif.read ? 'transparent' : 'rgba(59,130,246,0.02)',
        borderBottom: '1px solid rgba(59,130,246,0.06)',
        cursor: 'pointer', transition: 'background 150ms', position: 'relative',
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)',
          width: 5, height: 5, borderRadius: '50%', background: '#3b82f6',
          boxShadow: '0 0 4px rgba(59,130,246,0.6)',
        }} />
      )}

      <CategoryIcon category={notif.category} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
          <div>
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: cfg.color,
              background: cfg.bg, borderRadius: 4, padding: '1px 5px',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{cfg.label}</span>
          </div>
          <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>
            {relativeTime(notif.timestamp)}
          </span>
        </div>

        <p style={{ margin: '2px 0 4px', fontSize: 12.5, fontWeight: 700, color: notif.read ? '#7a87aa' : '#f0f4ff', lineHeight: 1.35 }}>
          {notif.title}
        </p>
        <p style={{
          margin: '0 0 6px', fontSize: 11.5, color: '#4b5680', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {notif.body}
        </p>

        {notif.actionLabel && (
          <button
            onClick={e => { e.stopPropagation(); onNavigate(notif.actionView, notif.id) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 11, fontWeight: 700, color: '#3b82f6',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            {notif.actionLabel} <ChevronRight size={10} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Main Exports ───────────────────────────────────────────────────────────────

export function NotificationIntelligence() {
  return <NotificationBell />
}

export function NotificationBell() {
  const store = useStore()
  const { setView, smartTasks, brandDeals, ideas, incomeEntries, monthlyIncomeTarget } = store

  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | NotifCategory>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  // Load/persist notifications
  const [notifications, setNotifications] = useState<SmartNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEMO_NOTIFICATIONS
  })

  // Generate dynamic notifications from store and merge
  useEffect(() => {
    const generated = generateNotifications({ smartTasks, brandDeals, ideas, incomeEntries, monthlyIncomeTarget })
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id))
      const newOnes = generated.filter(n => !existingIds.has(n.id))
      if (newOnes.length === 0) return prev
      const merged = [...newOnes, ...prev].slice(0, 50)
      return merged
    })
  }, [smartTasks, brandDeals, ideas, incomeEntries, monthlyIncomeTarget])

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.read).length
  const hasHighPriorityUnread = notifications.some(n => !n.read && n.priority === 'high')

  const filteredNotifs = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeFilter)

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleNavigate(view: string | undefined, notifId: string) {
    markRead(notifId)
    if (view) setView(view)
    setIsOpen(false)
  }

  const filterTabs: { id: 'all' | NotifCategory; label: string }[] = [
    { id: 'all',         label: 'All' },
    { id: 'trending',    label: 'Trending' },
    { id: 'deadline',    label: 'Deadlines' },
    { id: 'insight',     label: 'Insights' },
  ]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9,
          background: isOpen ? 'rgba(59,130,246,0.12)' : 'transparent',
          border: '1px solid rgba(59,130,246,0.1)',
          cursor: 'pointer', color: '#6b7a9a', position: 'relative', transition: 'all 140ms',
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(59,130,246,0.08)' }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Pulse ring for high priority */}
        {hasHighPriorityUnread && !isOpen && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', inset: -3, borderRadius: 12,
              border: '1.5px solid rgba(239,68,68,0.5)',
              pointerEvents: 'none',
            }}
          />
        )}

        <Bell size={15} color={unreadCount > 0 ? '#f0f4ff' : '#6b7a9a'} />

        {/* Badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14,
            borderRadius: 7, background: '#ef4444',
            border: '1.5px solid #0d0d1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: '#fff',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            padding: unreadCount > 9 ? '0 3px' : '0',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            style={{
              position: 'absolute', top: 42, right: 0, width: 350,
              maxHeight: 480, background: '#0d0d1a',
              border: '1px solid rgba(59,130,246,0.18)',
              borderRadius: 14, zIndex: 200,
              boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(59,130,246,0.05)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '13px 14px 0', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#ef4444',
                      background: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: '1px 7px',
                      border: '1px solid rgba(239,68,68,0.2)',
                    }}>{unreadCount} unread</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3, background: 'none',
                        border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 11, fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', padding: 0,
                      }}
                    >
                      <Check size={10} /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 2, paddingBottom: 0, marginBottom: 0 }}>
                {filterTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    style={{
                      padding: '5px 10px', borderRadius: '7px 7px 0 0',
                      background: activeFilter === tab.id ? '#111128' : 'transparent',
                      border: activeFilter === tab.id ? '1px solid rgba(59,130,246,0.15)' : '1px solid transparent',
                      borderBottom: activeFilter === tab.id ? '1px solid #111128' : '1px solid transparent',
                      cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
                      color: activeFilter === tab.id ? '#f0f4ff' : '#4b5680',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 120ms',
                      marginBottom: -1,
                    }}
                  >
                    {tab.label}
                    {tab.id !== 'all' && (() => {
                      const count = notifications.filter(n => n.category === tab.id && !n.read).length
                      return count > 0 ? (
                        <span style={{
                          marginLeft: 4, fontSize: 9, fontWeight: 700, color: CATEGORY_CONFIG[tab.id as NotifCategory].color,
                          background: CATEGORY_CONFIG[tab.id as NotifCategory].bg,
                          borderRadius: 8, padding: '1px 4px',
                        }}>{count}</span>
                      ) : null
                    })()}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(59,130,246,0.1)', flexShrink: 0 }} />

            {/* Notification List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AnimatePresence>
                {filteredNotifs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ padding: '32px 16px', textAlign: 'center' }}
                  >
                    <BellOff size={22} color="#2a3050" style={{ margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: 12.5, color: '#4b5680', fontWeight: 600 }}>All caught up!</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#2a3050' }}>No notifications in this category.</p>
                  </motion.div>
                ) : (
                  filteredNotifs.map(notif => (
                    <NotificationCard
                      key={notif.id}
                      notif={notif}
                      onRead={markRead}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 14px', borderTop: '1px solid rgba(59,130,246,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11.5, color: '#4b5680', fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                Notification settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
