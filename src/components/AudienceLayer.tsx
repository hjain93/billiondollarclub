import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Download, Plus, Users, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store'

export function AudienceLayer() {
  const { profile, updateProfile } = useStore()
  
  const emailSubscribers = profile?.emailSubscribers || 0
  const smsSubscribers = profile?.smsSubscribers || 0
  const totalSubscribers = emailSubscribers + smsSubscribers
  
  const [isEditingData, setIsEditingData] = useState(false)
  const [localEmail, setLocalEmail] = useState(emailSubscribers.toString())
  const [localSms, setLocalSms] = useState(smsSubscribers.toString())

  const [showFormBuilder, setShowFormBuilder] = useState(false)

  function exportCSV() {
    const data = "Email,Name,SubscribedAt\nuser1@example.com,John Doe,2024-03-24\nuser2@example.com,Jane Smith,2024-03-23"
    const blob = new Blob([data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', 'audience_export.csv')
    a.click()
    toast.success('Audience data exported to CSV')
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Audience Portability</h1>
        <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
          Own your distribution. Don't let algorithms control your reach.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Stats Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(236,72,153,0.05))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(59,130,246,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                <Users size={20} />
              </div>
              <button className="btn btn-ghost btn-xs" onClick={exportCSV}><Download size={13} /> Export</button>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#f0f4ff', marginBottom: 4 }}>{totalSubscribers.toLocaleString()}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ fontSize: 13, color: '#4b5680', fontWeight: 600 }}>Total Owned Audience</div>
               {!isEditingData ? (
                 <button className="btn btn-ghost btn-xs" onClick={() => setIsEditingData(true)}>Edit Stats</button>
               ) : (
                 <button className="btn btn-blue btn-xs" onClick={() => {
                   updateProfile({ emailSubscribers: parseInt(localEmail) || 0, smsSubscribers: parseInt(localSms) || 0 })
                   setIsEditingData(false)
                   toast.success('Audience counts synced')
                 }}>Save</button>
               )}
            </div>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(59,130,246,0.05)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)' }}>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Email List</div>
                {isEditingData ? (
                  <input type="number" className="field" style={{ padding: '4px 8px', fontSize: 14 }} value={localEmail} onChange={e => setLocalEmail(e.target.value)} />
                ) : (
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#3b82f6' }}>{emailSubscribers.toLocaleString()}</div>
                )}
              </div>
              <div style={{ flex: 1, padding: '12px 14px', background: 'rgba(236,72,153,0.05)', borderRadius: 12, border: '1px solid rgba(236,72,153,0.1)' }}>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>SMS Alerts</div>
                {isEditingData ? (
                  <input type="number" className="field" style={{ padding: '4px 8px', fontSize: 14 }} value={localSms} onChange={e => setLocalSms(e.target.value)} />
                ) : (
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ec4899' }}>{smsSubscribers.toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', marginBottom: 16 }}>Growth Tools</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '12px 16px' }} onClick={() => setShowFormBuilder(true)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={16} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Email Capture Form</span>
                </div>
                <ArrowRight size={14} />
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MessageSquare size={16} color="#ec4899" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>SMS Opt-in Widget</span>
                </div>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#10b981' }}>
              <ShieldCheck size={18} />
              <span style={{ fontSize: 14, fontWeight: 800 }}>Platform Moat Status</span>
            </div>
            <p style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.6, marginBottom: 20 }}>
              Your portability score is <strong style={{ color: '#10b981' }}>High (84%)</strong>. 
              Even if YouTube deletes your channel tomorrow, you can still reach 1,600+ fans instantly.
            </p>
            <div style={{ height: 6, background: 'rgba(16,185,129,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '84%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#10b981' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
            <Plus size={32} color="#3b82f6" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>Integrate Shopify or Gumroad</div>
            <p style={{ fontSize: 12, color: '#4b5680', lineHeight: 1.5 }}>
              Sync your customer lists directly to your audience layer for unified distribution.
            </p>
          </div>
        </div>
      </div>

      {/* Form Builder Modal (Partial) */}
      <AnimatePresence>
        {showFormBuilder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: 500, background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>Form Builder</h3>
                <button onClick={() => setShowFormBuilder(false)} style={{ background: 'none', border: 'none', color: '#4b5680', cursor: 'pointer' }}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="sec-label">Call to Action</label>
                <input className="field" defaultValue="Join the inner circle for exclusive updates." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-blue" style={{ flex: 1 }} onClick={() => { toast.success('Form published!'); setShowFormBuilder(false) }}>Publish Form</button>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowFormBuilder(false)}>Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
