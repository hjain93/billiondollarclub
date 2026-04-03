import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Users, BarChart3, Plus,
  ExternalLink, Globe, BookOpen, Layers, Zap,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'


import { useStore } from '../store'

export function CreatorStorefront() {
  const { products } = useStore()
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'customers' | 'preview'>('preview')

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0)

  return (
    <div style={{ padding: '28px 32px' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>D2C Storefront</h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Sell directly to your audience. Zero platform fees. Total independence.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => window.open('#', '_blank')}>
            <Globe size={14} /> Visit Storefront
          </button>
          <button className="btn btn-blue" onClick={() => toast.error('Product builder coming soon...')}>
            <Plus size={14} /> Create Product
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
         <div className="card" style={{ padding: 24 }}>
            <div style={{ color: '#10b981', marginBottom: 12 }}><CreditCard size={20} /></div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>${totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Lifetime Revenue</div>
         </div>
         <div className="card" style={{ padding: 24 }}>
            <div style={{ color: '#3b82f6', marginBottom: 12 }}><Package size={20} /></div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>{totalSales}</div>
            <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Items Sold</div>
         </div>
         <div className="card" style={{ padding: 24 }}>
            <div style={{ color: '#f59e0b', marginBottom: 12 }}><Users size={20} /></div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff' }}>17%</div>
            <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Audience Conv. Rate</div>
         </div>
      </div>

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(59,130,246,0.1)', marginBottom: 32 }}>
        {['preview', 'products', 'analytics', 'customers'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            style={{ padding: '12px 16px', background: 'none', border: 'none', color: activeTab === tab ? '#3b82f6' : '#4b5680', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none', transition: 'all 0.2s' }}
          >
            {tab === 'preview' ? 'Storefront Preview' : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'preview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {products.filter(p => p.status === 'active').map(product => (
                  <div key={product.id} className="card" style={{ padding: 24, border: 'none', background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(167,139,250,0.02))' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                           {product.type === 'ebook' ? <BookOpen size={20} /> : product.type === 'course' ? <Layers size={20} /> : <Zap size={20} />}
                        </div>
                     </div>
                     <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>{product.name}</h3>
                     <p style={{ fontSize: 12, color: '#a0aec0', marginBottom: 20 }}>Instant access digital download.</p>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: '#f0f4ff' }}>${product.price}</div>
                        <button className="btn btn-blue" onClick={() => {
                          toast.loading('Redirecting to Razorpay checkout...', { duration: 1500 });
                          setTimeout(() => toast.success('Mock Checkout Successful!'), 1600);
                        }}>
                           Buy Now
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}
        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {products.map(product => (
                  <div key={product.id} className="card" style={{ padding: 24, opacity: product.status === 'draft' ? 0.7 : 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                           {product.type === 'ebook' ? <BookOpen size={20} /> : product.type === 'course' ? <Layers size={20} /> : <Zap size={20} />}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: product.status === 'active' ? '#10b981' : '#4b5680', textTransform: 'uppercase' }}>{product.status}</span>
                     </div>
                     <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 8 }}>{product.name}</h3>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                           <div style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff' }}>${product.price}</div>
                           <div style={{ fontSize: 11, color: '#4b5680' }}>{product.sales} sales</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => toast.success('Sales page link copied!')}>
                           <ExternalLink size={12} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
             <div className="card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                   <BarChart3 size={24} color="#3b82f6" />
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff' }}>Content Attribution</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   {[
                     { source: 'Video: My Editing Secret', sales: 24, revenue: 1128 },
                     { source: 'Email: Weekly Digest #42', sales: 18, revenue: 846 },
                     { source: 'Reel: Why you need this', sales: 12, revenue: 564 },
                   ].map((attr, idx) => (
                     <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>{attr.source}</div>
                           <div style={{ height: 6, background: 'rgba(59,130,246,0.1)', borderRadius: 3, marginTop: 8 }}>
                              <div style={{ width: `${(attr.sales/30)*100}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                           </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                           <div style={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>+${attr.revenue}</div>
                           <div style={{ fontSize: 11, color: '#4b5680' }}>{attr.sales} sales</div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
