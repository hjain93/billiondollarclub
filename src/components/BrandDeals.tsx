import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  DollarSign, Plus, X, TrendingUp, Briefcase,
  CheckCircle, Edit3, Trash2,
  Share2, Award, Zap, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { BrandDeal } from '../types'

type DealStatus = BrandDeal['status']

const STATUS_CONFIG: Record<DealStatus, { label: string; color: string; bg: string }> = {
  prospect:    { label: 'Prospect',    color: '#4b5680', bg: 'rgba(75,86,128,0.15)' },
  negotiating: { label: 'Negotiating', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  contracted:  { label: 'Contracted',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  live:        { label: 'Live',        color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  completed:   { label: 'Completed',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  declined:    { label: 'Declined',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const STATUS_ORDER: DealStatus[] = ['prospect', 'negotiating', 'contracted', 'live', 'completed', 'declined']

const PLATFORM_RATES: Record<string, { base: number; per1k: number }> = {
  instagram: { base: 5000, per1k: 500 },
  youtube: { base: 8000, per1k: 800 },
  linkedin: { base: 6000, per1k: 600 },
  twitter: { base: 2000, per1k: 200 },
}

function empty(): Omit<BrandDeal, 'id' | 'createdAt'> {
  return { brand: '', platform: 'instagram', status: 'prospect', value: 0, deliverables: '', deadline: '', notes: '', category: '' }
}

export function BrandDeals() {
  const { brandDeals, addBrandDeal, updateBrandDeal, removeBrandDeal, profile } = useStore()
  const [activeTab, setActiveTab] = useState<'pipeline' | 'marketplace' | 'calculator'>('pipeline')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<BrandDeal | null>(null)
  const [form, setForm] = useState(empty())
  const [filterStatus, setFilterStatus] = useState<DealStatus | 'all'>('all')
  const [selectedDeal, setSelectedDeal] = useState<BrandDeal | null>(null)

  // Marketplace states
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(false)

  // Stats
  const totalValue = brandDeals.filter(d => ['contracted', 'live', 'completed'].includes(d.status)).reduce((s, d) => s + d.value, 0)
  const activeDeals = brandDeals.filter(d => ['contracted', 'live', 'negotiating'].includes(d.status)).length
  const completedDeals = brandDeals.filter(d => d.status === 'completed').length
  const pipelineValue = brandDeals.filter(d => ['prospect', 'negotiating'].includes(d.status)).reduce((s, d) => s + d.value, 0)

  // Rate calculator state
  const [calcPlatform, setCalcPlatform] = useState<string>('instagram')
  const [calcFollowers, setCalcFollowers] = useState<number>(10000)
  const [calcEngRate, setCalcEngRate] = useState<number>(4.5)
  const [calcDeliverables, setCalcDeliverables] = useState<number>(1)
  const [calcNiche, setCalcNiche] = useState<string>(profile?.niche || 'lifestyle')

  function openNew() {
    setEditing(null)
    setForm(empty())
    setDrawerOpen(true)
  }

  function openEdit(deal: BrandDeal) {
    setEditing(deal)
    setForm({ brand: deal.brand, platform: deal.platform, status: deal.status, value: deal.value, deliverables: deal.deliverables, deadline: deal.deadline || '', notes: deal.notes || '', category: deal.category || '' })
    setDrawerOpen(true)
    setSelectedDeal(null)
  }

  function saveDeal() {
    if (!form.brand.trim()) { toast.error('Brand name required'); return }
    if (editing) {
      updateBrandDeal(editing.id, form)
      toast.success('Deal updated')
    } else {
      addBrandDeal({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...form })
      toast.success('Deal added to pipeline!')
    }
    setDrawerOpen(false)
  }

  function deleteDeal(id: string) {
    removeBrandDeal(id)
    setSelectedDeal(null)
    toast.success('Deal removed')
  }

  // Rate calculator logic
  const rateConfig = PLATFORM_RATES[calcPlatform] || PLATFORM_RATES.instagram
  const baseRate = rateConfig.base + (calcFollowers / 1000) * rateConfig.per1k
  const engMultiplier = calcEngRate > 6 ? 1.4 : calcEngRate > 4 ? 1.2 : calcEngRate > 2 ? 1.0 : 0.8
  const nicheMultiplier = ['finance', 'tech', 'b2b'].includes(calcNiche) ? 1.3 : ['fitness', 'beauty'].includes(calcNiche) ? 1.15 : 1.0
  const calculatedRate = Math.round(baseRate * engMultiplier * nicheMultiplier * calcDeliverables)
  const minRate = Math.round(calculatedRate * 0.75)
  const maxRate = Math.round(calculatedRate * 1.4)

  const filtered = brandDeals.filter(d => filterStatus === 'all' || d.status === filterStatus)

  // Marketplace logic
  const brandMatchScore = useMemo(() => {
    // Simulated stable brand matching based on niche
    const niche = profile?.niche || 'general'
    const hash = niche.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return (hash % 21) + 80 // 80-100 range
  }, [profile?.niche])

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Creator Marketplace</h1>
            <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
              Build your data-backed pitch deck and manage premium partnerships
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
             <button className="btn btn-ghost btn-sm" onClick={() => setPublicProfileEnabled(!publicProfileEnabled)}>
               <Share2 size={13} /> {publicProfileEnabled ? 'Public Link: ON' : 'Share Profile'}
             </button>
             <button className="btn btn-blue btn-sm" onClick={openNew}><Plus size={13} /> New Deal</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { label: 'Total Earned', value: `₹${totalValue.toLocaleString('en-IN')}`, color: '#10b981', icon: <DollarSign size={14} /> },
            { label: 'Active Deals', value: activeDeals, color: '#3b82f6', icon: <Briefcase size={14} /> },
            { label: 'Completed', value: completedDeals, color: '#a78bfa', icon: <CheckCircle size={14} /> },
            { label: 'Pipeline Value', value: `₹${pipelineValue.toLocaleString('en-IN')}`, color: '#f59e0b', icon: <TrendingUp size={14} /> },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ padding: '16px 18px' }}>
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 2, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginTop: 20 }}>
          {(['pipeline', 'marketplace', 'calculator'] as const).map(t => (
            <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              {t === 'pipeline' ? 'Deal Pipeline' : t === 'marketplace' ? 'Verified Pitch Deck' : 'Rate Calculator'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Render selected tab */}
      {activeTab === 'pipeline' && (
        <PipelineView 
          filtered={filtered} 
          filterStatus={filterStatus} 
          setFilterStatus={setFilterStatus} 
          selectedDeal={selectedDeal} 
          setSelectedDeal={setSelectedDeal}
          openNew={openNew}
          openEdit={openEdit}
          deleteDeal={deleteDeal}
          updateBrandDeal={updateBrandDeal}
          brandDeals={brandDeals}
        />
      )}

      {activeTab === 'marketplace' && (
        <MarketplaceView 
          profile={profile} 
          completedDeals={completedDeals} 
          matchScore={brandMatchScore}
        />
      )}

      {activeTab === 'calculator' && (
        <CalculatorView 
          calcPlatform={calcPlatform} setCalcPlatform={setCalcPlatform}
          calcFollowers={calcFollowers} setCalcFollowers={setCalcFollowers}
          calcEngRate={calcEngRate} setCalcEngRate={setCalcEngRate}
          calcDeliverables={calcDeliverables} setCalcDeliverables={setCalcDeliverables}
          calcNiche={calcNiche} setCalcNiche={setCalcNiche}
          calculatedRate={calculatedRate} minRate={minRate} maxRate={maxRate}
          rateConfig={rateConfig} engMultiplier={engMultiplier} nicheMultiplier={nicheMultiplier}
          onAddDeal={() => { setForm(f => ({ ...f, value: calculatedRate, platform: calcPlatform as any })); setDrawerOpen(true); setEditing(null) }}
        />
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80 }} onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: '#111122', borderLeft: '1px solid rgba(59,130,246,0.2)', zIndex: 90, overflowY: 'auto' }}
            >
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>{editing ? 'Edit Deal' : 'New Brand Deal'}</h3>
                  <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="sec-label">Brand Name *</label>
                    <input className="field" placeholder="e.g. Nike, Boat, Mamaearth" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="sec-label">Platform</label>
                      <select className="field" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}>
                        {['instagram', 'youtube', 'linkedin', 'twitter'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="sec-label">Status</label>
                      <select className="field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DealStatus }))}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="sec-label">Deal Value (₹)</label>
                      <input className="field" type="number" placeholder="50000" value={form.value || ''} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="sec-label">Category</label>
                      <input className="field" placeholder="e.g. Tech, Beauty" value={form.category || ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="sec-label">Deliverables</label>
                    <textarea className="field" rows={3} placeholder="e.g. 1 reel + 3 stories + 1 YouTube integration" value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} />
                  </div>
                  <div>
                    <label className="sec-label">Deadline</label>
                    <input className="field" type="date" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div>
                    <label className="sec-label">Notes</label>
                    <textarea className="field" rows={2} placeholder="Contract terms, payment schedule, revisions policy..." value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button className="btn btn-blue" style={{ marginTop: 4 }} onClick={saveDeal}>
                    {editing ? 'Update Deal' : 'Add to Pipeline'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-Views ──────────────────────────────────────────────────────

function PipelineView({ filtered, filterStatus, setFilterStatus, selectedDeal, setSelectedDeal, openNew, openEdit, deleteDeal, updateBrandDeal, brandDeals }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['all', ...STATUS_ORDER] as const).map(s => {
          const cfg = s !== 'all' ? STATUS_CONFIG[s] : null
          const isActive = filterStatus === s
          return (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: isActive ? `1px solid ${cfg?.color || '#3b82f6'}` : '1px solid rgba(59,130,246,0.15)',
              background: isActive ? (cfg?.bg || 'rgba(59,130,246,0.12)') : 'transparent',
              color: isActive ? (cfg?.color || '#3b82f6') : '#4b5680',
              fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'all 140ms', textTransform: 'capitalize',
            }}>
              {s === 'all' ? 'All' : cfg?.label}
              {s !== 'all' && <span style={{ marginLeft: 6, opacity: 0.7 }}>{brandDeals.filter((d: any) => d.status === s).length}</span>}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px', color: '#4b5680' }}>
          <Briefcase size={36} style={{ margin: '0 auto 12px', opacity: 0.25 }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6b7a9a', marginBottom: 8 }}>No deals yet</div>
          <button className="btn btn-blue btn-sm" onClick={openNew}><Plus size={13} /> Add Deal</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map((deal: any, i: number) => {
            const cfg = STATUS_CONFIG[deal.status as DealStatus]
            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card"
                style={{ padding: '18px 20px', cursor: 'pointer', borderColor: selectedDeal?.id === deal.id ? 'rgba(59,130,246,0.35)' : undefined }}
                onClick={() => setSelectedDeal(selectedDeal?.id === deal.id ? null : deal)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>{deal.brand}</span>
                      <span style={{ fontSize: 10, background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, textTransform: 'capitalize' }}>{deal.platform}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>₹{deal.value.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                {selectedDeal?.id === deal.id && (
                  <div style={{ borderTop: '1px solid rgba(59,130,246,0.1)', marginTop: 14, paddingTop: 14 }}>
                     <div style={{ display: 'flex', gap: 8 }}>
                       <button className="btn btn-blue btn-xs" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); openEdit(deal) }}><Edit3 size={11} /> Edit</button>
                       <select
                         value={deal.status}
                         onClick={e => e.stopPropagation()}
                         onChange={e => { updateBrandDeal(deal.id, { status: e.target.value as DealStatus }); toast.success('Status updated') }}
                         style={{ flex: 1, background: '#111122', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#f0f4ff', fontSize: 11, padding: '5px 8px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
                       >
                         {STATUS_ORDER.map((s: string) => <option key={s} value={s}>{STATUS_CONFIG[s as DealStatus].label}</option>)}
                       </select>
                       <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); deleteDeal(deal.id) }}><Trash2 size={11} /></button>
                     </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function MarketplaceView({ profile, completedDeals, matchScore }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
         {/* Live Pitch Deck */}
         <div className="card" style={{ padding: 32, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0d0d1a, #15152a)' }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 32 }}>
               <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                 {profile?.name?.[0] || 'C'}
               </div>
               <div>
                 <h2 style={{ fontSize: 22, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em' }}>{profile?.name || 'Creator Name'}</h2>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle size={14} /> Verified Creator Account
                 </div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
               <div style={{ padding: 18, background: 'rgba(59,130,246,0.05)', borderRadius: 16, border: '1px solid rgba(59,130,246,0.1)' }}>
                  <div style={{ color: '#4b5680', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Subscribers</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>{(profile?.handles?.[0]?.followerCount || 10000 / 1000).toFixed(1)}K</div>
               </div>
               <div style={{ padding: 18, background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div style={{ color: '#4b5680', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Avg Views</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>12.4K</div>
               </div>
               <div style={{ padding: 18, background: 'rgba(245,158,11,0.05)', borderRadius: 16, border: '1px solid rgba(245,158,11,0.1)' }}>
                  <div style={{ color: '#4b5680', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Engagement</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff' }}>4.2%</div>
               </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', marginBottom: 12 }}>Niche Expertise</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                 {['Tech Reviews', 'Productivity', 'Digital Nomad'].map(tag => (
                   <span key={tag} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{tag}</span>
                 ))}
              </div>
            </div>
         </div>

         <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', marginBottom: 16 }}>Past Performance</h3>
            <div style={{ display: 'flex', gap: 24 }}>
               <div>
                 <div style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa' }}>{completedDeals}</div>
                 <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>Brand Partners</div>
               </div>
               <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6' }}>100%</div>
                  <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>Fulfillment Rate</div>
               </div>
            </div>
         </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
         <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 24, textAlign: 'center' }}>
            <Zap size={24} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Brand Match Score</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#f0f4ff' }}>{matchScore}%</div>
            <p style={{ fontSize: 12, color: '#6b7a9a', marginTop: 10 }}>Strong alignment with Tech & Lifestyle brands in the Indian market.</p>
         </div>

         <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', marginBottom: 14 }}>Brand Tools</h3>
             <button className="btn btn-blue btn-sm" style={{ width: '100%', marginBottom: 10 }}>
               <Globe size={13} /> View Public Profile
             </button>
             <button className="btn btn-ghost btn-sm" style={{ width: '100%' }}>
               <Award size={13} /> Apply to Agency Network
             </button>
         </div>
      </div>
    </motion.div>
  )
}

function CalculatorView({ calcPlatform, setCalcPlatform, calcFollowers, setCalcFollowers, calcEngRate, setCalcEngRate, calcNiche, setCalcNiche, calculatedRate, minRate, maxRate, rateConfig, engMultiplier, nicheMultiplier, onAddDeal }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Inputs */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', marginBottom: 20, letterSpacing: '-0.01em' }}>Rate Engine</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="sec-label">Platform</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['instagram', 'youtube', 'linkedin', 'twitter'].map(p => (
                <button key={p} onClick={() => setCalcPlatform(p)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: calcPlatform === p ? '1px solid #3b82f6' : '1px solid rgba(59,130,246,0.15)',
                  background: calcPlatform === p ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: calcPlatform === p ? '#3b82f6' : '#4b5680',
                  textTransform: 'capitalize', transition: 'all 140ms',
                }}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="sec-label">Followers: <span style={{ color: '#3b82f6' }}>{calcFollowers.toLocaleString()}</span></label>
            <input type="range" min={1000} max={5000000} step={1000} value={calcFollowers} onChange={e => setCalcFollowers(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#3b82f6' }} />
          </div>
          <div>
            <label className="sec-label">Engagement Rate: <span style={{ color: '#ec4899' }}>{calcEngRate}%</span></label>
            <input type="range" min={0.5} max={15} step={0.1} value={calcEngRate} onChange={e => setCalcEngRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#ec4899' }} />
          </div>
          <div>
            <label className="sec-label">Niche</label>
            <select value={calcNiche} onChange={e => setCalcNiche(e.target.value)}
              style={{ width: '100%', background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#f0f4ff', fontSize: 13, padding: '9px 12px', fontWeight: 500 }}>
              {['lifestyle', 'travel', 'fitness', 'beauty', 'finance', 'tech', 'food', 'fashion', 'b2b'].map(n => (
                <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.07))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 18, padding: '28px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Suggested Rate</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#10b981', letterSpacing: '-0.04em', lineHeight: 1 }}>₹{calculatedRate.toLocaleString('en-IN')}</div>
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: '#4b5680', marginBottom: 4 }}>Negotiation range</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>₹{minRate.toLocaleString('en-IN')} – ₹{maxRate.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Rate Breakdown</div>
          {[
            { label: 'Base rate', value: `₹${rateConfig.base.toLocaleString()}`, color: '#3b82f6' },
            { label: 'Audience size bonus', value: `₹${Math.round((calcFollowers / 1000) * rateConfig.per1k).toLocaleString()}`, color: '#3b82f6' },
            { label: `Engagement multiplier (${engMultiplier}x)`, value: `${engMultiplier >= 1 ? '+' : ''}${Math.round((engMultiplier - 1) * 100)}%`, color: calcEngRate > 4 ? '#10b981' : '#f59e0b' },
            { label: `Niche premium (${calcNiche})`, value: `${nicheMultiplier >= 1 ? '+' : ''}${Math.round((nicheMultiplier - 1) * 100)}%`, color: nicheMultiplier > 1 ? '#10b981' : '#4b5680' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: '#6b7a9a' }}>{item.label}</span>
              <span style={{ color: item.color, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-blue" onClick={onAddDeal}>
          <Plus size={14} /> Create Deal at This Rate
        </button>
      </div>
    </div>
  )
}
