import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Plus, Trash2,
  Youtube, Instagram, Mail, Twitter, DollarSign,
  ChevronRight, ArrowRight, Sparkles, CheckCircle,
  MessageSquare, Briefcase
} from 'lucide-react'
import toast from 'react-hot-toast'

type TriggerType = 'youtube_publish' | 'brand_deal_signed' | 'goal_reached' | 'instagram_publish'
type ActionType = 'generate_reel' | 'send_email' | 'post_twitter' | 'log_income' | 'notify_collab'

interface Automation {
  id: string
  name: string
  trigger: TriggerType
  actions: ActionType[]
  active: boolean
  lastRun?: string
  successCount: number
}

const TRIGGER_CONFIG: Record<TriggerType, { label: string; icon: any; color: string; desc: string }> = {
  youtube_publish:   { label: 'YouTube Video Published', icon: Youtube, color: '#ff0000', desc: 'Runs when a new video goes live on your channel' },
  instagram_publish: { label: 'Instagram Reel Published', icon: Instagram, color: '#e1306c', desc: 'Runs when you post a new reel' },
  brand_deal_signed: { label: 'Brand Deal Signed', icon: Briefcase, color: '#f59e0b', desc: 'Runs when a deal status moves to Contracted' },
  goal_reached:      { label: 'Growth Goal Reached', icon: Zap, color: '#3b82f6', desc: 'Runs when you hit a subscriber or view milestone' },
}

const ACTION_CONFIG: Record<ActionType, { label: string; icon: any; color: string; desc: string }> = {
  generate_reel: { label: 'AI: Generate Reel Draft', icon: Sparkles, color: '#a78bfa', desc: 'Uses AI to extract key moments and write a reel script' },
  send_email:    { label: 'Audience: Send Email', icon: Mail, color: '#10b981', desc: 'Sends an update to your private email list' },
  post_twitter:  { label: 'Social: Post to Twitter', icon: Twitter, color: '#1da1f2', desc: 'Cross-posts a summary to your Twitter profile' },
  log_income:    { label: 'Finance: Log Income', icon: DollarSign, color: '#10b981', desc: 'Automatically records projected earnings in Income Tracker' },
  notify_collab: { label: 'Collab: Notify Network', icon: MessageSquare, color: '#3b82f6', desc: 'Alerts relevant collab partners about your new upload' },
}

const INITIAL_DATA: Automation[] = [
  { id: '1', name: 'Viral Cross-Promotion', trigger: 'youtube_publish', actions: ['generate_reel', 'send_email'], active: true, lastRun: new Date().toISOString(), successCount: 12 },
  { id: '2', name: 'Revenue Tracking', trigger: 'brand_deal_signed', actions: ['log_income'], active: true, successCount: 5 },
]

export function AutomationEngine() {
  const [automations, setAutomations] = useState<Automation[]>(INITIAL_DATA)
  const [showNew, setShowNew] = useState(false)
  const [newStep, setNewStep] = useState(1)
  const [tempTrigger, setTempTrigger] = useState<TriggerType>('youtube_publish')
  const [tempActions, setTempActions] = useState<ActionType[]>([])

  function toggleActive(id: string) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))
    toast.success('Automation updated')
  }

  function deleteAutomation(id: string) {
    setAutomations(prev => prev.filter(a => a.id !== id))
    toast.success('Automation deleted')
  }

  function saveNew() {
    if (tempActions.length === 0) { toast.error('Add at least one action'); return }
    const automation: Automation = {
      id: crypto.randomUUID(),
      name: `Auto: ${TRIGGER_CONFIG[tempTrigger].label}`,
      trigger: tempTrigger,
      actions: tempActions,
      active: true,
      successCount: 0
    }
    setAutomations([automation, ...automations])
    setShowNew(false)
    setNewStep(1)
    setTempActions([])
    toast.success('Creator Zapier Workflow Active!')
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Creator Zapier</h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
            Automate your cross-platform workflow and build compounding network effects.
          </p>
        </div>
        <button className="btn btn-blue" onClick={() => setShowNew(true)}>
          <Plus size={14} /> New Workflow
        </button>
      </header>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: '#3b82f6', marginBottom: 8 }}><Zap size={16} /></div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>{automations.filter(a => a.active).length}</div>
          <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Active Workflows</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: '#10b981', marginBottom: 8 }}><CheckCircle size={16} /></div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>{automations.reduce((s, a) => s + a.successCount, 0)}</div>
          <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Total Tasks Automated</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ color: '#a78bfa', marginBottom: 8 }}><Sparkles size={16} /></div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>14.2h</div>
          <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Time Saved (Estimated)</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {automations.map((a) => (
          <motion.div key={a.id} layout className="card" style={{ padding: '20px 24px', opacity: a.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
               {/* Trigger Icon */}
               <div style={{ width: 48, height: 48, borderRadius: 12, background: `${TRIGGER_CONFIG[a.trigger].color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TRIGGER_CONFIG[a.trigger].color }}>
                  {(() => { const TriggerIcon = TRIGGER_CONFIG[a.trigger].icon; return <TriggerIcon size={24} /> })()}
               </div>

               <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{a.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5680', fontSize: 12 }}>
                     <span>{TRIGGER_CONFIG[a.trigger].label}</span>
                     <ArrowRight size={12} />
                     <div style={{ display: 'flex', gap: 6 }}>
                        {a.actions.map(act => (
                          <span key={act} style={{ color: ACTION_CONFIG[act].color, fontWeight: 700 }}>{ACTION_CONFIG[act].label}</span>
                        ))}
                     </div>
                  </div>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{a.successCount} runs</div>
                    <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>{a.lastRun ? `Last run: ${new Date(a.lastRun).toLocaleDateString()}` : 'Never run'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(a.id)}>
                      {a.active ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-ghost btn-item" onClick={() => deleteAutomation(a.id)}><Trash2 size={14} /></button>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* New Workflow Modal */}
      <AnimatePresence>
        {showNew && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowNew(false)} />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
               style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 540, background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, zIndex: 110, padding: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            >
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f0f4ff' }}>Create New Automation</h2>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2].map(s => <div key={s} style={{ width: 12, height: 4, borderRadius: 2, background: newStep >= s ? '#3b82f6' : 'rgba(255,255,255,0.1)' }} />)}
                  </div>
               </div>

               {newStep === 1 && (
                 <div>
                    <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 600, marginBottom: 16 }}>Step 1: Choose a Trigger</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                       {(Object.keys(TRIGGER_CONFIG) as TriggerType[]).map(t => {
                         const TriggerIcon = TRIGGER_CONFIG[t].icon
                         return (
                          <div key={t} onClick={() => setTempTrigger(t)} style={{ padding: '16px 20px', borderRadius: 16, border: tempTrigger === t ? '1px solid #3b82f6' : '1px solid rgba(59,130,246,0.1)', background: tempTrigger === t ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'center' }}>
                             <div style={{ color: TRIGGER_CONFIG[t].color }}><TriggerIcon size={20} /></div>
                             <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: tempTrigger === t ? '#f0f4ff' : '#94a3b8' }}>{TRIGGER_CONFIG[t].label}</div>
                                <div style={{ fontSize: 11, color: '#4b5680' }}>{TRIGGER_CONFIG[t].desc}</div>
                             </div>
                             {tempTrigger === t && <CheckCircle size={16} color="#3b82f6" style={{ marginLeft: 'auto' }} />}
                          </div>
                         )
                       })}
                    </div>
                    <button className="btn btn-blue" style={{ width: '100%', marginTop: 24 }} onClick={() => setNewStep(2)}>Next Step <ChevronRight size={14} /></button>
                 </div>
               )}

               {newStep === 2 && (
                 <div>
                    <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 600, marginBottom: 16 }}>Step 2: Add Actions</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {(Object.keys(ACTION_CONFIG) as ActionType[]).map(act => {
                         const isSelected = tempActions.includes(act)
                         const ActionIcon = ACTION_CONFIG[act].icon
                         return (
                          <div key={act} onClick={() => setTempActions(prev => isSelected ? prev.filter(x => x !== act) : [...prev, act])} style={{ padding: '16px 20px', borderRadius: 16, border: isSelected ? '1px solid #10b981' : '1px solid rgba(16,185,129,0.1)', background: isSelected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'center' }}>
                            <div style={{ color: ACTION_CONFIG[act].color }}><ActionIcon size={20} /></div>
                            <div>
                               <div style={{ fontSize: 14, fontWeight: 800, color: isSelected ? '#f0f4ff' : '#94a3b8' }}>{ACTION_CONFIG[act].label}</div>
                               <div style={{ fontSize: 11, color: '#4b5680' }}>{ACTION_CONFIG[act].desc}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 4, border: '2px solid rgba(16,185,129,0.3)', background: isSelected ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                               {isSelected && <CheckCircle size={12} color="white" />}
                            </div>
                          </div>
                         )
                       })}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                       <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setNewStep(1)}>Back</button>
                       <button className="btn btn-blue" style={{ flex: 2 }} onClick={saveNew}>Activate Workflow</button>
                    </div>
                 </div>
               )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
