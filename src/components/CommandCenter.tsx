import { useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import type { ContentIdea, CalendarPost, CreatorProfile } from '../types'
import { Target, TrendingUp, Flame, Calendar, Lightbulb, ArrowRight, Wand2, Brain, RefreshCw, Radio, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { APIProxy } from '../services/APIProxy'
import toast from 'react-hot-toast'
import { ensureWorkflowDefaults, getDefaultWorkflowId, runWorkflow } from '../services/workflowEngine'

function useOracleRecommendation(
  ideas: ContentIdea[],
  profile: CreatorProfile | null,
  calendarPosts: CalendarPost[],
  rotation: number
): { message: string; action: string; view: string } {
  const today = new Date().toISOString().split('T')[0]
  const todayPosts = calendarPosts.filter((p) => p.scheduledAt === today)
  const inboxIdeas = ideas.filter((i) => i.status === 'inbox')
  const topIdea = [...inboxIdeas].sort((a, b) => b.aiScore - a.aiScore)[0]
  const primaryGoal = profile?.goals?.[0]

  const recommendations = []

  if (ideas.length === 0) {
    recommendations.push({
      message: 'Generate your first 10 ideas to get started. Your content pipeline is empty.',
      action: 'Go to Idea Engine',
      view: 'idea-engine',
    })
  } else if (inboxIdeas.length > 0 && todayPosts.length === 0) {
    recommendations.push({
      message: topIdea
        ? `Nothing scheduled today. Your top idea "${topIdea.title.slice(0, 50)}..." has a ${topIdea.aiScore} score — perfect for today.`
        : `${inboxIdeas.length} ideas waiting. Schedule something for today!`,
      action: 'View Inbox',
      view: 'idea-engine',
    })
  }

  if (primaryGoal && primaryGoal.currentValue < primaryGoal.targetValue * 0.5) {
    recommendations.push({
      message: `Your goal "${primaryGoal.label}" is at ${Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100)}% — below halfway. Focus on ${primaryGoal.platform} content today.`,
      action: 'View Calendar',
      view: 'calendar',
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      message: `You're on track! Focus on ${profile?.niche || 'niche'} content today. ${todayPosts.length > 0 ? `${todayPosts.length} post${todayPosts.length > 1 ? 's' : ''} scheduled.` : 'Consider scheduling content for the week ahead.'}`,
      action: 'View Calendar',
      view: 'calendar',
    })
    recommendations.push({
      message: `Ideas pipeline looking healthy with ${ideas.length} ideas. Time to create — head to the Studio.`,
      action: 'Open Studio',
      view: 'studio',
    })
    if (profile?.niche) {
      recommendations.push({
        message: `Trending topics in ${profile.niche} are moving fast. Check Trend Radar to ride the wave.`,
        action: 'Open Trend Radar',
        view: 'trends',
      })
    }
  }

  return recommendations[rotation % recommendations.length]
}

export function CommandCenter() {
  const { profile, ideas, calendarPosts, setView, youtubeToken, instagramToken, aiKey, trendData, workflows, workflowRuns, memories, setIntegrationSyncStatus, smartTasks } = useStore()
  const [oracleRotation, setOracleRotation] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRunningWorkflow, setIsRunningWorkflow] = useState(false)
  const [platformStats, setPlatformStats] = useState<any>({
    youtube: { data: null, source: 'none' },
    instagram: { data: null, source: 'none' }
  })

  useEffect(() => {
    ensureWorkflowDefaults()
    syncActivePlatforms()
  }, [])

  async function runWeeklyWorkflow() {
    try {
      setIsRunningWorkflow(true)
      const objective = `Increase content output and engagement for ${profile?.niche || 'creator niche'} this week`
      await runWorkflow(getDefaultWorkflowId(), objective)
      toast.success('Workflow completed and memory updated', { icon: '🧠' })
    } catch (e: any) {
      toast.error(e?.message || 'Workflow run failed')
    } finally {
      setIsRunningWorkflow(false)
    }
  }

  async function syncActivePlatforms() {
    setIsSyncing(true)
    const tokens = { youtube: youtubeToken, instagram: instagramToken, ai: aiKey }
    
    // Multi-platform sync
    const results = await Promise.all([
      APIProxy.secureRequest('youtube', 'stats', { channelId: profile?.youtubeChannelId, tokens }),
      APIProxy.secureRequest('instagram', 'stats', { businessId: profile?.instagramBusinessAccountId, tokens })
    ])

    setPlatformStats({
      youtube: { data: results[0].data, source: results[0].source },
      instagram: { data: results[1].data, source: results[1].source }
    })
    setIntegrationSyncStatus('youtube', {
      status: results[0].source === 'live' ? 'success' : 'error',
      lastSyncAt: new Date().toISOString(),
      message: results[0].source === 'live' ? 'Live data synced' : (results[0].error || 'No live data'),
    })
    setIntegrationSyncStatus('instagram', {
      status: results[1].source === 'live' ? 'success' : 'error',
      lastSyncAt: new Date().toISOString(),
      message: results[1].source === 'live' ? 'Live data synced' : (results[1].error || 'No live data'),
    })
    setIsSyncing(false)
    if (results.some(r => r.source === 'live')) {
       toast.success('Live engine connected', { icon: '📡' })
    }
  }


  const inboxCount = ideas.filter((i) => i.status === 'inbox').length
  const doneCount = ideas.filter((i) => i.status === 'done').length
  const avgScore =
    ideas.length > 0
      ? (ideas.reduce((s, i) => s + i.aiScore, 0) / ideas.length).toFixed(1)
      : '—'

  const primaryGoal = profile?.goals?.[0]

  const scheduledToday = calendarPosts.filter(
    (p) => p.scheduledAt === new Date().toISOString().split('T')[0]
  ).length

  const oracle = useOracleRecommendation(ideas, profile, calendarPosts, oracleRotation)

  const activeTrends = trendData || []
  const latestRun = workflowRuns[0]
  const weeklyWorkflow = workflows.find((w) => w.id === getDefaultWorkflowId())

  const todayStr = new Date().toISOString().split('T')[0]
  const overdueTasks = (smartTasks || []).filter((t: any) => t.status !== 'done' && t.dueDate && t.dueDate < todayStr)
  const focusMetric = {
    label: primaryGoal ? primaryGoal.label : 'Content Published',
    value: primaryGoal ? `${Math.round((primaryGoal.currentValue / primaryGoal.targetValue) * 100)}%` : doneCount,
    sub: primaryGoal ? 'of target' : 'total items'
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Good morning,{' '}
            <span className="grad-pink">{profile?.name?.split(' ')[0] || 'Creator'}</span>
          </h1>
          <p style={{ color: '#4b5680', fontSize: 13, marginTop: 5, fontWeight: 500 }}>
            Your content engine is ready. Let's build something great today.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={syncActivePlatforms}
          className="btn btn-ghost" 
          style={{ gap: 8, height: 42, background: isSyncing ? 'rgba(59,130,246,0.1)' : 'transparent' }}
        >
          {isSyncing ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Radio size={14} color={platformStats.youtube.source === 'live' || platformStats.instagram.source === 'live' ? '#10b981' : '#4b5680'} />
          )}
          <span style={{ fontSize: 12, fontWeight: 700 }}>{isSyncing ? 'Syncing...' : 'Sync Platforms'}</span>
        </motion.button>
      </motion.div>

      {/* DailyBrief F-06 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex', gap: 16, marginBottom: 26, background: 'rgba(10,10,20,0.5)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 18,
        }}
      >
        <div style={{ flex: 1, borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: overdueTasks.length > 0 ? '#ef4444' : '#10b981' }}>
            <AlertTriangle size={14} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {overdueTasks.length > 0 ? 'Action Required' : 'All Caught Up'}
            </span>
          </div>
          <div style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 600 }}>
            {overdueTasks.length > 0 ? `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''} require your attention.` : 'No overdue tasks today. Keep up the good work!'}
          </div>
          {overdueTasks.length > 0 && (
            <button onClick={() => setView('tasks')} className="btn btn-ghost btn-xs" style={{ marginTop: 8, padding: 0 }}>
              Review tasks <ArrowRight size={11} />
            </button>
          )}
        </div>
        <div style={{ flex: 1, paddingLeft: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: '#3b82f6' }}>
            <Target size={14} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus Metric</span>
          </div>
          <div style={{ fontSize: 18, color: '#f0f4ff', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>
            {focusMetric.value}
          </div>
          <div style={{ fontSize: 12, color: '#6b7a9a' }}>
            {focusMetric.label} ({focusMetric.sub})
          </div>
        </div>
      </motion.div>

      {/* Mission Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(236,72,153,0.07))',
          border: '1px solid rgba(59,130,246,0.22)',
          borderRadius: 20,
          padding: '26px 28px',
          marginBottom: 22,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', right: -60, top: -60,
            width: 240, height: 240,
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <Flame size={15} color="#f97316" />
          <span style={{ fontSize: 10.5, fontWeight: 800, color: '#f97316', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Today's Mission
          </span>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.3, maxWidth: 560 }}>
          {ideas.length === 0
            ? 'Generate your first ideas and build your content pipeline'
            : doneCount === 0
            ? `${inboxCount} idea${inboxCount !== 1 ? 's' : ''} in your inbox — start creating content today`
            : `${doneCount} posts published — keep the momentum going`}
        </h2>
        <p style={{ color: '#4b5680', fontSize: 13, marginBottom: 20, fontWeight: 500 }}>
          {profile?.niche ? `Focused on ${profile.niche} content` : 'Complete your profile for personalised missions'}
          {scheduledToday > 0 ? ` · ${scheduledToday} post${scheduledToday > 1 ? 's' : ''} scheduled today` : ''}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-blue"
            style={{ padding: '9px 18px', fontSize: 13 }}
            onClick={() => setView('idea-engine')}
          >
            <Lightbulb size={14} /> Idea Engine <ArrowRight size={13} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-ghost"
            style={{ padding: '9px 18px', fontSize: 13 }}
            onClick={() => setView('calendar')}
          >
            <Calendar size={14} /> View Calendar
          </motion.button>
        </div>
      </motion.div>

      {/* AI Oracle card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.07), rgba(236,72,153,0.05))',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 16,
          padding: '18px 22px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(236,72,153,0.1))',
          border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={18} color="#fbbf24" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              AI Oracle
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: '#e2e8f0', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
            {oracle.message}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setOracleRotation((r) => r + 1)}
            title="Refresh recommendation"
            style={{
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 8, cursor: 'pointer',
              color: '#fbbf24', padding: '7px 8px', display: 'flex', alignItems: 'center',
              transition: 'all 140ms',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.18)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(251,191,36,0.1)')}
          >
            <RefreshCw size={13} />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setView(oracle.view)}
            style={{ whiteSpace: 'nowrap', borderColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}
          >
            {oracle.action} <ArrowRight size={12} />
          </button>
        </div>
      </motion.div>

      {/* Workflow engine */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 16,
          padding: '18px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Workflow Engine</div>
            <h3 style={{ fontSize: 16, color: '#f0f4ff', fontWeight: 800, marginTop: 6 }}>
              {weeklyWorkflow?.name || 'Weekly Growth Loop'}
            </h3>
            <p style={{ marginTop: 4, fontSize: 12, color: '#6b7a9a' }}>
              {weeklyWorkflow?.description || 'Analyze context, generate ideas, and produce a weekly action plan.'}
            </p>
          </div>
          <button className="btn btn-blue btn-sm" onClick={runWeeklyWorkflow} disabled={isRunningWorkflow}>
            {isRunningWorkflow ? 'Running...' : 'Run Workflow'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: '#4b5680' }}>
            Latest run: <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{latestRun?.status || 'none'}</span>
          </div>
          <div style={{ fontSize: 12, color: '#4b5680' }}>
            Memory entries: <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{memories.length}</span>
          </div>
          {latestRun?.summary && (
            <div style={{ fontSize: 12, color: '#6b7a9a', width: '100%' }}>
              {latestRun.summary}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { 
            label: 'YouTube Subs', 
            value: platformStats.youtube.data?.subscriberCount ? Number(platformStats.youtube.data.subscriberCount).toLocaleString() : '—', 
            color: '#ff0000', 
            icon: <Radio size={15} />,
            live: platformStats.youtube.source === 'live'
          },
          { 
            label: 'IG Followers', 
            value: platformStats.instagram.data?.followers_count ? Number(platformStats.instagram.data.followers_count).toLocaleString() : '—', 
            color: '#ec4899', 
            icon: <Radio size={15} />,
            live: platformStats.instagram.source === 'live'
          },
          { label: 'Published', value: doneCount, color: '#10b981', icon: <Target size={15} /> },
          { label: 'Avg AI Score', value: avgScore, color: '#fbbf24', icon: <TrendingUp size={15} /> },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="card"
            style={{ padding: '18px 20px', position: 'relative' }}
          >
            {stat.live && (
               <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)' }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, background: '#10b981' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, color: '#10b981', letterSpacing: '0.05em' }}>LIVE</span>
               </div>
            )}
            <div style={{ color: stat.color, marginBottom: 10 }}>{stat.icon}</div>
            <div className="number-stat" style={{ fontSize: 28, color: stat.color, marginBottom: 4, letterSpacing: '-0.02em' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 500 }}>{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Trending */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
          style={{ padding: '20px 22px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div className="pulse-dot" />
            <h3 style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', letterSpacing: '-0.01em' }}>Trending Now</h3>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#4b5680', fontWeight: 600 }}>Live Feed</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {activeTrends.length > 0 ? (
              activeTrends.slice(0, 5).map((t: any) => (
                <div key={t.label || t.topic} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600 }}>{t.label || t.topic}</div>
                    <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 500 }}>{t.niche || 'Niche'}</div>
                  </div>
                  <span className="badge badge-green">{t.velocity || '+100%'}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 12, color: '#4b5680' }}>Open Trend Radar to fetch live data</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick actions + goal */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="card"
          style={{ padding: '20px 22px' }}
        >
          <h3 style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', letterSpacing: '-0.01em', marginBottom: 14 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Generate AI ideas', cb: () => setView('idea-engine'), icon: <Lightbulb size={13} />, color: '#3b82f6' },
              { label: 'Open Content Calendar', cb: () => setView('calendar'), icon: <Calendar size={13} />, color: '#ec4899' },
              { label: 'Create Script or Caption', cb: () => setView('studio'), icon: <Wand2 size={13} />, color: '#f97316' },
            ].map((a) => (
              <button
                key={a.label}
                onClick={a.cb}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 13px', borderRadius: 9,
                  border: '1px solid rgba(59,130,246,0.1)',
                  background: 'rgba(59,130,246,0.04)',
                  color: a.color, fontSize: 12.5, cursor: 'pointer',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 600, textAlign: 'left',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.08)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.04)')}
              >
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {primaryGoal && (
            <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 600, marginBottom: 5 }}>Active Goal</div>
              <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em' }}>
                {primaryGoal.label}
              </div>
              <div style={{ background: 'rgba(59,130,246,0.12)', borderRadius: 4, height: 5 }}>
                <div
                  style={{
                    width: `${Math.min(100, (primaryGoal.currentValue / primaryGoal.targetValue) * 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #ec4899)',
                    borderRadius: 4,
                    transition: 'width 600ms ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10.5, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>
                <span>{primaryGoal.currentValue.toLocaleString()}</span>
                <span>{primaryGoal.targetValue.toLocaleString()}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
