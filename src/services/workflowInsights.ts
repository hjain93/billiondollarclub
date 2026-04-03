import type { CalendarPost, ContentIdea, IncomeEntry, IntegrationSyncStatus, WorkflowRun, WorkflowStepRun } from '../types'

type ActionPriority = 'high' | 'medium' | 'low'

export interface OptimizationAction {
  id: string
  title: string
  detail: string
  view: string
  priority: ActionPriority
}

export interface WorkflowImpactRow {
  runId: string
  workflowName: string
  startedAt: string
  completedAt?: string
  status: WorkflowRun['status']
  influencedIdeas: number
  influencedPosts: number
  influencedViews: number
  influencedIncome: number
  impactScore: number
}

export interface WorkflowIntelligence {
  successRate: number
  avgDurationMinutes: number
  totalRetries: number
  topFailureStep?: string
  attributedIdeas30d: number
  attributedPosts30d: number
  attributedViews30d: number
  attributedIncome30d: number
  impactRows: WorkflowImpactRow[]
  actions: OptimizationAction[]
}

const ONE_DAY_MS = 86400000

function toEpoch(value?: string) {
  if (!value) return NaN
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : NaN
}

function postTimestamp(post: CalendarPost) {
  if (!post.scheduledAt) return NaN
  // scheduledAt is often YYYY-MM-DD in this app; force start-of-day parsing for consistency.
  const hasTime = post.scheduledAt.includes('T')
  return new Date(hasTime ? post.scheduledAt : `${post.scheduledAt}T00:00:00`).getTime()
}

function incomeTimestamp(entry: IncomeEntry) {
  if (!entry.date) return NaN
  const hasTime = entry.date.includes('T')
  return new Date(hasTime ? entry.date : `${entry.date}T00:00:00`).getTime()
}

function runDurationMinutes(run: WorkflowRun) {
  const start = toEpoch(run.startedAt)
  const end = toEpoch(run.completedAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
  return (end - start) / 60000
}

function sumStepRetries(steps: WorkflowStepRun[]) {
  return steps.reduce((sum, step) => sum + (step.retryCount || 0), 0)
}

function computeFailureStep(runs: WorkflowRun[]) {
  const failures = new Map<string, number>()
  runs.forEach((run) => {
    run.steps.forEach((step) => {
      if (step.status === 'failed') {
        failures.set(step.title, (failures.get(step.title) || 0) + 1)
      }
    })
  })
  let best = ''
  let max = 0
  failures.forEach((count, name) => {
    if (count > max) {
      max = count
      best = name
    }
  })
  return best || undefined
}

function computeImpactRows(
  runs: WorkflowRun[],
  calendarPosts: CalendarPost[],
  ideas: ContentIdea[],
  incomeEntries: IncomeEntry[],
  nowMs: number,
  impactWindowDays = 7
) {
  const impactWindowMs = impactWindowDays * ONE_DAY_MS

  const rows: WorkflowImpactRow[] = runs
    .filter((r) => r.status !== 'queued')
    .map((run) => {
      const runStart = toEpoch(run.completedAt || run.startedAt)
      const runEnd = runStart + impactWindowMs
      const hasWindow = Number.isFinite(runStart)

      const influencedIdeas = hasWindow
        ? ideas.filter((idea) => {
            const t = toEpoch(idea.createdAt)
            return Number.isFinite(t) && t >= runStart && t <= runEnd
          }).length
        : 0

      const influencedPostsList = hasWindow
        ? calendarPosts.filter((post) => {
            const t = postTimestamp(post)
            return Number.isFinite(t) && t >= runStart && t <= runEnd
          })
        : []

      const influencedViews = influencedPostsList.reduce((sum, post) => sum + (post.performanceData?.views || 0), 0)
      const influencedIncome = hasWindow
        ? incomeEntries
            .filter((entry) => {
              const t = incomeTimestamp(entry)
              return Number.isFinite(t) && t >= runStart && t <= runEnd
            })
            .reduce((sum, entry) => sum + entry.amount, 0)
        : 0

      const baseScore = influencedPostsList.length * 12 + influencedIdeas * 8 + influencedViews / 1000 + influencedIncome / 2000
      const statusMultiplier = run.status === 'completed' ? 1 : run.status === 'running' ? 0.4 : 0.2
      const impactScore = Math.max(0, Math.round(baseScore * statusMultiplier))

      return {
        runId: run.id,
        workflowName: run.workflowName,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        status: run.status,
        influencedIdeas,
        influencedPosts: influencedPostsList.length,
        influencedViews,
        influencedIncome,
        impactScore,
      }
    })
    .sort((a, b) => b.impactScore - a.impactScore)

  const thirtyDaysAgo = nowMs - 30 * ONE_DAY_MS
  const rows30d = rows.filter((row) => {
    const t = toEpoch(row.completedAt || row.startedAt)
    return Number.isFinite(t) && t >= thirtyDaysAgo
  })

  return {
    rows,
    attributedIdeas30d: rows30d.reduce((sum, row) => sum + row.influencedIdeas, 0),
    attributedPosts30d: rows30d.reduce((sum, row) => sum + row.influencedPosts, 0),
    attributedViews30d: rows30d.reduce((sum, row) => sum + row.influencedViews, 0),
    attributedIncome30d: rows30d.reduce((sum, row) => sum + row.influencedIncome, 0),
  }
}

function createActions(
  data: {
    successRate: number
    postsWithoutPerf: number
    backlogIdeas: number
    pipelineIdeas: number
    topFailureStep?: string
    attributedPosts30d: number
    runCount30d: number
  },
  integrationSyncStatus?: IntegrationSyncStatus
) {
  const actions: OptimizationAction[] = []

  if (data.successRate < 70) {
    actions.push({
      id: 'stabilize-workflows',
      title: 'Stabilize workflow reliability',
      detail: data.topFailureStep
        ? `Most failures are happening in "${data.topFailureStep}". Review step prompt/config and re-run with diagnostics.`
        : 'Workflow completion rate is low. Inspect recent run errors and adjust prompts/config.',
      view: 'ops-hq',
      priority: 'high',
    })
  }

  if (data.postsWithoutPerf >= 3) {
    actions.push({
      id: 'close-analytics-loop',
      title: 'Close analytics loop',
      detail: `${data.postsWithoutPerf} published/scheduled posts still lack performance logs. Attribution quality is being reduced.`,
      view: 'analytics',
      priority: 'high',
    })
  }

  if (data.backlogIdeas > data.pipelineIdeas + 4) {
    actions.push({
      id: 'convert-backlog',
      title: 'Convert idea backlog into schedule',
      detail: `${data.backlogIdeas} ideas are sitting in inbox. Convert top-scored ideas into calendar slots this week.`,
      view: 'calendar',
      priority: 'medium',
    })
  }

  if (data.runCount30d > 0 && data.attributedPosts30d === 0) {
    actions.push({
      id: 'wire-workflows-to-output',
      title: 'Improve workflow-to-post conversion',
      detail: 'Runs are happening but no attributable posts were scheduled afterward. Tighten workflow CTA and weekly cadence.',
      view: 'idea-engine',
      priority: 'medium',
    })
  }

  if (integrationSyncStatus?.ai.status === 'error') {
    actions.push({
      id: 'fix-ai-integration',
      title: 'Fix AI integration health',
      detail: 'AI integration is reporting errors. Validate active provider key in Integrations and run a health check.',
      view: 'ops-hq',
      priority: 'high',
    })
  }

  if (actions.length === 0) {
    actions.push({
      id: 'maintain-cadence',
      title: 'Maintain weekly optimization cadence',
      detail: 'System health looks stable. Keep auto-run enabled and review attribution once every 7 days.',
      view: 'ops-hq',
      priority: 'low',
    })
  }

  const priorityRank: Record<ActionPriority, number> = { high: 0, medium: 1, low: 2 }
  return actions.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
}

export function computeWorkflowIntelligence(
  runs: WorkflowRun[],
  calendarPosts: CalendarPost[],
  ideas: ContentIdea[],
  incomeEntries: IncomeEntry[],
  integrationSyncStatus?: IntegrationSyncStatus,
  now = new Date()
): WorkflowIntelligence {
  const nowMs = now.getTime()
  const finishedRuns = runs.filter((run) => run.status === 'completed' || run.status === 'failed' || run.status === 'cancelled')
  const successfulRuns = finishedRuns.filter((run) => run.status === 'completed')

  const successRate = finishedRuns.length > 0 ? Math.round((successfulRuns.length / finishedRuns.length) * 100) : 100
  const avgDurationMinutes = successfulRuns.length > 0
    ? Number((successfulRuns.reduce((sum, run) => sum + runDurationMinutes(run), 0) / successfulRuns.length).toFixed(1))
    : 0
  const totalRetries = runs.reduce((sum, run) => sum + sumStepRetries(run.steps), 0)
  const topFailureStep = computeFailureStep(runs)

  const impactSummary = computeImpactRows(runs, calendarPosts, ideas, incomeEntries, nowMs)
  const thirtyDaysAgo = nowMs - 30 * ONE_DAY_MS
  const runCount30d = runs.filter((run) => {
    const t = toEpoch(run.startedAt)
    return Number.isFinite(t) && t >= thirtyDaysAgo
  }).length

  const postsWithoutPerf = calendarPosts.filter((post) => post.status === 'published' && !post.performanceData).length
  const backlogIdeas = ideas.filter((idea) => idea.status === 'inbox').length
  const pipelineIdeas = ideas.filter((idea) => idea.status === 'planned' || idea.status === 'creating' || idea.status === 'done').length

  const actions = createActions(
    {
      successRate,
      postsWithoutPerf,
      backlogIdeas,
      pipelineIdeas,
      topFailureStep,
      attributedPosts30d: impactSummary.attributedPosts30d,
      runCount30d,
    },
    integrationSyncStatus
  )

  return {
    successRate,
    avgDurationMinutes,
    totalRetries,
    topFailureStep,
    attributedIdeas30d: impactSummary.attributedIdeas30d,
    attributedPosts30d: impactSummary.attributedPosts30d,
    attributedViews30d: impactSummary.attributedViews30d,
    attributedIncome30d: impactSummary.attributedIncome30d,
    impactRows: impactSummary.rows,
    actions,
  }
}
