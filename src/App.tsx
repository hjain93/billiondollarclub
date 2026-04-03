import { useEffect, lazy, Suspense } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from './store'
import { runAutoWorkflowIfDue } from './services/workflowEngine'

// ── Always-eager: shell, auth, onboarding, first view ────────────────────────
import { Onboarding } from './components/Onboarding'
import { AuthScreen } from './components/AuthScreen'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { SettingsModal } from './components/SettingsModal'
import { QuickCapture } from './components/QuickCapture'
import { CommandPalette } from './components/CommandPalette'
import { CommandCenter } from './components/CommandCenter'   // first view

// ── Lazy: all 40+ views loaded on demand ─────────────────────────────────────
const lazy1 = <T extends React.ComponentType<any>>(fn: () => Promise<{ [k: string]: T }>, name: string) =>
  lazy(() => fn().then((m) => ({ default: m[name] })))

const IdeaEngine              = lazy1(() => import('./components/IdeaEngine'), 'IdeaEngine')
const ContentCalendar         = lazy1(() => import('./components/ContentCalendar'), 'ContentCalendar')
const DailyPlanner            = lazy1(() => import('./components/DailyPlanner'), 'DailyPlanner')
const CreationStudio          = lazy1(() => import('./components/CreationStudio'), 'CreationStudio')
const ContentPipeline         = lazy1(() => import('./components/ContentPipeline'), 'ContentPipeline')
const Analytics               = lazy1(() => import('./components/Analytics'), 'Analytics')
const TrendRadar              = lazy1(() => import('./components/TrendRadar'), 'TrendRadar')
const ContentDNA              = lazy1(() => import('./components/ContentDNA'), 'ContentDNA')
const BrandDeals              = lazy1(() => import('./components/BrandDeals'), 'BrandDeals')
const Goals                   = lazy1(() => import('./components/Goals'), 'Goals')
const IncomeTracker           = lazy1(() => import('./components/IncomeTracker'), 'IncomeTracker')
const Templates               = lazy1(() => import('./components/Templates'), 'Templates')
const VisualPromptGen         = lazy1(() => import('./components/VisualPromptGen'), 'VisualPromptGen')
const SmartInbox              = lazy1(() => import('./components/SmartInbox'), 'SmartInbox')
const ProjectManager          = lazy1(() => import('./components/ProjectManager'), 'ProjectManager')
const SmartTodo               = lazy1(() => import('./components/SmartTodo'), 'SmartTodo')
const ClientPortal            = lazy1(() => import('./components/ClientPortal'), 'ClientPortal')
const VideoBriefStudio        = lazy1(() => import('./components/VideoBriefStudio'), 'VideoBriefStudio')
const ViralClipFinder         = lazy1(() => import('./components/ViralClipFinder'), 'ViralClipFinder')
const ThumbnailLab            = lazy1(() => import('./components/ThumbnailLab'), 'ThumbnailLab')
const BrandKit                = lazy1(() => import('./components/BrandKit'), 'BrandKit')
const MonetizationDashboard   = lazy1(() => import('./components/MonetizationDashboard'), 'MonetizationDashboard')
const ChannelAudit            = lazy1(() => import('./components/ChannelAudit'), 'ChannelAudit')
const GearGuide               = lazy1(() => import('./components/GearGuide'), 'GearGuide')
const EngagementLab           = lazy1(() => import('./components/EngagementLab'), 'EngagementLab')
const PrePublishOptimizer     = lazy1(() => import('./components/PrePublishOptimizer'), 'PrePublishOptimizer')
const GrowthSimulator         = lazy1(() => import('./components/GrowthSimulator'), 'GrowthSimulator')
const CompetitorRadar         = lazy1(() => import('./components/CompetitorRadar'), 'CompetitorRadar')
const CreatorCRM              = lazy1(() => import('./components/CreatorCRM'), 'CreatorCRM')
const ContentRepurposingEngine = lazy1(() => import('./components/ContentRepurposingEngine'), 'ContentRepurposingEngine')
const InvoiceGenerator        = lazy1(() => import('./components/InvoiceGenerator'), 'InvoiceGenerator')
const CreatorChiefOfStaff     = lazy1(() => import('./components/CreatorChiefOfStaff'), 'CreatorChiefOfStaff')
const CreatorAutopilot        = lazy1(() => import('./components/CreatorAutopilot'), 'CreatorAutopilot')
const ContentABLab            = lazy1(() => import('./components/ContentABLab'), 'ContentABLab')
const CollabMode              = lazy1(() => import('./components/CollabMode'), 'CollabMode')
const OpsHQ                   = lazy1(() => import('./components/OpsHQ'), 'OpsHQ')
const AudienceLayer           = lazy1(() => import('./components/AudienceLayer'), 'AudienceLayer')
const CollabNetwork           = lazy1(() => import('./components/CollabNetwork'), 'CollabNetwork')
const AutomationEngine        = lazy1(() => import('./components/AutomationEngine'), 'AutomationEngine')
const FinancialCFO            = lazy1(() => import('./components/FinancialCFO'), 'FinancialCFO')
const CreatorStorefront       = lazy1(() => import('./components/CreatorStorefront'), 'CreatorStorefront')
const NicheFinder             = lazy1(() => import('./components/NicheFinder'), 'NicheFinder')

// ── Branded skeleton shown while lazy chunks load ────────────────────────────
function ViewSkeleton() {
  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{
        width: 180, height: 22, borderRadius: 6,
        background: 'rgba(59,130,246,0.08)', marginBottom: 24,
        animation: 'pulse 1.6s ease-in-out infinite',
      }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            height: 120, borderRadius: 12,
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.08)',
            animation: `pulse 1.6s ease-in-out ${i * 0.1}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

function MainContent() {
  const { activeView } = useStore()

  return (
    <Suspense fallback={<ViewSkeleton />}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.12 }}
          style={{ flex: 1 }}
        >
          <ErrorBoundary viewId={activeView}>
          {activeView === 'command-center' && <CommandCenter />}
          {activeView === 'idea-engine' && <IdeaEngine />}
          {activeView === 'calendar' && <ContentCalendar />}
          {activeView === 'planner' && <DailyPlanner />}
          {activeView === 'studio' && <CreationStudio />}
          {activeView === 'analytics' && <Analytics />}
          {activeView === 'trends' && <TrendRadar />}
          {activeView === 'content-dna' && <ContentDNA />}
          {activeView === 'brand-deals' && <BrandDeals />}
          {activeView === 'audience' && <AudienceLayer />}
          {activeView === 'collab-network' && <CollabNetwork />}
          {activeView === 'automation' && <AutomationEngine />}
          {activeView === 'cfo' && <FinancialCFO />}
          {activeView === 'store' && <CreatorStorefront />}
          {activeView === 'goals' && <Goals />}
          {activeView === 'income' && <IncomeTracker />}
          {activeView === 'templates' && <Templates />}
          {activeView === 'visual-prompts' && <VisualPromptGen />}
          {activeView === 'projects' && <ProjectManager />}
          {activeView === 'tasks' && <SmartTodo />}
          {activeView === 'inbox' && <SmartInbox />}
          {activeView === 'pipeline' && <ContentPipeline />}
          {activeView === 'client-portal' && <ClientPortal />}
          {activeView === 'video-brief' && <VideoBriefStudio />}
          {activeView === 'clip-finder' && <ViralClipFinder />}
          {activeView === 'thumbnail-lab' && <ThumbnailLab />}
          {activeView === 'brand-kit' && <BrandKit />}
          {activeView === 'monetize' && <MonetizationDashboard />}
          {activeView === 'audit' && <ChannelAudit />}
          {activeView === 'gear-guide' && <GearGuide />}
          {activeView === 'engagement' && <EngagementLab />}
          {activeView === 'pre-publish' && <PrePublishOptimizer />}
          {activeView === 'growth-sim' && <GrowthSimulator />}
          {activeView === 'competitor-radar' && <CompetitorRadar />}
          {activeView === 'creator-crm' && <CreatorCRM />}
          {activeView === 'repurpose' && <ContentRepurposingEngine />}
          {activeView === 'invoices' && <InvoiceGenerator />}
          {activeView === 'chief-of-staff' && <CreatorChiefOfStaff />}
          {activeView === 'autopilot' && <CreatorAutopilot />}
          {activeView === 'ab-lab' && <ContentABLab />}
          {activeView === 'collab' && <CollabMode />}
          {activeView === 'ops-hq' && <OpsHQ />}
          {activeView === 'niche-finder' && <NicheFinder />}
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  )
}

export default function App() {
  const { isOnboarding, profile, theme, hasVisited, mobileSidebarOpen, setMobileSidebarOpen } = useStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = setInterval(() => {
      runAutoWorkflowIfDue().catch(() => null)
    }, 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  if (!profile && !hasVisited) {
    return (
      <div data-theme={theme}>
        <AuthScreen />
        <Toaster position="bottom-right" />
      </div>
    )
  }

  if (isOnboarding || !profile) {
    return (
      <div data-theme={theme}>
        <Onboarding />
        <Toaster position="bottom-right" />
      </div>
    )
  }

  return (
    <div data-theme={theme} style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #080810)' }}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <div
        className={mobileSidebarOpen ? 'sidebar-mobile-open' : 'sidebar-mobile-hidden'}
        style={{ position: 'fixed', zIndex: 40, top: 0, left: 0, bottom: 0, transition: 'transform 250ms ease' }}
      >
        <Sidebar />
      </div>
      <main
        className="main-content-mobile"
        style={{ marginLeft: 220, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}
      >
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MainContent />
        </div>
      </main>
      <SettingsModal />
      <QuickCapture />
      <CommandPalette />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111122',
            color: '#f0f4ff',
            border: '1px solid rgba(59,130,246,0.22)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
          },
        }}
      />
    </div>
  )
}
