import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { TrendingUp, Eye, Heart, MessageCircle, Bookmark, Plus, X, Video as VideoIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import type { PostPerformance } from '../types'
import { YouTubeApiService } from '../utils/youtubeApi'
import type { YouTubeChannelStats } from '../utils/youtubeApi'
import { computeWorkflowIntelligence } from '../services/workflowInsights'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  youtube: '#ef4444',
  linkedin: '#3b82f6',
  twitter: '#22d3ee',
}

const CONTENT_COLORS: Record<string, string> = {
  reel: '#ec4899', carousel: '#3b82f6', post: '#10b981',
  video: '#ef4444', thread: '#22d3ee', article: '#f59e0b', story: '#a78bfa',
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ color, marginBottom: 8 }}>{icon}</div>
      <div className="number-stat" style={{ fontSize: 30, color, marginBottom: 3, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#4b5680', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 3, fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

const TOOLTIP_STYLE = {
  background: '#111122',
  border: '1px solid rgba(59,130,246,0.2)',
  borderRadius: 10,
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  fontSize: 12,
  color: '#f0f4ff',
}

export function Analytics() {
  const { profile, calendarPosts, updateCalendarPost, workflowRuns, ideas, incomeEntries, integrationSyncStatus, setView } = useStore()
  const [logModalPost, setLogModalPost] = useState<string | null>(null)
  const [logForm, setLogForm] = useState<Partial<PostPerformance>>({})
  const [activeTab, setActiveTab] = useState<'overview' | 'platforms' | 'content' | 'system' | 'posts'>('overview')
  const [ytStats, setYtStats] = useState<YouTubeChannelStats | null>(null)
  const [loadingYt, setLoadingYt] = useState(false)

  useEffect(() => {
    async function loadYtStats() {
      if (profile?.youtubeApiKey && profile?.youtubeChannelId) {
        setLoadingYt(true)
        const stats = await YouTubeApiService.getChannelStats(profile)
        setYtStats(stats)
        setLoadingYt(false)
      }
    }
    loadYtStats()
  }, [profile?.youtubeApiKey, profile?.youtubeChannelId])

  const publishedPosts = calendarPosts.filter(p => p.status === 'published')
  const postsWithData = publishedPosts.filter(p => p.performanceData)

  // Aggregate metrics
  const totalViews = postsWithData.reduce((s, p) => s + (p.performanceData?.views || 0), 0)
  const totalLikes = postsWithData.reduce((s, p) => s + (p.performanceData?.likes || 0), 0)
  const totalComments = postsWithData.reduce((s, p) => s + (p.performanceData?.comments || 0), 0)
  const totalSaves = postsWithData.reduce((s, p) => s + (p.performanceData?.saves || 0), 0)
  const avgEng = postsWithData.length > 0
    ? (postsWithData.reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) / postsWithData.length).toFixed(1)
    : '—'

  // Timeline data (last 30 days)
  const timelineData = (() => {
    const days: Record<string, { date: string; views: number; likes: number; comments: number }> = {}
    postsWithData.forEach(p => {
      const d = p.scheduledAt
      if (!days[d]) days[d] = { date: d, views: 0, likes: 0, comments: 0 }
      days[d].views += p.performanceData?.views || 0
      days[d].likes += p.performanceData?.likes || 0
      days[d].comments += p.performanceData?.comments || 0
    })
    return Object.values(days).sort((a, b) => a.date.localeCompare(b.date)).slice(-20)
  })()

  // Platform breakdown
  const platformData = (() => {
    const map: Record<string, { platform: string; posts: number; views: number; engagement: number }> = {}
    postsWithData.forEach(p => {
      if (!map[p.platform]) map[p.platform] = { platform: p.platform, posts: 0, views: 0, engagement: 0 }
      map[p.platform].posts++
      map[p.platform].views += p.performanceData?.views || 0
      map[p.platform].engagement += p.performanceData?.likes || 0 + (p.performanceData?.comments || 0)
    })
    return Object.values(map)
  })()

  // Content type breakdown for pie
  const contentTypeData = (() => {
    const map: Record<string, number> = {}
    publishedPosts.forEach(p => { map[p.contentType] = (map[p.contentType] || 0) + 1 })
    return Object.entries(map).map(([type, count]) => ({ name: type, value: count, color: CONTENT_COLORS[type] || '#6b7a9a' }))
  })()

  // Radar: best/worst performing content types
  const radarData = [
    { subject: 'Reels', A: postsWithData.filter(p => p.contentType === 'reel').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
    { subject: 'Carousels', A: postsWithData.filter(p => p.contentType === 'carousel').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
    { subject: 'Posts', A: postsWithData.filter(p => p.contentType === 'post').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
    { subject: 'Videos', A: postsWithData.filter(p => p.contentType === 'video').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
    { subject: 'Threads', A: postsWithData.filter(p => p.contentType === 'thread').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
    { subject: 'Articles', A: postsWithData.filter(p => p.contentType === 'article').reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) || 0 },
  ]

  const intelligence = useMemo(
    () => computeWorkflowIntelligence(workflowRuns, calendarPosts, ideas, incomeEntries, integrationSyncStatus),
    [workflowRuns, calendarPosts, ideas, incomeEntries, integrationSyncStatus]
  )

  function savePerformance() {
    if (!logModalPost) return
    const perf: PostPerformance = {
      views: Number(logForm.views) || 0,
      likes: Number(logForm.likes) || 0,
      comments: Number(logForm.comments) || 0,
      saves: Number(logForm.saves) || 0,
      shares: Number(logForm.shares) || 0,
      engagementRate: logForm.views && logForm.views > 0
        ? parseFloat((((Number(logForm.likes) + Number(logForm.comments) + Number(logForm.saves)) / Number(logForm.views)) * 100).toFixed(1))
        : 0,
    }
    updateCalendarPost(logModalPost, { performanceData: perf, status: 'published' })
    toast.success('Performance logged!')
    setLogModalPost(null)
    setLogForm({})
  }

  const emptyState = postsWithData.length === 0

  return (
    <div style={{ padding: '28px 32px' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em' }}>Analytics</h1>
            <p style={{ color: '#4b5680', fontSize: 13, marginTop: 4, fontWeight: 500 }}>
              Track your content performance across all platforms
            </p>
          </div>
          <button
            className="btn btn-blue btn-sm"
            onClick={() => {
              const p = calendarPosts.find(p => !p.performanceData)
              if (p) { setLogModalPost(p.id); setLogForm({}) }
              else toast('No posts to log performance for')
            }}
          >
            <Plus size={13} /> Log Performance
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginTop: 20 }}>
          {(['overview', 'platforms', 'content', 'system', 'posts'] as const).map(t => (
            <button key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {emptyState ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 32px', color: '#4b5680' }}
        >
          <TrendingUp size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7a9a', marginBottom: 8 }}>No performance data yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Log performance on your published posts to see analytics here</div>
          <button className="btn btn-blue btn-sm" onClick={() => {
            const p = calendarPosts[0]
            if (p) { setLogModalPost(p.id); setLogForm({}) }
          }}>Log your first post</button>
        </motion.div>
      ) : (
        <>
          {/* Stats Row */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {ytStats && !loadingYt && (
                <div className="card" style={{ padding: '16px 20px', marginBottom: 20, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                      <VideoIcon size={18} color="white" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>YouTube Channel Pulse</div>
                      <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                        Live from API
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Subscribers</div>
                      <div style={{ fontSize: 18, color: '#f0f4ff', fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>{ytStats.subscriberCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Lifetime Views</div>
                      <div style={{ fontSize: 18, color: '#f0f4ff', fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>{ytStats.viewCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Total Videos</div>
                      <div style={{ fontSize: 18, color: '#f0f4ff', fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>{ytStats.videoCount}</div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 22 }}>
                <StatCard label="Total Views" value={totalViews.toLocaleString()} color="#3b82f6" icon={<Eye size={15} />} />
                <StatCard label="Total Likes" value={totalLikes.toLocaleString()} color="#ec4899" icon={<Heart size={15} />} />
                <StatCard label="Comments" value={totalComments.toLocaleString()} color="#f97316" icon={<MessageCircle size={15} />} />
                <StatCard label="Saves" value={totalSaves.toLocaleString()} color="#10b981" icon={<Bookmark size={15} />} />
                <StatCard label="Avg Eng Rate" value={`${avgEng}%`} color="#fbbf24" icon={<TrendingUp size={15} />} sub={`${postsWithData.length} posts tracked`} />
              </div>

              {/* Timeline */}
              <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 16, letterSpacing: '-0.01em' }}>
                  Engagement Timeline
                </div>
                {timelineData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#4b5680', fontSize: 12 }}>Not enough data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gLikes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(59,130,246,0.06)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: '#4b5680', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#4b5680', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#gViews)" />
                      <Area type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} fill="url(#gLikes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bottom row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Content type radar */}
                <div className="card" style={{ padding: '20px 22px' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 16 }}>Content Format Performance</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(59,130,246,0.12)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5680', fontSize: 10 }} />
                      <Radar name="Engagement" dataKey="A" stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Published content mix */}
                <div className="card" style={{ padding: '20px 22px' }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 16 }}>Content Mix</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={contentTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                          {contentTypeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                      {contentTypeData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, flex: 1, textTransform: 'capitalize' }}>{d.name}</span>
                          <span style={{ fontSize: 12, color: '#4b5680', fontFamily: 'Space Mono, monospace' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'platforms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ padding: '20px 22px', marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 16 }}>Views by Platform</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={platformData} barSize={32}>
                    <CartesianGrid stroke="rgba(59,130,246,0.06)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="platform" tick={{ fill: '#4b5680', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#4b5680', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                      {platformData.map((entry, i) => <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || '#3b82f6'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {platformData.map(p => (
                  <div key={p.platform} className="card" style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: PLATFORM_COLORS[p.platform] || '#3b82f6' }} />
                      <span style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700, textTransform: 'capitalize' }}>{p.platform}</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: PLATFORM_COLORS[p.platform] || '#3b82f6', marginBottom: 2 }}>{p.posts}</div>
                    <div style={{ fontSize: 11, color: '#4b5680', fontWeight: 500 }}>posts published</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{p.views.toLocaleString()} views</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {Object.entries(CONTENT_COLORS).map(([type, color]) => {
                  const typePosts = postsWithData.filter(p => p.contentType === type)
                  const avgViews = typePosts.length ? Math.round(typePosts.reduce((s, p) => s + (p.performanceData?.views || 0), 0) / typePosts.length) : 0
                  const avgEngRate = typePosts.length ? (typePosts.reduce((s, p) => s + (p.performanceData?.engagementRate || 0), 0) / typePosts.length).toFixed(1) : '0'
                  return (
                    <div key={type} className="card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff', textTransform: 'capitalize' }}>{type}</span>
                        <span style={{ fontSize: 10, background: `${color}20`, color, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{typePosts.length} posts</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{avgViews.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>avg views</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', letterSpacing: '-0.02em' }}>{avgEngRate}%</div>
                          <div style={{ fontSize: 10, color: '#4b5680', fontWeight: 600 }}>avg eng</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                <StatCard label="Workflow Success" value={`${intelligence.successRate}%`} color={intelligence.successRate >= 75 ? '#10b981' : '#f59e0b'} icon={<TrendingUp size={15} />} />
                <StatCard label="Avg Run Time" value={`${intelligence.avgDurationMinutes}m`} color="#22d3ee" icon={<Eye size={15} />} />
                <StatCard label="Total Retries" value={intelligence.totalRetries} color="#f97316" icon={<MessageCircle size={15} />} />
                <StatCard label="Attributed Views (30d)" value={intelligence.attributedViews30d.toLocaleString()} color="#3b82f6" icon={<Heart size={15} />} />
              </div>

              <div className="card" style={{ padding: '18px 20px', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 10 }}>System Recommendations</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {intelligence.actions.map((action) => (
                    <div key={action.id} style={{ border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 700 }}>{action.title}</div>
                        <div style={{ fontSize: 11, color: '#4b5680', marginTop: 4 }}>{action.detail}</div>
                      </div>
                      <button className="btn btn-ghost btn-xs" onClick={() => setView(action.view)}>Open</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '18px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#f0f4ff', marginBottom: 10 }}>Run-to-Outcome Attribution</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {intelligence.impactRows.slice(0, 8).map((row) => (
                    <div key={row.runId} style={{ border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{row.workflowName}</span>
                        <span style={{ color: '#4b5680' }}>Impact {row.impactScore}</span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 11, color: '#4b5680' }}>
                        Ideas {row.influencedIdeas} · Posts {row.influencedPosts} · Views {row.influencedViews.toLocaleString()} · Revenue ₹{Math.round(row.influencedIncome).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                  {intelligence.impactRows.length === 0 && <div style={{ fontSize: 12, color: '#4b5680' }}>No workflow runs yet for attribution.</div>}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'posts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(59,130,246,0.08)', display: 'flex', gap: 16, fontSize: 11, fontWeight: 700, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span style={{ flex: 3 }}>Post</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Views</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Likes</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Eng%</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>Action</span>
                </div>
                {calendarPosts.map(post => (
                  <div key={post.id} style={{ padding: '12px 20px', borderBottom: '1px solid rgba(59,130,246,0.05)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ flex: 3 }}>
                      <div style={{ fontSize: 13, color: '#f0f4ff', fontWeight: 600 }}>{post.title}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, color: PLATFORM_COLORS[post.platform], fontWeight: 600, textTransform: 'capitalize' }}>{post.platform}</span>
                        <span style={{ fontSize: 10, color: '#4b5680' }}>{post.scheduledAt}</span>
                      </div>
                    </div>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>
                      {post.performanceData ? post.performanceData.views.toLocaleString() : '—'}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>
                      {post.performanceData ? post.performanceData.likes.toLocaleString() : '—'}
                    </span>
                    <span style={{ flex: 1, textAlign: 'right', fontSize: 13, color: post.performanceData ? '#10b981' : '#4b5680', fontFamily: 'Space Mono, monospace', fontWeight: 600 }}>
                      {post.performanceData ? `${post.performanceData.engagementRate || 0}%` : '—'}
                    </span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-ghost btn-xs"
                        onClick={() => { setLogModalPost(post.id); setLogForm(post.performanceData || {}) }}
                      >
                        {post.performanceData ? 'Edit' : 'Log'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Log Performance Modal */}
      {logModalPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ width: 420, background: '#111122', border: '1px solid rgba(59,130,246,0.22)', borderRadius: 18, padding: 28, position: 'relative' }}
          >
            <button onClick={() => setLogModalPost(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680' }}><X size={16} /></button>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f0f4ff', marginBottom: 6 }}>Log Performance</h3>
            <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 20 }}>
              {calendarPosts.find(p => p.id === logModalPost)?.title}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {(['views', 'likes', 'comments', 'saves', 'shares'] as const).map(field => (
                <div key={field}>
                  <label className="sec-label">{field}</label>
                  <input
                    className="field"
                    type="number"
                    placeholder="0"
                    value={(logForm[field] as number | undefined) || ''}
                    onChange={e => setLogForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-blue" style={{ flex: 1 }} onClick={savePerformance}>Save Performance</button>
              <button className="btn btn-ghost" onClick={() => setLogModalPost(null)}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
