'use client'
import { useState, useEffect } from 'react'
import { BarChart2, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Types ───────────────────────────────────────────────── */
type DataTab = 'forms' | 'email' | 'social' | 'events' | 'analytics'

interface FormSubmission {
  id: string; form_name: string; form_id: string | null
  submitted_at: string; fields: Record<string, string> | null
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

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }
const fmt$ = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const pct = (a: number | null, b: number | null) => (a && b && b > 0) ? `${Math.round((a / b) * 100)}%` : '—'

const TABS: { id: DataTab; label: string }[] = [
  { id: 'analytics', label: 'Website' },
  { id: 'forms',     label: 'Forms' },
  { id: 'email',     label: 'Email Results' },
  { id: 'social',    label: 'Socials' },
  { id: 'events',    label: 'Event Data' },
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
          {tab === 'forms'     && <FormsSection />}
          {tab === 'email'     && <EmailSection />}
          {tab === 'social'    && <SocialSection />}
          {tab === 'events'    && <EventsSection />}
          {tab === 'analytics' && <AnalyticsSection />}
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
   FORMS SECTION — auto-populated from Wix via Velo
══════════════════════════════════════════════════════════ */
function FormsSection() {
  const [rows, setRows] = useState<FormSubmission[] | null>(null)
  const [selected, setSelected] = useState<FormSubmission | null>(null)
  const [collapsedForms, setCollapsedForms] = useState<Set<string>>(new Set())

  useEffect(() => {
    supabase.from('data_form_submissions').select('*').order('submitted_at', { ascending: false })
      .then(({ data }) => setRows((data as FormSubmission[]) ?? []))
  }, [])

  async function del(id: string) {
    if (!confirm('Delete this submission?')) return
    await supabase.from('data_form_submissions').delete().eq('id', id)
    setRows(prev => prev?.filter(r => r.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  function toggleForm(name: string) {
    setCollapsedForms(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }

  const formNames = [...new Set((rows ?? []).map(r => r.form_name))].sort()
  const grouped = formNames.map(name => ({ name, items: (rows ?? []).filter(r => r.form_name === name) }))

  const fmtTs = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div>
      {rows === null ? <div className="text-center py-16 text-stone-400 text-sm">Loading…</div> : (
        <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
          <div className="space-y-4 min-w-0">
            {rows.length === 0 && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
                <p className="text-sm">No submissions yet.</p>
                <p className="text-xs text-center max-w-xs">Once you add the Velo code to your Wix site, submissions will appear here automatically.</p>
              </div>
            )}
            {grouped.map(({ name, items }) => {
              const collapsed = collapsedForms.has(name)
              return (
                <div key={name} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <button onClick={() => toggleForm(name)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-stone-700 text-sm">{name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{items.length}</span>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`text-stone-400 transition-transform ${collapsed ? '-rotate-90' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {!collapsed && (
                    <div className="border-t border-stone-100">
                      {items.map(sub => {
                        const preview = sub.fields ? Object.entries(sub.fields).slice(0, 2).map(([, v]) => v).filter(Boolean).join(' · ') : ''
                        return (
                          <button key={sub.id}
                            onClick={() => setSelected(prev => prev?.id === sub.id ? null : sub)}
                            className={`w-full text-left px-5 py-3 border-b border-stone-50 last:border-0 transition-colors ${selected?.id === sub.id ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs text-stone-500">{fmtTs(sub.submitted_at)}</p>
                                {preview && <p className="text-sm text-stone-700 mt-0.5 truncate">{preview}</p>}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {rows.length > 0 && <div className="text-xs text-stone-400 px-1">{rows.length} submission{rows.length !== 1 ? 's' : ''} across {formNames.length} form{formNames.length !== 1 ? 's' : ''}</div>}
          </div>

          {selected ? (
            <DetailPanel onClose={() => setSelected(null)}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{selected.form_name}</p>
                  <p className="text-xs text-stone-400">{fmtTs(selected.submitted_at)}</p>
                </div>
                <button onClick={() => del(selected.id)} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"><Trash2 size={14} /></button>
              </div>
              {selected.fields && Object.keys(selected.fields).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(selected.fields).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap">{value || <span className="text-stone-300 italic">—</span>}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-300 italic">No field data captured.</p>
              )}
            </DetailPanel>
          ) : null}
        </div>
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
                  { label: 'Followers',   value: latestFB.page_followers?.toLocaleString(),    d: delta(latestFB.page_followers, prevFB?.page_followers ?? null),       sub: 'page followers' },
                  { label: 'Reach',       value: latestFB.page_reach?.toLocaleString(),         d: delta(latestFB.page_reach, prevFB?.page_reach ?? null),               sub: 'people reached' },
                  { label: 'Impressions', value: latestFB.page_impressions?.toLocaleString(),   d: delta(latestFB.page_impressions, prevFB?.page_impressions ?? null),    sub: 'total impressions' },
                  { label: 'Talking About', value: latestFB.page_engaged_users?.toLocaleString(), d: delta(latestFB.page_engaged_users, prevFB?.page_engaged_users ?? null), sub: 'people talking about page' },
                  { label: 'Posts',       value: latestFB.post_count?.toLocaleString(),         d: null,                                                                  sub: 'posts published' },
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
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Reach</th>
                  <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wider text-right">Impressions</th>
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
                      <td className="px-4 py-3 text-right text-stone-700">{r.page_reach?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
                      <td className="px-4 py-3 text-right text-stone-600">{r.page_impressions?.toLocaleString() ?? <span className="text-stone-300">—</span>}</td>
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
  const [rows, setRows] = useState<AnalyticsEntry[] | null>(null)
  const [chartMetric, setChartMetric] = useState<'sessions' | 'users' | 'page_views'>('sessions')

  useEffect(() => {
    supabase.from('data_analytics').select('*').order('period', { ascending: false })
      .then(({ data }) => setRows((data as AnalyticsEntry[]) ?? []))
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

  const latest = rows?.[0] ?? null
  const prev = rows?.[1] ?? null

  // Chart: show up to 12 months, oldest → newest left → right
  const chartRows = [...(rows ?? [])].reverse().slice(-12)
  const chartVals = chartRows.map(r => r[chartMetric] ?? 0)
  const chartMax = Math.max(...chartVals, 1)

  const metricCards = latest ? [
    { label: 'Users',        value: latest.users?.toLocaleString(),                                               d: delta(latest.users, prev?.users ?? null),          sub: 'unique visitors' },
    { label: 'Sessions',     value: latest.sessions?.toLocaleString(),                                            d: delta(latest.sessions, prev?.sessions ?? null),    sub: 'total visits' },
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

  const channelTotal = latest
    ? CHANNELS.reduce((s, c) => s + ((latest[c.key] as number | null) ?? 0), 0)
    : 0

  return (
    <div className="space-y-5">
      {rows === null ? (
        <div className="text-center py-16 text-stone-400 text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center py-16 gap-2 text-stone-400">
          <p className="text-sm">No analytics data yet.</p>
          <p className="text-xs text-center max-w-xs">The Google Apps Script is set up — data will appear after the first monthly sync.</p>
        </div>
      ) : (
        <>
          {/* Metric cards */}
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
                        <span>{d.up ? '▲' : '▼'}</span>
                        <span>{Math.abs(d.pct)}%</span>
                        <span className="text-stone-400 font-normal ml-0.5">vs last mo.</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traffic sources */}
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

          {/* Bar chart */}
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

          {/* Historical table */}
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
                  const p = rows[i + 1] ?? null
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
