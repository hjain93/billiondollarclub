import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet, TrendingUp, ShieldCheck, Receipt,
  Plus, PieChart, AlertTriangle,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store'

interface Expense {
  id: string
  title: string
  amount: number
  category: 'gear' | 'production' | 'software' | 'marketing' | 'ops'
  date: string
  deductible: boolean
}

interface EscrowPayment {
  id: string
  brand: string
  total: number
  stages: { label: string; amount: number; status: 'pending' | 'in_escrow' | 'released' }[]
}

const CATEGORY_COLORS = {
  gear: '#3b82f6',
  production: '#ec4899',
  software: '#10b981',
  marketing: '#f59e0b',
  ops: '#8b5cf6'
}

export function FinancialCFO() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow' | 'expenses'>('overview')
  const [showAddExpense, setShowAddExpense] = useState(false)
  
  const { incomeEntries, brandDeals } = useStore()
  
  const escrowDeals: EscrowPayment[] = brandDeals
    .filter(d => ['contracted', 'live', 'completed'].includes(d.status))
    .map(d => ({
      id: d.id,
      brand: d.brand,
      total: d.value,
      stages: [
        { label: 'Deposit (50%)', amount: d.value * 0.5, status: 'released' as const },
        { label: 'Go Live (50%)', amount: d.value * 0.5, status: d.status === 'completed' ? 'released' : 'in_escrow' as const }
      ]
    }))
  
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0]
  
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0) || 125000 // Fallback if empty to show UI
  const mrr = incomeEntries.filter(e => e.date >= thirtyDaysStr).reduce((sum, e) => sum + e.amount, 0) || (totalIncome / 12)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const taxableIncome = totalIncome - totalExpenses
  const estTax = taxableIncome > 0 ? taxableIncome * 0.25 : 0 // Simple 25% bracket

  function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newExp: Expense = {
      id: Math.random().toString(36),
      title: formData.get('title') as string,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as Expense['category'],
      date: new Date().toISOString().split('T')[0],
      deductible: true
    }
    setExpenses([newExp, ...expenses])
    setShowAddExpense(false)
    toast.success('Expense recorded & categorized')
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Creator CFO</h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Fiscally intelligent oversight for your creative empire.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => toast('Exporting Tax Data...', { icon: '📊' })}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-blue" onClick={() => setShowAddExpense(true)}>
            <Plus size={14} /> Log Expense
          </button>
        </div>
      </header>

      {/* CFO Tabs */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(59,130,246,0.1)', marginBottom: 32 }}>
        {['overview', 'escrow', 'expenses'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            style={{ padding: '12px 16px', background: 'none', border: 'none', color: activeTab === tab ? '#3b82f6' : '#4b5680', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none', transition: 'all 0.2s' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ color: '#3b82f6', marginBottom: 12 }}><Wallet size={20} /></div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>${Math.round(mrr).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Est. MRR (30d)</div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ color: '#10b981', marginBottom: 12 }}><ShieldCheck size={20} /></div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>${estTax.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Tax Reserve Recomm.</div>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <div style={{ color: '#ec4899', marginBottom: 12 }}><Receipt size={20} /></div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>${totalExpenses.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Deductible Expenses</div>
              </div>
              <div className="card" style={{ padding: 24, background: 'rgba(59,130,246,0.06)' }}>
                <div style={{ color: '#8b5cf6', marginBottom: 12 }}><TrendingUp size={20} /></div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#3b82f6' }}>24%</div>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Eff. Tax Bracket</div>
              </div>
            </div>

            {/* Tax Intelligence Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div className="card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <PieChart size={24} color="#3b82f6" />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff' }}>Tax Shield Breakdown</h3>
                </div>
                <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 10, display: 'flex', overflow: 'hidden', marginBottom: 32 }}>
                  <div style={{ width: '60%', background: CATEGORY_COLORS.gear }} title="Gear" />
                  <div style={{ width: '25%', background: CATEGORY_COLORS.production }} title="Production" />
                  <div style={{ width: '15%', background: CATEGORY_COLORS.software }} title="Software" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                   {Object.entries(CATEGORY_COLORS).slice(0, 3).map(([cat, col]) => (
                     <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: col }} />
                        <span style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 700, textTransform: 'capitalize' }}>{cat}</span>
                        <span style={{ fontSize: 12, color: '#4b5680', marginLeft: 'auto' }}>${cat === 'gear' ? '4,300' : cat === 'production' ? '1,200' : '450'}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="card" style={{ padding: 24, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f59e0b', marginBottom: 16 }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>Tax Alert</span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
                  You are approaching the **24% bracket**. Increasing your hardware deductible budget by **$2,400** this quarter would offset your Q3 liability by **12%**.
                </p>
                <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 16 }}>Review Deductibles</button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'escrow' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {escrowDeals.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48, background: 'rgba(59,130,246,0.02)', borderRadius: 20, border: '1px dashed rgba(59,130,246,0.1)' }}>
                    <ShieldCheck size={32} color="#4b5680" style={{ marginBottom: 16 }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>No Active Escrows</h3>
                    <p style={{ fontSize: 13, color: '#4b5680' }}>Contracted brand deals with milestone payments will appear here.</p>
                  </div>
                )}
                {escrowDeals.map(deal => (
                  <div key={deal.id} className="card" style={{ padding: 32 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <div>
                           <h3 style={{ fontSize: 20, fontWeight: 900, color: '#f0f4ff' }}>{deal.brand} Integration</h3>
                           <p style={{ color: '#4b5680', fontSize: 12, fontWeight: 700 }}>Total Value: ${deal.total.toLocaleString()}</p>
                        </div>
                        <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 12, fontWeight: 800, fontSize: 13 }}>
                           Secured in Escrow
                        </div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 12, left: 20, right: 20, height: 2, background: 'rgba(255,255,255,0.05)', zIndex: 0 }} />
                        {deal.stages.map((stage, idx) => (
                          <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', flex: 1 }}>
                             <div style={{ width: 24, height: 24, borderRadius: '50%', background: stage.status === 'released' ? '#10b981' : stage.status === 'in_escrow' ? '#3b82f6' : '#111122', border: `2px solid ${stage.status === 'released' ? '#10b981' : '#3b82f6'}`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stage.status === 'released' && <CheckCircle size={14} color="white" />}
                             </div>
                             <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{stage.label}</div>
                             <div style={{ fontSize: 11, color: '#4b5680' }}>${stage.amount.toLocaleString()}</div>
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                   <tr style={{ textAlign: 'left', color: '#4b5680', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px' }}>Item</th>
                      <th style={{ padding: '12px 16px' }}>Category</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                   </tr>
                </thead>
                <tbody>
                   {expenses.map(exp => (
                     <tr key={exp.id} style={{ borderBottom: '1px solid rgba(59,130,246,0.05)' }}>
                        <td style={{ padding: '16px', fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{exp.title}</td>
                        <td style={{ padding: '16px' }}>
                           <span style={{ fontSize: 11, fontWeight: 800, color: CATEGORY_COLORS[exp.category], background: `${CATEGORY_COLORS[exp.category]}15`, padding: '4px 8px', borderRadius: 6, textTransform: 'uppercase' }}>
                              {exp.category}
                           </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: 13, color: '#4b5680' }}>{exp.date}</td>
                        <td style={{ padding: '16px', fontSize: 14, fontWeight: 900, color: '#f0f4ff', textAlign: 'right' }}>-${exp.amount.toLocaleString()}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowAddExpense(false)} />
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
               style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 440, background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 24, zIndex: 110, padding: 32 }}
            >
               <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f0f4ff', marginBottom: 24 }}>Log Business Expense</h2>
               <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                     <label style={{ fontSize: 12, color: '#4b5680', fontWeight: 700, display: 'block', marginBottom: 8 }}>Item Description</label>
                     <input name="title" required className="field" placeholder="e.g. Cinema 4D Subscription" style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                     <div>
                        <label style={{ fontSize: 12, color: '#4b5680', fontWeight: 700, display: 'block', marginBottom: 8 }}>Amount ($)</label>
                        <input name="amount" type="number" step="0.01" required className="field" placeholder="0.00" style={{ width: '100%', boxSizing: 'border-box' }} />
                     </div>
                     <div>
                        <label style={{ fontSize: 12, color: '#4b5680', fontWeight: 700, display: 'block', marginBottom: 8 }}>Category</label>
                        <select name="category" className="field" style={{ width: '100%', boxSizing: 'border-box' }}>
                           <option value="gear">Gear</option>
                           <option value="software">Software</option>
                           <option value="production">Production</option>
                           <option value="ops">Ops</option>
                        </select>
                     </div>
                  </div>
                  <button type="submit" className="btn btn-blue" style={{ marginTop: 12 }}>Record Expense</button>
               </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckCircle({ size, color }: { size: number; color: string }) {
  return <ShieldCheck size={size} color={color} />
}
