import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import { getResolvedAIKey, hasResolvedAIKey } from '../utils/aiKey'
import type { ContentIdea, CalendarPost, BrandDeal, SmartTask, IncomeEntry } from '../types'
import {
  Brain, Sparkles, Target, AlertTriangle, TrendingUp, Calendar,
  MessageSquare, ChevronRight, X, Zap, Clock, DollarSign, Send,
  RotateCcw, Lightbulb,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#080810',
  card: '#0d0d1a',
  cardHover: '#111126',
  border: 'rgba(59,130,246,0.1)',
  borderHover: 'rgba(59,130,246,0.25)',
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  pink: '#ec4899',
  purple: '#a78bfa',
  danger: '#ef4444',
  text: '#f0f4ff',
  muted: '#4b5680',
  mutedLight: '#6b7db3',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toDateStr(iso: string) {
  return iso.split('T')[0]
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86400000)
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  const time = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${time}, ${name.split(' ')[0]}`
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })
}

// ── Briefing generator ────────────────────────────────────────────────────────
function generateBriefing(
  smartTasks: SmartTask[],
  calendarPosts: CalendarPost[],
  brandDeals: BrandDeal[],
  incomeEntries: IncomeEntry[],
  monthlyTarget: number,
) {
  const today = todayStr()
  const sentences: string[] = []

  // Tasks due today
  const tasksDue = smartTasks.filter(
    (t) => t.dueDate && toDateStr(t.dueDate) <= today && t.status !== 'done',
  ).length
  const postsToday = calendarPosts.filter((p) => toDateStr(p.scheduledAt) === today).length

  if (tasksDue > 0 || postsToday > 0) {
    const parts: string[] = []
    if (tasksDue > 0) parts.push(`${tasksDue} task${tasksDue > 1 ? 's' : ''} due today`)
    if (postsToday > 0) parts.push(`${postsToday} post${postsToday > 1 ? 's' : ''} scheduled`)
    sentences.push(`You have ${parts.join(' and ')}.`)
  }

  // Posting streak risk
  const publishedPosts = calendarPosts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  const lastPost = publishedPosts[0]
  if (lastPost) {
    const days = daysBetween(today, toDateStr(lastPost.scheduledAt))
    if (days >= 3) {
      sentences.push(`You haven't posted in ${days} day${days > 1 ? 's' : ''} — your streak is at risk.`)
    }
  } else if (calendarPosts.length === 0) {
    sentences.push('No posts logged yet. Start scheduling content to track your streak.')
  }

  // Income progress
  const thisMonth = today.slice(0, 7)
  const monthIncome = incomeEntries
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0)
  if (monthlyTarget > 0 && monthIncome > 0) {
    const pct = Math.round((monthIncome / monthlyTarget) * 100)
    sentences.push(`Income this month: ₹${monthIncome.toLocaleString('en-IN')} — ${pct}% of your ₹${monthlyTarget.toLocaleString('en-IN')} target.`)
  }

  // Urgent deals
  const urgentDeals = brandDeals.filter((d) => {
    if (!d.deadline) return false
    const daysLeft = daysBetween(toDateStr(d.deadline), today)
    return daysLeft <= 3 && d.status !== 'completed' && d.status !== 'declined'
  }).length
  if (urgentDeals > 0) {
    sentences.push(`${urgentDeals} brand deal${urgentDeals > 1 ? 's' : ''} deadline within 3 days — action needed.`)
  }

  if (sentences.length === 0) {
    sentences.push("You're all caught up. No urgent actions needed today.")
    sentences.push('Focus on creating quality content and building momentum.')
  }

  return sentences.slice(0, 3).join(' ')
}

// ── Action item generators ────────────────────────────────────────────────────
interface ActionItem {
  id: string
  priority: 'P1' | 'P2' | 'P3'
  title: string
  context: string
  actionLabel: string
  actionView: string
}

function generateActions(
  smartTasks: SmartTask[],
  brandDeals: BrandDeal[],
  calendarPosts: CalendarPost[],
  ideas: ContentIdea[],
): ActionItem[] {
  const today = todayStr()
  const items: ActionItem[] = []

  // 1. Overdue tasks
  const overdue = smartTasks.filter(
    (t) => t.dueDate && toDateStr(t.dueDate) < today && t.status !== 'done',
  )
  if (overdue.length > 0) {
    const oldest = overdue[0]
    items.push({
      id: 'overdue-tasks',
      priority: 'P1',
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} — "${oldest.title.slice(0, 40)}${oldest.title.length > 40 ? '…' : ''}"`,
      context: `Oldest: ${oldest.dueDate ? `Due ${oldest.dueDate}` : 'No due date'} · ${overdue.length} total overdue`,
      actionLabel: 'Review Tasks',
      actionView: 'tasks',
    })
  }

  // 2. Brand deal deadlines within 3 days
  const urgentDeals = brandDeals.filter((d) => {
    if (!d.deadline) return false
    const diff = daysBetween(toDateStr(d.deadline), today)
    return diff >= 0 && diff <= 3 && d.status !== 'completed' && d.status !== 'declined'
  })
  if (urgentDeals.length > 0) {
    const deal = urgentDeals[0]
    const daysLeft = daysBetween(toDateStr(deal.deadline!), today)
    items.push({
      id: 'deal-deadline',
      priority: 'P1',
      title: `Brand deal due ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`} — ${deal.brand}`,
      context: `Value: ₹${deal.value.toLocaleString('en-IN')} · Status: ${deal.status} · ${deal.deliverables.slice(0, 50)}`,
      actionLabel: 'Open Deals',
      actionView: 'brand-deals',
    })
  }

  // 3. Posting streak risk
  const published = calendarPosts
    .filter((p) => p.status === 'published')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  const lastPost = published[0]
  const daysSincePost = lastPost ? daysBetween(today, toDateStr(lastPost.scheduledAt)) : 999
  if (daysSincePost >= 3) {
    items.push({
      id: 'streak-risk',
      priority: daysSincePost >= 5 ? 'P1' : 'P2',
      title: `Post today — you haven't posted in ${daysSincePost >= 999 ? 'a while' : `${daysSincePost} days`}`,
      context: lastPost
        ? `Last post: ${toDateStr(lastPost.scheduledAt)} · Streak at risk`
        : 'No posts logged · Start your streak',
      actionLabel: 'Open Calendar',
      actionView: 'calendar',
    })
  }

  // 4. High-score ideas not acted on
  const hotIdeas = ideas.filter((i) => i.aiScore > 80 && i.status === 'inbox')
  if (hotIdeas.length > 0) {
    const best = hotIdeas.sort((a, b) => b.aiScore - a.aiScore)[0]
    items.push({
      id: 'hot-idea',
      priority: 'P2',
      title: `High-potential idea ready — "${best.title.slice(0, 45)}${best.title.length > 45 ? '…' : ''}"`,
      context: `AI Score: ${best.aiScore} · ${hotIdeas.length} idea${hotIdeas.length > 1 ? 's' : ''} with score >80 waiting`,
      actionLabel: 'View Ideas',
      actionView: 'idea-engine',
    })
  }

  // 5. Upcoming calendar posts needing content (scheduled but no notes/content)
  const needsContent = calendarPosts.filter((p) => {
    const diff = daysBetween(toDateStr(p.scheduledAt), today)
    return p.status === 'scheduled' && diff >= 0 && diff <= 2 && !p.notes
  })
  if (needsContent.length > 0) {
    items.push({
      id: 'needs-content',
      priority: 'P2',
      title: `${needsContent.length} upcoming post${needsContent.length > 1 ? 's' : ''} need${needsContent.length === 1 ? 's' : ''} content`,
      context: `Scheduled within 2 days · No notes/content added yet`,
      actionLabel: 'Open Calendar',
      actionView: 'calendar',
    })
  }

  // 6. Stale ideas >7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const staleIdeas = ideas.filter(
    (i) => i.status === 'inbox' && toDateStr(i.createdAt) < sevenDaysAgo,
  )
  if (staleIdeas.length > 0 && items.length < 5) {
    items.push({
      id: 'stale-ideas',
      priority: 'P3',
      title: `${staleIdeas.length} idea${staleIdeas.length > 1 ? 's' : ''} sitting untouched for 7+ days`,
      context: 'Good ideas go stale — act or archive them now',
      actionLabel: 'Review Now',
      actionView: 'idea-engine',
    })
  }

  return items.slice(0, 5)
}

// ── Insight generators ────────────────────────────────────────────────────────
interface Insight {
  id: string
  badge: 'Pattern Detected' | 'Opportunity' | 'Warning' | 'Milestone'
  badgeColor: string
  icon: React.ComponentType<{ size: number; color?: string }>
  headline: string
  explanation: string
  confidence: string
  confidenceCount: number
}

function generateInsights(
  ideas: ContentIdea[],
  _smartTasks: SmartTask[],
  calendarPosts: CalendarPost[],
  brandDeals: BrandDeal[],
  incomeEntries: IncomeEntry[],
  monthlyTarget: number,
): Insight[] {
  const today = todayStr()
  const insights: Insight[] = []

  // 1. Top-performing tag/niche pattern
  if (ideas.length >= 5) {
    const tagScores: Record<string, { total: number; count: number }> = {}
    ideas.forEach((idea) => {
      idea.tags.forEach((tag) => {
        if (!tagScores[tag]) tagScores[tag] = { total: 0, count: 0 }
        tagScores[tag].total += idea.aiScore
        tagScores[tag].count++
      })
    })
    const avgOverall = ideas.reduce((s, i) => s + i.aiScore, 0) / ideas.length
    const topTag = Object.entries(tagScores)
      .filter(([, v]) => v.count >= 2)
      .map(([tag, v]) => ({ tag, avg: v.total / v.count, count: v.count }))
      .sort((a, b) => b.avg - a.avg)[0]
    if (topTag && topTag.avg > avgOverall + 5) {
      const lift = Math.round(((topTag.avg - avgOverall) / avgOverall) * 100)
      insights.push({
        id: 'tag-pattern',
        badge: 'Pattern Detected',
        badgeColor: C.primary,
        icon: TrendingUp,
        headline: `"${topTag.tag}" ideas score ${lift}% above your average`,
        explanation: `Your ${topTag.tag} content consistently gets higher AI scores (avg ${Math.round(topTag.avg)}) vs your overall average of ${Math.round(avgOverall)}. This is your highest-leverage content type.`,
        confidence: `High confidence based on ${topTag.count} data points`,
        confidenceCount: topTag.count,
      })
    }
  }

  // 2. Day-of-week posting pattern
  const dayPostCounts: Record<number, number> = {}
  calendarPosts
    .filter((p) => p.status === 'published')
    .forEach((p) => {
      const day = new Date(p.scheduledAt).getDay()
      dayPostCounts[day] = (dayPostCounts[day] || 0) + 1
    })
  const dayEntries = Object.entries(dayPostCounts).map(([d, c]) => ({ day: Number(d), count: c }))
  if (dayEntries.length >= 3) {
    const best = dayEntries.sort((a, b) => b.count - a.count)[0]
    const totalPosts = dayEntries.reduce((s, e) => s + e.count, 0)
    const avgPerDay = totalPosts / dayEntries.length
    const lift = Math.round(((best.count - avgPerDay) / avgPerDay) * 100)
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    if (lift > 20) {
      insights.push({
        id: 'day-pattern',
        badge: 'Pattern Detected',
        badgeColor: C.purple,
        icon: Calendar,
        headline: `${DAYS[best.day]} posts perform ${lift}% better than average`,
        explanation: `You've published ${best.count} posts on ${DAYS[best.day]} — more than any other day. Doubling down on ${DAYS[best.day]} could significantly improve your consistency metrics.`,
        confidence: `Based on ${totalPosts} published posts`,
        confidenceCount: totalPosts,
      })
    }
  }

  // 3. Stale ideas alert
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const staleIdeas = ideas.filter(
    (i) => i.status === 'inbox' && i.createdAt < sevenDaysAgo,
  )
  if (staleIdeas.length >= 3) {
    insights.push({
      id: 'stale-ideas',
      badge: 'Warning',
      badgeColor: C.warning,
      icon: AlertTriangle,
      headline: `${staleIdeas.length} ideas are collecting dust (7+ days old)`,
      explanation: `Ideas older than a week rarely get executed. Your ${staleIdeas.length} stale ideas represent potential content you're leaving on the table. Archive or schedule them today.`,
      confidence: `Based on ${ideas.length} total ideas tracked`,
      confidenceCount: ideas.length,
    })
  }

  // 4. Income milestone
  if (monthlyTarget > 0) {
    const thisMonth = today.slice(0, 7)
    const monthIncome = incomeEntries
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0)
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const dayOfMonth = new Date().getDate()
    const daysLeft = daysInMonth - dayOfMonth
    const pct = Math.round((monthIncome / monthlyTarget) * 100)
    if (pct >= 75) {
      insights.push({
        id: 'income-milestone',
        badge: 'Milestone',
        badgeColor: C.success,
        icon: DollarSign,
        headline: `Income target ${pct}% complete — ${daysLeft} days remaining`,
        explanation: `You've earned ₹${monthIncome.toLocaleString('en-IN')} of ₹${monthlyTarget.toLocaleString('en-IN')} this month. At this rate you're on track to hit ${Math.round(pct * (daysInMonth / dayOfMonth))}% of your target.`,
        confidence: `Based on ${incomeEntries.filter((e) => e.date.startsWith(thisMonth)).length} income entries this month`,
        confidenceCount: incomeEntries.filter((e) => e.date.startsWith(thisMonth)).length,
      })
    } else if (pct < 40 && dayOfMonth > 15) {
      insights.push({
        id: 'income-risk',
        badge: 'Warning',
        badgeColor: C.danger,
        icon: DollarSign,
        headline: `Revenue target at risk — only ${pct}% reached past mid-month`,
        explanation: `With ${daysLeft} days left and only ₹${monthIncome.toLocaleString('en-IN')} earned, you need ₹${(monthlyTarget - monthIncome).toLocaleString('en-IN')} more to hit your target. Consider activating brand deals in pipeline.`,
        confidence: `Based on ${incomeEntries.length} income entries`,
        confidenceCount: incomeEntries.length,
      })
    }
  }

  // 5. Brand deal pipeline opportunity
  const activePipeline = brandDeals.filter(
    (d) => d.status === 'prospect' || d.status === 'negotiating',
  )
  if (activePipeline.length >= 2) {
    const totalValue = activePipeline.reduce((s, d) => s + d.value, 0)
    insights.push({
      id: 'deal-pipeline',
      badge: 'Opportunity',
      badgeColor: C.pink,
      icon: Target,
      headline: `${activePipeline.length} deals worth ₹${totalValue.toLocaleString('en-IN')} need follow-up`,
      explanation: `You have ${activePipeline.length} brand deals in prospect or negotiating stage totalling ₹${totalValue.toLocaleString('en-IN')}. Follow up now while momentum is high — deals go cold fast.`,
      confidence: `Based on ${brandDeals.length} total deals tracked`,
      confidenceCount: brandDeals.length,
    })
  }

  return insights
}

// ── Rule-based chat responses ─────────────────────────────────────────────────
function ruleBasedResponse(
  query: string,
  smartTasks: SmartTask[],
  ideas: ContentIdea[],
  brandDeals: BrandDeal[],
  incomeEntries: IncomeEntry[],
  monthlyTarget: number,
): string {
  const q = query.toLowerCase()
  const today = todayStr()

  if (q.includes('focus') || q.includes('week') || q.includes('priority')) {
    const overdue = smartTasks.filter(
      (t) => t.dueDate && toDateStr(t.dueDate) < today && t.status !== 'done',
    )
    const urgent = smartTasks
      .filter((t) => t.priority === 'urgent' && t.status !== 'done')
      .slice(0, 3)
    let resp = 'Based on your data, here\'s what to prioritize:\n\n'
    if (overdue.length > 0) resp += `• Clear ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} first\n`
    if (urgent.length > 0) resp += urgent.map((t) => `• "${t.title}"`).join('\n') + '\n'
    resp += '\nYour highest-leverage activity is consistent content + following up on open deals.'
    return resp
  }

  if (q.includes('revenue') || q.includes('income') || q.includes('money')) {
    const thisMonth = today.slice(0, 7)
    const monthIncome = incomeEntries
      .filter((e) => e.date.startsWith(thisMonth))
      .reduce((s, e) => s + e.amount, 0)
    const pipeline = brandDeals
      .filter((d) => d.status === 'prospect' || d.status === 'negotiating')
      .reduce((s, d) => s + d.value, 0)
    return `This month's income: ₹${monthIncome.toLocaleString('en-IN')} of ₹${monthlyTarget.toLocaleString('en-IN')} target.\n\nPipeline (prospect + negotiating): ₹${pipeline.toLocaleString('en-IN')} potential.\n\nTop opportunity: Follow up on your ${brandDeals.filter((d) => d.status === 'negotiating').length} negotiating deals. Those are closest to close.`
  }

  if (q.includes('content') || q.includes('post') || q.includes('idea')) {
    const top3 = [...ideas]
      .filter((i) => i.status === 'inbox')
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3)
    if (top3.length === 0) return 'No ideas in your inbox. Head to Idea Engine to generate fresh content ideas.'
    return `Your top 3 ideas by AI score:\n\n${top3.map((i, idx) => `${idx + 1}. "${i.title}" (Score: ${i.aiScore})`).join('\n')}\n\nStart with the highest-scoring one — it aligns best with your niche and trends.`
  }

  if (q.includes('trend') || q.includes('competitor')) {
    return 'Based on your content history, your strongest content themes are performing well. Check the Trend Radar for real-time signals and the Competitor Radar for benchmarking. Short-form video continues to dominate — consider a Reel or YouTube Short this week.'
  }

  if (q.includes('goal') || q.includes('track')) {
    return 'Review your goals dashboard. Make sure your weekly posting frequency aligns with your follower growth targets. Consistency over intensity — even 3 posts/week compounds significantly over 6 months.'
  }

  // Default
  const tasksDue = smartTasks.filter(
    (t) => t.dueDate && toDateStr(t.dueDate) <= today && t.status !== 'done',
  ).length
  const topIdea = [...ideas].filter((i) => i.status === 'inbox').sort((a, b) => b.aiScore - a.aiScore)[0]
  return `Based on your data, I recommend:\n\n${tasksDue > 0 ? `• Clear ${tasksDue} task${tasksDue > 1 ? 's' : ''} due today\n` : ''}${topIdea ? `• Your top idea "${topIdea.title.slice(0, 40)}" scores ${topIdea.aiScore} — schedule it\n` : ''}• Follow up on any open brand deals\n\nStay consistent. Your best content comes from a clear, focused mind.`
}

// ── Priority dot ──────────────────────────────────────────────────────────────
function PriorityDot({ level }: { level: 'P1' | 'P2' | 'P3' }) {
  const color = level === 'P1' ? C.danger : level === 'P2' ? C.warning : C.primary
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 6px ${color}80`,
      }}
    />
  )
}

// ── Chat message types ────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const QUICK_PROMPTS = [
  'What to post today?',
  'How am I tracking on goals?',
  'What\'s my best opportunity?',
  'Analyze my income',
  'What are competitors doing?',
]

const PLACEHOLDER_CYCLE = [
  'What should I focus on this week?',
  'How is my income tracking?',
  'Which idea should I make first?',
  'Am I on track with my goals?',
  'What content should I post today?',
]

// ── Main component ────────────────────────────────────────────────────────────
export function CreatorChiefOfStaff() {
  const {
    profile, ideas, smartTasks, calendarPosts, brandDeals,
    incomeEntries, monthlyIncomeTarget, setView,
  } = useStore()

  // Briefing expand
  const [briefExpanded, setBriefExpanded] = useState(false)

  // Dismissed insights
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([])

  // Chat
  const HISTORY_KEY = 'creator-cos-history'
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [inputVal, setInputVal] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cycle placeholder
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_CYCLE.length), 3500)
    return () => clearInterval(t)
  }, [])

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-10)))
    } catch { /* ignore */ }
  }, [messages])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Computed data
  const briefing = useMemo(
    () => generateBriefing(smartTasks, calendarPosts, brandDeals, incomeEntries, monthlyIncomeTarget),
    [smartTasks, calendarPosts, brandDeals, incomeEntries, monthlyIncomeTarget],
  )

  const actions = useMemo(
    () => generateActions(smartTasks, brandDeals, calendarPosts, ideas),
    [smartTasks, brandDeals, calendarPosts, ideas],
  )

  const allInsights = useMemo(
    () => generateInsights(ideas, smartTasks, calendarPosts, brandDeals, incomeEntries, monthlyIncomeTarget),
    [ideas, smartTasks, calendarPosts, brandDeals, incomeEntries, monthlyIncomeTarget],
  )

  const visibleInsights = allInsights.filter((i) => !dismissedInsights.includes(i.id))

  // Chat submit
  async function handleSend(text?: string) {
    const query = (text ?? inputVal).trim()
    if (!query) return

    const now = Date.now()
    const userMsg: ChatMessage = {
      id: now.toString(),
      role: 'user',
      content: query,
      timestamp: now,
    }
    setMessages((prev) => [...prev.slice(-9), userMsg])
    setInputVal('')
    setIsTyping(true)

    // Try Claude API if key exists
    const apiKey = getResolvedAIKey()
    if (apiKey) {
      try {
        const context = `You are the Creator Chief of Staff for ${profile?.name || 'Creator'}, a ${profile?.niche || 'general'} creator.
Data summary:
- Tasks: ${smartTasks.length} total, ${smartTasks.filter((t) => t.status !== 'done').length} active
- Ideas: ${ideas.length} total, ${ideas.filter((i) => i.status === 'inbox').length} in inbox
- Calendar posts: ${calendarPosts.length} total, ${calendarPosts.filter((p) => p.status === 'published').length} published
- Brand deals: ${brandDeals.length} total, pipeline value ₹${brandDeals.filter((d) => d.status !== 'completed' && d.status !== 'declined').reduce((s, d) => s + d.value, 0).toLocaleString('en-IN')}
- Monthly income: ₹${incomeEntries.filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')} of ₹${monthlyIncomeTarget.toLocaleString('en-IN')} target

Answer in 2-4 sentences, direct and actionable. No markdown headers.`

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-calls': 'true',
          },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 300,
            system: context,
            messages: [
              ...messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: query },
            ],
          }),
        })
        const data = await res.json()
        const reply = data.content?.[0]?.text ?? ruleBasedResponse(query, smartTasks, ideas, brandDeals, incomeEntries, monthlyIncomeTarget)
        setIsTyping(false)
        setMessages((prev) => {
          const now = Date.now()
          return [
            ...prev,
            { id: now.toString(), role: 'assistant', content: reply, timestamp: now },
          ]
        })
        return
      } catch {
        // fall through to rule-based
      }
    }

    // Rule-based response with simulated delay
    setTimeout(() => {
      const reply = ruleBasedResponse(query, smartTasks, ideas, brandDeals, incomeEntries, monthlyIncomeTarget)
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: reply, timestamp: Date.now() },
      ])
    }, 900 + Math.random() * 600)
  }

  const name = profile?.name ?? 'Creator'

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: '28px 28px 40px',
        minHeight: '100%',
        background: C.bg,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        alignItems: 'flex-start',
      }}
    >
      {/* ── LEFT COLUMN ───────────────────────────────────────────── */}
      <div
        style={{
          width: 360,
          flexShrink: 0,
          position: 'sticky',
          top: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Morning Briefing */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 60%, #4c1d95 100%)',
            padding: '24px 22px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(167,139,250,0.12)', filter: 'blur(25px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Brain size={18} color={C.purple} />
              <span style={{ fontSize: 11, color: C.purple, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Chief of Staff</span>
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: '8px 0 2px', letterSpacing: '-0.02em' }}>
              {getGreeting(name)}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(240,244,255,0.55)', margin: '0 0 16px', fontWeight: 400 }}>
              {formatDate()}
            </p>

            <p
              style={{
                fontSize: 14,
                color: 'rgba(240,244,255,0.85)',
                lineHeight: 1.65,
                margin: '0 0 14px',
                fontWeight: 400,
              }}
            >
              {briefExpanded ? briefing : briefing.split('. ').slice(0, 2).join('. ') + (briefing.split('. ').length > 2 ? '…' : '')}
            </p>

            <button
              onClick={() => setBriefExpanded((e) => !e)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '6px 12px',
                color: C.text,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              {briefExpanded ? 'Collapse Brief' : 'Read Full Brief'}
              <ChevronRight size={13} style={{ transform: briefExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          </div>
        </motion.div>

        {/* Your Move — Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{
            borderRadius: 16,
            background: C.card,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 18px 12px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Zap size={16} color={C.warning} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>Your Move</span>
            {actions.length > 0 && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.warning,
                  background: 'rgba(245,158,11,0.12)',
                  borderRadius: 20,
                  padding: '2px 8px',
                }}
              >
                {actions.length} action{actions.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ padding: '10px 0' }}>
            {actions.length === 0 ? (
              <div style={{ padding: '20px 18px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                <Sparkles size={20} color={C.success} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, color: C.success, fontWeight: 600 }}>All clear — no urgent actions</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>Keep up the momentum!</p>
              </div>
            ) : (
              actions.map((action, idx) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.07 }}
                  style={{
                    padding: '11px 18px',
                    borderBottom: idx < actions.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                    <PriorityDot level={action.priority} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4, wordBreak: 'break-word' }}>
                        {action.title}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                        {action.context}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setView(action.actionView)}
                    style={{
                      marginLeft: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: 'rgba(59,130,246,0.1)',
                      border: `1px solid rgba(59,130,246,0.2)`,
                      borderRadius: 7,
                      padding: '5px 10px',
                      color: C.primary,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.18)'
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(59,130,246,0.1)'
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)'
                    }}
                  >
                    {action.actionLabel}
                    <ChevronRight size={11} />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── RIGHT COLUMN ──────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <Sparkles size={18} color={C.purple} />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
            Intelligence Feed
          </h3>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 2 }}>
            — patterns, signals, and opportunities
          </span>
        </motion.div>

        {/* Insight cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AnimatePresence>
            {visibleInsights.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  borderRadius: 14,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: C.muted,
                }}
              >
                <Brain size={28} color={C.muted} style={{ marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.mutedLight }}>
                  Building intelligence…
                </p>
                <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                  Add more data (ideas, tasks, posts, deals) to unlock insights.
                </p>
              </motion.div>
            )}

            {visibleInsights.map((insight, idx) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  style={{
                    borderRadius: 14,
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    padding: '18px 20px',
                    position: 'relative',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(59,130,246,0.22)'
                    ;(e.currentTarget as HTMLDivElement).style.background = C.cardHover
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = C.border
                    ;(e.currentTarget as HTMLDivElement).style.background = C.card
                  }}
                >
                  {/* Dismiss */}
                  <button
                    onClick={() => setDismissedInsights((d) => [...d, insight.id])}
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'none',
                      border: 'none',
                      color: C.muted,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 6,
                      transition: 'color 0.15s',
                      display: 'flex',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
                    aria-label="Dismiss insight"
                  >
                    <X size={14} />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingRight: 28 }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${insight.badgeColor}18`,
                        border: `1px solid ${insight.badgeColor}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={insight.badgeColor} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badge */}
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          color: insight.badgeColor,
                          background: `${insight.badgeColor}15`,
                          borderRadius: 20,
                          padding: '2px 8px',
                          marginBottom: 8,
                        }}
                      >
                        {insight.badge}
                      </span>

                      <h4
                        style={{
                          margin: '0 0 8px',
                          fontSize: 14,
                          fontWeight: 700,
                          color: C.text,
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {insight.headline}
                      </h4>

                      <p
                        style={{
                          margin: '0 0 10px',
                          fontSize: 13,
                          color: C.mutedLight,
                          lineHeight: 1.6,
                        }}
                      >
                        {insight.explanation}
                      </p>

                      {/* Confidence */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1, 2, 3].map((dot) => (
                            <div
                              key={dot}
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: insight.confidenceCount >= dot * 3
                                  ? insight.badgeColor
                                  : `${insight.badgeColor}30`,
                              }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          {insight.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {dismissedInsights.length > 0 && (
            <button
              onClick={() => setDismissedInsights([])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                alignSelf: 'flex-start',
                background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '6px 12px',
                color: C.muted,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.text
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = C.muted
                e.currentTarget.style.borderColor = C.border
              }}
            >
              <RotateCcw size={12} />
              Restore {dismissedInsights.length} dismissed insight{dismissedInsights.length > 1 ? 's' : ''}
            </button>
          )}
        </div>

        {/* ── AI Chat Interface ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          style={{
            borderRadius: 16,
            background: C.card,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}
        >
          {/* Chat header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #1e3a8a, #4c1d95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={15} color="#a78bfa" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text }}>Ask your Chief of Staff</p>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                {hasResolvedAIKey() ? 'Powered by AI' : 'Smart rule-based advisor'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([])
                  localStorage.removeItem(HISTORY_KEY)
                }}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: '4px 8px',
                  color: C.muted,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
              >
                <RotateCcw size={11} />
                Clear
              </button>
            )}
          </div>

          {/* Quick prompts */}
          <div
            style={{
              padding: '12px 18px 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 7,
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                style={{
                  background: 'rgba(59,130,246,0.07)',
                  border: `1px solid rgba(59,130,246,0.15)`,
                  borderRadius: 20,
                  padding: '5px 11px',
                  color: C.mutedLight,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.14)'
                  e.currentTarget.style.color = C.text
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59,130,246,0.07)'
                  e.currentTarget.style.color = C.mutedLight
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div
            style={{
              padding: '14px 18px',
              maxHeight: 340,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              scrollbarWidth: 'thin',
              scrollbarColor: `${C.border} transparent`,
            }}
          >
            {messages.length === 0 && !isTyping && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Lightbulb size={24} color={C.muted} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
                  Ask anything about your creator business
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      padding: '10px 14px',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, #1d4ed8, #4c1d95)'
                        : '#131328',
                      border: msg.role === 'user'
                        ? '1px solid rgba(59,130,246,0.3)'
                        : `1px solid ${C.border}`,
                      fontSize: 13,
                      color: C.text,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', justifyContent: 'flex-start' }}
                >
                  <div
                    style={{
                      borderRadius: '14px 14px 14px 4px',
                      padding: '12px 16px',
                      background: '#131328',
                      border: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.22 }}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: C.purple,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 16px 16px',
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={PLACEHOLDER_CYCLE[placeholderIdx]}
              style={{
                flex: 1,
                background: '#0a0a18',
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: C.text,
                fontSize: 13,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.4)')}
              onBlur={(e) => (e.target.style.borderColor = C.border)}
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={isTyping || !inputVal.trim()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: inputVal.trim() && !isTyping
                  ? 'linear-gradient(135deg, #1d4ed8, #4c1d95)'
                  : '#131328',
                border: `1px solid ${inputVal.trim() && !isTyping ? 'rgba(59,130,246,0.4)' : C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputVal.trim() && !isTyping ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (inputVal.trim() && !isTyping) {
                  e.currentTarget.style.transform = 'scale(1.06)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <Send size={15} color={inputVal.trim() && !isTyping ? C.text : C.muted} />
            </button>
          </div>
        </motion.div>

        {/* Attribution */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
          <Clock size={12} color={C.muted} />
          <span style={{ fontSize: 11, color: C.muted, fontFamily: '"Space Mono", monospace' }}>
            Last updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

      </div>
    </div>
  )
}
