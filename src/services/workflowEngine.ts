import { APIProxy } from './APIProxy'
import { useStore } from '../store'
import { extractJSONArray } from '../utils/aiParsing'
import type { WorkflowDefinition, WorkflowRun, WorkflowStepRun } from '../types'

const DEFAULT_WORKFLOW_ID = 'weekly-growth-loop'
const cancelledRuns = new Set<string>()

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function isoDayOffset(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

class WorkflowCancelledError extends Error {
  constructor(message = 'Workflow cancelled') {
    super(message)
    this.name = 'WorkflowCancelledError'
  }
}

function ensureNotCancelled(runId: string) {
  if (cancelledRuns.has(runId)) {
    throw new WorkflowCancelledError()
  }
}

async function runStepWithRetry(
  runId: string,
  stepId: string,
  maxAttempts: number,
  runner: () => Promise<string>
) {
  const state = useStore.getState()
  let lastError = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    ensureNotCancelled(runId)
    state.updateWorkflowRunStep(runId, stepId, {
      status: 'running',
      startedAt: attempt === 1 ? new Date().toISOString() : undefined,
      attemptCount: attempt,
      retryCount: attempt - 1,
      error: undefined,
    })

    try {
      const output = await runner()
      ensureNotCancelled(runId)
      state.updateWorkflowRunStep(runId, stepId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        output,
        attemptCount: attempt,
        retryCount: attempt - 1,
      })
      return output
    } catch (e: any) {
      if (e instanceof WorkflowCancelledError) throw e
      lastError = e?.message || 'Step failed'
      if (attempt >= maxAttempts) {
        state.updateWorkflowRunStep(runId, stepId, {
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: lastError,
          attemptCount: attempt,
          retryCount: attempt - 1,
        })
        throw e
      }
      state.updateWorkflowRunStep(runId, stepId, {
        status: 'running',
        error: `Attempt ${attempt} failed, retrying...`,
        attemptCount: attempt,
        retryCount: attempt - 1,
      })
    }
  }

  throw new Error(lastError || 'Step failed')
}

export function ensureWorkflowDefaults() {
  const state = useStore.getState()
  if (state.workflows.some((w) => w.id === DEFAULT_WORKFLOW_ID)) return

  const workflow: WorkflowDefinition = {
    id: DEFAULT_WORKFLOW_ID,
    name: 'Weekly Growth Loop',
    description: 'Analyzes creator context, detects opportunities, generates ideas, and creates a 7-day plan.',
    trigger: 'manual',
    createdAt: new Date().toISOString(),
    steps: [
      { id: 'context', title: 'Gather Context', type: 'gather_context' },
      { id: 'trends', title: 'Analyze Trends', type: 'trend_analysis' },
      { id: 'ideas', title: 'Generate Ideas', type: 'idea_generation' },
      { id: 'calendar', title: 'Build 7-Day Plan', type: 'calendar_plan' },
    ],
  }
  state.addWorkflow(workflow)
}

function baseRunFromWorkflow(workflow: WorkflowDefinition, objective?: string): WorkflowRun {
  const steps: WorkflowStepRun[] = workflow.steps.map((s) => ({
    id: s.id,
    title: s.title,
    type: s.type,
    status: 'pending',
  }))
  return {
    id: makeId('run'),
    workflowId: workflow.id,
    workflowName: workflow.name,
    objective,
    status: 'queued',
    startedAt: new Date().toISOString(),
    steps,
    artifacts: {},
  }
}

export async function runWorkflow(workflowId: string, objective?: string) {
  const state = useStore.getState()
  const workflow = state.workflows.find((w) => w.id === workflowId)
  if (!workflow) throw new Error('Workflow not found')

  const run = baseRunFromWorkflow(workflow, objective)
  state.addWorkflowRun(run)
  state.updateWorkflowRun(run.id, { status: 'running' })
  cancelledRuns.delete(run.id)

  const profile = useStore.getState().profile
  const niche = profile?.niche || 'general creator niche'
  const primaryPlatform = profile?.handles?.[0]?.platform || 'instagram'

  try {
    const contextStepId = 'context'
    const contextSummary = await runStepWithRetry(run.id, contextStepId, 1, async () => {
      return [
        `Creator: ${profile?.name || 'Unknown creator'}`,
        `Niche: ${niche}`,
        `Ideas in inbox: ${useStore.getState().ideas.filter((i) => i.status === 'inbox').length}`,
        `Scheduled posts: ${useStore.getState().calendarPosts.filter((p) => p.status === 'scheduled').length}`,
        `Open goals: ${(profile?.goals || []).filter((g) => g.status === 'active').length}`,
      ].join('\n')
    })

    state.addMemory({
      id: makeId('mem'),
      kind: 'fact',
      title: 'Workflow Context Snapshot',
      content: contextSummary,
      tags: ['workflow', 'context'],
      source: 'workflow-engine',
      confidence: 0.95,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const trendStepId = 'trends'
    const trendText = await runStepWithRetry(run.id, trendStepId, 2, async () => {
      const trendPrompt = `Give a concise weekly trend summary for an Indian ${niche} creator. Output 5 bullets with specific angles.`
      const trendResponse = await APIProxy.secureRequest('ai', 'workflow-trends', { prompt: trendPrompt })
      state.setIntegrationSyncStatus('ai', {
        status: trendResponse.status === 'success' ? 'success' : 'error',
        lastSyncAt: new Date().toISOString(),
        message: trendResponse.status === 'success' ? 'AI workflow trend analysis complete' : trendResponse.error || 'AI analysis failed',
      })
      if (trendResponse.status !== 'success') {
        throw new Error(trendResponse.error || 'Trend analysis failed')
      }
      return trendResponse.response || 'No trend signal available.'
    })

    state.updateWorkflowRun(run.id, {
      artifacts: { ...useStore.getState().workflowRuns.find((r) => r.id === run.id)?.artifacts, trendSummary: trendText },
    })

    state.addMemory({
      id: makeId('mem'),
      kind: 'insight',
      title: 'Weekly Trend Insights',
      content: trendText.slice(0, 1400),
      tags: ['workflow', 'trend', 'insight'],
      source: 'workflow-engine',
      confidence: 0.78,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const ideaStepId = 'ideas'
    const ideasText = await runStepWithRetry(run.id, ideaStepId, 2, async () => {
      const ideaPrompt = `Generate 5 creator content ideas for ${niche}. Return JSON array of strings only.`
      const ideaResponse = await APIProxy.secureRequest('ai', 'workflow-ideas', { prompt: ideaPrompt })
      state.setIntegrationSyncStatus('ai', {
        status: ideaResponse.status === 'success' ? 'success' : 'error',
        lastSyncAt: new Date().toISOString(),
        message: ideaResponse.status === 'success' ? 'AI workflow idea generation complete' : ideaResponse.error || 'AI idea generation failed',
      })
      if (ideaResponse.status !== 'success') {
        throw new Error(ideaResponse.error || 'Idea generation failed')
      }
      return ideaResponse.response || '[]'
    })

    const parsedIdeas = extractJSONArray(ideasText)
    const ideas = (parsedIdeas || []).map((v: any) => (typeof v === 'string' ? v : v?.title || String(v))).filter(Boolean).slice(0, 5)
    const fallbackIdeas = ideas.length > 0 ? ideas : [
      `3 mistakes ${niche} creators repeat every week`,
      `One framework to batch content in 90 minutes`,
      `Case study: from low reach to consistent saves`,
    ]

    state.updateWorkflowRunStep(run.id, ideaStepId, { output: fallbackIdeas.join('\n') })
    state.updateWorkflowRun(run.id, {
      artifacts: { ...useStore.getState().workflowRuns.find((r) => r.id === run.id)?.artifacts, generatedIdeas: fallbackIdeas },
    })

    const calendarStepId = 'calendar'
    const weeklyPlan = await runStepWithRetry(run.id, calendarStepId, 1, async () => {
      return fallbackIdeas
        .slice(0, 3)
        .map((idea, index) => `Day ${index + 1}: ${idea}`)
        .concat(['Day 4: Repurpose best performer', 'Day 5: Community Q&A post', 'Day 6: Behind-the-scenes story', 'Day 7: Weekly recap and CTA'])
        .join('\n')
    })

    // Convert workflow output into executable operations (not just text artifacts).
    const existingPosts = useStore.getState().calendarPosts
    const createdPostIds: string[] = []
    const createdTaskIds: string[] = []
    fallbackIdeas.slice(0, 3).forEach((idea, index) => {
      const date = isoDayOffset(index + 1)
      const hasPost = existingPosts.some((p) => p.title === idea && p.scheduledAt === date)
      if (!hasPost) {
        const postId = makeId('post')
        state.addCalendarPost({
          id: postId,
          title: idea,
          platform: primaryPlatform,
          contentType: 'post',
          status: 'scheduled',
          scheduledAt: date,
          notes: `Auto-created by workflow run ${run.id}`,
        })
        createdPostIds.push(postId)
      }

      const taskId = makeId('task')
      state.addSmartTask({
        id: taskId,
        title: `Produce: ${idea}`,
        notes: `Generated from workflow ${run.workflowName}.`,
        priority: index === 0 ? 'high' : 'medium',
        status: 'todo',
        tags: ['workflow', 'content-production'],
        plannedDate: date,
        createdAt: new Date().toISOString(),
      })
      createdTaskIds.push(taskId)
    })

    state.addMemory({
      id: makeId('mem'),
      kind: 'artifact',
      title: '7-Day Workflow Plan',
      content: weeklyPlan,
      tags: ['workflow', 'plan', 'calendar'],
      source: 'workflow-engine',
      confidence: 0.81,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const summary = `Workflow completed with ${fallbackIdeas.length} ideas and a 7-day action plan.`
    state.updateWorkflowRun(run.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      summary: `${summary} Auto-created ${createdPostIds.length} posts and ${createdTaskIds.length} tasks.`,
      artifacts: {
        ...useStore.getState().workflowRuns.find((r) => r.id === run.id)?.artifacts,
        generatedIdeas: fallbackIdeas,
        calendarPlan: weeklyPlan,
        createdPostIds,
        createdTaskIds,
      },
    })

    cancelledRuns.delete(run.id)
    return run.id
  } catch (e: any) {
    if (e instanceof WorkflowCancelledError || cancelledRuns.has(run.id)) {
      state.cancelWorkflowRun(run.id, 'Workflow cancelled by user.')
      cancelledRuns.delete(run.id)
      throw new WorkflowCancelledError('Workflow cancelled by user.')
    }

    const message = e?.message || 'Workflow failed'
    state.updateWorkflowRun(run.id, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: message,
      summary: message,
    })
    cancelledRuns.delete(run.id)
    throw e
  }
}

export function getDefaultWorkflowId() {
  return DEFAULT_WORKFLOW_ID
}

export function shouldAutoRunWorkflow(now = new Date()) {
  const s = useStore.getState()
  if (!s.workflowAutoRunEnabled) return false
  if (s.workflowRuns.some((r) => r.status === 'running')) return false
  if (!s.lastWorkflowAutoRunAt) return true
  const last = new Date(s.lastWorkflowAutoRunAt).getTime()
  const diffHours = (now.getTime() - last) / (1000 * 60 * 60)
  return diffHours >= s.workflowAutoRunIntervalHours
}

export async function runAutoWorkflowIfDue() {
  if (!shouldAutoRunWorkflow()) return null
  const runId = await runWorkflow(getDefaultWorkflowId(), 'Auto-run: continuous weekly optimization loop')
  useStore.getState().setLastWorkflowAutoRunAt(new Date().toISOString())
  return runId
}

export function cancelWorkflowRunExecution(runId: string) {
  cancelledRuns.add(runId)
  useStore.getState().cancelWorkflowRun(runId, 'Workflow cancelled by user.')
}
