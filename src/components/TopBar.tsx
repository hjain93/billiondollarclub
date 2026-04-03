import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Settings, Search, ChevronRight, Wand2, X, Sun, Moon, Zap, Menu } from 'lucide-react'
import { NotificationBell } from './NotificationIntelligence'
import { hasResolvedAIKey } from '../utils/aiKey'
import { TIER_LIMITS, TIER_META } from '../utils/entitlements'

const BREADCRUMBS: Record<string, string[]> = {
  'command-center': ['Command Center'],
  'ops-hq':         ['Command', 'Ops HQ'],
  'idea-engine':    ['Creation', 'Idea Engine'],
  'calendar':       ['Creation', 'Content Calendar'],
  'planner':        ['Creation', 'Daily Planner'],
  'studio':         ['Creation', 'Creation Studio'],
  'analytics':      ['Intelligence', 'Analytics'],
  'trends':         ['Intelligence', 'Trend Radar'],
  'content-dna':    ['Intelligence', 'Content DNA'],
  'brand-deals':    ['Revenue', 'Brand Deals'],
  'goals':          ['Goals & Milestones'],
}

function AIUsageMeter() {
  const { planTier, aiGenerationsUsed, setSettingsOpen } = useStore()
  const limit = TIER_LIMITS[planTier]?.aiGenerationsPerMonth ?? 10
  const pct = limit === Infinity ? 0 : Math.min(100, (aiGenerationsUsed / limit) * 100)
  const isNearLimit = pct >= 80
  const isAtLimit = aiGenerationsUsed >= limit && limit !== Infinity
  const color = isAtLimit ? '#ef4444' : isNearLimit ? '#f97316' : TIER_META[planTier].color

  if (limit === Infinity) return null

  return (
    <button
      onClick={() => setSettingsOpen(true)}
      title={`${aiGenerationsUsed}/${limit} AI generations used this month`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: isAtLimit ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.06)',
        border: `1px solid ${isAtLimit ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.15)'}`,
        borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
      }}
    >
      <Zap size={12} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.03em', lineHeight: 1 }}>
          {aiGenerationsUsed}/{limit} AI
        </span>
        <div style={{ width: 48, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 300ms ease' }} />
        </div>
      </div>
    </button>
  )
}

export function TopBar() {
  const { activeView, setSettingsOpen, profile, theme, setTheme, youtubeToken, instagramToken, mobileSidebarOpen, setMobileSidebarOpen } = useStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const crumbs = BREADCRUMBS[activeView] || [activeView]

  return (
    <div style={{
      height: 52,
      background: 'rgba(13,13,26,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(59,130,246,0.08)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Mobile hamburger */}
      <button
        className="mobile-hamburger"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 9,
          background: 'transparent', border: '1px solid rgba(59,130,246,0.15)',
          cursor: 'pointer', color: '#6b7a9a', flexShrink: 0,
        }}
      >
        <Menu size={16} />
      </button>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        {crumbs.map((c, i) => (
          <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} color="#2a3050" />}
            <span style={{
              fontSize: 13,
              fontWeight: i === crumbs.length - 1 ? 700 : 500,
              color: i === crumbs.length - 1 ? '#f0f4ff' : '#4b5680',
              letterSpacing: '-0.01em',
            }}>{c}</span>
          </span>
        ))}
      </div>

      {/* Search */}
      <AnimatePresence>
        {searchOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 9, padding: '6px 12px', overflow: 'hidden' }}
          >
            <Search size={14} color="#4b5680" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ideas, posts..."
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#f0f4ff', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            />
            <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex' }}>
              <X size={13} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setSearchOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#4b5680', fontSize: 12.5, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, transition: 'all 140ms' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.1)')}
          >
            <Search size={13} /> Search
            <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.1)', borderRadius: 4, padding: '1px 5px', color: '#3b82f6', fontWeight: 700 }}>⌘K</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI Usage Meter */}
      <AIUsageMeter />

      {/* API status */}
      {(youtubeToken || instagramToken || hasResolvedAIKey()) ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 10px', borderRadius: 20, color: '#10b981', fontWeight: 900, letterSpacing: '0.05em' }}>
          <div className="pulse-dot" style={{ width: 6, height: 6, background: '#10b981' }} />
          STRICT LIVE
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 10px', borderRadius: 20, color: '#ef4444', fontWeight: 900, letterSpacing: '0.05em' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
          MOCK PURGED
        </div>
      )}

      {/* Notifications */}
      <NotificationBell />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'transparent', border: '1px solid rgba(59,130,246,0.1)', cursor: 'pointer', color: '#6b7a9a', transition: 'all 140ms' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* Settings */}
      <button
        onClick={() => setSettingsOpen(true)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'transparent', border: '1px solid rgba(59,130,246,0.1)', cursor: 'pointer', color: '#6b7a9a', transition: 'all 140ms' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Settings size={15} />
      </button>

      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', cursor: 'pointer', flexShrink: 0 }}>
        {profile?.name?.[0]?.toUpperCase() || <Wand2 size={14} />}
      </div>
    </div>
  )
}
