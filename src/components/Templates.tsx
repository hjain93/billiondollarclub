import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import type { ContentTemplate } from '../types'
import { Copy, X, FileText, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const BUILT_IN_TEMPLATES: ContentTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Problem-Agitate-Solution',
    category: 'Storytelling',
    description: 'Classic persuasion framework. Identify the pain, make it hurt more, then deliver relief.',
    framework: [
      { label: 'PROBLEM', description: 'State the exact problem your audience faces', placeholder: "Everyone's saying [X] but nobody talks about..." },
      { label: 'AGITATE', description: 'Make the pain real and urgent', placeholder: 'This means you end up [negative consequence] and...' },
      { label: 'SOLUTION', description: 'Introduce your fix clearly', placeholder: "Here's the exact thing that changed everything for me..." },
      { label: 'CTA', description: 'One clear next step', placeholder: 'Save this if you want [result]. Drop a comment if...' },
    ],
    contentType: 'reel',
    platforms: ['instagram', 'youtube'],
    usageCount: 247,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-2',
    name: 'Hook-Story-Lesson-CTA',
    category: 'Storytelling',
    description: 'Classic storytelling arc that builds emotional connection before delivering the value.',
    framework: [
      { label: 'HOOK', description: 'Stop the scroll in 2 seconds', placeholder: 'I made a mistake that cost me [X]. Here\'s what happened...' },
      { label: 'STORY', description: 'Personal narrative with conflict and tension', placeholder: 'It started when I decided to [action]. I thought [assumption]...' },
      { label: 'LESSON', description: 'The insight or transformation', placeholder: 'What I realised was that [counterintuitive insight]...' },
      { label: 'CTA', description: 'Invite engagement', placeholder: 'Have you ever experienced [similar situation]? Tell me in comments...' },
    ],
    contentType: 'video',
    platforms: ['youtube', 'instagram'],
    usageCount: 189,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-3',
    name: 'Before / After / Bridge',
    category: 'Storytelling',
    description: 'Show the transformation. Perfect for personal change, skill development, or product results.',
    framework: [
      { label: 'BEFORE', description: 'Paint the before state vividly', placeholder: 'A year ago I was [specific situation]. I had [problem]...' },
      { label: 'AFTER', description: 'Show the transformed state', placeholder: 'Now I [achievement/change]. The difference is...' },
      { label: 'BRIDGE', description: 'What created the transformation', placeholder: 'The one thing that changed everything was...' },
      { label: 'INVITE', description: 'Make it relatable and inclusive', placeholder: 'If you\'re in the BEFORE stage right now, here\'s what to do first...' },
    ],
    contentType: 'carousel',
    platforms: ['instagram', 'linkedin'],
    usageCount: 156,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-4',
    name: 'Listicle Framework',
    category: 'Educational',
    description: '"X things you didn\'t know about..." — high save rate, share friendly, easy to consume.',
    framework: [
      { label: 'HOOK', description: 'Promise specific value with a number', placeholder: '5 things about [topic] that nobody tells you...' },
      { label: 'CREDIBILITY', description: 'Why should they trust you?', placeholder: "I've spent [time/effort] studying/doing [thing] so you don't have to..." },
      { label: 'LIST ITEMS', description: 'Each item is surprising or counterintuitive', placeholder: '1. [Item] — most people think X but actually Y\n2. [Item] — here\'s why this matters...' },
      { label: 'BONUS', description: 'One final unexpected insight', placeholder: 'Bonus: The one nobody talks about is...' },
      { label: 'CTA', description: 'Drive saves and follows', placeholder: 'Save this for when you need it. Which one surprised you most?' },
    ],
    contentType: 'carousel',
    platforms: ['instagram', 'linkedin', 'twitter'],
    usageCount: 312,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-5',
    name: 'Controversy Hook',
    category: 'Trending',
    description: 'Hot take that starts a debate. High engagement, polarising, stay authentic to your niche.',
    framework: [
      { label: 'HOT TAKE', description: 'State the contrarian opinion boldly', placeholder: 'Hot take: [Controversial statement about your niche]' },
      { label: 'WHY PEOPLE DISAGREE', description: 'Steelman the opposing view first', placeholder: "I know most people think [common belief] because..." },
      { label: 'YOUR ARGUMENT', description: 'Back your take with evidence/experience', placeholder: 'But here\'s what changed my mind: [specific data point or experience]...' },
      { label: 'NUANCE', description: 'Show intellectual honesty', placeholder: 'Where I could be wrong: [acknowledge limitation]...' },
      { label: 'DEBATE INVITE', description: 'Ask for pushback', placeholder: 'Disagree? Tell me exactly why in the comments.' },
    ],
    contentType: 'thread',
    platforms: ['twitter', 'linkedin'],
    usageCount: 98,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-6',
    name: 'Tutorial Step-by-Step',
    category: 'Tutorial',
    description: 'How to achieve X in N steps. High save rate. Perfect for educational reels and carousels.',
    framework: [
      { label: 'RESULT HOOK', description: 'Lead with the outcome, not the process', placeholder: 'How I [achieved result] in [timeframe] (step-by-step)' },
      { label: 'PREREQUISITES', description: 'What they need before starting', placeholder: "Before you start, you'll need: [list 2-3 things]" },
      { label: 'STEPS', description: 'Clear numbered steps with mini-outcomes', placeholder: 'Step 1: [Action] → you\'ll see [result]\nStep 2: [Action] → this is when [thing] happens...' },
      { label: 'COMMON MISTAKES', description: 'One pitfall to avoid', placeholder: 'The mistake 90% make at step [X] is...' },
      { label: 'CTA', description: 'Drive saves and questions', placeholder: 'Save this before you need it. Questions? Drop them below.' },
    ],
    contentType: 'reel',
    platforms: ['instagram', 'youtube'],
    usageCount: 203,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-7',
    name: 'Personal Failure Story',
    category: 'Personal',
    description: '"I failed at X. Here\'s what I learned." — vulnerability builds trust and relatability.',
    framework: [
      { label: 'FAILURE HOOK', description: 'Open with the failure directly', placeholder: 'I failed at [thing] completely. Here\'s what really happened...' },
      { label: 'THE BUILDUP', description: 'What made you try / why you expected success', placeholder: 'I was convinced it would work because [reason]. I even [action that shows commitment]...' },
      { label: 'THE CRASH', description: 'What went wrong and how it felt', placeholder: 'Then [specific moment] happened. I remember feeling...' },
      { label: 'THE LESSON', description: 'Genuine insight, not toxic positivity', placeholder: "The honest truth I didn't see coming was..." },
      { label: 'WHAT NEXT', description: 'What you\'d do differently', placeholder: "If I were starting over today, the first thing I'd change is..." },
    ],
    contentType: 'video',
    platforms: ['youtube', 'instagram', 'linkedin'],
    usageCount: 134,
    isCustom: false,
    createdAt: '2024-01-01',
  },
  {
    id: 'tpl-8',
    name: 'Trend Commentary',
    category: 'Trending',
    description: 'Ride a trending topic while adding your unique perspective as a niche creator.',
    framework: [
      { label: 'TREND REFERENCE', description: 'Name the trend everyone knows', placeholder: "Everyone's talking about [trending topic] right now." },
      { label: 'YOUR ANGLE', description: 'Unique perspective from your niche', placeholder: 'But as a [niche] creator, here\'s what I\'m noticing that most people miss...' },
      { label: 'EVIDENCE', description: 'Your first-hand experience or data', placeholder: "In my [experience/community/research], I've seen [specific example]..." },
      { label: 'TAKE', description: 'Your clear opinion', placeholder: 'My honest prediction: [specific claim about where this trend goes]...' },
      { label: 'DISCUSSION', description: 'Start a conversation', placeholder: "What's your take? Are you seeing this in [their world] too?" },
    ],
    contentType: 'thread',
    platforms: ['twitter', 'linkedin', 'instagram'],
    usageCount: 76,
    isCustom: false,
    createdAt: '2024-01-01',
  },
]

const CATEGORIES = ['All', 'Storytelling', 'Educational', 'Trending', 'Personal', 'Tutorial']

const CAT_COLORS: Record<string, string> = {
  Storytelling: '#ec4899',
  Educational: '#3b82f6',
  Trending: '#f97316',
  Personal: '#10b981',
  Tutorial: '#8b5cf6',
}

export function Templates() {
  const { templates: customTemplates } = useStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null)
  const [filled, setFilled] = useState<Record<number, string>>({})

  const all = [...BUILT_IN_TEMPLATES, ...customTemplates]
  const filtered = activeCategory === 'All' ? all : all.filter((t) => t.category === activeCategory)

  function openTemplate(t: ContentTemplate) {
    setSelectedTemplate(t)
    setFilled({})
  }

  function copyAll() {
    if (!selectedTemplate) return
    const text = selectedTemplate.framework
      .map((f, i) => `[${f.label}]\n${filled[i] || f.placeholder}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    toast.success('Full template copied!', {
      style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(59,130,246,0.3)' },
    })
  }

  function sendToStudio() {
    toast.success('Template sent to Script Writer!', {
      style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' },
    })
    setSelectedTemplate(null)
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Template Library</h1>
        <p style={{ color: '#4b5680', fontSize: 13, marginTop: 5, fontWeight: 500 }}>
          Proven content frameworks. Pick one, fill in your story, go viral.
        </p>
      </motion.div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          const color = CAT_COLORS[cat] || '#3b82f6'
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                background: active ? `${color}18` : 'rgba(59,130,246,0.04)',
                border: `1px solid ${active ? color : 'rgba(59,130,246,0.12)'}`,
                color: active ? color : '#6b7a9a',
                transition: 'all 140ms',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((tpl, i) => {
          const catColor = CAT_COLORS[tpl.category] || '#3b82f6'
          return (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{ padding: '20px 22px', cursor: 'pointer' }}
              onClick={() => openTemplate(tpl)}
            >
              {/* Category badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                    background: `${catColor}15`,
                    color: catColor,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}
                >
                  {tpl.category}
                </span>
                <span style={{ fontSize: 11, color: '#3b4260', fontWeight: 600 }}>
                  {tpl.usageCount} uses
                </span>
              </div>

              {/* Name */}
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 7 }}>
                {tpl.name}
              </h3>

              {/* Description */}
              <p style={{ fontSize: 12.5, color: '#6b7a9a', lineHeight: 1.5, marginBottom: 14 }}>
                {tpl.description}
              </p>

              {/* Framework pills */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                {tpl.framework.map((f, idx) => (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8,
                      background: 'rgba(59,130,246,0.08)',
                      color: '#3b82f6',
                      letterSpacing: '0.04em',
                    }}>
                      {f.label}
                    </span>
                    {idx < tpl.framework.length - 1 && (
                      <ChevronRight size={10} color="#2a3050" />
                    )}
                  </span>
                ))}
              </div>

              {/* Use button */}
              <button
                className="btn btn-blue btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={(e) => { e.stopPropagation(); openTemplate(tpl) }}
              >
                <FileText size={12} /> Use Template
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTemplate(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(8,8,16,0.7)',
                backdropFilter: 'blur(6px)',
                zIndex: 70,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 80,
                width: 620,
                maxWidth: 'calc(100vw - 40px)',
                maxHeight: 'calc(100vh - 60px)',
                overflowY: 'auto',
                background: '#0d0d1a',
                border: '1px solid rgba(59,130,246,0.22)',
                borderRadius: 20,
                padding: '28px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 800, padding: '3px 10px', borderRadius: 12,
                      background: `${CAT_COLORS[selectedTemplate.category] || '#3b82f6'}15`,
                      color: CAT_COLORS[selectedTemplate.category] || '#3b82f6',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {selectedTemplate.category}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>
                    {selectedTemplate.name}
                  </h2>
                  <p style={{ fontSize: 12.5, color: '#4b5680', marginTop: 4 }}>{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Framework fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 22 }}>
                {selectedTemplate.framework.map((f, idx) => (
                  <div key={idx}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                      {f.label}
                      <span style={{ fontSize: 10.5, color: '#4b5680', fontWeight: 600, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>
                        — {f.description}
                      </span>
                    </label>
                    <textarea
                      className="field"
                      rows={3}
                      value={filled[idx] || ''}
                      onChange={(e) => setFilled((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ resize: 'vertical', fontSize: 13 }}
                    />
                  </div>
                ))}
              </div>

              {/* Modal actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={copyAll}
                >
                  <Copy size={13} /> Copy All
                </button>
                <button
                  className="btn btn-blue"
                  style={{ flex: 2, justifyContent: 'center' }}
                  onClick={sendToStudio}
                >
                  Send to Script Writer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
