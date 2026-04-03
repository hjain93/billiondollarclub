import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MessageSquare, Zap, Target, Star } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_CREATORS = [
  { id: '1', name: 'Ananya Sharma', niche: 'Tech & AI', followers: '120K', platform: 'YouTube', match: 94 },
  { id: '2', name: 'Rahul Varma', niche: 'Travel Photography', followers: '85K', platform: 'Instagram', match: 88 },
  { id: '3', name: 'Zoya Khan', niche: 'Productivity', followers: '42K', platform: 'LinkedIn', match: 91 },
]

export function CollabNetwork() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div style={{ padding: '28px 32px' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Collab Network</h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
            Connect with creators in your niche to multiply your reach through compounding network effects.
          </p>
        </div>
        <div style={{ display: 'flex', background: 'rgba(59,130,246,0.1)', borderRadius: 12, padding: '4px 12px', alignItems: 'center', gap: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
          <Star size={14} color="#fbbf24" fill="#fbbf24" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24' }}>Creator Rank: Gold</span>
        </div>
      </header>

      <div style={{ marginBottom: 24, position: 'relative' }}>
         <Search size={16} color="#4b5680" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
         <input 
           className="field" 
           placeholder="Search by niche, location, or platform..." 
           style={{ paddingLeft: 44 }}
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {DEMO_CREATORS.filter(c => c.niche.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => (
          <motion.div key={c.id} whileHover={{ y: -4 }} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
               <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff' }}>
                 {c.name[0]}
               </div>
               <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>{c.niche}</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
               <div style={{ padding: '8px 10px', background: 'rgba(59,130,246,0.05)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Audience</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#3b82f6' }}>{c.followers}</div>
               </div>
               <div style={{ padding: '8px 10px', background: 'rgba(59,130,246,0.05)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase' }}>Match</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{c.match}%</div>
               </div>
            </div>

            <button className="btn btn-ghost btn-sm" style={{ width: '100%', gap: 8 }} onClick={() => toast.success(`Proposal sent to ${c.name}!`)}>
               <MessageSquare size={13} /> Send Collab Proposal
            </button>
          </motion.div>
        ))}
      </div>

      {/* Recommended Strategy Section */}
      <div className="card" style={{ marginTop: 32, padding: '24px 28px', border: '1px solid rgba(59,130,246,0.25)', background: 'linear-gradient(135deg, rgba(8,8,16,0.4), rgba(59,130,246,0.05))' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, color: '#3b82f6' }}>
            <Zap size={18} />
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>Smart Collab Strategy</h3>
         </div>
         <p style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.6, marginBottom: 20 }}>
            Based on your recent <strong style={{ color: '#f0f4ff' }}>Travel & Lifestyle</strong> content, we recommend collaborating with <strong style={{ color: '#f0f4ff' }}>Rahul Varma</strong>. 
            Estimated audience overlap is <strong style={{ color: '#10b981' }}>12%</strong>, potentially adding <strong style={{ color: '#10b981' }}>5,200 new followers</strong> to your own audience moat.
         </p>
         <button className="btn btn-blue btn-sm" style={{ gap: 8 }}>
            <Target size={14} /> Generate Collab Script
         </button>
      </div>
    </div>
  )
}
