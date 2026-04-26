'use client'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { BarChart2, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Types ───────────────────────────────────────────────── */
type DataTab = 'analytics' | 'honeybook' | 'forms' | 'email' | 'social' | 'events' | 'feedback'

// Paste your deployed Apps Script web app URL here after deploying honeybook-webapp.gs
const HONEYBOOK_URL = 'https://script.google.com/macros/s/AKfycbw968UYNRchd6-Nm8V-tEeo48vuPEe3xqfPgKGibhQEP2td2B8mgUs5ThDrkDrmH4WGNA/exec'
// Deploy wix-webapp.gs and paste the URL here
const WIX_URL = 'https://script.google.com/macros/s/AKfycbzY3c6_xF2ucrZrQnZLa1bcU2TIcFadBH9UEeIbJYMKumvxygql8ulN-67q1Vu_WM4h/exec'
// Deploy wix-forms-webapp.gs and paste the URL here.
const FORMS_URL = 'https://script.google.com/macros/s/AKfycbyn9AOM9U8iF-jZ_sVr7QpHpxn7nPr1UvRh-5Jov6F2-ife84cltgVsvv5xATyx98Xu/exec'
const HONEYBOOK_CACHE_KEY = 'north-star-donors:honeybook:v1'
const HONEYBOOK_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7


interface HoneyBookLead {
  id: string | number; row_num: number | null; project_name: string; full_name: string
  email: string | null; phone: string | null; project_date: string | null
  lead_created_date: string | null; total_project_value: number | null
  lead_source: string | null; lead_source_text: string | null; booked_date: string | null
}

interface BookedClient {
  id: string | number; full_name: string; email: string | null
  project_name: string; project_type: string | null; lead_source: string | null
  created_date: string | null; project_date: string | null; booked_date: string | null
  total_value: number | null; total_paid: number | null; refunded: number; company: string | null
}

interface TourEntry {
  id: string | number; full_name: string
  tour_date: string | null; start_time: string | null
  title: string | null; notes: string | null
}

interface WixSubmission {
  id: string; form_id: string; form_name: string
  status: string; created_at: string
  internal_notes?: string | null
  fields: Record<string, string>
}
interface EmailEntry {
  id: string; campaign_name: string; date: string | null; platform: string | null
  sent: number | null; opened: number | null; clicked: number | null
  unsubscribed: number | null; notes: string | null; created_at: string
}
interface SocialEntry {
  id: string; platform: string; date: string | null; content: string | null
  link: string | null; likes: number | null; comments: number | null
  shares: number | null; reach: number | null; notes: string | null; created_at: string
}
interface EventEntry {
  id: string; event_name: string; date: string | null; attendance: number | null
  revenue: number | null; venue: string | null; notes: string | null; created_at: string
}
interface FacebookEntry {
  id: string; period: string; page_followers: number | null; page_impressions: number | null
  page_reach: number | null; page_engaged_users: number | null; post_count: number | null
  created_at: string
}

interface AnalyticsEntry {
  id: string; period: string; sessions: number | null; users: number | null
  page_views: number | null; bounce_rate: number | null; avg_session_duration: number | null
  sessions_organic: number | null; sessions_paid: number | null; sessions_direct: number | null
  sessions_referral: number | null; sessions_social: number | null; sessions_email: number | null
  sessions_other: number | null
  created_at: string
}

interface HoneyBookPayload {
  leads?: HoneyBookLead[]
  booked?: BookedClient[]
  tours?: TourEntry[]
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }
const fmt$ = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const pct = (a: number | null, b: number | null) => (a && b && b > 0) ? `${Math.round((a / b) * 100)}%` : '—'

function readHoneyBookCache() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(HONEYBOOK_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { fetchedAt?: number; data?: HoneyBookPayload }
    if (!parsed?.fetchedAt || !parsed.data) return null
    if ((Date.now() - parsed.fetchedAt) > HONEYBOOK_CACHE_TTL_MS) return null

    return parsed.data
  } catch {
    return null
  }
}

function writeHoneyBookCache(data: HoneyBookPayload) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(HONEYBOOK_CACHE_KEY, JSON.stringify({
      fetchedAt: Date.now(),
      data,
    }))
  } catch {
    // Ignore storage failures and fall back to the network path.
  }
}

function applyHoneyBookPayload(
  payload: HoneyBookPayload,
  setRows: React.Dispatch<React.SetStateAction<HoneyBookLead[] | null>>,
  setBooked: React.Dispatch<React.SetStateAction<BookedClient[]>>,
  setTours: React.Dispatch<React.SetStateAction<TourEntry[]>>,
) {
  setRows(payload.leads ?? [])
  setBooked(payload.booked ?? [])
  setTours(payload.tours ?? [])
}

const TABS: { id: DataTab; label: string }[] = [
  { id: 'analytics', label: 'Website' },
  { id: 'honeybook', label: 'Venue' },
  { id: 'forms',     label: 'Forms' },
  { id: 'email',     label: 'Email Results' },
  { id: 'social',    label: 'Socials' },
  { id: 'events',    label: 'Event Data' },
  { id: 'feedback',  label: 'Feedback' },
]

/* ── Main ────────────────────────────────────────────────── */
export default function DataPage() {
  const [tab, setTab] = useState<DataTab>('analytics')

  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="data" />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
              <BarChart2 size={16} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>Data</h1>
          </div>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm w-fit">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                style={tab === t.id ? goldBtn : {}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8 flex-1">
          {tab === 'analytics' && <AnalyticsSection />}
          {tab === 'honeybook' && <HoneyBookSection />}
          {tab === 'forms'     && <FormsSection />}
          {tab === 'email'     && <EmailSection />}
          {tab === 'social'    && <SocialSection />}
          {tab === 'events'    && <EventsSection />}
          {tab === 'feedback'  && <FeedbackSection />}
        </div>
      </div>
    </div>
  )
}

/* ── Shared detail panel wrapper ─────────────────────────── */
function DetailPanel({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 self-start sticky top-6 max-h-[calc(100vh-140px)] overflow-y-auto">
      <div className="flex justify-end mb-4">
        <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg"><X size={16} /></button>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-stone-700">{value}</p>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   HONEYBOOK SECTION
══════════════════════════════════════════════════════════ */
function HoneyBookSection() {
  const [rows,   setRows]   = useState<HoneyBookLead[] | null>(null)
  const [booked, setBooked] = useState<BookedClient[]>([])
  const [tours,  setTours]  = useState<TourEntry[]>([])

  useEffect(() => {
    const cached = readHoneyBookCache()
    if (cached) {
      applyHoneyBookPayload(cached, setRows, setBooked, setTours)
      return
    }

    if (!HONEYBOOK_URL) { setRows([]); return }

    const ctrl = new AbortController()
    fetch(HONEYBOOK_URL, { signal: ctrl.signal })
      .then(r => r.json())
      .then((json: HoneyBookPayload) => {
        writeHoneyBookCache(json)
        applyHoneyBookPayload(json, setRows, setBooked, setTours)
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setRows([])
      })

    return () => ctrl.abort()
  }, [])

  if (rows === null) return <div className="text-center py-16 text-stone-400 text-sm">Loading…</div>
  if (rows.length === 0) return <div className="text-center py-16 text-stone-400 text-sm">No leads yet.</div>

  const tourPct     = rows.length > 0 ? Math.round((tours.length  / rows.length) * 100) : 0
  const bookPct     = rows.length > 0 ? Math.round((booked.length / rows.length) * 100) : 0
  const tourToBook  = tours.length > 0 ? Math.round((booked.length / tours.length) * 100) : 0
  const totalValue  = booked.reduce((s, r) => s + (r.total_value ?? 0), 0)
  const totalPaid   = booked.reduce((s, r) => s + (r.total_paid  ?? 0), 0)

  // Source tally
  const sourceCounts = rows.reduce((acc, r) => {
    const s = r.lead_source || 'Unknown'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const sourceList = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])

  // Monthly breakdown — each metric by its own date
  const monthlyMap: Record<string, { leads: number; toured: number; booked: number }> = {}
  rows.forEach(r => {
    const mo = (r.lead_created_date ?? '').slice(0, 7)
    if (!mo) return
    if (!monthlyMap[mo]) monthlyMap[mo] = { leads: 0, toured: 0, booked: 0 }
    monthlyMap[mo].leads++
  })
  tours.forEach(t => {
    const mo = (t.tour_date ?? '').slice(0, 7)
    if (!mo) return
    if (!monthlyMap[mo]) monthlyMap[mo] = { leads: 0, toured: 0, booked: 0 }
    monthlyMap[mo].toured++
  })
  booked.forEach(b => {
    const mo = (b.booked_date ?? '').slice(0, 7)
    if (!mo) return
    if (!monthlyMap[mo]) monthlyMap[mo] = { leads: 0, toured: 0, booked: 0 }
    monthlyMap[mo].booked++
  })
  const months = Object.keys(monthlyMap).sort()
  const maxLeads = Math.max(...months.map(m => monthlyMap[m].leads), 1)

  const SOURCE_COLORS: Record<string, string> = {
    Google: '#4ade80', Facebook: '#60a5fa', Website: '#f59e0b',
    Instagram: '#c084fc', Referral: '#34d399', 'Word of Mouth': '#fb923c',
    Unknown: '#94a3b8',
  }
  const srcColor = (s: string) => SOURCE_COLORS[s] ?? '#d6d3d1'

  const moLabel = (ym: string) => {
    const [y, m] = ym.split('-')
    return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <div className="space-y-5">
      {/* Period label */}
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Jan – Apr 2026</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: 'Inquiries',      value: rows.length.toString(),    sub: 'leads received' },
          { label: 'Toured',         value: tours.length.toString(),   sub: `${tourPct}% of inquiries` },
          { label: 'Booked',         value: booked.length.toString(),  sub: `${bookPct}% of inquiries · ${tourToBook}% of tours` },
          { label: 'Revenue Booked', value: fmt$(totalValue),          sub: `${fmt$(totalPaid)} collected` },
        ]).map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-2xl font-bold text-stone-800 leading-none mb-1">{value}</p>
            <p className="text-[10px] text-stone-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Chart (left) + Source tally (right) */}
      <div className="grid grid-cols-[1fr_260px] gap-4 items-start">

        {/* Left column: chart + value breakdown stacked */}
        <div className="space-y-4">

          {/* Monthly leads vs booked bar chart */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-stone-700 mb-1">Inquiries · Tours · Bookings by Month</p>
            <div className="flex items-center gap-5 mb-4">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-stone-200" /><span className="text-xs text-stone-500">Inquiries</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-300" /><span className="text-xs text-stone-500">Tours</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-400" /><span className="text-xs text-stone-500">Booked</span></div>
            </div>
            <div className="flex gap-2">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between items-end pb-5" style={{ height: '200px' }}>
                {[maxLeads, Math.round(maxLeads * 0.75), Math.round(maxLeads * 0.5), Math.round(maxLeads * 0.25), 0].map(v => (
                  <span key={v} className="text-[10px] text-stone-300 leading-none">{v}</span>
                ))}
              </div>
              {/* Bars */}
              <div className="relative flex items-end gap-3 flex-1" style={{ height: '200px' }}>
                {[25, 50, 75].map(pct => (
                  <div key={pct} className="absolute left-0 right-0 border-t border-stone-150" style={{ bottom: `calc(${pct}% + 20px)`, borderColor: '#e5e5e5' }} />
                ))}
                {months.map(mo => {
                  const { leads, toured: t, booked: b } = monthlyMap[mo]
                  const BAR_H = 140
                  const leadH = Math.round((leads / maxLeads) * BAR_H)
                  const tourH = Math.round((t     / maxLeads) * BAR_H)
                  const bookH = Math.round((b     / maxLeads) * BAR_H)
                  return (
                    <div key={mo} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center gap-0.5 pt-4" style={{ height: `${BAR_H}px` }}>
                        <div className="flex-1 flex flex-col items-center justify-end gap-0.5">
                          <span className="text-[10px] font-bold text-stone-600">{leads}</span>
                          <div className="w-full rounded-t" style={{ height: `${leadH}px`, minHeight: 4, background: '#d6d3d1' }} />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end gap-0.5">
                          <span className="text-[10px] font-bold text-amber-600">{t > 0 ? t : ''}</span>
                          <div className="w-full rounded-t" style={{ height: `${tourH}px`, minHeight: t > 0 ? 4 : 0, background: '#fbbf24' }} />
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-end gap-0.5">
                          <span className="text-[10px] font-bold text-emerald-600">{b > 0 ? b : ''}</span>
                          <div className="w-full rounded-t" style={{ height: `${bookH}px`, minHeight: b > 0 ? 4 : 0, background: '#10b981' }} />
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-stone-400 mt-1">{moLabel(mo)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Value breakdown */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-stone-700 mb-4">Project Value by Source</p>
            <div className="space-y-3">
              {sourceList.map(([src]) => {
                const srcBooked = booked.filter(r => (r.lead_source || 'Unknown') === src)
                const srcVal    = srcBooked.reduce((s, r) => s + (r.total_value ?? 0), 0)
                if (srcVal === 0) return null
                return (
                  <div key={src} className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 w-32 flex-shrink-0">
                      <div className="w-2 h-2 rounded-sm" style={{ background: srcColor(src) }} />
                      <span className="text-xs font-medium text-stone-700 truncate">{src}</span>
                    </div>
                    <div className="flex-1 h-4 bg-stone-100 rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full absolute top-0 left-0" style={{ width: `${(srcVal / totalValue) * 100}%`, background: srcColor(src) }} />
                    </div>
                    <span className="text-xs font-semibold text-stone-700 w-24 text-right flex-shrink-0">{fmt$(srcVal)}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>{/* end left column */}

        {/* Source tally box */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-stone-700 mb-1">Where They Found Us</p>
          <p className="text-xs text-stone-400 mb-4">Lead source breakdown</p>
          <div className="space-y-2.5">
            {sourceList.map(([src, count]) => (
              <div key={src}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: srcColor(src) }} />
                    <span className="text-xs font-medium text-stone-700">{src}</span>
                  </div>
                  <span className="text-xs text-stone-400 font-semibold">{count} <span className="font-normal text-stone-300">· {Math.round((count / rows.length) * 100)}%</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / rows.length) * 100}%`, background: srcColor(src) }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-stone-100">
            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Booked by Source</p>
            <div className="space-y-1">
              {sourceList.map(([src]) => {
                const srcBooked = booked.filter(r => (r.lead_source || 'Unknown') === src).length
                const srcTotal  = sourceCounts[src] ?? 0
                if (srcBooked === 0) return null
                return (
                  <div key={src} className="flex justify-between text-xs">
                    <span className="text-stone-600">{src}</span>
                    <span className="text-stone-400">{srcBooked}/{srcTotal} <span className="text-stone-300">({Math.round((srcBooked/srcTotal)*100)}%)</span></span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>{/* end outer grid */}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FORMS SECTION — auto-populated from Wix via Velo
══════════════════════════════════════════════════════════ */
function FormsSection() {
  const [data, setData] = useState<{ submissions: WixSubmission[] } | null>(null)
  const [selected, setSelected] = useState<WixSubmission | null>(null)
  const [activeForm, setActiveForm] = useState<string | null>(null)
  const [source, setSource] = useState<'supabase' | 'wix'>('wix')
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [handlingId, setHandlingId] = useState<string | null>(null)
  const scrollYRef = useRef(0)

  useEffect(() => {
    let cancelled = false

    async function loadForms() {
      if (FORMS_URL) {
        // Always fetch all submissions from Wix, then overlay status/notes from Supabase
        try {
          const response = await fetch(FORMS_URL)
          const json = await response.json()
          if (!cancelled) {
            const submissions = (json.submissions ? json.submissions as WixSubmission[] : (json.forms?.submissions ?? [])) as WixSubmission[]
            const ids = submissions.map(sub => sub.id)
            let overrides: Record<string, { notes: string | null; status: string | null }> = {}

            if (ids.length > 0) {
              const { data: overrideRows } = await supabase
                .from('data_wix_forms')
                .select('id, internal_notes, status')
                .in('id', ids)

              overrides = Object.fromEntries(
                (overrideRows ?? []).map(row => [row.id as string, { notes: (row.internal_notes as string | null) ?? null, status: (row.status as string | null) ?? null }])
              )
            }

            setSource('wix')
            setData({
              submissions: submissions.map(sub => ({
                ...sub,
                internal_notes: overrides[sub.id]?.notes ?? sub.internal_notes ?? null,
                status: overrides[sub.id]?.status ?? sub.status,
              })),
            })
          }
        } catch {
          if (!cancelled) setData({ submissions: [] })
        }
        return
      }

      // Fallback: Supabase only (when FORMS_URL not configured)
      const { data: supabaseRows, error } = await supabase
        .from('data_wix_forms')
        .select('id, form_id, form_name, status, created_at, fields, internal_notes')
        .order('created_at', { ascending: false })

      if (!cancelled && !error && supabaseRows && supabaseRows.length > 0) {
        setSource('supabase')
        setData({
          submissions: supabaseRows.map(row => ({
            id: row.id,
            form_id: row.form_id,
            form_name: row.form_name,
            status: row.status,
            created_at: row.created_at,
            internal_notes: row.internal_notes,
            fields: (row.fields as Record<string, string>) ?? {},
          })),
        })
      } else if (!cancelled) {
        setData({ submissions: [] })
      }
    }

    loadForms()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setNotesDraft(selected?.internal_notes ?? '')
  }, [selected])

  useLayoutEffect(() => {
    window.scrollTo({ top: scrollYRef.current })
  }, [selected])

  const rows = data?.submissions ?? []
  const formNames = [...new Set(rows.map(r => r.form_name))].sort()
  const grouped = formNames.map(name => ({ name, items: rows.filter(r => r.form_name === name) }))
  const activeFormName = activeForm && formNames.includes(activeForm) ? activeForm : (formNames[0] ?? null)
  const activeGroup = grouped.find(group => group.name === activeFormName) ?? null

  const fmtTs = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  async function saveNotes() {
    if (!selected) return
    setNotesSaving(true)
    const noteValue = notesDraft.trim() || null
    const { error } = await supabase
      .from('data_wix_forms')
      .upsert({
        id: selected.id,
        form_id: selected.form_id,
        form_name: selected.form_name.trim(),
        status: selected.status,
        created_at: selected.created_at,
        fields: selected.fields,
        internal_notes: noteValue,
      })

    if (!error) {
      setSelected(prev => prev ? { ...prev, internal_notes: noteValue } : prev)
      setData(prev => prev ? {
        submissions: prev.submissions.map(sub => sub.id === selected.id ? { ...sub, internal_notes: noteValue } : sub),
      } : prev)
    }
    setNotesSaving(false)
  }

  async function toggleHandled(sub: WixSubmission) {
    if (handlingId === sub.id) return
    setHandlingId(sub.id)
    const newStatus = sub.status === 'handled' ? '' : 'handled'
    const { error } = await supabase
      .from('data_wix_forms')
      .upsert({
        id: sub.id,
        form_id: sub.form_id,
        form_name: sub.form_name.trim(),
        status: newStatus,
        created_at: sub.created_at,
        fields: sub.fields,
        internal_notes: sub.internal_notes ?? null,
      })
    if (!error) {
      const update = (s: WixSubmission) => s.id === sub.id ? { ...s, status: newStatus } : s
      setData(prev => prev ? { submissions: prev.submissions.map(update) } : prev)
      setSelected(prev => prev?.id === sub.id ? { ...prev, status: newStatus } : prev)
    }
    setHandlingId(null)
  }

  return (
    <div className="space-y-4">
      {data === null ? <div className="text-center py-16 text-stone-400 text-sm">Loading…</div> : (
        <>
          {rows.length === 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
              <p className="text-sm">No form submissions found.</p>
              <p className="text-xs text-center max-w-xs">{FORMS_URL ? 'Sync Wix forms into Supabase for faster loads.' : 'Deploy wix-forms-webapp.gs and paste the URL as FORMS_URL in page.tsx.'}</p>
            </div>
          )}
          {grouped.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {grouped.map(({ name, items }) => {
                const isActive = name === activeFormName
                const latest = items[0]
                return (
                  <button
                    key={name}
                    onClick={() => {
                      setActiveForm(name)
                      setSelected(null)
                    }}
                    className={`text-left rounded-xl border shadow-sm p-4 transition-colors ${isActive ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-stone-200 hover:bg-stone-50'}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: isActive ? 'var(--gold)' : '#a8a29e' }}>Wix Form</p>
                    <p className="text-sm font-semibold text-stone-800 leading-snug">{name}</p>
                    <p className="text-2xl font-bold text-stone-800 leading-none mt-3">{items.length}</p>
                    <p className="text-xs text-stone-400 mt-1">submission{items.length !== 1 ? 's' : ''}</p>
                    <p className="text-[11px] text-stone-400 mt-3">{latest ? `Latest: ${fmtTs(latest.created_at)}` : 'No submissions yet'}</p>
                  </button>
                )
              })}
            </div>
          )}
          <div className={`grid gap-5 items-start ${selected ? 'grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
          <div className="space-y-4 min-w-0">
            {activeGroup && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>Selected Form</p>
                      <p className="text-sm font-semibold text-stone-800">{activeGroup.name}</p>
                    </div>
                    <div className="text-right">
                      {activeGroup.items.filter(s => s.status === 'handled').length > 0 && (
                        <p className="text-xs font-medium text-emerald-700">{activeGroup.items.filter(s => s.status === 'handled').length} handled</p>
                      )}
                      <p className="text-xs text-stone-400">{activeGroup.items.length} message{activeGroup.items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <div>
                  {activeGroup.items.map(sub => {
                    const first = sub.fields['First Name'] || ''
                    const last  = sub.fields['Last Name']  || ''
                    const email = sub.fields['Email'] || sub.fields['Email Address'] || ''
                    const preview = [first, last].filter(Boolean).join(' ') || email || Object.values(sub.fields).find(Boolean) || ''
                    const isHandled = sub.status === 'handled'
                    return (
                      <div key={sub.id}
                        className={`flex items-start gap-3 px-5 py-3 border-b border-stone-50 last:border-0 transition-colors ${selected?.id === sub.id ? 'bg-amber-50/80' : isHandled ? 'bg-stone-50/60' : 'hover:bg-stone-50'}`}>
                        <input
                          type="checkbox"
                          title="Mark as handled"
                          className="mt-1 w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0 disabled:opacity-50"
                          checked={isHandled}
                          disabled={handlingId === sub.id}
                          onChange={() => toggleHandled(sub)}
                        />
                        <button
                          className="flex-1 text-left min-w-0"
                          onClick={() => { scrollYRef.current = window.scrollY; setSelected(prev => prev?.id === sub.id ? null : sub) }}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              {sub.internal_notes && <p className="text-xs text-amber-800 bg-amber-100/80 rounded-md px-2 py-1 mb-2 truncate">{sub.internal_notes}</p>}
                              {preview && <p className={`text-sm truncate ${isHandled ? 'text-stone-400 line-through' : 'text-stone-700'}`}>{preview}</p>}
                              {email && email !== preview && <p className="text-xs text-stone-400 mt-0.5 truncate">{email}</p>}
                            </div>
                            <p className="text-xs text-stone-500 flex-shrink-0">{fmtTs(sub.created_at)}</p>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {rows.length > 0 && <div className="text-xs text-stone-400 px-1">{rows.length} submission{rows.length !== 1 ? 's' : ''} across {formNames.length} form{formNames.length !== 1 ? 's' : ''} · {source === 'supabase' ? 'loaded from Supabase' : 'live from Wix'}</div>}
          </div>

          {selected ? (
            <DetailPanel onClose={() => setSelected(null)}>
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{selected.form_name}</p>
                <p className="text-xs text-stone-400">{fmtTs(selected.created_at)}</p>
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 block">Internal Notes</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={4}
                  value={notesDraft}
                  onChange={e => setNotesDraft(e.target.value)}
                  placeholder="Add internal notes for this submission"
                  disabled={notesSaving}
                />
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className="text-[10px] text-stone-400">
                    Saved to Supabase for this submission.
                  </p>
                  <button
                    onClick={saveNotes}
                    disabled={notesSaving}
                    className="px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-50"
                    style={goldBtn}
                  >
                    {notesSaving ? 'Saving…' : 'Save Notes'}
                  </button>
                </div>
              </div>
              {Object.keys(selected.fields).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(selected.fields).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-300 italic">No field data captured.</p>
              )}
            </DetailPanel>
          ) : null}
          </div>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EMAIL SECTION
══════════════════════════════════════════════════════════ */
const EMAIL_EMPTY = { campaign_name: '', date: '', platform: '', sent: '', opened: '', clicked: '', unsubscribed: '', notes: '' }

function EmailSection() {
  const [rows, setRows] = useState<EmailEntry[] | null>(null)
  const [selected, setSelected] = useState<EmailEntry | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EMAIL_EMPTY)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  type EditEmailForm = Omit<Partial<EmailEntry>, 'sent'|'opened'|'clicked'|'unsubscribed'> & { sent?: string; opened?: string; clicked?: string; unsubscribed?: string }
  const [editForm, setEditForm] = useState<EditEmailForm>({})
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    supabase.from('data_email').select('*').order('date', { ascending: false })
      .then(({ data }) => setRows((data as EmailEntry[]) ?? []))
  }, [])

  const num = (s: string) => s ? parseInt(s) : null

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!form.campaign_name) return
    setSaving(true)
    const { data } = await supabase.from('data_email').insert({
      campaign_name: form.campaign_name.trim(), date: form.date || null, platform: form.platform.trim() || null,
      sent: num(form.sent), opened: num(form.opened), clicked: num(form.clicked),
      unsubscribed: num(form.unsubscribed), notes: form.notes.trim() || null,
    }).select().single()
    if (data) { setRows(prev => [data as EmailEntry, ...(prev ?? [])]); setSelected(data as EmailEntry) }
    setForm(EMAIL_EMPTY); setShowAdd(false); setSaving(false)
  }

  async function saveEdit() {
    if (!selected) return; setEditSaving(true)
    const { data } = await supabase.from('data_email').update({
      campaign_name: editForm.campaign_name, date: editForm.date || null, platform: editForm.platform || null,
      sent: editForm.sent ? parseInt(editForm.sent) : null, opened: editForm.opened ? parseInt(editForm.opened) : null,
      clicked: editForm.clicked ? parseInt(editForm.clicked) : null, unsubscribed: editForm.unsubscribed ? parseInt(editForm.unsubscribed) : null,
      notes: editForm.notes || null,
    }).eq('id', selected.id).select().single()
    if (data) { const u = data as EmailEntry; setSelected(u); setRows(prev => prev?.map(r => r.id === selected.id ? u : r) ?? null) }
    setEditing(false); setEditSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('data_email').delete().eq('id', id)
    setRows(prev => prev?.filter(r => r.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setForm(EMAIL_EMPTY); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
          <Plus size={15} /> Add Campaign
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">New Email Campaign</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-stone-400 mb-1 block">Campaign Name *</label>
                <input required className={inputCls} value={form.campaign_name} onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Platform</label>
                <input className={inputCls} placeholder="e.g. Mailchimp, Constant Contact" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Sent</label>
                <input type="number" className={inputCls} value={form.sent} onChange={e => setForm(f => ({ ...f, sent: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Opened</label>
                <input type="number" className={inputCls} value={form.opened} onChange={e => setForm(f => ({ ...f, opened: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Clicked</label>
                <input type="number" className={inputCls} value={form.clicked} onChange={e => setForm(f => ({ ...f, clicked: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Unsubscribed</label>
                <input type="number" className={inputCls} value={form.unsubscribed} onChange={e => setForm(f => ({ ...f, unsubscribed: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-stone-400 mb-1 block">Notes</label>
              <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !form.campaign_name} className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>{saving ? 'Saving…' : 'Add'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {rows === null ? <div className="text-center py-16 text-stone-400 text-sm">Loading…</div> : (
        <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {rows.length === 0 ? <div className="text-center py-16 text-stone-400 text-sm">No campaigns logged yet.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Campaign</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Sent</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Open Rate</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Click Rate</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Date</th>
                </tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.id} onClick={() => { setSelected(prev => prev?.id === r.id ? null : r); setEditing(false) }}
                    className={`border-b border-stone-100 cursor-pointer transition-colors ${selected?.id === r.id ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                    <td className="px-4 py-3 font-medium text-stone-800">{r.campaign_name}
                      {r.platform && <span className="ml-2 text-xs text-stone-400">{r.platform}</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{r.sent?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right font-medium text-stone-700">{pct(r.opened, r.sent)}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{pct(r.clicked, r.sent)}</td>
                    <td className="px-4 py-3 text-right text-stone-400 text-xs">{r.date ? fmtDate(r.date) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">{rows.length} campaign{rows.length !== 1 ? 's' : ''}</div>
          </div>
          {selected ? (
            <DetailPanel onClose={() => setSelected(null)}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-bold text-stone-800 text-base leading-snug pr-2">{selected.campaign_name}</h2>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditForm({ ...selected, sent: selected.sent != null ? String(selected.sent) : '', opened: selected.opened != null ? String(selected.opened) : '', clicked: selected.clicked != null ? String(selected.clicked) : '', unsubscribed: selected.unsubscribed != null ? String(selected.unsubscribed) : '' }); setEditing(true) }}
                    className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1"><Pencil size={11} /> Edit</button>
                  <button onClick={() => del(selected.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Campaign Name</label>
                    <input className={inputCls} value={editForm.campaign_name ?? ''} onChange={e => setEditForm(f => ({ ...f, campaign_name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date</label>
                      <input type="date" className={inputCls} value={editForm.date ?? ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Platform</label>
                      <input className={inputCls} value={editForm.platform ?? ''} onChange={e => setEditForm(f => ({ ...f, platform: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Sent</label>
                      <input type="number" className={inputCls} value={editForm.sent ?? ''} onChange={e => setEditForm(f => ({ ...f, sent: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Opened</label>
                      <input type="number" className={inputCls} value={editForm.opened ?? ''} onChange={e => setEditForm(f => ({ ...f, opened: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Clicked</label>
                      <input type="number" className={inputCls} value={editForm.clicked ?? ''} onChange={e => setEditForm(f => ({ ...f, clicked: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Unsubscribed</label>
                      <input type="number" className={inputCls} value={editForm.unsubscribed ?? ''} onChange={e => setEditForm(f => ({ ...f, unsubscribed: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                    <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2 text-white text-sm rounded-lg font-medium" style={goldBtn}>{editSaving ? 'Saving…' : 'Save'}</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Platform" value={selected.platform} />
                  <Field label="Date" value={selected.date ? fmtDate(selected.date) : null} />
                  <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-3">
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Sent</p><p className="text-sm font-semibold text-stone-800">{selected.sent?.toLocaleString() ?? '—'}</p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Opened</p><p className="text-sm font-semibold text-stone-800">{selected.opened?.toLocaleString() ?? '—'} <span className="text-stone-400 font-normal text-xs">({pct(selected.opened, selected.sent)})</span></p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Clicked</p><p className="text-sm font-semibold text-stone-800">{selected.clicked?.toLocaleString() ?? '—'} <span className="text-stone-400 font-normal text-xs">({pct(selected.clicked, selected.sent)})</span></p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Unsubscribed</p><p className="text-sm font-semibold text-stone-800">{selected.unsubscribed?.toLocaleString() ?? '—'}</p></div>
                  </div>
                  <Field label="Notes" value={selected.notes} />
                </div>
              )}
            </DetailPanel>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   SOCIAL SECTION
══════════════════════════════════════════════════════════ */
const SOCIAL_EMPTY = { platform: '', date: '', content: '', link: '', likes: '', comments: '', shares: '', reach: '', notes: '' }
const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'Twitter/X', 'TikTok', 'YouTube', 'Other']

function SocialSection() {
  const [rows, setRows] = useState<SocialEntry[] | null>(null)
  const [selected, setSelected] = useState<SocialEntry | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(SOCIAL_EMPTY)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  type EditSocialForm = Omit<Partial<SocialEntry>, 'likes'|'comments'|'shares'|'reach'> & { likes?: string; comments?: string; shares?: string; reach?: string }
  const [editForm, setEditForm] = useState<EditSocialForm>({})
  const [editSaving, setEditSaving] = useState(false)
  const [fbRows, setFbRows] = useState<FacebookEntry[] | null>(null)

  useEffect(() => {
    supabase.from('data_social').select('*').order('date', { ascending: false })
      .then(({ data }) => setRows((data as SocialEntry[]) ?? []))
    supabase.from('data_facebook').select('*').order('period', { ascending: false })
      .then(({ data }) => setFbRows((data as FacebookEntry[]) ?? []))
  }, [])

  const latestFB = fbRows?.[0] ?? null
  const prevFB   = fbRows?.[1] ?? null
  const fmtPeriod = (p: string) => { const [y,m] = p.split('-'); return new Date(parseInt(y), parseInt(m)-1).toLocaleDateString('en-US',{month:'long',year:'numeric'}) }
  const delta = (curr: number | null, p: number | null) => {
    if (curr == null || p == null || p === 0) return null
    const pct = Math.round(((curr - p) / p) * 100)
    return { pct, up: pct >= 0 }
  }

  const num = (s: string) => s ? parseInt(s) : null

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!form.platform) return
    setSaving(true)
    const { data } = await supabase.from('data_social').insert({
      platform: form.platform.trim(), date: form.date || null, content: form.content.trim() || null,
      link: form.link.trim() || null, likes: num(form.likes), comments: num(form.comments),
      shares: num(form.shares), reach: num(form.reach), notes: form.notes.trim() || null,
    }).select().single()
    if (data) { setRows(prev => [data as SocialEntry, ...(prev ?? [])]); setSelected(data as SocialEntry) }
    setForm(SOCIAL_EMPTY); setShowAdd(false); setSaving(false)
  }

  async function saveEdit() {
    if (!selected) return; setEditSaving(true)
    const { data } = await supabase.from('data_social').update({
      platform: editForm.platform, date: editForm.date || null, content: editForm.content || null,
      link: editForm.link || null, likes: editForm.likes ? parseInt(editForm.likes) : null,
      comments: editForm.comments ? parseInt(editForm.comments) : null, shares: editForm.shares ? parseInt(editForm.shares) : null,
      reach: editForm.reach ? parseInt(editForm.reach) : null, notes: editForm.notes || null,
    }).eq('id', selected.id).select().single()
    if (data) { const u = data as SocialEntry; setSelected(u); setRows(prev => prev?.map(r => r.id === selected.id ? u : r) ?? null) }
    setEditing(false); setEditSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('data_social').delete().eq('id', id)
    setRows(prev => prev?.filter(r => r.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  const platformBadge: Record<string, string> = {
    Instagram: 'bg-pink-100 text-pink-700', Facebook: 'bg-blue-100 text-blue-700',
    LinkedIn: 'bg-sky-100 text-sky-700', 'Twitter/X': 'bg-stone-100 text-stone-600',
    TikTok: 'bg-fuchsia-100 text-fuchsia-700', YouTube: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setForm(SOCIAL_EMPTY); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
          <Plus size={15} /> Add Post
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">New Social Post</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-stone-400 mb-1 block">Platform *</label>
                <select required className={inputCls} value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                  <option value="">Select…</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Likes</label>
                <input type="number" className={inputCls} value={form.likes} onChange={e => setForm(f => ({ ...f, likes: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Comments</label>
                <input type="number" className={inputCls} value={form.comments} onChange={e => setForm(f => ({ ...f, comments: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Shares</label>
                <input type="number" className={inputCls} value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Reach</label>
                <input type="number" className={inputCls} value={form.reach} onChange={e => setForm(f => ({ ...f, reach: e.target.value }))} /></div>
              <div className="col-span-2"><label className="text-xs text-stone-400 mb-1 block">Post Link</label>
                <input className={inputCls} placeholder="URL" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-stone-400 mb-1 block">Content / Caption</label>
              <textarea className={inputCls + ' resize-none'} rows={2} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} /></div>
            <div><label className="text-xs text-stone-400 mb-1 block">Notes</label>
              <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !form.platform} className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>{saving ? 'Saving…' : 'Add'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {rows === null ? <div className="text-center py-16 text-stone-400 text-sm">Loading…</div> : (
        <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {rows.length === 0 ? <div className="text-center py-16 text-stone-400 text-sm">No posts logged yet.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Platform</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Caption</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Likes</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Reach</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Date</th>
                </tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.id} onClick={() => { setSelected(prev => prev?.id === r.id ? null : r); setEditing(false) }}
                    className={`border-b border-stone-100 cursor-pointer transition-colors ${selected?.id === r.id ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformBadge[r.platform] ?? 'bg-stone-100 text-stone-500'}`}>{r.platform}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 max-w-[200px] truncate">{r.content ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-700 font-medium">{r.likes?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{r.reach?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-400 text-xs">{r.date ? fmtDate(r.date) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">{rows.length} post{rows.length !== 1 ? 's' : ''}</div>
          </div>
          {selected ? (
            <DetailPanel onClose={() => setSelected(null)}>
              <div className="flex items-start justify-between mb-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformBadge[selected.platform] ?? 'bg-stone-100 text-stone-500'}`}>{selected.platform}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditForm({ ...selected, likes: selected.likes != null ? String(selected.likes) : '', comments: selected.comments != null ? String(selected.comments) : '', shares: selected.shares != null ? String(selected.shares) : '', reach: selected.reach != null ? String(selected.reach) : '' }); setEditing(true) }}
                    className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1"><Pencil size={11} /> Edit</button>
                  <button onClick={() => del(selected.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Platform</label>
                    <select className={inputCls} value={editForm.platform ?? ''} onChange={e => setEditForm(f => ({ ...f, platform: e.target.value }))}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date</label>
                      <input type="date" className={inputCls} value={editForm.date ?? ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Likes</label>
                      <input type="number" className={inputCls} value={editForm.likes ?? ''} onChange={e => setEditForm(f => ({ ...f, likes: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Comments</label>
                      <input type="number" className={inputCls} value={editForm.comments ?? ''} onChange={e => setEditForm(f => ({ ...f, comments: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Shares</label>
                      <input type="number" className={inputCls} value={editForm.shares ?? ''} onChange={e => setEditForm(f => ({ ...f, shares: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Reach</label>
                      <input type="number" className={inputCls} value={editForm.reach ?? ''} onChange={e => setEditForm(f => ({ ...f, reach: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Link</label>
                    <input className={inputCls} value={editForm.link ?? ''} onChange={e => setEditForm(f => ({ ...f, link: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Content</label>
                    <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.content ?? ''} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} /></div>
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                    <textarea className={inputCls + ' resize-none'} rows={2} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2 text-white text-sm rounded-lg font-medium" style={goldBtn}>{editSaving ? 'Saving…' : 'Save'}</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Date" value={selected.date ? fmtDate(selected.date) : null} />
                  <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-3">
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Likes</p><p className="text-sm font-semibold text-stone-800">{selected.likes?.toLocaleString() ?? '—'}</p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Comments</p><p className="text-sm font-semibold text-stone-800">{selected.comments?.toLocaleString() ?? '—'}</p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Shares</p><p className="text-sm font-semibold text-stone-800">{selected.shares?.toLocaleString() ?? '—'}</p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Reach</p><p className="text-sm font-semibold text-stone-800">{selected.reach?.toLocaleString() ?? '—'}</p></div>
                  </div>
                  {selected.content && <Field label="Content" value={selected.content} />}
                  {selected.link && <div><p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Link</p>
                    <a href={selected.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">{selected.link}</a></div>}
                  <Field label="Notes" value={selected.notes} />
                </div>
              )}
            </DetailPanel>
          ) : null}
        </div>
      )}

      {/* Facebook Page analytics */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </div>
          <p className="text-sm font-semibold text-stone-700">Facebook Page</p>
          {latestFB && <span className="text-xs text-stone-400">{fmtPeriod(latestFB.period)}</span>}
        </div>
        {fbRows === null ? (
          <div className="text-center py-10 text-stone-400 text-sm">Loading…</div>
        ) : fbRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-12 gap-2 text-stone-400">
            <p className="text-sm">No Facebook data yet.</p>
            <p className="text-xs text-center max-w-xs">Add meta-to-supabase.gs to your Apps Script project and run syncFBLastMonth().</p>
          </div>
        ) : (
          <>
            {latestFB && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                {([
                  { label: 'Followers',     value: latestFB.page_followers?.toLocaleString(),      d: delta(latestFB.page_followers, prevFB?.page_followers ?? null),        sub: 'page followers' },
                  { label: 'Talking About', value: latestFB.page_engaged_users?.toLocaleString(), d: delta(latestFB.page_engaged_users, prevFB?.page_engaged_users ?? null), sub: 'people talking about page' },
                  { label: 'Posts',         value: latestFB.post_count?.toLocaleString(),         d: null,                                                                   sub: 'posts published' },
                ] as { label: string; value: string | undefined; d: { pct: number; up: boolean } | null; sub: string }[]).map(({ label, value, d, sub }) => (
                  <div key={label} className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-2xl font-bold text-stone-800 leading-none mb-1">{value ?? '—'}</p>
                    <p className="text-[10px] text-stone-400">{sub}</p>
                    {d && <p className={`text-xs mt-2 font-medium flex items-center gap-0.5 ${d.up ? 'text-emerald-600' : 'text-red-500'}`}><span>{d.up ? '▲' : '▼'}</span><span>{Math.abs(d.pct)}%</span><span className="text-stone-400 font-normal ml-0.5">vs last mo.</span></p>}
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Month</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Followers</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Talking About</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Posts</th>
                </tr></thead>
                <tbody>
                  {fbRows.map((r, i) => (
                    <tr key={r.id} className={`border-b border-stone-100 ${i === 0 ? 'bg-blue-50/30' : 'hover:bg-stone-50'}`}>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {fmtPeriod(r.period)}
                        {i === 0 && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Latest</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700">{r.page_followers?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.page_engaged_users?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.post_count?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">{fbRows.length} month{fbRows.length !== 1 ? 's' : ''} of data · synced monthly via Meta Graph API</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   EVENTS SECTION
══════════════════════════════════════════════════════════ */
const EVENT_EMPTY = { event_name: '', date: '', attendance: '', revenue: '', venue: '', notes: '' }

function EventsSection() {
  const [rows, setRows] = useState<EventEntry[] | null>(null)
  const [selected, setSelected] = useState<EventEntry | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(EVENT_EMPTY)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  type EditEventForm = Omit<Partial<EventEntry>, 'attendance'|'revenue'> & { attendance?: string; revenue?: string }
  const [editForm, setEditForm] = useState<EditEventForm>({})
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    supabase.from('data_events').select('*').order('date', { ascending: false })
      .then(({ data }) => setRows((data as EventEntry[]) ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!form.event_name) return
    setSaving(true)
    const { data } = await supabase.from('data_events').insert({
      event_name: form.event_name.trim(), date: form.date || null,
      attendance: form.attendance ? parseInt(form.attendance) : null,
      revenue: form.revenue ? parseFloat(form.revenue) : null,
      venue: form.venue.trim() || null, notes: form.notes.trim() || null,
    }).select().single()
    if (data) { setRows(prev => [data as EventEntry, ...(prev ?? [])]); setSelected(data as EventEntry) }
    setForm(EVENT_EMPTY); setShowAdd(false); setSaving(false)
  }

  async function saveEdit() {
    if (!selected) return; setEditSaving(true)
    const { data } = await supabase.from('data_events').update({
      event_name: editForm.event_name, date: editForm.date || null,
      attendance: editForm.attendance ? parseInt(editForm.attendance) : null,
      revenue: editForm.revenue ? parseFloat(editForm.revenue) : null,
      venue: editForm.venue || null, notes: editForm.notes || null,
    }).eq('id', selected.id).select().single()
    if (data) { const u = data as EventEntry; setSelected(u); setRows(prev => prev?.map(r => r.id === selected.id ? u : r) ?? null) }
    setEditing(false); setEditSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('data_events').delete().eq('id', id)
    setRows(prev => prev?.filter(r => r.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  const totalAttendance = (rows ?? []).reduce((s, r) => s + (r.attendance ?? 0), 0)
  const totalRevenue = (rows ?? []).reduce((s, r) => s + (r.revenue ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {rows && rows.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 px-4 py-2.5 shadow-sm flex items-center gap-3">
            <span className="text-xs text-stone-400">Events</span>
            <span className="text-sm font-semibold text-stone-800">{rows.length}</span>
            <span className="w-px h-4 bg-stone-200" />
            <span className="text-xs text-stone-400">Total Attendance</span>
            <span className="text-sm font-semibold text-stone-800">{totalAttendance.toLocaleString()}</span>
            {totalRevenue > 0 && <>
              <span className="w-px h-4 bg-stone-200" />
              <span className="text-xs text-stone-400">Revenue</span>
              <span className="text-sm font-semibold text-stone-800">{fmt$(totalRevenue)}</span>
            </>}
          </div>
        )}
        <button onClick={() => { setForm(EVENT_EMPTY); setShowAdd(true) }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm ml-auto" style={goldBtn}>
          <Plus size={15} /> Add Event
        </button>
      </div>
      {showAdd && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">New Event</h3>
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-xs text-stone-400 mb-1 block">Event Name *</label>
                <input required className={inputCls} value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Date</label>
                <input type="date" className={inputCls} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Venue</label>
                <input className={inputCls} value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Attendance</label>
                <input type="number" className={inputCls} value={form.attendance} onChange={e => setForm(f => ({ ...f, attendance: e.target.value }))} /></div>
              <div><label className="text-xs text-stone-400 mb-1 block">Revenue</label>
                <input type="number" className={inputCls} placeholder="0.00" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs text-stone-400 mb-1 block">Notes</label>
              <textarea className={inputCls + ' resize-none'} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !form.event_name} className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>{saving ? 'Saving…' : 'Add'}</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {rows === null ? <div className="text-center py-16 text-stone-400 text-sm">Loading…</div> : (
        <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            {rows.length === 0 ? <div className="text-center py-16 text-stone-400 text-sm">No events logged yet.</div> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-stone-100">
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Event</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Attendance</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Date</th>
                </tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.id} onClick={() => { setSelected(prev => prev?.id === r.id ? null : r); setEditing(false) }}
                    className={`border-b border-stone-100 cursor-pointer transition-colors ${selected?.id === r.id ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                    <td className="px-4 py-3 font-medium text-stone-800">{r.event_name}
                      {r.venue && <span className="ml-2 text-xs text-stone-400">{r.venue}</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-700 font-medium">{r.attendance?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-600">{r.revenue != null ? fmt$(r.revenue) : <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-stone-400 text-xs">{r.date ? fmtDate(r.date) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">{rows.length} event{rows.length !== 1 ? 's' : ''}</div>
          </div>
          {selected ? (
            <DetailPanel onClose={() => setSelected(null)}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-bold text-stone-800 text-base leading-snug pr-2">{selected.event_name}</h2>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditForm({ ...selected, attendance: selected.attendance != null ? String(selected.attendance) : '', revenue: selected.revenue != null ? String(selected.revenue) : '' }); setEditing(true) }}
                    className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1"><Pencil size={11} /> Edit</button>
                  <button onClick={() => del(selected.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
              {editing ? (
                <div className="space-y-3">
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Event Name</label>
                    <input className={inputCls} value={editForm.event_name ?? ''} onChange={e => setEditForm(f => ({ ...f, event_name: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date</label>
                      <input type="date" className={inputCls} value={editForm.date ?? ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Venue</label>
                      <input className={inputCls} value={editForm.venue ?? ''} onChange={e => setEditForm(f => ({ ...f, venue: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Attendance</label>
                      <input type="number" className={inputCls} value={editForm.attendance ?? ''} onChange={e => setEditForm(f => ({ ...f, attendance: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Revenue</label>
                      <input type="number" className={inputCls} value={editForm.revenue ?? ''} onChange={e => setEditForm(f => ({ ...f, revenue: e.target.value }))} /></div>
                  </div>
                  <div><label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                    <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2 text-white text-sm rounded-lg font-medium" style={goldBtn}>{editSaving ? 'Saving…' : 'Save'}</button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Date" value={selected.date ? fmtDate(selected.date) : null} />
                  <Field label="Venue" value={selected.venue} />
                  <div className="grid grid-cols-2 gap-3 bg-stone-50 rounded-xl p-3">
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Attendance</p><p className="text-sm font-semibold text-stone-800">{selected.attendance?.toLocaleString() ?? '—'}</p></div>
                    <div><p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Revenue</p><p className="text-sm font-semibold text-stone-800">{selected.revenue != null ? fmt$(selected.revenue) : '—'}</p></div>
                  </div>
                  <Field label="Notes" value={selected.notes} />
                </div>
              )}
            </DetailPanel>
          ) : null}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ANALYTICS SECTION
══════════════════════════════════════════════════════════ */
function AnalyticsSection() {
  type PageRow   = { path: string; title: string; views: number; users: number; sessions: number; engRate: number; avgDuration: number }
  type CityRow   = { city: string; region: string; users: number; sessions: number }
  type SourceRow = { channel: string; sessions: number; users: number; engRate: number }
  const [topPages,  setTopPages]  = useState<{ rows: PageRow[];   period?: string; error?: string } | null>(null)
  const [topCities, setTopCities] = useState<{ rows: CityRow[];   period?: string } | null>(null)
  const [topSources,setTopSources]= useState<{ rows: SourceRow[]; period?: string } | null>(null)
  const [rows, setRows] = useState<AnalyticsEntry[] | null>(null)
  const [chartMetric, setChartMetric] = useState<'sessions' | 'users' | 'page_views'>('sessions')

  useEffect(() => {
    supabase.from('data_analytics').select('*').order('period', { ascending: false })
      .then(({ data }) => setRows((data as AnalyticsEntry[]) ?? []))
    if (!WIX_URL) { setTopPages({ rows: [] }); setTopCities({ rows: [] }); setTopSources({ rows: [] }); return }
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)
    fetch(WIX_URL, { signal: ctrl.signal })
      .then(r => r.json())
      .then(json => {
        clearTimeout(timer)
        setTopPages(json.pages   ?? { rows: [], error: 'Pages not returned by script — redeploy wix-webapp.gs' })
        setTopCities(json.cities  ?? { rows: [] })
        setTopSources(json.sources ?? { rows: [] })
      })
      .catch(e => {
        clearTimeout(timer)
        const msg = e?.name === 'AbortError' ? 'Script timed out — check Apps Script logs' : String(e)
        setTopPages({ rows: [], error: msg }); setTopCities({ rows: [] }); setTopSources({ rows: [] })
      })
  }, [])

  const fmtPeriod = (p: string) => {
    const [y, m] = p.split('-')
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  const fmtPeriodLong = (p: string) => {
    const [y, m] = p.split('-')
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  const fmtDur = (s: number | null) => {
    if (!s) return '—'
    const m = Math.floor(s / 60), sec = Math.round(s % 60)
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }
  const delta = (curr: number | null, p: number | null) => {
    if (curr == null || p == null || p === 0) return null
    const pct = Math.round(((curr - p) / p) * 100)
    return { pct, up: pct >= 0 }
  }

  // ── Google Analytics historical data ───────────────────────
  const latest = rows?.[0] ?? null
  const prev   = rows?.[1] ?? null
  const chartRows = [...(rows ?? [])].reverse().slice(-12)
  const chartVals = chartRows.map(r => r[chartMetric] ?? 0)
  const chartMax  = Math.max(...chartVals, 1)
  const metricCards = latest ? [
    { label: 'Users',        value: latest.users?.toLocaleString(),                                               d: delta(latest.users, prev?.users ?? null),           sub: 'unique visitors' },
    { label: 'Sessions',     value: latest.sessions?.toLocaleString(),                                            d: delta(latest.sessions, prev?.sessions ?? null),     sub: 'total visits' },
    { label: 'Page Views',   value: latest.page_views?.toLocaleString(),                                          d: delta(latest.page_views, prev?.page_views ?? null), sub: 'screens viewed' },
    { label: 'Avg Duration', value: fmtDur(latest.avg_session_duration),                                          d: null,                                               sub: 'per session' },
    { label: 'Bounce Rate',  value: latest.bounce_rate != null ? `${(latest.bounce_rate*100).toFixed(1)}%` : '—', d: null,                                               sub: 'left after 1 page' },
  ] as { label: string; value: string | undefined; d: { pct: number; up: boolean } | null; sub: string }[] : []
  const CHANNELS: { key: keyof AnalyticsEntry; label: string; color: string }[] = [
    { key: 'sessions_organic',  label: 'Organic Search', color: '#4ade80' },
    { key: 'sessions_direct',   label: 'Direct',         color: '#60a5fa' },
    { key: 'sessions_referral', label: 'Referral',       color: '#f59e0b' },
    { key: 'sessions_social',   label: 'Social',         color: '#c084fc' },
    { key: 'sessions_paid',     label: 'Paid Search',    color: '#fb7185' },
    { key: 'sessions_email',    label: 'Email',          color: '#34d399' },
    { key: 'sessions_other',    label: 'Other',          color: '#94a3b8' },
  ]
  const channelTotal = latest ? CHANNELS.reduce((s, c) => s + ((latest[c.key] as number | null) ?? 0), 0) : 0

  return (
    <div className="flex flex-col gap-5">

      <div className="order-2">
      {/* ── GA4 Top Pages ── */}
      {topPages === null ? (
        <div className="text-center py-10 text-stone-400 text-sm">Loading pages…</div>
      ) : topPages.rows.length > 0 ? (() => {
        const filtered = topPages.rows.filter(r => !r.path.startsWith('/dashboard'))
        const maxViews = Math.max(...filtered.map(r => r.views), 1)
        const totalViews = filtered.reduce((s, r) => s + r.views, 0)
        const fmtDurS = (s: number) => { const m = Math.floor(s / 60); const sec = Math.round(s % 60); return m > 0 ? `${m}m ${sec}s` : `${sec}s` }
        const pageLabel = (path: string) => {
          if (path === '/') return 'Home'
          const clean = path.replace(/^\//, '').split('?')[0]
          return clean.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || path
        }
        return (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <p className="text-sm font-semibold text-stone-700">Pages &amp; Screens</p>
              <p className="text-xs text-stone-400 mt-0.5">{totalViews.toLocaleString()} total views · {topPages.period ?? 'last 90 days'}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-stone-100 bg-stone-50/60">
                  <th className="px-5 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Page</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Views</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Users</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Sessions</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Eng. Rate</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Avg. Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((page, i) => {
                  const pct = (page.views / maxViews) * 100
                  return (
                    <tr key={i} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3 max-w-xs">
                        <p className="font-medium text-stone-800 truncate" title={page.path}>{pageLabel(page.path)}</p>
                        <p className="text-[10px] text-stone-400 truncate">{page.path}</p>
                        <div className="mt-1.5 h-1 rounded-full bg-stone-100 overflow-hidden w-full">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? 'var(--gold)' : `color-mix(in srgb, var(--gold) ${Math.max(25, 100 - i * 7)}%, #d6d3d1)` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-stone-800">{page.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{(page.users ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{page.sessions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{page.engRate != null ? `${Math.round(page.engRate * 100)}%` : '—'}</td>
                      <td className="px-5 py-3 text-right text-stone-600">{page.avgDuration != null ? fmtDurS(page.avgDuration) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })() : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 text-center py-10">
          <p className="font-medium text-stone-500 mb-1 text-sm">No page data available</p>
          <p className="text-xs text-stone-400">{topPages.error ?? 'GA4 returned 0 rows — confirm the property ID and that the deploying Google account has Viewer access.'}</p>
        </div>
      )}

      {/* ── Cities + Sources row ── */}
      {((topCities?.rows?.length ?? 0) > 0 || (topSources?.rows?.length ?? 0) > 0) && (
        <div className="grid grid-cols-2 gap-4">

          {/* Cities */}
          {topCities && topCities.rows.length > 0 && (() => {
            const maxUsers = Math.max(...topCities.rows.map(r => r.users), 1)
            return (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3">
                  <p className="text-sm font-semibold text-stone-700">Users by City</p>
                  <p className="text-xs text-stone-400 mt-0.5">{topCities.period ?? 'last 90 days'}</p>
                </div>
                <div className="px-5 pb-4 space-y-2.5">
                  {topCities.rows.map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-sm text-stone-700 truncate">{r.city}<span className="text-stone-400 text-xs ml-1">{r.region}</span></span>
                        <span className="text-sm font-bold text-stone-800 ml-2 flex-shrink-0">{r.users.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(r.users / maxUsers) * 100}%`, background: i === 0 ? 'var(--gold)' : `color-mix(in srgb, var(--gold) ${Math.max(25, 100 - i * 8)}%, #d6d3d1)` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Sources */}
          {topSources && topSources.rows.length > 0 && (() => {
            const totalSessions = topSources.rows.reduce((s, r) => s + r.sessions, 0)
            const CHANNEL_COLORS: Record<string, string> = {
              'Organic Search': '#4ade80', 'Direct': '#60a5fa', 'Referral': '#f59e0b',
              'Organic Social': '#c084fc', 'Paid Search': '#fb7185', 'Email': '#34d399',
              'Display': '#38bdf8', 'Affiliates': '#a78bfa', 'Unassigned': '#94a3b8'
            }
            const color = (ch: string) => CHANNEL_COLORS[ch] ?? '#94a3b8'
            return (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3">
                  <p className="text-sm font-semibold text-stone-700">Traffic Sources</p>
                  <p className="text-xs text-stone-400 mt-0.5">{topSources.period ?? 'last 90 days'}</p>
                </div>
                {/* stacked bar */}
                <div className="mx-5 mb-3 flex h-2.5 rounded-full overflow-hidden gap-px">
                  {topSources.rows.map((r, i) => (
                    <div key={i} style={{ width: `${(r.sessions / totalSessions) * 100}%`, background: color(r.channel) }} title={`${r.channel}: ${r.sessions.toLocaleString()}`} />
                  ))}
                </div>
                <div className="px-5 pb-4 space-y-2.5">
                  {topSources.rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color(r.channel) }} />
                      <span className="text-sm text-stone-700 flex-1 truncate">{r.channel}</span>
                      <span className="text-sm font-bold text-stone-800">{r.sessions.toLocaleString()}</span>
                      <span className="text-xs text-stone-400 w-8 text-right">{Math.round(r.engRate * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

        </div>
      )}

      </div>

      {/* ── Google Analytics historical ── */}
      {rows === null ? (
        <div className="text-center py-16 text-stone-400 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
          <p className="text-sm">No Google Analytics data yet.</p>
          <p className="text-xs text-center max-w-xs">Data will appear after the first monthly sync.</p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Google Analytics · Monthly History</p>
          {latest && (
            <div>
              <p className="text-xs text-stone-400 mb-3">{fmtPeriodLong(latest.period)} — most recent month</p>
              <div className="grid grid-cols-5 gap-3">
                {metricCards.map(({ label, value, d, sub }) => (
                  <div key={label} className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
                    <p className="text-2xl font-bold text-stone-800 leading-none mb-1">{value ?? '—'}</p>
                    <p className="text-[10px] text-stone-400">{sub}</p>
                    {d && (
                      <p className={`text-xs mt-2 font-medium flex items-center gap-0.5 ${d.up ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span>{d.up ? '▲' : '▼'}</span><span>{Math.abs(d.pct)}%</span>
                        <span className="text-stone-400 font-normal ml-0.5">vs last mo.</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {latest && channelTotal > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-stone-700 mb-4">Sessions by Channel</p>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-4">
                {CHANNELS.map(c => {
                  const val = (latest[c.key] as number | null) ?? 0
                  const w = channelTotal > 0 ? (val / channelTotal) * 100 : 0
                  if (w < 0.5) return null
                  return <div key={c.key} style={{ width: `${w}%`, background: c.color }} title={`${c.label}: ${val.toLocaleString()}`} />
                })}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {CHANNELS.map(c => {
                  const val = (latest[c.key] as number | null) ?? 0
                  if (!val) return null
                  const pctVal = channelTotal > 0 ? Math.round((val / channelTotal) * 100) : 0
                  const pd = prev ? delta(val, (prev[c.key] as number | null)) : null
                  return (
                    <div key={c.key} className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm mt-1 flex-shrink-0" style={{ background: c.color }} />
                      <div>
                        <p className="text-[10px] text-stone-400 font-medium">{c.label}</p>
                        <p className="text-sm font-bold text-stone-800">{val.toLocaleString()}</p>
                        <p className="text-[10px] text-stone-400">{pctVal}% of sessions
                          {pd && <span className={`ml-1 font-medium ${pd.up ? 'text-emerald-600' : 'text-red-400'}`}>{pd.up ? '▲' : '▼'}{Math.abs(pd.pct)}%</span>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {chartRows.length > 1 && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-stone-700">Website Traffic</p>
                <div className="flex gap-1 bg-stone-100 rounded-lg p-0.5">
                  {(['sessions', 'users', 'page_views'] as const).map(m => (
                    <button key={m} onClick={() => setChartMetric(m)}
                      className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${chartMetric === m ? 'bg-white text-stone-700 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                      {m === 'page_views' ? 'Page Views' : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-2 h-40">
                {chartRows.map((r, i) => {
                  const val = (r[chartMetric] as number | null) ?? 0
                  const heightPct = chartMax > 0 ? (val / chartMax) * 100 : 0
                  const isLatest = i === chartRows.length - 1
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {val.toLocaleString()}
                      </div>
                      <div className="w-full rounded-t-sm transition-all"
                        style={{ height: `${heightPct}%`, minHeight: val > 0 ? '4px' : '0', background: isLatest ? 'var(--gold)' : '#d6d3d1' }} />
                      <p className="text-[9px] text-stone-400 truncate w-full text-center">{fmtPeriod(r.period)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-stone-100 bg-stone-50/60">
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-left">Month</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Users</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Sessions</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Organic</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Direct</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Referral</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Bounce Rate</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Avg Duration</th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => {
                  const p  = rows[i + 1] ?? null
                  const sd = delta(r.sessions, p?.sessions ?? null)
                  return (
                    <tr key={r.id} className={`border-b border-stone-100 ${i === 0 ? 'bg-amber-50/30' : 'hover:bg-stone-50'}`}>
                      <td className="px-4 py-3 font-medium text-stone-800">
                        {fmtPeriodLong(r.period)}
                        {i === 0 && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Latest</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-700">{r.users?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-stone-700">{r.sessions?.toLocaleString() ?? <span className="text-stone-300">—</span>}</span>
                        {sd && <span className={`ml-1.5 text-[10px] font-medium ${sd.up ? 'text-emerald-600' : 'text-red-400'}`}>{sd.up ? '▲' : '▼'}{Math.abs(sd.pct)}%</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.sessions_organic?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.sessions_direct?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.sessions_referral?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.bounce_rate != null ? `${(r.bounce_rate * 100).toFixed(1)}%` : <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{fmtDur(r.avg_session_duration)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5 text-xs text-stone-400 border-t border-stone-100">{rows.length} month{rows.length !== 1 ? 's' : ''} of data · synced monthly via Google Analytics</div>
          </div>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   FEEDBACK SECTION
══════════════════════════════════════════════════════════ */
type FeedbackTag = 'Venue' | 'Tour' | 'Volunteer' | 'Story' | 'Idea' | 'Other'
interface FeedbackEntry {
  id: string; content: string; tag: FeedbackTag
  source: string | null; created_at: string
}

const FEEDBACK_TAGS: FeedbackTag[] = ['Venue', 'Tour', 'Volunteer', 'Story', 'Idea', 'Other']

const TAG_COLORS: Record<FeedbackTag, string> = {
  Venue:     'bg-blue-100 text-blue-700',
  Tour:      'bg-emerald-100 text-emerald-700',
  Volunteer: 'bg-purple-100 text-purple-700',
  Story:     'bg-rose-100 text-rose-700',
  Idea:      'bg-amber-100 text-amber-700',
  Other:     'bg-stone-100 text-stone-500',
}

const FEEDBACK_SOURCES = ['Website Form', 'Google Review', 'Word of Mouth', 'Social Media', 'Other'] as const
const FEEDBACK_EMPTY = { content: '', tag: 'Other' as FeedbackTag, source: '' }

function FeedbackSection() {
  const [rows, setRows]         = useState<FeedbackEntry[] | null>(null)
  const [filterTag, setFilter]  = useState<FeedbackTag | 'All'>('All')
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState(FEEDBACK_EMPTY)
  const [saving, setSaving]     = useState(false)
  const [editing, setEditing]   = useState<FeedbackEntry | null>(null)
  const [editContent, setEC]    = useState('')
  const [editSource, setES]     = useState('')
  const [editTag, setET]        = useState<FeedbackTag>('Other')
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    supabase.from('data_feedback').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as FeedbackEntry[]) ?? []))
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('data_feedback').insert({
      content: form.content.trim(),
      tag: form.tag,
      source: form.source || null,
    }).select().single()
    if (error) { alert('Save failed: ' + error.message); setSaving(false); return }
    if (data) setRows(prev => [data as FeedbackEntry, ...(prev ?? [])])
    setForm(FEEDBACK_EMPTY); setShowAdd(false); setSaving(false)
  }

  function startEdit(entry: FeedbackEntry) {
    setEditing(entry); setEC(entry.content); setES(entry.source ?? ''); setET(entry.tag)
  }

  async function saveEdit() {
    if (!editing) return
    setEditSaving(true)
    const { data } = await supabase.from('data_feedback').update({
      content: editContent.trim(), tag: editTag, source: editSource.trim() || null,
    }).eq('id', editing.id).select().single()
    if (data) setRows(prev => prev?.map(r => r.id === editing.id ? data as FeedbackEntry : r) ?? null)
    setEditing(null); setEditSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this feedback?')) return
    await supabase.from('data_feedback').delete().eq('id', id)
    setRows(prev => prev?.filter(r => r.id !== id) ?? null)
    if (editing?.id === id) setEditing(null)
  }

  const fmtTs = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const visible = rows?.filter(r => filterTag === 'All' || r.tag === filterTag) ?? []

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['All', ...FEEDBACK_TAGS] as (FeedbackTag | 'All')[]).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterTag === t ? 'text-white shadow-sm' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-700'}`}
              style={filterTag === t ? goldBtn : {}}>
              {t}{t !== 'All' && rows ? ` · ${rows.filter(r => r.tag === t).length}` : ''}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm(FEEDBACK_EMPTY); setShowAdd(s => !s) }}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
          <Plus size={15} /> Add Feedback
        </button>
      </div>

      {/* add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">New Feedback</h3>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Tag</label>
              <div className="flex gap-2 flex-wrap">
                {FEEDBACK_TAGS.map(t => (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, tag: t }))}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.tag === t ? TAG_COLORS[t] + ' border-transparent' : 'bg-white border-stone-200 text-stone-500 hover:text-stone-700'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Feedback *</label>
              <textarea required rows={3} className={inputCls + ' resize-none'} placeholder="What did you hear?"
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Source <span className="text-stone-300">(optional)</span></label>
              <select className={inputCls} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="">— select source —</option>
                {FEEDBACK_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-700">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={goldBtn}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* list */}
      {rows === null ? (
        <div className="text-center py-16 text-stone-400 text-sm">Loading…</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
          <p className="text-sm">{rows.length === 0 ? 'No feedback yet.' : `No ${filterTag} feedback.`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm divide-y divide-stone-50">
          {visible.map(entry => (
            <div key={entry.id} className="px-5 py-4">
              {editing?.id === entry.id ? (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {FEEDBACK_TAGS.map(t => (
                      <button type="button" key={t} onClick={() => setET(t)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${editTag === t ? TAG_COLORS[t] + ' border-transparent' : 'bg-white border-stone-200 text-stone-500'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <textarea rows={3} className={inputCls + ' resize-none'} value={editContent} onChange={e => setEC(e.target.value)} />
                  <select className={inputCls} value={editSource} onChange={e => setES(e.target.value)}>
                    <option value="">— select source —</option>
                    {FEEDBACK_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(null)} className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700">Cancel</button>
                    <button onClick={saveEdit} disabled={editSaving} className="px-3 py-1.5 text-xs text-white rounded-lg disabled:opacity-50" style={goldBtn}>
                      {editSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${TAG_COLORS[entry.tag]}`}>{entry.tag}</span>
                      {entry.source && <span className="text-xs text-stone-400">{entry.source}</span>}
                      <span className="text-xs text-stone-300 ml-auto">{fmtTs(entry.created_at)}</span>
                    </div>
                    <p className="text-sm text-stone-700 whitespace-pre-wrap">{entry.content}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(entry)} className="p-1.5 text-stone-300 hover:text-stone-500 transition-colors"><Pencil size={13} /></button>
                    <button onClick={() => del(entry.id)} className="p-1.5 text-stone-300 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {rows && rows.length > 0 && (
        <p className="text-xs text-stone-400 px-1">{rows.length} entr{rows.length !== 1 ? 'ies' : 'y'} total</p>
      )}
    </div>
  )
}
