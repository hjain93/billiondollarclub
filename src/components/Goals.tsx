import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { Target, Plus, X, Edit3, Trash2, TrendingUp, Star, Sparkles, Copy, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Goal, CreatorProfile } from '../types'
import { getResolvedAIKey } from '../utils/aiKey'

type GoalType = Goal['type']
type GoalStatus = Goal['status']

const TYPE_CONFIG: Record<GoalType, { label: string; color: string; icon: string }> = {
  followers:   { label: 'Followers',   color: '#3b82f6', icon: '👥' },
  engagement:  { label: 'Engagement',  color: '#ec4899', icon: '❤️' },
  revenue:     { label: 'Revenue',     color: '#10b981', icon: '💰' },
  volume:      { label: 'Posts',       color: '#f97316', icon: '📝' },
  custom:      { label: 'Custom',      color: '#a78bfa', icon: '🎯' },
}

const PLATFORM_OPTIONS = ['instagram', 'youtube', 'linkedin', 'twitter']

function emptyGoal(): Omit<Goal, 'id'> {
  return {
    type: 'followers',
    platform: 'instagram',
    label: '',
    currentValue: 0,
    targetValue: 0,
    targetDate: '',
    status: 'active',
  }
}

function GoalCard({ goal, onEdit, onDelete, onUpdate }: {
  goal: Goal
  onEdit: (g: Goal) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Goal>) => void
}) {
  const cfg = TYPE_CONFIG[goal.type]
  const pct = Math.min(100, goal.targetValue > 0 ? (goal.currentValue / goal.targetValue) * 100 : 0)
  const remaining = goal.targetValue - goal.currentValue
  const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000) : null
  const isCompleted = goal.status === 'completed' || pct >= 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card"
      style={{ padding: '20px 22px', borderColor: isCompleted ? 'rgba(16,185,129,0.3)' : undefined }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cfg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
          {isCompleted ? '🏆' : cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.01em' }}>{goal.label}</span>
            {isCompleted && (
              <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>Achieved!</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600, textTransform: 'capitalize' }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: '#4b5680', textTransform: 'capitalize' }}>· {goal.platform}</span>
            {daysLeft !== null && !isCompleted && (
              <span style={{ fontSize: 11, color: daysLeft < 7 ? '#ef4444' : daysLeft < 30 ? '#f59e0b' : '#4b5680', fontWeight: daysLeft < 30 ? 700 : 500 }}>
                · {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4, display: 'flex' }}><Edit3 size={13} /></button>
          <button onClick={() => onDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', padding: 4, display: 'flex' }}><Trash2 size={13} /></button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ background: 'rgba(59,130,246,0.1)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: 6,
              background: isCompleted
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : `linear-gradient(90deg, ${cfg.color}, ${cfg.color}bb)`,
              boxShadow: `0 0 8px ${cfg.color}40`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
          <span style={{ color: cfg.color, fontWeight: 700, fontFamily: 'Space Mono, monospace' }}>
            {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
          </span>
          <span style={{ color: isCompleted ? '#10b981' : '#4b5680', fontWeight: 700 }}>
            {isCompleted ? '100%' : `${pct.toFixed(0)}%`}
          </span>
        </div>
      </div>

      {!isCompleted && remaining > 0 && (
        <div style={{ fontSize: 12, color: '#4b5680', marginBottom: 10 }}>
          <span style={{ color: cfg.color, fontWeight: 600 }}>{remaining.toLocaleString()}</span> {cfg.label.toLowerCase()} to go
        </div>
      )}

      {/* Quick update current value */}
      {!isCompleted && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field"
            type="number"
            placeholder="Update current value"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const val = Number((e.target as HTMLInputElement).value)
                if (val > 0) {
                  onUpdate(goal.id, { currentValue: val, status: val >= goal.targetValue ? 'completed' : 'active' })
                  if (val >= goal.targetValue) toast.success(`Goal achieved: ${goal.label}! 🏆`)
                  else toast.success('Progress updated!')
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
            style={{ flex: 1, fontSize: 12, padding: '7px 10px' }}
          />
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => onUpdate(goal.id, { status: 'completed' })}
            style={{ color: '#10b981' }}
          >
            <CheckCircle size={12} /> Done
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Growth Plan Generator ──────────────────────────────────────────
interface GrowthWeek {
  week: number
  theme: string
  posts: { day: string; platform: string; type: string; topic: string; hook: string; cta: string }[]
  tasks: string[]
  kpi: string
}

interface GrowthPlan {
  summary: string
  weeks: GrowthWeek[]
  hashtags: string[]
  engagementTips: string[]
}

function GrowthPlanPanel({ profile, goals }: { profile: CreatorProfile; goals: Goal[] }) {
  const [plan, setPlan] = useState<GrowthPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedWeek, setExpandedWeek] = useState<number | null>(0)
  const [timeframe, setTimeframe] = useState<'30' | '60' | '90'>('30')

  const activeGoals = goals.filter((g) => g.status === 'active')

  async function generatePlan() {
    const apiKey = getResolvedAIKey()
    if (!apiKey) {
      // Demo plan
      const demo: GrowthPlan = {
        summary: `30-day growth plan for ${profile.name} (${profile.niche}) to reach goals across ${activeGoals.map(g => g.platform).join(', ')}.`,
        weeks: [
          {
            week: 1,
            theme: 'Foundation & Brand Voice',
            posts: [
              { day: 'Mon', platform: 'Instagram', type: 'Carousel', topic: 'My creator story', hook: 'I started with 0 followers and here\'s what I learned', cta: 'Save this for later' },
              { day: 'Wed', platform: 'Instagram', type: 'Reel', topic: `${profile.niche} tips #1`, hook: 'Most people get this wrong about ' + profile.niche, cta: 'Follow for more' },
              { day: 'Fri', platform: 'YouTube', type: 'Video', topic: 'Channel intro/value prop', hook: 'Why I started making content about ' + profile.niche, cta: 'Subscribe for weekly videos' },
              { day: 'Sun', platform: 'Instagram', type: 'Story', topic: 'Behind the scenes', hook: 'A day in my life as a creator', cta: 'Reply with your questions' },
            ],
            tasks: ['Optimize bio on all platforms', 'Set up content folder structure', 'Batch-create 3 hooks in notes', 'Engage 30 min/day with target audience'],
            kpi: '+500 followers, 5% engagement rate',
          },
          {
            week: 2,
            theme: 'Value Delivery & Trending Content',
            posts: [
              { day: 'Mon', platform: 'Instagram', type: 'Carousel', topic: 'How-to guide', hook: 'Step by step: [key skill in ' + profile.niche + ']', cta: 'Share with someone who needs this' },
              { day: 'Tue', platform: 'Twitter', type: 'Thread', topic: 'Unpopular opinion', hook: 'Hot take: Everything you know about ' + profile.niche + ' is wrong', cta: 'RT if you agree' },
              { day: 'Thu', platform: 'Instagram', type: 'Reel', topic: 'Trend adaptation', hook: 'POV: You just discovered ' + profile.niche, cta: 'Tag a friend' },
              { day: 'Sat', platform: 'YouTube', type: 'Shorts', topic: '60-second tip', hook: 'The fastest way to improve at ' + profile.niche, cta: 'Full video in bio' },
            ],
            tasks: ['Research top 5 trending audios for reels', 'Comment on 10 accounts in your niche daily', 'Create highlight covers for Instagram', 'Post in 3 relevant communities'],
            kpi: '+1000 followers, 8% engagement, 2 saves per post',
          },
          {
            week: 3,
            theme: 'Authority & Deep Dives',
            posts: [
              { day: 'Mon', platform: 'YouTube', type: 'Long-form', topic: 'Expert interview or deep dive', hook: 'Everything wrong with ' + profile.niche + ' advice online', cta: 'Subscribe + Bell' },
              { day: 'Wed', platform: 'Instagram', type: 'Carousel', topic: '10 mistakes to avoid', hook: 'I wasted 6 months doing this wrong', cta: 'Save to avoid these' },
              { day: 'Fri', platform: 'Instagram', type: 'Reel', topic: 'Results / transformation', hook: 'Before and after using my method', cta: 'Comment your goal' },
              { day: 'Sun', platform: 'LinkedIn', type: 'Article', topic: 'Personal insight/essay', hook: 'What 3 years in ' + profile.niche + ' taught me', cta: 'Follow for more' },
            ],
            tasks: ['Reach out to 5 creators for collabs', 'Set up auto-responses in DMs', 'Create reusable caption templates', 'A/B test 2 different thumbnail styles'],
            kpi: '50% reach increase, 1 collab confirmed',
          },
          {
            week: 4,
            theme: 'Community & Conversion',
            posts: [
              { day: 'Tue', platform: 'Instagram', type: 'Story Poll', topic: 'Audience question', hook: 'What\'s your biggest challenge with ' + profile.niche + '?', cta: 'Vote + DM me' },
              { day: 'Thu', platform: 'Instagram', type: 'Reel', topic: 'Viral/entertaining', hook: 'Answering your top 5 DMs', cta: 'Drop your question below' },
              { day: 'Fri', platform: 'YouTube', type: 'Video', topic: 'Q&A or FAQ', hook: 'You asked, I answer: Top 10 questions about ' + profile.niche, cta: 'Subscribe' },
              { day: 'Sun', platform: 'Instagram', type: 'Carousel', topic: 'Month recap / what\'s coming', hook: 'What I posted this month and results', cta: 'Follow to see next month\'s journey' },
            ],
            tasks: ['Review analytics: top 3 performing posts', 'Double down on best content format', 'Plan next month collab content', 'Set up link-in-bio properly'],
            kpi: `Goal progress check: ${activeGoals[0]?.label || 'Hit follower target'}`,
          },
        ],
        hashtags: ['#' + profile.niche.toLowerCase().replace(/\s+/g, ''), '#contentcreator', '#growthhacks', '#creatortips', '#socialmedia', '#instagramgrowth', '#youtubegrowth'],
        engagementTips: [
          'Reply to every comment within the first hour of posting',
          'Use location tags on Instagram posts',
          'Post when your audience is most active (check Insights)',
          'Collaborate with micro-creators in your niche',
          'Use interactive features: polls, quizzes, question stickers',
        ],
      }
      setPlan(demo)
      toast.success('Growth plan generated (demo mode)')
      return
    }

    setLoading(true)
    const goalsSummary = activeGoals.map(g => `${g.label}: ${g.currentValue} → ${g.targetValue} on ${g.platform} by ${g.targetDate}`).join('\n')
    const prompt = `You are an expert creator growth strategist. Generate a highly specific ${timeframe}-day content growth plan for this creator:

Creator: ${profile.name}
Niche: ${profile.niche}
Tone: ${profile.tone?.join(', ')}
Language: ${profile.contentLanguage}
Goals:
${goalsSummary || 'Grow audience and engagement'}

Generate a structured ${timeframe}-day plan with ${Math.floor(parseInt(timeframe) / 7)} weekly themes. For each week include:
- Theme (what this week focuses on)
- 4 specific posts (day, platform, type, topic, hook sentence, CTA)
- 4 tactical tasks
- KPI to hit by end of week

Also provide 8 niche-specific hashtags and 5 engagement tactics.

Return as JSON:
{
  "summary": "...",
  "weeks": [{"week": 1, "theme": "...", "posts": [{"day": "Mon", "platform": "...", "type": "...", "topic": "...", "hook": "...", "cta": "..."}], "tasks": ["..."], "kpi": "..."}],
  "hashtags": ["#..."],
  "engagementTips": ["..."]
}`

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
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || '{}'
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as GrowthPlan
        setPlan(parsed)
        toast.success('Growth plan generated!')
      }
    } catch {
      toast.error('Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  function copyPlan() {
    if (!plan) return
    const text = `# ${timeframe}-Day Growth Plan\n\n${plan.summary}\n\n` +
      plan.weeks.map(w =>
        `## Week ${w.week}: ${w.theme}\n\n` +
        `### Posts\n` + w.posts.map(p => `- **${p.day} - ${p.platform} ${p.type}**: ${p.topic}\n  Hook: ${p.hook}\n  CTA: ${p.cta}`).join('\n') +
        `\n\n### Tasks\n` + w.tasks.map(t => `- [ ] ${t}`).join('\n') +
        `\n\n**KPI:** ${w.kpi}`
      ).join('\n\n') +
      `\n\n## Hashtags\n${plan.hashtags.join(' ')}\n\n## Engagement Tips\n${plan.engagementTips.map(t => `- ${t}`).join('\n')}`
    navigator.clipboard.writeText(text).then(() => toast.success('Plan copied to clipboard!'))
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 2 }}>AI Growth Plan Generator</div>
          <div style={{ fontSize: 12, color: '#4b5680' }}>Get a hyper-personalised {timeframe}-day content roadmap with specific posts, tasks and KPIs</div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Timeframe selector */}
        <div style={{ display: 'flex', background: 'rgba(59,130,246,0.06)', borderRadius: 8, padding: 3, border: '1px solid rgba(59,130,246,0.1)', gap: 2 }}>
          {(['30', '60', '90'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: timeframe === t ? '#3b82f6' : 'transparent',
                color: timeframe === t ? '#fff' : '#6b7a9a',
                fontSize: 12, fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 150ms',
              }}
            >
              {t}d
            </button>
          ))}
        </div>
        {plan && (
          <button onClick={copyPlan} className="btn btn-ghost btn-sm" style={{ gap: 5 }}>
            <Copy size={12} /> Copy Plan
          </button>
        )}
        <button
          onClick={generatePlan}
          disabled={loading}
          className="btn btn-pink btn-sm"
          style={{ gap: 6 }}
        >
          {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
          {loading ? 'Generating…' : plan ? 'Regenerate' : 'Generate Plan'}
        </button>
      </div>

      {!plan && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#ec4899' }}>
            <Sparkles size={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#6b7a9a', marginBottom: 8 }}>Generate Your Growth Roadmap</div>
          <div style={{ fontSize: 13, color: '#4b5680', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 20px' }}>
            AI will create a specific {timeframe}-day plan with exact posts to create, optimal timing, hooks, CTAs, tasks, and KPIs based on your goals.
          </div>
          {activeGoals.length === 0 && (
            <div style={{ fontSize: 12, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 16px', maxWidth: 320, margin: '0 auto' }}>
              Tip: Add goals first for a more targeted plan
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader2 size={32} color="#ec4899" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7a9a' }}>Crafting your personalised growth plan…</div>
          <div style={{ fontSize: 12, color: '#4b5680', marginTop: 6 }}>Analysing your niche, goals, and platform data</div>
        </div>
      )}

      {plan && !loading && (
        <div>
          {/* Summary */}
          <div style={{ background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ec4899', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plan Summary</div>
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{plan.summary}</div>
          </div>

          {/* Weeks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.weeks.map((week) => (
              <div
                key={week.week}
                style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, overflow: 'hidden' }}
              >
                {/* Week header */}
                <div
                  onClick={() => setExpandedWeek(expandedWeek === week.week - 1 ? null : week.week - 1)}
                  style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 150ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#3b82f6' }}>
                    W{week.week}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f4ff' }}>{week.theme}</div>
                    <div style={{ fontSize: 11, color: '#4b5680', marginTop: 2 }}>{week.posts.length} posts · {week.tasks.length} tasks · KPI: {week.kpi}</div>
                  </div>
                  {expandedWeek === week.week - 1 ? <ChevronUp size={14} color="#4b5680" /> : <ChevronDown size={14} color="#4b5680" />}
                </div>

                <AnimatePresence>
                  {expandedWeek === week.week - 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(59,130,246,0.08)' }}>
                        {/* Posts */}
                        <div style={{ marginTop: 14, marginBottom: 12 }}>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Content Posts</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                            {week.posts.map((post, i) => (
                              <div key={i} style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10, padding: '10px 12px' }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                                  <span style={{ fontSize: 9.5, fontWeight: 800, color: '#60a5fa', background: 'rgba(59,130,246,0.12)', padding: '1px 6px', borderRadius: 4 }}>{post.day}</span>
                                  <span style={{ fontSize: 10, color: '#6b7a9a', fontWeight: 600 }}>{post.platform} · {post.type}</span>
                                </div>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{post.topic}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>
                                  <span style={{ color: '#ec4899', fontWeight: 700 }}>Hook:</span> {post.hook}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                  <span style={{ color: '#10b981', fontWeight: 700 }}>CTA:</span> {post.cta}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tasks */}
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Weekly Tasks</div>
                          {week.tasks.map((task, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 12.5, color: '#e2e8f0' }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid rgba(59,130,246,0.3)', flexShrink: 0, marginTop: 1 }} />
                              {task}
                            </div>
                          ))}
                        </div>

                        {/* KPI */}
                        <div style={{ marginTop: 12, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#34d399' }}>
                          <span style={{ fontWeight: 800 }}>KPI Goal:</span> {week.kpi}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Hashtags + Tips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 }}>
            <div style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Hashtag Strategy</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {plan.hashtags.map((tag, i) => (
                  <span key={i} onClick={() => navigator.clipboard.writeText(tag).then(() => toast.success('Copied!'))} style={{ fontSize: 12, color: '#60a5fa', background: 'rgba(59,130,246,0.1)', padding: '3px 10px', borderRadius: 20, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ background: '#111122', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Engagement Tips</div>
              {plan.engagementTips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                  <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Goals() {
  const { profile, addGoal, updateGoal, removeGoal } = useStore()
  const goals = profile?.goals || []
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState(emptyGoal())
  const [filter, setFilter] = useState<GoalStatus | 'all'>('active')
  const [activeTab, setActiveTab] = useState<'goals' | 'growth-plan'>('goals')

  function openNew() {
    setEditing(null)
    setForm(emptyGoal())
    setDrawerOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditing(goal)
    setForm({ type: goal.type, platform: goal.platform, label: goal.label, currentValue: goal.currentValue, targetValue: goal.targetValue, targetDate: goal.targetDate, status: goal.status })
    setDrawerOpen(true)
  }

  function saveGoal() {
    if (!form.label.trim()) { toast.error('Goal label required'); return }
    if (form.targetValue <= 0) { toast.error('Target value must be > 0'); return }
    if (editing) {
      updateGoal(editing.id, form)
      toast.success('Goal updated')
    } else {
      addGoal({ id: crypto.randomUUID(), ...form })
      toast.success('Goal added!')
    }
    setDrawerOpen(false)
  }

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter)

  // Stats
  const totalProgress = activeGoals.length > 0
    ? activeGoals.reduce((s, g) => s + Math.min(100, g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0), 0) / activeGoals.length
    : 0

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Goals & Growth</h1>
            <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>Track milestones and generate AI-powered growth plans</p>
          </div>
          {activeTab === 'goals' && (
            <button className="btn btn-blue btn-sm" onClick={openNew}><Plus size={13} /> New Goal</button>
          )}
        </div>

        {/* Summary */}
        {goals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Active Goals', value: activeGoals.length, color: '#3b82f6', icon: <Target size={14} /> },
              { label: 'Avg Progress', value: `${totalProgress.toFixed(0)}%`, color: '#f97316', icon: <TrendingUp size={14} /> },
              { label: 'Completed', value: completedGoals.length, color: '#10b981', icon: <Star size={14} /> },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: '16px 18px' }}>
                <div style={{ color: s.color, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Main tabs */}
        <div className="tab-bar" style={{ marginTop: 20 }}>
          <button className={`tab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
            <Target size={12} /> Goals
          </button>
          <button className={`tab ${activeTab === 'growth-plan' ? 'active' : ''}`} onClick={() => setActiveTab('growth-plan')} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Sparkles size={12} /> AI Growth Plan
          </button>
        </div>

        {/* Goal filter tabs (only when on goals tab) */}
        {activeTab === 'goals' && (
          <div className="tab-bar" style={{ marginTop: 10 }}>
            {([['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['paused', 'Paused']] as [GoalStatus | 'all', string][]).map(([s, label]) => (
              <button key={s} className={`tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{label}</button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Growth Plan Tab */}
      {activeTab === 'growth-plan' && profile && (
        <GrowthPlanPanel profile={profile} goals={goals} />
      )}

      {activeTab === 'goals' && (
        filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Target size={28} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7a9a', marginBottom: 8 }}>
              {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
            </div>
            <div style={{ fontSize: 13, color: '#4b5680', marginBottom: 20 }}>
              {filter === 'all' ? 'Set your first creator goal to track your growth' : 'Nothing here yet'}
            </div>
            {filter === 'all' && (
              <button className="btn btn-blue btn-sm" onClick={openNew}><Plus size={13} /> Add Goal</button>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <AnimatePresence>
              {filtered.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={openEdit}
                  onDelete={id => { removeGoal(id); toast.success('Goal removed') }}
                  onUpdate={updateGoal}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      )}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 80 }} onClick={() => setDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: '#111122', borderLeft: '1px solid rgba(59,130,246,0.2)', zIndex: 90, overflowY: 'auto' }}
            >
              <div style={{ padding: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff' }}>{editing ? 'Edit Goal' : 'New Goal'}</h3>
                  <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={16} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="sec-label">Goal Label *</label>
                    <input className="field" placeholder="e.g. Reach 50K followers on Instagram" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="sec-label">Goal Type</label>
                      <select className="field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GoalType }))}>
                        {Object.entries(TYPE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="sec-label">Platform</label>
                      <select className="field" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}>
                        {PLATFORM_OPTIONS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="sec-label">Current Value</label>
                      <input className="field" type="number" placeholder="0" value={form.currentValue || ''} onChange={e => setForm(f => ({ ...f, currentValue: Number(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="sec-label">Target Value *</label>
                      <input className="field" type="number" placeholder="50000" value={form.targetValue || ''} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div>
                    <label className="sec-label">Target Date</label>
                    <input className="field" type="date" value={form.targetDate || ''} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="sec-label">Status</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {(['active', 'paused'] as GoalStatus[]).map(s => (
                        <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))} style={{
                          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: form.status === s ? '1px solid #3b82f6' : '1px solid rgba(59,130,246,0.15)',
                          background: form.status === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                          color: form.status === s ? '#3b82f6' : '#4b5680',
                          fontFamily: 'Plus Jakarta Sans, sans-serif', textTransform: 'capitalize', transition: 'all 140ms',
                        }}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <button className="btn btn-blue" style={{ marginTop: 4 }} onClick={saveGoal}>
                    {editing ? 'Update Goal' : 'Create Goal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
