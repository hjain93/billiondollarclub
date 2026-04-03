import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, Pickaxe, MessageSquarePlus, Copy,
  CheckCheck, Plus, Zap, Users, Heart, HelpCircle,
  BarChart2, Pin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useStore } from '../store'
import type { ContentIdea, ContentType, Platform } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PainPoint {
  pain: string
  contentAngle: string
}

interface ContentRequest {
  title: string
  format: string
  engagementPotential: 'High' | 'Medium' | 'Low'
}

interface AudiencePersona {
  ageRange: string
  expertiseLevel: 'Beginner' | 'Intermediate' | 'Advanced'
  characteristics: string[]
  caresAbout: string
  tone: string
}

interface SentimentData {
  positive: number
  neutral: number
  negative: number
  resonating: string[]
  needsAddressing: string[]
}

interface EngagementScore {
  overall: number
  questionRate: number
  emotionalResponseRate: number
  returnIntentSignals: number
}

interface CommentInsights {
  painPoints: PainPoint[]
  contentRequests: ContentRequest[]
  persona: AudiencePersona
  sentiment: SentimentData
  engagementScore: EngagementScore
}

interface ReplyCard {
  style: string
  styleBadgeColor: string
  text: string
  wordCount: number
}

interface BulkTemplate {
  category: string
  icon: React.ReactNode
  templates: string[]
}

type CommentType = 'Praise' | 'Question' | 'Criticism' | 'Request' | 'Off-topic'
type ReplyTone = 'Friendly' | 'Educational' | 'Playful' | 'Empathetic' | 'Professional'
type CTAGoal = 'Subscribe' | 'Like' | 'Comment' | 'Share' | 'Buy product' | 'Visit link'
type WordTarget = 50 | 100 | 150

// ─── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_INSIGHTS: CommentInsights = {
  painPoints: [
    { pain: 'Can\'t stay consistent with workouts when schedule gets busy', contentAngle: 'Build a "no-excuses" 10-min daily routine that works even on travel days' },
    { pain: 'Don\'t see results fast enough and lose motivation', contentAngle: 'Set realistic milestones for weeks 1, 4, 8, 12 — what to actually expect' },
    { pain: 'Confused about nutrition — conflicting advice everywhere', contentAngle: 'The only 3 nutrition rules that actually matter (cut through the noise)' },
  ],
  contentRequests: [
    { title: 'Full Week Meal Prep Under 30 Minutes', format: 'Vlog / Step-by-step', engagementPotential: 'High' },
    { title: 'What I Actually Eat in a Day (Realistic, Not Perfect)', format: 'Day-in-the-life', engagementPotential: 'High' },
    { title: 'Home Workout Equipment: Worth It or Waste of Money?', format: 'Review / Opinion', engagementPotential: 'Medium' },
    { title: 'How to Work Out When You\'re Exhausted After Work', format: 'Motivational + Practical tips', engagementPotential: 'High' },
    { title: 'Beginner Gym Guide: What Nobody Tells You', format: 'Educational explainer', engagementPotential: 'Medium' },
  ],
  persona: {
    ageRange: '24–34',
    expertiseLevel: 'Beginner',
    characteristics: [
      'Busy professionals with limited time',
      'Results-focused but easily discouraged',
      'Value practicality over perfection',
    ],
    caresAbout: 'Sustainable habits that fit their real lifestyle — not influencer-level perfection',
    tone: 'Friendly',
  },
  sentiment: {
    positive: 68,
    neutral: 22,
    negative: 10,
    resonating: [
      'Content feels relatable — viewers appreciate the "real person" approach',
      'Practical tips they can apply the same day',
    ],
    needsAddressing: [
      'A few comments asking for more beginner-specific breakdowns',
      'Some frustration about advice feeling too generic',
    ],
  },
  engagementScore: {
    overall: 7.2,
    questionRate: 6.8,
    emotionalResponseRate: 7.9,
    returnIntentSignals: 7.1,
  },
}

const DEMO_REPLIES: ReplyCard[] = [
  {
    style: 'Warm & Personal',
    styleBadgeColor: '#ec4899',
    text: 'This means so much, genuinely! Comments like yours are exactly why I keep making these videos. I\'m so glad the [topic] clicked for you — keep going, you\'re already ahead of most people by showing up consistently. 🙌',
    wordCount: 42,
  },
  {
    style: 'Educational',
    styleBadgeColor: '#3b82f6',
    text: 'Great question! The key thing to understand is [concept] — once that clicks, everything else follows. I actually break this down in depth in my [video/resource] if you want the full picture. Let me know if that helps!',
    wordCount: 40,
  },
  {
    style: 'Short & Punchy',
    styleBadgeColor: '#f97316',
    text: 'Appreciate you so much for this! More of this type of content coming very soon. Stay tuned 👀',
    wordCount: 17,
  },
]

const BULK_TEMPLATES: BulkTemplate[] = [
  {
    category: '"Love your content!"',
    icon: <Heart size={13} />,
    templates: [
      'Thank you so much — means the world! More content like this dropping soon, so make sure you\'re subscribed 🙏',
      'You just made my day! I put a lot into this one. Let me know if there\'s a topic you\'d love me to cover next!',
    ],
  },
  {
    category: '"When is next video?"',
    icon: <Zap size={13} />,
    templates: [
      'Very soon! I post every [day/week] — hit the bell so you don\'t miss it. It\'s going to be a good one 👀',
      'Working on it right now! Best way to stay updated is to turn on notifications. See you there!',
    ],
  },
  {
    category: 'Generic questions',
    icon: <HelpCircle size={13} />,
    templates: [
      'Great question! Short answer: [answer]. I actually covered this in more detail in [video] — check the pinned comment for the link!',
      'Love this question. The honest answer is [answer]. Drop any follow-ups below and I\'ll try to answer them all!',
    ],
  },
  {
    category: '"Can you collab?"',
    icon: <Users size={13} />,
    templates: [
      'I\'d love to explore collabs! Best way to reach me is through email (link in bio). Send over a quick idea and I\'ll take a look!',
      'Always open to connecting with other creators! Shoot me a DM with your channel details and what you have in mind.',
    ],
  },
  {
    category: 'Negative / criticism',
    icon: <MessageSquarePlus size={13} />,
    templates: [
      'Really appreciate the honest feedback — this genuinely helps me improve. Could you tell me more about what missed the mark for you?',
      'Fair point, and I hear you. I\'ll keep this in mind for future videos. Thanks for taking the time to share it.',
    ],
  },
  {
    category: 'First-time comments',
    icon: <Plus size={13} />,
    templates: [
      'Welcome to the channel! So glad this video found you. There\'s a lot more where this came from — hope you stick around!',
      'First comment! Love seeing new faces here. Make sure to check out [related video] — I think you\'d enjoy it based on this one!',
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const spring = { type: 'spring' as const, stiffness: 300, damping: 28 }

function engagementPotentialColor(e: ContentRequest['engagementPotential']): string {
  if (e === 'High') return '#10b981'
  if (e === 'Medium') return '#f59e0b'
  return '#6b7a9a'
}

function expertiseBadgeColor(level: AudiencePersona['expertiseLevel']): string {
  if (level === 'Beginner') return '#3b82f6'
  if (level === 'Intermediate') return '#f59e0b'
  return '#ec4899'
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function doCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={doCopy}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
    >
      {copied ? <CheckCheck size={12} color="#10b981" /> : <Copy size={12} />}
      {copied ? 'Copied' : label}
    </button>
  )
}

// ─── Comment Mining Prompts ───────────────────────────────────────────────────

function buildMinePrompt(comments: string, videoContext: string): string {
  return `You are a YouTube/Instagram analytics expert specializing in audience intelligence. Analyze these comments from a creator's video.

Video context: ${videoContext || 'Not specified'}

Comments:
${comments}

Return ONLY a JSON object (no markdown, no explanation) in this exact shape:
{
  "painPoints": [
    { "pain": "<what audience struggles with>", "contentAngle": "<specific video angle to address it>" }
  ],
  "contentRequests": [
    { "title": "<video title>", "format": "<format suggestion>", "engagementPotential": "High"|"Medium"|"Low" }
  ],
  "persona": {
    "ageRange": "<e.g. 24-34>",
    "expertiseLevel": "Beginner"|"Intermediate"|"Advanced",
    "characteristics": ["<trait 1>", "<trait 2>", "<trait 3>"],
    "caresAbout": "<what matters most to them in 1 sentence>",
    "tone": "formal"|"casual"|"friendly"|"professional"
  },
  "sentiment": {
    "positive": <0-100 percentage>,
    "neutral": <0-100>,
    "negative": <0-100>,
    "resonating": ["<what is working>", "<another>"],
    "needsAddressing": ["<what needs work>"]
  },
  "engagementScore": {
    "overall": <1.0-10.0>,
    "questionRate": <1.0-10.0>,
    "emotionalResponseRate": <1.0-10.0>,
    "returnIntentSignals": <1.0-10.0>
  }
}

Extract 3-5 pain points, exactly 5 content requests. Be specific and actionable.`
}

function buildReplyPrompt(comment: string, commentType: CommentType, tone: ReplyTone): string {
  return `You are a creator community manager who writes authentic, human replies that build real connections.

Comment type: ${commentType}
Desired tone: ${tone}
Comment to reply to: "${comment}"

Generate 3 different reply options. Return ONLY a JSON array (no markdown) in this exact shape:
[
  {
    "style": "Warm & Personal",
    "styleBadgeColor": "#ec4899",
    "text": "<the reply text>",
    "wordCount": <number>
  },
  {
    "style": "Educational",
    "styleBadgeColor": "#3b82f6",
    "text": "<the reply text>",
    "wordCount": <number>
  },
  {
    "style": "Short & Punchy",
    "styleBadgeColor": "#f97316",
    "text": "<the reply text>",
    "wordCount": <number>
  }
]

Rules:
- Each reply must feel authentic, not corporate or robotic
- Warm & Personal: conversational, uses the commenter's words back to them
- Educational: adds value, brief explanation or tip, references other content if relevant
- Short & Punchy: under 25 words, high energy, immediate and punchy
- Match the ${tone} tone throughout all 3 variants`
}

function buildPinnedCommentPrompt(goal: string, ctaGoal: CTAGoal, wordTarget: WordTarget): string {
  return `You are an expert at writing pinned YouTube/Instagram comments that drive massive engagement.

What the creator wants viewers to do after watching: ${goal}
CTA goal: ${ctaGoal}
Target word count: ~${wordTarget} words

Write a single pinned comment that:
- Opens with a strong hook line (curiosity or value promise)
- Has 2-3 short bullet points or lines with relevant emojis
- Has a clear, specific call-to-action for "${ctaGoal}"
- Feels natural and authentic, not clickbait-y
- Uses emojis strategically (not excessively)

Return ONLY the comment text, nothing else. No JSON, no explanation.`
}

// ─── Comment Mining Tab ───────────────────────────────────────────────────────

function CommentMiningTab() {
  const { profile, addIdea } = useStore()
  const [comments, setComments] = useState('')
  const [videoContext, setVideoContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<CommentInsights | null>(null)

  async function mineComments() {
    if (!comments.trim()) {
      toast.error('Paste some comments first')
      return
    }

    setLoading(true)
    const apiKey = profile?.apiKey

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 2000))
      setInsights(DEMO_INSIGHTS)
      setLoading(false)
      toast.success('Demo insights loaded — add your API key in Settings for real analysis')
      return
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 2048,
          messages: [{ role: 'user', content: buildMinePrompt(comments, videoContext) }],
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      const raw = data.content?.[0]?.text ?? ''
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON')
      setInsights(JSON.parse(match[0]))
      toast.success('Insights mined!')
    } catch {
      toast.error('Failed to mine insights. Showing demo.')
      setInsights(DEMO_INSIGHTS)
    } finally {
      setLoading(false)
    }
  }

  function handleAddToIdeaBank(req: ContentRequest) {
    const idea: ContentIdea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: req.title,
      hook: `Requested by your audience: ${req.format}`,
      contentType: 'video' as ContentType,
      platforms: ['youtube'] as Platform[],
      aiScore: req.engagementPotential === 'High' ? 8.5 : req.engagementPotential === 'Medium' ? 7.0 : 5.5,
      scoreBreakdown: {
        hookStrength: 8,
        nicheRelevance: 9,
        trendAlignment: 7,
        engagementPotential: req.engagementPotential === 'High' ? 9 : 7,
        channelFit: 8,
        uniqueness: 7,
      },
      status: 'inbox',
      source: 'manual',
      tags: ['audience-requested', 'comment-mining'],
      createdAt: new Date().toISOString(),
    }
    addIdea(idea)
    toast.success(`"${req.title}" added to Idea Bank`)
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: '#6b7a9a', marginBottom: 24 }}>
        Turn comments into content gold
      </p>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left: Input */}
        <div style={{ width: 420, flexShrink: 0 }}>
          <div className="card" style={{ padding: '24px', background: '#0d0d1a' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Paste 10–30 comments from your latest video
              </label>
              <textarea
                className="field"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={`Copy-paste comments here...\n\nExample:\n"This is exactly what I needed, thank you!"\n"Can you do a video on meal prep?"\n"I've been struggling with consistency..."`}
                rows={10}
                style={{ width: '100%', minHeight: 250, resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                What was this video about?
              </label>
              <input
                className="field"
                value={videoContext}
                onChange={(e) => setVideoContext(e.target.value)}
                placeholder="e.g. 5 morning habits for fat loss"
                style={{ width: '100%' }}
              />
            </div>

            <button
              className="btn btn-pink"
              onClick={mineComments}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              <Pickaxe size={15} />
              {loading ? 'Mining...' : 'Mine for Insights'}
            </button>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ marginTop: 16, textAlign: 'center' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', marginBottom: 8 }}
                >
                  <Pickaxe size={20} color="#ec4899" />
                </motion.div>
                <p style={{ fontSize: 13, color: '#6b7a9a' }}>Analyzing comment patterns...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Insights */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <AnimatePresence>
            {insights && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                {/* Card 1: Pain Points */}
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0, ...spring }}
                  style={{ padding: '20px 22px', borderColor: 'rgba(249,115,22,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(249,115,22,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={14} color="#f97316" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff' }}>Audience Pain Points</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {insights.painPoints.map((pp, i) => (
                      <div key={i} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)',
                      }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 4 }}>{pp.pain}</p>
                        <p style={{ fontSize: 12, color: '#f97316', lineHeight: 1.4 }}>
                          Content angle: {pp.contentAngle}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Card 2: Content Requests */}
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.07, ...spring }}
                  style={{ padding: '20px 22px', borderColor: 'rgba(59,130,246,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(59,130,246,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <BarChart2 size={14} color="#3b82f6" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff' }}>Top Content Requests</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {insights.contentRequests.map((req, i) => (
                      <div key={i} style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#f0f4ff', marginBottom: 3 }}>{req.title}</p>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{req.format}</span>
                            <span style={{
                              fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 20,
                              background: `${engagementPotentialColor(req.engagementPotential)}18`,
                              color: engagementPotentialColor(req.engagementPotential),
                            }}>{req.engagementPotential}</span>
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleAddToIdeaBank(req)}
                          style={{ flexShrink: 0, cursor: 'pointer' }}
                        >
                          <Plus size={11} />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Card 3: Audience Persona */}
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, ...spring }}
                  style={{ padding: '20px 22px', borderColor: 'rgba(167,139,250,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(167,139,250,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Users size={14} color="#a78bfa" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff' }}>Audience Persona Summary</span>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12,
                  }}>
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.12)',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7a9a', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Age Range</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa', fontFamily: 'Space Mono, monospace' }}>{insights.persona.ageRange}</p>
                    </div>
                    <div style={{
                      padding: '10px 14px', borderRadius: 8,
                      background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.12)',
                    }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7a9a', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Level</p>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: `${expertiseBadgeColor(insights.persona.expertiseLevel)}18`,
                        color: expertiseBadgeColor(insights.persona.expertiseLevel),
                      }}>{insights.persona.expertiseLevel}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7a9a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Characteristics</p>
                    {insights.persona.characteristics.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: '#c7d3f0', lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.1)',
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7a9a', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cares about</p>
                    <p style={{ fontSize: 12.5, color: '#f0f4ff', lineHeight: 1.5 }}>{insights.persona.caresAbout}</p>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6b7a9a' }}>Preferred tone:</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'rgba(167,139,250,0.12)', color: '#a78bfa',
                    }}>{insights.persona.tone}</span>
                  </div>
                </motion.div>

                {/* Card 4: Sentiment */}
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.21, ...spring }}
                  style={{ padding: '20px 22px', borderColor: 'rgba(16,185,129,0.2)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(16,185,129,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Heart size={14} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#f0f4ff' }}>Sentiment Analysis</span>
                  </div>

                  {/* Overall sentiment labels */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    {[
                      { label: 'Positive', value: insights.sentiment.positive, color: '#10b981' },
                      { label: 'Neutral', value: insights.sentiment.neutral, color: '#94a3b8' },
                      { label: 'Negative', value: insights.sentiment.negative, color: '#ef4444' },
                    ].map((s) => (
                      <div key={s.label} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                          fontSize: 18, fontWeight: 800, color: s.color,
                          fontFamily: 'Space Mono, monospace',
                        }}>{s.value}%</div>
                        <div style={{ fontSize: 11, color: '#6b7a9a' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Visual bar */}
                  <div style={{
                    height: 8, borderRadius: 99, overflow: 'hidden',
                    display: 'flex', gap: 2, marginBottom: 14,
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights.sentiment.positive}%` }}
                      transition={{ delay: 0.3, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: '#10b981', borderRadius: '99px 0 0 99px' }}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights.sentiment.neutral}%` }}
                      transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: '#94a3b8' }}
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights.sentiment.negative}%` }}
                      transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: '#ef4444', borderRadius: '0 99px 99px 0' }}
                    />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#10b981', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>What's resonating</p>
                    {insights.sentiment.resonating.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: '#c7d3f0', lineHeight: 1.5 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>What needs addressing</p>
                    {insights.sentiment.needsAddressing.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', marginTop: 5, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: '#c7d3f0', lineHeight: 1.5 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Engagement Score */}
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, ...spring }}
                  style={{ padding: '20px 22px' }}
                >
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
                    Based on comment quality, your estimated engagement quality score:
                    <span style={{
                      fontFamily: 'Space Mono, monospace', fontWeight: 700, fontSize: 18,
                      color: '#06b6d4', marginLeft: 10,
                    }}>
                      {insights.engagementScore.overall.toFixed(1)}/10
                    </span>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                    {[
                      { label: 'Question rate', value: insights.engagementScore.questionRate },
                      { label: 'Emotional response rate', value: insights.engagementScore.emotionalResponseRate },
                      { label: 'Return intent signals', value: insights.engagementScore.returnIntentSignals },
                    ].map((m) => (
                      <div key={m.label} style={{
                        padding: '10px 14px', borderRadius: 8,
                        background: '#0d0d1a', border: '1px solid rgba(6,182,212,0.12)',
                      }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#06b6d4', fontFamily: 'Space Mono, monospace' }}>
                          {m.value.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#6b7a9a', marginTop: 2 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!insights && !loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 300, color: '#4b5680', textAlign: 'center', gap: 12,
            }}>
              <Pickaxe size={36} color="#2a2a4a" />
              <p style={{ fontSize: 14, fontWeight: 600 }}>Paste your comments and hit Mine</p>
              <p style={{ fontSize: 12, color: '#4b5680' }}>Insights will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Reply Lab Tab ─────────────────────────────────────────────────────────────

function ReplyLabTab() {
  const { profile } = useStore()
  const [comment, setComment] = useState('')
  const [commentType, setCommentType] = useState<CommentType>('Praise')
  const [tone, setTone] = useState<ReplyTone>('Friendly')
  const [loading, setLoading] = useState(false)
  const [replies, setReplies] = useState<ReplyCard[] | null>(null)

  // Pinned comment generator
  const [pinnedGoal, setPinnedGoal] = useState('')
  const [ctaGoal, setCtaGoal] = useState<CTAGoal>('Subscribe')
  const [wordTarget, setWordTarget] = useState<WordTarget>(100)
  const [pinnedLoading, setPinnedLoading] = useState(false)
  const [pinnedComment, setPinnedComment] = useState('')

  async function generateReplies() {
    if (!comment.trim()) {
      toast.error('Paste a comment first')
      return
    }
    setLoading(true)
    const apiKey = profile?.apiKey

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 1500))
      setReplies(DEMO_REPLIES)
      setLoading(false)
      toast.success('Demo replies loaded')
      return
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: buildReplyPrompt(comment, commentType, tone) }],
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      const raw = data.content?.[0]?.text ?? ''
      const match = raw.match(/\[[\s\S]*\]/)
      if (!match) throw new Error('No JSON array')
      setReplies(JSON.parse(match[0]))
      toast.success('Replies generated!')
    } catch {
      toast.error('Failed — showing demo replies')
      setReplies(DEMO_REPLIES)
    } finally {
      setLoading(false)
    }
  }

  async function generatePinnedComment() {
    if (!pinnedGoal.trim()) {
      toast.error('Describe what you want viewers to do')
      return
    }
    setPinnedLoading(true)
    const apiKey = profile?.apiKey

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 1200))
      setPinnedComment(`👇 Before you leave — do this ONE thing:\n\n• Drop a comment below with your biggest [goal] challenge\n• I read every single one and often make videos based on your replies\n• And if this video helped you, hit subscribe — I post every week with more practical tips\n\nLet's build this together. See you in the comments! 🔔`)
      setPinnedLoading(false)
      return
    }

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 512,
          messages: [{ role: 'user', content: buildPinnedCommentPrompt(pinnedGoal, ctaGoal, wordTarget) }],
        }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setPinnedComment(data.content?.[0]?.text ?? '')
      toast.success('Pinned comment generated!')
    } catch {
      toast.error('Failed to generate pinned comment')
    } finally {
      setPinnedLoading(false)
    }
  }

  const commentTypes: CommentType[] = ['Praise', 'Question', 'Criticism', 'Request', 'Off-topic']
  const tones: ReplyTone[] = ['Friendly', 'Educational', 'Playful', 'Empathetic', 'Professional']
  const ctaGoals: CTAGoal[] = ['Subscribe', 'Like', 'Comment', 'Share', 'Buy product', 'Visit link']

  return (
    <div>
      <p style={{ fontSize: 14, color: '#6b7a9a', marginBottom: 24 }}>
        Reply faster, connect deeper
      </p>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 32 }}>
        {/* Left: Input */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <div className="card" style={{ padding: '24px', background: '#0d0d1a' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Paste a comment you want to reply to
              </label>
              <textarea
                className="field"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. This video changed my perspective on fitness. I've been struggling for years and finally feel like I have a path forward. Thank you!"
                rows={4}
                style={{ width: '100%', resize: 'vertical', lineHeight: 1.6, fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Comment type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {commentTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setCommentType(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      transition: 'all 150ms ease',
                      background: commentType === t ? 'rgba(236,72,153,0.2)' : '#0d0d1a',
                      color: commentType === t ? '#ec4899' : '#6b7a9a',
                      outline: commentType === t ? '1px solid rgba(236,72,153,0.4)' : '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Tone
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      transition: 'all 150ms ease',
                      background: tone === t ? 'rgba(59,130,246,0.2)' : '#0d0d1a',
                      color: tone === t ? '#3b82f6' : '#6b7a9a',
                      outline: tone === t ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-pink"
              onClick={generateReplies}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              <MessageSquarePlus size={15} />
              {loading ? 'Generating...' : 'Generate Replies'}
            </button>
          </div>
        </div>

        {/* Right: Reply Suggestions */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <AnimatePresence>
            {replies && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {replies.map((r, i) => (
                  <motion.div
                    key={i}
                    className="card"
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, ...spring }}
                    style={{ padding: '18px 20px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: `${r.styleBadgeColor}18`, color: r.styleBadgeColor,
                      }}>{r.style}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                          {r.wordCount}w
                        </span>
                        <CopyButton text={r.text} />
                      </div>
                    </div>
                    <p style={{
                      fontSize: 13.5, color: '#c7d3f0', lineHeight: 1.65,
                      background: '#0d0d1a', borderRadius: 8, padding: '12px 14px',
                      border: '1px solid rgba(59,130,246,0.08)',
                    }}>{r.text}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!replies && !loading && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 280, color: '#4b5680', textAlign: 'center', gap: 12,
            }}>
              <MessageSquarePlus size={36} color="#2a2a4a" />
              <p style={{ fontSize: 14, fontWeight: 600 }}>3 reply variants will appear here</p>
              <p style={{ fontSize: 12, color: '#4b5680' }}>Each crafted for a different vibe</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Reply Templates */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: '#6b7a9a',
          textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 16,
        }}>
          Quick reply templates for common comment types
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 14,
        }}>
          {BULK_TEMPLATES.map((bt, i) => (
            <motion.div
              key={i}
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ...spring }}
              style={{ padding: '16px 18px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <span style={{ color: '#94a3b8' }}>{bt.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{bt.category}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bt.templates.map((tpl, j) => (
                  <div key={j} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: '#0d0d1a', border: '1px solid rgba(59,130,246,0.08)',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}>
                    <p style={{ flex: 1, fontSize: 12.5, color: '#94a3b8', lineHeight: 1.55, margin: 0 }}>{tpl}</p>
                    <CopyButton text={tpl} label="" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pinned Comment Generator */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ...spring }}
        style={{ padding: '24px 28px', border: '1px solid rgba(6,182,212,0.2)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(6,182,212,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pin size={15} color="#06b6d4" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f0f4ff' }}>Pinned Comment Generator</h3>
            <p style={{ fontSize: 12, color: '#6b7a9a' }}>Create a punchy pinned comment that drives action</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                What do you want viewers to do after watching?
              </label>
              <input
                className="field"
                value={pinnedGoal}
                onChange={(e) => setPinnedGoal(e.target.value)}
                placeholder="e.g. Comment their biggest fitness challenge so I can make a video about it"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                CTA goal
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ctaGoals.map((g) => (
                  <button
                    key={g}
                    onClick={() => setCtaGoal(g)}
                    style={{
                      padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 600,
                      transition: 'all 150ms ease',
                      background: ctaGoal === g ? 'rgba(6,182,212,0.2)' : '#0d0d1a',
                      color: ctaGoal === g ? '#06b6d4' : '#6b7a9a',
                      outline: ctaGoal === g ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>
                Word count target
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([50, 100, 150] as WordTarget[]).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWordTarget(w)}
                    style={{
                      padding: '6px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700,
                      transition: 'all 150ms ease',
                      background: wordTarget === w ? 'rgba(6,182,212,0.2)' : '#0d0d1a',
                      color: wordTarget === w ? '#06b6d4' : '#6b7a9a',
                      outline: wordTarget === w ? '1px solid rgba(6,182,212,0.4)' : '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    ~{w}w
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={generatePinnedComment}
              disabled={pinnedLoading}
              style={{ opacity: pinnedLoading ? 0.7 : 1, borderColor: 'rgba(6,182,212,0.3)', color: '#06b6d4' }}
            >
              <Pin size={13} />
              {pinnedLoading ? 'Generating...' : 'Generate Pinned Comment'}
            </button>
          </div>

          {/* Output */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <AnimatePresence>
              {pinnedComment && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={spring}
                  style={{
                    padding: '18px 20px', borderRadius: 12,
                    background: 'rgba(6,182,212,0.06)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Pin size={13} color="#06b6d4" />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>Pinned Comment</span>
                    </div>
                    <CopyButton text={pinnedComment} />
                  </div>
                  <p style={{
                    fontSize: 13.5, color: '#c7d3f0', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', margin: 0,
                  }}>{pinnedComment}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!pinnedComment && !pinnedLoading && (
              <div style={{
                height: 180, borderRadius: 12,
                border: '1px dashed rgba(6,182,212,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8, color: '#4b5680',
              }}>
                <Pin size={24} color="#2a2a4a" />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Your pinned comment will appear here</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function EngagementLab() {
  const [activeTab, setActiveTab] = useState<'mining' | 'reply'>('mining')

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
            border: '1px solid rgba(6,182,212,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FlaskConical size={18} color="#06b6d4" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.3px' }}>
              Engagement Lab
            </h1>
            <p style={{ fontSize: 13, color: '#6b7a9a', marginTop: 1 }}>
              Turn comments into insights and connections
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar" style={{ display: 'inline-flex' }}>
          <button
            className={`tab${activeTab === 'mining' ? ' active' : ''}`}
            onClick={() => setActiveTab('mining')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
          >
            <Pickaxe size={14} />
            Comment Mining
          </button>
          <button
            className={`tab${activeTab === 'reply' ? ' active' : ''}`}
            onClick={() => setActiveTab('reply')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}
          >
            <MessageSquarePlus size={14} />
            Reply Lab
          </button>
        </div>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'mining' ? (
          <motion.div
            key="mining"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
          >
            <CommentMiningTab />
          </motion.div>
        ) : (
          <motion.div
            key="reply"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            <ReplyLabTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
