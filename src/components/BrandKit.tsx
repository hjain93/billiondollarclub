import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, X, Plus, AlignLeft, Palette, Type, Tag, Zap, Image } from 'lucide-react'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────
interface BrandKitData {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  headingFont: string
  bodyFont: string
  logoUrl: string
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  watermarkOpacity: number
  toneWords: string[]
  avoidWords: string[]
  tagline: string
}

type WatermarkPos = BrandKitData['watermarkPosition']

// ── Constants ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'creator-brand-kit'

const GOOGLE_FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'Montserrat',
  'Playfair Display',
  'Space Grotesk',
  'Oswald',
  'Raleway',
  'Poppins',
  'DM Sans',
  'Sora',
  'Urbanist',
  'Bebas Neue',
]

const DEFAULT_KIT: BrandKitData = {
  primaryColor: '#3b82f6',
  secondaryColor: '#0d0d1a',
  accentColor: '#ec4899',
  headingFont: 'Plus Jakarta Sans',
  bodyFont: 'Inter',
  logoUrl: '',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 60,
  toneWords: ['Authentic', 'Bold', 'Creative'],
  avoidWords: ['Boring', 'Generic'],
  tagline: '',
}

const WATERMARK_POSITIONS: { id: WatermarkPos; label: string }[] = [
  { id: 'top-left',     label: 'TL' },
  { id: 'top-right',    label: 'TR' },
  { id: 'bottom-left',  label: 'BL' },
  { id: 'bottom-right', label: 'BR' },
]

// ── Helpers ───────────────────────────────────────────────────────────
function loadKit(): BrandKitData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_KIT, ...(JSON.parse(raw) as Partial<BrandKitData>) }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_KIT }
}

function saveKit(kit: BrandKitData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kit))
}

// ── Chip Input Component ──────────────────────────────────────────────
function ChipInput({
  chips,
  onAdd,
  onRemove,
  placeholder,
  isAvoid,
}: {
  chips: string[]
  onAdd: (word: string) => void
  onRemove: (index: number) => void
  placeholder: string
  isAvoid: boolean
}) {
  const [input, setInput] = useState('')

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      const word = input.trim().replace(/,$/, '')
      if (word && chips.length < 5 && !chips.includes(word)) {
        onAdd(word)
      }
      setInput('')
    }
  }

  function handleAddClick() {
    const word = input.trim()
    if (word && chips.length < 5 && !chips.includes(word)) {
      onAdd(word)
      setInput('')
    }
  }

  const chipColor = isAvoid ? '#ef4444' : '#3b82f6'
  const chipBg = isAvoid ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)'
  const chipBorder = isAvoid ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)'

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, minHeight: 32 }}>
        <AnimatePresence>
          {chips.map((chip, i) => (
            <motion.span
              key={chip}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                fontSize: 12, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: chipColor, background: chipBg, border: `1px solid ${chipBorder}`,
              }}
            >
              {chip}
              <button
                onClick={() => onRemove(i)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, display: 'flex', color: chipColor, opacity: 0.6,
                  lineHeight: 1,
                }}
                aria-label={`Remove ${chip}`}
              >
                <X size={10} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      {chips.length < 5 && (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAddClick}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0 12px', minWidth: 36 }}
            aria-label="Add word"
          >
            <Plus size={13} />
          </button>
        </div>
      )}
      {chips.length >= 5 && (
        <p style={{ fontSize: 11, color: '#4b5680', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Max 5 words reached
        </p>
      )}
    </div>
  )
}

// ── Color Swatch Row ──────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [hexInput, setHexInput] = useState(value)

  function handleHexBlur() {
    const v = hexInput.trim()
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
    else setHexInput(value)
  }

  useEffect(() => { setHexInput(value) }, [value])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif', minWidth: 90, fontWeight: 600 }}>
        {label}
      </div>
      <input
        type="color"
        value={value}
        onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value) }}
        style={{ width: 34, height: 34, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
        aria-label={`${label} color picker`}
      />
      <div style={{
        width: 34, height: 34, borderRadius: 8, background: value,
        border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
      }} />
      <input
        value={hexInput}
        onChange={(e) => setHexInput(e.target.value)}
        onBlur={handleHexBlur}
        maxLength={7}
        style={{
          width: 88, fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(59,130,246,0.15)', borderRadius: 6, padding: '5px 8px',
          fontFamily: 'Space Mono, monospace', outline: 'none',
        }}
        aria-label={`${label} hex value`}
      />
    </div>
  )
}

// ── Live Preview ──────────────────────────────────────────────────────
function BrandPreview({ kit }: { kit: BrandKitData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 24 }}>

      {/* Section header */}
      <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Live Preview
      </div>

      {/* 1. Brand Card */}
      <div className="card" style={{
        padding: 0, overflow: 'hidden',
        border: `1px solid ${kit.primaryColor}33`,
      }}>
        <div style={{
          height: 80, background: `linear-gradient(135deg, ${kit.primaryColor}, ${kit.accentColor}88)`,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', bottom: -24, left: 20,
            width: 48, height: 48, borderRadius: 14,
            background: kit.secondaryColor,
            border: `3px solid ${kit.accentColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: kit.primaryColor,
            fontFamily: kit.headingFont + ', sans-serif',
          }}>
            {kit.tagline ? kit.tagline[0].toUpperCase() : 'C'}
          </div>
        </div>
        <div style={{ padding: '32px 20px 18px' }}>
          <div style={{
            fontSize: 15, fontWeight: 800, color: '#f0f4ff', marginBottom: 3,
            fontFamily: kit.headingFont + ', sans-serif',
          }}>
            Your Creator Name
          </div>
          <div style={{
            fontSize: 12, color: '#94a3b8', lineHeight: 1.5,
            fontFamily: kit.bodyFont + ', sans-serif',
          }}>
            {kit.tagline || 'Add your tagline below to see it here'}
          </div>
          {kit.toneWords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
              {kit.toneWords.map((w) => (
                <span key={w} style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 600,
                  color: kit.primaryColor, background: kit.primaryColor + '18',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}>
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Thumbnail Mockup */}
      <div style={{
        width: '100%', paddingBottom: '56.25%', position: 'relative',
        borderRadius: 12, overflow: 'hidden',
        background: `linear-gradient(135deg, ${kit.primaryColor}ee 0%, ${kit.primaryColor}66 50%, ${kit.accentColor}44 100%)`,
        border: `1px solid ${kit.primaryColor}44`,
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 16px' }}>
          <div style={{
            fontSize: 18, fontWeight: 900, color: '#fff',
            fontFamily: kit.headingFont + ', sans-serif',
            textShadow: '0 2px 12px rgba(0,0,0,0.7)', textAlign: 'center',
            letterSpacing: '-0.02em', lineHeight: 1.15,
          }}>
            Your Creator Brand
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: kit.accentColor,
            fontFamily: kit.bodyFont + ', sans-serif',
            marginTop: 5, textAlign: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {kit.tagline || 'Tagline goes here'}
          </div>
          {/* Watermark indicator */}
          {[
            { pos: 'top-left',     style: { top: 8, left: 8 } },
            { pos: 'top-right',    style: { top: 8, right: 8 } },
            { pos: 'bottom-left',  style: { bottom: 8, left: 8 } },
            { pos: 'bottom-right', style: { bottom: 8, right: 8 } },
          ].map(({ pos, style }) => (
            <div
              key={pos}
              style={{
                position: 'absolute', ...style,
                fontSize: 8, fontWeight: 700, fontFamily: 'Space Mono, monospace',
                color: pos === kit.watermarkPosition ? '#fff' : '#ffffff33',
                background: pos === kit.watermarkPosition ? kit.accentColor + 'cc' : 'transparent',
                padding: '2px 4px', borderRadius: 3,
                opacity: pos === kit.watermarkPosition ? kit.watermarkOpacity / 100 : 0.25,
                transition: 'all 200ms',
              }}
            >
              WM
            </div>
          ))}
        </div>
      </div>

      {/* 3. Color Palette */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Color Palette
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { color: kit.primaryColor,   label: 'Primary' },
            { color: kit.secondaryColor, label: 'Secondary' },
            { color: kit.accentColor,    label: 'Accent' },
          ].map(({ color, label }) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              <div style={{ width: '100%', height: 40, borderRadius: 8, background: color, border: '1px solid rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 9, color: '#6b7a9a', fontFamily: 'Space Mono, monospace' }}>{color}</span>
              <span style={{ fontSize: 10, color: '#4b5680', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Typography Specimen */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Typography
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 9, color: '#4b5680', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3, fontWeight: 600 }}>
            Heading — {kit.headingFont}
          </div>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.02em',
            fontFamily: kit.headingFont + ', sans-serif',
          }}>
            AaBbCc 123
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#4b5680', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 3, fontWeight: 600 }}>
            Body — {kit.bodyFont}
          </div>
          <div style={{
            fontSize: 13, color: '#94a3b8', lineHeight: 1.6,
            fontFamily: kit.bodyFont + ', sans-serif',
          }}>
            The quick brown fox jumps over the lazy dog.
          </div>
        </div>
      </div>

      {/* 5. Tone words */}
      {(kit.toneWords.length > 0 || kit.avoidWords.length > 0) && (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Brand Voice
          </div>
          {kit.toneWords.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#6b7a9a', marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Your brand is:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {kit.toneWords.map((w) => (
                  <span key={w} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                    color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                  }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          {kit.avoidWords.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#6b7a9a', marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Never:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {kit.avoidWords.map((w) => (
                  <span key={w} style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                    color: '#ef4444', background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    textDecoration: 'line-through', textDecorationColor: 'rgba(239,68,68,0.5)',
                  }}>
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Apply actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, gap: 6 }}
          onClick={() => toast.success('Brand kit will be applied when generating Visual Prompts content')}
        >
          <Zap size={12} /> Apply to Visual Prompts
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1, gap: 6 }}
          onClick={() => toast.success('Brand kit will be applied when generating Thumbnail Lab content')}
        >
          <Image size={12} /> Apply to Thumbnail Lab
        </button>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────
export function BrandKit() {
  const [kit, setKit] = useState<BrandKitData>(() => loadKit())
  const [saved, setSaved] = useState(false)

  // Persist on mount for first-time users
  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) saveKit(kit)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateKit = useCallback(<K extends keyof BrandKitData>(key: K, value: BrandKitData[K]) => {
    setKit((prev) => ({ ...prev, [key]: value }))
  }, [])

  function addToneWord(word: string) {
    setKit((prev) => ({ ...prev, toneWords: [...prev.toneWords, word] }))
  }
  function removeToneWord(index: number) {
    setKit((prev) => ({ ...prev, toneWords: prev.toneWords.filter((_, i) => i !== index) }))
  }
  function addAvoidWord(word: string) {
    setKit((prev) => ({ ...prev, avoidWords: [...prev.avoidWords, word] }))
  }
  function removeAvoidWord(index: number) {
    setKit((prev) => ({ ...prev, avoidWords: prev.avoidWords.filter((_, i) => i !== index) }))
  }

  function handleSave() {
    saveKit(kit)
    setSaved(true)
    toast.success('Brand kit saved!')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ padding: '24px 28px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f0f4ff', letterSpacing: '-0.03em', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Brand Kit
        </h1>
        <p style={{ fontSize: 13, color: '#4b5680', fontWeight: 500, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Your visual identity foundation — stored locally and applied across all creator tools
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '480px 1fr', gap: 28, alignItems: 'start' }}>

        {/* ── Left: Editor ────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section 1: Visual Identity */}
          <SectionCard icon={<Palette size={14} />} label="Visual Identity">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ColorRow label="Primary"   value={kit.primaryColor}   onChange={(v) => updateKit('primaryColor', v)} />
              <ColorRow label="Secondary" value={kit.secondaryColor} onChange={(v) => updateKit('secondaryColor', v)} />
              <ColorRow label="Accent"    value={kit.accentColor}    onChange={(v) => updateKit('accentColor', v)} />
            </div>

            {/* 3-swatch visual */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[kit.primaryColor, kit.secondaryColor, kit.accentColor].map((c, i) => (
                <div key={i} style={{ flex: 1, height: 48, borderRadius: 10, background: c, border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'transform 150ms' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.04)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
                />
              ))}
            </div>
          </SectionCard>

          {/* Section 2: Typography */}
          <SectionCard icon={<Type size={14} />} label="Typography">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Heading Font</label>
                <select
                  className="field"
                  value={kit.headingFont}
                  onChange={(e) => updateKit('headingFont', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: '#f0f4ff', fontFamily: kit.headingFont + ', sans-serif', letterSpacing: '-0.02em' }}>
                  AaBbCc
                </div>
              </div>
              <div>
                <label style={lbl}>Body Font</label>
                <select
                  className="field"
                  value={kit.bodyFont}
                  onChange={(e) => updateKit('bodyFont', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div style={{ marginTop: 8, fontSize: 13, color: '#94a3b8', fontFamily: kit.bodyFont + ', sans-serif', lineHeight: 1.5 }}>
                  AaBbCc
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 3: Logo & Watermark */}
          <SectionCard icon={<Image size={14} />} label="Logo & Watermark">
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Logo URL</label>
              <input
                className="field"
                placeholder="https://... (paste image URL)"
                value={kit.logoUrl}
                onChange={(e) => updateKit('logoUrl', e.target.value)}
              />
              <p style={{ fontSize: 11, color: '#4b5680', margin: '5px 0 0', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Paste an image URL, Google Drive link, or hosted asset
              </p>
              {kit.logoUrl && (
                <div style={{ marginTop: 8, width: 64, height: 64, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(59,130,246,0.2)', background: '#111122' }}>
                  <img src={kit.logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Watermark Position</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 160 }}>
                {WATERMARK_POSITIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => updateKit('watermarkPosition', id)}
                    style={{
                      padding: '8px', borderRadius: 8, cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, fontFamily: 'Space Mono, monospace',
                      background: kit.watermarkPosition === id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${kit.watermarkPosition === id ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.12)'}`,
                      color: kit.watermarkPosition === id ? '#3b82f6' : '#6b7a9a',
                      transition: 'all 150ms',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Watermark Opacity: <span style={{ color: '#94a3b8', fontFamily: 'Space Mono, monospace' }}>{kit.watermarkOpacity}%</span></label>
              <input
                type="range"
                min={10}
                max={100}
                value={kit.watermarkOpacity}
                onChange={(e) => updateKit('watermarkOpacity', parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
              />
            </div>
          </SectionCard>

          {/* Section 4: Tone of Voice */}
          <SectionCard icon={<AlignLeft size={14} />} label="Tone of Voice">
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>5 words that define your brand</label>
              <ChipInput
                chips={kit.toneWords}
                onAdd={addToneWord}
                onRemove={removeToneWord}
                placeholder="e.g. Authentic, Bold… press Enter"
                isAvoid={false}
              />
            </div>
            <div>
              <label style={lbl}>5 words you NEVER use</label>
              <ChipInput
                chips={kit.avoidWords}
                onAdd={addAvoidWord}
                onRemove={removeAvoidWord}
                placeholder="e.g. Boring, Generic… press Enter"
                isAvoid={true}
              />
            </div>
          </SectionCard>

          {/* Section 5: Tagline */}
          <SectionCard icon={<Tag size={14} />} label="Brand Tagline">
            <label style={lbl}>Your creator tagline or unique value prop</label>
            <input
              className="field"
              placeholder="e.g. Helping creators build systems that scale…"
              value={kit.tagline}
              onChange={(e) => updateKit('tagline', e.target.value)}
              maxLength={120}
            />
            <div style={{ fontSize: 11, color: '#4b5680', marginTop: 5, fontFamily: 'Plus Jakarta Sans, sans-serif', textAlign: 'right' }}>
              {kit.tagline.length}/120
            </div>
          </SectionCard>

          {/* Save */}
          <motion.button
            onClick={handleSave}
            className="btn btn-blue"
            style={{ width: '100%', gap: 8, justifyContent: 'center', marginTop: 4 }}
            animate={saved ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <Save size={14} />
            {saved ? 'Brand Kit Saved!' : 'Save Brand Kit'}
          </motion.button>
        </div>

        {/* ── Right: Preview ──────────────────────────────────────── */}
        <BrandPreview kit={kit} />
      </div>
    </div>
  )
}

// ── Section Card wrapper ──────────────────────────────────────────────
function SectionCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#3b82f6', flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#f0f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif', letterSpacing: '-0.01em' }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

// ── Shared label style ────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 800,
  color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.07em',
  marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif',
}
