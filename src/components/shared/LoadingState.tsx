import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

export function LoadingState({ message = 'Loading...', minHeight = 200 }: { message?: string; minHeight?: number | string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight, width: '100%',
      background: 'rgba(10,10,20,0.3)',
      border: '1px solid rgba(255,255,255,0.03)',
      borderRadius: 16,
      padding: 32,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        style={{ color: '#3b82f6', marginBottom: 16 }}
      >
        <RefreshCw size={28} />
      </motion.div>
      <div style={{ fontSize: 13, color: '#6b7a9a', fontWeight: 600, letterSpacing: '0.02em' }}>
        {message}
      </div>
    </div>
  )
}
