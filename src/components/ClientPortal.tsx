import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { ClientPortalLink, ClientComment } from '../types'
import {
  Globe, Plus, Copy, Trash2, Eye, MessageSquare, Check,
  Lock, Unlock, X, Send, Shield, Clock, User,
} from 'lucide-react'
import toast from 'react-hot-toast'

function generateToken() {
  return `portal_${Math.random().toString(36).slice(2, 14)}`
}

function generateId() {
  return `cl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function ClientPortal() {
  const {
    workspace, clientPortalLinks, clientComments,
    addClientPortalLink, updateClientPortalLink, removeClientPortalLink,
    addClientComment, updateClientComment,
    profile,
  } = useStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activePortalId, setActivePortalId] = useState<string | null>(null)

  // Create portal form state
  const [createLabel, setCreateLabel] = useState('')
  const [createProjectId, setCreateProjectId] = useState('')
  const [createAllowComments, setCreateAllowComments] = useState(true)
  const [createExpiry, setCreateExpiry] = useState('')

  // Portal preview state
  const [previewToken, setPreviewToken] = useState<string | null>(null)

  // Client-side comment form (simulates client view)
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentBody, setCommentBody] = useState('')

  function handleCreatePortal() {
    if (!createLabel.trim() || !createProjectId) return
    const link: ClientPortalLink = {
      id: generateId(),
      projectId: createProjectId,
      token: generateToken(),
      label: createLabel.trim(),
      allowComments: createAllowComments,
      expiresAt: createExpiry || undefined,
      createdAt: new Date().toISOString(),
      createdBy: profile?.name || 'You',
      views: 0,
    }
    addClientPortalLink(link)
    setShowCreateModal(false)
    setCreateLabel('')
    setCreateProjectId('')
    setCreateExpiry('')
    toast.success('Client portal link created!')
  }

  function copyPortalLink(token: string) {
    const url = `${window.location.origin}?portal=${token}`
    navigator.clipboard.writeText(url)
    toast.success('Portal link copied!')
  }

  function handleSubmitComment(portalId: string, projectId: string) {
    if (!commentAuthor.trim() || !commentBody.trim()) return
    const comment: ClientComment = {
      id: generateId(),
      portalId,
      projectId,
      authorName: commentAuthor.trim(),
      body: commentBody.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    addClientComment(comment)
    setCommentAuthor('')
    setCommentBody('')
    toast.success('Comment submitted for review')
  }

  const activePortal = clientPortalLinks.find((l) => l.id === activePortalId)
  const activeProject = activePortal
    ? workspace.projects.find((p) => p.id === activePortal.projectId)
    : null
  // (portalComments & linksByProject available when needed)

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: 'var(--bg, #080810)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={18} color="white" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #f0f4ff)', margin: 0 }}>
              Client Portal
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted, #6b7a9a)', margin: 0 }}>
            Share read-only project views with clients. Collect feedback without exposing your workspace.
          </p>
        </div>
        <button
          className="btn btn-blue"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={15} />
          New Portal Link
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left: portal links list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {clientPortalLinks.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 32px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                background: 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={28} color="#10b981" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff', marginBottom: 8 }}>
                No client portals yet
              </div>
              <div style={{ fontSize: 13, color: '#6b7a9a', marginBottom: 20 }}>
                Create a shareable link to give clients read-only access to project progress.
              </div>
              <button className="btn btn-blue" onClick={() => setShowCreateModal(true)}>
                Create your first portal
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientPortalLinks.map((link) => {
                const project = workspace.projects.find((p) => p.id === link.projectId)
                const linkComments = clientComments.filter((c) => c.portalId === link.id)
                const pendingComments = linkComments.filter((c) => c.status === 'pending').length
                const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date()

                return (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: activePortalId === link.id ? 'rgba(59,130,246,0.06)' : 'var(--s2, #111122)',
                      border: `1px solid ${activePortalId === link.id ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.08)'}`,
                      borderRadius: 12, padding: '16px',
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onClick={() => setActivePortalId(activePortalId === link.id ? null : link.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: isExpired ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isExpired ? <Lock size={18} color="#ef4444" /> : <Unlock size={18} color="#10b981" />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #f0f4ff)' }}>
                            {link.label}
                          </span>
                          {isExpired && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#ef4444',
                              background: 'rgba(239,68,68,0.1)', borderRadius: 4, padding: '2px 6px',
                            }}>
                              EXPIRED
                            </span>
                          )}
                          {pendingComments > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, color: '#f59e0b',
                              background: 'rgba(245,158,11,0.1)', borderRadius: 4, padding: '2px 6px',
                            }}>
                              {pendingComments} pending
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6b7a9a', marginBottom: 6 }}>
                          Project: <span style={{ color: '#94a3b8' }}>{project?.name || 'Unknown'}</span>
                          {' · '}
                          <Eye size={11} style={{ display: 'inline', verticalAlign: 'middle' }} color="#4b5680" />
                          {' '}{link.views} views
                          {link.expiresAt && (
                            <>
                              {' · '}
                              <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle' }} color="#4b5680" />
                              {' '}Expires {new Date(link.expiresAt).toLocaleDateString()}
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace', marginBottom: 10 }}>
                          …?portal={link.token.slice(0, 12)}…
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-blue btn-sm"
                        onClick={(e) => { e.stopPropagation(); copyPortalLink(link.token) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Copy size={12} />
                        Copy Link
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); setPreviewToken(link.token); setActivePortalId(link.id) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateClientPortalLink(link.id, { allowComments: !link.allowComments })
                          toast.success(link.allowComments ? 'Comments disabled' : 'Comments enabled')
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <MessageSquare size={12} />
                        {link.allowComments ? 'Comments on' : 'Comments off'}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeClientPortalLink(link.id)
                          toast.success('Portal removed')
                        }}
                        style={{ marginLeft: 'auto', color: '#ef4444' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Comments panel */}
                    <AnimatePresence>
                      {activePortalId === link.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{ marginTop: 14, overflow: 'hidden' }}
                        >
                          <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', paddingTop: 14 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
                              Client Comments ({linkComments.length})
                            </div>
                            {linkComments.length === 0 ? (
                              <div style={{ fontSize: 12, color: '#4b5680', padding: '12px 0' }}>
                                No client comments yet.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {linkComments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    style={{
                                      background: 'rgba(255,255,255,0.03)',
                                      border: '1px solid rgba(59,130,246,0.08)',
                                      borderRadius: 8, padding: '10px 12px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{
                                          width: 24, height: 24, borderRadius: '50%',
                                          background: 'rgba(59,130,246,0.15)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                          <User size={11} color="#3b82f6" />
                                        </div>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>
                                          {comment.authorName}
                                        </span>
                                      </div>
                                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <span style={{
                                          fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 6px',
                                          background: comment.status === 'pending' ? 'rgba(245,158,11,0.1)' : comment.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                          color: comment.status === 'pending' ? '#f59e0b' : comment.status === 'approved' ? '#10b981' : '#ef4444',
                                        }}>
                                          {comment.status}
                                        </span>
                                        {comment.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); updateClientComment(comment.id, { status: 'approved' }) }}
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981', padding: 2 }}
                                            >
                                              <Check size={12} />
                                            </button>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); updateClientComment(comment.id, { status: 'dismissed' }) }}
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2 }}
                                            >
                                              <X size={12} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{comment.body}</div>
                                    <div style={{ fontSize: 10, color: '#4b5680', marginTop: 4 }}>
                                      {new Date(comment.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Simulate client comment (demo) */}
                            {link.allowComments && (
                              <div style={{ marginTop: 12, borderTop: '1px solid rgba(59,130,246,0.06)', paddingTop: 12 }}>
                                <div style={{ fontSize: 11, color: '#4b5680', marginBottom: 8 }}>
                                  Simulate client comment:
                                </div>
                                <input
                                  className="field"
                                  placeholder="Client name"
                                  value={commentAuthor}
                                  onChange={(e) => setCommentAuthor(e.target.value)}
                                  style={{ width: '100%', marginBottom: 6 }}
                                />
                                <textarea
                                  className="field"
                                  placeholder="Comment from client…"
                                  value={commentBody}
                                  onChange={(e) => setCommentBody(e.target.value)}
                                  style={{ width: '100%', height: 72, resize: 'none', marginBottom: 6 }}
                                />
                                <button
                                  className="btn btn-blue btn-sm"
                                  onClick={(e) => { e.stopPropagation(); handleSubmitComment(link.id, link.projectId) }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                  <Send size={12} />
                                  Submit Comment
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Portal preview panel */}
        <AnimatePresence>
          {activePortal && activeProject && previewToken === activePortal.token && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{
                width: 340, flexShrink: 0,
                background: '#0a0a14',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 16, padding: '20px',
                position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Portal Preview</div>
                <button
                  onClick={() => setPreviewToken(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Client-visible project overview */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.05))',
                borderRadius: 12, padding: 16, marginBottom: 16,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Project Update
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>
                  {activeProject.name}
                </div>
                <div style={{ fontSize: 12, color: '#6b7a9a' }}>{activeProject.description}</div>
              </div>

              {/* Task progress */}
              {activeProject.tasks.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
                    Progress
                  </div>
                  {(['todo', 'in-progress', 'review', 'done'] as const).map((status) => {
                    const count = activeProject.tasks.filter((t) => t.status === status).length
                    const pct = activeProject.tasks.length > 0 ? (count / activeProject.tasks.length) * 100 : 0
                    const colors: Record<string, string> = {
                      'todo': '#6b7a9a', 'in-progress': '#3b82f6', 'review': '#f59e0b', 'done': '#10b981',
                    }
                    return (
                      <div key={status} style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: colors[status] }}>{status.replace('-', ' ')}</span>
                          <span style={{ fontSize: 11, color: '#6b7a9a' }}>{count}</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: colors[status], borderRadius: 2 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Milestones */}
              {activeProject.milestones?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>
                    Milestones
                  </div>
                  {activeProject.milestones.slice(0, 5).map((m) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 0', borderBottom: '1px solid rgba(59,130,246,0.06)',
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: m.status === 'completed' ? '#10b981' : m.status === 'in-progress' ? '#3b82f6' : '#6b7a9a',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f4ff' }}>{m.title}</div>
                        <div style={{ fontSize: 10, color: '#4b5680' }}>{m.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Shield size={12} color="#10b981" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>Read-only access</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7a9a' }}>
                  Clients can only view this information. Workspace details are hidden.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(8,8,16,0.8)',
              backdropFilter: 'blur(4px)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 16, padding: 28, width: 480,
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>Create Client Portal</div>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Portal Label *
                  </label>
                  <input
                    className="field"
                    placeholder="e.g. Q1 Campaign Update for Nike"
                    value={createLabel}
                    onChange={(e) => setCreateLabel(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Project *
                  </label>
                  <select
                    className="field"
                    value={createProjectId}
                    onChange={(e) => setCreateProjectId(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Select a project</option>
                    {workspace.projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Expiry Date (optional)
                  </label>
                  <input
                    className="field"
                    type="date"
                    value={createExpiry}
                    onChange={(e) => setCreateExpiry(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={createAllowComments}
                    onChange={(e) => setCreateAllowComments(e.target.checked)}
                    style={{ width: 16, height: 16 }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff' }}>Allow client comments</div>
                    <div style={{ fontSize: 11, color: '#6b7a9a' }}>Clients can submit feedback through the portal</div>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-blue" style={{ flex: 1 }} onClick={handleCreatePortal}>
                  Create Portal Link
                </button>
                <button className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
