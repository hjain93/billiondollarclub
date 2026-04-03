import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  Search, LayoutDashboard, Lightbulb, Calendar, ListTodo,
  Wand2, BarChart3, Zap, Dna, Briefcase, Target,
  DollarSign, FileText, Sparkles, FolderKanban, CheckSquare,
  Inbox, GitBranch, ArrowRight,
} from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  description?: string
  category: string
  icon: React.ComponentType<{ size: number; color?: string }>
  action: () => void
  keywords: string[]
  shortcut?: string
}

const VIEW_ITEMS = [
  { id: 'command-center', label: 'Command Center', icon: LayoutDashboard, desc: 'Dashboard overview' },
  { id: 'ops-hq', label: 'Ops HQ', icon: Sparkles, desc: 'Workflow runs, memory and outcomes' },
  { id: 'idea-engine', label: 'Idea Engine', icon: Lightbulb, desc: 'AI content ideas' },
  { id: 'calendar', label: 'Content Calendar', icon: Calendar, desc: 'Schedule & plan posts' },
  { id: 'planner', label: 'Daily Planner', icon: ListTodo, desc: 'Time-block your day' },
  { id: 'studio', label: 'Creation Studio', icon: Wand2, desc: 'Script, caption, hashtags' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Performance metrics' },
  { id: 'trends', label: 'Trend Radar', icon: Zap, desc: 'Viral trend detection' },
  { id: 'content-dna', label: 'Content DNA', icon: Dna, desc: 'Voice & pattern analysis' },
  { id: 'brand-deals', label: 'Brand Deals', icon: Briefcase, desc: 'Sponsorship pipeline' },
  { id: 'goals', label: 'Goals', icon: Target, desc: 'Growth targets' },
  { id: 'income', label: 'Income Tracker', icon: DollarSign, desc: 'Revenue & earnings' },
  { id: 'templates', label: 'Templates', icon: FileText, desc: 'Content frameworks' },
  { id: 'visual-prompts', label: 'Visual Prompts', icon: Sparkles, desc: 'AI image generation' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, desc: 'Project management' },
  { id: 'tasks', label: 'Smart Tasks', icon: CheckSquare, desc: 'Task manager' },
  { id: 'inbox', label: 'Smart Inbox', icon: Inbox, desc: 'AI-triaged notifications' },
  { id: 'pipeline', label: 'Content Pipeline', icon: GitBranch, desc: 'Content production kanban' },
  { id: 'client-portal', label: 'Client Portal', icon: Inbox, desc: 'Shareable project links' },
  { id: 'video-brief', label: 'Video Brief Studio', icon: Wand2, desc: 'Full production brief generator' },
  { id: 'thumbnail-lab', label: 'Thumbnail Lab', icon: Sparkles, desc: 'AI thumbnail concept optimizer' },
  { id: 'clip-finder', label: 'Viral Clip Finder', icon: Zap, desc: 'Extract best short-form clips' },
  { id: 'brand-kit', label: 'Brand Kit', icon: LayoutDashboard, desc: 'Visual identity management' },
  { id: 'gear-guide', label: 'Gear Guide', icon: CheckSquare, desc: 'Budget-based equipment picks' },
  { id: 'engagement', label: 'Engagement Lab', icon: Lightbulb, desc: 'Comment mining + reply generator' },
  { id: 'audit', label: 'Channel Audit', icon: BarChart3, desc: 'AI-powered channel analysis' },
  { id: 'monetize', label: 'Monetize', icon: DollarSign, desc: 'Revenue intelligence dashboard' },
  { id: 'pre-publish', label: 'Pre-Publish Score', icon: Target, desc: 'Score content before publishing' },
  { id: 'growth-sim', label: 'Growth Simulator', icon: BarChart3, desc: 'Forecast your creator growth' },
  { id: 'competitor-radar', label: 'Competitor Radar', icon: Zap, desc: 'Track competitor creators' },
  { id: 'creator-crm', label: 'Creator CRM', icon: CheckSquare, desc: 'Manage your superfans' },
  { id: 'repurpose', label: 'Repurpose Engine', icon: Wand2, desc: '1 post → 10 platform formats' },
  { id: 'invoices', label: 'Invoices & Contracts', icon: FileText, desc: 'Branded invoices, GST, contracts' },
  { id: 'chief-of-staff', label: 'AI Chief of Staff', icon: Sparkles, desc: 'Ambient intelligence & daily briefing' },
  { id: 'autopilot', label: 'Creator Autopilot', icon: Zap, desc: 'AI drafts your calendar, you approve' },
  { id: 'ab-lab', label: 'A/B Lab', icon: BarChart3, desc: 'Scientific content split testing' },
  { id: 'collab', label: 'Collab Mode', icon: CheckSquare, desc: 'Team workspace & content review' },
]

export function CommandPalette() {
  const { setView, ideas, smartTasks, workspace, calendarPosts, brandDeals } = useStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery('')
        setSelectedIdx(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = []

    // Navigation items
    VIEW_ITEMS.forEach((v) => {
      items.push({
        id: `nav-${v.id}`,
        label: v.label,
        description: v.desc,
        category: 'Navigate',
        icon: v.icon,
        action: () => { setView(v.id); setOpen(false) },
        keywords: [v.label.toLowerCase(), v.desc?.toLowerCase() || '', v.id],
      })
    })

    // Ideas
    ideas.slice(0, 20).forEach((idea) => {
      items.push({
        id: `idea-${idea.id}`,
        label: idea.title,
        description: `Score: ${idea.aiScore} · ${idea.status}`,
        category: 'Ideas',
        icon: Lightbulb,
        action: () => { setView('idea-engine'); setOpen(false) },
        keywords: ['idea', idea.title.toLowerCase(), ...idea.tags],
      })
    })

    // Smart Tasks
    smartTasks.filter(t => t.status !== 'done').slice(0, 20).forEach((task) => {
      items.push({
        id: `task-${task.id}`,
        label: task.title,
        description: `${task.priority} priority · ${task.status}`,
        category: 'Tasks',
        icon: CheckSquare,
        action: () => { setView('tasks'); setOpen(false) },
        keywords: ['task', task.title.toLowerCase(), task.priority, task.status, ...task.tags],
      })
    })

    // Projects
    workspace.projects.forEach((project) => {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        description: `${project.status} · ${project.tasks.length} tasks`,
        category: 'Projects',
        icon: FolderKanban,
        action: () => { setView('projects'); setOpen(false) },
        keywords: ['project', project.name.toLowerCase(), project.status],
      })
    })

    // Brand deals
    brandDeals.slice(0, 10).forEach((deal) => {
      items.push({
        id: `deal-${deal.id}`,
        label: deal.brand,
        description: `₹${deal.value.toLocaleString()} · ${deal.status}`,
        category: 'Brand Deals',
        icon: Briefcase,
        action: () => { setView('brand-deals'); setOpen(false) },
        keywords: ['deal', 'brand', deal.brand.toLowerCase(), deal.status],
      })
    })

    // Calendar posts (upcoming)
    calendarPosts
      .filter(p => p.status !== 'published')
      .slice(0, 10)
      .forEach((post) => {
        items.push({
          id: `post-${post.id}`,
          label: post.title,
          description: `${post.platform} · ${post.scheduledAt}`,
          category: 'Calendar',
          icon: Calendar,
          action: () => { setView('calendar'); setOpen(false) },
          keywords: ['post', post.title.toLowerCase(), post.platform, post.status],
        })
      })

    return items
  }, [ideas, smartTasks, workspace.projects, brandDeals, calendarPosts, setView])

  const filtered = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 12)
    const q = query.toLowerCase()
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
    ).slice(0, 20)
  }, [allItems, query])

  const grouped = useMemo(() => {
    const map: Record<string, PaletteItem[]> = {}
    filtered.forEach((item) => {
      if (!map[item.category]) map[item.category] = []
      map[item.category].push(item)
    })
    return map
  }, [filtered])

  const flatFiltered = filtered

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, flatFiltered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (flatFiltered[selectedIdx]) {
        flatFiltered[selectedIdx].action()
      }
    }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIdx])

  if (!open) return null

  const categoryColors: Record<string, string> = {
    Navigate: '#3b82f6',
    Ideas: '#f59e0b',
    Tasks: '#10b981',
    Projects: '#a78bfa',
    'Brand Deals': '#ec4899',
    Calendar: '#06b6d4',
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.8)',
          backdropFilter: 'blur(4px)', zIndex: 9999,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: '12vh',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 640, maxWidth: '90vw',
            background: '#0d0d1a',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Search input */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid rgba(59,130,246,0.1)',
          }}>
            <Search size={18} color="#6b7a9a" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search views, tasks, ideas, projects…"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 15, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 500,
              }}
            />
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#4b5680',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '3px 7px', letterSpacing: '0.05em',
            }}>
              ESC
            </div>
          </div>

          {/* Results */}
          <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#4b5680', fontSize: 13 }}>
                No results found for "{query}"
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div style={{
                    padding: '8px 18px 4px',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: categoryColors[category] || '#4b5680',
                  }}>
                    {category}
                  </div>
                  {items.map((item) => {
                    const globalIdx = flatFiltered.indexOf(item)
                    const isSelected = globalIdx === selectedIdx
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        data-idx={globalIdx}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIdx(globalIdx)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 18px', border: 'none', cursor: 'pointer',
                          background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                          transition: 'background 100ms',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={15} color={isSelected ? '#3b82f6' : '#6b7a9a'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600,
                            color: isSelected ? '#f0f4ff' : '#94a3b8',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div style={{
                              fontSize: 11, color: '#4b5680',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                        {isSelected && <ArrowRight size={14} color="#3b82f6" />}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '10px 18px',
            borderTop: '1px solid rgba(59,130,246,0.08)',
          }}>
            {[
              { key: '↑↓', label: 'navigate' },
              { key: '↵', label: 'select' },
              { key: 'ESC', label: 'close' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#4b5680',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4, padding: '2px 5px',
                }}>
                  {key}
                </span>
                <span style={{ fontSize: 10, color: '#4b5680' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#2a3050', fontWeight: 700 }}>
              {flatFiltered.length} results
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
