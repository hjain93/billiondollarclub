import { describe, expect, it } from 'vitest'
import { computeWorkflowIntelligence } from './workflowInsights'
import type { CalendarPost, ContentIdea, IncomeEntry, WorkflowRun } from '../types'

function iso(daysAgo: number) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

describe('workflow insights', () => {
  it('computes attribution and actions from workflow outcomes', () => {
    const runs: WorkflowRun[] = [
      {
        id: 'r1',
        workflowId: 'w1',
        workflowName: 'Weekly Growth Loop',
        status: 'completed',
        startedAt: iso(6),
        completedAt: iso(6),
        steps: [
          { id: 's1', title: 'Context', type: 'gather_context', status: 'completed', retryCount: 0 },
          { id: 's2', title: 'Trends', type: 'trend_analysis', status: 'completed', retryCount: 1 },
        ],
      },
      {
        id: 'r2',
        workflowId: 'w1',
        workflowName: 'Weekly Growth Loop',
        status: 'failed',
        startedAt: iso(2),
        completedAt: iso(2),
        steps: [
          { id: 's1', title: 'Context', type: 'gather_context', status: 'completed', retryCount: 0 },
          { id: 's2', title: 'Trends', type: 'trend_analysis', status: 'failed', retryCount: 1 },
        ],
      },
    ]

    const ideas: ContentIdea[] = [
      {
        id: 'i1',
        title: 'Idea',
        hook: 'Hook',
        contentType: 'video',
        platforms: ['youtube'],
        aiScore: 85,
        scoreBreakdown: {
          hookStrength: 80,
          nicheRelevance: 85,
          trendAlignment: 86,
          engagementPotential: 82,
          channelFit: 88,
          uniqueness: 84,
        },
        status: 'planned',
        source: 'ai_generated',
        tags: [],
        createdAt: iso(5),
      },
    ]

    const posts: CalendarPost[] = [
      {
        id: 'p1',
        title: 'Post',
        platform: 'youtube',
        contentType: 'video',
        status: 'published',
        scheduledAt: iso(4).split('T')[0],
        performanceData: { views: 12000, likes: 700, comments: 80, saves: 40, shares: 20, engagementRate: 6.8 },
      },
    ]

    const income: IncomeEntry[] = [
      {
        id: 'inc1',
        source: 'brand_deal',
        platform: 'all',
        amount: 25000,
        label: 'Campaign',
        date: iso(3).split('T')[0],
      },
    ]

    const result = computeWorkflowIntelligence(runs, posts, ideas, income, {
      youtube: { status: 'success' },
      instagram: { status: 'success' },
      web: { status: 'idle' },
      ai: { status: 'error' },
    })

    expect(result.successRate).toBe(50)
    expect(result.totalRetries).toBe(2)
    expect(result.topFailureStep).toBe('Trends')
    expect(result.attributedPosts30d).toBeGreaterThan(0)
    expect(result.attributedViews30d).toBeGreaterThan(0)
    expect(result.actions.some((a) => a.id === 'fix-ai-integration')).toBe(true)
  })
})
