import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Mic, Lightbulb, Monitor, Cpu, Package,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'

type BudgetKey = '0' | '10000' | '25000' | '50000' | '100000'
type ContentTypeKey = 'talking-head' | 'vlog' | 'podcast' | 'gaming' | 'tutorial'

interface GearItem {
  category: 'Camera' | 'Microphone' | 'Lighting' | 'Editing Software' | 'Accessories' | 'Audio Interface'
  name: string
  price: number
  why: string
  affiliateHint: string
  isUpgrade?: boolean
}

const CATEGORY_ICONS: Record<GearItem['category'], React.ReactNode> = {
  Camera: <Camera size={13} />,
  Microphone: <Mic size={13} />,
  Lighting: <Lightbulb size={13} />,
  'Editing Software': <Monitor size={13} />,
  Accessories: <Package size={13} />,
  'Audio Interface': <Cpu size={13} />,
}

const CATEGORY_COLORS: Record<GearItem['category'], string> = {
  Camera: '#3b82f6',
  Microphone: '#ec4899',
  Lighting: '#f59e0b',
  'Editing Software': '#10b981',
  Accessories: '#a78bfa',
  'Audio Interface': '#06b6d4',
}

type GearStack = GearItem[]

const GEAR_STACKS: Record<BudgetKey, Record<ContentTypeKey, GearStack>> = {
  '0': {
    'talking-head': [
      { category: 'Camera',           name: 'Existing Smartphone',         price: 0,    why: 'Modern phones shoot 4K — use portrait mode for depth', affiliateHint: 'Use what you have' },
      { category: 'Microphone',       name: 'Boya BY-M1 Lavalier',         price: 999,  why: 'Eliminates room echo, dramatically better than phone mic', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Ring Light 10"',              price: 1500, why: 'Fills shadows and adds catch-light to eyes', affiliateHint: 'Available on Amazon India / Flipkart' },
      { category: 'Accessories',      name: 'Phone Tripod',                price: 499,  why: 'Eliminates shaky footage entirely', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'CapCut (Free)',               price: 0,    why: 'Auto-captions, trending templates, and direct Reels export', affiliateHint: 'Free — iOS & Android' },
    ],
    'vlog': [
      { category: 'Camera',           name: 'Existing Smartphone',         price: 0,    why: 'Stabilized video mode handles handheld shooting well', affiliateHint: 'Use what you have' },
      { category: 'Microphone',       name: 'Boya BY-M1 Lavalier',         price: 999,  why: 'Wind-resistant for outdoor shoots', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Phone Gimbal (Basic)',         price: 2500, why: 'Smooth walking shots transform video quality', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'CapCut (Free)',               price: 0,    why: 'Motion tracking and B-roll cuts made easy', affiliateHint: 'Free — iOS & Android' },
    ],
    'podcast': [
      { category: 'Microphone',       name: 'Boya BY-M1 Lavalier',         price: 999,  why: 'Acceptable for audio-only podcast starts', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Phone Tripod',                price: 499,  why: 'Stable desk recording setup', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Audacity (Free)',             price: 0,    why: 'Noise reduction and audio normalisation', affiliateHint: 'Free — Desktop' },
    ],
    'gaming': [
      { category: 'Accessories',      name: 'OBS Studio (Free)',           price: 0,    why: 'Industry-standard for screen + cam recording', affiliateHint: 'Free — Desktop' },
      { category: 'Microphone',       name: 'Boya BY-M1 Lavalier',         price: 999,  why: 'Better commentary audio vs built-in headset mic', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,    why: 'Professional colour grading for thumbnails', affiliateHint: 'Free — Desktop' },
    ],
    'tutorial': [
      { category: 'Camera',           name: 'Existing Smartphone',         price: 0,    why: 'Overhead shooting works for flat-lay tutorials', affiliateHint: 'Use what you have' },
      { category: 'Lighting',         name: 'Ring Light 10"',              price: 1500, why: 'Even lighting reduces shadows on work surface', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'CapCut (Free)',               price: 0,    why: 'Step-by-step text overlays and zoom cuts', affiliateHint: 'Free — iOS & Android' },
    ],
  },
  '10000': {
    'talking-head': [
      { category: 'Camera',           name: 'Smartphone + Moment Lens',    price: 3500, why: 'Wider FOV and cinematic bokeh on your existing phone', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Boya BY-MM1 Shotgun',         price: 2500, why: 'On-camera directional mic, no cables needed', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Ring Light 18"',              price: 3000, why: 'Large catch-light suits talking-head format perfectly', affiliateHint: 'Available on Amazon India / Flipkart' },
      { category: 'Accessories',      name: 'Gorilla Pod Flexible Tripod', price: 1500, why: 'Versatile positioning for desktop or shelf setups', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,    why: 'Professional colour grading at zero cost', affiliateHint: 'Free — Desktop' },
    ],
    'vlog': [
      { category: 'Camera',           name: 'Smartphone Gimbal (Hohem M6)',price: 4500, why: '3-axis stabilisation for professional walking shots', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Boya BY-MM1 Shotgun',         price: 2500, why: 'Mounts on gimbal, captures natural ambient audio', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'ND Filter Set (67mm)',        price: 1500, why: 'Prevents blown highlights in outdoor daylight', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,    why: 'LUT support for cinematic colour grading', affiliateHint: 'Free — Desktop' },
    ],
    'podcast': [
      { category: 'Microphone',       name: 'Maono AU-A04 USB Condenser',  price: 3500, why: 'Cardioid pattern rejects room noise, plug-and-play USB', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Scissor Arm Mount',           price: 1200, why: 'Positions mic at mouth level for consistent audio', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Pop Filter',                  price: 400,  why: 'Eliminates plosive sounds (B, P, D letters)', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'LED Desk Panel Light',        price: 2500, why: 'Video podcast needs good face lighting for YouTube', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Audacity (Free)',             price: 0,    why: 'EQ, compression, and noise gate for podcast audio', affiliateHint: 'Free — Desktop' },
    ],
    'gaming': [
      { category: 'Accessories',      name: 'Capture Card (Ezcap)',        price: 3500, why: 'Required for console capture; PC can use OBS directly', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'HyperX QuadCast USB',         price: 5500, why: 'Cardioid mode prevents keyboard noise from reaching mic', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'RGB Key Light Bar',           price: 1500, why: 'Adds production value to face-cam overlay', affiliateHint: 'Available on Amazon India' },
    ],
    'tutorial': [
      { category: 'Camera',           name: 'Logitech C920 Webcam',        price: 4500, why: 'Wide-angle for full workspace capture, auto-focus', affiliateHint: 'Available on Amazon India / Flipkart' },
      { category: 'Microphone',       name: 'Maono AU-A04 USB Condenser',  price: 3500, why: 'Rich, clear voice for screen-share tutorials', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Ring Light 18"',              price: 3000, why: 'Even face lighting for picture-in-picture overlays', affiliateHint: 'Available on Amazon India' },
    ],
  },
  '25000': {
    'talking-head': [
      { category: 'Camera',           name: 'Sony ZV-E10 / Fuji X-A7',    price: 18000, why: 'APS-C sensor with proper depth-of-field, in-body stabilisation', affiliateHint: 'Available on Amazon India / B&H Photo' },
      { category: 'Microphone',       name: 'Rode VideoMicro',             price: 6000,  why: 'Super-cardioid capsule, no battery required', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light Mini',       price: 8000,  why: 'App-controlled colour temperature, no colour cast', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: '50mm f/1.8 Kit Lens',         price: 0,     why: 'Included with kit — best subject-background separation under ₹25k', affiliateHint: 'Included in kit' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,     why: 'Handles Sony S-Log and Fuji F-Log colour grading', affiliateHint: 'Free — Desktop' },
    ],
    'vlog': [
      { category: 'Camera',           name: 'Sony ZV-1F',                  price: 20000, why: 'Flip screen, Product Showcase mode, wide 20mm lens for selfie vlog', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Rode Wireless GO II',         price: 0,     why: 'Upgrade path — current budget fits Boya BY-WM4 Pro (₹5000)', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Boya BY-WM4 Pro Wireless',    price: 5000,  why: 'Wireless lav for on-the-go interviews and outdoor vlogs', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,     why: 'Colour match multiple scenes from a vlog day', affiliateHint: 'Free — Desktop' },
    ],
    'podcast': [
      { category: 'Microphone',       name: 'Shure SM7dB Dynamic USB',     price: 18000, why: 'Industry-standard broadcast mic, handles untreated rooms well', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Focusrite Scarlett Solo',     price: 7000,  why: 'Clean preamp adds headroom for multiple guests', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'LED Softbox 45W',             price: 3500,  why: 'Soft diffused light for video podcast thumbnail shots', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Adobe Audition (₹1600/mo)',   price: 1600,  why: 'Spectral repair for removing background noise', affiliateHint: 'Adobe.com subscription' },
    ],
    'gaming': [
      { category: 'Camera',           name: 'Logitech Brio 4K Webcam',     price: 12000, why: '4K 60fps face-cam with HDR, works in low-light gaming rooms', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'HyperX QuadCast S',           price: 9000,  why: 'RGB aesthetic suits gaming setups, cardioid + anti-vibe mount', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light Air',        price: 7000,  why: 'Soft key light that does not wash out monitor screens', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,     why: 'Fusion for motion graphics overlays and lower thirds', affiliateHint: 'Free — Desktop' },
    ],
    'tutorial': [
      { category: 'Camera',           name: 'Sony ZV-E10 + Overhead Mount',price: 19000, why: 'Tilting screen lets you monitor overhead framing', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Rode NT-USB Mini',            price: 6000,  why: 'Condenser mic captures natural voice for long-form tutorials', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Two-Point LED Panel Kit',     price: 4500,  why: 'Key + fill setup eliminates shadows on work surface', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve (Free)',      price: 0,     why: 'Precision cut tool for tight tutorial edits', affiliateHint: 'Free — Desktop' },
    ],
  },
  '50000': {
    'talking-head': [
      { category: 'Camera',           name: 'Sony ZV-E10 II / A6400',      price: 28000, why: 'Eye-tracking AF keeps focus during expressive movements', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Rode VideoMic NTG',           price: 12000, why: 'Broadcast-quality on-camera mic with USB monitoring', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light (Two Units)', price: 16000, why: 'Key + fill with app-sync eliminates hard shadows', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Sigma 16mm f/1.4 Lens',       price: 22000, why: 'Natural perspective for talking-head, razor-sharp at f/2.8', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve Studio',      price: 8000,  why: 'Neural Engine noise reduction for low-light shots', affiliateHint: 'One-time purchase at Blackmagic Design' },
    ],
    'vlog': [
      { category: 'Camera',           name: 'Sony ZV-E10 II',              price: 28000, why: 'Best flip-screen APS-C for solo vloggers, 4K30 with IBIS', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Rode Wireless GO II',         price: 20000, why: 'Dual-channel wireless up to 200m range, built-in backup recording', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Joby GorillaPod Rig',         price: 5000,  why: 'Flexible tripod + cold shoe for compact travel kit', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve Studio',      price: 8000,  why: 'Colour match multiple cameras across a travel day', affiliateHint: 'One-time purchase' },
    ],
    'podcast': [
      { category: 'Microphone',       name: 'Shure SM7B + Cloud Lifter',   price: 25000, why: 'The industry gold standard — used by every major podcaster', affiliateHint: 'Available on Amazon India' },
      { category: 'Audio Interface',  name: 'Focusrite Scarlett 2i2 4th Gen', price: 12000, why: 'Ultra-low latency monitoring, two mic inputs for guests', affiliateHint: 'Available on Amazon India' },
      { category: 'Camera',           name: 'Sony ZV-E10 for Video Podcast', price: 18000, why: 'Video podcasting grows reach 40% vs audio-only', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light + Fill',     price: 16000, why: 'Two-point setup for talking-head video podcast', affiliateHint: 'Available on Amazon India' },
    ],
    'gaming': [
      { category: 'Camera',           name: 'Sony ZV-E10 + Elgato Cam Link', price: 32000, why: 'DSLR face-cam gives you an edge over webcam-only streamers', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Shure SM7dB',                 price: 20000, why: 'Rejects PC fan noise and keyboard clicks naturally', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light Air',        price: 7000,  why: 'Does not introduce screen reflections on monitors', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Stream Deck MK.2',            price: 12000, why: 'One-touch scene switching during live streams', affiliateHint: 'Available on Amazon India' },
    ],
    'tutorial': [
      { category: 'Camera',           name: 'Sony ZV-E10 II + Overhead Rig', price: 32000, why: 'C-stand overhead rig for flat-lay and hands-only shots', affiliateHint: 'Available on Amazon India' },
      { category: 'Microphone',       name: 'Rode NT-USB Mini',            price: 6000,  why: 'Cardioid USB condenser, no interface required', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Godox SL-60W LED + Softbox', price: 8000,  why: 'Professional softbox for shadow-free tutorial lighting', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve Studio',      price: 8000,  why: 'Speed editor cuts tutorial sequences 50% faster', affiliateHint: 'One-time purchase' },
    ],
  },
  '100000': {
    'talking-head': [
      { category: 'Camera',           name: 'Sony FX30 / Fuji X-S20',      price: 55000, why: 'Cinema-sensor with S-Cinetone for broadcast-grade skin tones', affiliateHint: 'Available on Amazon India / Authorized dealers' },
      { category: 'Microphone',       name: 'Sennheiser MKE 600',          price: 18000, why: 'Reference-quality shotgun, flat frequency response', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Aputure Amaran 200d + Softbox', price: 25000, why: 'Bowens-mount system for complete lighting control', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Sigma 18-50mm f/2.8 Zoom',   price: 35000, why: 'Versatile prime-fast zoom for B-roll without lens changes', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve Studio',      price: 8000,  why: 'Full Hollywood-grade colour science and noise reduction', affiliateHint: 'One-time purchase' },
    ],
    'vlog': [
      { category: 'Camera',           name: 'Sony FX30',                   price: 55000, why: 'Cinema sensor in vlog body — unique at this price point', affiliateHint: 'Available on authorized dealers' },
      { category: 'Microphone',       name: 'Rode Wireless Pro',           price: 30000, why: '32-bit float recording never clips, perfect for travel', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'DJI OM 6 Gimbal',            price: 12000, why: 'ActiveTrack 6.0 keeps you in frame while moving', affiliateHint: 'Available on Amazon India / DJI Store' },
      { category: 'Lighting',         name: 'Aputure MC Pro (Pocket LED)', price: 15000, why: 'Pocket RGB light for creative on-location lighting', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Final Cut Pro (one-time)',    price: 24000, why: 'Magnetic timeline fastest for long-form vlog assembly', affiliateHint: 'Apple App Store India' },
    ],
    'podcast': [
      { category: 'Microphone',       name: 'Shure SM7B × 2',             price: 42000, why: 'Two mics for host + guest, matched audio quality', affiliateHint: 'Available on Amazon India' },
      { category: 'Audio Interface',  name: 'Focusrite Scarlett 4i4',     price: 18000, why: 'Four inputs for panel discussions and bands', affiliateHint: 'Available on Amazon India' },
      { category: 'Camera',           name: 'Sony A7C II (Video Podcast)', price: 95000, why: 'Full-frame sensor — best-in-class for video podcast talking-head', affiliateHint: 'Budget allows one unit' },
      { category: 'Lighting',         name: 'Aputure 120d II + Softbox',  price: 35000, why: 'Daylight-balanced studio light, CRI 96+ for accurate skin tones', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Adobe Audition + Premiere',  price: 4800,  why: 'Dynamic Link between Audition and Premiere saves 2hrs/episode', affiliateHint: 'Adobe Creative Cloud subscription/month' },
    ],
    'gaming': [
      { category: 'Camera',           name: 'Sony A7C + Cam Link 4K',      price: 80000, why: 'Full-frame bokeh separates you from every other streamer', affiliateHint: 'Available on authorized dealers' },
      { category: 'Microphone',       name: 'Shure SM7B + GoXLR Mini',    price: 35000, why: 'Integrated mixer lets you control game/mic mix live', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Elgato Key Light × 2',       price: 16000, why: 'Matched two-point setup with app sync', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Stream Deck + Capture Card',  price: 22000, why: 'Professional stream control — scene, alerts, clips in one hand', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'DaVinci Resolve Studio',      price: 8000,  why: 'Fusion for motion graphic overlays and animated titles', affiliateHint: 'One-time purchase' },
    ],
    'tutorial': [
      { category: 'Camera',           name: 'Sony FX30 + Overhead C-Stand', price: 60000, why: 'Cinema sensor overhead — no soft focus or rolling shutter', affiliateHint: 'Available on authorized dealers' },
      { category: 'Microphone',       name: 'Rode NT1 5th Gen',            price: 18000, why: 'Ultra-low noise condenser, captures every articulation clearly', affiliateHint: 'Available on Amazon India' },
      { category: 'Lighting',         name: 'Godox SL-150W + Large Softbox', price: 15000, why: 'Powerful enough to overpower window light for consistent looks', affiliateHint: 'Available on Amazon India' },
      { category: 'Accessories',      name: 'Teleprompter (Parrot 2)',      price: 12000, why: 'Read scripts while maintaining direct eye contact with lens', affiliateHint: 'Available on Amazon India' },
      { category: 'Editing Software', name: 'Final Cut Pro',               price: 24000, why: 'Range tool and Flow Transitions speed up tutorial assembly', affiliateHint: 'Apple App Store India' },
    ],
  },
}

const BUDGET_OPTIONS: { key: BudgetKey; label: string; sub: string }[] = [
  { key: '0',      label: 'Phone Only', sub: 'Start with what you have' },
  { key: '10000',  label: 'Starter',    sub: '₹10,000 entry-level' },
  { key: '25000',  label: 'Creator',    sub: '₹25,000 mid-range' },
  { key: '50000',  label: 'Pro',        sub: '₹50,000 serious setup' },
  { key: '100000', label: 'Studio',     sub: '₹1,00,000+ professional' },
]

const CONTENT_TYPES: { key: ContentTypeKey; label: string }[] = [
  { key: 'talking-head', label: 'Talking Head' },
  { key: 'vlog',         label: 'Vlog' },
  { key: 'podcast',      label: 'Podcast' },
  { key: 'gaming',       label: 'Gaming' },
  { key: 'tutorial',     label: 'Tutorial' },
]

const CREATOR_TIPS: Record<ContentTypeKey, string[]> = {
  'talking-head': [
    'Use a window as your key light before buying any lighting gear — position it at 45° to your face.',
    'Your phone\'s portrait mode blurs the background better than any lens under ₹10,000.',
    'Audio quality matters 3× more than video quality for audience retention.',
  ],
  'vlog': [
    'Shoot into the sun in golden hour — natural backlight looks more cinematic than any key light.',
    'Pre-plan your thumbnail shot before going home — you never get that location twice.',
    'Keep A-roll (talking segments) under 30 seconds each; cut to B-roll to maintain pace.',
  ],
  'podcast': [
    'Record in a wardrobe surrounded by clothes — it\'s the cheapest acoustic treatment.',
    'Always record a 30-second "room tone" clip at the start; use it to fill edits seamlessly.',
    'Video podcasts on YouTube outperform audio-only by 3–5× in discoverability.',
  ],
  'gaming': [
    'Reaction moments matter more than gameplay skill — always keep your face-cam active.',
    'Clip your best moments mid-session using OBS hotkey; don\'t rely on memory.',
    'A good title + thumbnail drives 10× more views than the highest-quality gameplay.',
  ],
  'tutorial': [
    'Script the intro first — most viewers decide to stay or leave in the first 15 seconds.',
    'Show the end result in the thumbnail so viewers know exactly what they\'ll build.',
    'Split long tutorials into parts — a 3-part series gets more total views than one 30-min video.',
  ],
}

const NEXT_BUDGET: Record<BudgetKey, BudgetKey | null> = {
  '0':      '10000',
  '10000':  '25000',
  '25000':  '50000',
  '50000':  '100000',
  '100000': null,
}

const spring = { type: 'spring', stiffness: 300, damping: 28 } as const

function fmtPrice(n: number) {
  if (n === 0) return 'Free'
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

export function GearGuide() {
  const [selectedBudget, setSelectedBudget] = useState<BudgetKey>('10000')
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeKey>('talking-head')
  const [showUpgradePath, setShowUpgradePath] = useState(false)

  const stack = GEAR_STACKS[selectedBudget][selectedContentType]
  const totalCost = stack.reduce((s, g) => s + g.price, 0)

  const nextBudget = NEXT_BUDGET[selectedBudget]
  const upgradeStack = nextBudget ? GEAR_STACKS[nextBudget][selectedContentType] : null

  const tips = CREATOR_TIPS[selectedContentType]

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Camera size={20} color="#3b82f6" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>
            Gear Guide
          </h1>
        </div>
        <p style={{ color: '#4b5680', fontSize: 13, fontWeight: 500, margin: 0 }}>
          Budget-based equipment recommendations for every type of creator
        </p>
      </motion.div>

      {/* Section 1: Budget Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        style={{ marginBottom: 20 }}
      >
        <div className="sec-label" style={{ marginBottom: 10 }}>Select Your Budget</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.key}
              onClick={() => setSelectedBudget(b.key)}
              style={{
                background: selectedBudget === b.key ? 'rgba(59,130,246,0.12)' : 'rgba(13,13,26,0.8)',
                border: `1.5px solid ${selectedBudget === b.key ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
                borderRadius: 12,
                padding: '14px 12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 150ms ease',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: selectedBudget === b.key ? '#3b82f6' : '#f0f4ff', marginBottom: 4 }}>
                {b.label}
              </div>
              <div style={{ fontSize: 11, color: '#4b5680', lineHeight: 1.3 }}>{b.sub}</div>
            </button>
          ))}
        </div>

        {/* Content type pills */}
        <div className="sec-label" style={{ marginBottom: 10 }}>Content Type</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CONTENT_TYPES.map((ct) => (
            <button
              key={ct.key}
              onClick={() => setSelectedContentType(ct.key)}
              style={{
                background: selectedContentType === ct.key ? 'rgba(59,130,246,0.15)' : 'rgba(13,13,26,0.8)',
                border: `1.5px solid ${selectedContentType === ct.key ? '#3b82f6' : 'rgba(59,130,246,0.15)'}`,
                borderRadius: 20,
                padding: '7px 16px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: selectedContentType === ct.key ? '#3b82f6' : '#94a3b8',
                transition: 'all 150ms ease',
              }}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section 2: Gear Stack */}
      <motion.div
        key={`${selectedBudget}-${selectedContentType}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        style={{ marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="sec-label">
            Recommended Gear Stack — {BUDGET_OPTIONS.find((b) => b.key === selectedBudget)?.label} × {CONTENT_TYPES.find((c) => c.key === selectedContentType)?.label}
          </div>
          <div style={{ fontSize: 12, color: '#4b5680' }}>
            Total: <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700, color: '#f59e0b' }}>{fmtPrice(totalCost)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stack.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              className="card"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}
            >
              {/* Category badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: `${CATEGORY_COLORS[item.category]}18`,
                color: CATEGORY_COLORS[item.category],
                borderRadius: 8, padding: '5px 10px', flexShrink: 0,
                fontSize: 11, fontWeight: 700, minWidth: 100,
              }}>
                {CATEGORY_ICONS[item.category]}
                {item.category}
              </div>

              {/* Name + why */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#6b7a9a' }}>{item.why}</div>
              </div>

              {/* Price */}
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 13,
                fontWeight: 800,
                color: item.price === 0 ? '#10b981' : '#f0f4ff',
                flexShrink: 0,
                minWidth: 56,
                textAlign: 'right',
              }}>
                {fmtPrice(item.price)}
              </div>

              {/* Affiliate hint + CTA */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#4b5680', marginBottom: 4 }}>{item.affiliateHint}</div>
                {item.price > 0 && (
                  <button
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#3b82f6', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: 0, transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <ExternalLink size={10} />
                    View on Amazon
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Total row */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10,
          marginTop: 12, padding: '12px 18px',
          borderTop: '1px solid rgba(59,130,246,0.1)',
        }}>
          <span style={{ fontSize: 12, color: '#4b5680', fontWeight: 600 }}>Total Stack Cost</span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 800, color: '#f59e0b' }}>
            {totalCost === 0 ? 'Free' : `₹${totalCost.toLocaleString('en-IN')}`}
          </span>
        </div>
      </motion.div>

      {/* Section 3: Upgrade Path */}
      {upgradeStack && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          style={{ marginBottom: 20 }}
        >
          <button
            onClick={() => setShowUpgradePath((v) => !v)}
            style={{
              width: '100%', background: 'rgba(13,13,26,0.8)',
              border: '1.5px solid rgba(59,130,246,0.15)',
              borderRadius: 12, padding: '14px 18px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', transition: 'border-color 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)')}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>
              When you're ready to level up to{' '}
              <span style={{ color: '#3b82f6' }}>{BUDGET_OPTIONS.find((b) => b.key === nextBudget)?.label}</span>...
            </span>
            {showUpgradePath ? <ChevronUp size={15} color="#4b5680" /> : <ChevronDown size={15} color="#4b5680" />}
          </button>

          <AnimatePresence>
            {showUpgradePath && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upgradeStack.map((nextItem, i) => {
                    const currentItem = stack.find((s) => s.category === nextItem.category)
                    return (
                      <div
                        key={nextItem.name}
                        style={{
                          padding: '13px 16px', borderRadius: 10,
                          background: 'rgba(59,130,246,0.04)',
                          border: '1px solid rgba(59,130,246,0.12)',
                          display: 'flex', gap: 12, alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ color: CATEGORY_COLORS[nextItem.category], flexShrink: 0, marginTop: 2 }}>
                          {CATEGORY_ICONS[nextItem.category]}
                        </div>
                        <div style={{ flex: 1 }}>
                          {currentItem && currentItem.name !== nextItem.name ? (
                            <>
                              <div style={{ fontSize: 12, color: '#6b7a9a', marginBottom: 3 }}>
                                <span style={{ textDecoration: 'line-through' }}>{currentItem.name}</span>
                                <span style={{ color: '#4b5680', margin: '0 6px' }}>→</span>
                                <span style={{ color: '#f0f4ff', fontWeight: 700 }}>{nextItem.name}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#4b5680' }}>Impact: {nextItem.why}</div>
                            </>
                          ) : (
                            <>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f4ff', marginBottom: 3 }}>
                                + Add: {nextItem.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#4b5680' }}>Impact: {nextItem.why}</div>
                            </>
                          )}
                        </div>
                        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>
                          {fmtPrice(nextItem.price)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
                          <span
                            key={i}
                            style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                              background: 'rgba(167,139,250,0.15)', color: '#a78bfa',
                            }}
                          >
                            Upgrade
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* New Creator Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.15 }}
      >
        <div className="sec-label" style={{ marginBottom: 12 }}>
          Creator Tips for {CONTENT_TYPES.find((c) => c.key === selectedContentType)?.label}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {tips.map((tip, i) => (
            <div
              key={i}
              className="card"
              style={{ padding: '16px 18px', borderLeft: '3px solid #3b82f6' }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)', color: '#3b82f6',
                fontSize: 11, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10, flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{tip}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
