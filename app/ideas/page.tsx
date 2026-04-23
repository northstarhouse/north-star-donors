'use client'
import { useState, useEffect } from 'react'
import { Lightbulb, Plus, X, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Types ───────────────────────────────────────────────── */
type IdeaStatus = 'Active' | 'Exploring' | 'Completed'

interface Idea {
  id: number
  title: string
  status: IdeaStatus
  submitted_by: string | null
  budget: number | null
  notes: string | null
  blockers: string | null
  gaps: string | null
  updates: string | null
  created_at: string
}

const STATUS_ORDER: IdeaStatus[] = ['Active', 'Exploring', 'Completed']

const STATUS_STYLES: Record<IdeaStatus, string> = {
  Active:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  Exploring: 'bg-amber-100 text-amber-700 border-amber-200',
  Completed: 'bg-stone-100 text-stone-500 border-stone-200',
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const EMPTY_FORM = {
  title: '', status: 'Active' as IdeaStatus, submitted_by: '',
  budget: '', notes: '', blockers: '', gaps: '', updates: '',
}

/* ── Component ───────────────────────────────────────────── */
export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [selected, setSelected] = useState<Idea | null>(null)

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [addSaving, setAddSaving] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Omit<Partial<Idea>, 'budget'> & { budget?: string }>({})
  const [editSaving, setEditSaving] = useState(false)

  /* ── Load ─────────────────────────────────────────────── */
  useEffect(() => {
    supabase.from('Ideas').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setIdeas((data as Idea[]) ?? []))
  }, [])

  /* ── Actions ─────────────────────────────────────────── */
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.title) return
    setAddSaving(true)
    const { data } = await supabase.from('Ideas').insert({
      title: addForm.title.trim(),
      status: addForm.status,
      submitted_by: addForm.submitted_by.trim() || null,
      budget: addForm.budget ? parseFloat(addForm.budget) : null,
      notes: addForm.notes.trim() || null,
      blockers: addForm.blockers.trim() || null,
      gaps: addForm.gaps.trim() || null,
      updates: addForm.updates.trim() || null,
    }).select().single()
    if (data) {
      setIdeas(prev => [data as Idea, ...(prev ?? [])])
      setSelected(data as Idea)
    }
    setAddForm(EMPTY_FORM)
    setShowAdd(false)
    setAddSaving(false)
  }

  async function saveEdit() {
    if (!selected) return
    setEditSaving(true)
    const payload = {
      title: editForm.title,
      status: editForm.status,
      submitted_by: editForm.submitted_by || null,
      budget: editForm.budget ? parseFloat(String(editForm.budget)) : null,
      notes: editForm.notes || null,
      blockers: editForm.blockers || null,
      gaps: editForm.gaps || null,
      updates: editForm.updates || null,
    }
    const { data } = await supabase.from('Ideas').update(payload).eq('id', selected.id).select().single()
    if (data) {
      const updated = data as Idea
      setSelected(updated)
      setIdeas(prev => prev?.map(i => i.id === selected.id ? updated : i) ?? null)
    }
    setEditing(false)
    setEditSaving(false)
  }

  async function updateStatus(idea: Idea, status: IdeaStatus) {
    await supabase.from('Ideas').update({ status }).eq('id', idea.id)
    const updated = { ...idea, status }
    setIdeas(prev => prev?.map(i => i.id === idea.id ? updated : i) ?? null)
    setSelected(prev => prev?.id === idea.id ? updated : prev)
  }

  async function deleteIdea(id: number) {
    if (!confirm('Delete this idea?')) return
    await supabase.from('Ideas').delete().eq('id', id)
    setIdeas(prev => prev?.filter(i => i.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  /* ── Derived ─────────────────────────────────────────── */
  const grouped = STATUS_ORDER.map(status => ({
    status,
    items: (ideas ?? []).filter(i => i.status === status),
  })).filter(g => g.items.length > 0)

  const totalActive = (ideas ?? []).filter(i => i.status === 'Active').length

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="ideas" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start justify-between mb-6 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Lightbulb size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Ideas &amp; Initiatives
              </h1>
            </div>
            <button onClick={() => { setAddForm(EMPTY_FORM); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm flex-shrink-0" style={goldBtn}>
              <Plus size={15} /> Add Idea
            </button>
          </div>

          {/* Stats */}
          {ideas !== null && (
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-white rounded-xl border border-stone-200 px-4 py-2.5 shadow-sm flex items-center gap-3">
                <span className="text-xs text-stone-400">Active</span>
                <span className="text-sm font-semibold text-stone-800">{totalActive}</span>
                <span className="w-px h-4 bg-stone-200" />
                <span className="text-xs text-stone-400">Total</span>
                <span className="text-sm font-semibold text-stone-800">{ideas.length}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex-1">
          {/* Add form */}
          {showAdd && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">New Idea / Initiative</h3>
              <form onSubmit={submitAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-stone-400 mb-1 block">Title *</label>
                    <input required className={inputCls} placeholder="What's the idea?"
                      value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Status</label>
                    <select className={inputCls} value={addForm.status} onChange={e => setAddForm(f => ({ ...f, status: e.target.value as IdeaStatus }))}>
                      {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Submitted By</label>
                    <input className={inputCls} placeholder="Your name"
                      value={addForm.submitted_by} onChange={e => setAddForm(f => ({ ...f, submitted_by: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Budget Estimate</label>
                    <input type="number" className={inputCls} placeholder="0"
                      value={addForm.budget} onChange={e => setAddForm(f => ({ ...f, budget: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Notes</label>
                  <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Description or background…"
                    value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Blockers</label>
                    <textarea className={inputCls + ' resize-none'} rows={2} placeholder="What's in the way?"
                      value={addForm.blockers} onChange={e => setAddForm(f => ({ ...f, blockers: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Gaps</label>
                    <textarea className={inputCls + ' resize-none'} rows={2} placeholder="What's missing?"
                      value={addForm.gaps} onChange={e => setAddForm(f => ({ ...f, gaps: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Updates</label>
                  <textarea className={inputCls + ' resize-none'} rows={2} placeholder="Latest progress…"
                    value={addForm.updates} onChange={e => setAddForm(f => ({ ...f, updates: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addSaving || !addForm.title}
                    className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                    {addSaving ? 'Saving…' : 'Add Idea'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Content */}
          {ideas === null ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading…</div>
          ) : (
            <div className={`grid gap-5 ${selected ? 'grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
              {/* Grouped list */}
              <div className="space-y-4 min-w-0">
                {ideas.length === 0 && (
                  <div className="text-center py-16 text-stone-400 text-sm">No ideas yet. Add one above.</div>
                )}
                {grouped.map(({ status, items }) => (
                  <div key={status} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                    {/* Status header */}
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-stone-100">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}>{status}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500">{items.length}</span>
                    </div>
                    <div>
                      {items.map(idea => {
                        const isSelected = selected?.id === idea.id
                        return (
                          <button key={idea.id}
                            onClick={() => { setSelected(prev => prev?.id === idea.id ? null : idea); setEditing(false) }}
                            className={`w-full text-left px-5 py-3.5 border-b border-stone-50 last:border-0 transition-colors ${isSelected ? 'bg-amber-50/80' : 'hover:bg-stone-50'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-stone-800">{idea.title}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {idea.submitted_by && <p className="text-xs text-stone-400">{idea.submitted_by}</p>}
                                  {idea.budget != null && (
                                    <p className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{fmt(idea.budget)}</p>
                                  )}
                                </div>
                                {idea.updates && (
                                  <p className="text-xs text-stone-400 mt-1 line-clamp-1">{idea.updates}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail panel */}
              {selected ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 self-start sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0 pr-3">
                      <h2 className="font-bold text-stone-800 text-base leading-snug">{selected.title}</h2>
                      {selected.submitted_by && (
                        <p className="text-xs text-stone-400 mt-1">Submitted by {selected.submitted_by}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        value={selected.status}
                        onChange={e => updateStatus(selected, e.target.value as IdeaStatus)}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => { setEditForm({ ...selected, budget: selected.budget != null ? String(selected.budget) : '' }); setEditing(true) }}
                        className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => deleteIdea(selected.id)}
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
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Edit</p>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
                        <input className={inputCls} value={editForm.title ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Status</label>
                          <select className={inputCls} value={editForm.status ?? 'Active'}
                            onChange={e => setEditForm(f => ({ ...f, status: e.target.value as IdeaStatus }))}>
                            {STATUS_ORDER.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Submitted By</label>
                          <input className={inputCls} value={editForm.submitted_by ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, submitted_by: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Budget</label>
                          <input type="number" className={inputCls} value={editForm.budget ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, budget: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                        <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.notes ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Blockers</label>
                          <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.blockers ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, blockers: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Gaps</label>
                          <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.gaps ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, gaps: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Updates</label>
                        <textarea className={inputCls + ' resize-none'} rows={3} value={editForm.updates ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, updates: e.target.value }))} />
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
                    <div className="space-y-4">
                      {selected.budget != null && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Budget Estimate</p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>{fmt(selected.budget)}</p>
                        </div>
                      )}
                      {selected.notes && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
                        </div>
                      )}
                      {selected.updates && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Updates</p>
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.updates}</p>
                        </div>
                      )}
                      {selected.blockers && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Blockers</p>
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.blockers}</p>
                        </div>
                      )}
                      {selected.gaps && (
                        <div>
                          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Gaps</p>
                          <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.gaps}</p>
                        </div>
                      )}
                      {!selected.budget && !selected.notes && !selected.updates && !selected.blockers && !selected.gaps && (
                        <p className="text-xs text-stone-300 italic">No details yet. Click Edit to add more.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
