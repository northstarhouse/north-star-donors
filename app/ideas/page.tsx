'use client'
import { useState, useEffect } from 'react'
import { Lightbulb, Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cacheRead, cacheWrite, TTL_SHORT } from '@/lib/cache'
import Sidebar from '@/components/Sidebar'

/* -- Types --------------------------------------------------- */
type IdeaStatus = 'Exploring' | 'Active' | 'On Hold' | 'Declined' | 'Completed'
type MainTab = 'initiatives' | 'ideas'
type FilterStatus = IdeaStatus | 'All'

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

interface BudgetItem {
  id: number
  area: string
  description: string
  amount: number
  date: string | null
  type: string
  needs_reimbursement: boolean
  receipt_url: string | null
}

/* -- Constants ---------------------------------------------- */
const STATUS_COLORS: Record<IdeaStatus, { bg: string; color: string }> = {
  'Exploring': { bg: '#e3f2fd', color: '#1565c0' },
  'Active':    { bg: '#e8f5e9', color: '#2e7d32' },
  'On Hold':   { bg: '#fff8e1', color: '#f57f17' },
  'Declined':  { bg: '#fce4ec', color: '#c62828' },
  'Completed': { bg: '#f3e5f5', color: '#6a1b9a' },
}

const ALL_STATUSES: IdeaStatus[]          = ['Exploring', 'Active', 'On Hold', 'Declined', 'Completed']
const INITIATIVES_STATUSES: IdeaStatus[]  = ['Active', 'On Hold', 'Completed', 'Declined']
const IDEA_STATUSES: IdeaStatus[]         = ['Exploring']
const INITIATIVE_FILTERS: FilterStatus[]  = ['Active', 'On Hold', 'Completed', 'All']

/* -- Helpers ------------------------------------------------- */
const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white'
const fmtMoney = (n: number) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate  = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const EMPTY_FORM = { title: '', status: 'Exploring' as IdeaStatus, submitted_by: '', notes: '', blockers: '', gaps: '', budget: '', updates: '' }

type EditIdeaForm = Omit<Partial<Idea>, 'budget'> & { budget?: string }

function tabForStatus(s: IdeaStatus): MainTab {
  return INITIATIVES_STATUSES.includes(s) ? 'initiatives' : 'ideas'
}

/* -- Component ----------------------------------------------- */
export default function IdeasPage() {
  const today = new Date().toISOString().slice(0, 10)

  const [ideas, setIdeas]       = useState<Idea[] | null>(null)
  const [selected, setSelected] = useState<Idea | null>(null)
  const [mainTab, setMainTab]   = useState<MainTab>('initiatives')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('Active')

  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ ...EMPTY_FORM })
  const [saving, setSaving]     = useState(false)

  const [editing, setEditing]   = useState(false)
  const [editForm, setEditForm] = useState<EditIdeaForm>({})
  const [editSaving, setEditSaving] = useState(false)

  const [showUpdates, setShowUpdates] = useState(false)

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ description: '', amount: '', date: today, expense_type: 'Purchase' })
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [budgetSaving, setBudgetSaving] = useState(false)

  /* -- Load --------------------------------------------------- */
  useEffect(() => {
    const cached = cacheRead<Idea[]>('ideas')
    if (cached) setIdeas(cached)
    supabase.from('Ideas').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) { setIdeas(data as Idea[]); cacheWrite('ideas', data, TTL_SHORT) } })
  }, [])

  useEffect(() => {
    if (!selected || selected.status !== 'Active') { setBudgetItems([]); return }
    setBudgetLoading(true)
    supabase.from('Op Budget').select('*').eq('area', selected.title)
      .order('date', { ascending: false }).order('id', { ascending: false })
      .then(({ data }) => { setBudgetItems((data as BudgetItem[]) ?? []); setBudgetLoading(false) })
  }, [selected?.id, selected?.status])

  /* -- Helpers ------------------------------------------------ */
  function loadIdeas(then?: (rows: Idea[]) => void) {
    supabase.from('Ideas').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = (data as Idea[]) ?? []
        setIdeas(rows)
        if (then) then(rows)
      })
  }

  function selectIdea(idea: Idea | null) {
    setSelected(prev => (prev?.id === idea?.id ? null : idea))
    setEditing(false)
    setShowUpdates(false)
    setShowBudgetForm(false)
  }

  /* -- Actions ------------------------------------------------ */
  async function addIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setSaving(true)
    const { data } = await supabase.from('Ideas').insert({
      title: form.title.trim(), status: form.status,
      submitted_by: form.submitted_by || null,
      notes: form.notes || null, blockers: form.blockers || null,
      gaps: form.gaps || null, updates: form.updates || null,
      budget: form.budget ? parseFloat(form.budget) : null,
    }).select()
    setSaving(false)
    const newTab = tabForStatus(form.status)
    setMainTab(newTab)
    setFilterStatus(form.status)
    setForm({ ...EMPTY_FORM })
    setShowAdd(false)
    if (data && data[0]) {
      const created = data[0] as Idea
      loadIdeas(rows => {
        const match = rows.find(r => r.id === created.id)
        if (match) selectIdea(match)
      })
    }
  }

  async function saveEdit() {
    if (!selected) return
    setEditSaving(true)
    const { data } = await supabase.from('Ideas').update({
      title: editForm.title, status: editForm.status,
      submitted_by: editForm.submitted_by || null,
      budget: editForm.budget ? parseFloat(String(editForm.budget)) : null,
      notes: editForm.notes || null, blockers: editForm.blockers || null,
      gaps: editForm.gaps || null,   updates: editForm.updates || null,
    }).eq('id', selected.id).select().single()
    if (data) {
      const updated = data as Idea
      setSelected(updated)
      setIdeas(prev => prev?.map(i => i.id === selected.id ? updated : i) ?? null)
      setMainTab(tabForStatus(updated.status))
      setFilterStatus('All')
    }
    setEditing(false)
    setEditSaving(false)
  }

  async function deleteIdea(id: number) {
    if (!confirm('Delete this idea?')) return
    await supabase.from('Ideas').delete().eq('id', id)
    setIdeas(prev => prev?.filter(i => i.id !== id) ?? null)
    if (selected?.id === id) setSelected(null)
  }

  async function submitBudget(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || !budgetForm.description || !budgetForm.amount || !budgetForm.date) return
    setBudgetSaving(true)
    const isInKind = budgetForm.expense_type === 'In-Kind'
    const needsReimb = budgetForm.expense_type === 'Reimbursement'
    const { data } = await supabase.from('Op Budget').insert({
      area: selected.title,
      description: budgetForm.description.trim(),
      amount: parseFloat(budgetForm.amount),
      date: budgetForm.date,
      type: isInKind ? 'In-Kind' : 'Purchase',
      needs_reimbursement: needsReimb,
    }).select().single()
    if (data) setBudgetItems(prev => [data as BudgetItem, ...prev])
    setBudgetForm({ description: '', amount: '', date: today, expense_type: 'Purchase' })
    setShowBudgetForm(false)
    setBudgetSaving(false)
  }

  async function deleteBudgetItem(id: number) {
    await supabase.from('Op Budget').delete().eq('id', id)
    setBudgetItems(prev => prev.filter(b => b.id !== id))
  }

  /* -- Derived ------------------------------------------------ */
  const allIdeas    = ideas ?? []
  const tabStatuses = mainTab === 'initiatives' ? INITIATIVES_STATUSES : IDEA_STATUSES
  const filtered    = allIdeas.filter(i =>
    tabStatuses.includes(i.status) && (filterStatus === 'All' || i.status === filterStatus)
  )
  const budgetTotal = budgetItems.reduce((s, b) => s + (b.amount || 0), 0)
  const budgetEst   = selected?.budget ? parseFloat(String(selected.budget)) : null
  const remaining   = budgetEst !== null ? budgetEst - budgetTotal : null

  /* -- Render ------------------------------------------------- */
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="ideas" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>

        {/* ---- Header ---- */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <Lightbulb size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Ideas &amp; Initiatives
              </h1>
            </div>
            <button
              onClick={() => { setForm({ ...EMPTY_FORM, status: mainTab === 'initiatives' ? 'Active' : 'Exploring' }); setShowAdd(true) }}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm"
              style={{ background: 'var(--gold)' }}>
              <Plus size={15} /> New Idea
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-stone-200">
            {([{ id: 'initiatives', label: 'Active Initiatives' }, { id: 'ideas', label: 'Idea Stage' }] as { id: MainTab; label: string }[]).map(t => (
              <button key={t.id}
                onClick={() => { setMainTab(t.id); setFilterStatus(t.id === 'initiatives' ? 'Active' : 'All'); setSelected(null) }}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  mainTab === t.id
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Filter pills (initiatives only) ---- */}
        {mainTab === 'initiatives' && (
          <div className="px-8 pt-4 flex items-center gap-1.5 flex-wrap">
            {INITIATIVE_FILTERS.map(s => {
              const sc = STATUS_COLORS[s as IdeaStatus] ?? { bg: '#f5f0ea', color: '#888' }
              const isOn = filterStatus === s
              return (
                <button key={s} onClick={() => { setFilterStatus(s); setSelected(null) }}
                  className="text-xs px-3 py-1 rounded-full border transition-colors"
                  style={{
                    fontWeight: isOn ? 700 : 400,
                    background: isOn ? sc.bg : '#fff',
                    color: isOn ? sc.color : '#999',
                    borderColor: isOn ? sc.color + '66' : '#e0d8cc',
                  }}>
                  {s}
                </button>
              )
            })}
          </div>
        )}

        {/* ---- Add form ---- */}
        {showAdd && (
          <div className="mx-8 mt-4">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-stone-700">New Idea / Initiative</h3>
                <button onClick={() => setShowAdd(false)} className="text-stone-300 hover:text-stone-500"><X size={16} /></button>
              </div>
              <form onSubmit={addIdea} className="space-y-3">
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Title *</label>
                  <input required className={inputCls} placeholder="Name of idea or initiative"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Status</label>
                    <select className={inputCls} value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as IdeaStatus }))}>
                      {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Submitted By</label>
                    <input className={inputCls} placeholder="Name"
                      value={form.submitted_by} onChange={e => setForm(f => ({ ...f, submitted_by: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Budget Estimate</label>
                    <input type="number" className={inputCls} placeholder="0"
                      value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Notes — why it matters, context</label>
                  <textarea className={inputCls + ' resize-none'} rows={2}
                    placeholder="Why this matters, background context…"
                    value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Blockers</label>
                    <textarea className={inputCls + ' resize-none'} rows={2}
                      value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Gaps</label>
                    <textarea className={inputCls + ' resize-none'} rows={2}
                      value={form.gaps} onChange={e => setForm(f => ({ ...f, gaps: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving || !form.title}
                    className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                    style={{ background: 'var(--gold)' }}>
                    {saving ? 'Saving…' : 'Add'}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ---- Two-column body ---- */}
        <div className="flex-1 flex gap-4 overflow-hidden px-8 py-5">

          {/* Left list panel */}
          <div className="w-60 flex-shrink-0 flex flex-col bg-white rounded-xl overflow-hidden"
            style={{ border: '0.5px solid #e8e0d5' }}>
            <div className="px-4 py-2.5" style={{ borderBottom: '0.5px solid #f0ece6', background: '#fdfcfb' }}>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                {filtered.length} idea{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {ideas === null ? (
                <div className="py-10 text-center text-stone-300 text-xs">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-stone-300 text-xs">No ideas yet.</div>
              ) : filtered.map(idea => {
                const sc    = STATUS_COLORS[idea.status]
                const isSel = selected?.id === idea.id
                return (
                  <button key={idea.id} onClick={() => selectIdea(idea)}
                    className="w-full text-left transition-all"
                    style={{
                      padding: '10px 14px',
                      borderBottom: '0.5px solid #f5f1eb',
                      background: isSel ? sc.bg : '#fff',
                      borderLeft: `3px solid ${isSel ? sc.color : 'transparent'}`,
                    }}>
                    <p className="text-xs font-semibold text-stone-800 leading-snug mb-1">{idea.title}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                        style={{ background: sc.bg, color: sc.color, border: `0.5px solid ${sc.color}44` }}>
                        {idea.status}
                      </span>
                      {idea.submitted_by && (
                        <span className="text-[11px] text-stone-400 truncate">{idea.submitted_by}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right detail */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            {!selected ? (
              <div className="h-full flex items-center justify-center text-stone-300 text-sm">
                Select an item to view details
              </div>
            ) : (
              <DetailPanel
                selected={selected}
                editing={editing}
                editForm={editForm}
                editSaving={editSaving}
                showUpdates={showUpdates}
                budgetItems={budgetItems}
                budgetLoading={budgetLoading}
                budgetTotal={budgetTotal}
                budgetEst={budgetEst}
                remaining={remaining}
                showBudgetForm={showBudgetForm}
                budgetForm={budgetForm}
                budgetSaving={budgetSaving}
                onClose={() => selectIdea(null)}
                onDelete={deleteIdea}
                onStartEdit={() => { setEditForm({ title: selected.title, status: selected.status, submitted_by: selected.submitted_by, notes: selected.notes, blockers: selected.blockers, gaps: selected.gaps, updates: selected.updates, budget: selected.budget != null ? String(selected.budget) : '' }); setEditing(true) }}
                onCancelEdit={() => setEditing(false)}
                onSaveEdit={saveEdit}
                onEditFormChange={setEditForm}
                onToggleUpdates={() => setShowUpdates(v => !v)}
                onToggleBudgetForm={() => setShowBudgetForm(v => !v)}
                onBudgetFormChange={setBudgetForm}
                onSubmitBudget={submitBudget}
                onDeleteBudgetItem={deleteBudgetItem}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* -- Detail panel sub-component ----------------------------- */
interface DetailPanelProps {
  selected: Idea
  editing: boolean
  editForm: EditIdeaForm
  editSaving: boolean
  showUpdates: boolean
  budgetItems: BudgetItem[]
  budgetLoading: boolean
  budgetTotal: number
  budgetEst: number | null
  remaining: number | null
  showBudgetForm: boolean
  budgetForm: { description: string; amount: string; date: string; expense_type: string }
  budgetSaving: boolean
  onClose: () => void
  onDelete: (id: number) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditFormChange: (fn: (prev: EditIdeaForm) => EditIdeaForm) => void
  onToggleUpdates: () => void
  onToggleBudgetForm: () => void
  onBudgetFormChange: (fn: (prev: { description: string; amount: string; date: string; expense_type: string }) => { description: string; amount: string; date: string; expense_type: string }) => void
  onSubmitBudget: (e: React.FormEvent) => void
  onDeleteBudgetItem: (id: number) => void
}

function DetailPanel(p: DetailPanelProps) {
  const { selected } = p
  const sc = STATUS_COLORS[selected.status]
  const inputCls = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 text-stone-700 bg-white'

  return (
    <div className="space-y-4 pb-4">
      {/* Main card */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #e8e0d5' }}>
        {/* Colored header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ background: sc.bg, borderBottom: `0.5px solid ${sc.color}33` }}>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-stone-800 text-base leading-snug mb-1.5">{selected.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-white"
                style={{ color: sc.color, border: `0.5px solid ${sc.color}66` }}>
                {selected.status}
              </span>
              {selected.submitted_by && (
                <span className="text-xs text-stone-500">by {selected.submitted_by}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {selected.status === 'Active' && p.budgetEst !== null && p.remaining !== null && (
              <p className="text-sm font-bold"
                style={{ color: p.remaining < 0 ? '#c62828' : '#2e7d32' }}>
                {fmtMoney(Math.abs(p.remaining))} {p.remaining < 0 ? 'over budget' : 'remaining'}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              <button onClick={p.onStartEdit}
                className="px-3 py-1 text-xs rounded-lg font-medium"
                style={{ background: '#fff', color: sc.color, border: `0.5px solid ${sc.color}66` }}>
                Edit
              </button>
              <button onClick={() => p.onDelete(selected.id)}
                className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={13} />
              </button>
              <button onClick={p.onClose}
                className="p-1.5 text-stone-300 hover:text-stone-500 hover:bg-white rounded-lg transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {/* Edit form */}
          {p.editing && (
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-4 space-y-3">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">Edit</p>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Title</label>
                <input className={inputCls} value={p.editForm.title ?? ''}
                  onChange={e => p.onEditFormChange(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Status</label>
                  <select className={inputCls} value={p.editForm.status ?? 'Exploring'}
                    onChange={e => p.onEditFormChange(f => ({ ...f, status: e.target.value as IdeaStatus }))}>
                    {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Submitted By</label>
                  <input className={inputCls} value={p.editForm.submitted_by ?? ''}
                    onChange={e => p.onEditFormChange(f => ({ ...f, submitted_by: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Budget Estimate</label>
                  <input type="number" className={inputCls} value={p.editForm.budget ?? ''}
                    onChange={e => p.onEditFormChange(f => ({ ...f, budget: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Notes</label>
                <textarea className={inputCls + ' resize-none'} rows={3} value={p.editForm.notes ?? ''}
                  onChange={e => p.onEditFormChange(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Blockers</label>
                  <textarea className={inputCls + ' resize-none'} rows={3} value={p.editForm.blockers ?? ''}
                    onChange={e => p.onEditFormChange(f => ({ ...f, blockers: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Gaps</label>
                  <textarea className={inputCls + ' resize-none'} rows={3} value={p.editForm.gaps ?? ''}
                    onChange={e => p.onEditFormChange(f => ({ ...f, gaps: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Updates</label>
                <textarea className={inputCls + ' resize-none'} rows={3} value={p.editForm.updates ?? ''}
                  onChange={e => p.onEditFormChange(f => ({ ...f, updates: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={p.onSaveEdit} disabled={p.editSaving}
                  className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium"
                  style={{ background: 'var(--gold)' }}>
                  {p.editSaving ? 'Saving…' : 'Save Changes'}
                </button>
                <button onClick={p.onCancelEdit}
                  className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Read view */}
          {!p.editing && (
            <div className="space-y-4">
              {selected.notes && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Notes</p>
                  <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.notes}</p>
                </div>
              )}

              {(selected.blockers || selected.gaps) && (
                <div className="grid grid-cols-2 gap-4">
                  {selected.blockers && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#b45309' }}>Blockers</p>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.blockers}</p>
                    </div>
                  )}
                  {selected.gaps && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#1565c0' }}>Gaps</p>
                      <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.gaps}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={p.onToggleUpdates}
                  className="text-xs text-stone-400 hover:text-stone-600 underline transition-colors">
                  {p.showUpdates ? 'Hide Updates' : 'View Updates'}
                </button>
              </div>

              {p.showUpdates && (
                <div className="pt-3 border-t border-stone-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">Updates</p>
                  {selected.updates
                    ? <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selected.updates}</p>
                    : <p className="text-sm text-stone-300 italic">No updates yet.</p>
                  }
                </div>
              )}

              {!selected.notes && !selected.blockers && !selected.gaps && (
                <p className="text-xs text-stone-300 italic">No details yet. Click Edit to add more.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Budget card — Active only */}
      {selected.status === 'Active' && !p.editing && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #e8e0d5' }}>
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: '0.5px solid #f0ece6', background: '#fdfcfb' }}>
            <div>
              <p className="text-sm font-bold text-stone-800">Budget</p>
              {!p.budgetLoading && (
                <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                  {p.budgetEst !== null
                    ? <><span style={{ color: p.budgetTotal > p.budgetEst ? '#c62828' : '#2e7d32', fontWeight: 600 }}>{fmtMoney(p.budgetTotal)}</span> of {fmtMoney(p.budgetEst)} spent</>
                    : p.budgetItems.length > 0 ? <>{fmtMoney(p.budgetTotal)} · {p.budgetItems.length} item{p.budgetItems.length !== 1 ? 's' : ''}</> : null
                  }
                </p>
              )}
            </div>
            <button onClick={p.onToggleBudgetForm}
              className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors border-0"
              style={{ background: p.showBudgetForm ? '#f5f0ea' : 'var(--gold)', color: p.showBudgetForm ? '#666' : '#fff' }}>
              {p.showBudgetForm ? 'Cancel' : '+ Log Expense'}
            </button>
          </div>

          {p.showBudgetForm && (
            <form onSubmit={p.onSubmitBudget} className="px-5 py-4 space-y-3"
              style={{ borderBottom: '0.5px solid #f0ece6', background: '#fefcf8' }}>
              <div>
                <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Description *</label>
                <input required className={inputCls} placeholder="What was purchased or contributed"
                  value={p.budgetForm.description}
                  onChange={e => p.onBudgetFormChange(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Amount *</label>
                  <input required type="number" step="0.01" min="0" className={inputCls} placeholder="0.00"
                    value={p.budgetForm.amount}
                    onChange={e => p.onBudgetFormChange(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Date *</label>
                  <input required type="date" className={inputCls}
                    value={p.budgetForm.date}
                    onChange={e => p.onBudgetFormChange(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Type</label>
                  <select className={inputCls} value={p.budgetForm.expense_type}
                    onChange={e => p.onBudgetFormChange(f => ({ ...f, expense_type: e.target.value }))}>
                    <option value="Purchase">Purchase</option>
                    <option value="Reimbursement">Reimbursement</option>
                    <option value="In-Kind">In-Kind</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={p.budgetSaving}
                  className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium"
                  style={{ background: 'var(--gold)' }}>
                  {p.budgetSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {p.budgetLoading ? (
            <div className="py-6 text-center text-stone-300 text-xs">Loading…</div>
          ) : p.budgetItems.length === 0 ? (
            <div className="py-6 text-center text-stone-300 text-xs italic">No expenses logged.</div>
          ) : (
            <div>
              {p.budgetItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: '0.5px solid #f5f1eb' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-700 font-medium">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.date && <p className="text-xs text-stone-400">{fmtDate(item.date)}</p>}
                      {item.type === 'In-Kind' && (
                        <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">In-Kind</span>
                      )}
                      {item.needs_reimbursement && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Reimbursement</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-stone-700">{fmtMoney(item.amount)}</span>
                    <button onClick={() => p.onDeleteBudgetItem(item.id)}
                      className="text-stone-200 hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
