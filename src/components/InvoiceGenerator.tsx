import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store'
import {
  FileText, Download, Plus, X, Eye, Copy, Edit3,
  CheckCircle, Building, User, Calendar, Receipt,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface LineItem {
  id: string
  description: string
  qty: number
  rate: number
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  creatorName: string
  creatorEmail: string
  creatorAddress: string
  gstNumber: string
  clientCompany: string
  clientContact: string
  clientEmail: string
  clientAddress: string
  lineItems: LineItem[]
  gstRate: number | null
  tdsEnabled: boolean
  notes: string
  upiId: string
  bankName: string
  accountNumber: string
  ifsc: string
}

interface SavedInvoice {
  id: string
  invoiceNumber: string
  clientCompany: string
  amount: number
  date: string
  status: 'Paid' | 'Pending' | 'Overdue'
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  clauses: string[]
  content: string
}

interface ContractVars {
  BRAND_NAME: string
  AMOUNT: string
  DELIVERABLES: string
  DATE: string
  CREATOR_NAME: string
  DEADLINE: string
  REVISION_ROUNDS: string
  PAYMENT_METHOD: string
  EXCLUSIVITY_TERMS: string
  USAGE_PERIOD: string
  LIST_OF_DELIVERABLES: string
}

interface RateCardData {
  instagramPost: string
  instagramReel: string
  instagramStory: string
  youtubeDedicated: string
  youtubeIntegration: string
  youtubeShort: string
  twitterThread: string
  linkedinArticle: string
  ugcVideo: string
  blogPost: string
  followersIG: string
  followersYT: string
  followersLI: string
  avgViews: string
  engagementRate: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DS = {
  bg: '#080810',
  card: '#0d0d1a',
  cardHover: '#111125',
  border: 'rgba(59,130,246,0.1)',
  borderHover: 'rgba(59,130,246,0.25)',
  primary: '#3b82f6',
  primaryDim: 'rgba(59,130,246,0.15)',
  success: '#10b981',
  successDim: 'rgba(16,185,129,0.15)',
  warning: '#f59e0b',
  warningDim: 'rgba(245,158,11,0.15)',
  danger: '#ef4444',
  dangerDim: 'rgba(239,68,68,0.15)',
  text: '#f0f4ff',
  muted: '#4b5680',
  mutedLight: '#6b7ab0',
  fontSans: "'Plus Jakarta Sans', sans-serif",
  fontMono: "'Space Mono', monospace",
}

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'basic',
    name: 'Basic Brand Deal',
    description: 'Simple collaboration agreement for one-off campaigns',
    clauses: [
      'Clear deliverables & deadlines',
      'Payment terms & milestones',
      'Content approval process',
      'ASCI disclosure compliance',
    ],
    content: `CONTENT COLLABORATION AGREEMENT

This agreement is entered into on [DATE] between:
Creator: [CREATOR_NAME] ("Creator")
Brand: [BRAND_NAME] ("Brand")

SCOPE OF WORK:
Creator agrees to create [DELIVERABLES] for Brand in exchange for compensation of INR [AMOUNT] (exclusive of applicable taxes).

DELIVERABLES:
- [LIST_OF_DELIVERABLES]
- Content shall be delivered by [DEADLINE]
- [REVISION_ROUNDS] rounds of revisions included

PAYMENT TERMS:
50% advance upon signing, 50% upon final delivery.
Payment via [PAYMENT_METHOD]. TDS @10% as applicable under Section 194J.

CONTENT APPROVAL:
Brand shall review and provide feedback within 3 business days. Silence implies approval.

EXCLUSIVITY: Creator agrees to [EXCLUSIVITY_TERMS] during the campaign period.

CONTENT RIGHTS: Brand receives right to repurpose content for [USAGE_PERIOD].

DISCLOSURE: Creator will disclose paid partnership as per ASCI guidelines using #Ad or #Sponsored.

GOVERNING LAW: This agreement is governed by the laws of India.

Signatures:
Creator: _____________________ Date: _________
Brand Rep: ___________________ Date: _________`,
  },
  {
    id: 'sponsored-video',
    name: 'Sponsored Video Contract',
    description: 'Full production deal for YouTube/Instagram video campaigns',
    clauses: [
      'Script approval & revisions',
      'Usage rights & exclusivity window',
      'Kill fee clause',
      'Performance-linked bonus terms',
    ],
    content: `SPONSORED VIDEO PRODUCTION AGREEMENT

This Sponsored Video Production Agreement ("Agreement") is entered into on [DATE] between:
Creator: [CREATOR_NAME] ("Creator/Producer")
Brand: [BRAND_NAME] ("Sponsor")

1. ENGAGEMENT
Sponsor engages Creator to produce [DELIVERABLES] ("Content") as per the brief provided.

2. DELIVERABLES & TIMELINE
- [LIST_OF_DELIVERABLES]
- First draft due: [DEADLINE]
- [REVISION_ROUNDS] rounds of revisions included
- Final delivery within 5 business days of approval

3. COMPENSATION
Total Fee: INR [AMOUNT] (exclusive of GST)
- 50% advance upon agreement signing
- 50% upon final approved delivery
TDS @10% under Section 194J will be deducted by Sponsor.

4. SCRIPT APPROVAL
Creator will submit a brief/script outline for approval before production begins.

5. USAGE RIGHTS
Sponsor may use the final Content for paid promotion, organic social, and website for [USAGE_PERIOD] from delivery date.

6. EXCLUSIVITY
Creator agrees to [EXCLUSIVITY_TERMS] from the content go-live date.

7. KILL FEE
If Sponsor cancels after production has begun, a kill fee of 25% of total contract value is payable.

8. PAYMENT METHOD
Payment via [PAYMENT_METHOD]. GST invoice to be provided by Creator.

9. DISCLOSURE
Creator will include "Paid Partnership with [BRAND_NAME]" as required by ASCI and platform guidelines.

Creator: _____________________ Date: _________
Brand Rep: ___________________ Date: _________`,
  },
  {
    id: 'ambassador',
    name: 'Long-term Ambassador',
    description: 'Multi-month partnership with recurring deliverables',
    clauses: [
      'Monthly content obligations',
      'Exclusivity across competitor categories',
      'Performance review milestones',
      'Renewal & termination clauses',
    ],
    content: `BRAND AMBASSADOR AGREEMENT

This Brand Ambassador Agreement ("Agreement") is entered into on [DATE] between:
Creator: [CREATOR_NAME] ("Ambassador")
Brand: [BRAND_NAME] ("Brand")

1. AMBASSADOR ENGAGEMENT
Brand appoints Creator as Brand Ambassador for a period of [USAGE_PERIOD] commencing [DATE].

2. MONTHLY DELIVERABLES
- [LIST_OF_DELIVERABLES] per month
- [REVISION_ROUNDS] rounds of revisions per deliverable
- Content calendar to be shared 7 days in advance

3. COMPENSATION
Monthly Retainer: INR [AMOUNT] per month
Payment by 5th of each month via [PAYMENT_METHOD].
TDS @10% under Section 194J applicable.

4. EXCLUSIVITY
Creator agrees to [EXCLUSIVITY_TERMS] for the duration of this agreement.

5. PERFORMANCE REVIEW
Quarterly review meetings to assess performance metrics. Brand may terminate with 30 days notice if KPIs consistently unmet.

6. TERMINATION
Either party may terminate with 30 days written notice. Brand to pay pro-rata for work completed.

7. DELIVERABLES
- [LIST_OF_DELIVERABLES]
- All deliverables to be completed by [DEADLINE] each month

8. DISCLOSURE
All content will be disclosed as brand partnership per ASCI guidelines.

9. GOVERNING LAW
This agreement is governed by the laws of India. Disputes subject to jurisdiction of [DATE] courts.

Ambassador: __________________ Date: _________
Brand Rep: ___________________ Date: _________`,
  },
  {
    id: 'ugc',
    name: 'UGC Content License',
    description: 'Content licensing for user-generated content without posting',
    clauses: [
      'Creator retains content ownership',
      'Usage license scope & duration',
      'No exclusivity on creator\'s profile',
      'Usage tracking & reporting',
    ],
    content: `USER GENERATED CONTENT (UGC) LICENSE AGREEMENT

This UGC License Agreement ("Agreement") is entered into on [DATE] between:
Creator: [CREATOR_NAME] ("Content Creator")
Brand: [BRAND_NAME] ("Licensee")

1. CONTENT CREATION
Creator agrees to produce [DELIVERABLES] ("UGC Content") as per the creative brief.

2. DELIVERABLES
- [LIST_OF_DELIVERABLES]
- Delivered in agreed format (RAW + edited)
- [REVISION_ROUNDS] rounds of revisions
- Delivery deadline: [DEADLINE]

3. LICENSE GRANT
Creator grants Brand a non-exclusive, worldwide license to use the UGC Content for:
- Paid social media advertising
- Organic social media posts
- Website and landing pages
- Email marketing campaigns
License duration: [USAGE_PERIOD] from delivery date.

4. OWNERSHIP
Creator retains full copyright and ownership of the UGC Content. Brand receives usage rights only.

5. COMPENSATION
License Fee: INR [AMOUNT] (exclusive of GST)
Payment via [PAYMENT_METHOD] within 7 days of delivery.
TDS @10% applicable under Section 194J.

6. NO POSTING OBLIGATION
Creator is NOT required to post the Content on their own channels. This is a content-for-hire arrangement.

7. USAGE TRACKING
Brand will share usage metrics quarterly upon Creator's request.

8. EXCLUSIVITY
[EXCLUSIVITY_TERMS]

Creator: _____________________ Date: _________
Brand Rep: ___________________ Date: _________`,
  },
]

const INVOICE_LS_KEY = 'creator-invoices'
const RATE_CARD_LS_KEY = 'creator-rate-card'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const stored = localStorage.getItem(INVOICE_LS_KEY)
  const invoices: SavedInvoice[] = stored ? JSON.parse(stored) : []
  const seq = String(invoices.length + 1).padStart(3, '0')
  return `CC-${year}-${seq}`
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function dueDateStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 15)
  return d.toISOString().split('T')[0]
}

function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function calcSubtotal(items: LineItem[]): number {
  return items.reduce((s, i) => s + i.qty * i.rate, 0)
}

function suggestRates(followers: number, engagementRate: number) {
  const base = (followers / 10000) * 1000
  const engFactor = Math.max(0.5, Math.min(3, engagementRate / 3))
  const r = (mult: number) => Math.round(base * mult * engFactor / 100) * 100
  return {
    instagramPost: r(1),
    instagramReel: r(1.5),
    instagramStory: r(0.4),
    youtubeDedicated: r(4),
    youtubeIntegration: r(2),
    youtubeShort: r(0.8),
    twitterThread: r(0.5),
    linkedinArticle: r(0.8),
    ugcVideo: r(1.2),
    blogPost: r(0.6),
  }
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: DS.muted,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: 6,
      fontFamily: DS.fontSans,
    }}>
      {children}
    </div>
  )
}

function Input({
  value, onChange, placeholder = '', type = 'text', style = {},
}: {
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  style?: React.CSSProperties
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${DS.border}`,
        borderRadius: 8,
        padding: '9px 12px',
        color: DS.text,
        fontSize: 13,
        fontFamily: DS.fontSans,
        outline: 'none',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        ...style,
      }}
      onFocus={e => (e.target.style.borderColor = DS.primary)}
      onBlur={e => (e.target.style.borderColor = DS.border)}
    />
  )
}

function TextArea({
  value, onChange, placeholder = '', rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${DS.border}`,
        borderRadius: 8,
        padding: '9px 12px',
        color: DS.text,
        fontSize: 13,
        fontFamily: DS.fontSans,
        outline: 'none',
        resize: 'vertical',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => (e.target.style.borderColor = DS.primary)}
      onBlur={e => (e.target.style.borderColor = DS.border)}
    />
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: DS.primary,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: 12,
      marginTop: 4,
      fontFamily: DS.fontSans,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ flex: 1, height: 1, background: DS.border }} />
      {children}
      <div style={{ flex: 1, height: 1, background: DS.border }} />
    </div>
  )
}

function Btn({
  children, onClick, variant = 'primary', size = 'md', disabled = false, style = {},
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'success' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const bg: Record<string, string> = {
    primary: DS.primary,
    ghost: 'rgba(255,255,255,0.06)',
    success: DS.success,
    danger: DS.danger,
    outline: 'transparent',
  }
  const border: Record<string, string> = {
    primary: 'transparent',
    ghost: 'transparent',
    success: 'transparent',
    danger: 'transparent',
    outline: DS.border,
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg[variant],
        border: `1px solid ${border[variant]}`,
        borderRadius: 8,
        color: DS.text,
        fontSize: size === 'sm' ? 12 : 13,
        fontWeight: 600,
        fontFamily: DS.fontSans,
        padding: size === 'sm' ? '6px 12px' : '9px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'opacity 0.15s, filter 0.15s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={e => !disabled && ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.12)')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)')}
    >
      {children}
    </button>
  )
}

// ─── Tab 1: Invoice Generator ─────────────────────────────────────────────────

function InvoiceTab() {
  const { profile } = useStore()

  const [inv, setInv] = useState<InvoiceData>({
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: todayStr(),
    dueDate: dueDateStr(),
    creatorName: profile?.name ?? '',
    creatorEmail: '',
    creatorAddress: '',
    gstNumber: '',
    clientCompany: '',
    clientContact: '',
    clientEmail: '',
    clientAddress: '',
    lineItems: [{ id: crypto.randomUUID(), description: 'Instagram Reel — Brand Campaign', qty: 1, rate: 25000 }],
    gstRate: 18,
    tdsEnabled: true,
    notes: 'Thank you for the collaboration! Looking forward to working together again.',
    upiId: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
  })

  const [history, setHistory] = useState<SavedInvoice[]>([])
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(INVOICE_LS_KEY)
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  function set<K extends keyof InvoiceData>(key: K, val: InvoiceData[K]) {
    setInv(prev => ({ ...prev, [key]: val }))
  }

  function updateItem(id: string, field: keyof LineItem, val: string | number) {
    setInv(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(it =>
        it.id === id ? { ...it, [field]: field === 'description' ? val : Number(val) } : it
      ),
    }))
  }

  function addItem() {
    setInv(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: crypto.randomUUID(), description: '', qty: 1, rate: 0 }],
    }))
  }

  function removeItem(id: string) {
    setInv(prev => ({ ...prev, lineItems: prev.lineItems.filter(i => i.id !== id) }))
  }

  const subtotal = calcSubtotal(inv.lineItems)
  const gstAmount = inv.gstRate ? (subtotal * inv.gstRate) / 100 : 0
  const tdsAmount = inv.tdsEnabled ? (subtotal * 10) / 100 : 0
  const netPayable = subtotal + gstAmount - tdsAmount

  function saveAndDownload() {
    const saved: SavedInvoice = {
      id: crypto.randomUUID(),
      invoiceNumber: inv.invoiceNumber,
      clientCompany: inv.clientCompany || 'Unknown Client',
      amount: netPayable,
      date: inv.invoiceDate,
      status: 'Pending',
    }
    const updated = [saved, ...history].slice(0, 5)
    setHistory(updated)
    localStorage.setItem(INVOICE_LS_KEY, JSON.stringify(updated))
    window.print()
  }

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* ── Form Panel ── */}
      <div style={{ width: 420, flexShrink: 0 }}>
        {/* Invoice Meta */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader>Invoice Details</SectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Label>Invoice Number</Label>
              <Input value={inv.invoiceNumber} onChange={v => set('invoiceNumber', v)} style={{ fontFamily: DS.fontMono }} />
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input value={inv.invoiceDate} onChange={v => set('invoiceDate', v)} type="date" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Due Date</Label>
              <Input value={inv.dueDate} onChange={v => set('dueDate', v)} type="date" />
            </div>
          </div>
        </div>

        {/* Creator (From) */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader><User size={12} /> From (Creator)</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Label>Creator Name</Label>
              <Input value={inv.creatorName} onChange={v => set('creatorName', v)} placeholder="Your name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={inv.creatorEmail} onChange={v => set('creatorEmail', v)} placeholder="you@email.com" type="email" />
            </div>
            <div>
              <Label>Address</Label>
              <TextArea value={inv.creatorAddress} onChange={v => set('creatorAddress', v)} placeholder="Full address with city, state, PIN" rows={2} />
            </div>
            <div>
              <Label>GST Number (optional)</Label>
              <Input value={inv.gstNumber} onChange={v => set('gstNumber', v)} placeholder="e.g. 22AAAAA0000A1Z5" style={{ fontFamily: DS.fontMono, textTransform: 'uppercase' }} />
            </div>
          </div>
        </div>

        {/* Client (To) */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader><Building size={12} /> To (Client)</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Label>Brand / Company Name</Label>
              <Input value={inv.clientCompany} onChange={v => set('clientCompany', v)} placeholder="Acme Brands Pvt Ltd" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <Label>Contact Person</Label>
                <Input value={inv.clientContact} onChange={v => set('clientContact', v)} placeholder="Priya Sharma" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={inv.clientEmail} onChange={v => set('clientEmail', v)} placeholder="brand@co.com" type="email" />
              </div>
            </div>
            <div>
              <Label>Company Address</Label>
              <TextArea value={inv.clientAddress} onChange={v => set('clientAddress', v)} placeholder="Registered office address" rows={2} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader><Receipt size={12} /> Line Items</SectionHeader>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ flex: 1, fontSize: 10, color: DS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</div>
            <div style={{ width: 42, fontSize: 10, color: DS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Qty</div>
            <div style={{ width: 90, fontSize: 10, color: DS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Rate (₹)</div>
            <div style={{ width: 90, fontSize: 10, color: DS.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Amount</div>
            <div style={{ width: 24 }} />
          </div>

          <AnimatePresence>
            {inv.lineItems.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}
              >
                <input
                  value={item.description}
                  onChange={e => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Service description"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`,
                    borderRadius: 6, padding: '7px 10px', color: DS.text, fontSize: 12,
                    fontFamily: DS.fontSans, outline: 'none',
                  }}
                />
                <input
                  type="number"
                  min={1}
                  value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', e.target.value)}
                  style={{
                    width: 42, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`,
                    borderRadius: 6, padding: '7px 6px', color: DS.text, fontSize: 12,
                    fontFamily: DS.fontMono, textAlign: 'center', outline: 'none',
                  }}
                />
                <input
                  type="number"
                  min={0}
                  value={item.rate}
                  onChange={e => updateItem(item.id, 'rate', e.target.value)}
                  style={{
                    width: 90, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`,
                    borderRadius: 6, padding: '7px 8px', color: DS.text, fontSize: 12,
                    fontFamily: DS.fontMono, textAlign: 'right', outline: 'none',
                  }}
                />
                <div style={{
                  width: 90, fontSize: 12, fontFamily: DS.fontMono, color: DS.text,
                  textAlign: 'right', fontWeight: 600,
                }}>
                  ₹{formatINR(item.qty * item.rate)}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ width: 24, height: 24, background: 'none', border: 'none', color: DS.muted, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = DS.danger)}
                  onMouseLeave={e => (e.currentTarget.style.color = DS.muted)}
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <Btn variant="ghost" size="sm" onClick={addItem} style={{ marginTop: 4 }}>
            <Plus size={13} /> Add Item
          </Btn>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DS.border}`, textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: DS.muted }}>Subtotal: </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: DS.text, fontFamily: DS.fontMono }}>₹{formatINR(subtotal)}</span>
          </div>
        </div>

        {/* Tax */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader>Tax & Deductions</SectionHeader>

          <div style={{ marginBottom: 14 }}>
            <Label>GST Rate</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([18, 12, 5, null] as (number | null)[]).map(rate => (
                <button
                  key={String(rate)}
                  onClick={() => set('gstRate', rate)}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', fontFamily: DS.fontSans,
                    background: inv.gstRate === rate ? DS.primary : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${inv.gstRate === rate ? DS.primary : DS.border}`,
                    color: DS.text,
                  }}
                >
                  {rate === null ? 'None' : `${rate}%`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label>TDS Deduction (Sec 194J)</Label>
              <button
                onClick={() => set('tdsEnabled', !inv.tdsEnabled)}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: inv.tdsEnabled ? DS.success : 'rgba(255,255,255,0.1)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: inv.tdsEnabled ? 20 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s',
                }} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: DS.muted, marginTop: 4 }}>
              10% TDS deducted by client for professional services
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: DS.mutedLight }}>
              <span>Subtotal</span>
              <span style={{ fontFamily: DS.fontMono }}>₹{formatINR(subtotal)}</span>
            </div>
            {inv.gstRate && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: DS.mutedLight }}>
                <span>GST ({inv.gstRate}%)</span>
                <span style={{ fontFamily: DS.fontMono, color: DS.warning }}>+₹{formatINR(gstAmount)}</span>
              </div>
            )}
            {inv.tdsEnabled && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: DS.mutedLight }}>
                <span>TDS Deducted (10%)</span>
                <span style={{ fontFamily: DS.fontMono, color: DS.danger }}>−₹{formatINR(tdsAmount)}</span>
              </div>
            )}
            <div style={{ borderTop: `1px solid ${DS.border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: DS.text }}>Net Payable</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: DS.success, fontFamily: DS.fontMono }}>₹{formatINR(netPayable)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader>Notes</SectionHeader>
          <TextArea value={inv.notes} onChange={v => set('notes', v)} rows={2} placeholder="Any additional notes…" />
        </div>

        {/* Payment */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <SectionHeader>Payment Details</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Label>UPI ID</Label>
              <Input value={inv.upiId} onChange={v => set('upiId', v)} placeholder="yourname@upi" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <Label>Bank Name</Label>
                <Input value={inv.bankName} onChange={v => set('bankName', v)} placeholder="HDFC Bank" />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input value={inv.ifsc} onChange={v => set('ifsc', v)} placeholder="HDFC0001234" style={{ fontFamily: DS.fontMono, textTransform: 'uppercase' }} />
              </div>
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={inv.accountNumber} onChange={v => set('accountNumber', v)} placeholder="XXXXXXXXXX" style={{ fontFamily: DS.fontMono }} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={() => setShowPreview(v => !v)} style={{ flex: 1, justifyContent: 'center' }}>
            <Eye size={14} /> {showPreview ? 'Hide' : 'Preview'}
          </Btn>
          <Btn variant="primary" onClick={saveAndDownload} style={{ flex: 1, justifyContent: 'center' }}>
            <Download size={14} /> Download PDF
          </Btn>
        </div>

        {/* Invoice History */}
        {history.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <SectionHeader>Recent Invoices</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.map(h => (
                <div key={h.id} style={{
                  background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 10,
                  padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: DS.text }}>{h.clientCompany}</div>
                    <div style={{ fontSize: 11, color: DS.muted, marginTop: 2, fontFamily: DS.fontMono }}>{h.invoiceNumber} · {h.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: DS.text, fontFamily: DS.fontMono }}>₹{formatINR(h.amount)}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                      background: h.status === 'Paid' ? DS.successDim : h.status === 'Overdue' ? DS.dangerDim : DS.warningDim,
                      color: h.status === 'Paid' ? DS.success : h.status === 'Overdue' ? DS.danger : DS.warning,
                      letterSpacing: '0.05em',
                    }}>
                      {h.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Live Preview ── */}
      <AnimatePresence>
        {(showPreview || window.innerWidth > 1100) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ flex: 1, minWidth: 480 }}
          >
            <InvoicePreview inv={inv} subtotal={subtotal} gstAmount={gstAmount} tdsAmount={tdsAmount} netPayable={netPayable} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Invoice Preview (also used for print) ────────────────────────────────────

function InvoicePreview({
  inv, subtotal, gstAmount, tdsAmount, netPayable,
}: {
  inv: InvoiceData
  subtotal: number
  gstAmount: number
  tdsAmount: number
  netPayable: number
}) {
  return (
    <div className="invoice-print-area" style={{
      background: '#fff',
      borderRadius: 12,
      padding: 40,
      color: '#111',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 800,
          }}>
            {(inv.creatorName || 'C').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{inv.creatorName || 'Creator Name'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{inv.creatorEmail}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6', letterSpacing: '-0.5px' }}>INVOICE</div>
          <div style={{ fontSize: 12, color: '#666', fontFamily: "'Space Mono', monospace", marginTop: 4 }}>{inv.invoiceNumber}</div>
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 28 }}>
        <div style={{ background: '#f8faff', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Invoice Date</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginTop: 2 }}>{inv.invoiceDate}</div>
        </div>
        <div style={{ background: '#f8faff', borderRadius: 8, padding: '10px 16px', flex: 1 }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due Date</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginTop: 2 }}>{inv.dueDate}</div>
        </div>
      </div>

      {/* From / To */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>From</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{inv.creatorName}</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 3, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{inv.creatorAddress}</div>
          {inv.gstNumber && <div style={{ fontSize: 11, color: '#888', marginTop: 6, fontFamily: "'Space Mono', monospace" }}>GSTIN: {inv.gstNumber}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Bill To</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{inv.clientCompany || 'Client Company'}</div>
          {inv.clientContact && <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>Attn: {inv.clientContact}</div>}
          <div style={{ fontSize: 12, color: '#555', marginTop: 3, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{inv.clientAddress}</div>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#3b82f6' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', borderRadius: '6px 0 0 6px' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', width: 60 }}>Qty</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', width: 100 }}>Rate</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', width: 110, borderRadius: '0 6px 6px 0' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.lineItems.map((item, idx) => (
            <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8faff' }}>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#222', borderBottom: '1px solid #eef0f6' }}>{item.description || '—'}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#555', textAlign: 'center', borderBottom: '1px solid #eef0f6' }}>{item.qty}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#555', textAlign: 'right', borderBottom: '1px solid #eef0f6', fontFamily: "'Space Mono', monospace" }}>₹{formatINR(item.rate)}</td>
              <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#111', textAlign: 'right', borderBottom: '1px solid #eef0f6', fontFamily: "'Space Mono', monospace" }}>₹{formatINR(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tax Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ width: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eee', fontSize: 13, color: '#555' }}>
            <span>Subtotal</span>
            <span style={{ fontFamily: "'Space Mono', monospace" }}>₹{formatINR(subtotal)}</span>
          </div>
          {inv.gstRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eee', fontSize: 13, color: '#555' }}>
              <span>GST ({inv.gstRate}%)</span>
              <span style={{ fontFamily: "'Space Mono', monospace" }}>₹{formatINR(gstAmount)}</span>
            </div>
          )}
          {inv.tdsEnabled && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eee', fontSize: 13, color: '#ef4444' }}>
              <span>TDS Deducted (10%)</span>
              <span style={{ fontFamily: "'Space Mono', monospace" }}>−₹{formatINR(tdsAmount)}</span>
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: 6,
            background: '#3b82f6', borderRadius: 8, color: '#fff',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Net Payable</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>₹{formatINR(netPayable)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {inv.notes && (
        <div style={{ background: '#f8faff', borderRadius: 8, padding: '12px 16px', marginBottom: 20, borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{inv.notes}</div>
        </div>
      )}

      {/* Payment Details */}
      {(inv.upiId || inv.bankName) && (
        <div style={{ background: '#f8faff', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Payment Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {inv.upiId && (
              <div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginBottom: 2 }}>UPI ID</div>
                <div style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#333' }}>{inv.upiId}</div>
              </div>
            )}
            {inv.bankName && (
              <div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginBottom: 2 }}>Bank</div>
                <div style={{ fontSize: 12, color: '#333' }}>{inv.bankName}</div>
              </div>
            )}
            {inv.accountNumber && (
              <div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginBottom: 2 }}>Account</div>
                <div style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#333' }}>{inv.accountNumber}</div>
              </div>
            )}
            {inv.ifsc && (
              <div>
                <div style={{ fontSize: 10, color: '#aaa', fontWeight: 600, marginBottom: 2 }}>IFSC</div>
                <div style={{ fontSize: 12, fontFamily: "'Space Mono', monospace", color: '#333' }}>{inv.ifsc}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #eee', paddingTop: 14, textAlign: 'center', fontSize: 11, color: '#bbb' }}>
        Powered by <span style={{ color: '#3b82f6', fontWeight: 700 }}>Creator Command</span>
      </div>
    </div>
  )
}

// ─── Tab 2: Contract Templates ────────────────────────────────────────────────

function ContractTab() {
  const { profile } = useStore()
  const [activeTemplate, setActiveTemplate] = useState<ContractTemplate | null>(null)
  const [vars, setVars] = useState<ContractVars>({
    BRAND_NAME: '',
    AMOUNT: '',
    DELIVERABLES: '',
    DATE: todayStr(),
    CREATOR_NAME: profile?.name ?? '',
    DEADLINE: '',
    REVISION_ROUNDS: '2',
    PAYMENT_METHOD: 'NEFT/Bank Transfer',
    EXCLUSIVITY_TERMS: 'not to promote direct competitors',
    USAGE_PERIOD: '6 months',
    LIST_OF_DELIVERABLES: '1x Instagram Reel\n1x Instagram Story (3 frames)',
  })
  const [copied, setCopied] = useState(false)

  function setVar(k: keyof ContractVars, v: string) {
    setVars(prev => ({ ...prev, [k]: v }))
  }

  function buildContract(template: ContractTemplate): string {
    let text = template.content
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replaceAll(`[${k}]`, v || `[${k}]`)
    })
    return text
  }

  function copyContract() {
    if (!activeTemplate) return
    navigator.clipboard.writeText(buildContract(activeTemplate))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Template Cards */}
      {!activeTemplate && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, flex: 1 }}>
          {CONTRACT_TEMPLATES.map(t => (
            <motion.div
              key={t.id}
              whileHover={{ y: -2 }}
              style={{
                background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 14,
                padding: 24, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: DS.primaryDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} color={DS.primary} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>{t.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: DS.muted, marginBottom: 16, lineHeight: 1.6 }}>{t.description}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {t.clauses.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: DS.mutedLight }}>
                    <CheckCircle size={11} color={DS.success} style={{ flexShrink: 0 }} />
                    {c}
                  </div>
                ))}
              </div>
              <Btn variant="primary" size="sm" onClick={() => setActiveTemplate(t)} style={{ width: '100%', justifyContent: 'center' }}>
                <Edit3 size={13} /> Use Template
              </Btn>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active Template Editor */}
      {activeTemplate && (
        <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Vars Form */}
          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button
                onClick={() => setActiveTemplate(null)}
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${DS.border}`, borderRadius: 8, padding: '6px 12px', color: DS.text, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <X size={12} /> Back
              </button>
              <div style={{ fontSize: 15, fontWeight: 700, color: DS.text }}>{activeTemplate.name}</div>
            </div>

            <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20 }}>
              <SectionHeader>Fill in the Blanks</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { key: 'CREATOR_NAME', label: 'Creator Name' },
                  { key: 'BRAND_NAME', label: 'Brand Name' },
                  { key: 'AMOUNT', label: 'Amount (₹)' },
                  { key: 'DATE', label: 'Agreement Date', type: 'date' },
                  { key: 'DEADLINE', label: 'Delivery Deadline' },
                  { key: 'REVISION_ROUNDS', label: 'Revision Rounds' },
                  { key: 'PAYMENT_METHOD', label: 'Payment Method' },
                  { key: 'USAGE_PERIOD', label: 'Usage Period' },
                  { key: 'EXCLUSIVITY_TERMS', label: 'Exclusivity Terms' },
                ].map(f => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input
                      value={vars[f.key as keyof ContractVars]}
                      onChange={v => setVar(f.key as keyof ContractVars, v)}
                      type={f.type}
                      placeholder={`[${f.key}]`}
                    />
                  </div>
                ))}
                <div>
                  <Label>Deliverables List</Label>
                  <TextArea
                    value={vars.LIST_OF_DELIVERABLES}
                    onChange={v => setVar('LIST_OF_DELIVERABLES', v)}
                    rows={3}
                    placeholder="One deliverable per line"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <Btn variant="ghost" onClick={copyContract} style={{ flex: 1, justifyContent: 'center' }}>
                {copied ? <CheckCircle size={14} color={DS.success} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Btn>
              <Btn variant="primary" onClick={() => window.print()} style={{ flex: 1, justifyContent: 'center' }}>
                <Download size={14} /> Download PDF
              </Btn>
            </div>
          </div>

          {/* Contract Preview */}
          <div style={{ flex: 1, minWidth: 360 }}>
            <div className="invoice-print-area" style={{
              background: '#fff', borderRadius: 12, padding: 36,
              color: '#111', fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
              whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.9,
            }}>
              <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid #3b82f6' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.05em' }}>{activeTemplate.name.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Prepared by Creator Command</div>
              </div>
              {buildContract(activeTemplate)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Rate Card Builder ─────────────────────────────────────────────────

function RateCardTab() {
  const { profile } = useStore()

  const defaultRates: RateCardData = {
    instagramPost: '', instagramReel: '', instagramStory: '',
    youtubeDedicated: '', youtubeIntegration: '', youtubeShort: '',
    twitterThread: '', linkedinArticle: '', ugcVideo: '', blogPost: '',
    followersIG: '', followersYT: '', followersLI: '',
    avgViews: '', engagementRate: '3',
  }

  const [rc, setRc] = useState<RateCardData>(() => {
    const stored = localStorage.getItem(RATE_CARD_LS_KEY)
    return stored ? JSON.parse(stored) : defaultRates
  })

  const [copied, setCopied] = useState(false)

  function set<K extends keyof RateCardData>(k: K, v: string) {
    const updated = { ...rc, [k]: v }
    setRc(updated)
    localStorage.setItem(RATE_CARD_LS_KEY, JSON.stringify(updated))
  }

  function autoSuggest() {
    const totalFollowers = (parseInt(rc.followersIG) || 0) + (parseInt(rc.followersYT) || 0)
    const avgFollowers = totalFollowers > 0 ? totalFollowers / 2 : 100000
    const engagement = parseFloat(rc.engagementRate) || 3
    const suggested = suggestRates(avgFollowers, engagement)
    setRc(prev => ({
      ...prev,
      instagramPost: String(suggested.instagramPost),
      instagramReel: String(suggested.instagramReel),
      instagramStory: String(suggested.instagramStory),
      youtubeDedicated: String(suggested.youtubeDedicated),
      youtubeIntegration: String(suggested.youtubeIntegration),
      youtubeShort: String(suggested.youtubeShort),
      twitterThread: String(suggested.twitterThread),
      linkedinArticle: String(suggested.linkedinArticle),
      ugcVideo: String(suggested.ugcVideo),
      blogPost: String(suggested.blogPost),
    }))
  }

  function copyAsText() {
    const rows = [
      `RATE CARD — ${profile?.name || 'Creator'}`,
      `Generated by Creator Command\n`,
      '━━━ INSTAGRAM ━━━',
      `Post:        ₹${rc.instagramPost || '—'}`,
      `Reel:        ₹${rc.instagramReel || '—'}`,
      `Story (3x):  ₹${rc.instagramStory || '—'}`,
      '',
      '━━━ YOUTUBE ━━━',
      `Dedicated:   ₹${rc.youtubeDedicated || '—'}`,
      `Integration: ₹${rc.youtubeIntegration || '—'}`,
      `Short:       ₹${rc.youtubeShort || '—'}`,
      '',
      '━━━ OTHER ━━━',
      `X/Twitter Thread: ₹${rc.twitterThread || '—'}`,
      `LinkedIn Article: ₹${rc.linkedinArticle || '—'}`,
      `UGC Video (no post): ₹${rc.ugcVideo || '—'}`,
      `Blog Post: ₹${rc.blogPost || '—'}`,
      '',
      `Engagement Rate: ${rc.engagementRate}%`,
      `Avg Views/Reach: ${rc.avgViews || '—'}`,
    ].join('\n')
    navigator.clipboard.writeText(rows)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rateFields = [
    { label: 'Instagram Post', key: 'instagramPost', platform: 'Instagram' },
    { label: 'Instagram Reel', key: 'instagramReel', platform: 'Instagram' },
    { label: 'Instagram Story (set of 3)', key: 'instagramStory', platform: 'Instagram' },
    { label: 'YouTube Dedicated Video', key: 'youtubeDedicated', platform: 'YouTube' },
    { label: 'YouTube Integration (30–60s)', key: 'youtubeIntegration', platform: 'YouTube' },
    { label: 'YouTube Short', key: 'youtubeShort', platform: 'YouTube' },
    { label: 'Twitter/X Thread', key: 'twitterThread', platform: 'Other' },
    { label: 'LinkedIn Article', key: 'linkedinArticle', platform: 'Other' },
    { label: 'UGC Video (no posting)', key: 'ugcVideo', platform: 'Other' },
    { label: 'Blog Post', key: 'blogPost', platform: 'Other' },
  ] as const

  const platforms = ['Instagram', 'YouTube', 'Other']

  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Form */}
      <div style={{ width: 400, flexShrink: 0 }}>
        {/* Audience Stats */}
        <div style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <SectionHeader><User size={12} /> Audience Stats</SectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label>Instagram Followers</Label>
              <Input value={rc.followersIG} onChange={v => set('followersIG', v)} placeholder="e.g. 250000" type="number" />
            </div>
            <div>
              <Label>YouTube Subscribers</Label>
              <Input value={rc.followersYT} onChange={v => set('followersYT', v)} placeholder="e.g. 500000" type="number" />
            </div>
            <div>
              <Label>LinkedIn Followers</Label>
              <Input value={rc.followersLI} onChange={v => set('followersLI', v)} placeholder="e.g. 10000" type="number" />
            </div>
            <div>
              <Label>Avg Views / Reach</Label>
              <Input value={rc.avgViews} onChange={v => set('avgViews', v)} placeholder="e.g. 80000" type="number" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Label>Engagement Rate (%)</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Input value={rc.engagementRate} onChange={v => set('engagementRate', v)} type="number" placeholder="3" style={{ width: 80 }} />
                <Btn variant="ghost" size="sm" onClick={autoSuggest}>
                  Auto-suggest Rates
                </Btn>
              </div>
            </div>
          </div>
        </div>

        {/* Rates by Platform */}
        {platforms.map(plat => (
          <div key={plat} style={{ background: DS.card, border: `1px solid ${DS.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <SectionHeader>{plat}</SectionHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rateFields.filter(f => f.platform === plat).map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 12, color: DS.mutedLight }}>{f.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 14, color: DS.muted, fontFamily: DS.fontMono }}>₹</span>
                    <input
                      type="number"
                      value={rc[f.key]}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder="0"
                      style={{
                        width: 110, background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${DS.border}`, borderRadius: 8,
                        padding: '8px 10px', color: DS.text, fontSize: 13,
                        fontFamily: DS.fontMono, textAlign: 'right', outline: 'none',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={copyAsText} style={{ flex: 1, justifyContent: 'center' }}>
            {copied ? <CheckCircle size={14} color={DS.success} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Rate Card'}
          </Btn>
          <Btn variant="primary" onClick={() => window.print()} style={{ flex: 1, justifyContent: 'center' }}>
            <Download size={14} /> Download as Image
          </Btn>
        </div>
      </div>

      {/* Rate Card Preview */}
      <div style={{ flex: 1, minWidth: 360 }}>
        <div className="invoice-print-area" style={{
          background: 'linear-gradient(135deg, #080810 0%, #0d0d2a 100%)',
          borderRadius: 20,
          padding: 40,
          border: '1px solid rgba(59,130,246,0.3)',
          boxShadow: '0 0 60px rgba(59,130,246,0.12)',
        }}>
          {/* RC Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f4ff', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {profile?.name || 'Creator Name'}
              </div>
              <div style={{ fontSize: 13, color: '#4b5680', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {profile?.niche || 'Content Creator'} · Media Kit
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#4b5680', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Rate Card</div>
              <div style={{ fontSize: 11, color: '#3b82f6', fontFamily: "'Space Mono', monospace" }}>{new Date().getFullYear()}</div>
            </div>
          </div>

          {/* Audience Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Instagram', val: rc.followersIG },
              { label: 'YouTube', val: rc.followersYT },
              { label: 'Avg Views', val: rc.avgViews },
            ].map(s => s.val && (
              <div key={s.label} style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#f0f4ff', fontFamily: "'Space Mono', monospace" }}>
                  {parseInt(s.val) >= 1000000
                    ? `${(parseInt(s.val) / 1000000).toFixed(1)}M`
                    : parseInt(s.val) >= 1000
                    ? `${Math.round(parseInt(s.val) / 1000)}K`
                    : s.val}
                </div>
                <div style={{ fontSize: 11, color: '#4b5680', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rate Sections */}
          {[
            { title: 'Instagram', items: [
              { label: 'Feed Post', val: rc.instagramPost },
              { label: 'Reel', val: rc.instagramReel },
              { label: 'Stories (3x)', val: rc.instagramStory },
            ]},
            { title: 'YouTube', items: [
              { label: 'Dedicated Video', val: rc.youtubeDedicated },
              { label: 'Integration', val: rc.youtubeIntegration },
              { label: 'Short', val: rc.youtubeShort },
            ]},
            { title: 'Other Platforms', items: [
              { label: 'X/Twitter Thread', val: rc.twitterThread },
              { label: 'LinkedIn Article', val: rc.linkedinArticle },
              { label: 'UGC (No Post)', val: rc.ugcVideo },
              { label: 'Blog Post', val: rc.blogPost },
            ]},
          ].map(section => {
            const filledItems = section.items.filter(i => i.val)
            if (filledItems.length === 0) return null
            return (
              <div key={section.title} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {section.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filledItems.map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.08)' }}>
                      <span style={{ fontSize: 13, color: '#8899cc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', fontFamily: "'Space Mono', monospace" }}>
                        ₹{formatINR(parseInt(item.val) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(59,130,246,0.15)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#4b5680', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              All prices exclusive of GST · TDS @10% applicable
            </div>
            <div style={{ fontSize: 10, color: '#3b82f6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Creator Command
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'invoice', label: 'Invoice Generator', icon: Receipt },
  { id: 'contract', label: 'Contract Templates', icon: FileText },
  { id: 'ratecard', label: 'Rate Card Builder', icon: Calendar },
]

export function InvoiceGenerator() {
  const [activeTab, setActiveTab] = useState<'invoice' | 'contract' | 'ratecard'>('invoice')

  // Inject print CSS
  useEffect(() => {
    const styleId = 'cc-invoice-print-style'
    if (document.getElementById(styleId)) return
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @media print {
        body > * { display: none !important; }
        .invoice-print-area { display: block !important; }
        @page { margin: 20mm; }
      }
    `
    document.head.appendChild(style)
    return () => { document.getElementById(styleId)?.remove() }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: DS.bg,
      fontFamily: DS.fontSans,
      padding: '28px 24px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))',
            border: `1px solid rgba(59,130,246,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={20} color={DS.primary} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: DS.text, margin: 0, letterSpacing: '-0.3px' }}>
              Invoice & Contract Generator
            </h1>
            <p style={{ fontSize: 13, color: DS.muted, margin: 0, marginTop: 2 }}>
              Branded invoices with GST/TDS, contracts & rate cards — done in 30 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: DS.card, borderRadius: 12, padding: 4, border: `1px solid ${DS.border}`, width: 'fit-content' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '9px 18px',
                borderRadius: 9,
                border: 'none',
                background: isActive ? DS.primary : 'transparent',
                color: isActive ? '#fff' : DS.muted,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: DS.fontSans,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'invoice' && <InvoiceTab />}
          {activeTab === 'contract' && <ContractTab />}
          {activeTab === 'ratecard' && <RateCardTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
