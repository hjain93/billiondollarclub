# Creator Command — Comprehensive Implementation Plan

**Version:** 1.0
**Generated:** March 28, 2026
**Repository:** `/Users/harshitjain/Documents/creator-command`

---

## Executive Summary

This plan addresses all identified gaps in the Creator Command codebase through a systematic, phased approach. Each phase includes implementation tasks, test requirements, and acceptance criteria.

**Total Scope:**
- 11 Phases
- 87 implementation tasks
- 34 test suites to create
- Estimated effort: 120-160 hours

---

## Phase 1: AI Integration Foundation

**Goal:** Make AI features actually functional with real Claude API integration.

### 1.1 Fix APIProxy.ts AI Integration

**Current State:** `APIProxy.ts` simulates responses, doesn't make real API calls.

**Tasks:**
- [ ] 1.1.1 Implement actual Anthropic API fetch in `APIProxy.secureRequest()` for `'ai'` provider
- [ ] 1.1.2 Add proper error handling for API failures (network, auth, rate limit)
- [ ] 1.1.3 Implement request retry logic with exponential backoff
- [ ] 1.1.4 Add request/response logging for debugging (dev-only)
- [ ] 1.1.5 Implement rate limit detection and user notification

**Test Requirements:**
- [ ] T1.1.1: Unit test `APIProxy.secureRequest('ai', ...)` with mock API key
- [ ] T1.1.2: Test error handling for invalid API key
- [ ] T1.1.3: Test rate limit response handling
- [ ] T1.1.4: Test network timeout handling

**Acceptance Criteria:**
- Real Claude API calls succeed with valid key
- Clear error messages for all failure modes
- No console errors swallowed silently

---

### 1.2 Fix aiFetchBridge.ts

**Current State:** Bridge intercepts fetch to Anthropic URL but may not handle all edge cases.

**Tasks:**
- [ ] 1.2.1 Add proper request body parsing for all Claude API parameters (model, max_tokens, temperature)
- [ ] 1.2.2 Implement streaming response support (optional, for future)
- [ ] 1.2.3 Add timeout handling (30s default)
- [ ] 1.2.4 Preserve all original request headers in bridge

**Test Requirements:**
- [ ] T1.2.1: Test bridge intercepts correct URLs
- [ ] T1.2.2: Test bridge passes correct request format to Claude API
- [ ] T1.2.3: Test bridge response format matches expected Claude format

**Acceptance Criteria:**
- Any component using `fetch()` to Anthropic URL works seamlessly
- Bridge is transparent to existing code

---

### 1.3 Multi-Provider AI Support

**Current State:** Store supports anthropic/gemini/openai keys but only Anthropic is wired.

**Tasks:**
- [ ] 1.3.1 Implement Gemini API integration in `APIProxy.ts`
- [ ] 1.3.2 Implement OpenAI API integration in `APIProxy.ts`
- [ ] 1.3.3 Add provider selection UI in SettingsModal
- [ ] 1.3.4 Update all AI-consuming components to use `activeAIProvider`

**Test Requirements:**
- [ ] T1.3.1: Test Gemini API integration
- [ ] T1.3.2: Test OpenAI API integration
- [ ] T1.3.3: Test provider switching updates all components

**Acceptance Criteria:**
- User can switch between AI providers in Settings
- All AI features work with any configured provider

---

### 1.4 AI Integration Health Dashboard

**Tasks:**
- [ ] 1.4.1 Create `AIHealth` component showing:
  - API key status (configured/missing)
  - Last successful request timestamp
  - Remaining quota (if available from provider)
  - Error rate (last 24h)
- [ ] 1.4.2 Add health check button to test API connectivity
- [ ] 1.4.3 Persist health metrics to localStorage

**Test Requirements:**
- [ ] T1.4.1: Test health dashboard displays correct status
- [ ] T1.4.2: Test health check button triggers actual API test

**Acceptance Criteria:**
- User can see AI integration status at a glance
- Health check provides clear pass/fail result

---

## Phase 2: Platform API Integrations

**Goal:** Auto-fetch real data from YouTube/Instagram instead of manual entry.

### 2.1 YouTube Data API Integration

**Tasks:**
- [ ] 2.1.1 Implement OAuth 2.0 flow for YouTube API (or API key-based for read-only)
- [ ] 2.1.2 Fetch channel statistics (subscribers, views, video count)
- [ ] 2.1.3 Fetch recent videos with performance metrics
- [ ] 2.1.4 Implement auto-sync for video performance (views, likes, comments)
- [ ] 2.1.5 Add YouTube API quota management

**Test Requirements:**
- [ ] T2.1.1: Test YouTube API authentication flow
- [ ] T2.1.2: Test channel data fetch
- [ ] T2.1.3: Test video metrics fetch
- [ ] T2.1.4: Test quota exceeded handling

**Acceptance Criteria:**
- Channel Audit shows real YouTube data
- Analytics auto-populates from YouTube API

---

### 2.2 Instagram Graph API Integration

**Tasks:**
- [ ] 2.2.1 Implement Instagram Basic Display OAuth flow
- [ ] 2.2.2 Fetch Instagram Business Account metrics
- [ ] 2.2.3 Fetch recent posts with engagement data
- [ ] 2.2.4 Implement token refresh logic

**Test Requirements:**
- [ ] T2.2.1: Test Instagram OAuth flow
- [ ] T2.2.2: Test post metrics fetch
- [ ] T2.2.3: Test token refresh

**Acceptance Criteria:**
- Analytics shows real Instagram data
- Content DNA analysis uses real post data

---

### 2.3 Auto-Sync Service

**Tasks:**
- [ ] 2.3.1 Create `SyncService` that runs periodic syncs
- [ ] 2.3.2 Add sync status indicators in UI
- [ ] 2.3.3 Implement manual "Sync Now" button
- [ ] 2.3.4 Add sync error notifications

**Test Requirements:**
- [ ] T2.3.1: Test sync service runs on schedule
- [ ] T2.3.2: Test sync updates store data correctly

**Acceptance Criteria:**
- Data stays fresh without manual logging
- User is notified of sync failures

---

## Phase 3: Complete Missing Features

### 3.1 Niche Finder Quiz (Priority: HIGH)

**Why:** Key acquisition funnel from PRD. First touchpoint for new creators.

**Tasks:**
- [ ] 3.1.1 Create `NicheFinder` component with 8-question flow:
  1. What topic could you talk about for 3 hours?
  2. What do people ask your advice on?
  3. Platform preference (card select)
  4. Time commitment per week
  5. Content style (Educator/Entertainer/Documenter/Curator)
  6. Target audience
  7. Main goal
  8. Income target
- [ ] 3.1.2 Implement results calculation:
  - 3 niche recommendations with saturation score
  - Creator Archetype from Q5
  - Time-to-1K estimate
- [ ] 3.1.3 Auto-fill profile on niche selection
- [ ] 3.1.4 Add "Share Results" functionality
- [ ] 3.1.5 Make skippable but encourage completion

**Test Requirements:**
- [ ] T3.1.1: Test all 8 questions render correctly
- [ ] T3.1.2: Test results calculation logic
- [ ] T3.1.3: Test profile auto-fill on selection
- [ ] T3.1.4: Test skip functionality

**Acceptance Criteria:**
- Quiz completes in under 3 minutes
- Results feel personalized and actionable
- Share button generates social-ready image/text

---

### 3.2 Ops HQ Component

**Tasks:**
- [ ] 3.2.1 Build Ops HQ dashboard showing:
  - Workflow run history
  - Memory/insights log
  - Integration health status
  - Recent activity timeline
- [ ] 3.2.2 Add optimization queue (recommended actions)
- [ ] 3.2.3 Implement outcome attribution (which actions drove results)

**Test Requirements:**
- [ ] T3.2.1: Test Ops HQ displays all data correctly

**Acceptance Criteria:**
- Single view into all operational metrics
- Clear signal on what to do next

---

### 3.3 Test All "Present But Untested" Components

**Components to verify:**

| Component | File | Test Status |
|-----------|------|-------------|
| Content Repurposing Engine | `ContentRepurposingEngine.tsx` | NOTEST |
| Creator CRM | `CreatorCRM.tsx` | NOTEST |
| Competitor Radar | `CompetitorRadar.tsx` | NOTEST |
| Growth Simulator | `GrowthSimulator.tsx` | NOTEST |
| Pre-Publish Optimizer | `PrePublishOptimizer.tsx` | NOTEST |
| A/B Lab | `ContentABLab.tsx` | NOTEST |
| Creator Autopilot | `CreatorAutopilot.tsx` | NOTEST |
| Creator Chief of Staff | `CreatorChiefOfStaff.tsx` | NOTEST |
| Invoice Generator | `InvoiceGenerator.tsx` | NOTEST |
| CollabMode | `CollabMode.tsx` | NOTEST |

**Tasks:**
- [ ] 3.3.1 Manual test each component with real data
- [ ] 3.3.2 Fix any broken functionality
- [ ] 3.3.3 Add basic error boundaries
- [ ] 3.3.4 Document known issues

**Acceptance Criteria:**
- All components render without errors
- Core functionality works as described in PRD

---

## Phase 4: Paywall & Entitlement System

**Goal:** Implement 4-tier pricing from PRD with feature gating.

### 4.1 Entitlement System Core

**Tasks:**
- [ ] 4.1.1 Define `PlanTier` type: `'free' | 'creator' | 'pro' | 'agency'`
- [ ] 4.1.2 Create `ENTITLEMENTS` matrix mapping tiers to features
- [ ] 4.1.3 Add `workspace.plan` to store state
- [ ] 4.1.4 Create `useEntitlement()` hook for feature checks

**Test Requirements:**
- [ ] T4.1.1: Test entitlement matrix returns correct access
- [ ] T4.1.2: Test `useEntitlement()` hook with each tier

**Acceptance Criteria:**
- Features correctly gated by tier
- No paywall bypass possible

---

### 4.2 Paywall UI Components

**Tasks:**
- [ ] 4.2.1 Create `PaywallModal` component with:
  - Plan comparison table
  - Upgrade CTA
  - Current plan indicator
- [ ] 4.2.2 Add upgrade prompts at feature boundaries
- [ ] 4.2.3 Implement usage meter (AI generations/month)
- [ ] 4.2.4 Add "Contact for Enterprise" flow

**Test Requirements:**
- [ ] T4.2.1: Test paywall triggers at correct limits
- [ ] T4.2.2: Test upgrade flow completes

**Acceptance Criteria:**
- Clear upgrade path visible
- No dark patterns

---

### 4.3 Feature Gates Implementation

**Gating by PRD:**

| Feature | Free | Creator | Pro | Agency |
|---------|------|---------|-----|--------|
| AI generations/mo | 50 | 100 | 1000 | 5000 |
| Brand Deals count | 3 | 20 | 100 | Unlimited |
| Client Portal links | 1 | 5 | 20 | Unlimited |
| Channel Audit uses | 1 | 5 | Unlimited | Unlimited |
| Team seats | 1 | 1 | 3 | 15 |

**Tasks:**
- [ ] 4.3.1 Add AI generation counter
- [ ] 4.3.2 Gate Brand Deals by count
- [ ] 4.3.3 Gate Client Portal by count
- [ ] 4.3.4 Gate Channel Audit by uses
- [ ] 4.3.5 Add team seat limits

**Acceptance Criteria:**
- Limits enforced consistently
- Usage meter visible to user

---

## Phase 5: Authentication System

**Goal:** Replace guest-mode-only with real authentication.

### 5.1 Authentication Service

**Tasks:**
- [ ] 5.1.1 Choose auth provider (Recommendation: Clerk or Supabase Auth)
- [ ] 5.1.2 Implement Google OAuth
- [ ] 5.1.3 Implement Apple OAuth
- [ ] 5.1.4 Implement Microsoft OAuth
- [ ] 5.1.5 Add email/password fallback

**Test Requirements:**
- [ ] T5.1.1: Test Google OAuth flow
- [ ] T5.1.2: Test Apple OAuth flow
- [ ] T5.1.3: Test session persistence
- [ ] T5.1.4: Test logout flow

**Acceptance Criteria:**
- All OAuth providers work
- Session persists across refreshes

---

### 5.2 User Accounts & Data Sync

**Tasks:**
- [ ] 5.2.1 Create backend for data storage (Recommendation: Supabase)
- [ ] 5.2.2 Migrate localStorage schema to backend
- [ ] 5.2.3 Implement optimistic updates
- [ ] 5.2.4 Add offline-first sync queue

**Test Requirements:**
- [ ] T5.2.1: Test data syncs across devices
- [ ] T5.2.2: Test offline mode queues correctly
- [ ] T5.2.3: Test conflict resolution

**Acceptance Criteria:**
- User data accessible from any device
- No data loss on network issues

---

## Phase 6: Testing Infrastructure

### 6.1 Test Setup

**Tasks:**
- [ ] 6.1.1 Configure Vitest for component testing (@testing-library/react)
- [ ] 6.1.2 Add MSW for API mocking
- [ ] 6.1.3 Create test utilities (renderWithProviders, mockStore)
- [ ] 6.1.4 Set up test coverage reporting

**Acceptance Criteria:**
- Tests run with `npm test`
- Coverage report generated

---

### 6.2 Component Test Suites

**Priority order (by user impact):**

| Suite | Components | Priority |
|-------|------------|----------|
| CommandCenter | `CommandCenter.tsx`, `CreatorScoreRing.tsx` | P0 |
| IdeaEngine | `IdeaEngine.tsx` | P0 |
| ContentCalendar | `ContentCalendar.tsx` | P0 |
| CreationStudio | `CreationStudio.tsx` (split first) | P1 |
| BrandDeals | `BrandDeals.tsx` | P1 |
| ContentPipeline | `ContentPipeline.tsx` | P1 |
| SmartInbox | `SmartInbox.tsx` | P2 |
| Projects | `ProjectManager.tsx` | P2 |
| SmartTasks | `SmartTodo.tsx` | P2 |

**Tasks:**
- [ ] 6.2.1 CommandCenter tests (5 test cases)
- [ ] 6.2.2 IdeaEngine tests (8 test cases)
- [ ] 6.2.3 ContentCalendar tests (10 test cases)
- [ ] 6.2.4 CreationStudio tests (12 test cases)
- [ ] 6.2.5 BrandDeals tests (6 test cases)
- [ ] 6.2.6 ContentPipeline tests (7 test cases)
- [ ] 6.2.7 SmartInbox tests (5 test cases)
- [ ] 6.2.8 Projects tests (8 test cases)
- [ ] 6.2.9 SmartTasks tests (6 test cases)

**Acceptance Criteria:**
- 80%+ coverage on P0 components
- All critical paths tested

---

### 6.3 Integration Tests

**Tasks:**
- [ ] 6.3.1 Test onboarding → first idea flow
- [ ] 6.3.2 Test idea → calendar → pipeline flow
- [ ] 6.3.3 Test workflow run → tasks created flow
- [ ] 6.3.4 Test brand deal → invoice flow

**Acceptance Criteria:**
- End-to-end flows work
- No regressions on updates

---

## Phase 7: Code Quality & Refactoring

### 7.1 Split Monolithic Components

**Target files:**

| File | Current Lines | Target | Split Strategy |
|------|---------------|--------|----------------|
| `CreationStudio.tsx` | ~1600 | <400 each | Extract 7 tabs to subcomponents |
| `ContentCalendar.tsx` | ~900 | <300 each | Extract DayCell, PostChip, MonthGrid |
| `store.ts` | ~680 | <200 each | Slice into feature stores |
| `CollabMode.tsx` | ~1500 | <400 each | Extract sub-features |
| `CreatorAutopilot.tsx` | ~1600 | <400 each | Extract workflow builders |

**Tasks:**
- [ ] 7.1.1 Split CreationStudio into:
  - `CreationStudio/index.tsx` (orchestrator)
  - `CreationStudio/ScriptWriter.tsx`
  - `CreationStudio/CaptionLab.tsx`
  - `CreationStudio/CarouselCreator.tsx`
  - `CreationStudio/RepurposeEngine.tsx`
  - `CreationStudio/HashtagStrategy.tsx`
  - `CreationStudio/HookLibrary.tsx`
  - `CreationStudio/VideoChapters.tsx`
- [ ] 7.1.2 Split ContentCalendar into:
  - `ContentCalendar/index.tsx`
  - `ContentCalendar/DayCell.tsx`
  - `ContentCalendar/MonthGrid.tsx`
  - `ContentCalendar/IdeasSidebar.tsx`
- [ ] 7.1.3 Split store.ts into:
  - `store/profile.ts`
  - `store/ideas.ts`
  - `store/calendar.ts`
  - `store/brandDeals.ts`
  - `store/workspace.ts`
  - `store/workflows.ts`
  - `store/index.ts` (combines all)

**Acceptance Criteria:**
- No file >500 lines
- Each subcomponent independently testable

---

### 7.2 Add Error Boundaries

**Tasks:**
- [ ] 7.2.1 Create `ErrorBoundary` component
- [ ] 7.2.2 Wrap all route-level components
- [ ] 7.2.3 Add "Report Error" functionality
- [ ] 7.2.4 Log errors to console (dev) / service (prod)

**Acceptance Criteria:**
- Single component crash doesn't take down app
- User sees friendly error message

---

### 7.3 Add Loading States

**Tasks:**
- [ ] 7.3.1 Add skeleton loaders for all async views
- [ ] 7.3.2 Add optimistic updates for mutations
- [ ] 7.3.3 Add retry buttons for failed loads

**Acceptance Criteria:**
- No "loading..." text-only states
- User always knows what's happening

---

## Phase 8: Workflow Engine Expansion

### 8.1 Additional Workflows

**Tasks:**
- [ ] 8.1.1 "Content Refresh" workflow (find old posts to repurpose)
- [ ] 8.1.2 "Trend Response" workflow (generate posts from trends)
- [ ] 8.1.3 "Brand Deal Outreach" workflow (generate pitch emails)
- [ ] 8.1.4 "Analytics Review" workflow (weekly performance summary)

**Acceptance Criteria:**
- 5+ workflows available
- Each workflow creates executable actions

---

### 8.2 Workflow Builder UI

**Tasks:**
- [ ] 8.2.1 Visual workflow editor
- [ ] 8.2.2 Drag-and-drop step builder
- [ ] 8.2.3 Workflow template library

**Acceptance Criteria:**
- User can create custom workflows
- Workflows save and re-run

---

## Phase 9: Mobile Responsiveness

### 9.1 Responsive Design

**Tasks:**
- [ ] 9.1.1 Mobile-nav for sidebar (hamburger menu)
- [ ] 9.1.2 Responsive calendar (stack on mobile)
- [ ] 9.1.3 Touch-friendly tap targets (min 44px)
- [ ] 9.1.4 Mobile-optimized modals (bottom sheets)

**Acceptance Criteria:**
- App usable on 375px width
- All interactions work on touch

---

## Phase 10: Performance Optimization

### 10.1 Bundle Optimization

**Tasks:**
- [ ] 10.1.1 Code split by route (lazy load all views)
- [ ] 10.1.2 Tree-shake unused lodash/date-fns
- [ ] 10.1.3 Optimize images (WebP, lazy loading)
- [ ] 10.1.4 Add bundle analyzer to build

**Acceptance Criteria:**
- Initial bundle <500KB
- FCP <2s on 3G

---

### 10.2 Runtime Performance

**Tasks:**
- [ ] 10.2.1 Memoize expensive computations
- [ ] 10.2.2 Virtualize long lists (calendar posts, ideas)
- [ ] 10.2.3 Debounce search inputs
- [ ] 10.2.4 Add React Profiler analysis

**Acceptance Criteria:**
- 60fps scrolling
- No layout shift on interactions

---

## Phase 11: Documentation

### 11.1 Developer Documentation

**Tasks:**
- [ ] 11.1.1 Update README.md with setup instructions
- [ ] 11.1.2 Add architecture decision records (ADRs)
- [ ] 11.1.3 Document component API contracts
- [ ] 11.1.4 Add contributing guidelines

---

### 11.2 User Documentation

**Tasks:**
- [ ] 11.2.1 In-app help tooltips
- [ ] 11.2.2 Feature tour for first-time users
- [ ] 11.2.3 Help center / FAQ page
- [ ] 11.2.4 Video tutorials for key features

---

## Implementation Timeline

### Sprint 1 (Weeks 1-2): AI Foundation
- Phase 1: AI Integration (all tasks)
- Phase 6.1: Test Setup

### Sprint 2 (Weeks 3-4): Platform Integration
- Phase 2: YouTube/Instagram APIs
- Phase 3.1: Niche Finder Quiz

### Sprint 3 (Weeks 5-6): Monetization
- Phase 4: Paywall System
- Phase 3.3: Test Untested Components

### Sprint 4 (Weeks 7-8): Auth & Data
- Phase 5: Authentication
- Phase 5.2: Backend Sync

### Sprint 5 (Weeks 9-10): Testing
- Phase 6.2: Component Tests
- Phase 6.3: Integration Tests

### Sprint 6 (Weeks 11-12): Quality
- Phase 7: Refactoring
- Phase 10: Performance

### Sprint 7 (Weeks 13-14): Polish
- Phase 8: Workflows
- Phase 9: Mobile
- Phase 11: Documentation

---

## Definition of Done

A phase is complete when:
1. All implementation tasks checked
2. All test suites passing
3. Acceptance criteria verified
4. No new ESLint errors
5. No console errors in dev tools

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Implement caching, quota alerts |
| Auth provider downtime | Medium | Graceful fallback to guest mode |
| Test flakiness | Medium | Retry logic, better selectors |
| Bundle size creep | Low | Regular audits, size limits in CI |

---

## Success Metrics

Post-implementation targets:
- AI success rate: >95%
- Test coverage: >80%
- Bundle size: <500KB
- FCP: <2s
- Error rate: <0.1%

---

*This plan is a living document. Update after each phase based on learnings.*
