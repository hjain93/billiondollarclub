import React from 'react'

export function EmptyStudio({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#4b5680' }}>
      <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#3b82f6', opacity: 0.5 }}>
        {icon}
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, color: '#6b7a9a', marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

export const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7,
}

export function chipStyle(active: boolean, activeColor = '#3b82f6'): React.CSSProperties {
  return {
    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
    background: active ? `${activeColor}18` : 'transparent',
    border: `1px solid ${active ? activeColor : 'rgba(59,130,246,0.15)'}`,
    color: active ? activeColor : '#6b7a9a',
    transition: 'all 140ms',
  }
}
