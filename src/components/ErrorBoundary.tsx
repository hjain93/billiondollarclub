import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  viewId?: string
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Unknown error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] View "${this.props.viewId}" crashed:`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', padding: 32,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 380 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <AlertTriangle size={24} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Something went wrong
            </h3>
            <p style={{ fontSize: 13, color: '#6b7a9a', margin: '0 0 20px', lineHeight: 1.6 }}>
              {this.props.viewId
                ? `The "${this.props.viewId}" view encountered an error.`
                : 'This view encountered an unexpected error.'
              } Your data is safe — this only affects this view.
            </p>
            {this.state.errorMessage && (
              <div style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 8, padding: '8px 12px',
                fontSize: 11, color: '#ef4444', fontFamily: 'Space Mono, monospace',
                marginBottom: 20, textAlign: 'left', wordBreak: 'break-word',
              }}>
                {this.state.errorMessage}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 9, padding: '9px 20px',
                fontSize: 13, fontWeight: 700, color: '#3b82f6',
                cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              <RefreshCw size={14} /> Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
