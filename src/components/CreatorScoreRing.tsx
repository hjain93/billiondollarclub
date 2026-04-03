import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { ContentIdea } from '../types'

function calcScore(ideas: ContentIdea[]) {
  const done = ideas.filter((i) => i.status === 'done').length
  const total = ideas.length
  if (total === 0) return 18
  const ratio = done / Math.max(total, 10)
  return Math.min(100, Math.round(18 + ratio * 82))
}

export function CreatorScoreRing() {
  const { ideas } = useStore()
  const score = calcScore(ideas)

  const radius = 22
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  const color = score >= 80 ? '#fbbf24' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f97316' : '#ef4444'
  const label = score >= 80 ? 'Elite' : score >= 60 ? 'Growing' : score >= 40 ? 'Building' : 'Starting'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
        <svg width="52" height="52" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="4" />
          <motion.circle
            cx="26" cy="26" r={radius}
            fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color,
        }}>
          {score}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#4b5680', marginBottom: 2 }}>Creator Score</div>
        <div style={{ fontSize: 11, fontWeight: 700, color }}>{label}</div>
      </div>
    </div>
  )
}
