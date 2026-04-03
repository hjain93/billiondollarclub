import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ErrorState({ error, onRetry, minHeight = 200 }: { error: string | Error; onRetry?: () => void; minHeight?: number | string }) {
  const message = typeof error === 'string' ? error : error.message || 'An unexpected error occurred.'
  
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight, width: '100%',
      background: 'rgba(239,68,68,0.05)',
      border: '1px dashed rgba(239,68,68,0.2)',
      borderRadius: 16,
      padding: 32,
      textAlign: 'center'
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <AlertTriangle size={20} color="#ef4444" />
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>Something went wrong</h3>
      <p style={{ fontSize: 13, color: '#ef4444', marginBottom: onRetry ? 20 : 0, maxWidth: 400, opacity: 0.9 }}>
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost" style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '8px 16px', fontSize: 12 }}>
          <RefreshCw size={13} style={{ marginRight: 6 }} /> Try Again
        </button>
      )}
    </div>
  )
}
