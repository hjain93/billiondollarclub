import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { useStore } from '../store'
import toast from 'react-hot-toast'

// ── Inline brand SVGs ────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.258 0c.072.888-.243 1.77-.762 2.43-.52.66-1.35 1.17-2.16 1.107-.09-.864.27-1.755.744-2.367C10.584.513 11.466.027 12.258 0zm2.7 4.653c-.144.09-2.214 1.278-2.19 3.798.03 2.997 2.628 3.996 2.664 4.014-.018.09-.414 1.422-1.368 2.793-.828 1.188-1.692 2.376-3.006 2.4-1.278.027-1.692-.762-3.156-.762-1.464 0-1.926.738-3.132.786-1.266.045-2.232-1.26-3.072-2.439C.03 13.257-.9 9.8.858 7.523c.879-1.134 2.19-1.854 3.6-1.872 1.26-.018 2.448.852 3.222.852.774 0 2.226-1.044 3.75-.888.639.027 2.43.258 3.582 1.935l-.054.103z" fill="white"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022"/>
      <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00"/>
      <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF"/>
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900"/>
    </svg>
  )
}

// ── AuthScreen ────────────────────────────────────────────────────────────────

export function AuthScreen() {
  const { setHasVisited } = useStore()
  const [loadingBtn, setLoadingBtn] = useState<string | null>(null)

  const proceedAsGuest = () => {
    setHasVisited(true)
    // isOnboarding remains true so Onboarding renders next
  }

  const handleSSO = async (provider: string) => {
    if (loadingBtn) return
    setLoadingBtn(provider)
    await new Promise(r => setTimeout(r, 300))
    toast(`SSO not configured — continuing as guest`, {
      icon: '🔐',
      style: {
        background: '#111122',
        color: '#f0f4ff',
        border: '1px solid rgba(59,130,246,0.22)',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: 13,
        fontWeight: 500,
      },
    })
    setLoadingBtn(null)
    proceedAsGuest()
  }

  const ssoButtons = [
    {
      id: 'google',
      label: 'Continue with Google',
      icon: <GoogleIcon />,
      style: {
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.12)',
        color: '#3c4043',
      },
    },
    {
      id: 'apple',
      label: 'Continue with Apple',
      icon: <AppleIcon />,
      style: {
        background: '#000',
        border: '1px solid #000',
        color: '#fff',
      },
    },
    {
      id: 'microsoft',
      label: 'Continue with Microsoft',
      icon: <MicrosoftIcon />,
      style: {
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.12)',
        color: '#2f2f2f',
      },
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg, #080810)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{
        background: 'var(--s1, #0d0d1a)',
        border: '1px solid var(--border, rgba(59,130,246,0.12))',
        borderRadius: 20,
        padding: 40,
        width: '100%',
        maxWidth: 420,
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 8px 24px rgba(59,130,246,0.3)',
          }}>
            <Wand2 size={24} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text, #f0f4ff)', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Creator Command
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-3, #4b5680)', textAlign: 'center', lineHeight: 1.5 }}>
            The command center for world-class creators
          </div>
        </div>

        {/* SSO Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {ssoButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => handleSSO(btn.id)}
              disabled={loadingBtn !== null}
              style={{
                ...btn.style,
                height: 48,
                width: '100%',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingBtn !== null ? 'default' : 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 150ms ease',
                opacity: loadingBtn === btn.id ? 0.7 : 1,
                boxSizing: 'border-box',
              }}
            >
              {loadingBtn === btn.id ? (
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2px solid currentColor',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
              ) : btn.icon}
              {loadingBtn === btn.id ? 'Connecting…' : btn.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(59,130,246,0.12))' }} />
          <span style={{ fontSize: 12, color: 'var(--text-3, #4b5680)', fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border, rgba(59,130,246,0.12))' }} />
        </div>

        {/* Guest button */}
        <button
          onClick={proceedAsGuest}
          disabled={loadingBtn !== null}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 10,
            background: 'transparent',
            border: '1px solid var(--border, rgba(59,130,246,0.12))',
            color: 'var(--text-2, #94a3b8)',
            fontSize: 13,
            fontWeight: 600,
            cursor: loadingBtn !== null ? 'default' : 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            transition: 'all 150ms ease',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          Continue as Guest
        </button>

        {/* Footer */}
        <p style={{ fontSize: 11, color: 'var(--text-3, #4b5680)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
          By continuing, you agree to our{' '}
          <span style={{ color: 'var(--blue, #3b82f6)', cursor: 'pointer' }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: 'var(--blue, #3b82f6)', cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
