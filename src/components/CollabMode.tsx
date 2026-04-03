import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, MessageSquare, Check, X, Plus,
  Edit3, Clock,
  GripVertical, Tag, Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

type MemberRole = 'owner' | 'editor' | 'manager' | 'designer' | 'viewer'
type ContentStatus = 'brief' | 'scripting' | 'filming' | 'editing' | 'review' | 'approved' | 'published'

interface TeamMember {
  id: string
  name: string
  role: MemberRole
  avatarColor: string
  email: string
  tasksAssigned: number
  lastActive: string
  status: 'online' | 'away' | 'offline'
}

interface Comment {
  id: string
  authorId: string
  text: string
  timestamp: string
  resolved: boolean
}

interface ContentItem {
  id: string
  title: string
  platform: string
  status: ContentStatus
  assignedTo: string[]
  dueDate: string
  comments: Comment[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

// ── Constants ──────────────────────────────────────────────────────────────────

const KANBAN_COLS: { id: ContentStatus; label: string }[] = [
  { id: 'brief',      label: 'Brief' },
  { id: 'scripting',  label: 'Scripting' },
  { id: 'filming',    label: 'Filming' },
  { id: 'editing',    label: 'Editing' },
  { id: 'review',     label: 'Review' },
  { id: 'approved',   label: 'Approved' },
  { id: 'published',  label: 'Published' },
]

const ROLE_CONFIG: Record<MemberRole, { label: string; color: string; bg: string; desc: string }> = {
  owner:    { label: 'Owner',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   desc: 'Full control over workspace' },
  manager:  { label: 'Manager',  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', desc: 'Manage team and content' },
  editor:   { label: 'Editor',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  desc: 'Create and edit content' },
  designer: { label: 'Designer', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  desc: 'Visual assets and thumbnails' },
  viewer:   { label: 'Viewer',   color: '#6b7a9a', bg: 'rgba(107,122,154,0.12)', desc: 'View-only access' },
}

const PRIORITY_CONFIG = {
  low:    { color: '#10b981', label: 'Low' },
  medium: { color: '#f59e0b', label: 'Medium' },
  high:   { color: '#f97316', label: 'High' },
  urgent: { color: '#ef4444', label: 'Urgent' },
}

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#e1306c',
  YouTube:   '#ff0000',
  LinkedIn:  '#0077b5',
  Twitter:   '#1da1f2',
  TikTok:    '#010101',
}

// ── Demo Data ──────────────────────────────────────────────────────────────────

const DEMO_MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Priya Sharma',   role: 'owner',    avatarColor: '#3b82f6', email: 'priya@studio.co',   tasksAssigned: 3, lastActive: 'now',          status: 'online' },
  { id: 'm2', name: 'Rahul Mehta',    role: 'editor',   avatarColor: '#10b981', email: 'rahul@studio.co',   tasksAssigned: 4, lastActive: '5 min ago',     status: 'online' },
  { id: 'm3', name: 'Ananya Singh',   role: 'manager',  avatarColor: '#a78bfa', email: 'ananya@studio.co',  tasksAssigned: 2, lastActive: '30 min ago',    status: 'away'   },
  { id: 'm4', name: 'Vikram Nair',    role: 'designer', avatarColor: '#ec4899', email: 'vikram@studio.co',  tasksAssigned: 3, lastActive: '2 hours ago',   status: 'offline'},
]

const DEMO_CONTENT: ContentItem[] = [
  {
    id: 'c1', title: '5 AI Tools Every Creator Needs in 2025', platform: 'YouTube',
    status: 'brief', assignedTo: ['m1', 'm2'], dueDate: '2026-03-28', priority: 'high',
    comments: [
      { id: 'co1', authorId: 'm3', text: 'Make sure to cover Sora in this one!', timestamp: '2026-03-22T10:00:00Z', resolved: false },
    ],
  },
  {
    id: 'c2', title: 'How I Grew from 0 to 100K in 6 Months', platform: 'Instagram',
    status: 'brief', assignedTo: ['m4'], dueDate: '2026-03-30', priority: 'medium',
    comments: [],
  },
  {
    id: 'c3', title: 'Behind the Scenes: My Full Studio Setup Tour', platform: 'YouTube',
    status: 'scripting', assignedTo: ['m1', 'm3'], dueDate: '2026-03-26', priority: 'urgent',
    comments: [
      { id: 'co2', authorId: 'm1', text: 'Script needs a stronger hook in the first 30 seconds.', timestamp: '2026-03-23T09:00:00Z', resolved: false },
      { id: 'co3', authorId: 'm2', text: 'Agreed — let me rework the intro.', timestamp: '2026-03-23T09:30:00Z', resolved: true },
    ],
  },
  {
    id: 'c4', title: 'Creator Economy 2025: What Changed?', platform: 'LinkedIn',
    status: 'scripting', assignedTo: ['m2'], dueDate: '2026-03-27', priority: 'low',
    comments: [],
  },
  {
    id: 'c5', title: 'Day in My Life as a Full-Time Creator (Vlog)', platform: 'YouTube',
    status: 'filming', assignedTo: ['m1', 'm4'], dueDate: '2026-03-25', priority: 'high',
    comments: [
      { id: 'co4', authorId: 'm4', text: 'B-roll footage needs more variety — morning routine looks rushed.', timestamp: '2026-03-24T08:00:00Z', resolved: false },
    ],
  },
  {
    id: 'c6', title: 'Instagram Algorithm Breakdown (Carousel)', platform: 'Instagram',
    status: 'editing', assignedTo: ['m2', 'm4'], dueDate: '2026-03-24', priority: 'urgent',
    comments: [],
  },
  {
    id: 'c7', title: 'Collab Reel with @TravelBlogger', platform: 'Instagram',
    status: 'review', assignedTo: ['m1', 'm3', 'm4'], dueDate: '2026-03-23', priority: 'high',
    comments: [
      { id: 'co5', authorId: 'm3', text: 'Caption needs the brand CTA at the end per contract.', timestamp: '2026-03-23T14:00:00Z', resolved: false },
    ],
  },
  {
    id: 'c8', title: 'Q&A: Answering Your Top 50 Questions', platform: 'YouTube',
    status: 'published', assignedTo: ['m1', 'm2'], dueDate: '2026-03-20', priority: 'medium',
    comments: [],
  },
]

const STORAGE_KEY = 'creator-collab-board'

function uid() { return Math.random().toString(36).slice(2, 10) }

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isOverdue(dueDate: string) {
  return dueDate < new Date().toISOString().split('T')[0]
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Avatar({ member, size = 28, showStatus = false }: { member: TeamMember; size?: number; showStatus?: boolean }) {
  const statusColor = member.status === 'online' ? '#10b981' : member.status === 'away' ? '#f59e0b' : '#4b5680'
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${member.avatarColor}, ${member.avatarColor}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.32, fontWeight: 700, color: '#fff',
        border: '2px solid #0d0d1a', boxSizing: 'border-box',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        {getInitials(member.name)}
      </div>
      {showStatus && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3,
          borderRadius: '50%', background: statusColor,
          border: '1.5px solid #080810',
        }} />
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CollabMode() {
  const [activeTab, setActiveTab] = useState<'board' | 'members'>('board')

  // Board state
  const [members, setMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved).members ?? DEMO_MEMBERS : DEMO_MEMBERS
  })
  const [content, setContent] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved).content ?? DEMO_CONTENT : DEMO_CONTENT
  })

  const [filterMember, setFilterMember] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null)
  const [addingTo, setAddingTo] = useState<ContentStatus | null>(null)
  const [addForm, setAddForm] = useState({ title: '', platform: 'YouTube', assignedTo: [] as string[], dueDate: '' })

  // Drawer comment state
  const [newComment, setNewComment] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')

  // Members tab state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('editor')

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ members, content }))
  }, [members, content])

  // Sync drawer if content changes
  useEffect(() => {
    if (selectedItem) {
      const updated = content.find(c => c.id === selectedItem.id)
      if (updated && updated.id === selectedItem.id) setSelectedItem(updated)
      else if (!updated) setSelectedItem(null)
    }
  }, [content, selectedItem])

  const filteredContent = filterMember
    ? content.filter(c => c.assignedTo.includes(filterMember))
    : content

  function getColumnItems(status: ContentStatus) {
    return filteredContent.filter(c => c.status === status)
  }

  function getMemberById(id: string) {
    return members.find(m => m.id === id)
  }

  function updateContentItem(id: string, updates: Partial<ContentItem>) {
    setContent(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function addContentItem() {
    if (!addForm.title.trim() || !addingTo) return
    const item: ContentItem = {
      id: uid(),
      title: addForm.title,
      platform: addForm.platform,
      status: addingTo,
      assignedTo: addForm.assignedTo,
      dueDate: addForm.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      comments: [],
      priority: 'medium',
    }
    setContent(prev => [...prev, item])
    setAddForm({ title: '', platform: 'YouTube', assignedTo: [], dueDate: '' })
    setAddingTo(null)
    toast.success('Content added')
  }

  function postComment() {
    if (!newComment.trim() || !selectedItem) return
    const comment: Comment = {
      id: uid(),
      authorId: members[0].id,
      text: newComment,
      timestamp: new Date().toISOString(),
      resolved: false,
    }
    updateContentItem(selectedItem.id, { comments: [...selectedItem.comments, comment] })
    setNewComment('')
  }

  function resolveComment(commentId: string) {
    if (!selectedItem) return
    updateContentItem(selectedItem.id, {
      comments: selectedItem.comments.map(c => c.id === commentId ? { ...c, resolved: true } : c),
    })
  }

  function sendInvite() {
    if (!inviteEmail.trim()) return
    toast.success(`Invite sent to ${inviteEmail}`)
    setInviteEmail('')
    setInviteOpen(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: '#080810', fontFamily: 'Plus Jakarta Sans, sans-serif',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(167,139,250,0.3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>
                <Users size={16} color="#3b82f6" />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em' }}>
                  Collab Mode
                </h1>
                <p style={{ margin: 0, fontSize: 12, color: '#4b5680', marginTop: 1 }}>
                  {members.length} members · {content.filter(c => c.status !== 'published').length} active items
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setActiveTab('members'); setInviteOpen(true) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none', borderRadius: 9, padding: '8px 14px',
              cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <UserPlus size={14} /> Invite Member
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 3, width: 'fit-content' }}>
          {([['board', 'Team Board'], ['members', 'Team Members']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: activeTab === id ? '#1a1a3e' : 'transparent',
                color: activeTab === id ? '#f0f4ff' : '#4b5680',
                transition: 'all 150ms',
                boxShadow: activeTab === id ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'board' ? (
            <motion.div
              key="board"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Members Row */}
              <div style={{ padding: '16px 24px 12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {members.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setFilterMember(filterMember === m.id ? null : m.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        border: 'none', cursor: 'pointer', padding: '6px 8px',
                        borderRadius: 10, transition: 'background 150ms',
                        background: filterMember === m.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                        outline: filterMember === m.id ? '1px solid rgba(59,130,246,0.3)' : 'none',
                      } as React.CSSProperties}
                    >
                      <Avatar member={m} size={34} showStatus />
                      <span style={{ fontSize: 11, color: filterMember === m.id ? '#f0f4ff' : '#4b5680', fontWeight: 600 }}>
                        {m.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                  {filterMember && (
                    <button
                      onClick={() => setFilterMember(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '4px 9px',
                        cursor: 'pointer', color: '#ef4444', fontSize: 11, fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                      }}
                    >
                      <X size={11} /> Clear filter
                    </button>
                  )}
                </div>
              </div>

              {/* Kanban Board */}
              <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '0 24px 24px' }}>
                <div style={{ display: 'flex', gap: 12, height: '100%', minWidth: 'fit-content' }}>
                  {KANBAN_COLS.map(col => {
                    const items = getColumnItems(col.id)
                    return (
                      <div key={col.id} style={{
                        width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
                        background: 'rgba(13,13,26,0.8)', borderRadius: 12,
                        border: '1px solid rgba(59,130,246,0.08)', overflow: 'hidden',
                      }}>
                        {/* Column Header */}
                        <div style={{
                          padding: '10px 12px', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', borderBottom: '1px solid rgba(59,130,246,0.06)',
                          flexShrink: 0,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>{col.label}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#3b82f6',
                              background: 'rgba(59,130,246,0.12)', borderRadius: 10,
                              padding: '1px 6px',
                            }}>{items.length}</span>
                          </div>
                          <button
                            onClick={() => { setAddingTo(col.id); setAddForm({ title: '', platform: 'YouTube', assignedTo: [], dueDate: '' }) }}
                            style={{
                              width: 22, height: 22, borderRadius: 6, background: 'rgba(59,130,246,0.08)',
                              border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', cursor: 'pointer', color: '#4b5680', transition: 'all 150ms',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)'; e.currentTarget.style.color = '#3b82f6' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.color = '#4b5680' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Cards */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {/* Add form inline */}
                          {addingTo === col.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                              style={{
                                background: '#111128', borderRadius: 9, padding: 10,
                                border: '1px solid rgba(59,130,246,0.25)',
                              }}
                            >
                              <input
                                autoFocus
                                placeholder="Content title..."
                                value={addForm.title}
                                onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && addContentItem()}
                                style={{
                                  width: '100%', background: 'rgba(59,130,246,0.06)',
                                  border: '1px solid rgba(59,130,246,0.15)', borderRadius: 6,
                                  padding: '6px 8px', color: '#f0f4ff', fontSize: 12, outline: 'none',
                                  fontFamily: 'Plus Jakarta Sans, sans-serif', boxSizing: 'border-box',
                                  marginBottom: 6,
                                }}
                              />
                              <select
                                value={addForm.platform}
                                onChange={e => setAddForm(p => ({ ...p, platform: e.target.value }))}
                                style={{
                                  width: '100%', background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.15)',
                                  borderRadius: 6, padding: '5px 8px', color: '#f0f4ff', fontSize: 11,
                                  outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  boxSizing: 'border-box', marginBottom: 6,
                                }}
                              >
                                {Object.keys(PLATFORM_COLORS).map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                              <input
                                type="date"
                                value={addForm.dueDate}
                                onChange={e => setAddForm(p => ({ ...p, dueDate: e.target.value }))}
                                style={{
                                  width: '100%', background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.15)',
                                  borderRadius: 6, padding: '5px 8px', color: '#f0f4ff', fontSize: 11,
                                  outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                  boxSizing: 'border-box', marginBottom: 8, colorScheme: 'dark',
                                }}
                              />
                              <div style={{ display: 'flex', gap: 5 }}>
                                <button onClick={addContentItem} style={{
                                  flex: 1, background: '#3b82f6', border: 'none', borderRadius: 6,
                                  padding: '5px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>Add</button>
                                <button onClick={() => setAddingTo(null)} style={{
                                  width: 28, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                  borderRadius: 6, cursor: 'pointer', color: '#ef4444', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <X size={11} />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {items.map(item => (
                            <KanbanCard
                              key={item.id}
                              item={item}
                              getMemberById={getMemberById}
                              onClick={() => setSelectedItem(item)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="members"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}
            >
              <MembersTab
                members={members}
                setMembers={setMembers}
                content={content}
                inviteOpen={inviteOpen}
                setInviteOpen={setInviteOpen}
                inviteEmail={inviteEmail}
                setInviteEmail={setInviteEmail}
                inviteRole={inviteRole}
                setInviteRole={setInviteRole}
                sendInvite={sendInvite}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }}
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                position: 'fixed', right: 0, top: 0, bottom: 0, width: 400,
                background: '#0d0d1a', borderLeft: '1px solid rgba(59,130,246,0.15)',
                zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}
            >
              <ContentDrawer
                item={selectedItem}
                members={members}
                getMemberById={getMemberById}
                newComment={newComment}
                setNewComment={setNewComment}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                onUpdate={(updates) => updateContentItem(selectedItem.id, updates)}
                onResolveComment={resolveComment}
                onPostComment={postComment}
                onClose={() => setSelectedItem(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Kanban Card ─────────────────────────────────────────────────────────────────

function KanbanCard({
  item, getMemberById, onClick,
}: {
  item: ContentItem
  getMemberById: (id: string) => TeamMember | undefined
  onClick: () => void
}) {
  const overdue = isOverdue(item.dueDate)
  const pCfg = PRIORITY_CONFIG[item.priority]
  const platformColor = PLATFORM_COLORS[item.platform] || '#4b5680'
  const unresolved = item.comments.filter(c => !c.resolved).length

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -1 }}
      style={{
        background: '#080810', borderRadius: 9, padding: '10px',
        border: '1px solid rgba(59,130,246,0.08)', cursor: 'pointer',
        transition: 'border-color 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.22)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(59,130,246,0.08)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Platform + Priority */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: platformColor,
          background: `${platformColor}18`, borderRadius: 5, padding: '2px 7px',
        }}>{item.platform}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: pCfg.color }} />
          <GripVertical size={12} color="#2a3050" />
        </div>
      </div>

      {/* Title */}
      <p style={{
        margin: '0 0 9px', fontSize: 12.5, fontWeight: 600, color: '#e2e8f0',
        lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{item.title}</p>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Assigned avatars */}
        <div style={{ display: 'flex' }}>
          {item.assignedTo.slice(0, 3).map((mid, i) => {
            const m = getMemberById(mid)
            if (!m) return null
            return (
              <div key={mid} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                <Avatar member={m} size={22} />
              </div>
            )
          })}
          {item.assignedTo.length > 3 && (
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#1a1a3e',
              border: '2px solid #0d0d1a', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#4b5680',
              marginLeft: -8,
            }}>+{item.assignedTo.length - 3}</div>
          )}
          {item.assignedTo.length === 0 && (
            <span style={{ fontSize: 10, color: '#4b5680' }}>Unassigned</span>
          )}
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {unresolved > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MessageSquare size={11} color="#4b5680" />
              <span style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>{unresolved}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={10} color={overdue ? '#ef4444' : '#4b5680'} />
            <span style={{ fontSize: 10, color: overdue ? '#ef4444' : '#4b5680', fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>
              {item.dueDate.slice(5)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Content Drawer ──────────────────────────────────────────────────────────────

function ContentDrawer({
  item, members, getMemberById, newComment, setNewComment,
  editingTitle, setEditingTitle, editTitle, setEditTitle,
  onUpdate, onResolveComment, onPostComment, onClose,
}: {
  item: ContentItem
  members: TeamMember[]
  getMemberById: (id: string) => TeamMember | undefined
  newComment: string
  setNewComment: (v: string) => void
  editingTitle: boolean
  setEditingTitle: (v: boolean) => void
  editTitle: string
  setEditTitle: (v: string) => void
  onUpdate: (updates: Partial<ContentItem>) => void
  onResolveComment: (id: string) => void
  onPostComment: () => void
  onClose: () => void
}) {
  const commentEndRef = useRef<HTMLDivElement>(null)

  return (
    <>
      {/* Drawer Header */}
      <div style={{
        padding: '16px 18px', borderBottom: '1px solid rgba(59,130,246,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: PLATFORM_COLORS[item.platform] || '#4b5680',
            background: `${PLATFORM_COLORS[item.platform] || '#4b5680'}18`, borderRadius: 5, padding: '2px 7px',
          }}>{item.platform}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
            color: PRIORITY_CONFIG[item.priority].color,
            background: `${PRIORITY_CONFIG[item.priority].color}15`,
          }}>{PRIORITY_CONFIG[item.priority].label}</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px' }}>
        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={() => { onUpdate({ title: editTitle }); setEditingTitle(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onUpdate({ title: editTitle }); setEditingTitle(false) } }}
            style={{
              width: '100%', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.3)',
              borderRadius: 8, padding: '8px 10px', color: '#f0f4ff', fontSize: 15, fontWeight: 700,
              outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', boxSizing: 'border-box',
              marginBottom: 16,
            }}
          />
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, cursor: 'pointer' }}
            onClick={() => { setEditingTitle(true); setEditTitle(item.title) }}
          >
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0f4ff', lineHeight: 1.4, flex: 1 }}>
              {item.title}
            </h2>
            <Edit3 size={13} color="#4b5680" style={{ flexShrink: 0, marginTop: 3 }} />
          </div>
        )}

        {/* Status + Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Status</label>
            <select
              value={item.status}
              onChange={e => onUpdate({ status: e.target.value as ContentStatus })}
              style={{
                width: '100%', background: '#111128', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 7, padding: '6px 8px', color: '#f0f4ff', fontSize: 12,
                outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
              }}
            >
              {KANBAN_COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Priority</label>
            <select
              value={item.priority}
              onChange={e => onUpdate({ priority: e.target.value as ContentItem['priority'] })}
              style={{
                width: '100%', background: '#111128', border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 7, padding: '6px 8px', color: '#f0f4ff', fontSize: 12,
                outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
              }}
            >
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Due Date</label>
          <input
            type="date"
            value={item.dueDate}
            onChange={e => onUpdate({ dueDate: e.target.value })}
            style={{
              background: '#111128', border: `1px solid ${isOverdue(item.dueDate) ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.15)'}`,
              borderRadius: 7, padding: '6px 10px', color: isOverdue(item.dueDate) ? '#ef4444' : '#f0f4ff',
              fontSize: 12, outline: 'none', fontFamily: 'Space Mono, monospace', colorScheme: 'dark',
            }}
          />
          {isOverdue(item.dueDate) && (
            <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 8 }}>Overdue</span>
          )}
        </div>

        {/* Assigned To */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Assigned To</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {members.map(m => {
              const assigned = item.assignedTo.includes(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    const newAssigned = assigned
                      ? item.assignedTo.filter(id => id !== m.id)
                      : [...item.assignedTo, m.id]
                    onUpdate({ assignedTo: newAssigned })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px',
                    borderRadius: 20, border: assigned ? `1px solid ${m.avatarColor}50` : '1px solid rgba(59,130,246,0.1)',
                    background: assigned ? `${m.avatarColor}18` : 'rgba(59,130,246,0.04)',
                    cursor: 'pointer', transition: 'all 150ms', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}
                >
                  <Avatar member={m} size={18} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: assigned ? m.avatarColor : '#4b5680' }}>
                    {m.name.split(' ')[0]}
                  </span>
                  {assigned && <Check size={10} color={m.avatarColor} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Comments */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MessageSquare size={13} color="#4b5680" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>Comments</span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#3b82f6',
              background: 'rgba(59,130,246,0.12)', borderRadius: 8, padding: '1px 6px',
            }}>{item.comments.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {item.comments.length === 0 && (
              <p style={{ fontSize: 12, color: '#4b5680', textAlign: 'center', padding: '12px 0' }}>No comments yet. Be the first!</p>
            )}
            {item.comments.map(comment => {
              const author = getMemberById(comment.authorId)
              return (
                <div key={comment.id} style={{
                  background: comment.resolved ? 'rgba(16,185,129,0.04)' : 'rgba(59,130,246,0.04)',
                  border: `1px solid ${comment.resolved ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)'}`,
                  borderRadius: 9, padding: '10px 12px',
                  opacity: comment.resolved ? 0.65 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {author && <Avatar member={author} size={22} />}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>
                        {author?.name.split(' ')[0] || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                        {relativeTime(comment.timestamp)}
                      </span>
                    </div>
                    {!comment.resolved && (
                      <button
                        onClick={() => onResolveComment(comment.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.2)', borderRadius: 5, padding: '3px 7px',
                          cursor: 'pointer', color: '#10b981', fontSize: 10, fontWeight: 600,
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}
                      >
                        <Check size={9} /> Resolve
                      </button>
                    )}
                    {comment.resolved && (
                      <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>Resolved</span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.5 }}>{comment.text}</p>
                </div>
              )
            })}
            <div ref={commentEndRef} />
          </div>

          {/* New Comment */}
          <div style={{
            display: 'flex', gap: 8, background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.12)', borderRadius: 9, padding: '8px 10px',
          }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
                color: '#f0f4ff', fontSize: 12.5, fontFamily: 'Plus Jakarta Sans, sans-serif',
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={onPostComment}
              disabled={!newComment.trim()}
              style={{
                alignSelf: 'flex-end', background: newComment.trim() ? '#3b82f6' : 'rgba(59,130,246,0.2)',
                border: 'none', borderRadius: 7, padding: '6px 10px', cursor: newComment.trim() ? 'pointer' : 'default',
                color: newComment.trim() ? '#fff' : '#4b5680', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 150ms',
              }}
            >
              <Send size={12} /> Post
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Members Tab ─────────────────────────────────────────────────────────────────

function MembersTab({
  members, setMembers, content,
  inviteOpen, setInviteOpen, inviteEmail, setInviteEmail,
  inviteRole, setInviteRole, sendInvite,
}: {
  members: TeamMember[]
  setMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>
  content: ContentItem[]
  inviteOpen: boolean
  setInviteOpen: (v: boolean) => void
  inviteEmail: string
  setInviteEmail: (v: string) => void
  inviteRole: MemberRole
  setInviteRole: (v: MemberRole) => void
  sendInvite: () => void
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  function getTaskCount(memberId: string) {
    return content.filter(c => c.assignedTo.includes(memberId) && c.status !== 'published').length
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>Your Team</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4b5680' }}>{members.length} members</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', borderRadius: 9, padding: '8px 14px',
            cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600,
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      {/* Members Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {members.map(member => {
          const roleCfg = ROLE_CONFIG[member.role]
          const statusColor = member.status === 'online' ? '#10b981' : member.status === 'away' ? '#f59e0b' : '#4b5680'
          const taskCount = getTaskCount(member.id)
          const isOwner = member.role === 'owner'

          return (
            <div
              key={member.id}
              onMouseEnter={() => setHoveredId(member.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: '#0d0d1a', borderRadius: 12,
                border: hoveredId === member.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(59,130,246,0.08)',
                padding: '18px', transition: 'all 150ms', position: 'relative',
                boxShadow: hoveredId === member.id ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {/* Avatar + Status */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <Avatar member={member} size={48} showStatus />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{member.name}</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: roleCfg.bg, borderRadius: 6, padding: '2px 8px',
                    fontSize: 11, fontWeight: 700, color: roleCfg.color,
                  }}>
                    {roleCfg.label}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ fontSize: 12, color: '#4b5680', marginBottom: 4 }}>{member.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} />
                  <span style={{ fontSize: 11, color: statusColor, fontWeight: 600, textTransform: 'capitalize' }}>
                    {member.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#4b5680' }}>· {member.lastActive}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={11} color="#4b5680" />
                  <span style={{ fontSize: 11, color: '#4b5680' }}>{taskCount} active</span>
                </div>
              </div>

              {/* Hover Actions */}
              {hoveredId === member.id && !isOwner && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    position: 'absolute', bottom: 14, right: 14,
                    display: 'flex', gap: 6,
                  }}
                >
                  <button
                    onClick={() => setChangingRole(changingRole === member.id ? null : member.id)}
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)', color: '#3b82f6',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    Change Role
                  </button>
                  <button
                    onClick={() => {
                      setMembers(prev => prev.filter(m => m.id !== member.id))
                      toast.success(`Removed ${member.name}`)
                    }}
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    Remove
                  </button>
                </motion.div>
              )}

              {/* Role Selector */}
              {changingRole === member.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    background: '#111128', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10,
                    padding: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', marginTop: 4,
                  }}
                >
                  {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][])
                    .filter(([r]) => r !== 'owner')
                    .map(([role, cfg]) => (
                      <button
                        key={role}
                        onClick={() => {
                          setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role } : m))
                          setChangingRole(null)
                          toast.success(`${member.name.split(' ')[0]}'s role updated to ${cfg.label}`)
                        }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 10px', borderRadius: 7, background: member.role === role ? cfg.bg : 'transparent',
                          border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                          transition: 'background 150ms',
                        }}
                        onMouseEnter={e => { if (member.role !== role) e.currentTarget.style.background = 'rgba(59,130,246,0.06)' }}
                        onMouseLeave={e => { if (member.role !== role) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: 10.5, color: '#4b5680' }}>{cfg.desc}</span>
                      </button>
                    ))}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {inviteOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50 }}
              onClick={() => setInviteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 400, background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 16, padding: 24, zIndex: 60, boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>Invite Team Member</h3>
                <button onClick={() => setInviteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex' }}>
                  <X size={16} />
                </button>
              </div>

              <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Email Address</label>
              <input
                autoFocus
                type="email"
                placeholder="teammate@studio.co"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendInvite()}
                style={{
                  width: '100%', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 9, padding: '9px 12px', color: '#f0f4ff', fontSize: 13,
                  outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', boxSizing: 'border-box',
                  marginBottom: 16,
                }}
              />

              <label style={{ fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Role</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {(Object.entries(ROLE_CONFIG) as [MemberRole, typeof ROLE_CONFIG[MemberRole]][])
                  .filter(([r]) => r !== 'owner')
                  .map(([role, cfg]) => (
                    <button
                      key={role}
                      onClick={() => setInviteRole(role)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                        background: inviteRole === role ? cfg.bg : 'rgba(59,130,246,0.03)',
                        border: inviteRole === role ? `1px solid ${cfg.color}40` : '1px solid rgba(59,130,246,0.1)',
                        fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 150ms',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: inviteRole === role ? cfg.color : '#e2e8f0' }}>{cfg.label}</span>
                      <span style={{ fontSize: 11.5, color: '#4b5680' }}>{cfg.desc}</span>
                    </button>
                  ))}
              </div>

              <button
                onClick={sendInvite}
                style={{
                  width: '100%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer',
                  color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                  boxShadow: '0 4px 14px rgba(59,130,246,0.35)',
                }}
              >
                Send Invite
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
