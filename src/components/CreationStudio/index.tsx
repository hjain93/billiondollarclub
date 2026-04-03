import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlignLeft, Hash, Film, Layers, RefreshCw, Zap, BookMarked } from 'lucide-react'
import { ScriptWriter } from './ScriptWriter'
import { CaptionLab } from './CaptionLab'
import { CarouselCreator } from './CarouselCreator'
import { RepurposeEngine } from './RepurposeEngine'
import { HookLibrary } from './HookLibrary'
import { VideoChapters } from './VideoChapters'
import { HashtagStrategy } from '../HashtagStrategy'

const TABS = [
  { id: 'script', label: 'Script Writer', icon: <Film size={13} /> },
  { id: 'captions', label: 'Caption Lab', icon: <AlignLeft size={13} /> },
  { id: 'carousel', label: 'Carousel Creator', icon: <Layers size={13} /> },
  { id: 'repurpose', label: 'Repurpose Engine', icon: <RefreshCw size={13} /> },
  { id: 'hashtags', label: 'Hashtags', icon: <Hash size={13} /> },
  { id: 'hooks', label: 'Hooks', icon: <Zap size={13} /> },
  { id: 'chapters', label: 'Chapters', icon: <BookMarked size={13} /> },
]

export function CreationStudio() {
  const [activeTab, setActiveTab] = useState('script')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ padding: '18px 28px 0', background: '#0d0d1a', borderBottom: '1px solid rgba(59,130,246,0.1)', flexShrink: 0 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em', marginBottom: 3 }}>Creation Studio</h1>
        <p style={{ fontSize: 12, color: '#4b5680', marginBottom: 14, fontWeight: 500 }}>Script · Captions · Carousels · Repurpose — everything to go from idea to publishable content</p>
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            style={{ height: '100%' }}
          >
            {activeTab === 'script' && <ScriptWriter />}
            {activeTab === 'captions' && <CaptionLab />}
            {activeTab === 'carousel' && <CarouselCreator />}
            {activeTab === 'repurpose' && <RepurposeEngine />}
            {activeTab === 'hashtags' && <HashtagStrategy />}
            {activeTab === 'hooks' && <HookLibrary />}
            {activeTab === 'chapters' && <VideoChapters />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
