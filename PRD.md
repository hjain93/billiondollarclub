# Creator Command — Product Requirements Document
**Type:** Reverse PRD (Post-Development + Forward Roadmap)
**Version:** 2.0
**Date:** March 2026
**Product:** Creator Command — The All-in-One Creator Operating System
**Repository:** `/Users/harshitjain/Documents/creator-command`

---

## Executive Summary

Creator Command is a comprehensive creator productivity and intelligence platform for content creators, YouTubers, Instagram creators, podcasters, and digital entrepreneurs. It replaces 8–12 fragmented tools (Notion, Buffer, TubeBuddy, Canva, Google Sheets, Linktree, Hootsuite, etc.) with a single OLED-optimized command center.

The product is built as a React SPA designed for desktop/laptop use during creative work sessions. It targets serious creators with 500+ followers who want to professionalize their content operation, while also providing a clear onboarding ramp for new creators.

---

## Product Vision

**Mission:** Give every creator the infrastructure of a media company, accessible from one command center.

**Vision:** Become the "Notion for Creators" — the single workspace where every creative decision, content piece, brand relationship, and business metric is managed, planned, and optimized.

**Tagline:** *"The command center for world-class creators"*

**Design Philosophy:** OLED-dark, spring-physics animations, no unnecessary chrome. Every pixel earns its place. Speed is a feature.

---

## Target Users

### Persona 1: The Growing Creator (Primary)
- **Followers:** 5K–500K across 1–2 platforms
- **Posting cadence:** 3–5×/week
- **Monthly revenue:** ₹10,000–₹3,00,000
- **Pain:** Juggling Notion + Google Sheets + Buffer + multiple AI tools, no unified system
- **Goal:** Systematize the content operation, grow faster, earn more
- **Key jobs-to-be-done:** Plan content week ahead, repurpose efficiently, close more brand deals

### Persona 2: The New Creator (Acquisition & Top-of-Funnel)
- **Followers:** 0–5K
- **Monthly revenue:** ₹0–₹10,000
- **Pain:** Doesn't know what niche to pick, what gear to buy, how to structure content
- **Goal:** Get to first 1,000 followers with a clear strategy
- **Key jobs-to-be-done:** Discover niche, get gear recommendations, create first 30 days of content

### Persona 3: The Pro Creator / Agency
- **Followers:** 500K+ or managing multiple accounts
- **Monthly revenue:** ₹3L+
- **Pain:** Can't scale brand deal management, client updates are manual, team coordination is broken
- **Goal:** Run the creative business like a company
- **Key jobs-to-be-done:** Client portal for deliverables, project management, team task assignment

---

## Core Value Propositions

1. **Unified Creative OS** — Plan → Create → Publish → Analyze → Monetize, all in one place
2. **AI That Knows You** — Content DNA and brand kit flow into every AI generation. No re-entering context.
3. **Production Velocity** — From idea to full production brief in under 60 seconds with AI
4. **Business Infrastructure** — Brand deals CRM, income tracking, client portal, project management — the tools creators graduate to needing
5. **New Creator Ramp** — Niche finder, gear guide, channel audit, and 30-day bootcamp make the zero-to-creator journey structured

---

## Technical Architecture

### Stack
| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 8 |
| Language | TypeScript (strict, `noUnusedLocals: true`) |
| State | Zustand with persist middleware (key: `creator-command-v5`) |
| Animations | Framer Motion (spring physics + micro-interactions) |
| Icons | Lucide React (exclusively — no emojis as UI icons) |
| AI | Claude Haiku 4.5 via Anthropic API (browser direct) |
| Styling | Custom CSS class system (no Tailwind) |
| Fonts | Plus Jakarta Sans + Space Mono (Google Fonts) |

### Design System
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#080810` | Page background (OLED black) |
| Surface 1 | `#0d0d1a` | Sidebar, panel backgrounds |
| Surface 2 | `#111122` | Cards, modals |
| Electric Blue | `#3b82f6` | Primary action, active nav, links |
| Hot Pink | `#ec4899` | AI features, secondary CTA |
| Orange | `#f97316` | Alerts, streaks, urgency |
| Emerald | `#10b981` | Success, published, done |
| Amber | `#f59e0b` | Ideas, warnings, draft |
| Cyan | `#06b6d4` | Planning, timestamps, data |
| Violet | `#a78bfa` | Research, personas, creative |
| Text Primary | `#f0f4ff` | Headings |
| Text Secondary | `#94a3b8` | Body |
| Text Muted | `#6b7a9a` | Labels |
| Text Dim | `#4b5680` | Placeholders |

### CSS Class System
```
.card                     — surface card with border-radius 12px
.btn .btn-blue .btn-pink .btn-ghost .btn-orange  — button variants
.btn-sm .btn-xs           — size modifiers
.badge .badge-gold .badge-blue .badge-amber .badge-red  — status badges
.field                    — input/select/textarea
.tab-bar .tab .tab.active — tab navigation
.sec-label                — section label (small caps)
.pb .pb-ig .pb-yt .pb-li .pb-tw  — platform post blocks
.day-cell .is-today       — calendar cells
.more-pill               — calendar overflow pill
.fest-badge              — festival badge (gold border-left)
.status-draft .status-scheduled .status-published — post status
.urgency-high .urgency-medium .urgency-low — priority dots
.empty-state             — empty state container
.scale-in                — entrance animation
```

### Animation Patterns
- **Drawers/Overlays:** spring `{type:'spring', stiffness:300, damping:28}` from `x:'100%'`
- **Page transitions:** `{duration:0.12}` with `y:6` drift
- **Micro-interactions:** `150ms ease`
- **Entrance stagger:** children animate with `delay: index * 0.05`
- **Loading:** `spin 1s linear infinite` + `pulse 1.5s infinite`

### AI Integration
- **Model:** `claude-haiku-4-5` (fast response, low latency)
- **Auth header:** `anthropic-dangerous-direct-browser-access: true`
- **API key:** stored in `profile.apiKey` (user-provided in Settings modal)
- **Fallback:** all features have realistic hardcoded demo data when no API key is present
- **Pattern:** parse JSON from Claude response with regex fallback

---

## Feature Inventory

### Navigation Architecture
| Group Label | Route IDs | Phase |
|-------------|-----------|-------|
| Command | `command-center`, `idea-engine` | 1 |
| Creation | `calendar`, `planner`, `studio`, `pipeline` | 2 |
| Intelligence | `analytics`, `trends`, `content-dna`, `brand-deals`, `goals`, `income`, `templates`, `visual-prompts` | 3 |
| Production | `video-brief`, `thumbnail-lab`, `clip-finder`, `brand-kit`, `gear-guide` | 5 |
| Audience | `engagement`, `audit` | 5 |
| Monetize | `monetize` | 5 |
| Workspace | `inbox`, `projects`, `tasks`, `client-portal` | 4 |

---

## Phase 1: Command Layer

### 1.1 Command Center (`/command-center`)
The operational dashboard — the first thing a creator sees daily.

**Components:**
- **Creator Score Ring** — composite 0–100 score: posting consistency (25%) + engagement trend (25%) + goal progress (25%) + income growth (25%)
- **Today's Focus** — today's scheduled posts, tasks due, active brand deals approaching deadline
- **Quick Stats Bar** — streak days, monthly income, ideas in bank, tasks due today
- **Recent Ideas** — last 5 ideas with quick status-change buttons
- **Active Goals** — top 2 goals with progress bars

**UX Notes:** No editing on this screen. Pure dashboard. All items link to their respective views.

---

### 1.2 Idea Engine (`/idea-engine`)
AI-powered content idea generator and idea management system.

**Features:**
- **AI Generation** — inputs: niche, tone (6 options), platform, freshness toggle → Claude generates 5 scored ideas
- **Score Engine** — 6-dimension score: hook strength / niche relevance / trend alignment / engagement potential / channel fit / uniqueness
- **Score Breakdown** — expandable per-dimension breakdown with colored bars
- **Idea Bank** — kanban-style flow: inbox → planned → creating → done
- **Status Actions** — quick drag or button to move between statuses
- **Quick Capture** — global floating `+` button (QuickCapture.tsx) to capture ideas from anywhere in the app
- **Idea Tags** — custom tagging system
- **Source Tracking** — `ai_generated` / `manual` / `trend_based`

**Data Model:** `ContentIdea { id, title, hook, contentType, platforms, aiScore, scoreBreakdown, status, source, tags, createdAt }`

---

## Phase 2: Creation Layer

### 2.1 Content Calendar (`/calendar`)
Visual month-view calendar for scheduling and planning content.

**Features:**
- **Month Grid** — day cells showing scheduled posts as platform-colored chips
- **Ideas Sidebar** — 256px sticky panel with Inbox / Planned / Top-rated tabs
- **+Cal Action** — hover idea card to reveal "schedule to calendar" button
- **Festival Markers** — India + SEA festival badges on relevant dates (`fest-badge` class)
- **Today Cell** — gradient top bar on current date cell (`is-today`)
- **Post Detail Click** — click any post chip to edit title, platform, content type, status, notes
- **More Pill** — "+N more" overflow button for days with >3 posts
- **Post Status Colors** — draft=amber, scheduled=blue, published=emerald

**Key Pattern:** Ported from `escapes-asia-calendar.html` reference design — post block hover slide (`translateX(3px)`), gradient today bar.

---

### 2.2 Daily Planner (`/planner`)
Time-block scheduler for creator work sessions. Distinct from the content calendar — this is *when* you do things, not *what* you publish.

**Features:**
- **8 Activity Types** — filming / editing / research / posting / engagement / planning / break / other — each with distinct color
- **Time Block UI** — visual timeline of the day with blocks at 30-min resolution
- **Week Strip** — navigate between days with 7-day strip above the timeline
- **Focus Mode Tab** — minimal view showing today's blocks without navigation chrome
- **Smart Tasks Sync** — Shows tasks from Smart Tasks where `plannedDate === selectedDate` or `dueDate === selectedDate` in a "Smart Tasks" sidebar section
- **Storage** — localStorage key `creator-daily-activities` (separate from Zustand for performance)

---

### 2.3 Creation Studio (`/studio`)
7-tab AI-powered content creation workshop. The heaviest-used feature for active creators.

#### Tab 1: Script Writer
- **Inputs:** topic, duration (15s/30s/1m/3m/10m), tone (6 options), platform, target audience, hook style (6 types), reference content
- **Output:** Structured script with color-coded sections: `[HOOK]` (pink), `[SETUP]` (blue), `[BODY]` (cyan), `[CTA]` (orange)
- **A/B Hooks** — toggle to generate two hook alternatives; switch between A/B
- **Teleprompter Mode** — fullscreen scrolling script reader with speed control (1×–5×)
- **Per-section Regeneration** — regenerate any individual section independently
- **Content DNA Integration** — checkbox "Use my Content DNA" injects voice patterns into generation prompt

#### Tab 2: Caption Lab
- **Swipeable card UI** — one caption visible at a time, ChevronLeft/Right navigation + keyboard arrow keys
- **5 caption variants** per generation (different tones + lengths)
- **Tone selector** — witty / educational / personal / promotional / question
- **Copy button** per caption

#### Tab 3: Carousel Creator
- **Slide count** selector (3–10 slides)
- **Format** picker — educational / story / listicle / tips
- **Output** — headline + body per slide, sequenced for flow
- **Download** — copy all slides as structured text

#### Tab 4: Repurpose Engine
- **Input** — paste original script or video transcript
- **Platform selection** — IG / YT / Twitter / LinkedIn multi-select
- **Output** — reformatted content per platform with mockup preview frames
- **Platform frames** — branded container mockups (IG pink, YT red, Twitter blue, LinkedIn blue)

#### Tab 5: Hashtags (HashtagStrategy)
- Niche + platform + topic → tiered hashtag sets (mega / large / medium / niche)
- Copy by tier or copy all

#### Tab 6: Hook Library *(New in v2)*
- **200+ hooks** organized by type: Curiosity / Controversy / Value / Story / Fear / Social Proof
- **Filters** — by type and platform (YouTube / TikTok / Instagram / LinkedIn)
- **Search** — full-text search across formulas and examples
- **Swipe File** — bookmark hooks to a saved collection (localStorage `creator-saved-hooks`)
- **AI Personalizer** — select any hook formula → AI adapts it to your niche and voice

#### Tab 7: Video Chapters *(New in v2)*
- **Input** — paste video script or transcript + optional title
- **Chapter count** — 5 / 7 / 10 / 12 options
- **Output** — timestamped chapter list with title + 1-line description
- **Inline editing** — click any chapter title to edit
- **Copy for YouTube** — formats as `0:00 Chapter Title` lines for YouTube description box

---

### 2.4 Content Pipeline (`/pipeline`)
6-stage drag-and-drop kanban for tracking content through production.

**Stages:** Idea → Script → Filming → Editing → Review → Published

**Features:**
- **HTML5 Drag-and-Drop** — draggable cards between columns
- **Platform + Priority Filters** — filter view by platform and priority level
- **Move Menu** — `⋯` button per card for dropdown stage navigation
- **Due Date Coloring** — overdue=red, ≤2 days=orange, normal=default
- **Quick Add** — add pipeline item from any column header
- **Card Info** — platform badge, priority badge, due date, assignee

**Data Model:** `PipelineItem { id, title, stage, platform, priority, dueDate, description, tags }`

---

## Phase 3: Intelligence Layer

### 3.1 Analytics (`/analytics`)
Performance metrics dashboard and post-performance logging.

**Features:**
- Platform performance overview (views, likes, comments, saves per platform)
- Post performance log — manually log actual metrics against a calendar post
- Engagement rate calculator
- Best performing content breakdown by format
- Platform comparison charts
- Growth rate visualization (week-over-week)

---

### 3.2 Trend Radar (`/trends`)
Real-time trend detection and content angle generation.

**Features:**
- Trending topics with velocity scores (0–100)
- Category filters (tech, lifestyle, finance, gaming, food, etc.)
- Platform-specific trend breakdown
- Alert system — high-velocity items flagged with `isAlert` badge
- Content angle AI suggestions per trend
- Related keywords per trending topic

---

### 3.3 Content DNA (`/content-dna`)
Voice analysis and content pattern profiling.

#### Tab 1: My Content DNA
Shows generated DNA profile:
- Hook pattern analysis (frequency-ranked patterns)
- Tone fingerprint (top tone adjectives)
- Content pillars (percentage breakdown, color-coded)
- Average post length, best-performing formats
- Audience triggers, unique voice markers
- Posting rhythm description

#### Tab 2: Profile Analyzer
- **YouTube path** — YouTube Data API v3 real fetch via channel URL → Claude analysis
- **Instagram path** — manual paste of post data → Claude analysis
- Generates `ContentDNAResult` and saves to store

---

### 3.4 Brand Deals (`/brand-deals`)
Sponsorship pipeline CRM for managing creator-brand relationships.

**Features:**
- **Pipeline Status** — Prospect → Negotiating → Contracted → Live → Completed / Declined
- **Deal Cards** — brand, platform, value (₹), deadline, deliverables, notes, category
- **Revenue Summary** — total contracted, earned this month, pipeline value
- **Rate Calculator** — what to charge based on followers × engagement formula
- **Deadline Alerts** — deals approaching deadline highlighted in Smart Inbox
- **Quick Add Modal**

**Data Model:** `BrandDeal { id, brand, platform, status, value, deliverables, deadline, notes, category, createdAt }`

---

### 3.5 Goals (`/goals`)

#### Tab 1: Goals
- Goal types — followers / engagement / revenue / volume / custom
- Progress bars (current vs target)
- Platform indicators per goal
- Status: active / completed / paused
- Target date tracking

#### Tab 2: AI Growth Plan
- Inputs — primary goal, content focus, time commitment per week
- Output — 30/60/90-day week-by-week plan with posts + tasks + KPIs per week
- Downloadable structured plan

---

### 3.6 Income Tracker (`/income`)
Revenue tracking, forecasting, and affiliate management.

#### Tab 1: Income Log
- **Income Streams** — brand_deal / adsense / affiliate / subscription / product / other
- **Monthly View** — income entries by month with running total
- **Target Progress** — visual goal bar toward `monthlyIncomeTarget`
- **Stream Breakdown** — bar chart-style breakdown by revenue source
- **Add Entry** — modal with source, amount, notes, date

#### Tab 2: Affiliate Links *(New in v2)*
- **Link Manager** — store affiliate links with brand, URL, commission %, cookie window
- **Performance Tracking** — estimated monthly revenue per link
- **Best Performer** — highlighted top earner
- **Platform Placement Tips** — YouTube description / Instagram bio / Pinned comment strategies
- **Status** — active / paused / expired
- **Stored in** `localStorage: 'creator-affiliate-links'`

---

### 3.7 Templates (`/templates`)
Creator content framework library.

**Features:**
- Pre-built templates by category: hook / caption / thread / description / bio / pitch
- Platform filters
- Custom template creation
- Copy-to-clipboard
- AI template fill — paste your topic to fill the template

---

### 3.8 Visual Prompts (`/visual-prompts`)
AI image generation prompt builder for creator content.

**Features:**
- **6 AI Tools** — Midjourney / Gemini / Stitch / DALL-E / Stable Diffusion / Runway
- **8 Content Formats** with aspect ratios (1:1 feed, 9:16 reel, 16:9 YouTube thumbnail, 4:5 portrait, etc.)
- **12 Style Presets** — cinematic, anime, photorealistic, flat illustration, etc.
- **Tool-specific Syntax** — output properly formatted prompts per tool (e.g., Midjourney `--ar 16:9 --v 6.1`)
- **Brand Kit Integration** — auto-injects brand colors and style when brand kit is saved

---

## Phase 4: Workspace Layer

### 4.1 Smart Inbox (`/inbox`)
AI-triaged notification center. Sidebar shows red badge with unread count.

**Alert Types (Auto-generated):**
| Type | Trigger |
|------|---------|
| `overdue-task` | SmartTask/ProjectTask past due date, not done |
| `deal-deadline` | BrandDeal deadline ≤3 days away |
| `idea-stale` | ContentIdea in inbox status for ≥7 days |
| `goal-behind` | Goal progress <50% with <50% of time remaining |
| `streak-risk` | No published post today + streak active |
| `project-blocked` | ProjectTask with status `blocked` |
| `no-post-today` | No CalendarPost scheduled for today |

**Features:**
- Priority levels — critical / high / medium / low
- Per-item dismiss (`dismissInboxItem` action)
- Health sidebar — quick counts by category
- Priority filter bar
- Clear all dismissed option

---

### 4.2 Projects (`/projects`)
Enterprise project management for content and business projects.

**5-Tab View:**
1. **Overview** — health score ring, project summary, team, budget vs spent
2. **Tasks** — full task list with filters, task detail drawer
3. **Milestones** — timeline of key deliverables with status
4. **Risks** — risk register with probability × impact matrix
5. **Activity** — chronological activity log

**Features:**
- **Health Score Ring** — composite score: milestone completion + risk level + task completion + team activity
- **NLP Smart Dates** — natural language date parsing ("next Thursday", "in 2 weeks")
- **Task Detail Drawer** — full editing: checklist, comments, time tracking, file attachments, milestone link
- **Google Meet Integration** — one-click Google Calendar Meet event creation (TEMPLATE URL)
- **AI Task Breakdown** — Claude breaks any task into 5–7 subtasks automatically
- **SmartTask Sync** — sync project tasks to/from Smart Tasks view
- **Budget Tracking** — project budget vs spent visualization

---

### 4.3 Smart Tasks (`/tasks`)
Personal task manager with multiple views optimized for creator workflows.

**4 View Modes:**
1. **List** — filterable sortable task list with project + priority badges
2. **Board** — 5-column CSS grid kanban (backlog / todo / in-progress / review / done) — no horizontal scroll
3. **Timeline** — Gantt-style date range bars per task
4. **Matrix** — Eisenhower 2×2 (Urgent+Important / Important / Urgent / Neither) — full-width grid, no overflow

**Features:**
- **Filter Bar** — by project, priority, tag, status
- **Task Detail Drawer** — checklist, time tracker, project link, content post link, reminders
- **Add to Planner** — pins task to DailyPlanner for today's date (`plannedDate = today`)
- **Schedule Meet** — opens Google Calendar with Meet template
- **Content Post Link** — link task to a CalendarPost; shows performance data if logged
- **Board/Matrix Layout** — CSS Grid `repeat(5, 1fr)` / `repeat(2, 1fr)` — eliminates horizontal scroll

---

### 4.4 Client Portal (`/client-portal`)
Shareable read-only project progress pages for clients.

**Features:**
- **Token URLs** — generate `portal_${randomToken}` shareable links per project
- **Read-only Client View** — project progress, milestones, task status breakdown
- **Comment System** — clients submit → creator approves/dismisses in portal
- **Expiry Dates** — set link expiry with visual countdown
- **View Count** — `incrementPortalViews` tracks link opens
- **Allow/Disable Comments** — per-link toggle
- **Preview Pane** — see exactly what client sees before sharing

---

## Phase 5: Production Layer (New in v2)

### 5.1 AI Video Brief Studio (`/video-brief`)
Full production package generator. Replaces a producer's 2-hour brief in 60 seconds.

**Inputs:** topic, target platform, video duration, target audience, Content DNA toggle

**Output Package (5 sections):**
1. **3 Hook Variants** — Curiosity / Controversy / Value-first — each copyable
2. **Shot List** — 6–8 shots with type, description, duration estimate
3. **Script Outline** — `[HOOK][SETUP][BODY][CTA]` with pacing markers (`[PAUSE]`, `[ENERGY UP]`, `[CUT TO B-ROLL]`)
4. **3 Thumbnail Concepts** — Face Reaction / Listicle / Curiosity Gap with text overlay suggestions
5. **YouTube Chapters** — 5 timestamped chapters with SEO titles

**Additional Actions:** Save as content idea / Copy all / Export

---

### 5.2 Thumbnail Lab (`/thumbnail-lab`)
AI thumbnail concept generator with CTR optimization.

**Features:**
- **3 Concept Cards** — Face Reaction / Text-heavy / Curiosity Gap styles
- **Live Mockup Preview** — styled div simulating 16:9 thumbnail with brand colors
- **Title-Thumbnail Alignment Score** — AI scores whether title and thumbnail make the same promise
- **CTR Prediction** — High / Medium / Low with improvement reason
- **AI Image Prompt** — complete Midjourney/DALL-E prompt per concept
- **A/B Variant** — regenerate individual concept with a twist
- **Best Practice Tips** — platform-specific rules (collapsible)

---

### 5.3 Viral Clip Finder (`/clip-finder`)
Long-form transcript → 5 best short-form clip extractions.

**Features:**
- **Input** — paste full video transcript, select platform preferences, max clip length
- **5 Clip Cards** — numbered 1–5 with distinct colors
- **Per Clip** — timestamp, hook sentence, Clip Value Score (X.X/10), why-it-works explanation, platform fit badges, edit notes, suggested caption
- **Export All** — copies all clips as markdown edit notes
- **"What makes a good clip?" accordion** — educational tips for new creators

---

### 5.4 Brand Kit (`/brand-kit`)
Visual identity management — the creative foundation that flows into all other tools.

**Features:**
- **Color Palette** — primary / secondary / accent colors with hex inputs + color pickers
- **Typography** — heading + body font from 12 popular Google Font options
- **Logo/Watermark** — logo URL storage, watermark position (4-corner selector), opacity control
- **Tone of Voice** — 5 brand-defining words + 5 words to never use (chip inputs)
- **Brand Tagline** — unique value proposition field
- **Live Preview** — brand card, thumbnail mockup, color palette display, typography specimen
- **Apply to Tools** — "Apply to Visual Prompts" / "Apply to Thumbnail Lab" actions
- **Storage** — `localStorage: 'creator-brand-kit'`

---

### 5.5 Monetization Intelligence Dashboard (`/monetize`)
Revenue intelligence hub — shows creators money they're leaving on the table.

**Features:**
- **Top Stats** — monthly total, diversification score, active streams count, vs-last-month delta
- **6 Revenue Stream Cards** — AdSense / Brand Deals / Affiliates / Digital Products / Courses / Memberships with amount, % of total, and "Untapped" badge + potential if zero
- **Opportunity Alerts** — rule-based alerts (Shorts monetization gap, brand deal rate gap, digital product gap)
- **Rate Calculator** — followers × engagement → what to charge for brand deals (formulas vary by platform)
- **Monthly Forecast** — progress to target with extrapolated projection
- **Year-to-Date Summary** — YTD total / best month / average per month

---

### 5.6 Channel Audit Tool (`/audit`)
AI-powered creator channel analysis. Primary acquisition tool for new creators.

**Features:**
- **Input** — YouTube URL or Instagram handle + niche + optional bio/description
- **Overall Score** — 0–100 with percentile comparison ("better than X% of creators in your niche")
- **5 Audit Dimensions** — Niche Clarity / Thumbnail Consistency / Upload Frequency / Hook Quality / CTA Effectiveness — each 0–100 with improvement tip
- **Quick Wins** — 5 specific actions ordered by estimated impact
- **Competitor Gap** — comparison table vs top creators in niche
- **Monetization Readiness Checklist** — 6 items: YPP eligibility / brand deal readiness / digital product potential / affiliate fit / course potential / newsletter potential

---

### 5.7 Gear Recommendation Engine (`/gear-guide`)
Budget-based equipment stack recommendations for new creators.

**Features:**
- **5 Budget Tiers** — Phone-only (₹0) / Starter (₹10K) / Creator (₹25K) / Pro (₹50K) / Studio (₹1L+)
- **5 Content Types** — Talking Head / Vlog / Podcast / Gaming / Tutorial
- **Gear Stack Display** — Camera + Mic + Lighting + Editing Software + Accessories per combination
- **India-Specific Pricing** — INR prices, Amazon India / Flipkart references
- **Upgrade Path** — "When ready, upgrade from X to Y — Impact: Z"
- **New Creator Tips** — 3 practical tips per content type
- **Affiliate Revenue Driver** — purchase links generate affiliate commission for Creator Command

---

### 5.8 Affiliate Link Hub (`/income` → Affiliate Tab)
*(Integrated as second tab in Income Tracker)*

**Features:**
- Brand name, URL, commission %, cookie window per link
- Estimated monthly revenue tracking
- Platform placement (YouTube description / IG bio / Pinned comment / Newsletter)
- Status management: active / paused / expired
- Platform placement strategy tips
- Storage: `localStorage: 'creator-affiliate-links'`

---

### 5.9 Engagement Lab (`/engagement`)
Two-tab audience intelligence and reply tool.

#### Tab 1: Comment Mining
- **Input** — paste 10–30 video comments + video context
- **Outputs:**
  - Audience pain points (3–5 with content angles)
  - Top content requests (5 video ideas with "Add to Idea Bank" per idea)
  - Audience persona summary (age range, expertise, top characteristics)
  - Sentiment analysis (positive/neutral/negative % with bar)
  - Engagement quality score

#### Tab 2: Reply Lab
- **Single reply** — paste comment → 3 reply styles (Warm & Personal / Educational / Short & Punchy)
- **Bulk templates** — 6 categories (praise / question / criticism / collab request / negative / first-time)
- **Pinned comment generator** — goal-based with CTA + word count target

---

### 5.10 Niche Finder (Enhanced Onboarding)
8-question interactive quiz as a dedicated onboarding step (skippable).

**Questions:**
1. What topic could you talk about for 3 hours? (text)
2. What do people ask your advice on? (text)
3. Platform preference (card select: YouTube / Instagram / TikTok / LinkedIn / Twitter)
4. Time commitment per week (card select)
5. Content style (Educator / Entertainer / Documenter / Curator)
6. Target audience (Beginners / Intermediate / Professionals / General)
7. Main goal (Build audience / Make income / Build brand / Share passion)
8. Income target (card select: ₹0–25K / ₹25K–1L / ₹1L–5L / ₹5L+)

**Results:**
- 3 niche recommendations with saturation score, avg RPM, time-to-1K-followers estimate, top creators to study
- Creator Archetype card (from Q5) with content format recommendations
- Auto-fills profile niche + tone on selection

---

## Global Features

### ⌘K Command Palette
- Triggered by `Cmd/Ctrl+K` globally
- Searches: nav views, ideas, smart tasks, projects, brand deals, calendar posts
- Keyboard navigation `↑↓↵`, ESC to close
- Grouped by category with color-coded category headers
- Sidebar button for mouse access

### Quick Capture
- Floating `+` button available on every screen
- Captures ideas directly to Idea Bank
- Minimal friction — title only required

### Smart Inbox Badge
- Sidebar `inbox` nav item shows red badge count
- Count: overdue tasks + blocked project tasks + deal deadlines ≤3 days

### Settings Modal
- API key management (Anthropic Claude Haiku)
- Theme toggle (dark/light)
- Profile editing
- Workspace plan indicator

### Auth Screen
- Google / Apple / Microsoft SSO buttons (graceful fallback to guest)
- Guest mode — proceeds to onboarding

### Streak Indicator
- Sidebar shows streak count + flame icon when active streak exists
- Computed from consecutive days with published CalendarPost entries

---

## Monetization Strategy

### Pricing Tiers
| Tier | Price | Features |
|------|-------|---------|
| **Free** | ₹0/mo | Command + Creation layers. 10 AI generations/mo, 5 tasks, basic calendar |
| **Creator** | ₹999/mo | All Production tools + 100 AI generations/mo + Brand Deals CRM |
| **Pro** | ₹2,499/mo | Unlimited AI + Channel Audit + Client Portal + Monetization Dashboard |
| **Agency** | ₹6,999/mo | Multi-creator dashboard + white-label client portal + 5 team seats |

### Paywall Conversion Triggers
- AI Video Brief — locked behind Creator tier (highest wow-factor feature)
- Brand Deals pipeline beyond 3 deals
- Client Portal links beyond 1
- Channel Audit after 1 free use
- Thumbnail Lab advanced concepts

### Built-in Revenue Streams
1. **Gear Guide Affiliate Links** — Amazon India + Flipkart (5–8% commission per sale)
2. **Software Recommendations** — Epidemic Sound, Envato, Adobe, DaVinci Resolve affiliate
3. **Usage-based Credits** — ₹199 per 100 AI generations beyond plan limits
4. **Creator Marketplace** (Phase 6) — sell templates, presets, prompt packs; platform takes 20% cut

### Acquisition Funnel
```
Entry: Niche Finder Quiz (free, shareable, no signup)
    ↓
Activation: First AI idea generation (wow moment in 30 seconds)
    ↓
Habit: Daily Planner + Content Calendar (daily active use)
    ↓
Conversion: AI Video Brief gated → upgrade prompt
    ↓
Expansion: Agency tier for multi-creator needs
```

---

## Store Schema (creator-command-v5)

```typescript
// Core
profile: CreatorProfile | null
ideas: ContentIdea[]
calendarPosts: CalendarPost[]
brandDeals: BrandDeal[]
contentDNA: ContentDNAResult | null
activeView: string
isOnboarding: boolean
hasVisited: boolean
settingsOpen: boolean
theme: 'dark' | 'light'

// Income
incomeEntries: IncomeEntry[]
monthlyIncomeTarget: number

// Content
templates: ContentTemplate[]
streak: CreatorStreak

// Workspace
workspace: Workspace  // { id, name, plan, members, projects[] }
smartTasks: SmartTask[]

// Pipeline
pipelineItems: PipelineItem[]

// Client Portal
clientPortalLinks: ClientPortalLink[]
clientComments: ClientComment[]

// Inbox
dismissedInboxIds: string[]
```

*Note: Brand Kit, Affiliate Links, and Daily Activities are stored in localStorage separately for performance and simplicity.*

---

## Success Metrics

### North Star
**Weekly Active Creators (WAC)** — creators who open the app ≥3 days per week

### KPIs
| Metric | 6-Month Target | Notes |
|--------|---------------|-------|
| WAC | 10,000 | Core health |
| D30 Retention | 45% | Product-market fit signal |
| AI Generations/Creator/Week | 8+ | Depth of engagement |
| Creator → Pro Conversion | 8% | Monetization health |
| Net Promoter Score | 60+ | Product love |
| Avg Revenue/Creator | ₹800/mo | Blended across tiers |

### Feature-level Metrics
- **Idea Engine** — ideas generated per creator per week (target: 5+)
- **Script Writer** — scripts generated AND used (not just generated) — copy-to-clipboard as proxy
- **Channel Audit** — completion rate (% who read full audit after starting)
- **Gear Guide** — affiliate link click-through rate (revenue signal)
- **Brand Kit** — completion rate (measures onboarding quality, proxy for retention)
- **Niche Finder** — completion + profile setup rate (measures activation quality)

---

## Roadmap

### ✅ Shipped (v1 → v2)
- All Phase 1–4 features
- Command Palette (⌘K)
- Smart Inbox with badge
- Content Pipeline kanban
- Client Portal
- AI Video Brief Studio
- Thumbnail Lab
- Viral Clip Finder
- Brand Kit
- Hook Library (Creation Studio tab)
- Video Chapters (Creation Studio tab)
- Monetization Intelligence Dashboard
- Channel Audit Tool
- Gear Recommendation Engine
- Affiliate Link Hub (Income Tracker tab)
- Engagement Lab (Comment Mining + Reply Lab)
- Niche Finder Quiz (Onboarding)

### 🔜 Phase 6: Ecosystem
- Creator Marketplace — sell/buy templates, presets, prompt packs
- Multi-creator Agency dashboard (Agency tier)
- Mobile companion app (React Native) for quick capture + daily planner on the go
- Push notifications / desktop notifications for streak reminders
- YouTube Data API deeper integration (auto-pull latest video performance)
- Instagram Graph API integration (auto-pull post performance)

### 🔜 Phase 7: Collaboration
- Team workspaces with role-based access
- Co-creator project sharing
- Editor marketplace integration
- Collab request system between creators

---

*This PRD was generated as a reverse PRD — documenting the product as it was designed and built, capturing intent, architecture decisions, and future direction. It serves as the authoritative source of truth for what Creator Command is, does, and aspires to become.*
