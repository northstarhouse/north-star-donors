'use client'
import { useState, useEffect } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Types ───────────────────────────────────────────────── */
type OutreachStatus = 'planned' | 'in_progress' | 'completed' | 'no_response' | 'follow_up'

interface OutreachEntry {
  id: string
  area: string
  title: string
  contact: string | null
  date: string | null
  status: OutreachStatus
  notes: string | null
  submitted_by: string | null
  created_at: string
}

const STATUS_STYLES: Record<OutreachStatus, string> = {
  planned:     'bg-stone-100 text-stone-500 border-stone-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  completed:   'bg-emerald-100 text-emerald-700 border-emerald-200',
  no_response: 'bg-red-100 text-red-600 border-red-200',
  follow_up:   'bg-blue-100 text-blue-700 border-blue-200',
}

const STATUS_LABELS: Record<OutreachStatus, string> = {
  planned:     'Planned',
  in_progress: 'In Progress',
  completed:   'Completed',
  no_response: 'No Response',
  follow_up:   'Follow Up',
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }

const EMPTY_FORM = { area: '', title: '', contact: '', date: '', status: 'planned' as OutreachStatus, notes: '', submitted_by: '' }

/* ── Component ───────────────────────────────────────────── */
export default function OutreachPage() {
  const [entries, setEntries] = useState<OutreachEntry[] | null>(null)
  const [selected, setSelected] = useState<OutreachEntry | null>(null)
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [addSaving, setAddSaving] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<OutreachEntry>>({})
  const [editSaving, setEditSaving] = useState(false)

  const [filterArea, setFilterArea] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<OutreachStatus | 'all'>('all')

  /* ── Load ────────────────────────────────────────────────── */
  useEffect(() => {
    supabase.from('outreach_entries').select('*').order('area').order('created_at', { ascending: false })
      .then(({ data }) => setEntries(data as OutreachEntry[] ?? []))
  }, [])

  /* ── Actions ─────────────────────────────────────────────── */
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.area || !addForm.title) return
    setAddSaving(true)
    const { data } = await supabase.from('outreach_entries').insert({
      area: addForm.area.trim(), title: addForm.title.trim(),
      contact: addForm.contact.trim() || null, date: addForm.date || null,
      status: addForm.status, notes: addForm.notes.trim() || null,
      submitted_by: addForm.submitted_by.trim() || null,
    }).select().single()
    if (data) {
      setEntries(prev => {
        const updated = [...(prev ?? []), data as OutreachEntry]
        return updated.sort((a, b) => a.area.localeCompare(b.area))
      })
      setSelected(data as OutreachEntry)
    }
    setAddForm(EMPTY_FORM)
    setShowAdd(false)
    setAddSaving(false)
  }

  async function saveEdit() {
    if (!selected) return
    setEditSaving(true)
    const { data } = await supabase.from('outreach_entries').update({
      ...editForm, updated_at: new Date().toISOString(),
    }).eq('id', selected.id).select().single()
    if (data) {
      const updated = data as OutreachEntry
      setSelected(updated)
      setEntries(prev => prev?.map(e => e.id === selected.id ? updated : e).sort((a, b) => a.area.localeCompare(b.area)) ?? null)
    }
    setEditing(false)
    setEditSaving(false)
  }

  async function updateStatus(entry: OutreachEntry, status: OutreachStatus) {
    await supabase.from('outreach_entries').update({ status }).eq('id', entry.id)
    const updated = { ...entry, status }
    setEntries(prev => prev?.map(e => e.id === entry.id ? updated : e) ?? null)
    setSelected(prev => prev?.id === entry.id ? updated : prev)
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this outreach entry?')) return
    await supabase.from('outreach_entries').delete().eq('id', id)
    setEntries(prev => prev?.filter(e => e.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  function toggleArea(area: string) {
    setCollapsedAreas(prev => {
      const next = new Set(prev)
      next.has(area) ? next.delete(area) : next.add(area)
      return next
    })
  }

  /* ── Derived ─────────────────────────────────────────────── */
  const allAreas = [...new Set((entries ?? []).map(e => e.area))].sort()

  const visible = (entries ?? []).filter(e => {
    if (filterArea !== 'all' && e.area !== filterArea) return false
    if (filterStatus !== 'all' && e.status !== filterStatus) return false
    return true
  })

  const grouped = allAreas
    .filter(a => filterArea === 'all' || a === filterArea)
    .map(area => ({ area, entries: visible.filter(e => e.area === area) }))
    .filter(g => g.entries.length > 0)

  const totalOpen = (entries ?? []).filter(e => e.status !== 'completed').length

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="outreach" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start justify-between mb-6 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Megaphone size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Outreach
              </h1>
            </div>
            <button onClick={() => { setAddForm(EMPTY_FORM); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm flex-shrink-0" style={goldBtn}>
              <Plus size={15} /> Add Entry
            </button>
          </div>

          {/* Stats + filters */}
          {entries !== null && (
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <div className="bg-white rounded-xl border border-stone-200 px-4 py-2.5 shadow-sm flex items-center gap-3">
                <span className="text-xs text-stone-400">Areas</span>
                <span className="text-sm font-semibold text-stone-800">{allAreas.length}</span>
                <span className="w-px h-4 bg-stone-200" />
                <span className="text-xs text-stone-400">Open</span>
                <span className="text-sm font-semibold text-stone-800">{totalOpen}</span>
                <span className="w-px h-4 bg-stone-200" />
                <span className="text-xs text-stone-400">Total</span>
                <span className="text-sm font-semibold text-stone-800">{entries.length}</span>
              </div>

              <select className="border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600 shadow-sm"
                value={filterArea} onChange={e => setFilterArea(e.target.value)}>
                <option value="all">All Areas</option>
                {allAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select className="border border-stone-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600 shadow-sm"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value as OutreachStatus | 'all')}>
                <option value="all">All Statuses</option>
                {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>

              {(filterArea !== 'all' || filterStatus !== 'all') && (
                <button onClick={() => { setFilterArea('all'); setFilterStatus('all') }}
                  className="text-xs text-stone-400 hover:text-stone-600">Clear filters</button>
              )}
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex-1">
          {/* Add form */}
          {showAdd && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">New Outreach Entry</h3>
              <form onSubmit={submitAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Area *</label>
                    <input required list="area-suggestions" className={inputCls} placeholder="e.g. Donors, Media, Community…"
                      value={addForm.area} onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))} />
                    <datalist id="area-suggestions">
                      {allAreas.map(a => <option key={a} value={a} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Title *</label>
                    <input required className={inputCls} placeholder="What is the outreach?"
                      value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Contact</label>
                    <input className={inputCls} placeholder="Person or organization"
                      value={addForm.contact} onChange={e => setAddForm(f => ({ ...f, contact: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Date</label>
                    <input type="date" className={inputCls} value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Status</label>
                    <select className={inputCls} value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as OutreachStatus }))}>
                      {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Submitted By</label>
                    <input className={inputCls} placeholder="Your name"
                      value={addForm.submitted_by} onChange={e => setAddForm(f => ({ ...f, submitted_by: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Notes</label>
                  <textarea className={inputCls + ' resize-none'} rows={2}
                    value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addSaving || !addForm.area || !addForm.title}
                    className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                    {addSaving ? 'Saving…' : 'Add Entry'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          {entries === null ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading…</div>
          ) : (
            <div className="grid gap-5 grid-cols-[1fr_380px]">
              {/* Grouped list */}
              <div className="space-y-4 min-w-0">
                {grouped.length === 0 && (
                  <div className="text-center py-16 text-stone-400 text-sm">No entries yet. Add one above.</div>
                )}
                {grouped.map(({ area, entries: aEntries }) => {
                  const collapsed = collapsedAreas.has(area)
                  return (
                    <div key={area} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                      {/* Area header */}
                      <button onClick={() => toggleArea(area)}
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-stone-700 text-sm">{area}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{aEntries.length}</span>
                        </div>
                        <ChevronDown size={15} className={`text-stone-400 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
                      </button>

                      {!collapsed && (
                        <div className="border-t border-stone-100">
                          {aEntries.map(entry => {
                            const isSelected = selected?.id === entry.id
                            return (
                              <button key={entry.id}
                                onClick={() => { setSelected(prev => prev?.id === entry.id ? null : entry); setEditing(false) }}
                                className={`w-full text-left px-5 py-3 border-b border-stone-50 last:border-0 transition-colors ${isSelected ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-stone-800 truncate">{entry.title}</p>
                                    {entry.contact && <p className="text-xs text-stone-400 mt-0.5 truncate">{entry.contact}</p>}
                                    {entry.submitted_by && <p className="text-xs text-stone-300 mt-0.5 truncate">by {entry.submitted_by}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {entry.date && (
                                      <span className="text-[10px] text-stone-400">
                                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[entry.status]}`}>
                                      {STATUS_LABELS[entry.status]}
                                    </span>
                                  </div>
                                </div>
                                {entry.notes && (
                                  <p className="text-xs text-stone-400 mt-1 line-clamp-1 text-left">{entry.notes}</p>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Detail panel */}
              {selected ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 self-start sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{selected.area}</p>
                      <h2 className="font-bold text-stone-800 text-base leading-snug">{selected.title}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        value={selected.status} onChange={e => updateStatus(selected, e.target.value as OutreachStatus)}>
                        {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <button onClick={() => { setEditForm({ ...selected }); setEditing(true) }}
                        className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => deleteEntry(selected.id)}
                        className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                      <button onClick={() => { setSelected(null); setEditing(false) }}
                        className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {editing && (
                    <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-5 space-y-3">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Edit Entry</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Area</label>
                          <input list="area-suggestions-edit" className={inputCls} value={editForm.area ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} />
                          <datalist id="area-suggestions-edit">
                            {allAreas.map(a => <option key={a} value={a} />)}
                          </datalist>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
                          <input className={inputCls} value={editForm.title ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Contact</label>
                          <input className={inputCls} value={editForm.contact ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, contact: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date</label>
                          <input type="date" className={inputCls} value={editForm.date ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Submitted By</label>
                          <input className={inputCls} value={editForm.submitted_by ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, submitted_by: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                        <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.notes ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={editSaving}
                          className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium" style={goldBtn}>
                          {editSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => setEditing(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Detail fields */}
                  {!editing && (
                    <div className="space-y-3">
                      {selected.submitted_by && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Submitted By</p>
                          <p className="text-sm text-stone-700">{selected.submitted_by}</p>
                        </div>
                      )}
                      {selected.contact && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Contact</p>
                          <p className="text-sm text-stone-700">{selected.contact}</p>
                        </div>
                      )}
                      {selected.date && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Date</p>
                          <p className="text-sm text-stone-700">
                            {new Date(selected.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {selected.notes && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
                        </div>
                      )}
                      {!selected.submitted_by && !selected.contact && !selected.date && !selected.notes && (
                        <p className="text-xs text-stone-300 italic">No additional details. Click Edit to add more.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
