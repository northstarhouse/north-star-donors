'use client'
import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Plus, X, Check, Circle, Pencil, ChevronDown, Paperclip, FileText, MessageSquare, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* ── Task types ──────────────────────────────────────────── */
type TaskLabel = 'Proof Reading' | 'Graphic Design' | 'Grant Writing' | 'Blog Post' | 'Brainstorming' | 'Research' | 'Other'
type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  title: string
  label: TaskLabel | null
  status: TaskStatus
  due_date: string | null
  notes: string | null
  attachment_url: string | null
  created_at: string
}

const LABELS: TaskLabel[] = ['Proof Reading', 'Graphic Design', 'Grant Writing', 'Blog Post', 'Brainstorming', 'Research', 'Other']

const LABEL_COLORS: Record<TaskLabel, string> = {
  'Proof Reading':  'bg-purple-100 text-purple-700 border-purple-200',
  'Graphic Design': 'bg-pink-100 text-pink-700 border-pink-200',
  'Grant Writing':  'bg-blue-100 text-blue-700 border-blue-200',
  'Blog Post':      'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Brainstorming':  'bg-amber-100 text-amber-700 border-amber-200',
  'Research':       'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Other':          'bg-stone-100 text-stone-500 border-stone-200',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

/* ── Coordination types ──────────────────────────────────── */
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

const COORD_STATUS_STYLES: Record<CoordStatus, string> = {
  open:        'bg-blue-100 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
  resolved:    'bg-emerald-100 text-emerald-700 border-emerald-200',
}

const COORD_STATUS_LABELS: Record<CoordStatus, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved',
}

const FEASIBILITY_STYLES: Record<string, string> = {
  'Do-able':          'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Not feasible':     'bg-red-100 text-red-600 border-red-200',
  'Needs discussion': 'bg-amber-100 text-amber-700 border-amber-200',
  'In progress':      'bg-blue-100 text-blue-700 border-blue-200',
}

/* ── Shared styles ───────────────────────────────────────── */
const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }

/* ── Component ───────────────────────────────────────────── */
export default function Dashboard() {
  const [activeView, setActiveView] = useState<'tasks' | 'coordination'>('tasks')

  /* Task state */
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newLabel, setNewLabel] = useState<TaskLabel | ''>('')
  const [newDue, setNewDue] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [filterLabel, setFilterLabel] = useState<TaskLabel | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const pendingUploadTaskId = useRef<string | null>(null)

  /* Coordination state */
  const [coordItems, setCoordItems] = useState<CoordItem[] | null>(null)
  const [selectedCoord, setSelectedCoord] = useState<CoordItem | null>(null)
  const [coordComments, setCoordComments] = useState<CoordComment[]>([])
  const [coordLoading, setCoordLoading] = useState(false)
  const [showAddCoord, setShowAddCoord] = useState(false)
  const [coordForm, setCoordForm] = useState({ area: '', need: '', suggested_actions: '' })
  const [coordSaving, setCoordSaving] = useState(false)
  const [editingCoord, setEditingCoord] = useState(false)
  const [editCoordForm, setEditCoordForm] = useState<Partial<CoordItem>>({})
  const [editCoordSaving, setEditCoordSaving] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentFeasibility, setCommentFeasibility] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)

  /* ── Load tasks ──────────────────────────────────────────── */
  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  /* ── Load coordination ───────────────────────────────────── */
  useEffect(() => {
    if (activeView === 'coordination' && coordItems === null) loadCoordItems()
  }, [activeView])

  async function loadCoordItems() {
    setCoordLoading(true)
    const { data } = await supabase.from('coordination_items').select('*').order('created_at', { ascending: false })
    setCoordItems(data ?? [])
    setCoordLoading(false)
  }

  useEffect(() => {
    if (!selectedCoord) { setCoordComments([]); return }
    supabase.from('coordination_comments').select('*').eq('item_id', selectedCoord.id).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setCoordComments(data as CoordComment[]) })
  }, [selectedCoord])

  /* ── Task actions ────────────────────────────────────────── */
  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({ title: newTitle.trim(), label: newLabel || null, due_date: newDue || null, notes: newNotes.trim() || null, status: 'todo' })
    setNewTitle(''); setNewLabel(''); setNewDue(''); setNewNotes('')
    setShowAdd(false); setSaving(false)
    await loadTasks()
  }

  async function cycleStatus(task: Task) {
    const next = STATUS_CYCLE[task.status]
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return
    await supabase.from('tasks').update({ title: editTitle.trim(), updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle.trim() } : t))
    setEditingId(null)
  }

  async function saveNotes(id: string) {
    const notes = notesDraft[id] ?? ''
    await supabase.from('tasks').update({ notes: notes || null, updated_at: new Date().toISOString() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, notes: notes || null } : t))
  }

  function toggleExpand(task: Task) {
    if (expandedId === task.id) { setExpandedId(null) }
    else { setExpandedId(task.id); setNotesDraft(prev => ({ ...prev, [task.id]: task.notes ?? '' })) }
  }

  function triggerAttachmentUpload(taskId: string) {
    pendingUploadTaskId.current = taskId
    attachmentInputRef.current?.click()
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const taskId = pendingUploadTaskId.current
    if (!file || !taskId) return
    setUploadingTaskId(taskId)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${taskId}/${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('task-attachments').upload(path, file, { contentType: file.type })
    if (error) { alert('Upload failed: ' + error.message); setUploadingTaskId(null); return }
    const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(path)
    const url = urlData.publicUrl
    await supabase.from('tasks').update({ attachment_url: url }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, attachment_url: url } : t))
    setUploadingTaskId(null)
    e.target.value = ''
  }

  /* ── Coordination actions ────────────────────────────────── */
  async function addCoordItem(e: React.FormEvent) {
    e.preventDefault()
    if (!coordForm.area || !coordForm.need) return
    setCoordSaving(true)
    const { data } = await supabase.from('coordination_items').insert({
      area: coordForm.area, need: coordForm.need, suggested_actions: coordForm.suggested_actions || null, status: 'open',
    }).select().single()
    if (data) {
      setCoordItems(prev => [data as CoordItem, ...(prev ?? [])])
      setSelectedCoord(data as CoordItem)
    }
    setCoordForm({ area: '', need: '', suggested_actions: '' })
    setShowAddCoord(false)
    setCoordSaving(false)
  }

  async function saveCoordEdit() {
    if (!selectedCoord) return
    setEditCoordSaving(true)
    const { data } = await supabase.from('coordination_items').update(editCoordForm).eq('id', selectedCoord.id).select().single()
    if (data) {
      const updated = { ...selectedCoord, ...editCoordForm } as CoordItem
      setSelectedCoord(updated)
      setCoordItems(prev => prev?.map(c => c.id === selectedCoord.id ? updated : c) ?? null)
    }
    setEditingCoord(false)
    setEditCoordSaving(false)
  }

  async function updateCoordStatus(item: CoordItem, status: CoordStatus) {
    await supabase.from('coordination_items').update({ status }).eq('id', item.id)
    const updated = { ...item, status }
    setCoordItems(prev => prev?.map(c => c.id === item.id ? updated : c) ?? null)
    setSelectedCoord(prev => prev?.id === item.id ? updated : prev)
  }

  async function deleteCoordItem(id: string) {
    await supabase.from('coordination_items').delete().eq('id', id)
    setCoordItems(prev => prev?.filter(c => c.id !== id) ?? null)
    if (selectedCoord?.id === id) setSelectedCoord(null)
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCoord || !commentBody.trim()) return
    setCommentSaving(true)
    const payload = { item_id: selectedCoord.id, body: commentBody.trim(), author: commentAuthor.trim() || null, feasibility: commentFeasibility || null }
    const { data } = await supabase.from('coordination_comments').insert(payload).select().single()
    if (data) setCoordComments(prev => [...prev, data as CoordComment])
    setCommentBody(''); setCommentAuthor(''); setCommentFeasibility('')
    setCommentSaving(false)
  }

  async function deleteComment(id: string) {
    await supabase.from('coordination_comments').delete().eq('id', id)
    setCoordComments(prev => prev.filter(c => c.id !== id))
  }

  /* ── Derived (tasks) ─────────────────────────────────────── */
  const filtered = tasks.filter(t => {
    if (filterLabel !== 'all' && t.label !== filterLabel) return false
    if (filterStatus !== 'all' && t.status !== filterStatus) return false
    return true
  })
  const todo = filtered.filter(t => t.status === 'todo')
  const inProgress = filtered.filter(t => t.status === 'in_progress')
  const done = filtered.filter(t => t.status === 'done')

  /* ── Sub-renders ─────────────────────────────────────────── */
  function StatusIcon({ status }: { status: TaskStatus }) {
    if (status === 'done') return <Check size={15} className="text-emerald-500" />
    if (status === 'in_progress') return <Circle size={15} className="text-amber-500 fill-amber-100" />
    return <Circle size={15} className="text-stone-300" />
  }

  function TaskRow({ task }: { task: Task }) {
    const expanded = expandedId === task.id
    return (
      <div className={`border-b border-stone-100 last:border-0 ${task.status === 'done' ? 'opacity-50' : ''}`}>
        <div className="flex items-start gap-3 px-4 py-3 group">
          <button onClick={(e) => { e.stopPropagation(); cycleStatus(task) }} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform" title="Cycle status">
            <StatusIcon status={task.status} />
          </button>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(task)}>
            {editingId === task.id ? (
              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                <input autoFocus className="flex-1 border border-stone-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null) }} />
                <button onClick={() => saveEdit(task.id)} className="px-2 py-0.5 text-white text-xs rounded-lg" style={goldBtn}>Save</button>
                <button onClick={() => setEditingId(null)} className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-lg">✕</button>
              </div>
            ) : (
              <p className={`text-sm text-stone-800 ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {task.label && <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-medium ${LABEL_COLORS[task.label as TaskLabel]}`}>{task.label}</span>}
              {task.due_date && <span className="text-[10px] text-stone-400">Due {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
              {task.status === 'in_progress' && <span className="text-[10px] text-amber-600 font-medium">In Progress</span>}
              {task.notes && !expanded && <span className="text-[10px] text-stone-400 italic">has notes</span>}
              {task.attachment_url && !expanded && <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Paperclip size={9} />attachment</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); setEditingId(task.id); setEditTitle(task.title) }} className="p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded"><Pencil size={11} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded"><X size={11} /></button>
            </div>
            <button onClick={() => toggleExpand(task)} className="p-1 text-stone-300 hover:text-stone-500 rounded">
              <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {expanded && (
          <div className="px-4 pb-3 pt-0 pl-11 space-y-2">
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 bg-stone-50"
              rows={4} placeholder="Add notes..."
              value={notesDraft[task.id] ?? ''}
              onChange={e => setNotesDraft(prev => ({ ...prev, [task.id]: e.target.value }))}
              onBlur={() => saveNotes(task.id)}
            />
            <p className="text-[10px] text-stone-300">Auto-saves when you click away</p>
            {task.status === 'done' && (
              <div className="pt-1">
                {task.attachment_url ? (
                  <TaskAttachment url={task.attachment_url} onReplace={() => triggerAttachmentUpload(task.id)} uploading={uploadingTaskId === task.id} />
                ) : (
                  <button onClick={() => triggerAttachmentUpload(task.id)} disabled={uploadingTaskId === task.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-stone-300 text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-colors disabled:opacity-40">
                    <Paperclip size={12} />{uploadingTaskId === task.id ? 'Uploading…' : 'Attach a file'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <LayoutDashboard size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Development Dashboard
              </h1>
            </div>
            {activeView === 'tasks' ? (
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
                <Plus size={15} /> Add Task
              </button>
            ) : (
              <button onClick={() => { setCoordForm({ area: '', need: '', suggested_actions: '' }); setShowAddCoord(true) }}
                className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
                <Plus size={15} /> Add Item
              </button>
            )}
          </div>

          {/* View tabs */}
          <div className="flex gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-sm w-fit">
            {([['tasks', 'Tasks'], ['coordination', 'Cross-Coordination']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setActiveView(v)}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === v ? 'text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                style={activeView === v ? goldBtn : {}}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tasks view ────────────────────────────────────── */}
        {activeView === 'tasks' && (
          <div className="px-8 pb-8 flex-1 flex flex-col gap-5">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600"
                value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}>
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <select className="border border-stone-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-600"
                value={filterLabel} onChange={e => setFilterLabel(e.target.value as TaskLabel | 'all')}>
                <option value="all">All Labels</option>
                {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              {(filterLabel !== 'all' || filterStatus !== 'all') && (
                <button onClick={() => { setFilterLabel('all'); setFilterStatus('all') }} className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1.5">Clear filters</button>
              )}
            </div>

            {/* Add task form */}
            {showAdd && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
                <h3 className="text-sm font-semibold text-stone-700">New Task</h3>
                <input autoFocus className={inputCls} placeholder="Task title..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) addTask() }} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Label</label>
                    <select className={inputCls} value={newLabel} onChange={e => setNewLabel(e.target.value as TaskLabel | '')}>
                      <option value="">No label</option>
                      {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Due Date (optional)</label>
                    <input type="date" className={inputCls} value={newDue} onChange={e => setNewDue(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Notes (optional)</label>
                  <textarea className={inputCls + ' resize-none'} rows={3} placeholder="Any notes..." value={newNotes} onChange={e => setNewNotes(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={addTask} disabled={!newTitle.trim() || saving} className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                    {saving ? 'Adding...' : 'Add Task'}
                  </button>
                  <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                </div>
              </div>
            )}

            {/* Task columns */}
            {loading ? (
              <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
            ) : (
              <div className="grid grid-cols-3 gap-5">
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">To Do</h3>
                    <span className="text-xs text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{todo.length}</span>
                  </div>
                  <div>{todo.length === 0 ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p> : todo.map(t => <TaskRow key={t.id} task={t} />)}</div>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
                    <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">In Progress</h3>
                    <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">{inProgress.length}</span>
                  </div>
                  <div>{inProgress.length === 0 ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p> : inProgress.map(t => <TaskRow key={t.id} task={t} />)}</div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                    <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Done</h3>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{done.length}</span>
                  </div>
                  <div>{done.length === 0 ? <p className="px-4 py-6 text-xs text-stone-300 text-center italic">No tasks</p> : done.map(t => <TaskRow key={t.id} task={t} />)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Cross-Coordination view ───────────────────────── */}
        {activeView === 'coordination' && (
          <div className="px-8 pb-8 flex-1 flex flex-col gap-5">
            {/* Add item form */}
            {showAddCoord && (
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">New Coordination Item</h3>
                <form onSubmit={addCoordItem} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-400 mb-1 block">Area *</label>
                      <input required className={inputCls} placeholder="e.g. Marketing, Finance, Events…"
                        value={coordForm.area} onChange={e => setCoordForm(f => ({ ...f, area: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-stone-400 mb-1 block">Need *</label>
                      <input required className={inputCls} placeholder="What is needed?"
                        value={coordForm.need} onChange={e => setCoordForm(f => ({ ...f, need: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 mb-1 block">Suggested Actions</label>
                    <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What actions could address this need?"
                      value={coordForm.suggested_actions} onChange={e => setCoordForm(f => ({ ...f, suggested_actions: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={coordSaving || !coordForm.area || !coordForm.need}
                      className="px-4 py-1.5 text-white text-sm rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>
                      {coordSaving ? 'Saving…' : 'Add Item'}
                    </button>
                    <button type="button" onClick={() => setShowAddCoord(false)} className="px-4 py-1.5 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Two-col layout */}
            {coordLoading ? (
              <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading…</div>
            ) : (
              <div className="grid gap-5 grid-cols-[320px_1fr]">
                {/* Item list */}
                <div className="space-y-2">
                  {coordItems?.length === 0 && (
                    <div className="text-center py-16 text-stone-400 text-sm">No items yet. Add one above.</div>
                  )}
                  {coordItems?.map(item => {
                    const isSelected = selectedCoord?.id === item.id
                    return (
                      <button key={item.id} onClick={() => { setSelectedCoord(prev => prev?.id === item.id ? null : item); setEditingCoord(false) }}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors ${isSelected ? 'border-amber-300 bg-amber-50/80' : 'border-stone-200 bg-white hover:bg-stone-50'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{item.area}</p>
                            <p className="text-sm font-medium text-stone-800 leading-snug">{item.need}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${COORD_STATUS_STYLES[item.status]}`}>
                            {COORD_STATUS_LABELS[item.status]}
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
                {selectedCoord ? (
                  <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 self-start sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                    {/* Panel header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold)' }}>{selectedCoord.area}</p>
                        <h2 className="font-bold text-stone-800 text-base leading-snug">{selectedCoord.need}</h2>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-300"
                          value={selectedCoord.status}
                          onChange={e => updateCoordStatus(selectedCoord, e.target.value as CoordStatus)}>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button onClick={() => { setEditCoordForm({ ...selectedCoord }); setEditingCoord(true) }}
                          className="px-2.5 py-1 text-xs text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 flex items-center gap-1">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => { if (confirm('Delete this item and all its comments?')) deleteCoordItem(selectedCoord.id) }}
                          className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                        <button onClick={() => { setSelectedCoord(null); setEditingCoord(false) }}
                          className="p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Edit form */}
                    {editingCoord && (
                      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-5 space-y-3">
                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Edit Item</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Area</label>
                            <input className={inputCls} value={editCoordForm.area ?? ''} onChange={e => setEditCoordForm(f => ({ ...f, area: e.target.value }))} />
                          </div>
                          <div>
                            <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Need</label>
                            <input className={inputCls} value={editCoordForm.need ?? ''} onChange={e => setEditCoordForm(f => ({ ...f, need: e.target.value }))} />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-400 uppercase tracking-wide mb-1 block">Suggested Actions</label>
                          <textarea className={inputCls + ' resize-none'} rows={3} value={editCoordForm.suggested_actions ?? ''} onChange={e => setEditCoordForm(f => ({ ...f, suggested_actions: e.target.value }))} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveCoordEdit} disabled={editCoordSaving} className="flex-1 py-2 text-white text-sm rounded-lg disabled:opacity-50 font-medium" style={goldBtn}>
                            {editCoordSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingCoord(false)} className="px-4 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg hover:bg-stone-200">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Suggested actions */}
                    {selectedCoord.suggested_actions && !editingCoord && (
                      <div className="border-t border-stone-100 pt-4 mt-4">
                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Suggested Actions</p>
                        <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selectedCoord.suggested_actions}</p>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="border-t border-stone-100 pt-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={13} className="text-stone-400" />
                        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Comments</p>
                        {coordComments.length > 0 && <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-full">{coordComments.length}</span>}
                      </div>

                      {/* Existing comments */}
                      {coordComments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {coordComments.map(c => (
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

                      {/* Add comment form */}
                      <form onSubmit={addComment} className="space-y-2">
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
        )}
      </div>

      <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
    </div>
  )
}

/* ── TaskAttachment sub-component ────────────────────────── */
function TaskAttachment({ url, onReplace, uploading }: { url: string; onReplace: () => void; uploading: boolean }) {
  const filename = decodeURIComponent(url.split('/').pop() ?? 'attachment').replace(/^\d+-/, '')
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(filename)
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border border-stone-200 bg-stone-50 group">
      {isImage ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
          <img src={url} alt={filename} className="h-10 w-10 object-cover rounded border border-stone-200 flex-shrink-0" />
          <span className="text-xs text-stone-600 truncate hover:underline">{filename}</span>
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
          <div className="h-8 w-8 rounded border border-stone-200 bg-white flex items-center justify-center flex-shrink-0">
            <FileText size={14} className="text-stone-400" />
          </div>
          <span className="text-xs text-stone-600 truncate hover:underline">{filename}</span>
        </a>
      )}
      <button onClick={onReplace} disabled={uploading}
        className="opacity-0 group-hover:opacity-100 text-[10px] text-stone-400 hover:text-amber-600 px-2 py-1 rounded border border-stone-200 hover:border-amber-300 transition-all flex-shrink-0 disabled:opacity-40">
        {uploading ? 'Uploading…' : 'Replace'}
      </button>
    </div>
  )
}
