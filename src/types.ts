export type Platform = 'instagram' | 'youtube' | 'linkedin' | 'twitter'
export type ContentType = 'reel' | 'carousel' | 'post' | 'video' | 'thread' | 'article' | 'story'
export type IdeaStatus = 'inbox' | 'planned' | 'creating' | 'done'
export type PostStatus = 'draft' | 'scheduled' | 'published'

export interface CreatorProfile {
  name: string
  handles: { platform: Platform; handle: string; followerCount: number }[]
  niche: string
  strengths: string
  inspirations: string
  tone: string[]
  contentLanguage: 'english' | 'hindi' | 'hinglish'
  goals: Goal[]
  apiKey?: string
  youtubeApiKey?: string
  youtubeChannelId?: string
  instagramAccessToken?: string
  instagramBusinessAccountId?: string
  emailSubscribers?: number
  smsSubscribers?: number
}

export interface Goal {
  id: string
  type: 'followers' | 'engagement' | 'revenue' | 'volume' | 'custom'
  platform: Platform
  label: string
  currentValue: number
  targetValue: number
  targetDate: string
  status: 'active' | 'completed' | 'paused'
}

export interface ScoreBreakdown {
  hookStrength: number
  nicheRelevance: number
  trendAlignment: number
  engagementPotential: number
  channelFit: number
  uniqueness: number
}

export interface ContentIdea {
  id: string
  title: string
  hook: string
  contentType: ContentType
  platforms: Platform[]
  aiScore: number
  scoreBreakdown: ScoreBreakdown
  status: IdeaStatus
  source: 'ai_generated' | 'manual' | 'trend_based'
  tags: string[]
  createdAt: string
}

export interface CalendarPost {
  id: string
  title: string
  platform: Platform
  contentType: ContentType
  status: PostStatus
  scheduledAt: string
  ideaId?: string
  aiScore?: number
  notes?: string
  performanceData?: PostPerformance
  publishResult?: {
    success: boolean
    platformId?: string
    error?: string
    publishedAt?: string
  }
}

export interface PostPerformance {
  views: number
  likes: number
  comments: number
  saves: number
  shares: number
  engagementRate?: number
  loggedAt?: string
}

export interface BrandDeal {
  id: string
  brand: string
  platform: Platform
  status: 'prospect' | 'negotiating' | 'contracted' | 'live' | 'completed' | 'declined'
  value: number
  deliverables: string
  deadline?: string
  notes?: string
  category?: string
  createdAt: string
}

export interface ContentDNAResult {
  hookPatterns: { pattern: string; frequency: number }[]
  toneFingerprint: string[]
  contentPillars: { pillar: string; percentage: number; color: string }[]
  avgPostLength: string
  bestFormats: string[]
  audienceTriggers: string[]
  uniqueVoiceMarkers: string[]
  postingRhythm: string
  generatedAt: string
}

export interface Festival {
  date: string
  name: string
  type: 'national' | 'regional' | 'creator'
}

export interface TrendItem {
  id: string
  topic: string
  velocity: number
  category: string
  platform: Platform[]
  relevanceScore: number
  peakDate?: string
  relatedKeywords: string[]
  isAlert: boolean
}

export interface IncomeEntry {
  id: string
  source: 'brand_deal' | 'adsense' | 'affiliate' | 'subscription' | 'product' | 'other'
  platform: Platform | 'all'
  amount: number
  label: string
  date: string
  notes?: string
}

export interface Product {
  id: string
  name: string
  type: 'course' | 'ebook' | 'template' | 'coaching'
  price: number
  sales: number
  status: 'active' | 'draft'
  revenue: number
}


export interface ContentTemplate {
  id: string
  name: string
  category: string
  description: string
  framework: { label: string; description: string; placeholder: string }[]
  contentType: ContentType
  platforms: Platform[]
  usageCount: number
  isCustom: boolean
  createdAt: string
}

export interface CreatorStreak {
  current: number
  longest: number
  lastDate: string
}

// ── Pricing Tier ─────────────────────────────────────────────────────────────
export type PricingTier = 'free' | 'creator' | 'pro' | 'agency'

// ── Workspace & Project Types ─────────────────────────────────────────────────

export type WorkspacePlan = 'personal' | 'pro'
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'
export type ProjectType = 'monthly' | 'one-off' | 'ongoing'
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'
export type MilestoneStatus = 'upcoming' | 'in-progress' | 'completed' | 'delayed'
export type RiskStatus = 'open' | 'mitigated' | 'accepted' | 'closed'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: MemberRole
  avatar?: string
  joinedAt: string
}

export interface ChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface TaskComment {
  id: string
  authorName: string
  body: string
  createdAt: string
}

export interface ProjectTask {
  id: string
  projectId: string
  title: string
  description?: string
  ownerId?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: string
  eta?: string
  milestoneId?: string
  estimatedHours?: number
  actualHours?: number
  storyPoints?: number
  tags: string[]
  checklist?: ChecklistItem[]
  comments?: TaskComment[]
  attachments?: FileAttachment[]
  timeEntries?: TimeEntry[]
  dependencies?: TaskDependency[]
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  createdAt: string
  completedAt?: string
  reminderSent?: boolean
}

export type ProjectTemplateId = 'blank' | 'marketing-campaign' | 'product-launch' | 'content-calendar' | 'brand-deal' | 'event-planning' | 'sprint'

export interface ProjectTemplate {
  id: ProjectTemplateId
  name: string
  description: string
  icon: string
  defaultMilestones: { title: string; daysFromStart: number }[]
  defaultTasks: { title: string; status: TaskStatus; priority: TaskPriority }[]
}

export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  dueDate: string
  status: MilestoneStatus
  linkedTaskIds: string[]
  createdAt: string
}

export interface Risk {
  id: string
  projectId: string
  title: string
  description?: string
  probability: 1 | 2 | 3 | 4 | 5
  impact: 1 | 2 | 3 | 4 | 5
  mitigation?: string
  ownerId?: string
  status: RiskStatus
  createdAt: string
}

export interface ActivityLog {
  id: string
  actorName: string
  action: string
  entityType: 'task' | 'milestone' | 'risk' | 'project' | 'member'
  entityTitle: string
  timestamp: string
  meta?: Record<string, unknown>
}

export interface Project {
  id: string
  name: string
  description?: string
  type: ProjectType
  status: ProjectStatus
  members: string[]
  tasks: ProjectTask[]
  milestones: Milestone[]
  risks: Risk[]
  activityLog: ActivityLog[]
  color: string
  icon?: string
  startDate?: string
  endDate?: string
  budget?: number
  spentBudget?: number
  createdAt: string
  createdBy: string
}

export interface Workspace {
  id: string
  name: string
  plan: WorkspacePlan
  members: TeamMember[]
  projects: Project[]
  createdAt: string
}

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  dataUrl: string
  uploadedAt: string
  uploadedBy: string
}

export type DependencyType = 'blocks' | 'blocked-by' | 'relates-to' | 'duplicate'

export interface TaskDependency {
  id: string
  fromTaskId: string
  toTaskId: string
  type: DependencyType
}

export interface TimeEntry {
  id: string
  taskId: string
  durationMinutes: number
  note?: string
  loggedAt: string
  loggedBy: string
}

export interface SmartTask {
  id: string
  title: string
  notes?: string
  priority: TaskPriority
  status: TaskStatus
  startDate?: string
  dueDate?: string
  estimatedHours?: number
  loggedHours?: number
  storyPoints?: number
  checklist?: ChecklistItem[]
  attachments?: FileAttachment[]
  timeEntries?: TimeEntry[]
  dependencies?: TaskDependency[]
  recurrence?: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly'
  tags: string[]
  projectId?: string
  milestoneId?: string
  assigneeId?: string
  meetUrl?: string
  linkedPostId?: string
  plannedDate?: string
  plannedTimeStart?: string
  createdAt: string
  completedAt?: string
}

// ── Content Pipeline ──────────────────────────────────────────────────────────

export type PipelineStage = 'idea' | 'script' | 'filming' | 'editing' | 'review' | 'published'

export interface PipelineItem {
  id: string
  title: string
  stage: PipelineStage
  contentType: ContentType
  platforms: Platform[]
  assigneeId?: string
  dueDate?: string
  linkedIdeaId?: string
  linkedCalendarPostId?: string
  linkedProjectTaskId?: string
  notes?: string
  tags: string[]
  priority: TaskPriority
  thumbnailPrompt?: string
  createdAt: string
  movedAt?: string
}

// ── Client Portal ─────────────────────────────────────────────────────────────

export interface ClientPortalLink {
  id: string
  projectId: string
  token: string
  label: string
  allowComments: boolean
  expiresAt?: string
  createdAt: string
  createdBy: string
  views: number
}

export interface ClientComment {
  id: string
  portalId: string
  projectId: string
  authorName: string
  body: string
  taskId?: string
  status: 'pending' | 'approved' | 'dismissed'
  createdAt: string
}

// ── Workflow Engine + Memory ────────────────────────────────────────────────

export type MemoryKind = 'fact' | 'insight' | 'decision' | 'artifact'

export interface AgentMemory {
  id: string
  kind: MemoryKind
  title: string
  content: string
  tags: string[]
  source: string
  confidence: number
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
}

export type WorkflowStepType = 'gather_context' | 'trend_analysis' | 'idea_generation' | 'calendar_plan'
export type WorkflowRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface WorkflowStepDefinition {
  id: string
  title: string
  type: WorkflowStepType
  promptTemplate?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  trigger: 'manual' | 'scheduled'
  steps: WorkflowStepDefinition[]
  createdAt: string
}

export interface WorkflowStepRun {
  id: string
  title: string
  type: WorkflowStepType
  status: WorkflowStepStatus
  attemptCount?: number
  retryCount?: number
  startedAt?: string
  completedAt?: string
  output?: string
  error?: string
}

export interface WorkflowRun {
  id: string
  workflowId: string
  workflowName: string
  objective?: string
  status: WorkflowRunStatus
  startedAt: string
  completedAt?: string
  cancelledAt?: string
  steps: WorkflowStepRun[]
  summary?: string
  artifacts?: {
    trendSummary?: string
    generatedIdeas?: string[]
    calendarPlan?: string
    createdPostIds?: string[]
    createdTaskIds?: string[]
  }
  error?: string
}

export interface IntegrationSyncStatus {
  youtube: { status: 'idle' | 'success' | 'error'; lastSyncAt?: string; message?: string }
  instagram: { status: 'idle' | 'success' | 'error'; lastSyncAt?: string; message?: string }
  web: { status: 'idle' | 'success' | 'error'; lastSyncAt?: string; message?: string }
  ai: { status: 'idle' | 'success' | 'error'; lastSyncAt?: string; message?: string }
}
