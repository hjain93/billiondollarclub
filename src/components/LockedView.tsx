import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

const VIEW_INFO: Record<string, { label: string; phase: string; desc: string }> = {
  calendar: {
    label: 'Content Calendar',
    phase: 'Phase 2',
    desc: 'Monthly/weekly/daily views, drag-and-drop scheduling, smart density indicators, and goal-aligned scheduling.',
  },
  planner: {
    label: 'Daily Planner',
    phase: 'Phase 2',
    desc: 'Prioritised daily queue, urgency system, and goal-impact ranking to focus on what matters most.',
  },
  studio: {
    label: 'Creation Studio',
    phase: 'Phase 2',
    desc: 'Reel script writer, caption lab, one-to-many repurposing engine, carousel creator, and voice-to-idea.',
  },
  analytics: {
    label: 'Analytics',
    phase: 'Phase 2',
    desc: 'Post-publish learning loop, what-works-for-you profile, engagement analytics, and goal tracking.',
  },
  trends: {
    label: 'Trend Radar',
    phase: 'Phase 3',
    desc: 'Live Google Trends + YouTube + NewsAPI, viral moment alerts, and India festival calendar integration.',
  },
}

export function LockedView({ viewId }: { viewId: string }) {
  const info = VIEW_INFO[viewId] || { label: viewId, phase: 'Phase 2', desc: 'Coming soon.' }

  return (
    <div
      style={{
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', maxWidth: 420 }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Lock size={28} color="#8b5cf6" />
        </div>
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(139,92,246,0.12)',
            color: '#8b5cf6',
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 20,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          {info.phase}
        </div>
        <h2
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700,
            fontSize: 22,
            color: '#e2e8f0',
            marginBottom: 12,
          }}
        >
          {info.label}
        </h2>
        <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          {info.desc}
        </p>
        <div
          style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.12)',
            borderRadius: 12,
            padding: '14px 20px',
            fontSize: 13,
            color: '#9ca3af',
          }}
        >
          This feature is actively being built. Phase 1 is live — start generating ideas and building your content pipeline now.
        </div>
      </motion.div>
    </div>
  )
}
