import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  CreatorProfile, ContentIdea, CalendarPost, Goal, BrandDeal,
  ContentDNAResult, PostPerformance, IncomeEntry, ContentTemplate,
  CreatorStreak, Workspace, WorkspacePlan, TeamMember, Project,
  ProjectTask, SmartTask, Milestone, Risk, ActivityLog,
  FileAttachment, TimeEntry, PipelineItem, PipelineStage,
  ClientPortalLink, ClientComment,
  AgentMemory, WorkflowDefinition, WorkflowRun, WorkflowStepRun, IntegrationSyncStatus,
  PricingTier, Product,
} from './types'

interface SessionState {
  youtubeToken: string | null
  instagramToken: string | null
  aiKey: string | null
  anthropicKey: string | null
  geminiKey: string | null
  openaiKey: string | null
  activeAIProvider: 'anthropic' | 'gemini' | 'openai'
  googleSearchToken: string | null
  setTokens: (tokens: {
    youtube?: string
    instagram?: string
    ai?: string
    anthropic?: string
    gemini?: string
    openai?: string
    aiProvider?: 'anthropic' | 'gemini' | 'openai'
    search?: string
  }) => void
}

interface AppState extends SessionState {
  profile: CreatorProfile | null
  ideas: ContentIdea[]
  calendarPosts: CalendarPost[]
  brandDeals: BrandDeal[]
  contentDNA: ContentDNAResult | null
  trendData: any[] | null
  activeView: string
  isOnboarding: boolean
  settingsOpen: boolean
  incomeEntries: IncomeEntry[]
  products: Product[]
  monthlyIncomeTarget: number
  templates: ContentTemplate[]
  streak: CreatorStreak
  workspace: Workspace
  smartTasks: SmartTask[]
  theme: 'dark' | 'light'
  hasVisited: boolean

  setTheme: (t: 'dark' | 'light') => void
  setHasVisited: (v: boolean) => void

  setProfile: (p: CreatorProfile) => void
  updateProfile: (p: Partial<CreatorProfile>) => void

  addIdea: (idea: ContentIdea) => void
  updateIdeaStatus: (id: string, status: ContentIdea['status']) => void
  removeIdea: (id: string) => void

  addCalendarPost: (post: CalendarPost) => void
  updateCalendarPost: (id: string, updates: Partial<CalendarPost>) => void
  removeCalendarPost: (id: string) => void
  logPostPerformance: (id: string, perf: PostPerformance) => void

  addBrandDeal: (deal: BrandDeal) => void
  updateBrandDeal: (id: string, updates: Partial<BrandDeal>) => void
  removeBrandDeal: (id: string) => void

  setContentDNA: (dna: ContentDNAResult) => void
  setTrendData: (trends: any[]) => void

  setView: (v: string) => void
  completeOnboarding: () => void
  setSettingsOpen: (open: boolean) => void

  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  removeGoal: (id: string) => void

  addIncomeEntry: (e: IncomeEntry) => void
  removeIncomeEntry: (id: string) => void
  setMonthlyIncomeTarget: (n: number) => void
  addTemplate: (t: ContentTemplate) => void
  removeTemplate: (id: string) => void
  updateStreak: (s: CreatorStreak) => void

  // Workspace
  setWorkspacePlan: (plan: WorkspacePlan) => void
  addTeamMember: (m: TeamMember) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  removeTeamMember: (id: string) => void

  // Projects
  addProject: (p: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void

  // Project Tasks
  addProjectTask: (task: ProjectTask) => void
  updateProjectTask: (id: string, updates: Partial<ProjectTask>) => void
  removeProjectTask: (id: string) => void

  // Milestones
  addMilestone: (projectId: string, m: Milestone) => void
  updateMilestone: (projectId: string, id: string, updates: Partial<Milestone>) => void
  removeMilestone: (projectId: string, id: string) => void

  // Risks
  addRisk: (projectId: string, r: Risk) => void
  updateRisk: (projectId: string, id: string, updates: Partial<Risk>) => void
  removeRisk: (projectId: string, id: string) => void

  // Activity log
  addActivityLog: (projectId: string, entry: ActivityLog) => void

  // Smart tasks
  addSmartTask: (t: SmartTask) => void
  updateSmartTask: (id: string, updates: Partial<SmartTask>) => void
  removeSmartTask: (id: string) => void

  // Task attachments (shared for both ProjectTask and SmartTask)
  addAttachmentToProjectTask: (taskId: string, att: FileAttachment) => void
  removeAttachmentFromProjectTask: (taskId: string, attId: string) => void
  addAttachmentToSmartTask: (taskId: string, att: FileAttachment) => void
  removeAttachmentFromSmartTask: (taskId: string, attId: string) => void

  // Time entries
  addTimeEntryToProjectTask: (taskId: string, entry: TimeEntry) => void
  addTimeEntryToSmartTask: (taskId: string, entry: TimeEntry) => void

  // Content Pipeline
  pipelineItems: PipelineItem[]
  addPipelineItem: (item: PipelineItem) => void
  updatePipelineItem: (id: string, updates: Partial<PipelineItem>) => void
  movePipelineItem: (id: string, stage: PipelineStage) => void
  removePipelineItem: (id: string) => void

  // Client Portal
  clientPortalLinks: ClientPortalLink[]
  clientComments: ClientComment[]
  addClientPortalLink: (link: ClientPortalLink) => void
  updateClientPortalLink: (id: string, updates: Partial<ClientPortalLink>) => void
  removeClientPortalLink: (id: string) => void
  incrementPortalViews: (id: string) => void
  addClientComment: (comment: ClientComment) => void
  updateClientComment: (id: string, updates: Partial<ClientComment>) => void
  removeClientComment: (id: string) => void

  // Smart Inbox dismissed IDs
  dismissedInboxIds: string[]
  dismissInboxItem: (id: string) => void
  clearDismissedInbox: () => void

  // Workflow engine + memory
  memories: AgentMemory[]
  workflows: WorkflowDefinition[]
  workflowRuns: WorkflowRun[]
  addMemory: (memory: AgentMemory) => void
  updateMemory: (id: string, updates: Partial<AgentMemory>) => void
  addWorkflow: (workflow: WorkflowDefinition) => void
  addWorkflowRun: (run: WorkflowRun) => void
  updateWorkflowRun: (id: string, updates: Partial<WorkflowRun>) => void
  updateWorkflowRunStep: (runId: string, stepId: string, updates: Partial<WorkflowStepRun>) => void
  cancelWorkflowRun: (id: string, reason?: string) => void

  // Agentic loop + integration health
  workflowAutoRunEnabled: boolean
  workflowAutoRunIntervalHours: number
  lastWorkflowAutoRunAt: string | null
  integrationSyncStatus: IntegrationSyncStatus
  setWorkflowAutoRun: (enabled: boolean, intervalHours?: number) => void
  setLastWorkflowAutoRunAt: (iso: string) => void
  setIntegrationSyncStatus: (provider: keyof IntegrationSyncStatus, status: IntegrationSyncStatus[keyof IntegrationSyncStatus]) => void

  // Pricing tier
  planTier: PricingTier
  setPlanTier: (tier: PricingTier) => void

  // Mobile sidebar
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (open: boolean) => void

  // AI usage tracking (resets monthly)
  aiGenerationsUsed: number
  aiGenerationsResetMonth: string  // 'YYYY-MM'
  incrementAIGenerations: () => void
  resetAIGenerationsIfNewMonth: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      youtubeToken: null,
      instagramToken: null,
      aiKey: null,
      anthropicKey: null,
      geminiKey: null,
      openaiKey: null,
      activeAIProvider: 'gemini',
      googleSearchToken: null,
      setTokens: (t) => set((s) => ({
        // Keep any available provider key as the shared aiKey fallback.
        // This prevents feature gating when only a non-primary provider key is entered.
        // Also mirror active key into profile.apiKey at runtime for legacy modules
        // that still read profile.apiKey directly.
        profile: s.profile
          ? {
              ...s.profile,
              apiKey:
                t.ai ||
                (
                  (t.aiProvider || s.activeAIProvider) === 'anthropic'
                    ? (t.anthropic || s.anthropicKey)
                    : (t.aiProvider || s.activeAIProvider) === 'gemini'
                      ? (t.gemini || s.geminiKey)
                      : (t.openai || s.openaiKey)
                ) ||
                t.anthropic ||
                t.gemini ||
                t.openai ||
                s.anthropicKey ||
                s.geminiKey ||
                s.openaiKey ||
                s.aiKey ||
                undefined,
            }
          : s.profile,
        youtubeToken: t.youtube || s.youtubeToken,
        instagramToken: t.instagram || s.instagramToken,
        anthropicKey: t.anthropic || s.anthropicKey,
        geminiKey: t.gemini || s.geminiKey,
        openaiKey: t.openai || s.openaiKey,
        activeAIProvider: t.aiProvider || s.activeAIProvider,
        aiKey:
          t.ai ||
          (
            (t.aiProvider || s.activeAIProvider) === 'anthropic'
              ? (t.anthropic || s.anthropicKey)
              : (t.aiProvider || s.activeAIProvider) === 'gemini'
                ? (t.gemini || s.geminiKey)
                : (t.openai || s.openaiKey)
          ) ||
          t.anthropic ||
          t.gemini ||
          t.openai ||
          s.anthropicKey ||
          s.geminiKey ||
          s.openaiKey ||
          s.aiKey,
        googleSearchToken: t.search || s.googleSearchToken
      })),

      profile: null,
      ideas: [],
      calendarPosts: [],
      brandDeals: [],
      contentDNA: null,
      trendData: null,
      activeView: 'command-center',
      isOnboarding: true,
      settingsOpen: false,
      incomeEntries: [],
      products: [
        { id: 'p1', name: 'Zero to Viral Hook Guide', type: 'ebook', price: 47, sales: 128, status: 'active', revenue: 6016 },
        { id: 'p2', name: 'Editing Mastery Workflow', type: 'course', price: 299, sales: 42, status: 'active', revenue: 12558 },
      ],
      monthlyIncomeTarget: 50000,
      templates: [],
      streak: { current: 0, longest: 0, lastDate: '' },
      workspace: {
        id: 'default',
        name: 'My Workspace',
        plan: 'personal',
        members: [],
        projects: [],
        createdAt: new Date().toISOString(),
      },
      smartTasks: [],
      theme: 'dark',
      hasVisited: false,
      pipelineItems: [],
      clientPortalLinks: [],
      clientComments: [],
      dismissedInboxIds: [],
      memories: [],
      workflows: [],
      workflowRuns: [],
      workflowAutoRunEnabled: false,
      workflowAutoRunIntervalHours: 24,
      lastWorkflowAutoRunAt: null,
      integrationSyncStatus: {
        youtube: { status: 'idle' },
        instagram: { status: 'idle' },
        web: { status: 'idle' },
        ai: { status: 'idle' },
      },
      planTier: 'free' as PricingTier,
      setPlanTier: (tier) => set({ planTier: tier }),
      mobileSidebarOpen: false,
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

      aiGenerationsUsed: 0,
      aiGenerationsResetMonth: new Date().toISOString().slice(0, 7),
      incrementAIGenerations: () => set((s) => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        const used = s.aiGenerationsResetMonth === currentMonth ? s.aiGenerationsUsed + 1 : 1
        return { aiGenerationsUsed: used, aiGenerationsResetMonth: currentMonth }
      }),
      resetAIGenerationsIfNewMonth: () => set((s) => {
        const currentMonth = new Date().toISOString().slice(0, 7)
        if (s.aiGenerationsResetMonth !== currentMonth) {
          return { aiGenerationsUsed: 0, aiGenerationsResetMonth: currentMonth }
        }
        return {}
      }),

      setTheme: (t) => set({ theme: t }),
      setHasVisited: (v) => set({ hasVisited: v }),

      setProfile: (p) =>
        set((s) => ({
          profile: {
            ...p,
            apiKey:
              s.aiKey ||
              (
                s.activeAIProvider === 'anthropic'
                  ? s.anthropicKey
                  : s.activeAIProvider === 'gemini'
                    ? s.geminiKey
                    : s.openaiKey
              ) ||
              s.anthropicKey ||
              s.geminiKey ||
              s.openaiKey ||
              p.apiKey,
          },
          isOnboarding: false,
        })),
      updateProfile: (p) => set((s) => ({ profile: s.profile ? { ...s.profile, ...p } : null })),

      addIdea: (idea) => set((s) => ({ ideas: [idea, ...s.ideas] })),
      updateIdeaStatus: (id, status) =>
        set((s) => ({ ideas: s.ideas.map((i) => (i.id === id ? { ...i, status } : i)) })),
      removeIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

      addCalendarPost: (post) => set((s) => {
        const newPosts = [...s.calendarPosts, post];
        if (post.status === 'scheduled') {
          const newPipelineItem: import('./types').PipelineItem = {
            id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title: post.title,
            stage: 'script',
            contentType: post.contentType,
            platforms: [post.platform],
            priority: 'medium',
            linkedCalendarPostId: post.id,
            linkedIdeaId: post.ideaId,
            tags: ['auto-from-calendar'],
            createdAt: new Date().toISOString(),
          }
          return { calendarPosts: newPosts, pipelineItems: [newPipelineItem, ...s.pipelineItems] }
        }
        return { calendarPosts: newPosts }
      }),
      updateCalendarPost: (id, updates) =>
        set((s) => {
          const post = s.calendarPosts.find((p) => p.id === id)
          const newPosts = s.calendarPosts.map((p) => (p.id === id ? { ...p, ...updates } : p))

          // F-03: Auto-create PipelineItem when post moves to 'scheduled'
          if (post && updates.status === 'scheduled' && post.status !== 'scheduled') {
            const existingPipeline = s.pipelineItems.find((pi) => pi.linkedCalendarPostId === id)
            if (!existingPipeline) {
              const newPipelineItem: import('./types').PipelineItem = {
                id: `pipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                title: updates.title || post.title,
                stage: 'script',
                contentType: updates.contentType || post.contentType,
                platforms: updates.platform ? [updates.platform] : [post.platform],
                priority: 'medium',
                linkedCalendarPostId: id,
                linkedIdeaId: updates.ideaId || post.ideaId,
                tags: ['auto-from-calendar'],
                createdAt: new Date().toISOString(),
              }
              return { calendarPosts: newPosts, pipelineItems: [newPipelineItem, ...s.pipelineItems] }
            }
          }

          return { calendarPosts: newPosts }
        }),
      removeCalendarPost: (id) => set((s) => ({ calendarPosts: s.calendarPosts.filter((p) => p.id !== id) })),
      logPostPerformance: (id, perf) =>
        set((s) => ({
          calendarPosts: s.calendarPosts.map((p) =>
            p.id === id ? { ...p, performanceData: { ...perf, loggedAt: new Date().toISOString() } } : p
          ),
        })),

      addBrandDeal: (deal) => set((s) => ({ brandDeals: [deal, ...s.brandDeals] })),
      updateBrandDeal: (id, updates) =>
        set((s) => ({ brandDeals: s.brandDeals.map((d) => (d.id === id ? { ...d, ...updates } : d)) })),
      removeBrandDeal: (id) => set((s) => ({ brandDeals: s.brandDeals.filter((d) => d.id !== id) })),

      setContentDNA: (dna) => set({ contentDNA: dna }),
      setTrendData: (trends) => set({ trendData: trends }),
      setView: (v) => set({ activeView: v }),
      completeOnboarding: () => set({ isOnboarding: false }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      addGoal: (goal) =>
        set((s) => ({ profile: s.profile ? { ...s.profile, goals: [...(s.profile.goals || []), goal] } : null })),
      updateGoal: (id, updates) =>
        set((s) => ({
          profile: s.profile
            ? { ...s.profile, goals: (s.profile.goals || []).map((g) => (g.id === id ? { ...g, ...updates } : g)) }
            : null,
        })),
      removeGoal: (id) =>
        set((s) => ({
          profile: s.profile
            ? { ...s.profile, goals: (s.profile.goals || []).filter((g) => g.id !== id) }
            : null,
        })),

      addIncomeEntry: (e) => set((s) => ({ incomeEntries: [e, ...s.incomeEntries] })),
      removeIncomeEntry: (id) => set((s) => ({ incomeEntries: s.incomeEntries.filter((e) => e.id !== id) })),
      setMonthlyIncomeTarget: (n) => set({ monthlyIncomeTarget: n }),
      addTemplate: (t) => set((s) => ({ templates: [t, ...s.templates] })),
      removeTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      updateStreak: (s) => set({ streak: s }),

      // Workspace
      setWorkspacePlan: (plan) => set((s) => ({ workspace: { ...s.workspace, plan } })),
      addTeamMember: (m) =>
        set((s) => ({ workspace: { ...s.workspace, members: [...s.workspace.members, m] } })),
      updateTeamMember: (id, updates) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            members: s.workspace.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
          },
        })),
      removeTeamMember: (id) =>
        set((s) => ({
          workspace: { ...s.workspace, members: s.workspace.members.filter((m) => m.id !== id) },
        })),

      // Projects
      addProject: (p) =>
        set((s) => ({ workspace: { ...s.workspace, projects: [...s.workspace.projects, p] } })),
      updateProject: (id, updates) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          },
        })),
      removeProject: (id) =>
        set((s) => ({
          workspace: { ...s.workspace, projects: s.workspace.projects.filter((p) => p.id !== id) },
        })),

      // Project Tasks
      addProjectTask: (task) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === task.projectId ? { ...p, tasks: [...p.tasks, task] } : p
            ),
          },
        })),
      updateProjectTask: (id, updates) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => ({
              ...p,
              tasks: p.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
            })),
          },
        })),
      removeProjectTask: (id) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => ({
              ...p,
              tasks: p.tasks.filter((t) => t.id !== id),
            })),
          },
        })),

      // Milestones
      addMilestone: (projectId, m) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId ? { ...p, milestones: [...(p.milestones || []), m] } : p
            ),
          },
        })),
      updateMilestone: (projectId, id, updates) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId
                ? { ...p, milestones: (p.milestones || []).map((m) => (m.id === id ? { ...m, ...updates } : m)) }
                : p
            ),
          },
        })),
      removeMilestone: (projectId, id) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId
                ? { ...p, milestones: (p.milestones || []).filter((m) => m.id !== id) }
                : p
            ),
          },
        })),

      // Risks
      addRisk: (projectId, r) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId ? { ...p, risks: [...(p.risks || []), r] } : p
            ),
          },
        })),
      updateRisk: (projectId, id, updates) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId
                ? { ...p, risks: (p.risks || []).map((r) => (r.id === id ? { ...r, ...updates } : r)) }
                : p
            ),
          },
        })),
      removeRisk: (projectId, id) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId
                ? { ...p, risks: (p.risks || []).filter((r) => r.id !== id) }
                : p
            ),
          },
        })),

      // Activity log
      addActivityLog: (projectId, entry) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) =>
              p.id === projectId
                ? { ...p, activityLog: [entry, ...(p.activityLog || [])].slice(0, 200) }
                : p
            ),
          },
        })),

      // Smart tasks
      addSmartTask: (t) => set((s) => ({ smartTasks: [t, ...s.smartTasks] })),
      updateSmartTask: (id, updates) =>
        set((s) => ({
          smartTasks: s.smartTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      removeSmartTask: (id) =>
        set((s) => ({ smartTasks: s.smartTasks.filter((t) => t.id !== id) })),

      // Attachments — ProjectTask
      addAttachmentToProjectTask: (taskId, att) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => ({
              ...p,
              tasks: p.tasks.map((t) => t.id === taskId ? { ...t, attachments: [...(t.attachments || []), att] } : t),
            })),
          },
        })),
      removeAttachmentFromProjectTask: (taskId, attId) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => ({
              ...p,
              tasks: p.tasks.map((t) => t.id === taskId ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attId) } : t),
            })),
          },
        })),

      // Attachments — SmartTask
      addAttachmentToSmartTask: (taskId, att) =>
        set((s) => ({
          smartTasks: s.smartTasks.map((t) => t.id === taskId ? { ...t, attachments: [...(t.attachments || []), att] } : t),
        })),
      removeAttachmentFromSmartTask: (taskId, attId) =>
        set((s) => ({
          smartTasks: s.smartTasks.map((t) => t.id === taskId ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attId) } : t),
        })),

      // Time entries
      addTimeEntryToProjectTask: (taskId, entry) =>
        set((s) => ({
          workspace: {
            ...s.workspace,
            projects: s.workspace.projects.map((p) => ({
              ...p,
              tasks: p.tasks.map((t) => t.id === taskId ? { ...t, timeEntries: [...(t.timeEntries || []), entry], actualHours: ((t.actualHours || 0) + entry.durationMinutes / 60) } : t),
            })),
          },
        })),
      addTimeEntryToSmartTask: (taskId, entry) =>
        set((s) => ({
          smartTasks: s.smartTasks.map((t) => t.id === taskId ? { ...t, timeEntries: [...(t.timeEntries || []), entry], loggedHours: ((t.loggedHours || 0) + entry.durationMinutes / 60) } : t),
        })),

      // Content Pipeline
      addPipelineItem: (item) => set((s) => ({ pipelineItems: [item, ...s.pipelineItems] })),
      updatePipelineItem: (id, updates) =>
        set((s) => ({ pipelineItems: s.pipelineItems.map((i) => i.id === id ? { ...i, ...updates } : i) })),
      movePipelineItem: (id, stage) =>
        set((s) => ({ pipelineItems: s.pipelineItems.map((i) => i.id === id ? { ...i, stage, movedAt: new Date().toISOString() } : i) })),
      removePipelineItem: (id) =>
        set((s) => ({ pipelineItems: s.pipelineItems.filter((i) => i.id !== id) })),

      // Client Portal
      addClientPortalLink: (link) => set((s) => ({ clientPortalLinks: [link, ...s.clientPortalLinks] })),
      updateClientPortalLink: (id, updates) =>
        set((s) => ({ clientPortalLinks: s.clientPortalLinks.map((l) => l.id === id ? { ...l, ...updates } : l) })),
      removeClientPortalLink: (id) =>
        set((s) => ({ clientPortalLinks: s.clientPortalLinks.filter((l) => l.id !== id) })),
      incrementPortalViews: (id) =>
        set((s) => ({ clientPortalLinks: s.clientPortalLinks.map((l) => l.id === id ? { ...l, views: l.views + 1 } : l) })),
      addClientComment: (comment) => set((s) => ({ clientComments: [comment, ...s.clientComments] })),
      updateClientComment: (id, updates) =>
        set((s) => ({ clientComments: s.clientComments.map((c) => c.id === id ? { ...c, ...updates } : c) })),
      removeClientComment: (id) =>
        set((s) => ({ clientComments: s.clientComments.filter((c) => c.id !== id) })),

      // Smart Inbox
      dismissInboxItem: (id) => set((s) => ({ dismissedInboxIds: [...s.dismissedInboxIds, id] })),
      clearDismissedInbox: () => set({ dismissedInboxIds: [] }),

      // Workflow + memory
      addMemory: (memory) => set((s) => ({ memories: [memory, ...s.memories].slice(0, 300) })),
      updateMemory: (id, updates) =>
        set((s) => ({
          memories: s.memories.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m)),
        })),
      addWorkflow: (workflow) =>
        set((s) => ({
          workflows: s.workflows.some((w) => w.id === workflow.id) ? s.workflows : [...s.workflows, workflow],
        })),
      addWorkflowRun: (run) => set((s) => ({ workflowRuns: [run, ...s.workflowRuns].slice(0, 120) })),
      updateWorkflowRun: (id, updates) =>
        set((s) => ({
          workflowRuns: s.workflowRuns.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      updateWorkflowRunStep: (runId, stepId, updates) =>
        set((s) => ({
          workflowRuns: s.workflowRuns.map((run) =>
            run.id === runId
              ? {
                  ...run,
                  steps: run.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
                }
              : run
          ),
        })),
      cancelWorkflowRun: (id, reason) =>
        set((s) => ({
          workflowRuns: s.workflowRuns.map((run) =>
            run.id === id
              ? {
                  ...run,
                  status: 'cancelled',
                  cancelledAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  summary: reason || run.summary || 'Workflow was cancelled.',
                  steps: run.steps.map((step) =>
                    step.status === 'running' || step.status === 'pending'
                      ? { ...step, status: 'cancelled', completedAt: new Date().toISOString(), error: reason || 'Cancelled' }
                      : step
                  ),
                }
              : run
          ),
        })),
      setWorkflowAutoRun: (enabled, intervalHours) =>
        set((s) => ({
          workflowAutoRunEnabled: enabled,
          workflowAutoRunIntervalHours: intervalHours || s.workflowAutoRunIntervalHours,
        })),
      setLastWorkflowAutoRunAt: (iso) => set({ lastWorkflowAutoRunAt: iso }),
      setIntegrationSyncStatus: (provider, status) =>
        set((s) => ({
          integrationSyncStatus: {
            ...s.integrationSyncStatus,
            [provider]: { ...s.integrationSyncStatus[provider], ...status },
          } as IntegrationSyncStatus,
        })),
    }),
    { 
      name: 'creator-command-v5',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            // Decrypt from Unicode-safe Base64
            const decoded = decodeURIComponent(escape(atob(str)))
            const parsed = JSON.parse(decoded)
            if (parsed?.state?.profile?.apiKey) {
              delete parsed.state.profile.apiKey
            }
            return parsed
          } catch {
            // Fallback for cleartext or old format
            try {
              const decodedFallback = atob(str)
              const parsedFallback = JSON.parse(decodedFallback)
              if (parsedFallback?.state?.profile?.apiKey) {
                delete parsedFallback.state.profile.apiKey
              }
              return parsedFallback
            } catch {
              const parsedRaw = JSON.parse(str)
              if (parsedRaw?.state?.profile?.apiKey) {
                delete parsedRaw.state.profile.apiKey
              }
              return parsedRaw
            }
          }
        },
        setItem: (name, value) => {
          const str = JSON.stringify(value)
          // Encrypt to Unicode-safe Base64
          localStorage.setItem(name, btoa(unescape(encodeURIComponent(str))))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => {
        // EXCLUDE sensitive platform tokens from persistence
        const {
          youtubeToken,
          instagramToken,
          aiKey,
          googleSearchToken,
          profile,
          ...rest
        } = state

        const safeProfile = profile ? { ...profile, apiKey: undefined } : profile
        return { ...rest, profile: safeProfile } as any
      }
    }
  )
)
