import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import toast from 'react-hot-toast'
import {
  Compass, ChevronRight, ChevronLeft, Check, Share2,
  Youtube, Instagram, Linkedin, Twitter, Star,
  BookOpen, Laugh, Camera, Users, TrendingUp, Target, Clock,
  Sparkles,
} from 'lucide-react'

// ── Quiz data ─────────────────────────────────────────────────────────────────

interface NicheResult {
  name: string
  opportunity: 'Emerging' | 'Growing' | 'Competitive'
  rpm: string
  timeToFollowers: string
  creators: string[]
  tone: string
}

interface Answers {
  q1: string; q2: string; q3: string; q4: string
  q5: string; q6: string; q7: string; q8: string
}

const Q3_OPTIONS = [
  { id: 'youtube',   label: 'YouTube',    icon: <Youtube size={16} /> },
  { id: 'instagram', label: 'Instagram',  icon: <Instagram size={16} /> },
  { id: 'linkedin',  label: 'LinkedIn',   icon: <Linkedin size={16} /> },
  { id: 'twitter',   label: 'Twitter/X',  icon: <Twitter size={16} /> },
  { id: 'tiktok',    label: 'TikTok',     icon: <Star size={16} /> },
]
const Q4_OPTIONS = [
  { id: '2-5',  label: '2–5 hrs/week',   sub: 'Side hustle pace' },
  { id: '5-10', label: '5–10 hrs/week',  sub: 'Growing steadily' },
  { id: '10-20',label: '10–20 hrs/week', sub: 'Serious creator' },
  { id: '20+',  label: '20+ hrs/week',   sub: 'Full-time focus' },
]
const Q5_OPTIONS = [
  { id: 'educator',    label: 'Educator',    sub: 'I explain things',    icon: <BookOpen size={15} /> },
  { id: 'entertainer', label: 'Entertainer', sub: 'I make people laugh', icon: <Laugh size={15} /> },
  { id: 'documenter',  label: 'Documenter',  sub: 'I show my journey',   icon: <Camera size={15} /> },
  { id: 'curator',     label: 'Curator',     sub: 'I share the best',    icon: <Star size={15} /> },
]
const Q6_OPTIONS = [
  { id: 'beginners',     label: 'Beginners',        sub: 'Just starting out' },
  { id: 'intermediate',  label: 'Intermediate',     sub: 'Already learning' },
  { id: 'professionals', label: 'Professionals',    sub: 'Experienced people' },
  { id: 'general',       label: 'General audience', sub: 'Everyone' },
]
const Q7_OPTIONS = [
  { id: 'audience', label: 'Build audience', icon: <Users size={15} /> },
  { id: 'income',   label: 'Make income',    icon: <TrendingUp size={15} /> },
  { id: 'brand',    label: 'Build brand',    icon: <Target size={15} /> },
  { id: 'passion',  label: 'Share passion',  icon: <Star size={15} /> },
]
const Q8_OPTIONS = [
  { id: 'starter',      label: '₹0–25k/mo',  sub: 'Side income' },
  { id: 'growing',      label: '₹25k–1L/mo', sub: 'Part-time income' },
  { id: 'established',  label: '₹1L–5L/mo',  sub: 'Full-time creator' },
  { id: 'elite',        label: '₹5L+/mo',    sub: 'Business level' },
]

const ARCHETYPE: Record<string, { name: string; desc: string; formats: string[]; tone: string }> = {
  educator:    { name: 'Expert Educator',       tone: 'Educational',      formats: ['How-to tutorials', 'Explainer videos', 'Tip carousels', 'Deep dives'],       desc: 'You break down complex topics and make learning accessible. Your audience trusts you as a reliable guide.' },
  entertainer: { name: 'Magnetic Entertainer',  tone: 'Witty & Humorous', formats: ['Reaction videos', 'Comedy skits', 'Challenges', 'Storytime content'],        desc: 'You captivate with humor and energy. People watch not just for information — but for the experience.' },
  documenter:  { name: 'Authentic Documenter',  tone: 'Personal / Raw',   formats: ['Vlogs', 'Day-in-my-life', 'Progress updates', 'Behind-the-scenes'],          desc: 'You share your real journey. Raw honesty builds deep audience loyalty and trust that takes others years.' },
  curator:     { name: 'Taste-Making Curator',  tone: 'Professional',     formats: ['Resource roundups', 'Best-of lists', 'Tool reviews', 'Weekly digests'],      desc: 'You find, filter, and share the best. Your audience values your taste and saves your posts constantly.' },
}

function buildResults(a: Answers): NicheResult[] {
  const ttfMap: Record<string, Record<string, string>> = {
    '2-5':  { starter: '12–18 mo', growing: '8–14 mo', established: '6–10 mo', elite: '4–8 mo' },
    '5-10': { starter: '8–12 mo',  growing: '5–9 mo',  established: '4–7 mo',  elite: '3–6 mo' },
    '10-20':{ starter: '5–8 mo',   growing: '3–6 mo',  established: '2–5 mo',  elite: '2–4 mo' },
    '20+':  { starter: '3–5 mo',   growing: '2–4 mo',  established: '1–3 mo',  elite: '1–2 mo' },
  }
  const ttf = ttfMap[a.q4]?.[a.q8] || '6–12 mo'
  const t1 = a.q1.trim().split(' ').slice(0, 3).join(' ') || 'your topic'
  const t2 = a.q2.trim().split(' ').slice(0, 3).join(' ') || 'your expertise'
  const styleLabel = { educator: 'Educational', entertainer: 'Entertainment', documenter: 'Documentary', curator: 'Curation' }[a.q5] || 'Educational'
  const goalLabel  = { income: 'Monetized', brand: 'Brand-Led', audience: 'Community', passion: 'Passion' }[a.q7] || 'Passionate'
  const plat = a.q3 ? a.q3.charAt(0).toUpperCase() + a.q3.slice(1) : 'Multi-platform'
  const tone = ARCHETYPE[a.q5]?.tone || 'Educational'
  return [
    { name: `${styleLabel} ${t1} on ${plat}`, opportunity: 'Growing',     rpm: a.q3 === 'youtube' ? '₹120–350 CPM' : a.q3 === 'linkedin' ? 'Brand-deal heavy' : '₹40–150 CPM', timeToFollowers: ttf, creators: ['BeerBiceps', 'Nikhil Kamath', 'Ankur Warikoo'], tone },
    { name: `${goalLabel} ${t2} Creator`,      opportunity: 'Emerging',    rpm: '₹80–250 CPM',  timeToFollowers: ttf, creators: ['Ishan Sharma', 'Raj Shamani', 'Figma Faiz'], tone },
    { name: `Indian ${t1} & ${t2} Content`,   opportunity: 'Competitive', rpm: '₹60–200 CPM',  timeToFollowers: ttf, creators: ['Dhruv Rathee', 'CA Rachana Phadke', 'Warikoo'], tone },
  ]
}

// ── Question renderer helpers ─────────────────────────────────────────────────

function CardGrid({ options, selected, onSelect }: {
  options: { id: string; label: string; sub?: string; icon?: React.ReactNode }[]
  selected: string; onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {options.map(o => (
        <motion.button key={o.id} whileHover={{ y: -1 }} onClick={() => onSelect(o.id)}
          style={{
            background: selected === o.id ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${selected === o.id ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
          }}>
          {o.icon && <div style={{ marginBottom: 6, color: selected === o.id ? '#3b82f6' : '#6b7a9a' }}>{o.icon}</div>}
          <div style={{ fontSize: 13, fontWeight: 700, color: selected === o.id ? '#f0f4ff' : '#94a3b8' }}>{o.label}</div>
          {o.sub && <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>{o.sub}</div>}
          {selected === o.id && <Check size={12} color="#3b82f6" style={{ position: 'absolute', top: 10, right: 10 }} />}
        </motion.button>
      ))}
    </div>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 10, padding: '14px 16px', fontSize: 14, color: '#f0f4ff', resize: 'none',
        height: 100, outline: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
        lineHeight: 1.6, boxSizing: 'border-box',
      }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function NicheFinder() {
  const { updateProfile, setView } = useStore()
  const [step, setStep] = useState(0)  // 0–7 = questions, 8 = results
  const [dir, setDir] = useState(1)
  const [a, setA] = useState<Answers>({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '' })
  const [results, setResults] = useState<NicheResult[]>([])

  const totalSteps = 8
  const qKey = `q${step + 1}` as keyof Answers
  const canNext = a[qKey]?.trim().length > 0

  function setAns(key: keyof Answers, val: string) {
    setA(prev => ({ ...prev, [key]: val }))
  }

  function next() {
    if (step < totalSteps - 1) { setDir(1); setStep(s => s + 1) }
    else { setResults(buildResults(a)); setDir(1); setStep(8) }
  }

  function back() {
    if (step > 0) { setDir(-1); setStep(s => s - 1) }
  }

  function applyNiche(niche: NicheResult) {
    updateProfile({ niche: niche.name, tone: [niche.tone] })
    toast.success(`Niche applied: ${niche.name}`)
    setView('command-center')
  }

  function shareResults() {
    const text = `I found my creator niche with Creator Command! 🎯\n\n${results.map((r, i) => `${i + 1}. ${r.name}`).join('\n')}\n\nFind yours at creatorcommand.app`
    navigator.clipboard.writeText(text).then(() => toast.success('Results copied to clipboard!'))
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? -50 : 50, opacity: 0 }),
  }

  const QUESTIONS = [
    { title: 'What could you talk about for 3 hours straight?', sub: 'This is the foundation of your niche — your zone of deep passion.', render: () => <TextInput value={a.q1} onChange={v => setAns('q1', v)} placeholder="e.g. personal finance, fitness, cooking, tech reviews..." /> },
    { title: 'What do people ask your advice on?', sub: 'Your perceived expertise — where others already see you as a guide.', render: () => <TextInput value={a.q2} onChange={v => setAns('q2', v)} placeholder="e.g. investing, coding, relationships, productivity..." /> },
    { title: 'Which platform fits your content style best?', sub: 'Start with one. Master it. Then expand.', render: () => <CardGrid options={Q3_OPTIONS} selected={a.q3} onSelect={v => setAns('q3', v)} /> },
    { title: 'How much time can you commit each week?', sub: 'Be realistic — consistency beats volume every time.', render: () => <CardGrid options={Q4_OPTIONS} selected={a.q4} onSelect={v => setAns('q4', v)} /> },
    { title: "What's your natural content style?", sub: "Your archetype shapes everything — your format, tone, and audience.", render: () => <CardGrid options={Q5_OPTIONS} selected={a.q5} onSelect={v => setAns('q5', v)} /> },
    { title: "Who's your target audience?", sub: 'The more specific you are, the faster you grow.', render: () => <CardGrid options={Q6_OPTIONS} selected={a.q6} onSelect={v => setAns('q6', v)} /> },
    { title: 'What is your primary goal?', sub: 'This shapes your monetization strategy and growth playbook.', render: () => <CardGrid options={Q7_OPTIONS} selected={a.q7} onSelect={v => setAns('q7', v)} /> },
    { title: 'What income target are you aiming for?', sub: "Set an honest target — it'll calibrate your niche recommendations.", render: () => <CardGrid options={Q8_OPTIONS} selected={a.q8} onSelect={v => setAns('q8', v)} /> },
  ]

  const archetype = ARCHETYPE[a.q5] || ARCHETYPE['educator']
  const oppColors = { Emerging: '#10b981', Growing: '#f59e0b', Competitive: '#ef4444' }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Compass size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f0f4ff', margin: 0, letterSpacing: '-0.02em' }}>Niche Finder</h1>
            <p style={{ fontSize: 12, color: '#4b5680', margin: 0 }}>8 questions · 3 min · personalised niche recommendations</p>
          </div>
        </div>
      </div>

      {step < 8 ? (
        <div style={{ background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 18, padding: '28px 32px', minHeight: 420 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.06em' }}>
                QUESTION {step + 1} OF {totalSteps}
              </span>
              <span style={{ fontSize: 11, color: '#4b5680' }}>{Math.round(((step) / totalSteps) * 100)}% complete</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <motion.div
                animate={{ width: `${((step) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #ec4899)', borderRadius: 2 }}
              />
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                {QUESTIONS[step].title}
              </h2>
              <p style={{ fontSize: 13, color: '#6b7a9a', margin: '0 0 20px', lineHeight: 1.5 }}>
                {QUESTIONS[step].sub}
              </p>
              {QUESTIONS[step].render()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
            <button onClick={back} disabled={step === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 9, padding: '9px 16px', cursor: step === 0 ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, color: step === 0 ? '#2a3050' : '#6b7a9a',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
              <ChevronLeft size={14} /> Back
            </button>

            <motion.button onClick={next} disabled={!canNext} whileHover={canNext ? { scale: 1.02 } : {}}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: canNext ? 'linear-gradient(135deg, #3b82f6, #ec4899)' : 'rgba(255,255,255,0.05)',
                border: 'none', borderRadius: 9, padding: '10px 20px',
                cursor: canNext ? 'pointer' : 'not-allowed',
                fontSize: 13, fontWeight: 700, color: canNext ? '#fff' : '#2a3050',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
              {step === totalSteps - 1 ? <><Sparkles size={14} /> See My Niche</> : <>Next <ChevronRight size={14} /></>}
            </motion.button>
          </div>
        </div>
      ) : (
        /* Results */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Archetype card */}
          <div style={{
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 14, padding: '18px 20px', marginBottom: 20,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #ec4899)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {a.q5 === 'educator' ? <BookOpen size={20} color="#fff" /> : a.q5 === 'entertainer' ? <Laugh size={20} color="#fff" /> : a.q5 === 'documenter' ? <Camera size={20} color="#fff" /> : <Star size={20} color="#fff" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Your Creator Archetype</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>{archetype.name}</div>
              <p style={{ fontSize: 13, color: '#6b7a9a', margin: '0 0 10px', lineHeight: 1.5 }}>{archetype.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {archetype.formats.map(f => (
                  <span key={f} style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>{f}</span>
                ))}
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f0f4ff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Your 3 Niche Recommendations
          </h2>

          {/* Niche cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {results.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{
                  background: '#0d0d1a', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 14, padding: '16px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: i === 0 ? 'rgba(59,130,246,0.15)' : i === 1 ? 'rgba(16,185,129,0.15)' : 'rgba(167,139,250,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 900, color: i === 0 ? '#3b82f6' : i === 1 ? '#10b981' : '#a78bfa',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4, lineHeight: 1.3 }}>{r.name}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: `${oppColors[r.opportunity]}18`,
                      color: oppColors[r.opportunity],
                      border: `1px solid ${oppColors[r.opportunity]}30`,
                    }}>{r.opportunity}</span>
                    <span style={{ fontSize: 11, color: '#6b7a9a', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> 1K followers: {r.timeToFollowers}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7a9a' }}>{r.rpm}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5680', marginTop: 4 }}>Study: {r.creators.join(' · ')}</div>
                </div>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => applyNiche(r)}
                  style={{
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                    borderRadius: 9, padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
                    fontSize: 12, fontWeight: 700, color: '#3b82f6',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  <Check size={12} /> Apply
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setStep(0); setA({ q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: '', q8: '' }) }}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '11px 16px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#6b7a9a',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
              Retake Quiz
            </button>
            <button onClick={shareResults}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 10, padding: '11px 20px', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, color: '#3b82f6',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}>
              <Share2 size={14} /> Share Results
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
