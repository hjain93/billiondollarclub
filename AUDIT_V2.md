# Creator Command — Product Audit v2
**Date:** 2026-03-29
**Architecture as of:** P0/P1/P2 implementation sprint
**Status:** Pre-beta, frontend-only prototype

---

## Architecture Summary (Current)

```
src/
├── App.tsx                        ← Shell: auth gate, lazy loading, mobile sidebar
├── store.ts                       ← Zustand + localStorage (base64 encrypted)
├── types.ts                       ← 475 lines, rich domain models
├── components/
│   ├── CreationStudio/            ← SPLIT: 7 tab subcomponents + shared utils
│   │   ├── index.tsx              ← Shell (50 lines)
│   │   ├── ScriptWriter.tsx       ← Teleprompter + A/B hooks
│   │   ├── CaptionLab.tsx         ← 6 captions + hashtags
│   │   ├── CarouselCreator.tsx    ← Slide editor + PNG export
│   │   ├── RepurposeEngine.tsx    ← 6-platform repurpose
│   │   ├── HookLibrary.tsx        ← 42 hook templates + AI personalize
│   │   ├── VideoChapters.tsx      ← Chapter gen + thumbnail ideas
│   │   └── shared.tsx             ← EmptyStudio, lbl, chipStyle
│   ├── NicheFinder.tsx            ← NEW: standalone 8-question quiz
│   ├── PaywallModal.tsx           ← NEW: 4-tier comparison + upgrade CTA
│   ├── ErrorBoundary.tsx          ← NEW: per-view crash isolation
│   └── [40+ other views]
├── utils/
│   ├── entitlements.ts            ← NEW: canAccess(), TIER_LIMITS, FEATURE_TIERS
│   ├── entitlements.test.ts       ← NEW: 19 tests
│   └── creatorFlow.test.ts        ← NEW: 17 tests (36 assertions + 2 suites)
└── services/
    ├── APIProxy.ts                ← BFF sim, rate limiting, AI gen enforcement
    ├── aiFetchBridge.ts           ← Fetch intercept for Anthropic browser calls
    └── workflowEngine.ts          ← Multi-step workflow orchestration
```

**Bundle:** 381KB / 111KB gzip (down from 1,270KB — 3.3× via route-level code splitting)
**Test coverage:** 44/44 passing
**Mobile:** Off-canvas sidebar with hamburger + overlay

---

## Tier Architecture

| Tier | Price | AI Gen/mo | Features |
|------|-------|-----------|----------|
| Free | ₹0 | 10 | Command Center, Idea Engine, Calendar, Planner, Goals, Niche Finder, Gear Guide |
| Creator | ₹999 | 100 | + Studio, Pipeline, Analytics, Brand Deals, Income, Content DNA, Smart Inbox |
| Pro | ₹2,499 | 1,000 | + Video Brief, Thumbnail Lab, Clip Finder, Audit, Monetize, Trends, Growth Sim, Projects |
| Agency | ₹6,999 | ∞ | + Invoices, Autopilot, Chief of Staff, CFO, Automation, Ops HQ, D2C Store |

---

## What Is Working (Do Not Break)

- ✅ Idea Engine → Content Calendar: `ideaId` linking, status transitions (`inbox → planned → creating → done`)
- ✅ CommandCenter oracle: reads real store state (ideas, calendarPosts, profile) to surface recommendations
- ✅ AI generation counter: enforced at APIProxy + monthly reset in store
- ✅ Feature gating: `canAccess()` in Sidebar, PaywallModal triggers on locked nav click
- ✅ ErrorBoundary: per-view crash isolation, all 40+ views wrapped
- ✅ Code splitting: all views are `React.lazy()`, ViewSkeleton as Suspense fallback
- ✅ Mobile: off-canvas sidebar, hamburger, overlay, touch targets
- ✅ Workflow engine: multi-step orchestration with cancellation, WorkflowRun artifacts
- ✅ Brand deals CRM: full lifecycle (prospect → negotiating → contracted → live → completed)
- ✅ Smart task management: time tracking, attachments, project links, priorities
- ✅ Store encryption: sensitive tokens stripped before localStorage persist

---

## Flaw Register

Each flaw is rated on two axes:
**Severity:** P0 (blocks launch) → P1 (degrades core value) → P2 (quality gap)
**Effort:** S (< 1 day) · M (1–3 days) · L (3–7 days)

---

### F-01 · Data lives only in browser localStorage
**Severity:** P0 · **Effort:** L

All Zustand state persists to `localStorage` key `creator-command-v5`. This means:
- Clearing browser storage = all ideas, calendar posts, pipeline items, brand deals, goals → gone
- No multi-device access
- No data recovery path
- Store has a 300-memory limit and 120-workflow-run limit (hard-coded trim at write time)

**Fix plan:**
Phase A — Dexie.js (IndexedDB) as drop-in local replacement. No backend, survives cache clears, 500MB+ capacity, same sync API as Zustand.
Phase B — Supabase (optional, adds cloud sync + real auth). Can be added on top of Dexie without rewriting component layer.

---

### F-02 · Paywall is client-side demo only
**Severity:** P0 · **Effort:** L

`PaywallModal` calls `setPlanTier(tier)` in Zustand. Since tier is in localStorage, any user can:
- Open DevTools → clear `creator-command-v5` → refresh → starts as free again
- Or manually edit localStorage to set `planTier: 'agency'`

No payment processor. No server-side license validation. No subscription management.

**Fix plan:**
Phase A — Add Razorpay Checkout (or Stripe) client-side SDK. On success callback, receive `subscription_id` + `tier` from payment webhook, store in Supabase user row.
Phase B — On app load, validate tier against Supabase `subscriptions` table (JWT-protected endpoint). Override local `planTier` with server value.
Phase C — Show subscription management UI (cancel, upgrade/downgrade, billing history).

---

### F-03 · Calendar → Pipeline promotion is fully manual
**Severity:** P1 · **Effort:** M

The `PipelineItem` type has `linkedCalendarPostId?: string` and `linkedIdeaId?: string`, but nothing creates that link automatically. A creator who schedules a post in the Calendar must then manually:
1. Open ContentPipeline
2. Create a new card
3. Find and link the calendar post

The "idea → calendar → pipeline" loop that is the core product promise is broken at step 2→3.

**Fix plan:**
When a `CalendarPost` moves to `status: 'scheduled'`, auto-create a `PipelineItem` in the `script` stage with `linkedCalendarPostId` and `linkedIdeaId` pre-filled. Show a toast: "Added to Pipeline — Script stage". User can dismiss or customise.

---

### F-04 · Six Phase 5–6 components are UI shells with hardcoded data
**Severity:** P1 · **Effort:** L

| Component | Lines | State of fake data |
|-----------|-------|--------------------|
| FinancialCFO | 266 | `totalIncome: 125000` hardcoded, no store read |
| GrowthSimulator | ~130 | Strategy interface defined, no simulation model |
| ContentABLab | ~150 | ABTest types defined, no test logic |
| AudienceLayer | 127 | `emailSubscribers: 1240` hardcoded |
| CollabNetwork | 88 | `DEMO_CREATORS` array hardcoded |
| CreatorStorefront | ~180 | `INITIAL_PRODUCTS` hardcoded, no cart/checkout |

These are behind Pro/Agency paywalls (so free users never see them) but paying users who click through will hit dead ends.

**Fix plan (per component):**
- **FinancialCFO:** Wire `incomeEntries` from store. Auto-calculate MRR, tax estimate, platform breakdown.
- **GrowthSimulator:** Build compound-growth model: input (current followers, post frequency, engagement rate) → output (30/90/180-day projection curve with Recharts).
- **ContentABLab:** Wire to `calendarPosts` — let user pick 2 posts, compare performance metrics (views, saves, comments), declare winner.
- **AudienceLayer:** Wire to profile + allow manual subscriber entry (no real ESP integration needed for MVP).
- **CollabNetwork:** Build search UI over a static curated creator dataset (500 creators across niches). Filter by niche, platform, audience size. "Connect" sends a toast + logs to brand deals.
- **CreatorStorefront:** Wire products to store, basic cart UI, "Order" triggers Razorpay checkout.

---

### F-05 · AI usage limits enforced in store but not at component level
**Severity:** P1 · **Effort:** S

`APIProxy` checks `aiGenerationsUsed >= limit` before calling AI. But components don't read this check result proactively — they show the "Generate" button enabled, the user clicks, then gets an error toast (`GENERATION_LIMIT_REACHED`).

UX problem: user intent is wasted. The button should be visibly disabled with a quota badge when limit is hit, and a one-click upgrade path.

**Fix plan:**
Export a `useAIQuota()` hook from entitlements: `{ used, limit, remaining, isAtLimit, pct }`. Components consuming AI calls (ScriptWriter, CaptionLab, IdeaEngine, etc.) use this hook to disable their generate button and show "X/10 AI gens used — Upgrade for more" inline, not as a post-error toast.

---

### F-06 · CommandCenter oracle is smart but lacks "today's brief" UX
**Severity:** P1 · **Effort:** M

`CommandCenter.tsx` reads store correctly and generates recommendations. But it presents as a generic dashboard grid — not as the "daily brief" a creator actually needs the moment they open the app.

A creator opening the app at 9am should see:
1. What to do today (scheduled posts, filming tasks, overdue pipeline items)
2. Their streak + momentum signal
3. One AI-recommended action (highest-scored unscheduled idea)
4. Notifications (brand deal deadlines, goal progress alerts)

Currently CommandCenter shows cards with no hierarchy and no time-awareness.

**Fix plan:**
Add a `DailyBrief` section at the top of CommandCenter: today's date, a greeting, 3 action cards (Today's Post, Top Idea, Pipeline Blocker). Below: stats grid (streak, posts this week, AI gens left). Below: smart recommendations (existing oracle logic, unchanged). The full page becomes scannable in under 5 seconds.

---

### F-07 · No loading / error states in most components
**Severity:** P2 · **Effort:** M

`ErrorBoundary` isolates crashes at the view level, but within views:
- Components that call AI show a spinner only while loading, no failure recovery UI
- Failed API calls show `toast.error()` but the component stays in its empty state with no retry button
- No skeleton loaders inside views (only the Suspense-level ViewSkeleton between lazy chunks)

**Fix plan:**
Add a shared `<LoadingCard />` and `<ErrorCard onRetry={fn} />` pattern. Components use these for the async loading/error cycle. This is a UI polish pass, not a blocker.

---

### F-08 · Trend Radar has no actual data fetch
**Severity:** P2 · **Effort:** M

`store.ts` has `trendData: any[] | null` and a `setTrendData()` action. `TrendRadar.tsx` presumably reads this. But there is no service that fetches trends — no scheduled fetch, no manual refresh trigger, no mock data seeded on load.

**Fix plan:**
Use Anthropic to generate "trending content formats and topics for [niche] on [platform]" every 6 hours (cached in store with `trendDataUpdatedAt` timestamp). Show a "last updated X ago" chip. No real API scraping needed — AI synthesis is good enough for MVP.

---

### F-09 · Sidebar tier badge / plan indicator not wired to upgrade
**Severity:** P2 · **Effort:** S

The sidebar shows a plan tier badge at the bottom (e.g., "FREE PLAN"). Clicking it currently opens the PaywallModal. This is correct but the badge doesn't show:
- How many AI gens are left this month
- A visual urgency signal as the user approaches limits

**Fix plan:**
Sidebar bottom badge shows: `FREE — 7/10 AI gens` with a mini progress bar. When ≥80% used: color shifts to orange. When at limit: shifts to red + pulsing dot. Clicking still opens PaywallModal.

---

### F-10 · No real authentication — profile is created locally
**Severity:** P0 (for production) · **Effort:** L

`profile` is created during `Onboarding.tsx` and stored only in Zustand/localStorage. There is no:
- Email/password or OAuth login
- Session token
- Password recovery
- Account deletion

This means there is no "account" — just a local persona. Two users on the same device would share data.

**Fix plan:**
Supabase Auth (free tier, email + Google OAuth). Wrap app in `<AuthProvider>`. On login, fetch user's Supabase row → hydrate Zustand store. On state change, debounce-sync to Supabase. This also solves F-01 (persistence) and F-02 (tier validation) in one backend integration.

---

## Systematic Fix Plan

Organized into 4 sprints. Each sprint is independently shippable.

---

### Sprint 3 — Core Loop + UX Polish
**Goal:** Free tier users feel genuine daily value. No stubs visible on free plan.
**Fixes:** F-03, F-05, F-06, F-09

| Task | Flaw | File(s) | Effort |
|------|------|---------|--------|
| Auto-create PipelineItem when post is scheduled | F-03 | `ContentCalendar.tsx`, `store.ts` | M |
| `useAIQuota()` hook + disable generate buttons at limit | F-05 | `utils/entitlements.ts`, `CreationStudio/*`, `IdeaEngine.tsx` | S |
| DailyBrief section in CommandCenter (today's agenda, streak, top idea) | F-06 | `CommandCenter.tsx` | M |
| Sidebar AI quota mini-bar (color shifts at 80%/100%) | F-09 | `Sidebar.tsx` | S |

---

### Sprint 4 — Persistence
**Goal:** Data survives browser clears. Feels like a real app.
**Fixes:** F-01

| Task | Flaw | File(s) | Effort |
|------|------|---------|--------|
| Replace localStorage with Dexie.js (IndexedDB) | F-01 | `store.ts`, new `db.ts` | L |
| Migrate Zustand persist middleware to Dexie adapter | F-01 | `store.ts` | M |
| Add "last saved" indicator in TopBar | F-01 | `TopBar.tsx` | S |
| Import/export JSON backup button in Settings | F-01 | `SettingsModal.tsx` | S |

---

### Sprint 5 — Stub Completion (Creator + Pro tiers)
**Goal:** Every feature a Creator/Pro user can access actually works.
**Fixes:** F-04, F-07, F-08

| Task | Flaw | File(s) | Effort |
|------|------|---------|--------|
| FinancialCFO: wire to `incomeEntries` store, real MRR/tax calc | F-04 | `FinancialCFO.tsx`, `store.ts` | M |
| GrowthSimulator: build compound growth model + Recharts projection | F-04 | `GrowthSimulator.tsx` | M |
| ContentABLab: wire to calendarPosts, compare performance metrics | F-04 | `ContentABLab.tsx` | M |
| AudienceLayer: manual subscriber entry, export CSV (no ESP needed) | F-04 | `AudienceLayer.tsx` | S |
| CollabNetwork: static 500-creator dataset, filter/search, "Connect" | F-04 | `CollabNetwork.tsx` | M |
| TrendRadar: AI-generated trend feed per niche, cached 6h | F-08 | `TrendRadar.tsx`, `store.ts` | M |
| Shared `<LoadingCard>` + `<ErrorCard onRetry>` used in all async views | F-07 | new `components/ui/` | S |

---

### Sprint 6 — Auth + Monetization
**Goal:** Real accounts. Real payments. Tier enforced server-side.
**Fixes:** F-02, F-10

| Task | Flaw | File(s) | Effort |
|------|------|---------|--------|
| Supabase Auth (email + Google) | F-10 | `AuthScreen.tsx`, new `services/auth.ts` | L |
| Supabase DB: `profiles`, `subscriptions`, `content_data` tables | F-10, F-01 | Supabase migrations | L |
| Cloud sync: debounce Zustand → Supabase on state change | F-01, F-10 | `store.ts`, new `services/sync.ts` | L |
| Razorpay Checkout integration in PaywallModal | F-02 | `PaywallModal.tsx`, new `services/payments.ts` | L |
| Server-side tier validation on app load (override local planTier) | F-02 | `App.tsx`, `services/auth.ts` | M |
| Subscription management UI (cancel, billing history) | F-02 | `SettingsModal.tsx` | M |

---

## Priority Matrix

```
HIGH IMPACT
│
│  F-06 DailyBrief    F-01 Persistence    F-10 Auth
│  F-03 Auto-pipeline  F-02 Real Paywall
│
│  F-05 Quota UX      F-04 Stub completion
│
│  F-09 Sidebar badge  F-08 TrendRadar     F-07 Error states
│
LOW IMPACT
└────────────────────────────────────────────────────
  LOW EFFORT                              HIGH EFFORT
```

---

## Feature Completeness Map

| View | Tier | Status | Sprint |
|------|------|--------|--------|
| Command Center | Free | ⚠️ Needs DailyBrief | 3 |
| Idea Engine | Free | ✅ Production-ready | — |
| Content Calendar | Free | ⚠️ Needs auto-pipeline link | 3 |
| Niche Finder | Free | ✅ Production-ready | — |
| Daily Planner | Free | ✅ Production-ready | — |
| Goals | Free | ✅ Production-ready | — |
| Gear Guide | Free | ✅ Production-ready | — |
| Creation Studio (7 tabs) | Creator | ✅ Production-ready | — |
| Content Pipeline | Creator | ⚠️ Needs auto-promotion | 3 |
| Analytics | Creator | ✅ Production-ready | — |
| Brand Deals | Creator | ✅ Production-ready | — |
| Income Tracker | Creator | ✅ Production-ready | — |
| Content DNA | Creator | ✅ Production-ready | — |
| Smart Inbox | Creator | ✅ Production-ready | — |
| Video Brief Studio | Pro | ⚠️ UI only, no AI wiring | 5 |
| Thumbnail Lab | Pro | ⚠️ UI only | 5 |
| Trend Radar | Pro | ❌ No data source | 5 |
| Growth Simulator | Pro | ❌ No model | 5 |
| Content A/B Lab | Pro | ❌ No logic | 5 |
| Projects / Tasks | Pro | ✅ Production-ready | — |
| Client Portal | Pro | ✅ Production-ready | — |
| Channel Audit | Pro | ✅ Production-ready | — |
| Invoices | Agency | ✅ Production-ready | — |
| Creator Autopilot | Agency | ✅ Production-ready | — |
| Chief of Staff | Agency | ✅ Production-ready | — |
| Financial CFO | Agency | ❌ Hardcoded data | 5 |
| Collab Network | Agency | ❌ Demo data only | 5 |
| Audience Layer | Agency | ❌ Hardcoded counts | 5 |
| Automation Engine | Agency | ❌ Config only | 5 |
| Creator Storefront | Agency | ❌ Hardcoded products | 5 |
| Ops HQ | Agency | ✅ Production-ready | — |

**Legend:** ✅ Ready · ⚠️ Partially done · ❌ Stub

---

## Architecture Debt

| Debt | Location | Risk |
|------|----------|------|
| `PricingTier` imported from `types.ts` but re-declared in `entitlements.ts` | `entitlements.ts:8` | Minor: two sources of truth |
| `store.ts` is 722 lines — mixes domain slices in one file | `store.ts` | Medium: slice into `ideaSlice`, `calendarSlice`, etc. as app grows |
| AI calls in components bypass APIProxy (direct `fetch` with apiKey) | `ScriptWriter.tsx`, `CaptionLab.tsx`, etc. | Low: by design in creation tools; medium if we want centralized metering |
| `aiFetchBridge` only intercepts `api.anthropic.com` | `aiFetchBridge.ts:9` | Medium: Gemini + OpenAI calls are unmetered by bridge |
| No loading/error boundary inside async sections within views | All AI-calling views | Low: degraded UX but no crashes |

---

## What to Build Next (Decision)

Three options in order of user value delivered:

**Option A — Sprint 3 (Core loop + daily UX) — Recommended first**
Fixes the gap between what the product promises and what it delivers on day one. Free users get a working idea → calendar → pipeline flow and a useful daily brief. Highest engagement impact per hour of work.

**Option B — Sprint 4 (Persistence)**
Fixes the biggest technical trust issue. Required before any real beta users. Low UI complexity, high infrastructure importance.

**Option C — Sprint 5 (Stub completion)**
Unlocks full value of paid tiers. Required before monetization. High volume of work but each component is self-contained.

**Recommended sequence:** 3 → 4 → 5 → 6
Sprint 6 (auth + payments) should not be attempted before Sprints 3–5 are stable, since auth introduces session state that ripples through every component.
