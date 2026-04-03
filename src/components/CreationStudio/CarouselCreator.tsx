import { useState, useRef } from 'react'
import { Plus, Trash2, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { lbl } from './shared'

interface Slide { id: string; text: string; subtext: string }

export function CarouselCreator() {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', text: 'Your Hook\nGoes Here', subtext: 'Slide 1 of 5' },
    { id: '2', text: 'Point 1', subtext: 'Supporting detail' },
    { id: '3', text: 'Point 2', subtext: 'Supporting detail' },
    { id: '4', text: 'Point 3', subtext: 'Supporting detail' },
    { id: '5', text: 'Follow for more\n✦ Save this post', subtext: 'CTA Slide' },
  ])
  const [activeSlide, setActiveSlide] = useState(0)
  const [bg, setBg] = useState('#0d0d1a')
  const [textColor, setTextColor] = useState('#f0f4ff')
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [font, setFont] = useState('Plus Jakarta Sans')
  const previewRef = useRef<HTMLDivElement>(null)

  const FONTS = ['Plus Jakarta Sans', 'Space Grotesk', 'Inter', 'Playfair Display', 'Bebas Neue', 'Space Mono']
  const GRADIENTS = [
    '#0d0d1a', '#0a0a0f', '#111827', '#1a1a2e',
    'linear-gradient(135deg, #0f0c29, #302b63)', 'linear-gradient(135deg, #0d0d1a, #1a1035)',
    'linear-gradient(135deg, #0b1437, #0d2137)', 'linear-gradient(135deg, #12001a, #0d0d1a)',
  ]

  function updateSlide(id: string, field: 'text' | 'subtext', value: string) {
    setSlides((s) => s.map((sl) => sl.id === id ? { ...sl, [field]: value } : sl))
  }
  function addSlide() {
    const newSlide: Slide = { id: Date.now().toString(), text: 'New Slide', subtext: 'Add your content' }
    setSlides((s) => [...s, newSlide])
    setActiveSlide(slides.length)
  }
  function removeSlide(id: string) {
    if (slides.length <= 2) { toast.error('Need at least 2 slides'); return }
    const idx = slides.findIndex((s) => s.id === id)
    setSlides((s) => s.filter((sl) => sl.id !== id))
    setActiveSlide(Math.max(0, idx - 1))
  }

  async function exportSlide() {
    if (!previewRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: null, useCORS: true })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `slide-${activeSlide + 1}.png`
      a.click()
      toast.success('Slide exported as PNG!', { style: { background: '#0d0d1a', color: '#f0f4ff', border: '1px solid rgba(16,185,129,0.3)' } })
    } catch {
      toast.error('Export failed — try again')
    }
  }

  const current = slides[activeSlide]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 260px', gap: 16, height: '100%' }}>
      {/* Slide list */}
      <div className="card" style={{ padding: 14, overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.01em' }}>Slides</h3>
          <button onClick={addSlide} className="btn btn-ghost btn-xs" style={{ padding: '4px 8px' }}><Plus size={12} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => setActiveSlide(i)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: activeSlide === i ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.03)',
                border: `1px solid ${activeSlide === i ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.08)'}`,
                transition: 'all 140ms', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: activeSlide === i ? '#3b82f6' : 'rgba(59,130,246,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, color: activeSlide === i ? '#fff' : '#3b82f6',
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: activeSlide === i ? '#f0f4ff' : '#94a3b8', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {slide.text.split('\n')[0] || 'Slide'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); removeSlide(slide.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5680', display: 'flex', padding: 0 }}
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#4b5680', fontWeight: 700 }}>Slide {activeSlide + 1} of {slides.length}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))} disabled={activeSlide === 0}>← Prev</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))} disabled={activeSlide === slides.length - 1}>Next →</button>
            <button className="btn btn-blue btn-sm" onClick={exportSlide}><Download size={13} /> Export PNG</button>
          </div>
        </div>

        <div
          ref={previewRef}
          style={{
            width: '100%', aspectRatio: '1 / 1', background: bg, borderRadius: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 48px', position: 'relative', overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.15)',
          }}
        >
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40%', height: '40%', background: `radial-gradient(circle at bottom right, ${accentColor}22, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, width: '30%', height: '30%', background: `radial-gradient(circle at top left, ${accentColor}11, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: '50%', background: `${accentColor}22`, border: `1.5px solid ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: accentColor }}>
            {activeSlide + 1}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 800, color: textColor, lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 16, whiteSpace: 'pre-line' }}>
              {current?.text}
            </div>
            {current?.subtext && (
              <div style={{ fontFamily: `'${font}', sans-serif`, fontSize: 'clamp(12px, 1.5vw, 16px)', color: accentColor, fontWeight: 600, letterSpacing: '0.02em' }}>
                {current.subtext}
              </div>
            )}
          </div>
        </div>

        {current && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Main Text</label>
              <textarea className="field" rows={3} value={current.text} onChange={(e) => updateSlide(current.id, 'text', e.target.value)} style={{ resize: 'vertical', fontSize: 13 }} />
            </div>
            <div>
              <label style={lbl}>Subtext</label>
              <input className="field" value={current.subtext} onChange={(e) => updateSlide(current.id, 'subtext', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Style panel */}
      <div className="card" style={{ padding: 16, alignSelf: 'start', overflow: 'auto' }}>
        <h3 style={{ fontSize: 12, fontWeight: 800, color: '#f0f4ff', marginBottom: 16, letterSpacing: '-0.01em' }}>Style</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Font</label>
          <select className="field" value={font} onChange={(e) => setFont(e.target.value)} style={{ fontSize: 12 }}>
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Background</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {GRADIENTS.map((g) => (
              <button key={g} onClick={() => setBg(g)} style={{ width: 28, height: 28, borderRadius: 6, background: g, cursor: 'pointer', border: bg === g ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.1)', transition: 'border-color 140ms' }} />
            ))}
            <div style={{ position: 'relative' }}>
              <input type="color" value={bg.startsWith('#') ? bg : '#0d0d1a'} onChange={(e) => setBg(e.target.value)}
                style={{ width: 28, height: 28, padding: 2, borderRadius: 6, border: '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Text Color</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {['#f0f4ff', '#ffffff', '#e2e8f0', '#0d0d1a', '#1a1a2e'].map((c) => (
              <button key={c} onClick={() => setTextColor(c)} style={{ width: 24, height: 24, borderRadius: 5, background: c, cursor: 'pointer', border: textColor === c ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.15)', transition: 'border-color 140ms' }} />
            ))}
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: 24, height: 24, padding: 1, borderRadius: 5, border: '1.5px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent' }} />
          </div>
        </div>

        <div>
          <label style={lbl}>Accent Color</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {['#3b82f6', '#ec4899', '#f97316', '#10b981', '#22d3ee', '#8b5cf6', '#fbbf24', '#ef4444'].map((c) => (
              <button key={c} onClick={() => setAccentColor(c)} style={{ width: 24, height: 24, borderRadius: 5, background: c, cursor: 'pointer', border: accentColor === c ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.15)', transition: 'border-color 140ms' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
