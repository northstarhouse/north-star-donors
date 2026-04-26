'use client'
import { useState, useEffect, useRef } from 'react'
import { LayoutDashboard, Plus, X, Check, Circle, Pencil, ChevronRight, Paperclip, FileText, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type TaskLabel = 'Proof Reading' | 'Graphic Design' | 'Grant Writing' | 'Blog Post' | 'Brainstorming' | 'Research' | 'Technical' | 'Editing' | 'Other'
type TaskStatus = 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  title: string
  label: TaskLabel | null
  status: TaskStatus
  due_date: string | null
  notes: string | null
  attachment_url: string | null
  assigned_to: string | null
  created_at: string
}

const LABELS: TaskLabel[] = ['Proof Reading', 'Graphic Design', 'Grant Writing', 'Blog Post', 'Brainstorming', 'Research', 'Technical', 'Editing', 'Other']

const LABEL_COLORS: Record<TaskLabel, string> = {
  'Proof Reading':  'bg-purple-100 text-purple-700 border-purple-200',
  'Graphic Design': 'bg-pink-100 text-pink-700 border-pink-200',
  'Grant Writing':  'bg-blue-100 text-blue-700 border-blue-200',
  'Blog Post':      'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Brainstorming':  'bg-amber-100 text-amber-700 border-amber-200',
  'Research':       'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Technical':      'bg-slate-100 text-slate-700 border-slate-200',
  'Editing':        'bg-orange-100 text-orange-700 border-orange-200',
  'Other':          'bg-stone-100 text-stone-500 border-stone-200',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

function nextFirstThursday(): Date {
  const now = new Date()
  // Try this month and next two months to find the next first Thursday at 10am
  for (let m = 0; m < 3; m++) {
    const year  = now.getFullYear() + Math.floor((now.getMonth() + m) / 12)
    const month = (now.getMonth() + m) % 12
    // Find first Thursday of this month
    const d = new Date(year, month, 1)
    while (d.getDay() !== 4) d.setDate(d.getDate() + 1)
    d.setHours(10, 0, 0, 0)
    if (d > now) return d
  }
  return new Date() // fallback
}

function fmtMeeting(d: Date): string {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const then = new Date(d); then.setHours(0, 0, 0, 0)
  const days = Math.round((then.getTime() - now.getTime()) / 86400000)
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (days === 0) return `Today at 10am`
  if (days === 1) return `Tomorrow at 10am`
  if (days <= 6) return `${d.toLocaleDateString('en-US', { weekday: 'short' })}, ${dateStr} at 10am`
  return `${dateStr} at 10am · ${days} days away`
}

const inputCls = "w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700"
const goldBtn = { background: 'var(--gold)' }

/* â”€â”€ TaskRow (outside Dashboard to prevent remount on re-render) â”€â”€ */
interface TaskRowProps {
  task: Task
  expandedId: string | null
  editingId: string | null
  editTitle: string
  notesDraft: Record<string, string>
  uploadingTaskId: string | null
  onCycleStatus: (task: Task) => void
  onDelete: (id: string) => void
  onToggleExpand: (task: Task) => void
  onStartEdit: (id: string, title: string) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onEditTitleChange: (v: string) => void
  onNotesDraftChange: (id: string, v: string) => void
  onSaveNotes: (id: string) => void
  onTriggerUpload: (id: string) => void
  onClaim: (id: string, name: string) => void
  onUnclaim: (id: string) => void
}

function StatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') return <Check size={15} className="text-emerald-500" />
  if (status === 'in_progress') return <Circle size={15} className="text-amber-500 fill-amber-100" />
  return <Circle size={15} className="text-stone-300" />
}

function TaskRow({
  task, expandedId, editingId, editTitle, notesDraft, uploadingTaskId,
  onCycleStatus, onDelete, onToggleExpand, onStartEdit, onCancelEdit,
  onSaveEdit, onEditTitleChange, onNotesDraftChange, onSaveNotes, onTriggerUpload,
  onClaim, onUnclaim,
}: TaskRowProps) {
  const expanded = expandedId === task.id
  const editing  = editingId  === task.id
  const [claiming, setClaiming] = useState(false)
  const [claimInput, setClaimInput] = useState('')

  return (
    <div className={`border-b border-stone-100 last:border-0 ${task.status === 'done' ? 'opacity-55' : ''}`}>
      <div className="flex items-start gap-3 px-4 py-3 group">
        <button onClick={e => { e.stopPropagation(); onCycleStatus(task) }} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform">
          <StatusIcon status={task.status} />
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onToggleExpand(task)}>
          {editing ? (
            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
              <input autoFocus className="flex-1 border border-stone-200 rounded-lg px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={editTitle} onChange={e => onEditTitleChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') onSaveEdit(task.id); if (e.key === 'Escape') onCancelEdit() }} />
              <button onClick={() => onSaveEdit(task.id)} className="px-2 py-0.5 text-white text-xs rounded-lg" style={goldBtn}>Save</button>
              <button onClick={onCancelEdit} className="px-2 py-0.5 bg-stone-100 text-stone-500 text-xs rounded-lg">âœ•</button>
            </div>
          ) : (
            <p className={`text-sm text-stone-800 ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</p>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {task.label && <span className={`inline-flex px-1.5 py-0.5 rounded border text-[10px] font-medium ${LABEL_COLORS[task.label as TaskLabel]}`}>{task.label}</span>}
            {task.assigned_to && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium bg-stone-100 text-stone-500 border-stone-200">
                <User size={9} />{task.assigned_to}
              </span>
            )}
            {task.due_date && <span className="text-[10px] text-stone-400">Due {new Date(task.due_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
            {task.status === 'in_progress' && <span className="text-[10px] text-amber-600 font-medium">In Progress</span>}
            {task.notes && !expanded && <span className="text-[10px] text-stone-400 italic">has notes</span>}
            {task.attachment_url && !expanded && <span className="text-[10px] text-stone-400 flex items-center gap-0.5"><Paperclip size={9} />attachment</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Claim button / assignee badge */}
          {task.assigned_to ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-[11px] font-medium text-stone-500">
              <User size={10} />{task.assigned_to}
            </span>
          ) : claiming ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input autoFocus className="border border-stone-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 w-28"
                placeholder="Your nameâ€¦" value={claimInput} onChange={e => setClaimInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && claimInput.trim()) { onClaim(task.id, claimInput.trim()); setClaiming(false); setClaimInput('') }
                  if (e.key === 'Escape') { setClaiming(false); setClaimInput('') }
                }} />
              <button onClick={() => { if (claimInput.trim()) { onClaim(task.id, claimInput.trim()); setClaiming(false); setClaimInput('') } }}
                disabled={!claimInput.trim()}
                className="px-2 py-1 text-white text-xs rounded-lg disabled:opacity-40 font-medium" style={goldBtn}>âœ“</button>
              <button onClick={() => { setClaiming(false); setClaimInput('') }} className="p-1 text-stone-300 hover:text-stone-500"><X size={12} /></button>
            </div>
          ) : (
            <button onClick={e => { e.stopPropagation(); setClaiming(true) }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-stone-300 text-[11px] text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-colors">
              <User size={10} /> Take on
            </button>
          )}

          {/* Edit / delete */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onStartEdit(task.id, task.title) }} className="p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded"><Pencil size={11} /></button>
            <button onClick={e => { e.stopPropagation(); onDelete(task.id) }} className="p-1 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded"><X size={11} /></button>
          </div>

          {/* Expand */}
          <button onClick={() => onToggleExpand(task)} className="p-1 text-stone-400 hover:text-stone-600 rounded">
            <ChevronRight size={17} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 pl-11 space-y-3">
          {/* Unassign (only shown when assigned) */}
          {task.assigned_to && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-medium text-stone-600">
                <User size={11} className="text-stone-400" />{task.assigned_to}
              </span>
              <button onClick={() => onUnclaim(task.id)} className="text-[10px] text-stone-300 hover:text-red-400 transition-colors">
                Unassign
              </button>
            </div>
          )}

          <textarea
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 text-stone-700 bg-stone-50"
            rows={4}
            placeholder="Add notes..."
            value={notesDraft[task.id] ?? task.notes ?? ''}
            onChange={e => onNotesDraftChange(task.id, e.target.value)}
            onBlur={() => onSaveNotes(task.id)}
          />
          <p className="text-[10px] text-stone-300 -mt-1">Auto-saves when you click away</p>

          {task.status === 'done' && (
            task.attachment_url ? (
              <TaskAttachment url={task.attachment_url} onReplace={() => onTriggerUpload(task.id)} uploading={uploadingTaskId === task.id} />
            ) : (
              <button onClick={() => onTriggerUpload(task.id)} disabled={uploadingTaskId === task.id}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-stone-300 text-stone-400 hover:border-amber-300 hover:text-amber-600 transition-colors disabled:opacity-40">
                <Paperclip size={12} />{uploadingTaskId === task.id ? 'Uploadingâ€¦' : 'Attach a file'}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

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
        {uploading ? 'Uploadingâ€¦' : 'Replace'}
      </button>
    </div>
  )
}

/* â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [taskTab, setTaskTab] = useState<TaskStatus>('todo')

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
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
  const pendingUploadTaskId = useRef<string | null>(null)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data ?? [])
    setLoading(false)
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({
      title: newTitle.trim(), label: newLabel || null,
      due_date: newDue || null, notes: newNotes.trim() || null, status: 'todo',
    })
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
    else {
      setExpandedId(task.id)
      setNotesDraft(prev => ({ ...prev, [task.id]: task.notes ?? '' }))
    }
  }

  async function claimTask(id: string, name: string) {
    await supabase.from('tasks').update({ assigned_to: name, status: 'in_progress' }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, assigned_to: name, status: 'in_progress' } : t))
  }

  async function unclaimTask(id: string) {
    await supabase.from('tasks').update({ assigned_to: null }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, assigned_to: null } : t))
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

  const filtered = filterLabel === 'all' ? tasks : tasks.filter(t => t.label === filterLabel)
  const byTab = filtered.filter(t => t.status === taskTab)

  const todoCnt      = filtered.filter(t => t.status === 'todo').length
  const inProgCnt    = filtered.filter(t => t.status === 'in_progress').length
  const doneCnt      = filtered.filter(t => t.status === 'done').length

  const rowProps = {
    expandedId, editingId, editTitle, notesDraft, uploadingTaskId,
    onCycleStatus: cycleStatus,
    onDelete: deleteTask,
    onToggleExpand: toggleExpand,
    onStartEdit: (id: string, title: string) => { setEditingId(id); setEditTitle(title) },
    onCancelEdit: () => setEditingId(null),
    onSaveEdit: saveEdit,
    onEditTitleChange: setEditTitle,
    onNotesDraftChange: (id: string, v: string) => setNotesDraft(prev => ({ ...prev, [id]: v })),
    onSaveNotes: saveNotes,
    onTriggerUpload: triggerAttachmentUpload,
    onClaim: claimTask,
    onUnclaim: unclaimTask,
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                <LayoutDashboard size={16} className="text-stone-400" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
                Development Dashboard
              </h1>
            </div>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-xl font-medium shadow-sm" style={goldBtn}>
              <Plus size={15} /> Add Task
            </button>
          </div>

          {/* Date line */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5c3d1e' }}>
              Today — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-stone-300 text-xs">—</span>
            <span className="text-xs text-stone-400">Here&rsquo;s your development pipeline at a glance.</span>
            <span className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              Next Meeting: {fmtMeeting(nextFirstThursday())}
            </span>
          </div>

          {/* Add task form */}
          {showAdd && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3 mb-5">
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
                  <label className="text-xs text-stone-400 mb-1 block">Due Date</label>
                  <input type="date" className={inputCls} value={newDue} onChange={e => setNewDue(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-400 mb-1 block">Notes</label>
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

          {/* Task box */}
          {loading ? (
            <div className="flex items-center justify-center py-24 text-stone-400 text-sm">Loading...</div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex items-center border-b border-stone-100 px-2 pt-2">
                {([
                  ['todo',        'To Do',       todoCnt],
                  ['in_progress', 'In Progress', inProgCnt],
                  ['done',        'Done',        doneCnt],
                ] as const).map(([status, label, count]) => (
                  <button key={status} onClick={() => setTaskTab(status)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-colors mr-1 ${
                      taskTab === status
                        ? 'border-amber-400 text-stone-800'
                        : 'border-transparent text-stone-400 hover:text-stone-600'
                    }`}>
                    {label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      taskTab === status ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'
                    }`}>{count}</span>
                  </button>
                ))}

                {/* Label filter */}
                <div className="ml-auto mb-1.5 pr-1">
                  <select className="border border-stone-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none text-stone-500"
                    value={filterLabel} onChange={e => setFilterLabel(e.target.value as TaskLabel | 'all')}>
                    <option value="all">All Labels</option>
                    {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Task list */}
              <div>
                {byTab.length === 0
                  ? <p className="px-4 py-10 text-xs text-stone-300 text-center italic">No {taskTab === 'in_progress' ? 'in-progress' : taskTab} tasks.</p>
                  : byTab.map(t => <TaskRow key={t.id} task={t} {...rowProps} />)
                }
              </div>
            </div>
          )}
        </div>
      </div>

      <input ref={attachmentInputRef} type="file" className="hidden" onChange={handleAttachmentUpload} />
    </div>
  )
}

