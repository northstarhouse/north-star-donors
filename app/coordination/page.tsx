'use client'
import { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, MessageSquare } from 'lucide-react'

function CoordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="4"  r="2" />
      <circle cx="19" cy="16" r="2" />
      <circle cx="5"  cy="16" r="2" />
    </svg>
  )
}
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Types ───────────────────────────────────────────────── */
type CoordStatus = 'open' | 'in_progress' | 'resolved'

interface CoordItem {
  id: string
  area: string
  need: string
  suggested_actions: string | null
  status: CoordStatus
  created_at: string
}

interface CoordComment {
  id: string
  item_id: string
  body: string
  author: string | null
  feasibility: string | null
  created_at: string
}

const STATUS_STYLES: Record<CoordStatus, string> = {
  open:        'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const STATUS_LABELS: Record<CoordStatus, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved',
}

const FEASIBILITY_STYLES: Record<string, string> = {
  'Do-able':          'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Not feasible':     'bg-red-100 text-red-600 border-red-200',
  'Needs discussion': 'bg-amber-100 text-amber-700 border-amber-200',
  'In progress':      'bg-blue-100 text-blue-700 border-blue-200',
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }

/* ── Component ───────────────────────────────────────────── */
export default function CoordinationPage() {
  const [items, setItems] = useState<CoordItem[] | null>(null)
  const [selected, setSelected] = useState<CoordItem | null>(null)
  const [comments, setComments] = useState<CoordComment[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ area: '', need: '', suggested_actions: '' })
  const [addSaving, setAddSaving] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CoordItem>>({})
  const [editSaving, setEditSaving] = useState(false)

  const [commentBody, setCommentBody] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentFeasibility, setCommentFeasibility] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  const [filterStatus, setFilterStatus] = useState<CoordStatus | 'all'>('all')

  /* ── Load ────────────────────────────────────────────────── */
  useEffect(() => {
    supabase.from('coordination_items').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data as CoordItem[]) })
  }, [])

  useEffect(() => {
    if (!selected) { setComments([]); return }
    supabase.from('coordination_comments').select('*').eq('item_id', selected.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setComments(data as CoordComment[]) })
  }, [selected])

  /* ── Actions ─────────────────────────────────────────────── */
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.area || !addForm.need) return
    setAddSaving(true)
    const { data } = await supabase.from('coordination_items').insert({
      area: addForm.area, need: addForm.need,
      suggested_actions: addForm.suggested_actions || null, status: 'open',
    }).select().single()
    if (data) {
      setItems(prev => [data as CoordItem, ...(prev ?? [])])
      setSelected(data as CoordItem)
    }
    setAddForm({ area: '', need: '', suggested_actions: '' })
    setShowAdd(false)
    setAddSaving(false)
  }

  async function saveEdit() {
    if (!selected) return
    setEditSaving(true)
    const { data } = await supabase.from('coordination_items').update(editForm).eq('id', selected.id).select().single()
    if (data) {
      const updated = { ...selected, ...editForm } as CoordItem
      setSelected(updated)
      setItems(prev => prev?.map(c => c.id === selected.id ? updated : c) ?? null)
    }
    setEditing(false)
    setEditSaving(false)
  }

  async function updateStatus(item: CoordItem, status: CoordStatus) {
    await supabase.from('coordination_items').update({ status }).eq('id', item.id)
    const updated = { ...item, status }
    setItems(prev => prev?.map(c => c.id === item.id ? updated : c) ?? null)
    setSelected(prev => prev?.id === item.id ? updated : prev)
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item and all its comments?')) return
    await supabase.from('coordination_items').delete().eq('id', id)
    setItems(prev => prev?.filter(c => c.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !commentBody.trim()) return
    setCommentSaving(true)
    const payload = { item_id: selected.id, body: commentBody.trim(), author: commentAuthor.trim() || null, feasibility: commentFeasibility || null }
    const { data } = await supabase.from('coordination_comments').insert(payload).select().single()
    if (data) setComments(prev => [...prev, data as CoordComment])
    setCommentBody(''); setCommentAuthor(''); setCommentFeasibility('')
    setCommentSaving(false)
  }

  async function deleteComment(id: string) {
    await supabase.from('coordination_comments').delete().eq('id', id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  /* ── Derived ─────────────────────────────────────────────── */
  const visible = filterStatus === 'all' ? (items ?? []) : (items ?? []).filter(c => c.status === filterStatus)
  const openCount = items?.filter(c => c.status === 'open').length ?? 0
  const inProgressCount = items?.filter(c => c.status === 'in_progress').length ?? 0
  const resolvedCount = items?.filter(c => c.status === 'resolved').length ?? 0

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="coordination" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-start justify-between mb-6 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm text-stone-400">
                <CoordIcon size={16} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Cross-Coordination
              </h1>
            </div>
            <button onClick={() => { setAddForm({ area: '', need: '', suggested_actions: '' }); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
              <Plus size={15} /> Add Item
            </button>
          </div>

          {/* Stats */}
          {items !== null && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard label="Open" value={String(openCount)} color="text-blue-600" />
              <StatCard label="In Progress" value={String(inProgressCount)} color="text-amber-600" />
              <StatCard label="Resolved" value={String(resolvedCount)} color="text-emerald-600" />
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm w-fit">
            {([['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === v ? 'text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                style={filterStatus === v ? goldBtn : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8 flex-1">
          {/* Add form */}
          {showAdd && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 mb-5">
              <h3 className="text-sm font-semibold text-stone-700 mb-3">New Item</h3>
              <form onSubmit={submitAdd} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Area *</label>
                    <input required className={inputCls} placeholder="e.g. Marketing, Finance, Events…"
                      value={addForm.area} onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Need *</label>
                    <input required className={inputCls} placeholder="What is needed?"
                      value={addForm.need} onChange={e => setAddForm(f => ({ ...f, need: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Suggested Actions</label>
                  <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What actions could address this need?"
                    value={addForm.suggested_actions} onChange={e => setAddForm(f => ({ ...f, suggested_actions: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addSaving || !addForm.area || !addForm.need}
                    className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                    {addSaving ? 'Saving…' : 'Add Item'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Two-col layout */}
          {items === null ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading…</div>
          ) : (
            <div className="grid gap-5 grid-cols-[320px_1fr]">
              {/* List */}
              <div className="space-y-2">
                {visible.length === 0 && (
                  <div className="text-center py-16 text-stone-400 text-sm">No items yet.</div>
                )}
                {visible.map(item => {
                  const isSelected = selected?.id === item.id
                  return (
                    <button key={item.id}
                      onClick={() => { setSelected(prev => prev?.id === item.id ? null : item); setEditing(false) }}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${isSelected ? 'border-amber-300 bg-amber-50/80' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{item.area}</p>
                          <p className="text-sm font-medium text-stone-800 leading-snug">{item.need}</p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${STATUS_STYLES[item.status]}`}>
                          {STATUS_LABELS[item.status]}
                        </span>
                      </div>
                      {item.suggested_actions && (
                        <p className="text-xs text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">{item.suggested_actions}</p>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Detail panel */}
              {selected ? (
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 self-start sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{selected.area}</p>
                      <h2 className="font-bold text-stone-800 text-base leading-snug">{selected.need}</h2>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <select
                        className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        value={selected.status}
                        onChange={e => updateStatus(selected, e.target.value as CoordStatus)}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button onClick={() => { setEditForm({ ...selected }); setEditing(true) }}
                        className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1">
                        <Pencil size={11} /> Edit
                      </button>
                      <button onClick={() => deleteItem(selected.id)}
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
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Edit Item</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Area</label>
                          <input className={inputCls} value={editForm.area ?? ''} onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Need</label>
                          <input className={inputCls} value={editForm.need ?? ''} onChange={e => setEditForm(f => ({ ...f, need: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Suggested Actions</label>
                        <textarea className={inputCls + ' resize-none'} rows={3}
                          value={editForm.suggested_actions ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, suggested_actions: e.target.value }))} />
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

                  {/* Suggested actions */}
                  {selected.suggested_actions && !editing && (
                    <div className="border-t border-stone-100 pt-4 mt-1">
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Suggested Actions</p>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.suggested_actions}</p>
                    </div>
                  )}

                  {/* Comments */}
                  <div className="border-t border-stone-100 pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare size={13} className="text-stone-400" />
                      <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Comments</p>
                      {comments.length > 0 && (
                        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{comments.length}</span>
                      )}
                    </div>

                    {comments.length > 0 && (
                      <div className="space-y-3 mb-4">
                        {comments.map(c => (
                          <div key={c.id} className="group bg-stone-50 rounded-lg p-3 relative">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {c.author && <span className="text-xs font-semibold text-stone-700">{c.author}</span>}
                              {c.feasibility && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${FEASIBILITY_STYLES[c.feasibility] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                                  {c.feasibility}
                                </span>
                              )}
                              <span className="text-[10px] text-stone-300 ml-auto">
                                {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{c.body}</p>
                            <button onClick={() => deleteComment(c.id)}
                              className="absolute top-2 right-2 p-1 text-stone-200 hover:text-red-400 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                              <X size={11} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={submitComment} className="space-y-2">
                      <textarea className={inputCls + ' resize-none bg-stone-50'} rows={3} placeholder="Add a comment…"
                        value={commentBody} onChange={e => setCommentBody(e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Your Name</label>
                          <input className={inputCls} placeholder="Optional" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Feasibility</label>
                          <select className={inputCls} value={commentFeasibility} onChange={e => setCommentFeasibility(e.target.value)}>
                            <option value="">— none —</option>
                            <option value="Do-able">Do-able</option>
                            <option value="Not feasible">Not feasible</option>
                            <option value="Needs discussion">Needs discussion</option>
                            <option value="In progress">In progress</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" disabled={commentSaving || !commentBody.trim()}
                        className="w-full py-2 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                        {commentSaving ? 'Posting…' : 'Post Comment'}
                      </button>
                    </form>
                  </div>
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

/* ── Sub-components ──────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 px-5 py-4 shadow-sm">
      <p className="text-xs text-stone-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  )
}
