'use client'
import { useState, useEffect } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, ChevronDown, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'
import Sidebar from '@/components/Sidebar'
import MentionTextarea, { MentionItem } from '@/components/MentionTextarea'

import { OutreachEntry, OutreachStatus } from '@/lib/types'

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

const EMPTY_FORM = { area: '', title: '', contact: '', linked_donor_id: null as string | null, date: '', status: 'planned' as OutreachStatus, notes: '', submitted_by: '' }

const BOARD_ROW1 = ['Grants', 'Marketing', 'Sponsorships', 'Partnerships'] as const
const BOARD_ROW2 = ['Creative', 'Community', 'Other'] as const
const BOARD_AREAS = [...BOARD_ROW1, ...BOARD_ROW2] as const

const BOARD_MONTHS = [
  { label: 'May',  value: '2026-05' },
  { label: 'Jun',  value: '2026-06' },
  { label: 'Jul',  value: '2026-07' },
  { label: 'Aug',  value: '2026-08' },
  { label: 'Sep',  value: '2026-09' },
  { label: 'Oct',  value: '2026-10' },
  { label: 'Nov',  value: '2026-11' },
  { label: 'Dec',  value: '2026-12' },
]

interface OutreachComment {
  id: string; entry_id: string; author: string; content: string; created_at: string
}
const TEAM_MEMBERS = ['Kaelen', 'Haley', 'Derek']
const AUTHOR_COLORS: Record<string, string> = { Kaelen: '#886c44', Haley: '#5a7a8a', Derek: '#6b7c5a' }
function fmtRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function OutreachPage() {
  const [contacts, setContacts] = useState<MentionItem[]>([])
  const [entries, setEntries] = useState<OutreachEntry[] | null>(null)
  const [selected, setSelected] = useState<OutreachEntry | null>(null)
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM)
  const [addSaving, setAddSaving] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<OutreachEntry>>({})
  const [editSaving, setEditSaving] = useState(false)

  const [boardMonth, setBoardMonth] = useState<string>('2026-05')
  const [boardEntries, setBoardEntries] = useState<{ id: number; area: string; title: string; status: OutreachStatus; date: string | null; logged_to_outreach: boolean }[]>([])
  const [boardQuickAdd, setBoardQuickAdd] = useState<string | null>(null)
  const [quickForm, setQuickForm] = useState({ title: '', status: 'planned' as OutreachStatus, date: '' })
  const [quickSaving, setQuickSaving] = useState(false)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<OutreachStatus | 'all'>('all')
  const [comments, setComments] = useState<OutreachComment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState(TEAM_MEMBERS[0])
  const [savingComment, setSavingComment] = useState(false)
  const [loggingEntry, setLoggingEntry] = useState<number | null>(null)
  const [logForm, setLogForm] = useState({ contact: '', notes: '', submitted_by: '' })
  const [logSaving, setLogSaving] = useState(false)

  /* â”€â”€ Load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    const cached = cacheRead<OutreachEntry[]>('outreach')
    if (cached) setEntries(cached)
    supabase.from('outreach_entries').select('*').order('area').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) { setEntries(data as OutreachEntry[]); cacheWrite('outreach', data, TTL_SHORT) } })
    supabase.from('outreach_board').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setBoardEntries(data as typeof boardEntries) })
    supabase.from('outreach_comments').select('entry_id')
      .then(({ data }) => {
        const counts: Record<string, number> = {}
        for (const row of (data ?? []) as { entry_id: string }[]) counts[row.entry_id] = (counts[row.entry_id] ?? 0) + 1
        setCommentCounts(counts)
      })

    Promise.all([
      supabase.from('donors').select('id, formal_name').order('formal_name'),
      supabase.from('data_honeybook_leads').select('id, full_name').not('full_name', 'is', null),
    ]).then(([donors, sponsors]) => {
      const donorItems = (donors.data ?? []).map((d: { id: string; formal_name: string }) => ({
        id: d.id, name: d.formal_name, type: 'donor' as const,
      }))
      const seen = new Set<string>()
      const sponsorItems = (sponsors.data ?? [])
        .filter((s: { id: string | number; full_name: string }) => s.full_name && !seen.has(s.full_name) && seen.add(s.full_name))
        .map((s: { id: string | number; full_name: string }) => ({
          id: String(s.id), name: s.full_name, type: 'sponsor' as const,
        }))
      setContacts([...donorItems, ...sponsorItems])
    })
  }, [])

  useEffect(() => {
    if (!selected) { setComments([]); setCommentsLoaded(false); return }
    setCommentsLoaded(false)
    supabase.from('outreach_comments').select('*').eq('entry_id', selected.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => { setComments((data as OutreachComment[]) ?? []); setCommentsLoaded(true) })
  }, [selected?.id])

  /* â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm.area || !addForm.title) return
    setAddSaving(true)
    const { data } = await supabase.from('outreach_entries').insert({
      area: addForm.area.trim(), title: addForm.title.trim(),
      contact: addForm.contact.trim() || null,
      linked_donor_id: addForm.linked_donor_id || null,
      date: addForm.date || null,
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

  async function addComment() {
    if (!newComment.trim() || !selected) return
    setSavingComment(true)
    const { data } = await supabase.from('outreach_comments')
      .insert({ entry_id: selected.id, author: commentAuthor, content: newComment.trim() })
      .select().single()
    if (data) {
      setComments(prev => [...prev, data as OutreachComment])
      setCommentCounts(prev => ({ ...prev, [selected.id]: (prev[selected.id] ?? 0) + 1 }))
    }
    setNewComment('')
    setSavingComment(false)
  }

  function toggleArea(area: string) {
    setCollapsedAreas(prev => {
      const next = new Set(prev)
      next.has(area) ? next.delete(area) : next.add(area)
      return next
    })
  }

  /* â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

  async function submitQuickAdd(area: string) {
    if (!quickForm.title.trim()) return
    setQuickSaving(true)
    const { data } = await supabase.from('outreach_board').insert({
      area, title: quickForm.title.trim(), status: quickForm.status, date: quickForm.date || null,
    }).select().single()
    if (data) setBoardEntries(prev => [data as typeof boardEntries[number], ...prev])
    setQuickForm({ title: '', status: 'planned', date: '' })
    setBoardQuickAdd(null)
    setQuickSaving(false)
  }

  async function logToOutreach(entryId: number) {
    const entry = boardEntries.find(e => e.id === entryId)
    if (!entry) return
    setLogSaving(true)
    const { data } = await supabase.from('outreach_entries').insert({
      area: entry.area,
      title: entry.title,
      contact: logForm.contact.trim() || null,
      date: entry.date,
      status: entry.status,
      notes: logForm.notes.trim() || null,
      submitted_by: logForm.submitted_by.trim() || null,
    }).select().single()
    if (data) {
      // Mark the board entry as logged
      await supabase.from('outreach_board').update({ logged_to_outreach: true }).eq('id', entryId)
      setBoardEntries(prev => prev.map(e => e.id === entryId ? { ...e, logged_to_outreach: true } : e))
      // Add to the outreach entries list
      setEntries(prev => {
        const updated = [...(prev ?? []), data as OutreachEntry]
        return updated.sort((a, b) => a.area.localeCompare(b.area))
      })
    }
    setLogForm({ contact: '', notes: '', submitted_by: '' })
    setLoggingEntry(null)
    setLogSaving(false)
  }

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="flex min-h-screen flex-1">
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
                    <input required list="area-suggestions" className={inputCls} placeholder="e.g. Donors, Media, Community..."
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
                    <label className="text-xs text-stone-400 mb-1 block">Contact <span className="text-stone-300">— type @ to search donors & sponsors</span></label>
                    <MentionTextarea
                      singleLine
                      items={contacts}
                      className={inputCls}
                      placeholder="Person or organization"
                      value={addForm.contact}
                      onChange={val => setAddForm(f => ({ ...f, contact: val, linked_donor_id: null }))}
                      onMentionSelect={item => setAddForm(f => ({ ...f, linked_donor_id: item?.id ?? null }))}
                    />
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
                  <MentionTextarea
                    items={contacts}
                    className={inputCls + ' resize-none'}
                    rows={2}
                    value={addForm.notes}
                    onChange={val => setAddForm(f => ({ ...f, notes: val }))}
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addSaving || !addForm.area || !addForm.title}
                    className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                    {addSaving ? 'Saving...' : 'Add Entry'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Board view */}
          {entries !== null && (
            <div>
              {/* Month tabs */}
              <div className="flex items-center gap-1 mb-4">
                <button onClick={() => setBoardMonth('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!boardMonth ? 'text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-700'}`}
                  style={!boardMonth ? { background: 'var(--gold)' } : {}}>
                  All
                </button>
                {BOARD_MONTHS.map(m => (
                  <button key={m.value} onClick={() => setBoardMonth(m.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${boardMonth === m.value ? 'text-white' : 'bg-white border border-stone-200 text-stone-500 hover:text-stone-700'}`}
                    style={boardMonth === m.value ? { background: 'var(--gold)' } : {}}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Table — row 1 (4 cols) */}
              <div className="overflow-x-auto pb-3">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_ROW1.length}, minmax(180px, 1fr))`, gap: 0, border: '1px solid #e7e0d6', borderRadius: 12, overflow: 'hidden', background: '#fff', minWidth: 600 }}>
                  {/* Header row */}
                  {BOARD_ROW1.map((area, i) => {
                    const count = boardEntries.filter(e => {
                      const matchArea = e.area.toLowerCase() === area.toLowerCase()
                      const matchMonth = !boardMonth || (e.date ?? '').startsWith(boardMonth)
                      return matchArea && matchMonth
                    }).length
                    return (
                      <div key={area} style={{
                        padding: '11px 14px',
                        borderRight: i < BOARD_ROW1.length - 1 ? '1px solid #e7e0d6' : 'none',
                        borderBottom: '1px solid #e7e0d6',
                        background: '#faf8f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 13, color: '#5a4a35' }}>
                          {area}
                          {count > 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#b5a185', fontFamily: 'sans-serif' }}>{count}</span>}
                        </span>
                        <button onClick={() => { setBoardQuickAdd(boardQuickAdd === area ? null : area); setQuickForm({ title: '', status: 'planned', date: boardMonth ? boardMonth + '-01' : '' }) }}
                          style={{ fontSize: 16, color: '#c4b49a', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>
                          +
                        </button>
                      </div>
                    )
                  })}
                  {/* Content row */}
                  {BOARD_ROW1.map((area, i) => {
                    const col = boardEntries.filter(e => {
                      const matchArea = e.area.toLowerCase() === area.toLowerCase()
                      const matchMonth = !boardMonth || (e.date ?? '').startsWith(boardMonth)
                      return matchArea && matchMonth
                    })
                    const isAdding = boardQuickAdd === area
                    return (
                      <div key={area} style={{
                        borderRight: i < BOARD_ROW1.length - 1 ? '1px solid #e7e0d6' : 'none',
                        padding: '10px',
                        minHeight: 160,
                        verticalAlign: 'top',
                      }}>
                        {/* Quick-add form */}
                        {isAdding && (
                          <div style={{ marginBottom: 8, background: '#fdf8f2', border: '1px solid #e7dccf', borderRadius: 8, padding: '8px' }}>
                            <input autoFocus placeholder="Entry title…"
                              value={quickForm.title} onChange={e => setQuickForm(f => ({ ...f, title: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') submitQuickAdd(area); if (e.key === 'Escape') setBoardQuickAdd(null) }}
                              style={{ width: '100%', border: '1px solid #e0d8cc', borderRadius: 6, padding: '5px 8px', fontSize: 12, marginBottom: 5, outline: 'none', boxSizing: 'border-box' as const }} />
                            <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                              <select value={quickForm.status} onChange={e => setQuickForm(f => ({ ...f, status: e.target.value as OutreachStatus }))}
                                style={{ flex: 1, border: '1px solid #e0d8cc', borderRadius: 6, padding: '4px 6px', fontSize: 11, outline: 'none' }}>
                                {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                              </select>
                              <input type="date" value={quickForm.date} onChange={e => setQuickForm(f => ({ ...f, date: e.target.value }))}
                                style={{ flex: 1, border: '1px solid #e0d8cc', borderRadius: 6, padding: '4px 6px', fontSize: 11, outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => submitQuickAdd(area)} disabled={!quickForm.title.trim() || quickSaving}
                                style={{ flex: 1, padding: '4px', background: '#b5a185', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: !quickForm.title.trim() ? 0.4 : 1 }}>
                                {quickSaving ? '…' : 'Add'}
                              </button>
                              <button onClick={() => setBoardQuickAdd(null)}
                                style={{ padding: '4px 8px', background: '#f5f0ea', color: '#888', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
                                ✕
                              </button>
                            </div>
                          </div>
                        )}
                        {col.length === 0 && !isAdding ? (
                          <p style={{ fontSize: 11, color: '#d1c9be', textAlign: 'center', paddingTop: 20 }}>—</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {col.map(entry => (
                              <div key={entry.id} style={{
                                background: entry.logged_to_outreach ? '#d1fae5' : selected?.id === entry.id ? '#fdf6ec' : '#faf8f5',
                                border: `1px solid ${selected?.id === entry.id ? '#e0c98a' : '#ede8e0'}`,
                                borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <input
                                    type="checkbox"
                                    checked={entry.logged_to_outreach}
                                    onChange={async (e) => {
                                      if (e.target.checked) {
                                        setLoggingEntry(entry.id)
                                        setLogForm({ contact: '', notes: '', submitted_by: '' })
                                      } else {
                                        // Unlog if unchecked
                                        await supabase.from('outreach_board').update({ logged_to_outreach: false }).eq('id', entry.id)
                                        setBoardEntries(prev => prev.map(e => e.id === entry.id ? { ...e, logged_to_outreach: false } : e))
                                        // Remove from outreach entries if it exists
                                        const outreachEntry = entries?.find(e => e.title === entry.title && e.area === entry.area)
                                        if (outreachEntry) {
                                          await supabase.from('outreach_entries').delete().eq('id', outreachEntry.id)
                                          setEntries(prev => prev?.filter(e => e.id !== outreachEntry.id) ?? null)
                                        }
                                      }
                                    }}
                                    style={{ marginTop: 2, flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#3a3228', lineHeight: 1.3, marginBottom: 4 }}>{entry.title}</p>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                                      background: STATUS_STYLES[entry.status].includes('amber') ? '#fef3c7' : STATUS_STYLES[entry.status].includes('emerald') ? '#d1fae5' : STATUS_STYLES[entry.status].includes('red') ? '#fee2e2' : STATUS_STYLES[entry.status].includes('blue') ? '#dbeafe' : '#f5f5f4',
                                      color: STATUS_STYLES[entry.status].includes('amber') ? '#92400e' : STATUS_STYLES[entry.status].includes('emerald') ? '#065f46' : STATUS_STYLES[entry.status].includes('red') ? '#991b1b' : STATUS_STYLES[entry.status].includes('blue') ? '#1e40af' : '#57534e',
                                    }}>
                                      {STATUS_LABELS[entry.status]}
                                    </span>
                                  </div>
                                </div>
                                {loggingEntry === entry.id && (
                                  <div style={{ marginTop: 8, background: '#f0f9f0', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>Log to Outreach</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <input
                                        placeholder="Contact person/org"
                                        value={logForm.contact}
                                        onChange={e => setLogForm(f => ({ ...f, contact: e.target.value }))}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none' }}
                                      />
                                      <textarea
                                        placeholder="Additional notes..."
                                        value={logForm.notes}
                                        onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={2}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none', resize: 'none' }}
                                      />
                                      <input
                                        placeholder="Submitted by"
                                        value={logForm.submitted_by}
                                        onChange={e => setLogForm(f => ({ ...f, submitted_by: e.target.value }))}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none' }}
                                      />
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                          onClick={() => logToOutreach(entry.id)}
                                          disabled={logSaving}
                                          style={{ flex: 1, padding: '4px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: logSaving ? 0.6 : 1 }}
                                        >
                                          {logSaving ? 'Saving...' : 'Log Entry'}
                                        </button>
                                        <button
                                          onClick={() => setLoggingEntry(null)}
                                          style={{ padding: '4px 8px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Table — row 2 (3 cols) */}
              <div className="overflow-x-auto pb-4">
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_ROW2.length}, minmax(180px, 1fr))`, gap: 0, border: '1px solid #e7e0d6', borderRadius: 12, overflow: 'hidden', background: '#fff', minWidth: 400 }}>
                  {BOARD_ROW2.map((area, i) => {
                    const count = boardEntries.filter(e => {
                      const matchArea = e.area.toLowerCase() === area.toLowerCase()
                      const matchMonth = !boardMonth || (e.date ?? '').startsWith(boardMonth)
                      return matchArea && matchMonth
                    }).length
                    return (
                      <div key={area} style={{
                        padding: '11px 14px',
                        borderRight: i < BOARD_ROW2.length - 1 ? '1px solid #e7e0d6' : 'none',
                        borderBottom: '1px solid #e7e0d6',
                        background: '#faf8f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 13, color: '#5a4a35' }}>
                          {area}
                          {count > 0 && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, color: '#b5a185', fontFamily: 'sans-serif' }}>{count}</span>}
                        </span>
                        <button onClick={() => { setBoardQuickAdd(boardQuickAdd === area ? null : area); setQuickForm({ title: '', status: 'planned', date: boardMonth ? boardMonth + '-01' : '' }) }}
                          style={{ fontSize: 16, color: '#c4b49a', lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}>+</button>
                      </div>
                    )
                  })}
                  {BOARD_ROW2.map((area, i) => {
                    const col = boardEntries.filter(e => {
                      const matchArea = e.area.toLowerCase() === area.toLowerCase()
                      const matchMonth = !boardMonth || (e.date ?? '').startsWith(boardMonth)
                      return matchArea && matchMonth
                    })
                    const isAdding = boardQuickAdd === area
                    return (
                      <div key={area} style={{
                        borderRight: i < BOARD_ROW2.length - 1 ? '1px solid #e7e0d6' : 'none',
                        padding: '10px', minHeight: 160, verticalAlign: 'top',
                      }}>
                        {isAdding && (
                          <div style={{ marginBottom: 8, background: '#fdf8f2', border: '1px solid #e7dccf', borderRadius: 8, padding: '8px' }}>
                            <input autoFocus placeholder="Entry title…" value={quickForm.title} onChange={e => setQuickForm(f => ({ ...f, title: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') submitQuickAdd(area); if (e.key === 'Escape') setBoardQuickAdd(null) }}
                              style={{ width: '100%', border: '1px solid #e0d8cc', borderRadius: 6, padding: '5px 8px', fontSize: 12, marginBottom: 5, outline: 'none', boxSizing: 'border-box' as const }} />
                            <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                              <select value={quickForm.status} onChange={e => setQuickForm(f => ({ ...f, status: e.target.value as OutreachStatus }))}
                                style={{ flex: 1, border: '1px solid #e0d8cc', borderRadius: 6, padding: '4px 6px', fontSize: 11, outline: 'none' }}>
                                {(Object.keys(STATUS_LABELS) as OutreachStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                              </select>
                              <input type="date" value={quickForm.date} onChange={e => setQuickForm(f => ({ ...f, date: e.target.value }))}
                                style={{ flex: 1, border: '1px solid #e0d8cc', borderRadius: 6, padding: '4px 6px', fontSize: 11, outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => submitQuickAdd(area)} disabled={!quickForm.title.trim() || quickSaving}
                                style={{ flex: 1, padding: '4px', background: '#b5a185', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: !quickForm.title.trim() ? 0.4 : 1 }}>
                                {quickSaving ? '…' : 'Add'}
                              </button>
                              <button onClick={() => setBoardQuickAdd(null)}
                                style={{ padding: '4px 8px', background: '#f5f0ea', color: '#888', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                        )}
                        {col.length === 0 && !isAdding ? (
                          <p style={{ fontSize: 11, color: '#d1c9be', textAlign: 'center', paddingTop: 20 }}>—</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {col.map(entry => (
                              <div key={entry.id} style={{
                                background: entry.logged_to_outreach ? '#d1fae5' : selected?.id === entry.id ? '#fdf6ec' : '#faf8f5',
                                border: `1px solid ${selected?.id === entry.id ? '#e0c98a' : '#ede8e0'}`,
                                borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
                              }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                  <input
                                    type="checkbox"
                                    checked={entry.logged_to_outreach}
                                    onChange={async (e) => {
                                      if (e.target.checked) {
                                        setLoggingEntry(entry.id)
                                        setLogForm({ contact: '', notes: '', submitted_by: '' })
                                      } else {
                                        // Unlog if unchecked
                                        await supabase.from('outreach_board').update({ logged_to_outreach: false }).eq('id', entry.id)
                                        setBoardEntries(prev => prev.map(e => e.id === entry.id ? { ...e, logged_to_outreach: false } : e))
                                        // Remove from outreach entries if it exists
                                        const outreachEntry = entries?.find(e => e.title === entry.title && e.area === entry.area)
                                        if (outreachEntry) {
                                          await supabase.from('outreach_entries').delete().eq('id', outreachEntry.id)
                                          setEntries(prev => prev?.filter(e => e.id !== outreachEntry.id) ?? null)
                                        }
                                      }
                                    }}
                                    style={{ marginTop: 2, flexShrink: 0 }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 12, fontWeight: 500, color: '#3a3228', lineHeight: 1.3, marginBottom: 4 }}>{entry.title}</p>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                                      background: STATUS_STYLES[entry.status].includes('amber') ? '#fef3c7' : STATUS_STYLES[entry.status].includes('emerald') ? '#d1fae5' : STATUS_STYLES[entry.status].includes('red') ? '#fee2e2' : STATUS_STYLES[entry.status].includes('blue') ? '#dbeafe' : '#f5f5f4',
                                      color: STATUS_STYLES[entry.status].includes('amber') ? '#92400e' : STATUS_STYLES[entry.status].includes('emerald') ? '#065f46' : STATUS_STYLES[entry.status].includes('red') ? '#991b1b' : STATUS_STYLES[entry.status].includes('blue') ? '#1e40af' : '#57534e',
                                    }}>
                                      {STATUS_LABELS[entry.status]}
                                    </span>
                                  </div>
                                </div>
                                {loggingEntry === entry.id && (
                                  <div style={{ marginTop: 8, background: '#f0f9f0', border: '1px solid #d1fae5', borderRadius: 6, padding: '8px' }}>
                                    <p style={{ fontSize: 11, fontWeight: 600, color: '#065f46', marginBottom: 6 }}>Log to Outreach</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <input
                                        placeholder="Contact person/org"
                                        value={logForm.contact}
                                        onChange={e => setLogForm(f => ({ ...f, contact: e.target.value }))}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none' }}
                                      />
                                      <textarea
                                        placeholder="Additional notes..."
                                        value={logForm.notes}
                                        onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))}
                                        rows={2}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none', resize: 'none' }}
                                      />
                                      <input
                                        placeholder="Submitted by"
                                        value={logForm.submitted_by}
                                        onChange={e => setLogForm(f => ({ ...f, submitted_by: e.target.value }))}
                                        style={{ width: '100%', border: '1px solid #a7f3d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none' }}
                                      />
                                      <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                          onClick={() => logToOutreach(entry.id)}
                                          disabled={logSaving}
                                          style={{ flex: 1, padding: '4px', background: '#059669', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: logSaving ? 0.6 : 1 }}
                                        >
                                          {logSaving ? 'Saving...' : 'Log Entry'}
                                        </button>
                                        <button
                                          onClick={() => setLoggingEntry(null)}
                                          style={{ padding: '4px 8px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Outreach log — always visible */}
          {entries === null ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
          ) : (
            <div className={`grid gap-5 mt-6 ${selected ? 'grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
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
                                    {(commentCounts[entry.id] ?? 0) > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">
                                        <MessageSquare size={9} /> {commentCounts[entry.id]}
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
                          <MentionTextarea
                            singleLine
                            items={contacts}
                            className={inputCls}
                            value={editForm.contact ?? ''}
                            onChange={val => setEditForm(f => ({ ...f, contact: val, linked_donor_id: null }))}
                            onMentionSelect={item => setEditForm(f => ({ ...f, linked_donor_id: item?.id ?? null }))}
                          />
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
                        <MentionTextarea
                          items={contacts}
                          className={inputCls + ' resize-none'}
                          rows={3}
                          value={editForm.notes ?? ''}
                          onChange={val => setEditForm(f => ({ ...f, notes: val }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={editSaving}
                          className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium" style={goldBtn}>
                          {editSaving ? 'Saving...' : 'Save'}
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

                  {/* Comments */}
                  <div className="border-t border-stone-100 pt-4 mt-4 space-y-3">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Comments</p>
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: AUTHOR_COLORS[c.author] ?? 'var(--gold)' }}>
                          {c.author[0]}
                        </div>
                        <div className="flex-1 bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-semibold text-stone-700">{c.author}</span>
                            <span className="text-[10px] text-stone-400">{fmtRelative(c.created_at)}</span>
                          </div>
                          <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    {commentsLoaded && comments.length === 0 && (
                      <p className="text-[11px] text-stone-300 italic">No comments yet.</p>
                    )}
                    <div className="flex gap-2 items-start pt-1">
                      <select value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
                        className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600 flex-shrink-0">
                        {TEAM_MEMBERS.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <div className="flex-1">
                        <textarea
                          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 bg-stone-50"
                          rows={2} placeholder="Leave a comment..."
                          value={newComment} onChange={e => setNewComment(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                        />
                        <div className="flex justify-end mt-1">
                          <button onClick={addComment} disabled={!newComment.trim() || savingComment}
                            className="px-3 py-1 text-white text-xs rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                            {savingComment ? 'Posting…' : 'Comment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
