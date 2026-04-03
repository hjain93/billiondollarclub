import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { runWorkflow, getDefaultWorkflowId, cancelWorkflowRunExecution } from '../services/workflowEngine'
import { computeWorkflowIntelligence } from '../services/workflowInsights'
import toast from 'react-hot-toast'

export function OpsHQ() {
  const {
    memories,
    workflowRuns,
    workflows,
    workflowAutoRunEnabled,
    workflowAutoRunIntervalHours,
    setWorkflowAutoRun,
    integrationSyncStatus,
    ideas,
    calendarPosts,
    incomeEntries,
    setView,
  } = useStore()
  const [q, setQ] = useState('')
  const [running, setRunning] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const filteredMemories = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return memories.slice(0, 30)
    return memories
      .filter((m) =>
        m.title.toLowerCase().includes(query) ||
        m.content.toLowerCase().includes(query) ||
        m.tags.some((t) => t.toLowerCase().includes(query))
      )
      .slice(0, 40)
  }, [memories, q])

  const outcomes = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const recentIdeas = ideas.filter((i) => new Date(i.createdAt).getTime() >= thirtyDaysAgo).length
    const recentScheduled = calendarPosts.filter((p) => new Date(p.scheduledAt).getTime() >= thirtyDaysAgo).length
    const monthlyIncome = incomeEntries
      .filter((e) => new Date(e.date).getTime() >= thirtyDaysAgo)
      .reduce((sum, e) => sum + e.amount, 0)
    return { recentIdeas, recentScheduled, monthlyIncome }
  }, [ideas, calendarPosts, incomeEntries])

  const selectedRun = workflowRuns.find((r) => r.id === selectedRunId) || null
  const intelligence = useMemo(
    () => computeWorkflowIntelligence(workflowRuns, calendarPosts, ideas, incomeEntries, integrationSyncStatus),
    [workflowRuns, calendarPosts, ideas, incomeEntries, integrationSyncStatus]
  )

  async function runNow() {
    try {
      setRunning(true)
      await runWorkflow(getDefaultWorkflowId(), 'Manual run from Ops HQ')
      toast.success('Workflow run completed')
    } catch (e: any) {
      toast.error(e?.message || 'Workflow run failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px', display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>Ops HQ</h1>
          <p style={{ fontSize: 12, color: '#6b7a9a' }}>Workflow runs, persistent memory, integrations, and outcomes.</p>
        </div>
        <button className="btn btn-blue btn-sm" onClick={runNow} disabled={running}>
          {running ? 'Running...' : 'Run Workflow Now'}
        </button>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Agentic Loop</div>
            <div style={{ fontSize: 12, color: '#6b7a9a' }}>Automatically run the default workflow on an interval.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setWorkflowAutoRun(!workflowAutoRunEnabled, workflowAutoRunIntervalHours)}
            >
              {workflowAutoRunEnabled ? 'Disable Auto-Run' : 'Enable Auto-Run'}
            </button>
            <select
              className="field"
              value={workflowAutoRunIntervalHours}
              onChange={(e) => setWorkflowAutoRun(workflowAutoRunEnabled, Number(e.target.value))}
              style={{ width: 120 }}
            >
              <option value={6}>Every 6h</option>
              <option value={12}>Every 12h</option>
              <option value={24}>Every 24h</option>
              <option value={48}>Every 48h</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Workflow Runs</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{workflowRuns.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Memory Entries</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{memories.length}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Active Workflows</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{workflows.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Workflow Success Rate</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: intelligence.successRate >= 75 ? '#10b981' : '#f59e0b' }}>
            {intelligence.successRate}%
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Attributed Posts (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{intelligence.attributedPosts30d}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Attributed Views (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>{intelligence.attributedViews30d.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: '#6b7a9a' }}>Attributed Income (30d)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff' }}>₹{Math.round(intelligence.attributedIncome30d).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 10 }}>Optimization Queue</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {intelligence.actions.slice(0, 4).map((action) => (
            <div key={action.id} style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700 }}>{action.title}</div>
                <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4 }}>{action.detail}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setView(action.view)}>
                Open
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 10 }}>Workflow Runs</div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {workflowRuns.slice(0, 15).map((run) => (
              <div key={run.id} style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <button style={{ color: '#f0f4ff', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => setSelectedRunId(run.id)}>
                    {run.workflowName}
                  </button>
                  <span style={{ color: '#6b7a9a' }}>{run.status}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4 }}>{run.summary || run.objective || 'No summary'}</div>
                {run.status === 'running' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => cancelWorkflowRunExecution(run.id)}
                  >
                    Cancel Run
                  </button>
                )}
              </div>
            ))}
            {workflowRuns.length === 0 && <div style={{ fontSize: 12, color: '#6b7a9a' }}>No runs yet.</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 10 }}>Integration Health</div>
          {(['youtube', 'instagram', 'web', 'ai'] as const).map((p) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
              <span style={{ color: '#6b7a9a', textTransform: 'capitalize' }}>{p}</span>
              <span style={{ color: integrationSyncStatus[p].status === 'success' ? '#10b981' : integrationSyncStatus[p].status === 'error' ? '#ef4444' : '#f0f4ff' }}>
                {integrationSyncStatus[p].status}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 12, fontSize: 11, color: '#6b7a9a' }}>
            Outcome snapshot:
            <div>Ideas (30d): {outcomes.recentIdeas}</div>
            <div>Scheduled posts (30d): {outcomes.recentScheduled}</div>
            <div>Income (30d): ₹{outcomes.monthlyIncome.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', marginBottom: 10 }}>Run Attribution</div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
          {intelligence.impactRows.slice(0, 12).map((row) => (
            <div key={row.runId} style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{row.workflowName}</span>
                <span style={{ color: '#6b7a9a' }}>Impact {row.impactScore}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4 }}>
                Ideas {row.influencedIdeas} · Posts {row.influencedPosts} · Views {row.influencedViews.toLocaleString()} · Revenue ₹{Math.round(row.influencedIncome).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
          {intelligence.impactRows.length === 0 && <div style={{ fontSize: 12, color: '#6b7a9a' }}>Run attribution will appear after first run.</div>}
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Persistent Memory</div>
          <input
            className="field"
            placeholder="Search memory..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
        <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
          {filteredMemories.map((m) => (
            <div key={m.id} style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700 }}>{m.title}</div>
              <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4 }}>{m.content.slice(0, 220)}</div>
            </div>
          ))}
          {filteredMemories.length === 0 && <div style={{ fontSize: 12, color: '#6b7a9a' }}>No memory entries found.</div>}
        </div>
      </div>

      {selectedRun && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Run Details</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRunId(null)}>Close</button>
          </div>
          <div style={{ fontSize: 12, color: '#6b7a9a', marginBottom: 10 }}>
            {selectedRun.workflowName} · {selectedRun.status}
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {selectedRun.steps.map((step) => (
              <div key={step.id} style={{ border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{step.title}</span>
                  <span style={{ color: '#6b7a9a' }}>{step.status}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6b7a9a', marginTop: 4 }}>
                  Attempts: {step.attemptCount || 0} · Retries: {step.retryCount || 0}
                </div>
                {(step.output || step.error) && (
                  <div style={{ fontSize: 11, color: '#9fb0d2', marginTop: 6, whiteSpace: 'pre-wrap' }}>
                    {step.output || step.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          {selectedRun.artifacts && (
            <div style={{ marginTop: 12, fontSize: 11, color: '#6b7a9a', whiteSpace: 'pre-wrap' }}>
              <div style={{ color: '#f0f4ff', fontWeight: 700, marginBottom: 4 }}>Artifacts</div>
              {selectedRun.artifacts.trendSummary && `Trend Summary:\\n${selectedRun.artifacts.trendSummary}\\n\\n`}
              {selectedRun.artifacts.generatedIdeas?.length ? `Ideas:\\n- ${selectedRun.artifacts.generatedIdeas.join('\\n- ')}\\n\\n` : ''}
              {selectedRun.artifacts.calendarPlan && `Plan:\\n${selectedRun.artifacts.calendarPlan}`}
              {selectedRun.artifacts.createdPostIds?.length ? `\\n\\nCreated Posts: ${selectedRun.artifacts.createdPostIds.length}` : ''}
              {selectedRun.artifacts.createdTaskIds?.length ? `\\nCreated Tasks: ${selectedRun.artifacts.createdTaskIds.length}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
