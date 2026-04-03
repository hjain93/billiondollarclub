import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { CreatorProfile, Platform } from '../types'
import { buildCreatorProfile, buildSessionTokenPayload, validateOnboardingForm } from '../utils/onboarding'
import {
  Wand2, Instagram, Youtube, Linkedin, Twitter,
  ChevronRight, ChevronLeft, Sparkles, Check, Eye, EyeOff, Rocket,
  Clock, Target, Users, TrendingUp, BookOpen, Laugh, Camera, Star,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const PLATFORMS: { id: Platform; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'instagram', label: 'Instagram', color: '#e1306c', icon: <Instagram size={18} /> },
  { id: 'youtube',   label: 'YouTube',   color: '#ff4444', icon: <Youtube size={18} /> },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0077b5', icon: <Linkedin size={18} /> },
  { id: 'twitter',   label: 'Twitter/X', color: '#1da1f2', icon: <Twitter size={18} /> },
]

const NICHES = [
  { label: 'Travel', emoji: '✈️' }, { label: 'Fitness', emoji: '💪' },
  { label: 'Finance', emoji: '💰' }, { label: 'Food', emoji: '🍕' },
  { label: 'Tech', emoji: '💻' }, { label: 'Fashion', emoji: '👗' },
  { label: 'Education', emoji: '📚' }, { label: 'Business', emoji: '📈' },
  { label: 'Lifestyle', emoji: '🌿' }, { label: 'Gaming', emoji: '🎮' },
  { label: 'Art & Design', emoji: '🎨' }, { label: 'Music', emoji: '🎵' },
  { label: 'Spirituality', emoji: '🧘' }, { label: 'Parenting', emoji: '👶' },
  { label: 'Comedy', emoji: '😂' }, { label: 'Sports', emoji: '⚽' },
]

const TONES = [
  { label: 'Witty & Humorous', emoji: '😄' },
  { label: 'Educational', emoji: '🧠' },
  { label: 'Motivational', emoji: '🔥' },
  { label: 'Personal / Raw', emoji: '💙' },
  { label: 'Professional', emoji: '💼' },
  { label: 'Storytelling', emoji: '📖' },
  { label: 'Controversial', emoji: '⚡' },
  { label: 'Spiritual', emoji: '🕊️' },
  { label: 'Cinematic', emoji: '🎬' },
  { label: 'Minimal / Clean', emoji: '🤍' },
]

const CREATOR_TYPES = [
  { id: 'influencer',  label: 'Influencer',   desc: 'Build audience & brand deals', emoji: '⭐' },
  { id: 'educator',   label: 'Educator',      desc: 'Teach skills & share knowledge', emoji: '🎓' },
  { id: 'entertainer',label: 'Entertainer',   desc: 'Entertain & grow community', emoji: '🎭' },
  { id: 'founder',    label: 'Founder',       desc: 'Build brand & attract customers', emoji: '🚀' },
]

const LANGUAGES = [
  { value: 'english',  label: 'English',  flag: '🇬🇧' },
  { value: 'hindi',    label: 'Hindi',    flag: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish', flag: '🇮🇳' },
]

// ─── Animated chip with spring checkmark (21st.dev pattern) ──────────────────

function AnimChip({
  label, emoji, selected, onClick, color = '#3b82f6',
}: {
  label: string; emoji?: string; selected: boolean
  onClick: () => void; color?: string
}) {
  return (
    <motion.button
      onClick={onClick}
      layout
      animate={{
        background: selected ? `${color}20` : 'rgba(255,255,255,0.03)',
        borderColor: selected ? color : 'rgba(59,130,246,0.15)',
        color: selected ? color : '#6b7a9a',
        scale: selected ? 1.02 : 1,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 12, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', border: '1.5px solid', fontFamily: 'Plus Jakarta Sans, sans-serif',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {emoji && <span style={{ fontSize: 15 }}>{emoji}</span>}
      <span>{label}</span>
      <motion.span
        animate={{ width: selected ? 18 : 0, marginLeft: selected ? 4 : 0, opacity: selected ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flexShrink: 0 }}
      >
        <AnimatePresence>
          {selected && (
            <motion.svg
              key="tick"
              width="16" height="16" viewBox="0 0 20 20" fill="none"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <motion.path
                d="M4 10.5L8 14.5L16 6.5"
                stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.22 }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
    </motion.button>
  )
}

// ─── Platform card (big card with color + follower input) ─────────────────────

function PlatformCard({
  platform, selected, followers, onToggle, onFollowers,
}: {
  platform: typeof PLATFORMS[0]; selected: boolean
  followers: string; onToggle: () => void; onFollowers: (v: string) => void
}) {
  return (
    <motion.div
      layout
      animate={{
        background: selected ? `${platform.color}14` : 'rgba(255,255,255,0.02)',
        borderColor: selected ? platform.color : 'rgba(59,130,246,0.12)',
        boxShadow: selected ? `0 0 20px ${platform.color}22` : 'none',
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ borderRadius: 16, border: '1.5px solid', padding: '14px 16px', cursor: 'pointer', position: 'relative' }}
      onClick={onToggle}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ color: selected ? platform.color : '#4b5680', transition: 'color 200ms' }}>
          {platform.icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? '#f0f4ff' : '#6b7a9a', flex: 1 }}>{platform.label}</span>
        <motion.div
          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
          style={{ width: 20, height: 20, borderRadius: '50%', background: platform.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Check size={11} color="#fff" strokeWidth={3} />
        </motion.div>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -8 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            style={{ overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>@handle</div>
                <input
                  className="field"
                  placeholder="@yourhandle"
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>Followers</div>
                <input
                  className="field"
                  type="number"
                  placeholder="e.g. 5000"
                  value={followers}
                  onChange={e => onFollowers(e.target.value)}
                  style={{ fontSize: 12, padding: '6px 10px' }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Niche Finder Quiz ───────────────────────────────────────────────────────

interface NicheResult {
  name: string
  opportunity: 'Emerging' | 'Growing' | 'Competitive'
  rpm: string
  timeToFollowers: string
  creators: string[]
  tone: string
}

interface QuizAnswers {
  q1: string
  q2: string
  q3: string
  q4: string
  q5: string
  q6: string
  q7: string
  q8: string
}

const QUIZ_Q3_OPTIONS = [
  { id: 'youtube', label: 'YouTube', icon: <Youtube size={18} /> },
  { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} /> },
  { id: 'tiktok', label: 'TikTok', icon: <Star size={18} /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={18} /> },
  { id: 'twitter', label: 'Twitter/X', icon: <Twitter size={18} /> },
]

const QUIZ_Q4_OPTIONS = [
  { id: '2-5', label: '2–5 hrs / week', sub: 'Side hustle pace' },
  { id: '5-10', label: '5–10 hrs / week', sub: 'Growing steadily' },
  { id: '10-20', label: '10–20 hrs / week', sub: 'Serious creator' },
  { id: '20+', label: '20+ hrs / week', sub: 'Full-time focus' },
]

const QUIZ_Q5_OPTIONS = [
  { id: 'educator', label: 'Educator', sub: 'I explain things', icon: <BookOpen size={16} /> },
  { id: 'entertainer', label: 'Entertainer', sub: 'I make people laugh', icon: <Laugh size={16} /> },
  { id: 'documenter', label: 'Documenter', sub: 'I show my journey', icon: <Camera size={16} /> },
  { id: 'curator', label: 'Curator', sub: 'I share the best of X', icon: <Star size={16} /> },
]

const QUIZ_Q6_OPTIONS = [
  { id: 'beginners', label: 'Beginners', sub: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', sub: 'Already learning' },
  { id: 'professionals', label: 'Professionals', sub: 'Experienced people' },
  { id: 'general', label: 'General audience', sub: 'Everyone' },
]

const QUIZ_Q7_OPTIONS = [
  { id: 'audience', label: 'Build audience', icon: <Users size={16} /> },
  { id: 'income', label: 'Make income', icon: <TrendingUp size={16} /> },
  { id: 'brand', label: 'Build brand', icon: <Target size={16} /> },
  { id: 'passion', label: 'Share passion', icon: <Star size={16} /> },
]

const QUIZ_Q8_OPTIONS = [
  { id: 'starter', label: '₹0–25k / mo', sub: 'Side income' },
  { id: 'growing', label: '₹25k–1L / mo', sub: 'Part-time income' },
  { id: 'established', label: '₹1L–5L / mo', sub: 'Full-time creator' },
  { id: 'elite', label: '₹5L+ / mo', sub: 'Business level' },
]

const ARCHETYPE_MAP: Record<string, { name: string; description: string; formats: string[]; tone: string }> = {
  educator: {
    name: 'The Expert Educator',
    description: 'You break down complex topics and make learning accessible. Your audience trusts you as a reliable guide in your niche.',
    formats: ['How-to tutorials', 'Step-by-step guides', 'Explainer videos', 'Tip carousels'],
    tone: 'Educational',
  },
  entertainer: {
    name: 'The Magnetic Entertainer',
    description: 'You captivate audiences with humor, personality, and energy. People watch you not just for information, but for the experience.',
    formats: ['Reaction videos', 'Comedy skits', 'Challenges', 'Storytime content'],
    tone: 'Witty & Humorous',
  },
  documenter: {
    name: 'The Authentic Documenter',
    description: 'You share your real journey, wins, and failures. Your raw honesty builds deep audience loyalty and trust.',
    formats: ['Vlogs', 'Day-in-my-life', 'Progress updates', 'Behind-the-scenes'],
    tone: 'Personal / Raw',
  },
  curator: {
    name: 'The Taste-Making Curator',
    description: 'You find, filter, and share the best content, tools, and ideas. Your audience values your taste and saves your posts constantly.',
    formats: ['Resource roundups', 'Best-of lists', 'Tool reviews', 'Weekly digests'],
    tone: 'Professional',
  },
}

function buildNicheResults(answers: QuizAnswers): NicheResult[] {
  const topic1 = answers.q1.trim() || 'your topic'
  const topic2 = answers.q2.trim() || 'your expertise'
  const platform = answers.q3
  const timeSlot = answers.q4
  const style = answers.q5
  const goal = answers.q7
  const income = answers.q8

  const timeToFollowers: Record<string, Record<string, string>> = {
    '2-5': { starter: '12–18 months', growing: '8–14 months', established: '6–10 months', elite: '4–8 months' },
    '5-10': { starter: '8–12 months', growing: '5–9 months', established: '4–7 months', elite: '3–6 months' },
    '10-20': { starter: '5–8 months', growing: '3–6 months', established: '2–5 months', elite: '2–4 months' },
    '20+': { starter: '3–5 months', growing: '2–4 months', established: '1–3 months', elite: '1–2 months' },
  }

  const ttf = timeToFollowers[timeSlot]?.[income] || '6–12 months'

  const styleLabel = style === 'educator' ? 'Educational' : style === 'entertainer' ? 'Entertainment' : style === 'documenter' ? 'Documentary' : 'Curation'
  const platformLabel = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Multi-platform'
  const goalLabel = goal === 'income' ? 'Monetized' : goal === 'brand' ? 'Brand-Led' : goal === 'audience' ? 'Community' : 'Passion'

  return [
    {
      name: `${styleLabel} ${topic1.split(' ').slice(0, 3).join(' ')} on ${platformLabel}`,
      opportunity: 'Growing',
      rpm: platform === 'youtube' ? '₹120–₹350 CPM' : platform === 'linkedin' ? 'Brand deals focused' : '₹40–₹150 CPM',
      timeToFollowers: ttf,
      creators: ['Ranveer Allahbadia (BeerBiceps)', 'Nikhil Kamath', 'Ankur Warikoo'],
      tone: ARCHETYPE_MAP[style]?.tone || 'Educational',
    },
    {
      name: `${goalLabel} ${topic2.split(' ').slice(0, 3).join(' ')} Creator`,
      opportunity: 'Emerging',
      rpm: '₹80–₹250 CPM',
      timeToFollowers: ttf,
      creators: ['Ishan Sharma', 'Raj Shamani', 'Figma Faiz'],
      tone: ARCHETYPE_MAP[style]?.tone || 'Motivational',
    },
    {
      name: `Indian ${topic1.split(' ').slice(0, 2).join(' ')} & ${topic2.split(' ').slice(0, 2).join(' ')} Content`,
      opportunity: 'Competitive',
      rpm: '₹60–₹200 CPM',
      timeToFollowers: ttf,
      creators: ['Dhruv Rathee', 'CA Rachana Phadke', 'Warikoo'],
      tone: ARCHETYPE_MAP[style]?.tone || 'Storytelling',
    },
  ]
}

function NicheFinderQuiz({ onComplete, onSkip }: { onComplete: (niche: string, tone: string) => void; onSkip: () => void }) {
  const [qStep, setQStep] = useState(0)
  const [qDir, setQDir] = useState(1)
  const [answers, setAnswers] = useState<QuizAnswers>({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '' })
  const [showResults, setShowResults] = useState(false)
  const [nicheResults, setNicheResults] = useState<NicheResult[]>([])

  const totalQ = 8

  function answer(key: keyof QuizAnswers, val: string) {
    setAnswers(prev => ({ ...prev, [key]: val }))
  }

  function goQ(n: number) {
    setQDir(n)
    setQStep(s => s + n)
  }

  function canNextQ() {
    const qKey = `q${qStep + 1}` as keyof QuizAnswers
    return answers[qKey].trim().length > 0
  }

  function finish() {
    const results = buildNicheResults(answers)
    setNicheResults(results)
    setShowResults(true)
  }

  const qVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0, filter: 'blur(3px)' }),
    center: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0, filter: 'blur(3px)' }),
  }

  const archetype = ARCHETYPE_MAP[answers.q5] || ARCHETYPE_MAP['educator']

  if (showResults) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 8 }}>
          Your Niche Recommendations
        </h2>
        <p style={{ fontSize: 13, color: '#4b5680', lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>
          Based on your answers, here are 3 niches perfectly matched to your style, goals, and time.
        </p>

        {/* Archetype card */}
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {answers.q5 === 'educator' ? <BookOpen size={18} color="#fff" /> : answers.q5 === 'entertainer' ? <Laugh size={18} color="#fff" /> : answers.q5 === 'documenter' ? <Camera size={18} color="#fff" /> : <Star size={18} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Your Creator Archetype</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff', marginBottom: 5 }}>{archetype.name}</div>
              <div style={{ fontSize: 12, color: '#6b7a9a', lineHeight: 1.5, marginBottom: 8 }}>{archetype.description}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {archetype.formats.map(f => (
                  <span key={f} style={{ fontSize: 10.5, padding: '3px 9px', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', borderRadius: 8, fontWeight: 600 }}>{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Niche recommendation cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {nicheResults.map((niche, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: i === 0 ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${i === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)'}`,
                borderRadius: 12, padding: '14px 16px', position: 'relative',
              }}
            >
              {i === 0 && (
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Best Match
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', flex: 1, paddingRight: 60 }}>{niche.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
                  background: niche.opportunity === 'Emerging' ? 'rgba(16,185,129,0.12)' : niche.opportunity === 'Growing' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                  color: niche.opportunity === 'Emerging' ? '#10b981' : niche.opportunity === 'Growing' ? '#f59e0b' : '#ef4444',
                }}>
                  {niche.opportunity}
                </span>
                <span style={{ fontSize: 10.5, color: '#6b7a9a', padding: '3px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>{niche.rpm}</span>
                <span style={{ fontSize: 10.5, color: '#a78bfa', padding: '3px 10px', background: 'rgba(167,139,250,0.1)', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={10} /> 1K followers: {niche.timeToFollowers}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#4b5680', marginBottom: 10 }}>
                Study: {niche.creators.join(' · ')}
              </div>
              <button
                onClick={() => onComplete(niche.name, niche.tone)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                  background: i === 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(59,130,246,0.1)',
                  border: i === 0 ? 'none' : '1px solid rgba(59,130,246,0.2)',
                  color: i === 0 ? '#fff' : '#3b82f6', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif',
                  boxShadow: i === 0 ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                Start with this niche <ChevronRight size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {Array.from({ length: totalQ }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 3,
              background: i < qStep ? '#3b82f6' : i === qStep ? 'linear-gradient(90deg, #3b82f6, #ec4899)' : 'rgba(59,130,246,0.1)',
              transition: 'background 300ms',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Question {qStep + 1} of {totalQ}
        </span>
        <button
          onClick={onSkip}
          style={{ marginLeft: 'auto', fontSize: 11, color: '#2a3050', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}
        >
          Skip — I know my niche →
        </button>
      </div>

      {/* Question area */}
      <div style={{ minHeight: 300, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" custom={qDir}>
          <motion.div
            key={qStep}
            custom={qDir}
            variants={qVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
          >
            {/* Q1 */}
            {qStep === 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  What topic could you talk about for 3 hours without notes?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>This is usually the sweet spot for your niche.</p>
                <input
                  autoFocus
                  className="field"
                  value={answers.q1}
                  onChange={e => answer('q1', e.target.value)}
                  placeholder="e.g. personal finance, travel hacking, coding in Python..."
                  onKeyDown={e => e.key === 'Enter' && canNextQ() && goQ(1)}
                  style={{ fontSize: 14, padding: '12px 14px' }}
                />
              </div>
            )}

            {/* Q2 */}
            {qStep === 1 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  What do friends and family ask you for advice on?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>This reveals your natural expertise that others already value.</p>
                <input
                  autoFocus
                  className="field"
                  value={answers.q2}
                  onChange={e => answer('q2', e.target.value)}
                  placeholder="e.g. investing money, fixing tech problems, healthy recipes..."
                  onKeyDown={e => e.key === 'Enter' && canNextQ() && goQ(1)}
                  style={{ fontSize: 14, padding: '12px 14px' }}
                />
              </div>
            )}

            {/* Q3 */}
            {qStep === 2 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  Which platform feels most natural to you?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>Pick the one you actually enjoy consuming content on.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {QUIZ_Q3_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q3', opt.id)}
                      animate={{
                        background: answers.q3 === opt.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q3 === opt.id ? '#3b82f6' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <span style={{ color: answers.q3 === opt.id ? '#3b82f6' : '#4b5680', transition: 'color 200ms' }}>{opt.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: answers.q3 === opt.id ? '#3b82f6' : '#f0f4ff' }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Q4 */}
            {qStep === 3 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  How much time can you commit per week?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>Be realistic — consistency beats bursts.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {QUIZ_Q4_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q4', opt.id)}
                      animate={{
                        background: answers.q4 === opt.id ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q4 === opt.id ? '#10b981' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <Clock size={15} color={answers.q4 === opt.id ? '#10b981' : '#4b5680'} style={{ flexShrink: 0 }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: answers.q4 === opt.id ? '#10b981' : '#f0f4ff' }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: '#4b5680', marginTop: 1 }}>{opt.sub}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Q5 */}
            {qStep === 4 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  What's your content style?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>This becomes your creator archetype.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {QUIZ_Q5_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q5', opt.id)}
                      animate={{
                        background: answers.q5 === opt.id ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q5 === opt.id ? '#ec4899' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      <span style={{ color: answers.q5 === opt.id ? '#ec4899' : '#4b5680', transition: 'color 200ms' }}>{opt.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: answers.q5 === opt.id ? '#ec4899' : '#f0f4ff' }}>{opt.label}</span>
                      <span style={{ fontSize: 11, color: '#4b5680' }}>{opt.sub}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Q6 */}
            {qStep === 5 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  Who do you want to help?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>The more specific your audience, the faster you grow.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {QUIZ_Q6_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q6', opt.id)}
                      animate={{
                        background: answers.q6 === opt.id ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q6 === opt.id ? '#a78bfa' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'left' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700, color: answers.q6 === opt.id ? '#a78bfa' : '#f0f4ff', marginBottom: 2 }}>{opt.label}</div>
                      <div style={{ fontSize: 11, color: '#4b5680' }}>{opt.sub}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Q7 */}
            {qStep === 6 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  What's your main goal?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>This shapes the type of content you prioritize.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {QUIZ_Q7_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q7', opt.id)}
                      animate={{
                        background: answers.q7 === opt.id ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q7 === opt.id ? '#f59e0b' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      <span style={{ color: answers.q7 === opt.id ? '#f59e0b' : '#4b5680' }}>{opt.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: answers.q7 === opt.id ? '#f59e0b' : '#f0f4ff' }}>{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Q8 */}
            {qStep === 7 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 8 }}>
                  What's your income goal?
                </h2>
                <p style={{ fontSize: 12.5, color: '#4b5680', marginBottom: 18, lineHeight: 1.6 }}>Set an honest target — it'll help calibrate your niche recommendations.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {QUIZ_Q8_OPTIONS.map(opt => (
                    <motion.button
                      key={opt.id}
                      onClick={() => answer('q8', opt.id)}
                      animate={{
                        background: answers.q8 === opt.id ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: answers.q8 === opt.id ? '#10b981' : 'rgba(59,130,246,0.12)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      style={{ padding: '12px 16px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: answers.q8 === opt.id ? '#10b981' : '#f0f4ff' }}>{opt.label}</span>
                      <span style={{ fontSize: 11, color: '#4b5680' }}>{opt.sub}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(59,130,246,0.08)' }}>
        <div>
          {qStep > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => goQ(-1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 13, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 4px' }}
            >
              <ChevronLeft size={16} /> Back
            </motion.button>
          )}
        </div>
        <motion.button
          whileHover={{ scale: canNextQ() ? 1.02 : 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={qStep < totalQ - 1 ? () => goQ(1) : finish}
          disabled={!canNextQ()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', borderRadius: 12,
            background: canNextQ() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(59,130,246,0.15)',
            border: 'none', color: canNextQ() ? '#fff' : '#2a3050',
            fontSize: 13, fontWeight: 700, cursor: canNextQ() ? 'pointer' : 'not-allowed',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: canNextQ() ? '0 4px 14px rgba(59,130,246,0.3)' : 'none',
            transition: 'all 200ms',
          }}
        >
          {qStep === totalQ - 1 ? <><Sparkles size={14} /> See My Niches</> : <>Next <ChevronRight size={14} /></>}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Step variants ────────────────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0, filter: 'blur(4px)' }),
  center: { x: 0, opacity: 1, filter: 'blur(0px)' },
  exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, filter: 'blur(4px)' }),
}

// ─── Left context panel ───────────────────────────────────────────────────────

function ContextPanel({ step, form }: { step: number; form: any }) {
  const previews = [
    {
      icon: '👋',
      title: 'Welcome, Creator',
      body: "We'll build your AI-powered command center in under 60 seconds.",
      tip: 'No account needed. Everything stored locally.',
    },
    {
      icon: '🔍',
      title: 'Find your niche',
      body: '8 quick questions to pinpoint your perfect niche. Get 3 data-backed recommendations with RPM estimates and growth timelines.',
      tip: 'Already know your niche? Skip this step.',
    },
    {
      icon: '🎯',
      title: 'Pick your niche',
      body: 'Your niche trains our AI to generate hyper-relevant ideas, hooks, and trends for you.',
      tip: 'Select 1–3 niches for the best personalisation.',
    },
    {
      icon: '📡',
      title: 'Where do you create?',
      body: 'Tell us your platforms and we\'ll tailor content formats, scheduling windows, and rate calculations.',
      tip: 'You can add more platforms later in Settings.',
    },
    {
      icon: '🎤',
      title: 'Your creator voice',
      body: 'Tone + language tells our AI how you speak. It\'ll mirror your style across scripts, captions, and ideas.',
      tip: 'Pick 2–3 tones that feel most like you.',
    },
    {
      icon: '🔑',
      title: 'Power up with AI',
      body: 'Add your Anthropic API key to unlock real AI generation. Without it, demo mode is still very capable.',
      tip: 'Get a key at console.anthropic.com — it\'s fast and cheap.',
    },
  ]

  const p = previews[step] ?? previews[0]

  return (
    <div style={{ flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', borderRight: '1px solid rgba(59,130,246,0.1)' }}>
      {/* Background decoration */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.05), transparent 70%)', pointerEvents: 'none' }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ fontSize: 52, marginBottom: 20 }}>{p.icon}</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 14 }}>
            {p.title}
          </h2>
          <p style={{ fontSize: 15, color: '#6b7a9a', lineHeight: 1.7, marginBottom: 24, maxWidth: 280 }}>
            {p.body}
          </p>
          <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#4b5680', lineHeight: 1.6 }}>
            💡 {p.tip}
          </div>

          {/* Live preview of selections */}
          {step === 2 && form.niche.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.niche.map((n: string) => (
                <motion.span
                  key={n}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 12, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}
                >
                  {n}
                </motion.span>
              ))}
            </div>
          )}

          {step === 3 && form.platforms.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              {form.platforms.map((pid: string) => {
                const p2 = PLATFORMS.find(p => p.id === pid)
                return p2 ? (
                  <motion.div key={pid} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ color: p2.color }}>{p2.icon}</motion.div>
                ) : null
              })}
            </div>
          )}

          {step === 4 && form.tone.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {form.tone.map((t: string) => (
                <motion.span key={t} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{ fontSize: 12, background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>{t}</motion.span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── URL Magic helpers ────────────────────────────────────────────────────────

function extractChannelSlug(url: string): string {
  const raw = url.trim()
  if (!raw) return 'Creator'
  const safe = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const parsed = new URL(safe)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const parts = parsed.pathname.split('/').filter(Boolean)

    if (host.includes('youtube.com') || host === 'youtu.be') {
      if (host === 'youtu.be') return 'Creator'
      if (parts.length === 0) return 'Creator'
      if (parts[0].startsWith('@')) return parts[0].slice(1)
      if ((parts[0] === 'channel' || parts[0] === 'c' || parts[0] === 'user') && parts[1]) return parts[1]
      return parts[0]
    }

    if (host.includes('instagram.com')) {
      return parts[0] || 'Creator'
    }
  } catch {
    // fallback to legacy parsing below
  }

  const m = raw.match(/youtube\.com\/@([^/\s?]+)/) || raw.match(/youtube\.com\/(?:channel|c|user)\/([^/\s?]+)/)
  if (m) return m[1]
  const ig = raw.match(/instagram\.com\/([^/\s?]+)/)
  if (ig) return ig[1]
  return raw.replace(/https?:\/\/(www\.)?/, '').split('/')[1]?.split('?')[0] || 'Creator'
}

function inferNicheFromSlug(slug: string): string {
  const s = slug.toLowerCase()
  if (/tech|code|dev|program|app|software|ai|geek/.test(s)) return 'Tech'
  if (/fit|gym|health|yoga|workout|sport/.test(s)) return 'Fitness'
  if (/finance|money|invest|crypto|wealth|stock/.test(s)) return 'Finance'
  if (/food|cook|recipe|eat|chef|bake/.test(s)) return 'Food'
  if (/travel|explore|wander|adventure/.test(s)) return 'Travel'
  if (/fashion|style|outfit|beauty|skin/.test(s)) return 'Fashion'
  if (/edu|learn|study|class|teach|school/.test(s)) return 'Education'
  if (/biz|business|startup|entrepreneur|brand/.test(s)) return 'Business'
  if (/life|vlog|daily|family|lifestyle/.test(s)) return 'Lifestyle'
  if (/game|gaming|play|esport/.test(s)) return 'Gaming'
  return 'Lifestyle'
}

function inferPlatform(url: string): Platform {
  if (url.includes('youtube')) return 'youtube'
  if (url.includes('instagram')) return 'instagram'
  if (url.includes('twitter') || url.includes('x.com')) return 'twitter'
  if (url.includes('linkedin')) return 'linkedin'
  return 'youtube'
}

async function resolveProfileFromUrl(url: string, fallback: { name: string; niche: string; platform: Platform; followers: number | null }) {
  const safe = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
  try {
    const parsed = new URL(safe)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()
    const parts = parsed.pathname.split('/').filter(Boolean)

    // Use YouTube oEmbed to resolve the actual channel/author from channel or video URLs.
    if (host.includes('youtube.com') || host === 'youtu.be') {
      const directHandle =
        parts[0]?.startsWith('@')
          ? parts[0].slice(1)
          : (parts[0] === 'c' || parts[0] === 'user') && parts[1]
            ? parts[1]
            : ''

      // Deterministic direct parse for account URLs; no random guessing.
      if (directHandle) {
        const clean = directHandle.replace(/[^\w.-]/g, '').trim()
        const inferredNiche = inferNicheFromSlug(clean)
        return {
          ...fallback,
          name: clean || fallback.name,
          niche: inferredNiche || fallback.niche,
          platform: 'youtube' as Platform,
          followers: null,
        }
      }

      // For video/short URLs, use oEmbed to get the actual author.
      // Also use oEmbed for /channel/UC... URLs because the path is an ID, not a user-facing name.
      const oembed = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(safe)}&format=json`)
      if (oembed.ok) {
        const data = await oembed.json()
        const resolvedName = (data?.author_name || fallback.name || 'Creator').trim()
        const authorUrl = data?.author_url || ''
        const inferredSlug = authorUrl ? extractChannelSlug(authorUrl) : extractChannelSlug(safe)
        const inferredNiche = inferNicheFromSlug(`${resolvedName} ${inferredSlug}`)
        return {
          ...fallback,
          name: resolvedName || inferredSlug || fallback.name,
          niche: inferredNiche || fallback.niche,
          platform: 'youtube' as Platform,
          followers: null,
        }
      }
    }
  } catch {
    // fallback to heuristic
  }
  return fallback
}

export function Onboarding() {
  const { setProfile, setTokens } = useStore()
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [launching, setLaunching] = useState(false)
  // step 0=Identity, 1=NicheQuiz, 2=Niche, 3=Platforms, 4=Voice, 5=Integrations
  const totalSteps = 6

  // URL Magic state
  const [showUrlMagic, setShowUrlMagic] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [urlAnalyzing, setUrlAnalyzing] = useState(false)
  const [urlDone, setUrlDone] = useState(false)
  const [urlDetected, setUrlDetected] = useState<{ name: string; niche: string; platform: Platform; followers: number | null } | null>(null)

  const [form, setForm] = useState({
    name: '',
    creatorType: '',
    niche: [] as string[],
    platforms: [] as Platform[],
    platformFollowers: {} as Record<string, string>,
    tone: [] as string[],
    strengths: '',
    inspirations: '',
    contentLanguage: 'hinglish' as CreatorProfile['contentLanguage'],
    anthropicKey: '',
    geminiKey: '',
    openaiKey: '',
    activeAIProvider: 'anthropic' as 'anthropic' | 'gemini' | 'openai',
    useDemoMode: false,
  })

  async function analyzeUrl() {
    if (!urlInput.trim()) return
    setUrlAnalyzing(true)
    const slug = extractChannelSlug(urlInput)
    const niche = inferNicheFromSlug(slug)
    const platform = inferPlatform(urlInput)
    const name = slug || 'Creator'
    const followers: number | null = null
    const fallbackDetected = { name, niche, platform, followers }

    const detected = await resolveProfileFromUrl(urlInput, fallbackDetected)

    setUrlDetected(detected)
    setUrlAnalyzing(false)
    setUrlDone(true)
  }

  function applyUrlMagic() {
    if (!urlDetected) return
    setForm(f => ({
      ...f,
      name: urlDetected.name,
      creatorType: f.creatorType || 'influencer',
      niche: [urlDetected.niche],
      platforms: [urlDetected.platform],
      platformFollowers: urlDetected.followers != null ? { [urlDetected.platform]: String(urlDetected.followers) } : {},
      tone: ['Storytelling'],
    }))
    setShowUrlMagic(false)
    setDir(1)
    setStep(2) // Skip to Niche confirmation since we pre-filled
  }

  // ── URL Magic Screen ──────────────────────────────────────────────────────
  if (showUrlMagic) {
    return (
      <div style={{ minHeight: '100vh', background: '#060612', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div style={{ position: 'fixed', top: '5%', left: '15%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '5%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(236,72,153,0.05), transparent 65%)', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
          style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
              <Wand2 size={18} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: 18, color: '#f0f4ff', letterSpacing: '-0.02em' }}>CreatorCommand</span>
          </div>

          <AnimatePresence mode="wait">
            {!urlDone ? (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: 14 }}>
                  Your command center<br />
                  <span style={{ background: 'linear-gradient(135deg, #3b82f6, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    in 30 seconds.
                  </span>
                </h1>
                <p style={{ fontSize: 15, color: '#6b7a9a', lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
                  Paste your channel or best video URL — Creator Command reverse-engineers your entire content strategy instantly.
                </p>

                <div style={{ position: 'relative', marginBottom: 14 }}>
                  <Youtube size={18} color="#4b5680" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    autoFocus
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && urlInput.trim() && !urlAnalyzing && analyzeUrl()}
                    placeholder="https://youtube.com/@yourchannel or paste a video URL..."
                    style={{
                      width: '100%', paddingLeft: 48, padding: '16px 20px 16px 48px',
                      background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(59,130,246,0.2)',
                      borderRadius: 14, color: '#f0f4ff', fontSize: 14, fontFamily: 'Plus Jakarta Sans, sans-serif',
                      outline: 'none', boxSizing: 'border-box', fontWeight: 500,
                      transition: 'border-color 150ms',
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)' }}
                  />
                </div>

                <motion.button
                  onClick={analyzeUrl}
                  disabled={!urlInput.trim() || urlAnalyzing}
                  whileHover={{ scale: urlInput.trim() ? 1.01 : 1 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none',
                    background: urlInput.trim() ? 'linear-gradient(135deg, #3b82f6, #ec4899)' : 'rgba(59,130,246,0.12)',
                    color: urlInput.trim() ? '#fff' : '#2a3050',
                    fontSize: 15, fontWeight: 800, cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.01em',
                    boxShadow: urlInput.trim() ? '0 8px 28px rgba(59,130,246,0.3)' : 'none',
                    transition: 'all 200ms', marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {urlAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                      />
                      Analyzing your content DNA...
                    </>
                  ) : (
                    <><Sparkles size={16} /> Analyze & Auto-Setup</>
                  )}
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setShowUrlMagic(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 13, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  >
                    Skip — I'll set up manually →
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 36, paddingTop: 28, borderTop: '1px solid rgba(59,130,246,0.08)' }}>
                  {[
                    { label: 'Detects niche & tone', icon: '🎯' },
                    { label: 'Pre-fills your profile', icon: '⚡' },
                    { label: 'No account needed', icon: '🔒' },
                  ].map(({ label, icon }) => (
                    <div key={label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, lineHeight: 1.3 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={22} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>Content DNA detected!</div>
                    <div style={{ fontSize: 12, color: '#4b5680', marginTop: 2 }}>We found everything we need to set you up.</div>
                  </div>
                </div>

                <div style={{ background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: '20px 22px', marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Detected Profile</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'Creator Name', value: urlDetected?.name },
                      { label: 'Primary Niche', value: urlDetected?.niche },
                      { label: 'Platform', value: urlDetected?.platform, capitalize: true },
                      { label: 'Est. Followers', value: urlDetected?.followers != null ? urlDetected.followers.toLocaleString('en-IN') : 'Unknown (add in setup)' },
                      { label: 'Suggested Tone', value: 'Storytelling' },
                    ].map(({ label, value, capitalize }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#4b5680', fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={applyUrlMagic}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '15px 20px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #ec4899)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', boxShadow: '0 8px 28px rgba(59,130,246,0.3)', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Rocket size={16} /> Launch My Command Center
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <button onClick={() => { setUrlDone(false); setUrlAnalyzing(false) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    ← Try a different URL
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    )
  }

  function go(n: number) {
    setDir(n)
    setStep(s => s + n)
  }

  function handleNicheQuizComplete(niche: string, tone: string) {
    setForm(f => ({
      ...f,
      niche: [niche],
      tone: f.tone.length > 0 ? f.tone : [tone],
    }))
    go(1)
  }

  function toggleNiche(n: string) {
    setForm(f => ({
      ...f,
      niche: f.niche.includes(n)
        ? f.niche.filter(x => x !== n)
        : f.niche.length < 3 ? [...f.niche, n] : f.niche,
    }))
  }

  function togglePlatform(p: Platform) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }))
  }

  function toggleTone(t: string) {
    setForm(f => ({
      ...f,
      tone: f.tone.includes(t)
        ? f.tone.filter(x => x !== t)
        : f.tone.length < 3 ? [...f.tone, t] : f.tone,
    }))
  }

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 1) return true // quiz step — handled internally
    if (step === 2) return form.niche.length > 0
    if (step === 3) return form.platforms.length > 0
    if (step === 4) return form.tone.length > 0
    if (step === 5) {
      const check = validateOnboardingForm(form as any)
      return check.valid
    }
    return true
  }

  async function launchWithState(customForm: any) {
    const validation = validateOnboardingForm(customForm)
    if (!validation.valid) {
      // If still invalid, just set the form and let the user see missing fields
      setForm(customForm)
      return
    }
    setLaunching(true)
    await new Promise(r => setTimeout(r, 1800))
    const profile: CreatorProfile = buildCreatorProfile(customForm)
    const tokenPayload = buildSessionTokenPayload(customForm)
    setTokens(tokenPayload)
    setProfile(profile)
  }

  async function launch() {
    await launchWithState(form)
  }

  const stepLabels = ['You', 'Discover', 'Niche', 'Platforms', 'Voice', 'Integrations']

  return (
    <div style={{ minHeight: '100vh', background: '#060612', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>

      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.05), transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '20%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(236,72,153,0.04), transparent 65%)', pointerEvents: 'none' }} />

      {/* Launch overlay */}
      <AnimatePresence>
        {launching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: 'fixed', inset: 0, background: '#060612', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              style={{ width: 90, height: 90, borderRadius: 24, background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(59,130,246,0.4)' }}
            >
              <Rocket size={36} color="white" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 24, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
              Launching your command center
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ fontSize: 13, color: '#4b5680' }}>
              Calibrating AI to {form.name.split(' ')[0]}'s creator style...
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 240 }}
              transition={{ delay: 0.6, duration: 1.2, ease: 'easeInOut' }}
              style={{ height: 3, background: 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: 3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            <Wand2 size={18} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, color: '#f0f4ff', letterSpacing: '-0.02em' }}>CreatorCommand</span>
        </div>

        {/* Main card */}
        <div style={{ background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.14)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', display: 'grid', gridTemplateColumns: '320px 1fr' }}>

          {/* Left context panel */}
          <ContextPanel step={step} form={form} />

          {/* Right form panel */}
          <div style={{ padding: '40px 44px', display: 'flex', flexDirection: 'column' }}>

            {/* Step tracker */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
              {stepLabels.map((label, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <motion.div
                    animate={{ background: i < step ? '#3b82f6' : i === step ? 'linear-gradient(90deg, #3b82f6, #ec4899)' : 'rgba(59,130,246,0.1)' }}
                    style={{ height: 3, width: '100%', borderRadius: 3 }}
                  />
                  <span style={{ fontSize: 9, fontWeight: 700, color: i <= step ? '#3b82f6' : '#2a3050', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {i < step ? '✓' : label}
                  </span>
                </div>
              ))}
            </div>

            {/* Step content */}
            <div style={{ flex: 1, minHeight: 380 }}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={step}
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28 }}
                  style={{ height: '100%' }}
                >

                  {/* ── Step 0: Identity ────────────────────────── */}
                  {step === 0 && (
                    <div>
                      <h2 style={headStyle}>Who are you as a creator?</h2>
                      <p style={subStyle}>Tell us your name and what best describes your content style.</p>

                      <label style={labelStyle}>Your Name / Creator Name</label>
                      <input
                        autoFocus
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Harshit Jain"
                        className="field"
                        style={{ marginBottom: 24, fontSize: 15, padding: '12px 14px' }}
                        onKeyDown={e => e.key === 'Enter' && canNext() && go(1)}
                      />

                      <label style={labelStyle}>Creator Type</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {CREATOR_TYPES.map(ct => (
                          <motion.button
                            key={ct.id}
                            onClick={() => setForm(f => ({ ...f, creatorType: ct.id }))}
                            animate={{
                              background: form.creatorType === ct.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                              borderColor: form.creatorType === ct.id ? '#3b82f6' : 'rgba(59,130,246,0.12)',
                            }}
                            whileTap={{ scale: 0.97 }}
                            style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid', cursor: 'pointer', textAlign: 'left', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            <div style={{ fontSize: 22, marginBottom: 4 }}>{ct.emoji}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: form.creatorType === ct.id ? '#3b82f6' : '#f0f4ff', marginBottom: 2 }}>{ct.label}</div>
                            <div style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.4 }}>{ct.desc}</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Step 1: Niche Finder Quiz ────────────────── */}
                  {step === 1 && (
                    <NicheFinderQuiz
                      onComplete={handleNicheQuizComplete}
                      onSkip={() => go(1)}
                    />
                  )}

                  {/* ── Step 2: Niche ────────────────────────────── */}
                  {step === 2 && (
                    <div>
                      <h2 style={headStyle}>What's your content niche?</h2>
                      <p style={subStyle}>Pick up to 3. Your AI engine adapts to your exact space.</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {NICHES.map(n => (
                          <AnimChip
                            key={n.label}
                            label={n.label}
                            emoji={n.emoji}
                            selected={form.niche.includes(n.label)}
                            onClick={() => toggleNiche(n.label)}
                          />
                        ))}
                      </div>
                      {form.niche.length === 0 && (
                        <input
                          className="field"
                          placeholder="Or type your own niche..."
                          onKeyDown={e => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                              const v = (e.target as HTMLInputElement).value.trim()
                              setForm(f => ({ ...f, niche: [...f.niche, v] }))
                              ;(e.target as HTMLInputElement).value = ''
                            }
                          }}
                          style={{ fontSize: 13 }}
                        />
                      )}
                      {form.niche.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {form.niche.map((n: string) => (
                            <span key={n} style={{ fontSize: 12, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                              {n}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Step 3: Platforms ────────────────────────── */}
                  {step === 3 && (
                    <div>
                      <h2 style={headStyle}>Where do you create?</h2>
                      <p style={subStyle}>Select all platforms you post on. Add follower counts for accurate rate calculations.</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {PLATFORMS.map(p => (
                          <PlatformCard
                            key={p.id}
                            platform={p}
                            selected={form.platforms.includes(p.id)}
                            followers={form.platformFollowers[p.id] || ''}
                            onToggle={() => togglePlatform(p.id)}
                            onFollowers={v => setForm(f => ({ ...f, platformFollowers: { ...f.platformFollowers, [p.id]: v } }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Step 4: Voice ────────────────────────────── */}
                  {step === 4 && (
                    <div>
                      <h2 style={headStyle}>Define your creator voice</h2>
                      <p style={subStyle}>Your tone trains the AI to write in your style.</p>

                      <label style={labelStyle}>Content Tone (pick 1–3)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                        {TONES.map(t => (
                          <AnimChip
                            key={t.label}
                            label={t.label}
                            emoji={t.emoji}
                            selected={form.tone.includes(t.label)}
                            onClick={() => toggleTone(t.label)}
                            color="#ec4899"
                          />
                        ))}
                      </div>

                      <label style={labelStyle}>Content Language</label>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                        {LANGUAGES.map(l => (
                          <motion.button
                            key={l.value}
                            onClick={() => setForm(f => ({ ...f, contentLanguage: l.value as any }))}
                            animate={{
                              background: form.contentLanguage === l.value ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                              borderColor: form.contentLanguage === l.value ? '#3b82f6' : 'rgba(59,130,246,0.12)',
                              color: form.contentLanguage === l.value ? '#3b82f6' : '#6b7a9a',
                            }}
                            whileTap={{ scale: 0.97 }}
                            style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1.5px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            <span>{l.flag}</span>{l.label}
                          </motion.button>
                        ))}
                      </div>

                      <label style={labelStyle}>What are you known for? <span style={{ color: '#2a3050', fontWeight: 500 }}>(optional)</span></label>
                      <textarea
                        className="field"
                        value={form.strengths}
                        onChange={e => setForm(f => ({ ...f, strengths: e.target.value }))}
                        placeholder="e.g. Storytelling through travel journeys, budget tips, Pahadi culture..."
                        rows={2}
                        style={{ fontSize: 13, lineHeight: 1.6, resize: 'none' }}
                      />
                    </div>
                  )}

                  {/* ── Step 5: Integrations ─────────────────────── */}
                  {step === 5 && (
                    <div>
                      <h2 style={headStyle}>Connect your AI integrations</h2>
                      <p style={subStyle}>Add at least one AI key, or explicitly continue in demo mode. Keys entered here are available across the entire product.</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                        {[
                          { icon: '💡', label: 'Idea Engine', desc: 'Trend + ideas generation' },
                          { icon: '✍️', label: 'Creation Studio', desc: 'Scripts and captions' },
                          { icon: '🧠', label: 'Ops HQ', desc: 'Workflow intelligence' },
                          { icon: '📊', label: 'Analytics', desc: 'System recommendations' },
                        ].map(f => (
                          <div key={f.label} style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 20 }}>{f.icon}</span>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff' }}>{f.label}</div>
                              <div style={{ fontSize: 11, color: '#4b5680' }}>{f.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <label style={labelStyle}>Active AI Provider</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                        {(['anthropic', 'gemini', 'openai'] as const).map((provider) => (
                          <motion.button
                            key={provider}
                            onClick={() => setForm((f) => ({ ...f, activeAIProvider: provider }))}
                            animate={{
                              background: form.activeAIProvider === provider ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.02)',
                              borderColor: form.activeAIProvider === provider ? '#3b82f6' : 'rgba(59,130,246,0.12)',
                              color: form.activeAIProvider === provider ? '#3b82f6' : '#6b7a9a',
                            }}
                            whileTap={{ scale: 0.97 }}
                            style={{ border: '1.5px solid', borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                          >
                            {provider}
                          </motion.button>
                        ))}
                      </div>

                      <label style={labelStyle}>Anthropic API Key</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="field"
                          type={showAnthropic ? 'text' : 'password'}
                          value={form.anthropicKey}
                          onChange={e => setForm(f => ({ ...f, anthropicKey: e.target.value }))}
                          placeholder="sk-ant-api03-..."
                          style={{ paddingRight: 44, fontSize: 13 }}
                        />
                        <button
                          onClick={() => setShowAnthropic(!showAnthropic)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}
                        >
                          {showAnthropic ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      <label style={{ ...labelStyle, marginTop: 14 }}>Gemini API Key</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="field"
                          type={showGemini ? 'text' : 'password'}
                          value={form.geminiKey}
                          onChange={e => setForm(f => ({ ...f, geminiKey: e.target.value }))}
                          placeholder="AIza..."
                          style={{ paddingRight: 44, fontSize: 13 }}
                        />
                        <button
                          onClick={() => setShowGemini(!showGemini)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}
                        >
                          {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      <label style={{ ...labelStyle, marginTop: 14 }}>OpenAI API Key</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          className="field"
                          type={showOpenAI ? 'text' : 'password'}
                          value={form.openaiKey}
                          onChange={e => setForm(f => ({ ...f, openaiKey: e.target.value }))}
                          placeholder="sk-proj-..."
                          style={{ paddingRight: 44, fontSize: 13 }}
                        />
                        <button
                          onClick={() => setShowOpenAI(!showOpenAI)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}
                        >
                          {showOpenAI ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form.useDemoMode}
                          onChange={(e) => setForm((f) => ({ ...f, useDemoMode: e.target.checked }))}
                        />
                        <span style={{ fontSize: 12, color: '#6b7a9a', fontWeight: 600 }}>
                          Continue in demo mode (I will add keys later)
                        </span>
                      </label>

                      {(() => {
                        const check = validateOnboardingForm(form as any);
                        if (!check.valid) {
                          const labels: Record<string, string> = {
                            name: 'Creator Name',
                            niche: 'Niche',
                            platforms: 'Platforms',
                            tone: 'Content Tone',
                            ai_key_or_demo_mode: 'AI key or Demo Mode',
                          };
                          const missingLabels = check.missing.map(m => labels[m] || m);
                          return (
                            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
                              <p style={{ fontSize: 11, color: '#f59e0b', margin: '0 0 6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Missing Required Info
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {missingLabels.map(label => (
                                  <span key={label} style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 6 }}>
                                    • {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation — hidden on step 1 (quiz has its own nav) */}
            {step !== 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(59,130,246,0.08)' }}>
              <div>
                {step > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => go(-1)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', fontSize: 13, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 4px' }}
                  >
                    <ChevronLeft size={16} /> Back
                  </motion.button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {(step < totalSteps - 1 || step === 5) && (
                  <button
                    onClick={() => {
                      if (step === 5) {
                        // Apply defaults for any missing required fields to bypass validation on Skip
                        const nextForm = { 
                          ...form, 
                          useDemoMode: true,
                          name: form.name.trim() || 'New Creator',
                          niche: form.niche.length > 0 ? form.niche : ['General Creator'],
                          platforms: form.platforms.length > 0 ? form.platforms : (['youtube'] as Platform[]),
                          tone: form.tone.length > 0 ? form.tone : ['Professional']
                        };
                        setForm(nextForm);
                        launchWithState(nextForm);
                      } else {
                        go(1);
                      }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2a3050', fontSize: 12, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', padding: '8px 4px' }}
                  >
                    Skip
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: canNext() ? 1.02 : 1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={step < totalSteps - 1 ? () => go(1) : launch}
                  disabled={!canNext() || launching}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 12,
                    background: canNext() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(59,130,246,0.15)',
                    border: 'none', color: canNext() ? '#fff' : '#2a3050',
                    fontSize: 14, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    boxShadow: canNext() ? '0 4px 16px rgba(59,130,246,0.35)' : 'none',
                    transition: 'all 200ms',
                  }}
                >
                  {step === totalSteps - 1 ? (
                    <><Sparkles size={15} /> Launch Command Center</>
                  ) : (
                    <>Continue <ChevronRight size={15} /></>
                  )}
                </motion.button>
              </div>
            </div>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#1e2340', marginTop: 16 }}>
          All data stored locally · No account required · Private by default
        </p>
      </motion.div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const headStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.02em',
  lineHeight: 1.25, marginBottom: 8,
}

const subStyle: React.CSSProperties = {
  fontSize: 13, color: '#4b5680', lineHeight: 1.6, marginBottom: 22, fontWeight: 500,
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10.5, fontWeight: 800, color: '#4b5680',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10,
}
